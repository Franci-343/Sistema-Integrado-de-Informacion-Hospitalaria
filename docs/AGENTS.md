# AGENTS.md - Reglas globales del monorepo SIIH

## Contexto obligatorio

Antes de modificar codigo, leer:

1. `docs/ai-context/00_indice_y_modo_de_uso.md`
2. `docs/ai-context/04_requisitos_funcionales.md`
3. `docs/ai-context/05_requisitos_no_funcionales.md`
4. `docs/ai-context/06_reglas_de_negocio.md`
5. El archivo del modulo afectado.

## Decisiones tecnicas vigentes

- Monorepo con `frontend/` y `backend/`.
- Arquitectura inicial: **monolito modular**, no microservicios.
- Frontend: React + TypeScript + Vite; interfaz web responsiva y PWA para pacientes en una fase posterior.
- Backend: Java 21 LTS + Spring Boot.
- Persistencia: PostgreSQL + Spring Data JPA + Flyway.
- Seguridad: Spring Security, OAuth2/JWT y RBAC.
- Documentos: MinIO o almacenamiento compatible con S3.
- Contratos: REST/JSON + OpenAPI; HL7 FHIR queda previsto para interoperabilidad futura.
- Infraestructura: Docker, Linux y Nginx.

## Reglas inviolables

- No inventar requisitos ni reglas clinicas. Registrar dudas en `20_riesgos_supuestos_y_decisiones_pendientes.md`.
- Un paciente debe tener una ficha unica; verificar duplicados antes de crear.
- Un medico no puede tener dos citas superpuestas.
- Solo personal autorizado accede a informacion clinica.
- Solo un medico autorizado registra diagnosticos y emite recetas.
- Una receta siempre pertenece a una consulta y a un paciente.
- No dispensar lotes vencidos ni permitir stock negativo.
- Dispensacion, movimiento de inventario y cambio de estado de receta deben ser atomicos.
- Una factura solo puede incluir servicios o productos efectivamente registrados.
- Los registros clinicos no se eliminan fisicamente; se versionan o anulan con motivo.
- Toda operacion sensible registra usuario, fecha, hora, accion, entidad y origen.
- No registrar datos clinicos sensibles en logs tecnicos.
- Las operaciones criticas deben ser idempotentes o estar protegidas contra duplicacion.

## Calidad minima

- Cada cambio indica requisito(s) cubierto(s).
- Pruebas unitarias para reglas de negocio.
- Pruebas de integracion con PostgreSQL para persistencia y transacciones.
- Pruebas E2E para flujos criticos.
- Migraciones Flyway versionadas y reversibles mediante estrategia documentada.
- OpenAPI actualizado con cada cambio de API.
- Datos de prueba sinteticos; nunca usar informacion real de pacientes.

## Limites de alcance

- No crear microservicios sin una decision arquitectonica aprobada.
- No desarrollar aplicacion movil nativa en el MVP inicial.
- IA, telemedicina, analitica avanzada, nube y dispositivos medicos son alcance futuro.
- No asumir normativa legal, fiscal o clinica no documentada.
