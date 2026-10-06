# Tasks

## 1. Preferencias e inicialización

- [x] 1.1 Crear `js/appearance.js` con validación, valores iniciales, resolución del sistema y persistencia separada; agregar pruebas que cubran preferencias válidas, datos corruptos, falta de matchMedia y errores de lectura/escritura, verificando que no bloqueen el inicio.
- [x] 1.2 Cargar el script antes del CSS en `index.html`, actualizar atributos, color-scheme y theme-color, y permitirlo en `serve.js`; verificar respuesta local correcta y con una prueba de navegador que la preferencia esté aplicada antes de mostrar el cuerpo.
- [x] 1.3 Manejar cambios del sistema únicamente en modo automático; verificar mediante emulación que los modos explícitos se conservan y que la paleta no cambia.
- [x] 1.4 Documentar en README las preferencias locales, los valores iniciales y la independencia de los respaldos; revisar que coincidan con la implementación.

## 2. Paletas y superficies de papel

- [x] 2.1 Sustituir los colores de pantalla por variables semánticas y crear las seis combinaciones Claro/Oscuro con Bosque/Océano/Ciruela; verificar en navegador navegación, formularios, sorteo, historial, avisos y verificaciones de ambas modalidades.
- [x] 2.2 Definir colores de papel independientes para cartones, vista previa, medición e impresión; agregar una comprobación de igualdad de contenido, geometría y paginación entre temas para lotes clásicos y musicales con títulos largos y continuaciones.
- [x] 2.3 Verificar y ajustar contrastes de texto, indicadores, controles y foco en las seis combinaciones, conservando señales distintas del color para extraídos, último número y resultados; registrar los pares comprobados y la revisión visual en evidencia de QA.

## 3. Controles de apariencia

- [x] 3.1 Agregar el diálogo compartido y sus accesos en cabecera y tablero ampliado, conectados desde `js/app.js`; comprobar cambio inmediato, etiquetas, selección vigente, teclado, cierre y retorno del foco en escritorio y móvil.
- [x] 3.2 Mantener los controles disponibles en pestañas de solo lectura y mostrar fallos de guardado sin bloquear el juego; agregar pruebas de navegador para ambos casos y recarga con preferencia guardada.
- [x] 3.3 Agregar una prueba de integración que cambie apariencia en partidas clásica y musical y compare sus datos antes/después; verificar también conservación de formularios, reinicio e importación sin alterar apariencia, y exportación versión 2 sin preferencias visuales.
- [x] 3.4 Ampliar README con el uso del selector y el comportamiento de los cartones claros; verificar las instrucciones recorriendo los controles implementados.

## 4. Verificación integrada

- [x] 4.1 Ejecutar las suites existentes de dominio y navegador junto con las pruebas de apariencia; confirmar que generación, extracción, línea clásica y bingo completo de ambas modalidades continúan funcionando.
- [x] 4.2 Revisar capturas de las seis combinaciones en escritorio y móvil y una impresión/PDF representativa de cada modalidad; confirmar ausencia de desbordes y mantenimiento del papel claro y la paginación.
- [x] 4.3 Verificar apertura local, servidor estático y rutas bajo un subdirectorio equivalente al de GitHub Pages, sin dependencias ni errores de recursos; registrar resultados y dejar el cambio preparado para revisión antes de publicar.
