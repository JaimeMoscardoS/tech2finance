import { test, expect } from '@playwright/test';

test('bank identity, product fees and contextual questions follow the selected instrument', async ({page}) => {
 const tutorRequests: any[] = [];
 await page.route('**/api/tutor', async route => { tutorRequests.push(route.request().postDataJSON()); await route.continue(); });
 await page.goto('/');
 await expect(page.locator('.brand')).toContainText('BancoT2F');
 await expect(page.locator('.bank-info')).toContainText('0 EUR');
 await page.getByText('Preguntas frecuentes').click();
 await page.getByText('¿Qué es BancoT2F?').click();
 await expect(page.getByText('Una entidad ficticia creada para esta demostración.')).toBeVisible();
 await page.getByRole('button',{name:'Explorar',exact:true}).click();
 const card = page.locator('.fund-card').filter({hasText:'T2F Equilibrio'});
 await expect(card).toContainText('0,75 %');
 await expect(card).toContainText('no se descuentan');
 await card.getByRole('button',{name:'Preguntar por este producto'}).click();
 const dialog = page.getByRole('dialog',{name:/asistente/i});
 await dialog.getByLabel('Tu pregunta').fill('¿Cuánto cuesta este fondo?');
 await dialog.getByRole('button',{name:'Enviar pregunta'}).click();
 await expect.poll(()=>tutorRequests.length).toBeGreaterThan(0);
 expect(tutorRequests.at(-1).context).toMatchObject({page:'explore',bankId:'demo',instrumentId:'demo-mixed'});
 expect(tutorRequests.at(-1).context.simulation).toBeUndefined();
 await expect(dialog).toContainText('0,75');
 await dialog.getByRole('button',{name:'Cerrar asistente',exact:true}).click();
 await page.getByRole('button',{name:'Simulador',exact:true}).click();
 await expect(page.locator('.bank-costs')).toContainText('0,75 %');
 await page.getByLabel('Importe inicial').fill('1000');
 await page.getByLabel('Aportación mensual').fill('0');
 await page.getByLabel('Tiempo de práctica').selectOption('6');
 await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
 await expect(page.locator('.sim-values')).toContainText('892,64');
 await page.getByLabel('Entidad').selectOption('caixabank');
 await expect(page.locator('.bank-costs')).toContainText('Referencia externa');
 await expect(page.locator('.bank-costs')).not.toContainText('0,75 %');
 await page.getByRole('button',{name:'Mi cartera',exact:true}).click();
 await page.getByRole('button',{name:'Abrir asistente'}).click();
 await page.getByLabel('Tu pregunta').fill('¿Qué es BancoT2F?');
 await page.getByRole('button',{name:'Enviar pregunta'}).click();
 await expect.poll(()=>tutorRequests.length).toBeGreaterThan(1);
 expect(tutorRequests.at(-1).context.instrumentId).toBeUndefined();
});

test('invalid profile triggers explicit recovery', async ({page}) => {
 await page.route('**/api/catalog', async route => { const response = await route.fetch(); const body = await response.json(); body.bankProfile.products[0].fees.entryBps = -1; await route.fulfill({response,json:body}); });
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
 await expect(page.locator('.bank-info')).toContainText('Fictional institution');
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
