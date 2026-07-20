# 10 - Procesos AS-IS y TO-BE

## AS-IS documentado

1. Recepcion registra al paciente en papel y busca historia fisica.
2. La cita se anota en agenda fisica o sistema aislado.
3. Consulta registra diagnostico/evolucion sin repositorio comun.
4. Si hay examen, laboratorio procesa en software aislado y entrega resultado impreso.
5. Farmacia valida receta y stock en un control independiente.
6. Caja vuelve a digitar servicios/productos y emite cobro.
7. Administracion consolida reportes en hojas de calculo.

Problemas:

- El paciente y los documentos se trasladan entre areas.
- Datos ya capturados se vuelven a registrar.
- No hay una sola fuente de verdad.
- El resultado, receta, inventario y cobro no quedan vinculados automaticamente.
- Direccion carece de indicadores en tiempo real.

## TO-BE propuesto

1. **Identificacion:** buscar paciente y validar duplicidad; crear ficha unica solo si no existe.
2. **Agenda/ingreso:** consultar disponibilidad; reservar sin solapamiento; confirmar llegada o triaje.
3. **Atencion:** abrir expediente; registrar signos, evolucion, diagnostico y tratamiento.
4. **Ordenes:** generar solicitudes de laboratorio y recetas desde la consulta.
5. **Laboratorio:** recibir orden, procesar muestra, validar y publicar resultado en el expediente.
6. **Farmacia:** consultar receta, validar lote/stock/vencimiento, dispensar y actualizar inventario atomicamente.
7. **Facturacion:** recuperar servicios/productos registrados, cobrar y emitir comprobante.
8. **Cierre:** notificar, auditar y actualizar indicadores.

## Story map del recorrido del paciente

1. Registrar paciente.
2. Programar cita.
3. Confirmar llegada.
4. Realizar consulta.
5. Registrar diagnostico.
6. Solicitar examenes.
7. Emitir receta.
8. Entregar medicamentos.
9. Facturar servicios.
10. Generar seguimiento.

## Dependencias funcionales

- Pacientes antes de citas.
- Cita/ingreso antes de consulta, salvo flujo de emergencia controlado.
- Consulta antes de orden y receta.
- Orden antes de resultado.
- Receta antes de dispensacion.
- Servicio/dispensacion antes de facturacion.
- Datos transaccionales antes de indicadores.

## Indicadores a medir

- Tiempo de registro y espera.
- Pacientes atendidos por dia.
- Duplicados detectados/confirmados.
- Citas canceladas y reprogramadas.
- Tiempo de entrega de resultados.
- Recetas procesadas y dispensaciones parciales.
- Frecuencia de desabastecimiento y medicamentos vencidos.
- Diferencias entre inventario fisico y sistema.
- Errores/correcciones de facturacion.
- Tiempo para generar reportes.
- Disponibilidad e incidencias del sistema.

## Criterio de mejora

No automatizar un proceso defectuoso sin validarlo. Cada flujo TO-BE debe revisarse con usuarios de las areas que entregan y reciben informacion.

**Origen documental:** V0.0.6, procesos actuales, Story Mapping e indicadores; informe integrado, BPMN AS-IS/TO-BE y Gap Analysis.
