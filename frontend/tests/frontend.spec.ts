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
  await expect(page.getByRole('heading', { name: /Practica con dinero ficticio/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await context.close();
});
test('language and theme switches apply across the interface and persist', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: /Investing starts/ })).toBeVisible();
  await page.getByRole('button', { name: 'Dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.getByRole('heading', { name: /Investing starts/ })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('experience levels show distinct views without changing the selected risk', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Tu punto de partida')).toBeVisible();
  await page.getByRole('button', { name: /Nivel: Principiante/ }).click();
  await page.getByRole('button', { name: 'Intermedio' }).click();
  await expect(page.getByText('Tu panorama')).toBeVisible();
  await page.getByRole('button', { name: /Nivel: Intermedio/ }).click();
  await page.getByRole('button', { name: 'Avanzado' }).click();
  await expect(page.getByText('Panel de análisis')).toBeVisible();
});
test('English navigation, assistant and simulated portfolio are translated', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'English' }).click();
  await page.getByRole('button', { name: 'Explore', exact: true }).click();
  await expect(page.getByText('Fictional funds for learning. These are not recommendations.')).toBeVisible();
  await page.getByRole('button', { name: 'My portfolio', exact: true }).click();
  await page.getByRole('button', { name: 'Understand a decline' }).click();
  await expect(page.getByText(/does not guarantee recovery/)).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Open assistant' }).click();
  await expect(page.getByText('SAMPLE RESPONSES · AI AND VOICE NOT CONNECTED')).toBeVisible();
  await page.getByRole('button', { name: 'What is a fund?' }).click();
  await page.getByRole('button', { name: 'Send question' }).click();
  await expect(page.getByText(/A fund pools contributions/)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open assistant' })).toBeFocused();
});

test('mobile menu traps focus, closes with Escape and restores focus', async ({ browser }) => {
 const context = await browser.newContext({ viewport: { width: 320, height: 700 } });
 const page = await context.newPage(); await page.goto('/');
 const trigger = page.getByRole('button', { name: 'Abrir menú' });
 await trigger.click(); const close = page.getByRole('complementary', { name: 'MI ESPACIO' }).getByRole('button', { name: 'Cerrar menú', exact: true });
 await expect(close).toBeFocused(); await page.keyboard.press('Shift+Tab');
 await expect(page.getByRole('button', { name: 'Conceptos básicos' })).toBeFocused();
 await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
 await context.close();
});

test('English intermediate view fits a 320px screen', async ({ browser }) => {
 const context = await browser.newContext({ viewport: { width: 320, height: 700 } });
 const page = await context.newPage(); await page.goto('/');
 await page.getByRole('button', { name: 'English' }).click();
 await page.getByRole('button', { name: 'Level: Beginner' }).click();
 await page.getByRole('button', { name: 'Intermediate', exact: true }).click();
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
 await context.close();
});

test('opening the assistant from the mobile menu transfers focus to the dialog', async ({ browser }) => {
 const context = await browser.newContext({ viewport: { width: 320, height: 700 } });
 const page = await context.newPage(); await page.goto('/');
 await page.getByRole('button', { name: 'Abrir menú' }).click();
 await page.getByRole('button', { name: 'Tu asistente DEMO' }).click();
 const dialog = page.getByRole('dialog', { name: 'Tu asistente' });
 await expect(dialog).toBeVisible();
 await expect(dialog.getByRole('button', { name: 'Cerrar asistente' })).toBeFocused();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeFocused();
 await context.close();
});

test('catalogue selection changes the example and real funds have no invented result', async ({ page }) => {
 await page.goto('/');
 await page.getByRole('button', {name:'Simulador', exact:true}).click();
 const panel=page.locator('.sim-result');
 const original=await panel.locator('.sim-values strong').first().textContent();
 await page.getByLabel('Tipo de activo').selectOption('etf');
 await expect(page.getByLabel('Instrumento')).toHaveValue('demo-etf');
 expect(await panel.locator('.sim-values strong').first().textContent()).not.toBe(original);
 const newValue=await panel.locator('.sim-values strong').first().textContent();
 await page.getByRole('button', {name:/Nivel: Principiante/}).click();
 await page.getByRole('button', {name:'Avanzado', exact:true}).click();
 await expect(panel.locator('.sim-values strong').first()).toHaveText(newValue!);
 await page.getByLabel('Tipo de activo').selectOption('fund');
 await page.getByLabel('Entidad').selectOption('bbva');
 await expect(panel.getByText(/No hay histórico verificado/)).toBeVisible();
 await expect(panel.locator('.chart')).toHaveCount(0);
 await expect(page.getByRole('button', {name:'Ver mi ejemplo'})).toBeDisabled();
 await page.getByLabel('Entidad').selectOption('caixabank');
 await expect(page.getByLabel('Instrumento')).toHaveValue('caixabank-monetario-estandar');
 await expect(panel.getByText(/ES0138045002/)).toBeVisible();
 await expect(panel.locator('.chart')).toHaveCount(0);
 await page.screenshot({path:'test-results/catalog-desktop.png',fullPage:true});
});

test('explore transfers the chosen fictional instrument', async ({page}) => {
 await page.goto('/');
 await page.getByRole('button',{name:'Explorar',exact:true}).click();
 await page.locator('.fund-card').nth(1).getByRole('button',{name:'Practicar con este ejemplo'}).click();
 await expect(page.getByLabel('Instrumento')).toHaveValue('demo-equity');
 await expect(page.locator('.sim-result')).toContainText('Fondo Horizonte');
});

test('catalogue fits mobile in English dark mode', async ({browser}) => {
 const context=await browser.newContext({viewport:{width:320,height:700}});
 const page=await context.newPage(); await page.goto('/');
 await page.getByRole('button',{name:'English'}).click();
 await page.getByRole('button',{name:'Dark theme'}).click();
 await page.getByRole('button',{name:'Open menu'}).click();
 await page.getByRole('button',{name:'Simulator',exact:true}).click();
 await page.getByLabel('Asset type').selectOption('fund');
 await page.getByLabel('Institution').selectOption('caixabank');
 await page.screenshot({path:'test-results/catalog-mobile.png',fullPage:true});
 await expect(page.getByText(/No verified historical series/).first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await context.close();
});
