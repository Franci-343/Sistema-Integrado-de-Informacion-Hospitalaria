package com.SIIH.proye.appointments.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "appointment")
public class Appointment {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "appointment_code", nullable = false, unique = true, length = 30)
    private String appointmentCode;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "professional_id", nullable = false)
    private UUID professionalId;

    @Column(name = "specialty_id", nullable = false)
    private UUID specialtyId;

    @Column(name = "starts_at", nullable = false)
    private OffsetDateTime startsAt;

    @Column(name = "ends_at", nullable = false)
    private OffsetDateTime endsAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AppointmentStatus status = AppointmentStatus.SCHEDULED;

    private String reason;

    @Column(name = "cancellation_reason")
    private String cancellationReason;

    @Column(name = "arrived_at")
    private OffsetDateTime arrivedAt;

    @Column(name = "checked_in_by")
    private UUID checkedInBy;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "idempotency_key", length = 100)
    private String idempotencyKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private Long version;

    protected Appointment() {
    }

    public Appointment(String appointmentCode, UUID patientId, UUID professionalId, UUID specialtyId,
                       OffsetDateTime startsAt, OffsetDateTime endsAt, String reason, String idempotencyKey) {
        this.appointmentCode = appointmentCode;
        this.patientId = patientId;
        this.professionalId = professionalId;
        this.specialtyId = specialtyId;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
        this.reason = reason;
        this.idempotencyKey = idempotencyKey;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
        this.version = 0L;
    }

    public UUID getId() { return id; }
    public String getAppointmentCode() { return appointmentCode; }
    public UUID getPatientId() { return patientId; }
    public UUID getProfessionalId() { return professionalId; }
    public UUID getSpecialtyId() { return specialtyId; }
    public OffsetDateTime getStartsAt() { return startsAt; }
    public OffsetDateTime getEndsAt() { return endsAt; }
    public AppointmentStatus getStatus() { return status; }
    public String getReason() { return reason; }
    public String getCancellationReason() { return cancellationReason; }
    public OffsetDateTime getArrivedAt() { return arrivedAt; }
    public Instant getCreatedAt() { return createdAt; }

    public void registerArrival() {
        this.status = AppointmentStatus.ARRIVED;
        this.arrivedAt = OffsetDateTime.now();
        this.updatedAt = Instant.now();
    }

    public void cancel(String reason) {
        this.status = AppointmentStatus.CANCELLED;
        this.cancellationReason = reason;
        this.updatedAt = Instant.now();
    }
}
