# Arquitectura del proyecto SIIH

## 1. Vision general

El proyecto **SIIH - Sistema Integrado de Informacion Hospitalaria** esta organizado como un **monorepo**. Esto significa que en un solo repositorio se mantienen juntos los componentes principales del sistema:

- `backend/`: API, seguridad, reglas de negocio, persistencia y base de datos.
- `frontend/`: aplicacion web usada por los roles del hospital.
- `docs/`: documentacion tecnica, auditorias, guiones y explicaciones del proyecto.

Aunque frontend y backend estan separados en carpetas distintas, el sistema completo se desarrolla y versiona como una sola unidad academica. Esta organizacion facilita que el equipo trabaje sobre una misma base de codigo y que la defensa pueda mostrar claramente la relacion entre interfaz, API y datos.

## 2. Tipo de arquitectura

La arquitectura puede describirse asi:

> El SIIH es un **monorepo con frontend y backend separados**, donde el backend funciona como un **monolito modular** y el frontend como una **SPA modular por vistas y roles**.

No es una arquitectura de microservicios, porque no existen varios servicios independientes desplegados por dominio. En cambio, hay una sola aplicacion backend Spring Boot que contiene modulos internos bien separados por paquete.

Tampoco es un monolito desordenado, porque el codigo del backend esta dividido por areas funcionales como pacientes, citas, historia clinica, hospitalizacion, laboratorio, farmacia, inventario, facturacion, administracion y seguridad.

## 3. Estructura del monorepo

Estructura principal:

```text
Sistema-Integrado-de-Informacion-Hospitalaria/
+-- backend/
+-- frontend/
+-- docs/
+-- Readme.md
+-- .gitignore
```

### `backend/`

Contiene la aplicacion del servidor. Expone la API REST, aplica seguridad, ejecuta reglas de negocio y se comunica con PostgreSQL.

### `frontend/`

Contiene la aplicacion web. Renderiza pantallas publicas, login, workspace interno, modulos operativos y administracion.

### `docs/`

Contiene documentos de apoyo del proyecto: requisitos, auditorias, guiones de defensa, flujos funcionales y documentacion arquitectonica.

## 4. Arquitectura de alto nivel

Flujo general:

```text
Usuario
  |
  v
Frontend React/Vite
  |
  | HTTP / JSON
  v
Backend Spring Boot
  |
  | JDBC / JPA / Flyway
  v
PostgreSQL en Docker
```

El usuario nunca interactua directamente con la base de datos. Toda accion del sistema pasa por el frontend, luego por la API del backend y finalmente por la capa de persistencia.

## 5. Backend: monolito modular

El backend esta implementado con **Java 21** y **Spring Boot 4.1.0**. Usa Spring MVC para exponer endpoints REST, Spring Security para autenticacion/autorizacion, JDBC/JPA para persistencia y Flyway para migraciones de base de datos.

Archivo de entrada:

```text
backend/src/main/java/com/SIIH/proye/BackendApplication.java
```

Dependencias principales observadas:

- Spring Boot Web MVC.
- Spring Boot Security.
- Spring Boot Validation.
- Spring Boot JDBC.
- Spring Boot Data JPA.
- Flyway.
- PostgreSQL Driver.

## 6. Organizacion interna del backend

La carpeta principal del codigo Java es:

```text
backend/src/main/java/com/SIIH/proye/
```

Dentro de ella, el sistema se organiza por modulos funcionales:

```text
com/SIIH/proye/
+-- administration/
+-- appointments/
+-- billing/
+-- clinical/
+-- common/
+-- hospitalization/
+-- inventory/
+-- laboratory/
+-- notifications/
+-- operations/
+-- patients/
+-- pharmacy/
+-- security/
```

Esta estructura es la razon por la que se puede llamar **monolito modular**: todos los modulos viven dentro de la misma aplicacion backend, pero cada dominio tiene su propio paquete y responsabilidades.

## 7. Patron por modulo en backend

La mayoria de modulos del backend siguen una separacion similar:

```text
modulo/
+-- api/
+-- service/
+-- domain/
+-- repository/
```

No todos los modulos tienen exactamente las cuatro carpetas, porque algunos usan mas JDBC directo y otros usan repositorios JPA. Sin embargo, la idea general se mantiene.

### `api/`

Contiene controladores REST y modelos de entrada/salida.

Ejemplos:

- `PatientController`
- `AppointmentController`
- `AuthController`
- `BillingController`
- `LaboratoryController`
- `PharmacyController`
- `AdministrationController`

Responsabilidad:

- Recibir peticiones HTTP.
- Validar datos de entrada.
- Llamar a servicios.
- Devolver respuestas JSON.

### `service/`

Contiene reglas de negocio y coordinacion de operaciones.

Ejemplos:

- `PatientService`
- `AppointmentService`
- `AuthService`
- `BillingService`
- `ClinicalOperationsService`
- `AdministrationService`

Responsabilidad:

- Aplicar reglas del dominio.
- Controlar transacciones.
- Consultar o modificar datos.
- Registrar auditoria cuando corresponde.

### `domain/`

Contiene entidades y enumeraciones del dominio.

Ejemplos:

- `Patient`
- `Appointment`
- `Consultation`
- `CareEncounter`
- `Professional`
- `AppUser`

Responsabilidad:

- Representar conceptos persistentes del sistema.
- Mapear tablas o estados importantes.

### `repository/`

Contiene interfaces de acceso a datos cuando se usa JPA.

Ejemplos:

- `PatientRepository`
- `AppointmentRepository`
- `ProfessionalRepository`
- `ConsultationRepository`

Responsabilidad:

- Consultar y persistir entidades.
- Encapsular operaciones de acceso a datos basadas en repositorios.

## 8. Modulos funcionales del backend

### `security`

Gestiona autenticacion, sesiones, JWT, usuarios autenticados y configuracion de seguridad.

Incluye:

- Login.
- Registro academico.
- Refresh token.
- Logout.
- Usuario actual.
- Filtro JWT.
- Reglas de acceso por endpoint.

Endpoints principales:

- `/api/v1/auth/login`
- `/api/v1/auth/register`
- `/api/v1/auth/refresh`
- `/api/v1/auth/me`
- `/api/v1/auth/logout`

### `patients`

Gestiona pacientes e historia clinica basica.

Incluye:

- Registro de pacientes.
- Busqueda y paginacion.
- Verificacion de duplicados.
- Consulta y actualizacion de historia clinica.

### `appointments`

Gestiona agenda hospitalaria.

Incluye:

- Especialidades.
- Profesionales.
- Citas.
- Cancelacion o cambio de estado.

### `clinical`

Gestiona consultas y encuentros de atencion.

Incluye:

- Consultas medicas.
- Relacion con paciente y cita.
- Evolucion clinica.
- Cierre de consulta.

### `hospitalization`

Gestiona triaje, ordenes de internacion, camas, hospitalizaciones, notas de enfermeria y altas.

Este modulo concentra parte de la operacion clinica hospitalaria.

### `laboratory`

Gestiona laboratorio clinico.

Incluye:

- Catalogo de pruebas.
- Ordenes de laboratorio.
- Recepcion de muestras.
- Resultados.
- Validacion y publicacion.

### `pharmacy`

Gestiona recetas y dispensacion.

Incluye:

- Prescripciones.
- Entrega de medicamentos.
- Relacion con paciente y consulta.

### `inventory`

Gestiona inventario de medicamentos.

Incluye:

- Medicamentos.
- Ubicaciones.
- Lotes.
- Movimientos de stock.

### `billing`

Gestiona facturacion y pagos.

Incluye:

- Servicios facturables.
- Cargos.
- Facturas.
- Emision de facturas.
- Pagos.

### `administration`

Gestiona administracion del sistema.

Incluye:

- Usuarios.
- Roles.
- Permisos.
- Profesionales.
- Auditoria.

### `operations`

Expone vistas resumidas para modulos operativos.

Incluye endpoints tipo `overview` para:

- Laboratorio.
- Farmacia.
- Inventario.
- Facturacion.
- Reportes.
- Administracion.

### `notifications`

Gestiona notificaciones visibles para el usuario en el frontend.

### `common`

Contiene utilidades y componentes compartidos.

Incluye:

- Manejo de errores.
- Respuestas paginadas.
- Auditoria.
- Generacion de codigos.
- Configuracion web.

## 9. Seguridad y autorizacion

El backend usa Spring Security.

La seguridad se basa en:

- Autenticacion con usuario y contrasena.
- Emision de token JWT.
- Refresh token almacenado como hash.
- Roles y permisos.
- Restricciones por endpoint.

El usuario inicia sesion desde el frontend. El backend valida credenciales y devuelve:

- Access token.
- Refresh token.
- Datos del usuario.
- Rol.
- Permisos.

Luego el frontend usa esos permisos para mostrar u ocultar modulos, y el backend vuelve a validar permisos en cada endpoint protegido.

Esto es importante:

> El frontend ayuda a mejorar la experiencia visual, pero la seguridad real se aplica en el backend.

## 10. Base de datos

La base de datos es **PostgreSQL** y se levanta con Docker.

Archivo principal:

```text
backend/docker-compose.yml
```

Servicio principal:

```text
postgres:
  image: postgres:16-alpine
  container_name: siih-postgres
```

Valores por defecto:

- Base de datos: `siih`
- Usuario: `siih_app`
- Puerto: `5432`

La contrasena por defecto se define en el `docker-compose.yml` mediante variable de entorno.

## 11. Esquema y migraciones

El proyecto tiene dos mecanismos relacionados con la base:

### Esquema inicial

```text
backend/database/db.sql
```

Este archivo contiene la estructura inicial y datos semilla cuando PostgreSQL se inicia desde cero con Docker.

### Migraciones Flyway

```text
backend/src/main/resources/db/migration/
```

Migraciones existentes:

```text
V2__security_sessions_and_operational_seed.sql
V3__billing_idempotency.sql
V4__notification_read_state.sql
V5__fix_demo_passwords.sql
V6__hospitalization_document_alignment.sql
V7__appointment_derived_status_length.sql
```

Flyway permite evolucionar la base de datos sin recrearla manualmente.

## 12. Frontend: SPA modular

El frontend esta implementado con:

- React.
- TypeScript.
- Vite.
- React Router.
- Lucide React para iconos.

Archivo de entrada:

```text
frontend/src/main.tsx
```

Archivo principal de rutas:

```text
frontend/src/App.tsx
```

Rutas principales:

```text
/                 -> Landing publica
/acceso           -> Login
/app              -> Redireccion a /app/inicio
/app/:view        -> Workspace protegido
```

El frontend es una **Single Page Application** porque el navegador carga una aplicacion React y las vistas internas cambian mediante enrutamiento del lado cliente.

## 13. Organizacion interna del frontend

Estructura principal observada:

```text
frontend/src/
+-- App.tsx
+-- Workspace.tsx
+-- api.ts
+-- auth/
+-- public/
+-- AdministrationView.tsx
+-- ClinicalOperationsView.tsx
+-- OperationalView.tsx
+-- OperationalActions.tsx
+-- App.css
+-- index.css
```

### `App.tsx`

Define las rutas principales y envuelve la aplicacion con `AuthProvider`.

### `auth/`

Gestiona autenticacion y permisos del lado frontend.

Incluye:

- `AuthContext.tsx`
- `auth-context.ts`
- `ProtectedRoute.tsx`
- `permissions.ts`
- `session.ts`

Responsabilidad:

- Guardar sesion.
- Exponer usuario actual.
- Validar si el usuario tiene permisos.
- Proteger rutas internas.

### `api.ts`

Centraliza las llamadas HTTP al backend.

Responsabilidad:

- Definir tipos TypeScript usados por el frontend.
- Armar requests.
- Adjuntar token.
- Consumir endpoints REST.
- Manejar errores de API.

### `public/`

Contiene pantallas publicas:

- Landing page.
- Login.
- Estilos publicos.

### `Workspace.tsx`

Es el contenedor principal del sistema interno.

Responsabilidad:

- Mostrar menu lateral.
- Decidir que modulos se ven segun permisos.
- Cargar datos globales.
- Renderizar la vista activa.
- Manejar notificaciones visuales.

### `ClinicalOperationsView.tsx`

Agrupa vistas clinico-operativas:

- Triaje.
- Hospitalizacion.

### `OperationalView.tsx`

Muestra vistas de consulta o resumen para:

- Laboratorio.
- Farmacia.
- Inventario.
- Facturacion.
- Reportes.
- Administracion.

### `OperationalActions.tsx`

Contiene acciones operativas mediante formularios y modales.

Ejemplos:

- Crear orden de laboratorio.
- Emitir receta.
- Registrar cargo.
- Crear factura.
- Registrar pago.
- Gestionar movimientos de inventario.

### `AdministrationView.tsx`

Contiene la consola administrativa:

- Usuarios.
- Profesionales.
- Roles y permisos.
- Auditoria.

## 14. Relacion entre frontend y backend

La comunicacion se realiza mediante HTTP y JSON.

Ejemplo conceptual:

```text
LoginPage.tsx
  -> api.login()
    -> POST /api/v1/auth/login
      -> AuthController
        -> AuthService
          -> app_user / user_role / auth_session
```

Otro ejemplo:

```text
OperationalActions.tsx
  -> api.createInvoice()
    -> POST /api/v1/invoices
      -> BillingController
        -> BillingService
          -> invoice / invoice_item / charge
```

El frontend no accede directamente a PostgreSQL. Siempre pasa por el backend.

## 15. Control de acceso por roles

El control de acceso ocurre en dos niveles.

### En frontend

El frontend usa los permisos del usuario para:

- Mostrar u ocultar modulos del menu.
- Mostrar u ocultar botones de accion.
- Redirigir a inicio si el usuario intenta entrar a una vista no permitida.

### En backend

El backend usa Spring Security para:

- Exigir token JWT.
- Validar permisos por endpoint.
- Bloquear operaciones no autorizadas aunque alguien intente llamar la API manualmente.

Esta doble capa es importante porque:

> La interfaz guia al usuario, pero el backend protege los datos.

## 16. Flujo de datos tipico

Flujo general de una accion:

```text
Usuario hace clic en el frontend
  -> componente React valida datos
  -> api.ts envia request HTTP
  -> controller recibe request
  -> service ejecuta regla de negocio
  -> repository/JdbcTemplate consulta o modifica PostgreSQL
  -> service devuelve modelo de respuesta
  -> controller responde JSON
  -> frontend actualiza tabla, formulario o notificacion
```

## 17. Ejemplo de modulo: facturacion

Facturacion muestra bien la arquitectura porque cruza frontend, backend y base de datos.

### Frontend

Archivos principales:

```text
frontend/src/OperationalView.tsx
frontend/src/OperationalActions.tsx
frontend/src/api.ts
```

Responsabilidad:

- Mostrar resumen de cargos, facturas y pagos.
- Registrar cargo.
- Crear factura.
- Emitir factura.
- Cobrar factura.

### Backend

Archivos principales:

```text
backend/src/main/java/com/SIIH/proye/billing/api/BillingController.java
backend/src/main/java/com/SIIH/proye/billing/api/BillingModels.java
backend/src/main/java/com/SIIH/proye/billing/service/BillingService.java
```

Responsabilidad:

- Exponer endpoints de facturacion.
- Validar solicitudes.
- Crear cargos.
- Crear facturas.
- Emitir facturas.
- Registrar pagos.
- Calcular saldos.

### Base de datos

Tablas relacionadas:

- `service_catalog`
- `charge`
- `invoice`
- `invoice_item`
- `payment`

Flujo:

```text
Cargo pendiente
  -> Factura en borrador
    -> Factura emitida
      -> Pago parcial o total
```

## 18. Despliegue y ejecucion local

El backend tiene soporte Docker para levantar PostgreSQL.

Archivo:

```text
backend/docker-compose.yml
```

Comando habitual desde `backend/`:

```bash
docker compose up -d postgres
```

El backend puede ejecutarse como aplicacion Spring Boot usando Maven Wrapper:

```bash
./mvnw spring-boot:run
```

En Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

El frontend se ejecuta con Vite:

```bash
npm run dev
```

## 19. Por que se considera monolito modular

Se considera **monolito** porque:

- Hay una sola aplicacion backend.
- Los modulos no se despliegan como servicios independientes.
- Comparten la misma base de datos.
- Comparten configuracion de seguridad y transacciones.

Se considera **modular** porque:

- El codigo esta separado por dominios.
- Cada modulo tiene controladores, servicios y modelos propios.
- Las responsabilidades estan divididas por area hospitalaria.
- Los paquetes reflejan procesos reales del hospital.

Por eso la descripcion mas adecuada es:

> Monorepo con frontend React y backend Spring Boot; backend monolitico modular organizado por dominios hospitalarios.

## 20. Ventajas para un proyecto academico

Esta arquitectura es adecuada para el proyecto porque:

- Es mas simple de ejecutar que una arquitectura de microservicios.
- Permite demostrar integracion completa entre frontend, backend y base de datos.
- Mantiene separacion clara por modulos.
- Facilita explicar roles, permisos y flujos hospitalarios.
- Reduce complejidad de despliegue.
- Permite evolucionar el sistema agregando modulos internos.

## 21. Limitaciones y posible evolucion

Limitaciones actuales:

- Backend y modulos comparten una misma base de datos.
- No hay separacion fisica por servicios.
- La escalabilidad es la de una aplicacion monolitica.
- El frontend concentra muchas vistas en pocos archivos grandes.

Posibles mejoras futuras:

- Separar componentes frontend por modulo y subcarpetas.
- Agregar pruebas especificas por modulo.
- Documentar contratos OpenAPI.
- Introducir capas DTO mas uniformes.
- Separar reportes o notificaciones si crecieran demasiado.
- Mantener el monolito modular mientras el dominio siga siendo manejable.

## 22. Resumen para defensa

Frase sugerida:

> El SIIH esta organizado como un monorepo con dos aplicaciones principales: frontend y backend. El backend es un monolito modular en Spring Boot, dividido por dominios hospitalarios como pacientes, citas, historia clinica, hospitalizacion, laboratorio, farmacia, facturacion y administracion. El frontend es una SPA en React que consume la API REST y muestra modulos segun los permisos del usuario. La base de datos es PostgreSQL en Docker y evoluciona mediante esquema inicial y migraciones Flyway.
