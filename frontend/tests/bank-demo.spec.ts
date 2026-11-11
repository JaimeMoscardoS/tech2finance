import { pickFund, reveal } from './journey';
import { test, expect } from '@playwright/test';

for (const mode of ['local', 'server'] as const) for (const bank of ['caixabank', 'bbva'] as const) {
 test(`configured ${bank} keeps its selected fund and excludes demo terms in ${mode}`, async ({page}) => {
  await page.addInitScript((value) => localStorage.setItem('t2f-data-mode', value), mode);
  const requests: any[] = [];
  await page.route('**/api/tutor', async route => { requests.push(route.request().postDataJSON()); await route.continue(); });
  await page.goto(bank === 'caixabank' ? 'http://127.0.0.1:5194/' : 'http://127.0.0.1:5196/');
  await expect(page.locator('.bank-info')).toHaveCount(0);
  await expect(page.locator('.brand')).toContainText(bank === 'caixabank' ? 'CaixaBank' : 'BBVA');
  await expect(page.locator('.brand')).not.toContainText('BancoT2F');
  await expect(page.locator('.breadcrumb')).not.toContainText('BancoT2F');
  await expect(page.getByRole('button', {name: /Probar una caída/})).toHaveCount(0);
  await page.getByRole('button',{name:'Explorar',exact:true}).click();
  await expect(page.locator('.beginner-card h2')).toContainText(bank === 'caixabank' ? 'Fondo monetario' : 'Fondo bolsa 2');
  await page.getByRole('button',{name:'Abrir asistente'}).click();
  const dialog = page.getByRole('dialog',{name:'Tu asistente'});
  await dialog.getByLabel('Tu pregunta').fill('¿Cuánto cuesta este fondo?');
  await dialog.getByRole('button',{name:'Enviar pregunta'}).click();
  await expect(dialog.locator('.message.assistant[lang="es"]')).toHaveCount(1);
  await expect(dialog).not.toContainText('0,75');
  if (mode === 'server') expect(requests.at(-1).context).toMatchObject({bankId:bank,instrumentId:bank === 'caixabank' ? 'caixabank-monetario-estandar' : 'bbva-mi-inversion-bolsa-acumulacion'});
  await dialog.getByLabel('Tu pregunta').fill('¿Todos los productos de la plataforma son de BancoT2F?');
  await dialog.getByRole('button',{name:'Enviar pregunta'}).click();
  await expect(dialog.locator('.message.assistant[lang="es"]')).toHaveCount(2);
  await expect(dialog.locator('.message.assistant[lang="es"]').last()).not.toContainText(/productos de otras entidades|0,75/i);
 });
}

test('bank identity and product costs follow the selected fund across views', async ({page}) => {
 const tutorRequests: any[] = [];
 await page.route('**/api/tutor', async route => { tutorRequests.push(route.request().postDataJSON()); await route.continue(); });
 await page.goto('/');
 await expect(page.locator('.bank-info__maintenance dd')).toContainText('0,00');
 await page.getByText('Conoce BancoT2F').click();
 await page.getByText('Preguntas frecuentes').click();
 await page.getByText('¿Qué es BancoT2F?').click();
 await expect(page.getByText('BancoT2F es el banco de este entorno de demostración.')).toBeVisible();
 await page.getByRole('button',{name:'Explorar',exact:true}).click();
 const beginner = page.locator('.beginner-card');
 await expect(beginner.locator('.bank-costs')).toContainText('costes del fondo no disponibles');
 await page.getByRole('button',{name:'Abrir asistente'}).click();
 const dialog = page.getByRole('dialog',{name:/asistente/i});
 await dialog.getByLabel('Tu pregunta').fill('¿Cuánto cuesta este fondo?');
 await dialog.getByRole('button',{name:'Enviar pregunta'}).click();
 await expect.poll(()=>tutorRequests.length).toBeGreaterThan(0);
 expect(tutorRequests.at(-1).context).toMatchObject({page:'explore',bankId:'demo',instrumentId:'caixabank-monetario-estandar'});
 await expect(dialog).not.toContainText('0,75');
 await dialog.getByRole('button',{name:'Cerrar asistente',exact:true}).click();
 const levels = page.getByRole('group',{name:'Nivel de detalle'});
 await levels.getByRole('button',{name:'Intermedio'}).click();
 await expect(page.locator('.compare-selected .bank-costs')).toContainText('costes del fondo no disponibles');
 await levels.getByRole('button',{name:'Avanzado'}).click();
 await expect(page.locator('.technical-inspector .bank-costs')).toContainText('costes del fondo no disponibles');
 await page.getByRole('button',{name:'Simulador',exact:true}).click();
 await pickFund(page);
 await expect(page.locator('.bank-costs')).toContainText('costes del fondo no disponibles');
 await page.getByLabel('Importe inicial').fill('1000');
 await page.getByLabel('Aportación mensual').fill('0');
 await page.getByLabel('Tiempo de práctica').fill('6');
 await reveal(page);
 await expect(page.locator('.sim-values')).toContainText('1000,00');
});

test('invalid profile triggers explicit recovery', async ({page}) => {
 await page.route('**/api/catalog', async route => { const response = await route.fetch(); const body = await response.json(); body.bankProfile.products = 'invalid'; await route.fulfill({response,json:body}); });
 await page.goto('/');
 await expect(page.getByRole('status')).toContainText('No se pudo cargar');
 await expect(page.locator('.app-shell')).toHaveCount(0);
 await page.getByRole('button',{name:'Usar demo local'}).click();
 await expect(page.locator('.bank-info')).toContainText('BancoT2F');
});

test('mobile English dark view keeps the bank context readable', async ({page}) => {
 await page.setViewportSize({width:320,height:700});
 await page.goto('/');
 await page.getByRole('button',{name:'English'}).click();
 await page.getByRole('button',{name:'Dark theme'}).click();
 await expect(page.locator('.bank-info')).toContainText('demonstration environment');
 await expect(page.locator('.bank-info')).toContainText('No real account');
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
