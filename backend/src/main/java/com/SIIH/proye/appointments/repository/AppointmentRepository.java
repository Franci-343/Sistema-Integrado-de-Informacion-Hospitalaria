package com.SIIH.proye.appointments.repository;

import com.SIIH.proye.appointments.domain.Appointment;
import com.SIIH.proye.appointments.domain.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    @Query(value = """
            SELECT * FROM appointment a
            WHERE (CAST(:from AS timestamptz) IS NULL OR a.starts_at >= CAST(:from AS timestamptz))
              AND (CAST(:to AS timestamptz) IS NULL OR a.starts_at < CAST(:to AS timestamptz))
              AND (CAST(:patientId AS uuid) IS NULL OR a.patient_id = CAST(:patientId AS uuid))
              AND (CAST(:professionalId AS uuid) IS NULL OR a.professional_id = CAST(:professionalId AS uuid))
              AND (CAST(:status AS varchar) IS NULL OR a.status = CAST(:status AS varchar))
            ORDER BY a.starts_at ASC
            """,
            countQuery = """
            SELECT COUNT(*) FROM appointment a
            WHERE (CAST(:from AS timestamptz) IS NULL OR a.starts_at >= CAST(:from AS timestamptz))
              AND (CAST(:to AS timestamptz) IS NULL OR a.starts_at < CAST(:to AS timestamptz))
              AND (CAST(:patientId AS uuid) IS NULL OR a.patient_id = CAST(:patientId AS uuid))
              AND (CAST(:professionalId AS uuid) IS NULL OR a.professional_id = CAST(:professionalId AS uuid))
              AND (CAST(:status AS varchar) IS NULL OR a.status = CAST(:status AS varchar))
            """, nativeQuery = true)
    Page<Appointment> search(@Param("from") OffsetDateTime from,
                             @Param("to") OffsetDateTime to,
                             @Param("patientId") UUID patientId,
                             @Param("professionalId") UUID professionalId,
                             @Param("status") String status,
                             Pageable pageable);

    @Query("""
            SELECT CASE WHEN COUNT(a) > 0 THEN TRUE ELSE FALSE END FROM Appointment a
            WHERE a.professionalId = :professionalId
              AND a.status IN :activeStatuses
              AND a.startsAt < :endsAt
              AND a.endsAt > :startsAt
              AND (:ignoreId IS NULL OR a.id <> :ignoreId)
            """)
    boolean existsConflict(@Param("professionalId") UUID professionalId,
                           @Param("startsAt") OffsetDateTime startsAt,
                           @Param("endsAt") OffsetDateTime endsAt,
                           @Param("activeStatuses") Collection<AppointmentStatus> activeStatuses,
                           @Param("ignoreId") UUID ignoreId);

    Optional<Appointment> findByIdempotencyKey(String idempotencyKey);

    @Query(value = """
            SELECT COALESCE(MAX(CAST(SUBSTRING(appointment_code FROM 5) AS INTEGER)), 0) + 1
            FROM appointment WHERE appointment_code ~ '^CIT-[0-9]+$'
            """, nativeQuery = true)
    long nextAppointmentSequence();
}
