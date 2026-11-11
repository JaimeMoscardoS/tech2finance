import { test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const shots = 'test-results/review-shots';
for (const [label, viewport] of Object.entries({desktop:{width:1280,height:800}, mobile:{width:320,height:700}, landscape:{width:568,height:320}})) {
 test(`visual evidence ${label}`, async ({browser}) => {
  const context=await browser.newContext({viewport}); await context.addInitScript(()=>{localStorage.setItem('t2f-data-mode','local');localStorage.setItem('t2f-theme','dark');});
  const page=await context.newPage(); await page.goto('/'); mkdirSync(shots,{recursive:true});
  if(label !== 'desktop') await page.getByRole('button',{name:'Abrir menú'}).click();
  await page.getByRole('button',{name:'Mi cartera',exact:true}).click();
  await page.getByRole('button',{name:'¿Te preocupa la caída? Revísala con calma'}).click(); await page.getByRole('dialog',{name:'Tomemos un momento'}).waitFor();
  await page.screenshot({path:`${shots}/pause-${label}.png`});
  await page.getByRole('dialog',{name:'Tomemos un momento'}).getByRole('button',{name:'Cerrar',exact:true}).click();
  await page.getByRole('button',{name:'Hablar con IA'}).click();
  await page.getByRole('region',{name:'Habla con tu asistente'}).waitFor(); await page.screenshot({path:`${shots}/voice-${label}.png`});
  await context.close();
 });
}
