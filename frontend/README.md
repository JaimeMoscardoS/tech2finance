# Frontend de Tech2Finance

## Qué es

Interfaz educativa React/TypeScript para explorar fondos, simular aportaciones, comparar ejemplos y entender una caída. Ofrece tres niveles, español e inglés, temas claro y oscuro y voz local opcional. La demo no conecta cuentas ni realiza operaciones.

La tarjeta «¿Te preocupa la caída?» abre un análisis detallado de seis apartados junto a los datos y fuentes observados. En modo local se identifica como demostración por reglas; en modo servidor solo se identifica como IA cuando el proveedor y modelo están confirmados por la respuesta. Al fallar muestra el error y permite reintentar sin ocultar las observaciones. El contexto editable se aplica al análisis con un botón explícito, no al escribir. El tutor escrito y de voz sigue accesible. La configuración y la prueba real del proveedor son independientes de esta interfaz.

El selector de detalle de la cabecera se expande con Motion; permite volver, elegir un nivel o cerrarlo con Escape o pulsando fuera. Respeta la preferencia de movimiento reducido y mantiene el nivel global durante la sesión. Para comprobarlo: `npx playwright test -c playwright.level.config.ts`.

El botón «Hablar con IA» inicia el dictado local y muestra una barra no modal. La respuesta se lee con voz local disponible; «Ver respuesta» y «Escribir» se abren solo al solicitarlos. El componente y su comprobación se describen en [componentes de interfaz](../docs/ui-components.md).

## Datos y simulación

El catálogo identifica cinco casos de estudio por gestora e ISIN. BancoT2F es el anfitrión simulado; sus condiciones no se atribuyen a esos fondos. Los riesgos, plazos, mínimos y costes adicionales desconocidos se presentan como tales. El modo local usa `shared/demo-data.json`, `shared/nav-history.json` y `shared/data-manifest.json`; el modo servidor obtiene el catálogo v2 y cálculos desde FastAPI. No cambia automáticamente de modo ante errores. Una respuesta de catálogo o simulación incompatible activa la recuperación explícita.

Las series usan 73 cierres mensuales de valor liquidativo observados y publicados por la CNMV, desde diciembre de 2019 hasta diciembre de 2025: se selecciona la última observación diaria real de cada mes, sin interpolar, repetir ni extrapolar. Los archivos, hashes y condiciones de reutilización constan en la fuente compartida; las muestras antiguas quedan en snapshots separados. Cada resultado identifica instrumento, moneda y fechas. El valor liquidativo refleja gastos incorporados al fondo; el cálculo no añade costes externos ni impuestos. La frecuencia predeterminada es mensual: esas aportaciones se suman después de cada cierre. Las anuales se suman en los meses 12, 24 y sucesivos desde el inicio, sin prorrateo. En un plazo inferior a 12 meses no se suma ninguna aportación anual. Los resultados pasados no predicen resultados futuros.

La cartera de ejemplo y «Probar una caída» comparten el caso BBVA Mi Inversión Bolsa Acumulación, ISIN ES0125269003, con 1.000 € de capital de práctica, sin aportaciones, entre el 31 de diciembre de 2019 y el 31 de marzo de 2020. La pausa muestra el dato observado y, cuando coincide con el periodo, un hecho público de la OMS con fecha y enlace; su coincidencia no demuestra causalidad. La persona conserva la decisión.

Explorar muestra los fondos permitidos para el anfitrión, o filtra por emisor para una entidad configurada. La comparación utiliza series compatibles; CSV incluye los cierres, fuente, ISIN, moneda, versión y hashes. La práctica guiada compara aportaciones, plazos o instrumentos con condiciones compatibles y descarta resultados anteriores al editar. La muestra anual publicada previa permanece como método auxiliar de referencia, no como serie de NAV.

## Simulador guiado en tres pasos

Implementado en la rama `feature/simulador-guiado` (basada en `feature/juego-pantalla`; no está en `main`). `Simulator.tsx` es un recorrido con barra de progreso («Paso N de 3», `aria-current="step"`, pasos clicables para volver) y una burbuja de guía (`aria-live="polite"`, texto según paso y estado). Los pasos se desbloquean en orden (el 2 al elegir fondo en esta visita, también desde Explorar; el 3 al revelar el resultado del 2) y los anteriores siguen editables: todo se actualiza en vivo. Cada paso tiene su color (azul, verde azulado, violeta) con variables propias claras y oscuras en `simulator-journey.css`; el texto cumple 4,5:1 (comprobado en pruebas). Textos del paso 1 y 2 en `journey-copy.ts`; los del paso 3 en `HoldSellGame.tsx`.

**Niveles:** principiante muestra la guía completa y explicaciones en las tarjetas; intermedio, pistas cortas; avanzado, guía plegada con botón «Mostrar guía» y datos extra (ISIN, clase, unidades, motor).

**Paso 1 · Elige tu fondo.** Grupo de radios («Instrumento») con una tarjeta por fondo de la entidad: nombre y gestora, clase (`assetClass`: Renta fija, Bolsa, Mixto, Sin clasificar), minigráfico decorativo (`aria-hidden`) del valor liquidativo mensual real y «Mayor caída en el periodo», calculada en `journey-domain.ts` (`maxDrawdownPercent`) con la serie CNMV; sin dato se muestra «Sin dato», nunca 0. Ningún fondo aparece elegido al entrar. Sin `historical_nav` la tarjeta queda desactivada con el aviso de histórico no disponible. Al elegir se llama a `selectInstrument` y se muestran los costes del producto.

**Paso 2 · ¿Cuánto y durante cuánto?** Ejemplos rápidos (todo de golpe: 1.000 € iniciales y 0 al mes; poco a poco: 100 € iniciales y 50 €/mes), importe inicial y aportación (la frecuencia mensual/anual queda en «Más opciones») y un deslizador de meses (1 a 72 o el histórico disponible, con «hasta mar 2021» y `aria-valuetext`). Antes de ver nada se pregunta si se acabará con más, menos o más o menos lo mismo del dinero puesto. Regla (`evaluatePrediction`): «lo mismo» cuando |ganancia| ≤ 1 % de lo aportado; si no, más o menos. El resultado se calcula con el flujo existente (`/api/simulations` o cálculo local) y muestra el hecho en términos neutros, si la respuesta coincidió, tarjetas `dl` (valor final, aportado, ganancia o pérdida), una barra «tu dinero» frente a ganancia o pérdida (la pérdida con trama, no solo color), el gráfico, el asistente, «Entender las caídas», fuente y supuestos, y el logro «Has descubierto: no todo el dinero final es ganancia».

**Recálculo en vivo.** Tras el primer resultado, cualquier cambio real en los pasos 1 o 2 recalcula solo, con una pausa de 400 ms y abortando peticiones obsoletas (las generaciones de `App.tsx`). Volver a pulsar un ejemplo rápido ya activo no cambia nada y conserva el resultado. Un cambio de idioma aborta la petición en curso, así que se vuelve a pedir. Mientras se actualiza no se muestran valores antiguos. Los importes se validan al momento (incluido «ambos 0») y no se recalcula si son inválidos. «Actualizar resultado» existe pero no es necesario. El tutor solo recibe el resultado del paso 2 después de responder a la pregunta y mientras esté al día (`onRevealed` en `App.tsx`). Al responder, el foco pasa al título del resultado (paso 2) o de la comparación (paso 3). La barra de pasos sigue el foco y los clics dentro de cada paso sin anunciarlo.

**Entrada desde Explorar.** «Practicar con este fondo» abre el paso 2 con el fondo ya elegido; solo está activo para fondos con `historical_nav` (los de histórico anual o sin serie quedan desactivados, y `App.tsx` también lo comprueba).

**Paso 3 · ¿Y si vendo?** `HoldSellGame.tsx` sigue el fondo, el importe inicial, la aportación mensual y los meses del simulador (props), sin formulario duplicado; conserva comisiones opcionales (0–5 %). El mes de venta se elige con un deslizador (0..meses, `aria-valuetext` con número de mes y fecha) y, si en ese fondo existe el cierre de marzo de 2020, un reto opcional lo propone con su variación real del valor liquidativo. Antes de revelar se pregunta qué pasó al vender frente a mantener (más, menos, parecido; mismo 1 %, `evaluateSellPrediction`); después aparecen las dos tarjetas neutras, el gráfico con la marca «Venta · mes N», la tabla, fuente, periodo y supuestos, y el logro «Has descubierto: el resultado depende del momento». Llama a `POST /api/game/compare`; nada se calcula en el navegador. `game-domain.ts` no cambia: sigue validando la respuesta y la procedencia, y cualquier edición borra el resultado y aborta la petición. La comparación se lanza al responder o con «Comparar mantener y vender»; tras editar hay que volver a compararla.
- **CaixaBank:** solo queda fuera del reto (`GAME_EXCLUDED_BANK_IDS`); funciona en los pasos 1 y 2. Con CaixaBank elegido, el paso 3 explica «Este reto no usa este fondo» y ofrece un selector de fondos elegibles (elegir uno cambia también los pasos 1 y 2). Sin fondos elegibles (`VITE_BANK_ID=caixabank`) solo se avisa.
- **Aportación anual:** el reto usa aportación mensual; se muestra el aviso y un botón para volver a mensual.
- **Modo local:** el paso 3 solo muestra el aviso de que requiere el servidor; no se envía ninguna petición.
- **Límites:** el deslizador del mes de venta va sobre el formulario, no bajo el gráfico, para no perder el foco al arrastrar. Los fondos de histórico anual (no NAV mensual) ya no se eligen en el simulador. Las revisiones con lector de pantalla físico siguen pendientes.

**Comprobar:** `npm test` (`journey-domain.test.ts`, `game-domain.test.ts`), `npx playwright test tests/simulator-journey.spec.ts tests/game.spec.ts`. Las pruebas usan las funciones de `tests/journey.ts` (`pickFund`, `reveal`, `startJourney`). Capturas en `docs/planning/evidence/simulador-guiado/`.

## Ejecutar y comprobar

Con Node 22.12 o superior:

```bash
npm ci
npm run dev
npm test
npm run build
npx playwright test
```

Arranca el backend conforme a [su README](../backend/README.md). La API local de demo no utiliza autenticación; por defecto el análisis funciona por reglas y puede configurarse para usar Anthropic. Vite reenvía `/api` al puerto 8000 por defecto; `T2F_BACKEND_PORT` permite otro puerto. Playwright requiere Chrome y acepta `T2F_PYTHON` para seleccionar el Python con dependencias. `VITE_BANK_ID` admite `demo`, `caixabank`, `bbva` y `santander`; una entidad desconocida produce un error. El filtro de interfaz no sustituye autorización del servidor.

El tutor funciona por reglas, no utiliza LLM ni proveedores de voz remotos. El dictado y la lectura dependen de capacidades locales del dispositivo y conservan alternativa escrita. El gráfico ofrece tabla accesible y navegación por teclado. La comprobación con lectores de pantalla físicos sigue pendiente. El componente CountUp procede de React Bits; su licencia figura en `REACT-BITS-LICENSE.md`.
