# BancoT2F: especificación

## Qué es

Una entidad bancaria ficticia que aporta contexto coherente al catálogo, la práctica, el tutor y la pausa de cartera de la demostración, en español e inglés.

El perfil compartido identifica la muestra sintética, servicios, condiciones, productos, comisiones y preguntas frecuentes. No hay clientes, saldos, cuentas, órdenes ni conexiones reales. Los mínimos son cero; las comisiones son informativas y no se descuentan del simulador. Los productos y fuentes de entidades reales conservan su identidad y procedencia. Las series y cálculos existentes no cambian.

El backend expone el perfil por `bankId` opcional, con `demo` por defecto, identificador desconocido 400 y campos extra 422. El tutor recibe el perfil y solo el producto seleccionado en exploración o simulación; la interfaz usa el mismo perfil en todas las páginas. El historial de voz se limita a ocho mensajes en la sesión. La demo documenta diez preguntas, respuesta esperada, fuente y pasos previos.
