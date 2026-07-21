# Frontend SIIH

Interfaz web del Sistema Integrado de Información Hospitalaria para el caso académico del Hospital Universitario San Andrés.

## Funcionalidad disponible

- Landing pública basada en el alcance documentado del SIIH.
- Login de demostración, sesión persistente y cierre de sesión.
- Navegación protegida y módulos visibles según el rol.
- Dashboard con métricas de los endpoints `overview`.
- Pacientes: búsqueda, paginación, alta, detección de duplicados y edición.
- Citas: agenda diaria, creación, llegada y cancelación.
- Historia clínica y consultas: lectura, actualización, creación y cierre.
- Laboratorio, farmacia, inventario, facturación, reportes y administración: consulta, búsqueda, actualización y exportación CSV autorizada.
- Estados de carga, vacío, error y reintento.

Triaje y hospitalización aparecen únicamente para roles autorizados, con estado de integración pendiente porque el backend actual todavía no publica sus endpoints. Las operaciones CRUD de laboratorio, dispensación, inventario, pagos y usuarios tampoco se simulan: las vistas permanecen de consulta hasta que existan contratos de escritura.

## Desarrollo

```bash
npm install
npm run dev
```

La API se consulta en `http://localhost:8080/api/v1` por defecto. Puede cambiarse con:

```bash
VITE_API_URL=http://localhost:8080/api/v1
```

## Acceso académico

La clave común del entorno es `siih2026`. Los usuarios disponibles son:

| Usuario | Perfil |
|---|---|
| `recepcion` | Admisión y recepción |
| `medica` | Personal médico |
| `enfermeria` | Enfermería |
| `laboratorio` | Laboratorio clínico |
| `farmacia` | Farmacia |
| `caja` | Caja y facturación |
| `direccion` | Dirección |
| `admin` | Administración del sistema |

Este login es deliberadamente local porque el backend aún no implementa `/auth/login`, `/auth/me`, renovación ni revocación de tokens. No debe considerarse autenticación de producción.

## Validación

```bash
npm run lint
npm run build
npm run test:e2e
```

Las pruebas E2E usan Microsoft Edge instalado y cubren landing, login, protección de rutas, permisos, navegación por pestañas y viewport móvil.
