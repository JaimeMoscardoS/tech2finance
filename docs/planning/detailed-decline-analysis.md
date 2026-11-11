# Análisis detallado de una caída

## Qué es

Informe educativo contextual con seis apartados y fuentes, generado automáticamente al abrir la pausa. El modo local utiliza reglas; el servidor puede devolver reglas o IA cuando esté configurada.

## Aceptación y reparto

La interfaz distingue modo demo e IA, mantiene visibles los datos observados ante errores y permite reintentar o actualizar el contexto sin solicitar en cada edición. Debe cancelar solicitudes obsoletas y conservar idioma, accesibilidad y fuentes. El ejecutor de interfaz es responsable de `frontend/`; el ejecutor de tutor y backend implementa y verifica el contrato y el proveedor, sin modificar históricos.

## Estado y verificación de fuentes

Implementado en rama, sin desplegar; la ejecución real de Sonnet sigue pendiente de credenciales y prueba. El usuario eligió Claude Sonnet; el proveedor utiliza como modelo predeterminado `claude-sonnet-5-5`. Las fuentes incluyen el informe de caída y, cuando corresponden al periodo observado, los documentos públicos de OMS, ESMA y BCE; no hay noticias en tiempo real. Los enlaces se validan como HTTPS. Las explicaciones de mecanismos son hipótesis generales, no causas acreditadas, y no se inventan posiciones de cartera.

La clave no se encontró en las variables de entorno de proceso, usuario o máquina ni en la configuración visible del proyecto; se ha solicitado su ubicación. No hay prueba de llamada real al modelo. El modo servidor sin proveedor configurado se identifica como demo. La interfaz se verificó con 48 pruebas Playwright, incluidas respuestas de IA simuladas explícitamente, otras dos pruebas afectadas y seis pruebas focales posteriores al ajuste de foco. La verificación final del responsable obtuvo 78 pruebas unitarias, compilación, 174 pruebas de backend, 13 del lanzador y 116 evaluaciones correctas. La API devolvió seis secciones y cuatro fuentes en modo demo. Las revisiones dirigidas obtuvieron 9/10 en interfaz y 8,7/10 en backend. El filtro de respuestas es heurístico y no garantiza detectar todas las formulaciones; la conexión real a Sonnet sigue pendiente de credenciales y prueba. Los cambios se preparan en `feature/detailed-sonnet-analysis`, sin integrar ni desplegar.

Tras incorporar `origin/main`, pasaron 78 pruebas unitarias, la compilación y 40 pruebas Playwright de análisis, pausa, selector de nivel y voz. La compilación emitió avisos de tamaño y directivas de dependencias. El conflicto de integración se limitó a combinar las propiedades de la pausa con la restauración de foco de voz.
