package com.SIIH.proye.patients.api;

import com.SIIH.proye.patients.domain.ClinicalHistory;

import java.time.Instant;
import java.util.UUID;

public record ClinicalHistoryResponse(
        UUID id,
        UUID patientId,
        String background,
        String allergies,
        String familyHistory,
        String surgicalHistory,
        String relevantNotes,
        Instant updatedAt
) {
    public static ClinicalHistoryResponse from(ClinicalHistory history) {
        return new ClinicalHistoryResponse(history.getId(), history.getPatientId(), history.getBackground(),
                history.getAllergies(), history.getFamilyHistory(), history.getSurgicalHistory(),
                history.getRelevantNotes(), history.getUpdatedAt());
    }
}
