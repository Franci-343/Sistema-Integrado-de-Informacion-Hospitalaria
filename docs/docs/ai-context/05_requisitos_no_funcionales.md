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
