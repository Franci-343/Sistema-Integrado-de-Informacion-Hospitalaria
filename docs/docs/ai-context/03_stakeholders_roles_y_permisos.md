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
