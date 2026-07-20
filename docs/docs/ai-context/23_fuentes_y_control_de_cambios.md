# 23 - Fuentes y control de cambios

## Fuentes consumidas

### 1. V0.0.6.docx

Aporte principal:

- Problema, causas y consecuencias.
- Plan detallado de levantamiento.
- Encuestas, entrevistas y observacion.
- 25 requisitos funcionales.
- Requisitos no funcionales por categoria.
- 15 reglas de negocio preliminares.
- Historias de usuario y criterios.
- Priorizacion, validacion y trazabilidad.

Es la fuente mas completa para requisitos y elicitacion.

### 2. SIIH_Hospital_San_Andres.0.01.docx

Aporte principal:

- Informe integrado y modelos AS-IS/TO-BE.
- Stakeholders, RF-01 a RF-12 y RNF-01 a RNF-10.
- UML y casos de uso prioritarios.
- Monolito modular y arquitectura limpia/hexagonal.
- React/TypeScript/Vite, Java 21/Spring Boot, PostgreSQL, MinIO, Docker/Nginx y pruebas.
- MVP 1 a 3 y estrategia de evolucion.

Es la fuente preferente para arquitectura y tecnologias.

### 3. SIIH_Hospital_San_Andres_Documento_Completo.pdf

Aporte principal:

- Version visual de 24 paginas, mayormente duplicada con el DOCX integrado.
- Verificacion de diagramas de servicios, BPMN, UML, modelo TO-BE y arquitectura por capas.

La version PDF es menos detallada en tecnologia que el DOCX y parece anterior.

## Discrepancias detectadas

- Los indices de algunas versiones conservan numeros de pagina que no coinciden con la longitud real.
- El PDF termina con una arquitectura generica; el DOCX agrega decisiones mas especificas y se toma como version mas reciente.
- El diagrama de actores contiene etiquetas corruptas/no pertinentes; se excluyeron.
- Los documentos alternan “Sistema de Informacion para la Gestion Integral...” y “Sistema Integrado...”; se normalizo a SIIH.
- El material describe metas y procesos como caso de estudio; no presenta actas de validacion real.
- “MVP 1/2/3” y “requisitos obligatorios” no se contradicen si se interpretan como incrementos sucesivos.

## Regla de precedencia

1. Reglas y requisitos detallados de V0.0.6.
2. Arquitectura y tecnologias del DOCX integrado.
3. PDF como confirmacion visual, no como fuente principal cuando difiere.
4. Recomendaciones de este paquete siempre deben aparecer marcadas como recomendadas/derivadas.

## Control de cambios del paquete

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 2026-07-16 | Consolidacion inicial de los tres documentos; IDs normalizados y contexto para monorepo. |

## Como actualizar

- No sobrescribir requisitos validados sin registrar decision.
- Actualizar `21_matriz_de_trazabilidad.md` al cambiar requisitos.
- Crear ADR para cambios de arquitectura.
- Marcar estado: propuesto, validado, implementado, probado o descartado.
- Conservar referencia al documento/actor que origina el cambio.
