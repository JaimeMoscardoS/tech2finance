# Frontend de Tech2Finance

## Qué es

Interfaz educativa React/TypeScript para explorar fondos, simular aportaciones, comparar ejemplos y entender una caída. Ofrece tres niveles, español e inglés, temas claro y oscuro y voz local opcional. La demo no conecta cuentas ni realiza operaciones.

## Datos y simulación

El catálogo identifica cinco casos de estudio por gestora e ISIN. BancoT2F es el anfitrión simulado; sus condiciones no se atribuyen a esos fondos. Los riesgos, plazos, mínimos y costes adicionales desconocidos se presentan como tales. El modo local usa `shared/demo-data.json`, `shared/nav-history.json` y `shared/data-manifest.json`; el modo servidor obtiene el catálogo v2 y cálculos desde FastAPI. No cambia automáticamente de modo ante errores. Una respuesta de catálogo o simulación incompatible activa la recuperación explícita.

Las series usan 73 cierres mensuales de valor liquidativo observados y publicados por la CNMV, desde diciembre de 2019 hasta diciembre de 2025: se selecciona la última observación diaria real de cada mes, sin interpolar, repetir ni extrapolar. Los archivos, hashes y condiciones de reutilización constan en la fuente compartida; las muestras antiguas quedan en snapshots separados. Cada resultado identifica instrumento, moneda y fechas. El valor liquidativo refleja gastos incorporados al fondo; el cálculo no añade costes externos ni impuestos. La frecuencia predeterminada es mensual: esas aportaciones se suman después de cada cierre. Las anuales se suman en los meses 12, 24 y sucesivos desde el inicio, sin prorrateo. En un plazo inferior a 12 meses no se suma ninguna aportación anual. Los resultados pasados no predicen resultados futuros.

La cartera de ejemplo y «Probar una caída» comparten el caso BBVA Mi Inversión Bolsa Acumulación, ISIN ES0125269003, con 1.000 € de capital de práctica, sin aportaciones, entre el 31 de diciembre de 2019 y el 31 de marzo de 2020. La pausa muestra el dato observado y, cuando coincide con el periodo, un hecho público de la OMS con fecha y enlace; su coincidencia no demuestra causalidad. La persona conserva la decisión.

Explorar muestra los fondos permitidos para el anfitrión, o filtra por emisor para una entidad configurada. La comparación utiliza series compatibles; CSV incluye los cierres, fuente, ISIN, moneda, versión y hashes. La práctica guiada compara aportaciones, plazos o instrumentos con condiciones compatibles y descarta resultados anteriores al editar. La muestra anual publicada previa permanece como método auxiliar de referencia, no como serie de NAV.

## Ejecutar y comprobar

Con Node 22.12 o superior:

```bash
npm ci
npm run dev
npm test
npm run build
npx playwright test
```

Arranca el backend conforme a [su README](../backend/README.md). La API local de demo no utiliza autenticación ni conecta proveedores externos. Vite reenvía `/api` al puerto 8000 por defecto; `T2F_BACKEND_PORT` permite otro puerto. Playwright requiere Chrome y acepta `T2F_PYTHON` para seleccionar el Python con dependencias. `VITE_BANK_ID` admite `demo`, `caixabank`, `bbva` y `santander`; una entidad desconocida produce un error. El filtro de interfaz no sustituye autorización del servidor.

El tutor funciona por reglas, no utiliza LLM ni proveedores de voz remotos. El dictado y la lectura dependen de capacidades locales del dispositivo y conservan alternativa escrita. El gráfico ofrece tabla accesible y navegación por teclado. La comprobación con lectores de pantalla físicos sigue pendiente. El componente CountUp procede de React Bits; su licencia figura en `REACT-BITS-LICENSE.md`.
