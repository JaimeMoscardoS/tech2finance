# Demo BancoT2F: guion y preguntas

## Qué es

Guion de tres minutos para presentar una entidad ficticia con Tech2Finance integrado. Las 24 preguntas literales se han ensayado en navegador y contrastado por API local, en ambos idiomas: [español](../docs/planning/evidence/banco-t2f/gui-rehearsal-es.json), [inglés](../docs/planning/evidence/banco-t2f/gui-rehearsal-en.json) y [matriz API](../docs/planning/evidence/banco-t2f/api-matrix.json). La revisión independiente sigue pendiente. El tutor es por reglas y reconoce formulaciones limitadas.

## Recorrido propuesto: tres minutos

| Tiempo | Pantalla y narración |
| --- | --- |
| 0:00–0:30 | Inicio: «BancoT2F es una entidad ficticia. Tech2Finance acompaña dentro de esta demo educativa; no hay cuenta ni dinero real». Mostrar catálogo, práctica, tutor y pausa. |
| 0:30–1:00 | Explorar → T2F Equilibrio: preguntar por el coste y después si se descuenta. El 0,75 % anual es informativo; el motor no lo resta. |
| 1:00–1:45 | Simulador → Equilibrio, 1.000 EUR iniciales, aportación 0 y seis meses: mostrar el valor y la pérdida ficticios. Preguntar por la causa y señalar que no se conoce. |
| 1:45–2:15 | Seleccionar CaixaBank Monetario, 1.000 EUR, aportación anual 0, cinco años; consultar 2022. Es un producto externo con tasas publicadas, no una serie de BancoT2F ni una previsión. |
| 2:15–2:45 | Cartera ficticia → pausa: mostrar la caída y la necesidad de liquidez. La pausa informa sin impedir la decisión ni garantizar recuperación. |
| 2:45–3:00 | Volver al catálogo y dejar que la persona elija. No se tramitan órdenes. La voz es opcional y depende de capacidades locales disponibles; el texto es el recorrido principal. |

## Preguntas para ensayar

La columna «fuente» identifica los datos o la lógica contrastados por API. Para ensayar casos independientes, recargar la página antes de cada pregunta: el chat escrito conserva mensajes visibles y no hay un botón de conversación nueva. La pregunta 4 es la excepción y continúa la conversación de la 3. Cambiar el idioma para repetir el ensayo en inglés.

| # | Pantalla y preparación exacta | Pregunta ES / EN | Respuesta esperada y límites | Fuente |
| --- | --- | --- | --- | --- |
| 1 | Inicio; conversación nueva | ¿Qué es BancoT2F? / What is BancoT2F? | Entidad ficticia para la demo educativa. | `shared/demo-data.json:bankProfile.description`, `faq[id=identity]` |
| 2 | Inicio; conversación nueva | ¿Qué condiciones tiene la cuenta de demo? / What are the demo account terms? | Mantenimiento 0 EUR/mes y mínimos ficticios 0; sin cuenta real, órdenes ni conexiones. | `bankProfile.conditions`, `bankProfile.products[].minimumInitialEur`, `minimumRecurringEur` |
| 3 | Explorar → T2F Equilibrio → Preguntar por este producto | ¿Cuánto cuesta este fondo? / How much does this fund cost? | 75 pb = 0,75 % anual informativo; entrada, salida y custodia ficticias 0. | `bankProfile.products[instrumentId=demo-mixed].fees` |
| 4 | Misma pantalla, producto y conversación de 3 | ¿Y eso está descontado? / Is that deducted? | No; comisión informativa no descontada del simulador. | `bankProfile.calculationNotice`, `products[].fees.treatment` |
| 5 | Simulador; Equilibrio; inicial 1.000 EUR; aportación mensual 0; 6 meses; ejecutar; conversación nueva | ¿Qué pérdida muestra el resultado? / What loss does the result show? | Valor 892,64 EUR; diferencia −107,36 EUR; rentabilidad acumulada −10,74 %, redondeados. Serie ficticia, no predicción; tarifas no descontadas. | `instruments[instrumentId=demo-mixed].returns`; resultado de `/api/simulations` |
| 6 | Mantener resultado de 5; conversación nueva | ¿Por qué ha caído? / Why did it fall? | No se conoce la causa; no hay noticias conectadas. No inventar causalidad. | `instruments[instrumentId=demo-mixed].returns`; análisis de caídas local |
| 7 | Simulador → Entidad CaixaBank → CAIXABANK MONETARIO RENDIMIENTO, FI CLASE ESTÁNDAR; inicial 1.000 EUR, aportación anual 0, cinco años; Ver mi ejemplo → Abrir asistente | ¿Cuál fue la rentabilidad de 2022? / What was the return of 2022? | −0,67 % publicado para ese año, no rentabilidad acumulada ni serie de BancoT2F. | `annualHistory.returns[year=2022].rate`; `annualHistory.sourceUrl` |
| 8 | Simulador → Entidad BBVA → instrumento `BBVA MI INVERSION BOLSA, FI` → Abrir asistente | ¿Por qué no puedo simularlo? / Why can't I simulate it? | No hay histórico conectado para ese producto; no sustituirlo por otra serie. También aplica a Santander. | `instruments[instrumentId=bbva-mi-inversion-bolsa].dataStatus` |
| 9 | Inicio; conversación nueva | ¿Qué ganaré el próximo año? / What will I earn next year? | No puede predecirse ni garantizarse una ganancia. | `bankProfile.calculationNotice`; límites del tutor |
| 10 | Mi cartera → Entender una caída → Tu contexto (opcional) → ¿Necesitas liquidez pronto? → Sí → Preguntar al asistente | Necesito liquidez, ¿debo mantener? / I need liquidity; should I hold? | Considerar liquidez y circunstancias; decidir corresponde al usuario, sin presión ni garantía. Cartera 1.093 EUR frente a 1.000 iniciales; caída máxima 2,70 % y actual 1,53 % son métricas distintas. | `portfolioPoints`; `/api/declines` con `basis=portfolio_demo` |
| 11 | Explorar → T2F Equilibrio → Preguntar por este producto | ¿Qué estoy viendo? / What am I seeing? | Describir el contexto de exploración y producto disponible, sin inventar datos. | `instruments[instrumentId=demo-mixed]`; contexto de página del tutor |
| 12 | Simulador → Entidad BBVA → instrumento `BBVA MI INVERSION BOLSA, FI` → Abrir asistente | ¿Todos los productos son de BancoT2F? / Are all products from BancoT2F? | No: los externos mantienen identidad y procedencia; el usuario decide qué explorar. | `bankProfile.faq[id=external_products]`; `instruments[].bankId` |

## Cómo verificar

1. Con la integración final, ejecutar pruebas de backend, tutor y frontend según sus README. Anotar comandos y resultados; las pruebas unitarias no sustituyen el recorrido visual.
2. Comprobar la API local: `GET /api/catalog`, `POST /api/simulations` con la especificación del caso 5, `POST /api/declines` con `portfolio_demo` y `POST /api/tutor` con cada contexto. Comparar cifras y fuentes con la tabla y guardar respuestas sin datos privados. No dar por aprobado un caso solo porque una prueba de otro caso pase.
3. Recorrer las 12 preguntas en pantalla en ambos idiomas y comprobar selección, continuidad de la pregunta 4, cambios de contexto y presentación de límites. Registrar cada resultado como pendiente, pasa o falla con evidencia; repetir tras cualquier corrección relevante.
4. Si se muestra voz, confirmar que el navegador dispone de procesamiento y modelo locales ya instalados. No se descarga un modelo ni se configura ninguna clave desde la demo. Las pruebas con mocks no certifican micrófono, voz ni hardware. El texto sigue disponible.

El historial de voz se limita a ocho mensajes de la sesión y se reinicia al cerrar o cambiar contexto, idioma, nivel, modo o proveedor. No se mantiene una grabación permanente ni se reactiva automáticamente la escucha tras responder. Claude y ElevenLabs no están integrados.
