# Requisitos Extraídos — Módulo de Control de Internados (Hospitalización)

> Fuente: `docs/SIIH_v02_Control_Internados.pdf` (versión 02 ampliada con módulo de Hospitalización)  
> Fecha de extracción: 2026-07-21  
> Proyecto: Sistema Integrado de Información Hospitalaria (SIIH) — Hospital Universitario San Andrés

---

## 1. Resumen del Módulo

El módulo de **Hospitalización** gestiona el ciclo completo del paciente internado: decisión clínica de internación, reserva de camas, ingreso, evolución médica y de enfermería, traslados entre camas/salas, y alta hospitalaria. Se integra con **Consulta Externa** y **Emergencias** mediante la transición automatizada `cita/emergencia → internación`.

**Prioridad:** MVP 3 (después de autenticación, pacientes, citas, historia clínica, laboratorio, farmacia e inventario).

---

## 2. Casos de Uso del Módulo

| Código | Caso de uso | Actor principal | Resultado y criterio de aceptación | Prioridad |
|--------|-------------|-----------------|------------------------------------|-----------|
| **UC-09** | **Internar paciente desde cita/emergencia** | Médico / Enfermería | Genera orden de internación desde la consulta o emergencia activa, reserva una cama disponible y vincula el episodio clínico; rechaza la operación si no hay camas libres en el servicio requerido. | Alta |
| **UC-10** | **Gestionar camas y altas** | Enfermería / Hospitalización | Actualiza el estado de la cama (libre/ocupada/mantenimiento), registra notas de evolución y procesa el alta liberando la cama. | Alta |

### Reglas de diseño de casos de uso (específicas del módulo)

| Regla | Descripción |
|-------|-------------|
| RN-CU-06 | La reserva de cama y la creación de la internación se ejecutan en una **sola transacción atómica** (UC-09), evitando que dos internaciones tomen la misma cama. |
| RN-CU-07 | Al internar desde una cita, el sistema conserva el vínculo con la consulta de origen; la cita no se elimina, solo cambia su estado a `derivada a internación`. |

---

## 3. Requerimientos Funcionales (RF)

| Código | Requerimiento | Descripción | Prioridad |
|--------|---------------|-------------|-----------|
| **RF-13** | Internar paciente desde consulta/emergencia | Permitir que el médico, durante una cita de consulta externa o una atención de emergencia, genere una orden de internación vinculada al mismo episodio clínico. | Alta |
| **RF-14** | Gestionar disponibilidad de camas | Consultar y reservar camas disponibles por sala/servicio en tiempo real al momento de internar. | Alta |
| **RF-15** | Registrar evolución de enfermería | Capturar signos vitales, indicaciones y notas de evolución durante la estancia del paciente internado. | Alta |
| **RF-16** | Registrar alta hospitalaria | Cerrar la internación, liberar la cama y generar el resumen de egreso del paciente. | Alta |

---

## 4. Requerimientos No Funcionales (RNF) Relevantes

| Código | Atributo | Criterio / descripción | Nivel |
|--------|----------|------------------------|-------|
| RNF-01 | Seguridad | Autenticación obligatoria, autorización por roles y bloqueo por intentos fallidos. | Crítico |
| RNF-02 | Confidencialidad | Protección de datos sensibles del paciente y control de acceso por perfil. | Crítico |
| RNF-03 | Auditoría | Registro de accesos, modificaciones, eliminaciones y acciones relevantes. | Alto |
| RNF-08 | Integridad | Validaciones para evitar duplicidad, datos incompletos, **camas asignadas dos veces** e inconsistencias. | Crítico |
| RNF-11 | Consistencia en tiempo real | El estado de ocupación de camas debe reflejarse de inmediato tras cada internación o alta, evitando doble asignación. | Crítico |

---

## 5. Reglas de Negocio Específicas

| Código | Regla de negocio |
|--------|------------------|
| **RN-11** | Una internación solo podrá registrarse desde una **consulta o atención de emergencia activa** y con una **orden médica válida**. |
| **RN-12** | La creación de la internación y la reserva de la cama deberán ejecutarse dentro de una **misma transacción**. Si una de las operaciones falla, ninguna deberá quedar confirmada. |
| **RN-13** | Una cama no podrá estar asignada simultáneamente a más de un paciente con internación activa. |
| **RN-14** | Una cama marcada como **ocupada** o **en mantenimiento** no podrá seleccionarse para una nueva internación. |
| **RN-15** | Al internar a un paciente desde una cita, la consulta original deberá **conservarse** y quedar **vinculada** con el episodio de hospitalización. |
| **RN-16** | El alta hospitalaria deberá **cerrar la internación**, registrar el **resumen de egreso** y **liberar automáticamente** la cama asignada. |
| **RN-17** | Toda operación sensible deberá registrar usuario, fecha, hora, acción realizada y entidad afectada. |
| **RN-18** | Cada usuario podrá acceder únicamente a las funciones y datos autorizados para su rol. |
| **RN-20** | Los estados de citas, órdenes, recetas, **camas** e **internaciones** deberán seguir **transiciones válidas** previamente definidas. |

---

## 6. Entidades del Dominio (Modelo de Datos)

Basado en el diagrama UML de clases (Figura 16) y la descripción del documento:

### 6.1 Entidades principales

| Entidad | Descripción | Atributos clave |
|---------|-------------|-----------------|
| **Internacion** | Episodio de hospitalización de un paciente. | id, pacienteId, consultaOrigenId (nullable), emergenciaOrigenId (nullable), camaId, fechaIngreso, fechaAlta, estado, diagnosticoIngreso, diagnosticoEgreso, resumenEgreso, medicoId, usuarioRegistro, fechaRegistro |
| **Cama** | Unidad física de hospitalización dentro de una sala. | id, numero, salaId, estado (`LIBRE`, `OCUPADA`, `MANTENIMIENTO`), tipo (general, UCI, pediátrica, etc.), fechaUltimoCambio |
| **Sala** | Agrupación de camas por servicio o especialidad. | id, nombre, servicio, piso, capacidadMaxima, activa |
| **NotaEnfermeria** | Registro de signos vitales y observaciones durante la internación. | id, internacionId, fechaHora, presionArterial, frecuenciaCardiaca, frecuenciaRespiratoria, temperatura, saturacionO2, glucemia, peso, observaciones, enfermeraId |
| **OrdenInternacion** | Documento médico que autoriza la internación. | id, consultaId (o emergenciaId), medicoId, fechaOrden, motivo, diagnosticoPresuntivo, servicioDestino, estado (`PENDIENTE`, `EJECUTADA`, `CANCELADA`) |
| **EvolucionMedica** | Nota médica de evolución durante la internación. | id, internacionId, fechaHora, subjetivo, objetivo, analisis, plan, medicoId |

### 6.2 Relaciones y cardinalidades

- **Paciente** 1 → N **Internacion**
- **Internacion** 1 → 1 **Cama** (durante la estancia activa)
- **Internacion** 1 → N **NotaEnfermeria**
- **Internacion** 1 → N **EvolucionMedica**
- **Sala** 1 → N **Cama**
- **Consulta** 1 → 0..1 **OrdenInternacion**
- **OrdenInternacion** 1 → 0..1 **Internacion**
- **Internacion** 0..1 → 1 **Consulta** (vínculo de origen, nullable si viene de emergencia)

---

## 7. Flujos de Proceso

### 7.1 Flujo de Ingreso (Internación desde Consulta/Emergencia)

```
1. El médico atiende una consulta (UC-03) o emergencia.
2. Durante la atención, el médico determina que el paciente requiere internación.
3. El sistema genera una Orden de Internación vinculada a la consulta/emergencia activa.
4. El médico (o enfermería) selecciona el servicio/sala destino.
5. El sistema consulta camas disponibles (`LIBRE`) en tiempo real.
6. Se selecciona una cama específica.
7. El sistema ejecuta en UNA TRANSACCIÓN ATÓMICA:
   a. Crear el registro de Internación (estado = `INGRESADO`).
   b. Actualizar la Cama a estado `OCUPADA`.
   c. Actualizar la cita/consulta origen a estado `DERIVADA_A_INTERNACION`.
   d. Actualizar la OrdenInternacion a estado `EJECUTADA`.
8. El paciente es trasladado físicamente a la cama asignada.
9. Enfermería registra el ingreso en la cama y comienza el seguimiento.
```

**Criterios de aceptación:**
- Si no hay camas libres en el servicio, la operación se rechaza con mensaje claro.
- Si la transacción falla en cualquier punto, NO queda registro parcial (rollback completo).
- La consulta original permanece accesible y vinculada.

### 7.2 Flujo de Egreso (Alta Hospitalaria)

```
1. El médico determina que el paciente puede recibir el alta.
2. El médico completa el resumen de egreso (diagnóstico egreso, indicaciones, próximos controles).
3. Enfermería/hospitalización procesa el alta en el sistema.
4. El sistema ejecuta:
   a. Cierra la Internación (estado = `ALTA`, fechaAlta = now).
   b. Libera la Cama (estado = `LIBRE`).
   c. Genera el resumen de egreso documentado.
   d. Notifica a caja/administración para facturación de servicios hospitalarios.
```

**Criterios de aceptación:**
- La cama queda disponible inmediatamente para nueva asignación.
- La internación queda en estado histórico, no editable.
- Se registra auditoría de quién dio el alta y cuándo.

### 7.3 Flujo de Traslado entre Camas/Salas

```
1. El médico o enfermería solicita traslado (ej. de UCI a sala general).
2. Se verifica disponibilidad de cama destino.
3. En UNA TRANSACCIÓN:
   a. Se libera la cama origen (estado = LIBRE).
   b. Se ocupa la cama destino (estado = OCUPADA).
   c. Se actualiza internacion.camaId.
4. Se registra nota de traslado con motivo y autorización.
```

**Regla:** El traslado solo puede hacerse entre camas del mismo tipo de servicio o con autorización médica explícita.

### 7.4 Flujo de Evolución Clínica (Médica)

```
1. El médico accede a la internación activa del paciente.
2. Registra nota de evolución médica (SOAP u otro formato).
3. El sistema guarda la evolución con:
   - Fecha/hora automática (o editable con validación).
   - Médico responsable.
   - Vínculo a la internación.
4. Las evoluciones son acumulativas y no se eliminan (versionado/anulación lógica).
```

### 7.5 Flujo de Evolución de Enfermería (Signos Vitales)

```
1. La enfermera accede a la internación desde la cama o terminal/tablet.
2. Registra signos vitales periódicos según protocolo:
   - Presión arterial, FC, FR, temperatura, SpO2, glucemia, peso.
3. Agrega observaciones y cumplimiento de indicaciones médicas.
4. El sistema muestra tendencias gráficas de signos vitales.
```

---

## 8. Estados y Transiciones Válidas

### 8.1 Estados de una Cama

```
LIBRE ──[internación]──► OCUPADA ──[alta]──► LIBRE
   │                         │
   │                         └──[traslado origen]──► LIBRE
   │
   └──[mantenimiento programado]──► MANTENIMIENTO ──[fin mantenimiento]──► LIBRE
```

**Restricciones:**
- Solo camas `LIBRE` pueden asignarse.
- No se puede pasar directamente `OCUPADA → MANTENIMIENTO` sin alta o traslado previo.

### 8.2 Estados de una Internación

```
INGRESADO ──[evolución]──► INGRESADO (ciclo)
   │
   ├──[alta médica]──► ALTA
   │
   ├──[traslado]──► INGRESADO (con cambio de cama)
   │
   └──[fallecimiento]──► DEFUNCION (variante de egreso)
```

### 8.3 Estados de una Orden de Internación

```
PENDIENTE ──[ejecución]──► EJECUTADA
   │
   └──[cancelación médica]──► CANCELADA
```

### 8.4 Estados de una Cita (afectados por internación)

```
PROGRAMADA ──[atención]──► ATENDIDA
   │
   └──[derivación a internación]──► DERIVADA_A_INTERNACION
```

---

## 9. Restricciones Técnicas y de Diseño

| Código | Restricción |
|--------|-------------|
| RES-01 | Aplicación web responsiva (incluye tablets para enfermería en salas). |
| RES-03 | Backend Java + Spring Boot. |
| RES-04 | Frontend React + TypeScript. |
| RES-05 | API REST sobre HTTPS. |
| RES-06 | Acceso a información clínica requiere autenticación y autorización RBAC. |
| RES-08 | Ejecutable mediante Docker. |
| RES-10 | No realiza diagnóstico médico automático ni sustituye decisiones del personal de salud. |
| RES-11 | Disponibilidad de funcionalidades depende del rol y área asignada al usuario. |

---

## 10. Indicadores Clave (KPIs) del Módulo

| Indicador | Meta con SIIH |
|-----------|---------------|
| Tiempo cita → internación | Menor a 10 minutos desde la orden médica. |
| Ocupación de camas | Censo en tiempo real por sala/servicio. |
| Tiempo de alta administrativa | Liberación inmediata de cama al procesar alta. |
| Trazabilidad de internación | 100% de internaciones vinculadas a consulta/emergencia de origen. |

---

## 11. Matriz de Trazabilidad (Requisito → Caso de Uso → Regla de Negocio)

| Requisito | Caso de Uso | Reglas de Negocio |
|-----------|-------------|-------------------|
| RF-13 | UC-09 | RN-11, RN-15 |
| RF-14 | UC-09, UC-10 | RN-12, RN-13, RN-14 |
| RF-15 | UC-10 | RN-17, RN-20 |
| RF-16 | UC-10 | RN-16, RN-20 |
| RNF-11 | UC-09, UC-10 | RN-12, RN-13 |

---

## 12. Puntos de Integración con otros Módulos

| Módulo origen/destino | Tipo de integración | Descripción |
|-----------------------|---------------------|-------------|
| **Consulta Externa** | Origen | La internación puede iniciarse desde una consulta atendida. Se conserva el vínculo. |
| **Emergencias** | Origen | La internación puede iniciarse desde una atención de emergencia. |
| **Historia Clínica** | Lectura/Escritura | Acceso a antecedentes del paciente; escritura de evoluciones médicas. |
| **Farmacia** | Lectura | Consulta de medicamentos administrados durante la internación. |
| **Laboratorio** | Lectura | Consulta de resultados de exámenes ordenados durante la internación. |
| **Facturación/Caja** | Destino | Al alta, se generan los servicios prestados para facturación. |
| **Reportes** | Destino | Datos de ocupación, tiempos de estadía, altas por servicio. |
| **Seguridad** | Transversal | Autenticación, autorización y auditoría de todas las operaciones. |

---

## 13. Pruebas Específicas del Módulo (del documento original)

- Verificar que una cama no pueda asignarse a dos internaciones activas.
- Confirmar que la creación de una internación y la reserva de cama se ejecuten de forma atómica.
- Comprobar que el alta hospitalaria libere la cama asignada.
- Verificar el registro de auditoría en operaciones sensibles.
- Evaluar comportamiento ante entradas inválidas, errores de red y operaciones concurrentes.
- Pruebas de extremo a extremo: internar paciente y reservar cama → registrar evolución de enfermería → procesar alta y comprobar liberación de cama.

---

## 14. Glosario de Términos del Módulo

| Término | Definición |
|---------|------------|
| **Internación** | Estancia de un paciente en el hospital con ocupación de cama y seguimiento clínico. |
| **Orden de internación** | Documento médico que autoriza y justifica la necesidad de hospitalizar a un paciente. |
| **Cama** | Unidad física individual dentro de una sala, susceptible de ser ocupada por un paciente. |
| **Sala** | Espacio físico que agrupa camas bajo un mismo servicio o especialidad clínica. |
| **Alta hospitalaria** | Cierre formal de la internación con liberación de cama y resumen de egreso. |
| **Evolución clínica** | Registro médico periódico del estado y tratamiento del paciente internado. |
| **Signos vitales** | Medidas fisiológicas básicas: PA, FC, FR, temperatura, SpO2, glucemia, peso. |
| **Censo de camas** | Estado actualizado de ocupación de todas las camas del hospital por servicio. |

---

*Documento generado como insumo para el diseño técnico, modelado de base de datos e implementación del backend/frontend del módulo de Hospitalización.*
