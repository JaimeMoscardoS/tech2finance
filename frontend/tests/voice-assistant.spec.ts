import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
 await page.addInitScript(() => {
  const state: { starts: number; checks: number; spoken: number; recognition: any; availability: string; resolveCheck: null | ((value: string) => void) } = { starts: 0, checks: 0, spoken: 0, recognition: null, availability: 'available', resolveCheck: null };
  Object.assign(window, { voiceTest: state });
  class Recognition {
   static async available() { state.checks++; return state.availability === 'pending' ? new Promise<string>(resolve => { state.resolveCheck = resolve; }) : state.availability; }
   processLocally = false; lang = ''; continuous = false; interimResults = false;
   onstart: (() => void) | null = null; onend: (() => void) | null = null;
   onresult: ((event: unknown) => void) | null = null; onerror = null;
   start() { state.starts++; state.recognition = this; this.onstart?.(); }
   stop() { this.onend?.(); }
   abort() { /* Keep callbacks available to simulate a late browser event. */ }
  }
  class Utterance { voice: unknown; lang = ''; onstart: (() => void) | null = null; onend: (() => void) | null = null; constructor(public text: string) {} }
  Object.defineProperty(window, 'SpeechRecognition', { value: Recognition, configurable: true });
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: Utterance, configurable: true });
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
   paused: false, cancel() {}, resume() {}, addEventListener() {}, removeEventListener() {},
   getVoices: () => [{ localService: true, lang: 'es-ES' }],
   speak(utterance: Utterance) { state.spoken++; utterance.onstart?.(); utterance.onend?.(); },
  } });
 });
});

test('unavailable local dictation offers writing in the same conversation', async ({ page }) => {
 await page.goto('/');
 await page.evaluate(() => { (window as any).voiceTest.availability = 'unavailable'; });
 await page.getByRole('button', { name: 'Hablar con IA' }).click();
 const dialog = page.getByRole('region', { name: 'Habla con tu asistente' });
 await expect(dialog.getByRole('status')).toContainText('puedes escribir');
 await expect(dialog.getByLabel('Escribe tu pregunta')).toHaveCount(0);
 await dialog.getByRole('button', { name: 'Escribir' }).click();
 await expect(dialog.getByLabel('Escribe tu pregunta')).toBeVisible();
 expect(await page.evaluate(() => (window as any).voiceTest.starts)).toBe(0);
 expect(await page.evaluate(() => (window as any).voiceTest.checks)).toBe(1);
 await page.evaluate(() => { (window as any).voiceTest.availability = 'available'; });
 await dialog.getByRole('button', { name: 'Hablar', exact: true }).click();
 await expect.poll(() => page.evaluate(() => (window as any).voiceTest.starts)).toBe(1);
});

test('voice question is submitted once after dictation ends, without starting another microphone session', async ({ page }) => {
 await page.goto('/');
 expect(await page.evaluate(() => (window as any).voiceTest.checks)).toBe(0);
 await page.getByRole('button', { name: 'Hablar con IA' }).click();
 const dialog = page.getByRole('region', { name: 'Habla con tu asistente' });
 await expect(dialog).toBeVisible();
 await expect.poll(() => page.evaluate(() => (window as any).voiceTest.starts)).toBe(1);
 expect(await page.evaluate(() => (window as any).voiceTest.checks)).toBe(1);
 await page.evaluate(() => {
  const recognition = (window as any).voiceTest.recognition;
  recognition.onresult({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: 'Qué es un fondo' } }] });
 });
 await expect(dialog.getByText('Tu pregunta', { exact: true })).toHaveCount(0);
 await page.evaluate(() => (window as any).voiceTest.recognition.onend());
 await dialog.getByRole('button', { name: 'Ver respuesta' }).click();
 await expect(dialog.getByText('Qué es un fondo', { exact: true })).toBeVisible();
 await expect(dialog.getByText('Respuesta', { exact: true })).toBeVisible();
 await expect.poll(() => page.evaluate(() => (window as any).voiceTest.spoken)).toBe(1);
 expect(await page.evaluate(() => (window as any).voiceTest.starts)).toBe(1);
});

test('cancelled recognition cannot submit a late final result', async ({ page }) => {
 await page.goto('/');
 await page.getByRole('button', { name: 'Hablar con IA' }).click();
 const dialog = page.getByRole('region', { name: 'Habla con tu asistente' });
 await expect.poll(() => page.evaluate(() => (window as any).voiceTest.starts)).toBe(1);
 await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
 await page.evaluate(() => {
  const recognition = (window as any).voiceTest.recognition;
  recognition.onresult({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: 'Resultado tardío' } }] });
  recognition.onend();
 });
 await expect(dialog.getByText('Resultado tardío')).toHaveCount(0);
 expect(await page.evaluate(() => (window as any).voiceTest.spoken)).toBe(0);
});

test('reopening the toolbar microphone starts a fresh session once', async ({ page }) => {
 await page.goto('/');
 await page.getByRole('button', { name: 'Hablar con IA' }).click();
 await expect.poll(() => page.evaluate(() => (window as any).voiceTest.starts)).toBe(1);
 await page.getByRole('region', { name: 'Habla con tu asistente' }).getByRole('button', { name: 'Cerrar asistente de voz' }).click();
 await page.getByRole('button', { name: 'Hablar con IA' }).click();
 await expect.poll(() => page.evaluate(() => (window as any).voiceTest.starts)).toBe(2);
 expect(await page.evaluate(() => (window as any).voiceTest.checks)).toBe(2);
});

test('opening voice from the pause leaves the microphone off until requested', async ({ page }) => {
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
 await page.goto('/');
 await page.getByRole('button', { name: 'Hablar con IA' }).click();
 await expect.poll(() => page.evaluate(() => (window as any).voiceTest.starts)).toBe(1);
 await page.getByRole('region', { name: 'Habla con tu asistente' }).getByRole('button', { name: 'Cerrar asistente de voz' }).click();
 await page.getByRole('button', { name: 'Mi cartera', exact: true }).click();
 await page.getByRole('button', { name: '¿Te preocupa la caída? Revísala con calma' }).click();
 await page.getByRole('dialog', { name: 'Tomemos un momento' }).getByRole('button', { name: 'Hablar con el asistente' }).click();
 const dialog = page.getByRole('region', { name: 'Habla con tu asistente' });
 await expect(dialog.getByRole('button', { name: 'Hablar', exact: true })).toBeVisible();
 expect(await page.evaluate(() => (window as any).voiceTest.checks)).toBe(1);
 await dialog.getByRole('button', { name: 'Cerrar asistente de voz' }).click();
 await page.getByRole('button', { name: 'Hablar con IA' }).click();
 await expect.poll(() => page.evaluate(() => (window as any).voiceTest.starts)).toBe(2);
 expect(await page.evaluate(() => (window as any).voiceTest.checks)).toBe(2);
});

test('a language change cancels pending local availability without restarting', async ({ page }) => {
 await page.goto('/');
 await page.evaluate(() => { (window as any).voiceTest.availability = 'pending'; });
 await page.getByRole('button', { name: 'Hablar con IA' }).click();
 await expect.poll(() => page.evaluate(() => (window as any).voiceTest.checks)).toBe(1);
 await page.locator('.preference-button').filter({ hasText: 'EN' }).evaluate((button: HTMLElement) => button.click());
 await expect(page.getByRole('region', { name: 'Talk to your assistant' })).toBeVisible();
 await page.evaluate(() => (window as any).voiceTest.resolveCheck('available'));
 await expect(page.getByRole('region', { name: 'Talk to your assistant' }).getByRole('button', { name: 'Talk', exact: true })).toBeVisible();
 expect(await page.evaluate(() => (window as any).voiceTest.starts)).toBe(0);
 expect(await page.evaluate(() => (window as any).voiceTest.checks)).toBe(1);
});
