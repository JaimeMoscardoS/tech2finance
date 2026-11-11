# Contexto de integración para backend

## Qué es

Contrato operativo de la API local de Tech2Finance. BancoT2F es un anfitrión ficticio; los cinco instrumentos activos son clases reales identificadas por ISIN y sus series proceden de ficheros públicos CNMV conservados en un conjunto versionado. El dinero y las operaciones son virtuales. No hay conexión bancaria, autenticación ni base de datos. El análisis detallado dispone de un proveedor Sonnet opcional no verificado con credenciales reales; por defecto utiliza reglas locales. Véanse [configuración y contrato](contratos.md#análisis-detallado-de-caídas).

## Catálogo, simulación y caída

La rama añade `POST /api/decline-events`: recalcula el informe, detecta una caída actual del 5 % y consulta contexto del archivo del BCE. La búsqueda es macroeconómica, tiene límites y puede desactivarse; no atribuye causas ni representa una conexión bancaria. Configuración, contrato y estados en [detección y noticias](contratos.md#detección-y-noticias).

`GET /api/catalog` devuelve versión `2.0`, bancos, instrumentos, `demoStudyInstrumentIds`, `portfolioExample`, `annualHistory`, `navHistory`, perfil anfitrión y procedencia. La lista de estudio no altera la entidad de los fondos. El cliente no envía valores liquidativos, fuentes ni resultados al servidor.

`POST /api/simulations` recibe `instrumentId`, `initial`, `recurringContribution`, `periods`, `startDate` opcional y `contributionFrequency` opcional (`monthly` por defecto o `annual`). La fecha inicial debe ser un cierre mensual observado. Cada periodo corresponde al siguiente cierre real; el máximo disponible es 72 desde diciembre de 2019, sin extrapolación. La aportación se suma después de la variación: mensualmente o en los periodos 12, 24, etc. Una simulación anual inferior a doce periodos no realiza ninguna aportación periódica. La salida `real_monthly_nav` incluye fecha y NAV exacto de cada observación, aportaciones, valores calculados, fuentes y hashes de catálogo e histórico.

`POST /api/declines` acepta `basis: instrument`, idioma, identificador, periodos y fecha inicial opcional; `portfolio_demo` deriva el mismo caso histórico que el catálogo; `portfolio_cnmv` (sin identificador ni periodos) reconstruye la cartera que muestran Inicio y «Mi cartera»: fondos elegibles en EUR del histórico CNMV (máximo 6, orden del dataset), fechas comunes consecutivas y 5.000 € DEMO por fondo al inicio, igual que `frontend/src/portfolio-real.ts`. El contexto de cartera del tutor (`home`/`portfolio`) usa esa misma serie. El informe analiza el rendimiento del instrumento sin flujos, identifica el periodo observado y mantiene `causesStatus: unknown`. `historicalContext.events` solo incluye acontecimientos fechados dentro del periodo. La noticia de la OMS no demuestra causalidad ni recuperación.

`POST /api/tutor` recibe pregunta, historial acotado y especificaciones de contexto; el servidor reconstruye hechos, fuentes y resultados. El cliente no puede inyectar `bank`, `product`, saldos ni fuentes. El `bankId` opcional se resuelve desde el catálogo: para bancos distintos de la demo se valida la pertenencia del instrumento, sin incorporarles condiciones ficticias. El filtro no constituye autorización. El tutor opera por reglas mediante Node local, sin LLM conectado.

## Comparación educativa

`POST /api/game/compare` recibe un fondo elegible, `initial`, `monthly`, `months`, `sellMonth`, tarifas de compra y venta explícitas y `startDate` opcional. Usa el motor `simulador.compare` con los cierres reales del intervalo. La aportación se efectúa en cada cierre después de la variación; la aportación del cierre de venta se compra antes de vender y las posteriores permanecen en efectivo. Los puntos incluyen `date` y `periodIndex`; las operaciones conservan `scheduledDate` y `executionDate`. Los importes del motor son cadenas decimales. Los resultados dependen de la trayectoria y de los costes declarados; no predicen ni recomiendan una decisión. Una interfaz sencilla de mantener o vender ya consume el endpoint en el Simulador (rama `feature/juego-pantalla`); el juego por turnos descrito en [su traspaso](planning/historical-investment-game.md) sigue pendiente.

## Fuentes, errores y límites

La [documentación de contratos](contratos.md) explica los 73 cierres, la validación de clases e informes de distribución y las condiciones de reutilización de CNMV. Los hashes canónicos de catálogo e histórico se comprueban frente al manifiesto y sus snapshots; las versiones anteriores permanecen intactas. Los gastos ya incorporados en el NAV no se descuentan otra vez. Los costes externos y los impuestos no se modelan.

Los errores tienen forma `{error:{code,message}}`: 404 para instrumento desconocido, 409 para histórico no disponible, 422 para especificaciones inválidas o fuera de cobertura y 503 si falla el tutor. El cuerpo está limitado a 64 KiB y el tutor no recibe hechos calculados por el cliente. Ver [backend/README](../backend/README.md) para ejecución y pruebas.
