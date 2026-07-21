package com.SIIH.proye.common.api;

import com.SIIH.proye.common.exception.ConflictException;
import com.SIIH.proye.common.exception.ResourceNotFoundException;
import com.SIIH.proye.common.exception.UnauthorizedException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiError> handleUnauthorized(UnauthorizedException exception) {
        return response(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", exception.getMessage(), Map.of());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException exception) {
        return response(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", exception.getMessage(), Map.of());
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiError> handleConflict(ConflictException exception) {
        return response(HttpStatus.CONFLICT, "CONFLICT", exception.getMessage(), Map.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception) {
        Map<String, String> details = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors()
                .forEach(error -> details.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return response(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Revisa los datos enviados.", details);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException exception) {
        return response(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", exception.getMessage(), Map.of());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleMalformedBody(HttpMessageNotReadableException exception) {
        return response(HttpStatus.BAD_REQUEST, "MALFORMED_REQUEST", "El cuerpo de la solicitud no tiene un formato valido.", Map.of());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrity(DataIntegrityViolationException exception) {
        return response(HttpStatus.CONFLICT, "DATA_INTEGRITY_ERROR", "La operacion infringe una regla de integridad.", Map.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception exception) {
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Ocurrio un error interno.", Map.of());
    }

    private ResponseEntity<ApiError> response(HttpStatus status, String code, String message, Map<String, String> details) {
        String traceId = UUID.randomUUID().toString();
        return ResponseEntity.status(status).body(new ApiError(Instant.now(), code, message, traceId, details));
    }
}
