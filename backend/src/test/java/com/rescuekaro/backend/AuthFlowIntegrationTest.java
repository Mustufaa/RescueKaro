package com.rescuekaro.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.rescuekaro.backend.auth.AuthService;
import com.rescuekaro.backend.exception.ApiException;
import com.rescuekaro.backend.checkout.CheckoutController;
import com.rescuekaro.backend.checkout.PaymentController;
import com.rescuekaro.backend.emergency.EmergencyProfileDto;
import com.rescuekaro.backend.emergency.EmergencyProfileService;
import com.rescuekaro.backend.qr.QrCodeService;
import com.rescuekaro.backend.shipping.ShippingController;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers(disabledWithoutDocker=true)
@SpringBootTest
@ActiveProfiles("dev")
class AuthFlowIntegrationTest {
 @Container static final PostgreSQLContainer<?> postgres=new PostgreSQLContainer<>("postgres:17-alpine");
 @DynamicPropertySource static void database(DynamicPropertyRegistry registry){registry.add("spring.datasource.url",postgres::getJdbcUrl);registry.add("spring.datasource.username",postgres::getUsername);registry.add("spring.datasource.password",postgres::getPassword);registry.add("RAZORPAY_MODE",()->"simulation");}
 @Autowired AuthService auth;
 @Autowired JdbcClient db;
 @Autowired CheckoutController checkout;
 @Autowired PaymentController payments;
 @Autowired ShippingController shipping;
 @Autowired QrCodeService qr;
 @Autowired EmergencyProfileService profiles;

 @Test void signupProofAndLoginChallengesArePurposeBoundAndSingleUse(){
  String phone="9876543210";
  var signup=auth.sendOtp(phone,"registration");
  assertThat(auth.verifyOtp(signup.requestId(),"123456").verified()).isFalse();
  var verified=auth.verifyOtp(signup.requestId(),"000111");
  assertThat(verified.verified()).isTrue();
  assertThatThrownBy(()->auth.verifyOtp(signup.requestId(),"000111")).isInstanceOf(ApiException.class);
  assertThatThrownBy(()->auth.loginOtp(signup.requestId(),"000111")).isInstanceOf(ApiException.class);
  assertThatThrownBy(()->auth.register("Test User","test@example.com","9123456789","password123",verified.verificationToken())).isInstanceOf(ApiException.class);
  var session=auth.register("Test User","test@example.com",phone,"password123",verified.verificationToken());
  assertThat(session.user().phone()).isEqualTo("+919876543210");
  assertThatThrownBy(()->auth.register("Test User","again@example.com",phone,"password123",verified.verificationToken())).isInstanceOf(ApiException.class);
  db.sql("UPDATE otp_challenges SET next_send_at=now()-interval '1 minute' WHERE phone_e164=:phone").param("phone","+919876543210").update();
  var login=auth.sendOtp(phone,"login");
  assertThatThrownBy(()->auth.verifyOtp(login.requestId(),"000111")).isInstanceOf(ApiException.class);
  assertThatThrownBy(()->auth.loginOtp(login.requestId(),"999999")).isInstanceOf(ApiException.class);
  var loggedIn=auth.loginOtp(login.requestId(),"000111");
  assertThat(loggedIn.user().id()).isEqualTo(session.user().id());
  assertThat(auth.refresh(loggedIn.refreshToken()).user().id()).isEqualTo(session.user().id());
  assertThatThrownBy(()->auth.refresh(loggedIn.refreshToken())).isInstanceOf(ApiException.class);
  assertThatThrownBy(()->auth.loginOtp(login.requestId(),"000111")).isInstanceOf(ApiException.class);
  assertThatThrownBy(()->auth.sendOtp("9999999999","login")).isInstanceOf(ApiException.class);
  assertThat(db.sql("SELECT password_hash FROM users WHERE id=:id").param("id",session.user().id()).query(String.class).single()).isNotEqualTo("password123");
 }

 @Test void paidOrderActivatesOwnedQrAndProfileEditsKeepItsToken(){
  String phone="9123456789";
  var proof=auth.verifyOtp(auth.sendOtp(phone,"registration").requestId(),"000111");
  var user=auth.register("Owner Name","owner@example.com",phone,"password123",proof.verificationToken()).user();
  var owner=new UsernamePasswordAuthenticationToken(user.id().toString(),null);
  UUID product=db.sql("SELECT id FROM products WHERE slug='starter-kit'").query(UUID.class).single();
  var quote=shipping.quote(new ShippingController.Request("226001","India",product,1)).data();
  var contact=new CheckoutController.Contact("Helper","Friend","9876543210",true);
  var profile=new CheckoutController.Profile("Patient Name","O+","Lucknow","Uttar Pradesh",null,29,java.util.List.of(contact),
   new CheckoutController.Medical("Peanuts","Asthma","","Call family"),
   new CheckoutController.Address("Road 1","","","Lucknow","Uttar Pradesh","226001","India"),
   new CheckoutController.Selections(false,true,false,true,false,true,false,false));
  var delivery=new CheckoutController.Delivery("Owner Name",phone,"Road 1","","","Lucknow","Uttar Pradesh","226001","India");
  var order=checkout.create(new CheckoutController.Checkout("Helmet",quote.quoteId(),profile,delivery),owner).data();
  assertThat(qr.list(user.id())).isEmpty();
  assertThat(payments.get(order.id(),owner).data().paymentStatus()).isEqualTo("PENDING");
  var other=new UsernamePasswordAuthenticationToken(UUID.randomUUID().toString(),null);
  assertThatThrownBy(()->payments.get(order.id(),other)).isInstanceOf(ApiException.class);
  var paymentOrder=payments.create(order.id(),owner).data();
  assertThatThrownBy(()->payments.verify(new PaymentController.Verify(paymentOrder.providerOrderId(),"fake_payment","invalid"),owner)).isInstanceOf(ApiException.class);
  assertThat(qr.list(user.id())).isEmpty();
  assertThat(payments.simulate(order.id(),owner).data().paymentStatus()).isEqualTo("PAID");
  var paymentUrls=payments.simulate(order.id(),owner).data().stickerUrls();
  assertThat(paymentUrls).hasSize(2).allMatch(url->url.matches(".*/qr/RK\\d{10}/[A-Za-z0-9_-]+"));
  var stickers=qr.list(user.id());
  assertThat(stickers).hasSize(2).allMatch(s->"ACTIVE".equals(s.status()));
  assertThat(stickers.get(1).serialNumber()).isGreaterThan(stickers.get(0).serialNumber());
  assertThat(stickers.stream().map(QrCodeService.OwnerQr::publicUrl).toList()).containsExactlyElementsOf(paymentUrls);
  assertThat(stickers.get(0).serialCode()).matches("RK\\d{10}");
  assertThatThrownBy(()->qr.owned(UUID.randomUUID(),stickers.get(0).id())).isInstanceOf(ApiException.class);
  String token=stickers.get(0).publicUrl().substring(stickers.get(0).publicUrl().lastIndexOf('/')+1);
  assertThat(qr.resolve(token).displayName()).isEqualTo("Patient Name");
  assertThat(qr.resolve(stickers.get(0).serialCode(),token).displayName()).isEqualTo("Patient Name");
  assertThatThrownBy(()->qr.resolve("RK2026009999",token)).isInstanceOf(ApiException.class);
  assertThat(qr.resolve(token).age()).isEqualTo(29);
  EmergencyProfileDto old=profiles.get(user.id());
  assertThat(old.ageYears()).isEqualTo(29);
  profiles.save(user.id(),new EmergencyProfileDto(old.id(),old.version(),"Updated Patient",old.bloodGroup(),old.city(),old.state(),old.dateOfBirth(),old.ageYears(),old.contacts(),old.medical(),old.address(),old.selections(),true,old.updatedAt()));
  assertThat(qr.resolve(token).displayName()).isEqualTo("Updated Patient");
 }

 @Test void passwordResetRequiresUnusedLoginOtpAndRevokesRefreshSessions(){
  String phone="9987654321";
  var proof=auth.verifyOtp(auth.sendOtp(phone,"registration").requestId(),"000111");
  var session=auth.register("Reset User","reset@example.com",phone,"oldpassword123",proof.verificationToken());
  db.sql("UPDATE otp_challenges SET next_send_at=now()-interval '1 minute' WHERE phone_e164=:phone").param("phone","+919987654321").update();
  var challenge=auth.sendOtp(phone,"login");
  assertThatThrownBy(()->auth.resetPassword(challenge.requestId(),"999999","newpassword123")).isInstanceOf(ApiException.class);
  auth.resetPassword(challenge.requestId(),"000111","newpassword123");
  assertThatThrownBy(()->auth.login("reset@example.com","oldpassword123")).isInstanceOf(ApiException.class);
  assertThat(auth.login("reset@example.com","newpassword123").user().id()).isEqualTo(session.user().id());
  assertThatThrownBy(()->auth.refresh(session.refreshToken())).isInstanceOf(ApiException.class);
  assertThatThrownBy(()->auth.resetPassword(challenge.requestId(),"000111","anotherpassword123")).isInstanceOf(ApiException.class);
 }
}
