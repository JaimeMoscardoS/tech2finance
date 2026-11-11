import { expect, type Page } from '@playwright/test';

export const CAIXA = 'caixabank-monetario-estandar';
export const BBVA = 'bbva-mi-inversion-bolsa-acumulacion';
export const SANTANDER = 'santander-rf-ahorro';

/** Step 1: choose a fund card (native radio inside the radiogroup). */
export async function pickFund(page: Page, id = CAIXA) {
  // While step 3 is active step 1 is collapsed to the chosen fund: expand it to change the fund.
  if (!(await page.locator(`input[name="jr-fund"][value="${id}"]`).count())) await page.getByRole('button', { name: /^(Cambiar fondo|Change fund)$/ }).click();
  await page.locator(`input[name="jr-fund"][value="${id}"]`).check();
  await expect(page.locator(`input[name="jr-fund"][value="${id}"]`)).toBeChecked();
}

/** Step 2: answer the prediction question, which reveals the result. */
export async function reveal(page: Page, answer: RegExp | string = /^(Más o menos lo mismo|About the same)$/) {
  await page.getByRole('button', { name: answer }).first().click();
}

/** Choose a fund and reveal the step 2 result with the current amounts. */
export async function startJourney(page: Page, id = CAIXA) {
  await pickFund(page, id);
  await reveal(page);
}

/**
 * Step 3: lives the whole replay (skipping every question) until the final summary is shown.
 * The final value of step 2 is only revealed there, so tests that check it call this first.
 */
export async function finishReplay(page: Page) {
  const tm = page.locator('#jr-step-3 .tm');
  const summary = tm.locator('.tm-summary');
  for (let i = 0; i < 400 && !(await summary.count()); i++) {
    const skip = tm.getByRole('button', { name: /^(Seguir sin responder|Continue without answering)$/ });
    if (await skip.count()) { await skip.click(); continue; }
    const next = tm.getByRole('button', { name: /^(Siguiente mes|Next month)$/ });
    if (await next.count() && (await next.getAttribute('aria-disabled')) !== 'true') await next.click();
    else await page.waitForTimeout(40);
  }
  await expect(summary).toBeVisible();
}

/** Choose a fund, answer the prediction and live the replay to the end. */
export async function startAndFinish(page: Page, id = CAIXA) {
  await startJourney(page, id);
  await finishReplay(page);
}
