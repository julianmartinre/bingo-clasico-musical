# Verificación de apariencia — 2026-10-05

- 17 pruebas de dominio y preferencias aprobadas (node --test).
- Suites de navegador clásico, musical y apariencia aprobadas en Chrome.
- Verificadas seis combinaciones en 1440 px y 390 px, teclado y tablero ampliado.
- Preferencia temprana, recarga, sistema, almacenamiento bloqueado y pestaña de solo lectura comprobados.
- Partidas y respaldos versión 2 conservados; importación y nueva ronda mantienen apariencia.
- Cartones clásicos y musicales conservan contenido y geometría en seis combinaciones; medición de continuaciones musicales equivalente.
- PDF y capturas de impresión generados; revisión visual de papel claro.
- Apertura file:// y servidor local comprobados, así como recursos bajo subdirectorio equivalente a GitHub Pages.

## Contraste medido

Valores mínimos de los pares de texto (objetivo 4,5:1) e indicadores esenciales (3:1). Los pares individuales están en artifacts/appearance/contrast.json.

| Modo | Paleta | Texto mínimo | Indicador mínimo |
|---|---|---:|---:|
| light | forest | 5.37 | 3.42 |
| light | ocean | 5.37 | 3.42 |
| light | plum | 5.37 | 3.42 |
| dark | forest | 6.94 | 4.95 |
| dark | ocean | 7.07 | 4.95 |
| dark | plum | 7.07 | 4.95 |

## Ejecutar

Con el servidor node serve.js activo y Playwright disponible en el entorno de QA:

```powershell
node --test tests/appearance.test.js
node tests/appearance-browser.cjs
```

BINGO_PLAYWRIGHT permite indicar la ruta de Playwright. No agrega dependencias a la aplicación. Las capturas y PDF generados en tests/artifacts están excluidos de Git.
