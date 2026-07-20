package com.SIIH.proye.operations.api;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class OperationalController {

    private final JdbcTemplate jdbcTemplate;

    public OperationalController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/laboratory/overview")
    public Map<String, Object> laboratory() {
        return overview(
                jdbcTemplate.queryForMap("""
                        SELECT
                            COUNT(*) AS "totalOrders",
                            COUNT(*) FILTER (WHERE status IN ('REQUESTED', 'RECEIVED', 'IN_PROCESS')) AS "pendingOrders",
                            COUNT(*) FILTER (WHERE status IN ('VALIDATED', 'PUBLISHED')) AS "completedOrders"
                        FROM lab_order
                        """),
                "catalog", jdbcTemplate.queryForList("""
                        SELECT id::text AS id, code, name, sample_type AS "sampleType",
                               unit, reference_range AS "referenceRange", price, active
                        FROM lab_test_catalog
                        ORDER BY active DESC, name
                        """),
                "orders", jdbcTemplate.queryForList("""
                        SELECT o.id::text AS id, o.order_code AS "orderCode",
                               p.patient_code AS "patientCode",
                               p.first_name || ' ' || p.last_name AS "patientName",
                               c.consultation_code AS "consultationCode",
                               o.status, o.clinical_notes AS "clinicalNotes",
                               o.requested_at AS "requestedAt", COUNT(oi.id) AS "testCount"
                        FROM lab_order o
                        JOIN patient p ON p.id = o.patient_id
                        JOIN consultation c ON c.id = o.consultation_id
                        LEFT JOIN lab_order_item oi ON oi.lab_order_id = o.id
                        GROUP BY o.id, p.patient_code, p.first_name, p.last_name, c.consultation_code
                        ORDER BY o.requested_at DESC
                        LIMIT 50
                        """)
        );
    }

    @GetMapping("/pharmacy/overview")
    public Map<String, Object> pharmacy() {
        return overview(
                jdbcTemplate.queryForMap("""
                        SELECT COUNT(*) AS "medicationCount",
                               COUNT(*) FILTER (WHERE m.active) AS "activeMedicationCount",
                               COUNT(*) FILTER (WHERE COALESCE(stock.available_quantity, 0) < m.minimum_stock) AS "lowStockCount"
                        FROM medication m
                        LEFT JOIN (
                            SELECT medication_id, SUM(available_quantity) AS available_quantity
                            FROM inventory_stock GROUP BY medication_id
                        ) stock ON stock.medication_id = m.id
                        """),
                "medications", jdbcTemplate.queryForList("""
                        SELECT m.id::text AS id, m.code, m.generic_name AS "genericName",
                               m.commercial_name AS "commercialName", m.presentation,
                               m.concentration, m.route, m.minimum_stock AS "minimumStock",
                               COALESCE(SUM(s.available_quantity), 0) AS "availableQuantity",
                               COUNT(DISTINCT b.id) AS "batchCount",
                               MIN(b.expires_on) AS "nextExpiry", m.active
                        FROM medication m
                        LEFT JOIN medication_batch b ON b.medication_id = m.id AND b.active
                        LEFT JOIN inventory_stock s ON s.batch_id = b.id
                        GROUP BY m.id
                        ORDER BY m.active DESC, m.generic_name
                        """),
                "prescriptions", jdbcTemplate.queryForList("""
                        SELECT pr.id::text AS id, pr.prescription_code AS "prescriptionCode",
                               p.patient_code AS "patientCode",
                               p.first_name || ' ' || p.last_name AS "patientName",
                               pr.status, pr.issued_on AS "issuedOn", pr.valid_until AS "validUntil"
                        FROM prescription pr
                        JOIN patient p ON p.id = pr.patient_id
                        ORDER BY pr.created_at DESC
                        LIMIT 50
                        """)
        );
    }

    @GetMapping("/inventory/overview")
    public Map<String, Object> inventory() {
        return overview(
                jdbcTemplate.queryForMap("""
                        SELECT COUNT(*) AS "stockLines",
                               COALESCE(SUM(s.available_quantity), 0) AS "totalUnits",
                               COUNT(*) FILTER (WHERE s.available_quantity < m.minimum_stock) AS "lowStockLines",
                               COUNT(*) FILTER (WHERE b.expires_on <= CURRENT_DATE + 30) AS "expiringSoonLines"
                        FROM inventory_stock s
                        JOIN medication m ON m.id = s.medication_id
                        JOIN medication_batch b ON b.id = s.batch_id
                        """),
                "locations", jdbcTemplate.queryForList("""
                        SELECT id::text AS id, code, name, location_type AS "locationType", active
                        FROM inventory_location ORDER BY active DESC, name
                        """),
                "stock", jdbcTemplate.queryForList("""
                        SELECT s.id::text AS id, m.code AS "medicationCode",
                               m.generic_name AS "genericName", b.batch_code AS "batchCode",
                               b.expires_on AS "expiresOn", l.code AS "locationCode",
                               l.name AS "locationName", s.available_quantity AS "availableQuantity",
                               s.reserved_quantity AS "reservedQuantity",
                               (s.available_quantity < m.minimum_stock) AS "lowStock"
                        FROM inventory_stock s
                        JOIN medication m ON m.id = s.medication_id
                        JOIN medication_batch b ON b.id = s.batch_id
                        JOIN inventory_location l ON l.id = s.location_id
                        ORDER BY b.expires_on, m.generic_name
                        """),
                "movements", jdbcTemplate.queryForList("""
                        SELECT sm.id::text AS id, sm.movement_code AS "movementCode",
                               m.generic_name AS "genericName", sm.movement_type AS "movementType",
                               sm.quantity, sm.reason, sm.occurred_at AS "occurredAt"
                        FROM stock_movement sm
                        JOIN medication m ON m.id = sm.medication_id
                        ORDER BY sm.occurred_at DESC LIMIT 50
                        """)
        );
    }

    @GetMapping("/billing/overview")
    public Map<String, Object> billing() {
        return overview(
                jdbcTemplate.queryForMap("""
                        SELECT COUNT(*) AS "chargeCount",
                               COUNT(*) FILTER (WHERE status = 'PENDING') AS "pendingChargeCount",
                               COALESCE(SUM(unit_price * quantity) FILTER (WHERE status = 'PENDING'), 0) AS "pendingAmount"
                        FROM charge
                        """),
                "invoices", jdbcTemplate.queryForList("""
                        SELECT i.id::text AS id, i.invoice_code AS "invoiceCode",
                               p.patient_code AS "patientCode",
                               p.first_name || ' ' || p.last_name AS "patientName",
                               i.status, i.currency, i.subtotal, i.discount, i.tax, i.total,
                               i.issued_at AS "issuedAt"
                        FROM invoice i
                        JOIN patient p ON p.id = i.patient_id
                        ORDER BY i.created_at DESC LIMIT 50
                        """),
                "charges", jdbcTemplate.queryForList("""
                        SELECT ch.id::text AS id, ch.charge_code AS "chargeCode",
                               p.patient_code AS "patientCode", sc.name AS description,
                               ch.quantity, ch.unit_price AS "unitPrice",
                               ch.quantity * ch.unit_price AS subtotal, ch.status,
                               ch.registered_at AS "registeredAt"
                        FROM charge ch
                        JOIN patient p ON p.id = ch.patient_id
                        LEFT JOIN service_catalog sc ON sc.id = ch.service_id
                        ORDER BY ch.registered_at DESC LIMIT 50
                        """),
                "payments", jdbcTemplate.queryForList("""
                        SELECT py.id::text AS id, py.payment_code AS "paymentCode",
                               i.invoice_code AS "invoiceCode", py.amount,
                               py.payment_method AS "paymentMethod", py.status,
                               py.paid_at AS "paidAt"
                        FROM payment py JOIN invoice i ON i.id = py.invoice_id
                        ORDER BY py.paid_at DESC LIMIT 50
                        """)
        );
    }

    @GetMapping("/reports/overview")
    public Map<String, Object> reports() {
        return overview(
                jdbcTemplate.queryForMap("""
                        SELECT
                            (SELECT COUNT(*) FROM patient WHERE status = 'ACTIVE') AS "activePatients",
                            (SELECT COUNT(*) FROM appointment WHERE status NOT IN ('CANCELLED', 'NO_SHOW')) AS "activeAppointments",
                            (SELECT COUNT(*) FROM consultation) AS consultations,
                            (SELECT COUNT(*) FROM lab_order) AS "labOrders",
                            (SELECT COUNT(*) FROM invoice) AS invoices,
                            (SELECT COALESCE(SUM(available_quantity), 0) FROM inventory_stock) AS "inventoryUnits"
                        """),
                "appointmentsByStatus", jdbcTemplate.queryForList("""
                        SELECT status, COUNT(*) AS count
                        FROM appointment GROUP BY status ORDER BY count DESC, status
                        """),
                "appointmentsBySpecialty", jdbcTemplate.queryForList("""
                        SELECT s.name AS specialty, COUNT(*) AS count
                        FROM appointment a JOIN specialty s ON s.id = a.specialty_id
                        GROUP BY s.name ORDER BY count DESC, specialty
                        """),
                "recentActivity", jdbcTemplate.queryForList("""
                        SELECT 'APPOINTMENT' AS type, appointment_code AS code,
                               status, starts_at AS "occurredAt"
                        FROM appointment ORDER BY starts_at DESC LIMIT 10
                        """)
        );
    }

    @GetMapping("/administration/overview")
    public Map<String, Object> administration() {
        return overview(
                jdbcTemplate.queryForMap("""
                        SELECT COUNT(*) AS "userCount",
                               COUNT(*) FILTER (WHERE status = 'ACTIVE') AS "activeUserCount",
                               COUNT(*) FILTER (WHERE status = 'LOCKED') AS "lockedUserCount",
                               (SELECT COUNT(*) FROM audit_event) AS "auditEventCount"
                        FROM app_user
                        """),
                "users", jdbcTemplate.queryForList("""
                        SELECT u.id::text AS id, u.username,
                               u.first_name || ' ' || u.last_name AS "displayName",
                               u.email, u.status, u.last_login_at AS "lastLoginAt",
                               COALESCE(string_agg(r.name, ', ' ORDER BY r.name), 'Sin rol') AS roles
                        FROM app_user u
                        LEFT JOIN user_role ur ON ur.user_id = u.id
                        LEFT JOIN role r ON r.id = ur.role_id
                        GROUP BY u.id
                        ORDER BY u.status, "displayName"
                        """),
                "audit", jdbcTemplate.queryForList("""
                        SELECT ae.id::text AS id, ae.action, ae.entity_type AS "entityType",
                               ae.success, ae.event_at AS "eventAt", u.username
                        FROM audit_event ae LEFT JOIN app_user u ON u.id = ae.user_id
                        ORDER BY ae.event_at DESC LIMIT 30
                        """)
        );
    }

    private Map<String, Object> overview(Object summary, Object... sections) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("summary", summary);
        for (int i = 0; i < sections.length; i += 2) {
            response.put((String) sections[i], sections[i + 1]);
        }
        return response;
    }
}
