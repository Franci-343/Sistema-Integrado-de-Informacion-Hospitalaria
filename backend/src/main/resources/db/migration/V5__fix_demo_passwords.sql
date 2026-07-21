UPDATE app_user
SET password_hash = crypt('password', gen_salt('bf', 10)),
    failed_login_attempts = 0,
    locked_until = NULL,
    status = 'ACTIVE'
WHERE username IN (
    'recepcion', 'medica', 'enfermeria', 'laboratorio',
    'farmacia', 'caja', 'direccion', 'admin',
    'recepcion.demo', 'laura.medina', 'andres.condori', 'natalia.vargas', 'carlos.quispe'
);
