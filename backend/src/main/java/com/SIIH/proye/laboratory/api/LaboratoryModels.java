package com.SIIH.proye.laboratory.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public final class LaboratoryModels {

    private LaboratoryModels() {
    }

    public record LabTestResponse(UUID id, String code, String name, String sampleType, String unit,
                                  String referenceRange, BigDecimal price, boolean active) {
    }

    public record LabOrderCreateRequest(
            @NotNull UUID consultationId,
            @NotEmpty List<UUID> testIds,
            String clinicalNotes,
            @NotBlank String idempotencyKey
    ) {
    }

    public record LabSampleCreateRequest(@NotBlank String sampleType) {
    }

    public enum LabSampleStatus { PENDING, RECEIVED, IN_PROCESS, REJECTED, COMPLETED }

    public record LabSampleStatusRequest(@NotNull LabSampleStatus status, String rejectionReason) {
    }

    public record LabResultRequest(
            @NotNull UUID orderItemId,
            String resultText,
            BigDecimal numericValue,
            String unit,
            String referenceRange,
            String observations
    ) {
    }

    public record LabResultResponse(
            UUID id,
            UUID orderItemId,
            String resultText,
            BigDecimal numericValue,
            String unit,
            String referenceRange,
            String observations,
            String status,
            String recordedBy,
            String validatedBy,
            OffsetDateTime recordedAt,
            OffsetDateTime validatedAt,
            OffsetDateTime publishedAt
    ) {
    }

    public record LabOrderItemResponse(
            UUID id,
            UUID testId,
            String testCode,
            String testName,
            String sampleType,
            String status,
            String observations,
            LabResultResponse result
    ) {
    }

    public record LabSampleResponse(
            UUID id,
            String sampleCode,
            String sampleType,
            String status,
            OffsetDateTime collectedAt,
            OffsetDateTime receivedAt,
            String rejectionReason,
            String receivedBy
    ) {
    }

    public record LabOrderResponse(
            UUID id,
            String orderCode,
            UUID consultationId,
            String consultationCode,
            UUID patientId,
            String patientCode,
            String patientName,
            String requestedBy,
            String status,
            String clinicalNotes,
            OffsetDateTime requestedAt,
            List<LabOrderItemResponse> items,
            List<LabSampleResponse> samples
    ) {
    }
}
