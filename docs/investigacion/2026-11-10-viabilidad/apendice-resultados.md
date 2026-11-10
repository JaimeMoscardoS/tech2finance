# Resultados estructurados de investigación

Los campos inciertos se presentan como preguntas de validación, no como hechos.

## Interfaz y experiencia

### Diagnóstico y evidencia

- **Estado observado:** Tres experimentos y ejemplos ficticios; sin auditoría de accesibilidad acreditada.
- **Demanda:** Comprensión incremental y disposición a pagar desconocidas.
- **Evidencia:** frontend/src/PracticeLab.tsx; frontend/src/practice-domain.ts
- **Brecha por etapa:** Piloto sintético: pruebas con usuarios, accesibilidad y contenido aprobado.

### Ejecución

- **Acciones:** Piloto sintético: pruebas con usuarios, accesibilidad y contenido aprobado.
- **Responsable:** Persona 1; responsable de producto aprueba.
- **Aceptación:** Teclado y lector probados; rúbrica y errores críticos resueltos.
- **Dependencias:** Cohorte y contenido.
- **Costes:** Horas UX y auditoría externa por cotizar.
- **Fuentes:** frontend/src/PracticeLab.tsx

### Pendiente de validar

- Demanda y presupuesto: responsable comercial; validar con compradores.
- Coste y capacidad: dirección y responsable de servicio; validar mediante cotizaciones y planificación.

## Backend e integración

### Diagnóstico y evidencia

- **Estado observado:** API FastAPI local y puente Node; sin conexión bancaria ni identidad de usuario documentada.
- **Demanda:** Necesidad y método de integración por banco sin validar.
- **Evidencia:** backend/app.py; backend/tutor_bridge.py
- **Brecha por etapa:** Alojamiento sintético con controles proporcionales; identidad y aislamiento antes de datos reales.

### Ejecución

- **Acciones:** Alojamiento sintético con controles proporcionales; identidad y aislamiento antes de datos reales.
- **Responsable:** Persona 2; responsable de servicio aprueba.
- **Aceptación:** Restauración y controles probados; autorización por recurso y ausencia de accesos cruzados cuando aplique.
- **Dependencias:** Arquitectura, contrato y datos.
- **Costes:** Hosting, soporte y seguridad por cotizar.
- **Fuentes:** backend/app.py

### Pendiente de validar

- Demanda y presupuesto: responsable comercial; validar con compradores.
- Coste y capacidad: dirección y responsable de servicio; validar mediante cotizaciones y planificación.

## Simulador y motor

### Diagnóstico y evidencia

- **Estado observado:** La API usa cálculo periódico Python; motor histórico independiente aislado.
- **Demanda:** Valor incremental y universo de instrumentos sin validar.
- **Evidencia:** backend/domain/__init__.py; simulador/periodic.py
- **Brecha por etapa:** Autoridad de cálculo, validación independiente y versiones reproducibles.

### Ejecución

- **Acciones:** Autoridad de cálculo, validación independiente y versiones reproducibles.
- **Responsable:** Persona 3; responsable técnico aprueba con revisión independiente.
- **Aceptación:** Casos límite y muestras reconciliadas; reproducción histórica.
- **Dependencias:** Derechos de datos y especificación financiera.
- **Costes:** Revisión cuantitativa y derechos sin cotización.
- **Fuentes:** simulador/periodic.py

### Pendiente de validar

- Demanda y presupuesto: responsable comercial; validar con compradores.
- Coste y capacidad: dirección y responsable de servicio; validar mediante cotizaciones y planificación.

## IA, voz y conducta

### Diagnóstico y evidencia

- **Estado observado:** Tutor por reglas; voz local condicionada al dispositivo; proveedores remotos propuestos.
- **Demanda:** Beneficio de LLM y voz no demostrado.
- **Evidencia:** tutor-ia/src/local-tutor.ts; frontend/src/voice/browser-voice.ts
- **Brecha por etapa:** Evaluación comparativa, límites de conducta y gestión de proveedores antes de integrarlos.

### Ejecución

- **Acciones:** Evaluación comparativa, límites de conducta y gestión de proveedores antes de integrarlos.
- **Responsable:** Persona 4; responsable técnico aprueba.
- **Aceptación:** Pruebas de cifras, fuentes, abstención, liquidez y caída; alternativa escrita.
- **Dependencias:** Contenido aprobado y corpus de evaluación.
- **Costes:** Consumo hipotético en modelo_costes.py; contrato empresarial desconocido.
- **Fuentes:** tutor-ia/src/local-tutor.ts

### Pendiente de validar

- Demanda y presupuesto: responsable comercial; validar con compradores.
- Coste y capacidad: dirección y responsable de servicio; validar mediante cotizaciones y planificación.

## Datos, calidad y presentación

### Diagnóstico y evidencia

- **Estado observado:** Datos ficticios y cinco tasas publicadas de una clase; derechos comerciales no verificados.
- **Demanda:** Cobertura exacta y precio de los datos sin verificar.
- **Evidencia:** shared/demo-data.json; docs/contratos.md
- **Brecha por etapa:** Registro por fuente y uso, control de versiones y trazabilidad.

### Ejecución

- **Acciones:** Registro por fuente y uso, control de versiones y trazabilidad.
- **Responsable:** Persona 5; producto aprueba con apoyo jurídico.
- **Aceptación:** Derechos o fundamento documentado por fuente; correcciones y datos insuficientes gestionados.
- **Dependencias:** Proveedor y universo.
- **Costes:** Licencias y aseguramiento de calidad por cotizar.
- **Fuentes:** shared/demo-data.json

### Pendiente de validar

- Demanda y presupuesto: responsable comercial; validar con compradores.
- Coste y capacidad: dirección y responsable de servicio; validar mediante cotizaciones y planificación.

## Dirección empresarial integrada

### Diagnóstico y evidencia

- **Estado observado:** Cinco responsabilidades técnicas; sin banco conectado ni acuerdo comercial confirmado.
- **Demanda:** Comprador, presupuesto, ACV y disposición a pagar no verificados.
- **Evidencia:** README.md; docs/contexto-proyecto.md
- **Brecha por etapa:** Asignar comercial, producto, operación y apoyos externos sin presumir capacidad adicional.

### Ejecución

- **Acciones:** Asignar comercial, producto, operación y apoyos externos sin presumir capacidad adicional.
- **Responsable:** Fundador comercial; producto/dirección decide.
- **Aceptación:** Problema recurrente, sponsor, condiciones de piloto y decisión verificables.
- **Dependencias:** Descubrimiento, acceso a usuarios, revisión jurídica.
- **Costes:** Caja, integración, atención y licencias sin cuantificar.
- **Fuentes:** docs/contexto-proyecto.md

### Pendiente de validar

- Demanda y presupuesto: responsable comercial; validar con compradores.
- Coste y capacidad: dirección y responsable de servicio; validar mediante cotizaciones y planificación.
