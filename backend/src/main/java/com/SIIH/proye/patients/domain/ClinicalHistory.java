package com.SIIH.proye.patients.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "clinical_history")
public class ClinicalHistory {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "patient_id", nullable = false, unique = true)
    private UUID patientId;

    @Column(columnDefinition = "TEXT")
    private String background;

    @Column(columnDefinition = "TEXT")
    private String allergies;

    @Column(name = "family_history", columnDefinition = "TEXT")
    private String familyHistory;

    @Column(name = "surgical_history", columnDefinition = "TEXT")
    private String surgicalHistory;

    @Column(name = "relevant_notes", columnDefinition = "TEXT")
    private String relevantNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private Long version;

    protected ClinicalHistory() {
    }

    public ClinicalHistory(UUID patientId) {
        this.patientId = patientId;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
        this.version = 0L;
    }

    public UUID getId() { return id; }
    public UUID getPatientId() { return patientId; }
    public String getBackground() { return background; }
    public String getAllergies() { return allergies; }
    public String getFamilyHistory() { return familyHistory; }
    public String getSurgicalHistory() { return surgicalHistory; }
    public String getRelevantNotes() { return relevantNotes; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void update(String background, String allergies, String familyHistory,
                       String surgicalHistory, String relevantNotes) {
        this.background = background;
        this.allergies = allergies;
        this.familyHistory = familyHistory;
        this.surgicalHistory = surgicalHistory;
        this.relevantNotes = relevantNotes;
        this.updatedAt = Instant.now();
    }
}
