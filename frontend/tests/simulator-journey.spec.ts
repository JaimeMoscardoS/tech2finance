import { test, expect, type Page } from '@playwright/test';
import { BBVA, CAIXA, SANTANDER, finishReplay, pickFund, reveal, startAndFinish, startJourney } from './journey';

const openSimulator = async (page: Page, url = '/') => {
  await page.goto(url);
  const menu = page.getByRole('button', { name: /^(Abrir menú|Open menu)$/ });
  const nav = page.getByRole('button', { name: /^(Simulador|Simulator)$/ });
  // Espera a que la cabecera esté lista: en móvil la navegación está en el menú plegado.
  await expect(menu.or(nav.first())).toBeVisible();
  if (await menu.isVisible()) await menu.click();
  await nav.first().click();
};
const overflow = (page: Page) => page.evaluate(() => Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, document.body.scrollWidth - window.innerWidth));
const local = (page: Page) => page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));

test('stepper, guide and locked steps at entry', async ({ page }) => {
  await openSimulator(page);
  const stepper = page.getByRole('navigation', { name: 'Tu recorrido' });
  await expect(stepper.getByText('Paso 1 de 3')).toBeVisible();
  const steps = stepper.getByRole('button');
  await expect(steps).toHaveCount(3);
  await expect(steps.nth(0)).toHaveAttribute('aria-current', 'step');
  await expect(steps.nth(1)).toHaveAttribute('aria-disabled', 'true');
  await expect(steps.nth(2)).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('.jr-guide [aria-live="polite"]')).toContainText('Elige un fondo para empezar');
  await expect(page.getByRole('radiogroup', { name: 'Instrumento' })).toBeVisible();
  await expect(page.locator('input[name="jr-fund"]:checked')).toHaveCount(0);
  await expect(page.locator('#jr-step-2')).toHaveCount(0);
  await expect(page.locator('#jr-step-3')).toHaveCount(0);
  // Each card shows the real class label, a decorative sparkline and a measure computed from the NAV series.
  const card = page.locator('.jr-fund', { has: page.locator(`input[value="${SANTANDER}"]`) });
  await expect(card.locator('svg.jr-spark')).toHaveAttribute('aria-hidden', 'true');
  // The catalogue has no asset class for any fund, so no class badge is invented.
  await expect(card).not.toContainText('Sin clasificar');
  await expect(page.locator('.jr-chip')).toHaveCount(0);
  await expect(card).toContainText(/Mayor caída en el periodo\s*(−|0)/);
  // Choosing unlocks step 2 and moves the progress on; step 3 stays locked until the result is revealed.
  await pickFund(page);
  await expect(stepper.getByText('Paso 2 de 3')).toBeVisible();
  await expect(steps.nth(1)).toHaveAttribute('aria-current', 'step');
  await expect(steps.nth(1)).not.toHaveAttribute('aria-disabled', 'true');
  await expect(steps.nth(2)).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('#jr-step-3')).toHaveCount(0);
  await reveal(page);
  await expect(steps.nth(2)).not.toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('#jr-step-3')).toBeVisible();
  // Earlier steps stay reachable.
  await steps.nth(0).click();
  await expect(steps.nth(0)).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('.jr-guide [aria-live="polite"]')).toContainText('Puedes cambiar de fondo');
});

test('fund cards work from the keyboard as a radio group', async ({ page }) => {
  await openSimulator(page);
  const radios = page.getByRole('radiogroup', { name: 'Instrumento' }).getByRole('radio');
  const enabled = page.locator('input[name="jr-fund"]:not(:disabled)');
  expect(await enabled.count()).toBeGreaterThan(2);
  await enabled.first().focus();
  await page.keyboard.press('ArrowDown');
  const first = await enabled.nth(1).getAttribute('value');
  await expect(page.locator('input[name="jr-fund"]:checked')).toHaveValue(first!);
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('input[name="jr-fund"]:checked')).toHaveValue((await enabled.nth(2).getAttribute('value'))!);
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('input[name="jr-fund"]:checked')).toHaveValue(first!);
  await expect(page.locator('#jr-step-2')).toBeVisible();
  expect(await radios.count()).toBeGreaterThan(0);
});

test('a fund without history is disabled with the existing explanation', async ({ page }) => {
  await openSimulator(page, 'http://127.0.0.1:5196/');
  const bad = page.locator('input[name="jr-fund"][value="bbva-mi-inversion-bolsa"]');
  await expect(bad).toBeDisabled();
  await expect(page.locator('.jr-fund', { has: bad })).toContainText('No hay histórico verificado disponible para este fondo');
});

test('prediction reveals the backend result and states whether the guess matched', async ({ page }) => {
  await openSimulator(page);
  await pickFund(page);
  await page.getByLabel('Aportación mensual').fill('100');
  await page.getByLabel('Tiempo de práctica').fill('12');
  await expect(page.locator('.sim-result')).toHaveCount(0);
  await expect(page.getByText('¿Crees que acabarás con más o con menos dinero del que has puesto?')).toBeVisible();
  const requests: unknown[] = [];
  page.on('request', r => { if (r.url().endsWith('/api/simulations')) requests.push(r.postDataJSON()); });
  await reveal(page, 'Más');
  // Step 2 only acknowledges the answer: no final value, contributed amount, profit or match/miss before the replay.
  const ack = page.locator('.jr-ack');
  await expect(ack).toContainText('Tu respuesta: Más.');
  await expect(ack).toContainText('lo comprobarás al final del recorrido');
  await expect(page.locator('.sim-result')).toHaveCount(0);
  const step2 = (await page.locator('#jr-step-2').evaluate(el => el.textContent ?? ''));
  for (const hidden of ['1700,75', '1700,00', '0,75 €', 'coincide', 'Has descubierto']) expect(step2).not.toContain(hidden);
  await expect(page.locator('#jr-step-2 [role="status"]').first()).not.toContainText(/\d+,\d\d €/);
  await expect(page.locator('#jr-step-3 .tm-plot')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Explícame este resultado' })).toHaveCount(0);
  await finishReplay(page);
  // The reveal lives in the replay summary.
  const values = page.locator('.tm-summary .sim-values');
  await expect(values.locator('dt')).toHaveText(['VALOR FINAL ILUSTRATIVO', 'TOTAL APORTADO', 'GANANCIA / PÉRDIDA']);
  await expect(values.locator('dd strong').nth(0)).toHaveText('1700,75 €');
  await expect(values.locator('dd strong').nth(1)).toHaveText('1700,00 €');
  await expect(values.locator('dd strong').nth(2)).toHaveText('0,75 €');
  const feedback = page.locator('.tm-summary .jr-feedback');
  await expect(page.locator('.tm-summary')).toContainText('Terminas el recorrido con 1700,75 €, habiendo puesto 1700,00 €');
  // 0,75 EUR is within 1 % of the contributed amount: "about the same", so "More" does not match.
  await expect(feedback).toContainText('Tu respuesta: Más.');
  await expect(feedback).toContainText('Tu respuesta no coincide con lo que ocurrió.');
  await expect(page.locator('.jr-achievement')).toHaveText('Has descubierto: no todo el dinero final es ganancia');
  await expect(page.locator('.jr-split')).toHaveAttribute('role', 'img');
  await expect(page.getByRole('button', { name: 'Explícame este resultado' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entender las caídas' })).toBeVisible();
  expect(requests).toEqual([{ instrumentId: CAIXA, initial: 500, recurringContribution: 100, periods: 12, contributionFrequency: 'monthly' }]);
});

test('a correct guess is reported as matching, with a loss shown as such', async ({ page }) => {
  await openSimulator(page);
  await pickFund(page, BBVA);
  await page.getByLabel('Aportación mensual').fill('0');
  await page.getByLabel('Importe inicial').fill('1000');
  await page.getByLabel('Tiempo de práctica').fill('3');
  await reveal(page, 'Menos');
  await finishReplay(page);
  await expect(page.locator('.tm-summary')).toContainText('Terminas el recorrido con 744,62 €, habiendo puesto 1000,00 €');
  await expect(page.locator('.tm-summary .jr-feedback')).toContainText('Tu respuesta coincide con lo que ocurrió.');
  await expect(page.locator('.jr-split')).toHaveAttribute('aria-label', /Pérdida/);
});

test('after the first reveal changes recalculate on their own, once, and never while invalid', async ({ page }) => {
  await openSimulator(page);
  await startAndFinish(page);
  const first = page.locator('.tm-summary .sim-values dd strong').first();
  await expect(first).toHaveText('1100,30 €');
  const bodies: { initial: number; recurringContribution: number }[] = [];
  page.on('request', r => { if (r.url().endsWith('/api/simulations')) bodies.push(r.postDataJSON()); });
  const monthly = page.getByLabel('Aportación mensual');
  // Rapid edits collapse into one request after the pause; the replay restarts and the old final values disappear.
  await monthly.fill('60'); await monthly.fill('70'); await monthly.fill('100');
  await expect(page.locator('.jr-ack').getByText(/Has cambiado los datos/)).toBeVisible();
  await expect(page.locator('.tm-summary')).toHaveCount(0);
  await expect(page.locator('#jr-step-3 .tm')).toContainText('Mes 0 de 12');
  await finishReplay(page);
  await expect(first).toHaveText('1700,75 €');
  expect(bodies).toHaveLength(1);
  expect(bodies[0].recurringContribution).toBe(100);
  // Invalid values show an inline error and send nothing.
  await monthly.fill('-5');
  await expect(page.getByRole('alert')).toContainText('Aportación mensual');
  await expect(monthly).toHaveAttribute('aria-invalid', 'true');
  await page.waitForTimeout(700);
  expect(bodies).toHaveLength(1);
  // Fixing it recovers; the explicit button also works and is optional.
  await monthly.fill('50');
  await expect(page.locator('#jr-step-3 .tm')).toContainText('Mes 0 de 12');
  await finishReplay(page);
  await expect(first).toHaveText('1100,30 €');
  await page.getByRole('button', { name: 'Actualizar resultado' }).click();
  await finishReplay(page);
  await expect(first).toHaveText('1100,30 €');
  // Presets and the slider update the same way; the slider offers an accessible text value.
  await page.getByRole('button', { name: /Todo de golpe: 1000/ }).click();
  await expect(page.getByLabel('Importe inicial')).toHaveValue('1000');
  await finishReplay(page);
  await expect(first).toHaveText('999,70 €');
  const slider = page.getByLabel('Tiempo de práctica');
  await slider.fill('6');
  await expect(slider).toHaveAttribute('aria-valuetext', /6 meses, hasta jun 2020/);
  await expect(page.locator('.jr-slider output')).toContainText('hasta jun 2020');
});

test('a late response for older inputs never replaces the newer result', async ({ page }) => {
  let release: (() => void) | undefined;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/simulations', async route => { if (route.request().postDataJSON().initial === 123) await gate; try { await route.continue(); } catch {} });
  await openSimulator(page);
  await startJourney(page);
  const held = page.waitForRequest(r => r.url().endsWith('/api/simulations') && r.postDataJSON().initial === 123);
  await page.getByLabel('Importe inicial').fill('123');
  await held;
  await page.getByLabel('Importe inicial').fill('500');
  await finishReplay(page);
  await expect(page.locator('.tm-summary .sim-values')).toContainText('1100,30');
  release?.();
  await page.waitForTimeout(300);
  await expect(page.locator('.tm-summary .sim-values')).toContainText('1100,30');
});

test('step 3 follows steps 1 and 2 live and has no duplicate form', async ({ page }) => {
  const bodies: unknown[] = [];
  page.on('request', r => { if (r.url().endsWith('/api/game/compare')) bodies.push(r.postDataJSON()); });
  await openSimulator(page);
  await pickFund(page, SANTANDER);
  await page.getByLabel('Importe inicial').fill('1000');
  await page.getByLabel('Aportación mensual').fill('100');
  await page.getByLabel('Tiempo de práctica').fill('3');
  await reveal(page);
  const tm = page.locator('#jr-step-3 .tm');
  await expect(tm).toBeVisible();
  await expect(tm.getByRole('heading', { name: 'Vive el recorrido' })).toBeVisible();
  await expect(tm.getByLabel('Importe inicial')).toHaveCount(0);
  await expect(tm.locator('select, input[type="range"], input[type="number"]')).toHaveCount(0);
  await expect(tm).toContainText('Mes 0 de 3');
  // Nothing is requested until the user decides to sell.
  expect(bodies).toEqual([]);
  // Changing a step 2 value starts a fresh replay that follows the new months.
  await page.getByLabel('Tiempo de práctica').fill('6');
  await expect(page.locator('#jr-step-3 .tm')).toContainText('Mes 0 de 6');
  await page.getByLabel('Aportación mensual').fill('50');
  await expect(page.locator('#jr-step-3 .tm')).toContainText('Mes 0 de 6');
  await expect(page.locator('#jr-step-3 .tm .tm-big').nth(1)).toContainText('1000,00 €');
});

test('CaixaBank works in steps 1 and 2 and the replay, and is only excluded from the sale decision', async ({ page }) => {
  await openSimulator(page);
  await startJourney(page, CAIXA);
  const tm = page.locator('#jr-step-3 .tm');
  await expect(tm).toBeVisible();
  for (let i = 0; i < 3; i++) await tm.getByRole('button', { name: 'Siguiente mes' }).click();
  await tm.locator('.tm-option').first().click();
  await expect(tm.locator('.tm-note[data-block="bank"]')).toContainText('no participa en la comparación de venta');
  await expect(tm.getByRole('button', { name: 'Vender ahora' })).toHaveCount(0);
});

test('annual contribution gets a clear note instead of the sale decision', async ({ page }) => {
  await openSimulator(page);
  await startJourney(page, SANTANDER);
  await page.getByText('Más opciones').click();
  await page.getByLabel('Frecuencia de aportación').selectOption('annual');
  await page.getByLabel('Tiempo de práctica').fill('13');
  const tm = page.locator('#jr-step-3 .tm');
  await expect(tm).toContainText('Mes 0 de 13');
  for (let i = 0; i < 3; i++) await tm.getByRole('button', { name: 'Siguiente mes' }).click();
  await tm.locator('.tm-option').first().click();
  await expect(tm.locator('.tm-note[data-block="annual"]')).toContainText('aportación mensual');
  await expect(tm.getByRole('button', { name: 'Vender ahora' })).toHaveCount(0);
});

test('local mode keeps steps 1 to 3, shows the server-only notice at the sale decision and never calls the game endpoint', async ({ page }) => {
  await local(page);
  const calls: string[] = [];
  page.on('request', r => { if (r.url().includes('/api/game/compare')) calls.push(r.url()); });
  await openSimulator(page);
  await startJourney(page, SANTANDER);
  const tm = page.locator('#jr-step-3 .tm');
  for (let i = 0; i < 3; i++) await tm.getByRole('button', { name: 'Siguiente mes' }).click();
  await tm.locator('.tm-option').first().click();
  await expect(tm.locator('.tm-note[data-block="local"]')).toContainText(/solo está disponible con el servidor de la demo/);
  await expect(tm.getByRole('button', { name: 'Vender ahora' })).toHaveCount(0);
  await page.waitForTimeout(300);
  expect(calls).toEqual([]);
});

test('English labels across the journey', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'English' }).click();
  await page.getByRole('button', { name: 'Simulator', exact: true }).click();
  const stepper = page.getByRole('navigation', { name: 'Your journey' });
  await expect(stepper.getByText('Step 1 of 3')).toBeVisible();
  await expect(stepper.getByRole('button').nth(0)).toContainText('Pick your fund');
  await expect(page.getByRole('radiogroup', { name: 'Instrument' })).toBeVisible();
  await expect(page.locator('.jr-guide [aria-live="polite"]')).toContainText('Pick a fund to start');
  await pickFund(page, SANTANDER);
  await expect(page.getByText('Do you think you will end up with more or less money than you put in?')).toBeVisible();
  await expect(page.getByRole('button', { name: 'About the same' })).toBeVisible();
  await expect(page.getByLabel('Practice period')).toBeVisible();
  await reveal(page);
  await expect(page.locator('.jr-ack')).toContainText('Your answer: About the same.');
  await finishReplay(page);
  await expect(page.locator('.tm-summary')).toContainText(/You finish the journey with .* having put in/);
  await expect(page.locator('.jr-achievement')).toHaveText('You discovered: not all the final money is gain');
  await expect(page.locator('#jr-step-3 h2')).toHaveText('Live the journey');
  await expect(page.getByText('Step 3 of 3').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next month' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
});

test('guide adapts to the level: advanced collapses it behind a toggle', async ({ page }) => {
  await openSimulator(page);
  const guide = page.locator('.jr-guide');
  await expect(guide).toContainText('Cada tarjeta muestra cómo cambió su valor mes a mes');
  await page.getByRole('button', { name: /Nivel: Básico/ }).click();
  await page.getByRole('button', { name: 'Intermedio', exact: true }).click();
  await expect(guide).toContainText('Elige un fondo para empezar.');
  await expect(guide).not.toContainText('Cada tarjeta muestra');
  await page.getByRole('button', { name: /Nivel: Intermedio/ }).click();
  await page.getByRole('button', { name: 'Avanzado', exact: true }).click();
  const toggle = guide.getByRole('button', { name: 'Mostrar guía' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(guide.locator('p')).toHaveCount(0);
  await toggle.click();
  await expect(guide.getByRole('button', { name: 'Ocultar guía' })).toHaveAttribute('aria-expanded', 'true');
  await expect(guide).toContainText('Elige un fondo para empezar.');
});

/** WCAG contrast of a text colour on its effective background. */
const contrast = (page: Page, selector: string, backgroundSelector = selector) => page.evaluate(({ selector, backgroundSelector }) => {
  const parse = (c: string) => { const m = c.match(/[\d.]+/g)!.map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 }; };
  const lum = ({ r, g, b }: { r: number; g: number; b: number }) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const solidBackground = (el: Element | null): { r: number; g: number; b: number } => { for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c.a > 0.99) return c; } return parse(getComputedStyle(document.body).backgroundColor); };
  const fg = parse(getComputedStyle(document.querySelector(selector)!).color);
  const bg = solidBackground(document.querySelector(backgroundSelector));
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}, { selector, backgroundSelector });

for (const theme of ['light', 'dark'] as const) {
  test(`step colours keep text contrast of at least 4.5:1 in ${theme} theme`, async ({ page }) => {
    await page.addInitScript(theme => localStorage.setItem('t2f-theme', theme), theme);
    await openSimulator(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await startJourney(page, SANTANDER);
    await expect(page.locator('#jr-step-3 .tm')).toBeVisible();
    // Step 1 is folded once the replay starts, so its fund cards are measured first.
    for (const selector of ['.jr-fund-name', '.jr-fund-facts dd', '.jr-fund-facts dt']) {
      expect(await contrast(page, selector), `${selector} in ${theme}`).toBeGreaterThanOrEqual(4.5);
    }
    // Open a pause (month 3 is the largest drop of this fund) so the question card is measured too.
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Siguiente mes' }).click();
    await expect(page.locator('.tm-card')).toBeVisible();
    const checks: [string, string?][] = [
      ['.jr-step-btn[aria-current="step"]'], ['.jr-step-btn:not([aria-current])'], ['.jr-guide-body p'], ['.jr-guide-body strong'],
      ['#jr-step-1 .jr-step-label'], ['#jr-step-2 .jr-step-label'], ['#jr-step-3 .jr-step-label'],
      ['.jr-preset'], ['.jr-feedback p'], ['#jr-step-1 .jr-collapsed p'],
      ['.tm-btn.tm-primary'], ['.tm-btn:not(.tm-primary)'], ['.tm-big dt'], ['.tm-big dd'], ['.tm-gl dd'], ['.tm-month'],
      ['.tm-card h3'], ['.tm-badge'], ['.tm-option'], ['.tm-skip', '.tm-card'], ['#jr-step-2 .button.dark'],
    ];
    for (const [selector, bg] of checks) {
      const ratio = await contrast(page, selector, bg);
      expect(ratio, `${selector} in ${theme}`).toBeGreaterThanOrEqual(4.5);
    }
  });
}

for (const width of [375, 320]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`all three steps fit ${width}px in ${theme} theme without horizontal overflow`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 800 } });
      const page = await context.newPage();
      await page.addInitScript(theme => localStorage.setItem('t2f-theme', theme), theme);
      await openSimulator(page);
      expect(await overflow(page)).toBeLessThanOrEqual(0);
      await startJourney(page, SANTANDER);
      await page.getByLabel('Tiempo de práctica').fill('24');
      await expect(page.locator('.jr-ack')).toBeVisible();
      const tm = page.locator('#jr-step-3 .tm');
      await expect(tm).toContainText('Mes 0 de 24');
      for (let i = 0; i < 3; i++) await tm.getByRole('button', { name: 'Siguiente mes' }).click();
      await expect(tm.locator('.tm-card')).toBeVisible();
      await tm.locator('.tm-option').first().click();
      await expect(tm.getByRole('button', { name: 'Vender ahora' })).toBeVisible();
      await tm.getByRole('button', { name: 'Vender ahora' }).click();
      await expect(tm.locator('.tm-card')).toHaveCount(0);
      await tm.getByText('Ver tabla de los meses visibles').click();
      await expect(tm.getByRole('table')).toBeVisible();
      await expect.poll(() => overflow(page), { timeout: 5000 }).toBeLessThanOrEqual(0);
      const box = await page.locator('.journey').boundingBox();
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      await context.close();
    });
  }
}

test('reduced motion removes transitions on the journey controls', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await openSimulator(page);
  const duration = await page.locator('.jr-step-btn').first().evaluate(el => getComputedStyle(el).transitionDuration);
  expect(duration === '0s' || duration === '0s, 0s').toBeTruthy();
  await context.close();
});

test('clicking the already-active preset after the reveal keeps the result', async ({ page }) => {
  await openSimulator(page);
  await startJourney(page);
  const preset = page.getByRole('button', { name: /Todo de golpe: 1000/ });
  await preset.click();
  await finishReplay(page);
  await expect(page.locator('.tm-summary .sim-values dd strong').first()).toHaveText('999,70 €');
  await expect(preset).toHaveAttribute('aria-pressed', 'true');
  await preset.click();
  await page.waitForTimeout(700);
  // The same inputs keep the result and the replay.
  await expect(page.locator('.tm-summary .sim-values dd strong').first()).toHaveText('999,70 €');
  await expect(page.locator('#jr-step-3 .tm-plot')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Explícame este resultado' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Seguir con el paso 3/ })).toBeVisible();
});

test('switching language while a recalculation is in flight still ends with the new result', async ({ page }) => {
  let held = 0;
  let release: (() => void) | undefined;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/simulations', async route => {
    if (route.request().postDataJSON().recurringContribution === 75 && held++ === 0) await gate;
    try { await route.continue(); } catch {}
  });
  await openSimulator(page);
  await startJourney(page);
  const request = page.waitForRequest(r => r.url().endsWith('/api/simulations') && r.postDataJSON().recurringContribution === 75);
  await page.getByLabel('Aportación mensual').fill('75');
  await request;
  await page.getByRole('button', { name: 'English' }).click();
  release?.();
  await expect(page.locator('#jr-step-3 .tm')).toContainText('Month 0 of 12');
  await finishReplay(page);
  await expect(page.locator('.tm-summary .sim-values dd strong').first()).toHaveText('€1,400.52');
});

test('focus moves to the result heading after answering and to the replay heading when jumping to step 3', async ({ page }) => {
  await openSimulator(page);
  await pickFund(page, SANTANDER);
  await reveal(page);
  await expect(page.locator('#jr-result-title')).toBeFocused();
  await expect(page.locator('#jr-step-3')).toBeVisible();
  await page.getByRole('button', { name: /Seguir con el paso 3/ }).click();
  await expect(page.locator('#tm-title')).toBeFocused();
  await expect(page.getByRole('navigation', { name: 'Tu recorrido' }).getByText('Paso 3 de 3')).toBeVisible();
  await page.getByRole('navigation', { name: 'Tu recorrido' }).getByRole('button').nth(1).click();
  await expect(page.locator('#jr-h-2')).toBeFocused();
  await page.getByRole('navigation', { name: 'Tu recorrido' }).getByRole('button').nth(2).click();
  await expect(page.locator('#tm-title')).toBeFocused();
});

test('the stepper follows where the user is working, and the verdict is in the status region', async ({ page }) => {
  await openSimulator(page);
  await startJourney(page, SANTANDER);
  const stepper = page.getByRole('navigation', { name: 'Tu recorrido' });
  // Keyboard focus is tracked on focus; pointer focus is tracked by the click that follows (see Simulator.trackFocus).
  await page.keyboard.press('Shift');
  await page.locator('#tm-next').focus();
  await expect(stepper.getByText('Paso 3 de 3')).toBeVisible();
  await page.keyboard.press('Shift');
  await page.getByLabel('Importe inicial').focus();
  await expect(stepper.getByText('Paso 2 de 3')).toBeVisible();
  await page.locator('#jr-h-1').click();
  await expect(stepper.getByText('Paso 1 de 3')).toBeVisible();
  await finishReplay(page);
  await expect(page.locator('.sim-result [role="status"][aria-atomic="true"]')).toContainText(/Tu respuesta: Más o menos lo mismo\./);
});

test('the source note is generic before a fund is chosen', async ({ page }) => {
  await openSimulator(page);
  await expect(page.locator('.jr-source-note')).toContainText('Cierres mensuales históricos de la CNMV');
});

test('both amounts at zero are flagged in step 2 and nothing is requested', async ({ page }) => {
  await openSimulator(page);
  await startJourney(page);
  const bodies: unknown[] = [];
  page.on('request', r => { if (r.url().endsWith('/api/simulations')) bodies.push(r.postDataJSON()); });
  await page.getByLabel('Importe inicial').fill('0');
  await page.getByLabel('Aportación mensual').fill('0');
  await expect(page.getByRole('alert')).toContainText('no pueden ser ambos 0');
  await expect(page.getByLabel('Importe inicial')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Aportación mensual')).toHaveAttribute('aria-invalid', 'true');
  await page.waitForTimeout(700);
  expect(bodies).toEqual([]);
});

test('the tutor never receives a result the user has not revealed or that is being recalculated', async ({ page }) => {
  let release: (() => void) | undefined;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/simulations', async route => { if (route.request().postDataJSON().recurringContribution === 75) await gate; try { await route.continue(); } catch {} });
  const contexts: { simulation?: unknown; instrumentId?: string }[] = [];
  page.on('request', r => { if (r.url().endsWith('/api/tutor') && r.method() === 'POST') contexts.push(r.postDataJSON().context); });
  await openSimulator(page);
  await pickFund(page);
  // Result exists but the question is unanswered: the tutor gets the fund, not the result.
  await page.getByRole('button', { name: 'Abrir asistente' }).click();
  await page.locator('#chat-input').fill('¿Cuál es el resultado?');
  await page.getByRole('button', { name: 'Enviar pregunta' }).click();
  await expect.poll(() => contexts.length).toBe(1);
  expect(contexts[0].instrumentId).toBe(CAIXA);
  expect(contexts[0].simulation).toBeUndefined();
  await page.getByRole('dialog', { name: 'Tu asistente' }).getByRole('button', { name: 'Cerrar asistente' }).click();
  await reveal(page);
  await expect(page.locator('.jr-ack')).toBeVisible();
  // Answered but the replay is not finished: the tutor still does not get the result.
  await page.getByRole('button', { name: 'Abrir asistente' }).click();
  await page.locator('#chat-input').fill('¿Y el resultado?');
  await page.getByRole('button', { name: 'Enviar pregunta' }).click();
  await expect.poll(() => contexts.length).toBe(2);
  expect(contexts[1].simulation).toBeUndefined();
  await page.getByRole('dialog', { name: 'Tu asistente' }).getByRole('button', { name: 'Cerrar asistente' }).click();
  await finishReplay(page);
  await expect(page.locator('.tm-summary .sim-values')).toBeVisible();
  // While the new request is held, the old result is not exposed either.
  const held = page.waitForRequest(r => r.url().endsWith('/api/simulations') && r.postDataJSON().recurringContribution === 75);
  await page.getByLabel('Aportación mensual').fill('75');
  await held;
  await page.getByRole('button', { name: 'Abrir asistente' }).click();
  await page.locator('#chat-input').fill('¿Y ahora?');
  await page.getByRole('button', { name: 'Enviar pregunta' }).click();
  await expect.poll(() => contexts.length).toBe(3);
  expect(contexts[2].simulation).toBeUndefined();
  release?.();
});

test('Explorer does not offer practice for a fund without monthly NAV history', async ({ page }) => {
  await page.route('**/api/catalog', async route => {
    const response = await route.fetch();
    const catalog = await response.json();
    for (const item of catalog.instruments) if (item.instrumentId === CAIXA) item.dataStatus = 'annual_history';
    await route.fulfill({ response, json: catalog });
  });
  await page.goto('http://127.0.0.1:5194/');
  await page.getByRole('button', { name: 'Explorar', exact: true }).click();
  const practise = page.getByRole('button', { name: 'Practicar con este fondo' });
  await expect(practise).toBeDisabled();
  await expect(page.getByText(/solo hay rentabilidades anuales publicadas/)).toBeVisible();
  await practise.click({ force: true });
  await expect(page.getByRole('navigation', { name: 'Tu recorrido' })).toHaveCount(0);
  await expect(page.locator('input[name="jr-fund"]')).toHaveCount(0);
});

for (const theme of ['light', 'dark'] as const) {
  test(`control boundaries keep at least 3:1 against their surface in ${theme} theme`, async ({ page }) => {
    await page.addInitScript(theme => localStorage.setItem('t2f-theme', theme), theme);
    await openSimulator(page);
    await startJourney(page, SANTANDER);
    await expect(page.locator('#jr-step-3 .tm')).toBeVisible();
    const ratios = await page.evaluate(() => {
      const parse = (c: string) => { const m = c.match(/[\d.]+/g)!.map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 }; };
      const lum = ({ r, g, b }: { r: number; g: number; b: number }) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const solid = (el: Element | null) => { for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c.a > 0.99) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
      return ['.jr-fund:not(.is-checked) .jr-fund-card', '.jr-field', '.jr-more', '.tm-btn:not(.tm-primary)', '.tm-big:nth-child(2)', '.tm-plot'].map(selector => {
        const el = document.querySelector(selector)!;
        const border = parse(getComputedStyle(el).borderTopColor);
        const [a, b] = [lum(border), lum(solid(el.parentElement))].sort((x, y) => y - x);
        return [selector, (a + 0.05) / (b + 0.05)] as const;
      });
    });
    for (const [selector, ratio] of ratios) expect(ratio, `${selector} in ${theme}`).toBeGreaterThanOrEqual(3);
  });
}
