import { expect, test } from '@playwright/test';
import { LEVELS, THEMES, goTo, openApp } from './helpers/app';
import { lowContrast } from './helpers/contrast';

// Vistas del dashboard rediseñado (Inicio, Mi cartera, Educación, Simulador) con datos DEMO.

test.describe('Inicio', () => {
  test('KPIs, etiqueta DEMO y un solo h1', async ({ page }) => {
    await openApp(page, { level: 'beginner' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('.dash-kpi')).toHaveCount(3);
    await expect(page.locator('.dash-demo').first()).toBeVisible();
    await expect(page.getByText('Datos ficticios de ejemplo').first()).toBeVisible();
    await expect(page.locator('.dash-kpi__value').first()).toContainText('€');
  });

  test('cambiar de nivel añade indicadores y se recuerda', async ({ page }) => {
    await openApp(page, { level: 'beginner' });
    await page.locator('.level-button').click();
    await page.locator('.level-menu').getByRole('button', { name: 'Avanzado' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-level', 'advanced');
    await expect(page.locator('.dash-kpi')).toHaveCount(8);
    expect(await page.evaluate(() => localStorage.getItem('t2f-level'))).toBe('advanced');
  });

  test('el panel del asistente devuelve el foco al botón que lo abrió', async ({ page }) => {
    await openApp(page, { level: 'intermediate' });
    const open = page.getByRole('button', { name: '¿Qué estoy viendo?' });
    await open.click();
    await expect(page.getByRole('heading', { level: 3, name: /¿Qué estoy viendo\?/ })).toBeFocused();
    expect(await page.locator('[aria-live]').filter({ has: page.locator('.home__panel') }).count()).toBe(0);
    await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
    await expect(open).toBeFocused();
  });
});

test.describe('Educación y Test MiFID', () => {
  test('responder, comprobar, siguiente y resultado con foco accesible', async ({ page }) => {
    await openApp(page, { level: 'beginner' });
    await goTo(page, 'learn');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { name: /Test MiFID/ })).toBeVisible();
    const meta = page.locator('.edu-quiz__meta');
    const total = Number((await meta.getByText(/Pregunta 1 de \d+/).innerText()).match(/de (\d+)/)![1]);
    expect(total).toBeGreaterThan(3);
    let knowledge = 0;
    let personal = 0;
    for (let i = 1; i <= total; i++) {
      await expect(meta).toContainText(`Pregunta ${i} de ${total}`);
      const isPersonal = (await meta.innerText()).includes('Situación personal');
      await expect(page.getByRole('button', { name: 'Comprobar respuesta' })).toBeDisabled();
      await page.locator('.edu-opt input').first().check();
      await page.getByRole('button', { name: 'Comprobar respuesta' }).click();
      if (isPersonal) {
        personal++;
        await expect(page.getByText('No hay respuesta correcta')).toBeVisible();
        await expect(page.locator('.edu-opt.is-right')).toHaveCount(0);
        await expect(page.locator('.edu-feedback .dash-chip')).toHaveCount(0);
      } else {
        knowledge++;
        await expect(page.locator('.edu-feedback .dash-chip')).toHaveText(/Correcta|Incorrecta/);
      }
      await expect(page.getByText('Explicación:')).toBeVisible();
      if (i < total) {
        await page.getByRole('button', { name: 'Siguiente' }).click();
        // El foco pasa a la leyenda de la nueva pregunta.
        await expect(page.locator('.edu-quiz__fieldset legend')).toBeFocused();
      } else {
        await page.getByRole('button', { name: 'Ver resultado' }).click();
      }
    }
    expect(knowledge).toBeGreaterThan(0);
    expect(personal).toBeGreaterThan(0);
    await expect(page.getByRole('heading', { name: 'Resultado de la práctica' })).toBeFocused();
    await expect(page.locator('.edu-result__score')).toContainText(/de \d+ preguntas de conocimiento acertadas/);
    await expect(page.getByText('no mide tu perfil')).toBeVisible();
    await page.getByRole('button', { name: 'Repetir práctica' }).click();
    await expect(page.locator('.edu-quiz__fieldset legend')).toBeFocused();
  });

  test('el hover de los botones secundarios mantiene contraste AA en los 6 temas', async ({ page }) => {
    test.setTimeout(90_000);
    for (const theme of THEMES) for (const level of LEVELS) {
      await openApp(page, { level, theme });
      await goTo(page, 'learn');
      const btn = page.locator('.edu-btn--ghost').first();
      await expect(btn).toBeVisible();
      await btn.hover();
      await page.waitForTimeout(350);
      const ratio = await btn.evaluate((el) => {
        const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
        const rgb = (c: string) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); return Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)); };
        const lum = (c: number[]) => c.map((v) => v / 255).map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)).reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0);
        const cs = getComputedStyle(el);
        const a = lum(rgb(cs.color)), b = lum(rgb(cs.backgroundColor));
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      });
      expect(ratio, `${level}/${theme}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

test.describe('Simulador', () => {
  test('Básico: juego guiado arriba, práctica accesible y simulador de producto debajo', async ({ page }) => {
    await openApp(page, { level: 'beginner' });
    await goTo(page, 'simulator');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Simulador');
    await expect(page.getByRole('heading', { name: 'Elige cuánto ahorrarías al mes' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Evolución ilustrativa' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir práctica guiada' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Explícame esta simulación' })).toBeVisible();
    const guided = await page.getByRole('heading', { name: 'Elige cuánto ahorrarías al mes' }).boundingBox();
    const catalog = await page.getByRole('heading', { name: 'Prueba con un producto del catálogo' }).boundingBox();
    expect(guided!.y).toBeLessThan(catalog!.y);
    await page.getByRole('group', { name: 'Ahorro al mes' }).getByRole('button', { name: /200/ }).click();
    await expect(page.getByRole('group', { name: 'Ahorro al mes' }).getByRole('button', { name: /200/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByLabel('Importe inicial')).toBeVisible();
    await expect(page.getByRole('combobox', { name: /^Escenario/ })).toHaveCount(0);
  });

  test('Intermedio: simulador de producto primero y comparación de escenarios y plazos después, con un único mensaje de error vinculado a los campos', async ({ page }) => {
    await openApp(page, { level: 'intermediate' });
    await goTo(page, 'simulator');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByLabel('Importe inicial')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir práctica guiada' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Comparar escenarios y plazos' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Evolución ilustrativa' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Comparación de periodos', exact: true })).toBeVisible();
    await expect(page.getByText('Equilibrado: Supone 4 % bruto anual')).toBeVisible();
    await expect(page.getByRole('combobox', { name: /^Escenario/ })).toBeVisible();
    await page.getByLabel('Capital inicial (€)').fill('0');
    await page.getByLabel('Ahorro mensual (€)').fill('0');
    const alert = page.locator('.sim-error');
    await expect(alert).toHaveCount(1);
    await expect(alert).toContainText('mayores que cero');
    const id = await alert.getAttribute('id');
    expect(id).toBeTruthy();
    for (const label of ['Capital inicial (€)', 'Ahorro mensual (€)']) {
      const field = page.getByLabel(label);
      await expect(field).toHaveAttribute('aria-invalid', 'true');
      await expect(field).toHaveAttribute('aria-describedby', id!);
    }
    await expect(page.getByRole('spinbutton', { name: 'Años' })).toHaveAttribute('aria-invalid', 'false');
    await page.getByRole('spinbutton', { name: 'Años' }).fill('0');
    await expect(page.getByRole('spinbutton', { name: 'Años' })).toHaveAttribute('aria-describedby', id!);
  });

  test('Avanzado: tabla de escenarios marcada con texto y aria-current, plazos, condiciones y producto debajo', async ({ page }) => {
    await openApp(page, { level: 'advanced' });
    await goTo(page, 'simulator');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Condiciones y costes' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Comparación de periodos', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir práctica guiada' })).toBeVisible();
    const current = page.locator('.sim-table tr[aria-current="true"]');
    await expect(current).toHaveCount(1);
    await expect(current).toContainText('(en el gráfico)');
    await page.locator('.sim-form select').first().selectOption('dynamic');
    await expect(current).toContainText('Dinámico');
    const scenarios = await page.getByRole('heading', { name: 'Escenarios múltiples' }).boundingBox();
    const catalog = await page.getByRole('heading', { name: /Producto del catálogo/ }).boundingBox();
    expect(scenarios!.y).toBeLessThan(catalog!.y);
  });
});

test.describe('Mi cartera', () => {
  test('Vender / Reducir abre la pausa informativa, ofrece continuar con la venta y coincide con la caída máxima', async ({ page }) => {
    await openApp(page, { level: 'advanced' });
    await goTo(page, 'portfolio');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    const dd = page.locator('.dash-kpi').filter({ hasText: 'Máxima caída' }).locator('.dash-kpi__value');
    const number = (s: string) => Math.abs(parseFloat(s.replace('−', '-').replace(',', '.').replace(/[^\d.-]/g, '')));
    const dashboardValue = number(await dd.innerText());
    await page.getByRole('button', { name: 'Vender / Reducir' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('no bloquea ni retrasa ninguna venta');
    const pauseValue = number(await dialog.locator('.anti-panic__metric strong').nth(1).innerText());
    expect(pauseValue).toBeCloseTo(dashboardValue, 1);
    await expect(dialog.getByRole('button', { name: 'Continuar en la demo' })).toBeVisible();
    const sell = dialog.getByRole('button', { name: /Continuar con la venta \(simulada, sin operación real\)/ });
    await expect(sell).toBeVisible();
    await sell.click();
    await expect(dialog).toBeHidden();
  });

  test('los gráficos no añaden paradas de tabulación sin nombre', async ({ page }) => {
    for (const level of LEVELS) {
      await openApp(page, { level });
      await goTo(page, 'portfolio');
      await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
      const stops = await page.locator('.recharts-wrapper [tabindex]:not([tabindex="-1"]), .recharts-wrapper svg[tabindex]:not([tabindex="-1"])').count();
      expect(stops, level).toBe(0);
    }
  });
});

test.describe('Diseño adaptable y contraste', () => {
  const views = ['home', 'portfolio', 'learn', 'simulator'] as const;

  test('sin desborde horizontal a 320 px en las cuatro vistas y los tres niveles', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 320, height: 800 });
    for (const level of LEVELS) for (const view of views) {
      await openApp(page, { level });
      if (view !== 'home') await goTo(page, view);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await page.waitForTimeout(250);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${view}/${level}`).toBeLessThanOrEqual(0);
    }
  });

  test('contraste AA del texto visible en las 6 combinaciones (Mi cartera y Educación)', async ({ page }) => {
    test.setTimeout(180_000);
    for (const theme of THEMES) for (const level of LEVELS) for (const view of ['portfolio', 'learn'] as const) {
      await openApp(page, { level, theme });
      await goTo(page, view);
      await page.waitForTimeout(400);
      const { failures, checked } = await lowContrast(page);
      expect(checked).toBeGreaterThan(40);
      expect(failures, `${view}/${level}/${theme}`).toEqual([]);
    }
  });
});
