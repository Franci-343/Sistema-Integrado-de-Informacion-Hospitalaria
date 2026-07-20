package com.SIIH.proye.patients.api;

import com.SIIH.proye.patients.domain.PatientStatus;
import com.SIIH.proye.patients.domain.Sex;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;

import java.time.LocalDate;

public record PatientUpdateRequest(
        @NotBlank String firstName,
        String middleName,
        @NotBlank String lastName,
        String secondLastName,
        @NotNull @Past LocalDate birthDate,
        @NotNull Sex sex,
        String phone,
        @Email String email,
        String address,
        String emergencyContactName,
        String emergencyContactPhone,
        String bloodType,
        @NotNull PatientStatus status
) {
}
