# Design

## Context

La aplicación estática usa HTML, CSS y JavaScript vanilla. `styles.css` contiene variables globales parciales y muchos colores literales; `--green` cumple funciones de texto y de fondo que requieren contrastes diferentes. `index.html` carga los scripts actuales con `defer` y tiene un `theme-color` fijo. El estado del juego se guarda en IndexedDB y los respaldos son versión 2.

La cabecera desaparece en el tablero ampliado. Los cartones clásicos tienen dimensiones de impresión fijas y los musicales se paginan midiendo DOM con `js/music-print.js`. Los cambios de apariencia deben preservar esa geometría. `serve.js` usa una lista explícita de recursos permitidos. El despliegue actual es GitHub Pages, también se admite apertura local.

## Goals / Non-Goals

**Goals:** ofrecer selección inmediata de modo y paleta, persistencia local tolerante a fallos, cobertura de las dos modalidades y del tablero ampliado, y legibilidad de pantalla e impresión.

**Non-Goals:** personalizar colores arbitrarios o cartones impresos, agregar dependencias, modificar reglas o almacenamiento del juego, sincronizar dispositivos o publicar durante esta planificación.

## Decisions

### 1. Separar modo y paleta

Un diálogo «Apariencia» tendrá dos controles nativos etiquetados: Claro/Oscuro/Según el sistema y Bosque/Océano/Ciruela. Las paletas iniciales son una propuesta de diseño: verde cercano al actual, azul y violeta. Se aplican al seleccionar, sin botón Guardar. Se ofrecen nombres además de muestras de color.

Habrá un disparador en la cabecera y otro visible en la barra de sesión cuando el tablero esté ampliado; ambos abren el mismo diálogo y comparten selección. Se reutiliza el patrón de diálogos existente, con cierre por teclado y restitución del foco. Los controles seguirán disponibles cuando la pestaña no tenga permiso para modificar la partida. La disposición se verificará en móvil para evitar desbordes de la cabecera.

Se descarta un único interruptor oscuro porque no permite elegir paleta ni seguir el sistema explícitamente.

### 2. Inicialización temprana y almacenamiento separado

Agregar `js/appearance.js`, pequeño y sin dependencias, cargado antes de la hoja de estilos y sin `defer`. Lee una configuración validada, resuelve el modo y aplica atributos `data-mode` y `data-palette` al elemento raíz antes del primer render. Expone una API mínima para consultar y cambiar la preferencia desde `js/app.js`, actualiza `color-scheme` y el metadato `theme-color`. No depende de IndexedDB ni de nodos del cuerpo durante el arranque.

Guardar `{version: 1, mode: 'system'|'light'|'dark', palette: 'forest'|'ocean'|'plum'}` en localStorage bajo `bingo-clasico-musical:appearance:v1`. Validar versión y enumeraciones; una configuración inválida se descarta íntegramente. Lecturas y escrituras se protegen con try/catch. El valor inicial es system/forest y el modo resuelto de respaldo es light si no existe consulta al sistema. Un fallo de escritura conserva la selección en memoria y produce un aviso no bloqueante cuando la interfaz esté disponible.

Escuchar cambios de `prefers-color-scheme`, aplicándolos únicamente cuando la preferencia es system. La sincronización instantánea entre pestañas queda fuera de alcance; nuevas aperturas recuperan la última preferencia guardada. Reinicios, restauraciones y exportaciones del juego no acceden a esta clave.

Se descarta integrar la preferencia en el respaldo o IndexedDB: retrasaría la aplicación inicial y acoplaría una elección del dispositivo a las partidas.

### 3. Colores semánticos y seis combinaciones verificadas

Reorganizar colores de pantalla en variables por función: fondo, superficie, texto principal/secundario, borde, acento de texto, fondo de acento, texto sobre acento, foco, éxito, advertencia, error y estados del tablero. Separar usos de `--green`; reemplazar los literales de botones, campos, navegación, panel del sorteo, gradientes, historial, avisos, resultados y números extraídos/últimos. Usar bases claras/oscuras y acentos por paleta con excepciones por combinación cuando el contraste lo requiera.

Conservar indicadores adicionales al color: textos de resultado, marcas para extraídos y borde o etiqueta para el último número. Verificar los objetivos de contraste de la especificación con los pares finales, incluyendo foco y estados interactivos. No cambiar fuentes, tamaños ni espaciado como parte del tema ni añadir transiciones globales.

Se descarta invertir colores con filtros: altera imágenes, estados y papel sin control de contraste.

### 4. Cartones como superficies de papel

Definir variables de papel estables y separadas para `.ticket`, `.music-ticket`, `.music-page` y sus descendientes, incluidos los cartones mostrados en verificaciones. El contenedor del diálogo sí usa el tema. Los cartones conservan fondo claro, texto oscuro y marcas legibles independientemente del tema. Aplicar las mismas variables al DOM de medición `.music-measure` y a impresión; revisar reglas heredadas y `@media print` para que los temas nunca cambien medidas ni contenido.

No se requiere repaginar al cambiar apariencia: únicamente varían colores de pantalla externos al papel. Una prueba comparará páginas y geometría antes/después, incluyendo títulos musicales extensos y continuaciones.

### 5. Integración limitada

`js/app.js` enlaza controles sin reconstruir la aplicación ni modificar el estado de dominio. Agregar el recurso a la lista de `serve.js` y utilizar rutas relativas compatibles con el subdirectorio de GitHub Pages. Documentar las opciones y el alcance local de las preferencias en README. Mantener `js/domain.js`, `js/storage.js` y el contrato de respaldos sin cambios funcionales.

## Risks / Trade-offs

- Colores literales o herencia pueden dejar superficies ilegibles: inventariarlos y revisar las seis combinaciones en pantallas y diálogos representativos.
- Los campos nativos varían por navegador: declarar `color-scheme` y verificar selectores, campos y carga de archivos en claro y oscuro.
- localStorage puede estar bloqueado o comportarse distinto bajo `file:`: conservar funcionamiento en memoria y comunicar fallos de guardado.
- El script temprano bloquea brevemente el parseo: mantenerlo pequeño y autónomo; a cambio evita el destello claro inicial.
- La impresión musical depende de mediciones: mantener tipografía y geometría y comprobar igualdad de paginación con contenido largo.

## Migration Plan

No hay migración de partidas ni de respaldos. Un navegador sin preferencia usa system/forest; los existentes conservan sus datos de bingo. En la implementación se verificará primero localmente y se prepararán los recursos estáticos para el despliegue habitual. Publicar queda para la etapa posterior autorizada. Revertir los archivos de apariencia restaura la interfaz anterior sin afectar datos; la clave local residual es inocua.
