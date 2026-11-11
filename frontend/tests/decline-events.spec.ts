import { test, expect } from '@playwright/test';

// El contexto del BCE acompaña a la serie de estudio `portfolio_demo` («ejemplo histórico»), que se abre con «Probar una caída»;
// la tarjeta «¿Te preocupa la caída?» analiza la cartera mostrada (NAV CNMV, `portfolio_cnmv`), que no está en caída actual.

const news = {status:'ready',provider:'ecb_archive',checkedAt:'2026-01-01T00:00:00Z',periodStart:'2019-12-31',periodEnd:'2020-03-31',items:[{id:'ecb-1',title:'Monetary policy decision',url:'https://www.ecb.europa.eu/press/pr/date/2020/html/ecb.pr200312.en.html',publisher:'ECB',publishedAt:'2020-03-12',excerpt:'A public document.',scope:'market_context'}],limitations:[]};
const event = (report:any, n:any = news) => ({schemaVersion:'1.0',status:'triggered',eventId:'event-1',thresholdPercent:5,report,news:n});

test('automatic historical event is quiet, deduplicated and presents dated ECB context', async ({page,request}) => {
 const report = await (await request.post('http://127.0.0.1:8111/api/declines',{data:{basis:'portfolio_demo',language:'es'}})).json();
 let calls=0;
 await page.route('**/api/decline-events',route=>{calls++; return route.fulfill({json:event(report)});});
 await page.route('**/api/decline-explanations',route=>route.fulfill({status:503}));
 await page.goto('/');
 await expect(page.getByText('Caída detectada en el ejemplo histórico',{exact:false}).first()).toBeVisible();
 expect(calls).toBe(1); await expect(page.getByRole('dialog')).toHaveCount(0);
 const card=page.getByRole('button',{name:/Probar una caída/}).first(); await card.click();
 const dialog=page.getByRole('dialog',{name:'Tomemos un momento'});
 const source=dialog.getByRole('link',{name:'Monetary policy decision'});
 await expect(source).toHaveAttribute('href',news.items[0].url); await expect(dialog).toContainText('2020-03-12');
 await expect(dialog).toContainText('Texto original en inglés'); await expect(dialog).toContainText('No se ha podido generar');
 await expect(dialog.locator('.anti-panic__metric').first()).toBeVisible();
 await dialog.getByRole('button',{name:'Cerrar',exact:true}).click(); await page.getByRole('button',{name:'Inicio',exact:true}).click(); await card.click();
 await expect(page.getByRole('dialog')).toBeVisible(); expect(calls).toBe(1);
});

test('invalid dates reject the whole event and retry preserves focus', async ({page,request}) => {
 const report=await (await request.post('http://127.0.0.1:8111/api/declines',{data:{basis:'portfolio_demo',language:'es'}})).json(); let calls=0;
 await page.route('**/api/decline-events',route=>{calls++; const item={...news.items[0],publishedAt:'2021-01-01'}; return route.fulfill({json:event(report,calls===1?{...news,items:[item]}:news)});});
 await page.goto('/'); const retry=page.getByRole('button',{name:/^(Reintentar|Actualizar contexto)$/}).first(); await expect(retry).toBeVisible();
 await retry.focus(); await page.keyboard.press('Enter'); await expect(page.getByText('Caída detectada en el ejemplo histórico',{exact:false}).first()).toBeVisible(); await expect(retry).toBeFocused(); expect(calls).toBe(2); await retry.click(); await expect.poll(()=>calls).toBe(3); await expect(retry).toBeFocused();
});

test('local mode makes no event or news requests', async ({page})=>{
 let calls=0; page.on('request',r=>{if (/\/api\/(decline-events|decline-explanations)/.test(r.url())) calls++;});
 await page.addInitScript(()=>localStorage.setItem('t2f-data-mode','local')); await page.goto('/');
 await page.getByRole('button',{name:/Probar una caída/}).first().click();
 await expect(page.getByText('Noticias no disponibles en la demo local.')).toBeVisible(); expect(calls).toBe(0);
});

test('insufficient observations accept an unavailable period without fabricating dates', async ({page,request})=>{
 const original=await (await request.post('http://127.0.0.1:8111/api/declines',{data:{basis:'portfolio_demo',language:'es'}})).json();
 const report={...original,status:'insufficient_data',latestLabel:null,latestValue:null,peakValue:null,currentDrawdownPercent:null,maxDrawdownPercent:null,episodes:[]};
 const unavailable={...news,status:'unavailable',periodStart:null,periodEnd:null,items:[]};
 await page.route('**/api/decline-events',route=>route.fulfill({json:{...event(report,unavailable),status:'not_triggered',eventId:null}}));
 await page.goto('/'); await expect(page.getByRole('button',{name:/¿Te preocupa la caída\?/}).first()).toBeVisible();
 await expect(page.getByText('No se pudo comprobar la caída y el contexto del BCE.')).toHaveCount(0);
});

test('late event news appears in an open pause even when analysis fails', async ({page,request})=>{
 const report=await (await request.post('http://127.0.0.1:8111/api/declines',{data:{basis:'portfolio_demo',language:'es'}})).json(); let release!:()=>void;
 const wait=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/decline-events',async route=>{await wait; await route.fulfill({json:event(report)});});
 await page.route('**/api/decline-explanations',route=>route.fulfill({status:503}));
 await page.goto('/'); await page.getByRole('button',{name:/Probar una caída/}).first().click();
 const dialog=page.getByRole('dialog',{name:'Tomemos un momento'}); await expect(dialog).toContainText('No se ha podido generar');
 release(); await expect(dialog.getByRole('link',{name:'Monetary policy decision'})).toBeVisible();
});
