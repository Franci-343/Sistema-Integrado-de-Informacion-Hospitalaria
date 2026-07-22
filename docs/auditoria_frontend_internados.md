# Auditoría Frontend — Módulo de Hospitalización (Internados)

**Fecha:** 2026-07-21  
**Alcance:** `ClinicalOperationsView.tsx`, `Workspace.tsx`, `api.ts`, `auth/permissions.ts`.  
**Referencia:** Requisitos extraídos de `docs/SIIH_v02_Control_Internados.pdf` (RF-13 a RF-16, RN-11 a RN-20, RNF-11) y `docs/requisitos_modulo_internados.md`.

---

## 1. Resumen Ejecutivo

El frontend cuenta con una **interfaz básica funcional** para hospitalización (listado de internaciones, mapa de camas, admisión, notas de enfermería y alta), pero presenta **gaps significativos** respecto a los requisitos del PDF:

1. **No existe el flujo "internar desde consulta/emergencia"** (RF-13, RN-11, RN-15): la admisión es un formulario independiente sin vínculo a consulta previa.
2. **Las notas de enfermería no capturan signos vitales estructurados** (RF-15): solo permiten texto libre.
3. **El alta hospitalaria no genera un resumen de egreso estructurado** (RF-16): solo un campo de texto para "indicaciones de alta".
4. **No hay filtrado de camas por sala/servicio** (RF-14): el censo es plano.
5. **No hay vista de detalle de internación**, ni evolución médica, ni traslados, ni órdenes de internación.
6. **Los componentes `HospitalizationView` y `AdmissionForm` no existen como archivos separados**: todo está embebido en `ClinicalOperationsView.tsx`.

---

## 2. Inventario de Componentes Existentes

| Componente | Ubicación real | Estado |
|---|---|---|
| Vista de hospitalización | `ClinicalOperationsView.tsx` (modo `hospitalizacion`) | ✅ Existe |
| Listado de internaciones | `HospitalizationContent` (inline) | ✅ Existe |
| Mapa de camas | `HospitalizationContent` (inline) | ✅ Existe |
| Modal de admisión | `AdmissionModal` (inline) | ✅ Existe |
| Modal de nota de enfermería | `TextActionModal` (inline) | ✅ Existe |
| Modal de alta | `TextActionModal` (inline) | ✅ Existe |
| Componente `HospitalizationView` | — | ❌ **No existe** |
| Componente `AdmissionForm` | — | ❌ **No existe** |
| Vista de detalle de internación | — | ❌ **No existe** |
| Vista de órdenes de internación | — | ❌ **No existe** |
| Formulario de evolución médica | — | ❌ **No existe** |
| Formulario de traslado de cama | — | ❌ **No existe** |

### 2.1 Navegación y permisos

| Elemento | Estado | Detalle |
|---|---|---|
| Ítem "Hospitalización" en sidebar | ✅ | `ViewKey = 'hospitalizacion'`, icono `Hospital` |
| Permiso de lectura | ✅ | `HOSPITALIZATION_READ` |
| Permiso de escritura | ✅ | `HOSPITALIZATION_WRITE` |
| Roles con acceso | ✅ | `DOCTOR`, `NURSE` tienen read+write; `RECEPTION` no tiene acceso |

### 2.2 Endpoints consumidos (api.ts)

| Método | Endpoint | Uso en frontend |
|---|---|---|
| GET | `/api/v1/beds` | Cargar mapa de camas |
| GET | `/api/v1/hospitalizations` | Listar internaciones |
| POST | `/api/v1/hospitalizations` | Admisión directa (`admitPatient`) |
| PUT | `/api/v1/hospitalizations/{id}/discharge` | Alta (`dischargePatient`) |
| POST | `/api/v1/hospitalizations/{id}/nursing-notes` | Nota de enfermería (`addNursingNote`) |
| GET | `/api/v1/patients` | Selector de pacientes en admisión |
| GET | `/api/v1/professionals` | Selector de profesional responsable |

---

## 3. Matriz de Requisitos vs. Implementación Frontend

### 3.1 Requisitos Funcionales

| Código | Requerimiento | Estado | Observación / Gap |
|---|---|---|---|
| **RF-13** | Internar paciente **desde consulta/emergencia** vinculada al mismo episodio clínico | ❌ **No implementado** | El `AdmissionModal` permite seleccionar **cualquier paciente** del directorio. No exige ni muestra una consulta/emergencia activa previa. No hay campo para vincular `consultationId`, `encounterId` ni `appointmentId`. |
| **RF-14** | Gestionar disponibilidad de camas **por sala/servicio** en tiempo real | ⚠️ **Parcial** | El modal filtra camas por `status === 'AVAILABLE'`, pero **no hay filtros por sala, servicio, piso o tipo de cama**. El mapa de camas es una lista plana sin agrupación por sala. |
| **RF-15** | Registrar evolución de enfermería: **signos vitales, indicaciones y notas** | ❌ **Incompleto** | El modal de nota (`TextActionModal`) solo tiene un `<textarea>` para texto libre. **No hay campos estructurados** para temperatura, PA, FC, FR, SpO2, peso, talla ni indicaciones médicas. |
| **RF-16** | Registrar alta: cerrar internación, liberar cama y **generar resumen de egreso** | ⚠️ **Parcial** | El modal de alta (`TextActionModal`) solo pide "Indicaciones de alta" (texto libre). **No hay campos** para diagnóstico de egreso, tipo de alta (médica, voluntaria, fuga, defunción), plan de seguimiento ni medicación de egreso. |

### 3.2 Reglas de Negocio

| Código | Regla | Estado | Observación / Gap |
|---|---|---|---|
| **RN-11** | Internación solo desde consulta/emergencia activa con orden médica válida | ❌ **No implementada** | El frontend no valida origen previo. No hay paso de "orden de internación" en la UI. |
| **RN-12** | Creación de internación + reserva de cama en misma transacción | ✅ **Cumplida** | El frontend envía un solo payload al backend; la atomicidad es responsabilidad del servidor. |
| **RN-13** | Una cama no puede asignarse a más de un paciente activo | ✅ **Cumplida** | El frontend solo muestra camas `AVAILABLE` en el selector. |
| **RN-14** | Cama ocupada o en mantenimiento no seleccionable | ⚠️ **Parcial** | El filtro `AVAILABLE` evita selección, pero **no hay UI para marcar una cama en mantenimiento** ni visualización de camas en mantenimiento en el mapa. |
| **RN-15** | Al internar desde cita, la consulta original se conserva y vincula | ❌ **No implementada** | No se muestra ni se envía ningún identificador de consulta/emergencia de origen. |
| **RN-16** | Alta cierra internación, registra resumen y libera cama | ⚠️ **Parcial** | El frontend envía solo `dischargeInstructions`. No construye un resumen de egreso estructurado. |
| **RN-17** | Auditoría de operaciones sensibles | ✅ **Cumplida** | El backend registra auditoría; el frontend no interfiere. |
| **RN-20** | Transiciones de estado válidas | ⚠️ **Parcial** | Solo se habilitan botones de "Nota" y "Alta" si `status === 'ACTIVE'`. No hay acciones para `TRANSFERRED` ni `CANCELLED`. |

### 3.3 Requisitos No Funcionales

| Código | Requisito | Estado | Observación |
|---|---|---|---|
| **RNF-11** | Consistencia en tiempo real del censo de camas | ⚠️ **Parcial** | El frontend recarga datos con el botón "Actualizar", pero **no hay polling, SSE ni WebSocket** para reflejar cambios de ocupación en tiempo real sin intervención del usuario. |

---

## 4. Gaps Detallados

### 4.1 Vistas / Componentes Faltantes

| # | Componente sugerido | Propósito | Prioridad |
|---|---|---|---|
| 1 | `HospitalizationView.tsx` | Vista dedicada de hospitalización (separar de `ClinicalOperationsView`). | Media |
| 2 | `AdmissionForm.tsx` | Formulario de admisión con origen desde consulta/emergencia. | Alta |
| 3 | `HospitalizationDetailView.tsx` | Vista de detalle de una internación: datos del paciente, cama, profesional, notas de enfermería históricas, evoluciones médicas, indicaciones. | Alta |
| 4 | `NursingNoteForm.tsx` | Formulario estructurado de signos vitales (no solo texto libre). | Alta |
| 5 | `DischargeForm.tsx` | Formulario de alta con resumen de egreso estructurado (diagnóstico, tipo de alta, seguimiento). | Alta |
| 6 | `HospitalizationOrderView.tsx` | Vista para crear/listar órdenes de internación desde consulta. | Alta |
| 7 | `BedTransferModal.tsx` | Modal para trasladar paciente entre camas. | Media |
| 8 | `BedManagementView.tsx` | Gestión de camas: cambiar estado a mantenimiento, crear/editar camas, asignar servicio. | Media |
| 9 | `MedicalEvolutionForm.tsx` | Formulario de evolución médica (SOAP) durante la internación. | Media |
| 10 | `MedicalOrderForm.tsx` | Formulario de indicaciones médicas (medicamentos, dieta, reposo). | Media |

### 4.2 Campos Incompletos en Formularios / Tipos

| Formulario / Tipo | Campo faltante | Justificación |
|---|---|---|
| `AdmissionModal` | `originConsultationId` / `originEncounterId` | Vincular internación con consulta/emergencia de origen (RF-13, RN-15). |
| `AdmissionModal` | `hospitalizationOrderId` | Seleccionar una orden de internación previa aprobada (RN-11). |
| `AdmissionModal` | Filtro por `service` / `specialty` de cama | Permitir internar solo en camas del servicio indicado (RF-14). |
| `TextActionModal` (nota) | `temperatureC`, `systolicBp`, `diastolicBp`, `heartRate`, `respiratoryRate`, `oxygenSaturation`, `weightKg`, `heightCm` | Capturar signos vitales estructurados (RF-15). |
| `TextActionModal` (nota) | `medicalOrderId` | Vincular la nota con una indicación médica específica. |
| `TextActionModal` (alta) | `dischargeDiagnosis`, `dischargeType`, `followUpPlan`, `medicationsOnDischarge` | Generar resumen de egreso estructurado (RF-16). |
| `Hospitalization` (tipo TS) | `originEncounterId`, `originConsultationCode` | Mostrar trazabilidad del episodio de origen en el listado. |
| `Bed` (tipo TS) | `service`, `specialtyId`, `floor`, `bedType` | Permitir filtrado y agrupación por servicio (RF-14). |

### 4.3 Integración API Ausente

| # | Endpoint backend necesario | Uso frontend | Prioridad |
|---|---|---|---|
| 1 | `GET /api/v1/hospitalization-orders` | Listar órdenes pendientes para que el médico las ejecute. | Alta |
| 2 | `POST /api/v1/hospitalization-orders` | Crear orden de internación desde la vista de historia clínica/consulta. | Alta |
| 3 | `GET /api/v1/hospitalizations/{id}` | Cargar detalle completo de una internación (notas, evoluciones). | Alta |
| 4 | `POST /api/v1/hospitalizations/{id}/transfer` | Trasladar paciente a otra cama. | Media |
| 5 | `POST /api/v1/hospitalizations/{id}/cancel` | Cancelar una internación activa. | Media |
| 6 | `PUT /api/v1/beds/{id}` | Cambiar estado de cama (mantenimiento). | Media |
| 7 | `GET /api/v1/beds/by-service` | Cargar camas agrupadas por servicio/sala. | Media |
| 8 | `POST /api/v1/hospitalizations/{id}/medical-evolutions` | Registrar evolución médica. | Media |
| 9 | `POST /api/v1/hospitalizations/{id}/medical-orders` | Registrar indicaciones médicas. | Media |

### 4.4 Flujos de Usuario No Implementados

| Flujo | Estado | Descripción del gap |
|---|---|---|
| **Cita → Orden de internación → Admisión** | ❌ No existe | El médico no puede generar una orden de internación desde la consulta. La enfermería no puede ver órdenes pendientes y ejecutarlas. |
| **Registro de signos vitales periódicos** | ❌ No existe | La enfermería solo puede escribir notas de texto libre. No hay formulario rápido para PA, FC, FR, T°, SpO2. |
| **Evolución médica durante internación** | ❌ No existe | No hay formulario SOAP ni vinculación con la historia clínica. |
| **Traslado entre camas/salas** | ❌ No existe | No hay acción de "Transferir" en la tabla de internaciones. |
| **Cancelación de internación** | ❌ No existe | No hay botón ni modal para cancelar un ingreso antes del alta. |
| **Vista de censo por servicio** | ❌ No existe | El mapa de camas es una lista plana sin agrupación por sala, piso o servicio. |

---

## 5. Observaciones de UX / Arquitectura Frontend

1. **Componentes embebidos (inline)**: Toda la lógica de hospitalización vive dentro de `ClinicalOperationsView.tsx` (~500 líneas) junto con triaje. Esto dificulta el mantenimiento, las pruebas unitarias y la reutilización. El contrato de la interfaz esperaba `HospitalizationView` y `AdmissionForm` como componentes separados.
2. **No hay vista de detalle**: Al hacer clic en una internación del listado, no ocurre nada. No se puede ver el historial de notas de enfermería, evoluciones médicas ni datos completos del paciente internado.
3. **Notas de enfermería no se muestran**: Aunque el tipo `Hospitalization` incluye `nursingNotes: NursingNote[]`, el frontend **no renderiza estas notas** en ninguna parte de la UI.
4. **Sin indicadores de ocupación en tiempo real**: El mapa de camas no se actualiza automáticamente cuando otro usuario interna o da de alta a un paciente. Requiere recarga manual.
5. **Formularios genéricos**: `TextActionModal` se reutiliza para notas y alta, lo cual es conveniente pero limita la captura estructurada de datos clínicos.
6. **Sin validaciones de negocio en cliente**: El frontend no valida que el paciente seleccionado tenga una consulta previa, ni que la cama seleccionada pertenezca al servicio correcto.

---

## 6. Recomendaciones Priorizadas

| Prioridad | Acción | Requisitos cubiertos |
|---|---|---|
| **P0 — Alta** | Crear `HospitalizationOrderView` / flujo de **orden de internación** desde la vista de historia clínica/consulta. | RF-13, RN-11 |
| **P0 — Alta** | Modificar `AdmissionModal` para que reciba una `consultationId` / `encounterId` de origen y la envíe al backend. | RF-13, RN-15 |
| **P0 — Alta** | Reemplazar `TextActionModal` de notas por un **formulario estructurado de signos vitales** (`NursingNoteForm`). | RF-15 |
| **P0 — Alta** | Reemplazar `TextActionModal` de alta por un **formulario de resumen de egreso** (`DischargeForm`) con diagnóstico, tipo de alta y seguimiento. | RF-16 |
| **P0 — Alta** | Crear **vista de detalle de internación** (`HospitalizationDetailView`) que muestre notas históricas, evoluciones y datos del paciente. | UX general |
| **P1 — Media** | Extraer componentes de hospitalización a archivos separados (`HospitalizationView.tsx`, `AdmissionForm.tsx`). | Deuda técnica, mantenibilidad |
| **P1 — Media** | Agregar **filtros por servicio/sala** en el mapa de camas y en el selector de admisión. | RF-14 |
| **P1 — Media** | Implementar **traslado de cama** (`BedTransferModal`) y cancelación de internación. | RN-20 |
| **P1 — Media** | Mostrar **notas de enfermería históricas** en la vista de detalle. | RF-15 |
| **P2 — Baja** | Agregar **polling o SSE** para actualizar el censo de camas en tiempo real. | RNF-11 |
| **P2 — Baja** | Implementar formularios de **evolución médica** e **indicaciones médicas** durante la internación. | Flujo clínico completo |

---

## 7. Conclusión

El frontend tiene una **interfaz operativa mínima viable** para hospitalización (admitir, ver camas, notas textuales, alta), pero **no cumple con los flujos clínicos completos** exigidos en el PDF:

- Falta el paso intermedio de **orden de internación** desde consulta/emergencia.
- Falta la **trazabilidad visible del episodio de origen** en la UI.
- Falta la **captura estructurada de signos vitales** en enfermería.
- Falta el **resumen de egreso estructurado**.
- Falta la **gestión por servicio/sala** de camas.
- Falta una **vista de detalle** de la internación.
- Los componentes esperados (`HospitalizationView`, `AdmissionForm`) no existen como módulos separados.

Se recomienda abordar los ítems **P0** en el siguiente sprint para alcanzar la funcionalidad mínima viable del módulo de internados, alineándose con la auditoría del backend.
