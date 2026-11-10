import { test, expect } from '@playwright/test';
test('three levels retain the fund and show available evidence', async ({page}) => {
 await page.addInitScript(() => localStorage.setItem('t2f-data-mode','local'));
 await page.goto('/'); await page.getByRole('button',{name:'Explorar',exact:true}).click();
 await expect(page.getByText('Para entender estos datos')).toBeVisible();
 await page.getByLabel('Entidad de la demo').selectOption('caixabank');
 await expect(page.getByText('Evolución anual publicada')).toBeVisible(); await expect(page.locator('.annual-row')).toHaveCount(5);
 await page.screenshot({path:'/tmp/t2f-funds-beginner.png',fullPage:true});
 await page.getByRole('group',{name:'Nivel de detalle'}).getByRole('button',{name:'Intermedio'}).click();
 await expect(page.getByText('Comparar y planificar')).toBeVisible(); await expect(page.getByText('Solo hay un fondo de esta entidad en el catálogo de la demo.')).toBeVisible();
 await page.screenshot({path:'/tmp/t2f-funds-intermediate.png',fullPage:true});
 await page.getByRole('group',{name:'Nivel de detalle'}).getByRole('button',{name:'Avanzado'}).click();
 await expect(page.getByText('ES0138045002')).toBeVisible(); await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(5);
 await page.screenshot({path:'/tmp/t2f-funds-advanced.png',fullPage:true});
 await page.getByRole('button',{name:'Preguntar por voz',exact:true}).click(); await expect(page.getByRole('dialog',{name:'Habla con tu asistente'})).toBeVisible(); await page.keyboard.press('Escape');
 await page.getByLabel('Entidad de la demo').selectOption('bbva'); await expect(page.getByRole('button',{name:'Practicar con este fondo'})).toBeDisabled(); await expect(page.getByText(/falta una serie histórica verificada/)).toBeVisible();
});
test('server tutor receives visible fund after non-fund selection', async ({page}) => {
 await page.goto('/'); await page.getByRole('button',{name:'Simulador',exact:true}).click(); await page.getByLabel('Tipo de activo').selectOption('etf');
 await page.getByRole('button',{name:'Explorar',exact:true}).click();
 await page.getByRole('button',{name:'Abrir asistente'}).click(); await page.locator('#chat-input').fill('¿Qué es este fondo?');
 const first = page.waitForRequest(req => req.url().endsWith('/api/tutor') && req.method() === 'POST'); await page.getByRole('button',{name:'Enviar pregunta'}).click();
 expect((await first).postDataJSON().context).toMatchObject({page:'explore',instrumentId:'demo-mixed'});
 await page.getByRole('dialog',{name:'Tu asistente'}).getByRole('button',{name:'Cerrar asistente'}).click();
 await page.getByLabel('Entidad de la demo').selectOption('caixabank'); await page.getByRole('button',{name:'Abrir asistente'}).click(); await page.locator('#chat-input').fill('¿Qué es este fondo?');
 const second = page.waitForRequest(req => req.url().endsWith('/api/tutor') && req.method() === 'POST'); await page.getByRole('button',{name:'Enviar pregunta'}).click();
 expect((await second).postDataJSON().context).toMatchObject({page:'explore',instrumentId:'caixabank-monetario-estandar'}); await expect(page.locator('.message.assistant').last()).toBeVisible();
});
test('mobile English dark view fits and retains advisor', async ({browser}) => {
 const context = await browser.newContext({viewport:{width:390,height:844}}); const page = await context.newPage(); await page.addInitScript(() => localStorage.setItem('t2f-data-mode','local'));
 await page.goto('/'); await page.getByRole('button',{name:'English'}).click(); await page.getByRole('button',{name:'Dark theme'}).click(); await page.getByRole('button',{name:'Open menu'}).click(); await page.getByRole('button',{name:'Explore',exact:true}).click();
 await page.getByRole('group',{name:'Detail level'}).getByRole('button',{name:'Advanced'}).click(); await expect(page.getByRole('button',{name:'Ask by voice'})).toBeVisible();
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy(); await page.screenshot({path:'/tmp/t2f-funds-mobile.png',fullPage:true}); await context.close();
});
