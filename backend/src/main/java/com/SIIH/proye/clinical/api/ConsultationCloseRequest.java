package com.SIIH.proye.clinical.api;

import jakarta.validation.constraints.NotBlank;

public record ConsultationCloseRequest(
        @NotBlank String chiefComplaint,
        String evolution,
        @NotBlank String diagnosisSummary,
        @NotBlank String treatmentPlan,
        String recommendations
) {
}
