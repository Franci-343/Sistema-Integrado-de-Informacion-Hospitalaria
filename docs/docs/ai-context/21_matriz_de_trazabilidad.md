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
