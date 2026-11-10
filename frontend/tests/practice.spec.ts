import { test, expect, type Page } from '@playwright/test';

async function openPractice(page: Page) {
  await page.goto('/');
  await page.getByRole('button', {name: /Practica sin riesgo/}).click();
  await expect(page.getByRole('heading', {name: 'Aprende haciendo preguntas.'})).toBeVisible();
  await expect(page.getByRole('heading', {name: 'Aprende haciendo preguntas.'})).toBeFocused();
}

test('real server compares annual contributions and sends the chosen case to the tutor', async ({page}) => {
  const simulations: unknown[] = [];
  page.on('request', req => { if (req.url().endsWith('/api/simulations') && req.method() === 'POST') simulations.push(req.postDataJSON()); });
  await openPractice(page);
  await page.getByLabel('Instrumento A').selectOption('caixabank-monetario-estandar');
  await page.getByLabel('Importe inicial (€)').fill('500');
  await page.getByLabel(/Aportación periódica/).fill('100');
  await page.getByRole('button', {name:'Comparar ejemplos'}).click();
  const results=page.locator('.practice-result-card');
  await expect(results).toHaveCount(2);
  await expect(results.nth(1)).toContainText('1048,55');
  await expect(results.nth(1)).toContainText('1000,00');
  await expect(results.nth(1)).toContainText('48,55');
  expect(simulations).toEqual(expect.arrayContaining([
    {instrumentId:'caixabank-monetario-estandar',initial:500,recurringContribution:0,periods:5},
    {instrumentId:'caixabank-monetario-estandar',initial:500,recurringContribution:100,periods:5},
  ]));
  const tutorRequest = page.waitForRequest(req => req.url().endsWith('/api/tutor') && req.method() === 'POST');
  await page.getByRole('button',{name:'Preguntar sobre este ejemplo'}).click();
  await page.locator('#chat-input').fill('¿Cuánto he aportado?');
  await page.getByRole('button',{name:'Enviar pregunta'}).click();
  const body=(await tutorRequest).postDataJSON();
  expect(body.context.simulation).toEqual({instrumentId:'caixabank-monetario-estandar',initial:500,recurringContribution:100,periods:5});
  expect(body.context.instrumentId).toBe('caixabank-monetario-estandar');
  await expect(page.locator('.message.assistant').last()).toContainText('1000');
});

test('local practice completes three concepts and clears results after editing', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('t2f-data-mode','local'));
  await openPractice(page);
  await expect(page.getByLabel('Instrumento A').locator('option[value="bbva-mi-inversion-bolsa"]')).toHaveCount(0);
  await page.getByLabel('Importe inicial (€)').fill('-1');
  await page.getByRole('button',{name:'Comparar ejemplos'}).click();
  await expect(page.locator('.practice-result-card')).toHaveCount(0);
  await page.getByLabel('Importe inicial (€)').fill('0');
  await page.getByRole('button',{name:'Comparar ejemplos'}).click();
  await expect(page.locator('.practice-result-card')).toHaveCount(2);
  await page.getByRole('button',{name:'No',exact:true}).click();
  await expect(page.getByText('1 / 3 conceptos comprendidos')).toBeVisible();
  await page.getByLabel('Importe inicial (€)').fill('500');
  await expect(page.locator('.practice-result-card')).toHaveCount(0);
  await page.getByRole('button',{name:/Explorar el plazo/}).click();
  await page.getByRole('button',{name:'Comparar ejemplos'}).click();
  await expect(page.locator('.practice-result-card')).toHaveCount(2);
  await page.getByRole('button',{name:'No',exact:true}).click();
  await page.getByRole('button',{name:/Comparar activos/}).click();
  await page.getByLabel('Importe inicial (€)').fill('0');
  await page.getByLabel(/Aportación periódica/).fill('0');
  await page.getByRole('button',{name:'Comparar ejemplos'}).click();
  await expect(page.locator('.practice-result-card')).toHaveCount(2);
  await expect(page.locator('.practice-result-card').nth(1)).toContainText('0,00');
  await page.getByRole('button',{name:'No',exact:true}).click();
  await expect(page.getByText('3 / 3 conceptos comprendidos')).toBeVisible();
});

test('late responses and server errors never replace a changed practice', async ({page}) => {
  let release: (() => void) | undefined;
  const gate = new Promise<void>(resolve => {release=resolve});
  let resumed: (() => void) | undefined;
  const delayedRequestFinished = new Promise<void>(resolve => {resumed=resolve});
  let holding = false;
  await page.route('**/api/simulations', async route => {
    const spec=route.request().postDataJSON();
    if (spec.initial === 123) {holding=true; await gate;}
    try {await route.continue();} catch {} finally {if (spec.initial === 123) resumed?.();}
  });
  await openPractice(page);
  const live = page.locator('.practice-lab [role="status"].sr-only');
  await expect(live).toBeEmpty();
  await page.getByLabel('Importe inicial (€)').fill('123');
  await page.getByRole('button',{name:'Comparar ejemplos'}).click();
  await expect.poll(() => holding).toBe(true);
  await expect(live).toHaveText('Calculando la comparación.');
  await page.getByLabel('Importe inicial (€)').fill('500');
  await page.getByRole('button',{name:'Comparar ejemplos'}).click();
  await expect(page.locator('.practice-result-card')).toHaveCount(2);
  await expect(live).toHaveText('Comparación lista.');
  const fresh = await page.locator('.practice-result-card').nth(1).locator('dd').first().innerText();
  release?.();
  await delayedRequestFinished;
  await expect(page.locator('.practice-result-card').nth(1).locator('dd').first()).toHaveText(fresh);
  await page.getByRole('button',{name:'Usar demo local'}).click();
  await expect(page.locator('.practice-result-card')).toHaveCount(0);
});

test('server failure is visible and cannot silently compute locally', async ({page}) => {
  await openPractice(page);
  await page.route('**/api/simulations', route => route.fulfill({status:503,contentType:'application/json',body:'{"error":{"code":"unavailable","message":"Unavailable"}}'}));
  await page.getByRole('button',{name:'Comparar ejemplos'}).click();
  await expect(page.getByRole('alert')).toContainText('No se ha podido completar');
  await expect(page.locator('.practice-result-card')).toHaveCount(0);
  await expect(page.getByText('Servidor de demo',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Usar demo local'}).click();
  await page.getByRole('button',{name:'Comparar ejemplos'}).click();
  await expect(page.locator('.practice-result-card')).toHaveCount(2);
});

test('the tutor follows A selection and clears the old result during editing', async ({page}) => {
  await openPractice(page);
  await page.getByRole('button',{name:'Comparar ejemplos'}).click();
  await expect(page.locator('.practice-result-card')).toHaveCount(2);
  await page.locator('.practice-result-card').first().getByRole('button',{name:'Seleccionar para el asistente'}).click();
  let request = page.waitForRequest(req => req.url().endsWith('/api/tutor') && req.method() === 'POST');
  await page.getByRole('button',{name:'Preguntar sobre este ejemplo'}).click();
  await page.locator('#chat-input').fill('¿Cuánto he aportado?'); await page.getByRole('button',{name:'Enviar pregunta'}).click();
  const body = (await request).postDataJSON(); expect(body.context.simulation.recurringContribution).toBe(0);
  await expect(page.locator('.message.assistant').last()).not.toHaveText('');
  await page.getByRole('dialog',{name:'Tu asistente'}).getByRole('button',{name:'Cerrar asistente'}).click();
  await page.getByLabel('Importe inicial (€)').fill('20');
  await page.getByRole('button',{name:'Abrir asistente'}).click();
  request = page.waitForRequest(req => req.url().endsWith('/api/tutor') && req.method() === 'POST');
  await page.locator('#chat-input').fill('¿Qué es una aportación?'); await page.getByRole('button',{name:'Enviar pregunta'}).click();
  const clean = (await request).postDataJSON(); expect(clean.context.simulation).toBeUndefined(); expect(clean.context.instrumentId).toBeUndefined();
});

test('practice remains usable in English on a narrow dark screen', async ({page}) => {
  await page.setViewportSize({width:320,height:700});
  await page.addInitScript(() => { localStorage.setItem('t2f-data-mode','local'); localStorage.setItem('t2f-theme','dark'); });
  await openPractice(page);
  await page.getByRole('button',{name:'English'}).click();
  await expect(page.getByRole('heading',{name:'Learn by asking questions.'})).toBeVisible();
  await page.getByRole('button',{name:'Compare examples'}).click();
  await expect(page.locator('.practice-result-card')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
