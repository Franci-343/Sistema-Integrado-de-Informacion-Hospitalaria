# 01 - Contexto, problema y objetivos

## Nombre del sistema

**Sistema Integrado de Informacion Hospitalaria (SIIH)** para el caso de estudio **Hospital Universitario San Andres**.

## Problema central

La informacion clinica y administrativa esta fragmentada entre documentos fisicos, hojas de calculo y aplicaciones aisladas. No existe una base de datos central ni intercambio automatico entre admision, consulta, emergencias, hospitalizacion, laboratorio, farmacia, caja, administracion y direccion.

## Sintomas observados

- Duplicidad de registros de pacientes.
- Demoras en registro, atencion y localizacion de historias clinicas.
- Errores al programar, cancelar o reprogramar citas.
- Resultados de laboratorio comunicados tarde o por medios impresos.
- Inconsistencias entre consulta, receta, farmacia y facturacion.
- Inventario manual o independiente, con riesgo de desabastecimiento y vencimientos.
- Doble digitacion y reprocesos administrativos.
- Reportes gerenciales tardios, incompletos o consolidados manualmente.
- Falta de trazabilidad sobre quien accedio o modifico informacion.
- Informacion insuficiente o desactualizada para decisiones de direccion.

## Causas raiz documentadas

1. Procesos manuales y repetitivos.
2. Aplicaciones independientes sin integracion.
3. Ausencia de una base de datos centralizada.
4. Falta de estandarizacion de procedimientos y datos.
5. Comunicacion entre areas basada en papel, llamadas o consultas personales.
6. Limitaciones de infraestructura, respaldo y politicas de tecnologia.
7. Capacitacion insuficiente y resistencia al cambio.
8. Presupuesto y personal tecnico limitados.

## Consecuencias

- Mayor tiempo de espera y peor experiencia del paciente.
- Riesgo clinico por antecedentes o resultados no disponibles.
- Perdidas economicas, compras innecesarias y medicamentos vencidos.
- Errores de cobro y dificultad para conciliar servicios prestados.
- Baja productividad y mayor carga manual para el personal.
- Decisiones gerenciales basadas en datos incompletos.

## Objetivo general normalizado

Desarrollar un sistema unico que centralice, automatice e integre los procesos clinicos y administrativos del hospital, proteja la informacion, reduzca errores y demoras, optimice recursos y proporcione informacion confiable para la toma de decisiones.

## Objetivos especificos

- Analizar y estandarizar procesos AS-IS antes de automatizarlos.
- Mantener una ficha unica por paciente y una historia clinica continua.
- Integrar admision, citas, atencion, laboratorio, farmacia, inventario, facturacion y reportes.
- Automatizar tareas repetitivas y eliminar doble digitacion.
- Controlar usuarios, roles, permisos y auditoria.
- Asegurar respaldo, recuperacion y continuidad operativa.
- Generar indicadores clinicos, administrativos y gerenciales.
- Construir una solucion modular, escalable y preparada para integraciones futuras.

## Metas operativas propuestas en los documentos

Estas cifras son metas del caso de estudio, no SLA tecnicos validados:

- Tiempo total actual estimado: 45 a 90 minutos por paciente.
- Reduccion esperada del tiempo total: 25% a 40%.
- Tiempo actual de recepcion estimado: 15 a 25 minutos.
- Meta de registro en recepcion: menos de 8 minutos.
- Disponibilidad del historial: acceso autorizado en linea.
- Stock: actualizacion en tiempo real con alertas.

## Advertencia

El caso es academico. Los documentos no demuestran que las cifras, procesos o politicas hayan sido validados en un hospital real. Toda decision clinica, legal, fiscal o institucional debe confirmarse con responsables autorizados.

**Origen documental:** V0.0.6, secciones 1 a 3; informe integrado, secciones 1 a 6 y tabla de indicadores.
