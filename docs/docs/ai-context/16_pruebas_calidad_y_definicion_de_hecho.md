# 16 - Pruebas, calidad y definicion de hecho

## Piramide de pruebas

### Unitarias

- Reglas de duplicidad.
- Solapamiento de citas.
- Cierre/versionado de consulta.
- Validacion de orden/resultado.
- Vigencia y estado de receta.
- Stock, lotes y vencimientos.
- Calculo de factura.
- Autorizacion de casos de uso.

Herramientas: JUnit y Mockito; React Testing Library en frontend.

### Integracion

- Repositorios JPA con PostgreSQL real mediante Testcontainers.
- Migraciones Flyway desde una base vacia.
- Transacciones de dispensacion/stock y pago.
- Auditoria generada por operaciones sensibles.
- MinIO/S3 para adjuntos.
- Seguridad del endpoint por rol.

### API/contrato

- OpenAPI valido.
- Respuestas y errores estables.
- Paginacion y filtros.
- Idempotencia de operaciones criticas.
- No exposicion de campos sensibles.

### E2E

Herramienta propuesta: Playwright.

Flujos minimos:

1. Login -> registrar/buscar paciente -> programar cita.
2. Llegada -> signos vitales -> consulta -> cierre.
3. Consulta -> orden -> resultado validado.
4. Consulta -> receta -> dispensacion -> stock actualizado.
5. Servicio/dispensacion -> factura -> pago -> comprobante.
6. Direccion -> reporte autorizado.
7. Intentos de acceso denegado por rol.

### Rendimiento y concurrencia

- Dos usuarios intentando reservar el mismo horario.
- Dos farmaceuticos intentando consumir el mismo stock.
- Reporte ejecutado mientras hay operaciones clinicas.
- Volumen de pacientes y consultas representativo; cifras pendientes.

### Seguridad

- Autorizacion horizontal y vertical.
- Bloqueo por intentos.
- Tokens expirados/revocados.
- Entradas maliciosas y archivos invalidos.
- Datos sensibles ausentes de logs.
- Auditoria no modificable por usuarios normales.

## Datos de prueba

- Solo datos sinteticos.
- Generadores reproducibles.
- No copiar historias, documentos o nombres reales.
- Casos con duplicados, alergias, resultados, lotes vencidos y stock limite.

## Definicion de Hecho

Una tarea esta terminada cuando:

- Tiene requisito y regla asociados.
- Criterios de aceptacion cumplidos.
- Codigo revisado.
- Pruebas unitarias e integracion pasan.
- E2E actualizado si afecta flujo critico.
- Migracion Flyway incluida y probada si cambia datos.
- OpenAPI actualizado si cambia API.
- Auditoria y permisos verificados.
- No contiene secretos ni datos reales.
- Documentacion/ADR actualizada.
- Pipeline CI verde.

## Evidencia de aceptacion

Cada requisito debe mapearse a una prueba en `21_matriz_de_trazabilidad.md` o en la herramienta de gestion utilizada.

**Origen documental:** herramientas de prueba seleccionadas, criterios de casos de uso y trazabilidad; estructura de calidad recomendada para implementacion.
