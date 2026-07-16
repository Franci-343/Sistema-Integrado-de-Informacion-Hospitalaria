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
