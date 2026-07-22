package com.SIIH.proye.hospitalization.service;

import com.SIIH.proye.common.audit.AuditService;
import com.SIIH.proye.common.database.CodeGenerator;
import com.SIIH.proye.common.exception.ConflictException;
import com.SIIH.proye.common.exception.ResourceNotFoundException;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.BedResponse;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.DischargeRequest;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.HospitalizationCreateRequest;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.HospitalizationOrderCreateRequest;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.HospitalizationOrderResponse;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.HospitalizationOriginResponse;
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
    public List<BedResponse> listBeds(String status, String serviceCode) {
        return jdbcTemplate.query("""
                SELECT id, code, room, bed, status, service_code, floor, bed_type FROM bed_location
                WHERE (CAST(? AS varchar) IS NULL OR status = upper(CAST(? AS varchar)))
                  AND (CAST(? AS varchar) IS NULL OR service_code = upper(CAST(? AS varchar)))
                ORDER BY service_code, room, bed
                """, (result, row) -> new BedResponse(result.getObject("id", UUID.class), result.getString("code"),
                result.getString("room"), result.getString("bed"), result.getString("status"),
                result.getString("service_code"), result.getString("floor"), result.getString("bed_type")),
                clean(status), clean(status), clean(serviceCode), clean(serviceCode));
    }

    @Transactional(readOnly = true)
    public List<HospitalizationOriginResponse> listHospitalizationOrigins(UUID patientId) {
        return jdbcTemplate.query("""
                SELECT e.id, e.encounter_code, e.encounter_type, e.patient_id, e.appointment_id, e.opened_at,
                       p.patient_code,
                       concat_ws(' ', p.first_name, p.middle_name, p.last_name, p.second_last_name) patient_name,
                       a.appointment_code, c.consultation_code
                FROM care_encounter e
                JOIN patient p ON p.id = e.patient_id
                LEFT JOIN appointment a ON a.id = e.appointment_id
                LEFT JOIN consultation c ON c.encounter_id = e.id
                WHERE e.status = 'OPEN'
                  AND e.encounter_type IN ('OUTPATIENT', 'EMERGENCY')
                  AND (CAST(? AS uuid) IS NULL OR e.patient_id = CAST(? AS uuid))
                  AND NOT EXISTS (
                      SELECT 1 FROM hospitalization_order ho
                      WHERE ho.origin_encounter_id = e.id AND ho.status <> 'CANCELLED'
                  )
                ORDER BY e.opened_at DESC
                """, (result, row) -> new HospitalizationOriginResponse(
                result.getObject("id", UUID.class),
                result.getString("encounter_code"),
                result.getString("encounter_type"),
                result.getObject("patient_id", UUID.class),
                result.getString("patient_code"),
                result.getString("patient_name"),
                result.getObject("appointment_id", UUID.class),
                result.getString("appointment_code"),
                result.getString("consultation_code"),
                result.getObject("opened_at", OffsetDateTime.class)
        ), patientId, patientId);
    }

    @Transactional(readOnly = true)
    public List<HospitalizationOrderResponse> listHospitalizationOrders(String status) {
        return jdbcTemplate.query("""
                SELECT ho.*, e.encounter_code origin_encounter_code, e.encounter_type origin_encounter_type,
                       p.patient_code,
                       concat_ws(' ', p.first_name, p.middle_name, p.last_name, p.second_last_name) patient_name,
                       concat_ws(' ', u.first_name, u.last_name) professional_name
                FROM hospitalization_order ho
                JOIN care_encounter e ON e.id = ho.origin_encounter_id
                JOIN patient p ON p.id = ho.patient_id
                JOIN professional pr ON pr.id = ho.responsible_professional_id
                LEFT JOIN app_user u ON u.id = pr.user_id
                WHERE (CAST(? AS varchar) IS NULL OR ho.status = upper(CAST(? AS varchar)))
                ORDER BY ho.ordered_at DESC
                """, ClinicalOperationsService::mapHospitalizationOrder, clean(status), clean(status));
    }

    @Transactional
    public HospitalizationOrderResponse createHospitalizationOrder(HospitalizationOrderCreateRequest request,
                                                                  AuthenticatedUser user) {
        OriginRow origin = findOriginForOrder(request.originEncounterId());
        if (!Boolean.TRUE.equals(jdbcTemplate.queryForObject("""
                SELECT EXISTS(SELECT 1 FROM professional WHERE id = ? AND status = 'ACTIVE'
                    AND professional_type IN ('DOCTOR', 'OTHER'))
                """, Boolean.class, request.responsibleProfessionalId()))) {
            throw new ResourceNotFoundException("No se encontro un medico responsable activo.");
        }
        if (Boolean.TRUE.equals(jdbcTemplate.queryForObject("""
                SELECT EXISTS(SELECT 1 FROM hospitalization_order
                WHERE origin_encounter_id = ? AND status <> 'CANCELLED')
                """, Boolean.class, request.originEncounterId()))) {
            throw new ConflictException("La atencion ya tiene una orden de internacion activa.");
        }
        UUID id = jdbcTemplate.queryForObject("""
                INSERT INTO hospitalization_order (order_code, origin_encounter_id, patient_id,
                    responsible_professional_id, reason, presumptive_diagnosis, destination_service, ordered_by)
                VALUES (?, ?, ?, ?, ?, ?, upper(?), ?) RETURNING id
                """, UUID.class, CodeGenerator.next("HOI"), request.originEncounterId(), origin.patientId(),
                request.responsibleProfessionalId(), request.reason().trim(), request.presumptiveDiagnosis().trim(),
                request.destinationService().trim(), user.id());
        auditService.record("CREATE", "HOSPITALIZATION_ORDER", id, user.id(), null,
                Map.of("originEncounterId", request.originEncounterId().toString(),
                        "patientId", origin.patientId().toString()));
        return getHospitalizationOrder(id);
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
                       b.code bed_code, b.room, b.bed, b.service_code, b.floor, b.bed_type,
                       ho.order_code hospitalization_order_code,
                       e.encounter_code origin_encounter_code, e.encounter_type origin_encounter_type,
                       concat_ws(' ', u.first_name, u.last_name) professional_name
                FROM hospitalization h
                JOIN patient p ON p.id = h.patient_id
                LEFT JOIN bed_location b ON b.id = h.bed_id
                LEFT JOIN hospitalization_order ho ON ho.id = h.hospitalization_order_id
                LEFT JOIN care_encounter e ON e.id = h.origin_encounter_id
                LEFT JOIN professional pr ON pr.id = h.responsible_professional_id
                LEFT JOIN app_user u ON u.id = pr.user_id
                WHERE h.id = ?
                """, ClinicalOperationsService::mapHospitalization, id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la hospitalizacion."));
        List<NursingNoteResponse> notes = jdbcTemplate.query("""
                SELECT n.id, n.temperature_c, n.systolic_bp, n.diastolic_bp, n.heart_rate,
                       n.respiratory_rate, n.oxygen_saturation, n.glucose_mg_dl, n.weight_kg,
                       n.note, n.recorded_at, concat_ws(' ', u.first_name, u.last_name) recorded_by_name
                FROM nursing_note n LEFT JOIN app_user u ON u.id = n.recorded_by
                WHERE n.hospitalization_id = ? ORDER BY n.recorded_at DESC
                """, ClinicalOperationsService::mapNursingNote, id);
        return row.toResponse(notes);
    }

    @Transactional
    public HospitalizationResponse admit(HospitalizationCreateRequest request, AuthenticatedUser user) {
        OrderForAdmission order = findPendingOrderForAdmission(request.hospitalizationOrderId());
        if (request.patientId() != null && !request.patientId().equals(order.patientId())) {
            throw new ConflictException("La orden de internacion no pertenece al paciente seleccionado.");
        }
        UUID responsibleProfessionalId = request.responsibleProfessionalId() == null
                ? order.responsibleProfessionalId() : request.responsibleProfessionalId();
        if (!Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM professional WHERE id = ? AND status = 'ACTIVE')", Boolean.class,
                responsibleProfessionalId))) {
            throw new ResourceNotFoundException("No se encontro el profesional responsable.");
        }
        BedForAdmission bed = jdbcTemplate.query("""
                SELECT status, service_code FROM bed_location WHERE id = ? FOR UPDATE
                """, (result, row) -> new BedForAdmission(result.getString("status"),
                result.getString("service_code")), request.bedId()).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la cama seleccionada."));
        if (!"AVAILABLE".equals(bed.status())) throw new ConflictException("La cama ya no esta disponible.");
        if (order.destinationService() != null && bed.serviceCode() != null
                && !order.destinationService().equalsIgnoreCase(bed.serviceCode())) {
            throw new ConflictException("La cama seleccionada no pertenece al servicio indicado en la orden.");
        }
        if (Boolean.TRUE.equals(jdbcTemplate.queryForObject("""
                SELECT EXISTS(SELECT 1 FROM hospitalization WHERE patient_id = ? AND status = 'ADMITTED')
                """, Boolean.class, order.patientId()))) {
            throw new ConflictException("El paciente ya tiene una hospitalizacion activa.");
        }

        UUID encounterId = jdbcTemplate.queryForObject("""
                INSERT INTO care_encounter (encounter_code, patient_id, encounter_type, status, created_by)
                VALUES (?, ?, 'HOSPITALIZATION', 'OPEN', ?) RETURNING id
                """, UUID.class, CodeGenerator.next("ENC"), order.patientId(), user.id());
        String admissionReason = clean(request.admissionReason()) == null ? order.reason() : request.admissionReason().trim();
        UUID id = jdbcTemplate.queryForObject("""
                INSERT INTO hospitalization (hospitalization_code, patient_id, admission_encounter_id, bed_id,
                    admission_reason, responsible_professional_id, origin_encounter_id, hospitalization_order_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
                """, UUID.class, CodeGenerator.next("HOS"), order.patientId(), encounterId, request.bedId(),
                admissionReason, responsibleProfessionalId, order.originEncounterId(), order.id());
        jdbcTemplate.update("UPDATE bed_location SET status = 'OCCUPIED' WHERE id = ?", request.bedId());
        jdbcTemplate.update("""
                UPDATE hospitalization_order SET status = 'EXECUTED', executed_at = CURRENT_TIMESTAMP WHERE id = ?
                """, order.id());
        if (order.appointmentId() != null) {
            jdbcTemplate.update("""
                    UPDATE appointment SET status = 'DERIVED_TO_HOSPITALIZATION', updated_at = CURRENT_TIMESTAMP WHERE id = ?
                    """, order.appointmentId());
        }
        auditService.record("ADMIT", "HOSPITALIZATION", id, user.id(), null,
                Map.of("patientId", order.patientId().toString(), "bedId", request.bedId().toString(),
                        "orderId", order.id().toString()));
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
                    discharge_diagnosis = ?, discharge_type = ?, discharge_instructions = ?,
                    follow_up_plan = ?, medications_on_discharge = ?
                WHERE id = ?
                """, request.dischargeDiagnosis().trim(), request.dischargeType().name(),
                request.dischargeInstructions().trim(), clean(request.followUpPlan()),
                clean(request.medicationsOnDischarge()), id);
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
                INSERT INTO nursing_note (hospitalization_id, encounter_id, temperature_c, systolic_bp,
                    diastolic_bp, heart_rate, respiratory_rate, oxygen_saturation, glucose_mg_dl,
                    weight_kg, note, recorded_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
                """, UUID.class, hospitalizationId, encounterId, request.temperatureC(), request.systolicBp(),
                request.diastolicBp(), request.heartRate(), request.respiratoryRate(), request.oxygenSaturation(),
                request.glucoseMgDl(), request.weightKg(), request.note().trim(), user.id());
        auditService.record("CREATE", "NURSING_NOTE", id, user.id(), null,
                Map.of("hospitalizationId", hospitalizationId.toString()));
        return jdbcTemplate.query("""
                SELECT n.id, n.temperature_c, n.systolic_bp, n.diastolic_bp, n.heart_rate,
                       n.respiratory_rate, n.oxygen_saturation, n.glucose_mg_dl, n.weight_kg,
                       n.note, n.recorded_at, concat_ws(' ', u.first_name, u.last_name) recorded_by_name
                FROM nursing_note n LEFT JOIN app_user u ON u.id = n.recorded_by WHERE n.id = ?
                """, ClinicalOperationsService::mapNursingNote, id).getFirst();
    }

    private void requirePatient(UUID patientId) {
        if (!Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM patient WHERE id = ? AND status = 'ACTIVE')", Boolean.class, patientId))) {
            throw new ResourceNotFoundException("No se encontro un paciente activo con ese identificador.");
        }
    }

    private HospitalizationOrderResponse getHospitalizationOrder(UUID id) {
        return jdbcTemplate.query("""
                SELECT ho.*, e.encounter_code origin_encounter_code, e.encounter_type origin_encounter_type,
                       p.patient_code,
                       concat_ws(' ', p.first_name, p.middle_name, p.last_name, p.second_last_name) patient_name,
                       concat_ws(' ', u.first_name, u.last_name) professional_name
                FROM hospitalization_order ho
                JOIN care_encounter e ON e.id = ho.origin_encounter_id
                JOIN patient p ON p.id = ho.patient_id
                JOIN professional pr ON pr.id = ho.responsible_professional_id
                LEFT JOIN app_user u ON u.id = pr.user_id
                WHERE ho.id = ?
                """, ClinicalOperationsService::mapHospitalizationOrder, id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la orden de internacion."));
    }

    private OriginRow findOriginForOrder(UUID encounterId) {
        OriginRow origin = jdbcTemplate.query("""
                SELECT id, patient_id, encounter_type, status
                FROM care_encounter WHERE id = ? FOR UPDATE
                """, (result, row) -> new OriginRow(result.getObject("id", UUID.class),
                result.getObject("patient_id", UUID.class), result.getString("encounter_type"),
                result.getString("status")), encounterId).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la atencion de origen."));
        if (!"OPEN".equals(origin.status())) {
            throw new ConflictException("La atencion de origen no esta activa.");
        }
        if (!List.of("OUTPATIENT", "EMERGENCY").contains(origin.encounterType())) {
            throw new ConflictException("La orden debe originarse en consulta externa o emergencia.");
        }
        return origin;
    }

    private OrderForAdmission findPendingOrderForAdmission(UUID orderId) {
        OrderForAdmission order = jdbcTemplate.query("""
                SELECT ho.id, ho.origin_encounter_id, ho.patient_id, ho.responsible_professional_id,
                       ho.reason, ho.destination_service, ho.status, e.status origin_status,
                       e.encounter_type origin_type, e.appointment_id
                FROM hospitalization_order ho
                JOIN care_encounter e ON e.id = ho.origin_encounter_id
                WHERE ho.id = ? FOR UPDATE
                """, (result, row) -> new OrderForAdmission(
                result.getObject("id", UUID.class),
                result.getObject("origin_encounter_id", UUID.class),
                result.getObject("patient_id", UUID.class),
                result.getObject("responsible_professional_id", UUID.class),
                result.getString("reason"),
                result.getString("destination_service"),
                result.getString("status"),
                result.getString("origin_status"),
                result.getString("origin_type"),
                result.getObject("appointment_id", UUID.class)
        ), orderId).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la orden de internacion."));
        if (!"PENDING".equals(order.status())) {
            throw new ConflictException("La orden de internacion ya no esta pendiente.");
        }
        if (!"OPEN".equals(order.originStatus())) {
            throw new ConflictException("La atencion de origen de la orden no esta activa.");
        }
        if (!List.of("OUTPATIENT", "EMERGENCY").contains(order.originType())) {
            throw new ConflictException("La orden no proviene de consulta externa o emergencia.");
        }
        return order;
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
                result.getObject("hospitalization_order_id", UUID.class), result.getString("hospitalization_order_code"),
                result.getObject("origin_encounter_id", UUID.class), result.getString("origin_encounter_code"),
                result.getString("origin_encounter_type"), result.getObject("patient_id", UUID.class),
                result.getString("patient_code"), result.getString("patient_name"),
                result.getObject("bed_id", UUID.class), result.getString("bed_code"), result.getString("room"),
                result.getString("bed"), result.getString("service_code"), result.getString("floor"),
                result.getString("bed_type"), result.getString("status"), result.getString("admission_reason"),
                result.getString("discharge_diagnosis"), result.getString("discharge_type"),
                result.getString("discharge_instructions"), result.getString("follow_up_plan"),
                result.getString("medications_on_discharge"), result.getString("professional_name"),
                result.getObject("admitted_at", OffsetDateTime.class),
                result.getObject("discharged_at", OffsetDateTime.class));
    }

    private static HospitalizationOrderResponse mapHospitalizationOrder(ResultSet result, int row) throws SQLException {
        return new HospitalizationOrderResponse(result.getObject("id", UUID.class), result.getString("order_code"),
                result.getObject("origin_encounter_id", UUID.class), result.getString("origin_encounter_code"),
                result.getString("origin_encounter_type"), result.getObject("patient_id", UUID.class),
                result.getString("patient_code"), result.getString("patient_name"),
                result.getObject("responsible_professional_id", UUID.class), result.getString("professional_name"),
                result.getString("reason"), result.getString("presumptive_diagnosis"),
                result.getString("destination_service"), result.getString("status"),
                result.getObject("ordered_at", OffsetDateTime.class),
                result.getObject("executed_at", OffsetDateTime.class),
                result.getObject("cancelled_at", OffsetDateTime.class));
    }

    private static NursingNoteResponse mapNursingNote(ResultSet result, int row) throws SQLException {
        return new NursingNoteResponse(result.getObject("id", UUID.class), result.getBigDecimal("temperature_c"),
                integer(result, "systolic_bp"), integer(result, "diastolic_bp"),
                integer(result, "heart_rate"), integer(result, "respiratory_rate"),
                result.getBigDecimal("oxygen_saturation"), result.getBigDecimal("glucose_mg_dl"),
                result.getBigDecimal("weight_kg"), result.getString("note"),
                result.getString("recorded_by_name"), result.getObject("recorded_at", OffsetDateTime.class));
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

    private record OriginRow(UUID id, UUID patientId, String encounterType, String status) {
    }

    private record OrderForAdmission(UUID id, UUID originEncounterId, UUID patientId, UUID responsibleProfessionalId,
                                     String reason, String destinationService, String status, String originStatus,
                                     String originType, UUID appointmentId) {
    }

    private record BedForAdmission(String status, String serviceCode) {
    }

    private record HospitalizationRow(UUID id, String code, UUID orderId, String orderCode, UUID originEncounterId,
                                      String originEncounterCode, String originEncounterType, UUID patientId,
                                      String patientCode, String patientName, UUID bedId, String bedCode,
                                      String room, String bed, String bedServiceCode, String bedFloor,
                                      String bedType, String status, String reason, String dischargeDiagnosis,
                                      String dischargeType, String dischargeInstructions, String followUpPlan,
                                      String medicationsOnDischarge, String professional, OffsetDateTime admittedAt,
                                      OffsetDateTime dischargedAt) {
        HospitalizationResponse toResponse(List<NursingNoteResponse> notes) {
            return new HospitalizationResponse(id, code, orderId, orderCode, originEncounterId, originEncounterCode,
                    originEncounterType, patientId, patientCode, patientName, bedId, bedCode, room, bed,
                    bedServiceCode, bedFloor, bedType, status, reason, dischargeDiagnosis, dischargeType,
                    dischargeInstructions, followUpPlan, medicationsOnDischarge, professional, admittedAt,
                    dischargedAt, notes);
        }
    }
}
