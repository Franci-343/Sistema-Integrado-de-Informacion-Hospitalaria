# 12 - API, integraciones y contratos

## Contrato base extraido

- API REST sobre JSON.
- Documentacion OpenAPI.
- Autenticacion OAuth2/JWT y autorizacion RBAC.
- HL7 FHIR previsto, no obligatorio en el MVP.
- Archivos en MinIO/S3 con acceso controlado.

## Limites de recursos sugeridos

**Estado:** recomendacion de implementacion derivada de los modulos; no es un contrato final.

- `/api/v1/auth`
- `/api/v1/users`, `/roles`, `/permissions`, `/audit-events`
- `/api/v1/patients`
- `/api/v1/appointments`, `/schedules`, `/specialties`
- `/api/v1/clinical-histories`, `/consultations`, `/triage`
- `/api/v1/lab-orders`, `/lab-results`, `/samples`
- `/api/v1/prescriptions`, `/dispensations`
- `/api/v1/medications`, `/batches`, `/stock-movements`, `/purchase-orders`
- `/api/v1/invoices`, `/payments`, `/services`
- `/api/v1/reports`, `/indicators`
- `/api/v1/notifications`
- `/api/v1/documents`

## Reglas de contrato

- Versionar la API desde el inicio.
- DTO de entrada/salida; no exponer entidades JPA.
- Validacion de formato en el borde y reglas en dominio.
- Errores con codigo estable, mensaje comprensible y `traceId`; no exponer stack trace.
- Paginacion en listados.
- Filtros explicitos por fecha, estado, paciente, area y profesional segun permiso.
- Usar fechas/horas con zona definida y formato consistente.
- OpenAPI se actualiza en la misma entrega que el endpoint.
- No devolver datos clinicos no necesarios para la pantalla/rol.

## Idempotencia y concurrencia

- Crear cita, dispensar, registrar pago y publicar resultado deben resistir reintentos.
- Usar clave de idempotencia o identificador de comando para operaciones criticas.
- Evitar doble reserva con transaccion y restriccion/locking adecuado.
- Evitar doble dispensacion con control de version/estado y bloqueo de stock.
- Toda respuesta a operacion critica devuelve identificador y estado final.

## Eventos internos posibles

No requieren un broker en el MVP. Pueden implementarse como eventos de dominio dentro del monolito:

- `PatientRegistered`
- `AppointmentScheduled/Cancelled`
- `ConsultationClosed`
- `LabResultValidated`
- `PrescriptionIssued`
- `MedicationDispensed`
- `StockBelowMinimum`
- `InvoicePaid`

Las notificaciones externas deben ejecutarse despues de confirmar la transaccion o mediante una cola/outbox cuando sea necesario.

## HL7 FHIR futuro

Antes de integrar:

1. Definir sistema externo y casos de uso reales.
2. Mapear entidades locales a recursos FHIR.
3. Definir consentimiento, identificadores, terminologias y seguridad.
4. Crear pruebas de contrato.
5. Evitar contaminar el dominio central con detalles del estandar.

## Adjuntos

- Guardar metadatos y permisos en PostgreSQL.
- Guardar contenido en MinIO/S3.
- Usar nombres internos no predecibles, tipo MIME validado, hash y limite de tamaño.
- Acceso mediante backend o URL firmada de corta duracion.

**Origen documental:** informe integrado, secciones de tecnologias, integracion y seguridad; recomendaciones de estructura claramente marcadas.
