# Contexto del frontend SIIH

## Stack

React + TypeScript + Vite. Primera version web responsiva; PWA del paciente en una fase posterior.

## Modulos de interfaz

- Autenticacion.
- Pacientes y busqueda de duplicados.
- Agenda/citas y llegada.
- Historia, triaje y consulta.
- Laboratorio.
- Receta, farmacia e inventario.
- Facturacion/caja.
- Reportes y administracion.

## Reglas de UI

- Mostrar solamente funciones permitidas, pero nunca depender de la UI como unica autorizacion.
- Formularios en orden logico, terminos comprensibles y mensajes claros.
- Confirmar acciones sensibles: cierre clinico, anulacion, dispensacion, ajuste y pago.
- No mostrar datos clinicos innecesarios para el rol.
- No guardar tokens o datos sensibles de forma insegura.
- Estados de carga, vacio, error y reintento en cada flujo.
- Accesibilidad basica de teclado, etiquetas y contraste.
- Fechas/horas y unidades consistentes.

## Pantallas prioritarias

1. Login.
2. Busqueda/registro de paciente.
3. Agenda de citas.
4. Historia y consulta.
5. Ordenes/resultados.
6. Recetas/dispensacion.
7. Inventario.
8. Facturacion.
9. Reportes.
10. Usuarios/roles/auditoria.

## Pruebas

- React Testing Library para componentes y reglas de presentacion.
- Playwright para flujos E2E.
- No usar datos reales.

Leer `docs/ai-context/03`, `04`, `07`, `08`, `10`, `13` y `16` antes de implementar.
