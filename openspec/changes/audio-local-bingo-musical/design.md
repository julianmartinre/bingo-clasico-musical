# Design

## Context

`js/app.js` guarda la extracción mediante `await mutate(...)`, actualiza la interfaz y usa una instantánea para verificar cartones. No tiene audio. Las canciones son un arreglo ordenado por set: el número es índice + 1, y se admiten títulos repetidos. Los datos persistentes y respaldos son versión 2. `serve.js` permite recursos mediante una lista explícita. La aplicación tiene temas y tablero ampliado.

## Goals / Non-Goals

**Goals:** aislar la reproducción del dominio; reproducir solo extracciones confirmadas; mantener archivos locales y manejar restricciones reales del navegador.

**Non-Goals:** Web Audio para mezclar o procesar música, acceso permanente al disco, servicios externos o migración de datos. Ver alcance de producto en proposal.md.

## Decisions

### Biblioteca temporal por set

Agregar `js/music-audio.js` con asociaciones en memoria `setId → número → File` y catálogo de archivos por set. El diálogo «Audios del set» se abre desde el set musical guardado y desde su partida, incluyendo tablero ampliado. El selector admite varios archivos con `accept="audio/*"`; el filtro orienta, pero el reproductor determina si puede decodificar el archivo. Cancelar no cambia nada. Nuevas selecciones agregan archivos, sin reemplazar vínculos previos; duplicados exactos por nombre, tamaño y fecha no se agregan de nuevo. Archivos diferentes con igual nombre permanecen candidatos separados, etiquetados con tamaño y fecha.

Normalizar nombre sin última extensión y título con Unicode NFD, eliminación de marcas diacríticas, minúsculas, trim y espacios internos colapsados. No quitar prefijos numéricos, artista o puntuación: evitar falsas coincidencias. Solo vincular automáticamente si el título normalizado y el candidato son únicos en sus respectivos listados. Resolver títulos repetidos manualmente por número, permitiendo reutilizar un archivo. Usar texto escapado mediante textContent en nombres y títulos. Desvincular no modifica el TXT ni los cartones.

Se descarta persistir binarios en IndexedDB por tamaño y alcance; tampoco se usan permisos permanentes de File System Access. Esta decisión mantiene el mismo flujo en archivo local, servidor estático y GitHub Pages. El aviso de nueva selección tras recarga aparece en el diálogo.

### Un reproductor, una fuente activa

Un único elemento audio reutilizado, con controles propios etiquetados para reproducir/pausar, volver al inicio y volumen. Crear una URL blob solo para el archivo actual; al cambiarlo, pausar, retirar fuente, llamar load y revocar la URL anterior. Liberar al restaurar o cerrar la página. Evitar leer todos los archivos completos o precargarlos en paralelo.

Estado de presentación: sin canción, sin archivo, cargando, reproduciendo, pausado, terminado, bloqueado y error. Escuchar eventos del elemento y la promesa de play; no mostrar reproduciendo hasta confirmación. Un contador de operación invalida resoluciones/rechazos antiguos cuando se cambia de pista o contexto. Una sola instancia evita superposición; la invalidación evita que errores tardíos sustituyan el estado actual.

Predeterminados propuestos: reproducción desde segundo cero, pista completa sin bucle, volumen inicial 50 % mantenido en memoria. Volumen no persistido; cuando el navegador no permita ajustarlo, indicar uso del volumen del dispositivo. No es requisito reproducir canciones desde el historial ni preescuchar archivos antes del sorteo.

### Integración después de guardar

Modificar el manejador de Sacar bolilla para comprobar el resultado de mutate y, solo si fue exitoso y el contexto sigue vigente, iniciar la última canción confirmada. Mantener generación aleatoria y guardado actuales. No poner play dentro de render: recargar, cambiar apariencia o recalcular controles no deben iniciar sonido. Capturar identificador de partida y número para descartar operaciones desactualizadas. Si la nueva canción no tiene archivo, detener la anterior igualmente.

El await de IndexedDB y las políticas del navegador impiden garantizar inicio automático en todos los entornos. Intentar play y capturar NotAllowedError mostrando «Reproducir canción»; ese botón llama play directamente desde el gesto del usuario. No adelantar audio al guardado ni usar silencios para eludir restricciones. Un error de formato o decodificación informa del problema sin revertir bolillas.

### Transiciones explícitas

Pausar al abrir el verificador, sin reanudar al cerrarlo. Detener al cambiar de partida o iniciar otra, pasar a clásico o perder control de operación. Importar correctamente detiene y vacía biblioteca y asociaciones para evitar reutilizar IDs con otra lista; cancelar/error no limpia. Corregir el archivo actual detiene y espera reproducción manual. Cambios de apariencia o ampliación no recrean el reproductor. Solo la pestaña operadora tiene reproducción habilitada, respetando el bloqueo existente.

Los controles se sitúan junto a la última canción y usan variables semánticas existentes; se ocultan en clásico y se excluyen de impresión. El diálogo reutiliza los patrones de foco y cierre. El juego sigue utilizable sin biblioteca ni archivos compatibles.

## Risks / Trade-offs

- Bloqueo de reproducción → botón explícito y estados derivados del elemento, conservando el resultado sorteado.
- Extensión o MIME engañosos → manejar errores reales de carga/decodificación; documentar MP3 como formato sugerido, sin prometer todos los códecs.
- Selecciones ambiguas → vínculo manual por número; no adivinar por similitud.
- Carreras entre guardado, play y cambio de partida → identificador de operación y comprobación de contexto; pruebas con promesas demoradas.
- Memoria de archivos grandes → referencias File y una URL activa, sin base64 ni lectura masiva; liberar recursos al reemplazar.
- Diferencias móviles de volumen y reproducción → pruebas en navegadores objetivo; mostrar límites reales, sin afirmar compatibilidad no comprobada.

## Migration Plan

No hay migración del juego. Agregar script antes de app.js y permitirlo en serve.js, con ruta relativa apta para GitHub Pages. Probar localmente y en un subdirectorio estático. La publicación requerirá la etapa de implementación autorizada; este cambio solo crea el plan. Revertir recursos del reproductor deja intactos juegos y respaldos.

## References

- [MDN: play y sus errores](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play): la reproducción programática puede rechazarse; esperar el resultado antes de actualizar el estado.
- [MDN: archivos seleccionados y URLs de objetos](https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications): acceso a archivos elegidos por el usuario y liberación de URLs temporales.
