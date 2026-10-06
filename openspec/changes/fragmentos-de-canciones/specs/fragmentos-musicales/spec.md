## Purpose

Permitir elegir, comprobar y conservar el tramo de cada canción que se reproduce durante un bingo musical sin modificar los archivos originales.

## ADDED Requirements

### Requirement: Configuración por número
Audios del set SHALL ofrecer Inicio, Fin opcional, Guardar fragmento y Restablecer canción completa por número de canción. SHALL aceptar minutos enteros y segundos de dos dígitos entre 00 y 59, con inicio vacío equivalente a 00:00 y fin vacío equivalente al final del archivo. Las canciones con títulos repetidos SHALL tener tiempos independientes. Editar SHALL crear un borrador; solo Guardar o Restablecer confirmado por el almacenamiento SHALL cambiar los tiempos persistidos. Cerrar el diálogo SHALL descartar borradores sin alterar los tiempos guardados.

#### Scenario: Guardar un estribillo
- **WHEN** se guarda Inicio 00:45 y Fin 01:15 para el número 2
- **THEN** ese número queda configurado para reproducir ese tramo en todas las partidas del set, sin cambiar otras canciones.

#### Scenario: Fallo de guardado
- **WHEN** falla el almacenamiento al guardar
- **THEN** se muestra el error, se conserva el borrador para reintentar y el sorteo sigue usando los tiempos previamente guardados.

### Requirement: Validación del intervalo
Los tiempos SHALL ser no negativos, el fin explícito SHALL ser mayor al inicio y los valores mal formados SHALL rechazarse. Con duración conocida, inicio SHALL ser menor a la duración y fin SHALL no superarla. Sin audio asociado SHALL permitirse guardar tiempos estructuralmente válidos, indicándolos como pendientes de comprobar contra el archivo. Un archivo nuevo SHALL volver a validarse antes de reproducir; si el intervalo no cabe, SHALL no recortarse silenciosamente ni reproducirse desde cero.

#### Scenario: Orden inválido
- **WHEN** se introduce Inicio 01:15 y Fin 00:45, o segundos 75
- **THEN** Guardar y Probar no aceptan el intervalo y aparece un error junto a la canción.

#### Scenario: Archivo más corto
- **WHEN** un fragmento guardado comienza en 00:45 y el archivo asociado dura 30 segundos
- **THEN** se informa que el fragmento no cabe, no suena audio y el sorteo permanece utilizable.

### Requirement: Preescucha sin sorteo
Probar fragmento SHALL reproducir el borrador válido con el archivo asociado, sin guardarlo ni cambiar bolillas, cartones o partida seleccionada. SHALL estar disponible antes de iniciar una partida. Solo SHALL sonar una pista: comenzar otra prueba detiene la anterior. El diálogo SHALL mostrar cuál canción se está probando y ofrecer Detener prueba. Cerrar el diálogo, cambiar el archivo de prueba, editar sus límites o perder el control de la pestaña SHALL detener la prueba.

#### Scenario: Preparación del set
- **WHEN** se prueba un tramo desde un set sin partidas
- **THEN** se escucha ese tramo sin crear una partida ni sortear números.

#### Scenario: Regresar al sorteo
- **WHEN** se abre la configuración durante una canción y luego se cierra tras probar otra
- **THEN** el audio del sorteo se pausa al abrir, la prueba se detiene al cerrar y la última canción sorteada queda disponible para reproducción manual con sus límites guardados, sin reanudación automática.

### Requirement: Reproducción del fragmento guardado
Tras confirmar una extracción, la aplicación SHALL posicionarse en el inicio guardado antes de reproducir. SHALL detenerse al alcanzar el fin explícito o natural y no extraer otra bolilla ni repetir automáticamente. Pausar/reanudar SHALL mantener la posición dentro del tramo; Volver al inicio y reproducir después de terminar SHALL comenzar en el inicio del fragmento. El comportamiento SHALL ser igual en tablero normal y ampliado, conservando volumen y manejo de bloqueos de reproducción.

#### Scenario: Sorteo con límites
- **WHEN** se sortea una canción configurada de 00:45 a 01:15
- **THEN** se reproduce desde 00:45, se detiene al llegar a 01:15 y el historial incorpora solo esa extracción.

#### Scenario: Reiniciar
- **WHEN** se pulsa Volver al inicio durante ese fragmento
- **THEN** la reproducción vuelve a 00:45, sin cambiar el número sorteado.

#### Scenario: Pestaña oculta
- **WHEN** se oculta la página mientras suena un fragmento, durante prueba o sorteo
- **THEN** se pausa y permanece así al volver, hasta una acción explícita; reanudar nunca continúa después del fin configurado.

### Requirement: Persistencia y compatibilidad
Los tiempos SHALL conservarse al recargar, exportar y restaurar respaldos versión 3, independientemente de los archivos y asociaciones temporales. Respaldos 1 y 2 SHALL adaptarse conservando códigos, cartones e historiales y asignando canción completa por defecto. Una configuración de fragmentos inválida en un respaldo SHALL rechazar la importación entera sin cambios. El bingo clásico, impresión y temas SHALL mantener su comportamiento. Solo la pestaña operadora SHALL guardar o probar fragmentos.

#### Scenario: Recuperar un set
- **WHEN** se restaura un respaldo versión 3 y se vuelven a asociar archivos
- **THEN** se recuperan los tiempos por número, se comprueban contra esos archivos y no comienza audio espontáneamente.

#### Scenario: Respaldo anterior
- **WHEN** se abre un respaldo versión 2
- **THEN** se mantienen sus datos de juego y sus canciones usan inicio cero y fin natural hasta configurar fragmentos.
