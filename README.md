# Tech2Finance

## Qué es

Prototipo de copiloto para la sección de inversión de un banco: tres niveles de explicación, juego educativo con datos históricos y una pausa informativa antes de vender. Se propone venderlo a bancos; esta hipótesis está pendiente de validar.

La experiencia busca que una persona entienda productos y riesgos, practique con una máquina del tiempo y pueda consultar a un tutor por texto o voz. Si una cartera ficticia cae, un motor propuesto busca antecedentes del mismo fondo o de otros comparables y fuentes que ayuden a interpretar la bajada; una pausa permite revisar esa información y su objetivo antes de decidir. El banco sería el cliente comercial y el usuario bancario utilizaría la herramienta.

La demo no usa dinero ni cuentas reales. Los datos históricos deben ser verificables; los escenarios futuros no son predicciones. La pausa no bloquea al usuario ni promete recuperación. Lee el [contexto completo](docs/contexto-proyecto.md) para conocer la idea, el recorrido y sus límites.

La rama de trabajo incorpora el perfil ficticio [BancoT2F](docs/banco-t2f.md), sus condiciones ilustrativas y el [guion de demostración](presentacion/demo-banco-t2f.md). Las comisiones de BancoT2F son informativas y no se descuentan de las simulaciones; el recorrido final está pendiente de comprobación tras la integración.

La práctica guiada permite comparar aportaciones, plazos o activos ficticios mediante dos ejemplos calculados. El histórico anual publicado se limita a sus cinco años disponibles; las comparaciones no son recomendaciones ni garantizan resultados. El [frontend](frontend/README.md#práctica-guiada) explica cómo recorrerla.

| Número | Área | Carpetas |
| --- | --- | --- |
| 1 | Interfaz y experiencia | [frontend](frontend/) |
| 2 | Backend e integración | [backend](backend/) |
| 3 | Simulador y motor | [simulador](simulador/) |
| 4 | IA, voz y antipánico | [tutor-ia](tutor-ia/) |
| 5 | Datos, pruebas y presentación | [datos](datos/), [tests](tests/), [presentacion](presentacion/) |

Consulta [organización](docs/organizacion.md), [contratos](docs/contratos.md) y [agentes](docs/agentes.md). El repositorio contiene una demo implementada y documentación de las funcionalidades propuestas y pendientes.

## Colaborar

El propietario invita en GitHub desde Settings → Collaborators. Cada persona acepta, clona el repositorio y trabaja en una rama propia:

```bash
git clone https://github.com/JaimeMoscardoS/tech2finance.git
```

Abrir un pull request y pedir revisión antes de integrar. No subir claves ni datos privados.

## Backend local de demostración

La rama incluye una API FastAPI local para catálogo, simulación, caídas y tutor por reglas. El frontend utiliza el servidor por defecto y permite elegir demo local explícitamente. No conecta bancos ni proveedores externos. Véanse [backend-contexto](docs/backend-contexto.md) y [frontend/README](frontend/README.md) para contratos y ejecución.


Plan de trabajo y puertas de decisión: [preparación de Tech2Finance](docs/planning/plan.md).
