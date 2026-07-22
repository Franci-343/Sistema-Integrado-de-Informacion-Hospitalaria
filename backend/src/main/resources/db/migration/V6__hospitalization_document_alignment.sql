ALTER TABLE bed_location
    ADD COLUMN IF NOT EXISTS service_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS floor VARCHAR(40),
    ADD COLUMN IF NOT EXISTS bed_type VARCHAR(40);

UPDATE bed_location
SET service_code = COALESCE(service_code, 'MED_INT'),
    floor = COALESCE(floor, split_part(room, '-', 1)),
    bed_type = COALESCE(bed_type, 'GENERAL');

ALTER TABLE bed_location
    ALTER COLUMN service_code SET NOT NULL,
    ALTER COLUMN bed_type SET NOT NULL;

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

ALTER TABLE hospitalization
    ADD COLUMN IF NOT EXISTS origin_encounter_id UUID REFERENCES care_encounter(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS hospitalization_order_id UUID REFERENCES hospitalization_order(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS discharge_diagnosis TEXT,
    ADD COLUMN IF NOT EXISTS discharge_type VARCHAR(30),
    ADD COLUMN IF NOT EXISTS follow_up_plan TEXT,
    ADD COLUMN IF NOT EXISTS medications_on_discharge TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS ux_hospitalization_order_execution
    ON hospitalization (hospitalization_order_id) WHERE hospitalization_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_hospitalization_origin
    ON hospitalization (origin_encounter_id);

ALTER TABLE nursing_note
    ADD COLUMN IF NOT EXISTS temperature_c NUMERIC(4,1) CHECK (temperature_c IS NULL OR temperature_c BETWEEN 20 AND 50),
    ADD COLUMN IF NOT EXISTS systolic_bp SMALLINT CHECK (systolic_bp IS NULL OR systolic_bp BETWEEN 40 AND 300),
    ADD COLUMN IF NOT EXISTS diastolic_bp SMALLINT CHECK (diastolic_bp IS NULL OR diastolic_bp BETWEEN 20 AND 200),
    ADD COLUMN IF NOT EXISTS heart_rate SMALLINT CHECK (heart_rate IS NULL OR heart_rate BETWEEN 20 AND 250),
    ADD COLUMN IF NOT EXISTS respiratory_rate SMALLINT CHECK (respiratory_rate IS NULL OR respiratory_rate BETWEEN 5 AND 80),
    ADD COLUMN IF NOT EXISTS oxygen_saturation NUMERIC(5,2) CHECK (oxygen_saturation IS NULL OR oxygen_saturation BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS glucose_mg_dl NUMERIC(6,2) CHECK (glucose_mg_dl IS NULL OR glucose_mg_dl > 0),
    ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(6,2) CHECK (weight_kg IS NULL OR weight_kg > 0);

ALTER TABLE appointment DROP CONSTRAINT IF EXISTS appointment_status_check;
ALTER TABLE appointment ADD CONSTRAINT appointment_status_check
    CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED',
                      'CANCELLED', 'RESCHEDULED', 'NO_SHOW', 'DERIVED_TO_HOSPITALIZATION'));

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_hospitalization_order_updated_at'
    ) THEN
        CREATE TRIGGER trg_hospitalization_order_updated_at
            BEFORE UPDATE ON hospitalization_order
            FOR EACH ROW EXECUTE FUNCTION siih_set_updated_at();
    END IF;
END $$;
