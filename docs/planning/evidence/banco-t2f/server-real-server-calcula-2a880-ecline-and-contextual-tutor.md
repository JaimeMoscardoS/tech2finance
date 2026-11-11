# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: server.spec.ts >> real server calculates annual contributions, decline and contextual tutor
- Location: tests\server.spec.ts:3:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('.message.assistant').last()
Expected substring: "1,000"
Received string:    "That information is not available for the requested bank or product."
Timeout: 5000ms

Call log:
  - Expect "toContainText" locator('.message.assistant').last() with timeout 5000ms
  - waiting for locator('.message.assistant').last()
    3 × locator resolved to <div class="message assistant">…</div>
      - unexpected value "Ask about the screen or example you are viewing."
    11 × locator resolved to <div lang="en" class="message assistant">…</div>
       - unexpected value "That information is not available for the requested bank or product."

```

```yaml
- paragraph: That information is not available for the requested bank or product.
```

# Test source

```ts
  1  | ﻿import { test, expect } from '@playwright/test';
  2  |
  3  | test('real server calculates annual contributions, decline and contextual tutor', async ({ page, request }) => {
  4  |   const catalog = await request.get('/api/catalog'); expect(catalog.ok()).toBeTruthy(); expect((await catalog.json()).schemaVersion).toBe('1.0');
  5  |   const invalid = await request.post('/api/simulations', {data:{instrumentId:'demo-mixed',initial:-1,recurringContribution:0,periods:12}}); expect(invalid.status()).toBe(422);
  6  |   const missing = await request.post('/api/simulations', {data:{instrumentId:'bbva-mi-inversion-bolsa',initial:500,recurringContribution:0,periods:12}}); expect(missing.status()).toBe(409);
  7  |   await page.goto('/'); await expect(page.getByText('Servidor de demo', {exact:true})).toBeVisible();
  8  |   await page.getByRole('button',{name:'Simulador',exact:true}).click();
  9  |   await page.getByRole('button',{name:/Probar.*históric/i}).click();
  10 |   await page.getByLabel('Aportación anual').fill('100'); await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
  11 |   await expect(page.locator('.sim-values')).toContainText('1048,55'); await expect(page.locator('.sim-values')).toContainText('1000,00'); await expect(page.locator('.sim-values')).toContainText('48,55');
  12 |   await page.getByRole('button',{name:'Entender las caídas'}).click(); await expect(page.getByRole('dialog')).toContainText('2023');
  13 |   await page.getByRole('button',{name:/Preguntar al asistente/i}).click();
  14 |   await page.locator('#chat-input').fill('¿Cuánto he aportado?'); await page.getByRole('button',{name:'Enviar pregunta'}).click();
  15 |   await expect(page.locator('.message.assistant').last()).toContainText('1000');
  16 |   await expect(page.locator('.assistant-banner')).toContainText('SERVIDOR DE DEMO');
  17 |   const followup = page.waitForRequest(req => req.url().endsWith('/api/tutor') && req.method() === 'POST');
  18 |   await page.locator('#chat-input').fill('Y la ganancia?'); await page.getByRole('button',{name:'Enviar pregunta'}).click();
  19 |   const payload = (await followup).postDataJSON(); expect(payload.history.length).toBe(2); expect(payload.history[1].intent).toBeTruthy();
  20 |   await expect(page.locator('.message.assistant').last()).toContainText('48,55');
  21 |   await page.getByRole('dialog',{name:'Tu asistente'}).getByRole('button',{name:'Cerrar asistente'}).click(); await page.getByRole('button',{name:'English'}).click();
  22 |   await page.getByRole('button',{name:'Open assistant'}).click(); await page.locator('#chat-input').fill('How much did I contribute?');
> 23 |   await page.getByRole('button',{name:'Send question'}).click(); await expect(page.locator('.message.assistant').last()).toContainText('1,000');
     |                                                                                                                          ^ Error: expect(locator).toContainText(expected) failed
  24 |
  25 | });
  26 |
  27 | test('server unavailable requires explicit local choice', async ({page}) => {
  28 |   await page.route('**/api/catalog', route => route.abort()); await page.goto('/');
  29 |   await expect(page.getByText(/No se pudo completar/)).toBeVisible(); await expect(page.getByRole('button',{name:'Usar demo local'})).toBeVisible();
  30 |   await page.getByRole('button',{name:'Usar demo local'}).click(); await expect(page.getByRole('heading',{name:/Invertir empieza/})).toBeVisible();
  31 | });
  32 |
  33 | test('late server simulation cannot replace newer choice', async ({page}) => {
  34 |   let release: (() => void) | undefined; const gate = new Promise<void>(resolve => {release=resolve});
  35 |   await page.route('**/api/simulations', async route => { const body=route.request().postDataJSON(); if (body.initial === 123) await gate; try { await route.continue(); } catch {} });
  36 |   await page.goto('/'); await page.getByRole('button',{name:'Simulador',exact:true}).click();
  37 |   await page.getByLabel('Importe inicial').fill('123'); await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
  38 |   await page.getByLabel('Importe inicial').fill('500'); await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
  39 |   await expect(page.locator('.sim-values')).toContainText('1100,00'); release?.();
  40 |   await expect(page.locator('.sim-values')).toContainText('1100,00');
  41 | });
  42 |
```