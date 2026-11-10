# Plataforma local y CI

## Qué es y objetivo

Arranque coordinado de la demo FastAPI y Vite y comprobaciones automáticas reproducibles. Rama de trabajo; no implica despliegue ni preparación para producción.

## Alcance y aceptación

`npm run dev:full` usa loopback, puertos 8000 y 5173 configurables, comprueba health y catalog directamente y por el proxy antes de anunciar disponibilidad y detiene sus procesos ante interrupción o fallo. Si un puerto está ocupado falla sin reutilizar ni detener procesos existentes. El proxy conserva la lista de carpetas permitidas de Vite. Requisitos y recuperación en [backend/README.md](../../backend/README.md).

CI ejecuta instalación bloqueada del frontend, build, tests de frontend y lanzador, dependencias Python, pip check y tests del backend y simulador. No usa despliegues, claves ni servicios de pago. Las versiones de acciones y sintaxis se contrastaron con fuentes oficiales: [checkout](https://github.com/actions/checkout), [setup-node](https://github.com/actions/setup-node), [setup-python](https://github.com/actions/setup-python), [sintaxis de workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).

## Evidencia y pendientes

El 10-11-2026 en Windows se ejecutaron build frontend, 23 pruebas frontend, 44 backend, 21 simulador y pip check; las pruebas del lanzador cubren contratos, puerto ocupado, espera, fallo de hijos y señales simuladas. La integración aislada de 8092/5192 respondió health y catalog por proxy y ambos puertos quedaron libres al finalizar, sin detener los servidores originales. El comportamiento real de señales en macOS/Linux y la ejecución del workflow en GitHub quedan pendientes de comprobar. Los resultados reflejan esta rama, no integración en main.

La revisión del 10-11-2026 añadió una prueba con dos procesos reales de prueba: al fallar uno se detuvo el otro y se liberaron ambos puertos. La señal y los procesos simulados no demuestran ejecución nativa en macOS/Linux.

## Revisión y límites de cierre

La revisión inicial puntuó 7,8/10; tras corregir sus hallazgos, la revisión final dirigida puntuó 8,5/10 sin hallazgos críticos ni altos. El lanzador superó 12 pruebas, incluida la caída de un proceso de prueba real y la liberación de ambos puertos. La limpieza se refiere a los servicios actuales: Uvicorn sin recarga y Vite; no demuestra el control universal de procesos demonizados o descendientes arbitrarios. La ejecución real en POSIX y CI remoto, así como hosting y SLA de producción, siguen pendientes. Queda como mejora no bloqueante reforzar la limpieza de la prueba de procesos reales si la propia prueba falla o agota su tiempo.
