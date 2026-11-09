# Tech2Finance

## Qué es

Copiloto de inversión para una aplicación bancaria simulada: interfaz adaptable, tutor contextual y por voz, juego educativo basado en datos históricos y pausa informativa antes de vender. Banco como cliente potencial y usuario bancario como destinatario.

## Reglas comunes

- Leer `docs/organizacion.md` y `docs/contratos.md`. Hay cinco responsabilidades en un solo repositorio y una aplicación compartida.
- El nivel cambia la explicación, no determina el perfil de riesgo. Ninguna operación real, conexión bancaria, custodia ni datos reales de clientes en la demo.
- No inventar series, precios o causas. Identificar fuentes, fechas, condiciones y costes. Las simulaciones futuras no predicen ni garantizan rendimientos.
- La pausa antipánico no bloquea ventas ni presiona a mantener. Considerar necesidades de liquidez, horizonte y objetivo. Las noticias son contexto y no prueban causalidad por sí mismas.
- El LLM explica; las reglas y los cálculos corresponden a código verificable. Mantener claves en el servidor y fuera de Git.
- Coordinar contratos y cambios compartidos; preservar cambios ajenos. El plan completo generado por Claude era un artefacto oculto no disponible.
- Modelo por rol: ejecutor Claude Sonnet / Codex gpt-6.1-terra; planificación y revisión Claude Opus / Codex gpt-6.1-sol. Si no está disponible, informar, sin sustituir silenciosamente. Revisores no editan.
