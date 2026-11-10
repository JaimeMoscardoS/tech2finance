# BancoT2F: contexto de demostración

## Qué es

BancoT2F es la entidad ficticia que aloja la experiencia educativa; Tech2Finance es el tutor integrado en ella. El perfil compartido vive en [`shared/demo-data.json`](../shared/demo-data.json), campo `bankProfile`, y su tipo en [`shared/bank-profile.ts`](../shared/bank-profile.ts). La fecha de la muestra es el 10 de noviembre de 2026, no una cotización actual. Catálogo, práctica, tutor y pausa de cartera son servicios de la demo; no hay cuentas, órdenes ni conexión bancaria real.

El mantenimiento mensual ficticio es de 0 EUR y los mínimos inicial y periódico son 0 EUR. Las condiciones siguientes son hipotéticas e informativas: el simulador no descuenta estas comisiones. No deben presentarse los resultados como rentabilidad neta de ellas.

| Producto ficticio | ID estable | Comisión anual informativa | Por orden |
| --- | --- | --- | --- |
| T2F Estabilidad | `demo-fixed` | 40 pb = 0,40 % | 0 EUR |
| T2F Equilibrio | `demo-mixed` | 75 pb = 0,75 % | 0 EUR |
| T2F Horizonte | `demo-equity` | 110 pb = 1,10 % | 0 EUR |
| ETF Mercado ficticio | `demo-etf` | 20 pb = 0,20 % | 1 EUR |
| Acción Empresa ficticia | `demo-stock` | No definida (`null`) | 1 EUR |

Entrada, salida y custodia son 0 en la muestra ficticia. Un dato no definido no equivale a cero. Los identificadores de los tres fondos permanecen estables aunque cambien los nombres; sus secuencias siguen siendo ficticias.

La muestra externa de CaixaBank conserva su identidad y rentabilidades anuales publicadas de 2021–2025; no es un producto de BancoT2F. Las fichas BBVA y Santander no tienen histórico conectado. No se verifica aquí el derecho de redistribución o uso comercial de la fuente. No se trasladan series entre productos.

## Versiones y comprobación

El perfil es `bank-demo-2026-11-10.1`; el conjunto es `demo-2026-11-10.1`, SHA-256 canónico `70d234a224a2dc3f08d8e3f92cd4bfad3456ebb3cbcd9bb8db208940dafed0a4`, y el cálculo conserva `demo-calculations-1.0.0`. La instantánea anterior `demo-2026-11-09.1` se conserva. La canonicalización y comprobación están definidas en [`backend/domain/provenance.py`](../backend/domain/provenance.py) y el manifiesto en [`shared/data-manifest.json`](../shared/data-manifest.json).

Esta documentación describe el perfil compartido y el objetivo de integración en la rama de trabajo; las respuestas del tutor y el recorrido final deben comprobarse tras finalizar la integración. El [guion y las preguntas](../presentacion/demo-banco-t2f.md) distinguen las expectativas de la evidencia pendiente. No implica integración en `main`, despliegue ni servicios externos.
