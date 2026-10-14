package com.rescuekaro.backend.auth;

import com.rescuekaro.backend.configuration.AppProperties;
import com.rescuekaro.backend.exception.ApiException;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmailOtpService {
    public enum Purpose { REGISTRATION, LOGIN, PASSWORD_RESET }
    public record Sent(UUID requestId, long expiresIn, long resendAfter, String maskedEmail) {}
    public record Challenge(UUID id, UUID userId, UUID pendingRegistrationId, String email, Purpose purpose) {}

    private final JdbcClient db;
    private final ResendEmailService emailService;
    private final AppProperties properties;
    private final Environment environment;
    private final String secret;
    private final SecureRandom random = new SecureRandom();

    public EmailOtpService(JdbcClient db, ResendEmailService emailService, AppProperties properties, Environment environment,
            @Value("${OTP_HASH_SECRET:}") String secret) {
        this.db = db;
        this.emailService = emailService;
        this.properties = properties;
        this.environment = environment;
        this.secret = secret;
    }

    @PostConstruct
    public void validate() {
        boolean prod = java.util.Arrays.asList(environment.getActiveProfiles()).contains("prod")
                || "production".equalsIgnoreCase(environment.getProperty("APP_ENV", ""));
        if (properties.otp().expirySeconds() != 600
                || properties.otp().resendSeconds() < 60 || properties.otp().maxAttempts() < 1
                || properties.otp().maxAttempts() > 5)
            throw new IllegalStateException("OTP expiration, cooldown, and attempt limits are outside the safe range.");
        if (secret.length() < 32) throw new IllegalStateException("OTP_HASH_SECRET must contain at least 32 characters.");
        if (prod && environment.getProperty("JWT_SECRET", "").length() < 32)
            throw new IllegalStateException("Production requires a strong JWT_SECRET.");
    }

    @Transactional
    public Sent send(String email, Purpose purpose, UUID userId, UUID pendingId, String ip) {
        String address = email.trim().toLowerCase(Locale.ROOT);
        String ipHash = hmac("ip|" + ip);
        db.sql("SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))")
                .param("key", "otp-email:" + address).query((rs, n) -> 0).single();
        db.sql("SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))")
                .param("key", "otp-ip:" + ipHash).query((rs, n) -> 0).single();
        Instant now = Instant.now();
        Long accountCount = db.sql("SELECT count(*) FROM email_otp_challenges WHERE email=:email AND created_at>:since")
                .param("email", address).param("since", Timestamp.from(now.minusSeconds(3600))).query(Long.class).single();
        Long ipCount = db.sql("SELECT count(*) FROM email_otp_challenges WHERE ip_hash=:ip AND created_at>:since")
                .param("ip", ipHash).param("since", Timestamp.from(now.minusSeconds(3600))).query(Long.class).single();
        if (accountCount >= 5 || ipCount >= 20) throw limited();
        Instant next = db.sql("SELECT next_send_at FROM email_otp_challenges WHERE email=:email ORDER BY created_at DESC LIMIT 1")
                .param("email", address).query(Instant.class).optional().orElse(null);
        if (next != null && next.isAfter(now)) throw limited();

        UUID id = UUID.randomUUID();
        String code = String.format("%06d", random.nextInt(1_000_000));
        db.sql("UPDATE email_otp_challenges SET consumed_at=now() WHERE email=:email AND purpose=:purpose AND consumed_at IS NULL")
                .param("email", address).param("purpose", purpose.name()).update();
        db.sql("INSERT INTO email_otp_challenges(id,user_id,pending_registration_id,email,purpose,otp_hash,expires_at,next_send_at,ip_hash) "
                + "VALUES(:id,:user,:pending,:email,:purpose,:hash,:expires,:next,:ip)")
                .param("id", id).param("user", userId).param("pending", pendingId).param("email", address)
                .param("purpose", purpose.name()).param("hash", hmac(id + "|" + code))
                .param("expires", Timestamp.from(now.plusSeconds(properties.otp().expirySeconds())))
                .param("next", Timestamp.from(now.plusSeconds(properties.otp().resendSeconds()))).param("ip", ipHash).update();
        String name = userId != null
                ? db.sql("SELECT full_name FROM users WHERE id=:id").param("id", userId).query(String.class).optional().orElse("")
                : pendingId != null
                ? db.sql("SELECT full_name FROM pending_registrations WHERE id=:id").param("id", pendingId).query(String.class).optional().orElse("")
                : "";
        if (purpose != Purpose.PASSWORD_RESET || userId != null) {
            switch (purpose) {
                case REGISTRATION -> emailService.sendRegistrationOtp(address, name, code, id);
                case LOGIN -> throw new IllegalStateException("Login OTP is disabled.");
                case PASSWORD_RESET -> emailService.sendPasswordResetOtp(address, name, code, id);
            }
        }
        return new Sent(id, properties.otp().expirySeconds(), properties.otp().resendSeconds(), mask(address));
    }

    @Transactional(noRollbackFor = ApiException.class)
    public Challenge consume(UUID id, Purpose expected, String code, String ip) {
        String ipHash = hmac("verify-ip|" + ip);
        db.sql("SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))")
                .param("key", "otp-verify-ip:" + ipHash).query((rs, n) -> 0).single();
        long recent = db.sql("SELECT count(*) FROM email_otp_verification_attempts WHERE ip_hash=:ip AND created_at>now()-interval '1 hour'")
                .param("ip", ipHash).query(Long.class).single();
        if (recent >= 100) throw limited();
        db.sql("INSERT INTO email_otp_verification_attempts(ip_hash) VALUES(:ip)").param("ip", ipHash).update();
        OtpRow row = db.sql("SELECT user_id,pending_registration_id,email,purpose,otp_hash,attempts,expires_at,consumed_at "
                + "FROM email_otp_challenges WHERE id=:id FOR UPDATE")
                .param("id", id).query((rs, n) -> new OtpRow((UUID) rs.getObject("user_id"),
                        (UUID) rs.getObject("pending_registration_id"), rs.getString("email"),
                        Purpose.valueOf(rs.getString("purpose")), rs.getString("otp_hash"), rs.getInt("attempts"),
                        rs.getTimestamp("expires_at").toInstant(), rs.getTimestamp("consumed_at")))
                .optional().orElseThrow(EmailOtpService::invalid);
        if (row.purpose() != expected || row.consumedAt() != null || !row.expiresAt().isAfter(Instant.now())) throw invalid();
        if (row.attempts() >= properties.otp().maxAttempts()) throw limited();
        if (!code.matches("\\d{6}") || !MessageDigest.isEqual(row.hash().getBytes(StandardCharsets.US_ASCII),
                hmac(id + "|" + code).getBytes(StandardCharsets.US_ASCII))) {
            db.sql("UPDATE email_otp_challenges SET attempts=attempts+1 WHERE id=:id").param("id", id).update();
            throw invalid();
        }
        db.sql("UPDATE email_otp_challenges SET consumed_at=now() WHERE id=:id").param("id", id).update();
        return new Challenge(id, row.userId(), row.pendingId(), row.email(), row.purpose());
    }

    @Transactional
    public Sent resend(UUID id, String ip) {
        OtpRow row = db.sql("SELECT user_id,pending_registration_id,email,purpose,otp_hash,attempts,expires_at,consumed_at "
                + "FROM email_otp_challenges WHERE id=:id")
                .param("id", id).query((rs, n) -> new OtpRow((UUID) rs.getObject("user_id"),
                        (UUID) rs.getObject("pending_registration_id"), rs.getString("email"),
                        Purpose.valueOf(rs.getString("purpose")), rs.getString("otp_hash"), rs.getInt("attempts"),
                        rs.getTimestamp("expires_at").toInstant(), rs.getTimestamp("consumed_at")))
                .optional().orElseThrow(EmailOtpService::invalid);
        if (row.consumedAt() != null) throw invalid();
        if (row.purpose() == Purpose.LOGIN) throw invalid();
        if (row.pendingId() != null && !db.sql("SELECT expires_at FROM pending_registrations WHERE id=:id")
                .param("id", row.pendingId()).query(Instant.class).optional().orElse(Instant.EPOCH).isAfter(Instant.now()))
            throw invalid();
        return send(row.email(), row.purpose(), row.userId(), row.pendingId(), ip);
    }

    public String hashIdentifier(String value) { return hmac("identifier|" + value); }
    private String hmac(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception failure) { throw new IllegalStateException("OTP hashing is unavailable."); }
    }
    private static String mask(String email) {
        int at = email.indexOf('@');
        return email.substring(0, 1) + "***" + email.substring(at);
    }
    private static ApiException invalid() { return new ApiException(HttpStatus.BAD_REQUEST, "OTP_INVALID", "Invalid or expired verification code."); }
    private static ApiException limited() { return new ApiException(HttpStatus.TOO_MANY_REQUESTS, "OTP_RATE_LIMITED", "Please wait before requesting another code."); }
    private record OtpRow(UUID userId, UUID pendingId, String email, Purpose purpose, String hash,
            int attempts, Instant expiresAt, Timestamp consumedAt) {}
}
