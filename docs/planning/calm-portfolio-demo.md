# Pausa y perfil ficticio

## Qué es
Pausa educativa accesible y ejemplos editables.

## Aceptación
Tarjeta visible, explicación sin promesas ni presión, contexto identificable y editable, fuentes históricas intactas, español e inglés, móvil y teclado.

## Decisiones y archivos
Frontend y documentación; tutor por reglas. Explicación, acontecimientos, cifras, episodios y fuentes visibles directamente al abrir; factores generales diferenciados de causas no comprobadas.

## Inventario de entradas y datos

- Objetivos: perfil ficticio completo y editable con restablecimiento; permanece en pantalla y no se envía al tutor.
- Simulador: importe inicial, aportación, frecuencia, plazo e instrumento ya tienen valores editables. Práctica: instrumentos, importes y plazos iniciales y botones de valores rápidos; las preguntas de comprensión esperan al usuario.
- Pausa: se puede cargar un objetivo y plazo ficticios editables; la liquidez comienza sin indicar y puede ser sí o no. Al reabrir se conserva el contexto. Se comparte con el tutor solo al preguntarle.
- Explorador: filtros seleccionan todos por defecto, selección y comparaciones tienen valores disponibles; buscador vacío para no ocultar productos, con ejemplo de búsqueda. El chat vacío ofrece preguntas sugeridas editables sin enviarlas automáticamente. Voz requiere interacción del usuario.
- Costes, riesgos, series y condiciones desconocidas de productos reales siguen sin datos: no son campos de usuario ni se rellenan con cifras inventadas. Los importes ficticios no convierten los históricos CNMV observados en datos ficticios.

## Estado
Implementado en rama; no integrado en main. La comprobación final del responsable obtuvo `npm test`: 76 pruebas aprobadas, backend: 137 y evaluación del tutor: 116; `npm run build`: correcto con advertencias de tamaño de bundle y directivas de dependencias. Playwright: 12 pruebas focales aprobadas; en la suite ampliada 59 de 60 pasaron y una agotó el tiempo esperando el tamaño del gráfico bajo ejecución concurrente; al repetirla de forma aislada pasó. Se revisaron las capturas en idiomas y temas para móvil y escritorio. El foco también se verificó independientemente en móvil.

La configuración `frontend/calm.playwright.config.ts` usa un servidor manual en 5187 y la API en 8017; las pruebas antiguas de entidades usan 5194 y 5196. No implica un despliegue.

El ajuste posterior que hace visible el contexto histórico al abrir superó la revisión dirigida con 9/10. Sus comprobaciones incluyen 44 pruebas Playwright, otras 7 focales tras el cambio final de texto, 16 pruebas independientes de revisión y compilación correcta; las cifras del párrafo anterior corresponden a la versión previa.
