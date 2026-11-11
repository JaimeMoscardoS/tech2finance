# Rediseño del dashboard por niveles

Estado: **aprobado**; fases 1 a 5 implementadas en la rama `mejora-ui` (commits fd27d9c, 018569a, 613189a y 3213a38, más cambios sin commit de las correcciones); fase 6 (arreglos de revisión, retirada de `/componentes` y CSS muerto, pruebas Playwright de las vistas) implementada sin commit. Sin integrar en `main`. Afecta sobre todo al área 1 (frontend); los datos de ejemplo tocan `shared/mock/` y deben coordinarse.

## Objetivo

Dashboard de inversión claro, moderno y futurista, con tarjetas y gráficas interactivas. Referencias en `design/referencias/`: Inveert para el tema claro (barra lateral azul marino, tarjetas blancas, KPIs, tabla de rentabilidades mensuales) y paneles de mercados/cripto para el oscuro (gráfica principal con etiqueta del último valor, selector de periodo segmentado, donut, listas compactas, brillo ligero). Se toma estructura y atmósfera; no se copian marcas, textos ni cifras.

## Decisiones

1. **Niveles**: Básico, Intermedio y Avanzado. «Principiante» pasa a llamarse «Básico» (en inglés «Basic») solo en el texto visible; el identificador interno sigue siendo `beginner` en código, API, tutor y contratos. Un único tipo `Level` (hoy duplicado en `App.tsx`, `FundsExplorer.tsx`, `Simulator.tsx` y `PracticeLab.tsx`).
2. **Temas**: claro y oscuro para los tres niveles (6 combinaciones) con variables CSS. `data-level` fija densidad, fondo y forma; `data-theme` el modo. El tema lo elige el usuario; no se fuerza oscuro en Avanzado.
3. **Avanzado claro** debe verse claramente más profesional: barra lateral y cabecera azul marino oscuro (`#071A33`), fondo gris (`#E9EEF5`), mayor densidad.
4. **Datos de ejemplo**: series y carteras ficticias realistas en `shared/mock/`, siempre con la etiqueta visible **DEMO**. Nada de paneles vacíos por falta de datos. Reglas:
   - Instrumentos, gestoras y carteras inventados: sin nombres comerciales, ISIN ni precios reales.
   - Separados de los datos reales o publicados (`annual_history`), que conservan su fuente y fecha; no se mezclan en la misma serie ni comparación.
   - Las métricas (volatilidad, drawdown, Sharpe, rentabilidades por periodo, exposición) se **calculan con código verificable y probado** a partir de las series ficticias; no se escriben a mano. El Sharpe indica el tipo libre de riesgo supuesto.
   - «Operaciones recientes» son movimientos simulados de la demo, no operaciones reales.
5. **Secciones en cada nivel**: Fondos/Inversiones, Educación y Simulador (sección única), adaptadas al nivel.
6. **Panel del agente de IA dentro del dashboard** en los tres niveles, además del Tutor: resumen en Básico, observaciones y puntos a revisar en Intermedio, análisis con escenarios y supuestos en Avanzado. Límite: contenido educativo y general sobre la cartera DEMO; no órdenes de compra o venta ni asesoramiento personalizado. Las reglas y cifras salen del código; el LLM solo explica.
7. **Test MiFID** (Educación, fase 4; contenido aparte): práctica educativa del test de conveniencia e idoneidad, con preguntas típicas, opciones, por qué se pregunta, explicación y puntuación, adaptada por nivel. En preguntas de conocimiento se muestra la respuesta correcta; en las de situación personal, horizonte o tolerancia al riesgo no hay respuesta «buena»: se explica que debe responderse con sinceridad y qué implica cada opción. Se identifica como práctica, no como evaluación real.
8. **Estilo futurista**: tarjetas con bordes suaves, degradados sutiles, brillo ligero en oscuro y transiciones con `motion` al cambiar nivel, periodo o tema, respetando `prefers-reduced-motion`.
9. **Stack**: React + Vite + TypeScript existentes. Gráficas con **Recharts** (ya instalado, 3.10.1) reutilizando `InvestmentChart`; iconos `lucide-react`; animación `motion`. No se añaden librerías de gráficas.

## Tokens de color (WCAG AA comprobado)

| Nivel / tema | Fondo | Superficie (tarjeta) | Texto | Texto secundario | Acento | Borde tarjeta | Borde input | Positivo | Negativo | Barra lateral |
|---|---|---|---|---|---|---|---|---|---|---|
| Básico claro | #F6F9FD | #FFFFFF | #0F1B2D | #4A5A70 | #2760CC | #DFE7F1 | #7A8BA3 | #17693F | #B3261E | #0F3566 |
| Intermedio claro | #F3F6FB | #FFFFFF | #13223A | #4A5A70 | #2862D0 | #D7E0EC | #748AA6 | #17693F | #B3261E | #0B2545 |
| Avanzado claro | #E9EEF5 | #FFFFFF | #0F1A2B | #46566C | #2459C4 | #C9D4E3 | #6E819B | #146B3A | #B3261E | #071A33 (también cabecera) |
| Básico oscuro | #171D30 | #212940 | #EEF2FB | #B0BBD0 | #7AA0FF | #323C58 | #6A7A9C | #3DDC84 | #FF8C8C | #10152A |
| Intermedio oscuro | #121726 | #1B2133 | #E9EEFA | #A9B4CB | #7099FF | #2B3350 | #66769A | #3DDC84 | #FF8C8C | #0C101C |
| Avanzado oscuro | #0C101D | #151B2B | #E8EDF9 | #A4B0C8 | #6C94FF | #232B42 | #5F6F92 | #3DDC84 | #FF8585 | #070A14 |

Tema claro: barra lateral azul marino en los tres niveles (Básico algo menos intensa, Avanzado la más oscura y con cabecera también oscura); texto `#FFFFFF`, secundario `#B8C7DC`, elemento activo en bloque `#2F6FE0`. Básico e Intermedio mantienen la cabecera blanca. Tema oscuro: la barra lateral es más oscura que el fondo y el elemento activo es un bloque azul tenue (26 % de acento). Brillo ligero (degradado azul y borde luminoso) en tarjetas solo en oscuro.

Color de contenido: secundario de áreas de gráfica `--chart-2` (turquesa `#0E8FA6` en claro, morado `#8B5CF6` en oscuro; el relleno es una mezcla suave con la superficie); ámbar para avisos (`--amber`, `--amber-fill`); paleta categórica `--cat-1..6` para donuts y barras: claro `#2F6FE0 #0E9AA7 #C77700 #7C4FE0 #2E9B61 #D4533F`, oscuro `#4C7DFF #3DDC84 #8B5CF6 #F5B942 #3CC4D9 #FF7A7A`. Son colores de relleno no textual: en claro todos ≥ 3,39:1 sobre blanco (≥ 3,13 sobre el fondo gris) y en oscuro ≥ 3,78:1 sobre la tarjeta; cada serie debe llevar además etiqueta o patrón, nunca solo color.

Texto sobre botón de acento: blanco en claro; `#0B1020` en oscuro.

Comprobación (fórmula WCAG 2.x, 11-11-2026, script propio sobre los valores de la tabla): texto, texto secundario, acento, positivo y negativo ≥ 4,5:1 sobre fondo y superficie en las 6 combinaciones (mínimo 5,6); acento sobre su propia tinta del 12 % ≥ 4,63; texto de botón sobre acento ≥ 5,29; borde de input ≥ 3,35:1; barra lateral: texto blanco, secundario ≥ 7,1, acento claro ≥ 6,05. Elemento activo `#2F6FE0` frente a la barra: 2,60 (Básico), 3,28 (Intermedio), 3,71 (Avanzado); en Básico queda por debajo de 3:1 como delimitación del bloque, aunque el estado activo también se indica con negrita y punto, y el texto blanco sobre el bloque da 4,70. El borde de tarjeta es decorativo y no delimita controles. Positivo y negativo nunca dependen solo del color: llevan signo o flecha. Además, recorrido en pantalla del texto visible (Inicio y Explorar, 6 combinaciones, 1366 y 390 px, 2558 nodos de texto): 0 incumplimientos de 4,5:1 (3:1 en texto grande).

## Logo

Icono «T2» como SVG autocontenido (`frontend/src/components/BrandMark.tsx`, mismo dibujo en `frontend/public/favicon.svg`): cuadrado azul `#2F6FE0` de esquinas redondeadas (rx 13/48) y letras blancas dibujadas con trazos, centradas dentro del cuadrado (márgenes laterales iguales, 8,5 y 8,3 de 48) y con el mismo grosor. Es independiente del tema: el azul de marca se ve igual sobre las tres barras claras y las tres oscuras. Su centro vertical coincide con el del bloque «BancoT2F / Tech2Finance» (medido: 49 px ambos).

## Paneles por nivel

| Sección | Básico | Intermedio | Avanzado |
|---|---|---|---|
| Fondos / Inversiones | 3 KPIs (valor, resultado € y %, riesgo), 1 gráfica con 3 periodos, tarjetas de fondo explicadas, pocos botones | KPIs, gráfica con selector completo, donut de diversificación, tabla de fondos | Barra de KPIs; gráfica principal multiserie con selector de periodo; mapa de calor de rentabilidad mensual; exposición geográfica; drawdown, Sharpe y volatilidad; donuts por activo, divisa y producto; tabla de posiciones con filtros y orden; operaciones recientes |
| Educación | Concepto del día, glosario, Test MiFID básico | Rutas cortas, riesgo y costes, Test MiFID | Asignación de activos, métricas de riesgo, costes (TER) y comparación de fondos, Test MiFID completo |
| Simulador (sección única) | Juego guiado arriba (1.000 € · 5 años · equilibrado, 50/100/200 €, KPIs, gráfica, «Explícame esta simulación»); debajo «Prueba con un producto del catálogo» (simulador de producto) | Simulador de producto primero; después «Comparar escenarios y plazos» (parámetros, KPIs con coste, gráfica, tabla de plazos) | Escenarios, plazos y costes (parámetros, KPIs con costes, gráfica, tabla de 4 escenarios, plazos, condiciones y costes); debajo producto con histórico publicado, fuentes y costes |
| Agente IA (dashboard) | Resumen | Observaciones y puntos a revisar | Análisis con escenarios y supuestos |
| Tutor | Explicación simple y preguntas sugeridas | Más contexto | Detalle técnico, supuestos y límites |

En todos los niveles: mismo producto y perfil de riesgo (solo cambian cantidad y tono), etiqueta DEMO en datos ficticios y pausa antipánico informativa que no bloquea la venta.

## Estructura propuesta

```
frontend/src/styles/              tokens.css · levels.css · dashboard.css
frontend/src/dashboard/           DashboardShell.tsx · levelConfig.ts
frontend/src/components/dashboard/ KpiCard, KpiRow, DonutCard, FundTable, PeriodSelector,
                                  SparkCard, StatusChip, MetricBar, Heatmap, DemoBadge,
                                  Section, AgentPanel
frontend/src/types/level.ts       tipo Level único
shared/mock/                      carteras y series DEMO
```

`style.css`, `level-colors.css` y `dark-theme.css` se retiran por fases.

## Fases (una PR por fase)

1. Tokens y temas (6 combinaciones), tipo `Level` único, renombrado visible a «Básico», tests ajustados. Revisor: `t2f-01-accesibilidad`.
2. Componentes base del dashboard y datos DEMO en `shared/mock/` con cálculo de métricas probado. Revisores: `t2f-01-frontend-reviewer` y `t2f-03-revisor-matematico` para las métricas.
3. Fondos / Inversiones por nivel. Revisores: `t2f-01-frontend-reviewer` y `t2f-04-revisor-fundamentos` para los textos.
4. Educación (incluido Test MiFID) y Simulador por nivel. Revisores: `t2f-04-revisor-fundamentos` y `t2f-03-revisor-matematico` si toca cálculos.
5. Agente IA en el dashboard, Tutor por profundidad y pausa. Revisor: `t2f-04-tutor-reviewer`.
6. Pulido, transiciones, retirada de CSS antiguo y documentación. Revisor: `t2f-05-qa`.

Las PR grandes siguen la revisión ampliada del `CLAUDE.md` (nota mínima 8/10, máximo cuatro rondas). Cada fase comprueba `npm run build`, los tests y el resultado visual en las 6 combinaciones y a ancho de móvil.

## Estado de la fase 1 (rama `mejora-ui`, commiteada)

**Implementado**
- `frontend/src/styles/tokens.css`: tokens de las 6 combinaciones con los valores de la tabla, aplicados con `data-level` y `data-theme` en `<html>` (contenedor raíz). Los nombres antiguos (`--ground`, `--ink`, `--muted`, `--accent`...) se conservan como alias; `--border` es el borde de controles y `--card-border` el decorativo de tarjetas; `--positive` y `--negative` son nuevos. Derivados (`--surface-tint`, `--accent-soft`, `--accent-hover`) con `color-mix`.
- Barra lateral azul marino en los tres niveles claros (cabecera también en Avanzado), activo `#2F6FE0`; se redefinen los tokens dentro de `.sidebar` y `.topbar` para que botones y menús conserven contraste.
- `frontend/src/types/level.ts`: `Level`, `Theme`, `LEVELS` y `LEVEL_LABELS` únicos; se eliminan las definiciones de `App.tsx`, `FundsExplorer.tsx`, `Simulator.tsx` y `PracticeLab.tsx` (`GoalsPanel.tsx` no definía ninguna). El paquete `tutor-ia` mantiene su propio `KnowledgeLevel` con los mismos valores.
- Texto visible «Básico» / «Basic» (id `beginner` intacto); pruebas Playwright actualizadas.
- Transición con `motion` (opacidad de la aplicación, 0,32 s) y transición CSS de fondos al cambiar nivel o tema; desactivadas con `prefers-reduced-motion`.
- `style.css`, `dark-theme.css` y `level-colors.css` ya no definen paleta (se retirarán en la fase 6).

**Comprobado (11-11-2026)**: `npm run build`, 57 pruebas unitarias y 86 pruebas Playwright superadas. Comprobación en pantalla con Chrome: inicio y Explorar en las 6 combinaciones, escritorio (1366 px) y móvil (390 px), recorriendo todo el texto visible: 0 incumplimientos de 4,5:1 (3:1 en texto grande). Se corrigieron dos hallazgos: separador «/» de la ruta de navegación y texto de acento sobre superficies tintadas en Intermedio claro (4,45:1).

**Tarjetas y barra lateral (11-11-2026)**: los accesos «Empieza por donde quieras» ya no tienen fondos pastel ni borde de color: tarjeta con `--surface`, sombra suave (`--card-shadow`, por tema), esquinas de 22 px; el color solo en el icono (tinte del 12 % de `--accent`, `--purple` y `--chart-2`; contraste icono/tinte 3,3 a 8,3:1) y en el enlace con `--accent`. Hover: elevación de 2 px, borde `--accent` y `--card-shadow-hover`; sin movimiento con `prefers-reduced-motion`. Las tarjetas generales (`style.css`) usan `--card-shadow` en lugar del borde visible (`welcome-card` conserva su borde). Elemento activo de la barra: Básico claro pasa de `--chrome-bg` `#0F3566` a `#0B2A52` y el bloque `#2F6FE0` (blanco 4,7:1) alcanza 3,05:1 contra la barra (Intermedio 3,28, Avanzado 3,71); en oscuro el activo es también `#2F6FE0` (3,85 / 4,04 / 4,21; antes 1,5 a 1,6). Prueba Playwright de los accesos ajustada (superficie común, tres colores de icono). Comprobado: build, 57 unitarias, 86 Playwright, recorrido de contraste de texto en Inicio y Explorar (6 combinaciones, escritorio y móvil): 0 incumplimientos.

**Pendiente de la fase 1**: revisión `t2f-01-accesibilidad`; comprobar otras vistas (Simulador, Mi cartera, modales, tutor, pausa) con el mismo recorrido; selector de nivel/tema recordado entre sesiones (el tema ya se guarda, el nivel no).

## Estado de la fase 2 (rama `mejora-ui`, commiteada)

**Implementado**
- Componentes en `frontend/src/components/dashboard/`: KpiRow/KpiCard (lista de descripción), SparkCard, DonutCard (rellenos con trama sobre `--cat-1..6` y leyenda con porcentajes), FundTable (orden accesible con `aria-sort`, riesgo 1-7 con `role=meter` y valor visible, estados de carga/error/vacío), EvolutionChart (área degradada, línea discontinua de comparación, tooltip, último valor visible, tabla de datos), PeriodSelector, StatusChip/DeltaChip (icono y signo), MetricBar, DemoBadge, Section y AgentPanel (texto de ejemplo DEMO por nivel, sin LLM). Heatmap queda para la fase 3. Español e inglés.
- `shared/mock/demo-portfolio.ts`: 5 fondos y un índice de referencia ficticios (nombres «… Ejemplo», sin ISIN ni precios reales), 36 rentabilidades mensuales fijadas como literales (generadas una vez con semilla), unidades y coste de compra (= unidades × precio del mes 0 en todos los fondos, 25.900 € en total, para que coste y serie compartan base) y una exposición ficticia a renta variable por fondo (`equityWeight`: monetario 0, bonos 0, mixto 0,4, global 1, emergentes 1). Rentabilidades DEMO netas de gastos y sin tipo de cambio (nota visible en `/componentes`, ES/EN). Etiquetas de mes relativas (M0…M36), sin fechas inferidas. No se mezcla con `annual_history`.
- Métricas en código (`frontend/src/dashboard-metrics.ts`, `dashboard-portfolio.ts`): serie acumulada, variación por periodo, resultado € y %, pesos y agrupaciones, riesgo medio ponderado, volatilidad anualizada, máxima caída, Sharpe (tipo libre de riesgo supuesto 2 %), escenario de sensibilidad ilustrativo. Devuelven `null` cuando no están definidas o el resultado no sería finito (NaN/Infinity); `profitAndLoss`, `weights` y el escenario lanzan `RangeError` ante entradas inválidas. Volatilidad y Sharpe exigen al menos 12 rentabilidades mensuales (`MIN_MONTHLY_OBSERVATIONS`, parametrizable con `minObservations`; la UI muestra «n. d.») y Sharpe es `null` con volatilidad < 1e-9. Escenario: shock × Σ(valor × `equityWeight`) / total, con shock finito y > −100 (supuesto: toda la renta variable se mueve igual; sin divisa ni costes). Una cartera vacía devuelve métricas `null` sin error.
- Nivel guardado en `localStorage` (`t2f-level`, `src/preferences.ts`) con validación y fallback a Básico.
- Página temporal `/componentes` (nivel, tema, idioma; `?level=&theme=&lang=`), sin enlace en la navegación real; retirar en la fase 6.

**Comprobado (11-11-2026)**: `npm run build`; 72 pruebas unitarias (15 nuevas, con valores calculados a mano: métricas, cartera DEMO, hechos del agente y persistencia); 101 pruebas Playwright (15 nuevas en `tests/components.spec.ts`: 6 combinaciones nivel/tema con contraste AA del texto visible y sin desborde horizontal a 1280 y 390 px, inglés, periodo y tooltip, orden de tabla, donut, AgentPanel por nivel, movimiento reducido, persistencia del nivel). Capturas de las 6 combinaciones a 1280 y 390 px.

**Corrección tras la revisión matemática (nota 8/10)**: coste igualado a unidades × precio M0 en todos los fondos (mixto 6.500 en lugar de 6.800, global 5.600 en lugar de 7.000, emergentes 2.800 en lugar de 3.400); Sharpe `null` con volatilidad casi nula; sin NaN/Infinity; cartera vacía; mínimo de 12 meses; escenario con la parte de renta variable del mixto; pruebas con cartera mínima [200, 210, 199] (P&L −1 €, −0,5 %; volatilidad ≈ 25,08 %; Sharpe ≈ −0,1367), máxima caída −40 y Sharpe 2,0412414.

**Pendientes de revisión matemática** (no implementados):
- `returnsFromSeries` inventa 0 si el valor previo es ≤ 0.
- Series de distinta longitud: `valueSeries.at(-1)` puede no coincidir con `totalValue`.
- Sharpe con anualización aritmética (rf/12) sin documentar en la UI.
- Mínimo de muestra más allá de los 12 meses (significación estadística).
- Divisa: fondos USD sin tipo de cambio y TER sin uso (la nota visible lo cubre solo parcialmente).
- Redondeo de pesos mostrados (método del mayor resto).
- Stress sin modelado de divisa.

**Pendiente de la fase 2**: revisiones `t2f-01-frontend-reviewer` y `t2f-03-revisor-matematico` (métricas); comprobar navegación por teclado y lector de pantalla con herramienta real; el contraste medido usa el color de fondo base (el degradado del tema oscuro en tarjetas añade como máximo un 7 % de acento); Heatmap; los componentes no se usan aún en el dashboard real (fase 3); la página `/componentes` está incluida también en la compilación de producción.

## Estado de las fases 3, 4 y 5 e Inicio (rama `mejora-ui`, commits 613189a y 3213a38)

**Implementado (11-11-2026)**: Inicio (`views/home`, datos `shared/mock/demo-home.ts` y `demo-facts.ts`; 1S deshabilitado porque la serie es mensual, «variación hoy» = último mes DEMO; botones «¿Qué estoy viendo?» y «¿Cómo van las cosas?» sin LLM); Fondos/Inversiones por nivel en «Mi cartera» (`views/funds`, `funds-metrics.ts`, `shared/mock/demo-trades.ts`); páginas nuevas Educación (`views/learn`, Test MiFID con 27 preguntas de ejemplo en `shared/mock/mifid-questions.ts`, formato documentado en su cabecera) y Juego (`views/game`, `game-scenarios.ts`); `AgentPanelSection` en «Mi cartera»; tutor local y preguntas sugeridas por nivel (`tutor-ia/src/level-notes.ts`); pausa antes de vender por nivel (`AntiPanicPanel` con `level?`, informativa, no bloquea).
**Contrato**: `Page` del tutor admite `learn` y `game`; el backend solo acepta 4 páginas, por lo que el cliente envía `home` al servidor en esas dos.
**Comprobado**: build, 103 pruebas unitarias, Playwright 99 superadas y 2 `fixme`; sin desborde horizontal a 320 px en Inicio, Mi cartera, Educación y Juego en los 3 niveles; capturas de las 6 combinaciones.
**Pendiente**: revisiones (`t2f-01-frontend-reviewer`, `t2f-04-revisor-fundamentos`, `t2f-03-revisor-matematico`, `t2f-04-tutor-reviewer`); contraste AA y teclado en las vistas nuevas; contenido real del Test MiFID; pruebas Playwright específicas de las vistas nuevas; los 2 tests `fixme` de `chart-colors.spec.ts` (apuntaban al gráfico y a las tarjetas antiguos); retirar CSS antiguo y `/componentes` (fase 6).

## Pendiente

- Contenido del Test MiFID (se genera aparte).
- Avisar al equipo: el rediseño cambia `App.tsx`, `FundsExplorer.tsx` y estilos compartidos, y añade `shared/mock/`.
- El nivel y el tema se recuerdan entre sesiones (decidido en la fase 2).

**Correcciones de revisión (11-11-2026, sin commit)**:
- La pausa de «Vender / Reducir» y «Entender una caída» analiza la cartera DEMO mostrada (`buildDemoPortfolio().valueSeries`, M0..M36), siempre en local, también en modo servidor. Limitación: el backend solo conoce su propia serie `portfolio_demo` (1000 a 1093) y no admite series del cliente; por eso en esa pausa no se envía `decline` al tutor del servidor (solo `decision`) y el contexto de cartera del tutor del servidor sigue siendo el del backend. Pendiente de coordinar con el área 2.
- La pausa ofrece «Continuar con la venta (simulada, sin operación real)» con el mismo peso que «Continuar en la demo».
- Las operaciones DEMO son movimientos ilustrativos que no alteran la cartera mostrada (nota visible y prueba de unidades vendidas ≤ unidades en cartera). El Test MiFID muestra el aviso de contenido pendiente de verificación (CNMV, FGD).
- «Juego» se muestra como «Simulación»; sus textos (Inicio y tutor) la describen como simulación ilustrativa con rentabilidades ficticias DEMO, no como datos históricos.
- El informe congelado `tutor-ia/evals/report.v1.json` se regeneró (cambió el hash del código fuente del tutor; 116 casos, 0 fallos).


## Estado de la fase 6 (arreglos de revisión; rama `mejora-ui`, sin commit)

**Implementado (11-11-2026)**, a raíz del informe `t2f-01-accesibilidad` (6/10):
- Hover de `.edu-btn--ghost` con contraste AA en los 6 temas (fondo 20 % de acento sobre superficie y texto `--ink`; medido en prueba).
- Test MiFID: el foco pasa a la leyenda de la nueva pregunta y al encabezado del resultado (acción del usuario, sin depender del montaje); sin `role=status` en el resultado.
- Recharts: `accessibilityLayer` desactivado (donut con `rootTabIndex=-1`); el gráfico es `role=img` con nombre y la alternativa es la tabla de datos; sin paradas de tabulación sin nombre.
- Inicio: panel del asistente sin `aria-live`; foco al encabezado al abrir y de vuelta al botón al cerrar.
- Simulador (escenarios): un único mensaje de error con `id`, `aria-describedby` en campos con `aria-invalid`, sin doble `role=alert`; escenario del gráfico marcado con «(en el gráfico)» y `aria-current`.
- Gráfica multiserie (Avanzado): fondos con colores sin `--chart-2`, `--cat-1..3` y guiones propios; ninguno con el trazo continuo de la cartera.
- `minmax(min(100%, …))` en las rejillas; sin desborde a 320 px en Inicio, Mi cartera, Educación y Simulador en los 3 niveles (prueba Playwright).
- Un `h1` por vista (oculto visualmente en Inicio y Mi cartera) sin saltos de encabezado (`EvolutionChart`, `DonutCard` y el formulario admiten nivel de encabezado).
- Bajos: intensidad máxima del mapa de calor 40 %, `min-height` 24 px en botones de orden y `summary`, sin hover en botones deshabilitados.
- Retirados `/componentes` (página, CSS y `tests/components.spec.ts`; lo útil migró a `tests/dashboard-views.spec.ts`) y las reglas de `style.css` y `level-colors.css` cuyas clases ya no usa ningún código.
- Los dos `test.fixme` de `chart-colors.spec.ts` se sustituyeron por pruebas válidas contra la interfaz actual.

**Pendientes (hallazgos BAJOS no corregidos)**:
- Tutor: `p-formacion` mezcla el nivel de la aplicación con productos (`shared/mock/mifid-questions.ts`, ~línea 812).
- `AgentPanel` solo aparece en Mi cartera (confirmar con el equipo si debe estar en otras vistas).
- Tipo `Level` duplicado en `AntiPanicPanel` (`DetailLevel`) y en `mifid-questions` (`MifidLevel`).
- Textos de `SimulationDashboard` duplicados de `SCENARIOS`; «36 rentabilidades» fijo en `AgentPanel`.
- `MetricBar` lee etiqueta y valor repetidos; `<dl aria-label>`; la explicación DEMO solo está en `title`; `aria-valuenow` > 100 en Inicio.
- `PeriodSelector` usa `aria-pressed` en lugar de `radiogroup`; el término del concepto del día no se anuncia al cambiar.
- Precio USD mostrado en € sin tipo de cambio (nota); fondos y gestoras solo en español.
- Hechos con fechas de 2026 frente a series relativas (M0…M36).
- No probado con lector de pantalla ni con teclado real (solo comprobaciones automáticas).
- **Servidor / `learn`**: el backend acepta `learn` y `game` y el cliente envía la página sin convertirla (rama `backend-learn-game`).

## Fusión «Simulador» y «Simulación» (11-11-2026, rama `mejora-ui`, sin commit)

**Implementado y comprobado**: las páginas `"simulator"` y `"game"` eran duplicadas y se fusionaron en una sola sección **Simulador** (`page === "simulator"`); `"game"` se eliminó de `Page`, de la navegación, de `HomeDashboard` (la tarjeta duplicada se retiró y la del Simulador menciona los escenarios ilustrativos DEMO) y del tutor del cliente.
- `views/simulator/SimulatorPage.tsx` compone el orden por nivel; `views/simulator/ScenarioLab.tsx` (antes `views/game/SimulationDashboard.tsx`, cálculos intactos en `game-scenarios.ts`) son los bloques de escenarios DEMO; `Simulator.tsx` (producto del catálogo) se conserva y recibe `embedded` para bajar su título a h3 cuando va bajo un h2. Un único `h1` por página.
- **Básico**: encabezado «Simulador» con etiqueta ILUSTRATIVO, «Abrir práctica guiada», juego guiado con «Explícame esta simulación», y debajo «Prueba con un producto del catálogo». **Intermedio**: simulador de producto y después «Comparar escenarios y plazos». **Avanzado**: escenarios, plazos y costes (tabla de 4 escenarios, plazos, condiciones y costes) y debajo el producto con histórico publicado, fuentes y costes. «Abrir práctica guiada» (PracticeLab) está en los tres niveles.
- Los escenarios ilustrativos (DEMO, supuestos ficticios) están en secciones y etiquetas separadas de los datos publicados y calculados del catálogo. Los hijos llevan `key` para que, al cambiar de nivel, el estado del simulador de producto no se pierda.
- Decisiones de texto: los campos del laboratorio se llaman «Capital inicial», «Ahorro mensual» y el grupo «Ahorro al mes» para no chocar con las etiquetas del simulador de producto («Importe inicial», «Aportación mensual»); el botón guiado dice «Explícame esta simulación» para distinguirlo de «Explícame este resultado» del producto.
- **Limitación**: «Explícame esta simulación» abre el asistente con el contexto del simulador de producto; el tutor no recibe los parámetros del escenario DEMO. La limitación de servidor ahora solo afecta a `learn` (el cliente envía `home`).
- **Comprobado**: `tsc -b` y build correctos, 106 pruebas unitarias, Playwright completo 98 superadas, 0 fallidas. Pruebas nuevas por nivel en `tests/dashboard-views.spec.ts`; `chart-colors.spec.ts` ahora espera 4 tarjetas de destino en Inicio.
- **Pendiente**: el tipo `Page` de `tutor-ia/src/types.ts` aún puede contener `'game'` (lo cambia otro agente); revisión del área (accesibilidad y fundamentos); no revisado visualmente en móvil ni con lector de pantalla tras la fusión (solo prueba de 320 px sin desborde).

## Integración con `main` (11-11-2026, fusionada en `mejora-ui`; pendiente del pull request a `main`)

Se fusiona `origin/main` en la rama sin descartar el diseño por nivel. Detalle técnico en [frontend/README.md](../frontend/README.md#integración-con-main-selector-de-nivel-simulador-único-y-pausa); aquí solo las decisiones y su estado.

- **Una sola cartera** para Inicio, «Mi cartera», el panel del agente, la pausa y el tutor: `App.tsx` la construye una vez con `buildRealPortfolio` (`frontend/src/portfolio-real.ts`) a partir de los valores liquidativos de la CNMV (`navHistory`) y la pasa a `HomeDashboard`, `FundsDashboard` y `AgentPanelSection`, así que las cifras coinciden en todas las vistas.
  - **Real**: nombre, ISIN, divisa, NAV mensuales, fechas y fuente (CNMV); gestora tomada del catálogo.
  - **Calculado por código probado** desde esos NAV: valor, rentabilidades, volatilidad, caída máxima, Sharpe (tipo libre de riesgo supuesto del 2 %, declarado), mapa mensual y la referencia (media simple de los fondos; no es un índice).
  - **DEMO** (ficticio y etiquetado): solo las participaciones (5.000 € por fondo comprados al inicio de la serie) y, en Inicio, el efectivo y el objetivo.
  - **Sin dato** («No disponible», nunca deducido ni inventado): clase de activo, nivel de riesgo, exposición a renta variable, TER y región, que el catálogo publica como `null`. Los agregados que dependen de ellos (riesgo medio, exposición a renta variable, reparto por clase, escenarios de sensibilidad) muestran «Sin dato».
  - Sin datos suficientes (menos de 13 NAV comunes consecutivos o ningún fondo elegible en EUR) se usa la cartera DEMO completa con su etiqueta. Educación sigue con los fondos DEMO ficticios (ejemplos de costes).
  - Inicio, con datos reales, sustituye los hechos DEMO ficticios por hechos públicos verificados del periodo (`navHistory.events`, con fuente enlazada), presentados como contexto y no como causa.
- **Pausa de cartera** (Inicio y «Mi cartera»): analiza exactamente la serie mostrada. Con servidor pide `basis: "portfolio_cnmv"`: el backend (`cnmv_portfolio_series` en `backend/domain/__init__.py`) reconstruye la misma serie con los mismos fondos, fechas e importes DEMO, de modo que la pausa ofrece el **análisis detallado de caídas** de `main` y el tutor del servidor recibe la caída mostrada. Sin servidor, análisis local de la misma serie (sin análisis detallado). «Probar una caída» sigue usando la serie de estudio `portfolio_demo`. Ni bloquea ni presiona la venta.
- **Selector de nivel**: `LevelSelector` de `main` con los tokens del dashboard en la cabecera; etiquetas visibles Básico/Intermedio/Avanzado (identificador interno `beginner`).
- **Simulador único con el recorrido de `main`** (PR #32): debajo del h1 «Simulador», el producto del catálogo es el recorrido guiado de 3 pasos (`Simulator.tsx` con `embedded`: 1 elegir fondo, 2 predicción y resultado, 3 «¿Y si vendo?» con el fondo e importes elegidos; la guía se adapta al nivel). Por nivel se mantienen los escenarios ilustrativos DEMO (Básico guiado arriba; Intermedio, comparación de escenarios y plazos debajo; Avanzado, escenarios, plazos y costes arriba) y la práctica guiada. Ya no hay pestañas. Sin servidor, «¿Y si vendo?» muestra su aviso. No empuja a mantener ni a vender.
- **Nombres genéricos** (PR #33): los fondos reales se muestran con su alias (`shared/fund-aliases.json`) también en Inicio, «Mi cartera», la pausa y el tutor; el nombre oficial queda en el detalle del catálogo.
- **Contexto del BCE** (PR #31): las noticias de mercado del archivo del BCE acompañan a la serie de estudio `portfolio_demo` («ejemplo histórico»), que se abre con «Probar una caída»; su estado se muestra junto a ese acceso en Inicio. La cartera mostrada (`portfolio_cnmv`) no está en caída actual, así que no activa esa búsqueda.
- **Pausa** (`AntiPanicPanel`): lógica de `main` (calm y análisis detallado) con profundidad por nivel; no bloquea ni presiona.
- **Pruebas**: specs Playwright adaptados a esta UI (ver el resultado final en el informe del cambio y en el README del frontend); los de `main` que esperaban la cartera/inicio antiguos (`large-portfolio`, tarjetas de acción) se adaptaron a la funcionalidad equivalente.
- **Pendiente**: revisión visual en móvil y con lector de pantalla.
- **Cambios de comportamiento hechos al probar** (mínimos): el botón superior del asistente se llama «Tu asistente» (antes repetía «Abrir asistente» de la barra lateral y chocaba por nombre accesible); el contenido de «¿Y si vendo?» solo se monta con su pestaña activa (evita etiquetas de formulario duplicadas y ocultas con las del simulador de producto); al cerrar la pausa, si el disparador ya no existe (p. ej. «Probar una caída» cambia de página), el foco pasa al contenido principal en lugar de perderse.
- **Cifras de pruebas** (calculadas por la app y contrastadas con un cálculo independiente sobre `shared/nav-history.json`; las mismas en `frontend/src/portfolio-real.test.ts` y `backend/tests/test_nav_history.py`): cartera con NAV CNMV 2019-12-31 a 2025-12-31 (73 observaciones, 72 meses), 5 fondos × 5.000 € DEMO: coste 25.000 €, valor 28.175,75 € (28.176 €), caída máxima 8,79 % (pico 2019-12, mínimo 2020-03; recuperación 2021-07). Las cifras 744,62 / 25,54 % de `main` son las de la simulación de ejemplo y la serie `portfolio_demo` («Probar una caída»).


## Mejoras para el jurado (rama `mejoras-jurado`, 11-11-2026)

**Implementado**
- **Una sola cartera**: App construye `shownPortfolio` (valores liquidativos CNMV; DEMO solo como respaldo sin datos) y la pasan Inicio, «Mi cartera», Educación (asignación, métricas y tabla TER) y el asistente. Mismas cifras en todas las vistas.
- **Perfiles DEMO** (`shared/mock/demo-fund-profiles.ts`, por `instrumentId`): clase, región, riesgo 1-7, TER y exposición a renta variable supuestos según el tipo de fondo, inyectados por `buildRealPortfolio(nav, info)` (`info[isin].profile`). Exposición geográfica, divisa, mapa de calor y operaciones (la compra única DEMO al inicio de la serie) ya no salen vacíos.
- **Objetivo DEMO**: `monthsTotal: 120`; los meses transcurridos se calculan con la serie (72 con CNMV 2019-12 – 2025-12).
- **Inicio**: resumen de cartera y, al lado (≥ 1180 px; debajo en móvil), el asistente con botones grandes «¿Qué estoy viendo?» y «¿Cómo van las cosas?», más «Probar una caída» y «¿Te preocupa la caída?». Se eliminan la lista de accesos (duplicaba la barra lateral) y los enlaces sueltos; «Conoce BancoT2F» es un `<details>` al final.
- **Simulador**: primero «Recorrido en 3 pasos con fondos reales» (con título), después los escenarios ilustrativos DEMO y el acceso a la práctica.
- **Menos ruido**: un `<details class="dash-origin">` «Origen de los datos» en Inicio y Mi cartera; una etiqueta DEMO por sección (no por KPI ni gráfica); KPI «Último mes» sin chip que repetía el valor; «Conexión · Servidor de demo» solo en desarrollo (`import.meta.env.DEV`).
- **Lenguaje**: `monthLabel` («mar 2020»), `axisEur` («26,5 mil €» en una línea), «sin dato» en lugar de «n. d.»/«No disponible», meses Ene…Dic en el mapa de calor con año real, sin «NAV» en textos visibles de las vistas tocadas.
- **Explorar**: `NavLineChart` (línea base 100 con 1A/3A/Máx) sustituye a las 72 barras; la tabla sigue en «Ver cifras».
- **Básico**: una frase por bloque en el asistente de Inicio y en las tarjetas de fondo.
- **Cabecera**: «Nivel: Básico».
- **IA real**: `POST /api/insights` (backend `insights.py`, pruebas `backend/tests/test_insights.py`); cliente `frontend/src/insights.ts` (`insightFacts`, `useInsight` con caché y respaldo). Se retira «Esta fase no usa IA real».
- **Bienvenida** (`views/onboarding/WelcomeDialog.tsx`): 3 opciones que fijan el nivel, línea explicativa y «Saltar»; `localStorage` `t2f-welcome-done`. No aparece en navegadores automatizados salvo `?welcome=1`.
- **Modo presentación** (`PresentationTour.tsx`): botón «Presentar» en la cabecera o `?demo=1`; 5 pasos (resumen → asistente → «Probar una caída» → Simulador «¿Y si vendo?» (o el recorrido si el paso 3 aún no está desbloqueado) → Test MiFID), con foco resaltado, Siguiente/Anterior, flechas y Esc.
- **Visual**: progresión clara en tema claro (fondo `#F6F9FD` → `#EDF1F7` → `#E1E7EF`; cabecera blanca → azulada con filo marino → marino); KPIs de igual altura; más aire; botones táctiles ≥ 44 px en las piezas nuevas.

**Decisiones**: los perfiles DEMO de fondos reales se marcan DEMO y se explican en «Origen de los datos» (no son datos del folleto); el modelo no escribe cifras (las muestra el código al lado); la bienvenida no se fuerza en pruebas automatizadas.

**Contraste** (fórmula WCAG, 11-11-2026): texto, secundario, acento, positivo y negativo ≥ 4,63:1 sobre `#EDF1F7`, `#E3EAF5` y `#E1E7EF`.

**Pendiente**: prueba con modelo real (solo proveedor simulado en pruebas); revisión ampliada del PR.

**Integración con `main` (11-11-2026)**: fusionados el tutor con Claude (#36) y la voz bilingüe ElevenLabs (#37). `/api/insights` sigue usando el proveedor del análisis de caídas (`T2F_ANALYSIS_PROVIDER`), no el del tutor (`T2F_TUTOR_PROVIDER`). Corrección en `AssistantPanel`: la última respuesta se asocia al contexto sin textos traducidos, para que siga pudiendo escucharse tras cambiar el idioma (dos pruebas de `main` fallaban también en `main`). Pruebas nuevas en `frontend/tests/onboarding.spec.ts`: la bienvenida (aparece, fija el nivel, «Saltar» y Esc) y el modo presentación (`?demo=1`, siguiente/anterior, flechas, Esc y botón «Presentar»). Comprobado: build, 159 unitarias, 278 de backend y Playwright completo con 216 superadas y 1 fallo intermitente de tiempos en `real-history.spec.ts:29`, que pasa al repetirlo aislado.
