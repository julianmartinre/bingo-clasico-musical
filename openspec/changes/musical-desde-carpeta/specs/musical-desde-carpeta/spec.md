# Spec Delta

## Purpose

Simplificar la creación del bingo musical obteniendo canciones y asociaciones desde una sola carpeta, con revisión previa y preservación de sets existentes.

## ADDED Requirements

### Requirement: Carpeta como única entrada de creación musical
El sistema SHALL ofrecer «Cargar carpeta de canciones» como único método de crear listados musicales nuevos. SHALL retirar del generador las entradas TXT/CSV, plantilla, formato/separador, selección individual de audios y edición de rutas/asociaciones. SHALL conservar la restauración de respaldos y el mantenimiento de audios de sets guardados. Si no se admite selección de carpeta SHALL informar la limitación sin ofrecer otro método de creación.

#### Scenario: Nuevo set musical
- **WHEN** se elige la modalidad Musical
- **THEN** se puede elegir una carpeta directamente, sin preparar listado ni ver opciones TXT/CSV.

### Requirement: Construcción del listado desde archivos
El sistema SHALL incluir subcarpetas y reconocer candidatos por extensión sin distinguir mayúsculas: mp3, wav, ogg, oga, m4a, aac, flac, opus y webm. SHALL ignorar otros archivos y mostrar su cantidad; archivos vacíos o rutas incompatibles SHALL excluirse con motivo. SHALL derivar cada título del nombre sin su extensión final, recortando espacios exteriores y conservando el resto. SHALL ordenar inicialmente por ruta relativa de forma alfabética natural en español, con desempate exacto. SHALL mantener separados archivos con rutas distintas aunque compartan nombre y metadatos. SHALL no leer masivamente contenidos ni reproducir durante la carga.

#### Scenario: Carpeta mixta
- **WHEN** contiene `Miranda - Fantasma.mp3`, `Sub/Don.MP3` y una imagen
- **THEN** se crean dos canciones con sus audios vinculados, títulos sin extensión y un aviso de un archivo ignorado.

#### Scenario: Homónimos y orden inicial
- **WHEN** contiene `A/tema.mp3`, `B/tema.mp3`, `A/2.mp3` y `A/10.mp3`
- **THEN** los homónimos siguen separados con sus rutas visibles y 2 precede a 10 en la carpeta A.

### Requirement: Revisión antes de fijar números
El sistema SHALL permitir editar títulos, excluir/reincluir canciones y mover filas arriba/abajo antes de generar, con teclado y foco conservado. SHALL aplicar ediciones al borrador sin botón Guardar por fila. Los números provisionales SHALL seguir el orden visual de las incluidas, sin huecos. SHALL actualizar canciones por cartón y máximo de cartones según esa cantidad. SHALL bloquear generación sin incluidas o con títulos incluidos vacíos; los títulos repetidos SHALL producir aviso y conservar números independientes. Cambiar un título u orden SHALL conservar su archivo asociado.

#### Scenario: Edición y movimiento
- **WHEN** se renombra Fantasma y se mueve su fila al primer lugar
- **THEN** obtiene el número provisional 1 y mantiene el archivo originalmente seleccionado.

#### Scenario: Exclusiones
- **WHEN** quedan 30 canciones incluidas
- **THEN** se muestran 5 canciones por cartón; las excluidas no entran al bolillero ni a los cartones.

### Requirement: Borrador reemplazable y generación atómica
Una nueva carpeta válida SHALL reemplazar el borrador con aviso previo en la interfaz de que reinicia la revisión. Cancelar, fallar o elegir carpeta sin candidatos SHALL conservar el borrador anterior. Cambiar modalidad SHALL descartarlo. El sistema SHALL ignorar operaciones obsoletas y bloquear cambios durante generación/guardado. SHALL guardar conjuntamente títulos, orden, referencias y cartones, y transferir asociaciones solo tras éxito. Fallos SHALL conservar el borrador para reintentar sin set parcial ni consumo de códigos.

#### Scenario: Cancelación o carpeta vacía
- **WHEN** se cancela el selector o se elige una carpeta sin audios válidos tras editar títulos
- **THEN** se conserva la revisión anterior y, en el segundo caso, se informa que no hay canciones para cargar.

#### Scenario: Persistencia fallida
- **WHEN** falla el guardado del set
- **THEN** se conserva el borrador con su orden y audios, y no se crea ningún set parcial.

### Requirement: Datos anteriores y recuperación de audios
El sistema SHALL conservar lectura de estados/respaldos 1–4, incluyendo sets creados con TXT/CSV, códigos, títulos, orden, historial y fragmentos. Nuevos sets SHALL guardar referencias relativas de carpeta en versión 4 y sus números SHALL quedar fijos al generarlos. Tras recargar SHALL permitir reelegir la carpeta en Audios para recuperar asociaciones sin reconstruir el set ni depender de títulos editados. SHALL conservar reemplazo individual y configuración de fragmentos en sets guardados.

#### Scenario: Título personalizado tras recarga
- **WHEN** una canción se guardó con título distinto al nombre del MP3 y se vuelve a elegir su carpeta
- **THEN** recupera su audio por referencia y mantiene título, número y fragmento.

#### Scenario: Set anterior
- **WHEN** se restaura un respaldo creado mediante TXT/CSV
- **THEN** sus cartones y partidas funcionan y sus audios pueden configurarse sin reimportar el listado.

### Requirement: Continuidad y privacidad
El sistema SHALL mantener bingo clásico, reglas musicales, verificación, impresión y temas. SHALL funcionar estáticamente en local y subdirectorio publicado, sin subir audios ni persistirlos en respaldos. SHALL informar la necesidad de volver a elegir carpeta tras recargar. Un archivo candidato que no se pueda decodificar SHALL mostrar el error de reproducción sin modificar el sorteo. La revisión SHALL ser utilizable en móvil y con teclado.

#### Scenario: Audio incompatible
- **WHEN** sale una canción cuyo archivo no se puede reproducir
- **THEN** se informa el problema y se conserva la bolilla extraída, pudiendo reemplazar el archivo desde Audios.
