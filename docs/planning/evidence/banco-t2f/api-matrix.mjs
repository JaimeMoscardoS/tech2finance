import { writeFile } from 'node:fs/promises';
const root = 'http://127.0.0.1:8097';
const mixed = {instrumentId:'demo-mixed', initial:1000, recurringContribution:0, periods:6};
const caixa = {instrumentId:'caixabank-monetario-estandar', initial:1000, recurringContribution:0, periods:5};
const cases = [
 ['home',{},'¿Qué es BancoT2F?','What is BancoT2F?'],
 ['home',{},'¿Qué condiciones tiene la cuenta de demo?','What are the demo account terms?'],
 ['explore',{instrumentId:'demo-mixed'},'¿Cuánto cuesta este fondo?','How much does this fund cost?'],
 ['explore',{instrumentId:'demo-mixed'},'¿Y eso está descontado?','Is that deducted?'],
 ['simulator',{instrumentId:'demo-mixed',simulation:mixed},'¿Qué pérdida muestra el resultado?','What loss does the result show?'],
 ['simulator',{instrumentId:'demo-mixed',simulation:mixed},'¿Por qué ha caído?','Why did it fall?'],
 ['simulator',{instrumentId:'caixabank-monetario-estandar',simulation:caixa},'¿Cuál fue la rentabilidad de 2022?','What was the return of 2022?'],
 ['explore',{instrumentId:'bbva-mi-inversion-bolsa'},'¿Por qué no puedo simularlo?',"Why can't I simulate it?"],
 ['home',{},'¿Qué ganaré el próximo año?','What will I earn next year?'],
 ['portfolio',{decision:{needsLiquidity:'yes'},decline:{basis:'portfolio_demo'}},'Necesito liquidez, ¿debo mantener?','I need liquidity; should I hold?'],
 ['explore',{instrumentId:'demo-mixed'},'¿Qué estoy viendo?','What am I seeing?'],
 ['explore',{instrumentId:'bbva-mi-inversion-bolsa'},'¿Todos los productos son de BancoT2F?','Are all products from BancoT2F?'],
];
const output=[];
for (const language of ['es','en']) {
 let previous;
 for (let i=0;i<cases.length;i++) {
  const [page,extra,es,en]=cases[i];
  const message=language==='es'?es:en;
  const context={page,level:'beginner',language,bankId:'demo',...extra};
  if (context.decline) context.decline={...context.decline,language};
  const history=i===3 && previous ? [{role:'user',text:previous.message},{role:'assistant',text:previous.response.text,intent:previous.response.intent}] : [];
  const request={message,history,context};
  const res=await fetch(root+'/api/tutor',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(request)});
  const response=await res.json(); output.push({case:i+1,language,request,httpStatus:res.status,response,assessment:'pending'});
  if(i===2) previous={message,response};
 }
}
await writeFile(new URL('./api-matrix.json',import.meta.url),JSON.stringify(output,null,2)+'\n','utf8');
for(const row of output) console.log(`${row.case} ${row.language} HTTP ${row.httpStatus}: ${row.response.text ?? JSON.stringify(row.response)}`);
