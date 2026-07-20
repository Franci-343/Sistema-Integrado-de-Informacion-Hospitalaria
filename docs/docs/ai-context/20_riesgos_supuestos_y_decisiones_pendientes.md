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
