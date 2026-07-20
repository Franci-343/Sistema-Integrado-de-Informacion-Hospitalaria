package com.SIIH.proye.patients.repository;

import com.SIIH.proye.patients.domain.Patient;
import com.SIIH.proye.patients.domain.PatientStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PatientRepository extends JpaRepository<Patient, UUID> {

    boolean existsByDocumentNumber(String documentNumber);

    @Query("""
            SELECT p FROM Patient p
            WHERE (:search = '' OR lower(p.patientCode) LIKE lower(concat('%', :search, '%'))
                OR lower(p.documentNumber) LIKE lower(concat('%', :search, '%'))
                OR lower(concat(p.firstName, ' ', p.lastName, ' ', coalesce(p.secondLastName, ''))) LIKE lower(concat('%', :search, '%')))
              AND (:status IS NULL OR p.status = :status)
            ORDER BY p.lastName, p.firstName
            """)
    Page<Patient> search(@Param("search") String search, @Param("status") PatientStatus status, Pageable pageable);

    @Query("""
            SELECT p FROM Patient p
            WHERE (:documentNumber IS NOT NULL AND p.documentNumber = :documentNumber)
               OR (lower(p.firstName) = lower(:firstName)
                   AND lower(p.lastName) = lower(:lastName)
                   AND p.birthDate = :birthDate)
            ORDER BY p.lastName, p.firstName
            """)
    List<Patient> findPotentialDuplicates(@Param("documentNumber") String documentNumber,
                                          @Param("firstName") String firstName,
                                          @Param("lastName") String lastName,
                                          @Param("birthDate") LocalDate birthDate);

    @Query(value = """
            SELECT COALESCE(MAX(CAST(SUBSTRING(patient_code FROM 5) AS INTEGER)), 0) + 1
            FROM patient WHERE patient_code ~ '^PAC-[0-9]+$'
            """, nativeQuery = true)
    long nextPatientSequence();
}
