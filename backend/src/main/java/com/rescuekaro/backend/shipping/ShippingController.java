package com.rescuekaro.backend.shipping;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.sql.Timestamp;
import java.util.UUID;
import com.rescuekaro.backend.dto.ApiResponse;
import com.rescuekaro.backend.exception.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/shipping")
public class ShippingController {
    private final JdbcClient db;
    public ShippingController(JdbcClient db){this.db=db;}
    @PostMapping("/quote") public ApiResponse<Quote> quote(@Valid @RequestBody Request request){
        boolean product=db.sql("SELECT EXISTS(SELECT 1 FROM products WHERE id=:id AND active=true)").param("id",request.productId()).query(Boolean.class).single();
        if(!product)throw new ApiException(HttpStatus.NOT_FOUND,"RESOURCE_NOT_FOUND","Product not found.");
        boolean available="India".equalsIgnoreCase(request.country())&&request.pinCode().matches("[1-9]\\d{5}");
        int charge=available?5900:0; UUID id=UUID.randomUUID(); Instant expires=Instant.now().plus(30,ChronoUnit.MINUTES);
        db.sql("INSERT INTO shipping_quotes(id,product_id,pin_code,country,quantity,charge_paise,available,estimated_min_days,estimated_max_days,expires_at) VALUES(:id,:product,:pin,:country,:quantity,:charge,:available,:min,:max,:expires)")
                .param("id",id).param("product",request.productId()).param("pin",request.pinCode()).param("country",request.country()).param("quantity",request.quantity())
                .param("charge",charge).param("available",available).param("min",available?3:null).param("max",available?7:null).param("expires",Timestamp.from(expires)).update();
        return ApiResponse.of(new Quote(id,available,charge,"INR",expires,available?3:null,available?7:null));
    }
    public record Request(@Pattern(regexp="\\d{6}") String pinCode,@NotBlank String country,UUID productId,@Min(1) @Max(10) int quantity){}
    public record Quote(UUID quoteId,boolean available,int chargePaise,String currency,Instant expiresAt,Integer estimatedMinDays,Integer estimatedMaxDays){}
}
