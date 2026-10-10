package com.rescuekaro.backend.checkout;

import com.rescuekaro.backend.dto.ApiResponse;
import com.rescuekaro.backend.exception.ApiException;
import com.rescuekaro.backend.qr.QrIdentity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import org.springframework.security.core.Authentication;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@RestController @RequestMapping("/api/v1/payments")
public class PaymentController {
 private final JdbcClient db; private final Environment env; private final String mode,keyId,keySecret,publicUrl;
 public PaymentController(JdbcClient db,Environment env,@Value("${RAZORPAY_MODE:test}") String mode,@Value("${RAZORPAY_KEY_ID:}") String keyId,@Value("${RAZORPAY_KEY_SECRET:}") String keySecret,@Value("${app.public-app-url:http://localhost:3000}") String publicUrl){this.db=db;this.env=env;this.mode=mode;this.keyId=keyId;this.keySecret=keySecret;this.publicUrl=publicUrl.replaceAll("/$","");}
 @PostMapping("/orders/{orderId}") @Transactional
 public ApiResponse<PaymentOrder> create(@PathVariable UUID orderId,Authentication auth){
  requireOwner(orderId,auth);
  var o=db.sql("SELECT total_paise,currency,payment_status FROM orders WHERE id=:id FOR UPDATE").param("id",orderId).query((rs,n)->new O(rs.getInt(1),rs.getString(2),rs.getString(3))).optional().orElseThrow(()->notFound());
  if(!"PENDING".equals(o.status()))throw conflict("Order is not awaiting payment.");
  var existing=db.sql("SELECT id,provider_order_id,amount_paise,currency FROM payments WHERE order_id=:id AND status='PENDING' ORDER BY created_at DESC LIMIT 1")
   .param("id",orderId).query((rs,n)->new PaymentOrder((UUID)rs.getObject(1),rs.getString(2),rs.getInt(3),rs.getString(4),"simulation".equalsIgnoreCase(mode),keyId)).optional();
  if(existing.isPresent())return ApiResponse.of(existing.get());
  UUID payment=UUID.randomUUID(); String providerId;
  if("simulation".equalsIgnoreCase(mode)){if(Arrays.stream(env.getActiveProfiles()).noneMatch("dev"::equals))throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,"PAYMENT_MODE_INVALID","Simulation is available only in the dev profile.");providerId="dev_"+UUID.randomUUID().toString().replace("-","");}
  else {if(keyId.isBlank()||keySecret.isBlank())throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,"PAYMENT_UNAVAILABLE","Razorpay credentials are not configured.");
   Map<?,?> response=RestClient.create("https://api.razorpay.com/v1").post().uri("/orders").headers(h->h.setBasicAuth(keyId,keySecret)).body(Map.of("amount",o.amount(),"currency",o.currency(),"receipt",orderId.toString())).retrieve().body(Map.class); providerId=String.valueOf(response.get("id"));}
  db.sql("INSERT INTO payments(id,order_id,provider,provider_order_id,amount_paise,currency,status) VALUES(:id,:order,:provider,:providerOrder,:amount,:currency,'PENDING')").params(Map.of("id",payment,"order",orderId,"provider","simulation".equalsIgnoreCase(mode)?"DEV_SIMULATION":"RAZORPAY","providerOrder",providerId,"amount",o.amount(),"currency",o.currency())).update();
  return ApiResponse.of(new PaymentOrder(payment,providerId,o.amount(),o.currency(),"simulation".equalsIgnoreCase(mode),keyId));
 }
 @PostMapping("/verify") @Transactional
 public ApiResponse<OrderStatus> verify(@RequestBody Verify r,Authentication auth){
  var p=db.sql("SELECT id,order_id,provider_order_id,amount_paise,status FROM payments WHERE provider_order_id=:id").param("id",r.razorpayOrderId()).query((rs,n)->new P((UUID)rs.getObject(1),(UUID)rs.getObject(2),rs.getString(3),rs.getInt(4),rs.getString(5))).optional().orElseThrow(()->notFound());
  requireOwner(p.orderId(),auth);
  if("PAID".equals(p.status()))return ApiResponse.of(status(p.orderId()));
  if(keySecret.isBlank()||!constantEquals(hmac(keySecret,p.providerOrder()+"|"+r.razorpayPaymentId()),r.razorpaySignature()))throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY,"PAYMENT_SIGNATURE_INVALID","Payment signature verification failed.");
  markPaid(p,r.razorpayPaymentId()); return ApiResponse.of(status(p.orderId()));
 }
 @PostMapping("/dev-simulate/{orderId}") @Transactional
 public ApiResponse<OrderStatus> simulate(@PathVariable UUID orderId,Authentication auth){
  requireOwner(orderId,auth);
  if(!"simulation".equalsIgnoreCase(mode)||Arrays.stream(env.getActiveProfiles()).noneMatch("dev"::equals))throw new ApiException(HttpStatus.NOT_FOUND,"RESOURCE_NOT_FOUND","Development payment simulation is disabled.");
  var p=db.sql("SELECT id,order_id,provider_order_id,amount_paise,status FROM payments WHERE order_id=:id AND provider='DEV_SIMULATION' ORDER BY created_at DESC LIMIT 1").param("id",orderId).query((rs,n)->new P((UUID)rs.getObject(1),(UUID)rs.getObject(2),rs.getString(3),rs.getInt(4),rs.getString(5))).optional().orElseThrow(()->notFound());
  markPaid(p,"sim_"+UUID.randomUUID().toString().replace("-",""));return ApiResponse.of(status(orderId));
 }
 @GetMapping("/orders/{orderId}") public ApiResponse<OrderStatus> get(@PathVariable UUID orderId,Authentication auth){requireOwner(orderId,auth);return ApiResponse.of(status(orderId));}
 private void requireOwner(UUID orderId,Authentication auth){if(auth==null||db.sql("SELECT count(*) FROM orders WHERE id=:id AND user_id=:user").param("id",orderId).param("user",UUID.fromString(auth.getName())).query(Long.class).single()!=1)throw notFound();}
 private void markPaid(P p,String paymentId){int changed=db.sql("UPDATE payments SET provider_payment_id=:pid,status='PAID',signature_verified_at=now(),updated_at=now() WHERE id=:id AND status='PENDING'").param("pid",paymentId).param("id",p.id()).update();if(changed==0)return;int first=db.sql("UPDATE orders SET payment_status='PAID',qr_status='GENERATED',updated_at=now() WHERE id=:id AND payment_status='PENDING'").param("id",p.orderId()).update();if(first==0)return;db.sql("UPDATE qr_codes SET status='ACTIVE',activated_at=now() WHERE order_id=:id").param("id",p.orderId()).update(); var item=db.sql("SELECT o.emergency_profile_id,oi.id,oi.quantity*oi.sticker_count_each FROM orders o JOIN order_items oi ON oi.order_id=o.id WHERE o.id=:id").param("id",p.orderId()).query((rs,n)->new Sticker(rs.getObject(1,UUID.class),rs.getObject(2,UUID.class),rs.getInt(3))).single();if(db.sql("SELECT count(*) FROM qr_codes WHERE order_id=:id").param("id",p.orderId()).query(Long.class).single()==0)for(int i=0;i<item.count();i++)db.sql("INSERT INTO qr_codes(public_token,emergency_profile_id,order_id,order_item_id,status,activated_at) VALUES(:token,:profile,:order,:item,'ACTIVE',now())").param("token",randomToken()).param("profile",item.profile()).param("order",p.orderId()).param("item",item.item()).update();}
 private OrderStatus status(UUID id){var row=db.sql("SELECT id,order_number,payment_status,total_paise,currency,use_case FROM orders WHERE id=:id").param("id",id).query((rs,n)->new OrderStatus((UUID)rs.getObject(1),rs.getString(2),rs.getString(3),rs.getInt(4),rs.getString(5),rs.getString(6),List.of())).optional().orElseThrow(()->notFound());var urls=db.sql("SELECT public_token,serial_number,created_at FROM qr_codes WHERE order_id=:id ORDER BY serial_number").param("id",id).query((rs,n)->QrIdentity.publicUrl(publicUrl,rs.getLong("serial_number"),rs.getTimestamp("created_at").toInstant(),rs.getString("public_token"))).list();return new OrderStatus(row.id(),row.orderNumber(),row.paymentStatus(),row.totalPaise(),row.currency(),row.useCase(),urls);}
 private static String randomToken(){byte[] b=new byte[32];new java.security.SecureRandom().nextBytes(b);return Base64.getUrlEncoder().withoutPadding().encodeToString(b);} private static String hmac(String secret,String text){try{Mac m=Mac.getInstance("HmacSHA256");m.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8),"HmacSHA256"));return HexFormat.of().formatHex(m.doFinal(text.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}} private static boolean constantEquals(String a,String b){return a!=null&&b!=null&&MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8),b.getBytes(StandardCharsets.UTF_8));}
 private static ApiException notFound(){return new ApiException(HttpStatus.NOT_FOUND,"RESOURCE_NOT_FOUND","Order or payment not found.");}private static ApiException conflict(String m){return new ApiException(HttpStatus.CONFLICT,"PAYMENT_CONFLICT",m);}
 public record Verify(String razorpayOrderId,String razorpayPaymentId,String razorpaySignature){} public record PaymentOrder(UUID paymentId,String providerOrderId,int amount,String currency,boolean simulation,String keyId){} public record OrderStatus(UUID id,String orderNumber,String paymentStatus,int totalPaise,String currency,String useCase,List<String> stickerUrls){} private record O(int amount,String currency,String status){}private record P(UUID id,UUID orderId,String providerOrder,int amount,String status){}private record Sticker(UUID profile,UUID item,int count){}
}
