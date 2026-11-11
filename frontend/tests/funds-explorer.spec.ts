import { BBVA, pickFund } from './journey';
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('three distinct layouts retain the selected fund and show truthful chart data', async ({page}) => {
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode','local')); await page.goto('/'); await page.getByRole('button',{name:'Explorar',exact:true}).click();
 await expect(page.locator('[data-layout="beginner"]')).toBeVisible(); await page.locator('.beginner-guide select').last().selectOption('bbva-mi-inversion-bolsa-acumulacion');
 await expect(page.locator('.beginner-card h2')).toHaveText('Fondo bolsa 2'); await expect(page.locator('.beginner-guide details')).toHaveCount(2);
 const levels = page.getByRole('group',{name:'Nivel de detalle'}); await levels.getByRole('button',{name:'Intermedio'}).click();
 await expect(page.locator('[data-layout="intermediate"]')).toBeVisible(); await expect(page.locator('.compare-selected h2')).toHaveText('Fondo bolsa 2');
 await expect(page.locator('.fund-chart[data-instrument="bbva-mi-inversion-bolsa-acumulacion"] .mini-values tbody tr')).toHaveCount(72); await expect(page.locator('.fund-chart[data-instrument="bbva-mi-inversion-bolsa-acumulacion"] .nav-line')).toBeVisible();
 await levels.getByRole('button',{name:'Avanzado'}).click(); await expect(page.locator('[data-layout="advanced"]')).toBeVisible();
 await expect(page.locator('.dashboard-card')).toHaveCount(3); await expect(page.locator('.dashboard-card .mini-bars')).toHaveCount(3);
 await expect(page.locator('.technical-inspector h2')).toHaveText('Fondo bolsa 2');
 await expect(page.locator('.fund-chart[data-instrument="bbva-mi-inversion-bolsa-acumulacion"]')).toContainText('cierres mensuales');
 await page.getByRole('button',{name:'Preguntar por voz',exact:true}).click(); await expect(page.getByRole('region',{name:'Habla con tu asistente'})).toBeVisible(); await page.keyboard.press('Escape');
});

test('server tutor receives the selected fund across detail modes', async ({page}) => {
 await page.goto('/'); await page.getByRole('button',{name:'Simulador',exact:true}).click(); await pickFund(page, BBVA); await page.getByRole('button',{name:'Explorar',exact:true}).click();
 await page.getByRole('group',{name:'Nivel de detalle'}).getByRole('button',{name:'Avanzado'}).click();
 await page.getByRole('button',{name:'Abrir asistente'}).click(); await page.locator('#chat-input').fill('¿Qué es este fondo?'); const request = page.waitForRequest(req => req.url().endsWith('/api/tutor') && req.method() === 'POST'); await page.getByRole('button',{name:'Enviar pregunta'}).click();
 expect((await request).postDataJSON().context).toMatchObject({page:'explore',instrumentId:'bbva-mi-inversion-bolsa-acumulacion'}); await expect(page.locator('.message.assistant').last()).toBeVisible();
});

test('all layouts fit 320px in English dark theme', async ({browser}) => {
 const context = await browser.newContext({viewport:{width:320,height:800}}); const page = await context.newPage(); await page.addInitScript(() => localStorage.setItem('t2f-data-mode','local'));
 await page.goto('/'); await page.getByRole('button',{name:'English'}).click(); await page.getByRole('button',{name:'Dark theme'}).click(); await page.getByRole('button',{name:'Open menu'}).click(); await page.getByRole('button',{name:'Explore',exact:true}).click();
 const picker = page.locator('.beginner-guide select').last();
 await expect(picker.locator('option[value="bbva-mi-inversion-bolsa-acumulacion"]')).toContainText('Equity fund 2');
 await picker.selectOption('bbva-mi-inversion-bolsa-acumulacion');
 await expect(page.locator('.beginner-card h2')).toHaveText('Equity fund 2');
 await page.locator('.beginner-card details summary').first().click();
 await expect(page.locator('.beginner-card details').first()).toContainText('Official name: BBVA MI INVERSION BOLSA ACUMULACION, FI');
 for (const level of ['Basic','Intermediate','Advanced']) { await page.getByRole('group',{name:'Detail level'}).getByRole('button',{name:level}).click(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy(); await expect(page.getByRole('button',{name:'Ask by voice'})).toBeVisible(); }
 await context.close();
});


test('ineligible NAV does not enable practice', async ({page}) => {
 await page.route('**/api/catalog', async route => { const response = await route.fetch(); const catalog = await response.json(); catalog.navHistory.instruments.forEach((h:any)=>h.eligible=false); await route.fulfill({response,json:catalog}); });
 await page.goto('http://127.0.0.1:5194/'); await page.getByRole('button',{name:'Explorar',exact:true}).click();
 await expect(page.locator('.beginner-summary')).toContainText('No hay una serie histórica verificada');
 await expect(page.locator('.beginner-summary')).not.toContainText('undefined'); await expect(page.getByRole('button',{name:'Practicar con este fondo'})).toBeDisabled();
 await page.getByRole('group',{name:'Nivel de detalle'}).getByRole('button',{name:'Avanzado'}).click(); await expect(page.getByText('No hay series válidas para comparar en esta entidad.')).toBeVisible();
});


test('filters, document status and CSV retain selected fund context', async ({page}) => {
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode','local')); await page.goto('/'); await page.getByRole('button',{name:'Explorar',exact:true}).click();
 const levels=page.getByRole('group',{name:'Nivel de detalle'});
 for (const name of ['Básico','Intermedio','Avanzado']) {
  await levels.getByRole('button',{name,exact:true}).click(); await expect(page.getByRole('button',{name:'Escribir al asistente'})).toBeVisible(); await expect(page.getByRole('button',{name:'Hablar con el asistente'})).toBeVisible(); const voice=page.getByRole('button',{name:'Hablar con el asistente'}); const contrast=await voice.evaluate(el => { const css=getComputedStyle(el); const lum=(v:string)=>v.match(/\d+/g)!.slice(0,3).map(Number).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0); const a=lum(css.color),b=lum(css.backgroundColor); return (Math.max(a,b)+.05)/(Math.min(a,b)+.05); }); expect(contrast).toBeGreaterThanOrEqual(4.5);
  const docs=page.locator('.fund-documents'); await docs.locator('summary').click(); await expect(docs).toContainText('Documento de datos fundamentales: no disponible'); await expect(docs).toContainText('Folleto: no disponible'); await docs.locator('summary').click();
 }
 await levels.getByRole('button',{name:'Intermedio'}).click(); await expect(page.locator('.compare-picker input:checked')).toHaveCount(3); await page.locator('.compare-picker input:checked').first().uncheck(); await expect(page.locator('.compare-panel .fund-table-wrap').first().locator('tbody tr')).toHaveCount(2); await levels.getByRole('button',{name:'Avanzado'}).click();
 await page.locator('.filter-disclosure summary').click(); await page.getByLabel('Buscar fondo').fill('SANTANDER'); await expect(page.locator('.dashboard-card')).toHaveCount(1); await expect(page.locator('.dashboard-card')).toContainText('Fondo ahorro'); await expect(page.locator('.fund-filters')).toContainText('Fondo monetario');
 await page.getByLabel('Buscar fondo').fill(''); await expect(page.getByLabel('Ordenar por').locator('option[value="risk"]')).toBeDisabled();
 const downloadPromise=page.waitForEvent('download'); await page.getByRole('button',{name:'Descargar serie disponible (CSV)'}).click(); const download=await downloadPromise; expect(download.suggestedFilename()).toBe('caixabank-monetario-estandar-rates.csv'); const csv = await readFile((await download.path())!, 'utf8'); expect(csv).toContain('"2020-01-31","7.7083"'); expect(csv).toContain('CAIXABANK MONETARIO RENDIMIENTO'); expect(csv).not.toContain('Fondo monetario'); expect(csv.split('\r\n')).toHaveLength(74);
});


test('mismatched NAV series is not attributed to another fund', async ({page}) => {
 await page.route('**/api/catalog', async route => { const response = await route.fetch(); const catalog = await response.json(); catalog.navHistory.instruments.find((h:any)=>h.isin==='ES0138045002').isin='ES0000000000'; await route.fulfill({response,json:catalog}); });
 await page.goto('http://127.0.0.1:5194/'); await page.getByRole('button',{name:'Explorar',exact:true}).click();
 await expect(page.getByRole('button',{name:'Practicar con este fondo'})).toBeDisabled(); await page.getByRole('group',{name:'Nivel de detalle'}).getByRole('button',{name:'Intermedio'}).click(); await expect(page.locator('.period-summary')).toHaveCount(0); await expect(page.locator('.fund-chart .fund-empty')).toBeVisible();
});


test('incompatible NAV dates cannot enter a comparison', async ({page}) => {
 await page.route('**/api/catalog', async route => { const response=await route.fetch(); const catalog=await response.json(); catalog.navHistory.instruments.slice(1).forEach((h:any)=>h.monthly[1].date='2020-01-30'); await route.fulfill({response,json:catalog}); });
 await page.goto('/'); await page.getByRole('button',{name:'Explorar',exact:true}).click(); await page.getByRole('group',{name:'Nivel de detalle'}).getByRole('button',{name:'Avanzado'}).click();
 const group=page.getByRole('group',{name:/Elige hasta tres series/}); await expect(group.locator('input:checked')).toHaveCount(1); await expect(group.getByLabel(/Fondo ahorro/)).toBeDisabled(); await expect(group.getByLabel(/Fondo bolsa 2/)).toBeDisabled(); await expect(page.getByText(/al menos dos series compatibles/)).toBeVisible();
});
