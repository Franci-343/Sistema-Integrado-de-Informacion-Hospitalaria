# SIIH - Paquete de contexto para desarrollo asistido por IA

Este paquete consolida y normaliza la informacion util de los documentos del proyecto **Sistema Integrado de Informacion Hospitalaria (SIIH)** para el caso de estudio del Hospital Universitario San Andres.

## Objetivo del paquete

Servir como contexto estable para agentes de IA y para el equipo humano durante el analisis, diseno, implementacion y pruebas del sistema. No reemplaza la validacion con usuarios del hospital.

## Como usarlo

1. Colocar este contenido en la raiz del monorepo.
2. Dar a los agentes primero `AGENTS.md` y `docs/ai-context/00_indice_y_modo_de_uso.md`.
3. Para una tarea de frontend, agregar `frontend/CONTEXT.md` y el archivo del modulo correspondiente.
4. Para una tarea de backend, agregar `backend/CONTEXT.md`, requisitos, reglas de negocio y modelo de dominio.
5. Exigir que toda implementacion cite los identificadores normalizados de requisitos (`RF-*`, `RNF-*`, `RN-*`).

## Estado de la informacion

- **Extraido:** aparece de forma explicita en los documentos fuente.
- **Normalizado:** se reorganizo o se asigno un identificador sin cambiar el sentido.
- **Derivado:** se deduce de requisitos explicitos y debe validarse.
- **Recomendado:** decision de implementacion propuesta para acelerar el proyecto; no es un requisito validado del hospital.

## Fuentes principales

- `V0.0.6.docx`: analisis del problema, levantamiento, requisitos, historias de usuario, reglas, priorizacion y validacion.
- `SIIH_Hospital_San_Andres.0.01.docx`: informe integrado, casos de uso, UML, arquitectura y tecnologias.
- `SIIH_Hospital_San_Andres_Documento_Completo.pdf`: version renderizada de contenido mayormente duplicado; se uso para verificar visualmente diagramas y tablas.

Consultar `docs/ai-context/23_fuentes_y_control_de_cambios.md` para discrepancias y limitaciones.
