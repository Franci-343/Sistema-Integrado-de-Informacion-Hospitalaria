package com.SIIH.proye.patients.api;

import com.SIIH.proye.patients.domain.DocumentType;
import com.SIIH.proye.patients.domain.PatientStatus;
import com.SIIH.proye.patients.domain.Patient;
import com.SIIH.proye.patients.domain.Sex;

import java.time.LocalDate;
import java.time.Period;
import java.util.UUID;

public record PatientResponse(
        UUID id,
        String patientCode,
        DocumentType documentType,
        String documentNumber,
        String fullName,
        LocalDate birthDate,
        int age,
        Sex sex,
        String phone,
        String email,
        String address,
        String emergencyContactName,
        String emergencyContactPhone,
        String bloodType,
        PatientStatus status
) {
    public static PatientResponse from(Patient patient) {
        StringBuilder name = new StringBuilder(patient.getFirstName());
        if (patient.getMiddleName() != null && !patient.getMiddleName().isBlank()) name.append(' ').append(patient.getMiddleName());
        name.append(' ').append(patient.getLastName());
        if (patient.getSecondLastName() != null && !patient.getSecondLastName().isBlank()) name.append(' ').append(patient.getSecondLastName());
        return new PatientResponse(
                patient.getId(), patient.getPatientCode(), patient.getDocumentType(), patient.getDocumentNumber(),
                name.toString(), patient.getBirthDate(), Period.between(patient.getBirthDate(), LocalDate.now()).getYears(),
                patient.getSex(), patient.getPhone(), patient.getEmail(), patient.getAddress(),
                patient.getEmergencyContactName(), patient.getEmergencyContactPhone(), patient.getBloodType(), patient.getStatus()
        );
    }
}
