# 11 - Arquitectura y tecnologias

## Estilo seleccionado

**Monolito modular**: una aplicacion desplegable, separada internamente por dominios. Se elige por menor complejidad operativa, consistencia transaccional y adecuacion a un equipo academico con plazo corto.

No se deben crear dependencias directas arbitrarias entre modulos. Cada modulo expone interfaces/casos de uso y protege sus invariantes.

## Capas internas

1. **Presentacion/API:** controladores, DTO, validacion de entrada y contratos OpenAPI.
2. **Aplicacion:** casos de uso, orquestacion, autorizacion contextual y transacciones.
3. **Dominio:** entidades, value objects, servicios y reglas.
4. **Adaptadores:** PostgreSQL/JPA, MinIO, notificaciones, reloj, integraciones.

Regla: las capas internas no dependen de frameworks externos; infraestructura depende de aplicacion/dominio, no al reves.

## Modulos del backend

- `security`
- `patients`
- `appointments`
- `clinical`
- `emergency-hospitalization`
- `laboratory`
- `pharmacy`
- `inventory-procurement`
- `billing`
- `reporting`
- `notifications`
- `document-storage`
- `shared-kernel` reducido

## Stack seleccionado en los documentos

| Capa | Tecnologia | Uso |
|---|---|---|
| Frontend | React + TypeScript + Vite | Formularios, agendas, historia, tableros y PWA |
| Backend | Java 21 LTS + Spring Boot | API, casos de uso, reglas y transacciones |
| Seguridad | Spring Security + OAuth2/JWT + RBAC | Autenticacion, permisos, sesiones, bloqueo y auditoria |
| Persistencia | PostgreSQL + Spring Data JPA + Flyway | Datos transaccionales, integridad y migraciones |
| Documentos | MinIO o S3 compatible | Adjuntos y resultados con acceso controlado |
| Integracion | REST/JSON + OpenAPI | Contratos internos/externos |
| Interoperabilidad futura | HL7 FHIR | Integracion con sistemas de salud cuando exista alcance |
| Infraestructura | Docker + Linux + Nginx | Despliegue reproducible, HTTPS y proxy inverso |
| Pruebas backend | JUnit, Mockito, Testcontainers | Unitarias e integracion |
| Pruebas frontend | React Testing Library, Playwright | Componentes y E2E |
| DevOps | Git + GitHub Actions o GitLab CI | Build, pruebas y despliegue |

## Modalidad de acceso

- Aplicacion web responsiva para personal en computadoras y tablets.
- Portal del paciente como PWA en entrega posterior.
- Aplicacion nativa solo si se requieren capacidades que la PWA no cubra.

## Por que no microservicios ahora

- Aumentan red, seguridad, observabilidad y despliegues.
- Complican transacciones de receta, stock y pagos.
- Requieren equipos y propiedad autonoma por servicio.
- El monolito modular permite extraer servicios despues si hay evidencia.

Candidatos futuros de extraccion: notificaciones, analitica/BI e interoperabilidad. El nucleo clinico transaccional debe permanecer cohesivo hasta que exista una necesidad real.

## Decisiones arquitectonicas que deben documentarse como ADR

- Estrategia exacta de autenticacion y emision/renovacion de tokens.
- Multi-tenancy o multi-sede.
- Modelo de auditoria y versionado clinico.
- Control de concurrencia en citas e inventario.
- Estrategia de archivos/adjuntos.
- Patron de reportes pesados.
- Transacciones y eventos internos.
- Criterios para eventual extraccion de microservicios.

**Origen documental:** informe integrado, seccion 15. El PDF confirma visualmente una arquitectura por capas; el DOCX contiene la seleccion tecnologica mas completa.
