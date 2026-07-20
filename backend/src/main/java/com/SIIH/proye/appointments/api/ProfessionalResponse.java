package com.SIIH.proye.appointments.api;

import com.SIIH.proye.appointments.domain.Professional;

import java.util.UUID;

public record ProfessionalResponse(
        UUID id,
        String professionalCode,
        String professionalType,
        String displayName,
        String licenseNumber
) {
    public static ProfessionalResponse from(Professional professional, String displayName) {
        return new ProfessionalResponse(professional.getId(), professional.getProfessionalCode(),
                professional.getProfessionalType(), displayName, professional.getLicenseNumber());
    }
}
