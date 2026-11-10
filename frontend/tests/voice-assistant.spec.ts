import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
 await page.addInitScript(() => {
  const state: { starts: number; spoken: number; recognition: any; availability: string } = { starts: 0, spoken: 0, recognition: null, availability: 'available' };
  Object.assign(window, { voiceTest: state });
  class Recognition {
   static async available() { return state.availability; }
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

test('unavailable local dictation explains how to reach the written assistant', async ({ page }) => {
 await page.goto('/');
 await page.evaluate(() => { (window as any).voiceTest.availability = 'unavailable'; });
 await page.getByRole('button', { name: 'Hablar con IA' }).click();
 const dialog = page.getByRole('dialog', { name: 'Habla con tu asistente' });
 await dialog.getByRole('button', { name: 'Hablar', exact: true }).click();
 await expect(dialog.getByRole('status')).toContainText('Para escribir, cierra esta ventana y abre Tu asistente.');
 expect(await page.evaluate(() => (window as any).voiceTest.starts)).toBe(0);
});

test('voice question is submitted once after dictation ends, without starting another microphone session', async ({ page }) => {
 await page.goto('/');
 await page.getByRole('button', { name: 'Hablar con IA' }).click();
 const dialog = page.getByRole('dialog', { name: 'Habla con tu asistente' });
 await expect(dialog).toBeVisible();
 expect(await page.evaluate(() => (window as any).voiceTest.starts)).toBe(0);
 await dialog.getByRole('button', { name: 'Hablar', exact: true }).click();
 await page.evaluate(() => {
  const recognition = (window as any).voiceTest.recognition;
  recognition.onresult({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: 'Qué es un fondo' } }] });
 });
 await expect(dialog.getByText('Tu pregunta', { exact: true })).toHaveCount(0);
 await page.evaluate(() => (window as any).voiceTest.recognition.onend());
 await expect(dialog.getByText('Qué es un fondo', { exact: true })).toBeVisible();
 await expect(dialog.getByText('Respuesta', { exact: true })).toBeVisible();
 await expect.poll(() => page.evaluate(() => (window as any).voiceTest.spoken)).toBe(1);
 expect(await page.evaluate(() => (window as any).voiceTest.starts)).toBe(1);
});

test('cancelled recognition cannot submit a late final result', async ({ page }) => {
 await page.goto('/');
 await page.getByRole('button', { name: 'Hablar con IA' }).click();
 const dialog = page.getByRole('dialog', { name: 'Habla con tu asistente' });
 await dialog.getByRole('button', { name: 'Hablar', exact: true }).click();
 await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
 await page.evaluate(() => {
  const recognition = (window as any).voiceTest.recognition;
  recognition.onresult({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: 'Resultado tardío' } }] });
  recognition.onend();
 });
 await expect(dialog.getByText('Resultado tardío')).toHaveCount(0);
 expect(await page.evaluate(() => (window as any).voiceTest.spoken)).toBe(0);
});
