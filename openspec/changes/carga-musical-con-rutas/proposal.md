# Proposal

## Why

Preparar un bingo musical requiere vincular audios manualmente cuando sus nombres no coinciden con los títulos. Importar títulos y referencias de archivo juntos permitirá asociar una carpeta de canciones en bloque y corregir solo las excepciones.

## What Changes

- Importación de CSV con columnas `cancion,ruta`, con coma o punto y coma, y TXT con modalidad explícita de listado simple o de título y ruta. Vista previa antes de generar cartones.
- Selección opcional de carpeta o múltiples audios durante la preparación; asociación automática por referencia, con estados de asociado, faltante y ambiguo.
- Las rutas son referencias para comparar archivos seleccionados: no otorgan acceso al disco. Compatible con la publicación estática en GitHub Pages.
- Corrección posterior de referencia y archivo por número de canción, sin modificar cartones ni numeración; prioridad para elecciones manuales.
- Persistencia de referencias y migración de respaldos, manteniendo los archivos exclusivamente en memoria y requiriendo seleccionarlos tras recargar.
- Conservación del TXT simple, bingo clásico, fragmentos, impresión y reglas musicales actuales.
- Excel se admite mediante exportación a CSV UTF-8; quedan fuera `.xlsx`, librerías nuevas, servidores, descargas desde URLs y acceso automático a rutas del equipo.

## Capabilities

### New Capabilities

- `carga-musical-con-rutas`: contrato de importación tabular, asociación por rutas seleccionadas, corrección y persistencia de referencias.

### Modified Capabilities

Ninguna especificación principal registrada (`openspec list --specs` vacío). Esta ampliación se apoya en los cambios implementados `bingo-musical-txt`, `audio-local-bingo-musical` y `fragmentos-de-canciones`, sin reescribir sus artefactos.

## Impact

Cambios previstos en `index.html`, `styles.css`, `js/app.js`, `js/domain.js` y `js/music-audio.js`; posible módulo puro de importación con inclusión relativa y actualización de `serve.js`. Nuevas pruebas unitarias y de navegador, README y plantilla CSV. Estado lógico versión 4, con migración de versiones 1–3; sin cambios en la versión física de IndexedDB ni dependencias de ejecución.
