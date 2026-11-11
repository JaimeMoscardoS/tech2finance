# Simulador: «Máquina del tiempo» (propuesta aprobada, implementada en la rama)

**Estado:** diseño aprobado por ignacio-gl y su equipo el 2026-11-11. **Implementado y comprobado en la rama `feature/simulador-maquina-tiempo` (creada desde `main`, que ya incluye JaimeMoscardoS/tech2finance#29 y JaimeMoscardoS/tech2finance#32); no está en `main` ni integrado.** Pendiente: revisión con nota de `t2f-01-frontend-reviewer` y conformidad de mrta-rgb sobre la paleta «Marea». Detalles de uso y comprobación en `frontend/README.md`.

**Qué se implementó y qué no (implementación en la rama):**
- Hecho: pasos 1 y 2 con menos texto y el resultado del paso 2 compactado (el gráfico y la fuente pasan al paso 3 y a un desplegable «Más información»); paso 3 «Vive el recorrido» con controles, sin futuro en gráfico, texto y regiones vivas, pausas detectadas por `detectPausePoints` (con pruebas unitarias), preguntas de interpretación, decisión Mantener/Vender (una venta, `POST /api/game/compare`), resumen final con chips y «Más información»; paleta «Marea» solo en el Simulador; regla de `SKILL.md` actualizada.
- Recortado: no hay puntos ni puntuación (el diseño los dejaba como opcionales); no se hace un gráfico de «momentos» con marcas de todas las pausas (solo la marca de la mayor caída y la de la venta); la decisión se ofrece en todas las pausas salvo el último mes, y en una pausa con varias razones la pregunta es la de la primera razón (caída, máximo, recuperación o final, por ese orden).
- Eliminado por quedar sin uso: `HoldSellGame.tsx`, `hold-sell-game.css` y `tests/game.spec.ts` (sustituido por `tests/time-machine.spec.ts`). `game-domain.ts` y sus pruebas no cambian.

## Qué cambia

- **Pasos 1 y 2** (elegir fondo; cuánto y durante cuánto, con la pregunta previa): se mantienen, con menos texto.
- **Desde «Evolución de la práctica» y todo el paso 3:** se sustituyen por un **paso 3 único, «Vive el recorrido»**. Es una reproducción mes a mes del valor liquidativo real del fondo elegido.
  - Controles: Reproducir, Pausa, Siguiente mes y velocidad. Con «reducir movimiento» activado, solo se avanza paso a paso.
  - La línea del gráfico se dibuja hasta el mes visible. El gráfico, el texto y las regiones vivas no muestran valores futuros.
  - **Pausas con preguntas** en momentos reales detectados por código (nunca inventados):
    - la mayor caída mensual;
    - un nuevo máximo;
    - cuando el valor vuelve a igualar lo aportado;
    - el final.
  - **Tipos de pregunta:**
    - De interpretación. Por ejemplo: «Has puesto X € y vale Y €: ¿ganas o pierdes?», «¿Qué parte es tu dinero?».
    - De decisión: «Mantener» o «Vender ahora». Vender usa `POST /api/game/compare` con `sellMonth` igual al mes visible. El endpoint admite una sola venta; a partir de ahí se dibujan dos líneas («si mantengo» y «tu decisión»).
  - Sin «ganador» ni puntuación por beneficio. Si hay puntos, premian entender, no mantener ni ganar dinero. Vender por necesidad de liquidez puede ser razonable.
  - **Resumen final:** las dos líneas, tus respuestas y lo que has aprendido. Fuente CNMV, fechas y supuestos en un panel desplegable «Más información».
- **Menos texto, más visual:**
  - cifras grandes e iconos;
  - el guía con frases cortas;
  - los detalles en desplegables.
- **Comprar más en una caída** no está incluido: el motor actual no lo soporta. El juego por turnos de `historical-investment-game.md` sigue pendiente y necesita un contrato nuevo en el backend.
- **CaixaBank** sigue fuera de la comparación de venta. El modo local mantiene el aviso de que hace falta el servidor.

## Nueva paleta «Marea» (solo en el Simulador)

| Nombre | Hex | Uso |
|---|---|---|
| Azul noche | `#0E1B3D` | Texto principal, cabeceras |
| Turquesa eléctrico | `#00B3A4` | Acción principal, línea «si mantengo» |
| Amarillo sol | `#FFC94D` | Momentos y preguntas, logros |
| Coral suave | `#FF7A66` | Marca de caídas (siempre con icono o texto, no solo color) |
| Fondo | `#F3F7FB` | Superficie |

- Hay que definir los equivalentes del tema oscuro y comprobar el contraste: 4,5:1 en texto y 3:1 en controles.
- La regla de `.agents/skills/frontend-design/SKILL.md` («preservar la paleta VALLE») se actualizará en el mismo PR para decir que el Simulador usa «Marea» por decisión del equipo. Conviene la conformidad de mrta-rgb (área de interfaz).
- Movimiento solo cuando responde a una acción (reproducir, revelar, responder) y respetando `prefers-reduced-motion`.

## Límites conocidos

- El catálogo ya envía al navegador el histórico completo. Ocultar lo futuro en el gráfico no impide verlo con herramientas de desarrollo. Se documentará como limitación de la demo educativa.

## Comprobaciones previstas

- `npm test`, `npm run build` y el `npx playwright test` completo.
- Pruebas nuevas:
  - reproducción y pausa;
  - que no aparezcan valores futuros en el DOM visible;
  - preguntas en los meses detectados;
  - venta en el mes visible con cifras reales del backend;
  - modo local, ES/EN, temas claro y oscuro, 320/375 px, teclado y reducción de movimiento.
- Revisión con nota de `t2f-01-frontend-reviewer` (PR grande).
