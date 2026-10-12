package com.rescuekaro.backend.checkout;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import com.rescuekaro.backend.dto.ApiResponse;
import com.rescuekaro.backend.configuration.AppProperties;
import com.rescuekaro.backend.exception.ApiException;
import com.rescuekaro.backend.qr.QrIdentity;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderHistoryController {
 private final JdbcClient db;
 private final AppProperties properties;
 public OrderHistoryController(JdbcClient db, AppProperties properties){this.db=db;this.properties=properties;}
 @GetMapping public ApiResponse<List<Order>> list(Authentication authentication){
  UUID userId=UUID.fromString(authentication.getName());
  return ApiResponse.of(db.sql("SELECT o.id,o.order_number,o.use_case,o.total_paise,o.currency,o.payment_status,o.order_status,o.created_at,p.name AS product FROM orders o JOIN products p ON p.id=o.product_id WHERE o.user_id=:user ORDER BY o.created_at DESC")
   .param("user",userId).query((rs,n)->new Order((UUID)rs.getObject("id"),rs.getString("order_number"),rs.getString("use_case"),rs.getInt("total_paise"),rs.getString("currency"),rs.getString("payment_status"),rs.getString("order_status"),rs.getTimestamp("created_at").toInstant(),rs.getString("product"))).list());
 }
 @GetMapping("/{id}") public ApiResponse<OrderDetail> detail(@PathVariable UUID id, Authentication authentication) {
  UUID userId=UUID.fromString(authentication.getName());
  OrderDetail order=db.sql("SELECT id,order_number,payment_status,total_paise,currency,use_case FROM orders WHERE id=:id AND user_id=:user")
   .param("id",id).param("user",userId)
   .query((rs,n)->new OrderDetail((UUID)rs.getObject("id"),rs.getString("order_number"),rs.getString("payment_status"),rs.getInt("total_paise"),rs.getString("currency"),rs.getString("use_case"),List.of()))
   .optional().orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"RESOURCE_NOT_FOUND","Order not found."));
  List<String> urls=db.sql("SELECT public_token,serial_number,created_at FROM qr_codes WHERE order_id=:id ORDER BY serial_number")
   .param("id",id).query((rs,n)->QrIdentity.publicUrl(properties.publicAppUrl(),rs.getLong("serial_number"),rs.getTimestamp("created_at").toInstant(),rs.getString("public_token"))).list();
  return ApiResponse.of(new OrderDetail(order.id(),order.orderNumber(),order.paymentStatus(),order.totalPaise(),order.currency(),order.useCase(),urls));
 }
 public record Order(UUID id,String orderNumber,String useCase,int totalPaise,String currency,String paymentStatus,String orderStatus,Instant createdAt,String product){}
 public record OrderDetail(UUID id,String orderNumber,String paymentStatus,int totalPaise,String currency,String useCase,List<String> stickerUrls){}
}
