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
  await expect(page.locator('.sim-values strong').filter({hasText:'100,00 €'})).toBeVisible();
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
 await trigger.click(); const close = page.getByRole('dialog', { name: 'MI ESPACIO' }).getByRole('button', { name: 'Cerrar menú', exact: true });
 await expect(close).toBeFocused(); await page.keyboard.press('Shift+Tab');
 await expect(page.getByRole('button', { name: 'Ver opciones' })).toBeFocused();
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
 await expect(panel.getByText(/No hay histórico verificado/)).toBeVisible();
 await expect(page.getByRole('button', {name:'Ver mi ejemplo'})).toBeDisabled();
 await page.getByLabel('Entidad').selectOption('caixabank');
 await expect(page.getByLabel('Instrumento')).toHaveValue('caixabank-monetario-estandar');
 await expect(panel.getByText(/ES0138045002/)).toBeVisible();
 await expect(panel.getByText('HISTÓRICO ANUAL')).toBeVisible();
 await expect(panel.locator('.sim-values strong').filter({hasText:'529,02 €'})).toBeVisible();
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
 await expect(page.getByText('ANNUAL HISTORY')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await context.close();
});

test('annual history keeps fixed period and excludes monthly contributions', async ({ page }) => {
 await page.goto('/');
 await page.getByRole('button', {name:'Simulador', exact:true}).click();
 await page.getByLabel('Aportación mensual').fill('200');
 await page.getByRole('button', {name:'Probar histórico 2021–2025'}).click();
 const panel=page.locator('.sim-result');
 await expect(page.getByLabel('Instrumento')).toHaveValue('caixabank-monetario-estandar');
 await expect(page.getByLabel('Aportación mensual')).toHaveCount(0);
 await expect(page.getByText('Periodo fijo: 2021–2025')).toBeVisible();
 await expect(panel.locator('.sim-values strong').filter({hasText:'529,02 €'})).toBeVisible();
 await expect(panel.locator('.sim-values strong').filter({hasText:'500,00 €'})).toBeVisible();
 await expect(panel.getByRole('table', {name:'Rentabilidades anuales publicadas'}).locator('tbody tr')).toHaveCount(5);
 await expect(panel.getByText(/MES 5/)).toHaveCount(0);
 await page.getByLabel('Aportación anual').fill('100');
 await expect(panel.getByText(/Has cambiado los datos/)).toBeVisible();
 await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
 await expect(panel.locator('.sim-values strong').filter({hasText:'1048,55 €'})).toBeVisible();
 await expect(panel.locator('.sim-values strong').filter({hasText:'1000,00 €'})).toBeVisible();
 await page.screenshot({path:'test-results/simulator-annual-100.png',fullPage:true});
 await page.getByRole('button',{name:'Abrir asistente'}).click();
 await page.getByRole('button',{name:'¿Cómo funciona la simulación?'}).click();
 await page.getByRole('button',{name:'Enviar pregunta'}).click();
 await expect(page.getByText(/reconstrucción con rentabilidades anuales publicadas/)).toBeVisible();
 await page.keyboard.press('Escape');
 await page.getByLabel('Aportación anual').fill('0');
 await page.getByLabel('Importe inicial').fill('1000');
 await expect(panel.getByText(/Has cambiado los datos/)).toBeVisible();
 await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
 await expect(panel.locator('.sim-values strong').filter({hasText:'1058,05 €'})).toBeVisible();
 await page.getByRole('button',{name:/Nivel: Principiante/}).click();
 await page.getByRole('button',{name:'Avanzado',exact:true}).click();
 await expect(panel.locator('.sim-values strong').filter({hasText:'1058,05 €'})).toBeVisible();
 await page.getByRole('button',{name:'Modo oscuro'}).click();
 await page.getByRole('button',{name:'English'}).click();
 await expect(panel.locator('.sim-values strong').filter({hasText:'€1,058.05'})).toBeVisible();
 await page.getByLabel('Institution').selectOption('bbva');
 await expect(panel.getByText(/No verified historical series/)).toBeVisible();
 await page.getByLabel('Institution').selectOption('santander');
 await expect(panel.getByText(/No verified historical series/)).toBeVisible();
 await page.getByLabel('Institution').selectOption('demo');
 await expect(page.getByLabel('Monthly contribution')).toHaveValue('200');
});

test('tablet layout, modal scrolling and mobile menu background', async ({ browser }) => {
 const tablet=await browser.newContext({viewport:{width:768,height:1024}});
 const page=await tablet.newPage(); await page.goto('/');
 await page.getByRole('button',{name:'English'}).click();
 await page.getByRole('button',{name:'Dark theme'}).click();
 await page.getByRole('button',{name:'Simulator',exact:true}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await page.screenshot({path:'test-results/simulator-tablet.png',fullPage:true});
 await page.getByRole('button',{name:'Level: Beginner'}).click();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('button',{name:'Level: Beginner'})).toHaveAttribute('aria-expanded','false');
 await tablet.close();
 const mobile=await browser.newContext({viewport:{width:568,height:320}});
 const phone=await mobile.newPage(); await phone.goto('/');
 await phone.getByRole('button',{name:'Abrir menú'}).click();
 await expect(phone.locator('main')).toHaveAttribute('inert','');
 await phone.getByRole('button',{name:'Mi cartera',exact:true}).click();
 await phone.getByRole('button',{name:'Entender una caída'}).click();
 const modal=phone.getByRole('dialog');
 expect(await modal.evaluate(el=>el.scrollHeight>el.clientHeight)).toBeTruthy();
 await modal.getByRole('button',{name:'Entendido'}).scrollIntoViewIfNeeded();
 await expect(modal.getByRole('button',{name:'Entendido'})).toBeInViewport();
 await phone.screenshot({path:'test-results/pause-landscape.png'});
 await mobile.close();
});

test('annual deposits, table and percentage view stay consistent across preferences', async ({page}) => {
 await page.goto('/');
 await page.getByRole('button',{name:'Simulador',exact:true}).click();
 await page.getByRole('button',{name:'Probar histórico 2021–2025'}).click();
 await page.getByLabel('Aportación anual').fill('50');
 await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
 const panel=page.locator('.sim-result');
 await expect(panel.locator('.sim-values strong').nth(0)).toHaveText('788,79 €');
 await expect(panel.locator('.sim-values strong').nth(1)).toHaveText('750,00 €');
 await expect(panel.locator('.sim-values strong').nth(2)).toHaveText('38,79 €');
 await expect(panel.locator('[role="status"][aria-atomic="true"]')).toContainText('Resultado actualizado');
 await panel.getByText('Ver datos', {exact:true}).click();
 const rows=panel.getByRole('table',{name:'Datos del gráfico: Evolución de la práctica'}).locator('tbody tr');
 await expect(rows).toHaveCount(6);
 await expect(rows.nth(0)).toContainText('Importe inicial: 500,00 €');
 await expect(rows.last()).toContainText('788,79 €');
 await expect(rows.last()).toContainText('750,00 €');
 await expect(rows.last()).toContainText('5,8 %');
 await panel.getByRole('button',{name:'Evolución del instrumento (%)'}).click();
 await expect(rows.last()).toContainText('5,8 %');
 await page.getByRole('button',{name:/Nivel: Principiante/}).click();
 await page.getByRole('button',{name:'Intermedio',exact:true}).click();
 await page.getByRole('button',{name:'Modo oscuro'}).click();
 await page.getByRole('button',{name:'English'}).click();
 await expect(panel.locator('.sim-values strong').nth(0)).toHaveText('€788.79');
 await expect(panel.getByRole('button',{name:'Instrument performance (%)'})).toHaveAttribute('aria-pressed','true');
 await page.getByLabel('Annual contribution').fill('75');
 await expect(panel.getByText(/Your inputs changed/)).toBeVisible();
 await expect(panel.locator('.investment-chart')).toHaveCount(0);
 await page.getByLabel('Institution').selectOption('bbva');
 await expect(panel.getByText(/No verified historical series/)).toBeVisible();
 await expect(panel.locator('.investment-chart')).toHaveCount(0);
 await page.getByLabel('Institution').selectOption('demo');
 await expect(page.getByLabel('Monthly contribution')).toHaveValue('50');
 await page.getByLabel('Institution').selectOption('caixabank');
 await expect(page.getByLabel('Annual contribution')).toHaveValue('75');
});

test('validation identifies the actual field and retains annual help', async ({page}) => {
 await page.goto('/'); await page.getByRole('button',{name:'Simulador',exact:true}).click();
 await page.getByRole('button',{name:'Probar histórico 2021–2025'}).click();
 const initial=page.getByLabel('Importe inicial'); const annual=page.getByLabel('Aportación anual');
 await initial.fill('-1'); await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
 await expect(initial).toHaveAttribute('aria-invalid','true');
 await expect(annual).toHaveAttribute('aria-invalid','false');
 await expect(page.getByRole('alert')).toContainText('Importe inicial');
 await initial.fill('500'); await annual.fill('-1'); await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
 await expect(initial).toHaveAttribute('aria-invalid','false');
 await expect(annual).toHaveAttribute('aria-invalid','true');
 await expect(annual).toHaveAttribute('aria-describedby','annual-help sim-error');
 await expect(page.getByRole('alert')).toContainText('Aportación anual');
});

test('home chart retains useful width on narrow screens', async ({browser}) => {
 for (const width of [320,768]) {
  const context=await browser.newContext({viewport:{width,height:900}});
  const page=await context.newPage(); await page.goto('/');
  if (width===768) { await page.getByRole('button',{name:'English'}).click(); await page.getByRole('button',{name:'Dark theme'}).click(); }
  const plot=page.locator('.portfolio-content .investment-chart__plot');
  await expect(plot).toBeVisible();
  expect((await plot.boundingBox())!.width).toBeGreaterThan(width===320?200:300);
  await page.screenshot({path:`test-results/home-${width}.png`,fullPage:true});
  await context.close();
 }
});
