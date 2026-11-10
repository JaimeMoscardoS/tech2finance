import { test, expect } from '@playwright/test';

test('real server calculates annual contributions, decline and contextual tutor', async ({ page, request }) => {
  const catalog = await request.get('/api/catalog'); expect(catalog.ok()).toBeTruthy(); expect((await catalog.json()).schemaVersion).toBe('1.0');
  const invalid = await request.post('/api/simulations', {data:{instrumentId:'demo-mixed',initial:-1,recurringContribution:0,periods:12}}); expect(invalid.status()).toBe(422);
  const missing = await request.post('/api/simulations', {data:{instrumentId:'bbva-mi-inversion-bolsa',initial:500,recurringContribution:0,periods:12}}); expect(missing.status()).toBe(409);
  await page.goto('/'); await expect(page.getByText('Servidor de demo', {exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Simulador',exact:true}).click();
  await page.getByRole('button',{name:/Probar.*históric/i}).click();
  await page.getByLabel('Aportación anual').fill('100'); await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
  await expect(page.locator('.sim-values')).toContainText('1048,55'); await expect(page.locator('.sim-values')).toContainText('1000,00'); await expect(page.locator('.sim-values')).toContainText('48,55');
  await page.getByRole('button',{name:'Entender las caídas'}).click(); await expect(page.getByRole('dialog')).toContainText('2023');
  await page.getByRole('button',{name:/Preguntar al asistente/i}).click();
  await page.locator('#chat-input').fill('¿Cuánto he aportado?'); await page.getByRole('button',{name:'Enviar pregunta'}).click();
  await expect(page.locator('.message.assistant').last()).toContainText('1000');
  await expect(page.locator('.assistant-banner')).toContainText('SERVIDOR DE DEMO');
  const followup = page.waitForRequest(req => req.url().endsWith('/api/tutor') && req.method() === 'POST');
  await page.locator('#chat-input').fill('Y la ganancia?'); await page.getByRole('button',{name:'Enviar pregunta'}).click();
  const payload = (await followup).postDataJSON(); expect(payload.history.length).toBe(2); expect(payload.history[1].intent).toBeTruthy();
  await expect(page.locator('.message.assistant').last()).toContainText('48,55');
  await page.getByRole('dialog',{name:'Tu asistente'}).getByRole('button',{name:'Cerrar asistente'}).click(); await page.getByRole('button',{name:'English'}).click();
  await page.getByRole('button',{name:'Open assistant'}).click(); await page.locator('#chat-input').fill('How much did I contribute?');
  await page.getByRole('button',{name:'Send question'}).click(); await expect(page.locator('.message.assistant').last()).toContainText('1,000');

});

test('server unavailable requires explicit local choice', async ({page}) => {
  await page.route('**/api/catalog', route => route.abort()); await page.goto('/');
  await expect(page.getByText(/No se pudo completar/)).toBeVisible(); await expect(page.getByRole('button',{name:'Usar demo local'})).toBeVisible();
  await page.getByRole('button',{name:'Usar demo local'}).click(); await expect(page.getByRole('heading',{name:/Invertir empieza/})).toBeVisible();
});

test('late server simulation cannot replace newer choice', async ({page}) => {
  let release: (() => void) | undefined; const gate = new Promise<void>(resolve => {release=resolve});
  await page.route('**/api/simulations', async route => { const body=route.request().postDataJSON(); if (body.initial === 123) await gate; try { await route.continue(); } catch {} });
  await page.goto('/'); await page.getByRole('button',{name:'Simulador',exact:true}).click();
  await page.getByLabel('Importe inicial').fill('123'); await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
  await page.getByLabel('Importe inicial').fill('500'); await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
  await expect(page.locator('.sim-values')).toContainText('1100,00'); release?.();
  await expect(page.locator('.sim-values')).toContainText('1100,00');
});
