# Cartones musicales configurables — 2026-10-10

Implementación de `cartones-musicales-configurables`. Estado lógico 5; IndexedDB conserva versión física 1.

## Resultados

- 36 pruebas unitarias aprobadas: dominio clásico, musical, nuevas grillas, carpeta, referencias, audio, fragmentos y apariencia.
- Siete suites de navegador aprobadas: `browser.cjs`, `music-browser.cjs`, `music-grid-browser.cjs`, `folder-browser.cjs`, `appearance-browser.cjs`, `music-audio-browser.cjs` y `clips-browser.cjs`.
- Chrome 154.0.8037.98 en Windows: todas las suites. Edge 154.0.4258.62: suite nueva de grillas. Móvil comprobado con viewport 390 × 844; no equivale a pruebas en dispositivos físicos. Safari y Firefox no probados.
- HTTP local, apertura `file://` sin red y servidor estático con subdirectorio comprobados por las suites musical/carpeta. Ninguna dependencia de ejecución nueva.

## Cobertura específica

- K de 1 a 15, N menor que 15, K=N, valores vacíos/fraccionarios/fuera de rango; espacio completo de combinaciones sin duplicados.
- Matrices densas de 27 celdas, filas equilibradas, hasta cinco números por fila, orden ascendente y coincidencia exacta con `numbers`. Rechazo de huecos, duplicados, rangos y dimensiones corruptas.
- Migraciones puras 1–4; listas históricas de 20 canciones, códigos, clips, referencias e historial conservados. Respaldo versión 5 y rechazo de restauración corrupta sin modificar datos.
- Carpeta nueva, cancelación, carpeta inválida, exclusiones hasta cero, renombre y orden. Ajustes visibles de K y máximo de cartones. Teclado y congelación del formulario durante el worker/guardado.
- Generación real K=1,4,12,15; recarga y reimpresión idéntica; verificador con K−1 aciertos, sin marcar vacíos y solo bingo completo. Renderer histórico de listas conservado.
- Regresiones comprueban errores de worker/guardado sin consumir códigos, asociaciones de archivos, reproducción/fragmentos y sorteo. Cambiar K no modifica sets ni partidas guardadas.

## Evidencia visual e impresión

Archivos de QA ignorados por Git en `tests/artifacts/`:

- `grid/light-forest.png`, `light-ocean.png`, `light-plum.png`, `dark-forest.png`, `dark-ocean.png`, `dark-plum.png`: verificador en seis apariencias.
- `grid/mobile-verifier.png`, `grid/mobile-size.png`: móvil, grilla con desplazamiento horizontal dentro del cartón si hace falta.
- `music/cartones-30.pdf`, `cartones-60.pdf`, `cartones-90.pdf`, `cartones-120.pdf`: A4, referencia de canciones y grilla íntegra.
- `music/continuaciones.pdf`: títulos extremos completos repartidos en partes con código y continuidad. La suite reconstruye todos los títulos desde las partes y los compara íntegramente con el set; verifica altura de página.
- Renderizados con Poppler e inspeccionados: `grid/pdf-short.png`, `grid/pdf-long-first.png`, `grid/pdf-long-second.png`. Nueve columnas visibles, títulos dentro de márgenes, código/parte repetidos y ninguna grilla dividida.

No hay nueva comprobación audible manual: no se modificó el reproductor; sus suites de reproducción y corte pasaron. 

## Repetir

```powershell
node --test tests/domain.test.js tests/music.test.js tests/music-grid.test.js tests/appearance.test.js tests/music-audio.test.js tests/clips.test.js tests/song-paths.test.js tests/folder.test.js
node serve.js
# En otra terminal, con Playwright disponible mediante BINGO_PLAYWRIGHT:
node tests/music-grid-browser.cjs
node tests/music-browser.cjs
```

`BINGO_CHANNEL=msedge` ejecuta la suite de grillas en Edge. Por defecto usa Chrome. Las pruebas usan perfiles temporales separados de los datos del usuario.

## Ajustes posteriores solicitados

Las grillas muestran «número. canción» dentro de cada casilla, hasta cuatro líneas, sin lista duplicada debajo. Los títulos completos siguen en los datos y en el tooltip. La impresión agrupa varios cartones por A4; las listas históricas conservan su renderer. Se volvieron a ejecutar las suites musical y grillas con éxito. Se inspeccionó `grid/pdf-compact.png`, con dos cartones completos en una misma hoja. La evidencia anterior de continuaciones corresponde al formato previo; el PDF actual de títulos extremos es `music/titulos-largos-grilla.pdf` y conserva la grilla compacta.
