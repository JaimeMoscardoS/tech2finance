import { test, expect } from '@playwright/test';

for (const mode of ['local', 'server'] as const) for (const language of ['es', 'en'] as const) {
  test(`live decline: ${mode} ${language}`, async ({ page }) => {
    await page.addInitScript(({mode, language}) => { localStorage.setItem('t2f-data-mode', mode); localStorage.setItem('t2f-language', language); }, {mode, language});
    await page.goto('/');
    await page.getByRole('button', {name: language === 'es' ? 'Probar una caída' : 'Try a decline'}).click();
    const pause = page.getByRole('dialog', {name: language === 'es' ? 'Una pausa para comprender' : 'A moment to understand'});
    await expect(pause).toContainText(language === 'es' ? '13,10 %' : '13.10 %');
    await expect(pause).toContainText(language === 'es' ? 'supuesto narrativo' : 'narrative assumption');
    await pause.getByText(language === 'es' ? 'Ver contexto ilustrativo, sin noticias en directo' : 'View illustrative context, no live news').click();
    await expect(pause).toContainText(language === 'es' ? 'Mes 5' : 'Month 5');
    if (mode === 'server' && language === 'es') {
      await pause.screenshot({path:'test-results/live-demo-desktop.png'});
      await page.setViewportSize({width:320,height:800});
      await pause.screenshot({path:'test-results/live-demo-mobile.png'});
      await pause.locator('.anti-panic__story').screenshot({path:'test-results/live-demo-news.png'});
    }
    await pause.getByText(language === 'es' ? 'Tu contexto (opcional)' : 'Your context (optional)').click();
    await pause.getByLabel(language === 'es' ? '¿Necesitas liquidez pronto? (opcional)' : 'Do you need cash soon? (optional)').selectOption('yes');
    await pause.getByRole('button', {name: language === 'es' ? 'Preguntar al asistente' : 'Ask the assistant'}).click();
    const input = page.getByLabel(language === 'es' ? 'Tu pregunta' : 'Your question');
    await input.fill(language === 'es' ? '¿Por qué ha caído?' : 'Why did it fall?');
    await page.getByRole('button',{name:language === 'es' ? 'Enviar pregunta' : 'Send question'}).click();
    await expect(page.locator('.message.assistant').last()).toContainText(language === 'es' ? 'supuesto narrativo' : 'narrative assumption');
    if (mode === 'server' && language === 'es') await page.locator('.message.assistant').last().screenshot({path:'test-results/live-demo-answer.png'});
    await input.fill(language === 'es' ? 'Necesito liquidez, ¿debo mantener?' : 'I need liquidity, should I hold?');
    await page.getByRole('button',{name:language === 'es' ? 'Enviar pregunta' : 'Send question'}).click();
    await expect(page.locator('.message.assistant').last()).toContainText(language === 'es' ? 'decisión es tuya' : 'decision is yours');
  });
}

test('retry resumes the guided decline after a server error', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('t2f-data-mode', 'server'); localStorage.setItem('t2f-language', 'es'); });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.route('**/api/simulations', async route => {
    await route.fulfill({status:503, contentType:'application/json', body:'{}'});
  }, {times:1});
  await page.getByRole('button',{name:'Probar una caída'}).click();
  await expect(page.getByRole('status').filter({hasText:'No se pudo completar la solicitud'})).toBeVisible();
  await page.getByRole('button',{name:'Reintentar'}).click();
  const pause = page.getByRole('dialog',{name:'Una pausa para comprender'});
  await expect(pause).toContainText('13,10 %');
  await expect(pause).toContainText('supuesto narrativo');
  await pause.getByText('Ver contexto ilustrativo, sin noticias en directo').click();
  await expect(pause).toContainText('Subida inesperada de tipos');
});
