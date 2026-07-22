package com.SIIH.proye.security.api;

import com.SIIH.proye.security.AuthenticatedUser;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public final class AuthModels {

    private AuthModels() {
    }

    public record LoginRequest(
            @NotBlank String username,
            @NotBlank String password,
            boolean remember
    ) {
    }

    public record RegisterRequest(
            @NotBlank @Size(max = 80) String username,
            @NotBlank @Size(min = 8, max = 100) String password,
            @NotBlank @Size(max = 100) String firstName,
            @NotBlank @Size(max = 100) String lastName,
            @Email @Size(max = 255) String email,
            @NotBlank String role,
            @Size(max = 80) String licenseNumber,
            boolean remember
    ) {
    }

    public record RefreshRequest(@NotBlank String refreshToken) {
    }

    public record LogoutRequest(@NotBlank String refreshToken) {
    }

    public record UserResponse(
            UUID id,
            String username,
            String displayName,
            String email,
            String department,
            String role,
            String roleLabel,
            List<String> roles,
            Set<String> permissions
    ) {
        public static UserResponse from(AuthenticatedUser user) {
            return new UserResponse(user.id(), user.username(), user.displayName(), user.email(),
                    user.roleLabel(), user.primaryRole(), user.roleLabel(), user.roles(), user.permissions());
        }
    }

    public record AuthResponse(
            String accessToken,
            String refreshToken,
            Instant accessTokenExpiresAt,
            Instant refreshTokenExpiresAt,
            UserResponse user
    ) {
    }
}
