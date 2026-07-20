package com.SIIH.proye.appointments.api;

import com.SIIH.proye.appointments.domain.Appointment;
import com.SIIH.proye.appointments.domain.AppointmentStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AppointmentResponse(
        UUID id,
        String appointmentCode,
        UUID patientId,
        UUID professionalId,
        UUID specialtyId,
        OffsetDateTime startsAt,
        OffsetDateTime endsAt,
        AppointmentStatus status,
        String reason,
        String cancellationReason,
        OffsetDateTime arrivedAt
) {
    public static AppointmentResponse from(Appointment appointment) {
        return new AppointmentResponse(appointment.getId(), appointment.getAppointmentCode(), appointment.getPatientId(),
                appointment.getProfessionalId(), appointment.getSpecialtyId(), appointment.getStartsAt(), appointment.getEndsAt(),
                appointment.getStatus(), appointment.getReason(), appointment.getCancellationReason(), appointment.getArrivedAt());
    }
}
