package com.SIIH.proye.pharmacy.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public final class PharmacyModels {

    private PharmacyModels() {
    }

    public record MedicationCreateRequest(
            @NotBlank String code,
            @NotBlank String genericName,
            String commercialName,
            @NotBlank String presentation,
            String concentration,
            String route,
            @DecimalMin("0.0") BigDecimal minimumStock
    ) {
    }

    public record MedicationResponse(
            UUID id,
            String code,
            String genericName,
            String commercialName,
            String presentation,
            String concentration,
            String route,
            BigDecimal minimumStock,
            BigDecimal availableQuantity,
            boolean active
    ) {
    }

    public record PrescriptionItemRequest(
            @NotNull UUID medicationId,
            @NotBlank String dose,
            @NotBlank String route,
            @NotBlank String frequency,
            @NotBlank String duration,
            @Positive BigDecimal quantity,
            @NotBlank String instructions
    ) {
    }

    public record PrescriptionCreateRequest(
            @NotNull UUID consultationId,
            @FutureOrPresent LocalDate validUntil,
            String notes,
            @NotBlank String idempotencyKey,
            @NotEmpty List<@Valid PrescriptionItemRequest> items
    ) {
    }

    public record PrescriptionItemResponse(
            UUID id,
            UUID medicationId,
            String medicationCode,
            String medicationName,
            String presentation,
            String dose,
            String route,
            String frequency,
            String duration,
            BigDecimal quantityPrescribed,
            BigDecimal quantityDispensed,
            String instructions
    ) {
    }

    public record PrescriptionResponse(
            UUID id,
            String prescriptionCode,
            UUID consultationId,
            String consultationCode,
            UUID patientId,
            String patientCode,
            String patientName,
            String prescriber,
            LocalDate issuedOn,
            LocalDate validUntil,
            String status,
            String notes,
            List<PrescriptionItemResponse> items
    ) {
    }

    public record DispensationItemRequest(
            @NotNull UUID prescriptionItemId,
            @NotNull UUID batchId,
            @Positive BigDecimal quantity
    ) {
    }

    public record DispensationCreateRequest(
            @NotNull UUID prescriptionId,
            @NotBlank String idempotencyKey,
            String notes,
            @NotEmpty List<@Valid DispensationItemRequest> items
    ) {
    }

    public record DispensationItemResponse(
            UUID id,
            UUID prescriptionItemId,
            String medicationName,
            UUID batchId,
            String batchCode,
            BigDecimal quantity,
            BigDecimal unitPrice
    ) {
    }

    public record DispensationResponse(
            UUID id,
            String dispensationCode,
            UUID prescriptionId,
            String prescriptionCode,
            UUID patientId,
            String patientCode,
            String patientName,
            String pharmacist,
            String status,
            OffsetDateTime dispensedAt,
            String notes,
            List<DispensationItemResponse> items
    ) {
    }

    public record InventoryLocationResponse(UUID id, String code, String name, String locationType, boolean active) {
    }

    public record BatchCreateRequest(
            @NotNull UUID medicationId,
            @NotBlank String batchCode,
            @NotNull LocalDate receivedOn,
            @NotNull @FutureOrPresent LocalDate expiresOn,
            @DecimalMin("0.0") BigDecimal unitCost,
            String supplierName,
            @NotNull UUID locationId,
            @DecimalMin("0.0") BigDecimal initialQuantity,
            @NotBlank String idempotencyKey
    ) {
    }

    public record BatchStockResponse(
            UUID batchId,
            UUID medicationId,
            String medicationCode,
            String medicationName,
            String batchCode,
            LocalDate receivedOn,
            LocalDate expiresOn,
            BigDecimal unitCost,
            String supplierName,
            UUID locationId,
            String locationCode,
            String locationName,
            BigDecimal availableQuantity,
            BigDecimal reservedQuantity,
            boolean active
    ) {
    }

    public enum StockMovementType { IN, OUT, TRANSFER, ADJUSTMENT }
    public enum AdjustmentDirection { INCREASE, DECREASE }

    public record StockMovementRequest(
            @NotNull UUID batchId,
            @NotNull StockMovementType movementType,
            UUID sourceLocationId,
            UUID targetLocationId,
            AdjustmentDirection adjustmentDirection,
            @Positive BigDecimal quantity,
            String reason,
            @NotBlank String idempotencyKey
    ) {
    }

    public record StockMovementResponse(
            UUID id,
            String movementCode,
            UUID medicationId,
            String medicationName,
            UUID batchId,
            String batchCode,
            UUID sourceLocationId,
            UUID targetLocationId,
            String movementType,
            BigDecimal quantity,
            String reason,
            String performedBy,
            OffsetDateTime occurredAt
    ) {
    }
}
