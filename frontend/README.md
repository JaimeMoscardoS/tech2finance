# 1 — Frontend de Tech2Finance

## Qué es

Interfaz de demostración en React y TypeScript para el copiloto de inversión del proyecto. Incluye inicio, catálogo ficticio, simulador ilustrativo, cartera ficticia, pausa antes de vender y un asistente de ejemplo con respuestas predefinidas. Incluye tres vistas progresivas según conocimiento, interfaz en español e inglés y temas claro y oscuro. El idioma y el tema se guardan en el navegador. Los niveles cambian la presentación y las explicaciones, no el riesgo de las inversiones.

La demo no está conectada al backend, Claude, ElevenLabs ni a fuentes financieras en directo y no realiza operaciones. Los ejemplos ficticios usan variaciones inventadas; el ejemplo CaixaBank reconstruye una cartera con cinco rentabilidades anuales publicadas y aportaciones ficticias al cierre de cada año. No predice resultados ni utiliza valores liquidativos diarios. La fuente y los límites están en [contratos](../docs/contratos.md#muestra-histórica-anual-de-caixabank). El motor Python y el análisis de caídas no están conectados al frontend.

## Ejecutar

Desde esta carpeta, con Node.js compatible con Vite (Node 22.12 o superior):

```bash
npm ci
npm run dev
```

Abrir la dirección local que indique Vite. Para comprobar el código:

```bash
npm test
npm run build
npx playwright test
```

Las pruebas de navegador necesitan Google Chrome instalado. La aplicación y sus datos son solo una demostración.

## Componentes y fuentes

`src/CountUp.tsx` procede de [React Bits](https://github.com/DavidHDev/react-bits), componente CountUp. Su licencia se conserva en `REACT-BITS-LICENSE.md`. La animación respeta la preferencia de movimiento reducido definida por el navegador cuando la gestiona el componente; la interfaz también incluye reglas de movimiento reducido.

El gráfico usa Recharts 3 y ofrece vistas de capital y variación del instrumento, navegación interactiva y una tabla de datos alternativa. Las cifras de la cartera de ejemplo son ficticias y no dependen del resultado del simulador.

Consulta las [instrucciones del área](AGENTS.md), el [contexto](../docs/contexto-proyecto.md) y los [contratos](../docs/contratos.md).
