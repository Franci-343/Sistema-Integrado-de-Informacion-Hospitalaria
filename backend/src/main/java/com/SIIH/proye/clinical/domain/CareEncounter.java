package com.SIIH.proye.clinical.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "care_encounter")
public class CareEncounter {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "encounter_code", nullable = false, unique = true, length = 30)
    private String encounterCode;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "appointment_id", unique = true)
    private UUID appointmentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "encounter_type", nullable = false, length = 25)
    private EncounterType encounterType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EncounterStatus status = EncounterStatus.OPEN;

    @Column(name = "opened_at", nullable = false)
    private Instant openedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private Long version;

    protected CareEncounter() {
    }

    public CareEncounter(String encounterCode, UUID patientId, UUID appointmentId, EncounterType encounterType) {
        this.encounterCode = encounterCode;
        this.patientId = patientId;
        this.appointmentId = appointmentId;
        this.encounterType = encounterType;
        this.openedAt = Instant.now();
        this.createdAt = this.openedAt;
        this.updatedAt = this.openedAt;
        this.version = 0L;
    }

    public UUID getId() { return id; }
    public String getEncounterCode() { return encounterCode; }
    public UUID getPatientId() { return patientId; }
    public UUID getAppointmentId() { return appointmentId; }
    public EncounterStatus getStatus() { return status; }
}
