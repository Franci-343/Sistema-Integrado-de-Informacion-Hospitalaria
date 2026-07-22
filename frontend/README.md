# Frontend SIIH

Interfaz web del Sistema Integrado de Información Hospitalaria para el caso académico del Hospital Universitario San Andrés.

## Funcionalidad

- Landing pública y acceso institucional conectado a `/auth/login`, separado del entorno de demostración.
- Sesiones JWT con refresh token rotatorio, persistencia opcional, cierre remoto y permisos por rol.
- Dashboard, pacientes, agenda, historia clínica y consultas conectados al backend.
- Triaje: prioridad, signos vitales y seguimiento de evaluaciones.
- Hospitalización: camas, ingresos, notas de enfermería y altas.
- Laboratorio: órdenes, recepción de muestras, resultados, validación y publicación.
- Farmacia: recetas, dispensación por lote y descuento atómico de stock.
- Inventario: lotes, entradas, salidas, transferencias y ajustes.
- Facturación: cargos, facturas, emisión y pagos.
- Administración: alta y edición de cuentas, restablecimiento administrativo, estados, roles múltiples y auditoría filtrable.
- Notificaciones internas, reportes y exportación CSV según permisos.
- Revisión contextual de posibles pacientes duplicados antes de crear una ficha.
- Selección de profesionales por especialidad y confirmación trazable al cancelar citas.

## Identidad y cuentas

El SIIH no ofrece registro público. De acuerdo con `RF-SEG-002` y `UC-08`, un administrador autorizado crea la cuenta institucional, asigna los roles mínimos y gestiona bloqueos o restablecimientos. La recuperación de autoservicio permanece deshabilitada hasta que el hospital defina su política de sesiones, MFA y recuperación.

La interfaz cubre `RF-SEG-001`, `RF-SEG-002`, `RF-SEG-004`, `RF-PAC-002` y `RN-CIT-003` con autenticación, administración de acceso, filtros de auditoría, revisión de duplicados y cancelación con motivo.

## Desarrollo

Con PostgreSQL y el backend activos en `localhost:8080`:

```bash
npm install
npm run dev
```

La URL de la API puede cambiarse con `VITE_API_URL`:

```bash
VITE_API_URL=http://localhost:8080/api/v1
```

## Acceso académico

La clave común es `password`.

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

## Validación

```bash
npm run lint
npm run build
npm run test:e2e
```

Los E2E usan un contrato API simulado y cubren landing, autenticación, alta de cuentas, auditoría, revisión de duplicados, protección de rutas, permisos, navegación por módulos y viewport móvil. `e2e/live.spec.ts` permite repetir el recorrido contra Spring Boot y PostgreSQL con `SIIH_LIVE=1`.
