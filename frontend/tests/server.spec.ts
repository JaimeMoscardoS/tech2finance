import { pickFund, reveal, startJourney } from './journey';
import { test, expect } from '@playwright/test';

test('real server calculates monthly contributions, decline and contextual tutor', async ({ page, request }) => {
  const catalog = await request.get('/api/catalog'); expect(catalog.ok()).toBeTruthy(); expect((await catalog.json()).schemaVersion).toBe('2.0');
  const invalid = await request.post('/api/simulations', {data:{instrumentId:'caixabank-monetario-estandar',initial:-1,recurringContribution:0,periods:12}}); expect(invalid.status()).toBe(422);
  const missing = await request.post('/api/simulations', {data:{instrumentId:'bbva-mi-inversion-bolsa',initial:500,recurringContribution:0,periods:12}}); expect(missing.status()).toBe(409);
  await page.goto('http://127.0.0.1:5194/'); await expect(page.locator('.connection-settings summary')).toContainText('Servidor de demo');
  await page.getByRole('button',{name:'Simulador',exact:true}).click();
  await expect(page.getByRole('radiogroup',{name:'Instrumento'})).toBeVisible();
  await expect(page.locator('input[name="jr-fund"]:checked')).toHaveCount(0);
  await pickFund(page);
  await page.getByLabel('Aportación mensual').fill('100'); await page.getByLabel('Tiempo de práctica').fill('12'); await reveal(page);
  await expect(page.locator('.sim-values')).toContainText('1700,75'); await expect(page.locator('.sim-values')).toContainText('1700,00'); await expect(page.locator('.sim-values')).toContainText('0,75');
  await page.getByRole('button',{name:'Entender las caídas'}).click(); await expect(page.getByRole('dialog')).toContainText('2020');
  await page.getByRole('button',{name:/Preguntar al asistente/i}).click();
  await page.locator('#chat-input').fill('¿Cuánto he aportado?'); await page.getByRole('button',{name:'Enviar pregunta'}).click();
  await expect(page.locator('.message.assistant').last()).toContainText('1700');
  await expect(page.locator('.assistant-banner')).toContainText('SERVIDOR DE DEMO');
  const followup = page.waitForRequest(req => req.url().endsWith('/api/tutor') && req.method() === 'POST');
  await page.locator('#chat-input').fill('Y la ganancia?'); await page.getByRole('button',{name:'Enviar pregunta'}).click();
  const payload = (await followup).postDataJSON(); expect(payload.history.length).toBe(2); expect(payload.history[1].intent).toBeTruthy();
  await expect(page.locator('.message.assistant').last()).toContainText('0,75');
  await page.getByRole('dialog',{name:'Tu asistente'}).getByRole('button',{name:'Cerrar asistente'}).click(); await page.getByRole('button',{name:'English'}).click();
  await page.getByRole('button',{name:'Open assistant'}).click(); await page.locator('#chat-input').fill('How much did I contribute?');
  await page.getByRole('button',{name:'Send question'}).click(); await expect(page.locator('.message.assistant').last()).toContainText('1,700');

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
  await startJourney(page);
  const held = page.waitForRequest(req => req.url().endsWith('/api/simulations') && req.postDataJSON().initial === 123);
  await page.getByLabel('Importe inicial').fill('123'); await held;
  await page.getByLabel('Importe inicial').fill('500');
  await expect(page.locator('.sim-values')).toContainText('1100,30'); release?.();
  await expect(page.locator('.sim-values')).toContainText('1100,30');
});
