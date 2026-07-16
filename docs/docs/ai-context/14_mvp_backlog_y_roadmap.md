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
