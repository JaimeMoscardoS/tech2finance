# Tutor local y análisis de caídas

## Qué es

Biblioteca TypeScript sin dependencias que explica conceptos y resultados aportados por la aplicación mediante reglas locales y analiza una serie observada. No es un modelo de IA ni utiliza servicios externos. Devuelve texto plano, idioma, intención y fuentes separadas; la interfaz debe presentar el texto como texto, no como HTML.

`src/index.ts` exporta los tipos, `createLocalTutorProvider()` y `analyzeDecline(input)`. El proveedor no cambia controles ni calcula cifras a partir del mensaje. El historial considera como máximo ocho mensajes y el mensaje admite 1500 caracteres. Admite cancelación con `AbortSignal`. Los datos ausentes o no válidos no producen resultados simulados.

La simulación puede aportar fechas ISO de inicio y fin y tasas anuales publicadas mediante `annualReturns`: el campo `ratePercent` se expresa en puntos porcentuales (por ejemplo, `-0.67` significa −0,67 %, no la fracción −0,0067). Las fechas deben ser válidas y ordenadas; los años, únicos y crecientes. El tutor distingue estas tasas de la rentabilidad acumulada y declara cuando no dispone del año solicitado.

El analizador recibe hasta 500 observaciones positivas y finitas, con etiquetas aportadas por quien llama. Debe recibir un índice del instrumento normalizado sin aportaciones, o una cartera ficticia sin flujos; un saldo alterado por aportaciones no mide correctamente la caída del instrumento. Identifica máximos, mínimos y recuperaciones observadas, incluidos episodios abiertos. No infiere causas ni busca noticias o comparables; los datos anuales no son una serie diaria de valor liquidativo. La recuperación observada no garantiza resultados futuros.

Ejecutar desde la raíz: `node --experimental-strip-types --test tutor-ia/tests/*.test.ts`.

## Integraciones futuras

Claude/Anthropic y ElevenLabs son propuestas pendientes, sin SDK, claves, solicitudes de red ni adaptador implementado aquí. Un futuro adaptador debe gestionar credenciales y contexto en el servidor, mantener las claves fuera del navegador y conservar el modo textual cuando no haya voz. `TutorProvider` permite conectar otro proveedor sin presentar este módulo local como un modelo.
