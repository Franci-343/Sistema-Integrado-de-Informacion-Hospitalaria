# Frontend SIIH

Interfaz web del Sistema Integrado de Informacion Hospitalaria para el caso academico del Hospital Universitario San Andres.

## Que necesitas para ejecutarlo

Para levantar el frontend necesitas:

- Node.js LTS.
- npm, que normalmente viene incluido con Node.js.
- El backend activo, por defecto en `http://localhost:8080/api/v1`.

Puedes comprobar si ya tienes Node.js y npm:

```bash
node --version
npm --version
```

Si esos comandos fallan, instala Node.js antes de continuar.

## Instalar Node.js si no lo tienes

### Windows

Con PowerShell:

```powershell
winget install --id OpenJS.NodeJS.LTS -e
```

Cierra y vuelve a abrir PowerShell. Luego verifica:

```powershell
node --version
npm --version
```

### Linux

En Ubuntu/Debian:

```bash
sudo apt update
sudo apt install nodejs npm
```

Verifica:

```bash
node --version
npm --version
```

Si tu distribucion instala una version muy antigua de Node.js, usa NodeSource, nvm o el instalador recomendado para tu sistema.

### macOS

Con Homebrew:

```bash
brew install node
```

Verifica:

```bash
node --version
npm --version
```

## Preparar el backend

Antes de iniciar el frontend, el backend debe estar corriendo. Desde la raiz del proyecto puedes usar:

```bash
cd backend
docker compose up -d postgres
SPRING_PROFILES_ACTIVE=local ./mvnw spring-boot:run
```

En Windows PowerShell:

```powershell
cd backend
docker compose up -d postgres
$env:SPRING_PROFILES_ACTIVE="local"
.\mvnw.cmd spring-boot:run
```

La API debe quedar disponible en:

```text
http://localhost:8080/api/v1
```

Si necesitas instrucciones completas del backend, revisa el `Readme.md` de la raiz del proyecto.

## Instalar y ejecutar el frontend

Desde la raiz del proyecto:

```bash
cd frontend
npm install
npm run dev
```

Vite mostrara una URL parecida a:

```text
http://localhost:5173
```

Abre esa URL en el navegador.

## Configurar la URL del backend

El frontend usa por defecto:

```text
http://localhost:8080/api/v1
```

Si el backend esta en otro puerto o servidor, crea `frontend/.env.local`:

```text
VITE_API_URL=http://localhost:8080/api/v1
```

Ejemplo con backend en puerto `8081`:

```text
VITE_API_URL=http://localhost:8081/api/v1
```

Despues reinicia `npm run dev`.

## Funcionalidad

- Landing publica y acceso institucional conectado a `/auth/login`.
- Sesiones JWT con refresh token, persistencia opcional, cierre remoto y permisos por rol.
- Dashboard, pacientes, agenda, historia clinica y consultas conectados al backend.
- Triaje, hospitalizacion, laboratorio, farmacia, inventario y facturacion.
- Administracion de cuentas, roles, auditoria y notificaciones internas.
- Revision contextual de posibles pacientes duplicados.
- Seleccion de profesionales por especialidad y cancelacion de citas con motivo.

## Acceso academico

La clave comun es:

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

## Comandos disponibles

Desde `frontend/`:

```bash
npm run dev
npm run lint
npm run build
npm run preview
npm run test:e2e
```

Uso de cada comando:

- `npm run dev`: levanta el servidor de desarrollo.
- `npm run lint`: ejecuta oxlint.
- `npm run build`: compila TypeScript y genera `dist/`.
- `npm run preview`: sirve la version compilada.
- `npm run test:e2e`: ejecuta pruebas E2E con Playwright.

Si Playwright indica que falta instalar navegadores:

```bash
npx playwright install
```

Para ejecutar E2E contra Spring Boot y PostgreSQL reales:

Windows PowerShell:

```powershell
$env:SIIH_LIVE="1"
npm run test:e2e
```

Linux/macOS:

```bash
SIIH_LIVE=1 npm run test:e2e
```

## Problemas comunes

### `node` o `npm` no se reconoce

Instala Node.js LTS, cierra la terminal y abre una nueva. Verifica otra vez:

```bash
node --version
npm --version
```

### El navegador muestra error de conexion con el backend

Revisa que:

- PostgreSQL este activo.
- El backend este corriendo.
- `VITE_API_URL` termine en `/api/v1`.
- El puerto configurado en `VITE_API_URL` coincida con el puerto del backend.

### El puerto `5173` esta ocupado

Ejecuta Vite en otro puerto:

```bash
npm run dev -- --port 5174
```

Si usas un puerto no permitido por CORS, agrega ese origen en la configuracion del backend.

### `npm install` falla

Verifica tu version de Node.js:

```bash
node --version
```

Luego intenta de nuevo:

```bash
npm install
```

## Resumen rapido

```bash
cd frontend
npm install
npm run dev
```

Abrir:

```text
http://localhost:5173
```
