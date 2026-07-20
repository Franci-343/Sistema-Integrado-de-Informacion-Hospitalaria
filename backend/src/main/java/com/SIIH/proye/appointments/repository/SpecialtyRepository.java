package com.SIIH.proye.appointments.repository;

import com.SIIH.proye.appointments.domain.Specialty;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SpecialtyRepository extends JpaRepository<Specialty, UUID> {
    List<Specialty> findByActiveTrueOrderByNameAsc();
}
