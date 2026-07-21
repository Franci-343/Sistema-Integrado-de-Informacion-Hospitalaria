package com.SIIH.proye.inventory.api;

import com.SIIH.proye.inventory.service.InventoryService;
import com.SIIH.proye.pharmacy.api.PharmacyModels.BatchCreateRequest;
import com.SIIH.proye.pharmacy.api.PharmacyModels.BatchStockResponse;
import com.SIIH.proye.pharmacy.api.PharmacyModels.InventoryLocationResponse;
import com.SIIH.proye.pharmacy.api.PharmacyModels.MedicationCreateRequest;
import com.SIIH.proye.pharmacy.api.PharmacyModels.MedicationResponse;
import com.SIIH.proye.pharmacy.api.PharmacyModels.StockMovementRequest;
import com.SIIH.proye.pharmacy.api.PharmacyModels.StockMovementResponse;
import com.SIIH.proye.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class InventoryController {

    private final InventoryService service;

    public InventoryController(InventoryService service) {
        this.service = service;
    }

    @GetMapping("/medications")
    public List<MedicationResponse> medications() {
        return service.medications();
    }

    @PostMapping("/inventory/medications")
    @ResponseStatus(HttpStatus.CREATED)
    public MedicationResponse createMedication(@Valid @RequestBody MedicationCreateRequest request,
                                               @AuthenticationPrincipal AuthenticatedUser user) {
        return service.createMedication(request, user);
    }

    @GetMapping("/inventory/locations")
    public List<InventoryLocationResponse> locations() {
        return service.locations();
    }

    @GetMapping("/inventory/batches")
    public List<BatchStockResponse> batches(@RequestParam(required = false) UUID medicationId,
                                            @RequestParam(defaultValue = "false") boolean availableOnly) {
        return service.batches(medicationId, availableOnly);
    }

    @PostMapping("/inventory/batches")
    @ResponseStatus(HttpStatus.CREATED)
    public BatchStockResponse createBatch(@Valid @RequestBody BatchCreateRequest request,
                                          @AuthenticationPrincipal AuthenticatedUser user) {
        return service.createBatch(request, user);
    }

    @GetMapping("/stock-movements")
    public List<StockMovementResponse> movements(@RequestParam(required = false) UUID batchId) {
        return service.movements(batchId);
    }

    @PostMapping("/stock-movements")
    @ResponseStatus(HttpStatus.CREATED)
    public StockMovementResponse movement(@Valid @RequestBody StockMovementRequest request,
                                          @AuthenticationPrincipal AuthenticatedUser user) {
        return service.applyMovement(request, user);
    }
}
