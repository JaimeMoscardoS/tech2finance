import { test, expect } from '@playwright/test';

test('levels change appearance in both themes while chart meanings remain fixed', async ({page}) => {
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode','local'));
 await page.goto('/'); await page.getByRole('button',{name:'Explorar',exact:true}).click();
 const levels = page.getByRole('group',{name:'Nivel de detalle'});
 for (const theme of ['light','dark']) {
  if (theme === 'dark') await page.getByRole('button',{name:'Modo oscuro'}).click();
  const accents: string[] = [];
  for (const level of ['Principiante','Intermedio','Avanzado']) {
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
 await page.getByLabel('Entidad de la demo').selectOption('caixabank');
 await levels.getByRole('button',{name:'Intermedio',exact:true}).click();
 await expect(page.locator('.annual-row .negative')).toHaveCount(2);
 await expect(page.locator('.annual-row .positive')).toHaveCount(3);
 await expect(page.locator('.annual-row').first()).toContainText('-0,53');
});

test('chart uses the visible series direction and explains contributions', async ({page}) => {
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode','local'));
 await page.goto('/'); await page.getByRole('button',{name:'Mi cartera',exact:true}).click();
 const chart = page.locator('.large-portfolio .investment-chart');
 await expect(chart.getByText(/capital incluye aportaciones/)).toBeVisible();
 await expect(chart.locator('linearGradient stop[stop-color="var(--chart-rise)"]').first()).toBeAttached();
 await expect(chart.locator('linearGradient stop[stop-color="var(--chart-fall)"]').first()).toBeAttached();
 await page.screenshot({path:'/tmp/t2f-chart-colors.png',fullPage:true});
 await chart.getByText('Ver datos').click();
 await expect(chart.getByRole('columnheader',{name:'Cambio desde el punto anterior'})).toBeVisible();
 await expect(chart.getByRole('cell',{name:'Sube'}).first()).toBeVisible();
 await expect(chart.getByRole('cell',{name:'Baja'}).first()).toBeVisible();
 await chart.getByRole('button',{name:'Evolución del instrumento (%)'}).click();
 await expect(chart.getByText(/evolución acumulada del instrumento con el punto anterior/)).toBeVisible();
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

test('home destinations retain distinct readable backgrounds in all levels and themes', async ({page}) => {
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode','local'));
 await page.goto('/');
 for (const theme of ['light','dark']) {
  if (theme === 'dark') await page.getByRole('button',{name:'Modo oscuro'}).click();
  for (const [index, level] of ['Principiante','Intermedio','Avanzado'].entries()) {
   if (index > 0 || theme === 'dark') { await page.locator('.level-button').click(); await page.locator('.level-menu').getByRole('button',{name:level,exact:true}).click(); }
   const backgrounds = await page.locator('.action-grid .action-card').evaluateAll(cards => cards.map(card => getComputedStyle(card).backgroundColor));
   expect(new Set(backgrounds).size).toBe(3);
   const contrasts = await page.locator('.action-grid .action-card').evaluateAll(cards => {
    const luminance = (color: string) => color.match(/\d+/g)!.slice(0,3).map(Number).map(v => v/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4).reduce((sum,v,i) => sum + v * [.2126,.7152,.0722][i],0);
    return cards.flatMap(card => ['h3','p','span'].map(selector => { const bg = luminance(getComputedStyle(card).backgroundColor), fg = luminance(getComputedStyle(card.querySelector(selector)!).color); return (Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05); }));
   });
   for (const contrast of contrasts) expect(contrast).toBeGreaterThanOrEqual(4.5);
   if (index === 0) await page.screenshot({path:`/tmp/t2f-home-cards-${theme}.png`,fullPage:true});
  }
 }
});
