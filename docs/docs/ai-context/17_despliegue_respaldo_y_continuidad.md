# 17 - Despliegue, respaldo y continuidad

## Topologia inicial

- Navegadores de recepcion, consultorios, laboratorio, farmacia, caja y direccion.
- Nginx como proxy inverso y terminacion HTTPS.
- Aplicacion Spring Boot.
- PostgreSQL.
- MinIO/S3 para adjuntos.
- Monitoreo, alertas y repositorio de backups.

## Entorno local recomendado

Docker Compose con:

- `postgres`
- `minio`
- `backend`
- `frontend` o servidor dev separado
- `nginx` opcional en local

## Controles de despliegue

- Imagenes reproducibles y versionadas.
- Usuario no root en contenedores cuando sea viable.
- Variables de entorno/secretos fuera de imagen.
- Migraciones ejecutadas de forma controlada antes de habilitar trafico.
- Health checks para aplicacion, base y almacenamiento.
- Logs estructurados sin informacion clinica sensible.
- HTTPS/TLS y cabeceras seguras.

## Respaldo

Los documentos proponen enfoque **3-2-1**:

- 3 copias de la informacion.
- 2 medios/ubicaciones diferentes.
- 1 copia fuera del sitio principal.

Incluir:

- Backup de PostgreSQL.
- Backup/versionado de objetos MinIO.
- Copia de configuracion y migraciones.
- Cifrado y control de acceso.
- Monitoreo de exito/fallo.
- Retencion pendiente de definicion.

## Restauracion

No basta con generar backups. Debe existir una prueba periodica:

1. Preparar entorno aislado.
2. Restaurar base y objetos.
3. Verificar integridad y versiones.
4. Ejecutar casos de humo.
5. Registrar tiempo, fallos y responsable.
6. Corregir procedimiento.

## Continuidad operativa

- UPS para infraestructura critica.
- Monitoreo y alertas.
- Procedimiento manual controlado durante una interrupcion.
- Reconciliacion posterior de datos capturados manualmente.
- Comunicacion a usuarios y responsables.
- Registro del incidente y acciones correctivas.

## Decisiones pendientes

- Horario exacto de operacion.
- RPO: maxima perdida de datos tolerable.
- RTO: tiempo maximo de recuperacion.
- Alta disponibilidad o servidor unico.
- Retencion de backups.
- Ubicacion externa y responsables.
- Plan ante ransomware.

**Origen documental:** V0.0.6, disponibilidad/respaldo; informe integrado, infraestructura y controles de continuidad.
