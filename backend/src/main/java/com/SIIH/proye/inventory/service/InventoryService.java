package com.SIIH.proye.inventory.service;

import com.SIIH.proye.common.audit.AuditService;
import com.SIIH.proye.common.database.CodeGenerator;
import com.SIIH.proye.common.exception.ConflictException;
import com.SIIH.proye.common.exception.ResourceNotFoundException;
import com.SIIH.proye.pharmacy.api.PharmacyModels.AdjustmentDirection;
import com.SIIH.proye.pharmacy.api.PharmacyModels.BatchCreateRequest;
import com.SIIH.proye.pharmacy.api.PharmacyModels.BatchStockResponse;
import com.SIIH.proye.pharmacy.api.PharmacyModels.InventoryLocationResponse;
import com.SIIH.proye.pharmacy.api.PharmacyModels.MedicationCreateRequest;
import com.SIIH.proye.pharmacy.api.PharmacyModels.MedicationResponse;
import com.SIIH.proye.pharmacy.api.PharmacyModels.StockMovementRequest;
import com.SIIH.proye.pharmacy.api.PharmacyModels.StockMovementResponse;
import com.SIIH.proye.pharmacy.api.PharmacyModels.StockMovementType;
import com.SIIH.proye.security.AuthenticatedUser;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class InventoryService {

    private final JdbcTemplate jdbcTemplate;
    private final AuditService auditService;

    public InventoryService(JdbcTemplate jdbcTemplate, AuditService auditService) {
        this.jdbcTemplate = jdbcTemplate;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<MedicationResponse> medications() {
        return jdbcTemplate.query("""
                SELECT m.*, COALESCE(SUM(s.available_quantity), 0) available_quantity
                FROM medication m LEFT JOIN inventory_stock s ON s.medication_id = m.id
                GROUP BY m.id ORDER BY m.active DESC, m.generic_name
                """, (result, row) -> new MedicationResponse(result.getObject("id", UUID.class), result.getString("code"),
                result.getString("generic_name"), result.getString("commercial_name"), result.getString("presentation"),
                result.getString("concentration"), result.getString("route"), result.getBigDecimal("minimum_stock"),
                result.getBigDecimal("available_quantity"), result.getBoolean("active")));
    }

    @Transactional
    public MedicationResponse createMedication(MedicationCreateRequest request, AuthenticatedUser user) {
        try {
            UUID id = jdbcTemplate.queryForObject("""
                    INSERT INTO medication (code, generic_name, commercial_name, presentation, concentration, route, minimum_stock)
                    VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id
                    """, UUID.class, request.code().trim().toUpperCase(), request.genericName().trim(), clean(request.commercialName()),
                    request.presentation().trim(), clean(request.concentration()), clean(request.route()),
                    request.minimumStock() == null ? BigDecimal.ZERO : request.minimumStock());
            auditService.record("CREATE", "MEDICATION", id, user.id(), null, Map.of("code", request.code().trim().toUpperCase()));
            return medication(id);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("Ya existe un medicamento con ese codigo.");
        }
    }

    @Transactional(readOnly = true)
    public List<InventoryLocationResponse> locations() {
        return jdbcTemplate.query("""
                SELECT id, code, name, location_type, active FROM inventory_location ORDER BY active DESC, name
                """, (result, row) -> new InventoryLocationResponse(result.getObject("id", UUID.class), result.getString("code"),
                result.getString("name"), result.getString("location_type"), result.getBoolean("active")));
    }

    @Transactional(readOnly = true)
    public List<BatchStockResponse> batches(UUID medicationId, boolean availableOnly) {
        return jdbcTemplate.query("""
                SELECT b.id batch_id, b.medication_id, m.code medication_code, m.generic_name medication_name,
                       b.batch_code, b.received_on, b.expires_on, b.unit_cost, b.supplier_name, b.active,
                       s.location_id, l.code location_code, l.name location_name,
                       s.available_quantity, s.reserved_quantity
                FROM medication_batch b
                JOIN medication m ON m.id = b.medication_id
                JOIN inventory_stock s ON s.batch_id = b.id
                JOIN inventory_location l ON l.id = s.location_id
                WHERE (CAST(? AS uuid) IS NULL OR b.medication_id = CAST(? AS uuid))
                  AND (? = FALSE OR (s.available_quantity > 0 AND b.expires_on >= CURRENT_DATE AND b.active))
                ORDER BY b.expires_on, m.generic_name, l.name
                """, InventoryService::mapBatch, medicationId, medicationId, availableOnly);
    }

    @Transactional
    public BatchStockResponse createBatch(BatchCreateRequest request, AuthenticatedUser user) {
        if (request.expiresOn().isBefore(request.receivedOn())) {
            throw new ConflictException("La fecha de vencimiento no puede ser anterior a la recepcion.");
        }
        requireMedication(request.medicationId());
        requireLocation(request.locationId());
        try {
            UUID batchId = jdbcTemplate.queryForObject("""
                    INSERT INTO medication_batch (medication_id, batch_code, received_on, expires_on, unit_cost, supplier_name)
                    VALUES (?, ?, ?, ?, ?, ?) RETURNING id
                    """, UUID.class, request.medicationId(), request.batchCode().trim(), request.receivedOn(), request.expiresOn(),
                    request.unitCost() == null ? BigDecimal.ZERO : request.unitCost(), clean(request.supplierName()));
            jdbcTemplate.update("""
                    INSERT INTO inventory_stock (medication_id, batch_id, location_id, available_quantity)
                    VALUES (?, ?, ?, 0)
                    """, request.medicationId(), batchId, request.locationId());
            BigDecimal initial = request.initialQuantity() == null ? BigDecimal.ZERO : request.initialQuantity();
            if (initial.signum() > 0) {
                applyMovement(new StockMovementRequest(batchId, StockMovementType.IN, null, request.locationId(), null,
                        initial, "Recepcion inicial del lote", request.idempotencyKey()), user);
            }
            auditService.record("CREATE", "MEDICATION_BATCH", batchId, user.id(), null,
                    Map.of("batchCode", request.batchCode().trim(), "initialQuantity", initial));
            return batch(batchId, request.locationId());
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("El lote ya existe o sus datos no son validos.");
        }
    }

    @Transactional(readOnly = true)
    public List<StockMovementResponse> movements(UUID batchId) {
        return jdbcTemplate.query("""
                SELECT sm.*, m.generic_name medication_name, b.batch_code,
                       concat_ws(' ', u.first_name, u.last_name) performed_by_name
                FROM stock_movement sm
                JOIN medication m ON m.id = sm.medication_id
                JOIN medication_batch b ON b.id = sm.batch_id
                LEFT JOIN app_user u ON u.id = sm.performed_by
                WHERE (CAST(? AS uuid) IS NULL OR sm.batch_id = CAST(? AS uuid))
                ORDER BY sm.occurred_at DESC LIMIT 200
                """, InventoryService::mapMovement, batchId, batchId);
    }

    @Transactional
    public StockMovementResponse applyMovement(StockMovementRequest request, AuthenticatedUser user) {
        UUID existing = jdbcTemplate.queryForList("SELECT id FROM stock_movement WHERE idempotency_key = ?",
                UUID.class, request.idempotencyKey().trim()).stream().findFirst().orElse(null);
        if (existing != null) return movement(existing);

        BatchReference batch = jdbcTemplate.query("""
                SELECT medication_id, expires_on, active FROM medication_batch WHERE id = ?
                """, (result, row) -> new BatchReference(result.getObject("medication_id", UUID.class),
                result.getObject("expires_on", LocalDate.class), result.getBoolean("active")), request.batchId()).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el lote."));
        if (!batch.active()) throw new ConflictException("El lote esta inactivo.");
        validateMovement(request);

        UUID source = request.sourceLocationId();
        UUID target = request.targetLocationId();
        if (request.movementType() == StockMovementType.ADJUSTMENT) {
            if (request.adjustmentDirection() == AdjustmentDirection.INCREASE) source = null;
            else target = null;
        }
        if ((request.movementType() == StockMovementType.OUT
                || (request.movementType() == StockMovementType.ADJUSTMENT && request.adjustmentDirection() == AdjustmentDirection.DECREASE))
                && batch.expiresOn().isBefore(LocalDate.now())) {
            throw new ConflictException("No se puede retirar stock de un lote vencido.");
        }

        switch (request.movementType()) {
            case IN -> increase(batch.medicationId(), request.batchId(), target, request.quantity());
            case OUT -> decrease(request.batchId(), source, request.quantity());
            case TRANSFER -> {
                decrease(request.batchId(), source, request.quantity());
                increase(batch.medicationId(), request.batchId(), target, request.quantity());
            }
            case ADJUSTMENT -> {
                if (request.adjustmentDirection() == AdjustmentDirection.INCREASE) {
                    increase(batch.medicationId(), request.batchId(), target, request.quantity());
                } else {
                    decrease(request.batchId(), source, request.quantity());
                }
            }
        }

        UUID id = jdbcTemplate.queryForObject("""
                INSERT INTO stock_movement (movement_code, medication_id, batch_id, source_location_id,
                    target_location_id, movement_type, quantity, reason, performed_by, idempotency_key)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
                """, UUID.class, CodeGenerator.next("MOV"), batch.medicationId(), request.batchId(), source, target,
                request.movementType().name(), request.quantity(), clean(request.reason()), user.id(), request.idempotencyKey().trim());
        auditService.record("CREATE", "STOCK_MOVEMENT", id, user.id(), null,
                Map.of("type", request.movementType().name(), "quantity", request.quantity()));
        return movement(id);
    }

    private void validateMovement(StockMovementRequest request) {
        switch (request.movementType()) {
            case IN -> {
                if (request.targetLocationId() == null || request.sourceLocationId() != null) {
                    throw new ConflictException("Una entrada requiere ubicacion de destino.");
                }
                requireLocation(request.targetLocationId());
            }
            case OUT -> {
                if (request.sourceLocationId() == null || request.targetLocationId() != null) {
                    throw new ConflictException("Una salida requiere ubicacion de origen.");
                }
                requireLocation(request.sourceLocationId());
            }
            case TRANSFER -> {
                if (request.sourceLocationId() == null || request.targetLocationId() == null
                        || request.sourceLocationId().equals(request.targetLocationId())) {
                    throw new ConflictException("Una transferencia requiere ubicaciones distintas.");
                }
                requireLocation(request.sourceLocationId());
                requireLocation(request.targetLocationId());
            }
            case ADJUSTMENT -> {
                if (request.adjustmentDirection() == null || request.reason() == null || request.reason().isBlank()) {
                    throw new ConflictException("Un ajuste requiere direccion y motivo.");
                }
                UUID location = request.adjustmentDirection() == AdjustmentDirection.INCREASE
                        ? request.targetLocationId() : request.sourceLocationId();
                if (location == null) throw new ConflictException("El ajuste requiere una ubicacion.");
                requireLocation(location);
            }
        }
    }

    private void decrease(UUID batchId, UUID locationId, BigDecimal quantity) {
        StockBalance balance = lockStock(batchId, locationId);
        if (balance.available().compareTo(quantity) < 0) throw new ConflictException("El lote no tiene stock suficiente.");
        jdbcTemplate.update("""
                UPDATE inventory_stock SET available_quantity = available_quantity - ?, version = version + 1
                WHERE id = ?
                """, quantity, balance.id());
    }

    private void increase(UUID medicationId, UUID batchId, UUID locationId, BigDecimal quantity) {
        jdbcTemplate.update("""
                INSERT INTO inventory_stock (medication_id, batch_id, location_id, available_quantity)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (batch_id, location_id) DO UPDATE
                SET available_quantity = inventory_stock.available_quantity + EXCLUDED.available_quantity,
                    version = inventory_stock.version + 1
                """, medicationId, batchId, locationId, quantity);
    }

    private StockBalance lockStock(UUID batchId, UUID locationId) {
        return jdbcTemplate.query("""
                SELECT id, available_quantity FROM inventory_stock
                WHERE batch_id = ? AND location_id = ? FOR UPDATE
                """, (result, row) -> new StockBalance(result.getObject("id", UUID.class),
                result.getBigDecimal("available_quantity")), batchId, locationId).stream().findFirst()
                .orElseThrow(() -> new ConflictException("No existe stock del lote en la ubicacion seleccionada."));
    }

    private MedicationResponse medication(UUID id) {
        return medications().stream().filter(item -> item.id().equals(id)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el medicamento."));
    }

    private BatchStockResponse batch(UUID batchId, UUID locationId) {
        return jdbcTemplate.query("""
                SELECT b.id batch_id, b.medication_id, m.code medication_code, m.generic_name medication_name,
                       b.batch_code, b.received_on, b.expires_on, b.unit_cost, b.supplier_name, b.active,
                       s.location_id, l.code location_code, l.name location_name,
                       s.available_quantity, s.reserved_quantity
                FROM medication_batch b JOIN medication m ON m.id = b.medication_id
                JOIN inventory_stock s ON s.batch_id = b.id JOIN inventory_location l ON l.id = s.location_id
                WHERE b.id = ? AND s.location_id = ?
                """, InventoryService::mapBatch, batchId, locationId).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el lote."));
    }

    private StockMovementResponse movement(UUID id) {
        return jdbcTemplate.query("""
                SELECT sm.*, m.generic_name medication_name, b.batch_code,
                       concat_ws(' ', u.first_name, u.last_name) performed_by_name
                FROM stock_movement sm JOIN medication m ON m.id = sm.medication_id
                JOIN medication_batch b ON b.id = sm.batch_id LEFT JOIN app_user u ON u.id = sm.performed_by
                WHERE sm.id = ?
                """, InventoryService::mapMovement, id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el movimiento."));
    }

    private void requireMedication(UUID id) {
        if (!Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM medication WHERE id = ? AND active)", Boolean.class, id))) {
            throw new ResourceNotFoundException("No se encontro un medicamento activo.");
        }
    }

    private void requireLocation(UUID id) {
        if (!Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM inventory_location WHERE id = ? AND active)", Boolean.class, id))) {
            throw new ResourceNotFoundException("No se encontro una ubicacion activa.");
        }
    }

    private static BatchStockResponse mapBatch(ResultSet result, int row) throws SQLException {
        return new BatchStockResponse(result.getObject("batch_id", UUID.class), result.getObject("medication_id", UUID.class),
                result.getString("medication_code"), result.getString("medication_name"), result.getString("batch_code"),
                result.getObject("received_on", LocalDate.class), result.getObject("expires_on", LocalDate.class),
                result.getBigDecimal("unit_cost"), result.getString("supplier_name"), result.getObject("location_id", UUID.class),
                result.getString("location_code"), result.getString("location_name"), result.getBigDecimal("available_quantity"),
                result.getBigDecimal("reserved_quantity"), result.getBoolean("active"));
    }

    private static StockMovementResponse mapMovement(ResultSet result, int row) throws SQLException {
        return new StockMovementResponse(result.getObject("id", UUID.class), result.getString("movement_code"),
                result.getObject("medication_id", UUID.class), result.getString("medication_name"),
                result.getObject("batch_id", UUID.class), result.getString("batch_code"),
                result.getObject("source_location_id", UUID.class), result.getObject("target_location_id", UUID.class),
                result.getString("movement_type"), result.getBigDecimal("quantity"), result.getString("reason"),
                result.getString("performed_by_name"), result.getObject("occurred_at", OffsetDateTime.class));
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record BatchReference(UUID medicationId, LocalDate expiresOn, boolean active) {
    }

    private record StockBalance(UUID id, BigDecimal available) {
    }
}
