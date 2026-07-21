package com.SIIH.proye.laboratory.api;

import com.SIIH.proye.laboratory.api.LaboratoryModels.LabOrderCreateRequest;
import com.SIIH.proye.laboratory.api.LaboratoryModels.LabOrderResponse;
import com.SIIH.proye.laboratory.api.LaboratoryModels.LabResultRequest;
import com.SIIH.proye.laboratory.api.LaboratoryModels.LabResultResponse;
import com.SIIH.proye.laboratory.api.LaboratoryModels.LabSampleCreateRequest;
import com.SIIH.proye.laboratory.api.LaboratoryModels.LabSampleResponse;
import com.SIIH.proye.laboratory.api.LaboratoryModels.LabSampleStatusRequest;
import com.SIIH.proye.laboratory.api.LaboratoryModels.LabTestResponse;
import com.SIIH.proye.laboratory.service.LaboratoryService;
import com.SIIH.proye.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class LaboratoryController {

    private final LaboratoryService service;

    public LaboratoryController(LaboratoryService service) {
        this.service = service;
    }

    @GetMapping("/lab-tests")
    public List<LabTestResponse> tests() {
        return service.tests();
    }

    @GetMapping("/lab-orders")
    public List<LabOrderResponse> orders(@RequestParam(required = false) UUID patientId,
                                         @RequestParam(required = false) String status) {
        return service.orders(patientId, status);
    }

    @GetMapping("/lab-orders/{id}")
    public LabOrderResponse order(@PathVariable UUID id) {
        return service.order(id);
    }

    @PostMapping("/lab-orders")
    @ResponseStatus(HttpStatus.CREATED)
    public LabOrderResponse createOrder(@Valid @RequestBody LabOrderCreateRequest request,
                                        @AuthenticationPrincipal AuthenticatedUser user) {
        return service.createOrder(request, user);
    }

    @PostMapping("/lab-orders/{id}/samples")
    @ResponseStatus(HttpStatus.CREATED)
    public LabSampleResponse receiveSample(@PathVariable UUID id,
                                           @Valid @RequestBody LabSampleCreateRequest request,
                                           @AuthenticationPrincipal AuthenticatedUser user) {
        return service.receiveSample(id, request, user);
    }

    @PutMapping("/lab-orders/{orderId}/samples/{sampleId}")
    public LabSampleResponse updateSample(@PathVariable UUID orderId,
                                          @PathVariable UUID sampleId,
                                          @Valid @RequestBody LabSampleStatusRequest request,
                                          @AuthenticationPrincipal AuthenticatedUser user) {
        return service.updateSample(orderId, sampleId, request, user);
    }

    @PostMapping("/lab-results")
    public LabResultResponse saveResult(@Valid @RequestBody LabResultRequest request,
                                        @AuthenticationPrincipal AuthenticatedUser user) {
        return service.saveResult(request, user);
    }

    @PutMapping("/lab-results/{id}/validate")
    public LabResultResponse validateResult(@PathVariable UUID id,
                                            @AuthenticationPrincipal AuthenticatedUser user) {
        return service.validateResult(id, user);
    }

    @PutMapping("/lab-results/{id}/publish")
    public LabResultResponse publishResult(@PathVariable UUID id,
                                           @AuthenticationPrincipal AuthenticatedUser user) {
        return service.publishResult(id, user);
    }
}
