# Integración local de las cinco líneas

## Qué es

Procedimiento propuesto, **pendiente de ejecución**, para comprobar la interacción entre las cinco ramas en una worktree temporal. La coordinación central asignará la ejecución y registrará el resultado. No acredita integración en `main`, publicación ni despliegue.

## Preparación y límites

1. Registrar fecha, responsable, versiones exactas de las cinco ramas y estado de sus revisiones. Esperar commit revisable de 04 y no sustituir el contenido de ninguna rama activa.
2. Crear una rama y worktree aisladas desde la base común, tras comprobar que la ruta está libre. Integrar las cinco versiones mediante merges locales revisables; documentar conflictos, resolución y su autor. No modificar `main` ni la rama de investigación.
3. Registrar entorno, versiones, instalaciones y comandos reales; si una dependencia o ejecución falla, conservar evidencia y distinguir error de entorno, regresión y falta de permisos. No arrancar procesos en segundo plano ni detener servicios ajenos.

## Comprobaciones pendientes

- Ejecutar pruebas y build aplicables de frontend, backend, simulador y lanzador, además de `python -m backend.verify_data`; guardar comandos, salidas, conteos y revisión de fallos.
- Comprobar el lanzador y proxy en puertos libres, carga y recuperación explícita del catálogo, cancelación por cambio de modo y respuestas tardías.
- Verificar que los metadatos aditivos de procedencia del servidor no rompen consumidores y que la ruta local TypeScript no se presenta como versionada.
- Recorrer tutor y límites de alcance, respuestas de abstención y seguimiento, cifras y ausencia de presión a mantener. Verificar controles de teclado y registrar los lectores de pantalla realmente probados.
- Registrar hallazgos, severidad, responsables, capturas y resultado; bloquear la aceptación con errores críticos o altos sin resolver. Un resultado local no sustituye CI remota, revisión financiera, jurídica, licencia ni ensayo con usuarios.

## Acta pendiente

- Estado: `pending`; responsable nominal: `UNASSIGNED`; fecha y commit de integración: pendientes.
- Ramas y HEAD utilizados: pendientes; conflictos y resolución: pendientes.
- Comandos, salidas y pruebas no ejecutadas: pendientes.
- Hallazgos, decisiones y evidencia: pendientes. No se han ejecutado estas comprobaciones de integración.
