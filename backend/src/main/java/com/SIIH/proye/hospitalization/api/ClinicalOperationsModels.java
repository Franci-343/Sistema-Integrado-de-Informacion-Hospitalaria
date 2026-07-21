package com.SIIH.proye.hospitalization.api;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public final class ClinicalOperationsModels {

    private ClinicalOperationsModels() {
    }

    public enum TriagePriority { RED, ORANGE, YELLOW, GREEN, BLUE }

    public record TriageCreateRequest(
            @NotNull UUID patientId,
            UUID encounterId,
            @NotNull TriagePriority priority,
            @DecimalMin("20.0") @DecimalMax("50.0") BigDecimal temperatureC,
            @Min(40) @Max(300) Integer systolicBp,
            @Min(20) @Max(200) Integer diastolicBp,
            @Min(20) @Max(250) Integer heartRate,
            @Min(5) @Max(80) Integer respiratoryRate,
            @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal oxygenSaturation,
            @DecimalMin(value = "0.0", inclusive = false) BigDecimal weightKg,
            @DecimalMin(value = "0.0", inclusive = false) BigDecimal heightCm,
            String notes
    ) {
    }

    public record TriageUpdateRequest(
            @NotNull TriagePriority priority,
            @DecimalMin("20.0") @DecimalMax("50.0") BigDecimal temperatureC,
            @Min(40) @Max(300) Integer systolicBp,
            @Min(20) @Max(200) Integer diastolicBp,
            @Min(20) @Max(250) Integer heartRate,
            @Min(5) @Max(80) Integer respiratoryRate,
            @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal oxygenSaturation,
            @DecimalMin(value = "0.0", inclusive = false) BigDecimal weightKg,
            @DecimalMin(value = "0.0", inclusive = false) BigDecimal heightCm,
            String notes
    ) {
    }

    public record TriageResponse(
            UUID id,
            UUID encounterId,
            String encounterCode,
            UUID patientId,
            String patientCode,
            String patientName,
            String priority,
            BigDecimal temperatureC,
            Integer systolicBp,
            Integer diastolicBp,
            Integer heartRate,
            Integer respiratoryRate,
            BigDecimal oxygenSaturation,
            BigDecimal weightKg,
            BigDecimal heightCm,
            String notes,
            String recordedBy,
            OffsetDateTime recordedAt
    ) {
    }

    public record BedResponse(UUID id, String code, String room, String bed, String status) {
    }

    public record HospitalizationCreateRequest(
            @NotNull UUID patientId,
            @NotNull UUID bedId,
            @NotNull UUID responsibleProfessionalId,
            @NotBlank String admissionReason
    ) {
    }

    public record DischargeRequest(@NotBlank String dischargeInstructions) {
    }

    public record NursingNoteRequest(@NotBlank String note) {
    }

    public record NursingNoteResponse(
            UUID id,
            String note,
            String recordedBy,
            OffsetDateTime recordedAt
    ) {
    }

    public record HospitalizationResponse(
            UUID id,
            String hospitalizationCode,
            UUID patientId,
            String patientCode,
            String patientName,
            UUID bedId,
            String bedCode,
            String room,
            String bed,
            String status,
            String admissionReason,
            String dischargeInstructions,
            String responsibleProfessional,
            OffsetDateTime admittedAt,
            OffsetDateTime dischargedAt,
            List<NursingNoteResponse> nursingNotes
    ) {
    }
}
