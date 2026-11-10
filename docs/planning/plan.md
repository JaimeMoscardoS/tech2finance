# Plan de preparación de Tech2Finance

> **Ejecución:** cada línea desarrolla sus tareas con revisión independiente conforme a AGENTS.md. Cada estado requiere evidencia verificable.

**Objetivo:** preparar una demo educativa y una propuesta exploratoria de piloto sintético con barreras explícitas para datos personales y servicio bancario.
**Arquitectura:** cinco líneas coordinan experiencia, plataforma, datos/motor, tutor y producto sin cambiar la numeración humana. Véase [manifiesto](manifest.json).
**Stack:** React/TypeScript, FastAPI/Python y tutor local Node por reglas.
**Fuente:** [investigación de viabilidad, PR 13](https://github.com/JaimeMoscardoS/tech2finance/pull/13), aún no integrada en esta base.

## Restricciones y revisión

- El informe declara «No consta un banco conectado, contrato, clientes de pago ni efecto educativo medido» y «La “pausa para comprender” debe dejar libre la salida».
- P0: cimientos locales; P1: piloto sintético condicionado; P2: datos personales y servicio empresarial bloqueados por condiciones externas. Una encuesta o contacto identificable puede implicar datos personales aunque la cartera sea ficticia.
- `pending`, `in_progress`, `blocked_external`, `done`: evidencia vacía no acredita realización. Al bloquear, registrar dependencia externa; no cerrar padres antes de sus hijas y aceptación. Todas las personas y horas están sin asignar.
- Cada hija representa 30–60 minutos acotados; contratación, participantes y revisiones externas necesitan tiempo adicional. Las ventanas 30/60/90 días son orientativas.
- Comprobar derechos y series insuficientes (B04), cifras no reconciliadas (B05–B06), presión a mantener (B03/B07/B09), barreras de teclado y lector (B08), y datos personales inadvertidos en texto, voz o encuestas (B11).

## Tareas

Cada tarea deriva del «Backlog prioritario» del informe; las funciones indicadas no son nombramientos. Cada hija se comprueba mediante su artefacto o evidencia indicada; resultados y dependencias se registran en el manifiesto.

### [ ] B01 · Responsables y capacidad

**Fase:** P0; **línea:** 05-product; **función responsable:** Producto; persona UNASSIGNED.
**Dependencias:** ninguna identificada en el backlog.
**Aceptación:** preparar matriz de funciones y registrar personas y horas acordadas, documentados y revisados; evidencia registrada.
**Pendiente externo:** Capacidad acordada. **Parada:** Sin capacidad acordada no comprometer plazos.

- [x] B01.1: Preparar matriz de funciones (30–60 min); borrador en `docs/organizacion.md`.
- [ ] B01.2: Registrar personas y horas acordadas (30–60 min).

### [ ] B02 · Entrevistas a compradores

**Fase:** P1; **línea:** 05-product; **función responsable:** Comercial; persona UNASSIGNED.
**Dependencias:** ninguna identificada en el backlog.
**Aceptación:** adaptar guía de preguntas y registrar problema, alternativa, presupuesto y criterios, documentados y revisados; evidencia registrada.
**Pendiente externo:** Acceso a compradores. **Parada:** Sin responsable revisar ICP.

- [ ] B02.1: Adaptar guía de preguntas (30–60 min).
- [ ] B02.2: Registrar problema, alternativa, presupuesto y criterios (30–60 min).

### [ ] B03 · Prueba de aprendizaje

**Fase:** P1; **línea:** 05-product; **función responsable:** Producto y pedagogía; persona UNASSIGNED.
**Dependencias:** B04.
**Aceptación:** congelar rúbrica y comparador y registrar resultados y errores, documentados y revisados; evidencia registrada.
**Pendiente externo:** Participantes y contenido revisado. **Parada:** Detener presión a mantener.

- [ ] B03.1: Congelar rúbrica y comparador (30–60 min).
- [ ] B03.2: Registrar resultados y errores (30–60 min).

### [ ] B04 · Registro de derechos

**Fase:** P0; **línea:** 03-data; **función responsable:** Datos y jurídico; persona UNASSIGNED.
**Dependencias:** ninguna identificada en el backlog.
**Aceptación:** inventariar fuente, clase y usos y asociar permiso escrito o excluir fuente, documentados y revisados; evidencia registrada.
**Pendiente externo:** Derechos por escrito. **Parada:** Excluir fuentes sin derechos resueltos.

- [ ] B04.1: Inventariar fuente, clase y usos (30–60 min).
- [ ] B04.2: Asociar permiso escrito o excluir fuente (30–60 min).

### [ ] B05 · Cálculo autoritativo

**Fase:** P0; **línea:** 03-data; **función responsable:** Motor y revisor financiero; persona UNASSIGNED.
**Dependencias:** B04.
**Aceptación:** preparar supuestos y fixtures independientes y reconciliar casos límite, documentados y revisados; evidencia registrada.
**Pendiente externo:** Revisión financiera independiente. **Parada:** No usar cifras no reconciliadas.

- [ ] B05.1: Preparar supuestos y fixtures independientes (30–60 min).
- [ ] B05.2: Reconciliar casos límite (30–60 min).

### [ ] B06 · Versionar datos y cálculos

**Fase:** P0; **línea:** 03-data con apoyo de 02-platform; **función responsable:** Backend; persona UNASSIGNED.
**Dependencias:** B04, B05.
**Aceptación:** definir identificadores de versiones y reproducir resultado anterior, documentados y revisados; evidencia registrada.
**Pendiente externo:** Procedencia verificable. **Parada:** Parar sin procedencia.

- [ ] B06.1: Definir identificadores de versiones (30–60 min).
- [ ] B06.2: Reproducir resultado anterior (30–60 min).

### [ ] B07 · Evaluar reglas frente a LLM

**Fase:** P1; **línea:** 04-tutor; **función responsable:** IA y cumplimiento; persona UNASSIGNED.
**Dependencias:** B03, B05.
**Aceptación:** congelar batería con fuentes y abstenciones y comparar fidelidad y costes, documentados y revisados; evidencia registrada.
**Pendiente externo:** Revisión de cumplimiento. **Parada:** No incorporar LLM si empeora fidelidad.

- [ ] B07.1: Congelar batería con fuentes y abstenciones (30–60 min).
- [ ] B07.2: Comparar fidelidad y costes (30–60 min).

### [ ] B08 · Accesibilidad del flujo

**Fase:** P1; **línea:** 01-experience; **función responsable:** Interfaz y especialista; persona UNASSIGNED.
**Dependencias:** ninguna identificada en el backlog.
**Aceptación:** probar teclado y registrar barreras y probar lector y verificar correcciones, documentados y revisados; evidencia registrada.
**Pendiente externo:** Especialista de accesibilidad. **Parada:** Bloquear piloto ante barreras críticas.

- [ ] B08.1: Probar teclado y registrar barreras (30–60 min).
- [ ] B08.2: Probar lector y verificar correcciones (30–60 min).

### [ ] B09 · Perímetro y conducta

**Fase:** P0; **línea:** 04-tutor; **función responsable:** Producto y abogado financiero; persona UNASSIGNED.
**Dependencias:** ninguna identificada en el backlog.
**Aceptación:** reunir pantallas y respuestas y registrar revisión, prestador y exclusiones, documentados y revisados; evidencia registrada.
**Pendiente externo:** Revisión jurídica humana. **Parada:** Detener recomendaciones personales no autorizadas.

- [ ] B09.1: Reunir pantallas y respuestas (30–60 min).
- [ ] B09.2: Registrar revisión, prestador y exclusiones (30–60 min).

### [ ] B10 · Operación sintética

**Fase:** P1; **línea:** 02-platform; **función responsable:** Servicio y seguridad; persona UNASSIGNED.
**Dependencias:** ninguna identificada en el backlog.
**Aceptación:** documentar despliegue y registros y ensayar alertas y restauración, documentados y revisados; evidencia registrada.
**Pendiente externo:** Hosting y responsable de servicio. **Parada:** No ofrecer SLA sin medir.

- [ ] B10.1: Documentar despliegue y registros (30–60 min).
- [ ] B10.2: Ensayar alertas y restauración (30–60 min).

### [ ] B11 · Mapa de datos y proveedores

**Fase:** P2; **línea:** 02-platform; **función responsable:** Privacidad y seguridad; persona UNASSIGNED.
**Dependencias:** ninguna identificada en el backlog.
**Aceptación:** validar flujos y roles y documentar acuerdos y decisión eipd/dpo, documentados y revisados; evidencia registrada.
**Pendiente externo:** Contrato de datos, DPA y decisión EIPD/DPO cuando proceda. **Parada:** No introducir PII antes de cerrar condiciones.

- [ ] B11.1: Validar flujos y roles (30–60 min).
- [ ] B11.2: Documentar acuerdos y decisión EIPD/DPO (30–60 min).

### [ ] B12 · Propuesta y contrato de piloto

**Fase:** P1; **línea:** 05-product; **función responsable:** Comercial y jurídico; persona UNASSIGNED.
**Dependencias:** B02, B03, B04, B09.
**Aceptación:** fijar alcance y aceptación negociable y revisar pagos, soporte, ip, incidentes y salida, documentados y revisados; evidencia registrada.
**Pendiente externo:** Sponsor, presupuesto y contrato. **Parada:** No prometer producción.

- [ ] B12.1: Fijar alcance y aceptación negociable (30–60 min).
- [ ] B12.2: Revisar pagos, soporte, IP, incidentes y salida (30–60 min).

### [ ] B13 · Costes y caja

**Fase:** P1; **línea:** 05-product; **función responsable:** Finanzas y servicio; persona UNASSIGNED.
**Dependencias:** ninguna identificada en el backlog.
**Aceptación:** inventariar costes y cotizaciones y revisar presupuesto y sensibilidad, documentados y revisados; evidencia registrada.
**Pendiente externo:** Cotizaciones y capacidad. **Parada:** No fijar margen con costes desconocidos.

- [ ] B13.1: Inventariar costes y cotizaciones (30–60 min).
- [ ] B13.2: Revisar presupuesto y sensibilidad (30–60 min).

### [ ] B14 · Decisión seguir, cambiar o parar

**Fase:** P1; **línea:** 05-product; **función responsable:** Producto y banco; persona UNASSIGNED.
**Dependencias:** B02, B03.
**Aceptación:** reunir evidencia y fallos y documentar decisión del responsable, documentados y revisados; evidencia registrada.
**Pendiente externo:** Decisión del comprador. **Parada:** No afirmar eficacia con muestra exploratoria.

- [ ] B14.1: Reunir evidencia y fallos (30–60 min).
- [ ] B14.2: Documentar decisión del responsable (30–60 min).
- [ ] B14.3: Preparar guion de presentación de tres minutos con demo verificada y plan ante fallos (30–60 min), después de integrar y revisar los hallazgos.

## Puertas de decisión

P0 no autoriza exposición externa. P1 requiere sponsor, presupuesto, participantes, información y consentimiento cuando proceda, derechos, contenido revisado, soporte y contrato aplicable; véase [kit de piloto](../pilot-kit/alcance.md). P2 requiere flujos reales y revisión de roles, base jurídica, proveedores, DPA firmado cuando proceda, decisión EIPD/DPO, retención, controles y salida. La aceptación de la entidad es adicional para un servicio bancario. Redactar este plan no acredita ninguna puerta.

## Artefactos y comprobaciones de las hijas

Cada archivo propuesto se crea o completa por la línea propietaria; no se presupone que exista. Las revisiones externas y pruebas se registran con fecha, responsable y enlace verificable. Los tiempos excluyen esperas externas. La matriz RACI inicial ya existe en [organización](../organizacion.md), pero sus nombramientos y horas no están acordados.

| Hija | Artefacto esperado | Comprobación de aceptación |
| --- | --- | --- |
| B01.1 | `docs/organizacion.md` | Matriz cubre cinco funciones existentes y producto, comercial, servicio, asesoría y seguridad sin nombramientos ficticios. **Hecho como borrador.** |
| B01.2 | Registro de capacidad y nombramientos | Cada función final tiene persona, horas semanales, fecha y aceptación; pendiente externo. |
| B02.1 | `docs/pilot-kit/estudio.md` | Cinco preguntas cubren problema, alternativas, presupuesto, acceso y decisión; adaptar y aprobar guía antes del uso. |
| B02.2 | Registro de entrevistas | Cada conversación tiene fecha, evidencia, problema, alternativa, presupuesto y responsable; ninguna inventada. |
| B03.1 | `docs/pilot-kit/estudio.md` | Revisor aprueba y congela versión de casos, control de mismos hechos, rúbrica y umbrales; borrador existente no supone aprobación. |
| B03.2 | Registro de sesiones y resultados | PRE, POST y día 14 trazan respuesta, ayuda y rúbrica; se documentan abandonos y fallos, sin fabricar participantes. |
| B04.1 | Inventario de fuentes y clases de la línea 03 | Cada serie contiene identificador, clase, fuente, usos y estado de derechos; se conservan fondos sin histórico. |
| B04.2 | Evidencia de derechos por fuente | Cada uso tiene permiso o fundamento escrito revisado, o exclusión explícita; la publicación no acredita licencia. |
| B05.1 | Especificación y fixtures independientes de línea 03 | Revisor puede recalcular aportaciones, costes, pérdidas y casos límite sin usar el motor bajo prueba. |
| B05.2 | Registro de reconciliación financiera | Cada fixture concuerda o bloquea el caso con discrepancia documentada por revisor independiente. |
| B06.1 | Registro de procedencia y contrato de versiones de línea 03 | Identifica datos y algoritmo por versión; línea 02 revisa consumo del contrato. |
| B06.2 | Prueba reproducible de línea 03 | Regenera un resultado anterior con versiones guardadas y compara salida y supuestos. |
| B07.1 | Batería versionada de línea 04 | Cada caso incluye contexto, fuente autorizada, salida esperada y abstención. |
| B07.2 | Informe comparativo de línea 04 | Resultados por caso, errores financieros, abstenciones y coste comparados; sin introducir LLM si empeora fidelidad. |
| B08.1 | Registro de recorrido de línea 01 | Cada pantalla y control se recorren con teclado, con barreras y evidencia. |
| B08.2 | Registro de lector de línea 01 | Lector y navegador identificados; cada barrera crítica se verifica corregida o bloquea el piloto. |
| B09.1 | Inventario de pantallas y mensajes de línea 04 | Incluye pausa, liquidez, venta y recomendaciones implícitas, con versión de cada texto. |
| B09.2 | Dictamen humano y decisión de perímetro | Jurídico identifica prestador, exclusiones y mensajes aceptados o bloqueados, con fecha. |
| B10.1 | Runbook de línea 02 | Identifica entorno, acceso, secretos, logs minimizados y responsable de soporte. |
| B10.2 | Registro de ensayo de línea 02 | Evidencia alertas y restauración verificadas; sin inventar disponibilidad o SLA. |
| B11.1 | Mapa de flujos de línea 02 y dossier de producto | Inventaria campos, proveedores, roles, transferencias y destinos reales, incluidos contacto y seudónimos. |
| B11.2 | Expediente de privacidad y contratos | Registra base, retención, DPA firmado cuando proceda y decisión EIPD/DPO de responsable humano. |
| B12.1 | `docs/pilot-kit/alcance.md` | Borrador incluye alcance, entregables, criterios, precio pendiente y exclusiones; negociación aún pendiente. |
| B12.2 | Borrador de acuerdo revisado | Pagos, soporte, IP, incidentes y salida tienen revisión humana y condiciones negociadas. |
| B13.1 | Registro de costes y cotizaciones | Identifica licencias, alojamiento, revisión, soporte e impuestos como importes documentados o desconocidos. |
| B13.2 | Presupuesto y sensibilidad | Hipótesis, costes, caja y sensibilidad revisados; no calcular margen cerrando desconocidos como cero. |
| B14.1 | Expediente de decisión | Reúne resultados, riesgos y fallos, fuente y versión sin presentar muestra como eficacia general. |
| B14.2 | Acta de decisión | Responsable designado registra fecha, evidencia y decisión seguir, cambiar o parar. |
| B14.3 | Guion en `presentacion/` | Persona 5, titular UNASSIGNED, prepara un pitch de tres minutos basado en la demo integrada y comprobada, con alternativa ante fallo; registra versión y límites sin inventar clientes, resultados o contratos. Depende de la integración local y revisión de hallazgos. No hay presentación implementada aún. |
