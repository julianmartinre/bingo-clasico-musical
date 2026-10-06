# Proposal

## Why

La reproducción musical actual comienza siempre en cero y continúa hasta terminar el archivo. Elegir un fragmento permite usar, por ejemplo, el estribillo y comprobarlo al preparar el bingo sin editar los audios originales.

## What Changes

- Agregar Inicio y Fin opcional por número de canción en Audios del set, con formato minutos:segundos.
- Ofrecer Probar fragmento y Detener prueba antes de guardar los tiempos.
- Guardar los tiempos en el set y en los respaldos; mantener archivos y asociaciones locales temporales.
- Aplicar el fragmento al sortear, reanudar y volver al inicio, deteniéndose al final configurado sin sacar otra bolilla.
- Validar orden y duración, mostrando errores sin reproducir una parte equivocada ni modificar el juego.
- **BREAKING:** exportar respaldos versión 3; aceptar y adaptar versiones 1 y 2 con reproducción completa por defecto. Las versiones anteriores de la aplicación no leen versión 3.

## Capabilities

### New Capabilities

- `fragmentos-musicales`: configuración, prueba, persistencia y reproducción de intervalos por canción.

### Modified Capabilities

No hay especificaciones principales registradas. Este cambio extiende el audio local implementado: sustituye reproducción desde cero por inicio configurable, agrega preescucha y amplía el respaldo versión 2 a 3. Los artefactos del cambio anterior conservan su valor histórico; no se archivan ni sincronizan aquí.

## Impact

`js/domain.js` (validación y adaptación), `js/music-audio.js` (límites y preescucha), `js/app.js`, `index.html`, `styles.css`, README y pruebas. Se reutiliza IndexedDB sin cambiar su esquema físico. HTML, CSS y JavaScript vanilla, sin dependencias ni servicios. Se preservan reglas, cartones, temas y privacidad de los archivos.

## Non-Goals

Editor de forma de onda, recorte o exportación de archivos, fades, mezcla, múltiples fragmentos por canción, detección automática de estribillos o persistencia de los audios. Esta etapa crea únicamente el plan.
