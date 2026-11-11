import { test, expect } from '@playwright/test';

test('the chart picker is compact and keyboard accessible without losing selections', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/');
  await page.getByRole('button', {name: 'Explorar', exact: true}).click();
  await page.getByRole('group', {name: 'Nivel de detalle'}).getByRole('button', {name: 'Avanzado'}).click();
  const details = page.locator('.chart-picker-disclosure');
  await expect(details).not.toHaveAttribute('open', '');
  await expect(details.locator('summary')).toContainText('(3)');
  await details.locator('summary').focus(); await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  await expect(details.locator('input:checked')).toHaveCount(3);
  await details.locator('input:checked').first().uncheck();
  await expect(details.locator('summary')).toContainText('(2)');
});

test('the portfolio provides a prominent review entry', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/'); await page.getByRole('button', {name: 'Mi cartera', exact: true}).click();
  const button = page.getByRole('button', {name: /¿Te preocupa la caída\? Revísala con calma/});
  await expect(button).toBeVisible(); expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(56);
  await button.click(); await expect(page.getByRole('dialog')).toBeVisible();
});

test('header text and controls remain legible through level and theme changes', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.goto('/');
  for (const theme of ['light', 'dark']) for (const level of ['beginner', 'intermediate', 'advanced']) {
    await page.evaluate(([t,l]) => { document.documentElement.dataset.theme=t; document.documentElement.dataset.level=l; }, [theme,level]);
    const failures = await page.locator('.topbar').evaluate(bar => {
      const rgb = (c: string) => { const m=c.match(/[\d.]+/g); return m ? m.slice(0,3).map(Number).map(n => c.startsWith('color(') ? n*255 : n) : [0,0,0]; };
      const lum = (c: number[]) => c.map(n => n/255).map(n => n <= .04045 ? n/12.92 : ((n+.055)/1.055)**2.4).reduce((s,n,i) => s+n*[.2126,.7152,.0722][i],0);
      const ratio = (a: number[], b: number[]) => (Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
      const bg=rgb(getComputedStyle(bar).backgroundColor);
      return [...bar.querySelectorAll('.breadcrumb, .breadcrumb strong, .demo-badge, .preference-button, .icon-button, .level-button')].filter(e => {
        const style=getComputedStyle(e); if(style.display==='none' || !(e as HTMLElement).offsetWidth) return false;
        const own=style.backgroundColor; const under=own==='rgba(0, 0, 0, 0)' ? bg : rgb(own);
        return ratio(rgb(style.color),under)<4.5;
      }).map(e => `${e.outerHTML.slice(0,150)} color=${getComputedStyle(e).color} bg=${getComputedStyle(e).backgroundColor}`);
    });
    expect(failures, `${theme}/${level}`).toEqual([]);
  }
});

test('navigation cancels a pending portfolio decline request', async ({page}) => {
  let release!: () => void, requested!: () => void;
  const gate = new Promise<void>(resolve => {release=resolve;});
  const seen = new Promise<void>(resolve => {requested=resolve;});
  await page.route('**/api/declines', async route => {requested(); await gate; try {await route.continue();} catch {} });
  await page.goto('/'); await page.getByRole('button', {name:'Mi cartera',exact:true}).click();
  await page.getByRole('button', {name:/¿Te preocupa la caída\? Revísala con calma/}).click();
  await seen; await page.getByRole('button', {name:'Simulador',exact:true}).click(); release();
  await expect(page.getByRole('dialog', {name:'Tomemos un momento'})).toHaveCount(0);
});
