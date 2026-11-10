# 1 — Frontend de Tech2Finance

## Qué es

Interfaz de demostración en React y TypeScript para el copiloto de inversión del proyecto. Incluye inicio, catálogo ficticio, simulador ilustrativo, cartera ficticia, pausa antes de vender y un asistente de ejemplo con respuestas predefinidas. Incluye tres vistas progresivas según conocimiento, interfaz en español e inglés y temas claro y oscuro. El idioma y el tema se guardan en el navegador. Los niveles cambian la presentación y las explicaciones, no el riesgo de las inversiones.

La demo usa por defecto un backend local FastAPI; no conecta Claude, ElevenLabs ni fuentes financieras en directo y no realiza operaciones. El tutor responde mediante reglas; la voz del dispositivo es opcional y el análisis de caídas usa las observaciones disponibles, sin noticias ni causas inventadas. Los ejemplos ficticios usan variaciones inventadas; el ejemplo CaixaBank reconstruye una cartera con cinco rentabilidades anuales publicadas y aportaciones ficticias al cierre de cada año. No predice resultados ni utiliza valores liquidativos diarios. La fuente y los límites están en [contratos](../docs/contratos.md#muestra-histórica-anual-de-caixabank). El servicio de demo usa sus cálculos propios; el motor Python histórico permanece independiente.

## Ejecutar

Desde esta carpeta, con Node.js compatible con Vite (Node 22.12 o superior):

```bash
npm ci
npm run dev
```

En otro terminal, sigue los comandos de preparación y arranque para Windows o Linux/macOS del [README del backend](../backend/README.md#requisitos-y-arranque). Abre la dirección de Vite. Ante un fallo, la interfaz permite reintentar o elegir expresamente la demo local; la elección se guarda en el navegador. Vite reenvía `/api` al servidor local.

Para comprobar el código:

```bash
npm test
npm run build
npx playwright test
```

Las pruebas de navegador necesitan Google Chrome instalado. La aplicación y sus datos son solo una demostración.

## Tutor local, voz y pausa

El inicio organiza el recorrido en fondos, práctica guiada y cartera ficticia. El selector **Detalle** cambia la profundidad de la explicación, no el riesgo. **Conexión** permite cambiar entre servidor de demo y demo local; los errores y el reintento aparecen sin abrirlo. Abre el chat desde la navegación o el botón de la barra superior. El micrófono de la barra abre el asistente de voz y solicita inmediatamente el reconocimiento local; la escucha empieza solo si el navegador confirma disponibilidad y concede permiso. Desde la pausa se abre el panel sin iniciar la escucha hasta pulsar Hablar. Una consulta posterior también requiere pulsar Hablar. En el panel de voz, el dictado final se envía al terminar el reconocimiento; tras la respuesta no se vuelve a activar el micrófono automáticamente. En el chat, el dictado se mantiene editable y requiere envío manual. Responde por reglas con el contexto de la pantalla y conserva el texto de cada respuesta. Tras recibir una respuesta, **Escuchar** intenta utilizar una voz local del dispositivo. **Dictar** solo inicia reconocimiento cuando el navegador confirma procesamiento local y un modelo ya instalado; el texto reconocido se puede revisar antes de enviarlo. Si no hay una voz, capacidad o permiso disponibles, se puede seguir escribiendo. La aplicación no instala modelos ni envía audio a proveedores.

En la cartera ficticia, **Entender una caída** analiza los puntos de ejemplo; en un resultado válido del simulador, **Entender las caídas** analiza la evolución del instrumento sin las aportaciones. Se muestran los episodios observados y sus límites, no causas ni noticias inventadas. El objetivo, horizonte y necesidad de liquidez son opcionales y no constituyen una evaluación de idoneidad. La persona puede cerrar y continuar en la demo en cualquier momento.

## Práctica guiada

Desde la tarjeta de práctica de inicio o el enlace del simulador se pueden comparar dos ejemplos: cambiar las aportaciones de un mismo instrumento, comparar plazos de una serie ficticia sin aportaciones o comparar dos activos ficticios con condiciones iguales. Los importes, periodos e instrumentos son editables. El ejemplo histórico anual mantiene cinco años y las aportaciones se suman al cierre; los fondos sin histórico no están disponibles. Las comparaciones muestran capital, aportaciones, ganancia o pérdida, procedencia y límites, sin predecir resultados ni demostrar diversificación.

Cada pareja se calcula en el modo seleccionado. Al editar una entrada, cambiar de lección o de modo se descartan los resultados anteriores; si falla el servidor se muestra el error y no se calcula silenciosamente en local. Se puede seleccionar A o B para preguntar al tutor sobre ese ejemplo. La prueba conceptual es opcional y no puntúa por obtener ganancias. El laboratorio no compra ni vende activos y no utiliza dinero real.

El modo local funciona sin backend; el modo servidor usa las mismas reglas del tutor mediante un proceso Node local. Ninguno es un LLM ni conecta Claude, ElevenLabs o un banco. Los contratos para futuras integraciones están en [contratos](../docs/contratos.md#conversación-y-voz-propuesta); cualquier clave futura debe permanecer en el servidor, fuera del navegador y de Git.

## Componentes y fuentes

`src/CountUp.tsx` procede de [React Bits](https://github.com/DavidHDev/react-bits), componente CountUp. Su licencia se conserva en `REACT-BITS-LICENSE.md`. La animación respeta la preferencia de movimiento reducido definida por el navegador cuando la gestiona el componente; la interfaz también incluye reglas de movimiento reducido.

El gráfico usa Recharts 3 y ofrece vistas de capital y variación del instrumento, navegación interactiva y una tabla de datos alternativa. Las cifras de la cartera de ejemplo son ficticias y no dependen del resultado del simulador.

Consulta las [instrucciones del área](AGENTS.md), el [contexto](../docs/contexto-proyecto.md) y los [contratos](../docs/contratos.md).

## Contrato de servidor

`GET /api/catalog` carga bancos, instrumentos y muestra anual; `POST /api/simulations`, `/api/declines` y `/api/tutor` devuelven respectivamente resultados, informes y respuestas basadas en reglas. El cliente envía parámetros, no resultados financieros ni fuentes al tutor, y el servidor reconstruye el contexto. Las peticiones se cancelan al cambiar contexto y tienen un plazo de diez segundos. `shared/demo-data.json` es la fuente común de ejemplos. Las pruebas Playwright arrancan backend y Vite, requieren `.venv` con dependencias instaladas y aceptan `T2F_PYTHON` para seleccionar el intérprete.

Si el catálogo tarda o falla, la pantalla de recuperación mantiene idioma y tema disponibles y permite elegir expresamente la demo local; un fallo no cambia de modo automáticamente. En error se puede reintentar la carga. Al llegar el catálogo se traslada el foco al contenido principal si estaba en la pantalla de recuperación. Las solicitudes anteriores se cancelan al cambiar de modo y el reintento de operación se descarta cuando cambian sus entradas o contexto. `npx playwright test tests/recovery.spec.ts` comprueba estos recorridos; las pruebas con lectores de pantalla físicos siguen pendientes.
