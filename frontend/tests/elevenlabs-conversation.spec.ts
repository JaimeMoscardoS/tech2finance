import { expect, test, type Page } from '@playwright/test';

const sdk = `
export const CommitStrategy = { VAD: 'vad' };
export const RealtimeEvents = { AUDIO_STARTED: 'audio_started', COMMITTED_TRANSCRIPT: 'committed_transcript', ERROR: 'error', CLOSE: 'close' };
export const Scribe = { connect(options) {
 const callbacks = {};
 const session = { options, callbacks, closed: false, closeCount: 0, on(event, fn) { callbacks[event] = fn; }, close() { this.closed = true; this.closeCount++; }, mute() {}, commit() {} };
 (window.__voiceSessions ||= []).push(session);
 queueMicrotask(() => callbacks.audio_started?.());
 return session;
} };
`;

async function setup(page: Page) {
 const requests: any[] = []; const tokens: any[] = []; let externalRequests = 0;
 await page.route('**/node_modules/.vite/deps/@elevenlabs_client*', route => route.fulfill({status:200,contentType:'application/javascript',body:sdk}));
 await page.route('https://api.elevenlabs.io/**', route => { externalRequests++; return route.abort(); });
 await page.route('**/api/health', route => route.fulfill({json:{status:'ok',mode:'demo',tutorProvider:'anthropic',speechProvider:'elevenlabs',speechKeyConfigured:true,externalProviders:true,newsProvider:'off'}}));
 await page.route('**/api/speech/token', route => {
  const body = route.request().postDataJSON(); tokens.push(body);
  return route.fulfill({json:{schemaVersion:'1.0',provider:'elevenlabs',language:body.language,model:'scribe_v2_realtime',token:'test-single-use',expiresInSeconds:900}});
 });
 await page.route('**/api/tutor', route => {
  const body = route.request().postDataJSON(); requests.push(body);
  return route.fulfill({json:{text:body.context.language === 'es' ? 'Respuesta simulada' : 'Mock answer',language:body.context.language,mode:'api',provider:'anthropic',model:'claude-sonnet-test',intent:'general',sources:[{label:'Fuente de prueba',url:'https://example.com/source'}]}});
 });
 await page.addInitScript(() => {
  class Utterance { voice: any; lang = ''; onstart: any; onend: any; constructor(public text: string) {} }
  Object.defineProperty(window,'SpeechSynthesisUtterance',{value:Utterance,configurable:true});
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{paused:false,cancel(){},resume(){},addEventListener(){},removeEventListener(){},getVoices:()=>[{localService:true,lang:'es-ES'},{localService:true,lang:'en-US'}],speak(u:Utterance){u.onstart?.();u.onend?.();}}});
 });
 return {requests,tokens,externalRequests:()=>externalRequests};
}

async function sessionReady(page: Page, index = 0) {
 await expect.poll(() => page.evaluate(() => (window as any).__voiceSessions?.length ?? 0)).toBe(index + 1);
}
async function emit(page: Page, text: string, index = 0) {
 await page.evaluate(({text,index}) => (window as any).__voiceSessions[index].callbacks.committed_transcript({text}), {text,index});
}

for (const language of ['es','en'] as const) {
 test(`one voice question uses the matching language and displays actual provider (${language})`, async ({page}) => {
  const mock = await setup(page); await page.goto('/');
  if (language === 'en') await page.getByRole('button',{name:'English'}).click();
  await page.getByRole('button',{name:language === 'es' ? 'Hablar con IA' : 'Talk to AI'}).click();
  const panel = page.getByRole('region',{name:language === 'es' ? 'Habla con tu asistente' : 'Talk to your assistant'});
  await expect(panel).toContainText('ElevenLabs'); await sessionReady(page);
  const question = language === 'es' ? '¿Qué es un fondo?' : 'What is a fund?';
  expect(mock.tokens).toEqual([{language}]);
  const options = await page.evaluate(() => (window as any).__voiceSessions[0].options);
  expect(options).toMatchObject({languageCode:language,modelId:'scribe_v2_realtime',commitStrategy:'vad',token:'test-single-use'});
  await emit(page, question); await emit(page, 'stale transcript');
  await expect.poll(() => mock.requests.length).toBe(1);
  expect(mock.requests[0].message).toBe(question); expect(mock.requests[0].context.language).toBe(language);
  await expect(panel).toContainText('Anthropic · claude-sonnet-test');
  await panel.getByRole('button',{name:language === 'es' ? 'Ver respuesta' : 'View answer'}).click();
  await expect(panel).toContainText(language === 'es' ? 'Respuesta simulada' : 'Mock answer');
  await expect(panel.getByRole('link',{name:'Fuente de prueba'})).toHaveAttribute('href','https://example.com/source');
  expect(await page.evaluate(() => (window as any).__voiceSessions.length)).toBe(1);
  expect(mock.externalRequests()).toBe(0);
 });
}

test('typed chat dictation is editable and requires manual send', async ({page}) => {
 const mock = await setup(page); await page.goto('/');
 await page.getByRole('button',{name:'Abrir asistente'}).click();
 await page.getByRole('button',{name:'Dictar'}).click(); await sessionReady(page);
 await emit(page,'Pregunta dictada');
 const input = page.locator('#chat-input'); await expect(input).toHaveValue('Pregunta dictada');
 expect(mock.requests).toHaveLength(0);
 await input.fill('Pregunta revisada'); await page.getByRole('button',{name:'Enviar pregunta'}).click();
 await expect.poll(() => mock.requests.length).toBe(1); expect(mock.requests[0].message).toBe('Pregunta revisada');
});

test('language change cancels session and ignores late transcripts', async ({page}) => {
 const mock = await setup(page); await page.goto('/');
 await page.getByRole('button',{name:'Hablar con IA'}).click(); await sessionReady(page);
 await page.getByRole('button',{name:'English'}).click();
 await expect.poll(() => page.evaluate(() => (window as any).__voiceSessions[0].closed)).toBe(true);
 await emit(page,'late question'); expect(mock.requests).toHaveLength(0);
 expect(await page.evaluate(() => (window as any).__voiceSessions.length)).toBe(1);
});

test('changing context during chat dictation closes capture and clears the control', async ({page}) => {
 const mock = await setup(page); await page.goto('/');
 await page.getByRole('button',{name:'Abrir asistente'}).click();
 await page.getByRole('button',{name:'Dictar'}).click(); await sessionReady(page);
 await page.getByRole('button',{name:'Explorar',exact:true,includeHidden:true}).evaluate((button:HTMLElement) => button.click());
 await expect.poll(() => page.evaluate(() => (window as any).__voiceSessions[0].closeCount)).toBe(1);
 await emit(page,'stale question'); await expect(page.locator('#chat-input')).toHaveValue('');
 await expect(page.getByRole('button',{name:'Dictar'})).toBeVisible();
 expect(mock.requests).toHaveLength(0); expect(await page.evaluate(() => (window as any).__voiceSessions.length)).toBe(1);
});
