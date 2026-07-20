package com.SIIH.proye.clinical.repository;

import com.SIIH.proye.clinical.domain.CareEncounter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CareEncounterRepository extends JpaRepository<CareEncounter, UUID> {

    boolean existsByAppointmentId(UUID appointmentId);

    long countByAppointmentIdIsNotNull();

    @org.springframework.data.jpa.repository.Query(value = """
            SELECT COALESCE(MAX(CAST(SUBSTRING(encounter_code FROM 5) AS INTEGER)), 0) + 1
            FROM care_encounter WHERE encounter_code ~ '^ENC-[0-9]+$'
            """, nativeQuery = true)
    long nextEncounterSequence();
}
