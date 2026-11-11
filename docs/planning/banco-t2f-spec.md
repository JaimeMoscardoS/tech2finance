# BancoT2F: especificación

## Qué es

Una entidad bancaria ficticia que aporta contexto coherente al catálogo, la práctica, el tutor y la pausa de cartera de la demostración, en español e inglés.

El perfil compartido identifica la muestra sintética, servicios, condiciones, productos, comisiones y preguntas frecuentes. No hay clientes, saldos, cuentas, órdenes ni conexiones reales. Los mínimos son cero; las comisiones son informativas y no se descuentan del simulador. Los productos y fuentes de entidades reales conservan su identidad y procedencia. Las series y cálculos existentes no cambian.

El backend resuelve el perfil por `bankId` opcional, con `demo` por defecto, identificador desconocido 400 y campos extra 422. El tutor recibe el perfil y solo el producto seleccionado en exploración o simulación; la interfaz usa el mismo perfil en todas las páginas. El historial de voz se limita a ocho mensajes en la sesión. El guion documenta doce preguntas, respuesta esperada, fuente y pasos previos.

## Contrato de datos y límites

`BankProfile` y sus tipos se definen en `shared/bank-profile.ts`; el perfil real de la demo procede de `shared/demo-data.json`, versión `bank-demo-2026-11-10.1`, clasificación `synthetic_demo` y fuente `synthetic_seed` del 10-11-2026. Moneda EUR, mantenimiento 0, mínimos iniciales y recurrentes 0; no requiere cuenta real ni permite órdenes reales o conexiones externas.

Los gastos anuales ficticios son 40, 75, 110 y 20 bps para estabilidad, equilibrio, horizonte y ETF respectivamente; el de la acción no está definido (`null`). El ETF y la acción tienen orden fija informativa de 1 EUR; los fondos, 0 EUR. Entrada, salida y custodia son 0 bps. Ninguna de estas condiciones se descuenta de los resultados. Las series de entidades externas mantienen su origen y no se presentan como datos propios del banco ficticio.

En servidor, el cliente identifica banco y selección; `bankId` es el único campo bancario opcional y el servidor resuelve el perfil desde datos verificados. Se rechazan con 422 los campos extra, incluidos `bank`, `bankProfile` y `product` inyectados. Internamente el contrato es `TutorContext.bank?: BankProfile` e `instrument.product?: BankProduct` anidado, sin `product` al nivel superior. Solo se adjunta producto en exploración o simulación y no se atribuyen comisiones demo a instrumentos externos. El tutor se abstiene ante datos ausentes; el nivel modifica la explicación, no el riesgo. La voz conserva hasta ocho mensajes de la sesión y reinicia el historial al empezar otra.

## Cobertura del guion de demostración

El [guion canónico](../../presentacion/demo-banco-t2f.md) contiene doce preguntas en español e inglés, con preparación, expectativas, fuentes y procedimiento de verificación. El tutor utiliza plantillas limitadas: las frases exactas y respuestas, los contextos de las cuatro páginas, la voz y el recorrido deben comprobarse en la integración final; la existencia del guion no demuestra que hayan pasado. Los costes de ETF y acción también deben contrastarse mediante pruebas específicas. No inventar resultados ni fuentes para completar la cobertura.
