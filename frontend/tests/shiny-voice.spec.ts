import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
 await page.addInitScript(() => {
  localStorage.setItem('t2f-data-mode', 'local');
  const state: any = { starts: 0, recognition: null };
  Object.assign(window, { shinyVoiceTest: state });
  class Recognition {
   static async available() { return 'available'; }
   processLocally = false; lang = ''; continuous = false; interimResults = false;
   onstart: any; onend: any; onresult: any; onerror: any;
   start() { state.starts++; state.recognition = this; this.onstart?.(); }
   stop() { this.onend?.(); } abort() {}
  }
  class Utterance { voice: any; lang = ''; onstart: any; onend: any; constructor(public text: string) {} }
  Object.defineProperty(window, 'SpeechRecognition', { value: Recognition, configurable: true });
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: Utterance, configurable: true });
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { paused: false, cancel() {}, resume() {}, addEventListener() {}, removeEventListener() {}, getVoices: () => [{localService: true, lang: 'es-ES'}], speak(u: Utterance) { u.onstart?.(); u.onend?.(); } } });
 });
});

test('toolbar starts one dictation without blocking the page; text is explicit', async ({ page }) => {
 await page.goto('/');
 const trigger = page.getByRole('button', { name: 'Hablar con IA' });
 await trigger.click();
 const region = page.getByRole('region', { name: 'Habla con tu asistente' });
 await expect(region).toBeVisible();
 await expect(trigger).toBeFocused();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect(page.locator('.voice-panel__overlay')).toHaveCount(0);
 await expect(page.locator('main')).not.toHaveAttribute('inert', '');
 await expect(region.getByLabel('Escribe tu pregunta')).toHaveCount(0);
 await expect.poll(() => page.evaluate(() => (window as any).shinyVoiceTest.starts)).toBe(1);
 await page.screenshot({path: 'test-results/shiny/voice-desktop.png'});
 await page.evaluate(() => { const r = (window as any).shinyVoiceTest.recognition; r.onresult({resultIndex: 0, results: [{isFinal: true, 0: {transcript: 'Qué es un fondo'}}]}); r.onend(); });
 await region.getByRole('button', {name: 'Ver respuesta'}).click();
 await expect(region.getByText('Qué es un fondo', { exact: true })).toBeVisible();
 await region.getByRole('button', {name: 'Escribir'}).click();
 await region.getByLabel('Escribe tu pregunta').fill('Qué es el riesgo');
 await region.getByRole('button', { name: 'Enviar' }).click();
 await expect(region.getByLabel('Escribe tu pregunta')).toBeFocused();
 await expect(region.getByText('Qué es el riesgo', { exact: true })).toBeVisible();
 expect(await page.evaluate(() => (window as any).shinyVoiceTest.starts)).toBe(1);
 await page.keyboard.press('Escape'); await expect(region).toHaveCount(0); await expect(trigger).toBeFocused();
 await page.evaluate(() => { const r = (window as any).shinyVoiceTest.recognition; r.onresult({resultIndex: 0, results: [{isFinal: true, 0: {transcript: 'Tardío'}}]}); r.onend(); });
 await expect(page.getByText('Tardío')).toHaveCount(0);
});

test('navigation stays usable and opening text chat cancels voice', async ({ page }) => {
 await page.goto('/');
 const trigger = page.getByRole('button', {name: 'Hablar con IA'});
 await trigger.click();
 const region = page.getByRole('region', {name: 'Habla con tu asistente'});
 await expect.poll(() => page.evaluate(() => (window as any).shinyVoiceTest.starts)).toBe(1);
 await page.getByRole('button', {name: 'Explorar', exact: true}).click();
 await expect(page.locator('.beginner-card')).toBeVisible();
 await page.evaluate(() => { const r = (window as any).shinyVoiceTest.recognition; r.onresult({resultIndex:0, results:[{isFinal:true, 0:{transcript:'Pregunta antigua'}}]}); r.onend(); });
 await expect(region.getByText('Pregunta antigua')).toHaveCount(0);
 await page.getByRole('button', {name: 'Abrir asistente'}).click();
 await expect(region).toHaveCount(0);
 await expect(page.getByRole('dialog', {name: 'Tu asistente'})).toBeVisible();
 await page.keyboard.press('Escape');
 await trigger.click();
 await region.getByRole('button', {name: 'Cerrar asistente de voz'}).click();
 await expect(trigger).toBeFocused();
});

for (const language of ['es', 'en'] as const) for (const theme of ['light', 'dark'] as const) {
 test(`non-modal voice fits ${language}/${theme} at 320px`, async ({ page }) => {
  await page.setViewportSize({width: 320, height: 640});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.addInitScript(({language, theme}) => { localStorage.setItem('t2f-language', language); localStorage.setItem('t2f-theme', theme); }, {language, theme});
  await page.goto('/');
  await page.getByRole('button', {name: language === 'es' ? 'Hablar con IA' : 'Talk to AI'}).click();
  const region = page.getByRole('region', {name: language === 'es' ? 'Habla con tu asistente' : 'Talk to your assistant'});
  const box = await region.boundingBox(); expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('main')).not.toHaveAttribute('inert', '');
  await page.screenshot({path: `test-results/shiny/voice-${language}-${theme}-320.png`});
  await region.getByRole('button',{name: language === 'es' ? 'Escribir' : 'Type'}).click();
  await expect(region.locator('input')).toBeVisible();
  await page.getByRole('button',{name:language === 'es' ? 'Abrir menú' : 'Open menu'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
 });
}
