# Docker local del backend

Esta configuracion levanta PostgreSQL en Docker y conserva la base de datos en el volumen nombrado `siih_postgres_data`.

## Levantar solo PostgreSQL

Desde la carpeta `backend`:

```bash
lan de Implementación: Frontend Realista para SIIH
🔍 Análisis del Estado Actual
✅ Funcionalidades Conectadas al Backend
Módulo	Estado
Pacientes (CRUD)	✅ Conectado
Citas (crear, cancelar, llegada)	✅ Conectado
Historia Clínica	✅ Conectado
Consultas	✅ Conectado
Laboratorio (overview)	✅ Conectado
Farmacia (overview)	✅ Conectado
Inventario (overview)	✅ Conectado
Facturación (overview)	✅ Conectado
Reportes (overview)	✅ Conectado
Administración (overview)	✅ Conectado
❌ Funcionalidades Mock/Pendientes
Elemento	Problema
Login/Autenticación	No existe - usuario hardcodeado "Andrea Suárez"
Control de Sesión	No hay logout, token, ni expiración
Roles y Permisos	No hay RBAC - todos ven todo
Usuario en Header	Hardcodeado, no dinámico
Notificaciones	Solo toast mock, no hay backend
Gráficos Dashboard	Datos estáticos mock
"Exportar" buttons	Solo muestran toast
"Filtros avanzados"	Solo muestran toast
Triaje/Signos Vitales	No implementado en frontend
Hospitalización	No implementado en frontend
Órdenes de Laboratorio	Solo overview, no CRUD
Dispensación Farmacia	Solo overview, no CRUD
Facturación CRUD	Solo overview, no CRUD
🏗️ Arquitectura Propuesta
Nueva Estructura de Archivos Frontend
Copy
frontend/src/
├── app/
│   ├── App.tsx                    # App shell con rutas protegidas
│   ├── AuthProvider.tsx           # Context de autenticación
│   └── Router.tsx                 # Rutas y guards
├── features/
│   ├── auth/
│   │   ├── LoginPage.tsx          # Pantalla de login
│   │   ├── LoginForm.tsx          # Formulario de login
│   │   ├── useAuth.ts             # Hook de autenticación
│   │   └── authApi.ts             # Llamadas a /auth
│   ├── dashboard/
│   │   ├── DashboardPage.tsx      # Dashboard con datos reales
│   │   ├── MetricCard.tsx
│   │   └── ActivityChart.tsx       # Gráfico con datos reales
│   ├── patients/
│   │   └── (existente)
│   ├── appointments/
│   │   └── (existente)
│   ├── clinical/
│   │   ├── ClinicalHistoryView.tsx
│   │   ├── ConsultationForm.tsx
│   │   └── TriageForm.tsx         # NUEVO
│   ├── laboratory/
│   │   ├── LaboratoryOverview.tsx # (existente)
│   │   ├── LabOrderForm.tsx       # NUEVO
│   │   └── LabResultForm.tsx      # NUEVO
│   ├── pharmacy/
│   │   ├── PharmacyOverview.tsx   # (existente)
│   │   ├── PrescriptionDetail.tsx # NUEVO
│   │   └── DispensationForm.tsx   # NUEVO
│   ├── billing/
│   │   ├── BillingOverview.tsx    # (existente)
│   │   ├── InvoiceForm.tsx        # NUEVO
│   │   └── PaymentForm.tsx        # NUEVO
│   └── admin/
│       ├── UserManagement.tsx     # NUEVO
│       └── AuditLog.tsx           # NUEVO
├── shared/
│   ├── components/
│   │   ├── Layout.tsx             # Layout con header dinámico
│   │   ├── Header.tsx             # Header con usuario real
│   │   ├── Sidebar.tsx            # Sidebar con permisos
│   │   ├── ProtectedRoute.tsx     # Guard de rutas
│   │   └── PermissionGate.tsx     # Renderizado condicional
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePermissions.ts
│   │   └── useToast.ts
│   └── utils/
│       ├── storage.ts             # Token storage
│       └── permissions.ts         # Constantes de permisos
└── api/
    ├── api.ts                     # Cliente base con interceptores
    ├── authApi.ts                 # Endpoints de auth
    └── (demás APIs)
📝 Fases de Implementación
FASE 1: Autenticación y Sesión ⭐ Prioridad Crítica
#### Backend (ya existe parcialmente)
✅ Tabla app_user con usuarios demo
✅ Tabla role y user_role
❌ Endpoint /api/v1/auth/login
❌ Endpoint /api/v1/auth/logout
❌ Endpoint /api/v1/auth/me (usuario actual)
❌ Endpoint /api/v1/auth/refresh (renovar token)
#### Frontend a Crear
Archivo	Descripción
features/auth/LoginPage.tsx	Página completa de login
features/auth/LoginForm.tsx	Formulario con validación
features/auth/useAuth.ts	Hook de autenticación
app/AuthProvider.tsx	Context global de auth
shared/components/ProtectedRoute.tsx	Guard de rutas
shared/utils/storage.ts	Manejo de tokens
#### Funcionalidades
1. Pantalla de Login
Usuario y contraseña
Mensaje de error claro
"Recordar sesión" (opcional)
Logo del hospital
2. Gestión de Sesión
JWT almacenado en localStorage o sessionStorage
Interceptor para incluir token en cada request
Logout automático al expirar token
Botón de logout en header
3. Usuario Dinámico
Header muestra nombre real del usuario
Avatar con iniciales
Rol visible
Menú de usuario con opciones
FASE 2: Control de Acceso RBAC
#### Backend (ya existe)
✅ Tabla role con roles: RECEPTION, DOCTOR, NURSE, LAB_TECHNICIAN, PHARMACIST, CASHIER, DIRECTOR, SYSTEM_ADMIN
✅ Tabla permission con permisos
✅ Tabla role_permission
#### Frontend a Crear
Archivo	Descripción
shared/hooks/usePermissions.ts	Hook de permisos
shared/components/PermissionGate.tsx	Componente condicional
shared/utils/permissions.ts	Constantes de permisos
shared/components/Sidebar.tsx	Menú dinámico por rol
#### Matriz de Permisos Frontend
Módulo	RECEPTION	DOCTOR	NURSE	LAB	PHARMACY	CASHIER	DIRECTOR	ADMIN
Dashboard	✅	✅	✅	✅	✅	✅	✅	✅
Pacientes	✅ CRUD	✅ R	✅ R	✅ R	✅ R	✅ R	❌	✅ CRUD
Citas	✅ CRUD	✅ R	✅ R	❌	❌	❌	✅ R	✅ CRUD
Historia Clínica	✅ R limitado	✅ CRUD	✅ R	✅ R limitado	✅ R limitado	❌	❌	✅ R audit
Laboratorio	❌	✅ Ordenar	❌	✅ CRUD	❌	❌	✅ R	✅ R
Farmacia	❌	✅ R	❌	❌	✅ CRUD	❌	✅ R	✅ R
Inventario	❌	❌	❌	❌	✅ CRUD	❌	✅ R	✅ R
Facturación	❌	❌	❌	❌	❌	✅ CRUD	✅ R	✅ R
Reportes	✅ R operativo	✅ R clínico	✅ R operativo	✅ R operativo	✅ R operativo	✅ R financiero	✅ CRUD	✅ CRUD
Administración	❌	❌	❌	❌	❌	❌	❌	✅ CRUD
#### Implementación
Copy
// Ejemplo de uso
<PermissionGate permission="PATIENT_WRITE">
  <button>Registrar paciente</button>
</PermissionGate>

// En sidebar
{hasPermission('PATIENT_READ') && <NavItem label="Pacientes" />}
FASE 3: Dashboard con Datos Reales
#### Frontend a Modificar
Archivo	Cambio
features/dashboard/DashboardPage.tsx	Reemplazar datos mock
features/dashboard/ActivityChart.tsx	Gráfico con datos de /reports/overview
api.ts	Agregar endpoint getDashboardMetrics()
#### Métricas a Mostrar (desde backend)
Pacientes activos (ya disponible)
Citas del día (ya disponible)
Consultas completadas (ya disponible)
Órdenes de laboratorio pendientes (/reports/overview)
Recetas pendientes de dispensación (/pharmacy/overview)
Ingresos del día (/billing/overview)
Alertas de stock bajo (/inventory/overview)
FASE 4: Módulos Operativos CRUD
#### 4.1 Laboratorio - Crear Órdenes
Archivo	Descripción
features/laboratory/LabOrderForm.tsx	Formulario crear orden
features/laboratory/LabOrderDetail.tsx	Detalle de orden
features/laboratory/LabResultForm.tsx	Registrar resultado
Endpoints backend necesarios:
POST /api/v1/lab-orders (crear)
GET /api/v1/lab-orders/{id} (detalle)
PATCH /api/v1/lab-orders/{id}/status (cambiar estado)
POST /api/v1/lab-results (registrar resultado)
#### 4.2 Farmacia - Dispensación
Archivo	Descripción
features/pharmacy/PrescriptionDetail.tsx	Ver receta
features/pharmacy/DispensationForm.tsx	Dispensar medicamentos
Endpoints backend necesarios:
GET /api/v1/prescriptions/{id} (detalle)
POST /api/v1/dispensations (dispensar)
GET /api/v1/prescriptions?status=ISSUED (pendientes)
#### 4.3 Facturación - CRUD Completo
Archivo	Descripción
features/billing/InvoiceForm.tsx	Crear factura
features/billing/PaymentForm.tsx	Registrar pago
features/billing/InvoiceList.tsx	Lista de facturas
Endpoints backend necesarios:
POST /api/v1/invoices (crear)
GET /api/v1/invoices/{id} (detalle)
POST /api/v1/payments (registrar pago)
FASE 5: Triaje y Hospitalización
#### 5.1 Triaje
Archivo	Descripción
features/clinical/TriageForm.tsx	Registrar signos vitales
features/clinical/TriageHistory.tsx	Historial de triaje
Endpoints backend necesarios:
POST /api/v1/triage (registrar)
GET /api/v1/patients/{id}/triage (historial)
#### 5.2 Hospitalización
Archivo	Descripción
features/hospitalization/HospitalizationList.tsx	Lista de hospitalizados
features/hospitalization/AdmissionForm.tsx	Ingreso
features/hospitalization/DischargeForm.tsx	Alta
FASE 6: Administración
Archivo	Descripción
features/admin/UserList.tsx	Lista de usuarios
features/admin/UserForm.tsx	Crear/editar usuario
features/admin/RoleAssignment.tsx	Asignar roles
features/admin/AuditLog.tsx	Visor de auditoría
Endpoints backend necesarios:
GET /api/v1/users (listar)
POST /api/v1/users (crear)
PUT /api/v1/users/{id} (actualizar)
PATCH /api/v1/users/{id}/status (activar/bloquear)
GET /api/v1/audit-events (ya existe en overview)
📊 Resumen de Archivos a Crear/Modificar
Nuevos Archivos Frontend: ~25 archivos
Categoría	Cantidad
Auth	5 archivos
Dashboard	3 archivos
Laboratorio	3 archivos
Farmacia	2 archivos
Facturación	3 archivos
Triaje/Hospitalización	4 archivos
Administración	4 archivos
Shared/Utils	5 archivos
Archivos a Modificar: ~8 archivos
Archivo	Cambio
App.tsx	Integrar AuthProvider y Router
api.ts	Agregar interceptores de auth
OperationalView.tsx	Agregar acciones CRUD
App.css	Estilos para login y nuevos componentes
Nuevos Endpoints Backend: ~15 endpoints
Módulo	Endpoints
Auth	4 (login, logout, me, refresh)
Lab Orders	4
Prescriptions	2
Dispensations	1
Invoices	3
Triage	2
Users	4
🎯 Orden de Implementación Recomendado
Sprint 1 (Semana 1): Autenticación
1. ✅ Backend: Endpoint /auth/login
2. ✅ Frontend: LoginPage y AuthProvider
3. ✅ Frontend: ProtectedRoute y logout
4. ✅ Frontend: Header dinámico con usuario real
Sprint 2 (Semana 1-2): RBAC
1. ✅ Backend: Endpoint /auth/me con permisos
2. ✅ Frontend: usePermissions hook
3. ✅ Frontend: PermissionGate component
4. ✅ Frontend: Sidebar dinámico por rol
Sprint 3 (Semana 2): Dashboard Real
1. ✅ Frontend: Métricas desde /reports/overview
2. ✅ Frontend: Gráfico con datos reales
3. ✅ Frontend: Alertas de stock bajo
Sprint 4 (Semana 3): Laboratorio CRUD
1. ✅ Backend: Endpoints de lab-orders
2. ✅ Frontend: LabOrderForm
3. ✅ Frontend: LabResultForm
Sprint 5 (Semana 3): Farmacia CRUD
1. ✅ Backend: Endpoints de prescriptions/dispensations
2. ✅ Frontend: PrescriptionDetail
3. ✅ Frontend: DispensationForm
Sprint 6 (Semana 4): Facturación CRUD
1. ✅ Backend: Endpoints de invoices/payments
2. ✅ Frontend: InvoiceForm
3. ✅ Frontend: PaymentForm
Sprint 7 (Semana 4): Administración
1. ✅ Backend: Endpoints de users
2. ✅ Frontend: UserManagement
3. ✅ Frontend: AuditLog
⚠️ Riesgos y Consideraciones
Riesgo	Mitigación
JWT en localStorage es vulnerable a XSS	Usar httpOnly cookies en producción
Permisos en frontend son solo UI	Backend SIEMPRE valida permisos
Cambios en API pueden romper frontend	Usar tipos TypeScript compartidos
Complejidad de estados	Usar React Query o similar para cache
✅ Criterios de Aceptación
El frontend será considerado "realista" cuando:
1. ✅ Login funcional con usuarios de la base de datos
2. ✅ Logout y expiración de sesión
3. ✅ Usuario real en header (no hardcodeado)
4. ✅ Menú lateral según permisos del rol
5. ✅ Botones/acciones ocultos según permisos
6. ✅ Dashboard con métricas reales
7. ✅ Flujo completo: Login → Paciente → Cita → Consulta → Orden/Receta → Resultado/Dispensación → Factura
```

La aplicacion Spring puede conectarse con el perfil local:

```bash
SPRING_PROFILES_ACTIVE=local ./mvnw spring-boot:run
```

En PowerShell:

```powershell
$env:SPRING_PROFILES_ACTIVE="local"
.\mvnw.cmd spring-boot:run
```

## Levantar PostgreSQL y backend con Docker

```bash
docker compose --profile app up --build
```

## Configuracion

Los valores por defecto estan en `docker-compose.yml` y `application-local.properties`.
Si necesitas cambiarlos, copia `.env.example` a `.env` y edita ese archivo local.

## Cuidar los datos

Usa esto para detener los contenedores sin borrar la base:

```bash
docker compose down
```

No uses `docker compose down -v` salvo que quieras eliminar el volumen `siih_postgres_data` y perder la base de datos local.
