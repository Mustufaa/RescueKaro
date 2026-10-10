package com.rescuekaro.backend.controller;

import com.rescuekaro.backend.dto.HealthResponse;
import com.rescuekaro.backend.dto.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @GetMapping("/health")
    public ApiResponse<HealthResponse> health() {
        return ApiResponse.of(new HealthResponse("UP", "rescuekaro-backend"));
    }
}
