package com.SIIH.proye.clinical.api;

import com.SIIH.proye.clinical.domain.Consultation;
import com.SIIH.proye.clinical.domain.ConsultationStatus;

import java.time.Instant;
import java.util.UUID;

public record ConsultationResponse(
        UUID id,
        String consultationCode,
        UUID encounterId,
        UUID patientId,
        UUID professionalId,
        String chiefComplaint,
        String evolution,
        String diagnosisSummary,
        String treatmentPlan,
        String recommendations,
        ConsultationStatus status,
        Instant signedAt,
        Instant createdAt
) {
    public static ConsultationResponse from(Consultation consultation) {
        return new ConsultationResponse(consultation.getId(), consultation.getConsultationCode(), consultation.getEncounterId(),
                consultation.getPatientId(), consultation.getProfessionalId(), consultation.getChiefComplaint(),
                consultation.getEvolution(), consultation.getDiagnosisSummary(), consultation.getTreatmentPlan(),
                consultation.getRecommendations(), consultation.getStatus(), consultation.getSignedAt(), consultation.getCreatedAt());
    }
}
