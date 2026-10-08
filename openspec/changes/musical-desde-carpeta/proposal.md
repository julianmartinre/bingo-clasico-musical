# Proposal

## Why

Preparar un archivo de texto y vincular audios agrega pasos innecesarios cuando las canciones ya están en una carpeta. El nuevo flujo convierte esa carpeta directamente en un listado editable, con cada audio relacionado desde el comienzo.

## What Changes

- Un único inicio para nuevos sets musicales: «Cargar carpeta de canciones», incluyendo subcarpetas.
- Títulos derivados del nombre del archivo sin extensión; revisión, edición, exclusión y orden antes de generar. Asociación directa con el archivo, independiente del título.
- **BREAKING**: retirar del generador musical las entradas TXT/CSV, formatos, separadores, plantilla y edición manual de rutas. No habrá otro modo de crear listados musicales.
- Conservar la configuración de audios y fragmentos de sets guardados, incluida la posibilidad de volver a elegir carpeta o reemplazar un archivo individual. Es mantenimiento de un set, no otra forma de crear listados.
- Mantener cartones, partidas, numeración y respaldos existentes, incluyendo sets creados con TXT/CSV. Guardar referencias relativas de la carpeta para reasociar tras recargar.
- Mantener bingo clásico, impresión, temas y funcionamiento estático sin dependencias nuevas. Audios locales y temporales.

## Capabilities

### New Capabilities

- `musical-desde-carpeta`: creación musical exclusivamente desde una carpeta, revisión previa y compatibilidad de datos.

### Modified Capabilities

No hay especificaciones principales registradas. Esta capacidad sustituye expresamente el flujo de creación descrito en los cambios anteriores `bingo-musical-txt` y `carga-musical-con-rutas`; sus artefactos se conservan como historial. La restauración de respaldos y el mantenimiento de audios siguen disponibles.

## Impact

Generador en `index.html` y `js/app.js`, lógica pura en `js/domain.js` y biblioteca temporal en `js/music-audio.js`, estilos, pruebas y README. Retirar plantilla CSV y su ruta en `serve.js`, más código de importación que quede sin consumidores. Reutilizar estado versión 4 (`songs`, `audioRefs`, `clips`), sin nueva migración ni cambio físico de IndexedDB. No se implementa ni publica en esta etapa de planificación.
