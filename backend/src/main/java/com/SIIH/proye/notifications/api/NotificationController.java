package com.SIIH.proye.notifications.api;

import com.SIIH.proye.common.exception.ResourceNotFoundException;
import com.SIIH.proye.security.AuthenticatedUser;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final JdbcTemplate jdbcTemplate;

    public NotificationController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<NotificationResponse> notifications(@AuthenticationPrincipal AuthenticatedUser user) {
        return jdbcTemplate.query("""
                SELECT id, channel, template_code, message, status, created_at, sent_at, read_at
                FROM notification WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
                """, (result, row) -> new NotificationResponse(result.getObject("id", UUID.class), result.getString("channel"),
                result.getString("template_code"), result.getString("message"), result.getString("status"),
                result.getObject("created_at", OffsetDateTime.class), result.getObject("sent_at", OffsetDateTime.class),
                result.getObject("read_at", OffsetDateTime.class)), user.id());
    }

    @PatchMapping("/{id}/read")
    @Transactional
    public NotificationResponse read(@PathVariable UUID id, @AuthenticationPrincipal AuthenticatedUser user) {
        int updated = jdbcTemplate.update("""
                UPDATE notification SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE id = ? AND user_id = ?
                """, id, user.id());
        if (updated == 0) throw new ResourceNotFoundException("No se encontro la notificacion.");
        return notifications(user).stream().filter(notification -> notification.id().equals(id)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la notificacion."));
    }

    public record NotificationResponse(UUID id, String channel, String templateCode, String message, String status,
                                       OffsetDateTime createdAt, OffsetDateTime sentAt, OffsetDateTime readAt) {
    }
}
