import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

// Página temporal /componentes (fase 2). Capturas opcionales con T2F_SHOTS=<carpeta>.
const levels = ['beginner', 'intermediate', 'advanced'] as const;
const themes = ['light', 'dark'] as const;
const shots = process.env.T2F_SHOTS;

async function open(page: Page, level: string, theme: string, lang = 'es') {
  await page.goto(`/componentes?level=${level}&theme=${theme}&lang=${lang}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.dash-evo__plot svg').first()).toBeVisible();
  await page.waitForTimeout(300);
}

/** Recorre el texto visible y mide el contraste WCAG (4,5:1; 3:1 en texto grande). */
async function lowContrast(page: Page) {
  return page.evaluate(() => {
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
    // El canvas normaliza cualquier sintaxis de color (rgb, color(srgb ...), color-mix) a RGBA.
    const parse = (c: string) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 }; };
    type RGBA = { r: number; g: number; b: number; a: number };
    const over = (top: RGBA, bottom: RGBA): RGBA => { const a = top.a + bottom.a * (1 - top.a); return a === 0 ? top : { r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / a, g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / a, b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / a, a }; };
    const lum = (c: RGBA) => [c.r, c.g, c.b].map((v) => { const x = v / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }).reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0);
    const background = (el: Element): RGBA => {
      const chain: RGBA[] = [];
      for (let e: Element | null = el; e; e = e.parentElement) { const bg = parse(getComputedStyle(e).backgroundColor); if (bg.a > 0) chain.push(bg); if (bg.a === 1) break; }
      return chain.reduceRight((acc, c) => over(c, acc), { r: 255, g: 255, b: 255, a: 1 });
    };
    const out: { text: string; ratio: number; size: number }[] = [];
    let checked = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = n.textContent?.trim(); const el = n.parentElement;
      if (!text || !el || ['SCRIPT', 'STYLE'].includes(el.tagName)) continue;
      const box = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (box.width < 3 || box.height < 3 || cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (el.closest('details:not([open]) > :not(summary)')) continue;
      const isSvg = el instanceof SVGElement;
      let fg = parse(isSvg ? cs.fill : cs.color);
      let opacity = 1; for (let e: Element | null = el; e; e = e.parentElement) opacity *= parseFloat(getComputedStyle(e).opacity);
      fg = { ...fg, a: fg.a * opacity };
      const bg = background(el);
      const f = over(fg, bg);
      const l1 = lum(f), l2 = lum(bg);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
      const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
      checked++;
      if (ratio < need) out.push({ text: text.slice(0, 40), ratio: +ratio.toFixed(2), size });
    }
    return { failures: out, checked };
  });
}

for (const level of levels) for (const theme of themes) {
  test(`componentes ${level}/${theme}: render, contraste AA y sin desbordes`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await open(page, level, theme);
    for (const name of ['Valor de la cartera', 'Resultado', 'Evolución de la cartera', 'Por tipo de activo', 'Por región', 'Por divisa', 'Asistente de IA'])
      await expect(page.getByText(name, { exact: false }).first()).toBeVisible();
    await expect(page.locator('.dash-kpi')).toHaveCount(4);
    await expect(page.locator('.dash-spark')).toHaveCount(3);
    await expect(page.locator('.dash-donut')).toHaveCount(3);
    await expect(page.locator('.dash-funds tbody tr')).toHaveCount(5);
    await expect(page.locator('.dash-demo').first()).toBeVisible();
    await expect(page.getByText('Página temporal')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-level', level);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

    for (const [w, h] of [[1280, 900], [390, 844]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(250);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `desborde horizontal a ${w}px`).toBeLessThanOrEqual(0);
      const { failures, checked } = await lowContrast(page);
      expect(checked).toBeGreaterThan(150);
      expect(failures, `contraste a ${w}px`).toEqual([]);
      if (shots) { await page.waitForTimeout(1500); mkdirSync(shots, { recursive: true }); await page.screenshot({ path: `${shots}/componentes-${level}-${theme}-${w}.png`, fullPage: true }); }
    }
    expect(errors).toEqual([]);
  });
}

test('componentes en inglés usan los textos EN', async ({ page }) => {
  await open(page, 'advanced', 'dark', 'en');
  await expect(page.getByRole('heading', { name: /Portfolio evolution/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Basic' })).toBeVisible();
  await expect(page.getByText('Fictional scenarios').first()).toBeVisible();
});

test('selector de periodo, tooltip y datos del gráfico', async ({ page }) => {
  await open(page, 'intermediate', 'light');
  const periods = page.getByRole('group', { name: 'Periodo del gráfico' });
  await expect(periods.getByRole('button', { name: '1A' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByText('Ver datos del gráfico').click();
  const rows = page.locator('.dash-evo__data tbody tr');
  await expect(rows).toHaveCount(13);
  await periods.getByRole('button', { name: '3M' }).click();
  await expect(periods.getByRole('button', { name: '3M' })).toHaveAttribute('aria-pressed', 'true');
  await expect(rows).toHaveCount(4);
  const plot = page.locator('.dash-evo__plot');
  const box = (await plot.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2);
  await expect(page.locator('.dash-tip')).toContainText('Cartera DEMO');
  await expect(page.locator('.dash-tip')).toContainText('€');
});

test('tabla de fondos: orden accesible, riesgo con valor visible y signo en resultados', async ({ page }) => {
  await open(page, 'advanced', 'light');
  const table = page.locator('.dash-funds table').first();
  const header = table.getByRole('columnheader', { name: /Riesgo/ });
  await expect(header).toHaveAttribute('aria-sort', 'none');
  await header.getByRole('button').click();
  await expect(header).toHaveAttribute('aria-sort', 'descending');
  await expect(table.locator('tbody tr').first()).toContainText('Mercados Emergentes Ejemplo');
  await header.getByRole('button').click();
  await expect(header).toHaveAttribute('aria-sort', 'ascending');
  await expect(table.locator('tbody tr').first()).toContainText('Liquidez Ejemplo');
  await expect(table.getByRole('meter').first()).toHaveAttribute('aria-valuetext', /\d de 7/);
  await expect(table.locator('.dash-chip--negative').first()).toContainText('-');
  await expect(table.locator('.dash-chip--positive').first()).toContainText('+');
  await expect(page.locator('.dash-funds__scroll').first()).toHaveAttribute('tabindex', '0');
});

test('donut: valores en texto en la leyenda, no solo color', async ({ page }) => {
  await open(page, 'beginner', 'dark');
  const donut = page.locator('.dash-donut').first();
  await expect(donut.locator('li')).toHaveCount(4);
  await expect(donut.locator('.dash-donut__pct').first()).toHaveText(/\d+,\d %/);
  await expect(donut.getByRole('img')).toHaveAttribute('aria-label', /Renta fija \d+,\d %/);
  expect(await donut.locator('pattern').count()).toBeGreaterThanOrEqual(6);
});

test('AgentPanel cambia con el nivel, es DEMO y no da órdenes', async ({ page }) => {
  await open(page, 'beginner', 'light');
  const agent = page.locator('.dash-agent');
  await expect(agent).toContainText('Resumen');
  await expect(agent).toContainText('no son órdenes de compra o venta ni asesoramiento personalizado'.replace('no son', 'No son'));
  await expect(agent.locator('.dash-demo')).toBeVisible();
  await page.getByRole('button', { name: 'Intermedio', exact: true }).click();
  await expect(agent).toContainText('Observaciones');
  await expect(agent).toContainText('Puntos para reflexionar');
  await page.getByRole('button', { name: 'Avanzado', exact: true }).click();
  await expect(agent).toContainText('Escenarios ficticios');
  await expect(agent.getByRole('row')).toHaveCount(3);
  await expect(agent).toContainText('no es una predicción');
  expect(await agent.innerText()).not.toMatch(/\b(compra|vende|vender|comprar)\s+(ahora|ya)\b/i);
});

test('movimiento reducido: sin animaciones de gráfica y sin transiciones en tarjetas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, 'intermediate', 'dark');
  const t = await page.locator('.dash-card').first().evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(t).toBe('0s');
});

test('el nivel elegido se recuerda al recargar y un valor inválido vuelve a Básico', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/');
  await page.getByRole('button', { name: /Detalle/ }).click();
  await page.locator('.level-menu').getByRole('button', { name: 'Avanzado' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-level', 'advanced');
  expect(await page.evaluate(() => localStorage.getItem('t2f-level'))).toBe('advanced');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-level', 'advanced');
  await page.evaluate(() => localStorage.setItem('t2f-level', 'experto'));
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-level', 'beginner');
});

test('la página temporal no aparece en la navegación real', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/');
  await expect(page.locator('a[href*="componentes"]')).toHaveCount(0);
});

test('nota de rentabilidades DEMO netas y sin tipo de cambio, en español e inglés', async ({ page }) => {
  await open(page, 'beginner', 'light');
  await expect(page.getByTestId('demo-returns-note')).toContainText('Rentabilidades DEMO netas de gastos, sin tipo de cambio');
  await open(page, 'beginner', 'light', 'en');
  await expect(page.getByTestId('demo-returns-note')).toContainText('DEMO returns net of fees, without exchange rate');
});
