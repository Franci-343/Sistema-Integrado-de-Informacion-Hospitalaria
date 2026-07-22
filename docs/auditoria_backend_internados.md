# Auditoría Backend — Módulo de Hospitalización (Internados)

**Fecha:** 2026-07-21  
**Alcance:** `ClinicalOperationsService`, `ClinicalOperationsController`, `ClinicalOperationsModels`, esquema de base de datos (`db.sql`).  
**Referencia:** Requisitos extraídos de `docs/SIIH_v02_Control_Internados.pdf` (RF-13 a RF-16, RN-11 a RN-20, RNF-11).

---

## 1. Resumen Ejecutivo

El backend cuenta con una base funcional para hospitalización (admisión, alta, notas de enfermería, camas y triaje), pero presenta **gaps significativos** respecto a los requisitos del PDF. Los más críticos son:

1. **No vincula la internación con la consulta/emergencia de origen** (RF-13, RN-11, RN-15).
2. **No gestiona órdenes de internación** como paso previo a la admisión.
3. **Las notas de enfermería no capturan signos vitales** (RF-15).
4. **El alta no genera un resumen de egreso estructurado** (RF-16).
5. **No hay entidades JPA ni repositorios**; todo el módulo usa `JdbcTemplate` directamente.
6. **Faltan endpoints para transferencia, cancelación y filtrado por sala/servicio**.

---

## 2. Inventario de Componentes Existentes

| Componente | Ubicación real | Estado |
|---|---|---|
| Servicio de negocio | `ClinicalOperationsService.java` | ✅ Existe |
| Controlador REST | `ClinicalOperationsController.java` | ✅ Existe |
| DTOs / Request-Response | `ClinicalOperationsModels.java` | ✅ Existe (monolítico) |
| Entidades JPA | — | ❌ **No existen** |
| Repositorios JPA | — | ❌ **No existen** |
| Esquema de tablas | `database/db.sql` | ✅ Existe |

### 2.1 Endpoints existentes

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/v1/triage` | Listar triajes |
| GET | `/api/v1/triage/{id}` | Obtener triaje |
| POST | `/api/v1/triage` | Crear triaje |
| PUT | `/api/v1/triage/{id}` | Actualizar triaje |
| GET | `/api/v1/beds` | Listar camas (filtro por status opcional) |
| GET | `/api/v1/hospitalizations` | Listar internaciones (filtro patientId, status) |
| GET | `/api/v1/hospitalizations/{id}` | Obtener internación |
| POST | `/api/v1/hospitalizations` | **Admisión directa** |
| PUT | `/api/v1/hospitalizations/{id}/discharge` | Alta hospitalaria |
| POST | `/api/v1/hospitalizations/{id}/nursing-notes` | Agregar nota de enfermería |

---

## 3. Matriz de Requisitos vs. Implementación

### 3.1 Requisitos Funcionales

| Código | Requisito | Estado | Observación / Gap |
|---|---|---|---|
| **RF-13** | Internar paciente **desde consulta/emergencia** vinculada al mismo episodio clínico | ⚠️ **Parcial** | El endpoint `POST /hospitalizations` admite directamente sin exigir un `encounterId` o `consultationId` de origen. Crea un `care_encounter` nuevo de tipo `HOSPITALIZATION`, pero **no conserva el vínculo con la consulta/emergencia que originó la internación**. |
| **RF-14** | Gestionar disponibilidad de camas **por sala/servicio** en tiempo real | ⚠️ **Parcial** | Existe `GET /beds` y la tabla `bed_location`, pero **no hay campo "servicio" ni "sala"** (solo `room` y `bed`). No se puede filtrar por servicio médico. No hay endpoint para marcar una cama en mantenimiento. |
| **RF-15** | Registrar evolución de enfermería: **signos vitales, indicaciones y notas** | ❌ **Incompleto** | `NursingNoteRequest` solo tiene `note` (String). La tabla `nursing_note` solo almacena texto libre. **Faltan campos estructurados para signos vitales** (temperatura, PA, FC, FR, SO2, peso, talla) e **indicaciones médicas**. |
| **RF-16** | Registrar alta: cerrar internación, liberar cama y **generar resumen de egreso** | ⚠️ **Parcial** | `discharge()` libera la cama, cierra el encounter y cambia el estado a `DISCHARGED`. Sin embargo, `DischargeRequest` solo pide `dischargeInstructions`. **No hay estructura para resumen de egreso** (diagnóstico de egreso, tratamiento, tipo de alta, próximo control). |

### 3.2 Reglas de Negocio

| Código | Regla | Estado | Observación / Gap |
|---|---|---|---|
| **RN-11** | Internación solo desde consulta/emergencia activa con orden médica válida | ❌ **No implementada** | `admit()` no valida que exista una consulta o emergencia activa previa. No existe el concepto de "orden de internación". |
| **RN-12** | Creación de internación + reserva de cama en **misma transacción** | ✅ **Cumplida** | El método `admit()` tiene `@Transactional` e inserta `care_encounter`, `hospitalization` y actualiza `bed_location` dentro de la misma transacción. |
| **RN-13** | Una cama no puede asignarse a más de un paciente activo | ✅ **Cumplida** | Verificación en código (`bedStatus == 'AVAILABLE'`) + índice único `ux_active_bed_assignment` en BD. |
| **RN-14** | Cama ocupada o en mantenimiento no seleccionable | ⚠️ **Parcial** | El código rechaza si no es `AVAILABLE`, pero **no hay endpoint para cambiar una cama a `MAINTENANCE`**, ni campo que indique el servicio asociado. |
| **RN-15** | Al internar desde cita, la consulta original se conserva y vincula | ❌ **No implementada** | No hay campo en `hospitalization` ni en `care_encounter` que referencie la consulta/emergencia de origen. El `appointment_id` del encounter original no se propaga. |
| **RN-16** | Alta cierra internación, registra resumen y libera cama | ⚠️ **Parcial** | Libera cama y cierra encounter, pero **no registra un resumen de egreso estructurado** (solo `discharge_instructions`). |
| **RN-17** | Auditoría de operaciones sensibles | ✅ **Cumplida** | Se usa `AuditService.record()` en admisión, alta y notas de enfermería. |
| **RN-20** | Transiciones de estado válidas | ⚠️ **Parcial** | Solo se valida que no se haga discharge si ya está `DISCHARGED`. No hay máquina de estados completa (faltan validaciones para `TRANSFERRED`, `CANCELLED`). |

### 3.3 Requisitos No Funcionales

| Código | Requisito | Estado | Observación |
|---|---|---|---|
| **RNF-11** | Consistencia en tiempo real del censo de camas | ⚠️ **Parcial** | Uso de `SELECT ... FOR UPDATE` en `admit()` y `discharge()` previene condiciones de carrera a nivel de base de datos, pero **no hay mecanismo de notificación en tiempo real** (WebSocket / SSE) para que el frontend refleje cambios inmediatamente. |

---

## 4. Gaps Detallados

### 4.1 Endpoints Faltantes

| # | Endpoint sugerido | Propósito | Prioridad |
|---|---|---|---|
| 1 | `POST /api/v1/hospitalization-orders` | Crear orden de internación desde una consulta/emergencia (RF-13, RN-11). | Alta |
| 2 | `GET /api/v1/hospitalization-orders` | Listar órdenes pendientes / aprobadas. | Alta |
| 3 | `POST /api/v1/hospitalizations/{id}/transfer` | Transferir paciente a otra cama (estado `TRANSFERRED` en BD). | Media |
| 4 | `POST /api/v1/hospitalizations/{id}/cancel` | Cancelar una internación activa (estado `CANCELLED`). | Media |
| 5 | `PUT /api/v1/beds/{id}` | Cambiar estado de cama (ej. a `MAINTENANCE`, `INACTIVE`). | Media |
| 6 | `GET /api/v1/beds/by-service` | Listar camas filtradas por servicio / sala (requiere nuevo campo en BD). | Media |
| 7 | `GET /api/v1/hospitalizations/by-room` | Reporte de ocupación por sala/servicio. | Media |
| 8 | `POST /api/v1/hospitalizations/{id}/medical-orders` | Registrar indicaciones médicas durante la internación. | Alta |

### 4.2 Campos Incompletos en DTOs / Modelos

| DTO / Entidad | Campo faltante | Justificación |
|---|---|---|
| `HospitalizationCreateRequest` | `originEncounterId` o `consultationId` | Vincular internación con consulta/emergencia de origen (RN-11, RN-15). |
| `HospitalizationCreateRequest` | `hospitalizationOrderId` | Referenciar la orden de internación previa. |
| `NursingNoteRequest` | `temperatureC`, `systolicBp`, `diastolicBp`, `heartRate`, `respiratoryRate`, `oxygenSaturation`, `weightKg`, `heightCm` | Capturar signos vitales estructurados (RF-15). |
| `NursingNoteRequest` | `medicalOrderId` | Vincular la nota con una indicación médica específica. |
| `DischargeRequest` | `dischargeDiagnosis`, `dischargeType` (ALTA_MEDICA, ALTA_VOLUNTARIA, FUGA, DEFUNCION), `followUpPlan`, `medicationsOnDischarge` | Generar resumen de egreso estructurado (RF-16). |
| `HospitalizationResponse` | `originEncounterId`, `originConsultationCode`, `originAppointmentId` | Mostrar trazabilidad del episodio de origen. |
| `BedResponse` | `service` o `specialtyId`, `floor` | Permitir filtrado por servicio (RF-14). |

### 4.3 Campos Incompletos en Base de Datos

| Tabla | Campo faltante | Justificación |
|---|---|---|
| `hospitalization` | `origin_encounter_id` UUID | Referencia al encounter de consulta/emergencia que originó la internación (RN-15). |
| `hospitalization` | `hospitalization_order_id` UUID | Referencia a la orden de internación (RF-13). |
| `hospitalization` | `discharge_diagnosis` TEXT | Diagnóstico de egreso (RF-16). |
| `hospitalization` | `discharge_type` VARCHAR | Tipo de alta médica (RF-16). |
| `bed_location` | `service_code` o `specialty_id` UUID | Servicio o especialidad asignada a la sala (RF-14). |
| `bed_location` | `floor` VARCHAR | Piso / nivel para navegación y reportes. |
| `nursing_note` | Campos de signos vitales (mismos que triage) | Estructurar la captura de signos vitales (RF-15). |
| *(nueva)* | `hospitalization_medical_order` | Tabla para indicaciones médicas (medicamentos, dieta, reposo, etc.). |
| *(nueva)* | `hospitalization_order` | Tabla para órdenes de internación generadas desde consulta. |

### 4.4 Reglas de Negocio No Implementadas

| Regla | Impacto | Acción sugerida |
|---|---|---|
| **RN-11**: Validar consulta/emergencia activa previa | Se permite internar un paciente sin atención previa, rompiendo la trazabilidad clínica. | Agregar validación en `admit()` que exija `originEncounterId` y verifique que el encounter esté `OPEN` y sea de tipo `OUTPATIENT` o `EMERGENCY`. |
| **RN-15**: Vincular consulta original con hospitalización | Se pierde el vínculo entre la atención ambulatoria y la internación. | Agregar `origin_encounter_id` a `hospitalization` y poblarlo desde el encounter de origen. |
| **RN-16**: Resumen de egreso completo | El alta solo guarda instrucciones textuales; no hay diagnóstico de egreso ni tipo de alta. | Expandir `DischargeRequest` y la tabla `hospitalization` con campos de resumen de egreso. |
| **RN-20**: Transiciones de estado válidas | Estados `TRANSFERRED` y `CANCELLED` existen en BD pero no tienen lógica de negocio. | Implementar endpoints y validaciones de máquina de estados. |

---

## 5. Observaciones Arquitectónicas

1. **Ausencia de JPA / Hibernate**: El módulo usa `JdbcTemplate` directamente. Esto dificulta el mapeo objeto-relacional, las relaciones entre entidades (ej. `Hospitalization` → `Consultation`) y el mantenimiento a largo plazo. El contrato de la interfaz esperaba entidades JPA y repositorios.
2. **DTOs monolíticos**: Todos los DTOs están en una única clase `ClinicalOperationsModels`. A medida que crezca el módulo, conviene separarlos en archivos individuales (`HospitalizationDTO`, `AdmissionRequestDTO`, etc.).
3. **No hay capa de dominio**: No existen clases de dominio (`Hospitalization`, `Bed`, `NursingNote`) que encapsulen reglas de negocio; la lógica está directamente en el servicio con SQL nativo.
4. **Seguridad por endpoint**: El controlador no tiene anotaciones de autorización (ej. `@PreAuthorize`) para restringir quién puede internar, dar alta o registrar notas de enfermería.

---

## 6. Recomendaciones Priorizadas

| Prioridad | Acción | Requisitos cubiertos |
|---|---|---|
| **P0 — Alta** | Crear tabla y flujo de **órdenes de internación** (`hospitalization_order`) vinculadas a `consultation` / `care_encounter`. | RF-13, RN-11 |
| **P0 — Alta** | Agregar `origin_encounter_id` a `hospitalization` y validar en `admit()`. | RF-13, RN-15 |
| **P0 — Alta** | Expandir `nursing_note` y `NursingNoteRequest` con **signos vitales estructurados**. | RF-15 |
| **P0 — Alta** | Expandir `DischargeRequest` y `hospitalization` con **resumen de egreso** (diagnóstico, tipo de alta, plan de seguimiento). | RF-16 |
| **P1 — Media** | Agregar `service_code` / `specialty_id` a `bed_location` y endpoints de filtrado por servicio. | RF-14 |
| **P1 — Media** | Implementar endpoints de **transferencia** y **cancelación** de internación. | RN-20 |
| **P1 — Media** | Crear tabla de **indicaciones médicas** (`hospitalization_medical_order`) durante la internación. | RF-15 |
| **P2 — Baja** | Evaluar migración de `JdbcTemplate` a **JPA/Hibernate** con entidades y repositorios para hospitalización. | Deuda técnica |
| **P2 — Baja** | Agregar notificaciones en tiempo real (SSE/WebSocket) para cambios de estado de camas. | RNF-11 |

---

## 7. Conclusión

El backend tiene una **infraestructura base sólida** para hospitalización (transaccionalidad, auditoría, control de camas), pero **no cumple aún con los flujos clínicos completos** exigidos en el PDF:

- Falta el paso intermedio de **orden de internación** desde consulta/emergencia.
- Falta la **trazabilidad del episodio de origen**.
- Falta la **captura estructurada de signos vitales** en enfermería.
- Falta el **resumen de egreso estructurado**.
- Falta la **gestión por servicio/sala** de camas.

Se recomienda abordar los ítems **P0** en el siguiente sprint para alcanzar la funcionalidad mínima viable del módulo de internados.
