package com.rescuekaro.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.rescuekaro.backend.auth.AuthService;
import com.rescuekaro.backend.auth.EmailService;
import com.rescuekaro.backend.auth.EmailOtpTemplate;
import com.rescuekaro.backend.controller.HealthController;
import com.rescuekaro.backend.exception.ApiException;
import com.rescuekaro.backend.security.TokenService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.util.Properties;
import org.mockito.ArgumentCaptor;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;

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

    @Test void emailProviderRequiresConfiguredMailSenderAndCredentials() {
        @SuppressWarnings("unchecked") ObjectProvider<JavaMailSender> sender=mock(ObjectProvider.class);
        var service=new EmailService(sender,"","RescueKaro","","","",true);
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
                    "&lt;Sample &amp; User&gt;", "123456", "Expires in 5 minutes.", "Do not share this code.")
                    .doesNotContain("<Sample & User>", "<script", "http://");
            assertThat(plain).contains("123456", "Do not share this code.", "If you did not request this");
        }
    }

    @Test void mailConstructionIncludesPlainTextAndHtml() throws Exception {
        @SuppressWarnings("unchecked") ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        JavaMailSender mail = mock(JavaMailSender.class);
        when(provider.getIfAvailable()).thenReturn(mail);
        when(mail.createMimeMessage()).thenAnswer(call -> new MimeMessage(Session.getInstance(new Properties())));
        var service = new EmailService(provider, "verify@example.com", "RescueKaro", "localhost", "test", "test", true);
        service.sendLoginOtp("person@example.com", "Sample User", "123456");
        ArgumentCaptor<MimeMessage> sent = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mail).send(sent.capture());
        sent.getValue().saveChanges();
        assertThat(sent.getValue().getSubject()).contains("sign-in");
        assertThat(sent.getValue().getContentType()).contains("multipart");
    }
}
