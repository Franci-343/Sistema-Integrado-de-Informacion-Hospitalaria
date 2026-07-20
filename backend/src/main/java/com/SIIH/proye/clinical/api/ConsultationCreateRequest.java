package com.SIIH.proye.clinical.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ConsultationCreateRequest(
        @NotNull UUID patientId,
        @NotNull UUID professionalId,
        UUID appointmentId,
        @NotBlank String chiefComplaint,
        String evolution,
        String recommendations
) {
}
