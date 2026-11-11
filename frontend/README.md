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

## Sección «¿Y si vendo en el mes X?»

Implementada en la rama `feature/juego-pantalla` (no en `main`). `HoldSellGame.tsx` se carga de forma diferida y se muestra bajo «02 / Evolución histórica» del Simulador; es una comparación simple, no el juego por turnos.

- **Entradas:** fondo, importe inicial, aportación mensual, meses (máximo según el histórico del fondo, hasta 72), mes de venta (0..meses) y comisiones opcionales de compra y venta (0–5 %). Los valores del simulador solo inician el estado; después son independientes.
- **Salida:** llama a `POST /api/game/compare` y muestra dos tarjetas neutras («Si mantengo» y «Si vendo en el mes N») con dinero final, aportado, comisiones y ganancia o pérdida (con signo), un gráfico de dos líneas distinguibles por color y trazo con marca «Venta · mes N», una tabla alternativa, fuente, periodo y supuestos localizados. No señala un mejor resultado ni recomienda; incluye el aviso sobre liquidez, horizonte y objetivo.
- **Periodo:** el ejercicio siempre empieza en el primer cierre observado (31 dic 2019) y cubre hasta 72 meses; elegir otro mes de inicio queda pendiente. La fuente muestra también el enlace a las condiciones de reutilización de la CNMV.
- **Validación:** `game-domain.ts` construye la petición y valida la respuesta (esquema, coincidencia con la petición, procedencia frente a `shared/data-manifest.json`, fechas, totales y unidades). Los importes llegan como cadenas decimales y solo se convierten a número para mostrarlos. Cualquier edición borra el resultado y aborta la petición en curso.
- **Modo local:** con datos locales (`t2f-data-mode=local`) solo se muestra un aviso: no se calcula nada en el navegador ni se envían peticiones.
- **CaixaBank:** el selector del juego excluye CaixaBank (`GAME_EXCLUDED_BANK_IDS` en `game-domain.ts`); no se ha retirado del resto de la aplicación. Si no queda ningún fondo elegible (por ejemplo `VITE_BANK_ID=caixabank`), se muestra un mensaje en lugar del formulario.
- **Comprobar:** `npm test` (`game-domain.test.ts`, con una respuesta real en `tests/fixtures/game-compare-santander-rf-ahorro.json`) y `npx playwright test tests/game.spec.ts`.

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

## Tutor local, voz y pausa

El inicio organiza el recorrido en fondos, práctica guiada y cartera ficticia, con un color distinto para cada acceso en ambos temas. En Explorar, la entidad de demo filtra los fondos del catálogo; el selector de detalle ofrece conceptos básicos, comparación de datos disponibles o identidad, fuentes y rentabilidades anuales publicadas cuando existen. El fondo seleccionado se mantiene al cambiar de nivel y sirve de contexto para el asistente por reglas, también por voz si el dispositivo lo permite. Riesgo y costes se muestran como no disponibles si el catálogo no los contiene. El selector **Detalle** cambia la profundidad de la explicación, no el riesgo. **Conexión** permite cambiar entre servidor de demo y demo local; los errores y el reintento aparecen sin abrirlo. Abre el chat desde la navegación o el botón de la barra superior. El micrófono de la barra abre el asistente de voz y solicita inmediatamente el reconocimiento local; la escucha empieza solo si el navegador confirma disponibilidad y concede permiso. Desde la pausa se abre el panel sin iniciar la escucha hasta pulsar Hablar. Una consulta posterior también requiere pulsar Hablar. En el panel de voz, el dictado final se envía al terminar el reconocimiento; tras la respuesta no se vuelve a activar el micrófono automáticamente. En el chat, el dictado se mantiene editable y requiere envío manual. Responde por reglas con el contexto de la pantalla y conserva el texto de cada respuesta. Tras recibir una respuesta, **Escuchar** intenta utilizar una voz local del dispositivo. **Dictar** solo inicia reconocimiento cuando el navegador confirma procesamiento local y un modelo ya instalado; el texto reconocido se puede revisar antes de enviarlo. Si no hay una voz, capacidad o permiso disponibles, se puede seguir escribiendo. La aplicación no instala modelos ni envía audio a proveedores.

En la cartera ficticia, **Entender una caída** analiza los puntos de ejemplo; en un resultado válido del simulador, **Entender las caídas** analiza la evolución del instrumento sin las aportaciones. Se muestran los episodios observados y sus límites, sin atribuir causas verificadas; el guion ficticio identificado se limita al escenario de seis meses de T2F Equilibrio. El objetivo, horizonte y necesidad de liquidez son opcionales y no constituyen una evaluación de idoneidad. La persona puede cerrar y continuar en la demo en cualquier momento.

## Práctica guiada

Desde la tarjeta de práctica de inicio o el enlace del simulador se pueden comparar dos ejemplos: cambiar las aportaciones de un mismo instrumento, comparar plazos de una serie ficticia sin aportaciones o comparar dos activos ficticios con condiciones iguales. Los importes, periodos e instrumentos son editables. El ejemplo histórico anual mantiene cinco años y las aportaciones se suman al cierre; los fondos sin histórico no están disponibles. Las comparaciones muestran capital, aportaciones, ganancia o pérdida, procedencia y límites, sin predecir resultados ni demostrar diversificación.

Cada pareja se calcula en el modo seleccionado. Al editar una entrada, cambiar de lección o de modo se descartan los resultados anteriores; si falla el servidor se muestra el error y no se calcula silenciosamente en local. Se puede seleccionar A o B para preguntar al tutor sobre ese ejemplo. La prueba conceptual es opcional y no puntúa por obtener ganancias. El laboratorio no compra ni vende activos y no utiliza dinero real.

El modo local funciona sin backend; el modo servidor usa las mismas reglas del tutor mediante un proceso Node local. Ninguno es un LLM ni conecta Claude, ElevenLabs o un banco. Los contratos para futuras integraciones están en [contratos](../docs/contratos.md#conversación-y-voz-propuesta); cualquier clave futura debe permanecer en el servidor, fuera del navegador y de Git.

## Componentes y fuentes

Para cambios de interfaz, aplica la [skill frontend-design del proyecto](../.agents/skills/frontend-design/SKILL.md), que incluye criterios para presentar información financiera.

Las condiciones de producto en Explorar y el simulador organizan etiquetas e importes en una lista, destacan los gastos anuales y mantienen visible el aviso de que las comisiones ficticias no se descuentan. Un gasto anual desconocido aparece como «No definidos» y los productos externos muestran su propio aviso. Se usan los mismos datos en español e inglés, en móvil y escritorio y con ambos temas.

La presentación de BancoT2F en Inicio separa el mantenimiento ficticio mensual, los límites de la demo y sus servicios; el aviso completo sobre comisiones permanece visible y las preguntas frecuentes se pueden desplegar.

`src/CountUp.tsx` procede de [React Bits](https://github.com/DavidHDev/react-bits), componente CountUp. Su licencia se conserva en `REACT-BITS-LICENSE.md`. La animación respeta la preferencia de movimiento reducido definida por el navegador cuando la gestiona el componente; la interfaz también incluye reglas de movimiento reducido.

Cada nivel tiene una paleta distinta en temas claro y oscuro (tokens en `src/styles/tokens.css`, aplicados con `data-level` y `data-theme` en `<html>`; el tipo `Level` único está en `src/types/level.ts` y «Principiante» se muestra como «Básico», con id interno `beginner`); el nivel no indica riesgo. El gráfico usa Recharts 3 y ofrece vistas de capital y variación del instrumento, navegación interactiva y una tabla alternativa. Los segmentos verdes, rojos y grises indican si la serie mostrada sube, baja o no cambia respecto al punto anterior; el capital incluye aportaciones y no representa por sí solo el rendimiento del mercado. En las barras anuales el color indica el signo de la rentabilidad de ese año. Las etiquetas y la tabla también expresan los cambios sin depender del color. Las cifras de la cartera de ejemplo son ficticias y no dependen del resultado del simulador.

Consulta las [instrucciones del área](AGENTS.md), el [contexto](../docs/contexto-proyecto.md) y los [contratos](../docs/contratos.md).

## Componentes del dashboard y datos DEMO (fase 2, rama `mejora-ui`)

- Componentes base en `src/components/dashboard/` (importables desde `index.ts`): `KpiRow`/`KpiCard`, `SparkCard`, `DonutCard`, `FundTable`, `EvolutionChart`, `PeriodSelector`, `StatusChip`/`DeltaChip`, `MetricBar`, `DemoBadge`, `Section` y `AgentPanel`. Solo usan tokens (`--cat-1..6`, `--chart-*`, `--amber*`); los gráficos llevan tramas, valores en texto o tabla de datos, y subida/bajada con signo e icono además del color; respetan `prefers-reduced-motion`. `AgentPanel` es educativo y sin LLM real: texto de ejemplo marcado DEMO, sin órdenes ni asesoramiento.
- Datos ficticios en `../shared/mock/demo-portfolio.ts` (solo entradas); las métricas (variación, pesos, volatilidad, drawdown, Sharpe, escenarios) se calculan en `src/dashboard-metrics.ts` y `src/dashboard-portfolio.ts`, con pruebas en `src/dashboard-metrics.test.ts`.
- La página temporal `/componentes` y su galería se retiraron en la fase 6; los componentes se ven en las vistas reales (Inicio, Mi cartera, Educación, Simulador en `src/views/`; el Simulador fusiona `views/simulator/SimulatorPage.tsx`, `ScenarioLab.tsx` y `Simulator.tsx`).
- El nivel elegido se guarda en `localStorage` (`t2f-level`, validado con `src/preferences.ts`; valor inválido o almacenamiento bloqueado vuelve a Básico).
- Pruebas: `tests/dashboard-views.spec.ts` (Inicio, Test MiFID con foco, Simulador por nivel con errores asociados, pausa de venta, contraste del hover, 320 px y contraste AA en las 6 combinaciones; ayudas en `tests/helpers/`) y `tests/chart-colors.spec.ts`.

## Contrato de servidor

`GET /api/catalog` carga bancos, instrumentos y muestra anual; `POST /api/simulations`, `/api/declines` y `/api/tutor` devuelven respectivamente resultados, informes y respuestas basadas en reglas. El cliente envía parámetros, no resultados financieros ni fuentes al tutor, y el servidor reconstruye el contexto. Las peticiones se cancelan al cambiar contexto y tienen un plazo de diez segundos. `shared/demo-data.json` es la fuente común de ejemplos. Las pruebas Playwright arrancan backend y Vite, requieren `.venv` con dependencias instaladas y aceptan `T2F_PYTHON` para seleccionar el intérprete.

Si el catálogo tarda o falla, la pantalla de recuperación mantiene idioma y tema disponibles y permite elegir expresamente la demo local; un fallo no cambia de modo automáticamente. En error se puede reintentar la carga. Al llegar el catálogo se traslada el foco al contenido principal si estaba en la pantalla de recuperación. Las solicitudes anteriores se cancelan al cambiar de modo y el reintento de operación se descarta cuando cambian sus entradas o contexto. `npx playwright test tests/recovery.spec.ts` comprueba estos recorridos; las pruebas con lectores de pantalla físicos siguen pendientes.


En Explorar, los tres niveles presentan una guía inicial, una comparación seleccionable de hasta tres fondos o un panel técnico por fondo. Los filtros usan datos presentes; los riesgos, costes y plazos de los tres fondos ficticios son supuestos educativos, no se aplican en los cálculos de la simulación y no describen productos reales. La documentación legal no está incorporada; la ficha oficial es una fuente, no un documento precontractual verificado. El panel avanzado permite descargar las observaciones disponibles en CSV. Para la serie anual identificada, las rentabilidades acumuladas y anualizadas de 1, 3 y 5 años se calculan componiendo las cifras anuales redondeadas disponibles; no son predicciones, no incluyen impuestos ni costes externos, y no se muestran si la serie es inválida o insuficiente.


La entidad se configura al arrancar o compilar el frontend mediante `VITE_BANK_ID` (identificadores del catálogo: `demo`, `caixabank`, `bbva`, `santander`; por defecto `demo`). Ejemplo en Linux/macOS: `VITE_BANK_ID=caixabank npm run dev`; en PowerShell: `$env:VITE_BANK_ID="caixabank"; npm run dev`. Una entidad inexistente muestra un error de configuración. El filtro es de interfaz, no una barrera de autorización del servidor; una integración real necesitaría control de acceso en backend. El laboratorio deshabilita lecciones sin series compatibles.

La guía de objetivos es un ejercicio local de plantillas educativas editables, condicionado por las respuestas y la preferencia de fluctuación; no evalúa idoneidad ni recomienda productos. Las respuestas permanecen en la pantalla y no se envían al tutor. La comparación avanzada muestra hasta tres series seleccionadas con la misma frecuencia, etiquetas de periodo y procedencia, en gráficos separados con escala común. En el simulador, el botón de ayuda junto al resultado abre el asistente con el resultado válido actual.

La interfaz usa nombres como «Mi cartera», «Explorar fondos» y «Simular inversión». La cabecera identifica el modo demo sin dinero real; las fuentes, limitaciones y costes siguen visibles donde aportan contexto.

El tutor funciona por reglas, no utiliza LLM ni proveedores de voz remotos. El dictado y la lectura dependen de capacidades locales del dispositivo y conservan alternativa escrita. El gráfico ofrece tabla accesible y navegación por teclado. La comprobación con lectores de pantalla físicos sigue pendiente. El componente CountUp procede de React Bits; su licencia figura en `REACT-BITS-LICENSE.md`.

## Integración con `main` (selector de nivel, simulador único y pausa)

- **Interfaz final**: Inicio es `HomeDashboard` (más BankInfo y los accesos de práctica, «¿Te preocupa la caída?» y «Probar una caída»); Mi cartera es `FundsDashboard` + `AgentPanelSection` + banner/pausa; los tres reciben la misma cartera (`portfolio`). La página antigua de cartera/inicio de `main` (PageIntro, `large-portfolio`, tarjetas de acción) se descartó; se conservó su funcionalidad útil: el acceso «calm» que abre `openPortfolioDecline`, el análisis detallado de caídas, `navHistory`, `hostBankId` y los datos `historical_nav` en simulador y práctica. El Simulador muestra su título encima de las pestañas.
- **Selector de nivel**: `src/LevelSelector.tsx` (de `main`) usa los tokens y temas del dashboard y ocupa el lugar del botón «Detalle». Selectores accesibles: botón `.level-button` (`aria-expanded`, `aria-controls="level-options"`), grupo `.level-menu` (`role="group"`, `aria-label` «Detalle»; `inert` cerrado), botón «Volver» y botones Básico/Intermedio/Avanzado con `aria-pressed`. Escape devuelve el foco al botón; respeta `prefers-reduced-motion`. `localStorage` `t2f-level` y `data-level` en `<html>` no cambian. Las etiquetas visibles son Básico/Intermedio/Avanzado.
- **Simulador único con pestañas** (`views/simulator/SimulatorPage.tsx`): `role="tablist"` (`aria-label` «Secciones del simulador»), pestañas `#sim-tab-sim` «Simular» y `#sim-tab-sell` «¿Y si vendo?» (flechas, Inicio y Fin; `aria-selected`, `tabIndex` móvil), paneles `#sim-panel-sim` y `#sim-panel-sell` (`role="tabpanel"`, el inactivo con `hidden`; el contenido de «¿Y si vendo?» solo se monta mientras su pestaña está activa, para no duplicar etiquetas de formulario ocultas con las del simulador de producto (al cambiar de pestaña se pierde lo escrito en ese formulario)). «¿Y si vendo?» renderiza `HoldSellGame`: Básico usa `guided` (solo fondo, importe y mes de venta; sin comisiones, meses ni aportación visibles y con una explicación sencilla), Intermedio/Avanzado el formulario completo. Con el modo local muestra el aviso de que no se calcula nada ni se envía ninguna petición. No empuja a mantener ni a vender.
- **Pausa** (`AntiPanicPanel`): lógica de `main` (análisis detallado con `DetailedDeclinePanel`, contexto histórico público, escenario ficticio identificado) con la profundidad por nivel de la rama. Nunca bloquea ni retrasa la venta; menciona liquidez, horizonte y objetivo; las noticias son contexto y no prueban causalidad. La pausa de cartera (Inicio y Mi cartera) analiza la cartera mostrada (`buildRealPortfolio`, construida una sola vez en `App.tsx`): con servidor envía `{basis:"portfolio_cnmv"}` y el backend reconstruye la misma serie, así que se muestra el análisis detallado y el tutor recibe la misma caída; sin servidor, análisis local de esa serie (`dataKind` `historical_nav`, fuente CNMV con URL y periodo). Sin datos reales, la serie DEMO (`fictional`). «Probar una caída» usa la serie de estudio `portfolio_demo`.
- **Pruebas Playwright**: `npx playwright test` (169 pruebas). Configuraciones extra: `playwright.level.config.ts` (selector de nivel), `playwright.shiny.config.ts` (voz; necesita `T2F_BACKEND_PORT=8111` porque su vite no pasa por `start-vite.mjs`) y `calm.playwright.config.ts` (sin `webServer`: requiere vite en 5187 con `VITE_BANK_ID=demo` y el backend en 8111).
- **Asistente**: preguntas sugeridas por página y nivel más las de caída; en el servidor `learn` se envía como `home`.
