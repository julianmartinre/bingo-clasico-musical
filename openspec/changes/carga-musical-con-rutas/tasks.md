# Tasks

## 1. Importación y referencias

- [x] 1.1 Implementar parser puro de CSV/TXT con rutas y mantener TXT simple; probar UTF-8/BOM, saltos, separadores, cabeceras, comillas, registros vacíos, títulos duplicados, errores ubicados y texto literal.
- [x] 1.2 Implementar normalización y validación de referencias locales; probar Windows, POSIX, UNC, barras, Unicode, mayúsculas, nombres con comas y rechazo de URI, controles y segmentos de ascenso.
- [x] 1.3 Agregar plantilla CSV y documentar exportación desde Excel, TXT simple/con rutas y selección posterior de archivos; verificar que el parser importa los ejemplos sin modificaciones.

## 2. Datos y asociación

- [x] 2.1 Incorporar audioRefs en versión 4 y migración pura de versiones 1–3; probar conservación de clips, códigos, cartones e historial, arrays mal formados y rechazo en clásico; documentar compatibilidad y respaldo previo.
- [x] 2.2 Extender biblioteca con asociación por ruta/sufijo/nombre, resultados ambiguos y procedencia manual/automática; probar precedencia, referencia explícita faltante, títulos sin referencia, archivos compartidos y recomputación al agregar candidatos.
- [x] 2.3 Corregir identidad de archivos para preservar homónimos y elecciones manuales; probar mismas fechas/tamaños en subcarpetas, reelecciones, selección individual ambigua y desvinculación manual que no se revierte al agregar archivos.

## 3. Preparación del set

- [x] 3.1 Integrar formato/separador, carpeta y selección múltiple con vista previa y correcciones por fila; probar listado del ejemplo, mensajes de XLSX, cancelación, teclado y estados sin referencia/faltante/ambiguo/asociado.
- [x] 3.2 Transferir borrador y asociaciones solo tras guardar el set; probar generación sin audio, errores de persistencia, reemplazo de listado/modalidad y lecturas tardías sin alterar sets anteriores.
- [x] 3.3 Documentar y verificar en navegador el flujo completo CSV → carpeta → revisión → cartones → sorteo con audio, mostrando coincidencia por nombre cuando no se puede comprobar la carpeta absoluta.

## 4. Corrección y recuperación

- [x] 4.1 Agregar edición/guardado de referencia y retorno a asociación automática en Audios; probar cambios por fila, errores de guardado, permisos, cancelación de reproducción y conservación de clips y datos del juego.
- [x] 4.2 Integrar exportación/restauración y recarga con reasociación; probar respaldo versión 4, versiones anteriores, fallo atómico y limpieza de bibliotecas solo tras restauración válida; documentar referencias persistentes y archivos/elecciones temporales.

## 5. Verificación integrada

- [x] 5.1 Ejecutar suites existentes de dominio, clásico, musical, apariencia, audio y fragmentos junto a las nuevas; verificar impresión sin rutas, bingo completo, temas y controles móviles/teclado sin regresiones.
- [x] 5.2 Probar HTTP local, file y subdirectorio estático, selección de carpeta y alternativa múltiple, ausencia de tráfico de audios y de lecturas masivas; registrar resultados, capturas y navegadores realmente comprobados.
