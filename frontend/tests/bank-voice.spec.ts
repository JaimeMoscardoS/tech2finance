import { test, expect } from '@playwright/test';

test('voice keeps only the current open session history and does not restart listening', async ({page}) => {
 await page.addInitScript(() => {
  const state: any = {starts:0,recognition:null};
  (window as any).bankVoice = state;
  class Recognition {
   static async available() { return 'available'; }
   processLocally=false; lang=''; continuous=false; interimResults=false;
   onstart:any; onend:any; onresult:any;
   start() { state.starts++; state.recognition=this; this.onstart?.(); }
   abort() {} stop() { this.onend?.(); }
  }
  class Utterance { voice:any; lang=''; onstart:any; onend:any; constructor(public text:string) {} }
  Object.defineProperty(window,'SpeechRecognition',{value:Recognition,configurable:true});
  Object.defineProperty(window,'SpeechSynthesisUtterance',{value:Utterance,configurable:true});
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{paused:false,cancel(){},resume(){},addEventListener(){},removeEventListener(){},getVoices:()=>[{localService:true,lang:'es-ES'}],speak(u:Utterance){u.onstart?.();u.onend?.();}}});
 });
 const requests:any[] = [];
 await page.route('**/api/tutor', async route => { requests.push(route.request().postDataJSON()); await route.fulfill({json:{text:'Respuesta de prueba',language:'es',mode:'api',provider:'server_rules',intent:'bank_fees',sources:[]}}); });
 await page.goto('/');
 await page.getByRole('button',{name:'Hablar con IA'}).click();
 const dialog = page.getByRole('dialog',{name:'Habla con tu asistente'});
 const dictate = async (text:string) => {
  await page.evaluate((value) => { const r=(window as any).bankVoice.recognition; r.onresult({resultIndex:0,results:[{isFinal:true,0:{transcript:value}}]});r.onend(); },text);
  await expect(dialog.getByText('Respuesta de prueba')).toBeVisible();
 };
 await expect.poll(()=>page.evaluate(()=>(window as any).bankVoice.starts)).toBe(1);
 await dictate('¿Qué es BancoT2F?');
 expect(requests[0].history).toEqual([]);
 await dialog.getByRole('button',{name:'Hablar',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).bankVoice.starts)).toBe(2);
 await dictate('¿Y cuánto cuesta?');
 expect(requests[1].history).toHaveLength(2);
 expect(requests[1].history[0].text).toBe('¿Qué es BancoT2F?');
 expect(await page.evaluate(()=>(window as any).bankVoice.starts)).toBe(2);
 await page.getByRole('button',{name:'Explorar',exact:true,includeHidden:true}).evaluate((button:HTMLElement)=>button.click());
 await dialog.getByRole('button',{name:'Hablar',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).bankVoice.starts)).toBe(3);
 await dictate('¿Qué producto veo?');
 expect(requests[2].history).toEqual([]);
 expect(requests[2].context.page).toBe('explore');
 await expect(page.locator('.beginner-card h2')).toContainText('T2F Equilibrio');
 expect(requests[2].context.instrumentId).toBe('demo-mixed');
 expect(requests[2].context.simulation).toBeUndefined();
 await dialog.getByRole('button',{name:'Cerrar asistente de voz'}).click();
 await page.locator('.beginner-guide select').last().selectOption('demo-equity');
 await expect(page.locator('.beginner-card h2')).toContainText('T2F Horizonte');
 await page.getByRole('button',{name:'Hablar con IA'}).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).bankVoice.starts)).toBe(4);
 await dictate('Otra pregunta');
 expect(requests[3].history).toEqual([]);
 expect(requests[3].context.instrumentId).toBe('demo-equity');
 expect(requests[3].context.simulation).toBeUndefined();
});
