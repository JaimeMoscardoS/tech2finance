# Tech2Finance

## Qué es

Copiloto de inversión para una aplicación bancaria simulada: interfaz adaptable, tutor contextual y por voz, juego educativo basado en datos históricos y pausa informativa antes de vender. Banco como cliente potencial y usuario bancario como destinatario.

## Reglas comunes

- Antes de cualquier trabajo de interfaz, leer y aplicar [frontend-design](.agents/skills/frontend-design/SKILL.md), adaptada a Tech2Finance.
- Leer `docs/contexto-proyecto.md`, `docs/organizacion.md` y `docs/contratos.md`. Hay cinco responsabilidades en un solo repositorio y una aplicación compartida.
- El nivel cambia la explicación, no determina el perfil de riesgo. Ninguna operación real, conexión bancaria, custodia ni datos reales de clientes en la demo.
- No presentar series, precios o causas inventados como hechos. Los escenarios narrativos ficticios autorizados para la demo deben identificarse como tales y separarse de los datos reales o calculados. Identificar fuentes, fechas, condiciones y costes. Las simulaciones futuras no predicen ni garantizan rendimientos.
- La pausa antipánico no bloquea ventas ni presiona a mantener. Considerar necesidades de liquidez, horizonte y objetivo. Las noticias son contexto y no prueban causalidad por sí mismas.
- El LLM explica; las reglas y los cálculos corresponden a código verificable. Mantener claves en el servidor y fuera de Git.
- Coordinar contratos y cambios compartidos; preservar cambios ajenos. El plan completo generado por Claude era un artefacto oculto no disponible.
- En sesiones Codex, el agente principal `gpt-6.1-sol` solo orquesta, lee, revisa y verifica; no escribe archivos. Toda escritura del proyecto, incluidos código, documentación, configuración, pruebas, correcciones y textos de pull requests, se delega a un ejecutor o especialista `gpt-6.1-terra` con `model_reasoning_effort = "high"`. Planificadores y revisores Sol trabajan en solo lectura. Si Terra con esfuerzo high no está disponible, comunicar el bloqueo de escritura y no sustituirlo silenciosamente.
- En sesiones Claude, Sonnet ejecuta y Opus planifica y revisa; los revisores no editan. Esta distribución de agentes de desarrollo no cambia el modelo del tutor de la aplicación.

## Rediseño del dashboard (aprobado, en curso en la rama `mejora-ui`)

Detalle, tokens de color comprobados (WCAG AA), paneles por nivel y fases en [docs/diseno-dashboard.md](docs/diseno-dashboard.md). Decisiones:

- Niveles Básico, Intermedio y Avanzado. «Principiante» pasa a «Básico» solo en el texto visible; el identificador interno sigue siendo `beginner`. Tipo `Level` único.
- Temas claro y oscuro en los tres niveles (6 combinaciones) con variables CSS; el tema lo elige el usuario. Avanzado claro: barra lateral y cabecera azul marino oscuro y fondo gris.
- Datos de ejemplo ficticios y realistas en `shared/mock/`, siempre con etiqueta DEMO y sin paneles vacíos; sin nombres, ISIN ni precios reales; separados de los datos publicados; métricas calculadas por código probado.
- Secciones Fondos/Inversiones, Educación (con práctica del Test MiFID) y Simulación/Juego en cada nivel. Panel del agente de IA en el dashboard en los tres niveles, educativo y sin órdenes ni asesoramiento personalizado, además del Tutor.
- Estilo futurista con Recharts, `lucide-react` y `motion` existentes; sin nuevas librerías de gráficas.

## Revisión de pull requests grandes

Un pull request es grande a efectos de esta regla cuando introduce una funcionalidad completa, modifica varios componentes o contratos compartidos, o cambia cálculos financieros, seguridad o flujos principales. El responsable indica por qué requiere revisión; un cambio pequeño no necesita esta revisión ampliada.

- Elegir un revisor adecuado al cambio. Añadir otro especialista solo si existe un riesgo o área distinta que el primero no pueda evaluar. No lanzar revisiones repetidas por rutina.
- Cada revisor asignado entrega una nota de **0 a 10** con una explicación breve y evidencias. La nota mínima para superar su revisión es **8/10**. Una nota alta no compensa un hallazgo crítico o de gravedad alta sin resolver, ni permite afirmar que pasaron comprobaciones no ejecutadas.
- Hacer una revisión inicial y, si hay cambios, hasta tres revisiones adicionales centradas en las correcciones y sus efectos: un máximo de cuatro rondas en total. No iniciar más rondas automáticas ni repetir revisiones ya resueltas.
- Si tras la cuarta ronda la nota sigue por debajo de 8, queda un hallazgo crítico o alto, o falta evidencia imprescindible, comunicar lo pendiente y dejar el cambio sin aprobar; no rebajar la nota ni ocultar los problemas para cerrar. El equipo decide el siguiente paso.
- Los revisores informan y no editan. La nota no sustituye las pruebas apropiadas ni la decisión de integración del equipo.

## Flujo obligatorio con pull requests

Todos los cambios se realizan en una rama y se presentan mediante pull request para revisión. No integrar directamente en main. La revisión ampliada y su nota mínima solo se exigen en los pull requests grandes, conforme al apartado anterior.

## Uso de agentes

Usar los agentes de desarrollo adecuados al área y a la tarea: asignar la implementación al ejecutor o especialista correspondiente y su revisión a un revisor adecuado, consultando `docs/agentes.md`. Dar a cada agente una tarea y unos archivos concretos, conservar las ediciones ajenas y comprobar sus resultados antes de dar el trabajo por terminado. El responsable principal conserva la decisión final.

Usar solo los agentes necesarios: incorporar un segundo especialista únicamente cuando cubra un área o riesgo diferente, sin repetir revisiones por rutina. En los pull requests grandes se mantienen la nota mínima y el límite de rondas de la sección anterior. Si no se pueden utilizar los agentes o modelos previstos, indicar cuáles y por qué, y qué comprobaciones han quedado pendientes; no afirmar que se ha hecho una revisión que no se ha ejecutado.

## Mantener actualizado el contexto

En cada cambio, actualizar en el mismo pull request la documentación y el contexto afectados: describir las funcionalidades y cambios relevantes, sus entradas y salidas, decisiones y dependencias, y cómo utilizarlos o comprobarlos cuando corresponda. Mantener `docs/contexto-proyecto.md` como visión general actualizada, y editar los README, contratos e instrucciones de área que correspondan, sin duplicar detalles innecesariamente.

Distinguir siempre lo que está propuesto, implementado y comprobado de lo que sigue pendiente; indicar las limitaciones y pruebas realizadas con evidencia. No presentar como integrado en `main`, desplegado o conectado a servicios lo que solo existe en una rama o en una demo. No incluir secretos ni datos privados.
