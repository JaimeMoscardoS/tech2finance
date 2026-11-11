# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend.spec.ts >> local tutor grounds results, keeps previous messages and excludes dirty results
- Location: tests\frontend.spec.ts:316:1

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('.message.assistant p').last()
Expected: "CAIXABANK MONETARIO RENDIMIENTO, FI CLASE ESTÁNDAR (5 periodos anuales, 2020-12-31 – 2025-12-31): valor final 788,79 EUR; aportado en total 750 EUR; beneficio o pérdida 38,79 EUR. Rentabilidad acumulada del instrumento durante ese periodo: 5,8%, no es una tasa anual. Rentabilidad publicada de 2022: -0,67%. Las aportaciones entran al cierre de cada año, después de su rentabilidad. Los resultados pasados o simulados no garantizan resultados futuros."
Received: "Ask about the screen or example you are viewing."
Timeout:  5000ms

Call log:
  - Expect "toHaveText" locator('.message.assistant p').last() with timeout 5000ms
  - waiting for locator('.message.assistant p').last()
    14 × locator resolved to <p>Ask about the screen or example you are viewing.</p>
       - unexpected value "Ask about the screen or example you are viewing."

```

```yaml
- paragraph: Ask about the screen or example you are viewing.
```

# Test source

```ts
  234 |  const phone=await mobile.newPage(); await phone.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local')); await phone.goto('/');
  235 |  await phone.getByRole('button',{name:'Abrir menú'}).click();
  236 |  await expect(phone.locator('main')).toHaveAttribute('inert','');
  237 |  await phone.getByRole('button',{name:'Mi cartera',exact:true}).click();
  238 |  await phone.getByRole('button',{name:'Entender una caída'}).click();
  239 |  const modal=phone.getByRole('dialog');
  240 |  expect(await modal.evaluate(el=>el.scrollHeight>el.clientHeight)).toBeTruthy();
  241 |  await modal.getByRole('button',{name:'Continuar en la demo'}).scrollIntoViewIfNeeded();
  242 |  await expect(modal.getByRole('button',{name:'Continuar en la demo'})).toBeInViewport();
  243 |  await phone.screenshot({path:'test-results/pause-landscape.png'});
  244 |  await mobile.close();
  245 | });
  246 |
  247 | test('annual deposits, table and percentage view stay consistent across preferences', async ({page}) => {
  248 |  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  249 |   await page.goto('/');
  250 |  await page.getByRole('button',{name:'Simulador',exact:true}).click();
  251 |  await page.getByRole('button',{name:'Probar histórico 2021–2025'}).click();
  252 |  await page.getByLabel('Aportación anual').fill('50');
  253 |  await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
  254 |  const panel=page.locator('.sim-result');
  255 |  await expect(panel.locator('.sim-values strong').nth(0)).toHaveText('788,79 €');
  256 |  await expect(panel.locator('.sim-values strong').nth(1)).toHaveText('750,00 €');
  257 |  await expect(panel.locator('.sim-values strong').nth(2)).toHaveText('38,79 €');
  258 |  await expect(panel.locator('[role="status"][aria-atomic="true"]')).toContainText('Resultado actualizado');
  259 |  await panel.getByText('Ver datos', {exact:true}).click();
  260 |  const rows=panel.getByRole('table',{name:'Datos del gráfico: Evolución de la práctica'}).locator('tbody tr');
  261 |  await expect(rows).toHaveCount(6);
  262 |  await expect(rows.nth(0)).toContainText('Importe inicial: 500,00 €');
  263 |  await expect(rows.last()).toContainText('788,79 €');
  264 |  await expect(rows.last()).toContainText('750,00 €');
  265 |  await expect(rows.last()).toContainText('5,8 %');
  266 |  await panel.getByRole('button',{name:'Evolución del instrumento (%)'}).click();
  267 |  await expect(rows.last()).toContainText('5,8 %');
  268 |  await page.getByRole('button',{name:/Nivel: Principiante/}).click();
  269 |  await page.getByRole('button',{name:'Intermedio',exact:true}).click();
  270 |  await page.getByRole('button',{name:'Modo oscuro'}).click();
  271 |  await page.getByRole('button',{name:'English'}).click();
  272 |  await expect(panel.locator('.sim-values strong').nth(0)).toHaveText('€788.79');
  273 |  await expect(panel.getByRole('button',{name:'Instrument performance (%)'})).toHaveAttribute('aria-pressed','true');
  274 |  await page.getByLabel('Annual contribution').fill('75');
  275 |  await expect(panel.getByText(/Your inputs changed/)).toBeVisible();
  276 |  await expect(panel.locator('.investment-chart')).toHaveCount(0);
  277 |  await page.getByLabel('Institution').selectOption('bbva');
  278 |  await expect(panel.getByText(/No verified historical series/)).toBeVisible();
  279 |  await expect(panel.locator('.investment-chart')).toHaveCount(0);
  280 |  await page.getByLabel('Institution').selectOption('demo');
  281 |  await expect(page.getByLabel('Monthly contribution')).toHaveValue('50');
  282 |  await page.getByLabel('Institution').selectOption('caixabank');
  283 |  await expect(page.getByLabel('Annual contribution')).toHaveValue('75');
  284 | });
  285 |
  286 | test('validation identifies the actual field and retains annual help', async ({page}) => {
  287 |  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  288 |   await page.goto('/'); await page.getByRole('button',{name:'Simulador',exact:true}).click();
  289 |  await page.getByRole('button',{name:'Probar histórico 2021–2025'}).click();
  290 |  const initial=page.getByLabel('Importe inicial'); const annual=page.getByLabel('Aportación anual');
  291 |  await initial.fill('-1'); await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
  292 |  await expect(initial).toHaveAttribute('aria-invalid','true');
  293 |  await expect(annual).toHaveAttribute('aria-invalid','false');
  294 |  await expect(page.getByRole('alert')).toContainText('Importe inicial');
  295 |  await initial.fill('500'); await annual.fill('-1'); await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
  296 |  await expect(initial).toHaveAttribute('aria-invalid','false');
  297 |  await expect(annual).toHaveAttribute('aria-invalid','true');
  298 |  await expect(annual).toHaveAttribute('aria-describedby','annual-help sim-error');
  299 |  await expect(page.getByRole('alert')).toContainText('Aportación anual');
  300 | });
  301 |
  302 | test('home chart retains useful width on narrow screens', async ({browser}) => {
  303 |  for (const width of [320,768]) {
  304 |   const context=await browser.newContext({viewport:{width,height:900}});
  305 |   const page=await context.newPage(); await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  306 |   await page.goto('/');
  307 |   if (width===768) { await page.getByRole('button',{name:'English'}).click(); await page.getByRole('button',{name:'Dark theme'}).click(); }
  308 |   const plot=page.locator('.portfolio-content .investment-chart__plot');
  309 |   await expect(plot).toBeVisible();
  310 |   expect((await plot.boundingBox())!.width).toBeGreaterThan(width===320?200:300);
  311 |   await page.screenshot({path:`test-results/home-${width}.png`,fullPage:true});
  312 |   await context.close();
  313 |  }
  314 | });
  315 |
  316 | test('local tutor grounds results, keeps previous messages and excludes dirty results', async ({page}) => {
  317 |  const providerRequests:string[]=[];
  318 |  page.on('request',request=>{if (/anthropic|elevenlabs/i.test(request.url())) providerRequests.push(request.url());});
  319 |  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  320 |   await page.goto('/'); await page.getByRole('button',{name:'Simulador',exact:true}).click();
  321 |  await page.getByRole('button',{name:'Probar histórico 2021–2025'}).click();
  322 |  await page.getByLabel('Aportación anual').fill('50'); await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
  323 |  await page.getByRole('button',{name:'Abrir asistente'}).click();
  324 |  const dialog=page.getByRole('dialog',{name:'Tu asistente'});
  325 |  await dialog.getByLabel('Tu pregunta').fill('¿Cuál es el resultado?'); await dialog.getByRole('button',{name:'Enviar pregunta'}).click();
  326 |  await expect(dialog.getByText(/788,79/)).toBeVisible();
  327 |  await expect(dialog.getByText(/750/)).toBeVisible();
  328 |  await expect(dialog.getByRole('link',{name:'Ficha oficial'})).toBeVisible();
  329 |  await dialog.getByLabel('Tu pregunta').fill('¿Cuál fue la rentabilidad de 2022?'); await dialog.getByRole('button',{name:'Enviar pregunta'}).click();
  330 |  await expect(dialog.getByText(/2022.*-0,67/)).toBeVisible();
  331 |  const previous=await dialog.locator('.message.assistant p').last().textContent();
  332 |  await page.keyboard.press('Escape'); await page.getByRole('button',{name:'English'}).click();
  333 |  await page.getByRole('button',{name:'Open assistant'}).click();
> 334 |  await expect(page.locator('.message.assistant p').last()).toHaveText(previous!);
      |                                                            ^ Error: expect(locator).toHaveText(expected) failed
  335 |  await expect(page.locator('.message.assistant[lang="es"]').last()).toBeVisible();
  336 |  await expect(page.getByRole('button',{name:'Dictate'})).toBeVisible();
  337 |  await expect(page.getByRole('button',{name:'Listen'})).toBeVisible();
  338 |  await page.keyboard.press('Escape'); await page.getByLabel('Annual contribution').fill('75');
  339 |  await page.getByRole('button',{name:'Open assistant'}).click();
  340 |  const english=page.getByRole('dialog',{name:'Your assistant'});
  341 |  await english.getByLabel('Your question').fill('What is the result?'); await english.getByRole('button',{name:'Send question'}).click();
  342 |  await expect(english.getByText(/not enough valid simulation data/i)).toBeVisible();
  343 |  expect(providerRequests).toEqual([]);
  344 | });
  345 |
  346 | test('assistant remains scrollable and voice controls reachable in short landscape', async ({browser}) => {
  347 |  const context=await browser.newContext({viewport:{width:568,height:320}}); const page=await context.newPage();
  348 |  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  349 |   await page.goto('/'); await page.getByRole('button',{name:'Abrir asistente'}).click();
  350 |  const dialog=page.getByRole('dialog',{name:'Tu asistente'});
  351 |  await dialog.getByLabel('Tu pregunta').fill('¿Qué es un fondo?');
  352 |  await dialog.getByRole('button',{name:'Enviar pregunta'}).click();
  353 |  await expect(dialog.locator('.message.assistant[lang="es"]')).toBeVisible();
  354 |  const listen=dialog.getByRole('button',{name:'Escuchar'}); await listen.focus();
  355 |  await expect(listen).toBeInViewport();
  356 |  const dictate=dialog.getByRole('button',{name:'Dictar'}); await dictate.focus();
  357 |  await expect(dictate).toBeInViewport();
  358 |  expect(await dialog.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
  359 |  expect(await page.evaluate(()=>window.scrollY)).toBe(0);
  360 |  await page.screenshot({path:'test-results/local-assistant-landscape.png'});
  361 |  await context.close();
  362 | });
  363 |
  364 | test('decline explanations use observed series without inventing a current crisis', async ({page}) => {
  365 |  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  366 |   await page.goto('/'); await page.getByRole('button',{name:'Simulador',exact:true}).click();
  367 |  await page.getByRole('button',{name:'Probar histórico 2021–2025'}).click();
  368 |  await page.getByRole('button',{name:'Entender las caídas'}).click();
  369 |  let dialog=page.getByRole('dialog',{name:'Una pausa para comprender'});
  370 |  await expect(dialog.getByText(/última observación no hay caída/)).toBeVisible();
  371 |  await expect(dialog.getByText(/2021.*2022/)).toBeVisible();
  372 |  await expect(dialog.getByText(/causa es desconocida/i)).toBeVisible();
  373 |  await dialog.getByText('Tu contexto (opcional)').click();
  374 |  await dialog.getByLabel('Objetivo (opcional)').fill('Ejemplo educativo');
  375 |  await dialog.getByLabel('¿Necesitas liquidez pronto? (opcional)').selectOption('yes');
  376 |  await dialog.getByRole('button',{name:'Preguntar al asistente'}).click();
  377 |  await expect(page.getByRole('dialog',{name:'Tu asistente'})).toBeVisible();
  378 |  await page.keyboard.press('Escape'); await page.getByRole('button',{name:'Mi cartera',exact:true}).click();
  379 |  await page.getByRole('button',{name:'Entender una caída'}).click();
  380 |  dialog=page.getByRole('dialog',{name:'Una pausa para comprender'});
  381 |  await expect(dialog.getByText(/Punto 14/)).toBeVisible();
  382 |  await expect(dialog.getByText(/Serie ficticia de ejemplo/)).toBeVisible();
  383 |  await dialog.getByRole('button',{name:'Continuar en la demo'}).click();
  384 |  await expect(dialog).toBeHidden();
  385 | });
  386 |
  387 | test('dictation remains editable and never submits automatically', async ({page}) => {
  388 |  await page.addInitScript(()=>{
  389 |   class LocalRecognition {
  390 |    static available=async()=> 'available'; processLocally=false; lang=''; continuous=false; interimResults=false;
  391 |    onstart:(()=>void)|null=null; onend:(()=>void)|null=null; onerror=null; onresult:((event:unknown)=>void)|null=null;
  392 |    start(){this.onstart?.();this.onresult?.({resultIndex:0,results:[{isFinal:true,0:{transcript:'Quiero revisar el riesgo'}}]});}
  393 |    stop(){this.onend?.();} abort(){}
  394 |   }
  395 |   Object.defineProperty(window,'SpeechRecognition',{value:LocalRecognition,configurable:true});
  396 |  });
  397 |  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  398 |   await page.goto('/'); await page.getByRole('button',{name:'Abrir asistente'}).click();
  399 |  const dialog=page.getByRole('dialog',{name:'Tu asistente'});
  400 |  await dialog.getByRole('button',{name:'Dictar'}).click();
  401 |  await expect(dialog.getByLabel('Tu pregunta')).toHaveValue('Quiero revisar el riesgo');
  402 |  await expect(dialog.locator('.message.user')).toHaveCount(0);
  403 |  await dialog.getByLabel('Tu pregunta').fill('Quiero revisar el riesgo y los costes');
  404 |  await dialog.getByRole('button',{name:'Enviar pregunta'}).click();
  405 |  await expect(dialog.locator('.message.user')).toHaveCount(1);
  406 | });
  407 |
  408 | test('saved Spanish answer reads in Spanish while dictation follows English UI', async ({page}) => {
  409 |  await page.addInitScript(()=>{
  410 |   const state={spoken:'',dictated:''}; Object.assign(window,{voiceTestState:state});
  411 |   class Utterance { text:string; lang=''; voice:unknown; onstart:(()=>void)|null=null; onend:(()=>void)|null=null; constructor(text:string){this.text=text;} }
  412 |   const synth={paused:false,cancel(){},resume(){},getVoices(){return [{localService:true,lang:'es-ES'},{localService:true,lang:'en-US'}];},addEventListener(){},removeEventListener(){},speak(item:Utterance){state.spoken=item.lang;item.onstart?.();}};
  413 |   class Recognition { static available=async()=> 'available'; processLocally=false; lang=''; continuous=false; interimResults=false; onstart:(()=>void)|null=null; onend=null; onerror=null; onresult=null; start(){state.dictated=this.lang;this.onstart?.();} abort(){} stop(){} }
  414 |   Object.defineProperty(window,'speechSynthesis',{value:synth,configurable:true});
  415 |   Object.defineProperty(window,'SpeechSynthesisUtterance',{value:Utterance,configurable:true});
  416 |   Object.defineProperty(window,'SpeechRecognition',{value:Recognition,configurable:true});
  417 |  });
  418 |  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  419 |   await page.goto('/'); await page.getByRole('button',{name:'Abrir asistente'}).click();
  420 |  await page.getByLabel('Tu pregunta').fill('¿Qué es un fondo?'); await page.getByRole('button',{name:'Enviar pregunta'}).click();
  421 |  await expect(page.locator('.message.assistant[lang="es"]')).toBeVisible();
  422 |  await page.keyboard.press('Escape'); await page.getByRole('button',{name:'English'}).click();
  423 |  await page.getByRole('button',{name:'Open assistant'}).click();
  424 |  await page.getByRole('button',{name:'Listen'}).click();
  425 |  await expect.poll(()=>page.evaluate(()=>(window as unknown as {voiceTestState:{spoken:string}}).voiceTestState.spoken)).toBe('es-ES');
  426 |  await page.getByRole('button',{name:'Dictate'}).click();
  427 |  await expect.poll(()=>page.evaluate(()=>(window as unknown as {voiceTestState:{dictated:string}}).voiceTestState.dictated)).toBe('en-US');
  428 | });
  429 |
  430 | test('local panels fit desktop and mobile in both themes', async ({browser}) => {
  431 |  for (const width of [320,768,1280]) {
  432 |   const context=await browser.newContext({viewport:{width,height:800}}); const page=await context.newPage();
  433 |   await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  434 |   await page.goto('/');
```