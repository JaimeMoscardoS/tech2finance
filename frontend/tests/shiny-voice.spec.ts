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

test('toolbar starts one local dictation and supports typed follow-up', async ({ page }) => {
 await page.goto('/');
 await page.getByRole('button', { name: 'Hablar con IA' }).click();
 const dialog = page.getByRole('dialog', { name: 'Habla con tu asistente' });
 await expect(dialog).toBeVisible();
 const close = dialog.getByRole('button', {name: 'Cerrar asistente de voz'});
 await close.focus(); await page.keyboard.press('Shift+Tab');
 await expect(dialog.getByLabel('O escribe tu pregunta')).toBeFocused();
 await page.keyboard.press('Tab'); await expect(close).toBeFocused();
 await expect.poll(() => page.evaluate(() => (window as any).shinyVoiceTest.starts)).toBe(1);
 const box = await dialog.boundingBox(); expect(box).not.toBeNull();
 expect(Math.abs(box!.x + box!.width / 2 - 640)).toBeLessThan(2);
 await page.screenshot({path: 'test-results/shiny/voice-desktop.png'});
 await page.evaluate(() => { const r = (window as any).shinyVoiceTest.recognition; r.onresult({resultIndex: 0, results: [{isFinal: true, 0: {transcript: 'Qué es un fondo'}}]}); r.onend(); });
 await expect(dialog.getByText('Qué es un fondo', { exact: true })).toBeVisible();
 await expect(dialog.getByText('Respuesta', { exact: true })).toBeVisible();
 await dialog.getByLabel('O escribe tu pregunta').fill('Qué es el riesgo');
 await dialog.getByRole('button', { name: 'Enviar' }).click();
 await expect(dialog.getByText('Qué es el riesgo', { exact: true })).toBeVisible();
 await expect(dialog.getByText('Respuesta', { exact: true })).toBeVisible();
 expect(await page.evaluate(() => (window as any).shinyVoiceTest.starts)).toBe(1);
 await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
 await page.evaluate(() => { const r = (window as any).shinyVoiceTest.recognition; r.onresult({resultIndex: 0, results: [{isFinal: true, 0: {transcript: 'Tardío'}}]}); r.onend(); });
 await expect(page.getByText('Tardío')).toHaveCount(0);
});

test('dialog fits a 320px viewport', async ({ page }) => {
 await page.setViewportSize({width: 320, height: 640}); await page.goto('/');
 await page.getByRole('button', {name: 'Hablar con IA'}).click();
 const dialog = page.getByRole('dialog', {name: 'Habla con tu asistente'});
 await expect(dialog).toBeVisible();
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
 const box = await dialog.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(320);
 await dialog.getByLabel('O escribe tu pregunta').scrollIntoViewIfNeeded();
 await expect(dialog.getByRole('button', {name: 'Enviar'})).toBeVisible();
 const send = await dialog.getByRole('button', {name: 'Enviar'}).boundingBox();
 expect(send!.x + send!.width).toBeLessThanOrEqual(box!.x + box!.width);
 await page.screenshot({path: 'test-results/shiny/shiny-voice-320.png'});
});

for (const language of ['es', 'en'] as const) for (const theme of ['light', 'dark'] as const) {
 test(`conversation fits ${language}/${theme} at 320px`, async ({ page }) => {
  await page.setViewportSize({width: 320, height: 640});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.addInitScript(({language, theme}) => { localStorage.setItem('t2f-language', language); localStorage.setItem('t2f-theme', theme); }, {language, theme});
  await page.goto('/');
  await page.getByRole('button', {name: language === 'es' ? 'Hablar con IA' : 'Talk to AI'}).click();
  const dialog = page.getByRole('dialog', {name: language === 'es' ? 'Habla con tu asistente' : 'Talk to your assistant'});
  const box = await dialog.boundingBox(); expect(box).not.toBeNull();
  expect(Math.abs(box!.x + box!.width / 2 - 160)).toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  const send = dialog.getByRole('button', {name: language === 'es' ? 'Enviar' : 'Send'});
  await send.scrollIntoViewIfNeeded(); const buttonBox = await send.boundingBox();
  expect(buttonBox!.x + buttonBox!.width).toBeLessThanOrEqual(box!.x + box!.width);
  await page.screenshot({path: `test-results/shiny/voice-${language}-${theme}-320.png`});
 });
}
