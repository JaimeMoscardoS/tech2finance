# Integración local de las cinco líneas

## Qué es

Procedimiento ejecutado en una worktree aislada para comprobar las cinco ramas. La coordinación central aceptó la integración local tras las comprobaciones registradas en el [acta](evidence/integration/resultado.md). No acredita integración en `main`, CI remota ni despliegue.

## Preparación y límites

1. Registrar fecha, responsable, versiones exactas de las cinco ramas y estado de sus revisiones. Esperar commit revisable de 04 y no sustituir el contenido de ninguna rama activa.
2. Tras comprobar que la ruta y rama están libres, crear `C:\proyectos\tech2finance-directors\20261110\06-integration` en la rama `verification/directors-20261110` desde `42d523316872d469ec9bcdb8ba25b436408b37cc`. Integrar mediante merges locales las cinco versiones, incluido el commit de 05, y documentar conflictos, resolución y autor. No hacer push, reset ni modificar `main` o la rama de investigación.
3. Instalar con `npm ci` en el frontend de la worktree aislada y usar el `.venv` Python del checkout original, ejecutando las pruebas desde la worktree de integración. Registrar versiones, instalaciones y comandos reales; si algo falla, conservar evidencia y distinguir error de entorno, regresión y falta de permisos.
4. Para la prueba integrada, ejecutar `npm run dev:full` en primer plano con `T2F_PYTHON` apuntando al Python del `.venv` original, `T2F_BACKEND_PORT=8095` y `T2F_FRONTEND_PORT=5175`. Comprobar antes que ambos puertos están libres. Al finalizar detener solo los procesos de este ensayo y comprobar que 8095 y 5175 quedan libres y que los servicios originales en 8000 y 5173 siguen sanos.
5. Crear únicamente en la worktree de integración `frontend/playwright.integration.config.ts`, temporal y sin commit, con `testDir: 'tests'`, canal Chrome, headless y `baseURL` en el puerto 5175, sin `webServer`. No reutilizar la configuración Playwright que apunta al backend original 8000: esa instancia no contiene los cambios de las líneas 03 y 04.

## Comprobaciones previstas y ejecutadas

El [acta](evidence/integration/resultado.md) distingue las comprobaciones realmente ejecutadas y sus límites de esta lista; no todas las verificaciones de accesibilidad o servicio están completas.

- Ejecutar las 12 pruebas del lanzador, pruebas unitarias y build frontend, suite completa backend, simulador legacy, `pip check`, comprobación del tutor y `python -m backend.verify_data`; guardar comandos, salidas, conteos y revisión de fallos. Ejecutar una vez la suite Playwright en serie con `--workers=1` y la configuración temporal; no repetir el conjunto completo si pasa.
- Comprobar el lanzador y proxy en puertos libres, carga y recuperación explícita del catálogo, cancelación por cambio de modo y respuestas tardías.
- Antes de Playwright, comprobar por el proxy que el catálogo y simulación contienen procedencia de 03 y que la API aplica el control de alcance del tutor 04. Verificar que los metadatos aditivos no rompen consumidores y que la ruta local TypeScript no se presenta como versionada.
- Recorrer tutor y límites de alcance, respuestas de abstención y seguimiento, cifras y ausencia de presión a mantener. Verificar controles de teclado y registrar los lectores de pantalla realmente probados.
- Copiar registros acotados y referencias reales al área de evidencia de 05; registrar hallazgos, severidad, responsables, capturas y resultado. Ante un fallo nuevo, diagnosticar y pedir al propietario que corrija su rama; no parchear la worktree de integración. Bloquear la aceptación con errores críticos o altos sin resolver. Un resultado local no sustituye CI remota, revisión financiera, jurídica, licencia ni ensayo con usuarios.

## Acta de ejecución

- Estado: integración local aceptada por coordinación; persona nominal `UNASSIGNED`. Fecha: 10-11-2026.
- Commit inicial `cba2d989492315f4d1682d1b8f8e5bf43e46028d`; final `dbc7e61fa1f06af165666a8d1911afe188281d98`.
- Los merges locales no presentaron conflictos; el caso anual falló inicialmente y pasó después de la corrección de 04.
- Comandos, versiones, resultados y límites constan en el [acta de evidencia](evidence/integration/resultado.md). CI remota y `main` siguen sin acreditar por este trabajo.
