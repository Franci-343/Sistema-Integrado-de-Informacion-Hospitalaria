package com.SIIH.proye.clinical.repository;

import com.SIIH.proye.clinical.domain.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConsultationRepository extends JpaRepository<Consultation, UUID> {
    List<Consultation> findByPatientIdOrderByCreatedAtDesc(UUID patientId);

    @org.springframework.data.jpa.repository.Query(value = """
            SELECT COALESCE(MAX(CAST(SUBSTRING(consultation_code FROM 5) AS INTEGER)), 0) + 1
            FROM consultation WHERE consultation_code ~ '^CON-[0-9]+$'
            """, nativeQuery = true)
    long nextConsultationSequence();
}
