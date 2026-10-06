# Verificación de fragmentos musicales

Fecha: 2026-10-06. Entorno: Windows, Chrome, HTML/CSS/JavaScript sin frameworks.

## Pruebas automatizadas

- 28 pruebas unitarias aprobadas: `node --test tests/domain.test.js tests/music.test.js tests/appearance.test.js tests/music-audio.test.js tests/clips.test.js`.
- Suites de navegador aprobadas: `browser.cjs`, `music-browser.cjs`, `appearance-browser.cjs`, `music-audio-browser.cjs` y `clips-browser.cjs` (directorio `tests`).
- Fragmentos: migración y respaldo versión 3, validación atómica, borradores independientes, guardado sin archivo, duración real, archivos inválidos o más cortos, preescucha sin partida, pausa/reanudación/reinicio, cancelación y cambios de contexto.
- El fragmento 00:02–00:04 terminó en 4.005525 segundos del archivo; tolerancia exigida: 300 ms. Fin sin extracción de otra bolilla.
- Recarga conserva límites y requiere volver a seleccionar archivos locales. Verificados `file://`, HTTP local y subdirectorio estático, sin envío de audios ni solicitudes externas.
- Regresiones cubiertas: clásico, musical, impresión y respaldos anteriores. Capturas de las seis combinaciones de apariencia y móvil en `tests/artifacts/clips/`; revisión visual de legibilidad y controles. Artefactos generados ignorados por Git.

## Comprobación audible humana

Archivo de seis segundos: tono grave antes del segundo 2 y después del 4, pitidos agudos entre 2 y 4. Prueba en una partida temporal separada, con fragmento 00:02–00:04.

El usuario confirmó al probar dos veces: «Sí, se corta y repite bien». Esta observación audible complementa las mediciones automáticas.

## Alcance

Verificado en Chrome sobre Windows; el tamaño móvil se comprobó por emulación, sin prueba física en Safari/iOS. El corte es interactivo mediante el reproductor del navegador, no edición de audio de precisión. Implementación local; este cambio no se publicó en GitHub Pages durante esta verificación.
