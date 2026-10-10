package com.rescuekaro.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.rescuekaro.backend.auth.AuthService;
import com.rescuekaro.backend.configuration.AppProperties;
import com.rescuekaro.backend.controller.HealthController;
import com.rescuekaro.backend.exception.ApiException;
import com.rescuekaro.backend.security.TokenService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

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

    @Test void productionRejectsMockOtpAtStartup() {
        var properties=new AppProperties("https://rescuekaro.com",null,new AppProperties.Otp("mock","000111",300,30,5));
        var service=new AuthService(null,null,null,properties);
        service.setEnvironment(new MockEnvironment().withProperty("spring.profiles.active","prod"));
        assertThatThrownBy(service::validateProductionOtp).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void sensitiveTokenHashesAreStableAndDistinct() {
        assertThat(TokenService.sha256("same")).isEqualTo(TokenService.sha256("same")).hasSize(64);
        assertThat(TokenService.sha256("same")).isNotEqualTo(TokenService.sha256("different"));
    }
}
