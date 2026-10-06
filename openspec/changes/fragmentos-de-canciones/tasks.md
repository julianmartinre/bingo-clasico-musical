# Tasks

## 1. Datos y respaldos

- [x] 1.1 Incorporar clips por número en estado versión 3 y adaptar versiones 1/2 sin mutar la entrada; probar conservación de IDs, códigos, cartones, historial y defaults completos, y rechazo de clips mal formados o en sets clásicos.
- [x] 1.2 Implementar parser y formateador de minutos:segundos, validación estructural e intervalos contra duración; probar vacíos, ceros, 00:59, 01:00, negativos, fin igual/menor al inicio, valores inseguros y límites de archivo.
- [x] 1.3 Actualizar creación de sets, exportación/restauración y expectativas de versión en las suites; probar guardado/restauración versión 3 y fallo atómico, y documentar compatibilidad y respaldo previo en README.

## 2. Reproducción limitada

- [x] 2.1 Extender el reproductor con límites, metadatos, posicionamiento previo y cancelación; probar fuentes demoradas, errores, reemplazos rápidos y que ningún play ocurra antes de posicionarse en el inicio validado.
- [x] 2.2 Detener en fin explícito/natural y adaptar pausa, reanudación, reinicio y fin; probar audio decodificable en primer plano con tolerancia de corte de 300 ms, y que nunca se extraigan bolillas por terminar.
- [x] 2.3 Cancelar temporizadores al cambiar de contexto y pausar al ocultar la página; probar reanudación segura y bloqueos del navegador, y documentar controles, precisión interactiva y pausa al cambiar de pestaña.

## 3. Configuración y prueba

- [x] 3.1 Agregar campos, resumen guardado, errores y guardado/restablecimiento por fila; verificar borradores de varias canciones, títulos repetidos, cargas adicionales, foco, cierre sin guardar y fallos de persistencia sin pérdida de datos previos.
- [x] 3.2 Leer duración bajo demanda y liberar recursos; comprobar archivo reemplazado más corto, metadatos fallidos, guardado sin archivo como pendiente y ausencia de lecturas masivas al abrir.
- [x] 3.3 Agregar contexto de preescucha y botones Probar/Detener, usando un reproductor audible; probar sin partida, cambios de fila/límites, guardado durante una prueba y cierre sin reanudar el sorteo ni modificar su historial.
- [x] 3.4 Integrar permisos de operación, restauración y temas; revisar teclado, móvil, tablero ampliado y seis combinaciones, y documentar el flujo 00:45–01:15, fin vacío y persistencia separada de los archivos en README.

## 4. Verificación integrada

- [x] 4.1 Ejecutar suites de dominio, clásico, musical, apariencia y audio, más fragmentos; comprobar impresión inalterada, respaldos viejos/nuevos, recarga con reasociación, y ejecución desde archivo local y subdirectorio HTTP estático sin tráfico de audios.
- [x] 4.2 Registrar resultados y capturas de configuración; completar una prueba audible con un archivo de segmentos distinguibles para confirmar inicio, corte y repetición, separando esa observación de las pruebas automatizadas.
