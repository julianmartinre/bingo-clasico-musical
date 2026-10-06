# Tasks

## 1. Archivos y asociaciones

- [x] 1.1 Crear el módulo de biblioteca temporal por set y normalización de nombres; verificar con pruebas coincidencias únicas, acentos, espacios, títulos repetidos y archivos homónimos sin asignaciones arbitrarias.
- [x] 1.2 Agregar el diálogo Audios del set y sus accesos en sets y partida musical, con selección múltiple, conteos y correcciones manuales; probar cancelación, cargas adicionales, desvinculación, reutilización explícita y nombres tratados como texto.
- [x] 1.3 Documentar en README la preparación de archivos, reglas de asociación y nueva selección tras recargar; verificar las instrucciones con un set de ejemplo y confirmar que no se escriben archivos ni asociaciones en respaldos o IndexedDB.

## 2. Reproductor y controles

- [x] 2.1 Implementar un reproductor único con URL temporal, limpieza e invalidación de operaciones; probar reemplazos rápidos, promesas demoradas y liberación de URLs sin superposición ni estados obsoletos.
- [x] 2.2 Agregar reproducir/pausar, volver al inicio, volumen y estado junto a la última canción; verificar mediante audio de prueba decodificable los eventos de reproducción, pausa y fin, y operación por teclado en tablero normal y ampliado.
- [x] 2.3 Manejar bloqueo automático, archivo faltante, error de decodificación y volumen no ajustable; probar reintento explícito y avisos sin impedir el sorteo. Documentar en README formatos dependientes del navegador y controles del dispositivo.

## 3. Integración con la partida

- [x] 3.1 Iniciar audio solo tras mutate exitoso en una extracción musical; probar con fallo de guardado que no se reproduce una bolilla no confirmada y que faltantes detienen la pista previa sin revertir el número.
- [x] 3.2 Integrar pausas al verificar y detención al cambiar de partida, crear otra o perder control; comprobar que cerrar el verificador no reanuda y que la pestaña de lectura no reproduce.
- [x] 3.3 Limpiar biblioteca tras importación exitosa y mantenerla al cancelar o fallar; probar IDs reutilizados con canciones diferentes, recargas y nueva asociación sin alterar el respaldo versión 2.
- [x] 3.4 Aplicar variables de los temas y mantener el reproductor estable al cambiar apariencia/ampliación; revisar móvil, seis combinaciones y foco, comprobando que cartones y paginación no se modifican. Documentar pausa por reclamo y cambios de partida.

## 4. Validación integrada

- [x] 4.1 Incluir el script en index.html y la lista de serve.js; verificar reproducción real desde archivo local, servidor HTTP y subdirectorio estático equivalente a GitHub Pages, con registro de red que confirme ausencia de envío de audios.
- [x] 4.2 Ejecutar suites existentes de dominio, clásico, musical y apariencia junto con las nuevas pruebas; registrar resultados, límites de navegadores efectivamente probados y una comprobación audible con archivo local en navegador con salida de audio, sin confundir estados automatizados con escucha real.
