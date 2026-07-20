package com.SIIH.proye.appointments.service;

import com.SIIH.proye.appointments.api.AppointmentCancelRequest;
import com.SIIH.proye.appointments.api.AppointmentCreateRequest;
import com.SIIH.proye.appointments.api.AppointmentResponse;
import com.SIIH.proye.appointments.api.ProfessionalResponse;
import com.SIIH.proye.appointments.api.SpecialtyResponse;
import com.SIIH.proye.common.api.PageResponse;
import com.SIIH.proye.appointments.domain.Appointment;
import com.SIIH.proye.appointments.domain.AppointmentStatus;
import com.SIIH.proye.appointments.domain.Professional;
import com.SIIH.proye.appointments.repository.AppointmentRepository;
import com.SIIH.proye.appointments.repository.ProfessionalRepository;
import com.SIIH.proye.appointments.repository.SpecialtyRepository;
import com.SIIH.proye.common.audit.AuditService;
import com.SIIH.proye.common.exception.ConflictException;
import com.SIIH.proye.common.exception.ResourceNotFoundException;
import com.SIIH.proye.patients.service.PatientService;
import com.SIIH.proye.security.repository.AppUserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.UUID;

@Service
public class AppointmentService {

    private static final EnumSet<AppointmentStatus> ACTIVE_STATUSES = EnumSet.of(
            AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED,
            AppointmentStatus.ARRIVED, AppointmentStatus.IN_PROGRESS
    );

    private final AppointmentRepository appointmentRepository;
    private final SpecialtyRepository specialtyRepository;
    private final ProfessionalRepository professionalRepository;
    private final AppUserRepository appUserRepository;
    private final PatientService patientService;
    private final AuditService auditService;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              SpecialtyRepository specialtyRepository,
                              ProfessionalRepository professionalRepository,
                              AppUserRepository appUserRepository,
                              PatientService patientService,
                              AuditService auditService) {
        this.appointmentRepository = appointmentRepository;
        this.specialtyRepository = specialtyRepository;
        this.professionalRepository = professionalRepository;
        this.appUserRepository = appUserRepository;
        this.patientService = patientService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public PageResponse<AppointmentResponse> search(OffsetDateTime from, OffsetDateTime to,
                                             UUID patientId, UUID professionalId,
                                             String status, Pageable pageable) {
        AppointmentStatus parsedStatus = parseStatus(status);
        return PageResponse.from(appointmentRepository.search(from, to, patientId, professionalId,
                        parsedStatus == null ? null : parsedStatus.name(), pageable)
                .map(AppointmentResponse::from));
    }

    @Transactional(readOnly = true)
    public List<SpecialtyResponse> specialties() {
        return specialtyRepository.findByActiveTrueOrderByNameAsc().stream().map(SpecialtyResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ProfessionalResponse> professionals(UUID specialtyId) {
        if (specialtyId != null && !specialtyRepository.existsById(specialtyId)) {
            throw new ResourceNotFoundException("No se encontro la especialidad solicitada.");
        }
        return professionalRepository.findActive(specialtyId).stream()
                .map(professional -> ProfessionalResponse.from(professional,
                        appUserRepository.findById(professional.getUserId())
                                .map(user -> user.getFirstName() + " " + user.getLastName())
                                .orElse(professional.getProfessionalCode())))
                .toList();
    }

    @Transactional
    public AppointmentResponse create(AppointmentCreateRequest request) {
        if (!request.endsAt().isAfter(request.startsAt())) {
            throw new ConflictException("La hora de fin debe ser posterior a la hora de inicio.");
        }
        if (request.idempotencyKey() != null) {
            var existing = appointmentRepository.findByIdempotencyKey(request.idempotencyKey().trim());
            if (existing.isPresent()) return AppointmentResponse.from(existing.get());
        }
        patientService.getPatient(request.patientId());
        professionalRepository.findById(request.professionalId())
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el profesional solicitado."));
        specialtyRepository.findById(request.specialtyId())
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la especialidad solicitada."));
        if (appointmentRepository.existsConflict(request.professionalId(), request.startsAt(), request.endsAt(), ACTIVE_STATUSES, null)) {
            throw new ConflictException("El profesional ya tiene una cita en ese intervalo.");
        }

        String code = String.format("CIT-%04d", appointmentRepository.nextAppointmentSequence());
        Appointment appointment = new Appointment(code, request.patientId(), request.professionalId(), request.specialtyId(),
                request.startsAt(), request.endsAt(), request.reason(), clean(request.idempotencyKey()));
        try {
            Appointment saved = appointmentRepository.save(appointment);
            auditService.record("CREATE", "APPOINTMENT", saved.getId(), null, null,
                    java.util.Map.of("appointmentCode", saved.getAppointmentCode(), "patientId", saved.getPatientId().toString()));
            return AppointmentResponse.from(saved);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("No se pudo reservar la cita porque el horario ya no esta disponible.");
        }
    }

    @Transactional
    public AppointmentResponse registerArrival(UUID id) {
        Appointment appointment = getAppointment(id);
        if (!ACTIVE_STATUSES.contains(appointment.getStatus())) {
            throw new ConflictException("La cita no puede registrar llegada en su estado actual.");
        }
        appointment.registerArrival();
        Appointment saved = appointmentRepository.save(appointment);
        auditService.record("REGISTER_ARRIVAL", "APPOINTMENT", saved.getId(), null, null,
                java.util.Map.of("appointmentCode", saved.getAppointmentCode(), "status", saved.getStatus().name()));
        return AppointmentResponse.from(saved);
    }

    @Transactional
    public AppointmentResponse cancel(UUID id, AppointmentCancelRequest request) {
        Appointment appointment = getAppointment(id);
        if (appointment.getStatus() == AppointmentStatus.CANCELLED || appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new ConflictException("La cita no puede cancelarse en su estado actual.");
        }
        appointment.cancel(request.reason().trim());
        Appointment saved = appointmentRepository.save(appointment);
        auditService.record("CANCEL", "APPOINTMENT", saved.getId(), null, null,
                java.util.Map.of("appointmentCode", saved.getAppointmentCode(), "reason", request.reason().trim()));
        return AppointmentResponse.from(saved);
    }

    private Appointment getAppointment(UUID id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la cita solicitada."));
    }

    private static AppointmentStatus parseStatus(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return AppointmentStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new ConflictException("El estado de cita no es valido.");
        }
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
