# 09 - Modelo de dominio y datos

## Principio central

La ficha de `Paciente` es unica. `HistoriaClinica` concentra la continuidad clinica. `Consulta` es el agregado principal de la atencion y se relaciona con ordenes, recetas, resultados, facturacion y usuarios responsables.

## Entidades explicitas en los documentos

| Entidad | Campos minimos propuestos | Relaciones |
|---|---|---|
| Paciente | id UUID, documento, nombres, apellidos, fechaNacimiento, contacto, estado | 1 historia; muchas citas/consultas/facturas |
| HistoriaClinica | id UUID, pacienteId, antecedentes, alergias | pertenece a paciente; contiene consultas |
| Cita | id UUID, pacienteId, medicoId, especialidadId, fechaHoraInicio/fin, estado, motivoCancelacion | paciente, profesional, agenda |
| Consulta | id UUID, pacienteId, medicoId, cita/ingresoId, motivo, diagnostico, tratamiento, evolucion, estado | historia, ordenes, recetas, cargos |
| OrdenLaboratorio | id UUID, consultaId, pacienteId, solicitanteId, examen, estado, fecha | consulta; resultados |
| Receta | id UUID, consultaId, pacienteId, medicoId, fecha, estado | items; dispensaciones |
| Medicamento | id UUID, nombre, presentacion, estado | lotes, stock, items de receta |
| Factura | id UUID, pacienteId, estado, total, metodoPago | items, pagos, servicios |
| Usuario | id UUID, username, estado | roles, auditoria, acciones clinicas |
| Rol | id UUID, nombre | permisos y usuarios |

## Entidades derivadas de requisitos explicitos

| Entidad | Proposito | Estado |
|---|---|---|
| Persona/Contacto | Separar identidad y medios de contacto si el modelo lo requiere | Derivado |
| Profesional/Medico | Datos del profesional, especialidad y estado | Derivado |
| Especialidad | Catalogo para agenda y reportes | Derivado |
| Agenda/HorarioMedico | Disponibilidad y reglas de citas | Derivado |
| SignosVitales/Triaje | Mediciones, prioridad, fecha y autor | Derivado |
| Diagnostico | Uno o varios diagnosticos por consulta; catalogo pendiente | Derivado |
| RecetaItem | Medicamento, dosis, via, frecuencia, duracion, cantidad, indicaciones | Derivado obligatorio |
| Dispensacion/DispensacionItem | Cantidad entregada, lote, fecha, farmaceutico | Derivado obligatorio |
| LoteMedicamento | codigo, vencimiento, costo, cantidad disponible | Derivado obligatorio |
| Stock/StockPorUbicacion | saldo por medicamento, lote y almacen | Derivado obligatorio |
| MovimientoInventario | tipo, cantidad, lote, origen/destino, motivo, usuario | Derivado obligatorio |
| AlertaInventario | stock minimo o vencimiento proximo | Derivado |
| ResultadoLaboratorio | ordenId, valores, unidad, referencia, observacion, estado, validador | Derivado obligatorio |
| MuestraLaboratorio | tipo, identificador, recepcion, rechazo y motivo | Derivado |
| Servicio/Prestacion | catalogo facturable de consulta, examen o procedimiento | Derivado |
| FacturaItem | referencia al servicio/producto, cantidad, precio y subtotal | Derivado obligatorio |
| Pago | facturaId, importe, metodo, estado, fecha, cajero | Derivado obligatorio |
| Hospitalizacion | paciente, ingreso, alta, estado y responsable | Derivado de alcance |
| Cama/Ubicacion | sala/cama y disponibilidad | Derivado de alcance |
| NotaEnfermeria | hospitalizacion/consulta, contenido, autor y fecha | Derivado de alcance |
| Proveedor | datos del proveedor | Derivado de compras |
| OrdenCompra/RecepcionCompra | items, cantidades, estados y recepcion de lotes | Derivado de compras |
| Notificacion | destinatario, canal, plantilla, estado y consentimiento | Derivado |
| AdjuntoDocumento | objeto, nombre, tipo, ubicacion S3/MinIO, hash y metadatos | Derivado de tecnologia |
| AuditoriaEvento | usuario, fecha, accion, entidad, idEntidad, origen, antes/despues seguro | Obligatorio |

## Relaciones e invariantes

- `Paciente 1 - 1 HistoriaClinica`.
- `Paciente 1 - N Cita`, `Consulta`, `Factura`, `Hospitalizacion`.
- `Consulta 1 - N OrdenLaboratorio` y `Receta`.
- `OrdenLaboratorio 1 - N ResultadoLaboratorio` segun tipo de examen; definir cardinalidad final.
- `Receta 1 - N RecetaItem`; cada item puede tener varias entregas parciales.
- `Medicamento 1 - N LoteMedicamento`; cada movimiento referencia lote cuando corresponda.
- `Factura 1 - N FacturaItem` y `1 - N Pago` si se permiten pagos parciales; decision pendiente.
- `Usuario N - M Rol`; `Rol N - M Permiso`.
- Toda entidad sensible genera `AuditoriaEvento` para operaciones definidas.

## Restricciones de base de datos recomendadas

- UUID como identificador interno.
- Indice unico para documento cuando el tipo de documento lo permita; la deduplicacion no debe depender solo de este indice.
- Restriccion/estrategia para impedir solapamiento de citas, complementada por transaccion de aplicacion.
- `CHECK cantidad >= 0` donde aplique; stock se controla mediante movimientos y bloqueo/concurrencia.
- Claves foraneas para conservar relaciones clinicas y financieras.
- Borrado logico o estados para entidades maestras; registros clinicos cerrados sin borrado fisico.
- Version optimista o bloqueo adecuado para evitar perdida de actualizaciones.
- Migraciones con Flyway.

## No es un esquema final

Los documentos no definen tipos exactos, catalogos oficiales, multi-sede, seguros, impuestos ni retencion. El modelo debe validarse antes de generar migraciones de produccion.

**Origen documental:** UML de clases del informe integrado; V0.0.6, formularios, documentos, requisitos y reglas.
