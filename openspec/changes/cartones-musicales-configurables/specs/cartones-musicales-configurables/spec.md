# Spec Delta

## Purpose

Permitir elegir el número de canciones de los nuevos cartones musicales y presentarlos en una grilla tradicional fija, conservando datos e impresiones anteriores.

## ADDED Requirements

### Requirement: Cantidad elegible de canciones por cartón
El sistema SHALL permitir elegir un entero K entre 1 y min(15,N), siendo N las canciones incluidas. SHALL iniciar con min(15,N) al cargar una carpeta nueva válida y conservarlo al cancelar o fallar la selección. SHALL bloquear valores vacíos, fraccionarios o fuera de rango. Al excluir canciones SHALL conservar K si es válido o reducirlo al nuevo máximo con aviso. Sin canciones SHALL deshabilitar generación. Renombrar/reordenar SHALL no cambiar K. El tamaño SHALL quedar fijo en el set generado.

#### Scenario: Límite por canciones
- **WHEN** hay 8 canciones incluidas
- **THEN** se puede elegir de 1 a 8, sin permitir 9 ni 15.

#### Scenario: Límite tradicional
- **WHEN** hay 30 canciones incluidas y se elige 12
- **THEN** todos los cartones nuevos tienen exactamente 12 números, y no se admite elegir más de 15.

### Requirement: Cartones únicos según tamaño elegido
El sistema SHALL generar K números distintos por cartón entre 1 y N y limitar la cantidad de cartones a min(1000,C(N,K)). SHALL considerar iguales dos cartones con las mismas canciones aunque tengan distinta distribución de vacíos. SHALL recalcular y mostrar el máximo al cambiar K/N y ajustar con aviso la cantidad solicitada cuando lo exceda. La generación SHALL congelar K y el listado y guardar de forma atómica, sin consumir códigos ante error.

#### Scenario: Todas las canciones
- **WHEN** N=8 y K=8
- **THEN** solo se puede generar un cartón único.

### Requirement: Grilla musical fija y estable
Los nuevos cartones SHALL tener exactamente 3 filas y 9 columnas, K casillas numeradas y 27−K vacías. SHALL distribuir los números entre filas con diferencia máxima de uno y no más de cinco por fila, admitiendo filas vacías si K es menor que tres. SHALL mostrar números en orden ascendente al recorrer las casillas ocupadas por filas, sin reglas de decenas. SHALL conservar su distribución tras recarga, restauración y reimpresión.

#### Scenario: Cartón de quince
- **WHEN** K=15
- **THEN** la grilla tiene cinco números por fila y doce casillas vacías visibles.

#### Scenario: Cartón pequeño
- **WHEN** K=4
- **THEN** las filas contienen 2, 1 y 1 números en algún orden y quedan 23 casillas vacías.

### Requirement: Impresión y verificación legibles
El sistema SHALL mostrar código, grilla numerada y referencia con los nombres completos de las canciones en nuevos cartones, tanto en vista previa como en el verificador. SHALL imprimir la grilla íntegra en A4 sin cortar columnas. Si los nombres requieren continuación SHALL repetir código, parte y aviso de continuidad sin perder texto. SHALL marcar aciertos únicamente en casillas numeradas y mantener solo bingo completo, sin premio por línea. Las casillas vacías SHALL no contar como canciones ni aciertos.

#### Scenario: Nombres extensos
- **WHEN** los nombres completos no caben con la grilla en una hoja
- **THEN** la referencia continúa identificada por código en páginas posteriores, con la grilla 3 × 9 íntegra.

#### Scenario: Reclamo incompleto
- **WHEN** se extrajeron K−1 canciones del cartón
- **THEN** bingo es inválido y se identifica la faltante, independientemente de filas completas o espacios vacíos.

### Requirement: Persistencia y compatibilidad histórica
El sistema SHALL guardar tamaño, formato y distribución en estado/respaldos versión 5, aceptar versiones 1–4 válidas y preservar sus cartones, nombres, tamaños, formato de lista, códigos, historial, clips y referencias. SHALL validar correspondencia exacta entre canciones del cartón y matriz, dimensiones, filas, duplicados y rangos, y rechazar respaldos inválidos sin reemplazar datos. Sets antiguos con más de 15 canciones por cartón SHALL seguir funcionando con su presentación original. Bingo clásico, carpeta, audio, fragmentos y temas SHALL conservar su comportamiento.

#### Scenario: Respaldo anterior
- **WHEN** se restaura un set anterior con 20 canciones por cartón
- **THEN** conserva sus 20 canciones y presentación de lista sin regenerar cartones ni cambiar el resultado del verificador.

#### Scenario: Matriz inconsistente
- **WHEN** un respaldo contiene un número duplicado, fuera del listado o distinto del conjunto del cartón
- **THEN** se rechaza sin modificar el estado previo.
