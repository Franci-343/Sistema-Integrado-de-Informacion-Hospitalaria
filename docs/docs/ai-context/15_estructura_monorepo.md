# 15 - Estructura del monorepo

## Estructura propuesta

```text
Sistema-Integrado-de-Informacion-Hospitalaria/
├── AGENTS.md
├── README.md
├── frontend/
│   ├── CONTEXT.md
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── app/
│   │   ├── shared/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── patients/
│   │   │   ├── appointments/
│   │   │   ├── clinical/
│   │   │   ├── laboratory/
│   │   │   ├── pharmacy/
│   │   │   ├── inventory/
│   │   │   ├── billing/
│   │   │   └── reporting/
│   │   └── tests/
│   └── e2e/
├── backend/
│   ├── CONTEXT.md
│   ├── pom.xml
│   └── src/
│       ├── main/java/.../siih/
│       │   ├── security/
│       │   ├── patients/
│       │   ├── appointments/
│       │   ├── clinical/
│       │   ├── hospitalization/
│       │   ├── laboratory/
│       │   ├── pharmacy/
│       │   ├── inventory/
│       │   ├── billing/
│       │   ├── reporting/
│       │   ├── notifications/
│       │   └── shared/
│       ├── main/resources/db/migration/
│       └── test/
├── docs/
│   ├── ai-context/
│   ├── adr/
│   ├── api/
│   ├── diagrams/
│   └── decisions/
├── infra/
│   ├── docker/
│   ├── nginx/
│   ├── backup/
│   └── monitoring/
├── scripts/
├── .github/workflows/  # o .gitlab-ci.yml
├── docker-compose.yml
└── .env.example
```

## Estructura interna de un modulo backend

```text
patients/
├── domain/
│   ├── model/
│   ├── service/
│   └── repository/        # interfaces
├── application/
│   ├── command/
│   ├── query/
│   ├── usecase/
│   └── port/
├── infrastructure/
│   ├── persistence/
│   ├── storage/
│   └── integration/
└── api/
    ├── controller/
    ├── request/
    ├── response/
    └── mapper/
```

## Reglas de dependencias

- Un modulo no accede a tablas/repositorios internos de otro modulo.
- La comunicacion ocurre mediante casos de uso, interfaces o eventos internos.
- `shared` solo contiene conceptos realmente compartidos; no se convierte en un modulo comun gigante.
- Entidades JPA no cruzan la API.
- Frontend organiza por funcionalidades, no por tipo de archivo global.
- Los contratos OpenAPI y ADR viven en `docs/`.

## Convenciones de ramas y commits recomendadas

- Ramas: `feat/RF-PAC-001-registro-paciente`, `fix/RN-CIT-002-solapamiento`.
- Commit: `feat(patients): implementa RF-PAC-001`.
- Pull request: requisitos cubiertos, pruebas, migraciones, riesgos y capturas si cambia UI.

## Archivos de entorno

- `.env.example` sin secretos.
- Perfiles: local, test y prod.
- Docker Compose local con PostgreSQL y MinIO.
- Configuracion de produccion fuera del repositorio.

**Estado:** recomendacion basada en el monorepo solicitado y el monolito modular seleccionado.
