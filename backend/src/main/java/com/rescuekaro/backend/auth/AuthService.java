package com.rescuekaro.backend.auth;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.sql.Timestamp;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import com.rescuekaro.backend.configuration.AppProperties;
import com.rescuekaro.backend.exception.ApiException;
import com.rescuekaro.backend.security.TokenService;
import org.springframework.context.EnvironmentAware;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.annotation.PostConstruct;

@Service
public class AuthService implements EnvironmentAware {
    private final JdbcClient db;
    private final PasswordEncoder passwords;
    private final TokenService tokens;
    private final AppProperties properties;
    private Environment environment;

    public AuthService(JdbcClient db, PasswordEncoder passwords, TokenService tokens, AppProperties properties) {
        this.db = db; this.passwords = passwords; this.tokens = tokens; this.properties = properties;
    }

    @PostConstruct public void validateProductionOtp() {
        if(environment!=null && (java.util.Arrays.asList(environment.getActiveProfiles()).contains("prod") || "production".equalsIgnoreCase(environment.getProperty("APP_ENV",""))) &&
            java.util.Set.of("mock","development").contains(properties.otp().provider().toLowerCase(Locale.ROOT)))
            throw new IllegalStateException("Mock OTP must not be enabled in production.");
    }

    public OtpSent sendOtp(String rawPhone, String purpose) {
        String phone = normalizePhone(rawPhone);
        if (!java.util.Set.of("registration", "login").contains(purpose))
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", "Unsupported OTP purpose.");
        boolean registered = db.sql("SELECT count(*) FROM users WHERE phone_e164=:phone AND enabled=true").param("phone",phone).query(Long.class).single()>0;
        if ("login".equals(purpose) && !registered) throw new ApiException(HttpStatus.NOT_FOUND,"ACCOUNT_NOT_FOUND","No account is registered with this phone number.");
        if ("registration".equals(purpose) && registered) throw new ApiException(HttpStatus.CONFLICT,"ACCOUNT_ALREADY_EXISTS","This phone number is already registered.");
        Instant now = Instant.now();
        Optional<Instant> next = db.sql("SELECT next_send_at FROM otp_challenges WHERE phone_e164=:phone ORDER BY created_at DESC LIMIT 1")
                .param("phone", phone).query(Instant.class).optional();
        if (next.isPresent() && next.get().isAfter(now))
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "OTP_RATE_LIMITED", "Please wait before requesting another code.");

        ensureDevelopmentProviderIsSafe();
        UUID id = UUID.randomUUID();
        db.sql("INSERT INTO otp_challenges(id,phone_e164,purpose,code_hash,max_attempts,expires_at,next_send_at) VALUES(:id,:phone,:purpose,:hash,:attempt_limit,:expires_at,:next_send_at)")
                .param("id", id).param("phone", phone).param("purpose", purpose)
                .param("hash", passwords.encode(properties.otp().developmentCode()))
                .param("attempt_limit", properties.otp().maxAttempts())
                .param("expires_at", Timestamp.from(now.plusSeconds(properties.otp().expirySeconds())))
                .param("next_send_at", Timestamp.from(now.plusSeconds(properties.otp().resendSeconds()))).update();
        // The development provider intentionally logs no OTP. Production adapters must deliver out of process.
        return new OtpSent(id, properties.otp().expirySeconds(), properties.otp().resendSeconds());
    }

    @Transactional
    public OtpVerified verifyOtp(UUID requestId, String code) {
        OtpRow row = db.sql("SELECT id,phone_e164,purpose,code_hash,attempts,max_attempts,expires_at,used_at FROM otp_challenges WHERE id=:id FOR UPDATE")
                .param("id", requestId).query((rs, n) -> new OtpRow((UUID) rs.getObject("id"), rs.getString("code_hash"),
                        rs.getInt("attempts"), rs.getInt("max_attempts"), rs.getTimestamp("expires_at").toInstant(),
                        rs.getTimestamp("used_at") == null ? null : rs.getTimestamp("used_at").toInstant(),rs.getString("phone_e164"),rs.getString("purpose")))
                .optional().orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "OTP_INVALID", "Invalid verification request."));
        if (!"registration".equals(row.purpose())) throw new ApiException(HttpStatus.BAD_REQUEST,"OTP_INVALID","This code is for a different purpose.");
        if (row.usedAt() != null || row.expiresAt().isBefore(Instant.now()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "OTP_EXPIRED", "The verification code has expired.");
        if (row.attempts() >= row.maxAttempts())
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "OTP_RATE_LIMITED", "Too many verification attempts.");
        if (!passwords.matches(code, row.codeHash())) {
            db.sql("UPDATE otp_challenges SET attempts=attempts+1 WHERE id=:id").param("id", requestId).update();
            return new OtpVerified(false, null);
        }
        String verificationToken = tokens.randomToken(32);
        db.sql("UPDATE otp_challenges SET used_at=now(),verification_token_hash=:hash,verification_expires_at=:expires WHERE id=:id")
                .param("hash", TokenService.sha256(verificationToken)).param("expires", Timestamp.from(Instant.now().plus(10, ChronoUnit.MINUTES)))
                .param("id", requestId).update();
        return new OtpVerified(true, "registration".equals(row.purpose()) ? verificationToken : null);
    }

    @Transactional(noRollbackFor=ApiException.class)
    public Session loginOtp(UUID requestId,String code) {
        OtpRow row=db.sql("SELECT id,phone_e164,purpose,code_hash,attempts,max_attempts,expires_at,used_at FROM otp_challenges WHERE id=:id FOR UPDATE")
            .param("id",requestId).query((rs,n)->new OtpRow((UUID)rs.getObject("id"),rs.getString("code_hash"),rs.getInt("attempts"),rs.getInt("max_attempts"),rs.getTimestamp("expires_at").toInstant(),rs.getTimestamp("used_at")==null?null:rs.getTimestamp("used_at").toInstant(),rs.getString("phone_e164"),rs.getString("purpose")))
            .optional().orElseThrow(()->new ApiException(HttpStatus.BAD_REQUEST,"OTP_INVALID","Invalid verification request."));
        if(!"login".equals(row.purpose())) throw new ApiException(HttpStatus.BAD_REQUEST,"OTP_INVALID","This code is for a different purpose.");
        if(row.usedAt()!=null || !row.expiresAt().isAfter(Instant.now())) throw new ApiException(HttpStatus.BAD_REQUEST,"OTP_EXPIRED","The verification code has expired.");
        if(row.attempts()>=row.maxAttempts()) throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,"OTP_RATE_LIMITED","Too many verification attempts.");
        if(!passwords.matches(code,row.codeHash())) {
            db.sql("UPDATE otp_challenges SET attempts=attempts+1 WHERE id=:id").param("id",requestId).update();
            throw new ApiException(HttpStatus.BAD_REQUEST,"OTP_INVALID","Invalid verification code.");
        }
        db.sql("UPDATE otp_challenges SET used_at=now() WHERE id=:id").param("id",requestId).update();
        UserView user=db.sql("SELECT id,full_name,email,phone_e164,phone_verified,role FROM users WHERE phone_e164=:phone AND enabled=true")
            .param("phone",row.phone()).query((rs,n)->new UserView((UUID)rs.getObject("id"),rs.getString("full_name"),rs.getString("email"),rs.getString("phone_e164"),rs.getBoolean("phone_verified"),rs.getString("role")))
            .optional().orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"ACCOUNT_NOT_FOUND","No account is registered with this phone number."));
        return createSession(user);
    }

    @Transactional(noRollbackFor=ApiException.class)
    public void resetPassword(UUID requestId, String code, String newPassword) {
        OtpRow row = db.sql("SELECT id,phone_e164,purpose,code_hash,attempts,max_attempts,expires_at,used_at FROM otp_challenges WHERE id=:id FOR UPDATE")
            .param("id",requestId).query((rs,n)->new OtpRow((UUID)rs.getObject("id"),rs.getString("code_hash"),rs.getInt("attempts"),rs.getInt("max_attempts"),rs.getTimestamp("expires_at").toInstant(),rs.getTimestamp("used_at")==null?null:rs.getTimestamp("used_at").toInstant(),rs.getString("phone_e164"),rs.getString("purpose")))
            .optional().orElseThrow(()->new ApiException(HttpStatus.BAD_REQUEST,"OTP_INVALID","Invalid verification request."));
        if (!"login".equals(row.purpose())) throw new ApiException(HttpStatus.BAD_REQUEST,"OTP_INVALID","This code is for a different purpose.");
        if (row.usedAt()!=null || !row.expiresAt().isAfter(Instant.now())) throw new ApiException(HttpStatus.BAD_REQUEST,"OTP_EXPIRED","The verification code has expired.");
        if (row.attempts()>=row.maxAttempts()) throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,"OTP_RATE_LIMITED","Too many verification attempts.");
        if (!passwords.matches(code,row.codeHash())) {
            db.sql("UPDATE otp_challenges SET attempts=attempts+1 WHERE id=:id").param("id",requestId).update();
            throw new ApiException(HttpStatus.BAD_REQUEST,"OTP_INVALID","Invalid verification code.");
        }
        UUID userId = db.sql("SELECT id FROM users WHERE phone_e164=:phone AND enabled=true")
            .param("phone",row.phone()).query(UUID.class).optional()
            .orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"ACCOUNT_NOT_FOUND","No account is registered with this phone number."));
        db.sql("UPDATE users SET password_hash=:hash WHERE id=:id")
            .param("hash",passwords.encode(newPassword)).param("id",userId).update();
        db.sql("UPDATE otp_challenges SET used_at=now() WHERE id=:id").param("id",requestId).update();
        db.sql("UPDATE auth_sessions SET revoked_at=now() WHERE user_id=:id AND revoked_at IS NULL")
            .param("id",userId).update();
    }

    @Transactional
    public Session register(String fullName, String email, String rawPhone, String password, String verificationToken) {
        String phone = normalizePhone(rawPhone); String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if(clean(fullName).length()<2) throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY,"VALIDATION_ERROR","Enter your full name.");
        Integer verified = db.sql("UPDATE otp_challenges SET verification_expires_at=now() WHERE phone_e164=:phone AND purpose='registration' AND verification_token_hash=:hash AND verification_expires_at>now()")
                .param("phone", phone).param("hash", TokenService.sha256(verificationToken)).update();
        if (verified != 1) throw new ApiException(HttpStatus.BAD_REQUEST, "OTP_INVALID", "Phone verification is required.");
        if (db.sql("SELECT count(*) FROM users WHERE phone_e164=:phone").param("phone", phone).query(Long.class).single() > 0)
            throw new ApiException(HttpStatus.CONFLICT, "ACCOUNT_ALREADY_EXISTS", "This phone number is already registered.");
        if (db.sql("SELECT count(*) FROM users WHERE email=:email").param("email", normalizedEmail).query(Long.class).single() > 0)
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "This email address is already registered.");
        UUID id = UUID.randomUUID();
        db.sql("INSERT INTO users(id,full_name,email,phone_e164,password_hash,phone_verified) VALUES(:id,:name,:email,:phone,:password,true)")
                .param("id", id).param("name", clean(fullName)).param("email", normalizedEmail).param("phone", phone)
                .param("password", passwords.encode(password)).update();
        return createSession(new UserView(id, clean(fullName), normalizedEmail, phone, true, "CUSTOMER"));
    }

    public Session login(String email, String password) {
        UserPassword row = db.sql("SELECT id,full_name,email,phone_e164,phone_verified,role,password_hash FROM users WHERE email=:email AND enabled=true")
                .param("email", email.trim().toLowerCase(Locale.ROOT)).query((rs, n) -> new UserPassword(
                        new UserView((UUID)rs.getObject("id"),rs.getString("full_name"),rs.getString("email"),rs.getString("phone_e164"),rs.getBoolean("phone_verified"),rs.getString("role")),
                        rs.getString("password_hash"))).optional()
                .orElseThrow(() -> invalidCredentials());
        if (!passwords.matches(password, row.passwordHash())) throw invalidCredentials();
        return createSession(row.user());
    }

    @Transactional
    public Session refresh(String refreshToken) {
        SessionRow old = db.sql("SELECT s.id,s.user_id,u.full_name,u.email,u.phone_e164,u.phone_verified,u.role FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE s.refresh_token_hash=:hash AND s.revoked_at IS NULL AND s.expires_at>now() FOR UPDATE")
                .param("hash", TokenService.sha256(refreshToken)).query((rs,n) -> new SessionRow((UUID)rs.getObject("id"),
                        new UserView((UUID)rs.getObject("user_id"),rs.getString("full_name"),rs.getString("email"),rs.getString("phone_e164"),rs.getBoolean("phone_verified"),rs.getString("role"))))
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
        return db.sql("SELECT id,full_name,email,phone_e164,phone_verified,role FROM users WHERE id=:id AND enabled=true")
                .param("id", id).query((rs,n) -> new UserView((UUID)rs.getObject("id"),rs.getString("full_name"),rs.getString("email"),rs.getString("phone_e164"),rs.getBoolean("phone_verified"),rs.getString("role")))
                .optional().orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED,"AUTH_REQUIRED","Account not available."));
    }

    private Session createSession(UserView user) {
        String refresh = tokens.randomToken(48); UUID sessionId = UUID.randomUUID();
        db.sql("INSERT INTO auth_sessions(id,user_id,refresh_token_hash,expires_at) VALUES(:id,:user,:hash,:expires)")
                .param("id",sessionId).param("user",user.id()).param("hash",TokenService.sha256(refresh))
                .param("expires",Timestamp.from(Instant.now().plus(properties.security().refreshTokenDays(),ChronoUnit.DAYS))).update();
        return new Session(sessionId,user,tokens.accessToken(user.id(),user.email(),user.role()),refresh);
    }

    private void ensureDevelopmentProviderIsSafe() {
        String provider = properties.otp().provider();
        if (!"mock".equalsIgnoreCase(provider) && !"development".equalsIgnoreCase(provider))
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,"OTP_PROVIDER_UNAVAILABLE","The configured SMS provider is not available.");
        if (environment != null && (java.util.Arrays.asList(environment.getActiveProfiles()).contains("prod") || "production".equalsIgnoreCase(environment.getProperty("APP_ENV",""))))
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,"OTP_PROVIDER_UNAVAILABLE","Development OTP is disabled in production.");
        if (properties.otp().developmentCode() == null || properties.otp().developmentCode().isBlank())
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,"OTP_PROVIDER_UNAVAILABLE","Development OTP is not configured.");
    }

    private static ApiException invalidCredentials() { return new ApiException(HttpStatus.UNAUTHORIZED,"INVALID_CREDENTIALS","Invalid email or password."); }
    private static String clean(String text) { return text == null ? "" : text.replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "").trim(); }
    public static String normalizePhone(String phone) {
        String p = phone == null ? "" : phone.replaceAll("[\\s()-]", "");
        if (p.matches("[6-9]\\d{9}")) p = "+91" + p;
        if (!p.matches("\\+91[6-9]\\d{9}")) throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY,"VALIDATION_ERROR","Enter a valid Indian mobile number.");
        return p;
    }
    @Override public void setEnvironment(Environment environment) { this.environment = environment; }

    public record OtpSent(UUID requestId,long expiresIn,long resendAfter) {}
    public record OtpVerified(boolean verified,String verificationToken) {}
    public record UserView(UUID id,String fullName,String email,String phone,boolean phoneVerified,String role) {}
    public record Session(UUID sessionId,UserView user,String accessToken,String refreshToken) {}
    private record OtpRow(UUID id,String codeHash,int attempts,int maxAttempts,Instant expiresAt,Instant usedAt,String phone,String purpose) {}
    private record UserPassword(UserView user,String passwordHash) {}
    private record SessionRow(UUID id,UserView user) {}
}
