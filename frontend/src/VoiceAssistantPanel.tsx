import { useEffect, useRef, useState, type RefObject } from 'react';
import { Mic, Square, X } from 'lucide-react';
import type { TutorContext, TutorProvider } from '../../tutor-ia/src/index';
import type { DataMode } from './voice/dictation';
import { isAgentSession } from './voice/agent-session';
import LegacyVoiceAssistantPanel from './LegacyVoiceAssistantPanel';
import './voice-assistant.css';

type ServerContext = Parameters<typeof import('./server-api').serverTutorProvider>[0];
type Props = { open: boolean; onClose: () => void; context: TutorContext; serverContext: ServerContext; panelRef: RefObject<HTMLElement | null>; provider?: TutorProvider; startToken?: number; dataMode?: DataMode; onUseServer?: () => void };
type Session = { endSession: () => Promise<void>; sendUserMessage: (text: string) => void };
type Message = { role: string; text: string };

export default function VoiceAssistantPanel(props: Props) {
 const [route, setRoute] = useState<'checking' | 'legacy' | 'managed' | 'error'>('checking');
 const [configured, setConfigured] = useState(false);
 useEffect(() => {
  if (!props.open) { setRoute('checking'); return; }
  if (props.dataMode !== 'server') { setRoute('legacy'); return; }
  const controller = new AbortController(); setRoute('checking');
  const timer = window.setTimeout(() => { controller.abort(); setRoute('error'); }, 10000);
  void fetch('/api/health', {signal:controller.signal, cache:'no-store'}).then(async response => {
   if (!response.ok) throw new Error('health');
   const health = await response.json();
   if (controller.signal.aborted) return;
   if (health.conversationProvider === 'elevenlabs') { setConfigured(health.agentConfigured === true); setRoute('managed'); }
   else if (health.conversationProvider === 'disabled' || health.conversationProvider === undefined) setRoute('legacy');
   else setRoute('error');
  }).catch(() => { if (!controller.signal.aborted) setRoute('error'); }).finally(() => window.clearTimeout(timer));
  return () => { window.clearTimeout(timer); controller.abort(); };
 }, [props.open, props.dataMode]);
 if (!props.open) return null;
 if (route === 'legacy') return <LegacyVoiceAssistantPanel {...props}/>;
 if (route === 'managed') return <ManagedVoicePanel {...props} configured={configured}/>;
 const es = props.context.language === 'es';
 return <aside ref={props.panelRef} className="voice-panel" role="region" aria-label={es ? 'Habla con tu asistente' : 'Talk to your assistant'}><div className="voice-panel__bar"><span className="voice-panel__status" role="status">{route === 'checking' ? (es ? 'Conectando…' : 'Connecting…') : (es ? 'No se pudo conectar con el servidor. Comprueba la conexión y vuelve a abrir el asistente.' : 'Could not connect to the server. Check the connection and reopen the assistant.')}</span><button type="button" className="voice-panel__icon" aria-label={es ? 'Cerrar asistente de voz' : 'Close voice assistant'} onClick={props.onClose}><X size={20}/></button></div></aside>;
}

function ManagedVoicePanel({open, onClose, context, serverContext, panelRef, startToken = 0, configured}: Props & {configured: boolean}) {
 const es = context.language === 'es';
 const key = JSON.stringify(serverContext);
 const generation = useRef(0); const currentKey = useRef(key); const session = useRef<Session | null>(null); const request = useRef<AbortController | null>(null); const consumed = useRef(0);
 const [phase, setPhase] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'text'>('idle');
 const [notice, setNotice] = useState(''); const [messages, setMessages] = useState<Message[]>([]); const [showMessages, setShowMessages] = useState(false); const [showText, setShowText] = useState(false); const [draft, setDraft] = useState(''); const [connectingVoice, setConnectingVoice] = useState(false);
 // Invalidate callbacks during render, before effect cleanup can run.
 if (currentKey.current !== key) { currentKey.current = key; generation.current++; }
 const stop = () => { generation.current++; request.current?.abort(); request.current = null; const active = session.current; session.current = null; if (active) void active.endSession().catch(() => {}); setPhase('idle'); };
 useEffect(() => { stop(); setMessages([]); setNotice(''); setDraft(''); setShowMessages(false); setShowText(false); return () => { generation.current++; request.current?.abort(); const active = session.current; session.current = null; if (active) void active.endSession().catch(() => {}); }; }, [key, open]);
 const start = async (textOnly: boolean) => {
  stop(); setNotice(''); setMessages([]); const id = ++generation.current;
  if (!configured) { setNotice(es ? 'El asistente de voz no está configurado. Revisa la configuración del servidor.' : 'The voice assistant is not configured. Check the server configuration.'); return; }
  const controller = new AbortController(); request.current = controller; setConnectingVoice(!textOnly); setPhase('connecting');
  const timer = window.setTimeout(() => { if (id === generation.current) { stop(); setNotice(textOnly ? (es ? 'La conexión tardó demasiado. Comprueba el servidor y vuelve a intentarlo.' : 'The connection timed out. Check the server and try again.') : (es ? 'La conexión tardó demasiado. Si el micrófono sigue activo, cierra esta pestaña.' : 'The connection timed out. If the microphone is still active, close this tab.')); } }, 20000);
  try {
   const response = await fetch('/api/agent/session', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({context:serverContext,textOnly}), signal:controller.signal, cache:'no-store'});
   if (!response.ok) throw new Error('session');
   const credentials: unknown = await response.json();
   if (!isAgentSession(credentials, context.language, textOnly)) throw new Error('session');
   if (id !== generation.current || controller.signal.aborted) return;
   const { Conversation } = await import('@elevenlabs/client');
   if (id !== generation.current || controller.signal.aborted) return;
   const active = await Conversation.startSession({signedUrl:credentials.signedUrl, connectionType:'websocket', textOnly, overrides:credentials.overrides, dynamicVariables:credentials.dynamicVariables,
    onConnect: () => { if (id === generation.current) setPhase(textOnly ? 'text' : 'listening'); },
    onModeChange: ({mode}) => { if (id === generation.current && !textOnly) setPhase(mode === 'speaking' ? 'speaking' : 'listening'); },
    onMessage: ({message, role}) => { if (id === generation.current && typeof message === 'string') setMessages(previous => [...previous, {role, text:message.slice(0,8000)}].slice(-30)); },
    onDisconnect: () => { if (id === generation.current) { stop(); setNotice(es ? 'Conversación finalizada. Pulsa el micrófono para volver a empezar.' : 'Conversation ended. Press the microphone to start again.'); } },
    onError: () => { if (id === generation.current) { stop(); setNotice(es ? 'No se pudo conectar la voz. Comprueba el micrófono o usa Escribir.' : 'Voice could not connect. Check the microphone or use Type.'); } },
   });
   if (id !== generation.current || controller.signal.aborted) { await active.endSession(); return; }
   session.current = active; request.current = null; setPhase(textOnly ? 'text' : 'listening');
  } catch { if (id === generation.current && !controller.signal.aborted) { stop(); setNotice(es ? 'No se pudo iniciar la conversación. Comprueba el servidor y el micrófono, o usa Escribir.' : 'Could not start the conversation. Check the server and microphone, or use Type.'); } } finally { window.clearTimeout(timer); }
 };
 useEffect(() => { if (!open || startToken === consumed.current) return; let cancelled = false; queueMicrotask(() => { if (!cancelled) { consumed.current = startToken; void start(false); } }); return () => { cancelled = true; }; }, [open, startToken]);
 const active = phase !== 'idle';
 const status = notice || (phase === 'connecting' ? (es ? 'Conectando…' : 'Connecting…') : phase === 'listening' ? (es ? 'Escuchando…' : 'Listening…') : phase === 'speaking' ? (es ? 'Respondiendo…' : 'Speaking…') : phase === 'text' ? (es ? 'Conversación escrita activa' : 'Text conversation active') : (es ? 'Voz detenida' : 'Voice stopped'));
 return <aside ref={panelRef} className="voice-panel" role="region" aria-label={es ? 'Habla con tu asistente' : 'Talk to your assistant'}>
  <div className="voice-panel__bar"><span className="voice-panel__status" role="status" aria-live="polite">{status}</span>
   <button type="button" className="voice-panel__write" aria-expanded={showText} onClick={() => { setShowText(!showText); if (!showText && phase !== 'text') void start(true); }}>{es ? 'Escribir' : 'Type'}</button>
   <button type="button" className="voice-panel__icon" aria-label={active ? (es ? 'Detener conversación' : 'Stop conversation') : (es ? 'Hablar' : 'Talk')} onClick={() => { if (!active) { void start(false); return; } const pendingVoice = phase === 'connecting' && connectingVoice; stop(); if (pendingVoice) setNotice(es ? 'Conexión detenida. Si el micrófono sigue activo, cierra esta pestaña.' : 'Connection stopped. If the microphone is still active, close this tab.'); }}>{active ? <Square size={17} fill="currentColor"/> : <Mic size={19}/>}</button>
   <button type="button" className="voice-panel__icon" aria-label={es ? 'Cerrar asistente de voz' : 'Close voice assistant'} onClick={() => { stop(); onClose(); }}><X size={20}/></button></div>
  {phase === 'connecting' && connectingVoice && <p className="voice-panel__privacy">{es ? 'Si la conexión se bloquea, detenerla puede no liberar el micrófono. Cierra esta pestaña si sigue activo.' : 'If connection gets stuck, stopping may not release the microphone. Close this tab if it remains active.'}</p>}
  {messages.length > 0 && <div className="voice-panel__actions"><button type="button" aria-expanded={showMessages} onClick={() => setShowMessages(!showMessages)}>{es ? 'Ver conversación' : 'View conversation'}</button></div>}
  {showMessages && <div className="voice-panel__result">{messages.map((message, i) => <section key={i}><h3>{message.role === 'user' ? (es ? 'Tu pregunta' : 'Your question') : (es ? 'Respuesta' : 'Answer')}</h3><p>{message.text}</p></section>)}</div>}
  {showText && <form className="voice-panel__form" onSubmit={event => { event.preventDefault(); const text = draft.trim(); if (!text || !session.current || phase !== 'text') return; session.current.sendUserMessage(text); setMessages(previous => [...previous, {role:'user', text}].slice(-30)); setDraft(''); }}><label htmlFor="voice-question">{es ? 'Escribe tu pregunta' : 'Type your question'}</label><div><input id="voice-question" value={draft} onChange={event => setDraft(event.target.value)} maxLength={1500}/><button type="submit" disabled={!draft.trim() || phase !== 'text'}>{es ? 'Enviar' : 'Send'}</button></div></form>}
 </aside>;
}
