import { expect, test } from '@playwright/test';

// Bienvenida de primera visita y modo presentación. En navegadores automatizados la bienvenida solo aparece con ?welcome=1.

test.describe('Bienvenida', () => {
  test('aparece, fija el nivel elegido y se recuerda', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
    await page.goto('/?welcome=1');
    const dialog = page.getByRole('dialog', { name: '¿Cuánto sabes de invertir?' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Puedes cambiarlo cuando quieras');
    await expect(dialog.getByRole('button', { name: /Poco o nada/ })).toBeFocused();
    await dialog.getByRole('button', { name: /Bastante/ }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-level', 'advanced');
    await expect(page.getByRole('button', { name: /Nivel: Avanzado/ })).toBeVisible();
    expect(await page.evaluate(() => [localStorage.getItem('t2f-level'), localStorage.getItem('t2f-welcome-done')])).toEqual(['advanced', '1']);
  });

  test('«Saltar» y Esc la cierran sin cambiar el nivel', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('t2f-data-mode', 'local'); localStorage.setItem('t2f-level', 'intermediate'); });
    await page.goto('/?welcome=1');
    const dialog = page.getByRole('dialog', { name: '¿Cuánto sabes de invertir?' });
    await dialog.getByRole('button', { name: 'Saltar' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-level', 'intermediate');
    expect(await page.evaluate(() => localStorage.getItem('t2f-welcome-done'))).toBe('1');
    await page.goto('/?welcome=1');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-level', 'intermediate');
  });

  test('no aparece sin ?welcome=1 en un navegador automatizado', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Resumen de tu cartera/ })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('Modo presentación', () => {
  test('?demo=1 recorre 5 pasos con siguiente, anterior y Esc', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
    await page.goto('/?demo=1');
    const card = page.getByRole('dialog', { name: 'Resumen de la cartera' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('Paso 1 de 5');
    await expect(page.locator('.tour__spot')).toBeVisible();
    await expect(card.getByRole('button', { name: /Anterior/ })).toBeDisabled();

    const next = () => page.locator('.tour__card').getByRole('button', { name: /Siguiente/ }).click();
    await next();
    await expect(page.getByRole('dialog', { name: 'Asistente de IA' })).toContainText('Paso 2 de 5');
    await next();
    await expect(page.getByRole('dialog', { name: 'Probar una caída' })).toContainText('Paso 3 de 5');
    await next();
    await expect(page.getByRole('dialog', { name: 'Simulador: ¿y si vendo?' })).toContainText('Paso 4 de 5');
    await expect(page.locator('main h1')).toContainText('Simulador');
    await next();
    await expect(page.getByRole('dialog', { name: 'Práctica del Test MiFID' })).toContainText('Paso 5 de 5');
    await expect(page.locator('[data-tour="mifid"]')).toBeVisible();
    await expect(page.locator('.tour__card').getByRole('button', { name: 'Terminar' })).toBeVisible();

    await page.locator('.tour__card').getByRole('button', { name: /Anterior/ }).click();
    await expect(page.getByRole('dialog', { name: 'Simulador: ¿y si vendo?' })).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('dialog', { name: 'Probar una caída' })).toBeVisible();
    await expect(page.locator('main h1')).toContainText('Inicio');

    await page.keyboard.press('Escape');
    await expect(page.locator('.tour')).toHaveCount(0);
  });

  test('el botón «Presentar» de la cabecera lanza el recorrido', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
    await page.goto('/');
    await page.getByRole('button', { name: /Modo presentación/ }).click();
    await expect(page.getByRole('dialog', { name: 'Resumen de la cartera' })).toBeVisible();
    await page.locator('.tour__card').getByRole('button', { name: /Salir de la presentación/ }).click();
    await expect(page.locator('.tour')).toHaveCount(0);
  });
});
