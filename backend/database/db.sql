-- SIIH - esquema inicial PostgreSQL
-- Caso de estudio: Hospital Universitario San Andres
--
-- Este archivo se ejecuta dentro de la base definida por Docker Compose
-- (por defecto: siih). Es repetible y no elimina tablas ni datos existentes.
-- Los nombres usan snake_case para facilitar el mapeo JPA/Hibernate.
-- Los datos de ejemplo son sinteticos y pueden eliminarse en una migracion
-- posterior, sin modificar la estructura.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ---------------------------------------------------------------------------
-- Seguridad, identidad y auditoria
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS app_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(80) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED')),
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0
        CHECK (failed_login_attempts >= 0),
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT app_user_username_format CHECK (username = btrim(username) AND username <> ''),
    CONSTRAINT app_user_email_format CHECK (email IS NULL OR position('@' IN email) > 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_app_user_username_lower ON app_user (lower(username));
CREATE UNIQUE INDEX IF NOT EXISTS ux_app_user_email_lower ON app_user (lower(email)) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_role (
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
    role_id UUID NOT NULL REFERENCES role(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_permission (
    role_id UUID NOT NULL REFERENCES role(id) ON DELETE RESTRICT,
    permission_id UUID NOT NULL REFERENCES permission(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS audit_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    event_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    origin VARCHAR(255),
    client_ip INET,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    failure_reason VARCHAR(255),
    before_data JSONB,
    after_data JSONB,
    trace_id VARCHAR(100),
    CONSTRAINT audit_event_failure_reason CHECK (success OR failure_reason IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS ix_audit_event_event_at ON audit_event (event_at DESC);
CREATE INDEX IF NOT EXISTS ix_audit_event_entity ON audit_event (entity_type, entity_id, event_at DESC);
CREATE INDEX IF NOT EXISTS ix_audit_event_user ON audit_event (user_id, event_at DESC);

-- ---------------------------------------------------------------------------
-- Catalogos y profesionales
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS specialty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL UNIQUE,
    description VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS professional (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES app_user(id) ON DELETE RESTRICT,
    professional_code VARCHAR(40) NOT NULL UNIQUE,
    license_number VARCHAR(80) UNIQUE,
    professional_type VARCHAR(30) NOT NULL
        CHECK (professional_type IN ('DOCTOR', 'NURSE', 'LAB_TECHNICIAN', 'PHARMACIST', 'OTHER')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS professional_specialty (
    professional_id UUID NOT NULL REFERENCES professional(id) ON DELETE RESTRICT,
    specialty_id UUID NOT NULL REFERENCES specialty(id) ON DELETE RESTRICT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (professional_id, specialty_id)
);

CREATE TABLE IF NOT EXISTS professional_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES professional(id) ON DELETE RESTRICT,
    weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
    starts_at TIME NOT NULL,
    ends_at TIME NOT NULL,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT professional_schedule_time CHECK (ends_at > starts_at),
    CONSTRAINT professional_schedule_dates CHECK (effective_until IS NULL OR effective_until >= effective_from)
);

CREATE INDEX IF NOT EXISTS ix_professional_schedule_lookup
    ON professional_schedule (professional_id, weekday, effective_from);

CREATE TABLE IF NOT EXISTS service_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(255),
    service_type VARCHAR(30) NOT NULL
        CHECK (service_type IN ('CONSULTATION', 'LABORATORY', 'PROCEDURE', 'ROOM', 'OTHER')),
    default_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (default_price >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Pacientes y admision
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS patient (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_code VARCHAR(30) NOT NULL UNIQUE,
    document_type VARCHAR(20) NOT NULL DEFAULT 'CI'
        CHECK (document_type IN ('CI', 'PASSPORT', 'FOREIGN_ID', 'NONE')),
    document_number VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    second_last_name VARCHAR(100),
    birth_date DATE NOT NULL,
    sex VARCHAR(20) NOT NULL CHECK (sex IN ('FEMALE', 'MALE', 'INTERSEX', 'UNKNOWN', 'NOT_DECLARED')),
    phone VARCHAR(40),
    email VARCHAR(255),
    address VARCHAR(255),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(40),
    blood_type VARCHAR(5) CHECK (blood_type IS NULL OR blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'DECEASED')),
    created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT patient_document_required CHECK (document_type = 'NONE' OR NULLIF(btrim(document_number), '') IS NOT NULL),
    CONSTRAINT patient_name_format CHECK (btrim(first_name) <> '' AND btrim(last_name) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_patient_document
    ON patient (document_type, document_number)
    WHERE document_number IS NOT NULL AND btrim(document_number) <> '';
CREATE INDEX IF NOT EXISTS ix_patient_name ON patient (lower(last_name), lower(first_name), birth_date);
CREATE INDEX IF NOT EXISTS ix_patient_birth_date ON patient (birth_date);

CREATE TABLE IF NOT EXISTS clinical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL UNIQUE REFERENCES patient(id) ON DELETE RESTRICT,
    background TEXT,
    allergies TEXT,
    family_history TEXT,
    surgical_history TEXT,
    relevant_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS patient_contact_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'PHONE', 'WHATSAPP')),
    destination VARCHAR(255) NOT NULL,
    consented BOOLEAN NOT NULL DEFAULT FALSE,
    consented_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    UNIQUE (patient_id, channel, destination)
);

-- ---------------------------------------------------------------------------
-- Agenda, llegada y atencion
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS appointment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_code VARCHAR(30) NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
    professional_id UUID NOT NULL REFERENCES professional(id) ON DELETE RESTRICT,
    specialty_id UUID NOT NULL REFERENCES specialty(id) ON DELETE RESTRICT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED'
        CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW', 'DERIVED_TO_HOSPITALIZATION')),
    reason VARCHAR(255),
    cancellation_reason VARCHAR(255),
    arrived_at TIMESTAMPTZ,
    checked_in_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    idempotency_key VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT appointment_time CHECK (ends_at > starts_at),
    CONSTRAINT appointment_cancel_reason CHECK (
        status NOT IN ('CANCELLED', 'RESCHEDULED') OR NULLIF(btrim(cancellation_reason), '') IS NOT NULL
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_appointment_idempotency
    ON appointment (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_appointment_patient_date ON appointment (patient_id, starts_at DESC);
CREATE INDEX IF NOT EXISTS ix_appointment_professional_date ON appointment (professional_id, starts_at);
CREATE INDEX IF NOT EXISTS ix_appointment_status_date ON appointment (status, starts_at);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'appointment_professional_no_overlap'
    ) THEN
        ALTER TABLE appointment ADD CONSTRAINT appointment_professional_no_overlap
            EXCLUDE USING gist (
                professional_id WITH =,
                tstzrange(starts_at, ends_at, '[)') WITH &&
            ) WHERE (status IN ('SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS'));
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS care_encounter (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_code VARCHAR(30) NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
    appointment_id UUID UNIQUE REFERENCES appointment(id) ON DELETE RESTRICT,
    encounter_type VARCHAR(25) NOT NULL
        CHECK (encounter_type IN ('OUTPATIENT', 'EMERGENCY', 'HOSPITALIZATION', 'FOLLOW_UP')),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN', 'CLOSED', 'CANCELLED')),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMPTZ,
    created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT care_encounter_closed_at CHECK (status <> 'CLOSED' OR closed_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS ix_care_encounter_patient ON care_encounter (patient_id, opened_at DESC);

CREATE TABLE IF NOT EXISTS triage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL UNIQUE REFERENCES care_encounter(id) ON DELETE RESTRICT,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE')),
    temperature_c NUMERIC(4,1) CHECK (temperature_c IS NULL OR temperature_c BETWEEN 20 AND 50),
    systolic_bp SMALLINT CHECK (systolic_bp IS NULL OR systolic_bp BETWEEN 40 AND 300),
    diastolic_bp SMALLINT CHECK (diastolic_bp IS NULL OR diastolic_bp BETWEEN 20 AND 200),
    heart_rate SMALLINT CHECK (heart_rate IS NULL OR heart_rate BETWEEN 20 AND 250),
    respiratory_rate SMALLINT CHECK (respiratory_rate IS NULL OR respiratory_rate BETWEEN 5 AND 80),
    oxygen_saturation NUMERIC(5,2) CHECK (oxygen_saturation IS NULL OR oxygen_saturation BETWEEN 0 AND 100),
    weight_kg NUMERIC(6,2) CHECK (weight_kg IS NULL OR weight_kg > 0),
    height_cm NUMERIC(6,2) CHECK (height_cm IS NULL OR height_cm > 0),
    notes TEXT,
    recorded_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consultation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_code VARCHAR(30) NOT NULL UNIQUE,
    encounter_id UUID NOT NULL UNIQUE REFERENCES care_encounter(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
    professional_id UUID NOT NULL REFERENCES professional(id) ON DELETE RESTRICT,
    chief_complaint TEXT,
    evolution TEXT,
    diagnosis_summary TEXT,
    treatment_plan TEXT,
    recommendations TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'CLOSED', 'AMENDED', 'CANCELLED')),
    signed_at TIMESTAMPTZ,
    signed_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT consultation_closed_fields CHECK (
        status NOT IN ('CLOSED', 'AMENDED') OR (
            NULLIF(btrim(chief_complaint), '') IS NOT NULL AND
            NULLIF(btrim(diagnosis_summary), '') IS NOT NULL AND
            NULLIF(btrim(treatment_plan), '') IS NOT NULL AND
            signed_at IS NOT NULL AND signed_by IS NOT NULL
        )
    )
);

CREATE INDEX IF NOT EXISTS ix_consultation_patient_date ON consultation (patient_id, created_at DESC);

CREATE TABLE IF NOT EXISTS consultation_revision (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultation(id) ON DELETE RESTRICT,
    revision_number INTEGER NOT NULL CHECK (revision_number > 0),
    reason VARCHAR(255) NOT NULL,
    snapshot JSONB NOT NULL,
    changed_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (consultation_id, revision_number)
);

CREATE TABLE IF NOT EXISTS consultation_diagnosis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultation(id) ON DELETE RESTRICT,
    code VARCHAR(40),
    description VARCHAR(255) NOT NULL,
    diagnosis_type VARCHAR(20) NOT NULL DEFAULT 'PRIMARY'
        CHECK (diagnosis_type IN ('PRIMARY', 'SECONDARY', 'PRESUMPTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Laboratorio
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS lab_test_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    sample_type VARCHAR(80),
    unit VARCHAR(40),
    reference_range VARCHAR(120),
    price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lab_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(30) NOT NULL UNIQUE,
    consultation_id UUID NOT NULL REFERENCES consultation(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
    requested_by UUID NOT NULL REFERENCES professional(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED'
        CHECK (status IN ('REQUESTED', 'RECEIVED', 'IN_PROCESS', 'REJECTED', 'VALIDATED', 'PUBLISHED', 'CANCELLED')),
    clinical_notes TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    validated_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    idempotency_key VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_lab_order_idempotency
    ON lab_order (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_lab_order_status ON lab_order (status, requested_at);
CREATE INDEX IF NOT EXISTS ix_lab_order_patient ON lab_order (patient_id, requested_at DESC);

CREATE TABLE IF NOT EXISTS lab_order_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_order_id UUID NOT NULL REFERENCES lab_order(id) ON DELETE RESTRICT,
    test_id UUID NOT NULL REFERENCES lab_test_catalog(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED'
        CHECK (status IN ('REQUESTED', 'IN_PROCESS', 'REJECTED', 'VALIDATED', 'PUBLISHED')),
    observations TEXT,
    UNIQUE (lab_order_id, test_id)
);

CREATE TABLE IF NOT EXISTS lab_sample (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_order_id UUID NOT NULL REFERENCES lab_order(id) ON DELETE RESTRICT,
    sample_code VARCHAR(40) NOT NULL UNIQUE,
    sample_type VARCHAR(80) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'RECEIVED', 'IN_PROCESS', 'REJECTED', 'COMPLETED')),
    collected_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason VARCHAR(255),
    received_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    CONSTRAINT lab_sample_rejection_reason CHECK (status <> 'REJECTED' OR NULLIF(btrim(rejection_reason), '') IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS lab_result (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL UNIQUE REFERENCES lab_order_item(id) ON DELETE RESTRICT,
    result_text TEXT,
    numeric_value NUMERIC(14,4),
    unit VARCHAR(40),
    reference_range VARCHAR(120),
    observations TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'VALIDATED', 'PUBLISHED', 'AMENDED')),
    recorded_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    validated_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    validated_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT lab_result_value CHECK (result_text IS NOT NULL OR numeric_value IS NOT NULL),
    CONSTRAINT lab_result_published CHECK (
        status NOT IN ('PUBLISHED', 'AMENDED') OR (validated_by IS NOT NULL AND validated_at IS NOT NULL)
    )
);

-- ---------------------------------------------------------------------------
-- Farmacia e inventario
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS medication (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    generic_name VARCHAR(180) NOT NULL,
    commercial_name VARCHAR(180),
    presentation VARCHAR(120) NOT NULL,
    concentration VARCHAR(80),
    route VARCHAR(40),
    minimum_stock NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_location (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    location_type VARCHAR(30) NOT NULL
        CHECK (location_type IN ('PHARMACY', 'WAREHOUSE', 'LABORATORY', 'OTHER')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medication_batch (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL REFERENCES medication(id) ON DELETE RESTRICT,
    batch_code VARCHAR(80) NOT NULL,
    received_on DATE NOT NULL DEFAULT CURRENT_DATE,
    expires_on DATE NOT NULL,
    unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
    supplier_name VARCHAR(180),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (medication_id, batch_code),
    CONSTRAINT medication_batch_dates CHECK (expires_on >= received_on)
);

CREATE INDEX IF NOT EXISTS ix_medication_batch_expiry ON medication_batch (expires_on, medication_id);

CREATE TABLE IF NOT EXISTS inventory_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL REFERENCES medication(id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES medication_batch(id) ON DELETE RESTRICT,
    location_id UUID NOT NULL REFERENCES inventory_location(id) ON DELETE RESTRICT,
    available_quantity NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
    reserved_quantity NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE (batch_id, location_id),
    CONSTRAINT inventory_stock_medication_match CHECK (available_quantity >= 0)
);

CREATE INDEX IF NOT EXISTS ix_inventory_stock_medication ON inventory_stock (medication_id, location_id);

CREATE TABLE IF NOT EXISTS prescription (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_code VARCHAR(30) NOT NULL UNIQUE,
    consultation_id UUID NOT NULL REFERENCES consultation(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
    prescriber_id UUID NOT NULL REFERENCES professional(id) ON DELETE RESTRICT,
    issued_on DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ISSUED'
        CHECK (status IN ('DRAFT', 'ISSUED', 'PARTIALLY_DISPENSED', 'DISPENSED', 'CANCELLED', 'EXPIRED')),
    notes TEXT,
    idempotency_key VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT prescription_dates CHECK (valid_until IS NULL OR valid_until >= issued_on)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_prescription_idempotency
    ON prescription (idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS prescription_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescription(id) ON DELETE RESTRICT,
    medication_id UUID NOT NULL REFERENCES medication(id) ON DELETE RESTRICT,
    dose VARCHAR(120) NOT NULL,
    route VARCHAR(40) NOT NULL,
    frequency VARCHAR(120) NOT NULL,
    duration VARCHAR(120) NOT NULL,
    quantity_prescribed NUMERIC(14,3) NOT NULL CHECK (quantity_prescribed > 0),
    quantity_dispensed NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (quantity_dispensed >= 0),
    instructions TEXT NOT NULL,
    CONSTRAINT prescription_item_quantity CHECK (quantity_dispensed <= quantity_prescribed)
);

CREATE TABLE IF NOT EXISTS dispensation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispensation_code VARCHAR(30) NOT NULL UNIQUE,
    prescription_id UUID NOT NULL REFERENCES prescription(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
    pharmacist_id UUID REFERENCES professional(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED'
        CHECK (status IN ('DRAFT', 'CONFIRMED', 'PARTIAL', 'CANCELLED')),
    dispensed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    idempotency_key VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT dispensation_patient_match CHECK (patient_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_dispensation_idempotency
    ON dispensation (idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS dispensation_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispensation_id UUID NOT NULL REFERENCES dispensation(id) ON DELETE RESTRICT,
    prescription_item_id UUID NOT NULL REFERENCES prescription_item(id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES medication_batch(id) ON DELETE RESTRICT,
    quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
    UNIQUE (dispensation_id, prescription_item_id, batch_id)
);

CREATE TABLE IF NOT EXISTS stock_movement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_code VARCHAR(30) NOT NULL UNIQUE,
    medication_id UUID NOT NULL REFERENCES medication(id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES medication_batch(id) ON DELETE RESTRICT,
    source_location_id UUID REFERENCES inventory_location(id) ON DELETE RESTRICT,
    target_location_id UUID REFERENCES inventory_location(id) ON DELETE RESTRICT,
    movement_type VARCHAR(25) NOT NULL
        CHECK (movement_type IN ('IN', 'OUT', 'TRANSFER', 'DISPENSATION', 'ADJUSTMENT')),
    quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
    reason VARCHAR(255),
    dispensation_item_id UUID REFERENCES dispensation_item(id) ON DELETE RESTRICT,
    performed_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    idempotency_key VARCHAR(100),
    CONSTRAINT stock_movement_location CHECK (
        (movement_type = 'IN' AND target_location_id IS NOT NULL AND source_location_id IS NULL) OR
        (movement_type = 'OUT' AND source_location_id IS NOT NULL AND target_location_id IS NULL) OR
        (movement_type = 'TRANSFER' AND source_location_id IS NOT NULL AND target_location_id IS NOT NULL AND source_location_id <> target_location_id) OR
        (movement_type IN ('DISPENSATION', 'ADJUSTMENT'))
    ),
    CONSTRAINT stock_adjustment_reason CHECK (movement_type <> 'ADJUSTMENT' OR NULLIF(btrim(reason), '') IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_stock_movement_idempotency
    ON stock_movement (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_stock_movement_batch_date ON stock_movement (batch_id, occurred_at DESC);

-- ---------------------------------------------------------------------------
-- Emergencia y hospitalizacion
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bed_location (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(40) NOT NULL UNIQUE,
    room VARCHAR(80) NOT NULL,
    bed VARCHAR(40) NOT NULL,
    service_code VARCHAR(50) NOT NULL DEFAULT 'MED_INT',
    floor VARCHAR(40),
    bed_type VARCHAR(40) NOT NULL DEFAULT 'GENERAL',
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'INACTIVE')),
    UNIQUE (room, bed)
);

CREATE INDEX IF NOT EXISTS ix_bed_location_service_status
    ON bed_location (service_code, status, room, bed);

CREATE TABLE IF NOT EXISTS hospitalization_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(30) NOT NULL UNIQUE,
    origin_encounter_id UUID NOT NULL REFERENCES care_encounter(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
    responsible_professional_id UUID NOT NULL REFERENCES professional(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    presumptive_diagnosis TEXT NOT NULL,
    destination_service VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'EXECUTED', 'CANCELLED')),
    ordered_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    ordered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT hospitalization_order_execution CHECK (status <> 'EXECUTED' OR executed_at IS NOT NULL),
    CONSTRAINT hospitalization_order_cancellation CHECK (status <> 'CANCELLED' OR cancelled_at IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_hospitalization_order_origin_active
    ON hospitalization_order (origin_encounter_id) WHERE status <> 'CANCELLED';
CREATE INDEX IF NOT EXISTS ix_hospitalization_order_status
    ON hospitalization_order (status, ordered_at DESC);

CREATE TABLE IF NOT EXISTS hospitalization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospitalization_code VARCHAR(30) NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
    admission_encounter_id UUID REFERENCES care_encounter(id) ON DELETE RESTRICT,
    origin_encounter_id UUID REFERENCES care_encounter(id) ON DELETE RESTRICT,
    hospitalization_order_id UUID REFERENCES hospitalization_order(id) ON DELETE RESTRICT,
    bed_id UUID REFERENCES bed_location(id) ON DELETE RESTRICT,
    admitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    discharged_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'ADMITTED'
        CHECK (status IN ('ADMITTED', 'TRANSFERRED', 'DISCHARGED', 'CANCELLED')),
    admission_reason TEXT NOT NULL,
    discharge_diagnosis TEXT,
    discharge_type VARCHAR(30),
    discharge_instructions TEXT,
    follow_up_plan TEXT,
    medications_on_discharge TEXT,
    responsible_professional_id UUID REFERENCES professional(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT hospitalization_dates CHECK (discharged_at IS NULL OR discharged_at >= admitted_at),
    CONSTRAINT hospitalization_discharge CHECK (status <> 'DISCHARGED' OR discharged_at IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_active_bed_assignment
    ON hospitalization (bed_id) WHERE status = 'ADMITTED' AND bed_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_hospitalization_order_execution
    ON hospitalization (hospitalization_order_id) WHERE hospitalization_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_hospitalization_origin
    ON hospitalization (origin_encounter_id);

CREATE TABLE IF NOT EXISTS nursing_note (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospitalization_id UUID NOT NULL REFERENCES hospitalization(id) ON DELETE RESTRICT,
    encounter_id UUID REFERENCES care_encounter(id) ON DELETE RESTRICT,
    temperature_c NUMERIC(4,1) CHECK (temperature_c IS NULL OR temperature_c BETWEEN 20 AND 50),
    systolic_bp SMALLINT CHECK (systolic_bp IS NULL OR systolic_bp BETWEEN 40 AND 300),
    diastolic_bp SMALLINT CHECK (diastolic_bp IS NULL OR diastolic_bp BETWEEN 20 AND 200),
    heart_rate SMALLINT CHECK (heart_rate IS NULL OR heart_rate BETWEEN 20 AND 250),
    respiratory_rate SMALLINT CHECK (respiratory_rate IS NULL OR respiratory_rate BETWEEN 5 AND 80),
    oxygen_saturation NUMERIC(5,2) CHECK (oxygen_saturation IS NULL OR oxygen_saturation BETWEEN 0 AND 100),
    glucose_mg_dl NUMERIC(6,2) CHECK (glucose_mg_dl IS NULL OR glucose_mg_dl > 0),
    weight_kg NUMERIC(6,2) CHECK (weight_kg IS NULL OR weight_kg > 0),
    note TEXT NOT NULL,
    recorded_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- Facturacion y pagos
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS charge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    charge_code VARCHAR(30) NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
    service_id UUID REFERENCES service_catalog(id) ON DELETE RESTRICT,
    consultation_id UUID REFERENCES consultation(id) ON DELETE RESTRICT,
    lab_order_id UUID REFERENCES lab_order(id) ON DELETE RESTRICT,
    dispensation_id UUID REFERENCES dispensation(id) ON DELETE RESTRICT,
    quantity NUMERIC(14,3) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'INVOICED', 'VOID')),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    registered_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    CONSTRAINT charge_single_source CHECK (num_nonnulls(service_id, lab_order_id, dispensation_id) = 1)
);

CREATE INDEX IF NOT EXISTS ix_charge_patient ON charge (patient_id, registered_at DESC);
CREATE INDEX IF NOT EXISTS ix_charge_status ON charge (status, registered_at);

CREATE TABLE IF NOT EXISTS invoice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_code VARCHAR(30) NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'VOID')),
    currency CHAR(3) NOT NULL DEFAULT 'BOB',
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    discount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    tax NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
    total NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    issued_at TIMESTAMPTZ,
    created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT invoice_total_formula CHECK (total = subtotal - discount + tax)
);

CREATE TABLE IF NOT EXISTS invoice_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoice(id) ON DELETE RESTRICT,
    charge_id UUID NOT NULL UNIQUE REFERENCES charge(id) ON DELETE RESTRICT,
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(14,2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_invoice_patient_date ON invoice (patient_id, created_at DESC);

CREATE TABLE IF NOT EXISTS payment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_code VARCHAR(30) NOT NULL UNIQUE,
    invoice_id UUID NOT NULL REFERENCES invoice(id) ON DELETE RESTRICT,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(25) NOT NULL
        CHECK (payment_method IN ('CASH', 'CARD', 'TRANSFER', 'QR', 'OTHER')),
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED'
        CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'REFUNDED', 'CANCELLED')),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    registered_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    idempotency_key VARCHAR(100),
    CONSTRAINT payment_idempotency CHECK (NULLIF(btrim(idempotency_key), '') IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_payment_idempotency ON payment (idempotency_key);

-- ---------------------------------------------------------------------------
-- Notificaciones y documentos
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patient(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES app_user(id) ON DELETE RESTRICT,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP')),
    template_code VARCHAR(80) NOT NULL,
    destination VARCHAR(255),
    message TEXT NOT NULL,
    consent_required BOOLEAN NOT NULL DEFAULT TRUE,
    consent_granted BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'CANCELLED')),
    attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    last_attempt_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    error_message VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notification_recipient CHECK (patient_id IS NOT NULL OR user_id IS NOT NULL),
    CONSTRAINT notification_consent CHECK (NOT consent_required OR consent_granted OR channel = 'IN_APP')
);

CREATE INDEX IF NOT EXISTS ix_notification_status ON notification (status, created_at);

CREATE TABLE IF NOT EXISTS document_attachment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_type VARCHAR(80) NOT NULL,
    owner_id UUID NOT NULL,
    object_key VARCHAR(500) NOT NULL UNIQUE,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
    sha256_hash CHAR(64) NOT NULL,
    storage_provider VARCHAR(30) NOT NULL DEFAULT 'MINIO',
    access_scope VARCHAR(20) NOT NULL DEFAULT 'RESTRICTED'
        CHECK (access_scope IN ('RESTRICTED', 'ROLE', 'PATIENT')),
    uploaded_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_document_owner ON document_attachment (owner_type, owner_id);

-- ---------------------------------------------------------------------------
-- Triggers comunes y protecciones de integridad
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION siih_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'app_user', 'role', 'specialty', 'professional', 'service_catalog',
        'patient', 'clinical_history', 'appointment', 'care_encounter',
        'consultation', 'lab_order', 'lab_test_catalog', 'medication',
        'inventory_stock', 'prescription', 'hospitalization_order',
        'hospitalization', 'invoice'
    ] LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', 'trg_' || table_name || '_updated_at', table_name);
        EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION siih_set_updated_at()', 'trg_' || table_name || '_updated_at', table_name);
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION siih_prevent_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'audit_event is append-only';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_event_append_only ON audit_event;
CREATE TRIGGER trg_audit_event_append_only
    BEFORE UPDATE OR DELETE ON audit_event
    FOR EACH ROW EXECUTE FUNCTION siih_prevent_audit_mutation();

CREATE OR REPLACE FUNCTION siih_validate_stock_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    expiry_date DATE;
BEGIN
    SELECT expires_on INTO expiry_date FROM medication_batch WHERE id = NEW.batch_id;
    IF NEW.movement_type IN ('OUT', 'DISPENSATION') AND expiry_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'expired medication batches cannot leave inventory';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stock_movement_validate ON stock_movement;
CREATE TRIGGER trg_stock_movement_validate
    BEFORE INSERT ON stock_movement
    FOR EACH ROW EXECUTE FUNCTION siih_validate_stock_movement();

-- ---------------------------------------------------------------------------
-- Datos maestros y datos sinteticos de demostracion
-- ---------------------------------------------------------------------------

INSERT INTO role (code, name, description) VALUES
    ('RECEPTION', 'Recepcion y admision', 'Registro de pacientes, llegada y agenda'),
    ('DOCTOR', 'Medico', 'Consulta clinica, diagnostico, ordenes y recetas'),
    ('NURSE', 'Enfermeria', 'Triaje, signos vitales y notas de enfermeria'),
    ('LAB_TECHNICIAN', 'Tecnico de laboratorio', 'Muestras, resultados y validacion segun permiso'),
    ('PHARMACIST', 'Farmacia', 'Recetas, dispensacion e inventario'),
    ('CASHIER', 'Caja', 'Cargos, pagos y comprobantes'),
    ('DIRECTOR', 'Direccion', 'Indicadores y reportes autorizados'),
    ('SYSTEM_ADMIN', 'Administrador del sistema', 'Usuarios, roles y auditoria')
ON CONFLICT (code) DO NOTHING;

INSERT INTO permission (code, name, description) VALUES
    ('PATIENT_READ', 'Consultar pacientes', 'Buscar y consultar fichas autorizadas'),
    ('PATIENT_WRITE', 'Gestionar pacientes', 'Crear y actualizar datos demograficos'),
    ('APPOINTMENT_WRITE', 'Gestionar citas', 'Crear, reprogramar, cancelar y confirmar citas'),
    ('CLINICAL_READ', 'Consultar historia clinica', 'Acceso clinico segun rol y finalidad'),
    ('CLINICAL_WRITE', 'Registrar consulta', 'Crear, cerrar y versionar consultas'),
    ('LAB_WRITE', 'Gestionar laboratorio', 'Ordenes, muestras y resultados'),
    ('PHARMACY_WRITE', 'Dispensar recetas', 'Validar y dispensar recetas vigentes'),
    ('INVENTORY_WRITE', 'Gestionar inventario', 'Movimientos, lotes y ajustes autorizados'),
    ('BILLING_WRITE', 'Gestionar facturacion', 'Cargos, facturas y pagos'),
    ('REPORT_READ', 'Consultar reportes', 'Indicadores y reportes segun permiso'),
    ('AUDIT_READ', 'Consultar auditoria', 'Filtrar eventos de auditoria autorizados'),
    ('USER_ADMIN', 'Administrar usuarios', 'Gestionar usuarios, roles y bloqueos')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r CROSS JOIN permission p
WHERE (r.code = 'RECEPTION' AND p.code IN ('PATIENT_READ', 'PATIENT_WRITE', 'APPOINTMENT_WRITE'))
   OR (r.code = 'DOCTOR' AND p.code IN ('PATIENT_READ', 'APPOINTMENT_WRITE', 'CLINICAL_READ', 'CLINICAL_WRITE'))
   OR (r.code = 'NURSE' AND p.code IN ('PATIENT_READ', 'CLINICAL_READ', 'CLINICAL_WRITE'))
   OR (r.code = 'LAB_TECHNICIAN' AND p.code IN ('PATIENT_READ', 'CLINICAL_READ', 'LAB_WRITE'))
   OR (r.code = 'PHARMACIST' AND p.code IN ('PATIENT_READ', 'CLINICAL_READ', 'PHARMACY_WRITE', 'INVENTORY_WRITE'))
   OR (r.code = 'CASHIER' AND p.code IN ('PATIENT_READ', 'BILLING_WRITE'))
   OR (r.code = 'DIRECTOR' AND p.code IN ('REPORT_READ'))
   OR (r.code = 'SYSTEM_ADMIN' AND p.code IN ('AUDIT_READ', 'USER_ADMIN'))
ON CONFLICT DO NOTHING;

INSERT INTO specialty (code, name, description) VALUES
    ('MED_INT', 'Medicina interna', 'Atencion integral del adulto'),
    ('CARD', 'Cardiologia', 'Prevencion y tratamiento cardiovascular'),
    ('PED', 'Pediatria', 'Atencion integral de ninos y adolescentes'),
    ('TRAUMA', 'Traumatologia', 'Sistema musculoesqueletico y lesiones'),
    ('GYN', 'Ginecologia', 'Salud integral de la mujer')
ON CONFLICT (code) DO NOTHING;

INSERT INTO service_catalog (code, name, description, service_type, default_price) VALUES
    ('CONSULT-GEN', 'Consulta externa', 'Consulta medica general', 'CONSULTATION', 80.00),
    ('CONSULT-SPEC', 'Consulta especializada', 'Consulta con especialista', 'CONSULTATION', 120.00),
    ('LAB-CBC', 'Hemograma completo', 'Analisis hematologico basico', 'LABORATORY', 45.00),
    ('LAB-GLU', 'Glucosa en sangre', 'Medicion de glucosa', 'LABORATORY', 25.00)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lab_test_catalog (code, name, sample_type, unit, reference_range, price) VALUES
    ('CBC', 'Hemograma completo', 'Sangre', NULL, NULL, 45.00),
    ('GLU', 'Glucosa en sangre', 'Sangre', 'mg/dL', '70 - 100', 25.00),
    ('UA', 'Examen general de orina', 'Orina', NULL, NULL, 30.00)
ON CONFLICT (code) DO NOTHING;

INSERT INTO medication (code, generic_name, commercial_name, presentation, concentration, route, minimum_stock) VALUES
    ('AMOX-500-CAP', 'Amoxicilina', NULL, 'Capsula', '500 mg', 'ORAL', 10),
    ('PARA-500-TAB', 'Paracetamol', NULL, 'Tableta', '500 mg', 'ORAL', 20),
    ('IBU-400-TAB', 'Ibuprofeno', NULL, 'Tableta', '400 mg', 'ORAL', 15)
ON CONFLICT (code) DO NOTHING;

INSERT INTO inventory_location (code, name, location_type) VALUES
    ('FARM-MAIN', 'Farmacia central', 'PHARMACY'),
    ('WH-MAIN', 'Almacen central', 'WAREHOUSE'),
    ('LAB-MAIN', 'Laboratorio clinico', 'LABORATORY')
ON CONFLICT (code) DO NOTHING;

INSERT INTO patient (
    patient_code, document_type, document_number, first_name, middle_name,
    last_name, second_last_name, birth_date, sex, phone, status
) VALUES
    ('PAC-00842', 'CI', '6812047 LP', 'Valeria', NULL, 'Quispe', 'Mamani', '1992-04-18', 'FEMALE', '70000001', 'ACTIVE'),
    ('PAC-00841', 'CI', '4921873 LP', 'Marco Antonio', NULL, 'Rojas', NULL, '1968-11-02', 'MALE', '70000002', 'ACTIVE'),
    ('PAC-00840', 'CI', '7351049 LP', 'Lucia', NULL, 'Fernandez', 'Paz', '2017-06-22', 'FEMALE', '70000003', 'ACTIVE'),
    ('PAC-00839', 'CI', '6182471 LP', 'Diego Sebastian', NULL, 'Flores', NULL, '1984-01-30', 'MALE', '70000004', 'ACTIVE'),
    ('PAC-00838', 'CI', '4039812 LP', 'Rosa Elena', NULL, 'Gutierrez', NULL, '1959-09-11', 'FEMALE', '70000005', 'ACTIVE')
ON CONFLICT (patient_code) DO NOTHING;

INSERT INTO clinical_history (patient_id, background, allergies)
SELECT p.id, 'Registro sintetico de demostracion.', 'Sin alergias registradas en este ambiente.'
FROM patient p
WHERE p.patient_code IN ('PAC-00842', 'PAC-00841', 'PAC-00840', 'PAC-00839', 'PAC-00838')
ON CONFLICT (patient_id) DO NOTHING;

INSERT INTO medication_batch (medication_id, batch_code, received_on, expires_on, unit_cost, supplier_name)
SELECT m.id, 'BATCH-DEMO-001', '2026-07-01', '2027-07-01', 0.80, 'Proveedor sintetico'
FROM medication m WHERE m.code = 'AMOX-500-CAP'
ON CONFLICT (medication_id, batch_code) DO NOTHING;

INSERT INTO inventory_stock (medication_id, batch_id, location_id, available_quantity)
SELECT b.medication_id, b.id, l.id, 8
FROM medication_batch b
JOIN inventory_location l ON l.code = 'FARM-MAIN'
WHERE b.batch_code = 'BATCH-DEMO-001'
ON CONFLICT (batch_id, location_id) DO NOTHING;

-- Usuarios, profesionales y agenda de demostracion.
-- La contrasena de los usuarios demo es: password
-- Este bloque usa identificadores estables para poder ejecutarse varias veces.
INSERT INTO app_user (
    id, username, password_hash, first_name, last_name, email, status
) VALUES
    ('11111111-1111-1111-1111-111111111101', 'recepcion.demo', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Ana', 'Mamani', 'recepcion.demo@hospital.local', 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111102', 'laura.medina', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Laura', 'Medina', 'laura.medina@hospital.local', 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111103', 'andres.condori', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Andres', 'Condori', 'andres.condori@hospital.local', 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111104', 'natalia.vargas', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Natalia', 'Vargas', 'natalia.vargas@hospital.local', 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111105', 'carlos.quispe', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Carlos', 'Quispe', 'carlos.quispe@hospital.local', 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO user_role (user_id, role_id)
SELECT '11111111-1111-1111-1111-111111111101'::uuid, id FROM role WHERE code = 'RECEPTION'
UNION ALL
SELECT '11111111-1111-1111-1111-111111111102'::uuid, id FROM role WHERE code = 'DOCTOR'
UNION ALL
SELECT '11111111-1111-1111-1111-111111111103'::uuid, id FROM role WHERE code = 'DOCTOR'
UNION ALL
SELECT '11111111-1111-1111-1111-111111111104'::uuid, id FROM role WHERE code = 'DOCTOR'
UNION ALL
SELECT '11111111-1111-1111-1111-111111111105'::uuid, id FROM role WHERE code = 'DOCTOR'
ON CONFLICT DO NOTHING;

INSERT INTO professional (
    id, user_id, professional_code, license_number, professional_type, status
) VALUES
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 'PROF-0001', 'RM-001-UMSA', 'DOCTOR', 'ACTIVE'),
    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111103', 'PROF-0002', 'RM-002-UMSA', 'DOCTOR', 'ACTIVE'),
    ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111104', 'PROF-0003', 'RM-003-UMSA', 'DOCTOR', 'ACTIVE'),
    ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111105', 'PROF-0004', 'RM-004-UMSA', 'DOCTOR', 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO professional_specialty (professional_id, specialty_id, is_primary)
SELECT '22222222-2222-2222-2222-222222222201'::uuid, id, TRUE FROM specialty WHERE code = 'MED_INT'
UNION ALL
SELECT '22222222-2222-2222-2222-222222222201'::uuid, id, FALSE FROM specialty WHERE code = 'GYN'
UNION ALL
SELECT '22222222-2222-2222-2222-222222222202'::uuid, id, TRUE FROM specialty WHERE code = 'CARD'
UNION ALL
SELECT '22222222-2222-2222-2222-222222222203'::uuid, id, TRUE FROM specialty WHERE code = 'PED'
UNION ALL
SELECT '22222222-2222-2222-2222-222222222204'::uuid, id, TRUE FROM specialty WHERE code = 'TRAUMA'
ON CONFLICT DO NOTHING;

INSERT INTO professional_schedule (professional_id, weekday, starts_at, ends_at, effective_from)
SELECT v.professional_id, v.weekday, v.starts_at, v.ends_at, CURRENT_DATE
FROM (VALUES
    ('22222222-2222-2222-2222-222222222201'::uuid, 1, TIME '08:00', TIME '13:00'),
    ('22222222-2222-2222-2222-222222222202'::uuid, 1, TIME '08:00', TIME '13:00'),
    ('22222222-2222-2222-2222-222222222203'::uuid, 1, TIME '08:00', TIME '13:00'),
    ('22222222-2222-2222-2222-222222222204'::uuid, 1, TIME '08:00', TIME '13:00')
) AS v(professional_id, weekday, starts_at, ends_at)
WHERE NOT EXISTS (
    SELECT 1
    FROM professional_schedule ps
    WHERE ps.professional_id = v.professional_id
      AND ps.weekday = v.weekday
      AND ps.starts_at = v.starts_at
      AND ps.ends_at = v.ends_at
);

INSERT INTO appointment (
    id, appointment_code, patient_id, professional_id, specialty_id,
    starts_at, ends_at, status, reason, created_by, idempotency_key
)
SELECT
    '33333333-3333-3333-3333-333333333301'::uuid, 'CIT-DEMO-001', p.id, pr.id, s.id,
    timezone('America/La_Paz', CURRENT_DATE + TIME '08:30'),
    timezone('America/La_Paz', CURRENT_DATE + TIME '09:00'),
    'COMPLETED', 'Control de medicina interna', '11111111-1111-1111-1111-111111111101'::uuid, 'seed-cit-demo-001'
FROM patient p, professional pr, specialty s
WHERE p.patient_code = 'PAC-00842' AND pr.professional_code = 'PROF-0001' AND s.code = 'MED_INT'
ON CONFLICT DO NOTHING;

INSERT INTO appointment (
    id, appointment_code, patient_id, professional_id, specialty_id,
    starts_at, ends_at, status, reason, created_by, idempotency_key
)
SELECT
    '33333333-3333-3333-3333-333333333302'::uuid, 'CIT-DEMO-002', p.id, pr.id, s.id,
    timezone('America/La_Paz', CURRENT_DATE + TIME '09:00'),
    timezone('America/La_Paz', CURRENT_DATE + TIME '09:30'),
    'CONFIRMED', 'Evaluacion cardiologica', '11111111-1111-1111-1111-111111111101'::uuid, 'seed-cit-demo-002'
FROM patient p, professional pr, specialty s
WHERE p.patient_code = 'PAC-00841' AND pr.professional_code = 'PROF-0002' AND s.code = 'CARD'
ON CONFLICT DO NOTHING;

INSERT INTO appointment (
    id, appointment_code, patient_id, professional_id, specialty_id,
    starts_at, ends_at, status, reason, created_by, idempotency_key
)
SELECT
    '33333333-3333-3333-3333-333333333303'::uuid, 'CIT-DEMO-003', p.id, pr.id, s.id,
    timezone('America/La_Paz', CURRENT_DATE + TIME '09:30'),
    timezone('America/La_Paz', CURRENT_DATE + TIME '10:00'),
    'SCHEDULED', 'Control pediatrico', '11111111-1111-1111-1111-111111111101'::uuid, 'seed-cit-demo-003'
FROM patient p, professional pr, specialty s
WHERE p.patient_code = 'PAC-00840' AND pr.professional_code = 'PROF-0003' AND s.code = 'PED'
ON CONFLICT DO NOTHING;

INSERT INTO appointment (
    id, appointment_code, patient_id, professional_id, specialty_id,
    starts_at, ends_at, status, reason, created_by, idempotency_key
)
SELECT
    '33333333-3333-3333-3333-333333333304'::uuid, 'CIT-DEMO-004', p.id, pr.id, s.id,
    timezone('America/La_Paz', CURRENT_DATE + TIME '10:00'),
    timezone('America/La_Paz', CURRENT_DATE + TIME '10:30'),
    'SCHEDULED', 'Valoracion traumatologica', '11111111-1111-1111-1111-111111111101'::uuid, 'seed-cit-demo-004'
FROM patient p, professional pr, specialty s
WHERE p.patient_code = 'PAC-00839' AND pr.professional_code = 'PROF-0004' AND s.code = 'TRAUMA'
ON CONFLICT DO NOTHING;

INSERT INTO appointment (
    id, appointment_code, patient_id, professional_id, specialty_id,
    starts_at, ends_at, status, reason, created_by, idempotency_key
)
SELECT
    '33333333-3333-3333-3333-333333333305'::uuid, 'CIT-DEMO-005', p.id, pr.id, s.id,
    timezone('America/La_Paz', CURRENT_DATE + TIME '10:30'),
    timezone('America/La_Paz', CURRENT_DATE + TIME '11:00'),
    'CONFIRMED', 'Consulta ginecologica', '11111111-1111-1111-1111-111111111101'::uuid, 'seed-cit-demo-005'
FROM patient p, professional pr, specialty s
WHERE p.patient_code = 'PAC-00838' AND pr.professional_code = 'PROF-0001' AND s.code = 'GYN'
ON CONFLICT DO NOTHING;

INSERT INTO care_encounter (
    id, encounter_code, patient_id, appointment_id, encounter_type, status,
    opened_at, closed_at, created_by
)
SELECT
    '44444444-4444-4444-4444-444444444401'::uuid, 'ENC-DEMO-001', p.id, a.id,
    'OUTPATIENT', 'CLOSED',
    timezone('America/La_Paz', CURRENT_DATE + TIME '08:30'),
    timezone('America/La_Paz', CURRENT_DATE + TIME '09:15'),
    '11111111-1111-1111-1111-111111111102'::uuid
FROM patient p, appointment a
WHERE p.patient_code = 'PAC-00842' AND a.appointment_code = 'CIT-DEMO-001'
ON CONFLICT DO NOTHING;

INSERT INTO triage (
    id, encounter_id, priority, temperature_c, systolic_bp, diastolic_bp,
    heart_rate, respiratory_rate, oxygen_saturation, weight_kg, height_cm,
    notes, recorded_by
)
SELECT
    '55555555-5555-5555-5555-555555555501'::uuid, e.id, 'GREEN', 36.7, 118, 76,
    72, 16, 98.00, 64.50, 162.00, 'Signos vitales dentro de parametros esperados.',
    '11111111-1111-1111-1111-111111111101'::uuid
FROM care_encounter e
WHERE e.encounter_code = 'ENC-DEMO-001'
ON CONFLICT DO NOTHING;

INSERT INTO consultation (
    id, consultation_code, encounter_id, patient_id, professional_id,
    chief_complaint, evolution, diagnosis_summary, treatment_plan,
    recommendations, status, signed_at, signed_by
)
SELECT
    '66666666-6666-6666-6666-666666666601'::uuid, 'CONS-DEMO-001', e.id, p.id, pr.id,
    'Cefalea ocasional y cansancio durante la jornada laboral.',
    'Paciente estable, sin signos de alarma. Refiere mejoria con descanso e hidratacion.',
    'Cefalea tensional sin datos de alarma.',
    'Hidratacion, pausas activas y paracetamol 500 mg si es necesario.',
    'Control en cuatro semanas o antes si aparecen signos de alarma.',
    'CLOSED', CURRENT_TIMESTAMP, '11111111-1111-1111-1111-111111111102'::uuid
FROM care_encounter e, patient p, professional pr
WHERE e.encounter_code = 'ENC-DEMO-001'
  AND p.patient_code = 'PAC-00842'
  AND pr.professional_code = 'PROF-0001'
ON CONFLICT DO NOTHING;

INSERT INTO consultation_diagnosis (id, consultation_id, code, description, diagnosis_type)
SELECT
    '77777777-7777-7777-7777-777777777701'::uuid, c.id, 'R51.9',
    'Cefalea, no especificada', 'PRIMARY'
FROM consultation c
WHERE c.consultation_code = 'CONS-DEMO-001'
ON CONFLICT DO NOTHING;

COMMIT;

-- Nota para Spring:
-- application-local.properties usa spring.jpa.hibernate.ddl-auto=none.
-- En el siguiente paso conviene convertir este esquema en migraciones Flyway
-- versionadas (V1__initial_schema.sql) y mantener Hibernate en validate.
