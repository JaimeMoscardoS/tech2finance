import { test, expect } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pickFund, reveal } from './journey';

const labels = {
 es: {home:'Inicio',explore:'Explorar',sim:'Simulador',portfolio:'Mi cartera',open:'Abrir asistente',askProduct:'Preguntar por este producto',question:'Tu pregunta',send:'Enviar pregunta',initial:'Importe inicial',monthly:'Aportación mensual',annual:'Aportación anual',period:'Tiempo de práctica',run:'Ver mi ejemplo',entity:'Entidad',instrument:'Instrumento',pause:'¿Te preocupa la caída?',context:'Añadir contexto (opcional)',liquidity:'¿Necesitas liquidez pronto? (opcional)',ask:'Preguntar al asistente'},
 en: {home:'Home',explore:'Explore',sim:'Simulator',portfolio:'My portfolio',open:'Open assistant',askProduct:'Ask about this product',question:'Your question',send:'Send question',initial:'Initial amount',monthly:'Monthly contribution',annual:'Annual contribution',period:'Practice period',run:'Show my example',entity:'Institution',instrument:'Instrument',pause:'Worried about the decline?',context:'Add context (optional)',liquidity:'Do you need cash soon? (optional)',ask:'Ask the assistant'},
} as const;
const questions = {
 es:['¿Qué es BancoT2F?','¿Qué condiciones tiene la cuenta de demo?','¿Cuánto cuesta este fondo?','¿Y eso está descontado?','¿Qué pérdida muestra el resultado?','¿Por qué ha caído?','¿Cuál fue la rentabilidad de 2022?','¿Por qué no puedo simularlo?','¿Qué ganaré el próximo año?','Necesito liquidez, ¿debo mantener?','¿Qué estoy viendo?','¿Todos los productos de la plataforma son de BancoT2F?'],
 en:['What is BancoT2F?','What are the demo account terms?','How much does this fund cost?','Is that deducted?','What loss does the result show?','Why did it fall?','What was the return of 2022?',"Why can't I simulate it?",'What will I earn next year?','I need liquidity; should I hold?','What am I seeing?','Are all products on the platform from BancoT2F?'],
};
const expectations = {
 es:[[/ficticia/i],[/0 EUR/i,/condiciones.*no están disponibles/i,/sin cuenta real/i],[/no hay información disponible/i],[/no hay información|no dispone|no puedo/i],[/744,62/,/-255,38/,/-25,54%/],[/causa.*desconocida/i,/no hay noticias/i],[/rentabilidad anual.*no está disponible/i],[/no tiene histórico/i],[/no permite predecir/i],[/necesitas liquidez/i,/decisión es tuya/i],[/catálogo/i,/Fondo monetario/i],[/otras entidades/i,/procedencia/i]],
 en:[[/fictional/i],[/EUR 0/i,/terms are unavailable/i,/no real account/i],[/not available/i],[/not available|do not have|cannot/i],[/744\.62/,/-255\.38/,/-25\.54%/],[/cause is unknown/i,/no verified news/i],[/annual return.*not available/i],[/no available history/i],[/not.*predictable/i],[/need liquidity/i,/decision is yours/i],[/catalogue/i,/Money market fund/i],[/other institutions/i,/provenance/i]],
};

for (const language of ['es','en'] as const) test(`GUI rehearsal ${language}: twelve grounded questions`, async ({page}) => {
 test.setTimeout(180_000);
 const t=labels[language], results: unknown[]=[];
 const destination=resolve('test-results/rehearsal',`gui-rehearsal-${language}.json`);
 await mkdir(resolve('test-results/rehearsal'),{recursive:true});
 const nav=async (name:string)=>page.getByRole('button',{name,exact:true}).click();
 const open=async()=>nav(t.open);
 const simulator=async()=>nav(t.sim);
 const selectExternal=async (bank:'bbva'|'caixabank', instrument:string)=>{await page.goto(bank==='bbva'?'http://127.0.0.1:5196/':'http://127.0.0.1:5194/');if(language==='en')await page.getByRole('button',{name:'English',exact:true}).click();await simulator();await pickFund(page,instrument);};
 const chooseFund=async()=>{await nav(t.explore);await page.locator('.beginner-guide select').last().selectOption('caixabank-monetario-estandar');await expect(page.locator('.beginner-card h2')).toContainText(language === 'es' ? 'Fondo monetario' : 'Money market fund');await open();};
 const runSimulation=async()=>{await simulator();await pickFund(page,'bbva-mi-inversion-bolsa-acumulacion');await page.getByLabel(t.initial).fill('1000');await page.getByLabel(t.monthly).fill('0');await page.getByLabel(t.period).fill('3');await reveal(page);await expect(page.locator('.sim-values')).toContainText(language==='es'?'744,62':'744.62');await open();};
 for(let i=0;i<12;i++) {
  let requestBody: any, answer='';
  try {
   if(i!==3){await page.goto('/');if(language==='en')await page.getByRole('button',{name:'English',exact:true}).click();await expect(page.locator('.connection-settings summary')).toContainText(language==='es'?'Servidor de demo':'Demo server');}
   if(i===0||i===1||i===8||i===11) await open();
   if(i===2||i===10) await chooseFund();
   if(i===4||i===5) await runSimulation();
   if(i===6){await selectExternal('caixabank','caixabank-monetario-estandar');await page.getByLabel(t.initial).fill('1000');await page.getByLabel(t.monthly).fill('0');await reveal(page);await expect(page.locator('.sim-values')).toContainText('999');await open();}
   if(i===7){await page.goto('http://127.0.0.1:5196/');if(language==='en')await page.getByRole('button',{name:'English',exact:true}).click();await nav(t.explore);await page.locator('.beginner-guide select').last().selectOption('bbva-mi-inversion-bolsa');await simulator();await expect(page.locator('input[name="jr-fund"][value="bbva-mi-inversion-bolsa"]')).toBeDisabled();await open();}
   if(i===9){await nav(t.portfolio);await page.getByRole('button',{name:t.pause}).click();const pause=page.getByRole('dialog',{name:language==='es'?'Tomemos un momento':'Let’s take a moment'});await expect(pause).toContainText(language==='es'?'25,54':'25.54');await pause.getByText(t.context).click();await pause.getByLabel(t.liquidity).selectOption('yes');await pause.getByRole('button',{name:t.ask}).click();}
   const input=page.getByLabel(t.question);await input.fill(questions[language][i]);
   const req=page.waitForRequest(r=>r.url().endsWith('/api/tutor') && r.method()==='POST');
   const res=page.waitForResponse(r=>r.url().endsWith('/api/tutor') && r.request().method()==='POST');
   await page.getByRole('button',{name:t.send}).click();requestBody=(await req).postDataJSON();const response=await res;expect(response.status()).toBe(200);const payload=await response.json();
   await expect(page.locator('.message.assistant').last()).toContainText(payload.text);answer=payload.text;
   for(const expected of expectations[language][i])expect(answer).toMatch(expected);
   if([2,3,10].includes(i))expect(requestBody.context.instrumentId).toBe('caixabank-monetario-estandar');
   if([4,5].includes(i))expect(requestBody.context.instrumentId).toBe('bbva-mi-inversion-bolsa-acumulacion');
   if(i===7)expect(requestBody.context.instrumentId).toBe('bbva-mi-inversion-bolsa');
   if(i===11){expect(requestBody.context.bankId).toBe('demo');expect(requestBody.context.instrumentId).toBeUndefined();}
   if(i===6)expect(requestBody.context.simulation.instrumentId).toBe('caixabank-monetario-estandar');
   if(i===3)expect(requestBody.history.length).toBeGreaterThanOrEqual(2);
   if(i===9)expect(requestBody.context.decision.needsLiquidity).toBe('yes');
   results.push({case:i+1,language,status:'PASS',question:questions[language][i],context:requestBody.context,answer});
  } catch(error){results.push({case:i+1,language,status:'FAIL',question:questions[language][i],context:requestBody?.context,answer,error:String(error)});throw error;}
  finally {await writeFile(destination,JSON.stringify(results,null,2)+'\n','utf8');}
 }
});
