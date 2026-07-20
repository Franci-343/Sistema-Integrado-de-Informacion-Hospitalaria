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
@Table(name = "consultation")
public class Consultation {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "consultation_code", nullable = false, unique = true, length = 30)
    private String consultationCode;

    @Column(name = "encounter_id", nullable = false, unique = true)
    private UUID encounterId;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "professional_id", nullable = false)
    private UUID professionalId;

    @Column(name = "chief_complaint", columnDefinition = "TEXT")
    private String chiefComplaint;

    @Column(columnDefinition = "TEXT")
    private String evolution;

    @Column(name = "diagnosis_summary", columnDefinition = "TEXT")
    private String diagnosisSummary;

    @Column(name = "treatment_plan", columnDefinition = "TEXT")
    private String treatmentPlan;

    @Column(columnDefinition = "TEXT")
    private String recommendations;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ConsultationStatus status = ConsultationStatus.DRAFT;

    @Column(name = "signed_at")
    private Instant signedAt;

    @Column(name = "signed_by")
    private UUID signedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private Long version;

    protected Consultation() {
    }

    public Consultation(String consultationCode, UUID encounterId, UUID patientId, UUID professionalId,
                        String chiefComplaint, String evolution, String recommendations) {
        this.consultationCode = consultationCode;
        this.encounterId = encounterId;
        this.patientId = patientId;
        this.professionalId = professionalId;
        this.chiefComplaint = chiefComplaint;
        this.evolution = evolution;
        this.recommendations = recommendations;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
        this.version = 0L;
    }

    public UUID getId() { return id; }
    public String getConsultationCode() { return consultationCode; }
    public UUID getEncounterId() { return encounterId; }
    public UUID getPatientId() { return patientId; }
    public UUID getProfessionalId() { return professionalId; }
    public String getChiefComplaint() { return chiefComplaint; }
    public String getEvolution() { return evolution; }
    public String getDiagnosisSummary() { return diagnosisSummary; }
    public String getTreatmentPlan() { return treatmentPlan; }
    public String getRecommendations() { return recommendations; }
    public ConsultationStatus getStatus() { return status; }
    public Instant getSignedAt() { return signedAt; }
    public Instant getCreatedAt() { return createdAt; }

    public void close(String chiefComplaint, String evolution, String diagnosisSummary,
                      String treatmentPlan, String recommendations, UUID signedBy) {
        this.chiefComplaint = chiefComplaint;
        this.evolution = evolution;
        this.diagnosisSummary = diagnosisSummary;
        this.treatmentPlan = treatmentPlan;
        this.recommendations = recommendations;
        this.status = ConsultationStatus.CLOSED;
        this.signedAt = Instant.now();
        this.signedBy = signedBy;
        this.updatedAt = Instant.now();
    }
}
