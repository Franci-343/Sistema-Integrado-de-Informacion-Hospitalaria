# Guion de defensa del frontend - SIIH

## 1. Contexto inicial del proyecto

Buenos dias/tardes. El proyecto que presentamos es el **SIIH, Sistema Integrado de Informacion Hospitalaria**, desarrollado para un hospital universitario en un entorno academico.

Su objetivo es **centralizar la informacion clinica, administrativa y operativa del hospital** para que las areas de admision, agenda, atencion clinica, triaje, hospitalizacion, laboratorio, farmacia, caja, reportes y administracion trabajen sobre una misma fuente de datos.

El sistema esta pensado para reducir registros aislados, evitar duplicidad de informacion y mostrar a cada usuario solo los modulos que corresponden a su rol. Por eso el frontend no es solamente una pantalla visual: tambien representa el flujo de trabajo del hospital mediante permisos, formularios, tablas, filtros, estados y acciones controladas.

## 2. Inicio de la demostracion

Primero abrimos la pantalla principal del sistema. Desde ahi mostramos que el SIIH se presenta como una plataforma institucional para el **Hospital Universitario San Andres**.

Luego ingresamos a la opcion **Ingresar al sistema**. En esta pantalla se observa un login institucional simple, sin selector de modo de prueba, porque decidimos mantenerlo mas realista para la defensa. Aun asi, como es un proyecto academico, se habilito una opcion controlada para crear una cuenta local de prueba.

## 3. Crear una cuenta academica desde el login

En la pantalla de acceso hacemos clic en **Crear cuenta academica**.

Explicacion para el docente:

> Como el sistema sera evaluado en un entorno academico y no en produccion, incorporamos un registro local. En un hospital real esta alta la haria TI o administracion, pero para la defensa permite crear usuarios sin depender de una cuenta previamente cargada.

En el formulario completamos:

- Nombre y apellido.
- Usuario, por ejemplo `juan.perez`.
- Correo opcional, por ejemplo `juan.perez@hospital.local`.
- Rol inicial.
- Contrasena de al menos 8 caracteres.
- Confirmacion de contrasena.

Para una primera demostracion se recomienda crear un usuario con rol **Admision y recepcion**, porque permite explicar el circuito inicial de un paciente.

Al presionar **Crear cuenta**, el sistema crea la cuenta en el backend, asigna el rol seleccionado e inicia sesion automaticamente. Esto demuestra que el frontend esta conectado al flujo real de autenticacion y no solo muestra pantallas estaticas.

## 4. Recorrido con usuario operativo

Ya dentro del sistema, explicamos:

> El menu lateral cambia segun los permisos del usuario. No todos ven todo. Por ejemplo, una cuenta de admision puede trabajar con pacientes y agenda, pero no deberia administrar usuarios ni manipular configuraciones sensibles.

### Pantalla Inicio

En **Inicio** se muestran indicadores generales como pacientes activos, citas activas y resumen operativo. Esta vista sirve como tablero rapido para que el usuario entienda el estado del hospital.

### Modulo Pacientes

Entramos a **Pacientes**.

Aqui explicamos:

> Este modulo permite consultar la ficha unica del paciente. En admision tambien permite registrar o actualizar datos basicos, evitando que cada area cree su propia lista de pacientes.

Accion sugerida:

1. Presionar el boton para crear o registrar paciente.
2. Completar los datos principales.
3. Guardar.
4. Mostrar que el paciente aparece en la tabla.

Punto importante para defender:

> El frontend valida campos obligatorios y envia la informacion al backend. El paciente queda disponible para agenda, historia clinica, facturacion y otros modulos.

### Modulo Agenda

Entramos a **Agenda**.

Aqui explicamos:

> La agenda permite programar citas relacionando paciente, especialidad, profesional, fecha y hora. Esto evita que la cita sea solo texto libre; queda vinculada a datos existentes.

Accion sugerida:

1. Crear una nueva cita.
2. Seleccionar el paciente creado.
3. Seleccionar especialidad y profesional.
4. Indicar fecha, hora y motivo.
5. Confirmar la cita.

Despues mostramos que la cita aparece en la lista. Tambien se puede marcar llegada o cancelar una cita si el rol tiene permiso.

### Historia clinica

Entramos a **Historia clinica** si el usuario tiene permiso de lectura.

Explicacion:

> La historia clinica consolida antecedentes y consultas del paciente. El objetivo no es duplicar la ficha de admision, sino mostrar la continuidad de atencion.

Si se usa un usuario medico, se puede iniciar una consulta indicando profesional, cita relacionada, motivo, evolucion y recomendaciones.

### Triaje y Hospitalizacion

Si el usuario tiene permisos de enfermeria o medico, mostramos **Triaje** y **Hospitalizacion**.

En triaje:

> Se registran signos vitales y prioridad de atencion. Esto ayuda a ordenar la atencion inicial.

En hospitalizacion:

> El sistema maneja una secuencia mas realista: primero existe una orden de internacion, luego se admite al paciente en una cama disponible, se registran notas de enfermeria y finalmente se da el alta.

Accion sugerida para hospitalizacion:

1. Crear una orden de internacion desde un origen disponible.
2. Admitir al paciente seleccionando una cama.
3. Registrar una nota de enfermeria.
4. Registrar alta hospitalaria con diagnostico, tipo de alta e instrucciones.

Punto importante:

> Este flujo fue alineado con los documentos del modulo de internados: no se interna directamente sin orden, y las camas cambian de estado segun el proceso.

### Laboratorio, Farmacia y Facturacion

Estos modulos se pueden presentar como vistas operativas:

- **Laboratorio**: consulta ordenes, pruebas solicitadas y resultados.
- **Farmacia**: consulta recetas, medicamentos, stock e inventario.
- **Facturacion**: registra cargos, crea facturas y gestiona pagos.

Explicacion:

> Cada modulo representa un area del hospital. El frontend permite ver informacion consolidada y ejecutar acciones solo cuando el rol tiene permiso de escritura.

## 5. Cerrar sesion e ingresar como administrador

Despues del recorrido operativo, cerramos sesion desde el menu del usuario.

Luego iniciamos sesion como administrador.

Si la base de datos esta cargada con los datos semilla del proyecto, se puede usar:

- Usuario: `admin`
- Contrasena: `password`

Explicacion:

> Ahora ingresamos como administrador para mostrar la diferencia entre un usuario operativo y un usuario con permisos de seguridad. El administrador no atiende pacientes necesariamente; su funcion principal es gestionar identidad, roles y auditoria.

## 6. Recorrido como administrador

### Vista general de administracion

Entramos al modulo **Administracion**.

Explicacion:

> Esta vista concentra la gestion de cuentas institucionales, profesionales, roles y auditoria. Es importante porque el sistema controla que cada usuario tenga permisos acordes a su responsabilidad.

Se muestran metricas como:

- Usuarios registrados.
- Profesionales clinicos.
- Cuentas activas.
- Cuentas bloqueadas o inactivas.
- Eventos de auditoria consultados.

### Pestana Usuarios

En **Usuarios**, el administrador puede:

- Buscar usuarios por nombre, usuario, correo o rol.
- Filtrar por estado: activo, inactivo o bloqueado.
- Crear una cuenta institucional.
- Editar datos de una cuenta.
- Asignar o modificar roles.
- Bloquear, desactivar o activar cuentas.

Accion sugerida:

1. Presionar **Nuevo usuario**.
2. Completar usuario, nombre, apellido y contrasena.
3. Seleccionar uno o mas roles iniciales.
4. Guardar.

Explicacion para crear:

> La creacion desde administracion es mas completa que la cuenta academica del login, porque permite asignar roles institucionales de forma controlada.

Sobre eliminar usuarios:

> En el sistema no hacemos eliminacion fisica de usuarios desde el frontend, porque en un sistema hospitalario se debe conservar trazabilidad. Lo correcto es **desactivar** o **bloquear** una cuenta. Asi se impide el acceso, se revocan sesiones y se mantiene el historial para auditoria.

Accion sugerida para "eliminar" de forma segura:

1. Seleccionar una cuenta que no sea la del administrador actual.
2. Presionar **Desactivar cuenta**.
3. Confirmar.
4. Mostrar que cambia a estado inactivo.

### Pestana Profesionales

En **Profesionales**, el administrador puede crear perfiles clinicos que luego aparecen en agenda.

Accion sugerida:

1. Presionar **Crear doctor** o **Nuevo doctor**.
2. Completar usuario, datos personales, matricula, tipo profesional y especialidad.
3. Guardar.

Explicacion:

> Este paso es importante porque una cita medica necesita un profesional habilitado. No basta con crear un usuario; tambien debe existir su perfil profesional y su especialidad.

### Pestana Roles y permisos

En **Roles y permisos**, mostramos la matriz de permisos.

Explicacion:

> Aqui se puede demostrar que el sistema no depende solo de esconder botones. Los roles estan asociados a permisos como lectura o escritura sobre pacientes, agenda, clinica, hospitalizacion, laboratorio, farmacia, facturacion, reportes y administracion.

Punto para defender:

> Un usuario de caja no deberia crear consultas clinicas, y un usuario de enfermeria no deberia administrar cuentas. Esa separacion es parte del realismo del sistema.

### Pestana Auditoria

En **Auditoria**, el administrador puede revisar eventos del sistema.

Accion sugerida:

1. Filtrar por usuario, por ejemplo `admin` o el usuario creado.
2. Filtrar por accion, entidad o rango de fechas.
3. Aplicar filtros.
4. Mostrar eventos correctos y fallidos.

Explicacion:

> La auditoria permite ver quien hizo una accion, sobre que entidad, cuando ocurrio y si fue correcta o fallida. Esto es clave en sistemas hospitalarios porque las operaciones sensibles deben ser rastreables.

## 7. Cierre de la defensa

Para cerrar, se puede decir:

> En resumen, el frontend del SIIH permite demostrar un flujo hospitalario integrado: se crea o ingresa un usuario, se muestran modulos segun permisos, se registra informacion operativa y clinica, y el administrador puede controlar cuentas, roles, profesionales y auditoria. Para un proyecto academico, el sistema es funcional porque cubre autenticacion, control de acceso, operaciones principales y trazabilidad, sin depender de datos reales de pacientes.

## 8. Ruta recomendada para la exposicion

Orden sugerido para no perder tiempo:

1. Presentar contexto del SIIH.
2. Crear cuenta academica desde login.
3. Mostrar Inicio.
4. Registrar paciente.
5. Crear cita.
6. Mostrar brevemente historia clinica, triaje u hospitalizacion segun permisos.
7. Cerrar sesion.
8. Ingresar como `admin`.
9. Mostrar usuarios, crear usuario y desactivar cuenta.
10. Mostrar profesionales.
11. Mostrar roles y permisos.
12. Mostrar auditoria.
13. Cerrar con el objetivo del sistema y su valor academico.

## 9. Frases utiles si el docente pregunta

**Por que hay registro desde el login si en un hospital real no seria publico?**

Porque el proyecto es academico. Se habilito para facilitar la defensa y las pruebas locales. En un entorno real esa funcionalidad se reemplazaria por alta administrativa o integracion con identidad institucional.

**Por que no se elimina un usuario?**

Porque en sistemas con auditoria es mejor desactivar o bloquear. Eliminar fisicamente una cuenta puede romper trazabilidad historica.

**Que demuestra el frontend ademas de pantallas?**

Demuestra flujos: autenticacion, permisos por rol, formularios validados, consumo de API, tablas, filtros, estados de procesos y acciones administrativas.

**Que diferencia hay entre usuario normal y administrador?**

El usuario normal ve modulos operativos segun su rol. El administrador ve seguridad, usuarios, profesionales, roles y auditoria.

**El sistema usa datos reales?**

No. Para la defensa se deben usar datos sinteticos o academicos, nunca datos reales de pacientes.
