package com.rescuekaro.backend.configuration;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(List<String> allowedOrigins) {

    public CorsProperties {
        allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
        for (String origin : allowedOrigins) {
            try {
                java.net.URI uri = java.net.URI.create(origin);
                if (!("http".equals(uri.getScheme()) || "https".equals(uri.getScheme())) || uri.getHost() == null
                        || uri.getRawUserInfo() != null || uri.getRawQuery() != null || uri.getRawFragment() != null
                        || (uri.getRawPath() != null && !uri.getRawPath().isEmpty()))
                    throw new IllegalArgumentException();
            } catch (IllegalArgumentException invalid) {
                throw new IllegalStateException("CORS_ALLOWED_ORIGINS must contain only exact HTTP(S) origins.");
            }
        }
    }
}
