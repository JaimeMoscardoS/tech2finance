# BancoT2F: registro de ejecución

## Qué es

Registro de decisiones, comprobaciones y revisiones de la integración de BancoT2F.

- Base local: `6f56d5c2eb022dd0d1bed1c75e1729d5d13ab628`; rama base `integration/bank-demo-base`, pendiente de publicación.
- Baseline en esta base: frontend 39/39 y build correcto con avisos Rolldown; backend 54/54 con advertencia Starlette; simulador 21/21.
- Contrato y plan aprobados por coordinación antes de implementación. Prerrevisión semántica: datos → API → tutor e interfaz; los tipos son compartidos y las comisiones no entran en cálculos. Revisión independiente y pruebas integradas pendientes.
- Revisiones: máximo cuatro rondas, mínimo 8/10 por revisor, sin críticos ni altos abiertos; no iniciar una quinta. Límite de seis agentes simultáneos; escritura Terra, revisión Sol en solo lectura.
