import { expect, type Page } from '@playwright/test';

export const CAIXA = 'caixabank-monetario-estandar';
export const BBVA = 'bbva-mi-inversion-bolsa-acumulacion';
export const SANTANDER = 'santander-rf-ahorro';

/** Step 1: choose a fund card (native radio inside the radiogroup). */
export async function pickFund(page: Page, id = CAIXA) {
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
