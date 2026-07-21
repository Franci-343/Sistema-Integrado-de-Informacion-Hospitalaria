# Frontend SIIH

Interfaz web del Sistema Integrado de Información Hospitalaria para el caso académico del Hospital Universitario San Andrés.

## Funcionalidad

- Landing pública y acceso institucional conectado a `/auth/login`.
- Sesiones JWT con refresh token rotatorio, persistencia opcional, cierre remoto y permisos por rol.
- Dashboard, pacientes, agenda, historia clínica y consultas conectados al backend.
- Triaje: prioridad, signos vitales y seguimiento de evaluaciones.
- Hospitalización: camas, ingresos, notas de enfermería y altas.
- Laboratorio: órdenes, recepción de muestras, resultados, validación y publicación.
- Farmacia: recetas, dispensación por lote y descuento atómico de stock.
- Inventario: lotes, entradas, salidas, transferencias y ajustes.
- Facturación: cargos, facturas, emisión y pagos.
- Administración: usuarios, estados, roles y auditoría.
- Notificaciones internas, reportes y exportación CSV según permisos.

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

Los E2E usan un contrato API simulado y cubren landing, autenticación, protección de rutas, permisos, navegación por módulos y viewport móvil. El backend se valida por separado con sus pruebas y un smoke test contra PostgreSQL.
