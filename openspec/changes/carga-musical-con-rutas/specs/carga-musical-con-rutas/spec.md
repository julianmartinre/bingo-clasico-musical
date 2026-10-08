# Spec Delta

## Purpose

Permitir preparar listados musicales con referencias a audios locales, asociarlos en bloque mediante selección explícita de archivos y corregirlos sin alterar los cartones ni el juego.

## ADDED Requirements

### Requirement: Importación compatible de títulos y referencias
El sistema SHALL conservar TXT simple como opción predeterminada para `.txt`, incluyendo títulos que contienen comas. SHALL ofrecer TXT con rutas sin cabecera y CSV con cabecera `cancion,ruta` (admitiendo `canción`, mayúsculas y espacios exteriores), con dos columnas exactas, título obligatorio y referencia opcional. SHALL admitir coma o punto y coma seleccionables, comillas dobles, comillas escapadas duplicadas y saltos dentro de campos entrecomillados. SHALL detectar separador solo cuando un único candidato sea válido; en caso contrario solicitar selección/corrección. SHALL aceptar UTF-8 estricto con BOM opcional y saltos LF/CRLF/CR, ignorar registros totalmente vacíos, conservar orden y títulos repetidos con números independientes. SHALL rechazar errores de estructura con ubicación y sin generar datos parciales. XLSX SHALL mostrar indicación de exportar a CSV UTF-8.

#### Scenario: Ejemplo con ruta Windows
- **WHEN** se importa CSV con cabecera y fila `Fantasma - Miranda,C:/Descargas/tema.mp3`
- **THEN** aparece el título Fantasma - Miranda y la referencia separada del título; la ruta no figura en el cartón.

#### Scenario: TXT anterior y campos escapados
- **WHEN** se lee `Una canción, en vivo` como TXT simple, o `"Una canción, en vivo",tema.mp3` como TXT con rutas
- **THEN** ambos conservan el título completo, y solo el segundo genera referencia.

#### Scenario: Entrada inválida
- **WHEN** falta un título, sobran columnas, hay comillas sin cerrar o el archivo no es UTF-8
- **THEN** se informa el error y no se habilita generar desde ese listado ni se alteran sets guardados.

### Requirement: Preparación conjunta con archivos elegidos
El sistema SHALL permitir elegir carpeta o múltiples audios antes de generar el set y mostrar vista previa numerada con título, referencia, archivo asociado y resumen de asociados, faltantes, ambiguos y sin referencia. SHALL permitir corregir referencias y elegir archivos por fila. SHALL permitir generar sin todos los audios y solo transferir asociaciones al set después de guardarlo correctamente. Reemplazar listado o modalidad SHALL descartar las selecciones del borrador; cancelar un selector SHALL conservarlas. Operaciones de lectura obsoletas SHALL no reemplazar la preparación vigente.

#### Scenario: Carga en bloque
- **WHEN** se importa el listado y luego se selecciona la carpeta que contiene sus audios
- **THEN** se muestran las asociaciones antes de generar y las coincidencias válidas quedan disponibles en el set generado sin vincularlas otra vez.

#### Scenario: Fallo de guardado
- **WHEN** falla la persistencia al generar
- **THEN** no aparece un set parcial ni asociaciones para un set inexistente y se conserva el borrador para reintentar.

### Requirement: Asociación determinista y ambigüedad visible
El sistema SHALL comparar referencias con archivos seleccionados usando separadores equivalentes y Unicode NFC, respetando acentos y mayúsculas salvo letra de unidad Windows. SHALL priorizar ruta relativa exacta con o sin raíz seleccionada, luego sufijo por segmentos de la ruta seleccionada para referencias absolutas, y finalmente nombre con extensión. SHALL detenerse como ambiguo ante múltiples candidatos en un nivel, sin elegir por orden. SHALL indicar si la coincidencia fue por ruta o solo por nombre. Con referencia explícita sin coincidencia SHALL mostrar faltante sin sustituirla por coincidencia de título. Sin referencia SHALL conservar la regla actual de título único. SHALL conservar como candidatos distintos los archivos de carpetas distintas aunque compartan nombre, tamaño y fecha. SHALL admitir varios números vinculados al mismo archivo.

#### Scenario: Ruta absoluta y selección individual
- **WHEN** la referencia es `C:/Descargas/tema.mp3` y se selecciona un único `tema.mp3`
- **THEN** se asocia por nombre y se indica que no se verificó su carpeta absoluta.

#### Scenario: Homónimos
- **WHEN** se seleccionan `Musica/A/tema.mp3` y `Musica/B/tema.mp3` con idénticos tamaño y fecha
- **THEN** `A/tema.mp3` resuelve el primero y `tema.mp3` queda ambiguo; ambos son elegibles manualmente.

#### Scenario: Más archivos y prioridad manual
- **WHEN** se agrega un segundo candidato a una asociación automática por nombre y otra fila tiene una elección manual
- **THEN** la primera se recalcula como ambigua y la elección manual se conserva.

### Requirement: Corrección posterior sin alterar el juego
El sistema SHALL permitir guardar o borrar referencia, seleccionar/reemplazar/desvincular archivo y volver a asociación automática por número en Audios. SHALL respetar las elecciones y desvinculaciones manuales al agregar archivos. Guardar una referencia SHALL recalcular esa fila tras persistencia exitosa; borrar referencia SHALL habilitar coincidencia por título. SHALL preservar títulos, numeración, cartones, historial y fragmentos. Cambiar fuente activa SHALL detener audio y preescucha sin reanudar automáticamente, validando límites del fragmento contra el nuevo archivo antes de reproducir. SHALL respetar permisos de pestaña operadora y conservar estado previo ante fallo de guardado.

#### Scenario: Reemplazo con fragmento
- **WHEN** se cambia el archivo de una canción que tiene un fragmento configurado
- **THEN** se detiene el audio, se mantiene el fragmento y se informa si no cabe en el nuevo archivo al intentar reproducirlo.

#### Scenario: Corrección persistente
- **WHEN** se guarda otra referencia y luego se vuelve a seleccionar la carpeta tras recargar
- **THEN** se asocia según la referencia corregida sin modificar el número ni los cartones.

### Requirement: Referencias persistentes y respaldos compatibles
El sistema SHALL guardar referencias por número en estado y respaldos versión 4, admitiendo versiones 1–3 con referencias vacías y conservando todos sus datos válidos. SHALL validar longitud, posiciones y tipos de referencias, rechazarlas en sets clásicos y rechazar restauraciones inválidas sin sustituir datos. SHALL informar que las referencias se incluyen en el respaldo y que archivos y elecciones manuales son temporales. Tras recargar SHALL requerir nueva selección de archivos y reasociar con referencias guardadas. Restaurar correctamente SHALL limpiar bibliotecas temporales; cancelar o fallar SHALL conservarlas.

#### Scenario: Migración de fragmentos
- **WHEN** se restaura un respaldo versión 3 con clips y partidas
- **THEN** se conservan clips, títulos, códigos e historial y se agregan referencias vacías.

#### Scenario: Respaldo nuevo
- **WHEN** se exporta/restaura un set con referencias y se seleccionan sus archivos
- **THEN** vuelven las asociaciones resolubles sin incluir contenido de audio en el respaldo.

### Requirement: Acceso local explícito y continuidad
El sistema SHALL usar las rutas solo como referencias de comparación sobre archivos elegidos por el usuario, sin solicitudes a rutas/URLs ni envío de audios. SHALL aceptar etiquetas locales absolutas Windows/POSIX/UNC y relativas, rechazar controles, segmentos `..` y esquemas URI, y mostrar textos literalmente. SHALL ofrecer selección múltiple cuando no se use carpeta. SHALL funcionar como sitio estático local y en subdirectorio de GitHub Pages, mantener controles utilizables con teclado/móvil/temas, y conservar impresión, bingo clásico, bingo musical completo y reproducción existente. La importación SHALL no iniciar audio ni leer masivamente su contenido.

#### Scenario: Ruta sin archivo elegido
- **WHEN** el listado contiene una ruta absoluta pero no se ha elegido ningún audio
- **THEN** se muestra pendiente/faltante y se solicita elegir carpeta o archivos, sin intentar acceder al disco por esa ruta.

#### Scenario: Texto malicioso o URL
- **WHEN** un título contiene etiquetas HTML o una referencia contiene `https://ejemplo/tema.mp3`
- **THEN** el título se muestra como texto y la referencia URI se rechaza sin solicitudes de red.
