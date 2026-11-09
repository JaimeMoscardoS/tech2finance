import { test, expect, devices } from '@playwright/test';

test('users can explore, change level and run a labelled simulation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Invertir empieza/ })).toBeVisible();
  await page.getByRole('button', { name: /Nivel: Principiante/ }).click();
  await page.getByRole('button', { name: 'Avanzado' }).click();
  await page.getByRole('button', { name: 'Simulador', exact: true }).click();
  await expect(page.getByText(/variaciones son inventadas/)).toBeVisible();
  await expect(page.getByText(/repite la misma secuencia/)).toBeVisible();
  await page.getByLabel('Importe inicial').fill('100');
  await page.getByLabel('Aportación mensual').fill('');
  await page.getByRole('button', { name: 'Ver mi ejemplo' }).click();
  await expect(page.getByText('100,00 €', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir asistente' }).click();
  await expect(page.getByText(/IA Y VOZ PENDIENTES/)).toBeVisible();
});

test('pause dialog handles keyboard focus and escape', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mi cartera', exact: true }).click();
  const trigger = page.getByRole('button', { name: /Entender una caída/ });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Cerrar', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('mobile navigation is hidden until opened', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Simulador', exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await page.getByRole('button', { name: 'Simulador', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Imaginar también/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await context.close();
});