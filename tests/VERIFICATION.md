# Verificación de Bingo 90

## Modo musical — 5 de octubre de 2026

- 14 pruebas de dominio aprobadas: incluyen las 7 clásicas, 3000 cartones clásicos y 2000 musicales, tamaños de 1 a 120 canciones, espacios combinatorios completos, parser UTF-8 y sorteo sin reposición.
- Regresión clásica completa aprobada con `tests/browser.cjs`: generación, impresión A4, partidas, línea/bingo, concurrencia, persistencia, restauración y apertura directa por archivo.
- `tests/music-browser.cjs` aprobado en Chrome 154: lectura del estado versión 1 sin escribir durante la lectura, persistencia versión 2 al operar y conservación de los cartones clásicos.
- TXT con BOM, tildes, distintos saltos, vacíos, duplicados y texto parecido a HTML; errores de UTF-8 informados. El generador no guarda ni reserva códigos ante un fallo de worker simulado.
- Recorrido de 30 canciones y 5 casillas: generación, sorteo, nombres en última bolilla, hover, foco, toque emulado, pausa, cuatro aciertos no válidos y cinco aciertos como bingo completo sin línea.
- Alternancia con una partida clásica existente; la verificación clásica mantiene línea y bingo.
- Respaldos mixtos restaurados en un contexto vacío, cancelación e índices inválidos sin cambios; continuidad de códigos y agotamiento del bolillero.
- Impresión de cartones de 5, 10, 15 y 20 canciones y nombres extensos. Se comparó cada número y título de la plantilla con el estado guardado. Los cartones que caben en una hoja permanecen completos; los más extensos usan partes identificadas. Una prueba extrema de títulos de miles de caracteres comprobó conservación completa del texto a través de 15 páginas.
- PDFs revisados mediante imágenes de Poppler. No se probó una impresora física.
- Vistas escritorio, ampliada y móvil revisadas; sin desbordamiento horizontal a 390 px. Apertura directa de index.html y generación musical sin red. Ninguna solicitud externa durante el recorrido HTTP.

Para repetir: `node --test tests/domain.test.js tests/music.test.js`. Para navegador, iniciar `node serve.js` y ejecutar `node tests/music-browser.cjs` en el entorno de QA con Playwright y Chrome ya disponibles, como en la prueba clásica. La aplicación sigue sin dependencias. Evidencias en `tests/artifacts/music/`.

## Versión clásica original

Verificación realizada el 30 de septiembre de 2026 sobre los archivos estáticos finales.

## Resultados

- 7 pruebas de dominio aprobadas con el runner incluido en Node.js: tres sets de 1000 cartones, invariantes de filas y columnas, combinaciones únicas, cantidad inválida, reintentos agotados, 90 extracciones, línea, bingo, códigos y respaldos.
- Recorrido de integración aprobado en Chrome 154 usando un perfil temporal independiente de los datos del usuario.
- Generación en worker de sets de 1, 6, 7, 100 y 1000 cartones; códigos únicos entre sets. Persistencia exacta de matrices y códigos después de recargar.
- Comparación de cada casilla y cada código de la plantilla de impresión contra el set guardado, incluyendo los 1000 cartones.
- Exportación A4: 1, 6, 7 y 100 cartones producen respectivamente 1, 1, 2 y 17 páginas. Revisión visual de páginas renderizadas con Poppler: códigos legibles, seis cartones completos por hoja, última hoja parcial, sin controles de la aplicación ni cortes de cartones.
- Partida recuperada tras 23 extracciones. Dos clics sincrónicos producen una sola extracción. Un fallo de guardado simulado conserva el tablero y el historial anterior y muestra un error.
- Bloqueo de la segunda pestaña y toma del control después de cerrar la primera. Nueva ronda conserva los cartones y el historial anterior.
- Verificador: formato inválido, código inexistente, cartón ajeno al set, código con espacios, línea válida y bingo válido. Foco inicial en el código y navegación al botón con Tab. No se permite extraer mientras se verifica.
- Restauración cancelada o con JSON malformado, versión desconocida, contador inválido o bolillas repetidas conserva los datos anteriores.
- Respaldo descargado coincide con los datos guardados. Restauración en un contexto vacío devuelve el mismo bingo válido y el próximo código conserva la secuencia.
- Agotamiento de 90 bolillas sin duplicados; el botón queda deshabilitado. Vista de 390 px sin desbordamiento horizontal y tablero ampliado revisado visualmente.
- Apertura directa por `file://` en Chrome, generación de un cartón mediante worker y recuperación desde IndexedDB después de recargar.
- Sin errores JavaScript no controlados en la página instrumentada.

## Reproducir

Dominio (sin instalar nada): `node --test tests/domain.test.js`.

Integración: iniciar `node serve.js`; luego ejecutar `node tests/browser.cjs` desde un entorno de QA que ya disponga de Playwright y Chrome. Si Playwright está en otra ubicación, definir `BINGO_PLAYWRIGHT` con su ruta. Ese paquete se usa exclusivamente para automatizar las pruebas y no es cargado por la aplicación.

Las capturas, PDFs y respaldo de prueba se generan en `tests/artifacts/`. Son datos temporales de prueba, no los cartones del usuario. No se validó una impresora física; la impresión fue comprobada sobre la salida PDF del navegador.
