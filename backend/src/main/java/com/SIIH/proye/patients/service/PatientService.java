package com.SIIH.proye.patients.service;

import com.SIIH.proye.common.audit.AuditService;
import com.SIIH.proye.common.api.PageResponse;
import com.SIIH.proye.common.exception.ConflictException;
import com.SIIH.proye.common.exception.ResourceNotFoundException;
import com.SIIH.proye.patients.api.ClinicalHistoryResponse;
import com.SIIH.proye.patients.api.ClinicalHistoryUpdateRequest;
import com.SIIH.proye.patients.api.PatientCreateRequest;
import com.SIIH.proye.patients.api.PatientResponse;
import com.SIIH.proye.patients.api.PatientUpdateRequest;
import com.SIIH.proye.patients.domain.ClinicalHistory;
import com.SIIH.proye.patients.domain.DocumentType;
import com.SIIH.proye.patients.domain.Patient;
import com.SIIH.proye.patients.domain.PatientStatus;
import com.SIIH.proye.patients.repository.ClinicalHistoryRepository;
import com.SIIH.proye.patients.repository.PatientRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final ClinicalHistoryRepository clinicalHistoryRepository;
    private final AuditService auditService;

    public PatientService(PatientRepository patientRepository,
                          ClinicalHistoryRepository clinicalHistoryRepository,
                          AuditService auditService) {
        this.patientRepository = patientRepository;
        this.clinicalHistoryRepository = clinicalHistoryRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public PageResponse<PatientResponse> search(String search, String status, Pageable pageable) {
        PatientStatus parsedStatus = parseStatus(status);
        return PageResponse.from(patientRepository.search(search == null ? "" : search.trim(), parsedStatus, pageable)
                .map(PatientResponse::from));
    }

    @Transactional(readOnly = true)
    public PatientResponse findById(UUID id) {
        return PatientResponse.from(getPatient(id));
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> findPotentialDuplicates(String documentNumber, String firstName,
                                                          String lastName, LocalDate birthDate) {
        return patientRepository.findPotentialDuplicates(blankToNull(documentNumber), firstName, lastName, birthDate)
                .stream().map(PatientResponse::from).toList();
    }

    @Transactional
    public PatientResponse create(PatientCreateRequest request) {
        String documentNumber = blankToNull(request.documentNumber());
        if (request.documentType() != DocumentType.NONE && documentNumber == null) {
            throw new ConflictException("El documento es obligatorio para el tipo seleccionado.");
        }
        if (documentNumber != null && patientRepository.existsByDocumentNumber(documentNumber)) {
            throw new ConflictException("Ya existe un paciente con ese documento.");
        }

        String code = String.format("PAC-%05d", patientRepository.nextPatientSequence());
        Patient patient = new Patient(code, request.documentType(), documentNumber,
                clean(request.firstName()), clean(request.middleName()), clean(request.lastName()), clean(request.secondLastName()),
                request.birthDate(), request.sex(), clean(request.phone()), clean(request.email()), clean(request.address()),
                clean(request.emergencyContactName()), clean(request.emergencyContactPhone()), clean(request.bloodType()));
        try {
            Patient saved = patientRepository.save(patient);
            clinicalHistoryRepository.save(new ClinicalHistory(saved.getId()));
            auditService.record("CREATE", "PATIENT", saved.getId(), null, null,
                    Map.of("patientCode", saved.getPatientCode(), "documentType", saved.getDocumentType().name()));
            return PatientResponse.from(saved);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("No se pudo crear el paciente porque existe un registro duplicado.");
        }
    }

    @Transactional
    public PatientResponse update(UUID id, PatientUpdateRequest request) {
        Patient patient = getPatient(id);
        patient.update(clean(request.firstName()), clean(request.middleName()), clean(request.lastName()), clean(request.secondLastName()),
                request.birthDate(), request.sex(), clean(request.phone()), clean(request.email()), clean(request.address()),
                clean(request.emergencyContactName()), clean(request.emergencyContactPhone()), clean(request.bloodType()), request.status());
        Patient saved = patientRepository.save(patient);
        auditService.record("UPDATE_DEMOGRAPHICS", "PATIENT", saved.getId(), null, null,
                Map.of("patientCode", saved.getPatientCode(), "status", saved.getStatus().name()));
        return PatientResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public ClinicalHistoryResponse getHistory(UUID patientId) {
        getPatient(patientId);
        ClinicalHistory history = clinicalHistoryRepository.findByPatientId(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("La historia clinica no existe para el paciente solicitado."));
        return ClinicalHistoryResponse.from(history);
    }

    @Transactional
    public ClinicalHistoryResponse updateHistory(UUID patientId, ClinicalHistoryUpdateRequest request) {
        getPatient(patientId);
        ClinicalHistory history = clinicalHistoryRepository.findByPatientId(patientId)
                .orElseGet(() -> new ClinicalHistory(patientId));
        history.update(request.background(), request.allergies(), request.familyHistory(), request.surgicalHistory(), request.relevantNotes());
        ClinicalHistory saved = clinicalHistoryRepository.save(history);
        auditService.record("UPDATE_CLINICAL_HISTORY", "CLINICAL_HISTORY", saved.getId(), null, null,
                Map.of("patientId", patientId.toString()));
        return ClinicalHistoryResponse.from(saved);
    }

    public Patient getPatient(UUID id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el paciente solicitado."));
    }

    private static String clean(String value) {
        return value == null ? null : value.trim();
    }

    private static PatientStatus parseStatus(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return PatientStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new ConflictException("El estado del paciente no es valido.");
        }
    }

    private static String blankToNull(String value) {
        String cleanValue = clean(value);
        return cleanValue == null || cleanValue.isBlank() ? null : cleanValue;
    }
}
