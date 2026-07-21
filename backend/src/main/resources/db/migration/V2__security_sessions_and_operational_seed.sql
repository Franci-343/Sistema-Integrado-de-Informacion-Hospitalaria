CREATE TABLE IF NOT EXISTS auth_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    refresh_token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    client_info VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_auth_session_user_active
    ON auth_session (user_id, expires_at) WHERE revoked_at IS NULL;

INSERT INTO permission (code, name, description) VALUES
    ('DASHBOARD_VIEW', 'Consultar panel principal', 'Acceso al resumen operativo'),
    ('APPOINTMENT_READ', 'Consultar citas', 'Consulta de agenda y citas'),
    ('TRIAGE_READ', 'Consultar triaje', 'Consulta de prioridad y signos vitales'),
    ('TRIAGE_WRITE', 'Gestionar triaje', 'Registro y actualizacion de triaje'),
    ('HOSPITALIZATION_READ', 'Consultar hospitalizacion', 'Consulta de camas, ingresos y notas'),
    ('HOSPITALIZATION_WRITE', 'Gestionar hospitalizacion', 'Ingresos, notas y altas'),
    ('LAB_READ', 'Consultar laboratorio', 'Consulta de ordenes y resultados'),
    ('PHARMACY_READ', 'Consultar farmacia', 'Consulta de recetas y dispensaciones'),
    ('INVENTORY_READ', 'Consultar inventario', 'Consulta de lotes, saldos y movimientos'),
    ('BILLING_READ', 'Consultar facturacion', 'Consulta de cargos, facturas y pagos'),
    ('REPORT_EXPORT', 'Exportar reportes', 'Exportacion de informacion autorizada'),
    ('ADMIN_READ', 'Consultar administracion', 'Consulta de usuarios, roles y auditoria'),
    ('ADMIN_WRITE', 'Gestionar administracion', 'Alta, actualizacion y bloqueo de usuarios')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
JOIN permission p ON
       (r.code = 'RECEPTION' AND p.code IN (
           'DASHBOARD_VIEW', 'PATIENT_READ', 'PATIENT_WRITE', 'APPOINTMENT_READ',
           'APPOINTMENT_WRITE', 'CLINICAL_READ', 'TRIAGE_READ', 'REPORT_READ'))
    OR (r.code = 'DOCTOR' AND p.code IN (
           'DASHBOARD_VIEW', 'PATIENT_READ', 'APPOINTMENT_READ', 'CLINICAL_READ',
           'CLINICAL_WRITE', 'TRIAGE_READ', 'HOSPITALIZATION_READ',
           'HOSPITALIZATION_WRITE', 'LAB_READ', 'LAB_WRITE', 'PHARMACY_READ', 'REPORT_READ'))
    OR (r.code = 'NURSE' AND p.code IN (
           'DASHBOARD_VIEW', 'PATIENT_READ', 'APPOINTMENT_READ', 'CLINICAL_READ',
           'TRIAGE_READ', 'TRIAGE_WRITE', 'HOSPITALIZATION_READ',
           'HOSPITALIZATION_WRITE', 'REPORT_READ'))
    OR (r.code = 'LAB_TECHNICIAN' AND p.code IN (
           'DASHBOARD_VIEW', 'PATIENT_READ', 'CLINICAL_READ', 'LAB_READ', 'LAB_WRITE', 'REPORT_READ'))
    OR (r.code = 'PHARMACIST' AND p.code IN (
           'DASHBOARD_VIEW', 'PATIENT_READ', 'CLINICAL_READ', 'PHARMACY_READ',
           'PHARMACY_WRITE', 'INVENTORY_READ', 'INVENTORY_WRITE', 'REPORT_READ'))
    OR (r.code = 'CASHIER' AND p.code IN (
           'DASHBOARD_VIEW', 'PATIENT_READ', 'BILLING_READ', 'BILLING_WRITE',
           'REPORT_READ', 'REPORT_EXPORT'))
    OR (r.code = 'DIRECTOR' AND p.code IN (
           'DASHBOARD_VIEW', 'APPOINTMENT_READ', 'LAB_READ', 'PHARMACY_READ',
           'INVENTORY_READ', 'BILLING_READ', 'REPORT_READ', 'REPORT_EXPORT', 'AUDIT_READ'))
    OR (r.code = 'SYSTEM_ADMIN')
ON CONFLICT DO NOTHING;

-- La clave comun de estas cuentas academicas es: password
INSERT INTO app_user (id, username, password_hash, first_name, last_name, email, status) VALUES
    ('11111111-1111-1111-1111-111111111110', 'recepcion', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Andrea', 'Suarez', 'recepcion@hospital.local', 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111111', 'medica', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Elena', 'Vargas', 'medica@hospital.local', 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111112', 'enfermeria', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Maria', 'Choque', 'enfermeria@hospital.local', 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111113', 'laboratorio', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Marco', 'Quispe', 'laboratorio@hospital.local', 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111114', 'farmacia', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Sofia', 'Rojas', 'farmacia@hospital.local', 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111115', 'caja', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Diego', 'Flores', 'caja@hospital.local', 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111116', 'direccion', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Laura', 'Mendoza', 'direccion@hospital.local', 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111117', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Camila', 'Torres', 'admin@hospital.local', 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO user_role (user_id, role_id)
SELECT users.user_id, r.id
FROM (VALUES
    ('11111111-1111-1111-1111-111111111110'::uuid, 'RECEPTION'),
    ('11111111-1111-1111-1111-111111111111'::uuid, 'DOCTOR'),
    ('11111111-1111-1111-1111-111111111112'::uuid, 'NURSE'),
    ('11111111-1111-1111-1111-111111111113'::uuid, 'LAB_TECHNICIAN'),
    ('11111111-1111-1111-1111-111111111114'::uuid, 'PHARMACIST'),
    ('11111111-1111-1111-1111-111111111115'::uuid, 'CASHIER'),
    ('11111111-1111-1111-1111-111111111116'::uuid, 'DIRECTOR'),
    ('11111111-1111-1111-1111-111111111117'::uuid, 'SYSTEM_ADMIN')
) AS users(user_id, role_code)
JOIN role r ON r.code = users.role_code
ON CONFLICT DO NOTHING;

INSERT INTO professional (id, user_id, professional_code, license_number, professional_type, status) VALUES
    ('22222222-2222-2222-2222-222222222210', '11111111-1111-1111-1111-111111111111', 'PROF-DEMO-MED', 'RM-DEMO-001', 'DOCTOR', 'ACTIVE'),
    ('22222222-2222-2222-2222-222222222211', '11111111-1111-1111-1111-111111111112', 'PROF-DEMO-ENF', 'ENF-DEMO-001', 'NURSE', 'ACTIVE'),
    ('22222222-2222-2222-2222-222222222212', '11111111-1111-1111-1111-111111111113', 'PROF-DEMO-LAB', 'LAB-DEMO-001', 'LAB_TECHNICIAN', 'ACTIVE'),
    ('22222222-2222-2222-2222-222222222213', '11111111-1111-1111-1111-111111111114', 'PROF-DEMO-FAR', 'FAR-DEMO-001', 'PHARMACIST', 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO bed_location (id, code, room, bed, status) VALUES
    ('88888888-8888-8888-8888-888888888801', 'HOSP-A-101-1', 'A-101', '1', 'AVAILABLE'),
    ('88888888-8888-8888-8888-888888888802', 'HOSP-A-101-2', 'A-101', '2', 'AVAILABLE'),
    ('88888888-8888-8888-8888-888888888803', 'HOSP-A-102-1', 'A-102', '1', 'AVAILABLE'),
    ('88888888-8888-8888-8888-888888888804', 'HOSP-B-201-1', 'B-201', '1', 'AVAILABLE')
ON CONFLICT DO NOTHING;
