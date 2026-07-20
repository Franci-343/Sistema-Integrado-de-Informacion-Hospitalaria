package com.SIIH.proye.patients.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "patient")
public class Patient {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "patient_code", nullable = false, unique = true, length = 30)
    private String patientCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 20)
    private DocumentType documentType;

    @Column(name = "document_number", length = 50)
    private String documentNumber;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "middle_name", length = 100)
    private String middleName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "second_last_name", length = 100)
    private String secondLastName;

    @Column(name = "birth_date", nullable = false)
    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "sex", nullable = false, length = 20)
    private Sex sex;

    @Column(length = 40)
    private String phone;

    @Column(length = 255)
    private String email;

    @Column(length = 255)
    private String address;

    @Column(name = "emergency_contact_name", length = 200)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 40)
    private String emergencyContactPhone;

    @Column(name = "blood_type", length = 5)
    private String bloodType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PatientStatus status = PatientStatus.ACTIVE;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private Long version;

    protected Patient() {
    }

    public Patient(String patientCode, DocumentType documentType, String documentNumber,
                   String firstName, String middleName, String lastName, String secondLastName,
                   LocalDate birthDate, Sex sex, String phone, String email, String address,
                   String emergencyContactName, String emergencyContactPhone, String bloodType) {
        this.patientCode = patientCode;
        this.documentType = documentType;
        this.documentNumber = documentNumber;
        this.firstName = firstName;
        this.middleName = middleName;
        this.lastName = lastName;
        this.secondLastName = secondLastName;
        this.birthDate = birthDate;
        this.sex = sex;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.emergencyContactName = emergencyContactName;
        this.emergencyContactPhone = emergencyContactPhone;
        this.bloodType = bloodType;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
        this.version = 0L;
    }

    public UUID getId() { return id; }
    public String getPatientCode() { return patientCode; }
    public DocumentType getDocumentType() { return documentType; }
    public String getDocumentNumber() { return documentNumber; }
    public String getFirstName() { return firstName; }
    public String getMiddleName() { return middleName; }
    public String getLastName() { return lastName; }
    public String getSecondLastName() { return secondLastName; }
    public LocalDate getBirthDate() { return birthDate; }
    public Sex getSex() { return sex; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public String getAddress() { return address; }
    public String getEmergencyContactName() { return emergencyContactName; }
    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public String getBloodType() { return bloodType; }
    public PatientStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void update(String firstName, String middleName, String lastName, String secondLastName,
                       LocalDate birthDate, Sex sex, String phone, String email, String address,
                       String emergencyContactName, String emergencyContactPhone, String bloodType,
                       PatientStatus status) {
        this.firstName = firstName;
        this.middleName = middleName;
        this.lastName = lastName;
        this.secondLastName = secondLastName;
        this.birthDate = birthDate;
        this.sex = sex;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.emergencyContactName = emergencyContactName;
        this.emergencyContactPhone = emergencyContactPhone;
        this.bloodType = bloodType;
        this.status = status;
        this.updatedAt = Instant.now();
    }
}
