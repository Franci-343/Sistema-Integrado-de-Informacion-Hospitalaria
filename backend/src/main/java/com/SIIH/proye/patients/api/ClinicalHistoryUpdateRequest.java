package com.SIIH.proye.patients.api;

public record ClinicalHistoryUpdateRequest(
        String background,
        String allergies,
        String familyHistory,
        String surgicalHistory,
        String relevantNotes
) {
}
