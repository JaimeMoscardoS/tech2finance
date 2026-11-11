import { useEffect, useMemo, useRef, useState, type FormEvent, type RefObject } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { createLocalTutorProvider, suggestedQuestions, MAX_HISTORY_MESSAGES, MAX_MESSAGE_LENGTH, type TutorContext, type TutorReply, type TutorProvider } from "../../tutor-ia/src/index";
import VoiceControls from "./components/VoiceControls";
import { stopBrowserVoice } from "./voice/browser-voice";

type Message = { providerId: string; role: "user" | "assistant"; text: string; context: TutorContext; reply?: TutorReply };
type Props = { open: boolean; onClose: () => void; context: TutorContext; panelRef: RefObject<HTMLElement | null>; provider?: TutorProvider };
const words = {
 es: { title:"Tu asistente", subtitle:"Para ayudarte a entender", mode:"MODO LOCAL · RESPUESTAS POR REGLAS", hello:"Pregunta sobre la pantalla o el ejemplo que estás viendo.", input:"Tu pregunta", placeholder:"Escribe tu pregunta...", send:"Enviar pregunta", close:"Cerrar asistente", fund:"¿Qué es un fondo?", simulation:"¿Cómo funciona la simulación?", decline:"¿Qué significa esta caída?", pending:"Preparando respuesta local…", cancel:"Cancelar respuesta", error:"No se pudo preparar la respuesta. Puedes intentarlo de nuevo.", source:"Fuentes", limit:"Máximo 1500 caracteres.", reviewed:"El dictado se añade al texto para que puedas revisarlo antes de enviar." },
 en: { title:"Your assistant", subtitle:"Here to help you understand", mode:"LOCAL MODE · RULE-BASED RESPONSES", hello:"Ask about the screen or example you are viewing.", input:"Your question", placeholder:"Write your question...", send:"Send question", close:"Close assistant", fund:"What is a fund?", simulation:"How does the simulation work?", decline:"What does this decline mean?", pending:"Preparing local response…", cancel:"Cancel response", error:"The response could not be prepared. You can try again.", source:"Sources", limit:"Maximum 1500 characters.", reviewed:"Dictation is added to the text so you can review it before sending." },
} as const;

export default function AssistantPanel({ open, onClose, context, panelRef, provider: suppliedProvider }: Props) {
 const t=words[context.language];
 const localProvider=useMemo(()=>createLocalTutorProvider(),[]);
 const provider=suppliedProvider ?? localProvider;
 const [messages,setMessages]=useState<Message[]>([]);
 const [input,setInput]=useState("");
 const [pending,setPending]=useState(false);
 const [error,setError]=useState(false);
 const request=useRef<AbortController|null>(null);
 const generation=useRef(0);
 const contextKey=JSON.stringify(context) + provider.id;
 const cancel=()=>{generation.current++;request.current?.abort();request.current=null;setPending(false);};
 useEffect(()=>{cancel();setInput("");setError(false);stopBrowserVoice();return ()=>{generation.current++;request.current?.abort();stopBrowserVoice();};},[open,contextKey]);
 async function send(e:FormEvent){
  e.preventDefault(); const text=input.trim();
  if(!text || text.length>MAX_MESSAGE_LENGTH || pending)return;
  const snapshot=structuredClone(context); const history=messages.filter(item=>JSON.stringify(item.context)===JSON.stringify(context) && item.providerId===provider.id).slice(-MAX_HISTORY_MESSAGES).map(item=>({role:item.role,text:item.text,intent:item.reply?.intent}));
  const controller=new AbortController(); request.current=controller; const id=++generation.current;
  setMessages(previous=>[...previous,{providerId:provider.id,role:"user",text,context:snapshot}]);setInput("");setError(false);setPending(true);
  try { // El contrato del servidor aún solo admite home/explore/simulator/portfolio: learn se envía como home.
   const sent=provider.id==="local"||snapshot.page!=="learn"?snapshot:{...snapshot,page:"home" as const};
   const reply=await provider.reply({message:text,history,context:sent,signal:controller.signal});
   if(id===generation.current&&!controller.signal.aborted)setMessages(previous=>[...previous,{providerId:provider.id,role:"assistant",text:reply.text,context:snapshot,reply}]);
  } catch {if(id===generation.current&&!controller.signal.aborted)setError(true);}
  finally {if(id===generation.current){request.current=null;setPending(false);}}
 }
 if(!open)return null;
 const lastReply=[...messages].reverse().find(item=>item.role==="assistant");
 return <><button className="drawer-overlay" onClick={onClose} aria-label={t.close}/><aside ref={panelRef} className="assistant-panel" role="dialog" aria-modal="true" aria-label={t.title}>
  <div className="assistant-head"><div className="assistant-avatar"><Sparkles size={20}/></div><div><strong>{t.title}</strong><span>{t.subtitle}</span></div><button className="icon-button" onClick={onClose} aria-label={t.close}><X size={20}/></button></div>
  <div className="assistant-banner">{provider.id === "server_rules" ? (context.language === "es" ? "SERVIDOR DE DEMO · RESPUESTAS POR REGLAS" : "DEMO SERVER · RULE-BASED RESPONSES") : t.mode}</div>
  <div className="messages" aria-live="polite" tabIndex={0}><div className="message assistant"><p>{t.hello}</p></div>{messages.map((m,i)=><div key={i} lang={m.context.language} className={`message ${m.role}`}><div><p>{m.text}</p>{m.reply&&m.reply.sources.length>0&&<div className="message-sources">{t.source}: {m.reply.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}</div>}</div></div>)}</div>
  <div className="suggestions" role="group" aria-label={context.language==="es"?"Preguntas sugeridas":"Suggested questions"}>{suggestedQuestions(context.page,context.level,context.language,!!context.decline).map(q=><button key={q} type="button" onClick={()=>setInput(q)}>{q}</button>)}</div>
  <form className="chat-form" onSubmit={send}><label className="sr-only" htmlFor="chat-input">{t.input}</label><input id="chat-input" value={input} maxLength={MAX_MESSAGE_LENGTH} onChange={e=>setInput(e.target.value)} placeholder={t.placeholder}/><button type="submit" disabled={pending||!input.trim()} aria-label={t.send}><Send size={17}/></button></form>
  <p className="assistant-foot">{t.limit} {t.reviewed}</p><div className="assistant-voice"><VoiceControls text={lastReply?.text} language={context.language} speechLanguage={lastReply?.reply?.language??context.language} onTranscript={text=>setInput(previous=>(previous?`${previous} ${text}`:text).slice(0,MAX_MESSAGE_LENGTH))}/></div>
  <div className="assistant-status" role="status" aria-live="polite">{pending?(provider.id === "server_rules" ? (context.language === "es" ? "Preparando respuesta del servidor…" : "Preparing server response…") : t.pending):error?t.error:""}</div>{pending&&<button className="plain-link" onClick={cancel}>{t.cancel}</button>}
 </aside></>;
}
