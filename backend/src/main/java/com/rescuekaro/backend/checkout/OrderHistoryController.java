package com.rescuekaro.backend.checkout;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import com.rescuekaro.backend.dto.ApiResponse;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderHistoryController {
 private final JdbcClient db;
 public OrderHistoryController(JdbcClient db){this.db=db;}
 @GetMapping public ApiResponse<List<Order>> list(Authentication authentication){
  UUID userId=UUID.fromString(authentication.getName());
  return ApiResponse.of(db.sql("SELECT o.id,o.order_number,o.use_case,o.total_paise,o.currency,o.payment_status,o.order_status,o.created_at,p.name AS product FROM orders o JOIN products p ON p.id=o.product_id WHERE o.user_id=:user ORDER BY o.created_at DESC")
   .param("user",userId).query((rs,n)->new Order((UUID)rs.getObject("id"),rs.getString("order_number"),rs.getString("use_case"),rs.getInt("total_paise"),rs.getString("currency"),rs.getString("payment_status"),rs.getString("order_status"),rs.getTimestamp("created_at").toInstant(),rs.getString("product"))).list());
 }
 public record Order(UUID id,String orderNumber,String useCase,int totalPaise,String currency,String paymentStatus,String orderStatus,Instant createdAt,String product){}
}
