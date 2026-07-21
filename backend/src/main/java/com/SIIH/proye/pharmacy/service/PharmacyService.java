package com.SIIH.proye.pharmacy.service;

import com.SIIH.proye.common.audit.AuditService;
import com.SIIH.proye.common.database.CodeGenerator;
import com.SIIH.proye.common.exception.ConflictException;
import com.SIIH.proye.common.exception.ResourceNotFoundException;
import com.SIIH.proye.pharmacy.api.PharmacyModels.DispensationCreateRequest;
import com.SIIH.proye.pharmacy.api.PharmacyModels.DispensationItemRequest;
import com.SIIH.proye.pharmacy.api.PharmacyModels.DispensationItemResponse;
import com.SIIH.proye.pharmacy.api.PharmacyModels.DispensationResponse;
import com.SIIH.proye.pharmacy.api.PharmacyModels.PrescriptionCreateRequest;
import com.SIIH.proye.pharmacy.api.PharmacyModels.PrescriptionItemResponse;
import com.SIIH.proye.pharmacy.api.PharmacyModels.PrescriptionResponse;
import com.SIIH.proye.security.AuthenticatedUser;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PharmacyService {

    private final JdbcTemplate jdbcTemplate;
    private final NamedParameterJdbcTemplate namedJdbcTemplate;
    private final AuditService auditService;

    public PharmacyService(JdbcTemplate jdbcTemplate, AuditService auditService) {
        this.jdbcTemplate = jdbcTemplate;
        this.namedJdbcTemplate = new NamedParameterJdbcTemplate(jdbcTemplate);
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> prescriptions(UUID patientId, String status) {
        List<UUID> ids = jdbcTemplate.queryForList("""
                SELECT id FROM prescription
                WHERE (CAST(? AS uuid) IS NULL OR patient_id = CAST(? AS uuid))
                  AND (CAST(? AS varchar) IS NULL OR status = upper(CAST(? AS varchar)))
                ORDER BY created_at DESC LIMIT 100
                """, UUID.class, patientId, patientId, clean(status), clean(status));
        return ids.stream().map(this::prescription).toList();
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse prescription(UUID id) {
        PrescriptionRow row = jdbcTemplate.query("""
                SELECT pr.*, c.consultation_code, p.patient_code,
                       concat_ws(' ', p.first_name, p.middle_name, p.last_name, p.second_last_name) patient_name,
                       concat_ws(' ', u.first_name, u.last_name) prescriber_name
                FROM prescription pr
                JOIN consultation c ON c.id = pr.consultation_id
                JOIN patient p ON p.id = pr.patient_id
                JOIN professional prof ON prof.id = pr.prescriber_id
                JOIN app_user u ON u.id = prof.user_id WHERE pr.id = ?
                """, PharmacyService::mapPrescription, id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la receta."));
        List<PrescriptionItemResponse> items = jdbcTemplate.query("""
                SELECT pi.*, m.code medication_code, m.generic_name medication_name, m.presentation
                FROM prescription_item pi JOIN medication m ON m.id = pi.medication_id
                WHERE pi.prescription_id = ? ORDER BY m.generic_name
                """, PharmacyService::mapPrescriptionItem, id);
        return row.toResponse(items);
    }

    @Transactional
    public PrescriptionResponse createPrescription(PrescriptionCreateRequest request, AuthenticatedUser user) {
        UUID existing = jdbcTemplate.queryForList("SELECT id FROM prescription WHERE idempotency_key = ?",
                UUID.class, request.idempotencyKey().trim()).stream().findFirst().orElse(null);
        if (existing != null) return prescription(existing);

        ConsultationReference consultation = jdbcTemplate.query("""
                SELECT patient_id, professional_id, status FROM consultation WHERE id = ?
                """, (result, row) -> new ConsultationReference(result.getObject("patient_id", UUID.class),
                result.getObject("professional_id", UUID.class), result.getString("status")), request.consultationId())
                .stream().findFirst().orElseThrow(() -> new ResourceNotFoundException("No se encontro la consulta."));
        if ("CANCELLED".equals(consultation.status())) throw new ConflictException("No se puede recetar desde una consulta cancelada.");

        var medicationIds = new LinkedHashSet<>(request.items().stream().map(item -> item.medicationId()).toList());
        List<UUID> activeIds = namedJdbcTemplate.queryForList("""
                SELECT id FROM medication WHERE id IN (:ids) AND active = TRUE
                """, new MapSqlParameterSource("ids", medicationIds), UUID.class);
        if (activeIds.size() != medicationIds.size()) {
            throw new ConflictException("Uno o mas medicamentos no existen o estan inactivos.");
        }

        LocalDate validUntil = request.validUntil() == null ? LocalDate.now().plusDays(30) : request.validUntil();
        UUID id = jdbcTemplate.queryForObject("""
                INSERT INTO prescription (prescription_code, consultation_id, patient_id, prescriber_id,
                    valid_until, status, notes, idempotency_key)
                VALUES (?, ?, ?, ?, ?, 'ISSUED', ?, ?) RETURNING id
                """, UUID.class, CodeGenerator.next("REC"), request.consultationId(), consultation.patientId(),
                consultation.professionalId(), validUntil, clean(request.notes()), request.idempotencyKey().trim());
        for (var item : request.items()) {
            jdbcTemplate.update("""
                    INSERT INTO prescription_item (prescription_id, medication_id, dose, route, frequency,
                        duration, quantity_prescribed, instructions)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, id, item.medicationId(), item.dose().trim(), item.route().trim(), item.frequency().trim(),
                    item.duration().trim(), item.quantity(), item.instructions().trim());
        }
        auditService.record("CREATE", "PRESCRIPTION", id, user.id(), null,
                Map.of("consultationId", request.consultationId().toString(), "itemCount", request.items().size()));
        return prescription(id);
    }

    @Transactional(readOnly = true)
    public List<DispensationResponse> dispensations(UUID patientId) {
        List<UUID> ids = jdbcTemplate.queryForList("""
                SELECT id FROM dispensation
                WHERE (CAST(? AS uuid) IS NULL OR patient_id = CAST(? AS uuid))
                ORDER BY dispensed_at DESC LIMIT 100
                """, UUID.class, patientId, patientId);
        return ids.stream().map(this::dispensation).toList();
    }

    @Transactional(readOnly = true)
    public DispensationResponse dispensation(UUID id) {
        DispensationRow row = jdbcTemplate.query("""
                SELECT d.*, pr.prescription_code, p.patient_code,
                       concat_ws(' ', p.first_name, p.middle_name, p.last_name, p.second_last_name) patient_name,
                       concat_ws(' ', u.first_name, u.last_name) pharmacist_name
                FROM dispensation d JOIN prescription pr ON pr.id = d.prescription_id
                JOIN patient p ON p.id = d.patient_id
                LEFT JOIN professional prof ON prof.id = d.pharmacist_id
                LEFT JOIN app_user u ON u.id = prof.user_id WHERE d.id = ?
                """, PharmacyService::mapDispensation, id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la dispensacion."));
        List<DispensationItemResponse> items = jdbcTemplate.query("""
                SELECT di.*, m.generic_name medication_name, b.batch_code
                FROM dispensation_item di
                JOIN prescription_item pi ON pi.id = di.prescription_item_id
                JOIN medication m ON m.id = pi.medication_id
                JOIN medication_batch b ON b.id = di.batch_id
                WHERE di.dispensation_id = ? ORDER BY m.generic_name
                """, (result, number) -> new DispensationItemResponse(result.getObject("id", UUID.class),
                result.getObject("prescription_item_id", UUID.class), result.getString("medication_name"),
                result.getObject("batch_id", UUID.class), result.getString("batch_code"), result.getBigDecimal("quantity"),
                result.getBigDecimal("unit_price")), id);
        return row.toResponse(items);
    }

    @Transactional
    public DispensationResponse dispense(DispensationCreateRequest request, AuthenticatedUser user) {
        UUID existing = jdbcTemplate.queryForList("SELECT id FROM dispensation WHERE idempotency_key = ?",
                UUID.class, request.idempotencyKey().trim()).stream().findFirst().orElse(null);
        if (existing != null) return dispensation(existing);

        PrescriptionState prescription = jdbcTemplate.query("""
                SELECT id, patient_id, status, valid_until FROM prescription WHERE id = ? FOR UPDATE
                """, (result, row) -> new PrescriptionState(result.getObject("id", UUID.class),
                result.getObject("patient_id", UUID.class), result.getString("status"),
                result.getObject("valid_until", LocalDate.class)), request.prescriptionId()).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la receta."));
        if (!List.of("ISSUED", "PARTIALLY_DISPENSED").contains(prescription.status())) {
            throw new ConflictException("La receta no puede dispensarse en su estado actual.");
        }
        if (prescription.validUntil() != null && prescription.validUntil().isBefore(LocalDate.now())) {
            throw new ConflictException("La receta esta vencida.");
        }
        if (new LinkedHashSet<>(request.items().stream().map(DispensationItemRequest::prescriptionItemId).toList()).size()
                != request.items().size()) {
            throw new ConflictException("No repitas un item de receta en la misma dispensacion.");
        }

        List<DispensationItemRequest> sortedItems = request.items().stream()
                .sorted(Comparator.comparing(item -> item.prescriptionItemId().toString())).toList();
        List<DispenseLine> lines = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (DispensationItemRequest item : sortedItems) {
            DispenseLine line = lockDispenseLine(request.prescriptionId(), item);
            BigDecimal remaining = line.prescribed().subtract(line.dispensed());
            if (item.quantity().compareTo(remaining) > 0) {
                throw new ConflictException("La cantidad supera el saldo pendiente de la receta.");
            }
            if (line.available().compareTo(item.quantity()) < 0) {
                throw new ConflictException("El lote " + line.batchCode() + " no tiene stock suficiente.");
            }
            if (line.expiresOn().isBefore(LocalDate.now())) {
                throw new ConflictException("El lote " + line.batchCode() + " esta vencido.");
            }
            lines.add(line.withQuantity(item.quantity()));
            total = total.add(item.quantity().multiply(line.unitCost()));
        }

        UUID pharmacistId = jdbcTemplate.queryForList("""
                SELECT id FROM professional WHERE user_id = ? AND professional_type = 'PHARMACIST' AND status = 'ACTIVE'
                """, UUID.class, user.id()).stream().findFirst().orElse(null);
        UUID dispensationId = jdbcTemplate.queryForObject("""
                INSERT INTO dispensation (dispensation_code, prescription_id, patient_id, pharmacist_id,
                    status, idempotency_key, notes)
                VALUES (?, ?, ?, ?, 'PARTIAL', ?, ?) RETURNING id
                """, UUID.class, CodeGenerator.next("DIS"), request.prescriptionId(), prescription.patientId(), pharmacistId,
                request.idempotencyKey().trim(), clean(request.notes()));

        int index = 0;
        for (DispenseLine line : lines) {
            UUID dispensationItemId = jdbcTemplate.queryForObject("""
                    INSERT INTO dispensation_item (dispensation_id, prescription_item_id, batch_id, quantity, unit_price)
                    VALUES (?, ?, ?, ?, ?) RETURNING id
                    """, UUID.class, dispensationId, line.prescriptionItemId(), line.batchId(), line.quantity(), line.unitCost());
            jdbcTemplate.update("""
                    UPDATE inventory_stock SET available_quantity = available_quantity - ?, version = version + 1
                    WHERE id = ?
                    """, line.quantity(), line.stockId());
            jdbcTemplate.update("""
                    UPDATE prescription_item SET quantity_dispensed = quantity_dispensed + ? WHERE id = ?
                    """, line.quantity(), line.prescriptionItemId());
            jdbcTemplate.update("""
                    INSERT INTO stock_movement (movement_code, medication_id, batch_id, source_location_id,
                        movement_type, quantity, reason, dispensation_item_id, performed_by, idempotency_key)
                    VALUES (?, ?, ?, ?, 'DISPENSATION', ?, ?, ?, ?, ?)
                    """, CodeGenerator.next("MOV"), line.medicationId(), line.batchId(), line.locationId(), line.quantity(),
                    "Dispensacion de receta", dispensationItemId, user.id(), movementKey(request.idempotencyKey(), index++));
        }

        boolean completed = Boolean.TRUE.equals(jdbcTemplate.queryForObject("""
                SELECT NOT EXISTS(
                    SELECT 1 FROM prescription_item
                    WHERE prescription_id = ? AND quantity_dispensed < quantity_prescribed
                )
                """, Boolean.class, request.prescriptionId()));
        String prescriptionStatus = completed ? "DISPENSED" : "PARTIALLY_DISPENSED";
        String dispensationStatus = completed ? "CONFIRMED" : "PARTIAL";
        jdbcTemplate.update("UPDATE prescription SET status = ? WHERE id = ?", prescriptionStatus, request.prescriptionId());
        jdbcTemplate.update("UPDATE dispensation SET status = ? WHERE id = ?", dispensationStatus, dispensationId);
        jdbcTemplate.update("""
                INSERT INTO charge (charge_code, patient_id, dispensation_id, quantity, unit_price, registered_by)
                VALUES (?, ?, ?, 1, ?, ?)
                """, CodeGenerator.next("CAR"), prescription.patientId(), dispensationId, total, user.id());
        auditService.record("DISPENSE", "DISPENSATION", dispensationId, user.id(), null,
                Map.of("prescriptionId", request.prescriptionId().toString(), "total", total, "status", dispensationStatus));
        return dispensation(dispensationId);
    }

    private DispenseLine lockDispenseLine(UUID prescriptionId, DispensationItemRequest request) {
        return jdbcTemplate.query("""
                SELECT pi.id prescription_item_id, pi.medication_id, pi.quantity_prescribed,
                       pi.quantity_dispensed, b.id batch_id, b.batch_code, b.expires_on, b.unit_cost,
                       s.id stock_id, s.location_id, s.available_quantity
                FROM prescription_item pi
                JOIN medication_batch b ON b.medication_id = pi.medication_id AND b.id = ? AND b.active
                JOIN inventory_stock s ON s.batch_id = b.id
                JOIN inventory_location l ON l.id = s.location_id AND l.location_type = 'PHARMACY' AND l.active
                WHERE pi.id = ? AND pi.prescription_id = ?
                ORDER BY s.available_quantity DESC
                LIMIT 1 FOR UPDATE OF pi, s
                """, (result, row) -> new DispenseLine(result.getObject("prescription_item_id", UUID.class),
                result.getObject("medication_id", UUID.class), result.getBigDecimal("quantity_prescribed"),
                result.getBigDecimal("quantity_dispensed"), result.getObject("batch_id", UUID.class),
                result.getString("batch_code"), result.getObject("expires_on", LocalDate.class), result.getBigDecimal("unit_cost"),
                result.getObject("stock_id", UUID.class), result.getObject("location_id", UUID.class),
                result.getBigDecimal("available_quantity"), request.quantity()), request.batchId(), request.prescriptionItemId(), prescriptionId)
                .stream().findFirst().orElseThrow(() -> new ConflictException(
                        "El item, lote o stock de farmacia seleccionado no esta disponible."));
    }

    private static PrescriptionRow mapPrescription(ResultSet result, int row) throws SQLException {
        return new PrescriptionRow(result.getObject("id", UUID.class), result.getString("prescription_code"),
                result.getObject("consultation_id", UUID.class), result.getString("consultation_code"),
                result.getObject("patient_id", UUID.class), result.getString("patient_code"), result.getString("patient_name"),
                result.getString("prescriber_name"), result.getObject("issued_on", LocalDate.class),
                result.getObject("valid_until", LocalDate.class), result.getString("status"), result.getString("notes"));
    }

    private static PrescriptionItemResponse mapPrescriptionItem(ResultSet result, int row) throws SQLException {
        return new PrescriptionItemResponse(result.getObject("id", UUID.class), result.getObject("medication_id", UUID.class),
                result.getString("medication_code"), result.getString("medication_name"), result.getString("presentation"),
                result.getString("dose"), result.getString("route"), result.getString("frequency"), result.getString("duration"),
                result.getBigDecimal("quantity_prescribed"), result.getBigDecimal("quantity_dispensed"), result.getString("instructions"));
    }

    private static DispensationRow mapDispensation(ResultSet result, int row) throws SQLException {
        return new DispensationRow(result.getObject("id", UUID.class), result.getString("dispensation_code"),
                result.getObject("prescription_id", UUID.class), result.getString("prescription_code"),
                result.getObject("patient_id", UUID.class), result.getString("patient_code"), result.getString("patient_name"),
                result.getString("pharmacist_name"), result.getString("status"),
                result.getObject("dispensed_at", OffsetDateTime.class), result.getString("notes"));
    }

    private static String movementKey(String key, int index) {
        String value = key.trim() + ":" + index;
        return value.length() <= 100 ? value : value.substring(0, 100);
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record ConsultationReference(UUID patientId, UUID professionalId, String status) {
    }

    private record PrescriptionState(UUID id, UUID patientId, String status, LocalDate validUntil) {
    }

    private record PrescriptionRow(UUID id, String code, UUID consultationId, String consultationCode,
                                   UUID patientId, String patientCode, String patientName, String prescriber,
                                   LocalDate issuedOn, LocalDate validUntil, String status, String notes) {
        PrescriptionResponse toResponse(List<PrescriptionItemResponse> items) {
            return new PrescriptionResponse(id, code, consultationId, consultationCode, patientId, patientCode,
                    patientName, prescriber, issuedOn, validUntil, status, notes, items);
        }
    }

    private record DispensationRow(UUID id, String code, UUID prescriptionId, String prescriptionCode,
                                   UUID patientId, String patientCode, String patientName, String pharmacist,
                                   String status, OffsetDateTime dispensedAt, String notes) {
        DispensationResponse toResponse(List<DispensationItemResponse> items) {
            return new DispensationResponse(id, code, prescriptionId, prescriptionCode, patientId, patientCode,
                    patientName, pharmacist, status, dispensedAt, notes, items);
        }
    }

    private record DispenseLine(UUID prescriptionItemId, UUID medicationId, BigDecimal prescribed,
                                BigDecimal dispensed, UUID batchId, String batchCode, LocalDate expiresOn,
                                BigDecimal unitCost, UUID stockId, UUID locationId, BigDecimal available,
                                BigDecimal quantity) {
        DispenseLine withQuantity(BigDecimal value) {
            return new DispenseLine(prescriptionItemId, medicationId, prescribed, dispensed, batchId, batchCode,
                    expiresOn, unitCost, stockId, locationId, available, value);
        }
    }
}
