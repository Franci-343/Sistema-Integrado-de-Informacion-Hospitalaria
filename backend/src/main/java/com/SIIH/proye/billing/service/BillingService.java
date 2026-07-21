package com.SIIH.proye.billing.service;

import com.SIIH.proye.billing.api.BillingModels.ChargeCreateRequest;
import com.SIIH.proye.billing.api.BillingModels.ChargeResponse;
import com.SIIH.proye.billing.api.BillingModels.InvoiceCreateRequest;
import com.SIIH.proye.billing.api.BillingModels.InvoiceItemResponse;
import com.SIIH.proye.billing.api.BillingModels.InvoiceResponse;
import com.SIIH.proye.billing.api.BillingModels.PaymentCreateRequest;
import com.SIIH.proye.billing.api.BillingModels.PaymentResponse;
import com.SIIH.proye.billing.api.BillingModels.ServiceResponse;
import com.SIIH.proye.common.audit.AuditService;
import com.SIIH.proye.common.database.CodeGenerator;
import com.SIIH.proye.common.exception.ConflictException;
import com.SIIH.proye.common.exception.ResourceNotFoundException;
import com.SIIH.proye.security.AuthenticatedUser;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class BillingService {

    private final JdbcTemplate jdbcTemplate;
    private final NamedParameterJdbcTemplate namedJdbcTemplate;
    private final AuditService auditService;

    public BillingService(JdbcTemplate jdbcTemplate, AuditService auditService) {
        this.jdbcTemplate = jdbcTemplate;
        this.namedJdbcTemplate = new NamedParameterJdbcTemplate(jdbcTemplate);
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<ServiceResponse> services() {
        return jdbcTemplate.query("""
                SELECT id, code, name, description, service_type, default_price, active
                FROM service_catalog ORDER BY active DESC, name
                """, (result, row) -> new ServiceResponse(result.getObject("id", UUID.class), result.getString("code"),
                result.getString("name"), result.getString("description"), result.getString("service_type"),
                result.getBigDecimal("default_price"), result.getBoolean("active")));
    }

    @Transactional(readOnly = true)
    public List<ChargeResponse> charges(UUID patientId, String status) {
        return jdbcTemplate.query("""
                SELECT ch.*, p.patient_code,
                       concat_ws(' ', p.first_name, p.middle_name, p.last_name, p.second_last_name) patient_name,
                       COALESCE(sc.name,
                           CASE WHEN ch.lab_order_id IS NOT NULL THEN 'Orden de laboratorio ' || lo.order_code
                                WHEN ch.dispensation_id IS NOT NULL THEN 'Dispensacion ' || d.dispensation_code
                                ELSE 'Prestacion hospitalaria' END) description
                FROM charge ch JOIN patient p ON p.id = ch.patient_id
                LEFT JOIN service_catalog sc ON sc.id = ch.service_id
                LEFT JOIN lab_order lo ON lo.id = ch.lab_order_id
                LEFT JOIN dispensation d ON d.id = ch.dispensation_id
                WHERE (CAST(? AS uuid) IS NULL OR ch.patient_id = CAST(? AS uuid))
                  AND (CAST(? AS varchar) IS NULL OR ch.status = upper(CAST(? AS varchar)))
                ORDER BY ch.registered_at DESC LIMIT 200
                """, BillingService::mapCharge, patientId, patientId, clean(status), clean(status));
    }

    @Transactional
    public ChargeResponse createCharge(ChargeCreateRequest request, AuthenticatedUser user) {
        UUID existing = jdbcTemplate.queryForList("SELECT id FROM charge WHERE idempotency_key = ?",
                UUID.class, request.idempotencyKey().trim()).stream().findFirst().orElse(null);
        if (existing != null) return charge(existing);
        requirePatient(request.patientId());
        ServicePrice service = jdbcTemplate.query("""
                SELECT name, default_price FROM service_catalog WHERE id = ? AND active
                """, (result, row) -> new ServicePrice(result.getString("name"), result.getBigDecimal("default_price")),
                request.serviceId()).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el servicio facturable."));
        BigDecimal quantity = request.quantity() == null ? BigDecimal.ONE : request.quantity();
        BigDecimal price = request.unitPrice() == null ? service.defaultPrice() : request.unitPrice();
        UUID id = jdbcTemplate.queryForObject("""
                INSERT INTO charge (charge_code, patient_id, service_id, quantity, unit_price, registered_by, idempotency_key)
                VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id
                """, UUID.class, CodeGenerator.next("CAR"), request.patientId(), request.serviceId(), quantity, price,
                user.id(), request.idempotencyKey().trim());
        auditService.record("CREATE", "CHARGE", id, user.id(), null,
                Map.of("patientId", request.patientId().toString(), "service", service.name()));
        return charge(id);
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> invoices(UUID patientId, String status) {
        List<UUID> ids = jdbcTemplate.queryForList("""
                SELECT id FROM invoice
                WHERE (CAST(? AS uuid) IS NULL OR patient_id = CAST(? AS uuid))
                  AND (CAST(? AS varchar) IS NULL OR status = upper(CAST(? AS varchar)))
                ORDER BY created_at DESC LIMIT 100
                """, UUID.class, patientId, patientId, clean(status), clean(status));
        return ids.stream().map(this::invoice).toList();
    }

    @Transactional(readOnly = true)
    public InvoiceResponse invoice(UUID id) {
        InvoiceRow row = jdbcTemplate.query("""
                SELECT i.*, p.patient_code,
                       concat_ws(' ', p.first_name, p.middle_name, p.last_name, p.second_last_name) patient_name,
                       COALESCE((SELECT SUM(amount) FROM payment py
                           WHERE py.invoice_id = i.id AND py.status = 'CONFIRMED'), 0) paid_amount
                FROM invoice i JOIN patient p ON p.id = i.patient_id WHERE i.id = ?
                """, BillingService::mapInvoice, id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la factura."));
        List<InvoiceItemResponse> items = jdbcTemplate.query("""
                SELECT id, charge_id, description, quantity, unit_price, subtotal
                FROM invoice_item WHERE invoice_id = ? ORDER BY created_at
                """, (result, number) -> new InvoiceItemResponse(result.getObject("id", UUID.class),
                result.getObject("charge_id", UUID.class), result.getString("description"), result.getBigDecimal("quantity"),
                result.getBigDecimal("unit_price"), result.getBigDecimal("subtotal")), id);
        List<PaymentResponse> payments = payments(id);
        return row.toResponse(items, payments);
    }

    @Transactional
    public InvoiceResponse createInvoice(InvoiceCreateRequest request, AuthenticatedUser user) {
        UUID existing = jdbcTemplate.queryForList("SELECT id FROM invoice WHERE idempotency_key = ?",
                UUID.class, request.idempotencyKey().trim()).stream().findFirst().orElse(null);
        if (existing != null) return invoice(existing);
        requirePatient(request.patientId());
        var chargeIds = new LinkedHashSet<>(request.chargeIds());
        List<ChargeLine> charges = namedJdbcTemplate.query("""
                SELECT ch.id, ch.patient_id, ch.quantity, ch.unit_price,
                       COALESCE(sc.name,
                           CASE WHEN ch.lab_order_id IS NOT NULL THEN 'Orden de laboratorio ' || lo.order_code
                                WHEN ch.dispensation_id IS NOT NULL THEN 'Dispensacion ' || d.dispensation_code
                                ELSE 'Prestacion hospitalaria' END) description
                FROM charge ch
                LEFT JOIN service_catalog sc ON sc.id = ch.service_id
                LEFT JOIN lab_order lo ON lo.id = ch.lab_order_id
                LEFT JOIN dispensation d ON d.id = ch.dispensation_id
                WHERE ch.id IN (:ids) AND ch.status = 'PENDING'
                ORDER BY ch.id FOR UPDATE OF ch
                """, new MapSqlParameterSource("ids", chargeIds), (result, row) -> new ChargeLine(
                result.getObject("id", UUID.class), result.getObject("patient_id", UUID.class),
                result.getString("description"), result.getBigDecimal("quantity"), result.getBigDecimal("unit_price")));
        if (charges.size() != chargeIds.size()) {
            throw new ConflictException("Uno o mas cargos ya fueron facturados o no existen.");
        }
        if (charges.stream().anyMatch(charge -> !charge.patientId().equals(request.patientId()))) {
            throw new ConflictException("Todos los cargos deben pertenecer al paciente seleccionado.");
        }
        BigDecimal subtotal = charges.stream().map(ChargeLine::subtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal discount = request.discount() == null ? BigDecimal.ZERO : request.discount();
        BigDecimal tax = request.tax() == null ? BigDecimal.ZERO : request.tax();
        BigDecimal total = subtotal.subtract(discount).add(tax);
        if (total.signum() < 0) throw new ConflictException("El descuento no puede superar el subtotal mas impuestos.");

        UUID invoiceId = jdbcTemplate.queryForObject("""
                INSERT INTO invoice (invoice_code, patient_id, status, subtotal, discount, tax, total,
                    created_by, idempotency_key)
                VALUES (?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?) RETURNING id
                """, UUID.class, CodeGenerator.next("FAC"), request.patientId(), subtotal, discount, tax, total,
                user.id(), request.idempotencyKey().trim());
        for (ChargeLine charge : charges) {
            jdbcTemplate.update("""
                    INSERT INTO invoice_item (invoice_id, charge_id, description, quantity, unit_price, subtotal)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """, invoiceId, charge.id(), charge.description(), charge.quantity(), charge.unitPrice(), charge.subtotal());
        }
        namedJdbcTemplate.update("UPDATE charge SET status = 'INVOICED' WHERE id IN (:ids)",
                new MapSqlParameterSource("ids", chargeIds));
        auditService.record("CREATE", "INVOICE", invoiceId, user.id(), null,
                Map.of("patientId", request.patientId().toString(), "total", total));
        return invoice(invoiceId);
    }

    @Transactional
    public InvoiceResponse issueInvoice(UUID id, AuthenticatedUser user) {
        String status = jdbcTemplate.query("SELECT status FROM invoice WHERE id = ? FOR UPDATE",
                (result, row) -> result.getString(1), id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la factura."));
        if (!"DRAFT".equals(status)) throw new ConflictException("Solo se puede emitir una factura en borrador.");
        jdbcTemplate.update("UPDATE invoice SET status = 'ISSUED', issued_at = CURRENT_TIMESTAMP WHERE id = ?", id);
        auditService.record("ISSUE", "INVOICE", id, user.id(), Map.of("status", "DRAFT"), Map.of("status", "ISSUED"));
        return invoice(id);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> payments(UUID invoiceId) {
        return jdbcTemplate.query("""
                SELECT py.*, i.invoice_code, concat_ws(' ', u.first_name, u.last_name) registered_by_name
                FROM payment py JOIN invoice i ON i.id = py.invoice_id
                LEFT JOIN app_user u ON u.id = py.registered_by
                WHERE (CAST(? AS uuid) IS NULL OR py.invoice_id = CAST(? AS uuid))
                ORDER BY py.paid_at DESC
                """, BillingService::mapPayment, invoiceId, invoiceId);
    }

    @Transactional
    public PaymentResponse registerPayment(PaymentCreateRequest request, AuthenticatedUser user) {
        UUID existing = jdbcTemplate.queryForList("SELECT id FROM payment WHERE idempotency_key = ?",
                UUID.class, request.idempotencyKey().trim()).stream().findFirst().orElse(null);
        if (existing != null) return payment(existing);
        InvoicePaymentState invoice = jdbcTemplate.query("""
                SELECT id, status, total, COALESCE((SELECT SUM(amount) FROM payment
                    WHERE invoice_id = i.id AND status = 'CONFIRMED'), 0) paid
                FROM invoice i WHERE id = ? FOR UPDATE
                """, (result, row) -> new InvoicePaymentState(result.getObject("id", UUID.class), result.getString("status"),
                result.getBigDecimal("total"), result.getBigDecimal("paid")), request.invoiceId()).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la factura."));
        if (!List.of("ISSUED", "PARTIALLY_PAID").contains(invoice.status())) {
            throw new ConflictException("La factura no admite pagos en su estado actual.");
        }
        BigDecimal balance = invoice.total().subtract(invoice.paid());
        if (request.amount().compareTo(balance) > 0) throw new ConflictException("El pago supera el saldo pendiente.");
        UUID paymentId = jdbcTemplate.queryForObject("""
                INSERT INTO payment (payment_code, invoice_id, amount, payment_method, status, registered_by, idempotency_key)
                VALUES (?, ?, ?, ?, 'CONFIRMED', ?, ?) RETURNING id
                """, UUID.class, CodeGenerator.next("PAG"), request.invoiceId(), request.amount(),
                request.paymentMethod().name(), user.id(), request.idempotencyKey().trim());
        String newStatus = request.amount().compareTo(balance) == 0 ? "PAID" : "PARTIALLY_PAID";
        jdbcTemplate.update("UPDATE invoice SET status = ? WHERE id = ?", newStatus, request.invoiceId());
        auditService.record("REGISTER_PAYMENT", "PAYMENT", paymentId, user.id(), null,
                Map.of("invoiceId", request.invoiceId().toString(), "amount", request.amount()));
        return payment(paymentId);
    }

    private ChargeResponse charge(UUID id) {
        return jdbcTemplate.query("""
                SELECT ch.*, p.patient_code,
                       concat_ws(' ', p.first_name, p.middle_name, p.last_name, p.second_last_name) patient_name,
                       COALESCE(sc.name,
                           CASE WHEN ch.lab_order_id IS NOT NULL THEN 'Orden de laboratorio ' || lo.order_code
                                WHEN ch.dispensation_id IS NOT NULL THEN 'Dispensacion ' || d.dispensation_code
                                ELSE 'Prestacion hospitalaria' END) description
                FROM charge ch JOIN patient p ON p.id = ch.patient_id
                LEFT JOIN service_catalog sc ON sc.id = ch.service_id
                LEFT JOIN lab_order lo ON lo.id = ch.lab_order_id
                LEFT JOIN dispensation d ON d.id = ch.dispensation_id WHERE ch.id = ?
                """, BillingService::mapCharge, id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el cargo."));
    }

    private PaymentResponse payment(UUID id) {
        return jdbcTemplate.query("""
                SELECT py.*, i.invoice_code, concat_ws(' ', u.first_name, u.last_name) registered_by_name
                FROM payment py JOIN invoice i ON i.id = py.invoice_id
                LEFT JOIN app_user u ON u.id = py.registered_by WHERE py.id = ?
                """, BillingService::mapPayment, id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el pago."));
    }

    private void requirePatient(UUID id) {
        if (!Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM patient WHERE id = ? AND status = 'ACTIVE')", Boolean.class, id))) {
            throw new ResourceNotFoundException("No se encontro un paciente activo.");
        }
    }

    private static ChargeResponse mapCharge(ResultSet result, int row) throws SQLException {
        BigDecimal quantity = result.getBigDecimal("quantity");
        BigDecimal unitPrice = result.getBigDecimal("unit_price");
        return new ChargeResponse(result.getObject("id", UUID.class), result.getString("charge_code"),
                result.getObject("patient_id", UUID.class), result.getString("patient_code"), result.getString("patient_name"),
                result.getString("description"), quantity, unitPrice, quantity.multiply(unitPrice), result.getString("status"),
                result.getObject("registered_at", OffsetDateTime.class));
    }

    private static InvoiceRow mapInvoice(ResultSet result, int row) throws SQLException {
        return new InvoiceRow(result.getObject("id", UUID.class), result.getString("invoice_code"),
                result.getObject("patient_id", UUID.class), result.getString("patient_code"), result.getString("patient_name"),
                result.getString("status"), result.getString("currency"), result.getBigDecimal("subtotal"),
                result.getBigDecimal("discount"), result.getBigDecimal("tax"), result.getBigDecimal("total"),
                result.getBigDecimal("paid_amount"), result.getObject("issued_at", OffsetDateTime.class),
                result.getObject("created_at", OffsetDateTime.class));
    }

    private static PaymentResponse mapPayment(ResultSet result, int row) throws SQLException {
        return new PaymentResponse(result.getObject("id", UUID.class), result.getString("payment_code"),
                result.getObject("invoice_id", UUID.class), result.getString("invoice_code"), result.getBigDecimal("amount"),
                result.getString("payment_method"), result.getString("status"),
                result.getObject("paid_at", OffsetDateTime.class), result.getString("registered_by_name"));
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record ServicePrice(String name, BigDecimal defaultPrice) {
    }

    private record ChargeLine(UUID id, UUID patientId, String description, BigDecimal quantity, BigDecimal unitPrice) {
        BigDecimal subtotal() { return quantity.multiply(unitPrice); }
    }

    private record InvoicePaymentState(UUID id, String status, BigDecimal total, BigDecimal paid) {
    }

    private record InvoiceRow(UUID id, String code, UUID patientId, String patientCode, String patientName,
                              String status, String currency, BigDecimal subtotal, BigDecimal discount,
                              BigDecimal tax, BigDecimal total, BigDecimal paid, OffsetDateTime issuedAt,
                              OffsetDateTime createdAt) {
        InvoiceResponse toResponse(List<InvoiceItemResponse> items, List<PaymentResponse> payments) {
            return new InvoiceResponse(id, code, patientId, patientCode, patientName, status, currency, subtotal,
                    discount, tax, total, paid, total.subtract(paid), issuedAt, createdAt, items, payments);
        }
    }
}
