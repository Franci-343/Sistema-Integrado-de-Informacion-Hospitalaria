# Docker local del backend

Esta configuracion levanta PostgreSQL en Docker y conserva la base de datos en el volumen nombrado `siih_postgres_data`.

## Levantar solo PostgreSQL

Desde la carpeta `backend`:

```bash
docker compose up -d postgres
```

La aplicacion Spring puede conectarse con el perfil local:

```bash
SPRING_PROFILES_ACTIVE=local ./mvnw spring-boot:run
```

En PowerShell:

```powershell
$env:SPRING_PROFILES_ACTIVE="local"
.\mvnw.cmd spring-boot:run
```

## Levantar PostgreSQL y backend con Docker

```bash
docker compose --profile app up --build
```

## Configuracion

Los valores por defecto estan en `docker-compose.yml` y `application-local.properties`.
Si necesitas cambiarlos, copia `.env.example` a `.env` y edita ese archivo local.

## Cuidar los datos

Usa esto para detener los contenedores sin borrar la base:

```bash
docker compose down
```

No uses `docker compose down -v` salvo que quieras eliminar el volumen `siih_postgres_data` y perder la base de datos local.
