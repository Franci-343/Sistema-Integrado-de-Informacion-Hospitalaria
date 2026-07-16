# 07 - Historias de usuario y criterios de aceptacion

## HU-PAC-001 - Registro unico de pacientes

**Como** personal de admision, **quiero** registrar a un paciente una sola vez, **para** evitar duplicidad y agilizar futuras atenciones.

Criterios:

- Solicitar datos personales obligatorios.
- Buscar coincidencias antes de guardar.
- Asignar identificador unico.
- Actualizar datos sin crear otra ficha.
- Registrar usuario y fecha de creacion.

## HU-CIT-001 - Programacion sin conflictos

**Como** personal de admision, **quiero** consultar la disponibilidad de los medicos, **para** asignar citas sin conflictos.

Criterios:

- Mostrar horarios disponibles.
- Impedir dos citas para el mismo medico en el mismo intervalo.
- Permitir cancelar y reprogramar.
- Registrar motivo de cancelacion.
- Permitir generar notificacion al paciente.

## HU-CLI-001 - Consulta de historia clinica

**Como** medico, **quiero** consultar la historia clinica, **para** conocer antecedentes y decidir durante la atencion.

Criterios:

- Acceso solo a personal autorizado.
- Mostrar consultas, diagnosticos, tratamientos, recetas y resultados.
- Auditar la consulta de informacion.
- Impedir modificar registros clinicos cerrados sin flujo autorizado.

## HU-LAB-001 - Ordenes electronicas

**Como** tecnico de laboratorio, **quiero** recibir solicitudes electronicas, **para** reducir errores y procesarlas a tiempo.

Criterios:

- Asociar solicitud a paciente y consulta.
- Mostrar medico solicitante y examenes.
- Registrar estado de orden/muestra.
- Registrar y publicar resultados validados.
- Notificar a personal autorizado cuando esten disponibles.

## HU-FAR-001 - Dispensacion segura

**Como** farmaceutico, **quiero** consultar recetas vigentes y stock, **para** entregar medicamentos correctos y actualizar existencias.

Criterios:

- Receta vinculada al paciente y consulta.
- Mostrar medicamento, dosis, cantidad e indicaciones.
- Comprobar existencias.
- Descontar inventario al confirmar entrega.
- Registrar lote utilizado.
- Impedir lotes vencidos y stock negativo.

## HU-REP-001 - Indicadores para direccion

**Como** director, **quiero** consultar indicadores clinicos y administrativos, **para** planificar recursos y evaluar desempeño.

Criterios:

- Informacion consolidada y filtrable por periodo.
- Consultas por especialidad.
- Tiempos de atencion.
- Consumo de medicamentos.
- Ingresos y costos.
- Exportacion solo para usuarios autorizados.

## Historias derivadas de requisitos explicitos

### HU-CLI-002 - Registrar consulta

**Como** medico, **quiero** registrar motivo, evolucion, diagnostico y tratamiento, **para** mantener continuidad clinica.

Criterios: campos minimos; cierre firmado; auditoria; edicion posterior versionada.

### HU-ENF-001 - Triaje y signos vitales

**Como** enfermera, **quiero** registrar prioridad y signos vitales, **para** que el medico disponga de informacion actual.

Criterios: paciente/atencion identificados; unidades; fecha; autor; valores invalidos rechazados.

### HU-FAC-001 - Cobro integrado

**Como** cajero, **quiero** facturar servicios registrados, **para** evitar doble digitacion e inconsistencias.

Criterios: items provienen del flujo clinico; total calculado; pago y comprobante; anulacion auditada.

### HU-SEG-001 - Administracion de acceso

**Como** administrador, **quiero** asignar roles y revisar auditoria, **para** proteger la informacion y responder a incidentes.

Criterios: minimo privilegio; bloqueo; filtros de auditoria; toda modificacion de permisos auditada.

### HU-POR-001 - Portal del paciente

**Como** paciente, **quiero** consultar mis citas, recetas y resultados publicados, **para** dar seguimiento sin acudir al hospital.

Criterios: solo datos propios; resultados validados; consentimiento para notificaciones; sesion segura.

## Plantilla obligatoria para nuevas historias

```text
ID:
Titulo:
Como <rol>
Quiero <accion>
Para <beneficio>

Criterios de aceptacion:
- Dado ... cuando ... entonces ...

Reglas relacionadas:
Dependencias:
Excepciones:
Datos sensibles involucrados:
Pruebas esperadas:
Estado de validacion:
```

**Origen documental:** V0.0.6, ejemplos de historias de usuario; historias derivadas de RF y casos de uso del informe integrado.
