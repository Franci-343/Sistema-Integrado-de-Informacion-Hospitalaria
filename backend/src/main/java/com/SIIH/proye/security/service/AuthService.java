package com.SIIH.proye.security.service;

import com.SIIH.proye.common.audit.AuditService;
import com.SIIH.proye.common.database.CodeGenerator;
import com.SIIH.proye.common.exception.ConflictException;
import com.SIIH.proye.common.exception.UnauthorizedException;
import com.SIIH.proye.security.AuthenticatedUser;
import com.SIIH.proye.security.api.AuthModels.AuthResponse;
import com.SIIH.proye.security.api.AuthModels.LoginRequest;
import com.SIIH.proye.security.api.AuthModels.RegisterRequest;
import com.SIIH.proye.security.api.AuthModels.UserResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class AuthService {

    private static final String DUMMY_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Set<String> PUBLIC_REGISTER_ROLES = Set.of(
            "RECEPTION", "DOCTOR", "NURSE", "LAB_TECHNICIAN", "PHARMACIST", "CASHIER", "DIRECTOR"
    );
    private static final Set<String> PROFESSIONAL_ROLES = Set.of("DOCTOR", "NURSE", "LAB_TECHNICIAN", "PHARMACIST");

    private final JdbcTemplate jdbcTemplate;
    private final SecurityAccountService accounts;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;
    private final int accessTokenMinutes;
    private final int refreshTokenHours;
    private final int rememberTokenDays;
    private final int maxLoginAttempts;
    private final int lockMinutes;

    public AuthService(JdbcTemplate jdbcTemplate,
                       SecurityAccountService accounts,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuditService auditService,
                       @Value("${app.security.access-token-minutes:15}") int accessTokenMinutes,
                       @Value("${app.security.refresh-token-hours:8}") int refreshTokenHours,
                       @Value("${app.security.remember-token-days:7}") int rememberTokenDays,
                       @Value("${app.security.max-login-attempts:5}") int maxLoginAttempts,
                       @Value("${app.security.lock-minutes:15}") int lockMinutes) {
        this.jdbcTemplate = jdbcTemplate;
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditService = auditService;
        this.accessTokenMinutes = accessTokenMinutes;
        this.refreshTokenHours = refreshTokenHours;
        this.rememberTokenDays = rememberTokenDays;
        this.maxLoginAttempts = maxLoginAttempts;
        this.lockMinutes = lockMinutes;
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String clientInfo) {
        var found = accounts.findCredentials(request.username());
        if (found.isEmpty()) {
            passwordEncoder.matches(request.password(), DUMMY_HASH);
            auditService.recordFailure("LOGIN", "USER", null, null, "Credenciales invalidas");
            throw new UnauthorizedException("Usuario o contrasena incorrectos.");
        }

        var account = accounts.unlockIfExpired(found.get());
        if ("INACTIVE".equals(account.status())) {
            auditService.recordFailure("LOGIN", "USER", account.id(), account.id(), "Cuenta inactiva");
            throw new UnauthorizedException("La cuenta esta inactiva. Contacta a administracion.");
        }
        if ("LOCKED".equals(account.status())) {
            auditService.recordFailure("LOGIN", "USER", account.id(), account.id(), "Cuenta bloqueada");
            throw new UnauthorizedException("La cuenta esta bloqueada temporalmente.");
        }
        if (!passwordEncoder.matches(request.password(), account.passwordHash())) {
            int attempts = accounts.recordFailedLogin(account, maxLoginAttempts, lockMinutes);
            auditService.recordFailure("LOGIN", "USER", account.id(), account.id(), "Credenciales invalidas");
            if (attempts >= maxLoginAttempts) {
                throw new UnauthorizedException("La cuenta fue bloqueada temporalmente por intentos fallidos.");
            }
            throw new UnauthorizedException("Usuario o contrasena incorrectos.");
        }

        accounts.recordSuccessfulLogin(account.id());
        jdbcTemplate.update("DELETE FROM auth_session WHERE expires_at < CURRENT_TIMESTAMP OR revoked_at < CURRENT_TIMESTAMP - INTERVAL '7 days'");
        AuthenticatedUser user = accounts.loadActive(account.id());
        Duration refreshDuration = request.remember() ? Duration.ofDays(rememberTokenDays) : Duration.ofHours(refreshTokenHours);
        AuthResponse response = createSession(user, refreshDuration, clientInfo);
        auditService.record("LOGIN", "USER", user.id(), user.id(), null, Map.of("username", user.username()));
        return response;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request, String clientInfo) {
        String role = request.role().trim().toUpperCase(Locale.ROOT);
        if (!PUBLIC_REGISTER_ROLES.contains(role)) {
            throw new ConflictException("El rol seleccionado no esta disponible para registro academico.");
        }
        String username = request.username().trim().toLowerCase(Locale.ROOT);
        try {
            UUID userId = jdbcTemplate.queryForObject("""
                    INSERT INTO app_user (username, password_hash, first_name, last_name, email, status)
                    VALUES (?, ?, ?, ?, ?, 'ACTIVE') RETURNING id
                    """, UUID.class, username, passwordEncoder.encode(request.password()),
                    request.firstName().trim(), request.lastName().trim(), clean(request.email()));
            jdbcTemplate.update("""
                    INSERT INTO user_role (user_id, role_id, assigned_by)
                    SELECT ?, id, NULL FROM role WHERE code = ? AND active
                    """, userId, role);
            if (PROFESSIONAL_ROLES.contains(role)) {
                jdbcTemplate.update("""
                        INSERT INTO professional (user_id, professional_code, license_number, professional_type, status)
                        VALUES (?, ?, ?, ?, 'ACTIVE')
                        """, userId, CodeGenerator.next("PROF"), clean(request.licenseNumber()), role);
            }
            AuthenticatedUser user = accounts.loadActive(userId);
            AuthResponse response = createSession(user, request.remember()
                    ? Duration.ofDays(rememberTokenDays)
                    : Duration.ofHours(refreshTokenHours), clientInfo);
            auditService.record("REGISTER", "USER", userId, userId, null,
                    Map.of("username", username, "role", role));
            return response;
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("El nombre de usuario, correo o matricula ya esta registrado.");
        }
    }

    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        String hash = hash(rawRefreshToken);
        SessionRow session = jdbcTemplate.query("""
                SELECT id, user_id, expires_at, revoked_at, client_info
                FROM auth_session WHERE refresh_token_hash = ? FOR UPDATE
                """, (result, row) -> new SessionRow(
                        result.getObject("id", UUID.class),
                        result.getObject("user_id", UUID.class),
                        result.getObject("expires_at", OffsetDateTime.class),
                        result.getObject("revoked_at", OffsetDateTime.class),
                        result.getString("client_info")
                ), hash).stream().findFirst().orElseThrow(() -> new UnauthorizedException("La sesion no es valida."));

        if (session.revokedAt() != null || !session.expiresAt().isAfter(OffsetDateTime.now())) {
            throw new UnauthorizedException("La sesion expiro o fue revocada.");
        }
        AuthenticatedUser user = accounts.loadActive(session.userId());
        String rotatedToken = randomToken();
        jdbcTemplate.update("""
                UPDATE auth_session SET refresh_token_hash = ?, last_used_at = CURRENT_TIMESTAMP WHERE id = ?
                """, hash(rotatedToken), session.id());
        JwtService.AccessToken access = jwtService.issue(user.id(), Duration.ofMinutes(accessTokenMinutes));
        return new AuthResponse(access.value(), rotatedToken, access.expiresAt(), session.expiresAt().toInstant(), UserResponse.from(user));
    }

    @Transactional
    public void logout(String rawRefreshToken, UUID userId) {
        jdbcTemplate.update("""
                UPDATE auth_session SET revoked_at = CURRENT_TIMESTAMP
                WHERE refresh_token_hash = ? AND user_id = ? AND revoked_at IS NULL
                """, hash(rawRefreshToken), userId);
        auditService.record("LOGOUT", "USER", userId, userId, null, null);
    }

    private AuthResponse createSession(AuthenticatedUser user, Duration refreshDuration, String clientInfo) {
        String refreshToken = randomToken();
        Instant refreshExpiresAt = Instant.now().plus(refreshDuration);
        jdbcTemplate.update("""
                INSERT INTO auth_session (user_id, refresh_token_hash, expires_at, client_info)
                VALUES (?, ?, ?, ?)
                """, user.id(), hash(refreshToken), OffsetDateTime.ofInstant(refreshExpiresAt, java.time.ZoneOffset.UTC), cleanClientInfo(clientInfo));
        JwtService.AccessToken access = jwtService.issue(user.id(), Duration.ofMinutes(accessTokenMinutes));
        return new AuthResponse(access.value(), refreshToken, access.expiresAt(), refreshExpiresAt, UserResponse.from(user));
    }

    private static String randomToken() {
        byte[] bytes = new byte[48];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 no esta disponible.", exception);
        }
    }

    private static String clean(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private static String cleanClientInfo(String value) {
        if (value == null || value.isBlank()) return null;
        String trimmed = value.trim();
        return trimmed.length() > 255 ? trimmed.substring(0, 255) : trimmed;
    }

    private record SessionRow(UUID id, UUID userId, OffsetDateTime expiresAt, OffsetDateTime revokedAt, String clientInfo) {
    }
}
