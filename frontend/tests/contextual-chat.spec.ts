import { expect, test } from '@playwright/test';
import { startJourney } from './journey';

for (const language of ['es', 'en'] as const) {
  test(`result question is editable and sent only on request (${language})`, async ({ page }) => {
    const requests: Record<string, any>[] = [];
    page.on('request', request => {
      if (request.url().endsWith('/api/tutor') && request.method() === 'POST') requests.push(request.postDataJSON());
    });
    await page.goto('/');
    if (language === 'en') await page.getByRole('button', { name: 'English' }).click();
    await page.getByRole('button', { name: language === 'es' ? 'Simulador' : 'Simulator', exact: true }).click();
    await startJourney(page);
    const trigger = page.getByRole('button', { name: language === 'es' ? 'Explícame este resultado' : 'Explain this result' });
    const question = language === 'es' ? '¿Qué significa este resultado?' : 'What does this result mean?';
    await trigger.click();
    const input = page.locator('#chat-input');
    await expect(input).toHaveValue(question);
    await expect(input).toBeFocused();
    expect(requests).toHaveLength(0);
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(input).toHaveValue(question);
    await expect(input).toBeFocused();
    const request = page.waitForRequest(r => r.url().endsWith('/api/tutor') && r.method() === 'POST');
    await page.getByRole('button', { name: language === 'es' ? 'Enviar pregunta' : 'Send question' }).click();
    const body = (await request).postDataJSON();
    expect(body.message).toBe(question);
    expect(body.context.page).toBe('simulator');
    expect(body.context.instrumentId).toBe('caixabank-monetario-estandar');
    expect(body.context.simulation.instrumentId).toBe('caixabank-monetario-estandar');
    expect(body.context.simulation).not.toHaveProperty('finalValue');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: language === 'es' ? 'Abrir asistente' : 'Open assistant' }).click();
    await expect(input).toHaveValue('');
  });
}
