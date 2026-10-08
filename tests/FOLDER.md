# Verificación de musical desde carpeta

Finalizada el 2026-10-08 en Chrome sobre Windows. Perfiles temporales de prueba separados de los datos del usuario.

- 32 pruebas unitarias aprobadas: dominio, musical, apariencia, audio, fragmentos, referencias y carpeta.
- Seis suites de navegador aprobadas: `browser.cjs`, `music-browser.cjs`, `appearance-browser.cjs`, `music-audio-browser.cjs`, `clips-browser.cjs` y `folder-browser.cjs`.
- Carpeta con subcarpetas y homónimos: títulos editables, orden, exclusiones y numeración; archivos correctos tras editar y mover. Archivos vacíos y no musicales ignorados con motivo. Cancelación/carpeta inválida conservan la revisión.
- Guardado fallido sin set parcial ni consumo de códigos; controles bloqueados durante guardado; generación y sorteo con WAV real y fragmento 00:01–00:02. Reproducción comprobada mediante estado y reloj del elemento, sin nueva escucha humana.
- Recarga y reelección recuperan el archivo correcto con títulos personalizados; clips, referencias, códigos e historial se conservan. Respaldos históricos y actuales cubiertos por las suites de dominio, musical, fragmentos y referencias.
- Impresión sin rutas ni canciones excluidas, clásico de 90 números, verificación, temas y permisos sin regresiones. Capturas de seis apariencias y revisión móvil en `tests/artifacts/folder/`, ignoradas por Git. Móvil emulado: controles visibles al desplazarse, sin desborde horizontal.
- HTTP local, file y subdirectorio estático verificados. Ningún envío o solicitud externa, ni lectura de contenido/metadatos de audios durante carga. Mensaje de navegador sin selector comprobado simulando ausencia de la propiedad.

El importador TXT/CSV y su plantilla se retiraron por decisión del usuario. `song-paths-browser.cjs` fue reemplazado por `folder-browser.cjs`; las pruebas unitarias de referencias y compatibilidad se conservan. `SONG-PATHS.md` documenta la verificación histórica del flujo anterior.

No se probó Safari/Firefox ni dispositivos móviles físicos. No se publicó este cambio durante la implementación.
