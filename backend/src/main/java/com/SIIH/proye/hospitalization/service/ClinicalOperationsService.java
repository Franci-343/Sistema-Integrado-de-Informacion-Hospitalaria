package com.SIIH.proye.hospitalization.service;

import com.SIIH.proye.common.audit.AuditService;
import com.SIIH.proye.common.database.CodeGenerator;
import com.SIIH.proye.common.exception.ConflictException;
import com.SIIH.proye.common.exception.ResourceNotFoundException;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.BedResponse;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.DischargeRequest;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.HospitalizationCreateRequest;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.HospitalizationResponse;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.NursingNoteRequest;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.NursingNoteResponse;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.TriageCreateRequest;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.TriageResponse;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.TriageUpdateRequest;
import com.SIIH.proye.security.AuthenticatedUser;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ClinicalOperationsService {

    private final JdbcTemplate jdbcTemplate;
    private final AuditService auditService;

    public ClinicalOperationsService(JdbcTemplate jdbcTemplate, AuditService auditService) {
        this.jdbcTemplate = jdbcTemplate;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<TriageResponse> listTriage(UUID patientId) {
        return jdbcTemplate.query("""
                SELECT t.*, e.encounter_code, e.patient_id, p.patient_code,
                       concat_ws(' ', p.first_name, p.middle_name, p.last_name, p.second_last_name) patient_name,
                       concat_ws(' ', u.first_name, u.last_name) recorded_by_name
                FROM triage t
                JOIN care_encounter e ON e.id = t.encounter_id
                JOIN patient p ON p.id = e.patient_id
                LEFT JOIN app_user u ON u.id = t.recorded_by
                WHERE (CAST(? AS uuid) IS NULL OR e.patient_id = CAST(? AS uuid))
                ORDER BY t.recorded_at DESC
                """, ClinicalOperationsService::mapTriage, patientId, patientId);
    }

    @Transactional(readOnly = true)
    public TriageResponse getTriage(UUID id) {
        return jdbcTemplate.query("""
                SELECT t.*, e.encounter_code, e.patient_id, p.patient_code,
                       concat_ws(' ', p.first_name, p.middle_name, p.last_name, p.second_last_name) patient_name,
                       concat_ws(' ', u.first_name, u.last_name) recorded_by_name
                FROM triage t
                JOIN care_encounter e ON e.id = t.encounter_id
                JOIN patient p ON p.id = e.patient_id
                LEFT JOIN app_user u ON u.id = t.recorded_by
                WHERE t.id = ?
                """, ClinicalOperationsService::mapTriage, id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el registro de triaje."));
    }

    @Transactional
    public TriageResponse createTriage(TriageCreateRequest request, AuthenticatedUser user) {
        requirePatient(request.patientId());
        UUID encounterId = request.encounterId();
        if (encounterId == null) {
            encounterId = jdbcTemplate.queryForObject("""
                    INSERT INTO care_encounter (encounter_code, patient_id, encounter_type, status, created_by)
                    VALUES (?, ?, 'EMERGENCY', 'OPEN', ?) RETURNING id
                    """, UUID.class, CodeGenerator.next("ENC"), request.patientId(), user.id());
        } else {
            UUID encounterPatient = jdbcTemplate.query("SELECT patient_id FROM care_encounter WHERE id = ? AND status = 'OPEN'",
                    (result, row) -> result.getObject(1, UUID.class), encounterId).stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("No se encontro una atencion abierta para el triaje."));
            if (!encounterPatient.equals(request.patientId())) {
                throw new ConflictException("La atencion no pertenece al paciente seleccionado.");
            }
        }
        if (Boolean.TRUE.equals(jdbcTemplate.queryForObject("SELECT EXISTS(SELECT 1 FROM triage WHERE encounter_id = ?)", Boolean.class, encounterId))) {
            throw new ConflictException("La atencion ya tiene un registro de triaje.");
        }
        UUID id = jdbcTemplate.queryForObject("""
                INSERT INTO triage (encounter_id, priority, temperature_c, systolic_bp, diastolic_bp,
                    heart_rate, respiratory_rate, oxygen_saturation, weight_kg, height_cm, notes, recorded_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
                """, UUID.class, encounterId, request.priority().name(), request.temperatureC(), request.systolicBp(),
                request.diastolicBp(), request.heartRate(), request.respiratoryRate(), request.oxygenSaturation(),
                request.weightKg(), request.heightCm(), clean(request.notes()), user.id());
        auditService.record("CREATE", "TRIAGE", id, user.id(), null,
                Map.of("patientId", request.patientId().toString(), "priority", request.priority().name()));
        return getTriage(id);
    }

    @Transactional
    public TriageResponse updateTriage(UUID id, TriageUpdateRequest request, AuthenticatedUser user) {
        TriageResponse before = getTriage(id);
        int updated = jdbcTemplate.update("""
                UPDATE triage SET priority = ?, temperature_c = ?, systolic_bp = ?, diastolic_bp = ?,
                    heart_rate = ?, respiratory_rate = ?, oxygen_saturation = ?, weight_kg = ?, height_cm = ?,
                    notes = ?, recorded_by = ?, recorded_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """, request.priority().name(), request.temperatureC(), request.systolicBp(), request.diastolicBp(),
                request.heartRate(), request.respiratoryRate(), request.oxygenSaturation(), request.weightKg(),
                request.heightCm(), clean(request.notes()), user.id(), id);
        if (updated == 0) throw new ResourceNotFoundException("No se encontro el registro de triaje.");
        auditService.record("UPDATE", "TRIAGE", id, user.id(),
                Map.of("priority", before.priority()), Map.of("priority", request.priority().name()));
        return getTriage(id);
    }

    @Transactional(readOnly = true)
    public List<BedResponse> listBeds(String status) {
        return jdbcTemplate.query("""
                SELECT id, code, room, bed, status FROM bed_location
                WHERE (CAST(? AS varchar) IS NULL OR status = upper(CAST(? AS varchar)))
                ORDER BY room, bed
                """, (result, row) -> new BedResponse(result.getObject("id", UUID.class), result.getString("code"),
                result.getString("room"), result.getString("bed"), result.getString("status")), clean(status), clean(status));
    }

    @Transactional(readOnly = true)
    public List<HospitalizationResponse> listHospitalizations(UUID patientId, String status) {
        List<UUID> ids = jdbcTemplate.queryForList("""
                SELECT id FROM hospitalization
                WHERE (CAST(? AS uuid) IS NULL OR patient_id = CAST(? AS uuid))
                  AND (CAST(? AS varchar) IS NULL OR status = upper(CAST(? AS varchar)))
                ORDER BY admitted_at DESC
                """, UUID.class, patientId, patientId, clean(status), clean(status));
        return ids.stream().map(this::getHospitalization).toList();
    }

    @Transactional(readOnly = true)
    public HospitalizationResponse getHospitalization(UUID id) {
        HospitalizationRow row = jdbcTemplate.query("""
                SELECT h.*, p.patient_code,
                       concat_ws(' ', p.first_name, p.middle_name, p.last_name, p.second_last_name) patient_name,
                       b.code bed_code, b.room, b.bed,
                       concat_ws(' ', u.first_name, u.last_name) professional_name
                FROM hospitalization h
                JOIN patient p ON p.id = h.patient_id
                LEFT JOIN bed_location b ON b.id = h.bed_id
                LEFT JOIN professional pr ON pr.id = h.responsible_professional_id
                LEFT JOIN app_user u ON u.id = pr.user_id
                WHERE h.id = ?
                """, ClinicalOperationsService::mapHospitalization, id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la hospitalizacion."));
        List<NursingNoteResponse> notes = jdbcTemplate.query("""
                SELECT n.id, n.note, n.recorded_at, concat_ws(' ', u.first_name, u.last_name) recorded_by_name
                FROM nursing_note n LEFT JOIN app_user u ON u.id = n.recorded_by
                WHERE n.hospitalization_id = ? ORDER BY n.recorded_at DESC
                """, (result, number) -> new NursingNoteResponse(result.getObject("id", UUID.class), result.getString("note"),
                result.getString("recorded_by_name"), result.getObject("recorded_at", OffsetDateTime.class)), id);
        return row.toResponse(notes);
    }

    @Transactional
    public HospitalizationResponse admit(HospitalizationCreateRequest request, AuthenticatedUser user) {
        requirePatient(request.patientId());
        if (!Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM professional WHERE id = ? AND status = 'ACTIVE')", Boolean.class,
                request.responsibleProfessionalId()))) {
            throw new ResourceNotFoundException("No se encontro el profesional responsable.");
        }
        String bedStatus = jdbcTemplate.query("SELECT status FROM bed_location WHERE id = ? FOR UPDATE",
                (result, row) -> result.getString(1), request.bedId()).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la cama seleccionada."));
        if (!"AVAILABLE".equals(bedStatus)) throw new ConflictException("La cama ya no esta disponible.");
        if (Boolean.TRUE.equals(jdbcTemplate.queryForObject("""
                SELECT EXISTS(SELECT 1 FROM hospitalization WHERE patient_id = ? AND status = 'ADMITTED')
                """, Boolean.class, request.patientId()))) {
            throw new ConflictException("El paciente ya tiene una hospitalizacion activa.");
        }

        UUID encounterId = jdbcTemplate.queryForObject("""
                INSERT INTO care_encounter (encounter_code, patient_id, encounter_type, status, created_by)
                VALUES (?, ?, 'HOSPITALIZATION', 'OPEN', ?) RETURNING id
                """, UUID.class, CodeGenerator.next("ENC"), request.patientId(), user.id());
        UUID id = jdbcTemplate.queryForObject("""
                INSERT INTO hospitalization (hospitalization_code, patient_id, admission_encounter_id, bed_id,
                    admission_reason, responsible_professional_id)
                VALUES (?, ?, ?, ?, ?, ?) RETURNING id
                """, UUID.class, CodeGenerator.next("HOS"), request.patientId(), encounterId, request.bedId(),
                request.admissionReason().trim(), request.responsibleProfessionalId());
        jdbcTemplate.update("UPDATE bed_location SET status = 'OCCUPIED' WHERE id = ?", request.bedId());
        auditService.record("ADMIT", "HOSPITALIZATION", id, user.id(), null,
                Map.of("patientId", request.patientId().toString(), "bedId", request.bedId().toString()));
        return getHospitalization(id);
    }

    @Transactional
    public HospitalizationResponse discharge(UUID id, DischargeRequest request, AuthenticatedUser user) {
        ActiveHospitalization active = jdbcTemplate.query("""
                SELECT bed_id, admission_encounter_id, status FROM hospitalization WHERE id = ? FOR UPDATE
                """, (result, row) -> new ActiveHospitalization(result.getObject("bed_id", UUID.class),
                result.getObject("admission_encounter_id", UUID.class), result.getString("status")), id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la hospitalizacion."));
        if (!"ADMITTED".equals(active.status())) throw new ConflictException("La hospitalizacion ya no esta activa.");
        jdbcTemplate.update("""
                UPDATE hospitalization SET status = 'DISCHARGED', discharged_at = CURRENT_TIMESTAMP,
                    discharge_instructions = ? WHERE id = ?
                """, request.dischargeInstructions().trim(), id);
        if (active.bedId() != null) jdbcTemplate.update("UPDATE bed_location SET status = 'AVAILABLE' WHERE id = ?", active.bedId());
        if (active.encounterId() != null) jdbcTemplate.update("""
                UPDATE care_encounter SET status = 'CLOSED', closed_at = CURRENT_TIMESTAMP WHERE id = ?
                """, active.encounterId());
        auditService.record("DISCHARGE", "HOSPITALIZATION", id, user.id(),
                Map.of("status", "ADMITTED"), Map.of("status", "DISCHARGED"));
        return getHospitalization(id);
    }

    @Transactional
    public NursingNoteResponse addNursingNote(UUID hospitalizationId, NursingNoteRequest request, AuthenticatedUser user) {
        UUID encounterId = jdbcTemplate.query("""
                SELECT admission_encounter_id FROM hospitalization WHERE id = ? AND status = 'ADMITTED'
                """, (result, row) -> result.getObject(1, UUID.class), hospitalizationId).stream().findFirst()
                .orElseThrow(() -> new ConflictException("La hospitalizacion no esta activa."));
        UUID id = jdbcTemplate.queryForObject("""
                INSERT INTO nursing_note (hospitalization_id, encounter_id, note, recorded_by)
                VALUES (?, ?, ?, ?) RETURNING id
                """, UUID.class, hospitalizationId, encounterId, request.note().trim(), user.id());
        auditService.record("CREATE", "NURSING_NOTE", id, user.id(), null,
                Map.of("hospitalizationId", hospitalizationId.toString()));
        return jdbcTemplate.query("""
                SELECT n.id, n.note, n.recorded_at, concat_ws(' ', u.first_name, u.last_name) recorded_by_name
                FROM nursing_note n LEFT JOIN app_user u ON u.id = n.recorded_by WHERE n.id = ?
                """, (result, row) -> new NursingNoteResponse(result.getObject("id", UUID.class), result.getString("note"),
                result.getString("recorded_by_name"), result.getObject("recorded_at", OffsetDateTime.class)), id).getFirst();
    }

    private void requirePatient(UUID patientId) {
        if (!Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM patient WHERE id = ? AND status = 'ACTIVE')", Boolean.class, patientId))) {
            throw new ResourceNotFoundException("No se encontro un paciente activo con ese identificador.");
        }
    }

    private static TriageResponse mapTriage(ResultSet result, int row) throws SQLException {
        return new TriageResponse(result.getObject("id", UUID.class), result.getObject("encounter_id", UUID.class),
                result.getString("encounter_code"), result.getObject("patient_id", UUID.class), result.getString("patient_code"),
                result.getString("patient_name"), result.getString("priority"), result.getBigDecimal("temperature_c"),
                integer(result, "systolic_bp"), integer(result, "diastolic_bp"), integer(result, "heart_rate"),
                integer(result, "respiratory_rate"), result.getBigDecimal("oxygen_saturation"), result.getBigDecimal("weight_kg"),
                result.getBigDecimal("height_cm"), result.getString("notes"), result.getString("recorded_by_name"),
                result.getObject("recorded_at", OffsetDateTime.class));
    }

    private static HospitalizationRow mapHospitalization(ResultSet result, int row) throws SQLException {
        return new HospitalizationRow(result.getObject("id", UUID.class), result.getString("hospitalization_code"),
                result.getObject("patient_id", UUID.class), result.getString("patient_code"), result.getString("patient_name"),
                result.getObject("bed_id", UUID.class), result.getString("bed_code"), result.getString("room"), result.getString("bed"),
                result.getString("status"), result.getString("admission_reason"), result.getString("discharge_instructions"),
                result.getString("professional_name"), result.getObject("admitted_at", OffsetDateTime.class),
                result.getObject("discharged_at", OffsetDateTime.class));
    }

    private static Integer integer(ResultSet result, String column) throws SQLException {
        int value = result.getInt(column);
        return result.wasNull() ? null : value;
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record ActiveHospitalization(UUID bedId, UUID encounterId, String status) {
    }

    private record HospitalizationRow(UUID id, String code, UUID patientId, String patientCode, String patientName,
                                      UUID bedId, String bedCode, String room, String bed, String status,
                                      String reason, String dischargeInstructions, String professional,
                                      OffsetDateTime admittedAt, OffsetDateTime dischargedAt) {
        HospitalizationResponse toResponse(List<NursingNoteResponse> notes) {
            return new HospitalizationResponse(id, code, patientId, patientCode, patientName, bedId, bedCode, room, bed,
                    status, reason, dischargeInstructions, professional, admittedAt, dischargedAt, notes);
        }
    }
}
