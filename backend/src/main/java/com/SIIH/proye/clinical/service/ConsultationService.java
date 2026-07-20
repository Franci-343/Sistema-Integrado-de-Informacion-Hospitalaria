package com.SIIH.proye.clinical.service;

import com.SIIH.proye.appointments.domain.Appointment;
import com.SIIH.proye.appointments.domain.AppointmentStatus;
import com.SIIH.proye.appointments.repository.AppointmentRepository;
import com.SIIH.proye.appointments.repository.ProfessionalRepository;
import com.SIIH.proye.clinical.api.ConsultationCloseRequest;
import com.SIIH.proye.clinical.api.ConsultationCreateRequest;
import com.SIIH.proye.clinical.api.ConsultationResponse;
import com.SIIH.proye.clinical.domain.CareEncounter;
import com.SIIH.proye.clinical.domain.Consultation;
import com.SIIH.proye.clinical.domain.ConsultationStatus;
import com.SIIH.proye.clinical.domain.EncounterType;
import com.SIIH.proye.clinical.repository.CareEncounterRepository;
import com.SIIH.proye.clinical.repository.ConsultationRepository;
import com.SIIH.proye.common.audit.AuditService;
import com.SIIH.proye.common.exception.ConflictException;
import com.SIIH.proye.common.exception.ResourceNotFoundException;
import com.SIIH.proye.patients.service.PatientService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final CareEncounterRepository encounterRepository;
    private final AppointmentRepository appointmentRepository;
    private final ProfessionalRepository professionalRepository;
    private final PatientService patientService;
    private final AuditService auditService;

    public ConsultationService(ConsultationRepository consultationRepository,
                               CareEncounterRepository encounterRepository,
                               AppointmentRepository appointmentRepository,
                               ProfessionalRepository professionalRepository,
                               PatientService patientService,
                               AuditService auditService) {
        this.consultationRepository = consultationRepository;
        this.encounterRepository = encounterRepository;
        this.appointmentRepository = appointmentRepository;
        this.professionalRepository = professionalRepository;
        this.patientService = patientService;
        this.auditService = auditService;
    }

    @Transactional
    public ConsultationResponse create(ConsultationCreateRequest request) {
        patientService.getPatient(request.patientId());
        var professional = professionalRepository.findById(request.professionalId())
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el profesional solicitado."));

        if (request.appointmentId() != null) {
            Appointment appointment = appointmentRepository.findById(request.appointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("No se encontro la cita solicitada."));
            if (!appointment.getPatientId().equals(request.patientId())) {
                throw new ConflictException("La cita no pertenece al paciente indicado.");
            }
            if (appointment.getStatus() == AppointmentStatus.CANCELLED || appointment.getStatus() == AppointmentStatus.NO_SHOW) {
                throw new ConflictException("No se puede abrir una consulta para una cita cancelada.");
            }
            if (encounterRepository.existsByAppointmentId(request.appointmentId())) {
                throw new ConflictException("La cita ya tiene una atencion iniciada.");
            }
        }

        CareEncounter encounter = encounterRepository.save(new CareEncounter(
                String.format("ENC-%05d", encounterRepository.nextEncounterSequence()),
                request.patientId(), request.appointmentId(), EncounterType.OUTPATIENT));
        Consultation consultation = new Consultation(
                String.format("CON-%05d", consultationRepository.nextConsultationSequence()),
                encounter.getId(), request.patientId(), professional.getId(),
                request.chiefComplaint().trim(), clean(request.evolution()), clean(request.recommendations()));
        try {
            Consultation saved = consultationRepository.save(consultation);
            auditService.record("CREATE", "CONSULTATION", saved.getId(), null, null,
                    Map.of("consultationCode", saved.getConsultationCode(), "patientId", saved.getPatientId().toString()));
            return ConsultationResponse.from(saved);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("No se pudo iniciar la consulta.");
        }
    }

    @Transactional
    public ConsultationResponse close(UUID id, ConsultationCloseRequest request) {
        Consultation consultation = getConsultation(id);
        if (consultation.getStatus() != ConsultationStatus.DRAFT) {
            throw new ConflictException("La consulta ya no esta en estado borrador.");
        }
        var professional = professionalRepository.findById(consultation.getProfessionalId())
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el profesional de la consulta."));
        consultation.close(request.chiefComplaint().trim(), clean(request.evolution()), request.diagnosisSummary().trim(),
                request.treatmentPlan().trim(), clean(request.recommendations()), professional.getUserId());
        Consultation saved = consultationRepository.save(consultation);
        auditService.record("CLOSE", "CONSULTATION", saved.getId(), professional.getUserId(), null,
                Map.of("consultationCode", saved.getConsultationCode(), "status", saved.getStatus().name()));
        return ConsultationResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public ConsultationResponse findById(UUID id) {
        return ConsultationResponse.from(getConsultation(id));
    }

    @Transactional(readOnly = true)
    public List<ConsultationResponse> findByPatient(UUID patientId) {
        patientService.getPatient(patientId);
        return consultationRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                .map(ConsultationResponse::from).toList();
    }

    private Consultation getConsultation(UUID id) {
        return consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la consulta solicitada."));
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
