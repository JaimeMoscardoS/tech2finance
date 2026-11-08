# Colaboración del equipo

## Qué es

Reparto inicial para cinco personas que trabajan en una única aplicación. Los nombres y las tareas concretas se acuerdan en el equipo; las carpetas existentes describen responsabilidades y no son aplicaciones independientes.

## Reparto

1. **Frontend:** pantallas, navegación, tres niveles de detalle, formularios y gráficos. Consume ejemplos compartidos mientras se terminan las conexiones.
2. **Backend e integración:** coordina los contratos desde el principio, rutas de servidor, validación, conexión entre módulos, configuración y despliegue. Cada responsable ayuda a integrar su módulo: la persona 2 no asume sola todos los fallos.
3. **Simulador y motor:** cálculos de cartera hipotética, escenarios, supuestos y propuestas educativas automáticas sin ejecución ni cambios de saldo; pruebas matemáticas.
4. **Tutor de IA y voz:** integración de Claude desde el servidor, contexto de pantalla, simulación y cartera; ElevenLabs como opción si hay tiempo.
5. **Producto, datos, pruebas y presentación:** recorrido del usuario, datos ficticios y cartera de ejemplo, pruebas funcionales, documentación, coordinación de GitHub, diapositivas, pitch y ensayo. Trabaja desde el inicio con las personas 1 y 3.

## Coordinación

- Usad el [acuerdo de integración](contratos.md) como propuesta inicial compartida; acordad cambios antes de implementarlos. Las interfaces TypeScript finales están pendientes.
- Definid con claridad quién modifica los archivos compartidos. Cada tarea tiene su rama y su pull request, revisado por otra persona.
- Cread una issue por tarea concreta, con responsable, resultado esperado y dependencias.
- La persona 5 prepara desde el principio datos de ejemplo acordados con las personas 2, 3 y 4, para que frontend y tutor puedan avanzar sin esperar al motor.
- Nunca subáis claves, tokens, contraseñas ni datos reales de clientes. Usad variables de entorno y ejemplos sin secretos.
- La presentación distingue funciones comprobadas, pendientes y visión futura; los beneficios comerciales son hipótesis hasta validarlos.