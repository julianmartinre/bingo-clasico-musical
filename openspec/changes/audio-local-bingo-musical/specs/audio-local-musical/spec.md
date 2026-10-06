## Purpose

Reproducir canciones desde archivos elegidos en el dispositivo durante el bingo musical, conservando la integridad del sorteo y la privacidad de los audios.

## ADDED Requirements

### Requirement: Archivos locales por set
La aplicación SHALL permitir seleccionar múltiples archivos de audio para un set musical guardado y mostrar número, título, archivo asociado y cantidad de canciones con y sin audio. Los archivos SHALL permanecer en el dispositivo sin enviarse a servidores. Cancelar la selección SHALL conservar las asociaciones existentes.

#### Scenario: Selección desde el sitio publicado
- **WHEN** la persona selecciona audios desde GitHub Pages
- **THEN** puede asociarlos al set sin subirlos ni configurar un servidor local.

### Requirement: Asociación verificable
La aplicación SHALL asociar automáticamente solo coincidencias únicas entre título y nombre de archivo sin extensión, ignorando mayúsculas, acentos y espacios redundantes. Títulos repetidos o varios archivos candidatos SHALL requerir selección manual por número. La persona SHALL poder cambiar o quitar una asociación y usar el mismo archivo para varios números explícitamente. Agregar archivos SHALL conservar las asociaciones previas y completar únicamente coincidencias inequívocas sin asignación.

#### Scenario: Coincidencia simple
- **WHEN** el set contiene «Pasos al costado» y se elige «PASOS AL COSTADO.mp3» como único candidato
- **THEN** se vincula a ese número y se muestra el archivo seleccionado.

#### Scenario: Ambigüedad
- **WHEN** existen dos entradas «Don» o dos archivos candidatos para ese título
- **THEN** no se elige arbitrariamente y cada entrada pendiente permite asignación manual.

### Requirement: Reproducción posterior a extracción confirmada
Cada extracción musical guardada correctamente SHALL detener la pista anterior e intentar reproducir desde el inicio el audio del nuevo número. SHALL sonar como máximo una pista. Un fallo al guardar SHALL impedir iniciar un audio nuevo. Terminar un audio, consultar tablero o historial y renderizar la interfaz SHALL no extraer números ni iniciar otras pistas.

#### Scenario: Nueva canción
- **WHEN** se confirma una extracción mientras suena la canción anterior
- **THEN** la anterior se detiene y comienza la correspondiente al nuevo número desde el inicio.

#### Scenario: Error de persistencia
- **WHEN** falla el guardado de la extracción
- **THEN** no se reproduce ninguna canción correspondiente a una bolilla no confirmada.

### Requirement: Controles y recuperación
La interfaz SHALL mostrar número, título y estado real de reproducción, con reproducir/pausar, volver al inicio y volumen accesibles por teclado y en tablero ampliado. Un bloqueo del navegador SHALL ofrecer reproducción mediante un clic explícito sin repetir la extracción. Archivos faltantes, dañados o incompatibles SHALL producir un aviso y permitir continuar el sorteo. La ausencia de control programático de volumen en el dispositivo SHALL indicarse y remitir al volumen del dispositivo.

#### Scenario: Reproducción bloqueada
- **WHEN** el navegador rechaza el inicio automático
- **THEN** la bolilla permanece sorteada y aparece la acción Reproducir canción para intentarlo directamente.

#### Scenario: Falta audio
- **WHEN** se extrae una canción sin archivo asociado
- **THEN** se detiene el audio anterior, se muestra «Sin audio para esta canción» y se permite sacar la siguiente bolilla.

#### Scenario: Pausar y repetir
- **WHEN** la persona pausa, reanuda o vuelve al inicio
- **THEN** se controla únicamente la última canción sorteada sin alterar historial ni cartones; al terminar queda detenida sin avanzar automáticamente.

### Requirement: Ciclo de vida seguro
Cambiar de partida, comenzar una nueva, restaurar un respaldo correctamente o perder el control de la pestaña SHALL detener el audio. Abrir el verificador SHALL pausar la pista y cerrarlo SHALL no reanudarla automáticamente. Cambiar tema o ampliar el tablero SHALL no interrumpir ni reiniciar la pista. Las pestañas sin control SHALL no iniciar reproducción. Corregir la asociación de la pista actual SHALL detenerla y requerir reproducción manual.

#### Scenario: Verificar un reclamo
- **WHEN** se abre y luego se cierra el verificador durante una canción
- **THEN** permanece pausada hasta una acción explícita de reproducción o la próxima extracción.

#### Scenario: Cambiar contexto
- **WHEN** se cambia a otra partida, incluso clásica
- **THEN** la pista anterior deja de sonar y no comienza ninguna pista de la nueva partida automáticamente.

### Requirement: Sesión y compatibilidad
Los archivos y asociaciones SHALL mantenerse solo en memoria por set durante la página abierta. Recargar SHALL requerir seleccionarlos nuevamente; se informará de esta limitación antes de cargarlos. Restaurar un respaldo correctamente SHALL limpiar todas las asociaciones, incluso si reutiliza identificadores. Cancelar o rechazar una importación SHALL conservarlas. Respaldos versión 2, cartones, reglas clásicas y musicales, impresión y temas SHALL conservar su comportamiento.

#### Scenario: Recarga y restauración
- **WHEN** se recarga la aplicación o se completa una restauración
- **THEN** la partida conserva sus datos correspondientes y la interfaz solicita volver a asociar los audios, sin reproducción espontánea.
