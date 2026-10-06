# Verificación de audio local — 2026-10-06

## Resultado

- 22 pruebas unitarias aprobadas: dominio clásico, musical, apariencia y audio local.
- Suites de navegador clásico, musical, apariencia y audio aprobadas en Google Chrome para Windows, mediante Playwright del entorno de QA.
- Archivos WAV sintéticos decodificados y reproducidos: eventos y avance de tiempo comprobados, pausa/reinicio/volumen y fin sin sorteo adicional.
- Coincidencias normalizadas, duplicados ambiguos, corrección manual, reutilización, cargas adicionales y cancelación comprobados.
- Fallo de guardado no cambia audio ni historial; reproducción bloqueada se recupera con un clic; archivos faltantes o corruptos no revierten bolillas.
- Verificación pausa sin reanudar; nueva partida, cambio a clásico y pérdida del bloqueo detienen la pista. Pestaña de lectura no puede reproducir.
- Importación cancelada o inválida conserva biblioteca; importación exitosa con IDs reutilizados la limpia. Recarga pierde asociaciones, respaldos versión 2 intactos.
- Registro de solicitudes sin envío de archivos de audio ni solicitudes a servicios externos.
- Flujo probado desde file://, servidor local y subdirectorio HTTP equivalente a GitHub Pages.
- Revisadas capturas en seis temas y móvil ampliado. Las suites existentes verifican impresión y continuaciones sin regresiones.
- Comprobación audible en Chrome visible con perfil temporal separado: el usuario confirmó «Sí, se escucha» al probar el tono local. Esta confirmación se registra separada de las pruebas automáticas.

## Alcance

La prueba audible usa un tono WAV de prueba, no canciones del usuario. No se verificó físicamente Safari/iOS ni Android. El formato/códec y ajuste de volumen dependen del navegador; los fallos tienen mensajes y recuperación sin afectar el sorteo. No se publicó esta implementación durante estas pruebas.

## Repetir

Con `node serve.js` activo y Playwright disponible en QA (BINGO_PLAYWRIGHT permite indicar su ruta):

```powershell
node --test tests/domain.test.js tests/music.test.js tests/appearance.test.js tests/music-audio.test.js
node tests/browser.cjs
node tests/music-browser.cjs
node tests/appearance-browser.cjs
node tests/music-audio-browser.cjs
```

La última prueba genera un WAV y capturas en tests/artifacts/audio, excluido de Git. Para la prueba audible, ejecutar después `node tests/music-audio-manual.cjs`: abre Chrome con un perfil temporal, sin tocar las partidas del usuario. Pulsar Sacar bolilla y confirmar la salida de sonido; cerrar la ventana termina la prueba. Playwright no es una dependencia de la aplicación.
