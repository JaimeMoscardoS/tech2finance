import { test, expect, devices } from '@playwright/test';

test('users can explore, change level and run a labelled simulation', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Invertir empieza/ })).toBeVisible();
  await page.getByRole('button', { name: /Detalle: Principiante/ }).click();
  await page.getByRole('button', { name: 'Avanzado' }).click();
  await page.getByRole('button', { name: 'Simulador', exact: true }).click();
  await expect(page.getByText(/Cierres mensuales históricos de la CNMV/)).toBeVisible();
  await expect(page.getByText(/aportaciones al cierre/i).first()).toBeVisible();
  await page.getByLabel('Importe inicial').fill('100');
  await page.getByLabel('Aportación mensual').fill('');
  await page.getByRole('button', { name: 'Ver mi ejemplo' }).click();
  await expect(page.locator('.sim-values strong').filter({hasText:'100,00 €'})).toBeVisible();
  await page.getByRole('button', { name: 'Abrir asistente' }).click();
  await expect(page.getByText(/MODO LOCAL/)).toBeVisible();
});

test('pause dialog handles keyboard focus and escape', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Mi cartera', exact: true }).click();
  const trigger = page.getByRole('button', { name: /¿Te preocupa la caída\?/ });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Cerrar', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('mobile navigation is hidden until opened', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Simulador', exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await page.getByRole('button', { name: 'Simulador', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Simular inversión' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await context.close();
});
test('language and theme switches apply across the interface and persist', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/');
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: /Investing starts/ })).toBeVisible();
  await page.getByRole('button', { name: 'Dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.getByRole('heading', { name: /Investing starts/ })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('experience levels show distinct views without changing the selected risk', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/');
  await expect(page.getByText('Tu punto de partida')).toBeVisible();
  await page.getByRole('button', { name: /Detalle: Principiante/ }).click();
  await page.getByRole('button', { name: 'Intermedio' }).click();
  await expect(page.getByText('Tu panorama')).toBeVisible();
  await page.getByRole('button', { name: /Detalle: Intermedio/ }).click();
  await page.getByRole('button', { name: 'Avanzado' }).click();
  await expect(page.getByText('Panel de análisis')).toBeVisible();
});
test('English navigation, assistant and simulated portfolio are translated', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/');
  await page.getByRole('button', { name: 'English' }).click();
  await page.getByRole('button', { name: 'Explore', exact: true }).click();
  await expect(page.getByText('Explore the available information and its limits. These are not recommendations.')).toBeVisible();
  await page.getByRole('button', { name: 'My portfolio', exact: true }).click();
  await page.getByRole('button', { name: 'Worried about the decline?' }).click();
  await expect(page.getByText(/no one can guarantee whether or when it will recover/)).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Open assistant' }).click();
  await expect(page.getByText('LOCAL MODE · RULE-BASED RESPONSES')).toBeVisible();
  await page.getByRole('button', { name: 'What is a fund?' }).click();
  await page.getByRole('button', { name: 'Send question' }).click();
  await expect(page.getByText(/A fund pools investors/ )).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open assistant' })).toBeFocused();
});

test('mobile menu traps focus, closes with Escape and restores focus', async ({ browser }) => {
 const context = await browser.newContext({ viewport: { width: 320, height: 700 } });
 const page = await context.newPage(); await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/');
 const trigger = page.getByRole('button', { name: 'Abrir menú' });
 await trigger.click(); const close = page.getByRole('dialog', { name: 'MI ESPACIO' }).getByRole('button', { name: 'Cerrar menú', exact: true });
 await expect(close).toBeFocused(); await page.keyboard.press('Shift+Tab');
 await expect(page.getByRole('button', { name: 'Tu asistente', exact: true })).toBeFocused();
 await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
 await context.close();
});

test('English intermediate view fits a 320px screen', async ({ browser }) => {
 const context = await browser.newContext({ viewport: { width: 320, height: 700 } });
 const page = await context.newPage(); await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/');
 await page.getByRole('button', { name: 'English' }).click();
 await page.getByRole('button', { name: 'Detail: Beginner' }).click();
 await page.getByRole('button', { name: 'Intermediate', exact: true }).click();
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
 await context.close();
});

test('opening the assistant from the mobile menu transfers focus to the dialog', async ({ browser }) => {
 const context = await browser.newContext({ viewport: { width: 320, height: 700 } });
 const page = await context.newPage(); await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/');
 await page.getByRole('button', { name: 'Abrir menú' }).click();
 await page.getByRole('button', { name: 'Tu asistente', exact: true }).click();
 const dialog = page.getByRole('dialog', { name: 'Tu asistente' });
 await expect(dialog).toBeVisible();
 await expect(dialog.getByRole('button', { name: 'Cerrar asistente' })).toBeFocused();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeFocused();
 await context.close();
});

test('catalogue selection changes the example and preserves the selected real fund across levels', async ({ page }) => {
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/');
 await page.getByRole('button', {name:'Simulador', exact:true}).click();
 const panel=page.locator('.sim-result');
 const original=await panel.locator('.sim-values strong').first().textContent();
 await page.getByLabel('Instrumento').selectOption('bbva-mi-inversion-bolsa-acumulacion');
 await expect(page.getByLabel('Instrumento')).toHaveValue('bbva-mi-inversion-bolsa-acumulacion');
 expect(await panel.locator('.sim-values strong').first().textContent()).not.toBe(original);
 const newValue=await panel.locator('.sim-values strong').first().textContent();
 await page.getByRole('button', {name:/Detalle: Principiante/}).click();
 await page.getByRole('button', {name:'Avanzado', exact:true}).click();
 await expect(panel.locator('.sim-values strong').first()).toHaveText(newValue!);
 await expect(page.getByLabel('Entidad',{exact:true})).toHaveCount(0);
 await page.screenshot({path:'test-results/catalog-desktop.png',fullPage:true});
});

test('explore transfers the chosen real instrument', async ({page}) => {
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/');
 await page.getByRole('button',{name:'Explorar',exact:true}).click();
 await page.locator('.beginner-guide select').last().selectOption('bbva-mi-inversion-bolsa-acumulacion');
 await page.getByRole('button',{name:'Practicar con este fondo'}).click();
 await expect(page.getByLabel('Instrumento')).toHaveValue('bbva-mi-inversion-bolsa-acumulacion');
 await expect(page.locator('.sim-result')).toContainText('BBVA MI INVERSION BOLSA ACUMULACION');
});

test('catalogue fits mobile in English dark mode', async ({browser}) => {
 const context=await browser.newContext({viewport:{width:320,height:700}});
 const page=await context.newPage(); await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('http://127.0.0.1:5194/');
 await page.getByRole('button',{name:'English'}).click();
 await page.getByRole('button',{name:'Dark theme'}).click();
 await page.getByRole('button',{name:'Open menu'}).click();
 await page.getByRole('button',{name:'Simulator',exact:true}).click();
 await page.getByLabel('Asset type').selectOption('fund');
 await page.screenshot({path:'test-results/catalog-mobile.png',fullPage:true});
 await expect(page.getByText(/Historical monthly CNMV closes/).first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await context.close();
});

test('monthly NAV simulation preserves contributions and values across preferences', async ({ page }) => {
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('http://127.0.0.1:5194/');
 await page.getByRole('button', {name:'Simulador', exact:true}).click();
 const panel=page.locator('.sim-result');
 await expect(page.getByLabel('Instrumento')).toHaveValue('caixabank-monetario-estandar');
 await page.getByLabel('Tiempo de práctica').selectOption('12');
 await page.getByLabel('Aportación mensual').fill('100');
 await expect(panel.getByText(/Has cambiado los datos/)).toBeVisible();
 await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
 await expect(panel.locator('.sim-values strong').filter({hasText:'1700,75 €'})).toBeVisible();
 await expect(panel.locator('.sim-values strong').filter({hasText:'1700,00 €'})).toBeVisible();
 await page.getByRole('button',{name:'Abrir asistente'}).click();
 await page.getByRole('button',{name:'¿Cómo funciona la simulación?'}).click();
 await page.getByRole('button',{name:'Enviar pregunta'}).click();
 await expect(page.locator('.message.assistant').last()).toContainText(/mensual|cierre/i);
 await page.keyboard.press('Escape');
 await page.getByLabel('Aportación mensual').fill('0');
 await page.getByLabel('Importe inicial').fill('1000');
 await expect(panel.getByText(/Has cambiado los datos/)).toBeVisible();
 await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
 await expect(panel.locator('.sim-values strong').filter({hasText:'999,70 €'})).toBeVisible();
 await page.getByRole('button',{name:/Detalle: Principiante/}).click();
 await page.getByRole('button',{name:'Avanzado',exact:true}).click();
 await expect(panel.locator('.sim-values strong').filter({hasText:'999,70 €'})).toBeVisible();
 await page.getByRole('button',{name:'Modo oscuro'}).click();
 await page.getByRole('button',{name:'English'}).click();
 await expect(panel.locator('.sim-values strong').filter({hasText:'€999.70'})).toBeVisible();

});

test('tablet layout, modal scrolling and mobile menu background', async ({ browser }) => {
 const tablet=await browser.newContext({viewport:{width:768,height:1024}});
 const page=await tablet.newPage(); await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/');
 await page.getByRole('button',{name:'English'}).click();
 await page.getByRole('button',{name:'Dark theme'}).click();
 await page.getByRole('button',{name:'Simulator',exact:true}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await page.screenshot({path:'test-results/simulator-tablet.png',fullPage:true});
 await page.getByRole('button',{name:'Detail: Beginner'}).click();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('button',{name:'Detail: Beginner'})).toHaveAttribute('aria-expanded','false');
 await tablet.close();
 const mobile=await browser.newContext({viewport:{width:568,height:320}});
 const phone=await mobile.newPage(); await phone.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local')); await phone.goto('/');
 await phone.getByRole('button',{name:'Abrir menú'}).click();
 await expect(phone.locator('main')).toHaveAttribute('inert','');
 await phone.getByRole('button',{name:'Mi cartera',exact:true}).click();
 await phone.getByRole('button',{name:'¿Te preocupa la caída?'}).click();
 const modal=phone.getByRole('dialog');
 expect(await modal.evaluate(el=>el.scrollHeight>el.clientHeight)).toBeTruthy();
 await modal.getByRole('button',{name:'Continuar en la demo'}).scrollIntoViewIfNeeded();
 await expect(modal.getByRole('button',{name:'Continuar en la demo'})).toBeInViewport();
 await phone.screenshot({path:'test-results/pause-landscape.png'});
 await mobile.close();
});

test('monthly deposits, table and percentage view stay consistent across preferences', async ({page}) => {
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('http://127.0.0.1:5194/');
 await page.getByRole('button',{name:'Simulador',exact:true}).click();
 await page.getByLabel('Tiempo de práctica').selectOption('12');
 await page.getByLabel('Aportación mensual').fill('50');
 await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
 const panel=page.locator('.sim-result');
 await expect(panel.locator('.sim-values strong').nth(0)).toHaveText('1100,30 €');
 await expect(panel.locator('.sim-values strong').nth(1)).toHaveText('1100,00 €');
 await expect(panel.locator('.sim-values strong').nth(2)).toHaveText('0,30 €');
 await expect(panel.locator('[role="status"][aria-atomic="true"]')).toContainText('Resultado actualizado');
 await panel.getByText('Ver datos', {exact:true}).click();
 const rows=panel.getByRole('table',{name:'Datos del gráfico: Evolución de la práctica'}).locator('tbody tr');
 await expect(rows).toHaveCount(13);
 await expect(rows.nth(0)).toContainText('Importe inicial: 500,00 €');
 await expect(rows.last()).toContainText('1100,30 €');
 await expect(rows.last()).toContainText('1100,00 €');
 await expect(rows.last()).toContainText('2020-12-31');
 await panel.getByRole('button',{name:'Evolución del instrumento (%)'}).click();
 await expect(rows.last()).toContainText('2020-12-31');
 await page.getByRole('button',{name:/Detalle: Principiante/}).click();
 await page.getByRole('button',{name:'Intermedio',exact:true}).click();
 await page.getByRole('button',{name:'Modo oscuro'}).click();
 await page.getByRole('button',{name:'English'}).click();
 await expect(panel.locator('.sim-values strong').nth(0)).toHaveText('€1,100.30');
 await expect(panel.getByRole('button',{name:'Instrument performance (%)'})).toHaveAttribute('aria-pressed','true');
 await page.getByLabel('Monthly contribution').fill('75');
 await expect(panel.getByText(/Your inputs changed/)).toBeVisible();
 await expect(panel.locator('.investment-chart')).toHaveCount(0);

});

test('validation identifies the actual monthly contribution field', async ({page}) => {
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('http://127.0.0.1:5194/'); await page.getByRole('button',{name:'Simulador',exact:true}).click();
 const initial=page.getByLabel('Importe inicial'); const annual=page.getByLabel('Aportación mensual');
 await initial.fill('-1'); await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
 await expect(initial).toHaveAttribute('aria-invalid','true');
 await expect(annual).toHaveAttribute('aria-invalid','false');
 await expect(page.getByRole('alert')).toContainText('Importe inicial');
 await initial.fill('500'); await annual.fill('-1'); await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
 await expect(initial).toHaveAttribute('aria-invalid','false');
 await expect(annual).toHaveAttribute('aria-invalid','true');
 await expect(annual).toHaveAttribute('aria-describedby','sim-error');
 await expect(page.getByRole('alert')).toContainText('Aportación mensual');
});

test('portfolio chart retains useful width on narrow screens', async ({browser}) => {
 for (const width of [320,768]) {
  const context=await browser.newContext({viewport:{width,height:900}});
  const page=await context.newPage(); await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/');
  if (width===768) { await page.getByRole('button',{name:'English'}).click(); await page.getByRole('button',{name:'Dark theme'}).click(); }
  if (width===320) await page.getByRole('button',{name:'Abrir menú'}).click();
  await page.getByRole('button',{name: width===768 ? 'My portfolio' : 'Mi cartera',exact:true}).click();
  const plot=page.locator('.large-portfolio .investment-chart__plot');
  await expect(plot).toBeVisible();
  expect((await plot.boundingBox())!.width).toBeGreaterThan(width===320?200:260);
  await page.screenshot({path:`test-results/portfolio-${width}.png`,fullPage:true});
  await context.close();
 }
});

test('local tutor grounds results, keeps previous messages and excludes dirty results', async ({page}) => {
 const providerRequests:string[]=[];
 page.on('request',request=>{if (/anthropic|elevenlabs/i.test(request.url())) providerRequests.push(request.url());});
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('http://127.0.0.1:5194/'); await page.getByRole('button',{name:'Simulador',exact:true}).click();
 await page.getByLabel('Tiempo de práctica').selectOption('12');
 await page.getByLabel('Aportación mensual').fill('50'); await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
 await page.getByRole('button',{name:'Abrir asistente'}).click();
 const dialog=page.getByRole('dialog',{name:'Tu asistente'});
 await dialog.getByLabel('Tu pregunta').fill('¿Cuál es el resultado?'); await dialog.getByRole('button',{name:'Enviar pregunta'}).click();
 await expect(dialog.locator('.message.assistant').last()).toContainText('valor final 1100,3 EUR');
 await expect(dialog.locator('.message.assistant').last()).toContainText('aportado en total 1100 EUR');
 await expect(dialog.getByRole('link',{name:/CNMV/})).toBeVisible();
 await dialog.getByLabel('Tu pregunta').fill('¿Cómo funciona la simulación?'); await dialog.getByRole('button',{name:'Enviar pregunta'}).click();
 await expect(dialog.locator('.message.assistant').last()).toContainText(/mensual|cierre/i);
 const previous=await dialog.locator('.message.assistant p').last().textContent();
 await page.keyboard.press('Escape'); await page.getByRole('button',{name:'English'}).click();
 await page.getByRole('button',{name:'Open assistant'}).click();
 await expect(page.locator('.message.assistant p').last()).toHaveText(previous!);
 await expect(page.locator('.message.assistant[lang="es"]').last()).toBeVisible();
 await expect(page.getByRole('button',{name:'Dictate'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Listen'})).toBeVisible();
 await page.keyboard.press('Escape'); await page.getByLabel('Monthly contribution').fill('75');
 await page.getByRole('button',{name:'Open assistant'}).click();
 const english=page.getByRole('dialog',{name:'Your assistant'});
 await english.getByLabel('Your question').fill('What is the result?'); await english.getByRole('button',{name:'Send question'}).click();
 await expect(english.getByText(/not enough valid simulation data/i)).toBeVisible();
 expect(providerRequests).toEqual([]);
});

test('assistant remains scrollable and voice controls reachable in short landscape', async ({browser}) => {
 const context=await browser.newContext({viewport:{width:568,height:320}}); const page=await context.newPage();
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/'); await page.getByRole('button',{name:'Abrir asistente'}).click();
 const dialog=page.getByRole('dialog',{name:'Tu asistente'});
 await dialog.getByLabel('Tu pregunta').fill('¿Qué es un fondo?');
 await dialog.getByRole('button',{name:'Enviar pregunta'}).click();
 await expect(dialog.locator('.message.assistant[lang="es"]')).toBeVisible();
 const listen=dialog.getByRole('button',{name:'Escuchar'}); await listen.focus();
 await expect(listen).toBeInViewport();
 const dictate=dialog.getByRole('button',{name:'Dictar'}); await dictate.focus();
 await expect(dictate).toBeInViewport();
 expect(await dialog.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
 expect(await page.evaluate(()=>window.scrollY)).toBe(0);
 await page.screenshot({path:'test-results/local-assistant-landscape.png'});
 await context.close();
});

test('decline explanations use observed series without inventing a current crisis', async ({page}) => {
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/'); await page.getByRole('button',{name:'Simulador',exact:true}).click();
 await page.getByLabel('Instrumento').selectOption('bbva-mi-inversion-bolsa-acumulacion');
 await page.getByLabel('Tiempo de práctica').selectOption('3');
 await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
 await page.getByRole('button',{name:'Entender las caídas'}).click();
 let dialog=page.getByRole('dialog',{name:'Tomemos un momento'});
 await expect(dialog).toContainText('2020-03-31');
 await expect(dialog).toContainText('2020-03-11');
 await expect(dialog.getByText(/causa es desconocida/i)).toBeVisible();
 await dialog.getByText('Añadir contexto (opcional)').click();
 await dialog.getByLabel('Objetivo (opcional)').fill('Ejemplo educativo');
 await dialog.getByLabel('¿Necesitas liquidez pronto? (opcional)').selectOption('yes');
 await dialog.getByRole('button',{name:'Preguntar al asistente'}).click();
 await expect(page.getByRole('dialog',{name:'Tu asistente'})).toBeVisible();
 await page.keyboard.press('Escape'); await page.getByRole('button',{name:'Mi cartera',exact:true}).click();
 await page.getByRole('button',{name:'¿Te preocupa la caída?'}).click();
 dialog=page.getByRole('dialog',{name:'Tomemos un momento'});
 await expect(dialog).toContainText('2020-03-31');
 await expect(dialog).toContainText('25,54 %');
 await dialog.getByRole('button',{name:'Continuar en la demo'}).click();
 await expect(dialog).toBeHidden();
});

test('dictation remains editable and never submits automatically', async ({page}) => {
 await page.addInitScript(()=>{
  class LocalRecognition {
   static available=async()=> 'available'; processLocally=false; lang=''; continuous=false; interimResults=false;
   onstart:(()=>void)|null=null; onend:(()=>void)|null=null; onerror=null; onresult:((event:unknown)=>void)|null=null;
   start(){this.onstart?.();this.onresult?.({resultIndex:0,results:[{isFinal:true,0:{transcript:'Quiero revisar el riesgo'}}]});}
   stop(){this.onend?.();} abort(){}
  }
  Object.defineProperty(window,'SpeechRecognition',{value:LocalRecognition,configurable:true});
 });
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/'); await page.getByRole('button',{name:'Abrir asistente'}).click();
 const dialog=page.getByRole('dialog',{name:'Tu asistente'});
 await dialog.getByRole('button',{name:'Dictar'}).click();
 await expect(dialog.getByLabel('Tu pregunta')).toHaveValue('Quiero revisar el riesgo');
 await expect(dialog.locator('.message.user')).toHaveCount(0);
 await dialog.getByLabel('Tu pregunta').fill('Quiero revisar el riesgo y los costes');
 await dialog.getByRole('button',{name:'Enviar pregunta'}).click();
 await expect(dialog.locator('.message.user')).toHaveCount(1);
});

test('saved Spanish answer reads in Spanish while dictation follows English UI', async ({page}) => {
 await page.addInitScript(()=>{
  const state={spoken:'',dictated:''}; Object.assign(window,{voiceTestState:state});
  class Utterance { text:string; lang=''; voice:unknown; onstart:(()=>void)|null=null; onend:(()=>void)|null=null; constructor(text:string){this.text=text;} }
  const synth={paused:false,cancel(){},resume(){},getVoices(){return [{localService:true,lang:'es-ES'},{localService:true,lang:'en-US'}];},addEventListener(){},removeEventListener(){},speak(item:Utterance){state.spoken=item.lang;item.onstart?.();}};
  class Recognition { static available=async()=> 'available'; processLocally=false; lang=''; continuous=false; interimResults=false; onstart:(()=>void)|null=null; onend=null; onerror=null; onresult=null; start(){state.dictated=this.lang;this.onstart?.();} abort(){} stop(){} }
  Object.defineProperty(window,'speechSynthesis',{value:synth,configurable:true});
  Object.defineProperty(window,'SpeechSynthesisUtterance',{value:Utterance,configurable:true});
  Object.defineProperty(window,'SpeechRecognition',{value:Recognition,configurable:true});
 });
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/'); await page.getByRole('button',{name:'Abrir asistente'}).click();
 await page.getByLabel('Tu pregunta').fill('¿Qué es un fondo?'); await page.getByRole('button',{name:'Enviar pregunta'}).click();
 await expect(page.locator('.message.assistant[lang="es"]')).toBeVisible();
 await page.keyboard.press('Escape'); await page.getByRole('button',{name:'English'}).click();
 await page.getByRole('button',{name:'Open assistant'}).click();
 await page.getByRole('button',{name:'Listen'}).click();
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {voiceTestState:{spoken:string}}).voiceTestState.spoken)).toBe('es-ES');
 await page.getByRole('button',{name:'Dictate'}).click();
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {voiceTestState:{dictated:string}}).voiceTestState.dictated)).toBe('en-US');
});

test('local panels fit desktop and mobile in both themes', async ({browser}) => {
 for (const width of [320,768,1280]) {
  const context=await browser.newContext({viewport:{width,height:800}}); const page=await context.newPage();
  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/');
  if(width===320){await page.getByRole('button',{name:'English'}).click();await page.getByRole('button',{name:'Dark theme'}).click();}
  await page.getByRole('button',{name:width===320?'Open assistant':'Abrir asistente'}).click();
  const assistant=page.getByRole('dialog',{name:width===320?'Your assistant':'Tu asistente'});
  await expect(assistant).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
  await page.screenshot({path:`test-results/local-assistant-${width}.png`});
  await page.keyboard.press('Escape');
  if(width===320){await page.getByRole('button',{name:'Open menu'}).click();await page.getByRole('button',{name:'My portfolio',exact:true}).click();}
  else await page.getByRole('button',{name:'Mi cartera',exact:true}).click();
  await page.getByRole('button',{name:width===320?'Worried about the decline?':'¿Te preocupa la caída?'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const overflow = await page.evaluate(()=>({screen:window.innerWidth,document:document.documentElement.scrollWidth,items:[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>`${el.tagName}.${el.className}`)}));
  await page.screenshot({path:`test-results/local-decline-${width}.png`});
  expect(overflow.document,JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.screen);
  await context.close();
 }
});


test('home destinations and connection controls fit at 390px', async ({ browser }) => {
 const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
 const page = await context.newPage();
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
 await page.goto('/');
 await expect(page.locator('.connection-settings summary')).toContainText('Demo local');
 await page.locator('.connection-settings summary').click();
 await expect(page.getByRole('button', { name: 'Usar servidor de demo' })).toBeVisible();
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
 await page.getByRole('button', { name: /Practica sin riesgo/ }).click();
 await expect(page.locator('.practice-lab h1')).toBeVisible();
 await context.close();
});
