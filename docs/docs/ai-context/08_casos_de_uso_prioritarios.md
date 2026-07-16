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
