# Tech2Finance

## Qué es

Prototipo de copiloto para la sección de inversión de un banco: tres niveles de explicación, simulaciones educativas con datos históricos y una pausa informativa antes de vender. Se propone venderlo a bancos; esta hipótesis está pendiente de validar.

La experiencia busca que una persona entienda productos y riesgos, practique con una máquina del tiempo y pueda consultar a un tutor por texto o voz. La pausa muestra el análisis disponible de la caída; la búsqueda de comparables y fuentes adicionales sigue siendo una propuesta. El banco sería el cliente comercial y el usuario bancario utilizaría la herramienta.

La demo no usa dinero ni cuentas reales. Los datos históricos deben ser verificables; los escenarios futuros no son predicciones. La pausa no bloquea al usuario ni promete recuperación. Lee el [contexto completo](docs/contexto-proyecto.md) para conocer la idea, el recorrido y sus límites.

La rama de trabajo incorpora el perfil ficticio [BancoT2F](docs/banco-t2f.md) y el [guion de demostración](presentacion/demo-banco-t2f.md). El perfil no contiene productos ni comisiones propias; los costes reales no disponibles se indican como desconocidos. El recorrido final está pendiente de comprobación tras la integración.

La práctica utiliza dinero virtual y valores liquidativos históricos de cinco fondos reales publicados por la CNMV. Cada serie contiene 73 cierres mensuales observados, de diciembre de 2019 a diciembre de 2025: se usa la última observación real de cada mes, sin interpolación, ciclos ni extrapolación. El [frontend](frontend/README.md#práctica-guiada) explica cómo recorrerla. El [juego por turnos de compra y venta](docs/planning/historical-investment-game.md) sigue siendo una propuesta; no debe confundirse con la práctica existente.

Las aportaciones de la simulación se suman después de la variación del NAV del cierre: pueden ser mensuales o anuales; las anuales se producen en los meses 12, 24 y sucesivos desde el inicio. No se descuentan de nuevo los costes ya incorporados en el NAV, y no se inventan costes desconocidos. Las comparaciones no son recomendaciones ni garantizan resultados.

La [fuente CNMV](https://www.cnmv.es/portal/publicaciones/descarga-informacion-individual.aspx) permite reutilización condicionada; consulta su [nota legal](https://www.cnmv.es/portal/Utilidades/NotaLegal) y la procedencia versionada en `shared/nav-history.json`. Las muestras y snapshots anteriores se conservan inmutables para reproducibilidad, separadas del catálogo activo.

| Número | Área | Carpetas |
| --- | --- | --- |
| 1 | Interfaz y experiencia | [frontend](frontend/) |
| 2 | Backend e integración | [backend](backend/) |
| 3 | Simulador y motor | [simulador](simulador/) |
| 4 | IA, voz y antipánico | [tutor-ia](tutor-ia/) |
| 5 | Datos, pruebas y presentación | [datos](datos/), [tests](tests/), [presentacion](presentacion/) |

Consulta [organización](docs/organizacion.md), [contratos](docs/contratos.md) y [agentes](docs/agentes.md). El repositorio contiene una demo implementada y documentación de las funcionalidades propuestas y pendientes.

La [investigación de viabilidad empresarial](docs/investigacion/2026-11-10-viabilidad/informe.md) presenta evidencias, incertidumbres y recomendaciones pendientes de decisión; no acredita que exista un servicio bancario listo para producción.

## Colaborar

El propietario invita en GitHub desde Settings → Collaborators. Cada persona acepta, clona el repositorio y trabaja en una rama propia:

```bash
git clone https://github.com/JaimeMoscardoS/tech2finance.git
```

Abrir un pull request y pedir revisión antes de integrar. No subir claves ni datos privados.

## Backend local de demostración

Para habilitar servicios opcionales, copia `.env.example` a `.env` en la raíz y añade `ANTHROPIC_API_KEY` y `ELEVENLABS_API_KEY`. El servidor lee el archivo al arrancar; reinícialo después de guardarlo. `.env` es privado y está excluido de Git. Consulta [configuración del backend](backend/README.md#configuración-privada-local).

La rama incluye una API FastAPI local para catálogo, simulación, caídas y tutor por reglas, con proveedores externos opcionales. `POST /api/game/compare` compara mantener con una venta en un mes seleccionado mediante NAV reales; no implementa decisiones de juego por turnos. El frontend utiliza el servidor por defecto y permite elegir demo local explícitamente. No conecta bancos. Véanse [backend-contexto](docs/backend-contexto.md) y [frontend/README](frontend/README.md) para contratos y ejecución.


Plan de trabajo y puertas de decisión: [preparación de Tech2Finance](docs/planning/plan.md).
