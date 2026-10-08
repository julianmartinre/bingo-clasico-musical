# Design

## Context

Ver motivación en `proposal.md`. El código local ya incorpora carga TXT/CSV con `draftSet`, biblioteca temporal y referencias versión 4. La selección de carpeta actual solo agrega audios a un listado previamente importado. El generador copia `songs`, `audioRefs` y clips, y transfiere asociaciones después del guardado. Audios permite reelección y fragmentos por número.

## Goals / Non-Goals

**Goals:** un solo flujo de creación, correspondencia directa archivo/canción, revisión accesible y preservación de datos existentes.

**Non-Goals:** lectura de etiquetas ID3, limpieza automática de nombres artísticos, descarga de canciones, almacenamiento persistente de audios, edición del orden/títulos de sets ya impresos, alternativa TXT/CSV o selección múltiple para crear nuevos sets.

## Decisions

### Selección única y reconocimiento de archivos

Usar el selector de carpeta existente (`webkitdirectory`) como entrada principal visible desde que se elige Musical. Incluir subcarpetas. Aceptar candidatos por extensión, sin depender de MIME: `.mp3`, `.wav`, `.ogg`, `.oga`, `.m4a`, `.aac`, `.flac`, `.opus`, `.webm`. Es una lista de candidatos, no garantía de decodificación: conservar el error de reproducción actual. Ignorar otros archivos y mostrar cuántos; no leer contenido ni duración durante la carga. Archivos vacíos o con ruta no representable por `audioReference` se excluyen con motivo visible. Si no queda ninguno, informar y conservar el borrador previo.

La detección de soporte del selector permite mostrar un mensaje cuando no esté disponible: usar un navegador con selección de carpeta. No añadir silenciosamente otro método de creación, porque el usuario pidió dejar únicamente esta opción. No cambiar el mantenimiento de sets guardados, que conserva selección individual.

### Modelo de borrador por archivo

Reemplazar los arrays independientes de edición por filas con identidad temporal estable: `{id, file, relativePath, title, included}`. La identidad evita cruzar audios al mover filas o cambiar títulos. Para cada archivo, el título inicial es su nombre sin la última extensión aceptada, recortando espacios exteriores; conservar números iniciales, guiones, artista, acentos y puntos interiores. Si queda vacío, exigir título antes de generar.

Orden inicial alfabético natural de ruta relativa completa usando `Intl.Collator('es', {numeric:true, sensitivity:'base'})`, con desempate por comparación exacta de ruta. No depender del orden entregado por el selector. Rutas relativas idénticas se colapsan solo si corresponden inequívocamente a la misma entrada; rutas distintas con igual nombre/tamaño/fecha permanecen como canciones distintas y muestran su subcarpeta. Normalizar separadores para persistir; no guardar ruta absoluta del dispositivo.

Una nueva selección válida reemplaza el borrador completo; cancelar, fallar o seleccionar carpeta sin candidatos lo conserva. Indicar junto al botón que cambiar carpeta reinicia la revisión. Cambio de modalidad descarta borrador y libera referencias temporales. Proteger contra finalizaciones obsoletas con el token actual.

### Revisión simple y accesible

Mostrar carpeta, conteo de incluidas/ignoradas y canciones por cartón. Cada fila contiene inclusión, título editable, ruta relativa de solo lectura y botones Subir/Bajar accesibles por teclado. La edición se aplica al borrador directamente, sin Guardar por fila. No mostrar selectores de asociación ni campos de ruta en el generador: la relación con File es directa.

Los números provisionales son consecutivos para las incluidas en el orden visual; las excluidas no consumen número. Subir/Bajar mueve filas completas, preserva el foco y anuncia el cambio. Títulos vacíos en incluidas bloquean generar; repetidos avisan pero son válidos y no fusionan archivos. Recalcular tamaño y máximo de cartones al excluir/reincluir. Retener el nombre del set y ajustar la cantidad si supera el máximo.

### Generación y recuperación

Congelar una instantánea de filas incluidas al generar, bloqueando selección, edición, movimiento e inclusión mientras se guarda. Derivar juntos `songs`, `audioRefs` relativos y clips completos; asociar cada número a su File directamente después del guardado exitoso, sin usar coincidencia por título. Un fallo mantiene el borrador editable para reintentar y no altera códigos ni crea bibliotecas huérfanas.

Persistir versión 4 sin nuevo esquema. Al recargar, mostrar que se necesita volver a elegir la carpeta en Audios; usar referencias relativas guardadas aunque se hayan editado los títulos. No regenerar números ni títulos durante esa recuperación. Mantener correcciones manuales y clips en Audios, y lectura de respaldos 1–4. Los audios nunca se incluyen en JSON.

### Retiro del flujo anterior

Quitar del generador entrada de listado, formato, separador, plantilla, selección individual y editor de asociaciones/rutas. Retirar `examples/canciones.csv` y su ruta en el servidor; eliminar parsers TXT/CSV si ya no tienen consumidores de producción. Mantener validadores y comparación de referencias usados por respaldos y Audios.

Actualizar pruebas de creación para usar carpetas de prueba; conservar fixtures de estados históricos para verificar compatibilidad. Las pruebas específicas del importador retirado se reemplazan por pruebas del constructor de borrador, sin seguir exponiendo el flujo viejo para satisfacerlas. No editar retrospectivamente cambios OpenSpec completados: este plan documenta qué comportamiento los sustituye.

## Risks / Trade-offs

- Navegador sin selector de carpeta → mensaje de incompatibilidad de creación; sets guardados siguen utilizables. Verificar soporte real en los navegadores probados.
- Extensión válida con códec incompatible → importación como candidato y error claro al reproducir, sin alterar bolillas.
- Carpetas grandes → trabajar con metadatos, lista desplazable y evitar reconstruir todas las filas en cada pulsación.
- Títulos repetidos → identidad por archivo y referencia relativa; no inferir vinculación por título.
- Cambio de carpeta descarta edición previa → texto explícito en el botón/ayuda, cancelación y selección inválida conservan el borrador.

## Migration Plan

Implementar constructor/revisión del borrador, integrar generación, retirar entrada anterior y actualizar pruebas/documentación. No requiere migración de datos. Código versión 4 anterior puede leer los sets nuevos. Verificar compatibilidad de respaldos 1–4 y regresiones de ambos modos antes de publicar. Publicación y archivado quedan fuera de esta planificación.
