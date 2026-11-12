import { test, expect } from '@playwright/test';

test.beforeEach(async ({page}) => {
 await page.addInitScript(() => { localStorage.setItem('t2f-data-mode','server'); });
 await page.route('**/api/health', route => route.fulfill({json:{conversationProvider:'elevenlabs', agentConfigured:true}}));
 await page.route('**/api/agent/session', async route => {
  const body = route.request().postDataJSON();
  await route.fulfill({json:{provider:'elevenlabs',mode:'agent',signedUrl:'wss://api.elevenlabs.io/session',dynamicVariables:{page_context:body.context.page, knowledge_level:body.context.level, language:body.context.language,portfolio_facts:'{}'},overrides:{agent:{language:body.context.language,firstMessage:'Hola'},conversation:{textOnly:body.textOnly}}}});
 });
 await page.route('**/node_modules/.vite/deps/@elevenlabs_client.js*', route => route.fulfill({contentType:'text/javascript',body:`export const Conversation={async startSession(options){const state=window.agentMock ||= {starts:[],ends:0,sent:[]};state.starts.push(options);state.options=options; if(state.hold) await new Promise(resolve=>state.release=resolve); options.onConnect({conversationId:'test'});return {async endSession(){state.ends++},sendUserMessage(text){state.sent.push(text);options.onMessage({role:'agent',message:'Respuesta segura'});}}}};`}));
});

test('starts on click, carries context, supports turns and stops on navigation', async ({page}) => {
 const oldRequests:string[] = [];
 page.on('request', request => { if (/\/api\/(tutor|speech\/token|speech\/synthesize)/.test(request.url())) oldRequests.push(request.url()); });
 await page.goto('/');
 expect(await page.evaluate(() => (window as any).agentMock?.starts.length ?? 0)).toBe(0);
 const trigger=page.getByRole('button',{name:'Hablar con IA'}); await trigger.click();
 const bar=page.getByRole('region',{name:'Habla con tu asistente'});
 await expect(bar.getByRole('status')).toContainText('Escuchando');
 await expect(page.getByRole('dialog')).toHaveCount(0); await expect(page.locator('main')).not.toHaveAttribute('inert','');
 expect(await page.evaluate(() => (window as any).agentMock.starts[0].dynamicVariables.page_context)).toBe('home');
 await bar.getByRole('button',{name:'Escribir'}).click();
 await expect(bar.getByRole('status')).toContainText('escrita activa');
 await bar.getByLabel('Escribe tu pregunta').fill('¿Qué es un fondo?'); await bar.getByRole('button',{name:'Enviar'}).click();
 await bar.getByRole('button',{name:'Ver conversación'}).click(); await expect(bar.getByText('Respuesta segura')).toBeVisible();
 expect(await page.evaluate(() => (window as any).agentMock.sent)).toEqual(['¿Qué es un fondo?']);
 await page.getByRole('button',{name:'Explorar',exact:true}).click();
 await expect.poll(() => page.evaluate(() => (window as any).agentMock.ends)).toBe(2);
 await page.evaluate(() => (window as any).agentMock.options.onMessage({role:'agent',message:'respuesta antigua'}));
 await expect(bar.getByText('respuesta antigua')).toHaveCount(0); expect(oldRequests).toEqual([]);
 await bar.getByRole('button',{name:'Cerrar asistente de voz'}).focus(); await page.keyboard.press('Escape'); await expect(bar).toHaveCount(0); await expect(trigger).toBeFocused();
});

for (const language of ['es','en'] as const) for (const theme of ['light','dark'] as const) test(`bar fits ${language}/${theme} at 320px`, async ({page}) => {
 await page.setViewportSize({width:320,height:640});
 await page.addInitScript(({language,theme}) => {localStorage.setItem('t2f-language',language);localStorage.setItem('t2f-theme',theme);}, {language,theme});
 await page.goto('/'); await page.getByRole('button',{name:language === 'es' ? 'Hablar con IA':'Talk to AI'}).click();
 const bar=page.getByRole('region',{name:language === 'es' ? 'Habla con tu asistente':'Talk to your assistant'}); await expect(bar).toBeVisible();
 const box=(await bar.boundingBox())!; expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x+box.width).toBeLessThanOrEqual(320);
 await expect(bar.getByRole('button',{name:language === 'es' ? 'Detener conversación':'Stop conversation'})).toBeVisible();
 await page.screenshot({path:`test-results/agent/${language}-${theme}-320.png`});
});

test('missing agent is visible and never falls back to the old tutor', async ({page}) => {
 await page.route('**/api/health', route => route.fulfill({json:{conversationProvider:'elevenlabs',agentConfigured:false}}));
 let sessions=0; await page.route('**/api/agent/session', route => {sessions++; return route.abort();});
 await page.goto('/'); await page.getByRole('button',{name:'Hablar con IA'}).click();
 await expect(page.getByRole('status').filter({hasText:'no está configurado'})).toBeVisible(); expect(sessions).toBe(0);
});

test('a late connection is closed after context changes', async ({page}) => {
 await page.addInitScript(() => { (window as any).agentMock={starts:[],ends:0,sent:[],hold:true}; });
 await page.goto('/'); await page.getByRole('button',{name:'Hablar con IA'}).click();
 await expect.poll(() => page.evaluate(() => (window as any).agentMock.starts.length)).toBe(1);
 await expect(page.getByText('Si la conexión se bloquea, detenerla puede no liberar el micrófono. Cierra esta pestaña si sigue activo.')).toBeVisible();
 await page.getByRole('button',{name:'Explorar',exact:true}).click();
 await page.evaluate(() => (window as any).agentMock.release());
 await expect.poll(() => page.evaluate(() => (window as any).agentMock.ends)).toBe(1);
 await expect(page.getByRole('region',{name:'Habla con tu asistente'}).getByRole('status')).toContainText('detenida');
});

test('provider errors stop the session and offer an actionable message', async ({page}) => {
 await page.goto('/'); await page.getByRole('button',{name:'Hablar con IA'}).click();
 await expect.poll(() => page.evaluate(() => (window as any).agentMock?.starts.length ?? 0)).toBe(1);
 await page.evaluate(() => (window as any).agentMock.options.onError('provider failure'));
 await expect(page.getByRole('region',{name:'Habla con tu asistente'}).getByRole('status')).toContainText('Comprueba el micrófono o usa Escribir');
 await expect.poll(() => page.evaluate(() => (window as any).agentMock.ends)).toBe(1);
});

test('disconnect during startup cannot revive a late session', async ({page}) => {
 await page.addInitScript(() => { (window as any).agentMock={starts:[],ends:0,sent:[],hold:true}; });
 await page.goto('/'); await page.getByRole('button',{name:'Hablar con IA'}).click();
 await expect.poll(() => page.evaluate(() => (window as any).agentMock.starts.length)).toBe(1);
 await page.evaluate(() => { const mock=(window as any).agentMock; mock.options.onDisconnect({reason:'error'}); mock.release(); });
 await expect.poll(() => page.evaluate(() => (window as any).agentMock.ends)).toBe(1);
 await expect(page.getByRole('region',{name:'Habla con tu asistente'}).getByRole('status')).toContainText('Conversación finalizada');
});

test('stopping a pending voice connection explains the microphone limitation', async ({page}) => {
 await page.addInitScript(() => { (window as any).agentMock={starts:[],ends:0,sent:[],hold:true}; });
 await page.goto('/'); await page.getByRole('button',{name:'Hablar con IA'}).click();
 await expect.poll(() => page.evaluate(() => (window as any).agentMock.starts.length)).toBe(1);
 const bar=page.getByRole('region',{name:'Habla con tu asistente'}); await bar.getByRole('button',{name:'Detener conversación'}).click();
 await expect(bar.getByRole('status')).toContainText('Si el micrófono sigue activo, cierra esta pestaña');
 await page.evaluate(() => (window as any).agentMock.release());
 await expect.poll(() => page.evaluate(() => (window as any).agentMock.ends)).toBe(1);
});
