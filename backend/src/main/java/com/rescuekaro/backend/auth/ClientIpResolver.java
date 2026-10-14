package com.rescuekaro.backend.auth;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class ClientIpResolver {
    private final String secret;
    private final Environment environment;

    public ClientIpResolver(@Value("${API_PROXY_IP_SECRET:}") String secret, Environment environment) {
        this.secret = secret;
        this.environment = environment;
    }

    @PostConstruct
    public void validate() {
        boolean production = java.util.Arrays.asList(environment.getActiveProfiles()).contains("prod")
                || "production".equalsIgnoreCase(environment.getProperty("APP_ENV", ""));
        if (production && secret.length() < 32)
            throw new IllegalStateException("Production requires API_PROXY_IP_SECRET of at least 32 characters.");
    }

    public String resolve(HttpServletRequest request) {
        String ip = request.getHeader("X-RK-Client-IP");
        String time = request.getHeader("X-RK-Client-IP-Time");
        String signature = request.getHeader("X-RK-Client-IP-Signature");
        if (secret.length() >= 32 && ip != null && time != null && signature != null && ip.length() <= 45) {
            try {
                long sentAt = Long.parseLong(time);
                if (Math.abs(Instant.now().getEpochSecond() - sentAt) <= 60 &&
                        MessageDigest.isEqual(sign(ip + "|" + time).getBytes(StandardCharsets.US_ASCII),
                                signature.getBytes(StandardCharsets.US_ASCII))) return ip;
            } catch (NumberFormatException ignored) { /* Fall back to the transport peer. */ }
        }
        return request.getRemoteAddr();
    }

    String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception failure) { throw new IllegalStateException("Client IP verification is unavailable."); }
    }
}
