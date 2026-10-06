# Proposal

## Why

El bingo musical muestra el número y el nombre sorteado, pero requiere buscar y reproducir cada canción por separado. Asociar archivos de audio locales permite acompañar el sorteo desde la misma aplicación, también cuando se abre desde GitHub Pages.

## What Changes

- Cargar varios audios para un set musical existente, sin enviarlos a ningún servidor.
- Asociar por nombre de archivo y permitir corregir manualmente faltantes o coincidencias ambiguas por número de canción.
- Reproducir desde el inicio la canción después de confirmar su extracción y detener la anterior, sin superponer pistas.
- Ofrecer reproducir/pausar, volver al inicio y volumen, en tablero normal y ampliado.
- Continuar el bingo si falta un archivo o falla la reproducción; ofrecer inicio manual cuando el navegador bloquee el automático.
- Mantener archivos y asociaciones solo durante la sesión de la página; explicar que deben seleccionarse nuevamente tras recargar y que no forman parte del respaldo.
- Conservar bingo clásico, reglas musicales, cartones, impresión y temas existentes.

## Capabilities

### New Capabilities

- `audio-local-musical`: selección y asociación de audios, reproducción vinculada a extracciones confirmadas, controles, errores y ciclo de vida local.

### Modified Capabilities

Ninguna especificación principal registrada (`openspec list --specs` está vacío). Esta capacidad extiende el bingo musical implementado sin cambiar sus reglas; no archiva ni sincroniza otros cambios.

## Impact

Nuevo módulo vanilla `js/music-audio.js`; integración en `js/app.js`, `index.html`, `styles.css` y lista de recursos de `serve.js`. Pruebas de asociación y navegador, y documentación README. Sin dependencias, backend, cambios en IndexedDB o respaldos versión 2. La implementación y publicación quedan para una solicitud posterior.

## Non-Goals

Streaming, servicios musicales externos, descarga de canciones, reconocimiento de audio, lectura de etiquetas ID3, recortes automáticos, mezcla de pistas, audios incluidos en cartones o almacenamiento persistente de archivos. No se generan canciones a partir del TXT.
