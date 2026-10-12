package com.rescuekaro.backend.auth;

import com.rescuekaro.backend.auth.EmailOtpService.Purpose;
import com.rescuekaro.backend.configuration.AppProperties;
import com.rescuekaro.backend.exception.ApiException;
import com.rescuekaro.backend.security.TokenService;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final JdbcClient db;
    private final PasswordEncoder passwords;
    private final TokenService tokens;
    private final AppProperties properties;
    private final EmailOtpService otp;
    private final LoginRateLimiter loginRateLimiter;

    public AuthService(JdbcClient db, PasswordEncoder passwords, TokenService tokens,
            AppProperties properties, EmailOtpService otp, LoginRateLimiter loginRateLimiter) {
        this.db = db; this.passwords = passwords; this.tokens = tokens; this.properties = properties;
        this.otp = otp; this.loginRateLimiter = loginRateLimiter;
    }

    @Transactional
    public EmailOtpService.Sent register(String fullName, String email, String rawPhone, String password, String ip) {
        return register(fullName, email, rawPhone, password, ip, null);
    }

    @Transactional
    public EmailOtpService.Sent register(String fullName, String email, String rawPhone, String password, String ip, UUID previousRequestId) {
        String address = normalizeEmail(email);
        String phone = normalizePhone(rawPhone);
        String name = clean(fullName);
        if (name.length() < 2 || name.length() > 100) throw validation("Enter your full name.");
        validatePassword(password);
        if (previousRequestId != null) {
            UUID oldPending = db.sql("SELECT p.id FROM pending_registrations p JOIN email_otp_challenges c ON c.pending_registration_id=p.id "
                    + "WHERE c.id=:challenge AND c.purpose='REGISTRATION' AND c.consumed_at IS NULL "
                    + "AND p.phone_e164=:phone AND p.email<>:email AND p.expires_at>now() FOR UPDATE OF p")
                    .param("challenge", previousRequestId).param("phone", phone).param("email", address)
                    .query(UUID.class).optional().orElse(null);
            if (oldPending != null) {
                db.sql("DELETE FROM email_otp_challenges WHERE pending_registration_id=:id").param("id", oldPending).update();
                db.sql("DELETE FROM pending_registrations WHERE id=:id").param("id", oldPending).update();
            }
        }
        db.sql("DELETE FROM email_otp_challenges WHERE pending_registration_id IN "
                + "(SELECT id FROM pending_registrations WHERE expires_at<now() AND consumed_at IS NULL)").update();
        db.sql("DELETE FROM pending_registrations WHERE expires_at<now() AND consumed_at IS NULL").update();
        if (db.sql("SELECT count(*) FROM users WHERE phone_e164=:phone")
                .param("phone", phone).query(Long.class).single() > 0)
            throw new ApiException(HttpStatus.CONFLICT, "PHONE_ALREADY_REGISTERED", "This phone number is already registered. Please sign in.");
        if (db.sql("SELECT count(*) FROM users WHERE email=:email")
                .param("email", address).query(Long.class).single() > 0)
            throw new ApiException(HttpStatus.CONFLICT, "ACCOUNT_ALREADY_EXISTS", "This email is already registered. Please sign in.");
        if (db.sql("SELECT count(*) FROM pending_registrations WHERE phone_e164=:phone AND email<>:email")
                .param("phone", phone).param("email", address).query(Long.class).single() > 0)
            throw new ApiException(HttpStatus.CONFLICT, "PHONE_PENDING_VERIFICATION", "This phone number has a pending email verification. Continue with the original email address.");

        UUID pending = db.sql("SELECT id FROM pending_registrations WHERE email=:email FOR UPDATE")
                .param("email", address).query(UUID.class).optional().orElse(null);
        if (pending == null) {
            pending = UUID.randomUUID();
            db.sql("INSERT INTO pending_registrations(id,full_name,email,phone_e164,password_hash,expires_at) "
                    + "VALUES(:id,:name,:email,:phone,:hash,:expires)")
                    .param("id", pending).param("name", name).param("email", address).param("phone", phone)
                    .param("hash", passwords.encode(password)).param("expires", Timestamp.from(Instant.now().plus(24, ChronoUnit.HOURS))).update();
        } else {
            db.sql("UPDATE pending_registrations SET full_name=:name,phone_e164=:phone,password_hash=:hash,"
                    + "expires_at=:expires,consumed_at=NULL WHERE id=:id")
                    .param("id", pending).param("name", name).param("phone", phone)
                    .param("hash", passwords.encode(password)).param("expires", Timestamp.from(Instant.now().plus(24, ChronoUnit.HOURS))).update();
        }
        return otp.send(address, Purpose.REGISTRATION, null, pending, ip);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public Session verifyRegistration(UUID challengeId, String code) {
        return verifyRegistration(challengeId, code, "local-test");
    }

    @Transactional(noRollbackFor = ApiException.class)
    public Session verifyRegistration(UUID challengeId, String code, String ip) {
        var challenge = otp.consume(challengeId, Purpose.REGISTRATION, code, ip);
        Pending row = db.sql("SELECT full_name,email,phone_e164,password_hash,expires_at,consumed_at FROM pending_registrations "
                + "WHERE id=:id FOR UPDATE")
                .param("id", challenge.pendingRegistrationId())
                .query((rs, n) -> new Pending(rs.getString("full_name"), rs.getString("email"), rs.getString("phone_e164"),
                        rs.getString("password_hash"), rs.getTimestamp("expires_at").toInstant(), rs.getTimestamp("consumed_at")))
                .optional().orElseThrow(AuthService::invalidOtp);
        if (row.consumedAt() != null || !row.expiresAt().isAfter(Instant.now()) || !row.email().equals(challenge.email())) throw invalidOtp();
        UUID userId = UUID.randomUUID();
        db.sql("INSERT INTO users(id,full_name,email,phone_e164,password_hash,phone_verified,email_verified) "
                + "VALUES(:id,:name,:email,:phone,:hash,false,true)")
                .param("id", userId).param("name", row.fullName()).param("email", row.email())
                .param("phone", row.phone()).param("hash", row.passwordHash()).update();
        db.sql("UPDATE pending_registrations SET consumed_at=now() WHERE id=:id")
                .param("id", challenge.pendingRegistrationId()).update();
        return createSession(new UserView(userId, row.fullName(), row.email(), row.phone(), false, "CUSTOMER"));
    }

    public EmailOtpService.Sent login(String email, String password, String ip) {
        String address = normalizeEmail(email);
        loginRateLimiter.record(address, ip);
        UserPassword row = db.sql("SELECT id,full_name,email,phone_e164,phone_verified,role,password_hash FROM users "
                + "WHERE email=:email AND enabled=true")
                .param("email", address).query((rs, n) -> new UserPassword(
                        new UserView((UUID) rs.getObject("id"), rs.getString("full_name"), rs.getString("email"),
                                rs.getString("phone_e164"), rs.getBoolean("phone_verified"), rs.getString("role")),
                        rs.getString("password_hash"))).optional().orElse(null);
        if (row == null || !passwords.matches(password, row.passwordHash())) throw invalidCredentials();
        return otp.send(address, Purpose.LOGIN, row.user().id(), null, ip);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public Session verifyLogin(UUID challengeId, String code) {
        return verifyLogin(challengeId, code, "local-test");
    }

    @Transactional(noRollbackFor = ApiException.class)
    public Session verifyLogin(UUID challengeId, String code, String ip) {
        var challenge = otp.consume(challengeId, Purpose.LOGIN, code, ip);
        UserView user = db.sql("SELECT id,full_name,email,phone_e164,phone_verified,role FROM users "
                + "WHERE id=:id AND email=:email AND enabled=true")
                .param("id", challenge.userId()).param("email", challenge.email())
                .query((rs, n) -> user(rs)).optional().orElseThrow(AuthService::invalidOtp);
        db.sql("UPDATE users SET email_verified=true WHERE id=:id").param("id", user.id()).update();
        return createSession(user);
    }

    public EmailOtpService.Sent requestPasswordReset(String email, String ip) {
        String address = normalizeEmail(email);
        UUID userId = db.sql("SELECT id FROM users WHERE email=:email AND enabled=true")
                .param("email", address).query(UUID.class).optional().orElse(null);
        return otp.send(address, Purpose.PASSWORD_RESET, userId, null, ip);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public void resetPassword(UUID challengeId, String code, String newPassword) {
        resetPassword(challengeId, code, newPassword, "local-test");
    }

    @Transactional(noRollbackFor = ApiException.class)
    public void resetPassword(UUID challengeId, String code, String newPassword, String ip) {
        validatePassword(newPassword);
        var challenge = otp.consume(challengeId, Purpose.PASSWORD_RESET, code, ip);
        int changed = db.sql("UPDATE users SET password_hash=:hash WHERE id=:id AND email=:email AND enabled=true")
                .param("hash", passwords.encode(newPassword)).param("id", challenge.userId())
                .param("email", challenge.email()).update();
        if (changed != 1) throw invalidOtp();
        db.sql("UPDATE auth_sessions SET revoked_at=now() WHERE user_id=:id AND revoked_at IS NULL")
                .param("id", challenge.userId()).update();
    }

    public EmailOtpService.Sent resend(UUID challengeId, String ip) { return otp.resend(challengeId, ip); }

    @Transactional
    public Session refresh(String refreshToken) {
        SessionRow old = db.sql("SELECT s.id AS session_id,u.id,u.full_name,u.email,u.phone_e164,u.phone_verified,u.role FROM auth_sessions s "
                + "JOIN users u ON u.id=s.user_id WHERE s.refresh_token_hash=:hash AND s.revoked_at IS NULL "
                + "AND s.expires_at>now() AND u.enabled=true AND u.email_verified=true FOR UPDATE")
                .param("hash", TokenService.sha256(refreshToken))
                .query((rs, n) -> new SessionRow((UUID) rs.getObject("session_id"), user(rs)))
                .optional().orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED", "The session is no longer valid."));
        Session next = createSession(old.user());
        db.sql("UPDATE auth_sessions SET revoked_at=now(),replaced_by=:replacement WHERE id=:id")
                .param("replacement", next.sessionId()).param("id", old.id()).update();
        return next;
    }

    public void logout(String refreshToken) {
        if (refreshToken != null) db.sql("UPDATE auth_sessions SET revoked_at=COALESCE(revoked_at,now()) WHERE refresh_token_hash=:hash")
                .param("hash", TokenService.sha256(refreshToken)).update();
    }

    public UserView current(UUID id) {
        return db.sql("SELECT id,full_name,email,phone_e164,phone_verified,role FROM users "
                + "WHERE id=:id AND enabled=true AND email_verified=true")
                .param("id", id).query((rs, n) -> user(rs)).optional()
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED", "Account not available."));
    }

    private Session createSession(UserView user) {
        String refresh = tokens.randomToken(48); UUID sessionId = UUID.randomUUID();
        db.sql("INSERT INTO auth_sessions(id,user_id,refresh_token_hash,expires_at) VALUES(:id,:user,:hash,:expires)")
                .param("id", sessionId).param("user", user.id()).param("hash", TokenService.sha256(refresh))
                .param("expires", Timestamp.from(Instant.now().plus(properties.security().refreshTokenDays(), ChronoUnit.DAYS))).update();
        return new Session(sessionId, user, tokens.accessToken(user.id(), user.email(), user.role()), refresh);
    }

    private static UserView user(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new UserView((UUID) rs.getObject("id"), rs.getString("full_name"), rs.getString("email"),
                rs.getString("phone_e164"), rs.getBoolean("phone_verified"), rs.getString("role"));
    }
    private static String normalizeEmail(String email) {
        String value = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        if (value.length() > 320 || !value.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) throw validation("Enter a valid email address.");
        return value;
    }
    private static void validatePassword(String password) {
        if (password == null || password.length() != 6 || password.isBlank())
            throw validation("Password must be exactly 6 characters.");
    }
    private static ApiException validation(String message) { return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", message); }
    private static ApiException invalidCredentials() { return new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid email or password."); }
    private static ApiException invalidOtp() { return new ApiException(HttpStatus.BAD_REQUEST, "OTP_INVALID", "Invalid or expired verification code."); }
    private static String clean(String text) { return text == null ? "" : text.replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "").trim(); }
    public static String normalizePhone(String phone) {
        String p = phone == null ? "" : phone.replaceAll("[\\s()-]", "");
        if (p.matches("[6-9]\\d{9}")) p = "+91" + p;
        if (!p.matches("\\+91[6-9]\\d{9}")) throw validation("Enter a valid Indian mobile number.");
        return p;
    }

    public record UserView(UUID id, String fullName, String email, String phone, boolean phoneVerified, String role) {}
    public record Session(UUID sessionId, UserView user, String accessToken, String refreshToken) {}
    private record UserPassword(UserView user, String passwordHash) {}
    private record SessionRow(UUID id, UserView user) {}
    private record Pending(String fullName, String email, String phone, String passwordHash, Instant expiresAt, Timestamp consumedAt) {}
}
