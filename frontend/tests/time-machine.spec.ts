import { test, expect, type Locator, type Page } from '@playwright/test';
import { CAIXA, SANTANDER, finishReplay, startJourney } from './journey';

// Step 3 «Vive el recorrido»: month-by-month replay of the real NAV-based simulation of step 2.
// Expected numbers are fetched from the backend Playwright starts (port 8111), never typed by hand.
const BACKEND = 'http://127.0.0.1:8111';
const CASE = { initial: 500, monthly: 50, months: 12 }; // journey defaults
// Real pauses of SANTANDER (500 + 50/month, 12 months): drop in Mar 2020, back to within 1 % of contributed in month 6, new high in month 11, end.
const PAUSES = [3, 6, 11, 12];
const EVIDENCE = process.env.T2F_EVIDENCE ? '../docs/planning/evidence/simulador-maquina-tiempo' : null;

const eur = (n: number | string, locale = 'es-ES') => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(Number(n));
const overflow = (page: Page) => page.evaluate(() => Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, document.body.scrollWidth - window.innerWidth));

async function openSimulator(page: Page, url = '/') {
  await page.goto(url);
  const menu = page.getByRole('button', { name: /^(Abrir menú|Open menu)$/ });
  // Wait for the app to render before deciding whether the mobile menu has to be opened (avoids a race under load).
  await expect(menu.or(page.getByRole('button', { name: /^(Simulador|Simulator)$/ }).first())).toBeVisible();
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('button', { name: /^(Simulador|Simulator)$/ }).first().click();
}
async function start(page: Page, id = SANTANDER, url = '/') {
  await openSimulator(page, url);
  await startJourney(page, id);
  const tm = page.locator('#jr-step-3 .tm');
  await expect(tm).toContainText(`Mes 0 de ${CASE.months}`);
  return tm;
}
async function simulation(page: Page, id = SANTANDER) {
  const response = await page.request.post(`${BACKEND}/api/simulations`, { data: { instrumentId: id, initial: CASE.initial, recurringContribution: CASE.monthly, periods: CASE.months, contributionFrequency: 'monthly' } });
  return (await response.json()).timeline as { value: number; contributed: number; profit: number; date: string }[];
}
async function compare(page: Page, sellMonth: number, id = SANTANDER) {
  const response = await page.request.post(`${BACKEND}/api/game/compare`, { data: { instrumentId: id, ...CASE, sellMonth, buyFeeRate: 0, sellFeeRate: 0 } });
  const body = await response.json();
  return { hold: body.hold.timeline.map((p: { total: string }) => Number(p.total)) as number[], sell: body.sell.timeline.map((p: { total: string }) => Number(p.total)) as number[] };
}
const next = (tm: Locator, times = 1) => (async () => { for (let i = 0; i < times; i++) await tm.getByRole('button', { name: 'Siguiente mes' }).click(); })();
/** Steps to the given month, answering the first option and continuing at every pause on the way. */
async function stepTo(tm: Locator, target: number, answerFirst = true) {
  const current = Number((await tm.locator('.tm-month span').first().innerText()).match(/Mes (\d+)/)![1]);
  for (let m = current + 1; m <= target; m++) {
    await tm.getByRole('button', { name: 'Siguiente mes' }).click();
    if (m !== target && await tm.locator('.tm-card').count()) {
      if (answerFirst) await tm.locator('.tm-option').first().click();
      await closeCard(tm);
    }
  }
}
async function closeCard(tm: Locator) {
  const card = tm.locator('.tm-card');
  if (await card.getByRole('button', { name: 'Continuar' }).count()) await card.getByRole('button', { name: 'Continuar' }).click();
  else if (await card.getByRole('button', { name: 'Mantener' }).count()) await card.getByRole('button', { name: 'Mantener' }).click();
  else await card.getByRole('button', { name: 'Seguir sin responder' }).click();
  await expect(card).toHaveCount(0);
}
const shot = async (page: Page, name: string) => { if (EVIDENCE) await page.screenshot({ path: `${EVIDENCE}/${name}.png`, fullPage: true }); };

test('play, pause and step move one visible month at a time', async ({ page }) => {
  const tm = await start(page);
  const line = await simulation(page);
  const playing = tm.getByRole('button', { name: 'Reproducir' });
  await expect(playing).toBeVisible();
  await expect(tm.getByRole('button', { name: 'Siguiente mes' })).toBeVisible();
  // Nothing moves by itself.
  await page.waitForTimeout(1300);
  await expect(tm).toContainText('Mes 0 de 12');
  await next(tm);
  await expect(tm).toContainText('Mes 1 de 12');
  await expect(tm.locator('.tm-big').first()).toContainText(eur(line[1].value));
  await expect(tm.locator('.tm-big').nth(1)).toContainText(eur(line[1].contributed));
  // Autoplay at 2×, then pause.
  await tm.getByRole('button', { name: '2×' }).click();
  await expect(tm.getByRole('button', { name: '2×' })).toHaveAttribute('aria-pressed', 'true');
  await playing.click();
  await expect(tm.getByRole('button', { name: 'Pausa' })).toBeVisible();
  await expect(tm).toContainText('Mes 2 de 12', { timeout: 3000 });
  await tm.getByRole('button', { name: 'Pausa' }).click();
  await expect(tm.getByRole('button', { name: 'Reproducir' })).toBeVisible();
  const frozen = await tm.locator('.tm-month span').first().innerText();
  await page.waitForTimeout(1300);
  expect(await tm.locator('.tm-month span').first().innerText()).toBe(frozen);
});

test('months after the visible one never reach the DOM, the chart label or the table', async ({ page }) => {
  const tm = await start(page);
  const line = await simulation(page);
  for (let m = 0; m <= 2; m++) {
    if (m > 0) await next(tm);
    await expect(tm).toContainText(`Mes ${m} de 12`);
    // The whole page content (steps 1 and 2 included), not only the replay, must not know the later months.
    const text = (await page.locator('main.main').evaluate(el => el.textContent ?? '')) + (await tm.locator('.tm-plot').getAttribute('aria-label'));
    for (let future = m + 1; future < line.length; future++) {
      expect(text, `value of month ${future} visible at month ${m}`).not.toContain(eur(line[future].value));
      expect(text, `contributed of month ${future} visible at month ${m}`).not.toContain(eur(line[future].contributed));
    }
    expect(text).toContain(eur(line[m].value));
    await expect(tm.locator('.tm-table-wrap tbody tr')).toHaveCount(m + 1);
    await expect(tm.locator('.tm-plot [tabindex]:not([tabindex="-1"])')).toHaveCount(0); // no Recharts keyboard layer that would read the chart point by point
    await expect(tm.locator('.tm-plot svg[role], .tm-plot svg[aria-label]')).toHaveCount(0);
    // The drawn line never goes beyond the visible month: one point per visible month.
    if (m > 0) {
      const points = await tm.locator('.tm-plot .recharts-line-curve').first().getAttribute('d');
      expect((points ?? '').split(/[ML]/).filter(Boolean)).toHaveLength(m + 1);
    }
  }
  await expect(tm.locator('.tm-plot')).toHaveAttribute('aria-label', /meses 0 a 2/);
});

test('pause questions appear in the detected real months with neutral feedback from the real numbers', async ({ page }) => {
  const tm = await start(page);
  const line = await simulation(page);
  await shot(page, 'light-desktop-1-month-0');
  await tm.getByRole('button', { name: '2×' }).click();
  await tm.getByRole('button', { name: 'Reproducir' }).click();

  // Month 3: largest monthly drop of the fund, interpretation question, focus on the card.
  const card = tm.locator('.tm-card');
  await expect(card).toBeVisible({ timeout: 8000 });
  await expect(tm).toContainText('Mes 3 de 12');
  await expect(card).toHaveAttribute('data-pause', '3');
  await expect(card.locator('.tm-badge')).toContainText('Caída fuerte del fondo');
  await expect(card.locator('#tm-q-title')).toBeFocused();
  await expect(card.locator('#tm-q-title')).toHaveText(`Has puesto ${eur(line[3].contributed)} y vale ${eur(line[3].value)}: ¿ganas o pierdes?`);
  await expect(card).toContainText('cayó un 2,7 %');
  // While a question is open the autoplay does not continue and the controls are disabled.
  await expect(tm.getByRole('button', { name: 'Siguiente mes' })).toHaveAttribute('aria-disabled', 'true');
  await page.waitForTimeout(1200);
  await expect(tm).toContainText('Mes 3 de 12');
  await shot(page, 'light-desktop-2-drop-question');
  const lost = line[3].profit < -line[3].contributed * 0.01;
  await card.getByRole('button', { name: lost ? 'Pierdo' : 'Gano', exact: true }).click();
  await expect(card.locator('.tm-verdict')).toContainText('Coincide con los datos.');
  await expect(card.locator('.tm-verdict')).toContainText(`${eur(Math.abs(line[3].profit))}`);
  await expect(card.locator('.tm-verdict')).not.toContainText(/mejor|ganador|recomend/i);
  await shot(page, 'light-desktop-3-drop-feedback-decision');
  await expect(card.getByRole('button', { name: 'Mantener' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Vender ahora' })).toBeVisible();
  await card.getByRole('button', { name: 'Mantener' }).click();
  await expect(card).toHaveCount(0);
  await expect(tm.getByRole('button', { name: 'Reproducir' })).toBeFocused();

  // Month 6: back to within 1 % of what was contributed. Month 11: new all-time high. Month 12: the end and the summary.
  await tm.getByRole('button', { name: 'Reproducir' }).click();
  await expect(card).toHaveAttribute('data-pause', '6', { timeout: 10000 });
  await expect(card.locator('.tm-badge')).toContainText('Vuelves a lo que pusiste');
  await card.getByRole('button', { name: /En ganancia|En tablas/ }).first().click();
  await card.getByRole('button', { name: 'Continuar' }).or(card.getByRole('button', { name: 'Mantener' })).click();
  await tm.getByRole('button', { name: 'Reproducir' }).click();
  await expect(card).toHaveAttribute('data-pause', '11', { timeout: 10000 });
  await expect(card.locator('.tm-badge')).toContainText('Nuevo máximo del fondo');
  await card.getByRole('button', { name: `Lo que he puesto: ${eur(line[11].contributed)}` }).click();
  await expect(card.locator('.tm-verdict')).toContainText('Coincide con los datos.');
  await card.getByRole('button', { name: 'Mantener' }).click();
  await tm.getByRole('button', { name: 'Reproducir' }).click();
  await expect(card).toHaveAttribute('data-pause', '12', { timeout: 10000 });
  await expect(card.locator('.tm-badge')).toContainText('Fin del recorrido');
  await expect(card.getByRole('button', { name: 'Mantener' })).toHaveCount(0); // no decision at the last month
  await card.getByRole('button', { name: 'No, solo cuenta lo que pasó' }).click();
  await expect(card.locator('.tm-verdict')).toContainText('el pasado no predice el futuro');
  await card.getByRole('button', { name: 'Continuar' }).click();

  const summary = tm.locator('.tm-summary');
  await expect(summary).toBeVisible();
  await expect(summary.locator('#tm-summary-title')).toBeFocused();
  await expect(summary.locator('.tm-summary-text')).toContainText(`${eur(line[12].value)}, habiendo puesto ${eur(line[12].contributed)}`);
  const chips = await summary.locator('.tm-learned li').count();
  expect(chips).toBeGreaterThanOrEqual(2);
  expect(chips).toBeLessThanOrEqual(3);
  await expect(summary.locator('.tm-learned')).toContainText('mayor caída mensual del periodo fue 2,7 %');
  // Answers are kept as a list, and the disclosure holds source, period and assumptions.
  await expect(tm.locator('.tm-answers li')).toHaveCount(7);
  await summary.getByText('Más información').click();
  await expect(summary.getByRole('link', { name: 'CNMV', exact: true })).toHaveAttribute('href', /^https:\/\//);
  await expect(summary.getByRole('link', { name: 'Condiciones de reutilización de la CNMV' })).toHaveAttribute('href', /^https:\/\//);
  await expect(summary).toContainText('dic 2019 – dic 2020');
  await expect(summary).toContainText(/Valores liquidativos históricos CNMV/);
  await shot(page, 'light-desktop-6-summary');
  await expect(tm.getByRole('button', { name: 'Volver a empezar' })).toBeVisible();
});

test('selling at the visible month uses the exact backend numbers and then draws two lines', async ({ page }) => {
  const bodies: unknown[] = [];
  page.on('request', r => { if (r.url().endsWith('/api/game/compare')) bodies.push(r.postDataJSON()); });
  const tm = await start(page);
  const { hold, sell } = await compare(page, 3);
  await stepTo(tm, 3);
  const card = tm.locator('.tm-card');
  await expect(card).toHaveAttribute('data-pause', '3');
  await card.locator('.tm-option').first().click();
  await card.getByRole('button', { name: 'Vender ahora' }).click();
  await expect(card).toHaveCount(0);
  expect(bodies).toEqual([{ instrumentId: SANTANDER, initial: 500, monthly: 50, months: 12, sellMonth: 3, buyFeeRate: 0, sellFeeRate: 0 }]);
  await expect(tm.getByRole('button', { name: 'Reproducir' })).toBeFocused();
  await expect(tm.locator('.tm-answers')).toContainText(`vendes. Tu decisión vale ${eur(sell[3])}; si mantuvieras, valdría ${eur(hold[3])}`);
  await expect(tm.locator('#tm-live')).toContainText('Tu decisión vale');
  const big = tm.locator('.tm-big');
  await expect(big.filter({ hasText: 'Si mantengo' })).toContainText(eur(hold[3]));
  await expect(big.filter({ hasText: 'Tu decisión' })).toContainText(eur(sell[3]));
  // One sale only: the next pauses offer no second decision.
  await next(tm);
  await expect(tm).toContainText('Mes 4 de 12');
  await expect(big.filter({ hasText: 'Si mantengo' })).toContainText(eur(hold[4]));
  await expect(big.filter({ hasText: 'Tu decisión' })).toContainText(eur(sell[4]));
  // Two lines in the chart, legend and table, never past the visible month.
  await expect(tm.locator('.tm-legend')).toContainText('Si mantengo');
  await expect(tm.locator('.tm-legend')).toContainText('Tu decisión');
  const text = await tm.evaluate(el => el.textContent ?? '');
  for (const future of [5, 8, 12]) { expect(text).not.toContain(eur(hold[future])); expect(text).not.toContain(eur(sell[future])); }
  await tm.getByText('Ver tabla de los meses visibles').click();
  const table = tm.getByRole('table');
  await expect(table.getByRole('columnheader')).toHaveText(['Mes', 'Fecha', 'Valor', 'Has puesto', 'Ganancia o pérdida', 'Tu decisión']);
  await expect(table.locator('tbody tr')).toHaveCount(5);
  await expect(table.locator('tbody tr').nth(4)).toContainText(eur(sell[4]));
  await expect(table.locator('tbody tr').nth(2)).toContainText('—');
  await shot(page, 'light-desktop-4-after-sale');
  // Through the end: summary with both lines' final values.
  await stepTo(tm, 12, false);
  await expect(tm.locator('.tm-card')).toHaveCount(1);
  await expect(tm.locator('.tm-card')).toHaveAttribute('data-pause', '12');
  await tm.locator('.tm-card').getByRole('button', { name: 'Seguir sin responder' }).click();
  const summary = tm.locator('.tm-summary .tm-summary-text');
  await expect(summary).toContainText(`Vendiste en el mes 3 y acabaste con ${eur(sell[12])}; si hubieras mantenido, ${eur(hold[12])}`);
  await expect(tm.locator('.tm-learned')).toContainText('liquidez');
  await expect(tm.locator('.tm-summary')).not.toContainText(/ganador|mejor decisión|winner/i);
  await tm.locator('.tm-summary').getByText('Más información').click();
  await expect(tm.locator('.tm-more')).toContainText('La aportación del mes de venta se invierte antes de vender');
});

test('answering and keeping never calls the sale endpoint, and a skipped question leaves the replay usable', async ({ page }) => {
  const calls: string[] = [];
  page.on('request', r => { if (r.url().includes('/api/game/compare')) calls.push(r.url()); });
  const tm = await start(page);
  await next(tm, 3);
  await tm.locator('.tm-card').getByRole('button', { name: 'Seguir sin responder' }).click();
  await expect(tm.locator('.tm-card')).toHaveCount(0);
  await next(tm);
  await expect(tm).toContainText('Mes 4 de 12');
  expect(calls).toEqual([]);
});

test('a failed or tampered sale response shows an alert and keeps the replay without a sale', async ({ page }) => {
  let mode: 'fail' | 'tamper' = 'fail';
  await page.route('**/api/game/compare', async route => {
    if (mode === 'fail') return route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":{"code":"x","message":"boom"}}' });
    const response = await route.fetch();
    const body = await response.json();
    body.provenance.datasetSha256 = '0'.repeat(64);
    await route.fulfill({ response, json: body });
  });
  const tm = await start(page);
  await next(tm, 3);
  const card = tm.locator('.tm-card');
  await card.locator('.tm-option').first().click();
  await card.getByRole('button', { name: 'Vender ahora' }).click();
  await expect(card.getByRole('alert')).toContainText('No se ha podido calcular la venta');
  await expect(tm.locator('.tm-legend')).not.toContainText('Tu decisión');
  mode = 'tamper';
  await card.getByRole('button', { name: 'Vender ahora' }).click();
  await expect(card.getByRole('alert')).toBeVisible();
  await expect(tm.locator('.tm-legend')).not.toContainText('Tu decisión');
  await card.getByRole('button', { name: 'Mantener' }).click();
  await expect(card).toHaveCount(0);
});

test('clicking Vender ahora while busy sends exactly one request', async ({ page }) => {
  const bodies: unknown[] = [];
  await page.route('**/api/game/compare', async route => { bodies.push(route.request().postDataJSON()); await new Promise(r => setTimeout(r, 700)); await route.continue().catch(() => {}); });
  const tm = await start(page);
  await next(tm, 3);
  const card = tm.locator('.tm-card');
  await card.locator('.tm-option').first().click();
  await card.getByRole('button', { name: 'Vender ahora' }).click();
  await expect(card.getByRole('button', { name: 'Calculando…' })).toHaveAttribute('aria-disabled', 'true');
  await card.getByRole('button', { name: 'Calculando…' }).click({ force: true });
  await expect(card).toHaveCount(0);
  expect(bodies).toHaveLength(1);
});

test('a late sale response never applies after the step 2 amounts change', async ({ page }) => {
  let served!: () => void;
  const delivered = new Promise<void>(resolve => { served = resolve; });
  await page.route('**/api/game/compare', async route => { await new Promise(r => setTimeout(r, 1200)); await route.continue().catch(() => {}); served(); });
  const tm = await start(page);
  await next(tm, 3);
  const card = tm.locator('.tm-card');
  await card.locator('.tm-option').first().click();
  await card.getByRole('button', { name: 'Vender ahora' }).click();
  await page.getByLabel('Aportación mensual').fill('60');
  await delivered; // the late response has been served; give React one frame to (wrongly) apply it
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const fresh = page.locator('#jr-step-3 .tm');
  await expect(fresh).toContainText('Mes 0 de 12');
  await expect(fresh.locator('.tm-answers')).toHaveCount(0);
  await expect(fresh.locator('.tm-legend')).not.toContainText('Tu decisión');
});

test('CaixaBank-scoped app: the replay works and the sale decision is replaced by a short note', async ({ page }) => {
  const tm = await start(page, CAIXA, 'http://127.0.0.1:5194/');
  await next(tm, 3);
  await expect(tm.locator('.tm-card')).toHaveAttribute('data-pause', '3');
  await tm.locator('.tm-option').first().click();
  await expect(tm.locator('.tm-note[data-block="bank"]')).toBeVisible();
  await expect(tm.getByRole('button', { name: 'Vender ahora' })).toHaveCount(0);
});

test('English: controls, pause questions, sale and summary', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'English' }).click();
  await page.getByRole('button', { name: 'Simulator', exact: true }).click();
  await startJourney(page, SANTANDER);
  const tm = page.locator('#jr-step-3 .tm');
  const line = await simulation(page);
  const { hold, sell } = await compare(page, 3);
  await expect(tm.getByRole('heading', { name: 'Live the journey' })).toBeVisible();
  await expect(tm).toContainText('Month 0 of 12');
  await expect(tm.getByRole('button', { name: 'Play' })).toBeVisible();
  await expect(tm.getByRole('group', { name: 'Speed' })).toBeVisible();
  await tm.getByRole('button', { name: 'Next month' }).click();
  await tm.getByRole('button', { name: 'Next month' }).click();
  await tm.getByRole('button', { name: 'Next month' }).click();
  const card = tm.locator('.tm-card');
  await expect(card.locator('.tm-badge')).toContainText('Sharp fall of the fund');
  await expect(card.locator('#tm-q-title')).toHaveText(`You put in ${eur(line[3].contributed, 'en-GB')} and it is worth ${eur(line[3].value, 'en-GB')}: do you gain or lose?`);
  await card.getByRole('button', { name: 'I gain', exact: true }).click();
  await expect(card.locator('.tm-verdict')).toContainText(/It matches the data|It does not match the data/);
  await card.getByRole('button', { name: 'Sell now' }).click();
  await expect(card).toHaveCount(0);
  await expect(tm.locator('.tm-answers')).toContainText(`you sell. Your decision is worth ${eur(sell[3], 'en-GB')}; if you held, it would be worth ${eur(hold[3], 'en-GB')}`);
  await expect(tm.locator('.tm-legend')).toContainText('Your decision');
  await expect(tm.getByText('View table of visible months')).toBeVisible();
});

test('reduced motion: no autoplay, no play or speed controls, step by step only, no card animation', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const tm = await start(page);
  await expect(tm.getByRole('button', { name: 'Reproducir' })).toHaveCount(0);
  await expect(tm.getByRole('group', { name: 'Velocidad' })).toHaveCount(0);
  await expect(tm).toContainText('solo cuando pulsas «Siguiente mes»');
  await page.waitForTimeout(2500);
  await expect(tm).toContainText('Mes 0 de 12');
  await next(tm, 3);
  await expect(tm).toContainText('Mes 3 de 12');
  const animation = await tm.locator('.tm-card').evaluate(el => getComputedStyle(el).animationName);
  expect(animation).toBe('none');
  await tm.locator('.tm-option').first().click();
  await tm.locator('.tm-card').getByRole('button', { name: 'Mantener' }).click();
  await expect(tm.getByRole('button', { name: 'Siguiente mes' })).toBeFocused();
  await context.close();
});

test('keyboard flow, focus management and a throttled live region', async ({ page }) => {
  const tm = await start(page);
  const line = await simulation(page);
  const live = tm.locator('#tm-live');
  await expect(live).toHaveAttribute('aria-live', 'polite');
  await page.locator('#tm-next').focus();
  await page.keyboard.press('Enter');
  await expect(live).toHaveText(`Mes 1 de 12. Vale ${eur(line[1].value)}; has puesto ${eur(line[1].contributed)}.`);
  // Autoplay does not announce every month: the region keeps the last announced step.
  await page.locator('#tm-play').focus();
  await tm.getByRole('button', { name: '2×' }).click();
  await page.locator('#tm-play').focus();
  await page.keyboard.press('Enter');
  await expect(tm).toContainText('Mes 2 de 12', { timeout: 3000 });
  await expect(live).toHaveText(`Mes 1 de 12. Vale ${eur(line[1].value)}; has puesto ${eur(line[1].contributed)}.`);
  // The pause announces itself and moves focus to the question.
  await expect(tm.locator('.tm-card')).toBeVisible({ timeout: 6000 });
  await expect(live).toContainText('Pausa en el mes 3');
  await expect(live).not.toContainText(eur(line[4].value));
  await expect(tm.locator('#tm-q-title')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(tm.locator('.tm-option').first()).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(live).toContainText('Tu respuesta:');
  // Decision buttons are reachable by keyboard; after answering focus returns to the controls.
  const keep = tm.getByRole('button', { name: 'Mantener' });
  await keep.focus();
  await page.keyboard.press('Enter');
  await expect(tm.locator('.tm-card')).toHaveCount(0);
  await expect(tm.getByRole('button', { name: 'Reproducir' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(tm.getByRole('button', { name: 'Pausa' })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(tm.getByRole('button', { name: 'Reproducir' })).toBeVisible();
  // Visible focus indicator on the controls.
  await tm.getByRole('button', { name: 'Siguiente mes' }).focus();
  const outline = await tm.getByRole('button', { name: 'Siguiente mes' }).evaluate(el => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
});

for (const [width, theme] of [[375, 'dark'], [320, 'dark'], [375, 'light'], [320, 'light']] as const) {
  test(`replay, question, sale, table and summary fit ${width}px without overflow in ${theme} theme`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 800 } });
    const page = await context.newPage();
    await page.addInitScript(theme => localStorage.setItem('t2f-theme', theme), theme);
    const tm = await start(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    await next(tm, 3);
    await expect(tm.locator('.tm-card')).toBeVisible();
    await expect.poll(() => overflow(page)).toBeLessThanOrEqual(0);
    if (width === 375) await shot(page, `${theme}-mobile-2-drop-question`);
    await tm.locator('.tm-option').first().click();
    if (width === 375) await shot(page, `${theme}-mobile-3-feedback-decision`);
    await tm.getByRole('button', { name: 'Vender ahora' }).click();
    await expect(tm.locator('.tm-card')).toHaveCount(0);
    await next(tm);
    await tm.getByText('Ver tabla de los meses visibles').click();
    await expect(tm.getByRole('table')).toBeVisible();
    await expect.poll(() => overflow(page)).toBeLessThanOrEqual(0);
    if (width === 375) await shot(page, `${theme}-mobile-4-after-sale-table`);
    await stepTo(tm, 12, false);
    await tm.locator('.tm-card').getByRole('button', { name: 'Seguir sin responder' }).click();
    await expect(tm.locator('.tm-summary')).toBeVisible();
    await tm.locator('.tm-summary').getByText('Más información').click();
    await expect.poll(() => overflow(page)).toBeLessThanOrEqual(0);
    const box = await page.locator('.journey').boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    if (width === 375) await shot(page, `${theme}-mobile-6-summary`);
    await context.close();
  });
}

test('the Marea palette applies only inside the simulator journey and the app keeps its own tokens elsewhere', async ({ page }) => {
  await openSimulator(page);
  const inside = await page.locator('.journey').evaluate(el => getComputedStyle(el).getPropertyValue('--mr-teal').trim());
  expect(inside.toLowerCase()).toBe('#00b3a4');
  const outside = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--mr-teal').trim());
  expect(outside).toBe('');
});

test('Mantener while a sale is in flight is disabled and never mixes with the late sale response', async ({ page }) => {
  let served!: () => void;
  const delivered = new Promise<void>(resolve => { served = resolve; });
  await page.route('**/api/game/compare', async route => { await new Promise(r => setTimeout(r, 1000)); await route.continue().catch(() => {}); served(); });
  const tm = await start(page);
  await next(tm, 3);
  const card = tm.locator('.tm-card');
  await card.locator('.tm-option').first().click();
  await card.getByRole('button', { name: 'Vender ahora' }).click();
  const keep = card.getByRole('button', { name: 'Mantener' });
  await expect(keep).toHaveAttribute('aria-disabled', 'true');
  await keep.click({ force: true });
  await expect(card).toBeVisible(); // still in the pause: keeping was ignored while busy
  await delivered;
  // The sale was the user's only decision: it applies once, and there is no "kept" entry next to it.
  await expect(card).toHaveCount(0);
  await expect(tm.locator('.tm-legend')).toContainText('Tu decisión');
  await expect(tm.locator('.tm-answers')).not.toContainText('decides mantener');
});

test('Mantener and Vender ahora look alike (neither is the highlighted choice)', async ({ page }) => {
  const tm = await start(page);
  await next(tm, 3);
  const card = tm.locator('.tm-card');
  await card.locator('.tm-option').first().click();
  const classes = await Promise.all(['Mantener', 'Vender ahora'].map(name => card.getByRole('button', { name }).getAttribute('class')));
  expect(classes[0]).toBe(classes[1]);
  const style = await Promise.all(['Mantener', 'Vender ahora'].map(name => card.getByRole('button', { name }).evaluate(el => { const c = getComputedStyle(el); return [c.backgroundColor, c.color, c.borderTopColor].join('|'); })));
  expect(style[0]).toBe(style[1]);
});

test('while the replay runs step 1 is collapsed to the chosen fund, and it can be expanded again', async ({ page }) => {
  await openSimulator(page);
  await startJourney(page);
  await expect(page.locator('#jr-step-1 .jr-spark').first()).toBeVisible();
  const tm = page.locator('#jr-step-3 .tm');
  await next(tm);
  const step1 = page.locator('#jr-step-1');
  await expect(step1.locator('.jr-spark')).toHaveCount(0);
  await expect(step1).not.toContainText('Mayor caída en el periodo');
  await expect(step1.locator('.jr-collapsed')).toContainText('Fondo monetario');
  await step1.getByRole('button', { name: 'Cambiar fondo' }).click();
  await expect(page.locator('#jr-step-1 .jr-spark').first()).toBeVisible();
});

test('switching language mid-replay keeps the state and translates labels', async ({ page }) => {
  const tm = await start(page);
  const line = await simulation(page);
  await next(tm, 3);
  await tm.locator('.tm-option').first().click();
  await tm.getByRole('button', { name: 'Mantener' }).click();
  await next(tm);
  await expect(tm).toContainText('Mes 4 de 12');
  await page.getByRole('button', { name: 'English' }).click();
  const en = page.locator('#jr-step-3 .tm');
  await expect(en).toContainText('Month 4 of 12');
  await expect(en.getByRole('button', { name: 'Next month' })).toBeVisible();
  await expect(en.locator('.tm-big').first()).toContainText(eur(line[4].value, 'en-GB'));
  await expect(en.locator('.tm-answers li')).toHaveCount(2); // the answer and the decision survive the switch
  await expect(en.getByText('View table of visible months')).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  test(`pause, loss and summary states keep text contrast of at least 4.5:1 in ${theme} theme`, async ({ page }) => {
    await page.addInitScript(theme => localStorage.setItem('t2f-theme', theme), theme);
    let failSale = true;
    await page.route('**/api/game/compare', route => (failSale ? route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }) : route.continue()));
    const tm = await start(page);
    await next(tm, 3);
    const measure = (selector: string) => page.evaluate(selector => {
      const parse = (c: string) => { const m = c.match(/[\d.]+/g)!.map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 }; };
      const lum = ({ r, g, b }: { r: number; g: number; b: number }) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const el = document.querySelector(selector)!;
      let bg = { r: 255, g: 255, b: 255, a: 1 };
      for (let e: Element | null = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c.a > 0.99) { bg = c; break; } }
      const [a, b] = [lum(parse(getComputedStyle(el).color)), lum(bg)].sort((x, y) => y - x);
      return (a + 0.05) / (b + 0.05);
    }, selector);
    await expect(tm.locator('.tm-gl.tm-down')).toBeVisible(); // month 3 is a loss at this point
    expect(await measure('.tm-gl.tm-down dd'), `.tm-gl.tm-down dd in ${theme}`).toBeGreaterThanOrEqual(4.5);
    expect(await measure('.tm-gl.tm-down dt'), `.tm-gl.tm-down dt in ${theme}`).toBeGreaterThanOrEqual(4.5);
    await tm.locator('.tm-option').first().click();
    expect(await measure('.tm-verdict'), `.tm-verdict in ${theme}`).toBeGreaterThanOrEqual(4.5);
    await tm.getByRole('button', { name: 'Vender ahora' }).click();
    await expect(tm.locator('.tm-error')).toBeVisible();
    expect(await measure('.tm-error'), `.tm-error in ${theme}`).toBeGreaterThanOrEqual(4.5);
    failSale = false;
    await tm.getByRole('button', { name: 'Mantener' }).click();
    await finishReplay(page);
    for (const selector of ['.tm-learned li', '.tm-summary-text', '.tm-summary .jr-achievement', '.tm-answers li', '.tm-more summary']) {
      expect(await measure(selector), `${selector} in ${theme}`).toBeGreaterThanOrEqual(4.5);
    }
  });
}
