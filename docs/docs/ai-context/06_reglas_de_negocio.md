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
