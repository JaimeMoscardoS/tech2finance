# Rediseño del dashboard por niveles

Estado: **aprobado**; fase 1 implementada y comprobada en la rama `mejora-ui` (no integrada en `main`, sin revisión de accesibilidad todavía); fases 2 a 6 pendientes. Rama de trabajo: `mejora-ui`. Afecta sobre todo al área 1 (frontend); los datos de ejemplo tocan `shared/` y deben coordinarse.

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

## Pendiente

- Contenido del Test MiFID (se genera aparte).
- Avisar al equipo: el rediseño cambia `App.tsx`, `FundsExplorer.tsx` y estilos compartidos, y añade `shared/mock/`.
- Decidir si el nivel y el tema se recuerdan entre sesiones.
