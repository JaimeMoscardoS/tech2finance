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

El tutor funciona por reglas, no utiliza LLM ni proveedores de voz remotos. El dictado y la lectura dependen de capacidades locales del dispositivo y conservan alternativa escrita. El gráfico ofrece tabla accesible y navegación por teclado. La comprobación con lectores de pantalla físicos sigue pendiente. El componente CountUp procede de React Bits; su licencia figura en `REACT-BITS-LICENSE.md`.

### Detección automática y contexto del BCE

En modo servidor, la cartera histórica de ejemplo se comprueba automáticamente al cargar o cambiar sus datos. El servidor detecta una caída de al menos el 5 % respecto al máximo anterior y busca contexto de mercado en el archivo del BCE para el periodo observado. La tarjeta mantiene la entrada manual a la pausa. Los documentos muestran fecha de publicación, editor, enlace y extracto; la coincidencia temporal no demuestra causalidad ni permite deducir la composición del fondo. Si no se pueden consultar las noticias se conserva la información observada y se ofrece reintento. El análisis detallado usa el mismo periodo y solo identifica Sonnet cuando la respuesta validada declara ese proveedor.

La demo local no llama a estos endpoints ni busca noticias externas. Las pruebas de navegador desactivan el proveedor de noticias en su servidor y usan respuestas controladas; el servidor normal usa el archivo BCE por defecto. La conexión no representa una cuenta bancaria ni precios actuales.
