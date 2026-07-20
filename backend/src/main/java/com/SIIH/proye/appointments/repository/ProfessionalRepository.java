package com.SIIH.proye.appointments.repository;

import com.SIIH.proye.appointments.domain.Professional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ProfessionalRepository extends JpaRepository<Professional, UUID> {

    @Query("""
            SELECT DISTINCT p FROM Professional p
            JOIN ProfessionalSpecialtyLink link ON link.professionalId = p.id
            WHERE p.status = 'ACTIVE' AND (:specialtyId IS NULL OR link.specialtyId = :specialtyId)
            ORDER BY p.professionalCode
            """)
    List<Professional> findActive(@Param("specialtyId") UUID specialtyId);
}
