import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
 await page.addInitScript(() => {
  const state: any = { plays: 0, pauses: 0, revoked: 0 };
  (window as any).playbackTest = state;
  class FakeAudio {
   src: string; onended: (() => void) | null = null; onerror: (() => void) | null = null;
   constructor(src: string) { this.src = src; }
   play() { state.plays++; return Promise.resolve(); }
   pause() { state.pauses++; }
   load() {}
  }
  (window as any).Audio = FakeAudio;
  const original = URL.revokeObjectURL.bind(URL);
  URL.revokeObjectURL = value => { state.revoked++; original(value); };
 });
 await page.route('**/api/health', route => route.fulfill({json:{status:'ok', mode:'demo', speechProvider:'browser_local', ttsProvider:'elevenlabs', speechKeyConfigured:false}}));
 await page.route('**/api/tutor', route => {
  const language = route.request().postDataJSON().context.language;
  return route.fulfill({json:{text:language === 'es' ? 'Respuesta de prueba' : 'Test answer',language,mode:'api',provider:'server_rules',intent:'general',sources:[]}});
 });
});

test('spoken answers switch languages and release previous audio', async ({ page }) => {
 const languages: string[] = [];
 await page.route('**/api/speech/synthesize', route => {
  languages.push(route.request().postDataJSON().language);
  return route.fulfill({status:200,contentType:'audio/mpeg',body:'ID3fake'});
 });
 await page.goto('/');
 await page.getByRole('button', {name:'Hablar con IA'}).click();
 let panel = page.getByRole('region', {name:'Habla con tu asistente'});
 await panel.getByRole('button', {name:'Escribir'}).click();
 await panel.getByLabel('Escribe tu pregunta').fill('Hola');
 await panel.getByRole('button', {name:'Enviar'}).click();
 await expect.poll(() => page.evaluate(() => (window as any).playbackTest.plays)).toBe(1);
 await page.locator('.preference-button').filter({hasText:'EN'}).evaluate((button: HTMLElement) => button.click());
 panel = page.getByRole('region', {name:'Talk to your assistant'});
 await panel.getByRole('button', {name:'Type'}).click();
 await panel.getByLabel('Type your question').fill('Hello');
 await panel.getByRole('button', {name:'Send'}).click();
 await expect.poll(() => page.evaluate(() => (window as any).playbackTest.plays)).toBe(2);
 expect(languages).toEqual(['es','en']);
 expect(await page.evaluate(() => (window as any).playbackTest.revoked)).toBeGreaterThanOrEqual(1);
 await panel.getByRole('button', {name:'Close voice assistant'}).click();
 expect(await page.evaluate(() => (window as any).playbackTest.revoked)).toBe(2);
});

test('closing while synthesis is pending never plays a late response', async ({ page }) => {
 let release!: () => void;
 const waiting = new Promise<void>(resolve => { release = resolve; });
 let requested = false;
 await page.route('**/api/speech/synthesize', async route => { requested = true; await waiting; await route.fulfill({status:200,contentType:'audio/mpeg',body:'ID3fake'}).catch(() => {}); });
 await page.goto('/');
 await page.getByRole('button', {name:'Hablar con IA'}).click();
 const panel = page.getByRole('region', {name:'Habla con tu asistente'});
 await panel.getByRole('button', {name:'Escribir'}).click();
 await panel.getByLabel('Escribe tu pregunta').fill('Hola');
 await panel.getByRole('button', {name:'Enviar'}).click();
 await expect.poll(() => requested).toBe(true);
 await panel.getByRole('button', {name:'Cerrar asistente de voz'}).click();
 release();
 await expect.poll(() => page.evaluate(() => (window as any).playbackTest.plays)).toBe(0);
});
