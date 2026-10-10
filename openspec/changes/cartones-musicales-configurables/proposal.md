# Proposal

## Why

El tamaño automático del cartón musical no permite elegir la duración y dificultad de una ronda. Se necesita seleccionar cuántas canciones contiene y presentarlo como un cartón tradicional con espacios vacíos.

## What Changes

- Campo «Canciones por cartón» al preparar un set musical: entero entre 1 y el menor entre 15 y las canciones incluidas en la carpeta.
- Nuevos cartones musicales con grilla fija de 3 filas por 9 columnas, números seleccionados y casillas vacías. Máximo de cinco números por fila.
- Números en la grilla y referencia de número/nombre completo debajo, conservando código de identificación y legibilidad de títulos largos.
- Recalcular máximo de cartones únicos según canciones disponibles y tamaño elegido; si se eligen todas las canciones, solo existe un cartón único.
- Guardar tamaño y distribución para reimpresiones y respaldos estables. Los sets existentes conservan tamaño y presentación anteriores.
- Mantener solo bingo completo en musical, carga desde carpeta, audios, fragmentos, temas y bingo clásico sin cambios de reglas.

## Capabilities

### New Capabilities

- `cartones-musicales-configurables`: tamaño elegible, grilla musical 3 × 9 y persistencia compatible.

### Modified Capabilities

No hay especificaciones principales registradas. Este cambio sustituye el tamaño automático y la presentación de nuevos sets de los cambios musicales anteriores; sus artefactos se conservan como historial.

## Impact

`js/domain.js` (combinaciones, generador y validación), `js/app.js` (formulario, worker y guardado), `js/music-print.js`, `index.html`, `styles.css`, pruebas y README. Estado lógico versión 5, con migración de versiones 1–4 y sin nueva versión física de IndexedDB. HTML/CSS/JS vanilla, sin dependencias nuevas. Esta etapa solo prepara el plan.
