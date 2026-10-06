# Design

## Context

El audio local ya está implementado y validado localmente. `js/music-audio.js` mantiene una biblioteca temporal por set y un único reproductor con invalidación de promesas. `restart()` usa cero y `ended` marca el final natural. `js/app.js` genera las filas del diálogo con selectores de archivos; `syncAudio()` selecciona la última canción del juego al actualizar controles. El estado del dominio admite versiones 1 y 2 y se guarda como objeto en IndexedDB, versión física 1. Las pruebas existentes cubren reproducción, respaldos y temas.

## Goals / Non-Goals

**Goals:** separar tiempos duraderos de archivos temporales, reutilizar el reproductor sin solapamientos y aislar la preescucha del sorteo.

**Non-Goals:** procesamiento o modificación de audio, precisión de edición profesional, nuevas dependencias o permisos permanentes del disco. Ver proposal.md para alcance de producto.

## Decisions

### Estado versión 3 y tiempos en segundos

Cada set musical versión 3 tiene `clips`, arreglo paralelo a `songs`, con elementos `{start: 0, end: null}` por defecto. Valores enteros seguros en segundos; fin null o entero mayor a inicio. Arreglo de longitud exacta, objetos completos, sin huecos; un set clásico no admite clips. Esto identifica el fragmento por número, incluso con títulos repetidos o un mismo archivo en varios números.

Extender `emptyState` y `validateState` para versión 3. Adaptar 1 a 2 con la lógica existente, luego 2 a 3 agregando valores por defecto, sin mutar la entrada. Rechazar un campo clips inesperado en respaldos viejos para no interpretar datos sin contrato. La normalización ocurre al leer; guardar la versión nueva solo en la siguiente escritura autorizada, como la migración actual. La estructura física de IndexedDB no cambia.

Se descarta un campo opcional en versión 2: versiones viejas podrían aceptar el respaldo e ignorar los fragmentos, reproduciendo contenido distinto del configurado. Actualizar expectativas de versión en tests sin quitar las verificaciones de datos históricos.

### Editor con borradores explícitos

Agregar en cada fila Inicio y Fin con ejemplos, validación y botones Guardar fragmento, Restablecer canción completa y Probar fragmento. El formato es `m:ss` o `mm:ss`, con minutos de cualquier longitud dentro del rango numérico seguro y segundos 00–59; no se aceptan fracciones. Inicio vacío es cero; fin vacío es null. Mostrar duración cuando se conozca y resumen del tramo guardado. Los cambios se conservan como borradores en memoria mientras el diálogo permanece abierto, incluidos los que ocurren al agregar archivos y reconstruir filas.

Guardar valida y usa la transacción existente `mutate`, volviendo a buscar el set actual por ID: `audioSet` no debe retener una referencia obsoleta después de que mutate reemplace state. No borrar borradores ajenos ni mover el foco de la fila al renderizar. Restablecer persiste `{start:0,end:null}`; fallos conservan borrador y dato previo. Guardar no reproduce automáticamente y detiene una prueba de esa fila. Cerrar descarta borradores no guardados; informar esta regla en el diálogo.

Se descarta guardar en cada tecla: entradas parciales no son intervalos válidos y causarían escrituras y reconfiguraciones innecesarias.

### Duración y fuente activa

Consultar metadatos del archivo de la fila al validarlo o probarlo, usando un elemento de audio sin reproducción y una URL temporal liberada al finalizar/cancelar. Cachear duración por objeto File durante la sesión; no por nombre, ni en el respaldo. No cargar metadatos de todo el catálogo al abrir. Mostrar estado de lectura y manejar error/espera acotada. Sin archivo se permite guardar un intervalo estructuralmente válido; con archivo pero duración aún no disponible, completar la comprobación antes de Guardar o Probar. Ante error, ofrecer corregir/reasociar o quitar el archivo para guardar solo los tiempos como pendientes.

El reproductor siempre revalida al cargar, aunque haya valores guardados: duración finita positiva, inicio menor a duración y fin no mayor a duración. No ajustar silenciosamente límites cuando se cambia de archivo. Permitir fin igual a duración; fin null usa final natural. Al detectar intervalo incompatible se informa y no se inicia audio, sin revertir extracciones.

### Posición y final del fragmento

Extender select con límites y contexto en su identidad para que un cambio de tiempos invalide la pista. Esperar metadatos, validar, posicionar `currentTime` y confirmar la búsqueda antes de play; todos los pasos comprueban el contador de operación. No reproducir un instante desde cero mientras se prepara el desplazamiento.

Usar observación de tiempo y un temporizador recalculado con el tiempo de reproducción para detener al alcanzar el fin, cancelando observadores/temporizadores al pausar, cambiar de fuente, reiniciar o detener. Antes de cualquier reanudación validar que la posición esté dentro del tramo; si terminó, volver al inicio. Mantener el evento ended para fin natural. El corte es el de reproducción interactiva del navegador, no una edición exacta de muestras: pruebas en primer plano con tolerancia máxima de 300 ms y comprobación de que reanudar nunca continúa después del límite. Al ocultarse la página con un fragmento activo, pausarlo sin reanudación automática para evitar sobrepasar el límite por suspensión de temporizadores; aplicar igual a preescucha y sorteo y explicarlo en README.

Conservar manejo de play rechazado: el usuario puede reintentar con un clic, usando el inicio correcto. No modificar la generación ni la confirmación de bolillas.

### Preescucha como contexto separado

Reutilizar un solo reproductor audible con contextos `game` y `preview`. Al abrir el diálogo pausar el sorteo; Probar selecciona la fila y una copia validada de sus borradores. En contexto preview, `syncAudio()` no debe reemplazar la prueba con la última bolilla cuando mutate o controles se actualicen. El diálogo muestra estado y Detener prueba; cambiar de fila detiene la anterior, modificar el archivo o límites de la fila activa invalida la prueba.

Cerrar el diálogo detiene preview, descarta borradores y prepara la última canción del juego con límites persistidos sin autoplay. Guardar clips no altera la partida ni los archivos asociados. Cambio de partida, importación, pagehide o pérdida de control cancela cargas, pruebas y temporizadores. Las pruebas no requieren una partida activa, solo un set y control de operación. No crear un segundo reproductor audible: podría superponerse con el sorteo.

## Risks / Trade-offs

- Nueva versión incompatible hacia atrás → documentar conservar un respaldo previo a la actualización; no prometer que el código viejo lea versión 3.
- Metadatos o búsquedas lentas → estado de carga, cancelación por operación, reintento y errores sin modificar bolillas.
- Temporizadores suspendidos → pausa al ocultar la pestaña y comprobación de límites antes de reanudar.
- Render reemplaza referencias o borradores → estado de edición separado por set/número, guardado puntual y pruebas de varios borradores simultáneos.
- Archivo reemplazado con igual nombre → validar por identidad File y duración real; no persistir duración ni asociación.

## Migration Plan

Implementar primero validación y adaptación de respaldos; luego editor y reproducción. Verificar recuperación de versiones 1/2/3 y rechazo atómico de intervalos inválidos. Actualizar README y evidencia QA. La entrega sigue siendo estática con rutas relativas y sin cambios del servidor. Para volver a una versión anterior se requiere un respaldo previo compatible; no sobrescribir datos versión 3 desde código viejo. No implementar ni publicar durante esta planificación.
