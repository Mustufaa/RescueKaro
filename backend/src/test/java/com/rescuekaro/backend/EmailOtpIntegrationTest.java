package com.rescuekaro.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.reset;

import com.rescuekaro.backend.auth.AuthService;
import com.rescuekaro.backend.auth.ResendEmailService;
import com.rescuekaro.backend.emergency.EmergencyProfileDto;
import com.rescuekaro.backend.emergency.EmergencyProfileService;
import com.rescuekaro.backend.qr.QrCodeService;
import com.rescuekaro.backend.qr.QrWizardService;
import com.rescuekaro.backend.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("dev")
@AutoConfigureMockMvc
@SpringBootTest(properties = {
        "EMAIL_PROVIDER=resend", "RESEND_API_KEY=test-only", "EMAIL_FROM=verify@example.com",
        "OTP_HASH_SECRET=test-only-email-otp-hash-key-at-least-32-characters",
        "APP_PUBLIC_BASE_URL=https://rescuekaro.example"
})
class EmailOtpIntegrationTest {
    @Container static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @MockitoBean ResendEmailService mail;
    @Autowired AuthService auth;
    @Autowired JdbcClient db;
    @Autowired EmergencyProfileService profiles;
    @Autowired QrCodeService qr;
    @Autowired QrWizardService wizard;
    @Autowired MockMvc http;

    @BeforeEach void prepareMail() { reset(mail); }

    @Test void realProviderSendsDynamicCodeAndRequiresItBeforeSession() throws Exception {
        var pending = auth.register("Email User", "email@example.com", "9876543210", "Abc123", "email-test-ip");
        assertThat(pending.expiresIn()).isEqualTo(600);
        assertThat(db.sql("SELECT count(*) FROM users WHERE email='email@example.com'").query(Long.class).single()).isZero();
        String firstCode = lastCode();
        assertThat(firstCode).matches("\\d{6}");
        assertThat(db.sql("SELECT otp_hash FROM email_otp_challenges WHERE id=:id").param("id", pending.requestId())
                .query(String.class).single()).hasSize(64).isNotEqualTo(firstCode);
        String wrongCode = firstCode.equals("000000") ? "111111" : "000000";
        assertThatThrownBy(() -> auth.verifyRegistration(pending.requestId(), wrongCode)).isInstanceOf(ApiException.class);
        var user = auth.verifyRegistration(pending.requestId(), firstCode).user();
        assertThat(user.email()).isEqualTo("email@example.com");
        assertThatThrownBy(() -> auth.verifyRegistration(pending.requestId(), firstCode)).isInstanceOf(ApiException.class);

        db.sql("UPDATE email_otp_challenges SET next_send_at=now()-interval '1 minute' WHERE email='email@example.com'").update();
        assertThat(auth.login("email@example.com", "Abc123", "email-test-ip").session().user().id()).isEqualTo(user.id());
        http.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"email@example.com\",\"password\":\"Abc123\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.user.email").value("email@example.com"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().exists("Set-Cookie"));
        http.perform(post("/api/v1/auth/verify-login-otp").contentType(MediaType.APPLICATION_JSON)
                .content("{\"requestId\":\"" + pending.requestId() + "\",\"code\":\"" + firstCode + "\"}"))
                .andExpect(status().isNotFound());
    }

    @Test void existingUnverifiedUserResumesVerificationAfterCorrectPassword() {
        var signup = auth.register("Legacy User", "legacy@example.com", "9123456711", "Abc123", "legacy-ip");
        var original = auth.verifyRegistration(signup.requestId(), lastCode());
        db.sql("UPDATE users SET email_verified=false WHERE id=:id").param("id", original.user().id()).update();
        db.sql("UPDATE email_otp_challenges SET next_send_at=now()-interval '1 minute' WHERE email='legacy@example.com'").update();
        assertThatThrownBy(() -> auth.refresh(original.refreshToken())).isInstanceOf(ApiException.class);
        var login = auth.login("legacy@example.com", "Abc123", "legacy-ip");
        assertThat(login.session()).isNull();
        assertThat(login.verification()).isNotNull();
        var resumed = auth.verifyRegistration(login.verification().requestId(), lastCode());
        assertThat(resumed.user().id()).isEqualTo(original.user().id());
        assertThat(auth.login("legacy@example.com", "Abc123", "legacy-ip").session()).isNotNull();
    }

    @Test void providerFailureDoesNotLeavePendingRegistrationOrChallenge() {
        doThrow(new ApiException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, "EMAIL_DELIVERY_FAILED", "test failure"))
                .when(mail).sendRegistrationOtp(any(), any(), any(), any());
        assertThatThrownBy(() -> auth.register("Mail Failure", "failure@example.com", "9123456789", "Abc123", "failure-ip"))
                .isInstanceOf(ApiException.class);
        assertThat(db.sql("SELECT count(*) FROM pending_registrations WHERE email='failure@example.com'").query(Long.class).single()).isZero();
        assertThat(db.sql("SELECT count(*) FROM email_otp_challenges WHERE email='failure@example.com'").query(Long.class).single()).isZero();
    }

    @Test void signupPasswordMustBeExactlySixCharacters() {
        assertThatThrownBy(() -> auth.register("Short Password", "short@example.com", "9234567890", "Ab123", "length-ip"))
                .isInstanceOf(ApiException.class).hasMessageContaining("exactly 6 characters");
        assertThatThrownBy(() -> auth.register("Long Password", "long@example.com", "9234567890", "Abc1234", "length-ip"))
                .isInstanceOf(ApiException.class).hasMessageContaining("exactly 6 characters");
        assertThat(db.sql("SELECT count(*) FROM pending_registrations WHERE email IN ('short@example.com','long@example.com')")
                .query(Long.class).single()).isZero();
    }

    @Test void expiryAttemptLimitPurposeAndResendAreEnforced() throws Exception {
        var first = auth.register("Resend User", "resend@example.com", "9765432109", "Abc123", "resend-ip");
        String original = lastCode();
        assertThatThrownBy(() -> auth.resetPassword(first.requestId(), original, "Def456")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> auth.resend(first.requestId(), "resend-ip")).isInstanceOf(ApiException.class);
        db.sql("UPDATE email_otp_challenges SET next_send_at=now()-interval '1 minute' WHERE id=:id")
                .param("id", first.requestId()).update();
        var next = auth.resend(first.requestId(), "resend-ip");
        assertThatThrownBy(() -> auth.verifyRegistration(first.requestId(), original)).isInstanceOf(ApiException.class);
        String newCode = lastCode();
        String wrong = newCode.equals("000000") ? "111111" : "000000";
        for (int i = 0; i < 5; i++)
            assertThatThrownBy(() -> auth.verifyRegistration(next.requestId(), wrong)).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> auth.verifyRegistration(next.requestId(), newCode)).isInstanceOf(ApiException.class);
        assertThat(db.sql("SELECT attempts FROM email_otp_challenges WHERE id=:id")
                .param("id", next.requestId()).query(Integer.class).single()).isEqualTo(5);

        db.sql("UPDATE email_otp_challenges SET next_send_at=now()-interval '1 minute' WHERE id=:id")
                .param("id", next.requestId()).update();
        var fresh = auth.resend(next.requestId(), "resend-ip");
        String freshCode = lastCode();
        db.sql("UPDATE email_otp_challenges SET expires_at=now()-interval '1 second' WHERE id=:id")
                .param("id", fresh.requestId()).update();
        assertThatThrownBy(() -> auth.verifyRegistration(fresh.requestId(), freshCode)).isInstanceOf(ApiException.class);
    }

    @Test void resetUsesSeparateCodeAndRevokesPriorSessions() throws Exception {
        var signup = auth.register("Reset User", "reset@example.com", "9987654321", "Abc123", "reset-ip");
        var session = auth.verifyRegistration(signup.requestId(), lastCode());
        db.sql("UPDATE email_otp_challenges SET next_send_at=now()-interval '1 minute' WHERE email='reset@example.com'").update();
        var reset = auth.requestPasswordReset("reset@example.com", "reset-ip");
        verify(mail).sendPasswordResetOtp(any(), any(), any(), any());
        String code = lastCode();
        assertThatThrownBy(() -> auth.verifyRegistration(reset.requestId(), code)).isInstanceOf(ApiException.class);
        auth.resetPassword(reset.requestId(), code, "Def456");
        assertThatThrownBy(() -> auth.resetPassword(reset.requestId(), code, "Ghi789")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> auth.refresh(session.refreshToken())).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> auth.login("reset@example.com", "Abc123", "reset-ip")).isInstanceOf(ApiException.class);
    }

    @Test void digitalQrNeedsProfileAndKeepsSerialAndTokenAfterEdits() throws Exception {
        var signup = auth.register("QR Owner", "qr@example.com", "9654321098", "Abc123", "qr-ip");
        var user = auth.verifyRegistration(signup.requestId(), lastCode()).user();
        assertThatThrownBy(() -> qr.createDigital(user.id())).isInstanceOf(ApiException.class);
        var profile = new EmergencyProfileDto(null, null, "QR Owner", "O+", "Lucknow", "Uttar Pradesh", null, 29,
                java.util.List.of(new EmergencyProfileDto.Contact(null, "Helper", "Friend", "9876543210", true)),
                new EmergencyProfileDto.Medical("", "", "", ""),
                new EmergencyProfileDto.Address("", "", "", "Lucknow", "Uttar Pradesh", "", "India"),
                new EmergencyProfileDto.Selections(false, true, false, false, false, false, false, false), true, null);
        var saved = profiles.save(user.id(), profile);
        var code = qr.createDigital(user.id());
        assertThat(code.serialCode()).matches("RK\\d{10}");
        assertThat(qr.createDigital(user.id()).id()).isEqualTo(code.id());
        assertThat(code.publicUrl()).contains(code.serialCode());
        String token = code.publicUrl().substring(code.publicUrl().lastIndexOf('/') + 1);
        assertThat(qr.resolve(token).displayName()).isEqualTo("QR Owner");
        profiles.save(user.id(), new EmergencyProfileDto(saved.id(), saved.version(), "Updated Owner", saved.bloodGroup(),
                saved.city(), saved.state(), saved.dateOfBirth(), saved.ageYears(), saved.contacts(), saved.medical(),
                saved.address(), saved.selections(), true, saved.updatedAt()));
        assertThat(qr.resolve(token).displayName()).isEqualTo("Updated Owner");
        assertThat(qr.png(user.id(), code.id())).isNotEmpty();
    }

    @Test void correctedSignupEmailInvalidatesOldChallenge() throws Exception {
        var original = auth.register("Corrected User", "old@example.com", "9543210987", "Abc123", "correction-ip");
        String oldCode = lastCode();
        var corrected = auth.register("Corrected User", "new@example.com", "9543210987", "Abc123", "correction-ip", original.requestId());
        assertThatThrownBy(() -> auth.verifyRegistration(original.requestId(), oldCode)).isInstanceOf(ApiException.class);
        assertThat(auth.verifyRegistration(corrected.requestId(), lastCode()).user().email()).isEqualTo("new@example.com");
    }

    @Test void registeredPhoneInEitherFormatCannotReceiveAnotherSignupOtp() throws Exception {
        var first = auth.register("Phone Owner", "phone-owner@example.com", "9345678901", "Abc123", "phone-ip");
        auth.verifyRegistration(first.requestId(), lastCode());
        assertThatThrownBy(() -> auth.register("Other Person", "other-phone@example.com", "+91 93456 78901", "Abc123", "phone-ip"))
                .isInstanceOfSatisfying(ApiException.class, failure -> {
                    assertThat(failure.status().value()).isEqualTo(409);
                    assertThat(failure.code()).isEqualTo("PHONE_ALREADY_REGISTERED");
                });
        assertThat(db.sql("SELECT count(*) FROM pending_registrations WHERE email='other-phone@example.com'").query(Long.class).single()).isZero();
        http.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"Other Person\",\"email\":\"other-phone@example.com\",\"phone\":\"+919345678901\",\"password\":\"Abc123\",\"confirmPassword\":\"Abc123\"}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("PHONE_ALREADY_REGISTERED"));
        verify(mail, org.mockito.Mockito.times(1)).sendRegistrationOtp(any(), any(), any(), any());
    }

    @Test void wizardRestoresProgressAndIssuesDistinctIdempotentPhysicalStickers() throws Exception {
        var signup = auth.register("Sticker Owner", "sticker-owner@example.com", "9456789012", "Abc123", "wizard-ip");
        var user = auth.verifyRegistration(signup.requestId(), lastCode()).user();
        var initial = wizard.get(user.id());
        assertThat(initial.step()).isEqualTo(1);
        assertThat(initial.data().profile().fullName()).isEqualTo("Sticker Owner");
        var profile = new EmergencyProfileDto(null, null, "Sticker Owner", "O+", "Lucknow", "Uttar Pradesh", null, null,
                java.util.List.of(new EmergencyProfileDto.Contact(null, "Helper", "Friend", "9876543210", true)),
                new EmergencyProfileDto.Medical("Peanuts", "Asthma", "Inhaler", ""),
                new EmergencyProfileDto.Address("1 Main Road", "", "", "Lucknow", "Uttar Pradesh", "226001", "India"),
                new EmergencyProfileDto.Selections(false, false, false, true, true, false, true, true), true, null);
        var delivery = new QrWizardService.Delivery("Sticker Owner", "9456789012", "1 Main Road", "", "", "Lucknow", "Uttar Pradesh", "226001", "India");
        var details = new QrWizardService.Data(profile, "123", "456", "HELMET", 2, delivery, true);
        assertThatThrownBy(() -> wizard.save(user.id(), initial.draftId(), 5, initial.data())).isInstanceOf(ApiException.class);
        wizard.save(user.id(), initial.draftId(), 3, details);
        assertThat(wizard.get(user.id()).step()).isEqualTo(3);
        wizard.save(user.id(), initial.draftId(), 5, details);
        QrWizardService.View completed;
        var generators = java.util.concurrent.Executors.newFixedThreadPool(2);
        var generate = new java.util.concurrent.CountDownLatch(1);
        try {
            var firstRequest = generators.submit(() -> { generate.await(); return wizard.finish(user.id(), initial.draftId(), details); });
            var secondRequest = generators.submit(() -> { generate.await(); return wizard.finish(user.id(), initial.draftId(), details); });
            generate.countDown();
            completed = firstRequest.get(30, java.util.concurrent.TimeUnit.SECONDS);
            assertThat(secondRequest.get(30, java.util.concurrent.TimeUnit.SECONDS).completedOrder().id())
                    .isEqualTo(completed.completedOrder().id());
        } finally { generators.shutdownNow(); }
        assertThat(completed.step()).isEqualTo(6);
        assertThat(completed.completedOrder().paymentStatus()).isEqualTo("NOT_REQUIRED");
        assertThat(completed.completedOrder().stickers()).hasSize(2);
        var first = completed.completedOrder().stickers().get(0);
        var second = completed.completedOrder().stickers().get(1);
        assertThat(Long.parseLong(second.serialCode())).isEqualTo(Long.parseLong(first.serialCode()) + 1);
        assertThat(first.publicUrl()).startsWith("https://rescuekaro.example/qr/");
        assertThat(first.publicUrl()).doesNotContain("localhost");
        var qrImage = javax.imageio.ImageIO.read(new java.io.ByteArrayInputStream(qr.png(user.id(), first.id())));
        var bitmap = new com.google.zxing.BinaryBitmap(new com.google.zxing.common.HybridBinarizer(
                new com.google.zxing.client.j2se.BufferedImageLuminanceSource(qrImage)));
        assertThat(new com.google.zxing.MultiFormatReader().decode(bitmap).getText()).isEqualTo(first.publicUrl());
        String token = first.publicUrl().substring(first.publicUrl().lastIndexOf('/') + 1);
        http.perform(get("/api/v1/public/qr/" + first.serialCode() + "/" + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.displayName").value("Sticker Owner"))
                .andExpect(jsonPath("$.data.medical.medicalCondition").value("Asthma"));
        assertThat(qr.resolve(first.serialCode(), token).emergencyDirectory()).hasSize(2)
                .allSatisfy(number -> assertThat(number.source()).isEqualTo("Provided by profile owner"));
        http.perform(get("/api/v1/qr-wizard")).andExpect(status().isUnauthorized());
        assertThat(wizard.finish(user.id(), initial.draftId(), details).completedOrder().stickers()).hasSize(2);
        assertThat(db.sql("SELECT count(*) FROM qr_codes WHERE sticker_order_id=:id")
                .param("id", completed.completedOrder().id()).query(Long.class).single()).isEqualTo(2);
        assertThat(wizard.listOrders(user.id())).hasSize(1);
        assertThat(qr.createDigital(user.id()).serialCode()).startsWith("RK");
        var other = auth.register("Other Owner", "other-owner@example.com", "9567890123", "Abc123", "other-ip");
        var otherUser = auth.verifyRegistration(other.requestId(), lastCode()).user();
        assertThatThrownBy(() -> wizard.order(otherUser.id(), completed.completedOrder().id())).isInstanceOf(ApiException.class);
        http.perform(get("/api/v1/sticker-orders/" + completed.completedOrder().id()).with(user(otherUser.id().toString())))
                .andExpect(status().isNotFound());
    }

    @Test void concurrentEquivalentPhonesCreateOnlyOnePendingRegistration() throws Exception {
        var pool = java.util.concurrent.Executors.newFixedThreadPool(2);
        var ready = new java.util.concurrent.CountDownLatch(2);
        var start = new java.util.concurrent.CountDownLatch(1);
        try {
            var first = pool.submit(() -> concurrentSignup("race-one@example.com", "9678901234", ready, start));
            var second = pool.submit(() -> concurrentSignup("race-two@example.com", "+91 96789 01234", ready, start));
            assertThat(ready.await(10, java.util.concurrent.TimeUnit.SECONDS)).isTrue();
            start.countDown();
            assertThat(first.get(30, java.util.concurrent.TimeUnit.SECONDS) + second.get(30, java.util.concurrent.TimeUnit.SECONDS)).isEqualTo(1);
            assertThat(db.sql("SELECT count(*) FROM pending_registrations WHERE phone_e164='+919678901234'").query(Long.class).single()).isEqualTo(1);
            assertThat(db.sql("SELECT count(*) FROM email_otp_challenges WHERE email IN ('race-one@example.com','race-two@example.com')").query(Long.class).single()).isEqualTo(1);
        verify(mail, org.mockito.Mockito.times(1)).sendRegistrationOtp(any(), any(), any(), any());
        } finally { pool.shutdownNow(); }
    }

    @Test void unverifiedRegistrationCanResumeWithEquivalentPhoneFormat() throws Exception {
        var first = auth.register("Resume User", "resume@example.com", "9789012345", "Abc123", "resume-ip");
        String oldCode = lastCode();
        db.sql("UPDATE email_otp_challenges SET next_send_at=now()-interval '1 minute' WHERE id=:id")
                .param("id", first.requestId()).update();
        var resumed = auth.register("Resume User", "resume@example.com", "+91 97890 12345", "Abc123", "resume-ip");
        assertThat(db.sql("SELECT count(*) FROM pending_registrations WHERE phone_e164='+919789012345'").query(Long.class).single()).isEqualTo(1);
        assertThatThrownBy(() -> auth.verifyRegistration(first.requestId(), oldCode)).isInstanceOf(ApiException.class);
        assertThat(auth.verifyRegistration(resumed.requestId(), lastCode()).user().email()).isEqualTo("resume@example.com");
    }

    private int concurrentSignup(String email, String phone, java.util.concurrent.CountDownLatch ready,
                                 java.util.concurrent.CountDownLatch start) throws InterruptedException {
        ready.countDown(); start.await();
        try { auth.register("Concurrent User", email, phone, "Abc123", "race-ip"); return 1; }
        catch (ApiException | org.springframework.dao.DataIntegrityViolationException conflict) { return 0; }
    }

    private String lastCode() {
        String code = org.mockito.Mockito.mockingDetails(mail).getInvocations().stream()
                .filter(call -> call.getMethod().getName().startsWith("send") && call.getArguments().length == 4)
                .reduce((first, second) -> second)
                .map(call -> (String) call.getArgument(2)).orElseThrow();
        assertThat(code).matches("\\d{6}");
        return code;
    }
}
