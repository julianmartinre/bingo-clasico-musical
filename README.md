# Bingo 90

Aplicación de bingo presencial hecha con **HTML, CSS y JavaScript vanilla**. No tiene frameworks, paquetes, fuentes remotas, servicios externos ni proceso de compilación. Todo el juego corre en el navegador.

## Abrir

Abrí `index.html` en Chrome o Edge. Conservá la carpeta en el mismo lugar y usá siempre el mismo navegador y perfil: los datos se guardan en IndexedDB, no dentro de los archivos HTML.

Para un origen estable, también podés usar el servidor estático opcional con el Node.js ya instalado:

```powershell
node serve.js
```

Abrí **http://127.0.0.1:8080**. No hace falta `npm install`. El servidor solo entrega archivos; no contiene lógica del juego ni una base de datos. Funciona sin Internet. Mantené la terminal abierta y usá Ctrl+C para detenerlo.

Abrir como archivo y abrir por HTTP son ubicaciones distintas para el navegador y no comparten datos. Exportá y restaurá un respaldo si cambiás de ubicación. Si el navegador restringe almacenamiento, workers o bloqueos en archivos locales, usá el servidor estático.

## Preparar e imprimir

1. Entrá en **Mis cartones**, poné un nombre y elegí entre 1 y 1000 cartones.
2. Elegí **Generar cartones**. Cada uno tiene 15 números, 3 filas, 9 columnas y un código único. No se repiten combinaciones dentro del mismo set.
3. Usá **Guardar respaldo** antes de distribuir los cartones. Guardá ese JSON en un lugar seguro: permite recuperar códigos, matrices y partidas si se borran los datos del navegador.
4. En el set, elegí **Ver / Imprimir** y luego **Imprimir / Guardar PDF**.
5. Seleccioná papel **A4**, escala **100 %** y desactivá encabezados y pies del navegador. Se imprimen seis cartones por hoja; las líneas punteadas sirven de guía para recortar. La última hoja puede tener menos. Podés reimprimir sin que cambien números ni códigos.

Los grupos de seis cartones no son tiras combinadas que cubren exactamente las 90 bolillas; cada cartón se genera de forma independiente.

## Jugar

1. En **Sorteo**, seleccioná **Nueva partida**, elegí el set impreso y asignale un nombre.
2. Tocá **Sacar bolilla** una vez por extracción. El tablero marca el número y el historial conserva el orden. No hay repeticiones ni extracción automática.
3. **Ampliar tablero** facilita proyectarlo. Volvé con el mismo botón o Escape.
4. Los datos se guardan antes de mostrar cada resultado. Si recargás o cerrás y volvés a abrir en el mismo origen, recuperás el estado confirmado.
5. Para otra ronda, creá una nueva partida con el mismo set: comienza vacía y conserva el historial anterior. Podés volver a partidas anteriores con el selector.

Solo una pestaña puede operar a la vez. Cerrá la pestaña operadora y tocá **Tomar control** en la otra para continuar. Las pestañas sin control muestran una copia de lectura; no son pantallas sincronizadas para proyectar.

## Comprobar línea o bingo

1. Elegí **Verificar cartón**. El sorteo queda pausado mientras el panel está abierto.
2. Ingresá el código impreso y tocá **Verificar**.
3. Una línea es una fila horizontal con sus cinco números extraídos. Bingo requiere los quince números del cartón. El panel muestra ambas condiciones, las filas completas y los números que faltan.
4. Si solo salieron 14 números, bingo no es válido: se muestra el número faltante. Cinco aciertos repartidos entre filas no son una línea.
5. Un código desconocido o de otro set produce un mensaje específico. Consultar varios códigos no cambia el sorteo. **Volver al sorteo** permite seguir extrayendo.

La aplicación verifica el patrón, no decide quién cantó primero ni asigna premios. Puede haber varios cartones válidos.

## Restaurar

En **Mis cartones → Restaurar**, seleccioná un respaldo JSON y revisá la cantidad de sets y partidas. **Reemplazar y restaurar** sustituye todos los datos del navegador; **Cancelar** los conserva. La aplicación rechaza respaldos inválidos sin modificar nada. La restauración conserva códigos e historial y el próximo cartón recibe un código posterior a los existentes.

## Bingo musical

En **Mis cartones**, elegí **Musical · tus canciones**, cargá una carpeta de audios y revisá títulos, inclusión y orden. La lista se forma automáticamente desde los nombres de archivo. Los números quedan fijos al generar. Con 30 canciones incluidas, cada cartón tiene 5; el tamaño sigue la regla `max(1, floor(N / 6))` y solo se permite la cantidad de cartones únicos disponible.

Las casillas muestran **número y nombre**; el **código de cartón** sirve para verificar el reclamo. Ambos números cumplen funciones distintas. Elegir otra carpeta no cambia los sets ya guardados.

Creá una partida con el set musical. Su bolillero tendrá tantas bolillas como canciones. Al sacar una, aparece su número y nombre. Pasá el mouse, enfocá con Tab o tocá un número del tablero o historial para consultar la canción sin alterar el sorteo. Escape cierra la consulta.

En musical se gana **solo con el cartón completo**. El verificador muestra canciones acertadas y faltantes, sin premio por línea. El clásico mantiene sus reglas anteriores. El audio local es opcional y se configura por set.

La impresión musical usa A4 con distribución adaptada a los nombres completos. Los cartones largos pueden continuar en otra hoja: cada parte repite el código del cartón. Seleccioná A4, 100 % y desactivá encabezados/pies del navegador. La vista previa contiene las mismas páginas que se imprimen. El clásico sigue imprimiendo seis cartones por hoja.

### Datos anteriores y respaldos

La aplicación acepta respaldos versión 1, 2 y 3 y los adapta en memoria a versión 4; conserva cartones, códigos, bolillas, historial y fragmentos, agregando referencias vacías y canción completa donde no había fragmentos. El cambio se guarda con la siguiente operación autorizada. Los respaldos nuevos son versión 4 y pueden contener ambos modos, tiempos y referencias de audio. Restaurarlos reemplaza los datos solo después de confirmar; archivos inválidos o cancelar no cambian nada.

Antes de actualizar, conservá un respaldo de la versión anterior si necesitás volver a ese código. Las versiones anteriores del programa no pueden leer respaldos versión 4. Cambiar entre archivo local y HTTP también requiere exportar/restaurar porque son orígenes distintos.

## Pruebas

Con Node.js, sin instalar paquetes:

```powershell
node --test tests/domain.test.js
node --test tests/music.test.js
node --check js/domain.js
node --check js/storage.js
node --check js/app.js
```

Las pruebas del dominio cubren 3000 cartones, reglas de bingo, 90 extracciones, límites, códigos y validación de respaldos. La evidencia de integración y de impresión está documentada en `tests/VERIFICATION.md`.


## Apariencia

Usá **◐ Apariencia** en la cabecera o en el tablero ampliado. Elegí **Claro**, **Oscuro** o **Según el sistema**, y combiná el modo con **Bosque** (verde), **Océano** (azul) o **Ciruela** (violeta). Se aplica al instante; cerrá con **Listo** o Escape.

Al abrir por primera vez se usa Según el sistema y Bosque. Solo el modo automático sigue los cambios del sistema. La elección se guarda en este navegador y origen; no se incluye en respaldos ni cambia al restaurar o comenzar otra partida. Si el navegador impide guardarla, se aplica durante la sesión y se muestra un aviso. Otras pestañas recuperan la preferencia al abrirse de nuevo.

Los cartones, incluso en el verificador y la vista previa, mantienen papel claro y texto oscuro. El modo oscuro no modifica números, canciones, códigos ni la distribución de impresión.

## Audios locales del bingo musical

1. Creá un set musical desde tu carpeta de canciones. En el set elegí **♫ Audios**, o abrí **♫ Audios del set** en la partida.
2. Seleccioná varios archivos de tu dispositivo. La aplicación relaciona nombres únicos (por ejemplo, `Don.mp3` con `Don`), ignorando extensión, mayúsculas, acentos y espacios redundantes. No quita prefijos numéricos ni nombres de artistas.
3. Revisá el contador y los selectores por canción: los títulos repetidos o archivos ambiguos se asignan manualmente. Podés reutilizar un archivo en varios números, cambiarlo o elegir **Sin audio**. Agregar archivos conserva elecciones manuales; las automáticas se recalculan para detectar nuevas ambigüedades. Cancelar no cambia nada.
4. Al **Sacar bolilla**, después de guardar el resultado se reproduce su canción desde el inicio del fragmento guardado y se detiene la anterior. Si falta el audio, el juego sigue normalmente. El historial no reproduce canciones ni extrae números.
5. Usá **Reproducir/Pausar canción**, **Volver al inicio** o **Volumen**, también en el tablero ampliado. El volumen inicial es 50 %. Si tu navegador no permite ajustarlo, usá el volumen del dispositivo. Terminar una canción no saca la siguiente bolilla.

Los archivos permanecen en tu dispositivo: funciona desde GitHub Pages, archivo local o el servidor estático, sin subir los audios. Archivos y asociaciones duran solo mientras esa página está abierta. Tras recargar o restaurar un respaldo exitosamente, seleccioná los archivos nuevamente. No se guardan audios ni elecciones manuales en IndexedDB ni en los respaldos versión 4; sí se guardan las referencias escritas por el usuario para volver a asociar. Cancelar o rechazar una importación conserva las asociaciones.

Al verificar un reclamo la canción se pausa y no se reanuda automáticamente al cerrar. Cambiar de partida o perder el control de la pestaña detiene la reproducción. Cambiar la apariencia o ampliar el tablero no reinicia el audio. Solo reproduce la pestaña operadora.

Usá preferentemente MP3; los formatos y códecs disponibles dependen del navegador. Un archivo incompatible o dañado muestra un aviso sin cambiar la bolilla. Si el navegador bloquea la reproducción automática, tocá **Reproducir canción**: no hace falta volver a sortear. Cambiar el archivo de la canción actual también requiere este clic para comenzar.

## Fragmentos por canción

En **Audios del set**, cada número tiene **Inicio**, **Fin opcional**, **Probar fragmento**, **Guardar fragmento** y **Restablecer canción completa**. Por ejemplo, Inicio `00:45` y Fin `01:15` reproduce treinta segundos. Usá minutos:segundos, sin fracciones; los segundos van de 00 a 59. Inicio vacío significa `00:00`; Fin vacío significa hasta terminar el archivo.

**Probar fragmento** escucha el borrador sin guardarlo ni sortear. **Detener prueba** o cerrar el diálogo detienen la preescucha. Abrir la configuración pausa el sorteo y cerrar no lo reanuda automáticamente. Solo puede sonar una pista. Editar límites o cambiar el archivo de la prueba la detiene.

**Guardar fragmento** guarda únicamente esa fila. **Restablecer canción completa** guarda inicio cero y fin natural. Cerrar descarta tiempos no guardados. Podés guardar sin archivo, pero los límites quedan pendientes de comprobar. Con un archivo asociado se consulta su duración: inicio debe ser menor a la duración, y fin debe ser mayor al inicio sin superar el archivo. Si luego asociás una versión más corta, se informa del error sin ajustar los tiempos silenciosamente ni alterar el sorteo.

Los tiempos se guardan con el set y en respaldos versión 4; persisten al recargar y se aplican en todas las rondas de ese set. Los archivos y sus asociaciones continúan siendo temporales y deben seleccionarse de nuevo. Títulos repetidos tienen fragmentos independientes por número.

Al sortear se usa el fragmento guardado. **Volver al inicio** y reproducir después de terminar vuelven al inicio configurado, no al segundo cero. Pausar/reanudar conserva la posición dentro del tramo. Al ocultar la pestaña se pausa el audio y no se reanuda solo al volver. El corte usa el reloj del navegador y no es una edición de audio profesional; ninguna operación modifica el archivo original.


## Crear el musical desde una carpeta

1. En **Mis cartones**, elegí **Musical** y **Cargar carpeta de canciones**. Incluye subcarpetas; es la única entrada de creación musical.
2. Se toman los nombres de los audios sin extensión y se ordenan alfabéticamente por ruta, con números en orden natural (2 antes de 10). Cada canción ya tiene su archivo asociado.
3. Revisá títulos, desmarcá **Incluir** para excluir canciones y usá **Subir/Bajar** para ordenar. Los cambios se aplican al borrador directamente. Los números se fijan al generar; renombrar y mover conserva el archivo de cada fila.
4. Elegí nombre y cantidad de cartones y generá. Con 30 canciones incluidas se usan 5 por cartón. Títulos vacíos bloquean generar; repetidos son válidos y se avisan.

Se reconocen MP3, WAV, OGG, OGA, M4A, AAC, FLAC, OPUS y WEBM. Otros archivos se ignoran; vacíos y rutas incompatibles muestran su motivo. La extensión no garantiza que el navegador pueda reproducir el códec: si falla, podés reemplazarlo desde Audios. No se leen etiquetas ID3 ni se quitan prefijos o nombres de artistas.

Elegir otra carpeta válida reemplaza la revisión; cancelar o elegir una sin audios válidos conserva lo anterior. Cambiar de modalidad descarta el borrador. Se necesita un navegador con selector de carpetas para crear un set musical.

Las referencias relativas se guardan en el set y se incluyen en el respaldo versión 4. Los audios permanecen temporales en tu dispositivo: tras recargar elegí nuevamente la carpeta desde **♫ Audios**, incluso si personalizaste títulos. Allí también podés reemplazar un archivo individual y configurar fragmentos. No se envían audios ni se guardan en el respaldo.

Los sets históricos creados con TXT/CSV siguen funcionando. Se admiten respaldos de versiones 1–4 sin cambiar códigos, títulos, orden, historial ni fragmentos. Ya no se importan listados TXT/CSV para crear sets nuevos. No se requiere nueva migración respecto del estado versión 4.
