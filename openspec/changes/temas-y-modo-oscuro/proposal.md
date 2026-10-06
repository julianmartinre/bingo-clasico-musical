# Proposal

## Why

La interfaz actual usa una única paleta clara y varios colores fijos. El usuario necesita elegir una apariencia oscura o una paleta alternativa para usar el bingo cómodamente en diferentes pantallas y ambientes.

## What Changes

- Agregar un control «Apariencia» con modo Claro, Oscuro o Según el sistema.
- Ofrecer tres paletas iniciales propuestas: Bosque (verde actual), Océano (azul) y Ciruela (violeta), combinables con ambos modos.
- Aplicar los cambios al instante y guardar la preferencia en el navegador, independientemente de las partidas.
- Usar inicialmente Según el sistema y Bosque; una elección explícita prevalece sobre el sistema operativo.
- Cubrir ambas modalidades, tablero ampliado, formularios, diálogos, avisos y consultas de canciones con colores legibles y estados distinguibles.
- Mantener los cartones de impresión y su vista previa en papel claro, sin cambios de contenido, tamaño ni paginación.

## Capabilities

### New Capabilities

- `apariencia`: selección y persistencia del modo visual y la paleta, cobertura de la interfaz, legibilidad e independencia de la impresión y del juego.

### Modified Capabilities

Ninguna especificación principal está publicada: `openspec list --specs` no devuelve elementos. Los contratos de los cambios completados de bingo clásico y musical se conservan; este cambio no los archiva ni sincroniza.

## Impact

Se modifican `styles.css`, `index.html`, la integración de controles en `js/app.js`, el servidor estático `serve.js`, README y pruebas. Se agrega un script pequeño para resolver y aplicar la apariencia antes del primer render. No se modifica el dominio ni el formato de respaldos versión 2. Se mantiene HTML, CSS y JavaScript vanilla sin dependencias, compatible con archivo local y GitHub Pages.

## Non-Goals

Editor de colores libres, imágenes de fondo, personalización de cartones impresos, cuentas, sincronización entre dispositivos o rediseño de las reglas del bingo. Esta etapa produce el plan; la implementación y publicación se realizan en una etapa posterior.
