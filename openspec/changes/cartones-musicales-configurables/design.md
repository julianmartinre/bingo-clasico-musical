# Design

## Context

Actualmente `musicSize(N)` fija `floor(N/6)` con mínimo uno, `musicLimit` usa ese tamaño y `generateMusicCards` muestrea combinaciones sin repetición. El worker recibe cantidad y total, no tamaño. Cada cartón musical guarda `numbers` ordenados; `validateState` exige el tamaño automático y prohíbe matrices musicales. `music-print.js` imprime listas y divide títulos muy largos entre páginas.

El usuario confirmó grilla fija 3 × 9 y máximo 15 canciones. Se mantienen la carga desde carpeta, solo bingo completo y los audios por índice. Ver `proposal.md` para motivación.

## Goals / Non-Goals

**Goals:** tamaño configurable para nuevos sets, grilla estable con vacíos y reimpresión compatible.

**Non-Goals:** premio por línea, 90 canciones obligatorias, distribución musical por decenas, modificar cartones existentes o usar variaciones de casillas vacías para simular cartones distintos.

## Decisions

### Tamaño y formulario

Sea N la cantidad de canciones incluidas y K la cantidad por cartón. Agregar campo entero entre 1 y `min(15,N)`, independiente de «Cantidad de cartones». Valor inicial `min(15,N)` al cargar una carpeta nueva válida; la cancelación/carpeta inválida conserva la selección previa. Excluir canciones conserva K si sigue siendo válido; si excede el nuevo máximo, reducirlo con aviso visible. Sin canciones se deshabilita el campo y la generación. Un valor escrito vacío, fraccionario o fuera de rango bloquea generar con explicación; no corregirlo silenciosamente mientras se escribe. Reordenar o renombrar no cambia K. Cambio de modalidad reinicia el borrador.

Pasar K explícitamente por formulario, worker y generador; congelarlo con la instantánea del set. La cantidad máxima de cartones es `min(1000, C(N,K))`, calculada con BigInt. Si cambia K/N y excede la cantidad solicitada, ajustar dicha cantidad mostrando el nuevo máximo. K=N implica un único cartón. Mantener muestreo de Floyd de combinaciones, sin reintentos aleatorios.

### Grilla musical

Generar una matriz musical 3 × 9 con números o null. Repartir K entre las tres filas de forma equilibrada (diferencia máxima de uno); sortear qué filas reciben el sobrante. Para K=15 hay cinco números por fila; para K=1 o 2 se permiten filas vacías. Elegir columnas ocupadas sin repetición por fila, hasta cinco; distribuir los números seleccionados en orden ascendente al recorrer ocupadas de izquierda a derecha y de arriba abajo. Así toda grilla tiene exactamente K números y 27−K vacíos, sin exigir columnas no vacías.

No reutilizar `validateCard` clásico: exige reglas de decenas y columnas que no corresponden a índices musicales arbitrarios. Conservar `numbers` como conjunto ordenado para verificación/unicidad y guardar `musicMatrix` para presentación. Su conjunto debe coincidir exactamente con `numbers`; números repetidos o valores fuera de N invalidan el cartón. La unicidad se determina por `numbers`, nunca por patrón de vacíos. Generar el patrón una vez y persistirlo, no sortear durante renderizado.

### Presentación y nombres

Los nuevos cartones usan grilla de números con celdas vacías visibles y bordes, código y nombre del set. Debajo aparece una referencia de los K números con sus títulos completos en el mismo orden. Esta decisión de presentación conserva nombres largos sin deformar la grilla fija. La grilla del verificador marca aciertos y deja vacíos sin marcar, acompañada de la misma referencia.

Reutilizar paginación medida A4: no dividir la grilla 3 × 9; mantener cartón y referencia juntos si caben. Si la referencia no cabe, continuar sus nombres en otra página repitiendo código, número de parte y aviso de continuación. Reutilizar división de títulos largos sin truncarlos. No prometer seis cartones musicales por hoja: depende del contenido. Clásico conserva su impresión actual. En pantalla móvil, permitir desplazamiento horizontal del cartón si es necesario sin desbordar el documento; impresión siempre con las nueve columnas completas.

### Compatibilidad y validación

Estado lógico versión 5. Los sets musicales llevan `cardLayout: 'list' | 'grid-3x9'`. Migrar versiones 1–4 usando normalización vigente y agregar `list` a musicales sin tocar `cardSize`, `numbers`, clips, referencias, códigos ni historial. Mantener el renderer de listas para dichos sets, incluso si tienen más de 15 canciones por cartón. En sets nuevos usar `grid-3x9`, validar K entre 1 y min(15,N) y matrices estructuralmente completas, sin arrays con huecos. En `list` mantener la validación histórica de tamaño y no aceptar matrices. En clásicos rechazar campos exclusivamente musicales. Respaldos anteriores con campos nuevos inesperados se rechazan antes de migrar.

La restauración inválida es atómica. No cambiar la versión física de IndexedDB. Documentar que clientes antiguos no admiten versión 5 y conservar respaldo previo para rollback. No convertir listas antiguas a grillas al reimprimir: esos cartones pueden estar en uso.

## Risks / Trade-offs

- Confusión entre canciones por cartón y cantidad de cartones → etiquetas independientes, ejemplo y límites visibles.
- K cercano a N produce pocas combinaciones → calcular máximo exacto; no crear duplicados con distinta distribución.
- Títulos extensos → referencia paginada con código y continuidad; grilla íntegra.
- Parecido al clásico sugiere línea o decenas → rótulo «Solo bingo completo» y mantener reglas musicales explícitas.
- Dos formatos históricos → indicador de formato por set y pruebas de respaldo/reimpresión de ambos.

## Migration Plan

Implementar validación/generación y migración, integrar selector/worker y renderer, luego verificar PDFs y regresiones. No publicar durante planificación. Para rollback, usar versión anterior del código con respaldo compatible previo, sin degradación destructiva del estado 5.

## Ajustes aprobados durante implementación

El usuario pidió mostrar número y canción dentro de cada casilla y luego eliminar la referencia inferior para imprimir varios cartones por hoja. Esta decisión sustituye la presentación con referencia inferior de la propuesta original: las grillas usan casillas de altura fija, hasta cuatro líneas de texto, nombre completo disponible en el tooltip y ningún listado repetido debajo. Las listas históricas conservan su presentación. Se mantienen matrices, códigos, reglas, tamaño y respaldo versión 5.
