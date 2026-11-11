import { test, expect, type Page } from '@playwright/test';

const SANTANDER = 'santander-rf-ahorro';

// «¿Y si vendo?» es una pestaña del Simulador único. El formulario completo (meses, aportación, comisiones) es el de Intermedio/Avanzado;
// Básico usa la versión guiada (ver el test «guided»).
async function openGame(page: Page, url = '/', level = 'intermediate') {
  await page.addInitScript(l => localStorage.setItem('t2f-level', l), level);
  await page.goto(url);
  const menu = page.getByRole('button', { name: 'Abrir menú' });
  const nav = page.getByRole('button', { name: /^(Simulador|Simulator)$/ });
  await expect(menu.or(nav.first())).toBeVisible();
  if (await menu.isVisible()) await menu.click();
  await nav.first().click();
  await page.getByRole('tab', { name: /^(¿Y si vendo\?|What if I sell\?)$/ }).click();
  const game = page.locator('section.hsg');
  await expect(game).toBeVisible();
  return game;
}

async function fillCase(game: ReturnType<Page['locator']>) {
  await game.getByLabel('Fondo').selectOption(SANTANDER);
  await game.getByLabel('Importe inicial (€)').fill('1000');
  await game.getByLabel('Aportación mensual (€)').fill('100');
  await game.getByLabel('Meses', { exact: true }).fill('3');
  await game.getByLabel('Mes de venta').fill('2');
  await game.getByText('Comisiones (opcional)').click();
  await game.getByLabel('Comisión de compra (%)').fill('1');
  await game.getByLabel('Comisión de venta (%)').fill('1');
}

test('server mode compares hold and sell with the backend numbers and neutral cards', async ({ page }) => {
  const bodies: unknown[] = [];
  page.on('request', req => { if (req.url().endsWith('/api/game/compare') && req.method() === 'POST') bodies.push(req.postDataJSON()); });
  const game = await openGame(page);
  await expect(game.getByRole('heading', { name: '¿Y si vendo en el mes X?' })).toBeVisible();
  await expect(game.getByLabel('Fondo').locator('option[value="caixabank-monetario-estandar"]')).toHaveCount(0);
  await expect(game.getByLabel('Fondo').locator(`option[value="${SANTANDER}"]`)).toHaveCount(1);
  await expect(game.getByText(/no es una recomendación/)).toBeVisible();
  await fillCase(game);
  await game.getByRole('button', { name: 'Comparar mantener y vender' }).click();
  const cards = game.locator('.hsg-card');
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toContainText('Si mantengo');
  await expect(cards.nth(0)).toContainText('1254,63');
  await expect(cards.nth(0)).toContainText('1300,00');
  await expect(cards.nth(0)).toContainText('13,00');
  await expect(cards.nth(0)).toContainText('-45,37');
  await expect(cards.nth(1)).toContainText('Si vendo en el mes 2');
  await expect(cards.nth(1)).toContainText('1275,83');
  await expect(cards.nth(1)).toContainText('23,88');
  await expect(cards.nth(1)).toContainText('-24,17');
  // Neutral presentation: both cards share the same class and no verdict wording appears.
  expect(await cards.nth(0).getAttribute('class')).toBe(await cards.nth(1).getAttribute('class'));
  await expect(game).not.toContainText(/mejor|ganador|winner|better/i);
  expect(bodies).toEqual([{ instrumentId: SANTANDER, initial: 1000, monthly: 100, months: 3, sellMonth: 2, buyFeeRate: 0.01, sellFeeRate: 0.01 }]);
  await expect(game.getByRole('img', { name: /Gráfico de dos líneas/ })).toBeVisible();
  await expect(game.getByText('Venta · mes 2')).toBeVisible();
  await expect(game.getByText('Valores liquidativos mensuales publicados por la CNMV').first()).toBeVisible();
  await expect(game.getByText('31 dic 2019 – 31 mar 2020')).toBeVisible();
  await expect(game.getByText(/Los costes ya incluidos en el valor liquidativo/)).toBeVisible();
  await expect(game.getByRole('link', { name: 'Ficha de la fuente' })).toHaveAttribute('href', /^https:\/\//);
  const toggle = game.getByRole('button', { name: 'Ver tabla' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(game.getByRole('button', { name: 'Ocultar tabla' })).toHaveAttribute('aria-expanded', 'true');
  const table = game.getByRole('table');
  await expect(table.getByRole('columnheader')).toHaveText(['Mes', 'Fecha', 'Si mantengo', 'Si vendo', 'Aportado']);
  await expect(table.locator('tbody tr')).toHaveCount(4);
  await expect(table.locator('tbody tr').nth(3)).toContainText('1275,83');
  await expect(table.locator('tbody tr').nth(3)).toContainText('1254,63');
});

test('editing a field clears the previous result and reports validation inline', async ({ page }) => {
  const game = await openGame(page);
  await fillCase(game);
  await game.getByRole('button', { name: 'Comparar mantener y vender' }).click();
  await expect(game.locator('.hsg-card')).toHaveCount(2);
  await game.getByLabel('Importe inicial (€)').fill('900');
  await expect(game.locator('.hsg-card')).toHaveCount(0);
  await expect(game.getByRole('status').filter({ hasText: 'La comparación anterior se ha borrado' })).toHaveCount(1);
  await game.getByLabel('Mes de venta').fill('9');
  await game.getByRole('button', { name: 'Comparar mantener y vender' }).click();
  await expect(game.locator('.hsg-error')).toContainText('El mes de venta debe ser un número entero entre 0 y 3');
  await expect(game.getByLabel('Mes de venta')).toBeFocused();
  await expect(game.getByRole('alert')).toHaveCount(0);
  await game.getByLabel('Mes de venta').fill('3');
  await game.getByLabel('Importe inicial (€)').fill('0');
  await game.getByLabel('Aportación mensual (€)').fill('0');
  await game.getByRole('button', { name: 'Comparar mantener y vender' }).click();
  await expect(game.locator('.hsg-error')).toContainText('no pueden ser ambos 0');
});

test('local data mode shows a notice and never calls the game endpoint', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  const calls: string[] = [];
  page.on('request', req => { if (req.url().includes('/api/game/compare')) calls.push(req.url()); });
  const game = await openGame(page);
  await expect(game.getByText(/solo está disponible con el servidor de la demo/)).toBeVisible();
  await expect(game.getByRole('button', { name: 'Comparar mantener y vender' })).toHaveCount(0);
  await page.waitForTimeout(300);
  expect(calls).toEqual([]);
});

test('English labels and results', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('t2f-level', 'intermediate'));
  await page.goto('/');
  await page.getByRole('button', { name: 'English' }).click();
  await page.getByRole('button', { name: 'Simulator', exact: true }).click();
  await page.getByRole('tab', { name: 'What if I sell?' }).click();
  const game = page.locator('section.hsg');
  await expect(game.getByRole('heading', { name: 'What if I sell in month X?' })).toBeVisible();
  await game.getByLabel('Fund').selectOption(SANTANDER);
  await game.getByLabel('Initial amount (€)').fill('1000');
  await game.getByLabel('Monthly contribution (€)').fill('100');
  await game.getByLabel('Months', { exact: true }).fill('3');
  await game.getByLabel('Sale month').fill('2');
  await game.getByRole('button', { name: 'Compare holding and selling' }).click();
  await expect(game.locator('.hsg-card')).toHaveCount(2);
  await expect(game.locator('.hsg-card').nth(0)).toContainText('If I hold');
  await expect(game.locator('.hsg-card').nth(1)).toContainText('If I sell in month 2');
  await expect(game.getByText('Sale · month 2')).toBeVisible();
  await expect(game.getByRole('button', { name: 'View table' })).toBeVisible();
  await expect(game.getByText(/Observed CNMV net asset values are used/)).toBeVisible();
  await expect(game.getByText(/not a recommendation/)).toBeVisible();
});

test('375px viewport has no horizontal page overflow, with the table open', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const page = await context.newPage();
  const game = await openGame(page);
  await fillCase(game);
  await game.getByLabel('Meses', { exact: true }).fill('24');
  await game.getByLabel('Mes de venta').fill('12');
  await game.getByRole('button', { name: 'Comparar mantener y vender' }).click();
  await expect(game.locator('.hsg-card')).toHaveCount(2);
  await game.getByRole('button', { name: 'Ver tabla' }).click();
  await expect(game.getByRole('table')).toBeVisible();
  await expect(game.getByRole('img', { name: /Gráfico de dos líneas/ })).toBeVisible();
  const overflow = () => page.evaluate(() => Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, document.body.scrollWidth - window.innerWidth));
  await expect.poll(overflow, { timeout: 5000 }).toBeLessThanOrEqual(0);
  const box = await game.boundingBox();
  expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  await page.setViewportSize({ width: 320, height: 800 });
  await expect.poll(overflow, { timeout: 5000 }).toBeLessThanOrEqual(0);
  await context.close();
});

test('a CaixaBank-scoped app shows the no-funds message instead of the form', async ({ page }) => {
  const game = await openGame(page, 'http://127.0.0.1:5194/');
  await expect(game.getByText(/No hay fondos con histórico mensual verificado/)).toBeVisible();
  await expect(game.getByRole('button', { name: 'Comparar mantener y vender' })).toHaveCount(0);
});

const compareButton = (game: ReturnType<Page['locator']>) => game.getByRole('button', { name: /Comparar mantener y vender|Compare holding and selling/ });
async function quickCase(game: ReturnType<Page['locator']>) {
  await game.getByLabel('Fondo').selectOption(SANTANDER);
  await game.getByLabel('Importe inicial (€)').fill('1000');
  await game.getByLabel('Aportación mensual (€)').fill('100');
  await game.getByLabel('Meses', { exact: true }).fill('3');
  await game.getByLabel('Mes de venta').fill('2');
}

test('an HTTP 500 shows a generic alert and no results', async ({ page }) => {
  await page.route('**/api/game/compare', route => route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":{"code":"x","message":"boom"}}' }));
  const game = await openGame(page);
  await quickCase(game);
  await compareButton(game).click();
  await expect(game.getByRole('alert')).toContainText('No se ha podido completar la comparación');
  await expect(game.locator('.hsg-card')).toHaveCount(0);
});

test('a tampered response (wrong provenance hash) is rejected', async ({ page }) => {
  await page.route('**/api/game/compare', async route => {
    const response = await route.fetch();
    const body = await response.json();
    body.provenance.datasetSha256 = '0'.repeat(64);
    await route.fulfill({ response, json: body });
  });
  const game = await openGame(page);
  await quickCase(game);
  await compareButton(game).click();
  await expect(game.getByRole('alert')).toBeVisible();
  await expect(game.locator('.hsg-card')).toHaveCount(0);
});

test('a delayed response never renders after the user edits a field', async ({ page }) => {
  await page.route('**/api/game/compare', async route => { await new Promise(r => setTimeout(r, 1200)); await route.continue().catch(() => {}); });
  const game = await openGame(page);
  await quickCase(game);
  await compareButton(game).click();
  await expect(game.getByRole('button', { name: 'Calculando…' })).toBeVisible();
  await game.getByLabel('Importe inicial (€)').fill('900');
  await page.waitForTimeout(2200);
  await expect(game.locator('.hsg-card')).toHaveCount(0);
  await expect(game.getByRole('alert')).toHaveCount(0);
  await expect(game.getByRole('button', { name: 'Comparar mantener y vender' })).toBeEnabled();
});

test('a delayed response never renders after switching language', async ({ page }) => {
  await page.route('**/api/game/compare', async route => { await new Promise(r => setTimeout(r, 1200)); await route.continue().catch(() => {}); });
  const game = await openGame(page);
  await quickCase(game);
  await compareButton(game).click();
  await expect(game.getByRole('button', { name: 'Calculando…' })).toBeVisible();
  await page.getByRole('button', { name: 'English' }).click();
  await page.waitForTimeout(2200);
  await expect(game.locator('.hsg-card')).toHaveCount(0);
  await expect(game.getByRole('alert')).toHaveCount(0);
  await expect(game.getByRole('button', { name: 'Compare holding and selling' })).toBeEnabled();
});

test('changing the fund clamps months and sale month to its history', async ({ page }) => {
  await page.route('**/api/catalog', async route => {
    const response = await route.fetch();
    const body = await response.json();
    const series = body.navHistory.instruments.find((h: { isin: string }) => h.isin === 'ES0125269003');
    series.monthly = series.monthly.slice(0, 25);
    await route.fulfill({ response, json: body });
  });
  const game = await openGame(page);
  await game.getByLabel('Fondo').selectOption(SANTANDER);
  await game.getByLabel('Meses', { exact: true }).fill('60');
  await game.getByLabel('Mes de venta').fill('50');
  await game.getByLabel('Fondo').selectOption('bbva-mi-inversion-bolsa-acumulacion');
  await expect(game.getByLabel('Meses', { exact: true })).toHaveValue('24');
  await expect(game.getByLabel('Mes de venta')).toHaveValue('24');
  await expect(game.getByText(/Entre 1 y 24 meses/)).toBeVisible();
});

test('invalid amounts are announced through both fields and the CNMV reuse link is shown', async ({ page }) => {
  const game = await openGame(page);
  await game.getByLabel('Importe inicial (€)').fill('0');
  await game.getByLabel('Aportación mensual (€)').fill('0');
  await compareButton(game).click();
  await expect(game.getByLabel('Importe inicial (€)')).toHaveAttribute('aria-describedby', /hsg-form-error/);
  await expect(game.getByLabel('Aportación mensual (€)')).toHaveAttribute('aria-describedby', /hsg-form-error/);
  await expect(game.getByText(/empieza en el primer cierre observado/)).toBeVisible();
  await game.getByLabel('Aportación mensual (€)').fill('50');
  await compareButton(game).click();
  await expect(game.getByRole('link', { name: 'Condiciones de reutilización de la CNMV' })).toHaveAttribute('href', /^https:\/\//);
});

test('Básico shows the guided «¿Y si vendo?» without fees, months or contribution fields', async ({ page }) => {
  const game = await openGame(page, '/', 'beginner');
  await expect(game.getByLabel('Fondo')).toBeVisible();
  await expect(game.getByLabel('Importe inicial (€)')).toBeVisible();
  await expect(game.getByLabel('Mes de venta')).toBeVisible();
  await expect(game.getByLabel('Aportación mensual (€)')).toHaveCount(0);
  await expect(game.getByLabel('Meses', { exact: true })).toHaveCount(0);
  await expect(game.getByText('Comisiones (opcional)')).toHaveCount(0);
});
