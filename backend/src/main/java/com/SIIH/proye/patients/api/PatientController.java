package com.SIIH.proye.patients.api;

import com.SIIH.proye.patients.service.PatientService;
import com.SIIH.proye.common.api.PageResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/patients")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping
    public PageResponse<PatientResponse> search(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "lastName") Pageable pageable) {
        return patientService.search(search, status, pageable);
    }

    @GetMapping("/{id}")
    public PatientResponse findById(@PathVariable UUID id) {
        return patientService.findById(id);
    }

    @GetMapping("/duplicate-check")
    public List<PatientResponse> duplicateCheck(@RequestParam(required = false) String documentNumber,
                                                @RequestParam String firstName,
                                                @RequestParam String lastName,
                                                @RequestParam LocalDate birthDate) {
        return patientService.findPotentialDuplicates(documentNumber, firstName, lastName, birthDate);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PatientResponse create(@Valid @RequestBody PatientCreateRequest request) {
        return patientService.create(request);
    }

    @PutMapping("/{id}")
    public PatientResponse update(@PathVariable UUID id, @Valid @RequestBody PatientUpdateRequest request) {
        return patientService.update(id, request);
    }

    @GetMapping("/{id}/clinical-history")
    public ClinicalHistoryResponse getHistory(@PathVariable UUID id) {
        return patientService.getHistory(id);
    }

    @PatchMapping("/{id}/clinical-history")
    public ClinicalHistoryResponse updateHistory(@PathVariable UUID id,
                                                 @RequestBody ClinicalHistoryUpdateRequest request) {
        return patientService.updateHistory(id, request);
    }
}
