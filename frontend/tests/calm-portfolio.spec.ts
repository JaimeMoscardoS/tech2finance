import { test, expect } from '@playwright/test';

for (const language of ['es', 'en'] as const) for (const theme of ['light', 'dark'] as const) for (const width of [375, 1280]) {
 test(`calm flow ${language} ${theme} ${width}`, async ({page}) => {
  await page.setViewportSize({width,height:800});
  await page.addInitScript(({language,theme}) => { localStorage.setItem('t2f-data-mode','local'); localStorage.setItem('t2f-language',language); localStorage.setItem('t2f-theme',theme); }, {language,theme});
  await page.goto('/');
  const card=page.getByRole('button',{name:language==='es'?/¿Te preocupa la caída\?/:/Worried about the decline\?/});
  await expect(card).toBeVisible(); await card.focus(); await page.keyboard.press('Enter');
  const dialog=page.getByRole('dialog',{name:language==='es'?'Tomemos un momento':'Let’s take a moment'});
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(language==='es'?'nadie puede garantizar':'no one can guarantee');
  await expect(dialog).toContainText(language==='es'?'puedes vender, mantener':'you can sell, hold');
  await page.screenshot({path:`test-results/calm-${language}-${theme}-${width}.png`});
  await dialog.getByText(language==='es'?'Añadir contexto (opcional)':'Add context (optional)').click();
  await dialog.getByRole('button',{name:language==='es'?'Cargar ejemplo ficticio':'Load fictional example'}).click();
  const goal=dialog.getByLabel(language==='es'?'Objetivo (opcional)':'Goal (optional)');
  await expect(goal).not.toHaveValue(''); await goal.fill('Edited'); await expect(goal).toHaveValue('Edited');
  const liquidity=dialog.getByLabel(language==='es'?'¿Necesitas liquidez pronto? (opcional)':'Do you need cash soon? (optional)');
  await expect(liquidity).toHaveValue('unknown'); await liquidity.selectOption('yes'); await liquidity.selectOption('no'); await expect(liquidity).toHaveValue('no');
  await dialog.getByRole('button',{name:language==='es'?'Continuar en la demo':'Continue in the demo'}).click();
  await card.click(); await expect(dialog).toBeVisible();
  await dialog.getByRole('button',{name:language==='es'?'Preguntar al asistente':'Ask the assistant'}).click();
  const assistant=page.getByRole('dialog',{name:language==='es'?'Tu asistente':'Your assistant'});
  const suggestion=language==='es'?'Me preocupa la caída, ¿debería vender?':"I'm worried about the drop; should I sell?";
  await assistant.getByRole('button',{name:suggestion}).click();
  await expect(assistant.getByRole('textbox')).toHaveValue(suggestion); await expect(assistant.locator('.message.user')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 });
}

test('fictional goals are editable and reset', async ({page}) => {
 await page.addInitScript(()=>localStorage.setItem('t2f-data-mode','local')); await page.goto('/');
 await page.getByRole('button',{name:'Explorar',exact:true}).click(); await page.locator('.goals-panel summary').click();
 const panel=page.locator('.goals-panel'); await expect(panel).toContainText('Perfil ficticio');
 await expect(panel.getByLabel('¿Para qué ahorras?')).toHaveValue('project');
 await panel.getByLabel('¿Para qué ahorras?').selectOption('retirement');
 await panel.getByRole('button',{name:'Restablecer ejemplo ficticio'}).click();
 await expect(panel.getByLabel('¿Para qué ahorras?')).toHaveValue('project');
 await expect(panel.getByLabel('Importe de ejemplo opcional (€)')).toHaveValue('10000');
});

test('dialog traps focus with details closed and open and restores the trigger', async ({page}) => {
 await page.addInitScript(()=>localStorage.setItem('t2f-data-mode','local')); await page.goto('/');
 const card=page.getByRole('button',{name:/¿Te preocupa la caída\?/}); await card.focus(); await page.keyboard.press('Enter');
 const dialog=page.getByRole('dialog',{name:'Tomemos un momento'}); const close=dialog.getByRole('button',{name:'Cerrar',exact:true});
 await expect(close).toBeFocused(); await page.keyboard.press('Shift+Tab'); await expect(dialog.getByRole('button',{name:'Continuar en la demo'})).toBeFocused();
 await page.keyboard.press('Tab'); await expect(close).toBeFocused();
 await dialog.getByText('Añadir contexto (opcional)').click(); await close.focus(); await page.keyboard.press('Shift+Tab');
 await expect.poll(()=>page.evaluate(()=>document.activeElement?.closest('[role=dialog]') !== null)).toBe(true);
 await page.keyboard.press('Tab'); await expect(close).toBeFocused(); await page.keyboard.press('Escape'); await expect(card).toBeFocused();
});

for (const mode of ['local','server'] as const) test(`concern and liquidity context reaches tutor in ${mode}`, async ({page}) => {
 await page.addInitScript(mode=>localStorage.setItem('t2f-data-mode',mode),mode); await page.goto('/');
 const card=page.getByRole('button',{name:/¿Te preocupa la caída\?/}); await card.click();
 const dialog=page.getByRole('dialog',{name:'Tomemos un momento'}); await dialog.getByText('Añadir contexto (opcional)').click();
 await dialog.getByRole('button',{name:'Cargar ejemplo ficticio'}).click(); await dialog.getByLabel('Objetivo (opcional)').fill('Proyecto editado');
 await dialog.getByLabel('¿Necesitas liquidez pronto? (opcional)').selectOption('yes');
 await dialog.getByRole('button',{name:'Continuar en la demo'}).click(); await card.click(); await dialog.getByText('Añadir contexto (opcional)').click();
 await expect(dialog.getByLabel('Objetivo (opcional)')).toHaveValue('Proyecto editado'); await expect(dialog.getByLabel('¿Necesitas liquidez pronto? (opcional)')).toHaveValue('yes');
 await dialog.getByRole('button',{name:'Preguntar al asistente'}).click(); const assistant=page.getByRole('dialog',{name:'Tu asistente'});
 await assistant.getByRole('button',{name:'Me preocupa la caída, ¿debería vender?'}).click();
 const request=mode==='server'?page.waitForRequest(r=>r.url().endsWith('/api/tutor') && r.method()==='POST'):null;
 await assistant.getByRole('button',{name:'Enviar pregunta'}).click();
 if(request){const body=(await request).postDataJSON(); expect(body.context.decision.needsLiquidity).toBe('yes'); expect(body.context.decision.goal).toBe('Proyecto editado');}
 await expect(assistant.locator('.message.assistant').last()).toContainText(/liquidez|dinero/i);
 await expect(assistant.locator('.message.assistant').last()).toContainText(/comprensible.*preocupación/i);
});

for (const mode of ['local','server'] as const) test(`historical explanation is immediately available in ${mode}`, async ({page}) => {
 await page.addInitScript(mode=>localStorage.setItem('t2f-data-mode',mode),mode); await page.goto('/');
 await page.getByRole('button',{name:/¿Te preocupa la caída\?/}).click();
 const dialog=page.getByRole('dialog',{name:'Tomemos un momento'});
 await expect(dialog.getByRole('heading',{name:'Qué está pasando y por qué puede pasar'})).toBeVisible();
 await expect(dialog.locator('.anti-panic__explanation')).toContainText('25,54 %');
 await expect(dialog.locator('.anti-panic__explanation')).toContainText('2020-03-31');
 await expect(dialog.locator('.anti-panic__explanation')).toContainText('ejemplo histórico');
 await expect(dialog.locator('.anti-panic__explanation')).toContainText('no una explicación comprobada');
 await expect(dialog.locator('.anti-panic__story')).toContainText('2020-03-11');
 await expect(dialog.locator('.anti-panic__story')).toContainText('no demuestra');
 await expect(dialog.getByRole('link',{name:'Fuente original'})).toHaveAttribute('href',/who\.int/);
 await expect(dialog.getByRole('link',{name:/CNMV/})).toBeVisible();
});

for (const scenario of ['zero','insufficient'] as const) test(`no unsupported crisis or event for ${scenario}`, async ({page}) => {
 await page.addInitScript(()=>localStorage.setItem('t2f-data-mode','server'));
 await page.route('**/api/declines',async route=>{
  const response=await route.fetch(); const body=await response.json(); delete body.historicalContext; body.episodes=[];
  if(scenario==='zero'){body.currentDrawdownPercent=0; body.maxDrawdownPercent=0;}
  else {body.status='insufficient_data'; body.observationCount=1; body.latestLabel=null; body.latestValue=null; body.peakValue=null; body.currentDrawdownPercent=null; body.maxDrawdownPercent=null;}
  await route.fulfill({response,json:body});
 });
 await page.goto('/'); await page.getByRole('button',{name:/¿Te preocupa la caída\?/}).click();
 const dialog=page.getByRole('dialog',{name:'Tomemos un momento'});
 await expect(dialog.locator('.anti-panic__explanation')).toContainText(scenario==='zero'?'no se muestra una caída':'no hay suficientes observaciones');
 await expect(dialog.locator('.anti-panic__explanation')).toContainText('No hay un acontecimiento público verificado');
 await expect(dialog.locator('.anti-panic__story')).toHaveCount(0);
 await expect(dialog).not.toContainText('2020-03-11');
});
