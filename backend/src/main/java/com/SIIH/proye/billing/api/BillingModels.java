package com.SIIH.proye.billing.api;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public final class BillingModels {

    private BillingModels() {
    }

    public record ServiceResponse(UUID id, String code, String name, String description, String serviceType,
                                  BigDecimal defaultPrice, boolean active) {
    }

    public record ChargeCreateRequest(
            @NotNull UUID patientId,
            @NotNull UUID serviceId,
            @Positive BigDecimal quantity,
            @DecimalMin("0.0") BigDecimal unitPrice,
            @NotBlank String idempotencyKey
    ) {
    }

    public record ChargeResponse(
            UUID id,
            String chargeCode,
            UUID patientId,
            String patientCode,
            String patientName,
            String description,
            BigDecimal quantity,
            BigDecimal unitPrice,
            BigDecimal subtotal,
            String status,
            OffsetDateTime registeredAt
    ) {
    }

    public record InvoiceCreateRequest(
            @NotNull UUID patientId,
            @NotEmpty List<UUID> chargeIds,
            @DecimalMin("0.0") BigDecimal discount,
            @DecimalMin("0.0") BigDecimal tax,
            @NotBlank String idempotencyKey
    ) {
    }

    public record InvoiceItemResponse(
            UUID id,
            UUID chargeId,
            String description,
            BigDecimal quantity,
            BigDecimal unitPrice,
            BigDecimal subtotal
    ) {
    }

    public enum PaymentMethod { CASH, CARD, TRANSFER, QR, OTHER }

    public record PaymentCreateRequest(
            @NotNull UUID invoiceId,
            @Positive BigDecimal amount,
            @NotNull PaymentMethod paymentMethod,
            @NotBlank String idempotencyKey
    ) {
    }

    public record PaymentResponse(
            UUID id,
            String paymentCode,
            UUID invoiceId,
            String invoiceCode,
            BigDecimal amount,
            String paymentMethod,
            String status,
            OffsetDateTime paidAt,
            String registeredBy
    ) {
    }

    public record InvoiceResponse(
            UUID id,
            String invoiceCode,
            UUID patientId,
            String patientCode,
            String patientName,
            String status,
            String currency,
            BigDecimal subtotal,
            BigDecimal discount,
            BigDecimal tax,
            BigDecimal total,
            BigDecimal paidAmount,
            BigDecimal balance,
            OffsetDateTime issuedAt,
            OffsetDateTime createdAt,
            List<InvoiceItemResponse> items,
            List<PaymentResponse> payments
    ) {
    }
}
