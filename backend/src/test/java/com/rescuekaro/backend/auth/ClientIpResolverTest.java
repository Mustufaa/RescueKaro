package com.rescuekaro.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;

class ClientIpResolverTest {
    private final ClientIpResolver resolver = new ClientIpResolver("test-client-ip-secret-at-least-32-characters", mock(Environment.class));

    @Test void acceptsOnlyCurrentSignedClientIp() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        String time = Long.toString(Instant.now().getEpochSecond());
        when(request.getRemoteAddr()).thenReturn("10.0.0.1");
        when(request.getHeader("X-RK-Client-IP")).thenReturn("203.0.113.7");
        when(request.getHeader("X-RK-Client-IP-Time")).thenReturn(time);
        when(request.getHeader("X-RK-Client-IP-Signature")).thenReturn(resolver.sign("203.0.113.7|" + time));
        assertThat(resolver.resolve(request)).isEqualTo("203.0.113.7");
        when(request.getHeader("X-RK-Client-IP")).thenReturn("203.0.113.8");
        assertThat(resolver.resolve(request)).isEqualTo("10.0.0.1");
    }
}
