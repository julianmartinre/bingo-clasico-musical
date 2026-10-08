# Design

## Context

Ver `proposal.md` para la motivación. Hoy `Bingo.parseSongs` importa TXT simple; `app.js` conserva un borrador de títulos y crea sets con `songs` y `clips`. `music-audio.js` vincula por título normalizado y mantiene objetos File en memoria. Su deduplicación actual por nombre, tamaño y fecha puede confundir archivos homónimos de carpetas distintas. El estado lógico es versión 3; el almacenamiento y los respaldos pasan por `validateState`.

El usuario confirmó TXT/CSV con selección explícita de carpeta o archivos. No se necesita soporte XLSX. El inventario de especificaciones principales está vacío; se agrega una capacidad nueva y se mantienen los cambios históricos como antecedentes.

## Goals / Non-Goals

**Goals:** importar metadatos y asociar archivos seleccionados en un mismo flujo de preparación, resolver coincidencias determinísticamente, conservar correcciones y no alterar números ni resultados de juego.

**Non-Goals:** abrir rutas arbitrarias, almacenar audios o permisos persistentes, descargar URLs, interpretar fórmulas, reproducir al importar o modificar títulos de sets ya generados.

## Decisions

### Formatos explícitos y parser puro

Mantener TXT simple como opción predeterminada para `.txt`, sin inferir columnas a partir de comas de un título. Agregar opción «TXT con rutas» y CSV. El TXT con rutas usa el mismo parser tabular sin cabecera; CSV exige cabecera `cancion,ruta` (aceptar `canción`, mayúsculas y espacios exteriores). Dos columnas exactas; título obligatorio, ruta opcional. No aceptar columnas adicionales silenciosamente.

Separador seleccionable coma/punto y coma, con detección inicial solo si un único candidato produce un documento válido; si ambos o ninguno sirven, pedir elegir/corregir. Comillas dobles protegen delimitadores y saltos de línea, `""` representa comilla; espacios exteriores se recortan. UTF-8 estricto, BOM opcional, LF/CRLF/CR. Ignorar registros totalmente vacíos; conservar duplicados y orden, avisando como hoy. Errores con número de registro/línea y sin creación parcial. Reutilizar la validación de títulos vigente. No usar `split(',')` ni cargar librerías de hojas de cálculo.

Ejemplo CSV (también exportable desde Excel como CSV UTF-8):

```csv
cancion,ruta
Fantasma - Miranda,C:/Descargas/Musica/tema.mp3
Don,Musica/Don.mp3
"Una canción, en vivo",Musica/vivo.mp3
Sin audio,
```

### Flujo de preparación y confirmación

Después de leer el listado, mostrar número, título, referencia y estado; permitir seleccionar carpeta (`webkitdirectory`) o múltiples archivos. La carpeta devuelve rutas relativas, nunca una autorización a abrir cualquier ruta escrita. Mantener alternativa de archivos si la selección de carpeta no funciona. Vista previa con resumen asociados/faltantes/ambiguos/sin referencia, corrección de referencia y selector manual por fila. Generar sigue permitido sin audios completos.

Separar borrador de canciones/referencias/biblioteca de los sets guardados. Reemplazar listado o modalidad limpia las selecciones del borrador; cancelar selector conserva la selección previa. Invalidar lecturas tardías mediante el token existente. Generar toma una instantánea del borrador y bloquea cambios hasta terminar; solo tras persistir el set transfiere los File y elecciones a su biblioteca. Un fallo no deja asociaciones huérfanas ni borra el borrador.

### Referencias y coincidencias

Normalizar solo para comparar: espacios exteriores, Unicode NFC, separadores `\` a `/` y segmentos `.`. Mantener mayúsculas y acentos (salvo letra de unidad Windows) para no fusionar archivos distintos. Rechazar segmentos `..`, controles y esquemas URI (`http:`, `file:`, `data:`, etc.); aceptar unidad Windows, ruta POSIX absoluta, UNC y relativa como etiquetas, nunca como destinos de lectura. No decodificar porcentajes ni expandir variables.

Para cada referencia no vacía buscar, en este orden: (1) igualdad de ruta relativa seleccionada, incluyendo raíz de carpeta, o ruta relativa sin esa raíz; (2) para referencias absolutas, ruta relativa completa seleccionada como sufijo por segmentos; (3) nombre final con extensión. En cada nivel, una coincidencia asocia; más de una marca ambiguo y detiene la búsqueda. Si hay referencia explícita sin coincidencia, no usar el título como alternativa. Sin referencia se conserva la asociación actual por título único normalizado.

Al elegir archivos individuales solo se conoce `File.name`: un nombre único puede asociarse aunque la referencia sea absoluta. La UI indica «por nombre» para no dar a entender que se comprobó la carpeta absoluta. La vista previa permite corregir una coincidencia antes de usarla. Varios números pueden compartir un File explícitamente referenciado.

Eliminar la deduplicación destructiva de homónimos: considerar ruta relativa cuando exista; candidatos con igual nombre/tamaño/fecha sin identidad de ruta fiable se conservan y quedan ambiguos. Solo colapsar identidad de objeto o reelección inequívoca de la misma ruta y metadatos. Cada nueva carga recalcula asociaciones automáticas (una segunda coincidencia puede convertir una en ambigua), pero no reemplaza elecciones ni desvinculaciones manuales. Etiquetar opciones con ruta relativa; para archivos individuales homónimos, índice de selección y metadatos.

### Correcciones y persistencia

Estado versión 4: `audioRefs`, array de strings o null paralelo a `songs`, obligatorio para musicales; null significa sin referencia. Versiones 1/2 migran mediante el flujo actual y versión 3 agrega nulls; validar cada posición, longitud y tipo sin mutar entrada. Sets clásicos no admiten este campo. No persistir File, URLs blob ni rutas obtenidas automáticamente del dispositivo. Las referencias escritas por el usuario sí aparecen en respaldo, informado en la UI y README.

El diálogo Audios permite editar/guardar referencia por número, elegir/reemplazar/desvincular archivo y solicitar «Volver a asociar automáticamente» en esa fila. Guardar referencia recalcula esa fila y reemplaza su elección previa solo tras persistir correctamente; limpiar referencia habilita la regla por título. Cambiar archivo conserva los fragmentos y vuelve a validarlos contra el nuevo archivo al probar/reproducir. Cambio que afecte la fuente activa cancela preescucha/reproducción, con reanudación manual. Los archivos y elecciones manuales son temporales, como hoy; para repetir la asociación tras recargar se guarda una referencia adecuada. No inferir/persistir una ruta absoluta desde el selector.

Restauración válida limpia bibliotecas; cancelación/error no modifica datos ni asociaciones. Solo la pestaña operadora puede confirmar cambios; respetar bloqueos de escritura. Editar referencia no toca título, posición, cartones, historial ni clips.

### Límites del navegador

Usar File de selectores y URLs blob existentes; no hacer fetch de referencias ni lectura de audios para resolver nombres. La duración se sigue leyendo bajo demanda. La publicación estática no cambia.

Referencias: [MDN: selección de carpeta](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/webkitdirectory) y [rutas relativas de File](https://developer.mozilla.org/en-US/docs/Web/API/File/webkitRelativePath).

## Risks / Trade-offs

- Rutas absolutas de otra máquina → coincidencia por sufijo/nombre marcada en vista previa y corrección manual; no prometer acceso por ruta.
- Nombres iguales o diferencias de mayúsculas → comparación conservadora, ambigüedad visible y selección manual.
- CSV regional o títulos con comas → separador explícito y parser con comillas; TXT simple conserva todo el título.
- Carpetas grandes → indexar metadatos sin leer contenido ni crear URLs para cada archivo; limitar vista visible con el patrón de listado desplazable.
- Referencias con información personal → explicar que el respaldo las contiene, sin enviarlas al servidor.
- Compatibilidad de carpeta en móviles → alternativa de selección múltiple; documentar navegadores realmente probados.

## Migration Plan

Añadir parser/asociador puro y pruebas; migración pura a versión 4; integrar borrador y editor; probar regresiones y respaldo antes de publicación. Mantener versión física de IndexedDB. Un cliente anterior no entiende respaldos versión 4: recomendar respaldo previo; para rollback usar código anterior y respaldo compatible, sin degradación destructiva automática. Este cambio prepara únicamente los artefactos; implementación y publicación serán pasos posteriores solicitados por el usuario.
