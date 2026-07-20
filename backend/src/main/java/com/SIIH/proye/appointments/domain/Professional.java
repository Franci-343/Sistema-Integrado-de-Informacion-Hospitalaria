package com.SIIH.proye.appointments.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "professional")
public class Professional {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "professional_code", nullable = false, unique = true, length = 40)
    private String professionalCode;

    @Column(name = "license_number", unique = true, length = 80)
    private String licenseNumber;

    @Column(name = "professional_type", nullable = false, length = 30)
    private String professionalType;

    @Column(nullable = false, length = 20)
    private String status;

    protected Professional() {
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getProfessionalCode() { return professionalCode; }
    public String getLicenseNumber() { return licenseNumber; }
    public String getProfessionalType() { return professionalType; }
    public String getStatus() { return status; }
}
