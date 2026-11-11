# Juego histórico de inversión: especificación y plan de implementación

## Qué es

Una simulación educativa por turnos en la que practicas con dinero ficticio sobre
valores liquidativos históricos reales de fondos identificados. Ves solo los datos
disponibles hasta la fecha del turno, decides comprar, vender o mantener y observas
el efecto sobre tu efectivo, participaciones y resultado. Puedes volver atrás y
comparar otra decisión bajo las mismas condiciones.

**Estado:** propuesta para el siguiente equipo; las casillas sin marcar son trabajo
pendiente. La migración de datos históricos se desarrolla por separado y es un
prerrequisito. Este documento no acredita que el juego esté implementado o probado.

**Objetivo:** completar un recorrido jugable y reproducible de principio a fin.
**Arquitectura:** React muestra estados y eventos; una API Python reproduce la
partida con la serie identificada y calcula el libro de cartera. El mismo motor
determinista sustenta los contrafactuales. Sin cuentas, base de datos ni conexión
bancaria nuevos. **Tecnología:** React/TypeScript, FastAPI, Python `Decimal`,
pruebas Python y Playwright. Esta especificación es también el plan de ejecución.

**Ejecución:** aplicar `superpowers:subagent-driven-development` o
`superpowers:executing-plans`, respetando las instrucciones del repositorio. El
usuario ya ha solicitado el plan; no hace falta pedir otra aprobación para empezar
cuando el prerrequisito esté integrado.

## Punto de partida y dependencias

- Leer `AGENTS.md`, `docs/contexto-proyecto.md`, `docs/organizacion.md`,
  `docs/contratos.md` y las instrucciones de las carpetas afectadas.
- `backend/domain/game.py` y `POST /api/game/compare` ofrecen hoy una comparación
  limitada entre mantener y una venta; su contrato no representa decisiones
  arbitrarias por turno. Conservarlo y añadir rutas separadas para este juego.
- `simulador/engine.py` y `simulador/series.py` contienen el motor y la lectura
  existentes: reutilizar funciones verificadas cuando respeten las reglas aquí
  fijadas, sin forzar `compare` a representar una secuencia incompatible.
- La migración histórica debe entregar `shared/nav-history.json`, con instrumentos
  indexables por ISIN y vinculados al `instrumentId` del catálogo 2.0; sus
  observaciones mensuales tienen formato
  `{date: ISO, nav: string decimal}`. Cada cierre mensual es la última observación
  diaria **real** de ese mes; se conserva la prueba diaria seleccionada y el hash
  del archivo mensual. Ventana prevista: diciembre de 2019 a diciembre de 2025,
  73 cierres y 72 periodos, sujeta a la cobertura validada de cada fondo.
- Relación ISIN → `instrumentId` prevista por el catálogo migrado:
  `ES0138045002` → `caixabank-monetario-estandar`;
  `ES0112793007` → `santander-rf-ahorro`;
  `ES0146133006` → `santander-renta-fija-a`;
  `ES0125269003` → `bbva-mi-inversion-bolsa-acumulacion`;
  `ES0118857004` → `bbva-estrategia-0-50`. Mostrar nombres completos reales,
  sin renombrarlos como T2F, y verificar la relación al integrar la migración.
- Para cada fondo elegible exigir cobertura de los 12 informes semestrales de
  2020–2025: junio cubre enero–junio y diciembre julio–diciembre. La conclusión
  es «sin distribuciones registradas en los informes consultados», a la precisión
  publicada, no una garantía futura. Existen 19 informes originales; los seis de
  marzo/septiembre de 2023–2025 carecen de `FONDTRIM` y no se rellenan con cero.
  Consultar el [manual CNMV, página 8, campo 23](https://www.cnmv.es/cnmvdia/decetes/Manual_AnexosIIC.pdf)
  y la [Circular 4/2008, página 10](https://cnmv.es/DocPortal/legislacion/circulares/4_2008.pdf).
  `ES0119178004` y cualquier serie con distribuciones no tratadas quedan fuera
  hasta modelar sus flujos: el NAV por sí solo no representa rentabilidad total.
- La demo usa BancoT2F como anfitrión; el filtro de entidades conserva los ID
  reales de emisores/bancos y solo muestra fondos de la lista habilitada. No
  atribuir a BancoT2F la emisión de los fondos reales.
- La migración de datos y el juego son entregas independientes: no presentar el
  PR de datos como si ya incluyera esta interfaz interactiva.
- El adaptador migrado previsto expone `kind: real_monthly_nav` y
  `contributionTiming: month_end_after_return`; esos nombres describen su salida,
  no prueban que el juego de decisiones múltiples esté implementado.
- El catálogo 2.0 y la práctica migrados pueden cargar el histórico completo,
  incluidas observaciones diarias, y el helper local importa el JSON. Filtrar
  únicamente el gráfico o la respuesta de replay no evita que ese bundle haya
  enviado valores futuros al navegador.

## Reglas del juego

### Tiempo y orden de un turno

1. Seleccionar fondo, fecha inicial disponible, efectivo inicial, inversión
   inicial y aportación mensual. El intervalo acaba como máximo en el último
   cierre verificado; nunca repetir cíclicamente datos ni interpolar.
2. En el cierre inicial (`periodIndex = 0`), ingresar `initialCash` en el libro
   y comprar `initialInvestment` al NAV visible. `initialInvestment` debe ser
   menor o igual al efectivo inicial. No hay aportación mensual adicional en 0.
3. Para cada cierre posterior, actualizar la valoración con su NAV; después
   ingresar la aportación programada en efectivo; finalmente presentar el turno
   y ejecutar la decisión única de comprar, vender o mantener al NAV visible.
   Es una convención educativa: no garantiza ese precio para una orden real.
4. Programar cada aportación en la fecha de la observación mensual real elegida;
   guardar además `calendarKey` (`YYYY-MM`). `scheduledDate` es esa fecha y
   `executionDate` es la primera observación disponible igual o posterior; en
   el MVP son iguales. Registrar ambas y `periodIndex`. Si se extiende el motor,
   `contribution_dates` opcional procede exclusivamente de fechas fiables
   derivadas en el servidor, no del calendario heredado ni del cliente. Las
   órdenes del juego se deciden y ejecutan en la observación visible del MVP.
5. Avanzar cuando el usuario lo solicite. El gráfico, tutor, red, almacenamiento y
   accesibilidad no deben revelar NAV, rendimiento, noticias ni conclusiones de
   fechas posteriores al turno visible. Las fechas de cobertura del catálogo sí
   pueden mostrarse sin valores futuros.
6. Volver a un turno conserva solo el prefijo de decisiones anterior al cambio;
   una decisión nueva crea una rama. Comparar ramas únicamente con idénticos
   fondo, fechas, importes aportados, precios y comisiones; identificar el punto
   de bifurcación y el periodo comparado. No inventar una evolución alternativa.

### Libro y cálculos

- Usar `Decimal` con precisión 34 y redondeo `ROUND_HALF_EVEN` en operaciones;
  serializar decimales como cadenas y redondear solo al presentar. Documentar
  cualquier cuantización inevitable de participaciones; conservar precisión para
  que la reproducción sea determinista.
- Cada aportación suma capital y efectivo; no es beneficio. Comprar gasta un
  presupuesto `0 < amount <= cash` y añade `amount / NAV` participaciones
  virtuales fraccionarias. Vender `0 < units <= unitsHeld` añade `units × NAV`
  al efectivo. Mantener no altera el libro. Sin descubierto, cortos ni apalancamiento.
- `equity = cash + unitsHeld × NAV`; `contributed = initialCash + aportaciones`;
  `profit = equity − contributed`; `simpleReturn = profit / contributed`, o
  `null` si lo aportado es cero. Es rentabilidad simple sobre capital aportado,
  no rentabilidad anualizada ni TIR. El efectivo no devenga rentabilidad.
- Comisiones de transacción **adicionales** del MVP: cero, supuesto explícito.
  El NAV incorpora los costes del fondo que correspondan: no descontarlos otra
  vez. No convertir divisas ni llamar EUR a una serie de otra moneda.
- Una decisión por turno; rechazar índices duplicados, órdenes repetidas,
  importes negativos, `NaN`, infinito, escalas excesivas y datos fuera de
  cobertura. Un reintento reproduce el mismo registro completo: no añade
  aportaciones ni operaciones por segunda vez.
- Puntuación, si se incorpora, reconoce reflexión y comprensión, no el beneficio
  ni haber mantenido. Vender para disponer de liquidez puede ser razonable
  aunque el precio suba después. Ninguna caída implica recuperación garantizada.

### Comprobación matemática independiente

Solo para pruebas unitarias, **no son datos históricos**: NAV 100 → 90 → 99;
1.000 € iniciales compran 10 participaciones a 100; aportar 100 € al cierre 90.

| Decisión en 90 | Efectivo en 90 | Participaciones | Patrimonio en 90 | Patrimonio en 99 |
| --- | ---: | ---: | ---: | ---: |
| Mantener | 100 | 10 | 1.000 | 1.090 |
| Comprar por 100 | 0 | 11,111… | 1.000 | 1.100 |
| Vender las 10 | 1.000 | 0 | 1.000 | 1.000 |

En el cierre 90 el capital aportado es 1.100 € y el resultado es −100 € en las
tres ramas. Usar tolerancia explícita para la división periódica; el cálculo de
producción conserva `Decimal`. Tras integrar los datos, pedir al responsable de
ingesta un caso real con fondo, fechas y valores esperados reproducibles; no
inventar cifras para la prueba de integración.

## Contrato propuesto entre áreas

Congelar este contrato entre las cinco áreas antes de implementar. Crear
`shared/historical-game.ts` y sus modelos Python equivalentes en
`backend/schemas.py`. Las rutas son nuevas y no cambian `game/compare`.

```ts
type DecimalText = string; // base 10, punto decimal, sin exponente ni signo +
type ISODate = string;     // YYYY-MM-DD, fecha válida
type Decision =
  | { periodIndex: number; action: 'hold' }
  | { periodIndex: number; action: 'buy'; amount: DecimalText } // EUR
  | { periodIndex: number; action: 'sell'; units: DecimalText };// participaciones
type ReplayRequest = {
  scenarioId: string; datasetVersion: string; instrumentId: string;
  startDate: ISODate; initialCash: DecimalText; initialInvestment: DecimalText;
  contributionPlan: { frequency: 'monthly'; amount: DecimalText }; // EUR
  revealIndex: number; decisions: Decision[];
};
type LedgerPoint = {
  periodIndex: number; observationDate: ISODate; nav: DecimalText; // EUR/unit
  contribution: { scheduledDate: ISODate; executionDate: ISODate;
    calendarKey: string; amount: DecimalText } | null; // YYYY-MM, EUR
  decision: (Decision & { decisionDate: ISODate; executionDate: ISODate }) | null;
  cash: DecimalText; unitsHeld: DecimalText; contributed: DecimalText;
  equity: DecimalText; profit: DecimalText; simpleReturn: DecimalText | null;
};
type ReplayResponse = {
  scenarioId: string; datasetVersion: string; instrumentId: string;
  currency: 'EUR'; startDate: ISODate; revealIndex: number;
  calculationVersion: string; dataSha256: string; points: LedgerPoint[];
  assumptions: string[];
};
```

- `GET /api/game/scenarios`: versiones e instrumentos elegibles, nombre real,
  ISIN, moneda, cobertura y fuente; sin precios. `scenarioId` identifica la
  combinación de serie y reglas, `datasetVersion` fija la versión inmutable.
- `POST /api/game/replay`: recibe `ReplayRequest`, valida y reconstruye todo
  desde datos de confianza. Devuelve solo puntos 0…`revealIndex`; nunca recibe
  precios, balances ni resultados del cliente. El cliente envía todo el prefijo,
  no un incremento; la misma petición produce el mismo resultado.
- La pareja `datasetVersion` y `dataSha256` identifica el snapshot inmutable;
  el servidor resuelve y verifica su hash a partir de sus propios datos. Si no
  conserva esa versión exacta, rechaza el replay con error de versión no disponible,
  sin sustituirla por otra. El registro de decisiones incluye índices y órdenes,
  nunca NAV ni balances; la respuesta devuelve versión y hash del snapshot usado.
- Importes entre 0 y 1.000.000.000 EUR, máximo 2 decimales; unidades positivas
  con máximo 34 cifras significativas y 100 decimales, suficiente para reenviar
  exactamente el saldo devuelto y venderlo entero; NAV positivo de la fuente. `hold`
  no tiene cantidad. Cantidades de compra/venta estrictamente positivas.
  `revealIndex` entero entre 0 y el número de cierres disponibles menos uno;
  máximo 72. `startDate` debe ser una fecha de observación disponible.
- Decisiones ordenadas estrictamente por índice, una como máximo por índice,
  entre 1 y `revealIndex`; en el índice 0 solo se ejecuta la inversión inicial.
  Los índices sin decisión equivalen a mantener. Rechazar campos desconocidos,
  versiones distintas, fondos no elegibles o saldo insuficiente con error 422
  estructurado (`code`, `message`, `field` cuando proceda); ruta/versión no
  disponible con error claro. No devolver valores futuros en errores.
- Una comparación solicita dos reproducciones independientes con los mismos
  parámetros salvo el registro de decisiones. Mostrar ambas solo hasta el mismo
  `revealIndex`; la comparación no cambia el historial principal automáticamente.
- El MVP del juego necesita servidor; en la modalidad local existente informarlo
  y ofrecer volver o conectar el servidor, sin cambiar de modo silenciosamente.
  Un modo offline futuro exigiría resolver la entrega de datos sin revelar el
  futuro y comprobar paridad de replay con el servidor; no forma parte del MVP.
- Entrada del juego separada y exclusiva de API: crear `frontend/game.html` y
  `frontend/src/game-main.tsx`, o un entry equivalente con bundle independiente,
  sin importar `nav-history.json`, el catálogo completo ni helpers que lo
  incluyan. El acceso desde `App.tsx` navega a esa entrada y no transfiere series
  crudas por props, URL ni almacenamiento. Al iniciar una sesión limpia, solo
  solicitar metadatos sin precios a `scenarios` y prefijos a `replay`.
- Esta separación evita revelar valores futuros durante la experiencia; los
  históricos son públicos y no se promete impedir que se conozcan por memoria,
  caché previa u otras fuentes. Es una herramienta educativa, no una competición
  con garantía de secreto ni una medida de seguridad contra el usuario.

## Experiencia de uso

1. **Preparar:** elegir fondo real elegible y fecha de inicio dentro de cobertura;
   introducir saldo inicial, inversión inicial y aportación mensual en euros.
   Mostrar fuente, fechas, condiciones y que el dinero es ficticio en el contexto
   general de la demo, sin repetir «ficticio» en cada ficha de fondo real.
2. **Jugar:** mostrar fecha, NAV, gráfico del prefijo y patrimonio; distinguir
   efectivo, participaciones, capital aportado y beneficio/pérdida. Acciones
   claras «Comprar», «Vender» y «Mantener», con importe o participaciones,
   validación de saldo y confirmación del efecto antes de avanzar.
3. **Resolver:** al confirmar, bloquear envíos duplicados, mostrar el resultado
   del turno y permitir avanzar. Las caídas aparecen solo cuando la serie real
   las contiene; no introducir desplomes ni causas inventadas.
4. **Revisar:** historial con fecha de observación, aportación programada y
   ejecutada, operación y estado; retroceder, cambiar una decisión y comparar
   trayectorias al mismo cierre. Explicar que la comparación es retrospectiva.
5. **Terminar:** presentar el resultado, lo aportado y las decisiones, con opción
   de repetir o cambiar el punto de partida. La venta no se bloquea ni se juzga.

Implementar `frontend/src/HistoricalGame.tsx` como componente separado de
`App.tsx`. Máquina de estados explícita `setup`, `running`, `decision`,
`resolving`, `summary`, `error`; describir transiciones en pruebas. Una línea
temporal legible es el elemento visual principal; mantener la paleta VALLE,
jerarquía existente y contraste claro/oscuro. Móvil y escritorio, ES/EN, teclado,
foco visible, lector de pantalla y movimiento reducido; ningún temporizador es
necesario para jugar. ReactBits solo cuando aporte a la interacción y sea
compatible con la guía local `frontend-design`.

Cancelar peticiones con `AbortController` y descartar respuestas antiguas mediante
un contador de generación cuando cambien fondo, modo o fecha. En error ofrecer
reintento con las mismas entradas. Guardar opcionalmente en `localStorage` solo
selecciones y registro de decisiones, sin datos de cuentas ni saldos calculados;
al recargar, reconstruir por replay. Si cambia la versión de datos, pedir una
nueva partida o cargar una versión aún disponible, sin mezclar resultados.

El tutor MVP explica los datos ya visibles mediante reglas y el resultado del
motor; no calcula importes ni necesita claves o APIs. En noticias verificadas,
el servidor filtra `event.date <= observationDate` antes de responder o generar
contexto; coincidencia no demuestra causalidad. Puede usarse la [declaración de
la OMS del 11 de marzo de 2020](https://www.who.int/news-room/speeches/item/who-director-general-s-opening-remarks-at-the-media-briefing-on-covid-19---11-march-2020)
como contexto, sin atribuirle la causa de la cotización de un fondo. El guion
ficticio existente de `shared/decline-demo.json`
no entra en la ruta histórica real. Voz, Claude y noticias son ampliaciones
opcionales, no dependencias del juego.

## Plan por áreas y entregas

Las rutas nuevas siguientes son propuestas; los archivos existentes se identifican
arriba. Una tarea se termina con sus pruebas y documentación en el mismo PR. Las
cinco áreas coordinan primero contrato y versión; los cambios financieros y de
flujo principal requieren revisión ampliada según `AGENTS.md`.

### 0. Prerrequisito de datos y contrato compartido

**Áreas:** 2, 3 y 5. **Depende de:** migración histórica separada.

- [ ] Verificar archivo, hash, origen diario, coberturas, moneda y política de
  distribución de cada fondo; excluir lo que no cumpla. Dejar documentados los
  derechos de uso de los archivos originales y de su distribución antes de incluirlos.
- [ ] Crear `shared/historical-game.ts` y modelos de `backend/schemas.py` con el
  contrato anterior; acordar ID reales contra el catálogo migrado. Registrar un
  ejemplo de petición/respuesta validado por las dos partes.
- [ ] Probar rechazo de versión, cobertura, esquema y fondos no elegibles.
  PR de contrato dependiente de la migración; no modificar `game/compare`.

### 1. Motor y reproducción — área 3

**Archivos propuestos:** `simulador/historical_game.py`,
`simulador/tests/test_historical_game.py`. **Consume:** serie validada y contrato 0.
**Produce:** `replay_game(series, request) -> ReplayResponse` mediante funciones
reutilizables de valoración, aportación y orden.

- [ ] Escribir primero la prueba del vector 100 → 90 → 99 y las tres ramas;
  ejecutarla y comprobar que falla por faltar el motor.
- [ ] Implementar libro Decimal y orden temporal; verificar los valores de la
  tabla, cero aportado, compras/ventas parciales y fracciones sin pérdida material.
- [ ] Probar cierre observado anterior al último día natural, fecha programada
  igual al cierre y ejecución no anterior, índice cero, última observación, decisión
  duplicada, saldo insuficiente, precisión y ausencia de datos futuros. Comprobar
  que reintentar el registro completo es determinista.
- [ ] Añadir el caso histórico independiente facilitado por el área 5, con sus
  fechas y valores verificables. Documentar fórmulas y supuestos en
  `simulador/README.md`. PR del motor.

### 2. API — área 2

**Archivos:** `backend/app.py`, `backend/schemas.py`, nuevo
`backend/domain/historical_game.py`, nuevo `backend/tests/test_historical_game.py`.
**Consume:** contrato 0, serie migrada y motor 1. **Produce:** rutas de escenarios
y replay descritas arriba.

- [ ] Escribir pruebas de rutas y validación antes de implementarlas: respuesta
  prefix-only, error 422, versión errónea, doble orden, compra sin saldo y venta
  superior a participaciones; comprobar que ignoran o rechazan precios y balances
  enviados por cliente y no exponen el futuro.
- [ ] Conectar el adaptador histórico validado al motor y mapear errores; preservar
  `scheduledDate`, `executionDate` y `periodIndex` sin sustituir fechas reales.
- [ ] Comprobar dos solicitudes idénticas y dos ramas bajo igual contexto; verificar
  que `POST /api/game/compare` mantiene su contrato anterior. Actualizar
  `backend/README.md` y `docs/contratos.md`. PR de integración backend.

### 3. Interfaz y accesibilidad — área 1

**Archivos propuestos:** `frontend/src/HistoricalGame.tsx`,
`frontend/src/historical-game.css`, `frontend/src/historical-game.test.ts`,
`frontend/tests/historical-game.spec.ts`, `frontend/game.html`,
`frontend/src/game-main.tsx`; integrar acceso independiente desde `App.tsx`,
`frontend/src/server-api.ts` y `frontend/src/copy.ts` según patrones existentes.
**Consume:** contrato y rutas 2. **Produce:** recorrido completo y replay de ramas.

- [ ] Probar transiciones y validación; construir preparación, juego, historial,
  comparación y resultado con los estados descritos. Toda cifra procede del replay.
- [ ] Probar cambio rápido de fondo/modo/fecha y respuesta antigua, doble clic,
  fallo/reintento y recarga con solo entradas y decisiones. Verificar que no se
  dupliquen aportaciones ni aparezcan observaciones futuras.
- [ ] Con contexto de navegador limpio, inspeccionar respuestas de red, bundle,
  DOM, almacenamiento y descripción accesible del gráfico en varios turnos:
  ningún NAV posterior al corte aparece en la entrada del juego. Verificar que
  navegar desde la aplicación tampoco pasa el histórico completo al juego.
- [ ] Probar teclado y foco, móvil/escritorio, ES/EN y tema claro/oscuro; revisar
  visualmente el contenido real y documentar cualquier comprobación no realizada.
- [ ] Mostrar en modo local la limitación y mantener ambos modos explícitos;
  no ofrecer una reproducción offline con el histórico completo en el MVP.
  Actualizar `frontend/README.md`. PR de interfaz tras API y motor.

### 4. Tutor — área 4

**Archivos:** `tutor-ia/` y su documentación según el contrato existente; conectar
desde la interfaz solo contexto visible y salida calculada por el motor.

- [ ] Añadir explicaciones por reglas para aportación, efectivo, pérdida y venta;
  comprobar que no anticipan precios ni afirman recuperación o recomendación.
- [ ] Probar una venta por necesidad de liquidez sin valoración negativa, un
  turno sin contexto noticioso y el evento OMS antes y después de su fecha:
  el servidor nunca lo entrega antes del 11 de marzo de 2020. Mantener voz y
  proveedores externos opcionales.
  PR acotado al tutor, dependiente del contrato.

### 5. Fuentes, QA y demo — área 5

**Archivos propuestos:** `docs/fuentes-juego-historico.md`, pruebas de integración
en `frontend/tests/historical-game.spec.ts`, guion en
`presentacion/demo-banco-t2f.md`; actualizar `docs/contexto-proyecto.md`.

- [ ] Contrastar cada observación seleccionada con su registro diario CNMV,
  procedencia, hash, divisa y distribución; fijar el caso real de integración.
  Conservar evidencia y licencias conforme a lo permitido por la fuente.
- [ ] Ejecutar recorrido completo: preparar, caída observada si existe, comprar o
  vender, mantener, avanzar, volver atrás, ramificar y comparar; comprobar
  exactamente fechas, cantidades, fuente, saldos y corte de información.
- [ ] Verificar modo servidor y el aviso en modo local; comprobar error de
  servidor y recuperación explícita. Registrar resultados,
  limitaciones y evidencias de navegador; no declarar validación de mercado.
- [ ] Redactar guion de demo con datos realmente disponibles y enlaces a fuente.
  PR de QA/contexto coordinado con las otras áreas.

Fuente primaria de referencia: [CNMV, información de fondos de inversión](https://www.cnmv.es/portal/consultas/IIC/BusquedaIIC.aspx).
La ubicación exacta de cada registro diario y la autorización de reutilización
deben constar en el archivo de procedencia de la migración; un enlace general no
sustituye esa evidencia.

## Comandos y criterios de aceptación

Desde `C:\proyectos\tech2finance-directors\20261111\12-real-history`, con
dependencias de `backend/requirements.txt` y `frontend` instaladas. Sustituir la
ruta del intérprete por la del entorno real; Playwright usa `T2F_PYTHON`.

```powershell
$env:T2F_PYTHON = 'C:\ruta\al\entorno\python.exe'
& $env:T2F_PYTHON -m pytest simulador/tests/test_historical_game.py backend/tests/test_historical_game.py backend/tests/test_game.py -q
Set-Location frontend
npm test
npm run build
npx playwright test tests/historical-game.spec.ts
```

- [ ] Las pruebas matemáticas, de dominio, API y navegador pasan y se conserva su
  salida; hay un caso real con valor esperado comprobado frente a la fuente.
- [ ] No se muestran datos futuros; fechas programadas y ejecutadas, unidades,
  aportaciones, beneficio y supuestos coinciden con el registro reproducido.
- [ ] En una sesión limpia, red, bundle, DOM, almacenamiento y gráfico accesible
  de la entrada aislada no contienen valores posteriores al turno visible.
- [ ] Las dos ramas usan las mismas condiciones; un reintento no cambia balances;
  la UI no acepta acciones imposibles y el servidor también las rechaza.
- [ ] La experiencia funciona en las combinaciones visuales afectadas; el modo
  local explica que el juego necesita servidor.
- [ ] Cada PR actualiza contratos y contexto afectados. Ejecutor Terra high en
  Codex o Sonnet en Claude; revisión Sol u Opus sin editar, con especialistas
  adicionales solo ante riesgos distintos. Máximo cuatro rondas; nota mínima
  8/10 por revisor y ningún hallazgo crítico o alto pendiente. Si falta evidencia,
  dejar el PR sin aprobar y comunicar el límite.
