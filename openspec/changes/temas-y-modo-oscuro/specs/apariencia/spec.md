## Purpose

Permitir personalizar la apariencia del bingo clásico y musical sin afectar las partidas ni la legibilidad de los cartones impresos.

## ADDED Requirements

### Requirement: Selección de apariencia
La aplicación SHALL ofrecer un control «Apariencia» con modos Claro, Oscuro y Según el sistema, y paletas Bosque, Océano y Ciruela. Modo y paleta SHALL poder combinarse y aplicarse inmediatamente sin recargar la página.

#### Scenario: Cambiar la combinación
- **WHEN** la persona selecciona Oscuro y Océano
- **THEN** la interfaz adopta fondos oscuros y acentos azules, y los controles muestran la selección vigente.

#### Scenario: Acceso en tablero ampliado
- **WHEN** el tablero está ampliado y la cabecera está oculta
- **THEN** existe un acceso visible a Apariencia que permite modificar la misma preferencia.

### Requirement: Preferencia del sistema
Sin una preferencia válida guardada, la aplicación SHALL usar Según el sistema y Bosque. En modo Según el sistema SHALL responder a cambios de apariencia del sistema; en modos explícitos SHALL mantener la elección del usuario. Si no se puede consultar el sistema SHALL resolver el modo como Claro.

#### Scenario: Cambio del sistema
- **WHEN** el sistema pasa de claro a oscuro y el modo seleccionado es Según el sistema
- **THEN** la interfaz cambia a oscuro sin alterar la paleta.

#### Scenario: Elección explícita
- **WHEN** el sistema cambia de apariencia y la persona había seleccionado Claro
- **THEN** la interfaz permanece clara.

### Requirement: Persistencia independiente y tolerancia a errores
La aplicación SHALL conservar modo y paleta en el navegador para futuras aperturas del mismo origen y aplicar la preferencia antes de mostrar la interfaz principal. Datos inválidos SHALL resolverse con los valores iniciales. Si el almacenamiento no está disponible SHALL permitir cambiar la apariencia durante la sesión y avisar, sin bloquear el juego, que no se pudo guardar.

#### Scenario: Recargar una preferencia guardada
- **WHEN** se vuelve a abrir la aplicación tras guardar Oscuro y Ciruela
- **THEN** la primera presentación de la interfaz usa esa combinación sin mostrar primero el tema claro.

#### Scenario: Almacenamiento inválido o inaccesible
- **WHEN** la preferencia almacenada es inválida o su lectura falla
- **THEN** la aplicación inicia con Según el sistema y Bosque y sigue siendo utilizable.

#### Scenario: Escritura rechazada
- **WHEN** se cambia la apariencia y el navegador rechaza guardarla
- **THEN** la selección se aplica en la sesión y se informa de forma no bloqueante que no persistirá.

### Requirement: Cobertura y legibilidad
La apariencia SHALL cubrir ambas modalidades, navegación, tablero normal y ampliado, formularios, diálogos, historial, avisos y nombres de canciones. Los controles SHALL tener etiquetas, operación por teclado y foco visible. Cada combinación SHALL alcanzar contraste de al menos 4,5:1 para texto normal y 3:1 para texto grande y límites o indicadores esenciales. Los estados de número extraído, último número y resultado de verificación SHALL conservar indicadores adicionales al color.

#### Scenario: Tablero musical oscuro
- **WHEN** se extrae una canción con cualquier paleta oscura
- **THEN** el número, su nombre, el historial y los estados del tablero son legibles y distinguibles, incluyendo la consulta del nombre de la canción.

#### Scenario: Selección con teclado
- **WHEN** se abre Apariencia usando el teclado
- **THEN** se pueden cambiar modo y paleta, cerrar el diálogo y regresar el foco al disparador, con etiquetas y foco visibles.

### Requirement: Independencia del juego
Cambiar la apariencia SHALL conservar la modalidad, la partida, los números extraídos, los cartones, los datos ingresados y los resultados de verificación. SHALL estar disponible también en pestañas de solo lectura y SHALL ser independiente de reinicios, importaciones y exportaciones de partidas. El formato de respaldo SHALL permanecer en versión 2 sin incluir preferencias visuales.

#### Scenario: Cambio durante una partida
- **WHEN** se cambia la apariencia durante una partida clásica o musical
- **THEN** todos los datos y controles del juego conservan su estado y no se extrae ninguna bolilla adicional.

#### Scenario: Restaurar respaldo
- **WHEN** se importa un respaldo de partida
- **THEN** se restaura el juego manteniendo la apariencia seleccionada en ese navegador.

### Requirement: Papel independiente de la apariencia
Los cartones y su vista previa SHALL mantener fondo claro, texto oscuro y contenido legible en cualquier apariencia. Cambiar el tema SHALL conservar el contenido, dimensiones, cantidad de páginas y distribución de los cartones clásicos y musicales, incluyendo cartones musicales divididos entre páginas.

#### Scenario: Imprimir desde modo oscuro
- **WHEN** se abre la vista previa o se imprime un mismo lote con cualquiera de las seis combinaciones de modo resuelto y paleta
- **THEN** el papel permanece claro y sus números, canciones, códigos y paginación son equivalentes a los del modo claro Bosque.
