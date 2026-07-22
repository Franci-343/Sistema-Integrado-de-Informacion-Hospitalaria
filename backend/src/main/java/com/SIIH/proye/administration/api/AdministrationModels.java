package com.SIIH.proye.administration.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public final class AdministrationModels {

    private AdministrationModels() {
    }

    public record UserCreateRequest(
            @NotBlank @Size(max = 80) String username,
            @NotBlank @Size(min = 8, max = 100) String password,
            @NotBlank @Size(max = 100) String firstName,
            @NotBlank @Size(max = 100) String lastName,
            @Email @Size(max = 255) String email,
            @NotEmpty Set<String> roleCodes
    ) {
    }

    public record ProfessionalCreateRequest(
            @NotBlank @Size(max = 80) String username,
            @NotBlank @Size(min = 8, max = 100) String password,
            @NotBlank @Size(max = 100) String firstName,
            @NotBlank @Size(max = 100) String lastName,
            @Email @Size(max = 255) String email,
            @NotBlank @Size(max = 80) String licenseNumber,
            @NotBlank @Size(max = 30) String professionalType,
            @NotEmpty Set<UUID> specialtyIds
    ) {
    }

    public record UserUpdateRequest(
            @NotBlank @Size(max = 100) String firstName,
            @NotBlank @Size(max = 100) String lastName,
            @Email @Size(max = 255) String email,
            @Size(min = 8, max = 100) String newPassword
    ) {
    }

    public enum UserStatus { ACTIVE, INACTIVE, LOCKED }

    public record UserStatusRequest(@NotNull UserStatus status) {
    }

    public record UserRolesRequest(@NotEmpty Set<String> roleCodes) {
    }

    public record UserResponse(
            UUID id,
            String username,
            String firstName,
            String lastName,
            String displayName,
            String email,
            String status,
            int failedLoginAttempts,
            OffsetDateTime lockedUntil,
            OffsetDateTime lastLoginAt,
            OffsetDateTime createdAt,
            List<String> roles,
            List<String> permissions
    ) {
    }

    public record RoleResponse(
            UUID id,
            String code,
            String name,
            String description,
            boolean active,
            List<String> permissions
    ) {
    }

    public record PermissionResponse(UUID id, String code, String name, String description) {
    }

    public record ProfessionalAdminResponse(
            UUID id,
            UUID userId,
            String username,
            String displayName,
            String professionalCode,
            String licenseNumber,
            String professionalType,
            String status,
            List<String> specialties
    ) {
    }

    public record AuditEventResponse(
            UUID id,
            UUID userId,
            String username,
            String action,
            String entityType,
            UUID entityId,
            String origin,
            boolean success,
            String failureReason,
            OffsetDateTime eventAt
    ) {
    }
}
