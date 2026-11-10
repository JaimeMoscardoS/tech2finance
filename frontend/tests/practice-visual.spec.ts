import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

for (const sample of [
  { theme: 'light', width: 1280, height: 900, name: 'practice-light-desktop' },
  { theme: 'dark', width: 320, height: 800, name: 'practice-dark-mobile' },
] as const) {
  test(`practice comparison ${sample.name}`, async ({ page }) => {
    await page.setViewportSize({ width: sample.width, height: sample.height });
    await page.addInitScript(theme => {
      localStorage.setItem('t2f-data-mode', 'local');
      localStorage.setItem('t2f-theme', theme);
      localStorage.setItem('t2f-language', 'es');
    }, sample.theme);
    await page.goto('/');
    await page.getByRole('button', { name: /Practica sin riesgo/ }).click();
    await expect(page.getByRole('heading', { name: 'Aprende haciendo preguntas.' })).toBeVisible();
    await page.getByRole('button', { name: 'Comparar ejemplos' }).click();
    await expect(page.locator('.practice-result-card')).toHaveCount(2);
    await expect(page.getByRole('heading', { name: 'La comparación', exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await mkdir('test-results/practice-review', { recursive: true });
    await page.screenshot({ path: `test-results/practice-review/${sample.name}.png`, fullPage: true, animations: 'disabled' });
  });
}
