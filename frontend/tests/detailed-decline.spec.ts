import { test, expect } from '@playwright/test';

const ids = ['observed','context','mechanism','portfolio','decision','uncertainty'];
const answer = (mode: 'demo'|'ai' = 'demo') => ({schemaVersion:'1.0',mode,provider:mode==='ai'?'anthropic':'local_rules',model:mode==='ai'?'claude-sonnet-5-5':null,language:'es',summary:'Resumen de prueba',sections:ids.map(id=>({id,title:`Sección ${id}`,paragraphs:[`Texto ${id}`],sourceIds:id==='context'?['who']:[]})),sources:[{id:'who',label:'OMS',url:'https://www.who.int/'}]});
const open = async (page: import('@playwright/test').Page) => {await page.goto('/'); // El análisis detallado depende de la serie del servidor `portfolio_demo`: se abre con «Probar una caída» (Inicio), no con el enlace calm sobre la cartera DEMO.
 await page.getByRole('button',{name:'Probar una caída'}).click(); return page.getByRole('dialog',{name:'Tomemos un momento'});};

test('local mode builds six sections without calling the analysis API', async ({page}) => {
 let requests=0; page.on('request',r=>{if(r.url().endsWith('/api/decline-explanations'))requests++;});
 await page.addInitScript(()=>localStorage.setItem('t2f-data-mode','local')); const dialog=await open(page);
 const analysis=dialog.locator('.detailed-analysis'); await expect(analysis).toContainText('Análisis educativo de demostración');
 await expect(analysis.locator('.detailed-analysis__sections > section')).toHaveCount(6);
 await expect(analysis).toContainText('2020-03-11'); await expect(analysis).toContainText('2020-03-31');
 await expect(analysis).not.toContainText('Explicación generada con IA'); expect(requests).toBe(0);
});

test('server confirms AI and requests new context only on explicit update', async ({page}) => {
 const bodies: any[]=[];
 await page.addInitScript(()=>localStorage.setItem('t2f-data-mode','server'));
 await page.route('**/api/decline-explanations',async route=>{bodies.push(route.request().postDataJSON()); await route.fulfill({json:answer('ai')});});
 const dialog=await open(page); const analysis=dialog.locator('.detailed-analysis');
 await expect(analysis).toContainText('Explicación generada con IA'); await expect(analysis).toContainText('claude-sonnet-5-5');
 await expect(analysis.locator('.detailed-analysis__sections > section')).toHaveCount(6); await expect(analysis.getByRole('link',{name:'OMS'})).toHaveAttribute('href','https://www.who.int/');
 expect(bodies).toHaveLength(1); expect(bodies[0].decline.basis).toBe('portfolio_demo'); expect(bodies[0].decline).not.toHaveProperty('currentDrawdownPercent');
 await dialog.getByText('Añadir contexto (opcional)').click(); await dialog.getByLabel('Objetivo (opcional)').fill('Estudios'); await dialog.getByLabel('¿Necesitas liquidez pronto? (opcional)').selectOption('yes');
 await expect(analysis).toContainText('Contexto cambiado: actualiza el análisis');
 expect(bodies).toHaveLength(1); await analysis.getByRole('button',{name:'Actualizar análisis con mi contexto'}).click();
 await expect.poll(()=>bodies.length).toBe(2); expect(bodies[1].decision).toMatchObject({goal:'Estudios',needsLiquidity:'yes'}); await expect(analysis).not.toContainText('Contexto cambiado');
});

test('errors and invalid AI responses remain visible and require retry', async ({page}) => {
 let attempts=0; await page.addInitScript(()=>localStorage.setItem('t2f-data-mode','server'));
 await page.route('**/api/decline-explanations',async route=>{attempts++; if(attempts===1) await route.fulfill({status:503,body:'unavailable'}); else if(attempts===2) await route.fulfill({json:{...answer('ai'),sources:[{id:'who',label:'bad',url:'http://invalid.test'}]}}); else await route.fulfill({json:answer()});});
 const dialog=await open(page); const analysis=dialog.locator('.detailed-analysis');
 await expect(analysis).toContainText('No se ha podido generar'); await expect(dialog.locator('.anti-panic__metric').first()).toContainText('25,54');
 await analysis.getByRole('button',{name:'Reintentar análisis'}).click(); await expect(analysis).toContainText('No se ha podido generar');
 await analysis.getByRole('button',{name:'Reintentar análisis'}).click(); await expect(analysis).toContainText('Análisis educativo de demostración'); await expect(analysis).not.toContainText('Explicación generada con IA'); expect(attempts).toBe(3);
});

test('cancelled requests cannot replace a later result', async ({page}) => {
 let attempts=0; let release!:()=>void; const wait=new Promise<void>(resolve=>{release=resolve;});
 await page.addInitScript(()=>localStorage.setItem('t2f-data-mode','server'));
 await page.route('**/api/decline-explanations',async route=>{attempts++; if(attempts===1){await wait; await route.fulfill({json:{...answer('ai'),summary:'Stale response'}}).catch(()=>{});} else await route.fulfill({json:answer()});});
 const dialog=await open(page); const analysis=dialog.locator('.detailed-analysis'); await expect(analysis).toContainText('Preparando');
 await analysis.getByRole('button',{name:'Cancelar análisis'}).click(); await expect(analysis).toContainText('Análisis cancelado');
 await analysis.getByRole('button',{name:'Reintentar análisis'}).click(); await expect(analysis).toContainText('Análisis educativo de demostración'); release();
 await expect(analysis).not.toContainText('Stale response');
});

test('closing a pending request cannot update the next opening', async ({page}) => {
 let attempts=0; let release!:()=>void; const wait=new Promise<void>(resolve=>{release=resolve;});
 await page.addInitScript(()=>localStorage.setItem('t2f-data-mode','server'));
 await page.route('**/api/decline-explanations',async route=>{attempts++; if(attempts===1){await wait; await route.fulfill({json:{...answer('ai'),summary:'Stale closed response'}}).catch(()=>{});} else await route.fulfill({json:answer()});});
 let dialog=await open(page); await expect(dialog.locator('.detailed-analysis')).toContainText('Preparando');
 await dialog.getByRole('button',{name:'Cerrar',exact:true}).click(); await page.getByRole('button',{name:'Inicio',exact:true}).click(); await page.getByRole('button',{name:'Probar una caída'}).click();
 dialog=page.getByRole('dialog',{name:'Tomemos un momento'}); await expect(dialog.locator('.detailed-analysis')).toContainText('Análisis educativo de demostración'); release();
 await expect(dialog.locator('.detailed-analysis')).not.toContainText('Stale closed response');
});

test('analysis control keeps keyboard focus through cancellation, retry, error and success', async ({page}) => {
 let attempts=0; let releaseFirst!:()=>void; let releaseSecond!:()=>void; let releaseThird!:()=>void;
 const first=new Promise<void>(r=>{releaseFirst=r;}), second=new Promise<void>(r=>{releaseSecond=r;}), third=new Promise<void>(r=>{releaseThird=r;});
 await page.addInitScript(()=>localStorage.setItem('t2f-data-mode','server'));
 await page.route('**/api/decline-explanations',async route=>{
  attempts++;
  if(attempts===1){await first; await route.fulfill({json:answer()}).catch(()=>{});}
  else if(attempts===2){await second; await route.fulfill({status:503,body:'unavailable'});}
  else {await third; await route.fulfill({json:answer()});}
 });
 const card=page.getByRole('button',{name:'Probar una caída'}); await page.goto('/'); await card.focus(); await page.keyboard.press('Enter');
 const dialog=page.getByRole('dialog',{name:'Tomemos un momento'}); const control=dialog.locator('.detailed-analysis > button');
 await expect(control).toHaveText('Cancelar análisis'); await control.focus(); await page.keyboard.press('Enter'); await expect(control).toHaveText('Reintentar análisis'); await expect(control).toBeFocused();
 await page.keyboard.press('Enter'); await expect(control).toHaveText('Cancelar análisis'); await expect(control).toBeFocused(); releaseSecond();
 await expect(control).toHaveText('Reintentar análisis'); await expect(control).toBeFocused();
 await page.keyboard.press('Enter'); await expect(control).toHaveText('Cancelar análisis'); releaseThird();
 await expect(control).toHaveText('Actualizar análisis con mi contexto'); await expect(control).toBeFocused(); releaseFirst();
 await page.keyboard.press('Escape'); await expect(dialog).toBeHidden(); // «Probar una caída» cambia de página: el disparador ya no existe y el foco pasa al contenido principal.
 await expect(page.locator('main')).toBeFocused();
});
