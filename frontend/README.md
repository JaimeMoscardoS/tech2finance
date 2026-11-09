# 1 — Frontend de Tech2Finance

## Qué es

Interfaz de demostración en React y TypeScript para el copiloto de inversión del proyecto. Incluye inicio, catálogo ficticio, simulador ilustrativo, cartera ficticia, pausa antes de vender y un asistente de ejemplo con respuestas predefinidas. Los niveles cambian parte de la información y las explicaciones.

La demo no está conectada al backend, Claude, ElevenLabs ni a fuentes financieras. El simulador utiliza variaciones ficticias repetidas, no datos históricos ni predicciones; no se realizan operaciones. La máquina del tiempo histórica y el motor de análisis de caídas quedan pendientes de las áreas correspondientes.

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

Consulta las [instrucciones del área](AGENTS.md), el [contexto](../docs/contexto-proyecto.md) y los [contratos](../docs/contratos.md).