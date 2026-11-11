# Tutor local y análisis de caídas

## Qué es

`buildDetailedDeclineAnalysis` construye el informe detallado local compartido por interfaz y servidor. El servidor puede añadir explicaciones generadas por Sonnet si se configura expresamente; el tutor de conversación existente sigue funcionando por reglas. Véase [el contrato](../docs/contratos.md#análisis-detallado-de-caídas) para los datos transmitidos y límites.

El contexto de BancoT2F y los ejemplos de preguntas se recogen en [BancoT2F](../docs/banco-t2f.md) y el [guion](../presentacion/demo-banco-t2f.md). Las formulaciones y respuestas del recorrido deben comprobarse sobre la integración final.

Biblioteca TypeScript sin dependencias que explica conceptos y resultados aportados por la aplicación mediante reglas locales y analiza una serie observada. No es un modelo de IA ni utiliza servicios externos. Devuelve texto plano, idioma, intención y fuentes separadas; la interfaz debe presentar el texto como texto, no como HTML.

`src/index.ts` exporta los tipos, `createLocalTutorProvider()` y `analyzeDecline(input)`. El proveedor no cambia controles ni calcula cifras a partir del mensaje. El historial considera como máximo ocho mensajes y el mensaje admite 1500 caracteres. Admite cancelación con `AbortSignal`. Los datos ausentes o no válidos no producen resultados simulados.

La simulación de NAV histórico aporta fechas ISO de inicio y fin y frecuencia mensual o anual; en esta última las aportaciones se contabilizan cada 12 cierres. El tutor explica los importes calculados y no infiere la rentabilidad de un año no suministrado. La muestra auxiliar anterior puede aportar tasas anuales publicadas mediante `annualReturns`: el campo `ratePercent` se expresa en puntos porcentuales (por ejemplo, `-0.67` significa −0,67 %, no la fracción −0,0067). Las fechas deben ser válidas y ordenadas; los años, únicos y crecientes. El tutor distingue estas tasas de la rentabilidad acumulada y declara cuando no dispone del año solicitado.

El analizador recibe hasta 500 observaciones positivas y finitas, con etiquetas aportadas por quien llama. Debe recibir un índice del instrumento normalizado sin aportaciones, o una cartera ficticia sin flujos; un saldo alterado por aportaciones no mide correctamente la caída del instrumento. Identifica máximos, mínimos y recuperaciones observadas, incluidos episodios abiertos. No infiere causas ni busca noticias o comparables. El contexto opcional puede contener el hecho público verificado de la OMS del 11 de marzo de 2020 cuando esté dentro del periodo; no demuestra causalidad. La recuperación observada no garantiza resultados futuros.

Ante expresiones reconocidas de preocupación por una caída o una venta, en español o inglés, el tutor ofrece una explicación empática y considera el objetivo, el horizonte y la liquidez recibidos. Esta respuesta no incorpora cifras ni fuentes del informe de caída; una pregunta específica sobre la caída conserva la explicación del informe. Si no hay observaciones válidas, lo indica. Las referencias reconocidas a otro producto o a una caída futura se rechazan sin trasladar datos del contexto activo. Los factores generales son posibilidades, no causas demostradas, y cualquier escenario BancoT2F sigue siendo ficticio. La decisión corresponde al usuario, sin garantía de recuperación ni recomendación predeterminada de mantener. La detección se basa en palabras y no comprende todas las formulaciones.

Ejecutar desde la raíz: `node --experimental-strip-types --test tutor-ia/tests/*.test.ts`.

## Evaluación local

El harness de `evals/` comprueba ejemplos sintéticos del proveedor local, sin dependencias ni servicios. `corpus.v1.json` contiene solicitudes y expectativas; `policy.v1.json` documenta los invariantes en estado **DRAFT**. Hay casos en español e inglés para los tres niveles, incluidos importes y pérdidas, abstención, decisión, inyección, límites y cancelación. El reconocimiento de referencias a activos y futuro es limitado a patrones explícitos: no garantiza comprender cualquier formulación.

Desde la raíz, generar el informe congelado con `node --experimental-strip-types tutor-ia/evals/run.ts --write`. Comprobarlo sin escribir con `node --experimental-strip-types tutor-ia/evals/run.ts --check`. El segundo comando devuelve código distinto de cero ante discrepancias o fallos. `report.v1.json` registra resultados por caso e invariante, cobertura y hashes SHA-256 de corpus, política y archivos de implementación evaluados, sin fecha ni datos personales. Cambiar el corpus, la política o el código requiere regenerar y revisar el informe junto al cambio; regenerarlo no convierte fallos en aceptables.

Los hashes se calculan sobre texto UTF-8 sin BOM con saltos de línea CRLF normalizados a LF. La comparación del informe aplica la misma normalización; otros cambios de espacios o contenido siguen detectándose. `--check` no reescribe el archivo.

Las comprobaciones son patrones y ejemplos finitos, no una prueba exhaustiva ni una validación de un LLM, legal o de aprendizaje. Las cifras se contrastan con expectativas sintéticas del corpus, no con un motor financiero independiente. El contrato público y las integraciones no cambian.

## Integraciones futuras

El chat `TutorProvider` continúa por reglas. El adaptador opcional de Sonnet está en el servidor y solo se usa para el análisis detallado; ElevenLabs sigue pendiente. Las claves permanecen fuera del navegador y se conserva la opción textual.
