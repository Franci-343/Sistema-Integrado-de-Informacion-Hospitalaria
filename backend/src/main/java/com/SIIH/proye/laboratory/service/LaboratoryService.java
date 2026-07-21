package com.SIIH.proye.laboratory.service;

import com.SIIH.proye.common.audit.AuditService;
import com.SIIH.proye.common.database.CodeGenerator;
import com.SIIH.proye.common.exception.ConflictException;
import com.SIIH.proye.common.exception.ResourceNotFoundException;
import com.SIIH.proye.laboratory.api.LaboratoryModels.LabOrderCreateRequest;
import com.SIIH.proye.laboratory.api.LaboratoryModels.LabOrderItemResponse;
import com.SIIH.proye.laboratory.api.LaboratoryModels.LabOrderResponse;
import com.SIIH.proye.laboratory.api.LaboratoryModels.LabResultRequest;
import com.SIIH.proye.laboratory.api.LaboratoryModels.LabResultResponse;
import com.SIIH.proye.laboratory.api.LaboratoryModels.LabSampleCreateRequest;
import com.SIIH.proye.laboratory.api.LaboratoryModels.LabSampleResponse;
import com.SIIH.proye.laboratory.api.LaboratoryModels.LabSampleStatusRequest;
import com.SIIH.proye.laboratory.api.LaboratoryModels.LabTestResponse;
import com.SIIH.proye.security.AuthenticatedUser;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class LaboratoryService {

    private final JdbcTemplate jdbcTemplate;
    private final NamedParameterJdbcTemplate namedJdbcTemplate;
    private final AuditService auditService;

    public LaboratoryService(JdbcTemplate jdbcTemplate, AuditService auditService) {
        this.jdbcTemplate = jdbcTemplate;
        this.namedJdbcTemplate = new NamedParameterJdbcTemplate(jdbcTemplate);
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<LabTestResponse> tests() {
        return jdbcTemplate.query("""
                SELECT id, code, name, sample_type, unit, reference_range, price, active
                FROM lab_test_catalog ORDER BY active DESC, name
                """, (result, row) -> new LabTestResponse(result.getObject("id", UUID.class), result.getString("code"),
                result.getString("name"), result.getString("sample_type"), result.getString("unit"),
                result.getString("reference_range"), result.getBigDecimal("price"), result.getBoolean("active")));
    }

    @Transactional(readOnly = true)
    public List<LabOrderResponse> orders(UUID patientId, String status) {
        List<UUID> ids = jdbcTemplate.queryForList("""
                SELECT id FROM lab_order
                WHERE (CAST(? AS uuid) IS NULL OR patient_id = CAST(? AS uuid))
                  AND (CAST(? AS varchar) IS NULL OR status = upper(CAST(? AS varchar)))
                ORDER BY requested_at DESC LIMIT 100
                """, UUID.class, patientId, patientId, clean(status), clean(status));
        return ids.stream().map(this::order).toList();
    }

    @Transactional(readOnly = true)
    public LabOrderResponse order(UUID id) {
        LabOrderRow order = jdbcTemplate.query("""
                SELECT o.*, c.consultation_code, p.patient_code,
                       concat_ws(' ', p.first_name, p.middle_name, p.last_name, p.second_last_name) patient_name,
                       concat_ws(' ', u.first_name, u.last_name) requested_by_name
                FROM lab_order o
                JOIN consultation c ON c.id = o.consultation_id
                JOIN patient p ON p.id = o.patient_id
                JOIN professional pr ON pr.id = o.requested_by
                JOIN app_user u ON u.id = pr.user_id
                WHERE o.id = ?
                """, LaboratoryService::mapOrder, id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la orden de laboratorio."));
        List<LabOrderItemResponse> items = jdbcTemplate.query("""
                SELECT oi.id, oi.test_id, oi.status item_status, oi.observations item_observations,
                       t.code test_code, t.name test_name, t.sample_type,
                       r.id result_id, r.result_text, r.numeric_value, r.unit, r.reference_range,
                       r.observations result_observations, r.status result_status, r.recorded_at,
                       r.validated_at, r.published_at,
                       concat_ws(' ', ru.first_name, ru.last_name) recorded_by_name,
                       concat_ws(' ', vu.first_name, vu.last_name) validated_by_name
                FROM lab_order_item oi
                JOIN lab_test_catalog t ON t.id = oi.test_id
                LEFT JOIN lab_result r ON r.order_item_id = oi.id
                LEFT JOIN app_user ru ON ru.id = r.recorded_by
                LEFT JOIN app_user vu ON vu.id = r.validated_by
                WHERE oi.lab_order_id = ? ORDER BY t.name
                """, LaboratoryService::mapOrderItem, id);
        List<LabSampleResponse> samples = jdbcTemplate.query("""
                SELECT s.*, concat_ws(' ', u.first_name, u.last_name) received_by_name
                FROM lab_sample s LEFT JOIN app_user u ON u.id = s.received_by
                WHERE s.lab_order_id = ? ORDER BY COALESCE(s.received_at, s.collected_at) DESC NULLS LAST
                """, LaboratoryService::mapSample, id);
        return order.toResponse(items, samples);
    }

    @Transactional
    public LabOrderResponse createOrder(LabOrderCreateRequest request, AuthenticatedUser user) {
        LabOrderResponse existing = jdbcTemplate.queryForList(
                        "SELECT id FROM lab_order WHERE idempotency_key = ?", UUID.class, request.idempotencyKey().trim())
                .stream().findFirst().map(this::order).orElse(null);
        if (existing != null) return existing;

        ConsultationReference consultation = jdbcTemplate.query("""
                SELECT patient_id, professional_id, status FROM consultation WHERE id = ?
                """, (result, row) -> new ConsultationReference(result.getObject("patient_id", UUID.class),
                result.getObject("professional_id", UUID.class), result.getString("status")), request.consultationId())
                .stream().findFirst().orElseThrow(() -> new ResourceNotFoundException("No se encontro la consulta seleccionada."));
        if ("CANCELLED".equals(consultation.status())) throw new ConflictException("No se puede ordenar desde una consulta cancelada.");

        var testIds = new LinkedHashSet<>(request.testIds());
        List<TestPrice> tests = namedJdbcTemplate.query("""
                SELECT id, name, price FROM lab_test_catalog WHERE id IN (:ids) AND active = TRUE
                """, new MapSqlParameterSource("ids", testIds),
                (result, row) -> new TestPrice(result.getObject("id", UUID.class), result.getString("name"),
                        result.getBigDecimal("price")));
        if (tests.size() != testIds.size()) throw new ConflictException("Una o mas pruebas no existen o estan inactivas.");

        UUID id = jdbcTemplate.queryForObject("""
                INSERT INTO lab_order (order_code, consultation_id, patient_id, requested_by, clinical_notes, idempotency_key)
                VALUES (?, ?, ?, ?, ?, ?) RETURNING id
                """, UUID.class, CodeGenerator.next("LAB"), request.consultationId(), consultation.patientId(),
                consultation.professionalId(), clean(request.clinicalNotes()), request.idempotencyKey().trim());
        for (TestPrice test : tests) {
            jdbcTemplate.update("INSERT INTO lab_order_item (lab_order_id, test_id) VALUES (?, ?)", id, test.id());
            jdbcTemplate.update("""
                    INSERT INTO charge (charge_code, patient_id, lab_order_id, quantity, unit_price, registered_by)
                    VALUES (?, ?, ?, 1, ?, ?)
                    """, CodeGenerator.next("CAR"), consultation.patientId(), id, test.price(), user.id());
        }
        auditService.record("CREATE", "LAB_ORDER", id, user.id(), null,
                Map.of("consultationId", request.consultationId().toString(), "testCount", tests.size()));
        return order(id);
    }

    @Transactional
    public LabSampleResponse receiveSample(UUID orderId, LabSampleCreateRequest request, AuthenticatedUser user) {
        String status = lockOrder(orderId);
        if (List.of("REJECTED", "PUBLISHED", "CANCELLED").contains(status)) {
            throw new ConflictException("La orden no puede recibir muestras en su estado actual.");
        }
        UUID id = jdbcTemplate.queryForObject("""
                INSERT INTO lab_sample (lab_order_id, sample_code, sample_type, status, collected_at, received_at, received_by)
                VALUES (?, ?, ?, 'RECEIVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?) RETURNING id
                """, UUID.class, orderId, CodeGenerator.next("MUE"), request.sampleType().trim(), user.id());
        jdbcTemplate.update("UPDATE lab_order SET status = 'RECEIVED' WHERE id = ? AND status = 'REQUESTED'", orderId);
        auditService.record("RECEIVE_SAMPLE", "LAB_SAMPLE", id, user.id(), null, Map.of("orderId", orderId.toString()));
        return sample(id);
    }

    @Transactional
    public LabSampleResponse updateSample(UUID orderId, UUID sampleId, LabSampleStatusRequest request, AuthenticatedUser user) {
        lockOrder(orderId);
        if (request.status().name().equals("REJECTED") && (request.rejectionReason() == null || request.rejectionReason().isBlank())) {
            throw new ConflictException("Debes indicar el motivo de rechazo de la muestra.");
        }
        int updated = jdbcTemplate.update("""
                UPDATE lab_sample SET status = ?,
                    rejected_at = CASE WHEN ? = 'REJECTED' THEN CURRENT_TIMESTAMP ELSE NULL END,
                    rejection_reason = CASE WHEN ? = 'REJECTED' THEN ? ELSE NULL END
                WHERE id = ? AND lab_order_id = ?
                """, request.status().name(), request.status().name(), request.status().name(),
                clean(request.rejectionReason()), sampleId, orderId);
        if (updated == 0) throw new ResourceNotFoundException("No se encontro la muestra.");
        if (request.status().name().equals("REJECTED")) {
            jdbcTemplate.update("UPDATE lab_order SET status = 'REJECTED' WHERE id = ?", orderId);
        } else if (request.status().name().equals("IN_PROCESS")) {
            jdbcTemplate.update("UPDATE lab_order SET status = 'IN_PROCESS' WHERE id = ?", orderId);
        }
        auditService.record("UPDATE_STATUS", "LAB_SAMPLE", sampleId, user.id(), null,
                Map.of("status", request.status().name()));
        return sample(sampleId);
    }

    @Transactional
    public LabResultResponse saveResult(LabResultRequest request, AuthenticatedUser user) {
        if ((request.resultText() == null || request.resultText().isBlank()) && request.numericValue() == null) {
            throw new ConflictException("Registra un resultado numerico o textual.");
        }
        ResultReference reference = jdbcTemplate.query("""
                SELECT oi.lab_order_id, t.unit, t.reference_range
                FROM lab_order_item oi JOIN lab_test_catalog t ON t.id = oi.test_id
                WHERE oi.id = ?
                """, (result, row) -> new ResultReference(result.getObject("lab_order_id", UUID.class),
                result.getString("unit"), result.getString("reference_range")), request.orderItemId()).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el examen de la orden."));
        String orderStatus = lockOrder(reference.orderId());
        if (List.of("REJECTED", "PUBLISHED", "CANCELLED").contains(orderStatus)) {
            throw new ConflictException("La orden no admite nuevos resultados.");
        }
        UUID existingId = jdbcTemplate.queryForList("SELECT id FROM lab_result WHERE order_item_id = ? FOR UPDATE",
                UUID.class, request.orderItemId()).stream().findFirst().orElse(null);
        UUID id;
        if (existingId == null) {
            id = jdbcTemplate.queryForObject("""
                    INSERT INTO lab_result (order_item_id, result_text, numeric_value, unit, reference_range,
                        observations, status, recorded_by)
                    VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', ?) RETURNING id
                    """, UUID.class, request.orderItemId(), clean(request.resultText()), request.numericValue(),
                    firstNonBlank(request.unit(), reference.unit()), firstNonBlank(request.referenceRange(), reference.referenceRange()),
                    clean(request.observations()), user.id());
        } else {
            String resultStatus = jdbcTemplate.queryForObject("SELECT status FROM lab_result WHERE id = ?", String.class, existingId);
            if (!"DRAFT".equals(resultStatus)) throw new ConflictException("Un resultado validado no puede sobrescribirse.");
            jdbcTemplate.update("""
                    UPDATE lab_result SET result_text = ?, numeric_value = ?, unit = ?, reference_range = ?,
                        observations = ?, recorded_by = ?, recorded_at = CURRENT_TIMESTAMP, version = version + 1
                    WHERE id = ?
                    """, clean(request.resultText()), request.numericValue(), firstNonBlank(request.unit(), reference.unit()),
                    firstNonBlank(request.referenceRange(), reference.referenceRange()), clean(request.observations()), user.id(), existingId);
            id = existingId;
        }
        jdbcTemplate.update("UPDATE lab_order_item SET status = 'IN_PROCESS' WHERE id = ?", request.orderItemId());
        jdbcTemplate.update("UPDATE lab_order SET status = 'IN_PROCESS' WHERE id = ?", reference.orderId());
        auditService.record(existingId == null ? "CREATE" : "UPDATE", "LAB_RESULT", id, user.id(), null,
                Map.of("orderItemId", request.orderItemId().toString()));
        return result(id);
    }

    @Transactional
    public LabResultResponse validateResult(UUID id, AuthenticatedUser user) {
        ResultState state = lockResult(id);
        if (!"DRAFT".equals(state.status())) throw new ConflictException("Solo se pueden validar resultados en borrador.");
        jdbcTemplate.update("""
                UPDATE lab_result SET status = 'VALIDATED', validated_by = ?, validated_at = CURRENT_TIMESTAMP,
                    version = version + 1 WHERE id = ?
                """, user.id(), id);
        jdbcTemplate.update("UPDATE lab_order_item SET status = 'VALIDATED' WHERE id = ?", state.orderItemId());
        if (!Boolean.TRUE.equals(jdbcTemplate.queryForObject("""
                SELECT EXISTS(SELECT 1 FROM lab_order_item WHERE lab_order_id = ? AND status <> 'VALIDATED')
                """, Boolean.class, state.orderId()))) {
            jdbcTemplate.update("UPDATE lab_order SET status = 'VALIDATED', validated_at = CURRENT_TIMESTAMP WHERE id = ?", state.orderId());
        }
        auditService.record("VALIDATE", "LAB_RESULT", id, user.id(), Map.of("status", "DRAFT"), Map.of("status", "VALIDATED"));
        return result(id);
    }

    @Transactional
    public LabResultResponse publishResult(UUID id, AuthenticatedUser user) {
        ResultState state = lockResult(id);
        if (!"VALIDATED".equals(state.status())) throw new ConflictException("El resultado debe estar validado antes de publicarse.");
        jdbcTemplate.update("UPDATE lab_result SET status = 'PUBLISHED', published_at = CURRENT_TIMESTAMP WHERE id = ?", id);
        jdbcTemplate.update("UPDATE lab_order_item SET status = 'PUBLISHED' WHERE id = ?", state.orderItemId());
        if (!Boolean.TRUE.equals(jdbcTemplate.queryForObject("""
                SELECT EXISTS(SELECT 1 FROM lab_order_item WHERE lab_order_id = ? AND status <> 'PUBLISHED')
                """, Boolean.class, state.orderId()))) {
            jdbcTemplate.update("UPDATE lab_order SET status = 'PUBLISHED', published_at = CURRENT_TIMESTAMP WHERE id = ?", state.orderId());
            jdbcTemplate.update("""
                    INSERT INTO notification (user_id, channel, template_code, message, consent_required,
                        consent_granted, status, sent_at)
                    SELECT pr.user_id, 'IN_APP', 'LAB_RESULT_READY',
                           'Los resultados de la orden ' || o.order_code || ' estan disponibles.',
                           FALSE, TRUE, 'SENT', CURRENT_TIMESTAMP
                    FROM lab_order o JOIN professional pr ON pr.id = o.requested_by WHERE o.id = ?
                    """, state.orderId());
        }
        auditService.record("PUBLISH", "LAB_RESULT", id, user.id(), Map.of("status", "VALIDATED"), Map.of("status", "PUBLISHED"));
        return result(id);
    }

    @Transactional(readOnly = true)
    public LabResultResponse result(UUID id) {
        return jdbcTemplate.query("""
                SELECT r.*, concat_ws(' ', ru.first_name, ru.last_name) recorded_by_name,
                       concat_ws(' ', vu.first_name, vu.last_name) validated_by_name
                FROM lab_result r
                LEFT JOIN app_user ru ON ru.id = r.recorded_by
                LEFT JOIN app_user vu ON vu.id = r.validated_by WHERE r.id = ?
                """, LaboratoryService::mapResult, id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el resultado."));
    }

    private String lockOrder(UUID id) {
        return jdbcTemplate.query("SELECT status FROM lab_order WHERE id = ? FOR UPDATE",
                (result, row) -> result.getString(1), id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la orden de laboratorio."));
    }

    private ResultState lockResult(UUID id) {
        return jdbcTemplate.query("""
                SELECT r.status, r.order_item_id, oi.lab_order_id
                FROM lab_result r JOIN lab_order_item oi ON oi.id = r.order_item_id
                WHERE r.id = ? FOR UPDATE OF r
                """, (result, row) -> new ResultState(result.getString("status"),
                result.getObject("order_item_id", UUID.class), result.getObject("lab_order_id", UUID.class)), id)
                .stream().findFirst().orElseThrow(() -> new ResourceNotFoundException("No se encontro el resultado."));
    }

    private LabSampleResponse sample(UUID id) {
        return jdbcTemplate.query("""
                SELECT s.*, concat_ws(' ', u.first_name, u.last_name) received_by_name
                FROM lab_sample s LEFT JOIN app_user u ON u.id = s.received_by WHERE s.id = ?
                """, LaboratoryService::mapSample, id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la muestra."));
    }

    private static LabOrderRow mapOrder(ResultSet result, int row) throws SQLException {
        return new LabOrderRow(result.getObject("id", UUID.class), result.getString("order_code"),
                result.getObject("consultation_id", UUID.class), result.getString("consultation_code"),
                result.getObject("patient_id", UUID.class), result.getString("patient_code"), result.getString("patient_name"),
                result.getString("requested_by_name"), result.getString("status"), result.getString("clinical_notes"),
                result.getObject("requested_at", OffsetDateTime.class));
    }

    private static LabOrderItemResponse mapOrderItem(ResultSet result, int row) throws SQLException {
        UUID resultId = result.getObject("result_id", UUID.class);
        LabResultResponse labResult = resultId == null ? null : new LabResultResponse(resultId,
                result.getObject("id", UUID.class), result.getString("result_text"), result.getBigDecimal("numeric_value"),
                result.getString("unit"), result.getString("reference_range"), result.getString("result_observations"),
                result.getString("result_status"), result.getString("recorded_by_name"), result.getString("validated_by_name"),
                result.getObject("recorded_at", OffsetDateTime.class), result.getObject("validated_at", OffsetDateTime.class),
                result.getObject("published_at", OffsetDateTime.class));
        return new LabOrderItemResponse(result.getObject("id", UUID.class), result.getObject("test_id", UUID.class),
                result.getString("test_code"), result.getString("test_name"), result.getString("sample_type"),
                result.getString("item_status"), result.getString("item_observations"), labResult);
    }

    private static LabSampleResponse mapSample(ResultSet result, int row) throws SQLException {
        return new LabSampleResponse(result.getObject("id", UUID.class), result.getString("sample_code"),
                result.getString("sample_type"), result.getString("status"), result.getObject("collected_at", OffsetDateTime.class),
                result.getObject("received_at", OffsetDateTime.class), result.getString("rejection_reason"),
                result.getString("received_by_name"));
    }

    private static LabResultResponse mapResult(ResultSet result, int row) throws SQLException {
        return new LabResultResponse(result.getObject("id", UUID.class), result.getObject("order_item_id", UUID.class),
                result.getString("result_text"), result.getBigDecimal("numeric_value"), result.getString("unit"),
                result.getString("reference_range"), result.getString("observations"), result.getString("status"),
                result.getString("recorded_by_name"), result.getString("validated_by_name"),
                result.getObject("recorded_at", OffsetDateTime.class), result.getObject("validated_at", OffsetDateTime.class),
                result.getObject("published_at", OffsetDateTime.class));
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String firstNonBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private record ConsultationReference(UUID patientId, UUID professionalId, String status) {
    }

    private record TestPrice(UUID id, String name, BigDecimal price) {
    }

    private record ResultReference(UUID orderId, String unit, String referenceRange) {
    }

    private record ResultState(String status, UUID orderItemId, UUID orderId) {
    }

    private record LabOrderRow(UUID id, String code, UUID consultationId, String consultationCode,
                               UUID patientId, String patientCode, String patientName, String requestedBy,
                               String status, String clinicalNotes, OffsetDateTime requestedAt) {
        LabOrderResponse toResponse(List<LabOrderItemResponse> items, List<LabSampleResponse> samples) {
            return new LabOrderResponse(id, code, consultationId, consultationCode, patientId, patientCode,
                    patientName, requestedBy, status, clinicalNotes, requestedAt, items, samples);
        }
    }
}
