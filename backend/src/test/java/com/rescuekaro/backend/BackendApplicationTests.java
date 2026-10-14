package com.rescuekaro.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.rescuekaro.backend.auth.AuthService;
import com.rescuekaro.backend.auth.ResendEmailService;
import com.rescuekaro.backend.auth.EmailOtpTemplate;
import com.rescuekaro.backend.controller.HealthController;
import com.rescuekaro.backend.exception.ApiException;
import com.rescuekaro.backend.security.TokenService;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import org.springframework.core.env.Environment;
import tools.jackson.databind.ObjectMapper;

class BackendApplicationTests {
    @Test
    void healthUsesStandardEnvelope() {
        var result = new HealthController().health();
        assertThat(result.data().status()).isEqualTo("UP");
        assertThat(result.meta()).containsKey("requestId");
    }

    @Test
    void phoneNormalizationProducesE164() {
        assertThat(AuthService.normalizePhone("98765 43210")).isEqualTo("+919876543210");
        assertThat(AuthService.normalizePhone("+91 98765 43210")).isEqualTo("+919876543210");
    }

    @Test
    void invalidPhoneIsRejectedWithoutEchoingIt() {
        assertThatThrownBy(() -> AuthService.normalizePhone("123"))
                .isInstanceOf(ApiException.class)
                .hasMessageNotContaining("123");
    }

    @Test void nonIndianPhoneIsRejected() {
        assertThatThrownBy(() -> AuthService.normalizePhone("+44 7700 900123")).isInstanceOf(ApiException.class);
    }

    @Test void productionEmailProviderRequiresResendConfiguration() {
        Environment environment = mock(Environment.class);
        org.mockito.Mockito.when(environment.getActiveProfiles()).thenReturn(new String[] {"prod"});
        var service = new ResendEmailService(new ObjectMapper(), environment, "resend", "", "");
        assertThatThrownBy(service::validateConfiguration).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void sensitiveTokenHashesAreStableAndDistinct() {
        assertThat(TokenService.sha256("same")).isEqualTo(TokenService.sha256("same")).hasSize(64);
        assertThat(TokenService.sha256("same")).isNotEqualTo(TokenService.sha256("different"));
    }

    @Test void emailTemplatesHaveAccessibleTextAndEscapeNames() {
        for (var action : EmailOtpTemplate.Action.values()) {
            String html = EmailOtpTemplate.html(action, "<Sample & User>", "123456");
            String plain = EmailOtpTemplate.plain(action, "Sample User", "123456");
            assertThat(html).contains("max-width:600px", "name=\"viewport\"", "role=\"presentation\"",
                    "&lt;Sample &amp; User&gt;", "123456", "Expires in 10 minutes.", "Do not share this code.")
                    .doesNotContain("<Sample & User>", "<script", "http://");
            assertThat(plain).contains("123456", "Do not share this code.", "If you did not request this");
        }
    }

}
