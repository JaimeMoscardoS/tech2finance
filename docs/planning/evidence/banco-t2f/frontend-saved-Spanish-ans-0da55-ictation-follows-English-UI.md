# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend.spec.ts >> saved Spanish answer reads in Spanish while dictation follows English UI
- Location: tests\frontend.spec.ts:408:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Listen' })

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - complementary "MY SPACE" [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - generic [ref=e7]: t
          - generic [ref=e8]: "2"
        - generic [ref=e9]:
          - strong [ref=e10]: BancoT2F
          - generic [ref=e11]: Fictional demo · powered by Tech2Finance
      - navigation [ref=e13]:
        - button "Home" [ref=e14] [cursor=pointer]
        - button "Explore" [ref=e19] [cursor=pointer]
        - button "Simulator" [ref=e24] [cursor=pointer]
        - button "My portfolio" [ref=e28] [cursor=pointer]
      - generic [ref=e34]: LEARN
      - button "Your assistant DEMO" [ref=e35] [cursor=pointer]:
        - generic [ref=e38]: Your assistant
        - generic [ref=e39]: DEMO
      - button "View options" [ref=e40] [cursor=pointer]
      - generic [ref=e45]:
        - generic [ref=e46]: TF
        - generic [ref=e47]:
          - strong [ref=e48]: Sample account
          - generic [ref=e49]: Personal space
    - main [ref=e50]:
      - generic [ref=e51]:
        - generic [ref=e53]:
          - text: BancoT2F /
          - strong [ref=e54]: Home
        - generic [ref=e55]:
          - generic [ref=e56]: DEMONSTRATION ENVIRONMENT
          - generic "Language" [ref=e57]:
            - button "Español" [ref=e58] [cursor=pointer]: ES
            - button "English" [pressed] [ref=e59] [cursor=pointer]: EN
          - button "Dark theme" [ref=e60] [cursor=pointer]
          - button "Talk to AI" [ref=e63] [cursor=pointer]
          - button "Open assistant" [ref=e67] [cursor=pointer]
          - 'button "Level: Beginner" [ref=e72] [cursor=pointer]':
            - generic [ref=e73]:
              - text: "Level:"
              - strong [ref=e74]: Beginner
      - generic [ref=e77]:
        - generic [ref=e78]:
          - status [ref=e79]: Local demo
          - button "Use demo server" [ref=e80] [cursor=pointer]
        - generic [ref=e82]:
          - generic [ref=e83]: YOUR SPACE TO LEARN
          - heading "Investing starts with understanding." [level=1] [ref=e84]
          - paragraph [ref=e85]: A place to explore, ask questions and move at your own pace.
        - region "BancoT2F" [ref=e86]:
          - generic [ref=e87]:
            - text: ABOUT THE DEMO
            - heading "BancoT2F" [level=2] [ref=e88]
            - paragraph [ref=e89]: Fictional institution for an educational investment demonstration.
            - paragraph [ref=e90]: Fictional monthly maintenance of EUR 0. No real account, real orders or external connections.
            - paragraph [ref=e91]: Fictional terms and fees for the demonstration. BancoT2F fees are informational and are not deducted from simulator results.
          - generic [ref=e92]:
            - heading "Services" [level=3] [ref=e93]
            - list [ref=e94]:
              - listitem [ref=e95]:
                - strong [ref=e96]: Catalogue
                - text: · Browse demonstration instruments.
              - listitem [ref=e97]:
                - strong [ref=e98]: Practice
                - text: · Practise with educational simulations.
              - listitem [ref=e99]:
                - strong [ref=e100]: Tutor
                - text: · Ask for contextual explanations.
              - listitem [ref=e101]:
                - strong [ref=e102]: Portfolio pause
                - text: · Review information about a decline before selling.
            - group [ref=e103]:
              - generic "Frequently asked questions" [ref=e104] [cursor=pointer]
        - generic [ref=e106]:
          - text: Simple view
          - heading "Your starting point" [level=2] [ref=e107]
          - paragraph [ref=e108]: "Start with the basics: learn about funds and practise without real money."
          - paragraph [ref=e109]: The level changes the information you see, not an investment’s risk.
          - generic [ref=e110]:
            - button "Try the simulator" [ref=e111] [cursor=pointer]
            - button "Explore funds" [ref=e114] [cursor=pointer]
        - generic [ref=e118]:
          - text: LEARN
          - heading "Start wherever you like" [level=2] [ref=e119]
        - generic [ref=e120]:
          - button [ref=e121] [cursor=pointer]:
            - heading "Discover funds" [level=3] [ref=e126]
            - paragraph [ref=e127]: Explore examples and what they mean.
            - generic [ref=e128]: Go
          - button [ref=e131] [cursor=pointer]:
            - heading "Practise without risk" [level=3] [ref=e135]
            - paragraph [ref=e136]: Experiment with fictional money.
            - generic [ref=e137]: Go
          - button [ref=e140] [cursor=pointer]:
            - heading "Ask freely" [level=3] [ref=e144]
            - paragraph [ref=e145]: Understand concepts at your own pace.
            - generic [ref=e146]: Go
        - generic [ref=e149]:
          - generic [ref=e150]:
            - generic [ref=e151]:
              - generic [ref=e152]:
                - text: Fictional data
                - heading "Sample portfolio" [level=3] [ref=e153]
              - button "View details" [ref=e154] [cursor=pointer]
            - generic [ref=e157]:
              - generic [ref=e158]:
                - paragraph [ref=e159]: Portfolio value
                - generic [ref=e160]:
                  - generic [ref=e161]: 1,093
                  - text: €
                - generic [ref=e162]: These values do not represent a real investment.
              - region "Sample portfolio" [ref=e163]:
                - generic [ref=e164]:
                  - generic [ref=e165]:
                    - heading "Sample portfolio" [level=3] [ref=e166]
                    - paragraph [ref=e167]: "Fictional portfolio independent of practice: sample initial capital of €1,000, with no additional contributions."
                  - group "Chart view" [ref=e168]:
                    - button "Capital (€)" [pressed] [ref=e169] [cursor=pointer]
                    - button "Instrument performance (%)" [ref=e170] [cursor=pointer]
                - generic "Legend" [ref=e171]:
                  - generic [ref=e172]: Capital
                  - generic [ref=e174]: Contributed
                - figure "Sample portfolio" [ref=e176]:
                  - application [ref=e180]:
                    - generic [ref=e188]:
                      - generic [ref=e189]:
                        - generic [ref=e190]: START
                        - generic [ref=e192]: Point 3
                        - generic [ref=e194]: Point 5
                        - generic [ref=e196]: Point 8
                        - generic [ref=e198]: Point 10
                        - generic [ref=e200]: Point 13
                      - generic [ref=e202]:
                        - generic [ref=e203]: 0 €
                        - generic [ref=e205]: 300 €
                        - generic [ref=e207]: 600 €
                        - generic [ref=e209]: 900 €
                        - generic [ref=e211]: 1.2k €
                  - generic [ref=e213]: Use the arrow keys to explore the data.
                - group [ref=e214]:
                  - generic "View data" [ref=e215] [cursor=pointer]
          - generic [ref=e216]:
            - text: Your assistant
            - heading "Choose how much information you want to see." [level=3] [ref=e221]
            - paragraph [ref=e222]: The level changes the information you see, not an investment’s risk.
            - button "Ask" [ref=e223] [cursor=pointer]
        - generic [ref=e226]:
          - generic [ref=e227]: © Tech2Finance · A demo for learning.
          - generic [ref=e228]: No real money or bank accounts
    - button "Close assistant" [ref=e233] [cursor=pointer]
    - dialog "Your assistant" [ref=e234]:
      - generic [ref=e235]:
        - generic [ref=e240]:
          - strong [ref=e241]: Your assistant
          - generic [ref=e242]: Here to help you understand
        - button "Close assistant" [active] [ref=e243] [cursor=pointer]
      - generic [ref=e247]: LOCAL MODE · RULE-BASED RESPONSES
      - paragraph [ref=e250]: Ask about the screen or example you are viewing.
      - generic [ref=e251]:
        - button "What is a fund?" [ref=e252] [cursor=pointer]
        - button "How does the simulation work?" [ref=e253] [cursor=pointer]
      - generic [ref=e254]:
        - generic [ref=e255]: Your question
        - textbox "Your question" [ref=e256]:
          - /placeholder: Write your question...
        - button "Send question" [disabled] [ref=e257] [cursor=pointer]
      - paragraph [ref=e261]: Maximum 1500 characters. Dictation is added to the text so you can review it before sending.
      - generic [ref=e263]:
        - button "Dictate" [ref=e265] [cursor=pointer]
        - status
      - status [ref=e266]
  - generic [aria-hidden] [ref=e267]: 1.2k
```

# Test source

```ts
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
  334 |  await expect(page.locator('.message.assistant p').last()).toHaveText(previous!);
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
> 424 |  await page.getByRole('button',{name:'Listen'}).click();
      |                                                 ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  435 |   if(width===320){await page.getByRole('button',{name:'English'}).click();await page.getByRole('button',{name:'Dark theme'}).click();}
  436 |   await page.getByRole('button',{name:width===320?'Open assistant':'Abrir asistente'}).click();
  437 |   const assistant=page.getByRole('dialog',{name:width===320?'Your assistant':'Tu asistente'});
  438 |   await expect(assistant).toBeVisible();
  439 |   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
  440 |   await page.screenshot({path:`test-results/local-assistant-${width}.png`});
  441 |   await page.keyboard.press('Escape');
  442 |   if(width===320){await page.getByRole('button',{name:'Open menu'}).click();await page.getByRole('button',{name:'My portfolio',exact:true}).click();}
  443 |   else await page.getByRole('button',{name:'Mi cartera',exact:true}).click();
  444 |   await page.getByRole('button',{name:width===320?'Understand a decline':'Entender una caída'}).click();
  445 |   await expect(page.getByRole('dialog')).toBeVisible();
  446 |   const overflow = await page.evaluate(()=>({screen:window.innerWidth,document:document.documentElement.scrollWidth,items:[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>`${el.tagName}.${el.className}`)}));
  447 |   await page.screenshot({path:`test-results/local-decline-${width}.png`});
  448 |   expect(overflow.document,JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.screen);
  449 |   await context.close();
  450 |  }
  451 | });
  452 |
```