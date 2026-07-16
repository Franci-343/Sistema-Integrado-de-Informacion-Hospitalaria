# AGENTS.md - Reglas globales del monorepo SIIH

## Contexto obligatorio

Antes de modificar codigo, leer:

1. `docs/ai-context/00_indice_y_modo_de_uso.md`
2. `docs/ai-context/04_requisitos_funcionales.md`
3. `docs/ai-context/05_requisitos_no_funcionales.md`
4. `docs/ai-context/06_reglas_de_negocio.md`
5. El archivo del modulo afectado.

## Decisiones tecnicas vigentes

- Monorepo con `frontend/` y `backend/`.
- Arquitectura inicial: **monolito modular**, no microservicios.
- Frontend: React + TypeScript + Vite; interfaz web responsiva y PWA para pacientes en una fase posterior.
- Backend: Java 21 LTS + Spring Boot.
- Persistencia: PostgreSQL + Spring Data JPA + Flyway.
- Seguridad: Spring Security, OAuth2/JWT y RBAC.
- Documentos: MinIO o almacenamiento compatible con S3.
- Contratos: REST/JSON + OpenAPI; HL7 FHIR queda previsto para interoperabilidad futura.
- Infraestructura: Docker, Linux y Nginx.

## Reglas inviolables

- No inventar requisitos ni reglas clinicas. Registrar dudas en `20_riesgos_supuestos_y_decisiones_pendientes.md`.
- Un paciente debe tener una ficha unica; verificar duplicados antes de crear.
- Un medico no puede tener dos citas superpuestas.
- Solo personal autorizado accede a informacion clinica.
- Solo un medico autorizado registra diagnosticos y emite recetas.
- Una receta siempre pertenece a una consulta y a un paciente.
- No dispensar lotes vencidos ni permitir stock negativo.
- Dispensacion, movimiento de inventario y cambio de estado de receta deben ser atomicos.
- Una factura solo puede incluir servicios o productos efectivamente registrados.
- Los registros clinicos no se eliminan fisicamente; se versionan o anulan con motivo.
- Toda operacion sensible registra usuario, fecha, hora, accion, entidad y origen.
- No registrar datos clinicos sensibles en logs tecnicos.
- Las operaciones criticas deben ser idempotentes o estar protegidas contra duplicacion.

## Calidad minima

- Cada cambio indica requisito(s) cubierto(s).
- Pruebas unitarias para reglas de negocio.
- Pruebas de integracion con PostgreSQL para persistencia y transacciones.
- Pruebas E2E para flujos criticos.
- Migraciones Flyway versionadas y reversibles mediante estrategia documentada.
- OpenAPI actualizado con cada cambio de API.
- Datos de prueba sinteticos; nunca usar informacion real de pacientes.

## Limites de alcance

- No crear microservicios sin una decision arquitectonica aprobada.
- No desarrollar aplicacion movil nativa en el MVP inicial.
- IA, telemedicina, analitica avanzada, nube y dispositivos medicos son alcance futuro.
- No asumir normativa legal, fiscal o clinica no documentada.



---

# 00 - Indice y modo de uso

## Orden recomendado para agentes

| Tarea | Contexto minimo |
|---|---|
| Planificacion general | 01, 02, 14, 15, 20 |
| Backend | 04, 05, 06, 08, 09, 11, 12, 13 |
| Frontend | 03, 04, 07, 08, 10, `frontend/CONTEXT.md` |
| Base de datos | 04, 06, 09, 13, 17 |
| Seguridad | 03, 05, 06, 13, 17 |
| Pruebas | 04, 05, 06, 07, 08, 16, 21 |
| Despliegue | 11, 13, 17 |
| Validacion con usuarios | 03, 07, 18, 19, 20 |

## Archivos

- `01_contexto_problema_y_objetivos.md`: problema, causas, consecuencias y objetivos.
- `02_alcance_modulos_y_limites.md`: modulos incluidos, fases y fuera de alcance.
- `03_stakeholders_roles_y_permisos.md`: actores y matriz inicial de acceso.
- `04_requisitos_funcionales.md`: catalogo normalizado de funciones.
- `05_requisitos_no_funcionales.md`: calidad, seguridad, rendimiento y disponibilidad.
- `06_reglas_de_negocio.md`: invariantes que deben protegerse en dominio y base de datos.
- `07_historias_de_usuario_y_aceptacion.md`: historias y criterios verificables.
- `08_casos_de_uso_prioritarios.md`: flujos, excepciones y postcondiciones.
- `09_modelo_de_dominio_y_datos.md`: entidades y relaciones iniciales.
- `10_procesos_as_is_to_be.md`: situacion actual y proceso objetivo.
- `11_arquitectura_y_tecnologias.md`: arquitectura seleccionada y stack.
- `12_api_integraciones_y_contratos.md`: limites de API e interoperabilidad.
- `13_seguridad_privacidad_y_auditoria.md`: controles de proteccion.
- `14_mvp_backlog_y_roadmap.md`: entregas incrementales y plan acelerado.
- `15_estructura_monorepo.md`: estructura propuesta del repositorio.
- `16_pruebas_calidad_y_definicion_de_hecho.md`: estrategia de pruebas.
- `17_despliegue_respaldo_y_continuidad.md`: infraestructura y recuperacion.
- `18_levantamiento_y_validacion.md`: plan para cerrar requisitos faltantes.
- `19_instrumentos_de_levantamiento.md`: preguntas y listas de comprobacion.
- `20_riesgos_supuestos_y_decisiones_pendientes.md`: elementos no resueltos.
- `21_matriz_de_trazabilidad.md`: problema -> requisito -> modulo -> prueba.
- `22_glosario.md`: vocabulario del dominio.
- `23_fuentes_y_control_de_cambios.md`: procedencia y calidad de la informacion.

## Convenciones

- `RF-<MOD>-NNN`: requisito funcional.
- `RNF-<CAT>-NNN`: requisito no funcional.
- `RN-<MOD>-NNN`: regla de negocio.
- `HU-<MOD>-NNN`: historia de usuario.
- `UC-NN`: caso de uso.
- Prioridades: **Obligatorio**, **Importante**, **Deseable**, **Futuro**.

Los identificadores son normalizados para el desarrollo. Los documentos originales usan tambien `RF-01` a `RF-12` y `RNF-01` a `RNF-10`; la equivalencia se conserva en los archivos de requisitos.



---

# 01 - Contexto, problema y objetivos

## Nombre del sistema

**Sistema Integrado de Informacion Hospitalaria (SIIH)** para el caso de estudio **Hospital Universitario San Andres**.

## Problema central

La informacion clinica y administrativa esta fragmentada entre documentos fisicos, hojas de calculo y aplicaciones aisladas. No existe una base de datos central ni intercambio automatico entre admision, consulta, emergencias, hospitalizacion, laboratorio, farmacia, caja, administracion y direccion.

## Sintomas observados

- Duplicidad de registros de pacientes.
- Demoras en registro, atencion y localizacion de historias clinicas.
- Errores al programar, cancelar o reprogramar citas.
- Resultados de laboratorio comunicados tarde o por medios impresos.
- Inconsistencias entre consulta, receta, farmacia y facturacion.
- Inventario manual o independiente, con riesgo de desabastecimiento y vencimientos.
- Doble digitacion y reprocesos administrativos.
- Reportes gerenciales tardios, incompletos o consolidados manualmente.
- Falta de trazabilidad sobre quien accedio o modifico informacion.
- Informacion insuficiente o desactualizada para decisiones de direccion.

## Causas raiz documentadas

1. Procesos manuales y repetitivos.
2. Aplicaciones independientes sin integracion.
3. Ausencia de una base de datos centralizada.
4. Falta de estandarizacion de procedimientos y datos.
5. Comunicacion entre areas basada en papel, llamadas o consultas personales.
6. Limitaciones de infraestructura, respaldo y politicas de tecnologia.
7. Capacitacion insuficiente y resistencia al cambio.
8. Presupuesto y personal tecnico limitados.

## Consecuencias

- Mayor tiempo de espera y peor experiencia del paciente.
- Riesgo clinico por antecedentes o resultados no disponibles.
- Perdidas economicas, compras innecesarias y medicamentos vencidos.
- Errores de cobro y dificultad para conciliar servicios prestados.
- Baja productividad y mayor carga manual para el personal.
- Decisiones gerenciales basadas en datos incompletos.

## Objetivo general normalizado

Desarrollar un sistema unico que centralice, automatice e integre los procesos clinicos y administrativos del hospital, proteja la informacion, reduzca errores y demoras, optimice recursos y proporcione informacion confiable para la toma de decisiones.

## Objetivos especificos

- Analizar y estandarizar procesos AS-IS antes de automatizarlos.
- Mantener una ficha unica por paciente y una historia clinica continua.
- Integrar admision, citas, atencion, laboratorio, farmacia, inventario, facturacion y reportes.
- Automatizar tareas repetitivas y eliminar doble digitacion.
- Controlar usuarios, roles, permisos y auditoria.
- Asegurar respaldo, recuperacion y continuidad operativa.
- Generar indicadores clinicos, administrativos y gerenciales.
- Construir una solucion modular, escalable y preparada para integraciones futuras.

## Metas operativas propuestas en los documentos

Estas cifras son metas del caso de estudio, no SLA tecnicos validados:

- Tiempo total actual estimado: 45 a 90 minutos por paciente.
- Reduccion esperada del tiempo total: 25% a 40%.
- Tiempo actual de recepcion estimado: 15 a 25 minutos.
- Meta de registro en recepcion: menos de 8 minutos.
- Disponibilidad del historial: acceso autorizado en linea.
- Stock: actualizacion en tiempo real con alertas.

## Advertencia

El caso es academico. Los documentos no demuestran que las cifras, procesos o politicas hayan sido validados en un hospital real. Toda decision clinica, legal, fiscal o institucional debe confirmarse con responsables autorizados.

**Origen documental:** V0.0.6, secciones 1 a 3; informe integrado, secciones 1 a 6 y tabla de indicadores.



---

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



---

# 03 - Stakeholders, roles y permisos

## Actores documentados

| Actor | Necesidad principal |
|---|---|
| Paciente | Atencion rapida; citas, recetas, resultados, pagos y notificaciones autorizadas. |
| Recepcion/admision | Registrar y localizar pacientes sin duplicidad; gestionar citas y llegada. |
| Medico | Consultar historia, registrar consulta, diagnostico, tratamiento, ordenes y recetas. |
| Enfermeria | Registrar triaje, signos vitales, seguimiento y cuidados. |
| Tecnico de laboratorio | Recibir ordenes, gestionar muestras, registrar y validar resultados segun permiso. |
| Farmaceutico | Consultar recetas, dispensar y controlar stock, lotes y vencimientos. |
| Caja/facturacion | Registrar cargos, pagos, comprobantes y correcciones autorizadas. |
| Compras/almacen | Gestionar proveedores, ordenes, recepcion y niveles de stock. |
| Jefe de area | Validar reglas, controles, excepciones e indicadores del area. |
| Direccion | Consultar KPIs clinicos, financieros, inventario y productividad. |
| Administrador del sistema | Gestionar usuarios, roles, permisos, auditoria, respaldo e incidencias. |
| Soporte TI | Operacion tecnica, integraciones, infraestructura, migracion y recuperacion. |

## Matriz inicial de permisos

**Estado:** derivada de responsabilidades documentadas; debe validarse antes de produccion.

| Operacion | Paciente | Recepcion | Enfermeria | Medico | Lab. | Farmacia | Caja | Direccion | Admin TI |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Consultar sus propios datos autorizados | S | - | - | - | - | - | - | - | - |
| Registrar/actualizar datos demograficos | Limitado | S | L | L | L | L | L | L | S |
| Crear/reprogramar/cancelar cita | Opcional | S | L | L | - | - | - | L | S |
| Registrar llegada/triaje/signos vitales | - | S/L | S | S/L | - | - | - | L | S |
| Consultar historia clinica | Propia y limitada | L | S | S | L | L limitada | - | Agregada | S auditado |
| Registrar diagnostico/tratamiento | - | - | L | S | - | - | - | - | - |
| Emitir receta | - | - | - | S | - | - | - | - | - |
| Registrar/validar resultado | - | - | - | L | S | - | - | - | - |
| Dispensar medicamento | - | - | - | L | - | S | L | - | - |
| Ajustar inventario | - | - | - | - | - | S autorizado | - | L | Admin de modulo |
| Facturar/cobrar | - | - | - | L | L | L | S | L | Admin de modulo |
| Consultar reportes | Propios | Operativos | Operativos | Clinicos | Operativos | Operativos | Financieros | S | S |
| Gestionar usuarios/roles | - | - | - | - | - | - | - | - | S |
| Consultar auditoria | - | - | - | - | - | - | - | Autorizada | S |

Leyenda: `S` permitido; `L` lectura o acceso limitado; `-` no permitido por defecto.

## Principios de autorizacion

- Minimo privilegio y separacion por area.
- Acceso clinico solo por necesidad de trabajo.
- El paciente solo consulta informacion propia y explicitamente publicada.
- Farmacia no modifica la prescripcion; registra observacion o devuelve al medico.
- Administracion tecnica no debe tener acceso clinico irrestricto sin justificacion y auditoria.
- Acciones excepcionales requieren motivo y quedan auditadas.
- MFA configurable para perfiles criticos.

## Errores del material fuente excluidos

En un diagrama de actores aparecen etiquetas como “Presupuesto limitado” y “Fallo politico 11”. Se consideran errores graficos, no actores del sistema, y no se incorporan al modelo.

**Origen documental:** V0.0.6, participantes y reglas; informe integrado, stakeholders, casos de uso y seguridad.



---

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



---

# 05 - Requisitos no funcionales

## Seguridad, privacidad e integridad

| ID | Requisito | Nivel | Verificacion inicial |
|---|---|---|---|
| RNF-SEG-001 | Autenticacion obligatoria y autorizacion RBAC. | Critico | Pruebas de acceso permitido/denegado por rol. Equivale a RNF-01/RNF-02. |
| RNF-SEG-002 | Contraseñas almacenadas con hash robusto; secretos fuera del codigo. | Critico | Revision de configuracion y repositorio. |
| RNF-SEG-003 | Comunicaciones protegidas con HTTPS/TLS. | Critico | Escaneo y prueba de despliegue. |
| RNF-SEG-004 | Cifrado de volumenes y copias cuando la infraestructura lo permita. | Alto | Evidencia de configuracion. |
| RNF-SEG-005 | Bloqueo por intentos fallidos y MFA configurable para perfiles criticos. | Alto | Prueba de seguridad. |
| RNF-INT-001 | Validar datos y relaciones antes de persistir. | Critico | Pruebas de restricciones y casos invalidos. Equivale a RNF-08. |
| RNF-INT-002 | Mantener consistencia entre consulta, receta, laboratorio, stock y facturacion. | Critico | Pruebas transaccionales de integracion. |
| RNF-INT-003 | Operaciones de receta, stock y pago deben ser atomicas o revertirse. | Critico | Pruebas con fallos inducidos. |
| RNF-INT-004 | Operaciones criticas deben ser idempotentes o resistir reintentos. | Alto | Repetir solicitud sin crear duplicados. |

## Auditoria y trazabilidad

| ID | Requisito | Nivel | Verificacion inicial |
|---|---|---|---|
| RNF-AUD-001 | Registrar accesos y cambios sensibles con usuario, fecha, hora, accion, entidad y origen. | Alto | Pruebas de auditoria. Equivale a RNF-03. |
| RNF-AUD-002 | Proteger la bitacora contra modificacion no autorizada. | Critico | Roles y permisos de base de datos; prueba de alteracion. |
| RNF-AUD-003 | Conservar valor anterior y motivo de correcciones clinicas o de inventario. | Alto | Prueba de versionado/anulacion. |
| RNF-AUD-004 | No eliminar fisicamente registros clinicos cerrados. | Critico | Reglas de dominio y base de datos. |

## Rendimiento

| ID | Requisito | Nivel | Verificacion inicial |
|---|---|---|---|
| RNF-REN-001 | Busqueda de paciente e historia en tiempo operativo aceptable. | Alto | Definir percentil y limite con usuarios; prueba de carga. Equivale a RNF-05. |
| RNF-REN-002 | Reportes no deben bloquear las operaciones clinicas. | Alto | Ejecutar reportes con carga concurrente. |
| RNF-REN-003 | Soportar varios usuarios concurrentes. | Alto | Cantidad exacta pendiente de dimensionamiento. |
| RNF-REN-004 | Las consultas frecuentes deben usar paginacion e indices adecuados. | Recomendado | Revision de planes de consulta. |

Los documentos no fijan tiempos de respuesta tecnicos en segundos ni concurrencia objetivo. Deben acordarse antes de una prueba formal de rendimiento.

## Disponibilidad y recuperacion

| ID | Requisito | Nivel | Verificacion inicial |
|---|---|---|---|
| RNF-DIS-001 | Estar disponible durante los horarios de atencion. | Alto | Monitoreo y reporte de disponibilidad. Equivale a RNF-04. |
| RNF-DIS-002 | Modulos criticos con procedimiento de recuperacion. | Alto | Simulacro de falla. |
| RNF-DIS-003 | Copias de seguridad periodicas y restauracion comprobada. | Critico | Prueba de restauracion. |
| RNF-DIS-004 | Plan de contingencia manual controlada ante interrupcion. | Alto | Procedimiento aprobado y ejercicio. |
| RNF-DIS-005 | Backups con enfoque 3-2-1, monitoreo, alertas y UPS. | Alto | Evidencia operativa. |

RPO y RTO no estan definidos y son una decision pendiente.

## Usabilidad y accesibilidad operativa

| ID | Requisito | Nivel | Verificacion inicial |
|---|---|---|---|
| RNF-USA-001 | Interfaces simples y terminos comprensibles para personal clinico y administrativo. | Alto | Pruebas con usuarios. Equivale a RNF-06. |
| RNF-USA-002 | Formularios en orden logico y con pocos pasos innecesarios. | Alto | Evaluacion de prototipo y tarea. |
| RNF-USA-003 | Mensajes de error y confirmacion claros. | Alto | Pruebas de errores controlados. |
| RNF-USA-004 | Diseño responsivo para computadoras y tablets; PWA para pacientes. | Alto | Pruebas en resoluciones objetivo. |
| RNF-USA-005 | Curva de aprendizaje baja y materiales de capacitacion. | Alto | Prueba de aceptacion y plan de formacion. |

## Escalabilidad, mantenibilidad e interoperabilidad

| ID | Requisito | Nivel | Verificacion inicial |
|---|---|---|---|
| RNF-ESC-001 | Incorporar nuevas areas, usuarios, modulos y sedes. | Medio-Alto | Limites modulares y prueba de configuracion. Equivale a RNF-07. |
| RNF-MAN-001 | Codigo modular, documentado y separado por capas. | Medio-Alto | Revision arquitectonica. Equivale a RNF-09. |
| RNF-MAN-002 | Migraciones de base de datos versionadas. | Alto | Flyway en CI. |
| RNF-MAN-003 | Pruebas automatizadas y revision de codigo obligatorias. | Alto | Pipeline CI. |
| RNF-INTOP-001 | API documentada con OpenAPI y preparada para integraciones. | Medio | Contrato actualizado. Equivale a RNF-10. |
| RNF-INTOP-002 | Prever HL7 FHIR sin imponerlo en el MVP. | Futuro | ADR y mapeo cuando exista integracion real. |

## Proteccion de datos y logs

- Acceso limitado por rol y finalidad.
- No registrar datos clinicos sensibles en logs tecnicos.
- Archivos y adjuntos con control de acceso.
- Datos de prueba sinteticos.
- Minimizar informacion copiada durante levantamiento.
- No incluir nombres de pacientes en encuestas o informes academicos.

**Origen documental:** V0.0.6, requisitos no funcionales y confidencialidad; informe integrado, RNF-01 a RNF-10, reglas de casos de uso y controles de despliegue.



---

# 06 - Reglas de negocio

## Pacientes

| ID | Regla |
|---|---|
| RN-PAC-001 | Cada persona debe tener un unico paciente activo e identificador interno. |
| RN-PAC-002 | Antes de crear, se buscan coincidencias por documento, nombre completo y fecha de nacimiento. |
| RN-PAC-003 | Actualizar datos demograficos no crea una ficha nueva. |

## Citas y admision

| ID | Regla |
|---|---|
| RN-CIT-001 | Toda cita pertenece a un paciente, un medico, una especialidad, fecha y hora. |
| RN-CIT-002 | Un medico no puede tener dos citas que se solapen. |
| RN-CIT-003 | Cancelar o reprogramar requiere registrar motivo, usuario y fecha. |
| RN-CIT-004 | La reprogramacion vuelve a validar disponibilidad. |
| RN-CIT-005 | Emergencias pueden iniciar una atencion sin cita, pero deben identificar al paciente o crear un registro controlado. **Derivada; validar.** |

## Historia clinica y consulta

| ID | Regla |
|---|---|
| RN-CLI-001 | Solo personal autorizado consulta la historia clinica. |
| RN-CLI-002 | Solo un medico autorizado registra diagnosticos y emite recetas. |
| RN-CLI-003 | Una consulta solo se cierra con los campos clinicos minimos definidos. |
| RN-CLI-004 | Un registro clinico cerrado no se sobrescribe ni se elimina fisicamente. |
| RN-CLI-005 | Toda correccion clinica conserva version anterior, motivo, usuario, fecha y hora. |
| RN-CLI-006 | El acceso a informacion clinica tambien se audita. |

## Laboratorio

| ID | Regla |
|---|---|
| RN-LAB-001 | Toda orden identifica paciente, consulta y medico solicitante. |
| RN-LAB-002 | Todo resultado pertenece a una orden existente. |
| RN-LAB-003 | Solo personal autorizado registra o valida resultados. |
| RN-LAB-004 | Solo resultados validados pueden publicarse al expediente o portal del paciente. |
| RN-LAB-005 | Una muestra rechazada conserva estado y motivo; no se borra la orden. **Derivada de excepciones.** |

## Recetas, farmacia e inventario

| ID | Regla |
|---|---|
| RN-FAR-001 | Toda receta pertenece a una consulta, un paciente y un medico emisor. |
| RN-FAR-002 | Farmacia no modifica la prescripcion; puede observarla o devolverla al medico. |
| RN-FAR-003 | No se dispensa una receta anulada, vencida segun politica o ya completada. La vigencia exacta esta pendiente. |
| RN-FAR-004 | No se despachan medicamentos vencidos. |
| RN-FAR-005 | La dispensacion valida existencias por lote y vencimiento. |
| RN-FAR-006 | La receta puede quedar dispensada o parcialmente dispensada. |
| RN-INV-001 | No se permite stock negativo. |
| RN-INV-002 | La entrega disminuye existencias y registra lote utilizado. |
| RN-INV-003 | Estado de receta y movimiento de inventario se confirman en la misma transaccion. |
| RN-INV-004 | Todo ajuste de inventario requiere motivo y usuario autorizado. |
| RN-INV-005 | Los lotes proximos a vencer generan alerta; el umbral es configurable. |

## Facturacion y pagos

| ID | Regla |
|---|---|
| RN-FAC-001 | Una factura solo corresponde a servicios, examenes o productos realmente registrados. |
| RN-FAC-002 | Todo pago pertenece a una factura/comprobante y al usuario que lo registro. |
| RN-FAC-003 | Correcciones o anulaciones conservan motivo, autor y valores previos. |
| RN-FAC-004 | Las operaciones de stock y pago criticas deben ser atomicas o compensarse. |

## Seguridad y auditoria

| ID | Regla |
|---|---|
| RN-SEG-001 | Los usuarios solo ejecutan operaciones permitidas por su rol. |
| RN-SEG-002 | Informacion confidencial no se muestra a usuarios no autorizados. |
| RN-SEG-003 | Todo flujo protegido inicia con autenticacion y autorizacion. |
| RN-SEG-004 | Toda operacion sensible registra usuario, fecha, hora, accion, entidad y origen. |
| RN-SEG-005 | Excepciones visibles muestran mensajes comprensibles; detalles tecnicos quedan en registros sin exponer datos clinicos. |
| RN-SEG-006 | Operaciones criticas deben ser idempotentes para evitar duplicados por reintento. |

## Reglas pendientes de definicion

- Campos obligatorios exactos por paciente, consulta, receta y resultado.
- Politica de coincidencia y fusion de pacientes duplicados.
- Duracion, cancelacion y tolerancia de citas.
- Vigencia de receta y limites de cantidad.
- Flujo de sustitucion de medicamentos.
- Catalogos clinicos y unidades de medida.
- Impuestos, descuentos, seguros, convenios y anulacion fiscal.
- Retencion y firma de registros clinicos.
- Reglas de cama, traslado, alta y reingreso.

**Origen documental:** V0.0.6, reglas preliminares y validacion; informe integrado, reglas clave y RN-CU-01 a RN-CU-05.



---

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



---

# 08 - Casos de uso prioritarios

## Matriz de casos de uso

| ID | Caso | Actor principal | Resultado | Prioridad |
|---|---|---|---|---|
| UC-01 | Registrar paciente | Recepcion | Ficha unica; advertencia/rechazo de duplicados configurables | Alta |
| UC-02 | Gestionar cita | Recepcion / Paciente | Reserva, reprogramacion o cancelacion sin solapamientos | Alta |
| UC-03 | Atender consulta | Medico / Enfermeria | Evolucion, diagnostico y tratamiento vinculados a historia y auditoria | Alta |
| UC-04 | Gestionar laboratorio | Medico / Laboratorio | Orden, muestra y resultado vinculados; publicacion solo validada | Media-Alta |
| UC-05 | Emitir y dispensar receta | Medico / Farmacia | Validacion de receta, stock, lote y vencimiento; descuento atomico | Alta |
| UC-06 | Facturar servicio | Caja / Administracion | Detalle, pago y comprobante asociados a paciente y servicio | Alta |
| UC-07 | Consultar reportes | Direccion | KPIs por periodo, servicio y especialidad; filtros y exportacion | Media-Alta |
| UC-08 | Administrar seguridad | Administrador | Usuarios, roles, permisos, bloqueos, sesiones y auditoria | Alta |

## UC-01 - Registrar paciente

- **Precondicion:** usuario autenticado; permiso de admision.
- **Flujo:** buscar coincidencias -> ingresar datos -> validar obligatorios -> crear ficha -> confirmar.
- **Excepciones:** documento ya registrado; coincidencia probable; datos incompletos.
- **Postcondicion:** ficha disponible para citas y atencion; auditoria creada.

## UC-02 - Gestionar cita

- **Precondicion:** paciente registrado; agenda habilitada.
- **Flujo:** seleccionar especialidad/profesional -> consultar horarios -> reservar -> confirmar/notificar.
- **Alternativas:** reprogramar o cancelar con motivo.
- **Excepciones:** horario ocupado, medico no disponible, cita duplicada.
- **Postcondicion:** cita en estado valido y sin solapamiento.

## UC-03 - Atender consulta

- **Actor principal:** medico; enfermeria participa en triaje/signos vitales.
- **Precondiciones:** usuario autorizado; paciente identificado; cita o ingreso valido; expediente disponible.
- **Flujo:** abrir expediente -> revisar antecedentes/alergias -> registrar motivo/signos/evolucion -> diagnostico/tratamiento -> ordenar examen o receta -> firmar/cerrar.
- **Excepciones:** paciente sin cita; expediente no disponible; datos incompletos; acceso fuera del rol.
- **Postcondicion:** consulta vinculada a historia; ordenes/recetas asociadas; auditoria.
- **Aceptacion:** no cerrar sin campos minimos; historial disponible en tiempo operativo; edicion posterior conserva version, motivo, usuario y fecha.

## UC-04 - Gestionar laboratorio

- **Precondicion:** consulta/paciente validos.
- **Flujo:** crear orden -> recibir muestra -> procesar -> registrar resultado -> validar -> publicar/notificar.
- **Excepciones:** examen no disponible; orden duplicada; muestra rechazada; resultado requiere observacion.
- **Postcondicion:** resultado validado en expediente; trazabilidad completa.

## UC-05 - Emitir y dispensar receta

- **Actores:** medico emite; farmaceutico valida/dispensa; caja cobra cuando corresponda.
- **Precondiciones:** consulta autorizada; paciente identificado; medicamento habilitado.
- **Flujo:** crear receta -> validar dosis/indicaciones -> farmacia consulta -> validar lotes/stock/vencimiento -> confirmar despacho -> descontar stock -> comprobante.
- **Excepciones:** stock insuficiente; lote vencido; receta anulada o ya dispensada; cantidad superior a regla.
- **Postcondicion:** receta dispensada o parcial; kardex actualizado; comprobante asociado; auditoria.
- **Aceptacion:** sin stock negativo; receta y movimiento en una transaccion; alerta por vencimiento.

## UC-06 - Facturar servicio

- **Precondicion:** servicio o producto registrado.
- **Flujo:** obtener items -> calcular total -> registrar pago -> emitir comprobante.
- **Excepciones:** pago rechazado; dato fiscal incompleto; item sin respaldo.
- **Postcondicion:** factura/pago asociados y auditados.

## UC-07 - Consultar reportes

- **Precondicion:** usuario con permiso y datos consolidados.
- **Flujo:** elegir periodo/filtros -> generar -> visualizar -> exportar si esta autorizado.
- **Excepciones:** datos insuficientes; periodo invalido; exportacion no autorizada.
- **Postcondicion:** consulta/exportacion sensible auditada.

## UC-08 - Administrar seguridad

- **Precondicion:** administrador autenticado con permiso.
- **Flujo:** crear/editar usuario -> asignar rol -> activar/bloquear -> revisar sesiones/auditoria.
- **Excepciones:** autoelevacion de privilegios; rol inexistente; intento de eliminar evidencia.
- **Postcondicion:** cambio efectivo y auditado.

## Reglas transversales de diseno

- Autenticacion y autorizacion antes de cada flujo protegido.
- Cambios clinicos versionados/anulados, nunca eliminados fisicamente.
- Operaciones criticas atomicas.
- Errores comprensibles para el usuario y evidencia tecnica segura.
- Cada criterio debe convertirse en prueba funcional o automatizada.
- Idempotencia y trazabilidad desde interfaz hasta base de datos.

**Origen documental:** informe integrado, secciones 12 y 13; V0.0.6, historias y reglas.



---

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



---

# 10 - Procesos AS-IS y TO-BE

## AS-IS documentado

1. Recepcion registra al paciente en papel y busca historia fisica.
2. La cita se anota en agenda fisica o sistema aislado.
3. Consulta registra diagnostico/evolucion sin repositorio comun.
4. Si hay examen, laboratorio procesa en software aislado y entrega resultado impreso.
5. Farmacia valida receta y stock en un control independiente.
6. Caja vuelve a digitar servicios/productos y emite cobro.
7. Administracion consolida reportes en hojas de calculo.

Problemas:

- El paciente y los documentos se trasladan entre areas.
- Datos ya capturados se vuelven a registrar.
- No hay una sola fuente de verdad.
- El resultado, receta, inventario y cobro no quedan vinculados automaticamente.
- Direccion carece de indicadores en tiempo real.

## TO-BE propuesto

1. **Identificacion:** buscar paciente y validar duplicidad; crear ficha unica solo si no existe.
2. **Agenda/ingreso:** consultar disponibilidad; reservar sin solapamiento; confirmar llegada o triaje.
3. **Atencion:** abrir expediente; registrar signos, evolucion, diagnostico y tratamiento.
4. **Ordenes:** generar solicitudes de laboratorio y recetas desde la consulta.
5. **Laboratorio:** recibir orden, procesar muestra, validar y publicar resultado en el expediente.
6. **Farmacia:** consultar receta, validar lote/stock/vencimiento, dispensar y actualizar inventario atomicamente.
7. **Facturacion:** recuperar servicios/productos registrados, cobrar y emitir comprobante.
8. **Cierre:** notificar, auditar y actualizar indicadores.

## Story map del recorrido del paciente

1. Registrar paciente.
2. Programar cita.
3. Confirmar llegada.
4. Realizar consulta.
5. Registrar diagnostico.
6. Solicitar examenes.
7. Emitir receta.
8. Entregar medicamentos.
9. Facturar servicios.
10. Generar seguimiento.

## Dependencias funcionales

- Pacientes antes de citas.
- Cita/ingreso antes de consulta, salvo flujo de emergencia controlado.
- Consulta antes de orden y receta.
- Orden antes de resultado.
- Receta antes de dispensacion.
- Servicio/dispensacion antes de facturacion.
- Datos transaccionales antes de indicadores.

## Indicadores a medir

- Tiempo de registro y espera.
- Pacientes atendidos por dia.
- Duplicados detectados/confirmados.
- Citas canceladas y reprogramadas.
- Tiempo de entrega de resultados.
- Recetas procesadas y dispensaciones parciales.
- Frecuencia de desabastecimiento y medicamentos vencidos.
- Diferencias entre inventario fisico y sistema.
- Errores/correcciones de facturacion.
- Tiempo para generar reportes.
- Disponibilidad e incidencias del sistema.

## Criterio de mejora

No automatizar un proceso defectuoso sin validarlo. Cada flujo TO-BE debe revisarse con usuarios de las areas que entregan y reciben informacion.

**Origen documental:** V0.0.6, procesos actuales, Story Mapping e indicadores; informe integrado, BPMN AS-IS/TO-BE y Gap Analysis.



---

# 11 - Arquitectura y tecnologias

## Estilo seleccionado

**Monolito modular**: una aplicacion desplegable, separada internamente por dominios. Se elige por menor complejidad operativa, consistencia transaccional y adecuacion a un equipo academico con plazo corto.

No se deben crear dependencias directas arbitrarias entre modulos. Cada modulo expone interfaces/casos de uso y protege sus invariantes.

## Capas internas

1. **Presentacion/API:** controladores, DTO, validacion de entrada y contratos OpenAPI.
2. **Aplicacion:** casos de uso, orquestacion, autorizacion contextual y transacciones.
3. **Dominio:** entidades, value objects, servicios y reglas.
4. **Adaptadores:** PostgreSQL/JPA, MinIO, notificaciones, reloj, integraciones.

Regla: las capas internas no dependen de frameworks externos; infraestructura depende de aplicacion/dominio, no al reves.

## Modulos del backend

- `security`
- `patients`
- `appointments`
- `clinical`
- `emergency-hospitalization`
- `laboratory`
- `pharmacy`
- `inventory-procurement`
- `billing`
- `reporting`
- `notifications`
- `document-storage`
- `shared-kernel` reducido

## Stack seleccionado en los documentos

| Capa | Tecnologia | Uso |
|---|---|---|
| Frontend | React + TypeScript + Vite | Formularios, agendas, historia, tableros y PWA |
| Backend | Java 21 LTS + Spring Boot | API, casos de uso, reglas y transacciones |
| Seguridad | Spring Security + OAuth2/JWT + RBAC | Autenticacion, permisos, sesiones, bloqueo y auditoria |
| Persistencia | PostgreSQL + Spring Data JPA + Flyway | Datos transaccionales, integridad y migraciones |
| Documentos | MinIO o S3 compatible | Adjuntos y resultados con acceso controlado |
| Integracion | REST/JSON + OpenAPI | Contratos internos/externos |
| Interoperabilidad futura | HL7 FHIR | Integracion con sistemas de salud cuando exista alcance |
| Infraestructura | Docker + Linux + Nginx | Despliegue reproducible, HTTPS y proxy inverso |
| Pruebas backend | JUnit, Mockito, Testcontainers | Unitarias e integracion |
| Pruebas frontend | React Testing Library, Playwright | Componentes y E2E |
| DevOps | Git + GitHub Actions o GitLab CI | Build, pruebas y despliegue |

## Modalidad de acceso

- Aplicacion web responsiva para personal en computadoras y tablets.
- Portal del paciente como PWA en entrega posterior.
- Aplicacion nativa solo si se requieren capacidades que la PWA no cubra.

## Por que no microservicios ahora

- Aumentan red, seguridad, observabilidad y despliegues.
- Complican transacciones de receta, stock y pagos.
- Requieren equipos y propiedad autonoma por servicio.
- El monolito modular permite extraer servicios despues si hay evidencia.

Candidatos futuros de extraccion: notificaciones, analitica/BI e interoperabilidad. El nucleo clinico transaccional debe permanecer cohesivo hasta que exista una necesidad real.

## Decisiones arquitectonicas que deben documentarse como ADR

- Estrategia exacta de autenticacion y emision/renovacion de tokens.
- Multi-tenancy o multi-sede.
- Modelo de auditoria y versionado clinico.
- Control de concurrencia en citas e inventario.
- Estrategia de archivos/adjuntos.
- Patron de reportes pesados.
- Transacciones y eventos internos.
- Criterios para eventual extraccion de microservicios.

**Origen documental:** informe integrado, seccion 15. El PDF confirma visualmente una arquitectura por capas; el DOCX contiene la seleccion tecnologica mas completa.



---

# 12 - API, integraciones y contratos

## Contrato base extraido

- API REST sobre JSON.
- Documentacion OpenAPI.
- Autenticacion OAuth2/JWT y autorizacion RBAC.
- HL7 FHIR previsto, no obligatorio en el MVP.
- Archivos en MinIO/S3 con acceso controlado.

## Limites de recursos sugeridos

**Estado:** recomendacion de implementacion derivada de los modulos; no es un contrato final.

- `/api/v1/auth`
- `/api/v1/users`, `/roles`, `/permissions`, `/audit-events`
- `/api/v1/patients`
- `/api/v1/appointments`, `/schedules`, `/specialties`
- `/api/v1/clinical-histories`, `/consultations`, `/triage`
- `/api/v1/lab-orders`, `/lab-results`, `/samples`
- `/api/v1/prescriptions`, `/dispensations`
- `/api/v1/medications`, `/batches`, `/stock-movements`, `/purchase-orders`
- `/api/v1/invoices`, `/payments`, `/services`
- `/api/v1/reports`, `/indicators`
- `/api/v1/notifications`
- `/api/v1/documents`

## Reglas de contrato

- Versionar la API desde el inicio.
- DTO de entrada/salida; no exponer entidades JPA.
- Validacion de formato en el borde y reglas en dominio.
- Errores con codigo estable, mensaje comprensible y `traceId`; no exponer stack trace.
- Paginacion en listados.
- Filtros explicitos por fecha, estado, paciente, area y profesional segun permiso.
- Usar fechas/horas con zona definida y formato consistente.
- OpenAPI se actualiza en la misma entrega que el endpoint.
- No devolver datos clinicos no necesarios para la pantalla/rol.

## Idempotencia y concurrencia

- Crear cita, dispensar, registrar pago y publicar resultado deben resistir reintentos.
- Usar clave de idempotencia o identificador de comando para operaciones criticas.
- Evitar doble reserva con transaccion y restriccion/locking adecuado.
- Evitar doble dispensacion con control de version/estado y bloqueo de stock.
- Toda respuesta a operacion critica devuelve identificador y estado final.

## Eventos internos posibles

No requieren un broker en el MVP. Pueden implementarse como eventos de dominio dentro del monolito:

- `PatientRegistered`
- `AppointmentScheduled/Cancelled`
- `ConsultationClosed`
- `LabResultValidated`
- `PrescriptionIssued`
- `MedicationDispensed`
- `StockBelowMinimum`
- `InvoicePaid`

Las notificaciones externas deben ejecutarse despues de confirmar la transaccion o mediante una cola/outbox cuando sea necesario.

## HL7 FHIR futuro

Antes de integrar:

1. Definir sistema externo y casos de uso reales.
2. Mapear entidades locales a recursos FHIR.
3. Definir consentimiento, identificadores, terminologias y seguridad.
4. Crear pruebas de contrato.
5. Evitar contaminar el dominio central con detalles del estandar.

## Adjuntos

- Guardar metadatos y permisos en PostgreSQL.
- Guardar contenido en MinIO/S3.
- Usar nombres internos no predecibles, tipo MIME validado, hash y limite de tamaño.
- Acceso mediante backend o URL firmada de corta duracion.

**Origen documental:** informe integrado, secciones de tecnologias, integracion y seguridad; recomendaciones de estructura claramente marcadas.



---

# 13 - Seguridad, privacidad y auditoria

## Datos sensibles

- Identidad y contacto del paciente.
- Historia, antecedentes, alergias, diagnosticos y tratamientos.
- Resultados de laboratorio.
- Recetas y medicamentos dispensados.
- Informacion de facturacion/pagos.
- Credenciales, sesiones y bitacoras.

## Controles obligatorios

### Identidad y acceso

- RBAC de minimo privilegio.
- Autenticacion obligatoria.
- Contraseñas con hash robusto.
- Bloqueo por intentos fallidos.
- MFA configurable para perfiles criticos.
- Revocacion/bloqueo de usuarios y sesiones.
- Separacion entre roles clinicos, farmacia, caja, direccion y administracion tecnica.

### Comunicaciones y secretos

- HTTPS/TLS.
- Secretos fuera del codigo y repositorio.
- Configuracion por variables/secret manager.
- Cifrado de volumenes y backups cuando sea posible.
- No incluir datos clinicos en URLs, nombres de archivo o logs innecesarios.

### Auditoria

Cada evento sensible debe registrar:

- Identificador de evento.
- Usuario y roles efectivos.
- Fecha/hora.
- Accion.
- Tipo e identificador de entidad.
- Origen: IP, cliente o canal cuando corresponda.
- Resultado: exito/fallo.
- Motivo en correcciones/anulaciones.
- Referencia segura a cambios anteriores; evitar duplicar datos sensibles en texto plano.

Eventos minimos:

- Inicio/cierre de sesion y fallos.
- Consulta de historia clinica.
- Creacion/modificacion/cierre de consulta.
- Emision/anulacion de receta.
- Validacion/publicacion de resultado.
- Dispensacion y ajuste de inventario.
- Factura, pago, correccion o anulacion.
- Cambios de rol/permisos.
- Exportacion de reportes sensibles.

### Integridad clinica

- No borrar fisicamente registros clinicos cerrados.
- Versionar o anular con motivo.
- Firma/cierre logico de consultas y resultados.
- Transacciones atomicas para stock y pagos.
- Idempotencia para reintentos.

## Privacidad durante el proyecto academico

- No usar nombres reales de pacientes en encuestas, informes, commits o pruebas.
- Usar codigos para casos observados.
- Revisar historias solo con autorizacion.
- Copiar solo la informacion necesaria.
- Limitar acceso a archivos de levantamiento.
- Proteger archivos digitales y eliminarlos segun politica.
- Informar finalidad de la recopilacion.

## Amenazas consideradas

- Acceso no autorizado por cuentas compartidas.
- Exposicion de documentos fisicos o digitales.
- Alteracion o eliminacion de evidencia clinica.
- Doble ejecucion de cobros o dispensaciones.
- Inyeccion, robo de sesion y credenciales.
- Perdida de datos por falta de respaldo.
- Filtracion a traves de logs o exportaciones.
- Malware/ransomware e indisponibilidad.

## Pendientes obligatorios antes de produccion

- Norma legal de proteccion de datos y salud aplicable en Bolivia.
- Politicas de consentimiento y acceso del paciente.
- Retencion de registros clinicos y auditoria.
- Clasificacion oficial de datos.
- Procedimiento de incidente y notificacion.
- Pruebas de seguridad independientes.

**Origen documental:** V0.0.6, confidencialidad y requisitos; informe integrado, controles de seguridad, auditoria y continuidad.



---

# 14 - MVP, backlog y roadmap

## Entregas propuestas en el documento de arquitectura

| Entrega | Alcance |
|---|---|
| MVP 1 | Autenticacion, usuarios/roles, pacientes, citas e historia clinica |
| MVP 2 | Laboratorio, receta electronica, farmacia e inventario |
| MVP 3 | Facturacion, reportes gerenciales, PWA del paciente e integraciones |

**Aclaracion:** V0.0.6 considera laboratorio, farmacia, facturacion, auditoria y backups obligatorios para el sistema total. “MVP 1/2/3” debe entenderse como incrementos, no como eliminacion de los modulos obligatorios.

## Plan acelerado recomendado para un mes

### Semana 1 - Fundacion y paciente

- Monorepo, CI y entornos locales.
- Spring Boot, PostgreSQL, Flyway y estructura modular.
- React/TypeScript/Vite y shell de aplicacion.
- Autenticacion basica, roles iniciales y auditoria base.
- Registro, busqueda y deteccion de duplicados de pacientes.
- OpenAPI y pruebas de integracion.

### Semana 2 - Citas y consulta

- Especialidades, profesionales y horarios minimos.
- Programar, cancelar, reprogramar y registrar llegada.
- Historia clinica, signos vitales y consulta.
- Cierre/versionado y auditoria clinica.
- E2E: registrar paciente -> cita -> consulta.

### Semana 3 - Laboratorio y farmacia

- Orden y resultado de laboratorio.
- Receta e items.
- Medicamentos, lotes, stock y movimientos.
- Dispensacion atomica, vencimientos y stock minimo.
- E2E: consulta -> orden/resultado; consulta -> receta -> dispensacion.

### Semana 4 - Facturacion, reportes y estabilizacion

- Servicios, factura, pago y comprobante simple.
- Reportes operativos minimos.
- Backups, restauracion, monitoreo y despliegue Docker/Nginx.
- Pruebas de seguridad, concurrencia y regresion.
- Documentacion, demo y lista de pendientes.

## Backlog obligatorio inicial

1. RF-SEG-001/002/004.
2. RF-PAC-001 a 004.
3. RF-CIT-001 a 003.
4. RF-CLI-001 a 006.
5. RF-LAB-001 a 004.
6. RF-FAR-001 a 003 y RF-INV-001 a 003.
7. RF-FAC-001 a 004.
8. RNF de seguridad, integridad, auditoria, backup y pruebas.

## Posponer sin romper la arquitectura

- Compras completas y proveedores avanzados.
- PWA del paciente.
- Tableros BI complejos.
- Exportaciones avanzadas.
- FHIR productivo.
- Aplicacion movil nativa.
- IA, telemedicina y nube.

## Criterio de corte del MVP academico

Debe demostrarse un flujo integrado y auditado:

`Paciente -> Cita/Ingreso -> Consulta -> Orden/Receta -> Resultado/Dispensacion -> Factura/Pago -> Reporte`

No es aceptable una demo con modulos aislados sin datos relacionados.

**Origen documental:** informe integrado, metodologia Scrum y MVP 1-3; priorizacion de V0.0.6; plan mensual marcado como recomendacion.



---

# 15 - Estructura del monorepo

## Estructura propuesta

```text
Sistema-Integrado-de-Informacion-Hospitalaria/
├── AGENTS.md
├── README.md
├── frontend/
│   ├── CONTEXT.md
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── app/
│   │   ├── shared/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── patients/
│   │   │   ├── appointments/
│   │   │   ├── clinical/
│   │   │   ├── laboratory/
│   │   │   ├── pharmacy/
│   │   │   ├── inventory/
│   │   │   ├── billing/
│   │   │   └── reporting/
│   │   └── tests/
│   └── e2e/
├── backend/
│   ├── CONTEXT.md
│   ├── pom.xml
│   └── src/
│       ├── main/java/.../siih/
│       │   ├── security/
│       │   ├── patients/
│       │   ├── appointments/
│       │   ├── clinical/
│       │   ├── hospitalization/
│       │   ├── laboratory/
│       │   ├── pharmacy/
│       │   ├── inventory/
│       │   ├── billing/
│       │   ├── reporting/
│       │   ├── notifications/
│       │   └── shared/
│       ├── main/resources/db/migration/
│       └── test/
├── docs/
│   ├── ai-context/
│   ├── adr/
│   ├── api/
│   ├── diagrams/
│   └── decisions/
├── infra/
│   ├── docker/
│   ├── nginx/
│   ├── backup/
│   └── monitoring/
├── scripts/
├── .github/workflows/  # o .gitlab-ci.yml
├── docker-compose.yml
└── .env.example
```

## Estructura interna de un modulo backend

```text
patients/
├── domain/
│   ├── model/
│   ├── service/
│   └── repository/        # interfaces
├── application/
│   ├── command/
│   ├── query/
│   ├── usecase/
│   └── port/
├── infrastructure/
│   ├── persistence/
│   ├── storage/
│   └── integration/
└── api/
    ├── controller/
    ├── request/
    ├── response/
    └── mapper/
```

## Reglas de dependencias

- Un modulo no accede a tablas/repositorios internos de otro modulo.
- La comunicacion ocurre mediante casos de uso, interfaces o eventos internos.
- `shared` solo contiene conceptos realmente compartidos; no se convierte en un modulo comun gigante.
- Entidades JPA no cruzan la API.
- Frontend organiza por funcionalidades, no por tipo de archivo global.
- Los contratos OpenAPI y ADR viven en `docs/`.

## Convenciones de ramas y commits recomendadas

- Ramas: `feat/RF-PAC-001-registro-paciente`, `fix/RN-CIT-002-solapamiento`.
- Commit: `feat(patients): implementa RF-PAC-001`.
- Pull request: requisitos cubiertos, pruebas, migraciones, riesgos y capturas si cambia UI.

## Archivos de entorno

- `.env.example` sin secretos.
- Perfiles: local, test y prod.
- Docker Compose local con PostgreSQL y MinIO.
- Configuracion de produccion fuera del repositorio.

**Estado:** recomendacion basada en el monorepo solicitado y el monolito modular seleccionado.



---

# 16 - Pruebas, calidad y definicion de hecho

## Piramide de pruebas

### Unitarias

- Reglas de duplicidad.
- Solapamiento de citas.
- Cierre/versionado de consulta.
- Validacion de orden/resultado.
- Vigencia y estado de receta.
- Stock, lotes y vencimientos.
- Calculo de factura.
- Autorizacion de casos de uso.

Herramientas: JUnit y Mockito; React Testing Library en frontend.

### Integracion

- Repositorios JPA con PostgreSQL real mediante Testcontainers.
- Migraciones Flyway desde una base vacia.
- Transacciones de dispensacion/stock y pago.
- Auditoria generada por operaciones sensibles.
- MinIO/S3 para adjuntos.
- Seguridad del endpoint por rol.

### API/contrato

- OpenAPI valido.
- Respuestas y errores estables.
- Paginacion y filtros.
- Idempotencia de operaciones criticas.
- No exposicion de campos sensibles.

### E2E

Herramienta propuesta: Playwright.

Flujos minimos:

1. Login -> registrar/buscar paciente -> programar cita.
2. Llegada -> signos vitales -> consulta -> cierre.
3. Consulta -> orden -> resultado validado.
4. Consulta -> receta -> dispensacion -> stock actualizado.
5. Servicio/dispensacion -> factura -> pago -> comprobante.
6. Direccion -> reporte autorizado.
7. Intentos de acceso denegado por rol.

### Rendimiento y concurrencia

- Dos usuarios intentando reservar el mismo horario.
- Dos farmaceuticos intentando consumir el mismo stock.
- Reporte ejecutado mientras hay operaciones clinicas.
- Volumen de pacientes y consultas representativo; cifras pendientes.

### Seguridad

- Autorizacion horizontal y vertical.
- Bloqueo por intentos.
- Tokens expirados/revocados.
- Entradas maliciosas y archivos invalidos.
- Datos sensibles ausentes de logs.
- Auditoria no modificable por usuarios normales.

## Datos de prueba

- Solo datos sinteticos.
- Generadores reproducibles.
- No copiar historias, documentos o nombres reales.
- Casos con duplicados, alergias, resultados, lotes vencidos y stock limite.

## Definicion de Hecho

Una tarea esta terminada cuando:

- Tiene requisito y regla asociados.
- Criterios de aceptacion cumplidos.
- Codigo revisado.
- Pruebas unitarias e integracion pasan.
- E2E actualizado si afecta flujo critico.
- Migracion Flyway incluida y probada si cambia datos.
- OpenAPI actualizado si cambia API.
- Auditoria y permisos verificados.
- No contiene secretos ni datos reales.
- Documentacion/ADR actualizada.
- Pipeline CI verde.

## Evidencia de aceptacion

Cada requisito debe mapearse a una prueba en `21_matriz_de_trazabilidad.md` o en la herramienta de gestion utilizada.

**Origen documental:** herramientas de prueba seleccionadas, criterios de casos de uso y trazabilidad; estructura de calidad recomendada para implementacion.



---

# 17 - Despliegue, respaldo y continuidad

## Topologia inicial

- Navegadores de recepcion, consultorios, laboratorio, farmacia, caja y direccion.
- Nginx como proxy inverso y terminacion HTTPS.
- Aplicacion Spring Boot.
- PostgreSQL.
- MinIO/S3 para adjuntos.
- Monitoreo, alertas y repositorio de backups.

## Entorno local recomendado

Docker Compose con:

- `postgres`
- `minio`
- `backend`
- `frontend` o servidor dev separado
- `nginx` opcional en local

## Controles de despliegue

- Imagenes reproducibles y versionadas.
- Usuario no root en contenedores cuando sea viable.
- Variables de entorno/secretos fuera de imagen.
- Migraciones ejecutadas de forma controlada antes de habilitar trafico.
- Health checks para aplicacion, base y almacenamiento.
- Logs estructurados sin informacion clinica sensible.
- HTTPS/TLS y cabeceras seguras.

## Respaldo

Los documentos proponen enfoque **3-2-1**:

- 3 copias de la informacion.
- 2 medios/ubicaciones diferentes.
- 1 copia fuera del sitio principal.

Incluir:

- Backup de PostgreSQL.
- Backup/versionado de objetos MinIO.
- Copia de configuracion y migraciones.
- Cifrado y control de acceso.
- Monitoreo de exito/fallo.
- Retencion pendiente de definicion.

## Restauracion

No basta con generar backups. Debe existir una prueba periodica:

1. Preparar entorno aislado.
2. Restaurar base y objetos.
3. Verificar integridad y versiones.
4. Ejecutar casos de humo.
5. Registrar tiempo, fallos y responsable.
6. Corregir procedimiento.

## Continuidad operativa

- UPS para infraestructura critica.
- Monitoreo y alertas.
- Procedimiento manual controlado durante una interrupcion.
- Reconciliacion posterior de datos capturados manualmente.
- Comunicacion a usuarios y responsables.
- Registro del incidente y acciones correctivas.

## Decisiones pendientes

- Horario exacto de operacion.
- RPO: maxima perdida de datos tolerable.
- RTO: tiempo maximo de recuperacion.
- Alta disponibilidad o servidor unico.
- Retencion de backups.
- Ubicacion externa y responsables.
- Plan ante ransomware.

**Origen documental:** V0.0.6, disponibilidad/respaldo; informe integrado, infraestructura y controles de continuidad.



---

# 18 - Levantamiento y validacion de requisitos

## Areas a relevar

Admision, consulta externa, emergencias, hospitalizacion, enfermeria, laboratorio, farmacia, caja, administracion, compras/almacen, direccion y tecnologia.

## Tecnicas recomendadas por el material

| Tecnica | Participantes/fuentes | Resultado |
|---|---|---|
| Entrevistas semiestructuradas | Direccion, jefes, medicos, responsables y TI | Reglas, excepciones, prioridades y restricciones |
| Encuestas | Personal operativo y pacientes | Frecuencia de problemas y necesidades |
| Observacion directa | Admision, consulta, laboratorio, farmacia y caja | Tiempos, reprocesos y diferencias entre procedimiento y practica |
| Revision documental | Fichas, historias, recetas, triaje, kardex, facturas, reportes | Campos, flujos, autorizaciones y duplicidades |
| Talleres/workshops | Varias areas relacionadas | Flujos TO-BE, conflictos resueltos y criterios acordados |
| Prototipado | Usuarios de cada modulo | Validacion de datos, orden y mensajes |
| Story mapping | Equipo y usuarios clave | Dependencias y orden de entregas |
| Focus groups | Pacientes o grupos de rol | Expectativas, usabilidad y resistencia al cambio |
| Inventario tecnologico | TI | Sistemas, bases, red, equipos, backups y migracion |

## Documentos a solicitar

- Ficha de paciente e historia clinica.
- Solicitud/agenda de cita.
- Orden, receta y solicitud de laboratorio.
- Informe de resultados.
- Registro de enfermeria, hospitalizacion y alta.
- Factura/recibo y registro de caja.
- Kardex, entradas/salidas, lotes y ordenes de compra.
- Reportes mensuales y hojas de calculo.
- Manuales de procedimiento.
- Politicas de seguridad, confidencialidad y respaldo.
- Documentacion tecnica y formatos de exportacion de sistemas actuales.

## Datos que se deben confirmar por proceso

- Entradas y salidas.
- Responsable y autorizaciones.
- Secuencia real y excepciones.
- Campos obligatorios y catalogos.
- Tiempos aproximados.
- Duplicidades y controles.
- Datos compartidos con otras areas.
- Nivel de confidencialidad.
- Conservacion y posibilidad de migracion.

## Indicadores de linea base

- Tiempo de registro, cita y espera.
- Atenciones diarias.
- Registros duplicados.
- Cancelaciones/reprogramaciones.
- Tiempo de laboratorio.
- Recetas procesadas.
- Desabastecimientos y vencimientos.
- Diferencias de inventario.
- Errores de facturacion.
- Tiempo de reportes.
- Disponibilidad e incidencias tecnicas.

## Procedimiento de validacion

1. Documentar requisito con fuente, justificacion, prioridad y aceptacion.
2. Revisar individualmente con solicitante.
3. Validar en taller con areas relacionadas.
4. Probar prototipo o simulacion.
5. Resolver conflictos por responsabilidad y proceso completo.
6. Aprobar por jefe/propietario del proceso.
7. Actualizar trazabilidad y estado.

## Criterios de calidad de un requisito

Claro, necesario, realizable, verificable, no contradictorio, consistente con objetivos, compatible con restricciones y aprobado por el area responsable.

## Ficha de requisito

```text
Codigo:
Nombre:
Descripcion:
Tipo:
Area/usuario solicitante:
Fuente:
Justificacion:
Prioridad:
Reglas asociadas:
Criterios de aceptacion:
Dependencias:
Restricciones:
Estado de validacion:
Fecha:
Responsable de aprobacion:
```

**Origen documental:** V0.0.6, secciones 4 y 5; informe integrado, levantamiento e ingenieria de requisitos.



---

# 19 - Instrumentos de levantamiento

## Encuesta al personal - temas y preguntas

### Datos generales

- Area, cargo y antiguedad.
- Frecuencia de uso de computadoras/aplicaciones.

### Escala 1 a 5

Evaluar si:

- El area depende de documentos fisicos.
- La informacion se registra varias veces.
- Es dificil localizar datos del paciente.
- Los sistemas tienen datos inconsistentes/desactualizados.
- La comunicacion entre areas es lenta.
- Los errores afectan el trabajo.
- Los procesos manuales generan demoras.
- Es dificil saber quien modifico informacion.
- Los reportes tardan demasiado.
- La informacion disponible es suficiente.
- Los sistemas son faciles de usar.
- La infraestructura es adecuada.
- La proteccion de informacion y backups es suficiente.
- Un sistema unico mejoraria la eficiencia.

### Seleccion multiple

- Dificultades frecuentes: duplicidad, datos incompletos, documentos perdidos, transcripcion, fallos, red, capacitacion, coordinacion y reportes manuales.
- Informacion consultada: paciente, historia, citas, diagnosticos, recetas, resultados, medicamentos, facturacion, inventario y estadisticas.
- Funciones prioritarias: ficha unica, historia electronica, citas, consulta, laboratorio, receta, farmacia, inventario, facturacion, reportes, notificaciones, auditoria y respaldo.
- Dispositivo: escritorio, portatil, tablet o telefono.
- Capacitacion: computacion, uso del sistema, seguridad, manuales, videos y soporte.

### Preguntas abiertas

- Principal problema diario.
- Actividad que debe automatizarse primero.
- Informacion faltante.
- Riesgo principal de la implementacion.
- Recomendacion de mejora.

## Encuesta al paciente

- Primera atencion o recurrente.
- Medio de solicitud de cita.
- Repeticion de datos.
- Tiempo de registro.
- Error en fecha/hora/medico/especialidad o cita ausente.
- Tiempo de espera.
- Localizacion oportuna de historia.
- Dificultades con resultados o medicamentos.
- Utilidad de recordatorios.
- Interes en consultar citas, recetas y resultados en Internet.
- Calificacion e inconveniente principal.
- Mejora prioritaria y comentarios.

## Entrevista a jefes de area

1. Funcion y procesos diarios.
2. Participantes y responsabilidades.
3. Informacion recibida/generada y destino.
4. Formularios, documentos y aplicaciones.
5. Datos duplicados.
6. Errores, demoras y actividades en papel.
7. Problemas de intercambio con otras areas.
8. Reglas, autorizaciones y excepciones.
9. Reportes, tiempo e indicadores.
10. Informacion faltante.
11. Funciones esperadas.
12. Usuarios y niveles de acceso.
13. Informacion confidencial.
14. Riesgos de implementacion.

## Entrevista a TI

- Aplicaciones, areas, tecnologias y bases actuales.
- Integraciones y formatos de datos.
- Identidad, roles, permisos y auditoria.
- Frecuencia y pruebas de backup/restauracion.
- Fallos frecuentes.
- Capacidad de servidores, cobertura y red.
- Seguridad existente.
- Restricciones y migrabilidad.
- Documentacion tecnica.

## Observacion directa

Comprobar:

- Registro repetido y copia manual.
- Historias fisicas y hojas paralelas.
- Esperas, traslados y llamadas para confirmar.
- Formularios incompletos o formatos diferentes.
- Fallos tecnicos.
- Cuentas compartidas y documentos expuestos.
- Actualizacion inmediata del inventario.
- Control de lotes/vencimientos.
- Publicacion oportuna de resultados.
- Correspondencia entre servicios y facturacion.
- Controles de duplicidad.
- Generacion de reportes sin consolidacion manual.

## Revision documental

Para cada documento registrar nombre, area, finalidad, responsable, campos, frecuencia, copias, destino, conservacion, confidencialidad, errores, datos repetidos, digitalizacion y reglas asociadas.

**Origen documental:** V0.0.6, instrumentos completos; informe integrado, formularios resumidos.



---

# 20 - Riesgos, supuestos y decisiones pendientes

## Riesgos principales

| Riesgo | Impacto | Mitigacion inicial |
|---|---|---|
| Requisitos academicos no validados con hospital real | Alto | Talleres y firma de responsables; marcar estado de validacion |
| Alcance excesivo para el plazo | Alto | Flujo vertical integrado, MVP incremental y control de cambios |
| Datos duplicados o de mala calidad | Alto | Reglas de coincidencia, migracion piloto y proceso de fusion |
| Acceso indebido a datos clinicos | Critico | RBAC, MFA critico, auditoria, pruebas de autorizacion |
| Perdida/alteracion de informacion | Critico | Backups 3-2-1, restauracion, versionado y restricciones |
| Concurrencia en citas/stock/pagos | Alto | Transacciones, locking/versionado e idempotencia |
| Resistencia al cambio y baja capacitacion | Alto | Prototipos, usuarios clave, formacion y soporte |
| Infraestructura/red insuficiente | Alto | Inventario tecnico, pruebas de carga y plan de contingencia |
| Integraciones o migracion desconocidas | Alto | Inventario de formatos y adaptadores aislados |
| Reportes pesados afectan operacion | Medio-Alto | Consultas optimizadas, jobs/replicas futuras y limites |
| Datos sensibles en logs o ambientes de prueba | Critico | Enmascaramiento, datos sinteticos y revision automatizada |

## Supuestos actuales

- El proyecto es un caso de estudio academico.
- Habra conectividad LAN estable entre areas.
- El hospital dispone o dispondra de servidor, PostgreSQL y almacenamiento.
- Los usuarios accederan principalmente por navegador.
- El MVP se despliega como una sola aplicacion modular.
- Los datos maestros iniciales pueden definirse con catalogos simples.
- La facturacion del MVP puede ser demostrativa hasta validar reglas fiscales.

## Decisiones pendientes prioritarias

### Negocio/clinica

- Campos obligatorios y catalogos oficiales.
- Identificador de paciente y politica para personas sin documento.
- Fusion y desactivacion de duplicados.
- Tipos/estados de cita, tolerancias y sobrecupo.
- Firma/cierre, correccion y retencion clinica.
- Vigencia de recetas, sustituciones y dispensacion parcial.
- Resultados criticos y mecanismo de alerta.
- Hospitalizacion, camas, traslados y alta.

### Seguridad/legal

- Marco normativo aplicable.
- Consentimiento y acceso del paciente.
- Retencion de datos y auditoria.
- Politica de MFA, sesiones y recuperacion de cuenta.
- Procedimiento de incidentes.

### Tecnicas

- Proveedor/flujo exacto OAuth2/JWT.
- Multi-sede y zona horaria.
- RPO/RTO y disponibilidad objetivo.
- Concurrencia esperada y SLA de respuesta.
- Estrategia de reportes y exportacion.
- Formato de archivos y limites.
- Migracion desde sistemas existentes.
- Correo/SMS/WhatsApp u otro canal de notificacion.
- Criterios para integrar FHIR.

## Registro de decisiones

Cada decision debe tener un ADR en `docs/adr/` con contexto, alternativas, decision, consecuencias, fecha y responsables.

**Origen documental:** debilidades/amenazas, restricciones y preguntas de validacion; pendientes identificados al consolidar versiones.



---

# 21 - Matriz de trazabilidad

## Matriz inicial

| Problema | Requisito(s) | Modulo | Regla(s) | Prueba minima |
|---|---|---|---|---|
| Duplicidad de pacientes | RF-PAC-001/002/003 | Pacientes | RN-PAC-001/002 | Integracion: coincidencia por documento/nombre/fecha; no crear duplicado |
| Errores de citas | RF-CIT-001/002/003 | Citas | RN-CIT-001/002/003 | Concurrencia: dos reservas del mismo horario; solo una confirma |
| Historia no disponible | RF-CLI-001 | Clinica | RN-CLI-001/006 | E2E: medico autorizado consulta; rol no autorizado recibe denegacion |
| Registros clinicos alterables | RF-CLI-003/004 | Clinica | RN-CLI-003/004/005 | Cerrar y corregir; version anterior permanece |
| Ordenes/resultados aislados | RF-LAB-001/003/004 | Laboratorio | RN-LAB-001/002/003/004 | Resultado sin orden o sin validacion no se publica |
| Receta y farmacia inconsistentes | RF-CLI-006, RF-FAR-001/002 | Farmacia | RN-FAR-001/002/003 | Farmacia no edita receta; receta anulada no se dispensa |
| Descontrol de stock | RF-FAR-003, RF-INV-002/003/004 | Inventario | RN-FAR-004/005, RN-INV-001/002/003 | Transaccion: fallo revierte receta y stock; no negativo |
| Facturacion por doble digitacion | RF-FAC-001/002/003 | Facturacion | RN-FAC-001/002 | Item sin servicio registrado es rechazado |
| Falta de trazabilidad | RF-SEG-004 | Seguridad | RN-SEG-003/004 | Todas las operaciones sensibles crean evento de auditoria |
| Reportes tardios | RF-REP-001/002 | Reportes | - | Generar por periodo sin bloquear flujo clinico |
| Perdida de datos | RNF-DIS-003/005 | Infraestructura | - | Restaurar backup y ejecutar smoke tests |
| Acceso indebido | RNF-SEG-001 a 005 | Seguridad | RN-SEG-001/002 | Matriz de roles, token expirado, bloqueo y MFA critico |

## Trazabilidad por entrega

### MVP 1

- Seguridad: RF-SEG-001/002/004.
- Pacientes: RF-PAC-001 a 004.
- Citas: RF-CIT-001 a 003.
- Clinica: RF-CLI-001 a 004.

### MVP 2

- Laboratorio: RF-LAB-001 a 004.
- Receta/farmacia: RF-CLI-006, RF-FAR-001 a 003.
- Inventario: RF-INV-001 a 004.

### MVP 3

- Facturacion: RF-FAC-001 a 004.
- Reportes: RF-REP-001 a 003.
- Portal/notificaciones: RF-NOT-001, RF-POR-001.

## Campos para mantener en herramienta de gestion

- Requisito.
- Historia/caso de uso.
- Regla de negocio.
- Modulo y endpoint/pantalla.
- Migracion/tabla afectada.
- Prueba automatizada.
- Estado de validacion.
- Version/release.
- Responsable.

**Origen documental:** matriz de trazabilidad de V0.0.6 y normalizacion del catalogo consolidado.



---

# 22 - Glosario

- **Admision:** registro/identificacion del paciente y preparacion de su atencion.
- **AS-IS:** representacion del proceso actual.
- **Auditoria:** evidencia de quien hizo que, cuando, sobre que entidad y desde donde.
- **Cita:** reserva de atencion con paciente, profesional, especialidad y horario.
- **Consulta:** episodio clinico donde se registran motivo, signos, diagnostico, tratamiento y evolucion.
- **Dispensacion:** entrega de medicamentos por farmacia contra una receta valida.
- **Expediente/Historia clinica:** conjunto longitudinal de informacion clinica del paciente.
- **Ficha unica:** registro maestro unico del paciente.
- **HL7 FHIR:** estandar previsto para interoperabilidad futura en salud.
- **Idempotencia:** propiedad por la que repetir una operacion no produce duplicados ni efectos adicionales indebidos.
- **Kardex:** registro de movimientos y saldo de inventario.
- **Lote:** conjunto de medicamento con codigo y fecha de vencimiento comunes.
- **MFA:** autenticacion con mas de un factor.
- **Monolito modular:** aplicacion unica desplegable con modulos internos y limites claros.
- **Orden de laboratorio:** solicitud de uno o mas examenes vinculada a consulta, paciente y medico.
- **PWA:** aplicacion web instalable con experiencia adaptada a dispositivos moviles.
- **RBAC:** control de acceso basado en roles.
- **Receta electronica:** prescripcion digital emitida por medico y vinculada a consulta.
- **RPO:** perdida maxima de datos tolerable medida en tiempo.
- **RTO:** tiempo maximo tolerable para recuperar el servicio.
- **SIIH:** Sistema Integrado de Informacion Hospitalaria.
- **Stock:** cantidad disponible de un medicamento, idealmente por lote y ubicacion.
- **TO-BE:** proceso objetivo propuesto.
- **Trazabilidad:** relacion verificable entre problema, requisito, implementacion, cambio y prueba.
- **Triaje:** clasificacion inicial de prioridad clinica, especialmente en emergencias.
- **UPS:** sistema de alimentacion ininterrumpida.



---

# 23 - Fuentes y control de cambios

## Fuentes consumidas

### 1. V0.0.6.docx

Aporte principal:

- Problema, causas y consecuencias.
- Plan detallado de levantamiento.
- Encuestas, entrevistas y observacion.
- 25 requisitos funcionales.
- Requisitos no funcionales por categoria.
- 15 reglas de negocio preliminares.
- Historias de usuario y criterios.
- Priorizacion, validacion y trazabilidad.

Es la fuente mas completa para requisitos y elicitacion.

### 2. SIIH_Hospital_San_Andres.0.01.docx

Aporte principal:

- Informe integrado y modelos AS-IS/TO-BE.
- Stakeholders, RF-01 a RF-12 y RNF-01 a RNF-10.
- UML y casos de uso prioritarios.
- Monolito modular y arquitectura limpia/hexagonal.
- React/TypeScript/Vite, Java 21/Spring Boot, PostgreSQL, MinIO, Docker/Nginx y pruebas.
- MVP 1 a 3 y estrategia de evolucion.

Es la fuente preferente para arquitectura y tecnologias.

### 3. SIIH_Hospital_San_Andres_Documento_Completo.pdf

Aporte principal:

- Version visual de 24 paginas, mayormente duplicada con el DOCX integrado.
- Verificacion de diagramas de servicios, BPMN, UML, modelo TO-BE y arquitectura por capas.

La version PDF es menos detallada en tecnologia que el DOCX y parece anterior.

## Discrepancias detectadas

- Los indices de algunas versiones conservan numeros de pagina que no coinciden con la longitud real.
- El PDF termina con una arquitectura generica; el DOCX agrega decisiones mas especificas y se toma como version mas reciente.
- El diagrama de actores contiene etiquetas corruptas/no pertinentes; se excluyeron.
- Los documentos alternan “Sistema de Informacion para la Gestion Integral...” y “Sistema Integrado...”; se normalizo a SIIH.
- El material describe metas y procesos como caso de estudio; no presenta actas de validacion real.
- “MVP 1/2/3” y “requisitos obligatorios” no se contradicen si se interpretan como incrementos sucesivos.

## Regla de precedencia

1. Reglas y requisitos detallados de V0.0.6.
2. Arquitectura y tecnologias del DOCX integrado.
3. PDF como confirmacion visual, no como fuente principal cuando difiere.
4. Recomendaciones de este paquete siempre deben aparecer marcadas como recomendadas/derivadas.

## Control de cambios del paquete

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 2026-07-16 | Consolidacion inicial de los tres documentos; IDs normalizados y contexto para monorepo. |

## Como actualizar

- No sobrescribir requisitos validados sin registrar decision.
- Actualizar `21_matriz_de_trazabilidad.md` al cambiar requisitos.
- Crear ADR para cambios de arquitectura.
- Marcar estado: propuesto, validado, implementado, probado o descartado.
- Conservar referencia al documento/actor que origina el cambio.
