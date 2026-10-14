package com.rescuekaro.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import com.rescuekaro.backend.exception.ApiException;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;
import tools.jackson.databind.ObjectMapper;

class ResendEmailServiceTest {
    @Test void sendsHtmlAndTextWithChallengeIdempotencyKey() throws Exception {
        AtomicReference<String> body = new AtomicReference<>();
        AtomicReference<String> idempotency = new AtomicReference<>();
        HttpServer server = server(200, body, idempotency);
        try {
            var service = service(server);
            UUID challengeId = UUID.randomUUID();
            service.sendRegistrationOtp("owner@example.com", "<Owner>", "123456", challengeId);
            assertThat(idempotency.get()).isEqualTo("otp-" + challengeId);
            assertThat(body.get()).contains("owner@example.com", "&lt;Owner&gt;", "123456", "Expires in 10 minutes.", "\"text\"");
            assertThat(body.get()).doesNotContain("test-secret-key");
        } finally { server.stop(0); }
    }

    @Test void rateLimitAndProviderErrorsAreSafe() throws Exception {
        for (int status : new int[] {429, 500}) {
            HttpServer server = server(status, new AtomicReference<>(), new AtomicReference<>());
            try {
                assertThatThrownBy(() -> service(server).sendPasswordResetOtp("owner@example.com", "Owner", "123456", UUID.randomUUID()))
                        .isInstanceOfSatisfying(ApiException.class, error -> {
                            assertThat(error.status().value()).isEqualTo(503);
                            assertThat(error.getMessage()).doesNotContain("test-secret-key");
                            assertThat(error.code()).isEqualTo(status == 429 ? "EMAIL_PROVIDER_RATE_LIMITED" : "EMAIL_DELIVERY_FAILED");
                        });
            } finally { server.stop(0); }
        }
    }

    private static ResendEmailService service(HttpServer server) {
        URI endpoint = URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/emails");
        return new ResendEmailService(new ObjectMapper(), mock(Environment.class), "resend", "test-secret-key",
                "RescueKaro <noreply@example.com>", HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(1)).build(), endpoint);
    }

    private static HttpServer server(int status, AtomicReference<String> body, AtomicReference<String> idempotency) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/emails", exchange -> {
            body.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            idempotency.set(exchange.getRequestHeaders().getFirst("Idempotency-Key"));
            byte[] response = (status == 200 ? "{\"id\":\"accepted-for-delivery\"}" : "{\"error\":\"rejected\"}")
                    .getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(status, response.length);
            try (var stream = exchange.getResponseBody()) { stream.write(response); }
        });
        server.start();
        return server;
    }
}
