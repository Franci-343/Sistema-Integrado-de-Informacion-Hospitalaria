# 02 - Alcance, modulos y limites

## Areas que debe integrar el SIIH

- Recepcion y admision.
- Consulta externa.
- Emergencias y triaje.
- Hospitalizacion y enfermeria.
- Laboratorio clinico.
- Farmacia.
- Inventarios, compras y almacenes.
- Caja y facturacion.
- Administracion.
- Direccion y reportes.
- Tecnologia y soporte.
- Portal/PWA del paciente en una entrega posterior.

## Modulos funcionales

| Modulo | Responsabilidad principal | Prioridad global |
|---|---|---|
| Seguridad e identidad | Usuarios, roles, permisos, sesiones, bloqueo y auditoria | Obligatorio |
| Pacientes y admision | Ficha unica, busqueda, actualizacion, llegada y derivacion | Obligatorio |
| Citas y agendas | Disponibilidad, programacion, cancelacion, reprogramacion y recordatorios | Obligatorio |
| Historia clinica y consulta | Antecedentes, signos vitales, diagnostico, tratamiento, evolucion y cierre | Obligatorio |
| Emergencias y hospitalizacion | Triaje, prioridad, ingreso, camas, seguimiento, enfermeria y alta | Obligatorio en alcance total; detalle pendiente |
| Laboratorio | Ordenes, muestras, estados, resultados, validacion y publicacion | Obligatorio |
| Receta y farmacia | Emision, validacion, dispensacion total/parcial y trazabilidad | Obligatorio |
| Inventario | Stock, lotes, vencimientos, movimientos, alertas y ajustes | Obligatorio |
| Compras y abastecimiento | Proveedores, ordenes, recepcion y reposicion | Importante |
| Facturacion y caja | Servicios, cargos, pagos, comprobantes y correcciones | Obligatorio |
| Reportes y BI operacional | Reportes clinicos/administrativos, KPIs, filtros y exportacion | Importante |
| Notificaciones | Recordatorios de citas y avisos autorizados | Importante |
| Portal/PWA de pacientes | Consulta de citas, recetas, resultados y notificaciones autorizadas | Deseable / MVP 3 |
| Gestion documental | Adjuntos y documentos con acceso controlado | Derivado de la arquitectura |
| Interoperabilidad | OpenAPI y futura integracion HL7 FHIR | Futuro preparado |

## Informacion critica por area

- Admision: identidad, contacto y numero unico de paciente.
- Consulta: historia, diagnosticos, evolucion, tratamientos y recetas.
- Emergencias: triaje, prioridad, signos vitales e ingreso.
- Hospitalizacion: cama, notas de evolucion, indicaciones y alta.
- Laboratorio: orden, muestra, resultado, observaciones y validacion.
- Farmacia: receta, lote, stock, vencimiento, kardex y movimientos.
- Caja: servicios, factura, pago, comprobante y correcciones.
- Direccion: demanda, tiempos, productividad, ingresos, costos e inventario.

## Fuera de alcance del MVP inicial

- Microservicios distribuidos.
- Aplicacion movil nativa.
- Inteligencia artificial y modelos predictivos.
- Telemedicina.
- Integracion con dispositivos medicos.
- Analitica avanzada y Data Warehouse completo.
- Migracion a nube como requisito obligatorio.
- Integraciones FHIR productivas sin convenio y alcance definidos.

## Limites no definidos en los documentos

- Normativa clinica y legal aplicable.
- Reglas fiscales bolivianas y formato oficial de facturacion.
- Catalogos medicos oficiales (diagnosticos, procedimientos, medicamentos).
- Politica exacta de retencion de historias clinicas.
- Alcance de seguros, convenios, internacion, cirugia y banco de sangre.
- Operacion offline y sincronizacion.

**Origen documental:** V0.0.6, alcance de levantamiento y clasificacion; informe integrado, servicios, sistemas empresariales y arquitectura.
