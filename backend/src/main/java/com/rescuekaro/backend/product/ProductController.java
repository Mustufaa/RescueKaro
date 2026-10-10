package com.rescuekaro.backend.product;

import java.util.List;
import java.util.UUID;
import com.rescuekaro.backend.dto.ApiResponse;
import com.rescuekaro.backend.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {
    private final JdbcClient db;
    public ProductController(JdbcClient db){this.db=db;}
    @GetMapping public ApiResponse<List<Product>> list(){return ApiResponse.of(db.sql("SELECT id,slug,name,description,price_paise,currency,sticker_count,cover_count,active FROM products WHERE active=true ORDER BY created_at")
            .query((rs,n)->map(rs)).list());}
    @GetMapping("/{slug}") public ApiResponse<Product> one(@PathVariable String slug){return ApiResponse.of(db.sql("SELECT id,slug,name,description,price_paise,currency,sticker_count,cover_count,active FROM products WHERE slug=:slug AND active=true")
            .param("slug",slug).query((rs,n)->map(rs)).optional().orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"RESOURCE_NOT_FOUND","Product not found.")));}
    private static Product map(java.sql.ResultSet rs)throws java.sql.SQLException{return new Product((UUID)rs.getObject("id"),rs.getString("slug"),rs.getString("name"),rs.getString("description"),rs.getInt("price_paise"),rs.getString("currency"),rs.getInt("sticker_count"),rs.getInt("cover_count"),rs.getBoolean("active"));}
    public record Product(UUID id,String slug,String name,String description,int pricePaise,String currency,int stickerCount,int coverCount,boolean active){}
}
