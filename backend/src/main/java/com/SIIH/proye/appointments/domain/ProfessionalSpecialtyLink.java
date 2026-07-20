package com.SIIH.proye.appointments.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "professional_specialty")
@IdClass(ProfessionalSpecialtyLink.Key.class)
public class ProfessionalSpecialtyLink {

    @Id
    @Column(name = "professional_id")
    private UUID professionalId;

    @Id
    @Column(name = "specialty_id")
    private UUID specialtyId;

    @Column(name = "is_primary", nullable = false)
    private boolean primary;

    protected ProfessionalSpecialtyLink() {
    }

    public UUID getProfessionalId() { return professionalId; }
    public UUID getSpecialtyId() { return specialtyId; }

    public static class Key implements Serializable {
        private UUID professionalId;
        private UUID specialtyId;

        public Key() {
        }

        public Key(UUID professionalId, UUID specialtyId) {
            this.professionalId = professionalId;
            this.specialtyId = specialtyId;
        }

        public UUID getProfessionalId() { return professionalId; }
        public UUID getSpecialtyId() { return specialtyId; }
        public void setProfessionalId(UUID professionalId) { this.professionalId = professionalId; }
        public void setSpecialtyId(UUID specialtyId) { this.specialtyId = specialtyId; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Key key)) return false;
            return professionalId.equals(key.professionalId) && specialtyId.equals(key.specialtyId);
        }

        @Override
        public int hashCode() {
            return 31 * professionalId.hashCode() + specialtyId.hashCode();
        }
    }
}
