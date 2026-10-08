# Verificación de carga musical con rutas

Fecha: 2026-10-07. Chrome en Windows; pruebas automatizadas con perfiles temporales independientes de los datos del usuario.

- 32 pruebas unitarias aprobadas: dominio, musical, apariencia, audio, fragmentos y `song-paths.test.js`.
- Seis suites de navegador aprobadas: `browser.cjs`, `music-browser.cjs`, `appearance-browser.cjs`, `music-audio-browser.cjs`, `clips-browser.cjs` y `song-paths-browser.cjs`.
- Nueva suite: selección real de carpeta con subcarpetas y homónimos; CSV/TXT simple/con rutas; asociación por ruta y nombre; correcciones y prioridad manual; conservación de borradores; fallos de persistencia sin creación parcial; rechazo XLSX con instrucciones; lectura tardía descartada.
- Configuración y sorteo con WAV decodificable y fragmento 00:01–00:02; reproducción observada mediante el estado/tiempo del elemento, sin nueva comprobación auditiva humana. Las pruebas de fragmentos anteriores continúan aprobadas.
- Migración de versiones 1–3, respaldo versión 4, rechazo atómico de referencias inválidas, recarga y nueva selección de carpeta, restauración que libera asociaciones temporales.
- Impresión sin rutas, teclado, pestaña sin control, seis combinaciones de apariencia, móvil emulado sin desborde horizontal. Capturas en `tests/artifacts/song-paths/` (ignoradas por Git).
- Carga y generación probadas por HTTP local, `file://` y subdirectorio HTTP estático. Plantilla CSV servida correctamente por el servidor local. Sin solicitudes externas, envíos de archivos ni carga de metadatos de audio durante la asociación.

Para repetir, usar Node y configurar `BINGO_PLAYWRIGHT` con la instalación de Playwright del entorno de QA; la aplicación no incorpora esa dependencia. Ejecutar el servidor con `node serve.js`, luego las suites de navegador. Ejecutar unidades con `node --test tests/*.test.js` en un entorno que expanda el patrón, o enumerar los seis archivos.

No se verificó hardware móvil ni Safari/Firefox. La alternativa de selección múltiple queda disponible cuando no se usa selector de carpeta. Este cambio se verificó localmente; su publicación no forma parte de esta ejecución.
