package com.SIIH.proye.pharmacy.api;

import com.SIIH.proye.pharmacy.api.PharmacyModels.DispensationCreateRequest;
import com.SIIH.proye.pharmacy.api.PharmacyModels.DispensationResponse;
import com.SIIH.proye.pharmacy.api.PharmacyModels.PrescriptionCreateRequest;
import com.SIIH.proye.pharmacy.api.PharmacyModels.PrescriptionResponse;
import com.SIIH.proye.pharmacy.service.PharmacyService;
import com.SIIH.proye.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
public class PharmacyController {

    private final PharmacyService service;

    public PharmacyController(PharmacyService service) {
        this.service = service;
    }

    @GetMapping("/prescriptions")
    public List<PrescriptionResponse> prescriptions(@RequestParam(required = false) UUID patientId,
                                                    @RequestParam(required = false) String status) {
        return service.prescriptions(patientId, status);
    }

    @GetMapping("/prescriptions/{id}")
    public PrescriptionResponse prescription(@PathVariable UUID id) {
        return service.prescription(id);
    }

    @PostMapping("/prescriptions")
    @ResponseStatus(HttpStatus.CREATED)
    public PrescriptionResponse createPrescription(@Valid @RequestBody PrescriptionCreateRequest request,
                                                   @AuthenticationPrincipal AuthenticatedUser user) {
        return service.createPrescription(request, user);
    }

    @GetMapping("/dispensations")
    public List<DispensationResponse> dispensations(@RequestParam(required = false) UUID patientId) {
        return service.dispensations(patientId);
    }

    @GetMapping("/dispensations/{id}")
    public DispensationResponse dispensation(@PathVariable UUID id) {
        return service.dispensation(id);
    }

    @PostMapping("/dispensations")
    @ResponseStatus(HttpStatus.CREATED)
    public DispensationResponse dispense(@Valid @RequestBody DispensationCreateRequest request,
                                         @AuthenticationPrincipal AuthenticatedUser user) {
        return service.dispense(request, user);
    }
}
