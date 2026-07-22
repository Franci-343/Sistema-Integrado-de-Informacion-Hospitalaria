package com.SIIH.proye.hospitalization.api;

import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.BedResponse;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.DischargeRequest;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.HospitalizationCreateRequest;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.HospitalizationOrderCreateRequest;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.HospitalizationOrderResponse;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.HospitalizationOriginResponse;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.HospitalizationResponse;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.NursingNoteRequest;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.NursingNoteResponse;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.TriageCreateRequest;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.TriageResponse;
import com.SIIH.proye.hospitalization.api.ClinicalOperationsModels.TriageUpdateRequest;
import com.SIIH.proye.hospitalization.service.ClinicalOperationsService;
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
public class ClinicalOperationsController {

    private final ClinicalOperationsService service;

    public ClinicalOperationsController(ClinicalOperationsService service) {
        this.service = service;
    }

    @GetMapping("/triage")
    public List<TriageResponse> listTriage(@RequestParam(required = false) UUID patientId) {
        return service.listTriage(patientId);
    }

    @GetMapping("/triage/{id}")
    public TriageResponse getTriage(@PathVariable UUID id) {
        return service.getTriage(id);
    }

    @PostMapping("/triage")
    @ResponseStatus(HttpStatus.CREATED)
    public TriageResponse createTriage(@Valid @RequestBody TriageCreateRequest request,
                                       @AuthenticationPrincipal AuthenticatedUser user) {
        return service.createTriage(request, user);
    }

    @PutMapping("/triage/{id}")
    public TriageResponse updateTriage(@PathVariable UUID id,
                                       @Valid @RequestBody TriageUpdateRequest request,
                                       @AuthenticationPrincipal AuthenticatedUser user) {
        return service.updateTriage(id, request, user);
    }

    @GetMapping("/beds")
    public List<BedResponse> beds(@RequestParam(required = false) String status,
                                  @RequestParam(required = false) String serviceCode) {
        return service.listBeds(status, serviceCode);
    }

    @GetMapping("/hospitalization-origins")
    public List<HospitalizationOriginResponse> hospitalizationOrigins(@RequestParam(required = false) UUID patientId) {
        return service.listHospitalizationOrigins(patientId);
    }

    @GetMapping("/hospitalization-orders")
    public List<HospitalizationOrderResponse> hospitalizationOrders(@RequestParam(required = false) String status) {
        return service.listHospitalizationOrders(status);
    }

    @PostMapping("/hospitalization-orders")
    @ResponseStatus(HttpStatus.CREATED)
    public HospitalizationOrderResponse createHospitalizationOrder(
            @Valid @RequestBody HospitalizationOrderCreateRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return service.createHospitalizationOrder(request, user);
    }

    @GetMapping("/hospitalizations")
    public List<HospitalizationResponse> hospitalizations(@RequestParam(required = false) UUID patientId,
                                                          @RequestParam(required = false) String status) {
        return service.listHospitalizations(patientId, status);
    }

    @GetMapping("/hospitalizations/{id}")
    public HospitalizationResponse hospitalization(@PathVariable UUID id) {
        return service.getHospitalization(id);
    }

    @PostMapping("/hospitalizations")
    @ResponseStatus(HttpStatus.CREATED)
    public HospitalizationResponse admit(@Valid @RequestBody HospitalizationCreateRequest request,
                                         @AuthenticationPrincipal AuthenticatedUser user) {
        return service.admit(request, user);
    }

    @PutMapping("/hospitalizations/{id}/discharge")
    public HospitalizationResponse discharge(@PathVariable UUID id,
                                             @Valid @RequestBody DischargeRequest request,
                                             @AuthenticationPrincipal AuthenticatedUser user) {
        return service.discharge(id, request, user);
    }

    @PostMapping("/hospitalizations/{id}/nursing-notes")
    @ResponseStatus(HttpStatus.CREATED)
    public NursingNoteResponse nursingNote(@PathVariable UUID id,
                                           @Valid @RequestBody NursingNoteRequest request,
                                           @AuthenticationPrincipal AuthenticatedUser user) {
        return service.addNursingNote(id, request, user);
    }
}
