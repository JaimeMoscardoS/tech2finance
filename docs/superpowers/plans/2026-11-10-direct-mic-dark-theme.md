# Direct microphone and darker night theme

## Qué es

Dos mejoras de la demo en esta rama: iniciar el reconocimiento local al pulsar el micrófono de la barra y oscurecer la paleta del tema nocturno.

## Alcance y responsables

- **Voz — ejecutor de frontend:** el clic explícito de la barra genera una intención de inicio que se consume una vez. La apertura desde la pausa mantiene el inicio manual. Tras una respuesta, otra consulta requiere una nueva acción. El navegador debe confirmar reconocimiento local y modelo ya disponible; no se instala ningún modelo ni se envía audio a una API externa.
- **Tema — ejecutor de diseño nocturno:** ajustar los colores oscuros compartidos preservando la jerarquía visual y la legibilidad de la interfaz.
- **Integración y revisión — responsable de la rama y revisor de accesibilidad:** verificar el comportamiento, los estados, el foco y la presentación antes de proponer su integración.

## Evidencia de la rama

La suite dirigida de voz pasa 6/6 con reconocimiento y síntesis simulados, incluyendo StrictMode, cancelación y cambio de idioma durante la comprobación de disponibilidad. Las pruebas visuales de escritorio y móvil pasan 2/2; TypeScript y la compilación de producción pasan, esta última con avisos existentes sobre `use client`. La revisión independiente de accesibilidad obtiene 9/10 sin hallazgos críticos o altos. En el navegador de prueba el modelo de dictado local no estaba disponible; no se afirma una prueba con micrófono real.
