# Rediseño del dashboard por niveles

Estado: **propuesto y aprobado**, no implementado. Rama de trabajo: `mejora-ui`. Afecta sobre todo al área 1 (frontend); los datos de ejemplo tocan `shared/` y deben coordinarse.

## Objetivo

Dashboard de inversión claro, moderno y futurista, con tarjetas y gráficas interactivas. Referencias en `design/referencias/`: Inveert para el tema claro (barra lateral azul marino, tarjetas blancas, KPIs, tabla de rentabilidades mensuales) y paneles de mercados/cripto para el oscuro (gráfica principal con etiqueta del último valor, selector de periodo segmentado, donut, listas compactas, brillo ligero). Se toma estructura y atmósfera; no se copian marcas, textos ni cifras.

## Decisiones

1. **Niveles**: Básico, Intermedio y Avanzado. «Principiante» pasa a llamarse «Básico» (en inglés «Basic») solo en el texto visible; el identificador interno sigue siendo `beginner` en código, API, tutor y contratos. Un único tipo `Level` (hoy duplicado en `App.tsx`, `FundsExplorer.tsx`, `Simulator.tsx` y `PracticeLab.tsx`).
2. **Temas**: claro y oscuro para los tres niveles (6 combinaciones) con variables CSS. `data-level` fija densidad, fondo y forma; `data-theme` el modo. El tema lo elige el usuario; no se fuerza oscuro en Avanzado.
3. **Avanzado claro** debe verse claramente más profesional: barra lateral y cabecera azul marino oscuro (`#0A2342`), fondo gris (`#E9EEF4`), mayor densidad.
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

| Nivel / tema | Fondo | Superficie | Texto | Texto secundario | Acento | Borde tarjeta | Borde input | Positivo | Negativo |
|---|---|---|---|---|---|---|---|---|---|
| Básico claro | #FFFFFF | #F6F9FC | #0F1B2D | #4A5A70 | #1F5FBF | #DCE5EF | #7A8BA3 | #17693F | #B3261E |
| Intermedio claro | #F3F6FA | #FFFFFF | #13223A | #4A5A70 | #2A6BD1 | #D3DEEB | #748AA6 | #17693F | #B3261E |
| Avanzado claro | #E9EEF4 | #FFFFFF | #0F1A2B | #46566C | #3A5BD9 | #C4D0DE | #6E819B | #146B3A | #B3261E |
| Básico oscuro | #0B1220 | #121B2D | #EAF0F8 | #A9B6C8 | #8CB8FF | #2C3A52 | #5F7392 | #6FD39A | #FF9C9C |
| Intermedio oscuro | #0E1626 | #16213A | #E6EDF8 | #A6B3C7 | #7FB0FF | #2F4062 | #647A9C | #6FD39A | #FF9C9C |
| Avanzado oscuro | #070B14 | #0F1626 | #E8EEF9 | #A3B0C4 | #7C9CFF | #26324A | #5A6E8E | #5CD694 | #FF8A8A |

Barra lateral y cabecera de Avanzado claro: fondo `#0A2342`, texto `#FFFFFF`, texto secundario `#B8C7DC`, elemento activo `#2F6FE0`.

Texto sobre botón de acento: blanco en claro; el color de fondo del tema en oscuro.

Comprobación (fórmula WCAG 2.x, 11-11-2026): texto, texto secundario, acento, positivo y negativo ≥ 4,5:1 sobre fondo y superficie en las 6 combinaciones (mínimo 4,70); texto de botón sobre acento ≥ 5,09; borde de input ≥ 3,27:1; barra azul marino: texto 15,77, secundario 9,19, activo 3,36 frente a la barra y 4,70 con texto blanco. El borde de tarjeta es decorativo (1,2–1,6:1) y no delimita controles. Positivo y negativo nunca dependen solo del color: llevan signo o flecha. Repetir la comprobación en pantalla en la fase 1.

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

## Pendiente

- Contenido del Test MiFID (se genera aparte).
- Avisar al equipo: el rediseño cambia `App.tsx`, `FundsExplorer.tsx` y estilos compartidos, y añade `shared/mock/`.
- Decidir si el nivel y el tema se recuerdan entre sesiones.
