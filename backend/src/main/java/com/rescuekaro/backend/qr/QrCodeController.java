package com.rescuekaro.backend.qr;

import java.util.List;
import java.util.UUID;
import com.rescuekaro.backend.dto.ApiResponse;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class QrCodeController {
    private final QrCodeService qr;
    public QrCodeController(QrCodeService qr){this.qr=qr;}
    @GetMapping("/qr-codes") public ApiResponse<List<QrCodeService.OwnerQr>> list(Authentication auth){return ApiResponse.of(qr.list(UUID.fromString(auth.getName())));}
    @GetMapping("/qr-codes/{id}") public ApiResponse<QrCodeService.OwnerQr> one(Authentication auth,@PathVariable UUID id){return ApiResponse.of(qr.owned(UUID.fromString(auth.getName()),id));}
    @GetMapping(value="/qr-codes/{id}.png",produces=MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> png(Authentication auth,@PathVariable UUID id){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).header("Content-Disposition","attachment; filename=\"rescuekaro-"+id+".png\"").body(qr.png(UUID.fromString(auth.getName()),id));}
    @GetMapping("/public/qr/{publicToken}")
    public ResponseEntity<ApiResponse<QrCodeService.PublicProfile>> publicProfile(@PathVariable String publicToken){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).header("X-Robots-Tag","noindex, nofollow, noarchive").body(ApiResponse.of(qr.resolve(publicToken)));}
    @GetMapping("/public/qr/{serialCode}/{publicToken}")
    public ResponseEntity<ApiResponse<QrCodeService.PublicProfile>> publicProfileWithSerial(@PathVariable String serialCode,@PathVariable String publicToken){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).header("X-Robots-Tag","noindex, nofollow, noarchive").body(ApiResponse.of(qr.resolve(serialCode,publicToken)));}
}
