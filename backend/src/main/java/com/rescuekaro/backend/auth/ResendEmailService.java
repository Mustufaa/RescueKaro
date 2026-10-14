package com.rescuekaro.backend.auth;

import com.rescuekaro.backend.exception.ApiException;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
public class ResendEmailService {
    private static final URI EMAILS_ENDPOINT = URI.create("https://api.resend.com/emails");
    private final HttpClient http;
    private final URI endpoint;
    private final ObjectMapper json;
    private final Environment environment;
    private final String provider;
    private final String apiKey;
    private final String from;

    @Autowired
    public ResendEmailService(ObjectMapper json, Environment environment,
            @Value("${EMAIL_PROVIDER:}") String provider,
            @Value("${RESEND_API_KEY:}") String apiKey,
            @Value("${EMAIL_FROM:}") String from) {
        this(json, environment, provider, apiKey, from,
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build(), EMAILS_ENDPOINT);
    }

    ResendEmailService(ObjectMapper json, Environment environment, String provider, String apiKey, String from,
            HttpClient http, URI endpoint) {
        this.json = json;
        this.environment = environment;
        this.provider = provider;
        this.apiKey = apiKey;
        this.from = from;
        this.http = http;
        this.endpoint = endpoint;
    }

    @PostConstruct
    public void validateConfiguration() {
        boolean production = java.util.Arrays.asList(environment.getActiveProfiles()).contains("prod")
                || "production".equalsIgnoreCase(environment.getProperty("APP_ENV", ""));
        if (production && (!"resend".equalsIgnoreCase(provider) || apiKey.isBlank() || from.isBlank()))
            throw new IllegalStateException("Production email requires EMAIL_PROVIDER=resend, RESEND_API_KEY and EMAIL_FROM.");
    }

    public void sendRegistrationOtp(String to, String name, String code, UUID challengeId) {
        send(to, name, code, challengeId, EmailOtpTemplate.Action.SIGNUP);
    }
    public void sendPasswordResetOtp(String to, String name, String code, UUID challengeId) {
        send(to, name, code, challengeId, EmailOtpTemplate.Action.PASSWORD_RESET);
    }

    private void send(String to, String name, String code, UUID challengeId, EmailOtpTemplate.Action action) {
        if (!"resend".equalsIgnoreCase(provider) || apiKey.isBlank() || from.isBlank())
            throw unavailable();
        try {
            String payload = json.writeValueAsString(Map.of(
                    "from", from, "to", new String[] {to}, "subject", EmailOtpTemplate.subject(action),
                    "html", EmailOtpTemplate.html(action, name, code),
                    "text", EmailOtpTemplate.plain(action, name, code)));
            HttpRequest request = HttpRequest.newBuilder(endpoint)
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .header("Idempotency-Key", "otp-" + challengeId)
                    .POST(HttpRequest.BodyPublishers.ofString(payload)).build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 429)
                throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "EMAIL_PROVIDER_RATE_LIMITED", "Email service is busy. Please try again later.");
            if (response.statusCode() < 200 || response.statusCode() >= 300)
                throw unavailable();
            // Acceptance by Resend is not proof of inbox delivery.
            if (json.readTree(response.body()).path("id").asText().isBlank()) throw unavailable();
        } catch (IOException failure) {
            throw unavailable();
        } catch (tools.jackson.core.JacksonException failure) {
            throw unavailable();
        } catch (InterruptedException failure) {
            Thread.currentThread().interrupt();
            throw unavailable();
        }
    }

    private static ApiException unavailable() {
        return new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "EMAIL_DELIVERY_FAILED",
                "Email service could not accept the request. Please try again later.");
    }
}
