package com.SIIH.proye.security.api;

import com.SIIH.proye.security.AuthenticatedUser;
import com.SIIH.proye.security.api.AuthModels.AuthResponse;
import com.SIIH.proye.security.api.AuthModels.LoginRequest;
import com.SIIH.proye.security.api.AuthModels.LogoutRequest;
import com.SIIH.proye.security.api.AuthModels.RefreshRequest;
import com.SIIH.proye.security.api.AuthModels.RegisterRequest;
import com.SIIH.proye.security.api.AuthModels.UserResponse;
import com.SIIH.proye.security.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request,
                              @RequestHeader(value = "User-Agent", required = false) String userAgent) {
        return authService.login(request, userAgent);
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request,
                                 @RequestHeader(value = "User-Agent", required = false) String userAgent) {
        return authService.register(request, userAgent);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request.refreshToken());
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AuthenticatedUser user) {
        return UserResponse.from(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest request,
                                       @AuthenticationPrincipal AuthenticatedUser user) {
        authService.logout(request.refreshToken(), user.id());
        return ResponseEntity.noContent().build();
    }
}
