import { test, expect } from '@playwright/test';

test('saved local mode stays offline until user connects and identifies the actual answer', async ({page}) => {
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode', 'local'));
 let healthCalls = 0, tutorCalls = 0;
 await page.route('**/api/health', route => {healthCalls++; return route.fulfill({json:{tutorProvider:'anthropic'}});});
 await page.route('**/api/tutor', route => {tutorCalls++; return route.fulfill({json:{text:'Respuesta IA',language:'es',mode:'api',provider:'anthropic',model:'claude-sonnet-test',intent:'general',sources:[]}});});
 await page.goto('/');
 await page.getByRole('button',{name:'Tu asistente',exact:true}).first().click();
 let panel = page.getByRole('dialog',{name:'Tu asistente'});
 await expect(panel).toContainText('MODO LOCAL');
 expect(healthCalls).toBe(0); expect(tutorCalls).toBe(0);
 await panel.getByRole('button',{name:'Conectar asistente con IA'}).click();
 await expect.poll(() => page.evaluate(() => localStorage.getItem('t2f-data-mode'))).toBe('server');
 panel = page.getByRole('dialog',{name:'Tu asistente'});
 await expect(panel.locator('.assistant-banner')).toContainText('Asistente con IA · Claude Sonnet');
 await panel.getByLabel('Tu pregunta').fill('Hola');
 await panel.getByRole('button',{name:'Enviar pregunta'}).click();
 await expect(panel).toContainText('Respuesta IA');
 await expect(panel.locator('.assistant-banner')).toContainText('claude-sonnet-test');
 expect(tutorCalls).toBe(1);
});

test('server rules and unavailable health do not claim AI', async ({page}) => {
 await page.route('**/api/health', route => route.fulfill({json:{tutorProvider:'server_rules'}}));
 await page.goto('/');
 await page.getByRole('button',{name:'Tu asistente',exact:true}).first().click();
 const panel=page.getByRole('dialog',{name:'Tu asistente'});
 await expect(panel.locator('.assistant-banner')).toHaveText('Explicaciones de demostración');
 await page.unroute('**/api/health');
 await page.route('**/api/health', route => route.fulfill({status:503,body:''}));
 await panel.getByRole('button',{name:'Cerrar asistente'}).click();
 await page.getByRole('button',{name:'Tu asistente',exact:true}).first().click();
 await expect(panel.locator('.assistant-banner')).toHaveText('Conexión al servidor no disponible');
});

test('a stalled health request reports unavailable after eight seconds', async ({page}) => {
 await page.clock.install();
 let release!: () => void;
 const gate = new Promise<void>(resolve => {release = resolve;});
 await page.route('**/api/health', async route => {await gate; await route.fulfill({json:{tutorProvider:'anthropic'}}).catch(() => {});});
 await page.goto('/');
 await page.getByRole('button',{name:'Tu asistente',exact:true}).first().click();
 const banner=page.locator('.assistant-banner');
 await expect(banner).toHaveText('Comprobando conexión…');
 await page.clock.fastForward(8000);
 await expect(banner).toHaveText('Conexión al servidor no disponible');
 release();
 await expect(banner).toHaveText('Conexión al servidor no disponible');
});

test('provider error keeps the question for retry without exposing server text', async ({page}) => {
 let calls = 0;
 await page.route('**/api/tutor', route => { calls++; return calls === 1
  ? route.fulfill({status:503,json:{error:{code:'tutor_provider_error',message:'private detail'}}})
  : route.fulfill({json:{text:'Respuesta recuperada',language:'es',mode:'api',provider:'anthropic',model:'claude-sonnet-test',intent:'general',sources:[]}}); });
 await page.goto('/');
 await page.getByRole('button',{name:'Tu asistente',exact:true}).first().click();
 const panel=page.getByRole('dialog',{name:'Tu asistente'});
 await panel.getByLabel('Tu pregunta').fill('¿Qué es un fondo?');
 await panel.getByRole('button',{name:'Enviar pregunta'}).click();
 await expect(panel.locator('.assistant-status')).toContainText('servicio de IA no está disponible');
 await expect(panel.getByLabel('Tu pregunta')).toHaveValue('¿Qué es un fondo?');
 await expect(panel).not.toContainText('private detail');
 await panel.getByRole('button',{name:'Enviar pregunta'}).click();
 await expect(panel).toContainText('Respuesta recuperada');
 expect(calls).toBe(2);
});

test('voice panel identifies invalid model response and retries the same question', async ({page}) => {
 let calls = 0;
 await page.route('**/api/tutor', route => {calls++; return calls === 1
  ? route.fulfill({status:503,json:{error:{code:'tutor_validation_error',message:'private detail'}}})
  : route.fulfill({json:{text:'Respuesta recuperada',language:'es',mode:'api',provider:'anthropic',model:'claude-sonnet-test',intent:'general',sources:[]}});});
 await page.goto('/');
 await page.getByRole('button',{name:'Hablar con IA'}).click();
 const panel=page.getByRole('region',{name:'Habla con tu asistente'});
 await panel.getByRole('button',{name:'Escribir'}).click();
 await panel.getByLabel('Escribe tu pregunta').fill('Pregunta de prueba');
 await panel.getByRole('button',{name:'Enviar'}).click();
 await expect(panel.getByRole('status')).toContainText('no se pudo validar');
 await expect(panel).toContainText('Pregunta de prueba');
 await panel.getByRole('button',{name:'Reintentar pregunta'}).click();
 await expect(panel.getByRole('button',{name:'Ver respuesta'})).toBeVisible();
 expect(calls).toBe(2);
});
