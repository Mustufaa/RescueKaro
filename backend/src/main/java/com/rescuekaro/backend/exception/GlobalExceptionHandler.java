package com.rescuekaro.backend.exception;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import com.rescuekaro.backend.dto.ApiError;
import com.rescuekaro.backend.dto.ApiErrorResponse;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApi(ApiException exception) {
        return error(exception.status(), exception.code(), exception.getMessage(), Map.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error ->
                fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return error(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR",
                "Please correct the highlighted fields.", fields);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(ConstraintViolationException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getConstraintViolations().forEach(violation ->
                fields.putIfAbsent(violation.getPropertyPath().toString(), violation.getMessage()));
        return error(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR",
                "Please correct the highlighted fields.", fields);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataConflict(DataIntegrityViolationException exception) {
        Throwable cause = exception;
        while (cause != null) {
            if (cause instanceof java.sql.SQLException sql && "23505".equals(sql.getSQLState())) {
                String detail = sql.getMessage() == null ? "" : sql.getMessage();
                if (detail.contains("users_phone_e164_key"))
                    return error(HttpStatus.CONFLICT, "PHONE_ALREADY_REGISTERED",
                            "This phone number is already registered. Please sign in.", Map.of());
                if (detail.contains("pending_registrations_phone_e164_key"))
                    return error(HttpStatus.CONFLICT, "PHONE_PENDING_VERIFICATION",
                            "This phone number has a pending email verification. Continue with the original email address.", Map.of());
                if (detail.contains("users_email_key") || detail.contains("pending_registrations_email_key"))
                    return error(HttpStatus.CONFLICT, "ACCOUNT_ALREADY_EXISTS",
                            "This email is already registered or awaiting verification.", Map.of());
            }
            cause = cause.getCause();
        }
        return error(HttpStatus.CONFLICT, "DATA_CONFLICT", "This record conflicts with existing data.", Map.of());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingRoute(NoResourceFoundException exception) {
        return error(HttpStatus.NOT_FOUND, "NOT_FOUND", "The requested endpoint was not found.", Map.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception exception) {
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "The request could not be completed.", Map.of());
    }

    private ResponseEntity<ApiErrorResponse> error(
            HttpStatus status,
            String code,
            String message,
            Map<String, String> fields) {
        String requestId = "req_" + UUID.randomUUID();
        return ResponseEntity.status(status)
                .body(new ApiErrorResponse(new ApiError(code, message, fields, requestId)));
    }
}
