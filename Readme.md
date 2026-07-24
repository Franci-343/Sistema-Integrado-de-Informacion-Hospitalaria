# Sistema Integrado de Informacion Hospitalaria

Guia para instalar, levantar y probar el backend y el frontend del Sistema Integrado de Informacion Hospitalaria (SIIH).

## Estructura del proyecto

```text
.
+-- backend/   # API REST con Spring Boot, Java 21, Maven, PostgreSQL y Flyway
`-- frontend/  # Aplicacion web con React, TypeScript y Vite
```

## Requisitos

Para ejecutar todo el sistema necesitas:

- Git, para clonar el repositorio.
- Java 21 JDK, para ejecutar el backend.
- Docker Desktop o Docker Engine, para levantar PostgreSQL facilmente.
- Node.js LTS y npm, para ejecutar el frontend.

Opcionalmente puedes instalar:

- Maven, aunque no es obligatorio porque el backend trae Maven Wrapper (`mvnw` y `mvnw.cmd`).
- PostgreSQL local, si no quieres usar Docker para la base de datos.

## Si no tienes las herramientas instaladas

### Windows

La forma mas simple es instalar con `winget` desde PowerShell:

```powershell
winget install --id Git.Git -e
winget install --id EclipseAdoptium.Temurin.21.JDK -e
winget install --id Docker.DockerDesktop -e
winget install --id OpenJS.NodeJS.LTS -e
```

Despues cierra y vuelve a abrir PowerShell. Verifica:

```powershell
git --version
java -version
docker --version
node --version
npm --version
```

Si Docker Desktop pide reiniciar el equipo o activar WSL 2, acepta esos pasos y abre Docker Desktop antes de levantar la base de datos.

### Linux

Instala los paquetes equivalentes con el gestor de tu distribucion. En Ubuntu/Debian, por ejemplo:

```bash
sudo apt update
sudo apt install git openjdk-21-jdk nodejs npm
```

Para Docker, sigue la guia oficial de Docker para tu distribucion y verifica:

```bash
git --version
java -version
docker --version
node --version
npm --version
```

### macOS

Con Homebrew:

```bash
brew install git openjdk@21 node
brew install --cask docker
```

Abre Docker Desktop y verifica:

```bash
git --version
java -version
docker --version
node --version
npm --version
```

## Clonar el proyecto

```bash
git clone <URL_DEL_REPOSITORIO>
cd Sistema-Integrado-de-Informacion-Hospitalaria
```

Si ya tienes el proyecto, entra a la carpeta raiz donde estan `backend/`, `frontend/` y este `Readme.md`.

## Configuracion de la base de datos

El backend usa PostgreSQL. La opcion recomendada para desarrollo es levantar solo la base de datos con Docker Compose desde `backend/`.

### Levantar PostgreSQL con Docker

```bash
cd backend
docker compose up -d postgres
```

Esto crea un contenedor `siih-postgres` con estos valores por defecto:

```text
POSTGRES_DB=siih
POSTGRES_USER=siih_app
POSTGRES_PASSWORD=siih_dev_password
POSTGRES_PORT=5432
```

Los datos quedan guardados en el volumen Docker `siih_postgres_data`.

Para detener PostgreSQL sin borrar datos:

```bash
docker compose down
```

No uses `docker compose down -v` salvo que quieras borrar la base de datos local.

### Cambiar puertos o credenciales

Si necesitas cambiar la configuracion, copia el archivo de ejemplo:

```bash
cd backend
cp .env.example .env
```

En PowerShell:

```powershell
cd backend
Copy-Item .env.example .env
```

Luego edita `backend/.env`. Por ejemplo, si ya tienes PostgreSQL usando el puerto `5432`, puedes cambiar:

```text
POSTGRES_PORT=5433
```

### Usar PostgreSQL local sin Docker

Si prefieres usar una instalacion local de PostgreSQL, crea una base con los mismos datos de conexion y carga el esquema inicial:

```bash
cd backend
createuser siih_app --pwprompt
createdb -O siih_app siih
psql -U siih_app -d siih -f database/db.sql
```

Usa como clave `siih_dev_password` si quieres mantener los valores por defecto. Luego ejecuta el backend con `SPRING_PROFILES_ACTIVE=local`. Si usas otro usuario, clave, host o puerto, configura `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` y `SPRING_DATASOURCE_PASSWORD` antes de iniciar Spring Boot.

## Ejecutar el backend

El backend esta hecho con Spring Boot y requiere Java 21.

### Windows PowerShell

```powershell
cd backend
$env:SPRING_PROFILES_ACTIVE="local"
.\mvnw.cmd spring-boot:run
```

### Linux/macOS/Git Bash

```bash
cd backend
SPRING_PROFILES_ACTIVE=local ./mvnw spring-boot:run
```

Cuando el backend levante correctamente, la API estara disponible en:

```text
http://localhost:8080/api/v1
```

El perfil `local` lee `backend/src/main/resources/application-local.properties`. Por defecto se conecta a:

```text
jdbc:postgresql://localhost:5432/siih
```

Si cambiaste `POSTGRES_PORT`, usa el mismo valor al ejecutar Spring Boot.

Windows PowerShell:

```powershell
$env:SPRING_PROFILES_ACTIVE="local"
$env:POSTGRES_PORT="5433"
.\mvnw.cmd spring-boot:run
```

Linux/macOS/Git Bash:

```bash
SPRING_PROFILES_ACTIVE=local POSTGRES_PORT=5433 ./mvnw spring-boot:run
```

## Ejecutar backend y PostgreSQL juntos con Docker

Tambien puedes levantar PostgreSQL y backend dentro de Docker:

```bash
cd backend
docker compose --profile app up --build
```

La API quedara en:

```text
http://localhost:8080/api/v1
```

Para detener:

```bash
docker compose --profile app down
```

## Ejecutar el frontend

El frontend usa React, TypeScript, Vite y npm.

Instala dependencias:

```bash
cd frontend
npm install
```

Ejecuta el servidor de desarrollo:

```bash
npm run dev
```

Vite mostrara una URL similar a:

```text
http://localhost:5173
```

Abre esa URL en el navegador.

El frontend apunta por defecto a:

```text
http://localhost:8080/api/v1
```

Si tu backend esta en otra URL, crea `frontend/.env.local`:

```text
VITE_API_URL=http://localhost:8080/api/v1
```

Ejemplo si el backend usa el puerto `8081`:

```text
VITE_API_URL=http://localhost:8081/api/v1
```

Luego reinicia `npm run dev`.

## Orden recomendado para levantar todo

Usa tres terminales.

Terminal 1, base de datos:

```bash
cd backend
docker compose up -d postgres
```

Terminal 2, backend:

```bash
cd backend
SPRING_PROFILES_ACTIVE=local ./mvnw spring-boot:run
```

En Windows PowerShell:

```powershell
cd backend
$env:SPRING_PROFILES_ACTIVE="local"
.\mvnw.cmd spring-boot:run
```

Terminal 3, frontend:

```bash
cd frontend
npm install
npm run dev
```

## Usuarios de prueba

La base de datos incluye cuentas academicas. La clave comun es:

```text
password
```

| Usuario | Perfil |
|---|---|
| `recepcion` | Admision y recepcion |
| `medica` | Personal medico |
| `enfermeria` | Enfermeria |
| `laboratorio` | Laboratorio clinico |
| `farmacia` | Farmacia |
| `caja` | Caja y facturacion |
| `direccion` | Direccion |
| `admin` | Administracion del sistema |

## Comandos utiles del backend

Desde `backend/`:

Windows:

```powershell
.\mvnw.cmd test
.\mvnw.cmd clean package
```

Linux/macOS/Git Bash:

```bash
./mvnw test
./mvnw clean package
```

El `.jar` se genera en:

```text
backend/target/
```

## Comandos utiles del frontend

Desde `frontend/`:

```bash
npm run lint
npm run build
npm run preview
npm run test:e2e
```

Notas:

- `npm run build` compila TypeScript y genera `frontend/dist/`.
- `npm run preview` sirve la version compilada.
- `npm run test:e2e` ejecuta Playwright. La configuracion usa Chromium con canal `msedge`.
- Si Playwright indica que falta el navegador, ejecuta:

```bash
npx playwright install
```

Para ejecutar el recorrido E2E contra backend y PostgreSQL reales:

Windows PowerShell:

```powershell
$env:SIIH_LIVE="1"
npm run test:e2e
```

Linux/macOS/Git Bash:

```bash
SIIH_LIVE=1 npm run test:e2e
```

## Variables importantes

### Backend

| Variable | Valor por defecto | Uso |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `local` recomendado | Activa la configuracion local |
| `POSTGRES_DB` | `siih` | Nombre de la base de datos |
| `POSTGRES_USER` | `siih_app` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | `siih_dev_password` | Clave de PostgreSQL |
| `POSTGRES_PORT` | `5432` | Puerto local de PostgreSQL |
| `SERVER_PORT` | `8080` | Puerto HTTP del backend |
| `SIIH_JWT_SECRET` | valor de desarrollo | Secreto para JWT |
| `SIIH_ACCESS_TOKEN_MINUTES` | `15` | Duracion del access token |
| `SIIH_REFRESH_TOKEN_HOURS` | `8` | Duracion del refresh token |
| `SIIH_REMEMBER_TOKEN_DAYS` | `7` | Duracion al marcar recordar sesion |

### Frontend

| Variable | Valor por defecto | Uso |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080/api/v1` | URL base de la API |

## Solucion de problemas

### `java` no se reconoce o la version no es 21

Instala Java 21 JDK y revisa:

```bash
java -version
```

Si tienes varias versiones, configura `JAVA_HOME` apuntando al JDK 21.

### Docker no inicia

Abre Docker Desktop y espera a que indique que esta corriendo. En Windows puede pedir WSL 2 o reiniciar el equipo.

### El puerto `5432` ya esta ocupado

Cambia `POSTGRES_PORT` en `backend/.env`, por ejemplo:

```text
POSTGRES_PORT=5433
```

Luego ejecuta el backend con el mismo puerto:

```powershell
$env:POSTGRES_PORT="5433"
```

o en Linux/macOS:

```bash
POSTGRES_PORT=5433
```

### El puerto `8080` ya esta ocupado

Cambia el puerto del backend:

Windows PowerShell:

```powershell
$env:SERVER_PORT="8081"
.\mvnw.cmd spring-boot:run
```

Linux/macOS/Git Bash:

```bash
SERVER_PORT=8081 ./mvnw spring-boot:run
```

Despues actualiza `frontend/.env.local`:

```text
VITE_API_URL=http://localhost:8081/api/v1
```

### El frontend no puede conectarse al backend

Revisa:

- Que PostgreSQL este corriendo.
- Que Spring Boot este activo en `localhost:8080`.
- Que `VITE_API_URL` tenga `/api/v1` al final.
- Que el backend permita el origen del frontend. Por defecto permite `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:4173` y `http://127.0.0.1:4173`.

### `npm install` falla

Verifica Node.js y npm:

```bash
node --version
npm --version
```

Si el problema continua, borra dependencias instaladas y reinstala:

```bash
cd frontend
npm install
```

### La base de datos quedo en un estado incorrecto

Puedes borrar el volumen local y recrear la base. Esto elimina los datos locales:

```bash
cd backend
docker compose down -v
docker compose up -d postgres
```

Despues reinicia el backend para que Flyway aplique las migraciones.

## Resumen rapido

```bash
cd backend
docker compose up -d postgres
SPRING_PROFILES_ACTIVE=local ./mvnw spring-boot:run
```

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Abrir:

```text
http://localhost:5173
```
