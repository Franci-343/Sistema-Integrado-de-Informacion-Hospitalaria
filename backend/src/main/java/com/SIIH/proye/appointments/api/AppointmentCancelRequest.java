package com.SIIH.proye.appointments.api;

import jakarta.validation.constraints.NotBlank;

public record AppointmentCancelRequest(@NotBlank String reason) {
}
