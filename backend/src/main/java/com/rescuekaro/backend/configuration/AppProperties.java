package com.rescuekaro.backend.configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(String publicAppUrl, Security security, Otp otp) {
    public record Security(String jwtSecret, long accessTokenMinutes, long refreshTokenDays) {}
    public record Otp(long expirySeconds, long resendSeconds, int maxAttempts) {}
}
