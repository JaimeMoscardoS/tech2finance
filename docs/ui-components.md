# Componentes de interfaz

## Qué es

`ShinyButton` es un botón React nativo reutilizable, con borde azul animado y compatibilidad con movimiento reducido. Se encuentra en `frontend/src/components/ui` para agrupar componentes reutilizables; su CSS se importa desde el propio componente. No requiere Tailwind ni shadcn.

```tsx
import { ShinyButton } from './components/ui/shiny-button';

<ShinyButton onClick={openVoice}>Hablar con IA</ShinyButton>
```

Admite las propiedades de un botón HTML, incluido `disabled`, `aria-label` y `type`; su tipo predeterminado es `button`.

La carpeta `frontend/src/components/ui` cumple el papel de una carpeta compartida `components/ui` en esta aplicación Vite/React/TypeScript. Los estilos están junto al componente y se importan en él; como no se ha configurado el alias `@`, se usan rutas relativas.

### Tailwind y shadcn opcionales

No se han instalado para este botón. Si se necesitan en otro cambio, las guías oficiales para [Tailwind con Vite](https://tailwindcss.com/docs/installation/using-vite) y [shadcn en un proyecto Vite existente](https://ui.shadcn.com/docs/installation/vite) describen su configuración. Desde `frontend`, Tailwind indica `npm install tailwindcss @tailwindcss/vite`, añadir el plugin a Vite y su importación CSS; shadcn requiere además configurar el alias en TypeScript y Vite antes de ejecutar `npx shadcn@latest init`. Revisar el efecto del reset Preflight sobre los estilos existentes antes de aplicarlo; no reemplazar el CSS actual sin evaluar regresiones.

La voz muestra una barra no modal, sin bloquear la página. La entrada escrita y la respuesta aparecen solo a petición; usan el mismo proveedor, contexto e historial limitado que el dictado. En modo local, el reconocimiento se ejecuta únicamente si el navegador confirma procesamiento local; en modo servidor se consulta el proveedor configurado y, si es ElevenLabs, se avisa de que recibirá el audio antes de capturarlo. La lectura de la respuesta utiliza voz local. El panel envía una transcripción final por turno; el chat escrito permite revisarla antes del envío. Al cerrar o cambiar el contexto se cancelan reconocimiento, reproducción y petición activa; no se reinicia el micrófono automáticamente. El proveedor real de cada respuesta se muestra a partir de su metadata validada. La conexión real con proveedores está pendiente de configurar y comprobar.
