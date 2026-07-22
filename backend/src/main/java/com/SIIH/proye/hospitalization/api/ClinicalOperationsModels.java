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

    public record BedResponse(UUID id, String code, String room, String bed, String status,
                              String serviceCode, String floor, String bedType) {
        public BedResponse(UUID id, String code, String room, String bed, String status) {
            this(id, code, room, bed, status, null, null, null);
        }
    }

    public record HospitalizationOriginResponse(
            UUID encounterId,
            String encounterCode,
            String encounterType,
            UUID patientId,
            String patientCode,
            String patientName,
            UUID appointmentId,
            String appointmentCode,
            String consultationCode,
            OffsetDateTime openedAt
    ) {
    }

    public record HospitalizationOrderCreateRequest(
            @NotNull UUID originEncounterId,
            @NotNull UUID responsibleProfessionalId,
            @NotBlank String reason,
            @NotBlank String presumptiveDiagnosis,
            @NotBlank String destinationService
    ) {
    }

    public record HospitalizationOrderResponse(
            UUID id,
            String orderCode,
            UUID originEncounterId,
            String originEncounterCode,
            String originEncounterType,
            UUID patientId,
            String patientCode,
            String patientName,
            UUID responsibleProfessionalId,
            String responsibleProfessional,
            String reason,
            String presumptiveDiagnosis,
            String destinationService,
            String status,
            OffsetDateTime orderedAt,
            OffsetDateTime executedAt,
            OffsetDateTime cancelledAt
    ) {
    }

    public record HospitalizationCreateRequest(
            UUID patientId,
            @NotNull UUID hospitalizationOrderId,
            @NotNull UUID bedId,
            UUID responsibleProfessionalId,
            String admissionReason
    ) {
    }

    public enum DischargeType { MEDICAL, VOLUNTARY, TRANSFER, DEATH, ABANDONMENT }

    public record DischargeRequest(
            @NotBlank String dischargeDiagnosis,
            @NotNull DischargeType dischargeType,
            @NotBlank String dischargeInstructions,
            String followUpPlan,
            String medicationsOnDischarge
    ) {
    }

    public record NursingNoteRequest(
            @DecimalMin("20.0") @DecimalMax("50.0") BigDecimal temperatureC,
            @Min(40) @Max(300) Integer systolicBp,
            @Min(20) @Max(200) Integer diastolicBp,
            @Min(20) @Max(250) Integer heartRate,
            @Min(5) @Max(80) Integer respiratoryRate,
            @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal oxygenSaturation,
            @DecimalMin(value = "0.0", inclusive = false) BigDecimal glucoseMgDl,
            @DecimalMin(value = "0.0", inclusive = false) BigDecimal weightKg,
            @NotBlank String note
    ) {
    }

    public record NursingNoteResponse(
            UUID id,
            BigDecimal temperatureC,
            Integer systolicBp,
            Integer diastolicBp,
            Integer heartRate,
            Integer respiratoryRate,
            BigDecimal oxygenSaturation,
            BigDecimal glucoseMgDl,
            BigDecimal weightKg,
            String note,
            String recordedBy,
            OffsetDateTime recordedAt
    ) {
    }

    public record HospitalizationResponse(
            UUID id,
            String hospitalizationCode,
            UUID hospitalizationOrderId,
            String hospitalizationOrderCode,
            UUID originEncounterId,
            String originEncounterCode,
            String originEncounterType,
            UUID patientId,
            String patientCode,
            String patientName,
            UUID bedId,
            String bedCode,
            String room,
            String bed,
            String bedServiceCode,
            String bedFloor,
            String bedType,
            String status,
            String admissionReason,
            String dischargeDiagnosis,
            String dischargeType,
            String dischargeInstructions,
            String followUpPlan,
            String medicationsOnDischarge,
            String responsibleProfessional,
            OffsetDateTime admittedAt,
            OffsetDateTime dischargedAt,
            List<NursingNoteResponse> nursingNotes
    ) {
    }
}
