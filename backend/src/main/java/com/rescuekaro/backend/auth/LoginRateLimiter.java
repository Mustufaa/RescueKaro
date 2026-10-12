package com.rescuekaro.backend.auth;

import com.rescuekaro.backend.exception.ApiException;
import java.sql.Timestamp;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LoginRateLimiter {
    private final JdbcClient db;
    private final EmailOtpService otp;

    public LoginRateLimiter(JdbcClient db, EmailOtpService otp) { this.db = db; this.otp = otp; }

    @Transactional
    public void record(String email, String ip) {
        String emailHash = otp.hashIdentifier("email|" + email);
        String ipHash = otp.hashIdentifier("ip|" + ip);
        db.sql("SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))")
                .param("key", "login-email:" + emailHash).query((rs, n) -> 0).single();
        db.sql("SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))")
                .param("key", "login-ip:" + ipHash).query((rs, n) -> 0).single();
        Timestamp since = Timestamp.from(Instant.now().minusSeconds(3600));
        long account = db.sql("SELECT count(*) FROM auth_login_attempts WHERE email_hash=:hash AND created_at>:since")
                .param("hash", emailHash).param("since", since).query(Long.class).single();
        long source = db.sql("SELECT count(*) FROM auth_login_attempts WHERE ip_hash=:hash AND created_at>:since")
                .param("hash", ipHash).param("since", since).query(Long.class).single();
        if (account >= 10 || source >= 30)
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "LOGIN_RATE_LIMITED", "Please try again later.");
        db.sql("INSERT INTO auth_login_attempts(email_hash,ip_hash) VALUES(:email,:ip)")
                .param("email", emailHash).param("ip", ipHash).update();
    }
}
