# Contexto del backend SIIH

## Stack

Java 21 LTS, Spring Boot, Spring Security, OAuth2/JWT, RBAC, PostgreSQL, Spring Data JPA, Flyway, MinIO/S3, OpenAPI, Docker.

## Arquitectura

Monolito modular con capas de dominio, aplicacion, infraestructura y API. No crear microservicios ni compartir repositorios/tablas internos entre modulos.

## Modulos

`security`, `patients`, `appointments`, `clinical`, `hospitalization`, `laboratory`, `pharmacy`, `inventory`, `billing`, `reporting`, `notifications`, `document-storage`.

## Invariantes criticas

- Ficha unica y control de duplicados.
- Sin solapamiento de citas.
- Registros clinicos versionados, no borrados.
- Resultado siempre asociado a orden y publicado solo tras validacion.
- Receta asociada a consulta; farmacia no la modifica.
- No lotes vencidos ni stock negativo.
- Dispensacion + movimiento + estado en una transaccion.
- Factura solo con prestaciones registradas.
- Auditoria de toda operacion sensible.
- Idempotencia de citas, dispensaciones, pagos y publicacion.

## Calidad

- JUnit/Mockito para dominio.
- Testcontainers con PostgreSQL para integracion.
- Flyway desde base vacia en CI.
- OpenAPI actualizado.
- Logs sin datos clinicos sensibles.

Leer `docs/ai-context/04`, `05`, `06`, `08`, `09`, `11`, `12`, `13`, `16` y `17` antes de implementar.
