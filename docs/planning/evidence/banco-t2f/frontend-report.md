# BancoT2F: informe de interfaz

## Qué es

Registro del cambio de interfaz y voz preparado para la integración local. La entidad, las condiciones y los productos propios de la demostración son ficticios.

## Cambios

- El catálogo local y el del servidor comparten el perfil versionado. La validación comprueba identidad, datos localizados, servicios y FAQ, referencias únicas, importes finitos y no negativos, y correspondencia de productos con instrumentos ficticios. Una respuesta inválida activa recuperación explícita.
- La marca anfitriona es BancoT2F, incluida la recuperación. Inicio muestra servicios, condiciones y preguntas frecuentes. Las tarjetas toman su nombre del catálogo y enseñan costes ficticios en todos los niveles. Simulador distingue condiciones propias de referencias externas y muestra que las comisiones no se descuentan.
- La acción de preguntar selecciona el producto en exploración sin solicitar una simulación. El tutor recibe banco en todas las páginas y producto solo en exploración o simulación. La cartera conserva su muestra independiente.
- El historial de voz se limita a ocho mensajes de la sesión y se borra al cerrar o cambiar contexto; se cancelan solicitudes antiguas y no se reinicia el micrófono tras responder. El chat escrito conserva los mensajes visibles con su idioma y filtra el historial enviado al contexto y proveedor actuales.

## Verificación ejecutada

- `node --experimental-strip-types --test src/*.test.ts src/voice/*.test.ts`: 19/19 en frontend, incluido perfil real y perfiles inválidos.
- `npm run build`: correcto tras el ajuste de contrato del tutor. Vite emite advertencias sobre directivas existentes «use client».
- Una ejecución de `npm test -- --run` durante la edición simultánea terminó 40/43; fallaron un caso inglés del tutor y dos pruebas de informe por actualización en curso. El responsable del tutor comunicó la corrección del caso y está regenerando el informe; debe repetirse la suite completa tras terminar.
- Añadidos `tests/bank-demo.spec.ts` y `tests/bank-voice.spec.ts`. Tras las correcciones de integración se ejecutaron tres pruebas focalizadas en 5177/8097: recorrido bancario, conservación de mensajes y lectura de respuesta en español con interfaz inglesa: **3/3**. La suite completa queda a cargo de integración. La voz se prueba con reconocimiento simulado; no se ha comprobado hardware real.
- Revisión R1: se reprodujo en rojo que Explorar heredaba BBVA del simulador. Se separó su selección, que solo existe tras preguntar desde una tarjeta y se identifica visiblemente. En verde: **8/8** pruebas focalizadas (BBVA y CaixaBank en local y servidor, consulta de Equilibrio, voz simulada y dos regresiones del chat); build correcto y **19/19** pruebas unitarias de frontend. Los casos de voz no acreditan uso de micrófono físico.

No se han iniciado servicios desde esta tarea; las pruebas focalizadas usaron los servidores de integración ya activos. Las capturas de integración deben guardarse en `docs/planning/evidence/banco-t2f/`, fuera de `test-results`.
