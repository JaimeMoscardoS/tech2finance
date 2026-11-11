import { pickFund, reveal, finishReplay } from './journey';
﻿import { test, expect } from '@playwright/test';
import data from '../../shared/demo-data.json' with {type:'json'};
import { fundDisplayNames } from '../src/fund-names';
import type { Instrument } from '../src/catalog';
// Los fondos se muestran con su nombre genérico (alias de main, PR #33); el nombre oficial queda en el detalle.
const displayNames=fundDisplayNames(data.instruments as unknown as Instrument[]);
for(const mode of ['local','server'] as const) test(`real study cases, portfolio and decline in ${mode}`,async({page})=>{
 await page.addInitScript(mode=>localStorage.setItem('t2f-data-mode',mode),mode);await page.goto('/');
 await expect(page.locator('.demo-badge')).toContainText('Sin dinero real');
 await page.getByRole('button',{name:'Explorar',exact:true}).click();
 const selector=page.locator('.beginner-guide select').last();
 await expect(selector.locator('option')).toHaveCount(5);
 for(const id of data.demoStudyInstrumentIds){await selector.selectOption(id);const item=data.instruments.find(i=>i.instrumentId===id)!;await expect(page.locator('.beginner-card h2')).toHaveText(displayNames.get(item.instrumentId)?.es ?? item.name.es);await expect(page.locator('.beginner-card')).toContainText('No disponible');}
 await page.getByRole('button',{name:'Intermedio',exact:true}).click();await expect(page.locator('.compare-picker input')).toHaveCount(5);
 await page.getByRole('button',{name:'Avanzado',exact:true}).click();await expect(page.locator('.technical-inspector')).toContainText('ISIN');
 await page.getByRole('button',{name:'Inicio',exact:true}).click();await page.getByRole('button',{name:'Probar una caída'}).click();
 const dialog=page.getByRole('dialog',{name:'Tomemos un momento'});await expect(dialog).toContainText('25,54 %');await expect(dialog).toContainText('2020-03-31');await expect(dialog).toContainText('2020-03-11');await expect(dialog).toContainText('no demuestra');await expect(dialog).not.toContainText('13,10');
 await dialog.getByRole('button',{name:'Continuar en la demo'}).click();await finishReplay(page);await expect(page.locator('.sim-result')).toContainText('744,62');
 // Mi cartera (diseño por nivel) se construye con los NAV reales CNMV: valor calculado 28.176 € (coste DEMO 25.000 €: 5 fondos x 5.000 €), periodo 2019-12-31 a 2025-12-31 y recuadro de origen.
 await page.getByRole('button',{name:'Mi cartera',exact:true}).click();await page.getByText('Origen de los datos').click();await expect(page.getByText('de dic 2019 a dic 2025 (72 meses)', {exact:false})).toBeVisible();await expect(page.getByText('28.176 €').first()).toBeVisible();
});
test('obsolete catalogue response is rejected and local recovery is explicit',async({page})=>{
 await page.route('**/api/catalog',async route=>{const r=await route.fetch();const json=await r.json();json.schemaVersion='1.0';await route.fulfill({response:r,json})});await page.addInitScript(()=>localStorage.setItem('t2f-data-mode','server'));await page.goto('/');await expect(page.getByRole('heading',{name:'No se pudo cargar el catálogo'})).toBeVisible();await page.getByRole('button',{name:'Usar demo local'}).click();await expect(page.locator('.demo-badge')).toBeVisible();
});
for(const width of [320,800,1024,1280]) for(const language of ['es','en'] as const) for(const theme of ['light','dark'] as const) test(`demo notice ${width} ${language} ${theme}`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.addInitScript(({language,theme})=>{localStorage.setItem('t2f-data-mode','local');localStorage.setItem('t2f-language',language);localStorage.setItem('t2f-theme',theme)},{language,theme});await page.goto('/');const badge=page.locator('.demo-badge');await expect(badge).toBeVisible();await expect(badge).toHaveText(language==='es'?'Modo demo · Sin dinero real':'Demo mode · No real money');const rect=await badge.boundingBox();expect(rect).not.toBeNull();expect(rect!.x).toBeGreaterThanOrEqual(0);expect(rect!.x+rect!.width).toBeLessThanOrEqual(width);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});
for(const corruption of ['invalid-date','stale-dataset'] as const) test(`invalid ${corruption} catalogue enters recovery instead of crashing`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await page.route('**/api/catalog',async route=>{const r=await route.fetch();const body=await r.json();if(corruption==='invalid-date')body.navHistory.instruments[0].monthly[1].date='2020-02-31';else body.navHistory.datasetVersion='obsolete-version';await route.fulfill({response:r,json:body})});await page.addInitScript(()=>localStorage.setItem('t2f-data-mode','server'));await page.goto('/');await expect(page.getByRole('heading',{name:'No se pudo cargar el catálogo'})).toBeVisible();expect(errors).toEqual([]);
});
test('annual contributions use twelve-month closes and reach the tutor',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('t2f-data-mode','server'));await page.goto('/');await page.getByRole('button',{name:'Simulador',exact:true}).click();await pickFund(page);await page.getByLabel('Importe inicial').fill('1000');await page.getByText('Más opciones').click();await page.getByLabel('Frecuencia de aportación').selectOption('annual');await page.getByLabel('Aportación anual').fill('100');await page.getByLabel('Tiempo de práctica').fill('36');await reveal(page);await finishReplay(page);await expect(page.locator('.sim-values')).toContainText('1300,00');const req=page.waitForRequest(r=>r.url().endsWith('/api/tutor')&&r.method()==='POST');await page.getByRole('button',{name:'Explícame este resultado'}).click();await page.getByLabel('Tu pregunta').fill('Explica el resultado');await page.getByRole('button',{name:'Enviar pregunta'}).click();expect((await req).postDataJSON().context.simulation.contributionFrequency).toBe('annual');await expect(page.locator('.message.assistant').last()).toContainText('cada 12 cierres');
});
test('CSV includes baseline NAV, source and dataset identity',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('t2f-data-mode','local'));await page.goto('/');await page.getByRole('button',{name:'Explorar',exact:true}).click();await page.getByRole('button',{name:'Avanzado',exact:true}).click();const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Descargar serie disponible (CSV)'}).click();const file=await pending;const content=await (await file.createReadStream());let csv='';for await(const chunk of content!)csv+=chunk.toString();expect(csv).toContain('dataset_sha256');expect(csv).toContain('nav_history_sha256');expect(csv).toContain('ES0138045002');expect(csv).toContain('2019-12-31');expect(csv.split('\r\n')).toHaveLength(74);
});
