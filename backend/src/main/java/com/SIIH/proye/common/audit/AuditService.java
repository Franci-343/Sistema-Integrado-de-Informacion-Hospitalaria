package com.SIIH.proye.common.audit;

import com.SIIH.proye.security.AuthenticatedUser;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.Types;
import java.util.Map;
import java.util.UUID;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final JdbcTemplate jdbcTemplate;
    private final JsonMapper objectMapper;

    public AuditService(JdbcTemplate jdbcTemplate, JsonMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public void record(String action, String entityType, UUID entityId,
                       UUID userId, Map<String, Object> beforeData,
                       Map<String, Object> afterData) {
        try {
            UUID effectiveUserId = userId != null ? userId : currentUserId();
            String beforeJson = beforeData == null ? null : objectMapper.writeValueAsString(beforeData);
            String afterJson = afterData == null ? null : objectMapper.writeValueAsString(afterData);
            jdbcTemplate.update(connection -> {
                PreparedStatement statement = connection.prepareStatement("""
                        INSERT INTO audit_event (user_id, action, entity_type, entity_id, origin, success, before_data, after_data)
                        VALUES (?, ?, ?, ?, ?, TRUE, ?::jsonb, ?::jsonb)
                        """);
                statement.setObject(1, effectiveUserId);
                statement.setString(2, action);
                statement.setString(3, entityType);
                statement.setObject(4, entityId);
                statement.setString(5, "backend");
                statement.setObject(6, beforeJson, Types.VARCHAR);
                statement.setObject(7, afterJson, Types.VARCHAR);
                return statement;
            });
        } catch (JacksonException exception) {
            log.warn("No se pudo serializar la auditoria de {} {}", entityType, entityId, exception);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailure(String action, String entityType, UUID entityId, UUID userId, String reason) {
        jdbcTemplate.update("""
                INSERT INTO audit_event (user_id, action, entity_type, entity_id, origin, success, failure_reason)
                VALUES (?, ?, ?, ?, 'backend', FALSE, ?)
                """, userId, action, entityType, entityId, reason);
    }

    private UUID currentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user
                ? user.id() : null;
    }
}
