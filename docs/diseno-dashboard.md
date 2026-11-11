# Rediseño del dashboard por niveles

Estado: **aprobado**; fase 1 commiteada y comprobada; fase 2 implementada y comprobada en la rama `mejora-ui` sin commit (no integrada en `main`, sin revisiones todavía); fases 3 a 6 pendientes. Rama de trabajo: `mejora-ui`. Afecta sobre todo al área 1 (frontend); los datos de ejemplo tocan `shared/` y deben coordinarse.

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
5. **Secciones en cada nivel**: Fondos/Inversiones, Educación y Simulación/Juego, adaptadas al nivel.
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
| Simulación / Juego | Guiado en un paso, una gráfica | Parámetros, resultado y comparación de periodos | Escenarios múltiples, tabla de resultados, costes y condiciones |
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
4. Educación (incluido Test MiFID) y Simulación / Juego por nivel. Revisores: `t2f-04-revisor-fundamentos` y `t2f-03-revisor-matematico` si toca cálculos.
5. Agente IA en el dashboard, Tutor por profundidad y pausa. Revisor: `t2f-04-tutor-reviewer`.
6. Pulido, transiciones, retirada de CSS antiguo y documentación. Revisor: `t2f-05-qa`.

Las PR grandes siguen la revisión ampliada del `CLAUDE.md` (nota mínima 8/10, máximo cuatro rondas). Cada fase comprueba `npm run build`, los tests y el resultado visual en las 6 combinaciones y a ancho de móvil.

## Estado de la fase 1 (rama `mejora-ui`, sin commit)

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

## Estado de la fase 2 (rama `mejora-ui`, sin commit)

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

## Estado de las fases 3, 4 y 5 e Inicio (rama `mejora-ui`, sin commit, sin revisiones)

**Implementado (11-11-2026)**: Inicio (`views/home`, datos `shared/mock/demo-home.ts` y `demo-facts.ts`; 1S deshabilitado porque la serie es mensual, «variación hoy» = último mes DEMO; botones «¿Qué estoy viendo?» y «¿Cómo van las cosas?» sin LLM); Fondos/Inversiones por nivel en «Mi cartera» (`views/funds`, `funds-metrics.ts`, `shared/mock/demo-trades.ts`); páginas nuevas Educación (`views/learn`, Test MiFID con 3 preguntas de ejemplo en `shared/mock/mifid-questions.ts`, formato documentado en su cabecera) y Juego (`views/game`, `game-scenarios.ts`); `AgentPanelSection` en «Mi cartera»; tutor local y preguntas sugeridas por nivel (`tutor-ia/src/level-notes.ts`); pausa antes de vender por nivel (`AntiPanicPanel` con `level?`, informativa, no bloquea).
**Contrato**: `Page` del tutor admite `learn` y `game`; el backend solo acepta 4 páginas, por lo que el cliente envía `home` al servidor en esas dos.
**Comprobado**: build, 103 pruebas unitarias, Playwright 99 superadas y 2 `fixme`; sin desborde horizontal a 320 px en Inicio, Mi cartera, Educación y Juego en los 3 niveles; capturas de las 6 combinaciones.
**Pendiente**: revisiones (`t2f-01-frontend-reviewer`, `t2f-04-revisor-fundamentos`, `t2f-03-revisor-matematico`, `t2f-04-tutor-reviewer`); contraste AA y teclado en las vistas nuevas; contenido real del Test MiFID; pruebas Playwright específicas de las vistas nuevas; los 2 tests `fixme` de `chart-colors.spec.ts` (apuntaban al gráfico y a las tarjetas antiguos); retirar CSS antiguo y `/componentes` (fase 6).

## Pendiente

- Contenido del Test MiFID (se genera aparte).
- Avisar al equipo: el rediseño cambia `App.tsx`, `FundsExplorer.tsx` y estilos compartidos, y añade `shared/mock/`.
- El nivel y el tema se recuerdan entre sesiones (decidido en la fase 2).
