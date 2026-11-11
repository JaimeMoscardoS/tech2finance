import { useEffect, useMemo, useRef, useState, type FormEvent, type RefObject } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { createLocalTutorProvider, suggestedQuestions, MAX_HISTORY_MESSAGES, MAX_MESSAGE_LENGTH, type TutorContext, type TutorReply, type TutorProvider } from "../../tutor-ia/src/index";
import VoiceControls from "./components/VoiceControls";
import { cancelDictation } from "./voice/dictation";
import { replyOrigin } from "./reply-origin";
import { tutorStatusLabel, useTutorStatus } from "./tutor-status";
import { tutorErrorMessage } from "./server-api";

type Message = { providerId: string; role: "user" | "assistant"; text: string; context: TutorContext; reply?: TutorReply };
type Props = { open: boolean; onClose: () => void; context: TutorContext; panelRef: RefObject<HTMLElement | null>; provider?: TutorProvider; dataMode?: "local" | "server"; onUseServer?: () => void; prefillRequest?: { id: number; text: string } };
const words = {
 es: { title:"Tu asistente", subtitle:"Para ayudarte a entender", mode:"MODO LOCAL · RESPUESTAS POR REGLAS", hello:"Pregunta sobre la pantalla o el ejemplo que estás viendo.", input:"Tu pregunta", placeholder:"Escribe tu pregunta...", send:"Enviar pregunta", close:"Cerrar asistente", fund:"¿Qué es un fondo?", simulation:"¿Cómo funciona la simulación?", decline:"¿Qué significa esta caída?", pending:"Preparando respuesta local…", cancel:"Cancelar respuesta", error:"No se pudo preparar la respuesta. Puedes intentarlo de nuevo.", source:"Fuentes", limit:"Máximo 1500 caracteres.", reviewed:"El dictado se añade al texto para que puedas revisarlo antes de enviar." },
 en: { title:"Your assistant", subtitle:"Here to help you understand", mode:"LOCAL MODE · RULE-BASED RESPONSES", hello:"Ask about the screen or example you are viewing.", input:"Your question", placeholder:"Write your question...", send:"Send question", close:"Close assistant", fund:"What is a fund?", simulation:"How does the simulation work?", decline:"What does this decline mean?", pending:"Preparing local response…", cancel:"Cancel response", error:"The response could not be prepared. You can try again.", source:"Sources", limit:"Maximum 1500 characters.", reviewed:"Dictation is added to the text so you can review it before sending." },
} as const;

export default function AssistantPanel({ open, onClose, context, panelRef, provider: suppliedProvider, dataMode = "local", onUseServer, prefillRequest }: Props) {
 const t=words[context.language];
 const localProvider=useMemo(()=>createLocalTutorProvider(),[]);
 const provider=suppliedProvider ?? localProvider;
 const serverStatus=useTutorStatus(open,dataMode);
 const [messages,setMessages]=useState<Message[]>([]);
 const [input,setInput]=useState("");
 const inputRef=useRef<HTMLInputElement>(null);
 const handledPrefill=useRef<number | null>(null);
 const prefillContext=useRef<string | null>(null);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState("");
 const [failedQuestion,setFailedQuestion]=useState("");
 const request=useRef<AbortController|null>(null);
 const generation=useRef(0);
 const contextKey=JSON.stringify(context) + provider.id;
 const cancel=()=>{generation.current++;request.current?.abort();request.current=null;setPending(false);};
 useEffect(()=>{cancel();setInput("");setError("");setFailedQuestion("");cancelDictation();return ()=>{generation.current++;request.current?.abort();cancelDictation();};},[open,contextKey]);
 useEffect(()=>{
  if(!open || !prefillRequest)return;
  if(handledPrefill.current!==prefillRequest.id){
   handledPrefill.current=prefillRequest.id;
   prefillContext.current=contextKey;
   setInput(prefillRequest.text);
  }
  if(prefillContext.current!==contextKey)return;
  const frame=requestAnimationFrame(()=>inputRef.current?.focus());
  return ()=>cancelAnimationFrame(frame);
 },[open,contextKey,prefillRequest]);
 async function sendQuestion(text: string){
  if(!text || text.length>MAX_MESSAGE_LENGTH || pending)return;
  const snapshot=structuredClone(context); const history=messages.filter(item=>JSON.stringify(item.context)===JSON.stringify(context) && item.providerId===provider.id).slice(-MAX_HISTORY_MESSAGES).map(item=>({role:item.role,text:item.text,intent:item.reply?.intent}));
  const controller=new AbortController(); request.current=controller; const id=++generation.current;
  const userMessage: Message = {providerId:provider.id,role:"user",text,context:snapshot};
  setMessages(previous=>[...previous,userMessage]);setInput(previous=>previous.trim() === text ? "" : previous);setError("");setFailedQuestion("");setPending(true);
  try {
   const reply=await provider.reply({message:text,history,context:snapshot,signal:controller.signal});
   if(id===generation.current&&!controller.signal.aborted)setMessages(previous=>[...previous,{providerId:provider.id,role:"assistant",text:reply.text,context:snapshot,reply}]);
  } catch (failure) {if(id===generation.current&&!controller.signal.aborted){setMessages(previous=>previous.filter(item=>item!==userMessage));setFailedQuestion(text);setInput(previous=>previous || text);setError(dataMode === 'server' ? tutorErrorMessage(failure,context.language) : t.error);}}
  finally {if(id===generation.current){request.current=null;setPending(false);}}
 }
 const send=(e:FormEvent)=>{e.preventDefault();void sendQuestion(input.trim());};
 if(!open)return null;
 const lastReply=[...messages].reverse().find(item=>item.role==="assistant" && item.providerId===provider.id && JSON.stringify(item.context)===JSON.stringify(context));
 const serverLabel = lastReply?.reply?.provider === "anthropic"
  ? `Anthropic · ${lastReply.reply.model}`
  : lastReply?.reply?.provider === "server_rules"
   ? (context.language === "es" ? "Servidor de demo · respuestas por reglas" : "Demo server · rule-based responses")
   : tutorStatusLabel(serverStatus,context.language);
 return <><button className="drawer-overlay" onClick={onClose} aria-label={t.close}/><aside ref={panelRef} className="assistant-panel" role="dialog" aria-modal="true" aria-label={t.title}>
  <div className="assistant-head"><div className="assistant-avatar"><Sparkles size={20}/></div><div><strong>{t.title}</strong><span>{t.subtitle}</span></div><button className="icon-button" onClick={onClose} aria-label={t.close}><X size={20}/></button></div>
  <div className="assistant-banner">{provider.id === "server_rules" ? serverLabel : t.mode}</div>
  {dataMode === 'local' && onUseServer && <div className="assistant-foot">{context.language === 'es' ? 'Activa el servidor para toda la demo; se descartarán los resultados actuales.' : 'Connects the whole demo to the server; current results will be cleared.'} <button type="button" className="plain-link" onClick={onUseServer}>{context.language === 'es' ? 'Conectar asistente con IA' : 'Connect AI assistant'}</button></div>}
  <div className="messages" aria-live="polite" tabIndex={0}><div className="message assistant"><p>{t.hello}</p></div>{messages.map((m,i)=><div key={i} lang={m.context.language} className={`message ${m.role}`}><div><p>{m.text}</p>{m.reply&&m.providerId==="server_rules"&&replyOrigin(m.reply.provider,m.reply.language)&&<div className="message-sources">{replyOrigin(m.reply.provider,m.reply.language)}</div>}{m.reply&&m.reply.sources.length>0&&<div className="message-sources">{t.source}: {m.reply.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}</div>}</div></div>)}</div>
  <div className="suggestions" role="group" aria-label={context.language==="es"?"Preguntas sugeridas":"Suggested questions"}>{[...new Set([...suggestedQuestions(context.page,context.level,context.language,!!context.decline),...(context.decline?(context.language==="es"?["Me preocupa la caída, ¿debería vender?","¿Por qué ha caído?"]:["I'm worried about the drop; should I sell?","Why did it fall?"]):[])])].map(q=><button key={q} type="button" onClick={()=>setInput(q)}>{q}</button>)}</div>
  <form className="chat-form" onSubmit={send}><label className="sr-only" htmlFor="chat-input">{t.input}</label><input ref={inputRef} id="chat-input" value={input} maxLength={MAX_MESSAGE_LENGTH} onChange={e=>setInput(e.target.value)} placeholder={t.placeholder}/><button type="submit" disabled={pending||!input.trim()} aria-label={t.send}><Send size={17}/></button></form>
  <p className="assistant-foot">{t.limit} {t.reviewed}</p><div className="assistant-voice"><VoiceControls scopeKey={contextKey} dataMode={dataMode} text={lastReply?.text} language={context.language} speechLanguage={lastReply?.reply?.language??context.language} onTranscript={text=>setInput(previous=>(previous?`${previous} ${text}`:text).slice(0,MAX_MESSAGE_LENGTH))}/></div>
  <div className="assistant-status" role="status" aria-live="polite">{pending?(provider.id === "server_rules" ? (context.language === "es" ? "Preparando respuesta del servidor…" : "Preparing server response…") : t.pending):error}</div>{pending&&<button className="plain-link" onClick={cancel}>{t.cancel}</button>}{!pending && failedQuestion && input.trim() !== failedQuestion && <button type="button" className="plain-link" onClick={()=>void sendQuestion(failedQuestion)}>{context.language === 'es' ? 'Reintentar pregunta anterior' : 'Retry previous question'}</button>}
 </aside></>;
}
