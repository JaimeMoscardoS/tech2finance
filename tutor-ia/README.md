# Tutor de IA y voz

## Qué es

Responsabilidad de la persona 4: copiloto educativo que explica la simulación o cartera ficticia mostrada, adaptándose al nivel del usuario.

## Trabajo

- Integrar Claude mediante servidor con claves en variables de entorno. Responder a partir del contexto estructurado de pantalla, simulación o cartera entregado por backend.
- Distinguir hechos de hipótesis, reconocer información insuficiente y no inventar cifras, causas ni prometer rentabilidades.
- Explicar conceptos y riesgos sin recomendar compras reales ni realizar cálculos o decisiones de inversión.
- Preparar primero texto; ElevenLabs para escuchar una respuesta es opcional, con alternativa textual si falla.

## Intercambio

Recibe pregunta, nivel, pantalla y contexto disponible; devuelve texto y, opcionalmente, una referencia de audio según [los contratos](../docs/contratos.md). Coordina los formatos con backend y usa ejemplos ficticios preparados por la persona 5.