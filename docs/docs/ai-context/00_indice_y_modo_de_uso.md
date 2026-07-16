# 00 - Indice y modo de uso

## Orden recomendado para agentes

| Tarea | Contexto minimo |
|---|---|
| Planificacion general | 01, 02, 14, 15, 20 |
| Backend | 04, 05, 06, 08, 09, 11, 12, 13 |
| Frontend | 03, 04, 07, 08, 10, `frontend/CONTEXT.md` |
| Base de datos | 04, 06, 09, 13, 17 |
| Seguridad | 03, 05, 06, 13, 17 |
| Pruebas | 04, 05, 06, 07, 08, 16, 21 |
| Despliegue | 11, 13, 17 |
| Validacion con usuarios | 03, 07, 18, 19, 20 |

## Archivos

- `01_contexto_problema_y_objetivos.md`: problema, causas, consecuencias y objetivos.
- `02_alcance_modulos_y_limites.md`: modulos incluidos, fases y fuera de alcance.
- `03_stakeholders_roles_y_permisos.md`: actores y matriz inicial de acceso.
- `04_requisitos_funcionales.md`: catalogo normalizado de funciones.
- `05_requisitos_no_funcionales.md`: calidad, seguridad, rendimiento y disponibilidad.
- `06_reglas_de_negocio.md`: invariantes que deben protegerse en dominio y base de datos.
- `07_historias_de_usuario_y_aceptacion.md`: historias y criterios verificables.
- `08_casos_de_uso_prioritarios.md`: flujos, excepciones y postcondiciones.
- `09_modelo_de_dominio_y_datos.md`: entidades y relaciones iniciales.
- `10_procesos_as_is_to_be.md`: situacion actual y proceso objetivo.
- `11_arquitectura_y_tecnologias.md`: arquitectura seleccionada y stack.
- `12_api_integraciones_y_contratos.md`: limites de API e interoperabilidad.
- `13_seguridad_privacidad_y_auditoria.md`: controles de proteccion.
- `14_mvp_backlog_y_roadmap.md`: entregas incrementales y plan acelerado.
- `15_estructura_monorepo.md`: estructura propuesta del repositorio.
- `16_pruebas_calidad_y_definicion_de_hecho.md`: estrategia de pruebas.
- `17_despliegue_respaldo_y_continuidad.md`: infraestructura y recuperacion.
- `18_levantamiento_y_validacion.md`: plan para cerrar requisitos faltantes.
- `19_instrumentos_de_levantamiento.md`: preguntas y listas de comprobacion.
- `20_riesgos_supuestos_y_decisiones_pendientes.md`: elementos no resueltos.
- `21_matriz_de_trazabilidad.md`: problema -> requisito -> modulo -> prueba.
- `22_glosario.md`: vocabulario del dominio.
- `23_fuentes_y_control_de_cambios.md`: procedencia y calidad de la informacion.

## Convenciones

- `RF-<MOD>-NNN`: requisito funcional.
- `RNF-<CAT>-NNN`: requisito no funcional.
- `RN-<MOD>-NNN`: regla de negocio.
- `HU-<MOD>-NNN`: historia de usuario.
- `UC-NN`: caso de uso.
- Prioridades: **Obligatorio**, **Importante**, **Deseable**, **Futuro**.

Los identificadores son normalizados para el desarrollo. Los documentos originales usan tambien `RF-01` a `RF-12` y `RNF-01` a `RNF-10`; la equivalencia se conserva en los archivos de requisitos.
