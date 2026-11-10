# Backend local de práctica

## Qué es

Servicio de demostración sin cuentas ni operaciones reales. Expone catálogo local, cálculo de simulaciones y caídas, y tutor por reglas existente. La interfaz puede elegir explícitamente el servicio o el modo local.

## Contrato

`GET /api/health` devuelve `status`, `mode`, `tutorProvider` y `externalProviders`; `GET /api/catalog` entrega instrumentos, bancos y muestra anual identificada. `POST /api/simulations` recibe `instrumentId`, `initial`, `recurringContribution`, `periods`. `POST /api/declines` recibe `basis`, `language` y, para instrumentos, `instrumentId` y `periods`. `POST /api/tutor` recibe texto, historial acotado y contexto declarativo; el servidor reconstruye cifras y fuentes. Respuestas y límites exactos se documentan en el contrato implementado.

## Límites

Los importes se limitan a 10⁹ EUR, los periodos ficticios a 1–120 y la muestra anual a cinco. No se aceptan observaciones, resultados ni fuentes proporcionados por el cliente. El tutor usa las reglas TypeScript existentes mediante un proceso Node local fijo, con entrada y salida acotadas, tiempo máximo de cinco segundos y concurrencia máxima de cuatro. Sin proveedores externos, claves, base de datos, autenticación ni operaciones reales. Los errores usan `{error:{code,message}}` sin datos de entrada ni trazas.

## Criterios de aceptación

El cálculo preserva el orden de las aportaciones y las fuentes; el tutor y la pausa no inventan causas ni garantizan recuperación. Validar entradas desconocidas, errores y límites; probar integración HTTP, fallos del proceso y flujos de interfaz. El servicio se inicia solo en loopback por defecto; la conexión y el modo local son explícitos.

## Ampliación solicitada para la interfaz

Tres responsables independientes trabajan coordinados sobre la paleta nocturna, la composición de la pausa antipánico y el acceso directo por voz. La paleta pertenece a sus estilos temáticos; la pausa, a sus componentes y estilos propios; la voz, a sus componentes y gestión de interacción. Los límites concretos de archivos se acuerdan antes de editar archivos compartidos; no se redefinen selectores o componentes de otra tarea sin coordinación.

La voz debe poder abrirse directamente sin depender del panel de chat; abrirla no inicia el micrófono ni la reproducción. Una vez que el usuario inicia un turno de voz, la transcripción final se procesa y su respuesta puede leerse con voz local; el micrófono no se reinicia automáticamente. En el dictado del chat el texto se revisa antes de enviarse. La disponibilidad depende de las capacidades locales confirmadas del navegador; cuando no estén disponibles debe ofrecer una alternativa de texto clara. Probar el acceso directo, el cierre y retorno de foco, la ausencia de inicio automático al abrir y el comportamiento cuando voz o procesamiento local no estén disponibles. No inferir que se ha probado audio audible o un micrófono real a partir de simulaciones.

## Estado de verificación

Al 10 de noviembre de 2026 se verificaron 44 pruebas de backend, 21 pruebas Python anteriores, 16 unitarias de frontend y 31 de navegador, además de la compilación de producción. Después de la suite de navegador pasó una prueba dirigida de la indicación de voz hacia el chat cuando el dictado no está disponible. Las revisiones de cálculo, seguridad y accesibilidad no dejaron hallazgos críticos o altos en los alcances revisados; véase la evidencia y sus límites en el plan.
