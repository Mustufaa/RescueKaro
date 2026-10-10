package com.rescuekaro.backend.emergency;

import java.util.UUID;
import com.rescuekaro.backend.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/emergency-profile")
public class EmergencyProfileController {
    private final EmergencyProfileService profiles;
    public EmergencyProfileController(EmergencyProfileService profiles){this.profiles=profiles;}
    @GetMapping public ApiResponse<EmergencyProfileDto> get(Authentication auth){return ApiResponse.of(profiles.get(UUID.fromString(auth.getName())));}
    @PutMapping public ApiResponse<EmergencyProfileDto> put(Authentication auth,@Valid @RequestBody EmergencyProfileDto body){return ApiResponse.of(profiles.save(UUID.fromString(auth.getName()),body));}
    @PatchMapping public ApiResponse<EmergencyProfileDto> patch(Authentication auth,@Valid @RequestBody EmergencyProfileDto body){return ApiResponse.of(profiles.save(UUID.fromString(auth.getName()),body));}
}
