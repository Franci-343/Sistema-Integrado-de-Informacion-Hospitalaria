package com.SIIH.proye.appointments.api;

import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AppointmentCreateRequest(
        @NotNull UUID patientId,
        @NotNull UUID professionalId,
        @NotNull UUID specialtyId,
        @NotNull OffsetDateTime startsAt,
        @NotNull OffsetDateTime endsAt,
        String reason,
        String idempotencyKey
) {
}
