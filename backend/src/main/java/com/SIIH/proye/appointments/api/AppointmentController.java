package com.SIIH.proye.appointments.api;

import com.SIIH.proye.appointments.service.AppointmentService;
import com.SIIH.proye.common.api.PageResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping("/specialties")
    public List<SpecialtyResponse> specialties() {
        return appointmentService.specialties();
    }

    @GetMapping("/professionals")
    public List<ProfessionalResponse> professionals(@RequestParam(required = false) UUID specialtyId) {
        return appointmentService.professionals(specialtyId);
    }

    @GetMapping("/appointments")
    public PageResponse<AppointmentResponse> search(
            @RequestParam(required = false) OffsetDateTime from,
            @RequestParam(required = false) OffsetDateTime to,
            @RequestParam(required = false) UUID patientId,
            @RequestParam(required = false) UUID professionalId,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 50) Pageable pageable) {
        return appointmentService.search(from, to, patientId, professionalId, status, pageable);
    }

    @PostMapping("/appointments")
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse create(@Valid @RequestBody AppointmentCreateRequest request) {
        return appointmentService.create(request);
    }

    @PatchMapping("/appointments/{id}/arrival")
    public AppointmentResponse registerArrival(@PathVariable UUID id) {
        return appointmentService.registerArrival(id);
    }

    @PatchMapping("/appointments/{id}/cancel")
    public AppointmentResponse cancel(@PathVariable UUID id, @Valid @RequestBody AppointmentCancelRequest request) {
        return appointmentService.cancel(id, request);
    }
}
