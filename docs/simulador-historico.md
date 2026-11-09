# Simulador histórico: propuesta técnica

## Qué es

Un motor de reproducción histórica que calcula cómo habría evolucionado una cartera ficticia usando una serie verificada de valores liquidativos o precios de un instrumento durante un periodo pasado. Es una propuesta para la máquina del tiempo educativa; todavía no está implementada y no predice resultados futuros.

## Opción recomendada

Para el hackathon, construir un motor pequeño y verificable en Python, separado de la API y del modelo de lenguaje. Puede leer una serie histórica ya descargada en CSV o JSON y exponer los resultados a través del backend propuesto en FastAPI. Una copia de datos preparada con antelación, si la fuente autoriza almacenarla y mostrarla, reduce la dependencia de la conexión durante la demo. Claude solo explica los resultados calculados.

Para una integración bancaria real, la primera opción es solicitar a la entidad o gestora el histórico del fondo y de la clase exacta que muestra en su aplicación, con permiso para el uso previsto. El acceso, cobertura, costes y términos deben acordarse; no están confirmados para ninguna entidad.

## Fuentes candidatas

- **Entidad o gestora:** valores liquidativos de la clase concreta, identificada por ISIN cuando exista. Es la opción más fiel si se consigue autorización y cobertura suficiente; aún no hay proveedor ni datos seleccionados.
- **API de un proveedor:** [Alpha Vantage](https://www.alphavantage.co/documentation/) documenta series históricas de mercado. Puede investigarse para un ETF o instrumento disponible, pero hay que comprobar el símbolo, rango, ajustes, disponibilidad y plan. El histórico diario ajustado figura como premium en su documentación. Sus [condiciones](https://www.alphavantage.co/terms_of_service/) establecen restricciones para uso comercial salvo acuerdo; no asumir que una clave gratuita permite una demo compartida o un producto bancario.
- **Proveedor bancario de valores liquidativos:** la [API de HSBC](https://develop.hsbc.com/api-overview/fund-administration-nav-asset-value-prices-api-eu) describe datos históricos por fondo y clase. Es un ejemplo de integración posible, no una conexión disponible para el equipo; hay que consultar acceso y condiciones.
- **`yfinance`:** puede servir para investigación y pruebas educativas cuando sus términos lo permitan, pero su [documentación](https://ranaroussi.github.io/yfinance/) indica que no es oficial de Yahoo y advierte que los datos de Yahoo Finance están destinados a uso personal. No tomarlo como fuente autorizada para un producto comercial o para redistribuir datos sin comprobar los derechos.

Un ETF, un índice y un fondo de inversión no son el mismo producto. Un índice o ETF comparable solo puede utilizarse como referencia identificada y explicando sus diferencias; no debe etiquetarse como histórico del fondo del banco. No hay ninguna serie, licencia ni cobertura de fondo concreto comprobada aún para la demo.

## Datos mínimos y validación

Cada serie debe incluir identificador y clase del instrumento, proveedor, enlace o referencia de origen, fecha de consulta, periodo, frecuencia, moneda, licencia de uso y campo de valor o precio. Documentar si la serie está ajustada por distribuciones y otros eventos, y qué costes incluye o excluye.

Rechazar fechas inválidas o duplicadas, valores no finitos o no positivos y periodos sin cobertura. Definir explícitamente qué ocurre con días no hábiles, huecos, cambios de moneda y aportaciones fuera de fecha; no rellenar silenciosamente información inexistente. Evitar contar dos veces dividendos o comisiones ya reflejados en el valor liquidativo o en una serie ajustada.

## Cálculo y experiencia de juego

1. Elegir un fondo o referencia identificada, periodo disponible, importe inicial y aportación periódica ficticia.
2. Establecer una regla documentada para convertir cada aportación en participaciones o unidades al valor correspondiente, y otra para costes y efectivo. Si el producto o la fuente no respaldan unidades fraccionarias, indicarlo o mantener esa capacidad como simplificación explícita.
3. En cada fecha observada, calcular el número de unidades y su valor; conservar capital aportado, cartera y efectivo separado cuando proceda.
4. Permitir explorar una decisión de juego. Si se compara mantener y vender, definir fecha y precio de venta, costes, impuestos si se modelan y qué ocurre después con el efectivo. Sin esas reglas no se deben comparar los resultados.
5. Devolver datos para el gráfico, resumen y supuestos, con fuente y fecha; dejar claro que es una reproducción histórica y que no garantiza resultados futuros.

Una serie ajustada por dividendos o splits no es necesariamente un precio al que se pudiera operar históricamente. Si se divide cada aportación entre valores ajustados, las unidades resultantes son sintéticas y deben etiquetarse como tales, explicando los supuestos de reinversión. Para representar participaciones y ventas históricas se requieren valores transaccionables y un tratamiento separado de los eventos y distribuciones, con la información y los supuestos necesarios.

Los criterios numéricos concretos, precisión, redondeo y tratamiento fiscal quedan por acordar. Una caída puede no recuperarse dentro de los datos disponibles; la ausencia de recuperación observada debe mostrarse como tal. Nunca elegir solo periodos favorables.

## Distribución y verificación

La persona 5 selecciona y documenta fuentes y permisos con el equipo; la persona 3 desarrolla y prueba el motor; la 2 acuerda con la 1 los contratos y la conexión; la 4 explica resultados sin inventar cifras. Las pruebas deben incluir un caso manual reproducible con serie de ejemplo, aportaciones, una caída no recuperada en la ventana, días ausentes, entradas inválidas y costes o ajustes, según las reglas elegidas. Las muestras sintéticas de pruebas deben marcarse como ficticias.

La estructura definitiva de la API y los esquemas se decidirán conjuntamente y se registrarán en [contratos](contratos.md). No hay que confundir el simulador ficticio actual de `frontend/src/demo.ts` con este motor pendiente.