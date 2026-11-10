# Práctica interactiva de demostración

## Qué es

Tres experimentos educativos A/B dentro de la sección del simulador existente: aportaciones, horizonte y comparación de activos. El capital y las series ficticias se identifican; el ejemplo anual publicado conserva sus límites y no se presenta como predicción.

## Responsabilidades

- Dominio: construcción y validación de pares de especificaciones y comentarios derivados de los resultados, con pruebas de casos límite.
- Interfaz: controles accesibles, ejecución y cancelación de ambos escenarios, selección A/B y presentación de resultados, fuentes, supuestos y límites.
- Integración: navegación, adaptador local/servidor, aislamiento del contexto del tutor, documentación y pruebas de navegador con backend real.

## Contrato

La práctica reutiliza `SimulationSpec` y `SimulationResult`; el adaptador devuelve `ServerSimulation` con identificador, moneda, momento de aportación, fuentes y supuestos en ambos modos. La interfaz llama dos veces a `calculate(spec, signal)`, descarta respuestas obsoletas y comunica al contenedor el resultado seleccionado o `null`. El tutor recibe solo los parámetros de la opción activa y el servidor recalcula sus hechos. No se añaden páginas, rutas HTTP, bases de datos ni proveedores externos.

## Criterios de aceptación

- Aportaciones modifica solo el flujo; horizonte utiliza la misma serie ficticia y sin aportaciones; activos compara series ficticias con los mismos importes y periodos. La serie anual permanece fija en cinco años.
- Los resultados se calculan en el modo elegido, con errores visibles y sin sustitución silenciosa. Cambiar parámetros, lección, modo o salir invalida los resultados anteriores.
- La selección A/B actualiza el contexto del tutor; antes de completar la pareja no se transmiten resultados anteriores. No se puntúa según ganancia ni se dan recomendaciones.
- Comprobar límites, cero, fallos, cancelación y respuestas tardías; recorrer local y HTTP real, español/inglés, teclado y tamaños móviles. Revisar cálculos y experiencia antes de presentar el cambio.

## Verificación de esta rama

- Dominio: 7 pruebas específicas, incluidas alteraciones de trayectoria; revisión matemática R2 **9/10**, con 138 casos válidos y 10 alteraciones rechazadas. En aportaciones, B debe ser mayor que cero; en activos se admiten capital y aportación cero.
- Navegador: **43/43 pruebas Playwright** en conjunto, incluida la práctica con backend HTTP real y modo local, selección A/B para el tutor, error de servidor, invalidación y respuesta tardía. La revisión de accesibilidad R2 obtuvo **9/10** tras corregir foco, aviso de estado y contraste.
- Frontend: **23/23 pruebas unitarias** y compilación de producción comprobadas. La práctica y sus gráficos se cargan de forma diferida.
- La revisión visual y automatizada no equivale a probar lectores de pantalla reales ni a certificar WCAG. No se han modificado las API ni el motor del backend en esta rama.
