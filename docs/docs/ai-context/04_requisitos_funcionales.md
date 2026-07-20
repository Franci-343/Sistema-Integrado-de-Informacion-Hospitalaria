# 04 - Requisitos funcionales

## Criterio de normalizacion

Este catalogo combina la lista de 25 funciones de `V0.0.6` con los requisitos `RF-01` a `RF-12` del informe integrado. Los identificadores siguientes son los que debe usar el equipo en codigo, backlog y pruebas.

## Seguridad e identidad

| ID | Requisito | Prioridad | Criterio minimo |
|---|---|---|---|
| RF-SEG-001 | Autenticar a todo usuario antes de permitir operaciones protegidas. | Obligatorio | Credenciales validas crean una sesion/token; credenciales invalidas no conceden acceso. |
| RF-SEG-002 | Administrar usuarios, roles y permisos por area. | Obligatorio | Un administrador autorizado puede crear, activar, bloquear y asignar roles. |
| RF-SEG-003 | Aplicar bloqueo por intentos fallidos y MFA configurable para perfiles criticos. | Importante | El bloqueo y el segundo factor son configurables y auditados. |
| RF-SEG-004 | Consultar eventos de auditoria con filtros autorizados. | Obligatorio | Filtrar por usuario, fecha, entidad, accion y origen. |

## Pacientes y admision

| ID | Requisito | Prioridad | Criterio minimo |
|---|---|---|---|
| RF-PAC-001 | Registrar una ficha unica de paciente con identificador interno. | Obligatorio | Se guardan datos obligatorios, usuario y fecha de creacion. Equivale a RF-01. |
| RF-PAC-002 | Detectar posibles duplicados antes de crear una ficha. | Obligatorio | Comparar al menos documento, nombre completo y fecha de nacimiento; advertir y mostrar coincidencias. |
| RF-PAC-003 | Buscar pacientes por documento, nombre, codigo o fecha de nacimiento. | Obligatorio | Resultados paginados y sin demora operativa. Equivale a RF-02. |
| RF-PAC-004 | Actualizar datos demograficos sin crear otra ficha. | Obligatorio | Mantener trazabilidad del cambio. |
| RF-PAC-005 | Registrar llegada/admision del paciente para una cita o ingreso. | Obligatorio | Estado y hora de llegada quedan asociados a paciente y atencion. |

## Citas y agendas

| ID | Requisito | Prioridad | Criterio minimo |
|---|---|---|---|
| RF-CIT-001 | Consultar disponibilidad de medicos, especialidades y horarios. | Obligatorio | Mostrar solamente horarios habilitados. |
| RF-CIT-002 | Programar una cita para un paciente. | Obligatorio | No permitir solapamiento del medico; asociar paciente, medico, especialidad, fecha y hora. Equivale a RF-03. |
| RF-CIT-003 | Cancelar y reprogramar citas. | Obligatorio | Registrar motivo, usuario y fecha; volver a validar disponibilidad. |
| RF-CIT-004 | Generar comprobante o confirmacion de cita. | Importante | La cita creada devuelve identificador, fecha, hora, profesional y estado. |
| RF-CIT-005 | Enviar recordatorios por medios autorizados por el paciente. | Importante | Solo usar canales consentidos; registrar resultado del envio. |

## Historia clinica, consulta y enfermeria

| ID | Requisito | Prioridad | Criterio minimo |
|---|---|---|---|
| RF-CLI-001 | Consultar la historia clinica longitudinal del paciente. | Obligatorio | Mostrar antecedentes, alergias, consultas, diagnosticos, tratamientos, recetas y resultados segun permisos. Equivale a RF-05. |
| RF-CLI-002 | Registrar triaje y signos vitales. | Obligatorio | Asociar mediciones a una atencion y al usuario responsable. |
| RF-CLI-003 | Registrar consulta: motivo, evolucion, diagnostico, tratamiento y recomendaciones. | Obligatorio | Campos clinicos minimos antes del cierre. Equivale a RF-04. |
| RF-CLI-004 | Cerrar/firmar una consulta y conservar versiones posteriores. | Obligatorio | Registro cerrado no se sobrescribe; toda correccion conserva motivo, usuario y fecha. |
| RF-CLI-005 | Crear ordenes de laboratorio desde la consulta. | Obligatorio | Asociar paciente, consulta, medico solicitante y examenes. |
| RF-CLI-006 | Emitir recetas electronicas desde la consulta. | Obligatorio | Incluir medicamento, dosis, via, frecuencia, duracion, cantidad e indicaciones. Equivale a RF-08. |

## Emergencias y hospitalizacion

| ID | Requisito | Prioridad | Criterio minimo |
|---|---|---|---|
| RF-HOS-001 | Registrar ingreso de emergencia y prioridad de triaje. | Obligatorio en alcance total | Permitir atencion aun sin cita; conservar identidad y prioridad. |
| RF-HOS-002 | Registrar hospitalizacion, cama/ubicacion y estado. | Obligatorio en alcance total | Vincular ingreso con paciente e historia clinica. |
| RF-HOS-003 | Registrar notas de enfermeria y evolucion durante internacion. | Obligatorio en alcance total | Cada nota tiene autor, fecha y hora. |
| RF-HOS-004 | Registrar alta medica. | Obligatorio en alcance total | Incluir fecha, responsable, indicaciones y estado final. |

## Laboratorio

| ID | Requisito | Prioridad | Criterio minimo |
|---|---|---|---|
| RF-LAB-001 | Recibir electronicamente ordenes de laboratorio. | Obligatorio | Solo ordenes validas y asociadas a consulta/paciente. Equivale a RF-06. |
| RF-LAB-002 | Gestionar estado de orden y muestra. | Obligatorio | Estados controlados: solicitada, recibida, en proceso, rechazada, validada/publicada u otros configurados. |
| RF-LAB-003 | Registrar resultados y observaciones. | Obligatorio | Resultado vinculado a la orden y al usuario que lo registra. Equivale a RF-07. |
| RF-LAB-004 | Validar y publicar resultados. | Obligatorio | Solo personal autorizado publica; resultados no validados no se muestran al paciente. |
| RF-LAB-005 | Notificar disponibilidad del resultado a usuarios autorizados. | Importante | Registrar destinatario, canal y estado de notificacion. |

## Receta, farmacia e inventario

| ID | Requisito | Prioridad | Criterio minimo |
|---|---|---|---|
| RF-FAR-001 | Consultar recetas vigentes por paciente y estado. | Obligatorio | Mostrar prescripcion, medico, consulta, cantidades y estado. |
| RF-FAR-002 | Dispensar receta total o parcialmente. | Obligatorio | Validar receta, stock, lote y vencimiento; impedir doble dispensacion. |
| RF-FAR-003 | Descontar inventario automaticamente al confirmar entrega. | Obligatorio | Cambio de receta y movimiento de stock en la misma transaccion. Equivale a RF-09. |
| RF-INV-001 | Gestionar catalogo de medicamentos y presentaciones. | Obligatorio | Medicamento habilitado antes de prescribir o recibir stock. |
| RF-INV-002 | Controlar existencias por lote y fecha de vencimiento. | Obligatorio | Consultar stock disponible y reservado por lote. |
| RF-INV-003 | Registrar entradas, salidas, transferencias y ajustes de inventario. | Obligatorio | Todo movimiento tiene tipo, cantidad, lote, usuario y motivo cuando corresponda. |
| RF-INV-004 | Generar alertas por stock minimo y proximidad de vencimiento. | Importante | Umbrales configurables; no incluir lotes vencidos como disponibles. |
| RF-INV-005 | Registrar compras, proveedores y recepcion de medicamentos. | Importante | La recepcion crea lotes y movimientos de entrada. |

## Facturacion y caja

| ID | Requisito | Prioridad | Criterio minimo |
|---|---|---|---|
| RF-FAC-001 | Crear cargos a partir de servicios y productos registrados. | Obligatorio | No permitir cargos sin referencia al servicio, examen o dispensacion. |
| RF-FAC-002 | Calcular detalle y total de factura/comprobante. | Obligatorio | Mantener items, cantidades, precios, descuentos/impuestos cuando sean definidos. Equivale a RF-10. |
| RF-FAC-003 | Registrar pagos y emitir comprobantes. | Obligatorio | Pago asociado a factura, paciente y usuario de caja. |
| RF-FAC-004 | Corregir/anular operaciones segun permiso y con trazabilidad. | Obligatorio | Conservar valor anterior, motivo, usuario y fecha. |

## Reportes, indicadores y notificaciones

| ID | Requisito | Prioridad | Criterio minimo |
|---|---|---|---|
| RF-REP-001 | Generar reportes clinicos y administrativos por periodo, area y servicio. | Importante | Filtros reproducibles y datos consolidados. Equivale a RF-11. |
| RF-REP-002 | Mostrar KPIs gerenciales. | Importante | Consultas por especialidad, tiempos, consumo, ingresos, costos, stock y productividad. |
| RF-REP-003 | Exportar reportes autorizados. | Importante | Exportacion respeta permisos y deja auditoria cuando contiene datos sensibles. |
| RF-NOT-001 | Gestionar notificaciones y recordatorios. | Importante | Plantilla, destinatario, canal, consentimiento, estado y reintentos. |
| RF-POR-001 | Portal/PWA para que el paciente consulte informacion autorizada. | Deseable | Citas, recetas, resultados publicados y notificaciones propias. |

## Administracion y soporte

| ID | Requisito | Prioridad | Criterio minimo |
|---|---|---|---|
| RF-ADM-001 | Administrar catalogos operativos: especialidades, profesionales, horarios, servicios y estados. | Obligatorio derivado | Cambios versionados y restringidos a roles autorizados. |
| RF-ADM-002 | Registrar incidencias y operaciones de soporte relevantes. | Importante | Evento vinculado a modulo, severidad, fecha, responsable y resolucion. |

## Requisitos futuros documentados

- Inteligencia artificial y modelos predictivos.
- Telemedicina.
- Integracion con dispositivos medicos.
- Analitica avanzada y Data Warehouse.
- Servicios en la nube.
- Aplicacion movil nativa si la PWA no satisface necesidades del dispositivo.

**Origen documental:** V0.0.6, clasificacion/priorizacion e historias; informe integrado, RF-01 a RF-12, casos de uso y arquitectura.
