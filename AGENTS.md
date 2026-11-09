# Tech2Finance

## Qué es

Copiloto de inversión para una aplicación bancaria simulada: interfaz adaptable, tutor contextual y por voz, juego educativo basado en datos históricos y pausa informativa antes de vender. Banco como cliente potencial y usuario bancario como destinatario.

## Reglas comunes

- Leer `docs/contexto-proyecto.md`, `docs/organizacion.md` y `docs/contratos.md`. Hay cinco responsabilidades en un solo repositorio y una aplicación compartida.
- El nivel cambia la explicación, no determina el perfil de riesgo. Ninguna operación real, conexión bancaria, custodia ni datos reales de clientes en la demo.
- No inventar series, precios o causas. Identificar fuentes, fechas, condiciones y costes. Las simulaciones futuras no predicen ni garantizan rendimientos.
- La pausa antipánico no bloquea ventas ni presiona a mantener. Considerar necesidades de liquidez, horizonte y objetivo. Las noticias son contexto y no prueban causalidad por sí mismas.
- El LLM explica; las reglas y los cálculos corresponden a código verificable. Mantener claves en el servidor y fuera de Git.
- Coordinar contratos y cambios compartidos; preservar cambios ajenos. El plan completo generado por Claude era un artefacto oculto no disponible.
- Modelo por rol: ejecutor Claude Sonnet / Codex gpt-6.1-terra; planificación y revisión Claude Opus / Codex gpt-6.1-sol. Si no está disponible, informar, sin sustituir silenciosamente. Revisores no editan.

## Revisión de pull requests grandes

Un pull request es grande a efectos de esta regla cuando introduce una funcionalidad completa, modifica varios componentes o contratos compartidos, o cambia cálculos financieros, seguridad o flujos principales. El responsable indica por qué requiere revisión; un cambio pequeño no necesita esta revisión ampliada.

- Elegir un revisor adecuado al cambio. Añadir otro especialista solo si existe un riesgo o área distinta que el primero no pueda evaluar. No lanzar revisiones repetidas por rutina.
- Cada revisor asignado entrega una nota de **0 a 10** con una explicación breve y evidencias. La nota mínima para superar su revisión es **8/10**. Una nota alta no compensa un hallazgo crítico o de gravedad alta sin resolver, ni permite afirmar que pasaron comprobaciones no ejecutadas.
- Hacer una revisión inicial y, si hay cambios, como máximo una segunda revisión centrada en las correcciones y sus efectos. No iniciar más rondas automáticas ni repetir revisiones ya resueltas.
- Si tras la segunda ronda la nota sigue por debajo de 8, queda un hallazgo crítico o alto, o falta evidencia imprescindible, comunicar lo pendiente y dejar el cambio sin aprobar; no rebajar la nota ni ocultar los problemas para cerrar. El equipo decide el siguiente paso.
- Los revisores informan y no editan. La nota no sustituye las pruebas apropiadas ni la decisión de integración del equipo.

## Flujo obligatorio con pull requests

Todos los cambios se realizan en una rama y se presentan mediante pull request para revisión. No integrar directamente en main. La revisión ampliada y su nota mínima solo se exigen en los pull requests grandes, conforme al apartado anterior.

## Uso de agentes

Usar los agentes de desarrollo adecuados al área y a la tarea: asignar la implementación al ejecutor o especialista correspondiente y su revisión a un revisor adecuado, consultando `docs/agentes.md`. Dar a cada agente una tarea y unos archivos concretos, conservar las ediciones ajenas y comprobar sus resultados antes de dar el trabajo por terminado. El responsable principal conserva la decisión final.

Usar solo los agentes necesarios: incorporar un segundo especialista únicamente cuando cubra un área o riesgo diferente, sin repetir revisiones por rutina. En los pull requests grandes se mantienen la nota mínima y el límite de rondas de la sección anterior. Si no se pueden utilizar los agentes o modelos previstos, indicar cuáles y por qué, y qué comprobaciones han quedado pendientes; no afirmar que se ha hecho una revisión que no se ha ejecutado.
