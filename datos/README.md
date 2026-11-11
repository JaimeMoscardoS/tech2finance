# 5 — Datos, pruebas y presentación

## Qué es

Datos y noticias con procedencia, pruebas de integración, narrativa, presentación y ensayo. Preparar catálogo, noticias y series con fechas, licencias y muestras etiquetadas.

Lee las [instrucciones del área](AGENTS.md), el [reparto](../docs/organizacion.md) y los [contratos](../docs/contratos.md).


## Catálogo local de práctica (rama de trabajo)

El catálogo local, sus fuentes y sus lagunas se describen en [contratos](../docs/contratos.md#datos-cnmv-y-cálculo-mensual-rama-de-trabajo). Verificar serie, condiciones y derechos antes de cualquier integración real.

El catálogo activo identifica cinco fondos reales de CaixaBank, Santander y BBVA. `shared/nav-history.json` recoge 73 cierres mensuales por fondo entre diciembre de 2019 y diciembre de 2025, seleccionados de observaciones diarias reales publicadas por la CNMV. No se interpolan, repiten ni extrapolan. La cartera de ejemplo utiliza dinero ficticio. El [registro anterior](registro-fuentes.json), la muestra anual redondeada y los snapshots se conservan por separado como evidencia histórica; no describen el catálogo activo.

Los costes incorporados al fondo se reflejan en el NAV; los importes no disponibles y los costes externos no se inventan. Los informes semestrales consultados no registran distribuciones a la precisión publicada; esto no garantiza la política futura. La reutilización de los datos está sujeta a la [nota legal de la CNMV](https://www.cnmv.es/portal/Utilidades/NotaLegal) y sus condiciones de atribución y fidelidad. La declaración de la OMS del 11 de marzo de 2020 es contexto verificable, no prueba de la causa de una caída.

El manifiesto y la instantánea congelada se describen en [03-data](../docs/workstreams/03-data.md). No hay feeds, datos de clientes ni proveedores de pago conectados.
