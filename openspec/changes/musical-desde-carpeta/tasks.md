# Tasks

## 1. Listado desde carpeta

- [x] 1.1 Implementar constructor puro de filas por archivo, filtro de extensiones, exclusiones con motivo, títulos y orden natural; verificar pruebas de subcarpetas, MIME vacío, archivos vacíos, rutas inválidas, homónimos y nombres con números/puntos/acentos.
- [x] 1.2 Incorporar identidad estable y operaciones de editar, incluir y mover filas; probar que títulos repetidos, reordenamiento y exclusión nunca intercambian sus File ni referencias.

## 2. Preparación simplificada

- [x] 2.1 Sustituir entradas del generador por Cargar carpeta y revisión con títulos, inclusión y Subir/Bajar; verificar numeración, títulos vacíos, foco/teclado y cálculo de 5 canciones por cartón cuando se incluyen 30.
- [x] 2.2 Implementar reemplazo válido, conservación ante cancelación/error/carpeta sin audios, descarte por modalidad y rechazo de operaciones obsoletas; verificar cada transición y el mensaje de navegador sin selector de carpeta.
- [x] 2.3 Actualizar README y ayuda visible con carpeta → revisar → generar y necesidad de reelección tras recarga; comprobar que no quedan instrucciones ni controles de TXT/CSV en el flujo de creación.

## 3. Generación y continuidad

- [x] 3.1 Generar desde instantánea de filas incluidas y asociar directamente sus archivos tras persistencia; probar bloqueo de edición durante generación, fallo atómico con reintento y sorteo que reproduce el archivo correcto después de renombrar/reordenar.
- [x] 3.2 Conservar estado versión 4 y mantenimiento en Audios; probar restauración de versiones 1–4, sets históricos TXT/CSV, recarga con carpeta, títulos personalizados, homónimos y preservación de códigos, historial y fragmentos; documentar compatibilidad.
- [x] 3.3 Retirar plantilla, ruta de servidor y parsers sin consumidores, y adaptar pruebas de creación al flujo de carpeta; verificar ausencia de referencias de producción al importador retirado y conservar pruebas de respaldos históricos y asociación.

## 4. Verificación integrada

- [x] 4.1 Ejecutar suites unitarias y de navegador actualizadas para ambos bingos, audio, fragmentos, temas, impresión, permisos y respaldos; verificar que las canciones excluidas no aparecen en cartones ni bolillero.
- [x] 4.2 Probar carpeta real de fixtures en HTTP local, file y subdirectorio estático, revisión móvil/teclado y seis temas; registrar capturas, navegadores probados y ausencia de envíos, lectura masiva o reproducción al importar.
