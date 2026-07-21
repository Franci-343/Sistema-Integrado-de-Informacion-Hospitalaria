package com.SIIH.proye.administration.service;

import com.SIIH.proye.administration.api.AdministrationModels.AuditEventResponse;
import com.SIIH.proye.administration.api.AdministrationModels.PermissionResponse;
import com.SIIH.proye.administration.api.AdministrationModels.RoleResponse;
import com.SIIH.proye.administration.api.AdministrationModels.UserCreateRequest;
import com.SIIH.proye.administration.api.AdministrationModels.UserResponse;
import com.SIIH.proye.administration.api.AdministrationModels.UserRolesRequest;
import com.SIIH.proye.administration.api.AdministrationModels.UserStatusRequest;
import com.SIIH.proye.administration.api.AdministrationModels.UserStatus;
import com.SIIH.proye.administration.api.AdministrationModels.UserUpdateRequest;
import com.SIIH.proye.common.audit.AuditService;
import com.SIIH.proye.common.exception.ConflictException;
import com.SIIH.proye.common.exception.ResourceNotFoundException;
import com.SIIH.proye.security.AuthenticatedUser;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class AdministrationService {

    private final JdbcTemplate jdbcTemplate;
    private final NamedParameterJdbcTemplate namedJdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public AdministrationService(JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder, AuditService auditService) {
        this.jdbcTemplate = jdbcTemplate;
        this.namedJdbcTemplate = new NamedParameterJdbcTemplate(jdbcTemplate);
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> users(String search, String status) {
        List<UUID> ids = jdbcTemplate.queryForList("""
                SELECT id FROM app_user
                WHERE (CAST(? AS varchar) IS NULL OR lower(username) LIKE '%' || lower(CAST(? AS varchar)) || '%'
                    OR lower(first_name || ' ' || last_name) LIKE '%' || lower(CAST(? AS varchar)) || '%')
                  AND (CAST(? AS varchar) IS NULL OR status = upper(CAST(? AS varchar)))
                ORDER BY last_name, first_name LIMIT 200
                """, UUID.class, clean(search), clean(search), clean(search), clean(status), clean(status));
        return ids.stream().map(this::user).toList();
    }

    @Transactional(readOnly = true)
    public UserResponse user(UUID id) {
        UserRow row = jdbcTemplate.query("""
                SELECT id, username, first_name, last_name, email, status, failed_login_attempts,
                       locked_until, last_login_at, created_at FROM app_user WHERE id = ?
                """, AdministrationService::mapUser, id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el usuario."));
        List<String> roles = jdbcTemplate.queryForList("""
                SELECT r.code FROM role r JOIN user_role ur ON ur.role_id = r.id
                WHERE ur.user_id = ? ORDER BY r.code
                """, String.class, id);
        List<String> permissions = jdbcTemplate.queryForList("""
                SELECT DISTINCT p.code FROM permission p
                JOIN role_permission rp ON rp.permission_id = p.id
                JOIN user_role ur ON ur.role_id = rp.role_id
                WHERE ur.user_id = ? ORDER BY p.code
                """, String.class, id);
        return row.toResponse(roles, permissions);
    }

    @Transactional
    public UserResponse createUser(UserCreateRequest request, AuthenticatedUser actor) {
        Set<String> roles = normalizeRoles(request.roleCodes());
        requireRoles(roles);
        try {
            UUID id = jdbcTemplate.queryForObject("""
                    INSERT INTO app_user (username, password_hash, first_name, last_name, email, status)
                    VALUES (?, ?, ?, ?, ?, 'ACTIVE') RETURNING id
                    """, UUID.class, request.username().trim().toLowerCase(Locale.ROOT), passwordEncoder.encode(request.password()),
                    request.firstName().trim(), request.lastName().trim(), clean(request.email()));
            replaceRoles(id, roles, actor.id());
            auditService.record("CREATE", "USER", id, actor.id(), null,
                    Map.of("username", request.username().trim().toLowerCase(Locale.ROOT), "roles", roles));
            return user(id);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("El nombre de usuario o correo ya esta registrado.");
        }
    }

    @Transactional
    public UserResponse updateUser(UUID id, UserUpdateRequest request, AuthenticatedUser actor) {
        UserResponse before = user(id);
        if (request.newPassword() == null || request.newPassword().isBlank()) {
            jdbcTemplate.update("""
                    UPDATE app_user SET first_name = ?, last_name = ?, email = ? WHERE id = ?
                    """, request.firstName().trim(), request.lastName().trim(), clean(request.email()), id);
        } else {
            jdbcTemplate.update("""
                    UPDATE app_user SET first_name = ?, last_name = ?, email = ?, password_hash = ? WHERE id = ?
                    """, request.firstName().trim(), request.lastName().trim(), clean(request.email()),
                    passwordEncoder.encode(request.newPassword()), id);
            jdbcTemplate.update("UPDATE auth_session SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL", id);
        }
        auditService.record("UPDATE", "USER", id, actor.id(),
                Map.of("displayName", before.displayName()),
                Map.of("displayName", request.firstName().trim() + " " + request.lastName().trim()));
        return user(id);
    }

    @Transactional
    public UserResponse updateStatus(UUID id, UserStatusRequest request, AuthenticatedUser actor) {
        UserResponse before = user(id);
        if (id.equals(actor.id()) && request.status() != UserStatus.ACTIVE) {
            throw new ConflictException("No puedes bloquear o desactivar tu propia cuenta.");
        }
        jdbcTemplate.update("""
                UPDATE app_user SET status = ?, failed_login_attempts = CASE WHEN ? = 'ACTIVE' THEN 0 ELSE failed_login_attempts END,
                    locked_until = CASE WHEN ? = 'LOCKED' THEN CURRENT_TIMESTAMP + INTERVAL '15 minutes' ELSE NULL END
                WHERE id = ?
                """, request.status().name(), request.status().name(), request.status().name(), id);
        if (!"ACTIVE".equals(request.status().name())) {
            jdbcTemplate.update("UPDATE auth_session SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL", id);
        }
        auditService.record("UPDATE_STATUS", "USER", id, actor.id(), Map.of("status", before.status()),
                Map.of("status", request.status().name()));
        return user(id);
    }

    @Transactional
    public UserResponse updateRoles(UUID id, UserRolesRequest request, AuthenticatedUser actor) {
        UserResponse before = user(id);
        Set<String> roles = normalizeRoles(request.roleCodes());
        requireRoles(roles);
        if (id.equals(actor.id()) && before.roles().contains("SYSTEM_ADMIN") && !roles.contains("SYSTEM_ADMIN")) {
            throw new ConflictException("No puedes quitarte tu propio rol de administrador.");
        }
        replaceRoles(id, roles, actor.id());
        jdbcTemplate.update("UPDATE auth_session SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL", id);
        auditService.record("UPDATE_ROLES", "USER", id, actor.id(), Map.of("roles", before.roles()), Map.of("roles", roles));
        return user(id);
    }

    @Transactional(readOnly = true)
    public List<RoleResponse> roles() {
        return jdbcTemplate.query("""
                SELECT id, code, name, description, active FROM role ORDER BY name
                """, (result, row) -> {
            UUID id = result.getObject("id", UUID.class);
            List<String> permissions = jdbcTemplate.queryForList("""
                    SELECT p.code FROM permission p JOIN role_permission rp ON rp.permission_id = p.id
                    WHERE rp.role_id = ? ORDER BY p.code
                    """, String.class, id);
            return new RoleResponse(id, result.getString("code"), result.getString("name"), result.getString("description"),
                    result.getBoolean("active"), permissions);
        });
    }

    @Transactional(readOnly = true)
    public List<PermissionResponse> permissions() {
        return jdbcTemplate.query("""
                SELECT id, code, name, description FROM permission ORDER BY code
                """, (result, row) -> new PermissionResponse(result.getObject("id", UUID.class), result.getString("code"),
                result.getString("name"), result.getString("description")));
    }

    @Transactional(readOnly = true)
    public List<AuditEventResponse> audit(String username, String action, String entityType,
                                          OffsetDateTime from, OffsetDateTime to) {
        return jdbcTemplate.query("""
                SELECT ae.*, u.username FROM audit_event ae LEFT JOIN app_user u ON u.id = ae.user_id
                WHERE (CAST(? AS varchar) IS NULL OR lower(u.username) = lower(CAST(? AS varchar)))
                  AND (CAST(? AS varchar) IS NULL OR ae.action = upper(CAST(? AS varchar)))
                  AND (CAST(? AS varchar) IS NULL OR ae.entity_type = upper(CAST(? AS varchar)))
                  AND (CAST(? AS timestamptz) IS NULL OR ae.event_at >= CAST(? AS timestamptz))
                  AND (CAST(? AS timestamptz) IS NULL OR ae.event_at <= CAST(? AS timestamptz))
                ORDER BY ae.event_at DESC LIMIT 500
                """, (result, row) -> new AuditEventResponse(result.getObject("id", UUID.class),
                result.getObject("user_id", UUID.class), result.getString("username"), result.getString("action"),
                result.getString("entity_type"), result.getObject("entity_id", UUID.class), result.getString("origin"),
                result.getBoolean("success"), result.getString("failure_reason"),
                result.getObject("event_at", OffsetDateTime.class)), clean(username), clean(username), clean(action), clean(action),
                clean(entityType), clean(entityType), from, from, to, to);
    }

    private void replaceRoles(UUID userId, Set<String> roles, UUID actorId) {
        jdbcTemplate.update("DELETE FROM user_role WHERE user_id = ?", userId);
        for (String role : roles) {
            jdbcTemplate.update("""
                    INSERT INTO user_role (user_id, role_id, assigned_by)
                    SELECT ?, id, ? FROM role WHERE code = ? AND active
                    """, userId, actorId, role);
        }
    }

    private void requireRoles(Set<String> roles) {
        int count = namedJdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM role WHERE code IN (:codes) AND active
                """, new MapSqlParameterSource("codes", roles), Integer.class);
        if (count != roles.size()) throw new ConflictException("Uno o mas roles no existen o estan inactivos.");
    }

    private static Set<String> normalizeRoles(Set<String> roles) {
        return roles.stream().map(value -> value.trim().toUpperCase(Locale.ROOT))
                .collect(java.util.stream.Collectors.toCollection(java.util.LinkedHashSet::new));
    }

    private static UserRow mapUser(ResultSet result, int row) throws SQLException {
        return new UserRow(result.getObject("id", UUID.class), result.getString("username"), result.getString("first_name"),
                result.getString("last_name"), result.getString("email"), result.getString("status"),
                result.getInt("failed_login_attempts"), result.getObject("locked_until", OffsetDateTime.class),
                result.getObject("last_login_at", OffsetDateTime.class), result.getObject("created_at", OffsetDateTime.class));
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record UserRow(UUID id, String username, String firstName, String lastName, String email, String status,
                           int failedAttempts, OffsetDateTime lockedUntil, OffsetDateTime lastLoginAt,
                           OffsetDateTime createdAt) {
        UserResponse toResponse(List<String> roles, List<String> permissions) {
            return new UserResponse(id, username, firstName, lastName, firstName + " " + lastName, email, status,
                    failedAttempts, lockedUntil, lastLoginAt, createdAt, roles, permissions);
        }
    }
}
