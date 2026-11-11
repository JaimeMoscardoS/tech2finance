# BancoT2F: contexto de demostración

## Qué es

BancoT2F es el anfitrión ficticio de la experiencia educativa Tech2Finance. Su perfil de demo vive en `shared/demo-data.json:bankProfile`. No hay cuenta real, órdenes reales ni conexión bancaria; el mantenimiento de la cuenta ficticia es 0 EUR al mes.

Los cinco fondos de estudio tienen ISIN, clase, gestora y entidad reales; no son productos propios de BancoT2F. Los importes de inversión y las decisiones del usuario son virtuales. El perfil anfitrión ya no contiene productos ficticios ni sus tarifas anteriores. Los costes actuales, mínimos y horizonte de cada producto no se conocen en esta demo y no deben representarse como cero. Los valores liquidativos CNMV incluyen los gastos incorporados al fondo; el simulador no aplica costes externos ni impuestos.

## Fuente y versiones

El conjunto activo es `cnmv-nav-2019-2025.1`, con cálculo `nav-month-end-1.0.0`; el [manifiesto](../shared/data-manifest.json) identifica por separado los hashes canónicos del catálogo y del histórico. Las dos instantáneas de demo anteriores permanecen disponibles para reproducir sus cálculos, pero sus productos y series cíclicas no están activos.

Los datos CNMV son valores liquidativos observados, no cotizaciones en directo ni previsiones. Los informes consultados no registran distribuciones durante el periodo cubierto a su precisión publicada; esto no garantiza la política futura. Su reutilización está sujeta a las condiciones de la [nota legal CNMV](https://www.cnmv.es/portal/Utilidades/NotaLegal), cuya aplicación debe revisarse para el uso concreto. La muestra anual previa de CaixaBank se conserva por separado; el histórico mensual activo no interpola esa muestra.

La [API y sus límites](backend-contexto.md), los [contratos](contratos.md) y el [traspaso del juego](planning/historical-investment-game.md) describen el estado de esta rama. No implica despliegue ni integración en `main`.
