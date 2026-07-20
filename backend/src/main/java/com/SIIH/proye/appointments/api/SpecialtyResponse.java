package com.SIIH.proye.appointments.api;

import com.SIIH.proye.appointments.domain.Specialty;

import java.util.UUID;

public record SpecialtyResponse(UUID id, String code, String name, String description) {
    public static SpecialtyResponse from(Specialty specialty) {
        return new SpecialtyResponse(specialty.getId(), specialty.getCode(), specialty.getName(), specialty.getDescription());
    }
}
