package com.SIIH.proye.patients.repository;

import com.SIIH.proye.patients.domain.ClinicalHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ClinicalHistoryRepository extends JpaRepository<ClinicalHistory, UUID> {
    Optional<ClinicalHistory> findByPatientId(UUID patientId);
}
