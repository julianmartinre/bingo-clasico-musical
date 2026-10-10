# Tasks

## 1. Tamaño y generación

- [x] 1.1 Parametrizar tamaño y límite de combinaciones y adaptar generación; probar K=1, K=15, K=N, N menor que 15, valores inválidos y agotamiento del espacio sin cartones duplicados.
- [x] 1.2 Generar y validar matrices musicales 3 × 9 con reparto equilibrado y vacíos; probar K de 1 a 15, números únicos, orden, filas y correspondencia con numbers, incluyendo entradas corruptas y arrays con huecos.

## 2. Persistencia compatible

- [x] 2.1 Incorporar versión 5 y cardLayout con migración pura desde 1–4; probar conservación de formatos anteriores (incluido tamaño mayor a 15), códigos, clips, referencias e historial, roundtrip de grillas y rechazo atómico de respaldos inválidos; documentar compatibilidad y rollback en README.

## 3. Preparación del set

- [x] 3.1 Agregar Canciones por cartón y límites/avisos; probar carga de carpeta, cancelación, inclusión/exclusión, cero canciones, entrada inválida, reordenamiento y ajuste de cantidad de cartones, con teclado y móvil.
- [x] 3.2 Pasar K y matrices por worker y guardado, congelando el borrador durante generación; probar tamaño elegido, error sin consumo de códigos y conjuntos únicos, y documentar ejemplos N=30/K=12 y N=8/K=8.

## 4. Presentación e impresión

- [x] 4.1 Implementar grilla de números con vacíos y referencia de nombres en vista previa y verificador; probar 1, 4, 12 y 15 canciones, aciertos sin marcar vacíos, solo bingo completo y renderer histórico de listas.
- [x] 4.2 Adaptar paginación A4 conservando grilla íntegra y nombres completos con continuaciones; generar e inspeccionar PDFs de nombres cortos y extremos, verificar código/partes, nueve columnas sin corte y reimpresión idéntica; documentar distribución de hoja variable.

## 5. Verificación integrada

- [x] 5.1 Ejecutar suites de dominio, clásico, musical, carpeta, audio, fragmentos y apariencia actualizadas; comprobar respaldo/recarga y que cambiar K no altera asociaciones ni sorteo.
- [x] 5.2 Verificar seis temas, móvil, teclado, HTTP local, file y subdirectorio estático; registrar evidencia visual y resultados, con compatibilidad real de navegadores probados.

Evidencia y compatibilidad comprobada: `tests/MUSIC-GRID.md`.
