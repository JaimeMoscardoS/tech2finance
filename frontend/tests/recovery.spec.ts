import { test, expect } from '@playwright/test';
import path from 'node:path';

test('error recovery supports preferences, keyboard and retry', async ({ page }) => {
  let allow = false;
  await page.route('**/api/catalog', async route => { if (!allow) await route.abort(); else await route.continue(); });
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('No se pudo cargar');
  await page.screenshot({path: path.resolve('test-results/recovery-desktop.png'), fullPage: true});
  await page.getByRole('button', {name: 'EN English'}).click();
  await expect(page.getByRole('status')).toContainText('could not be loaded');
  await expect(page.getByRole('button', {name: 'Retry'})).toBeVisible();
  await page.getByRole('button', {name: 'ES Español'}).click();
  await expect(page.getByRole('status')).toContainText('No se pudo cargar');
  await page.getByRole('button', {name: 'EN English'}).click();
  await page.getByRole('button', {name: 'Use dark theme'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', {name: 'Retry'}).focus();
  allow = true;
  await page.keyboard.press('Enter');
  await expect(page.locator('.app-shell')).toBeVisible();
  await expect(page.locator('main.main')).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('mobile loading permits explicit local choice and ignores late catalog', async ({ page }) => {
  await page.setViewportSize({width: 320, height: 700});
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const settled: Promise<void>[] = [];
  await page.route('**/api/catalog', route => { const done = (async () => { await gate; await route.abort().catch(() => {}); })(); settled.push(done); return done; });
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('Preparando tu espacio');
  await page.screenshot({path: path.resolve('test-results/recovery-mobile.png'), fullPage: true});
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.getByRole('button', {name:'Usar demo local'}).click();
  await expect(page.locator('.app-shell')).toBeVisible();
  release();
  await Promise.all(settled);
  await expect(page.getByText('Demo local', {exact:true})).toBeVisible();
  await expect(page.locator('main.main')).toBeFocused();
});

test('returning from local to unavailable server never displays local content as server', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
  await page.route('**/api/catalog', route => route.abort());
  await page.goto('/');
  await expect(page.getByText('Demo local', {exact:true})).toBeVisible();
  await page.getByRole('button', {name:'Usar servidor de demo'}).click();
  await expect(page.getByRole('status')).toContainText('No se pudo cargar');
  await expect(page.locator('.app-shell')).toHaveCount(0);
});

test('late successful catalog cannot replace a local choice', async ({page}) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const settled: Promise<void>[] = [];
  await page.route('**/api/catalog', route => { const done = (async () => {
    try { const response = await route.fetch(); await gate; await route.fulfill({response}); } catch {}
  })(); settled.push(done); return done; });
  await page.goto('/');
  await page.getByRole('button', {name:'Usar demo local'}).click();
  await expect(page.getByText('Demo local', {exact:true})).toBeVisible();
  release();
  await Promise.all(settled);
  await expect(page.getByText('Demo local', {exact:true})).toBeVisible();
});

test('focus in preferences moves to main when delayed catalog succeeds', async ({page}) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/catalog', async route => { try { const response = await route.fetch(); await gate; await route.fulfill({response}); } catch {} });
  await page.goto('/');
  await page.getByRole('button', {name:'EN English'}).click();
  await page.getByRole('button', {name:'Use dark theme'}).focus();
  release();
  await expect(page.locator('main.main')).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('lang','en');
});

test('mobile error recovery fits and is captured', async ({page}) => {
  await page.setViewportSize({width:320,height:700});
  await page.route('**/api/catalog', route => route.abort());
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('No se pudo cargar');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.screenshot({path:path.resolve('test-results/recovery-mobile-error.png'),fullPage:true});
});

test('switching mode cancels an in-flight simulation', async ({page}) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let started!: () => void;
  const startedRequest = new Promise<void>(resolve => { started = resolve; });
  const settled: Promise<void>[] = [];
  await page.route('**/api/simulations', async route => {
    if (route.request().postDataJSON().initial === 123) { const done = (async () => { started(); try { const response = await route.fetch(); await gate; await route.fulfill({response}); } catch {} })(); settled.push(done); await done; }
    else await route.continue();
  });
  await page.goto('/');
  await page.getByRole('button',{name:'Simulador',exact:true}).click();
  await page.getByLabel('Importe inicial').fill('123');
  await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
  await startedRequest;
  await page.getByRole('button',{name:'Usar demo local'}).click();
  await expect(page.getByText('Demo local',{exact:true})).toBeVisible();
  release();
  await Promise.all(settled);
  await expect(page.getByText('Demo local',{exact:true})).toBeVisible();
});

test('changed inputs invalidate a failed simulation retry', async ({page}) => {
  let count = 0;
  await page.route('**/api/simulations', async route => { count++; await route.abort(); });
  await page.goto('/');
  await page.getByRole('button',{name:'Simulador',exact:true}).click();
  await page.getByLabel('Importe inicial').fill('123');
  await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
  await expect(page.getByRole('button',{name:'Reintentar'})).toBeVisible();
  await page.getByLabel('Importe inicial').fill('456');
  await expect(page.getByRole('button',{name:'Reintentar'})).toHaveCount(0);
  const before = count;
  await page.getByRole('button',{name:'Usar demo local'}).click();
  await expect(page.getByText('Demo local',{exact:true})).toBeVisible();
  expect(count).toBe(before);
});
