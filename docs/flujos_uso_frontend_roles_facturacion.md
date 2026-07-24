# Flujos de uso del frontend, roles e interaccion entre modulos

## 1. Proposito del sistema

El **SIIH - Sistema Integrado de Informacion Hospitalaria** es una aplicacion web orientada a centralizar procesos clinicos, administrativos y operativos de un hospital universitario.

Desde el frontend, el sistema permite que cada area trabaje con la informacion que necesita: admision registra pacientes y citas, el personal clinico atiende y registra evolucion, enfermeria realiza triaje e internacion, laboratorio procesa ordenes, farmacia gestiona recetas e inventario, caja factura servicios y administracion controla usuarios, roles y auditoria.

El principio principal del sistema es que **cada usuario ve y ejecuta acciones segun su rol**. Esto permite demostrar un flujo hospitalario mas realista: no todos los usuarios tienen las mismas pantallas, y no todas las pantallas permiten escribir o modificar informacion.

## 2. Entrada al sistema

El flujo inicia en la pantalla publica del SIIH.

El usuario puede:

- Iniciar sesion con una cuenta existente.
- Crear una cuenta academica para pruebas locales.

La creacion de cuenta academica existe porque el proyecto es de evaluacion. En un hospital real, las cuentas normalmente se crean desde administracion o desde un sistema institucional de identidad.

Al crear una cuenta desde el login se solicita:

- Nombre.
- Apellido.
- Usuario.
- Correo opcional.
- Rol.
- Contrasena.
- Confirmacion de contrasena.

Luego de crear la cuenta, el frontend inicia sesion automaticamente y muestra los modulos permitidos por el rol elegido.

## 3. Roles principales del sistema

### Recepcion y admision

Rol orientado al primer contacto con el paciente.

Puede trabajar principalmente con:

- Inicio.
- Pacientes.
- Agenda y citas.
- Lectura de informacion clinica basica, si tiene permiso.
- Reportes visibles para su rol.

Responsabilidad en el flujo:

- Registrar pacientes.
- Actualizar datos administrativos.
- Programar citas.
- Marcar llegada del paciente.
- Cancelar o reprogramar citas cuando corresponda.

### Personal medico

Rol orientado a la atencion clinica.

Puede trabajar principalmente con:

- Agenda.
- Pacientes.
- Historia clinica.
- Triaje en lectura.
- Hospitalizacion.
- Laboratorio.
- Farmacia en lectura.
- Reportes.

Responsabilidad en el flujo:

- Revisar la agenda.
- Atender consultas.
- Registrar motivo, evolucion y recomendaciones.
- Solicitar ordenes de laboratorio.
- Emitir recetas.
- Crear ordenes de internacion cuando el paciente requiere hospitalizacion.

### Enfermeria

Rol orientado a triaje, signos vitales y seguimiento de pacientes.

Puede trabajar principalmente con:

- Pacientes.
- Agenda en lectura.
- Historia clinica en lectura.
- Triaje.
- Hospitalizacion.
- Reportes.

Responsabilidad en el flujo:

- Registrar triaje.
- Cargar signos vitales.
- Registrar notas de enfermeria en hospitalizacion.
- Apoyar el seguimiento del paciente internado.

### Laboratorio clinico

Rol orientado a pruebas de laboratorio.

Puede trabajar principalmente con:

- Pacientes en lectura.
- Historia clinica en lectura.
- Laboratorio.
- Reportes.

Responsabilidad en el flujo:

- Ver ordenes solicitadas por el medico.
- Recibir muestra.
- Procesar prueba.
- Cargar resultado.
- Validar y publicar resultado.

### Farmacia

Rol orientado a recetas, medicamentos e inventario.

Puede trabajar principalmente con:

- Pacientes en lectura.
- Historia clinica en lectura.
- Farmacia.
- Inventario.
- Reportes.

Responsabilidad en el flujo:

- Revisar recetas emitidas.
- Dispensar medicamentos.
- Controlar stock.
- Registrar movimientos de inventario.
- Vigilar lotes y vencimientos.

### Caja y facturacion

Rol orientado al cobro de servicios.

Puede trabajar principalmente con:

- Pacientes en lectura.
- Facturacion.
- Reportes.

Responsabilidad en el flujo:

- Registrar cargos facturables.
- Crear facturas a partir de cargos pendientes.
- Emitir facturas.
- Registrar pagos.
- Controlar saldos pendientes.

### Direccion

Rol orientado a consulta de indicadores.

Puede trabajar principalmente con:

- Inicio.
- Reportes.
- Lectura de algunos modulos operativos.
- Auditoria en lectura, segun permisos.

Responsabilidad en el flujo:

- Revisar indicadores.
- Analizar demanda, citas, facturacion y actividad general.
- Apoyar decisiones administrativas y clinicas.

### Administrador del sistema

Rol orientado a seguridad e identidad.

Puede trabajar con:

- Todos los modulos.
- Administracion.
- Usuarios.
- Profesionales.
- Roles y permisos.
- Auditoria.

Responsabilidad en el flujo:

- Crear cuentas institucionales.
- Editar datos de usuarios.
- Asignar roles.
- Bloquear o desactivar cuentas.
- Crear profesionales habilitados para agenda.
- Revisar eventos de auditoria.

## 4. Flujo general de uso entre roles

El sistema se puede defender como un flujo encadenado:

1. **Admision registra al paciente**.
2. **Admision programa una cita** con especialidad, profesional, fecha y hora.
3. **Recepcion marca la llegada** cuando el paciente se presenta.
4. **Enfermeria registra triaje** con signos vitales y prioridad.
5. **El medico atiende** y registra la consulta en historia clinica.
6. **El medico solicita laboratorio** si necesita examenes.
7. **Laboratorio procesa y publica resultados**.
8. **El medico revisa resultados** y puede emitir receta o recomendar internacion.
9. **Farmacia dispensa medicamentos** y afecta inventario.
10. **Hospitalizacion admite al paciente** si existe una orden de internacion.
11. **Enfermeria registra notas de seguimiento** durante la internacion.
12. **El medico o personal autorizado registra el alta**.
13. **Caja registra cargos y cobra servicios**.
14. **Administracion controla usuarios, permisos y auditoria**.

Este encadenamiento muestra que los roles no trabajan aislados. Cada area alimenta informacion que otra area puede necesitar.

## 5. Flujo de admision y agenda

### Registro de paciente

El usuario de admision entra a **Pacientes**.

Acciones principales:

- Buscar pacientes existentes.
- Registrar un nuevo paciente.
- Editar datos administrativos.

Resultado del flujo:

- El paciente queda disponible para agenda, historia clinica, triaje, hospitalizacion, farmacia y facturacion.

### Programacion de cita

El usuario entra a **Agenda y citas**.

Acciones principales:

- Seleccionar paciente.
- Seleccionar especialidad.
- Seleccionar profesional.
- Definir fecha y hora.
- Registrar motivo.
- Confirmar cita.

Interaccion con otros roles:

- El medico ve la cita en su contexto de atencion.
- Enfermeria puede usar la informacion para triaje.
- Caja puede generar cargos si el servicio es facturable.

## 6. Flujo de atencion clinica

El medico entra a **Historia clinica**.

Acciones principales:

- Seleccionar paciente.
- Revisar antecedentes y consultas previas.
- Iniciar consulta.
- Relacionar la consulta con una cita, si corresponde.
- Registrar motivo, evolucion y recomendaciones.

Interaccion con otros roles:

- Admision aporta los datos iniciales del paciente.
- Enfermeria aporta signos vitales desde triaje.
- Laboratorio aporta resultados.
- Farmacia recibe recetas emitidas.
- Hospitalizacion recibe ordenes de internacion si el paciente requiere cama.

## 7. Flujo de triaje

Enfermeria entra a **Triaje**.

Acciones principales:

- Seleccionar paciente.
- Registrar prioridad.
- Registrar temperatura, presion, frecuencia cardiaca, frecuencia respiratoria, saturacion, peso y talla.
- Agregar observaciones.

Resultado del flujo:

- El medico puede revisar informacion inicial antes de la consulta.
- El hospital puede priorizar la atencion.

## 8. Flujo de hospitalizacion

El modulo de **Hospitalizacion** funciona como un proceso secuencial.

### Orden de internacion

El medico o usuario autorizado crea una orden de internacion.

Datos principales:

- Origen de la atencion.
- Profesional responsable.
- Motivo de internacion.
- Diagnostico presuntivo.
- Servicio de destino.

### Admision hospitalaria

Luego se admite al paciente.

Datos principales:

- Orden de internacion.
- Cama disponible.
- Motivo de admision si corresponde.

Resultado:

- La cama cambia de disponibilidad.
- El paciente aparece como hospitalizado.

### Seguimiento de enfermeria

Enfermeria registra notas durante la estadia.

Datos posibles:

- Temperatura.
- Presion.
- Frecuencia cardiaca.
- Frecuencia respiratoria.
- Saturacion de oxigeno.
- Glucosa.
- Peso.
- Nota de evolucion.

### Alta hospitalaria

El usuario autorizado registra el alta.

Datos principales:

- Diagnostico de alta.
- Tipo de alta.
- Instrucciones.
- Plan de seguimiento.
- Medicamentos al alta.

Resultado:

- La hospitalizacion queda cerrada.
- La cama puede volver a estar disponible.
- La informacion queda asociada al historial del paciente.

## 9. Flujo de laboratorio

El laboratorio interactua con ordenes generadas desde la atencion clinica.

Secuencia de uso:

1. El medico crea una orden de laboratorio.
2. Laboratorio ve la orden pendiente.
3. Laboratorio recibe la muestra.
4. Laboratorio inicia el procesamiento.
5. Laboratorio carga resultados.
6. Laboratorio valida resultados.
7. Laboratorio publica resultados.
8. El medico consulta los resultados publicados.

Importancia del flujo:

- Evita resultados sin orden.
- Permite rastrear el estado de la solicitud.
- Separa solicitud clinica de procesamiento tecnico.

## 10. Flujo de farmacia e inventario

Farmacia trabaja principalmente con recetas e inventario.

Secuencia de uso:

1. El medico emite una receta.
2. Farmacia revisa recetas pendientes.
3. Farmacia dispensa medicamento.
4. El stock se actualiza.
5. Inventario permite revisar existencias, lotes y vencimientos.

Interaccion con otros roles:

- El medico genera la receta.
- Farmacia entrega medicamentos.
- Direccion puede consultar reportes.
- Caja puede facturar servicios o productos si estan configurados como cargos.

## 11. Flujo detallado de facturacion

La facturacion se maneja desde el modulo **Facturacion** y representa el trabajo de caja.

El objetivo del modulo es convertir prestaciones hospitalarias en documentos de cobro y registrar pagos.

### 11.1 Conceptos principales

**Cargo**

Un cargo es una prestacion facturable pendiente de incluir en una factura.

Ejemplos:

- Consulta externa.
- Prueba de laboratorio.
- Medicamento.
- Servicio hospitalario.

**Factura**

Una factura agrupa uno o varios cargos de un paciente. Primero se crea como borrador y luego se emite.

**Pago**

Un pago registra el dinero recibido contra una factura emitida. Puede cubrir toda la factura o solo una parte.

### 11.2 Registrar cargo

El cajero entra a **Facturacion** y presiona **Cargo**.

Datos solicitados:

- Paciente.
- Servicio facturable.
- Cantidad.

Resultado:

- Se crea un cargo con estado pendiente.
- El cargo queda disponible para ser incluido en una factura.

Interaccion con otros roles:

- Admision crea el paciente.
- Laboratorio, farmacia o clinica pueden originar servicios.
- Caja formaliza el cobro mediante el cargo.

### 11.3 Crear factura

El cajero presiona **Nueva factura**.

Condicion:

- Debe existir al menos un cargo pendiente.

Datos solicitados:

- Paciente.
- Cargos a incluir.
- Descuento.
- Impuesto.

Resultado:

- Se crea una factura en estado **borrador**.
- Los cargos seleccionados quedan asociados a esa factura.

Por que se crea en borrador:

- Permite revisar total, descuentos e impuestos antes de emitir.
- Evita emitir documentos definitivos por error.

### 11.4 Emitir factura

Cuando la factura esta en borrador, el frontend muestra la accion **Emitir**.

Resultado:

- La factura pasa a estado emitido.
- Desde ese momento puede cobrarse.

Explicacion para defensa:

> Separar crear y emitir factura permite simular un proceso administrativo mas realista: primero se arma el documento, luego se confirma oficialmente.

### 11.5 Registrar pago

Cuando la factura esta emitida o parcialmente pagada, el frontend muestra la accion **Cobrar**.

Datos solicitados:

- Monto.
- Metodo de pago.

Metodos disponibles:

- Efectivo.
- Tarjeta.
- Transferencia.
- QR.
- Otro.

Reglas visibles en el frontend:

- El monto debe ser mayor a cero.
- El monto no puede superar el saldo de la factura.

Resultado:

- Si el pago cubre todo el saldo, la factura queda pagada.
- Si el pago cubre solo una parte, la factura queda parcialmente pagada.
- El saldo pendiente se actualiza.

### 11.6 Estados importantes en facturacion

Estados esperados:

- Cargo pendiente: cargo creado y todavia no facturado.
- Factura borrador: factura creada, pero no emitida.
- Factura emitida: factura confirmada y lista para cobro.
- Factura parcialmente pagada: tiene pagos, pero aun queda saldo.
- Factura pagada: el saldo llego a cero.

### 11.7 Como defender facturacion

Frase sugerida:

> El modulo de facturacion no cobra directamente desde una cita. Primero registra cargos facturables, luego agrupa esos cargos en una factura, despues emite la factura y finalmente registra el pago. Esto separa la prestacion, el documento de cobro y la transaccion economica.

Otra frase util:

> Caja no modifica la historia clinica ni registra diagnosticos. Solo trabaja con pacientes, cargos, facturas y pagos. Esa separacion respeta responsabilidades por rol.

## 12. Flujo de administracion

El administrador entra a **Administracion**.

Puede trabajar en cuatro areas:

- Usuarios.
- Profesionales.
- Roles y permisos.
- Auditoria.

### Usuarios

Permite:

- Crear cuenta institucional.
- Editar cuenta.
- Asignar roles.
- Bloquear cuenta.
- Desactivar cuenta.
- Activar cuenta.

Nota importante:

> En este sistema no se recomienda eliminar fisicamente usuarios, porque se perderia trazabilidad. Para fines hospitalarios es mejor bloquear o desactivar.

### Profesionales

Permite crear profesionales que luego aparecen en agenda.

Datos importantes:

- Usuario.
- Nombre y apellido.
- Matricula.
- Tipo profesional.
- Especialidades.

Interaccion:

- Agenda necesita profesionales habilitados para programar citas.
- Historia clinica necesita profesionales para registrar atenciones.

### Roles y permisos

Permite revisar que permisos tiene cada rol.

Esto explica por que:

- Recepcion ve pacientes y agenda.
- Medico ve historia clinica y puede solicitar laboratorio.
- Enfermeria registra triaje.
- Caja ve facturacion.
- Administrador ve seguridad y auditoria.

### Auditoria

Permite consultar eventos del sistema.

Filtros principales:

- Usuario.
- Accion.
- Entidad.
- Origen.
- Resultado.
- Rango de fechas.

Importancia:

- Permite saber quien hizo que accion.
- Permite detectar errores o intentos fallidos.
- Permite justificar trazabilidad en operaciones sensibles.

## 13. Interaccion entre roles por escenario

### Escenario 1: paciente nuevo con cita

1. Recepcion registra paciente.
2. Recepcion agenda cita.
3. Enfermeria registra triaje.
4. Medico atiende y registra consulta.
5. Caja registra cargo por consulta.
6. Caja factura y cobra.

### Escenario 2: consulta con laboratorio

1. Medico atiende al paciente.
2. Medico crea orden de laboratorio.
3. Laboratorio recibe muestra.
4. Laboratorio procesa y publica resultado.
5. Medico revisa resultado.
6. Caja puede registrar cargo por prueba de laboratorio.

### Escenario 3: receta y farmacia

1. Medico emite receta.
2. Farmacia revisa receta.
3. Farmacia dispensa medicamento.
4. Inventario actualiza existencias.
5. Caja puede registrar cargo si el medicamento o servicio es facturable.

### Escenario 4: internacion

1. Medico genera orden de internacion.
2. Hospitalizacion admite paciente en cama disponible.
3. Enfermeria registra notas.
4. Medico define alta.
5. Caja registra cargos asociados a servicios hospitalarios.
6. Caja factura y cobra.

### Escenario 5: gestion administrativa

1. Administrador crea un profesional.
2. Ese profesional aparece disponible para agenda.
3. Recepcion programa cita con ese profesional.
4. El profesional atiende al paciente.
5. Auditoria registra eventos relevantes.

## 14. Recomendacion para explicar el frontend en defensa

Una forma clara de defender el frontend es decir:

> El frontend no esta organizado como paginas independientes, sino como un flujo hospitalario por roles. Cada rol inicia donde corresponde, realiza acciones concretas y deja informacion disponible para el siguiente rol. Por ejemplo, admision crea paciente y cita, enfermeria registra triaje, el medico atiende, laboratorio procesa examenes, farmacia dispensa medicamentos, caja factura y administracion controla permisos y auditoria.

Tambien se puede cerrar con:

> Para un proyecto academico, el sistema demuestra autenticacion, autorizacion por roles, consumo de API, formularios, tablas, filtros, estados de proceso y trazabilidad. La facturacion cierra el circuito operativo porque convierte las prestaciones realizadas en cargos, facturas y pagos.
