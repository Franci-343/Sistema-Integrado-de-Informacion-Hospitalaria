package com.SIIH.proye.security.service;

import com.SIIH.proye.common.exception.UnauthorizedException;
import com.SIIH.proye.security.AuthenticatedUser;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class SecurityAccountService {

    private final JdbcTemplate jdbcTemplate;

    public SecurityAccountService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<AccountCredentials> findCredentials(String username) {
        return jdbcTemplate.query("""
                SELECT id, username, password_hash, first_name, last_name, email, status,
                       failed_login_attempts, locked_until
                FROM app_user
                WHERE lower(username) = lower(?)
                """, SecurityAccountService::mapCredentials, username.trim()).stream().findFirst();
    }

    public AuthenticatedUser loadActive(UUID userId) {
        AccountCredentials account = jdbcTemplate.query("""
                SELECT id, username, password_hash, first_name, last_name, email, status,
                       failed_login_attempts, locked_until
                FROM app_user WHERE id = ?
                """, SecurityAccountService::mapCredentials, userId).stream().findFirst()
                .orElseThrow(() -> new UnauthorizedException("La cuenta ya no esta disponible."));
        if (!"ACTIVE".equals(account.status())) {
            throw new UnauthorizedException("La cuenta no esta activa.");
        }
        List<String> roles = jdbcTemplate.queryForList("""
                SELECT r.code FROM role r
                JOIN user_role ur ON ur.role_id = r.id
                WHERE ur.user_id = ? AND r.active = TRUE
                ORDER BY CASE r.code
                    WHEN 'SYSTEM_ADMIN' THEN 1 WHEN 'DIRECTOR' THEN 2 WHEN 'DOCTOR' THEN 3
                    WHEN 'NURSE' THEN 4 WHEN 'LAB_TECHNICIAN' THEN 5 WHEN 'PHARMACIST' THEN 6
                    WHEN 'CASHIER' THEN 7 ELSE 8 END
                """, String.class, userId);
        if (roles.isEmpty()) throw new UnauthorizedException("La cuenta no tiene un rol activo.");
        List<String> permissions = jdbcTemplate.queryForList("""
                SELECT DISTINCT p.code FROM permission p
                JOIN role_permission rp ON rp.permission_id = p.id
                JOIN user_role ur ON ur.role_id = rp.role_id
                JOIN role r ON r.id = ur.role_id
                WHERE ur.user_id = ? AND r.active = TRUE
                ORDER BY p.code
                """, String.class, userId);
        return new AuthenticatedUser(account.id(), account.username(), account.firstName(), account.lastName(),
                account.email(), List.copyOf(roles), new LinkedHashSet<>(permissions));
    }

    public void recordSuccessfulLogin(UUID userId) {
        jdbcTemplate.update("""
                UPDATE app_user
                SET failed_login_attempts = 0, locked_until = NULL, status = 'ACTIVE', last_login_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """, userId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int recordFailedLogin(AccountCredentials account, int maxAttempts, int lockMinutes) {
        int attempts = account.failedLoginAttempts() + 1;
        jdbcTemplate.update("""
                UPDATE app_user
                SET failed_login_attempts = ?,
                    status = CASE WHEN ? >= ? THEN 'LOCKED' ELSE status END,
                    locked_until = CASE WHEN ? >= ? THEN CURRENT_TIMESTAMP + (? * INTERVAL '1 minute') ELSE locked_until END
                WHERE id = ?
                """, attempts, attempts, maxAttempts, attempts, maxAttempts, lockMinutes, account.id());
        return attempts;
    }

    public AccountCredentials unlockIfExpired(AccountCredentials account) {
        if (!"LOCKED".equals(account.status()) || account.lockedUntil() == null
                || account.lockedUntil().isAfter(OffsetDateTime.now())) {
            return account;
        }
        jdbcTemplate.update("""
                UPDATE app_user SET status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL WHERE id = ?
                """, account.id());
        return findCredentials(account.username()).orElse(account);
    }

    private static AccountCredentials mapCredentials(ResultSet result, int row) throws SQLException {
        return new AccountCredentials(
                result.getObject("id", UUID.class),
                result.getString("username"),
                result.getString("password_hash"),
                result.getString("first_name"),
                result.getString("last_name"),
                result.getString("email"),
                result.getString("status").toUpperCase(Locale.ROOT),
                result.getInt("failed_login_attempts"),
                result.getObject("locked_until", OffsetDateTime.class)
        );
    }

    public record AccountCredentials(
            UUID id,
            String username,
            String passwordHash,
            String firstName,
            String lastName,
            String email,
            String status,
            int failedLoginAttempts,
            OffsetDateTime lockedUntil
    ) {
    }
}
