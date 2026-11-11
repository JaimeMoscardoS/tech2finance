import type { Page } from '@playwright/test';

export type Level = 'beginner' | 'intermediate' | 'advanced';
export const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];
export const THEMES = ['light', 'dark'] as const;

/** Abre la aplicación con nivel, tema e idioma guardados (como lo haría el usuario) y modo de datos local. */
export async function openApp(page: Page, { level = 'beginner', theme = 'light', lang = 'es' }: { level?: Level; theme?: 'light' | 'dark'; lang?: 'es' | 'en' } = {}) {
  await page.goto('/');
  await page.evaluate(([l, t, g]) => {
    localStorage.setItem('t2f-data-mode', 'local');
    localStorage.setItem('t2f-level', l);
    localStorage.setItem('t2f-theme', t);
    localStorage.setItem('t2f-language', g);
  }, [level, theme, lang] as const);
  await page.reload();
  await page.waitForSelector(`html[data-level="${level}"][data-theme="${theme}"]`);
}

export const NAV = { es: { home: 'Inicio', portfolio: 'Mi cartera', learn: 'Educación', simulator: 'Simulador' }, en: { home: 'Home', portfolio: 'My portfolio', learn: 'Education', simulator: 'Simulator' } } as const;

export async function goTo(page: Page, view: 'home' | 'portfolio' | 'learn' | 'simulator', lang: 'es' | 'en' = 'es') {
  if (view === 'home') return;
  const item = page.getByRole('button', { name: NAV[lang][view], exact: true }).first();
  // En pantallas estrechas la navegación está en el menú lateral plegado.
  if (!(await item.isVisible())) await page.getByRole('button', { name: /Abrir menú|Open menu/ }).click();
  await item.click();
}
