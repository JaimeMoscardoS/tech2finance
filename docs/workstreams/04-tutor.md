# Evaluación del tutor local

## Qué es

Batería reproducible para las reglas del tutor local con solicitudes y datos sintéticos. No evalúa un modelo de IA ni demuestra eficacia educativa o cumplimiento legal.

## Decisiones y alcance

El corpus y la política tienen versión propia; la política es DRAFT. El informe conserva hashes y resultados por invariante sin fechas ni datos sensibles. El runner separa la generación explícita de `--check`, que recalcula sin escribir. Se comprueban cifras asociadas a etiquetas y ausencia de cifras adicionales en los casos numéricos seleccionados; las comprobaciones de seguridad son patrones finitos, no cobertura universal. El tutor evita atribuir la simulación activa a ciertas consultas de otro activo o del futuro y mantiene las definiciones y consultas de la simulación activa. El reconocimiento es limitado y no constituye comprensión general del lenguaje.

## Comprobación

Desde la raíz: `node --experimental-strip-types --test tutor-ia/tests/*.test.ts`, `node --experimental-strip-types tutor-ia/evals/run.ts --write` y `node --experimental-strip-types tutor-ia/evals/run.ts --check`. El informe congelado indica las cifras y resultados de esta versión; una ejecución posterior debe verificarse de nuevo. No hay cambios en contratos ni proveedores.

## Revisión R1 y correcciones

La revisión formal R1 obtuvo **7/10**, con un hallazgo alto y dos medios; no superó la puerta de revisión. El seguimiento podía recuperar las cifras de la simulación tras una abstención, incluso si había una respuesta numérica anterior; ahora la continuación solo consulta la última respuesta del asistente y las abstenciones de resultado se marcan como `unknown`. La evaluación de caídas aceptaba porcentajes alterados o adicionales; los casos de caída ahora comprueban los tokens numéricos completos y sus expectativas reales tienen controles negativos. Las preguntas válidas con calificadores limitados o una definición de rentabilidad de una inversión se habían rechazado; se han añadido regresiones y patrones acotados, preservando el rechazo de nombres de activos diferentes.

Las regresiones reprodujeron los tres problemas antes de las correcciones. La suite y el informe deben ejecutarse de nuevo para verificar cada versión; Node 25.9.0 se ha utilizado para este corte y Node 24 queda pendiente de comprobación. Estos patrones no son comprensión general del lenguaje, no interpretan parámetros nuevos ni órdenes y no acreditan un futuro LLM.

## Revisión R2 y corrección

R2 obtuvo **7,8/10**, sin hallazgos críticos ni altos, y no superó la puerta. Quedó un hallazgo medio: se eliminaban los prefijos «Fund» y «Fondo» antes de comparar el nombre completo del instrumento activo, provocando abstenciones incorrectas. Se añadieron regresiones en inglés y español, ambas fallaron antes del cambio y pasaron después; la comparación comprueba ahora el nombre completo antes del prefijo descriptivo. Las pruebas existentes conservan el rechazo de nombres distintos.

## R3 y portabilidad pendiente de R4

R3 obtuvo **8,8/10** y cerró los hallazgos anteriores. Antes del commit, el director detectó que los hashes y la comparación del informe dependían de los saltos de línea de Git. El runner normaliza CRLF a LF para calcular SHA-256 sobre texto UTF-8 sin BOM y comparar el informe; no normaliza otros espacios. Una prueba ejecuta el CLI en copias temporales completas con LF y CRLF, verifica que no reescribe el informe y comprueba que un cambio de contenido sigue provocando fallo. La prueba falló antes de la corrección y pasó después. La nota de R3 no sustituye la revisión final R4.

## R4 y comprobación posterior

R4 obtuvo **8,8/10** y cerró los hallazgos anteriores y la corrección de saltos de línea. Después, ROOT detectó tres fallos de cuatro pruebas de evaluación al ejecutarlas desde `frontend`: sus rutas dependían del directorio de trabajo. La corrección afectó solo a las rutas de `evals.test.ts`, resueltas ahora desde `import.meta.url`; el director y ROOT la inspeccionaron y comprobaron. Esta corrección es posterior a R4 y no se atribuye a esa revisión; no hubo una quinta revisión.

En Node 25.9.0, la suite del tutor pasó 16 de 16 pruebas tanto desde la raíz como desde `frontend`, y el runner devolvió 94 casos y cero fallos desde ambos directorios. Los 94 casos son 15 familias cruzadas con dos idiomas y tres niveles, más cuatro casos específicos: no son 94 escenarios independientes. En Windows se comprobó el CLI con copias LF y CRLF y que `--check` no reescribe el informe. Node 24 y Linux nativo siguen pendientes. El director ejecutó además `backend/tests/test_api.py::test_simulation_decline_and_real_local_tutor` con Python 3.14: una prueba superada.

El alcance sigue limitado a patrones y ejemplos finitos: no es comprensión general del lenguaje ni interpreta nuevos parámetros u órdenes. No acredita un LLM futuro, cumplimiento legal ni aprendizaje. Los hashes usan texto UTF-8 sin BOM con saltos de línea LF canónicos.

La primera comprobación `git diff --check` solo incluyó archivos ya seguidos, no los nuevos sin añadir. La comprobación posterior del contenido preparado detectó una línea en blanco extra al final del corpus; un comando encadenado continuó y creó el primer commit pese al aviso, por lo que se detuvo la publicación. La corrección elimina solo esa línea, verifica la equivalencia JSON con el corpus del primer commit y regenera el informe. Se comprueba de nuevo el contenido preparado antes del segundo commit.
