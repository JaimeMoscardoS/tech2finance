import { test, expect } from '@playwright/test';
import { openApp } from './helpers/app';

test('levels change appearance in both themes while chart meanings remain fixed', async ({page}) => {
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode','local'));
 await page.goto('/'); await page.getByRole('button',{name:'Explorar',exact:true}).click();
 const levels = page.getByRole('group',{name:'Nivel de detalle'});
 for (const theme of ['light','dark']) {
  if (theme === 'dark') await page.getByRole('button',{name:'Modo oscuro'}).click();
  const accents: string[] = [];
  for (const level of ['Básico','Intermedio','Avanzado']) {
   await levels.getByRole('button',{name:level,exact:true}).click();
   accents.push(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()));
   const contrast = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const rgb = (color: string) => { const el = document.createElement('span'); el.style.color = color; document.body.appendChild(el); const result = getComputedStyle(el).color.match(/\d+/g)!.slice(0,3).map(Number); el.remove(); return result; };
    const luminance = (c: number[]) => c.map(x => x / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4).reduce((sum,x,i) => sum + x * [0.2126,0.7152,0.0722][i],0);
    const ratio = (a: string,b: string) => { const x = luminance(rgb(a)), y = luminance(rgb(b)); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
    const active = getComputedStyle(document.querySelector('.fund-level button[aria-pressed="true"]')!);
    const preference = getComputedStyle(document.querySelector('.preference-button.selected')!);
    return {button:ratio(active.color,active.backgroundColor), preference:ratio(preference.color,preference.backgroundColor), rise:ratio(root.getPropertyValue('--chart-rise'),root.getPropertyValue('--surface')), fall:ratio(root.getPropertyValue('--chart-fall'),root.getPropertyValue('--surface')), flat:ratio(root.getPropertyValue('--chart-flat'),root.getPropertyValue('--surface'))};
   });
   expect(contrast.button).toBeGreaterThanOrEqual(4.5); expect(contrast.preference).toBeGreaterThanOrEqual(4.5);
   expect(contrast.rise).toBeGreaterThanOrEqual(3); expect(contrast.fall).toBeGreaterThanOrEqual(3); expect(contrast.flat).toBeGreaterThanOrEqual(3);

   await page.screenshot({path:`/tmp/t2f-colors-${theme}-${level}.png`});
  }
  expect(new Set(accents).size).toBe(3);
 }
 await page.goto('http://127.0.0.1:5177/'); await page.getByRole('button',{name:'Explorar',exact:true}).click();
 await levels.getByRole('button',{name:'Intermedio',exact:true}).click();
 await expect(page.locator('.annual-row .negative')).toHaveCount(2);
 await expect(page.locator('.annual-row .positive')).toHaveCount(3);
 await expect(page.locator('.annual-row').first()).toContainText('-0,53');
});

test('Mi cartera chart: area gradient, DEMO label, data table alternative and no unnamed tab stops', async ({page}) => {
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode','local'));
 await page.goto('/'); await page.getByRole('button',{name:'Mi cartera',exact:true}).click();
 const chart = page.locator('.dash-evo').first();
 await expect(chart.locator('.dash-demo').first()).toBeVisible();
 await expect(chart.locator('linearGradient stop[stop-color="var(--chart-line)"]').first()).toBeAttached();
 await expect(chart.locator('.dash-evo__last')).toContainText('€');
 // El gráfico es una imagen con nombre; la alternativa es la tabla de datos y no hay paradas de tabulación dentro del SVG.
 await expect(chart.locator('.dash-evo__plot')).toHaveAttribute('role','img');
 expect(await chart.locator('.dash-evo__plot [tabindex]:not([tabindex="-1"])').count()).toBe(0);
 await chart.getByText('Ver datos del gráfico').click();
 await expect(chart.getByRole('columnheader',{name:'Punto'})).toBeVisible();
 expect(await chart.locator('tbody tr').count()).toBeGreaterThan(3);
});

test('flat series stays visible with a neutral line and explicit labels', async ({page}) => {
 await page.goto('/tests/fixtures/chart.html');
 const line = page.locator('.recharts-line-curve').first();
 await expect(line).toHaveAttribute('stroke','var(--chart-flat)');
 expect(await line.evaluate(el => getComputedStyle(el).stroke)).not.toBe("none");
 await page.screenshot({path:"/tmp/t2f-flat.png"});
 await page.getByText('View data').click();
 await expect(page.getByRole('cell',{name:'No change'})).toHaveCount(2);
});


test('single observation shows a neutral point', async ({page}) => {
 await page.goto('/tests/fixtures/chart.html?single');
 await expect(page.locator('.recharts-line-dots circle').first()).toBeVisible();
 await page.getByText('View data').click();
 await expect(page.getByRole('cell',{name:'Starting point'})).toBeVisible();
});

test('home destination cards use the neutral surface and readable text in all levels and themes', async ({page}) => {
 for (const theme of ['light','dark'] as const) {
  for (const level of ['beginner','intermediate','advanced'] as const) {
   await openApp(page, {level, theme});
   const cards = page.locator('.home__service');
   await expect(cards).toHaveCount(5);
   const backgrounds = await cards.evaluateAll(els => els.map(el => getComputedStyle(el).backgroundColor));
   expect(new Set(backgrounds).size).toBe(1);
   const surface = await page.evaluate(() => { const probe = document.createElement('div'); probe.style.background = 'var(--surface)'; document.body.appendChild(probe); const c = getComputedStyle(probe).backgroundColor; probe.remove(); return c; });
   expect(backgrounds[0]).toBe(surface);
   const contrasts = await cards.evaluateAll(els => {
    const luminance = (color: string) => color.match(/\d+/g)!.slice(0,3).map(Number).map(v => v/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4).reduce((sum,v,i) => sum + v * [.2126,.7152,.0722][i],0);
    return els.flatMap(card => ['strong','span'].filter(selector => card.querySelector(selector)).map(selector => { const bg = luminance(getComputedStyle(card).backgroundColor), fg = luminance(getComputedStyle(card.querySelector(selector)!).color); return (Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05); }));
   });
   for (const contrast of contrasts) expect(contrast).toBeGreaterThanOrEqual(4.5);
  }
 }
});
