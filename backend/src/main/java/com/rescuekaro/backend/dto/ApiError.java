package com.rescuekaro.backend.dto;

import java.util.Map;

public record ApiError(String code, String message, Map<String, String> fields, String requestId) {
}
