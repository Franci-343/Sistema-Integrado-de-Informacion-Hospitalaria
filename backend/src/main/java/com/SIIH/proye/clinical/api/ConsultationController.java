package com.SIIH.proye.clinical.api;

import com.SIIH.proye.clinical.service.ConsultationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class ConsultationController {

    private final ConsultationService consultationService;

    public ConsultationController(ConsultationService consultationService) {
        this.consultationService = consultationService;
    }

    @GetMapping("/consultations/{id}")
    public ConsultationResponse findById(@PathVariable UUID id) {
        return consultationService.findById(id);
    }

    @GetMapping("/patients/{patientId}/consultations")
    public List<ConsultationResponse> findByPatient(@PathVariable UUID patientId) {
        return consultationService.findByPatient(patientId);
    }

    @PostMapping("/consultations")
    @ResponseStatus(HttpStatus.CREATED)
    public ConsultationResponse create(@Valid @RequestBody ConsultationCreateRequest request) {
        return consultationService.create(request);
    }

    @PutMapping("/consultations/{id}/close")
    public ConsultationResponse close(@PathVariable UUID id, @Valid @RequestBody ConsultationCloseRequest request) {
        return consultationService.close(id, request);
    }
}
