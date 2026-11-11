# Demo BancoT2F: guion

## Qué es

Guion propuesto para una experiencia educativa con BancoT2F como anfitrión ficticio, dinero virtual y valores liquidativos históricos de fondos reales publicados por CNMV. No hay cuentas conectadas ni órdenes reales. El catálogo muestra los ISIN y las entidades originales; las cifras históricas no predicen resultados futuros.

## Recorrido

1. En Inicio, explicar que la cuenta es ficticia y que los fondos son casos de estudio externos. Los costes actuales de cada producto no están disponibles; los gastos incorporados en el NAV no se descuentan dos veces.
2. En Explorar, elegir un fondo y consultar su nombre, ISIN, datos y fuente. El nivel cambia la presentación, no el riesgo. La entidad se fija al arrancar mediante `VITE_BANK_ID`; la demo muestra una lista explícita de estudio.
3. En Simulador, utilizar una cantidad virtual y aportaciones mensuales o anuales. El inicio y fin son cierres mensuales observados; la aportación se aplica después de la variación del cierre. No extrapolar el histórico.
4. En «Probar una caída», utilizar BBVA MI INVERSION BOLSA ACUMULACION, FI entre diciembre de 2019 y marzo de 2020: 1.000 € virtuales, sin aportaciones, dan aproximadamente 744,62 €. El enlace a la declaración pública de la OMS del 11 de marzo aporta contexto temporal, no demuestra la causa de la variación ni garantiza recuperación. El usuario decide.
5. En Cartera y tutor, comprobar que muestran el mismo caso calculado y sus límites. La voz es opcional y depende del dispositivo.

## Evidencia y límites

Los ficheros CNMV se identifican por URL y SHA-256 de archivo en `shared/nav-history.json`; el manifiesto comprueba por separado histórico y catálogo. Los informes consultados no registran distribuciones durante el periodo a la precisión publicada, sin garantizar una política futura. La reutilización se somete a la [nota legal CNMV](https://www.cnmv.es/portal/Utilidades/NotaLegal). Los detalles están en [contratos](../docs/contratos.md).

Las [preguntas ensayadas anteriormente](../docs/planning/evidence/banco-t2f/gui-rehearsal-es.json) corresponden a la versión de fondos ficticios y no acreditan este recorrido nuevo. La comprobación de esta rama debe documentarse con sus propias pruebas.
