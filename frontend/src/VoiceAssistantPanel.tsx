import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Mic, Square, Volume2, X } from 'lucide-react';
import { createLocalTutorProvider, MAX_MESSAGE_LENGTH, type TutorContext, type TutorProvider, type TutorReply, type TutorHistoryMessage } from '../../tutor-ia/src/index';
import { speakLocal, startLocalDictation, stopBrowserVoice, type VoiceState } from './voice/browser-voice';
import './voice-assistant.css';

export type VoiceAssistantPanelProps = { open: boolean; onClose: () => void; context: TutorContext; panelRef: RefObject<HTMLElement | null>; provider?: TutorProvider; startToken?: number };
const copy = {
 es: { title: 'Habla con tu asistente', subtitle: 'Una pregunta cada vez', close: 'Cerrar asistente de voz', local: 'RESPUESTAS LOCALES · POR REGLAS', server: 'SERVIDOR DE DEMO · RESPUESTAS POR REGLAS', intro: 'Tu pregunta se procesará cuando termine el dictado.', privacy: 'El dictado y la lectura necesitan voz local disponible en este dispositivo.', talk: 'Hablar', cancel: 'Cancelar', listen: 'Escuchar respuesta', stop: 'Detener voz', heard: 'Tu pregunta', answer: 'Respuesta', pending: 'Preparando respuesta…', empty: 'No se detectó ninguna pregunta. Inténtalo de nuevo.', limit: 'La pregunta supera los 1500 caracteres. Inténtalo con una más corta.', error: 'No se pudo preparar la respuesta. Inténtalo de nuevo.', writeHelp: 'Para escribir, cierra esta ventana y abre Tu asistente.', sources: 'Fuentes' },
 en: { title: 'Talk to your assistant', subtitle: 'One question at a time', close: 'Close voice assistant', local: 'LOCAL RESPONSES · RULE-BASED', server: 'DEMO SERVER · RULE-BASED RESPONSES', intro: 'Your question is processed when dictation ends.', privacy: 'Dictation and playback require local voice to be available on this device.', talk: 'Talk', cancel: 'Cancel', listen: 'Listen to answer', stop: 'Stop voice', heard: 'Your question', answer: 'Answer', pending: 'Preparing answer…', empty: 'No question was detected. Try again.', limit: 'The question exceeds 1500 characters. Try a shorter one.', error: 'The answer could not be prepared. Try again.', writeHelp: 'To type, close this window and open Your assistant.', sources: 'Sources' },
} as const;
type Phase = 'idle' | 'dictating' | 'pending' | 'speaking';

export default function VoiceAssistantPanel({ open, onClose, context, panelRef, provider: suppliedProvider, startToken = 0 }: VoiceAssistantPanelProps) {
 const t = copy[context.language];
 const local = useMemo(() => createLocalTutorProvider(), []);
 const provider = suppliedProvider ?? local;
 const key = JSON.stringify(context) + provider.id;
 const [phase, setPhase] = useState<Phase>('idle');
 const [message, setMessage] = useState('');
 const [question, setQuestion] = useState('');
 const [reply, setReply] = useState<TutorReply | null>(null);
 const generation = useRef(0);
 const request = useRef<AbortController | null>(null);
 const history = useRef<TutorHistoryMessage[]>([]);
 const consumedStart = useRef(0);
 const currentSession = useRef({ key, provider });
 currentSession.current = { key, provider };
 const cancel = () => { generation.current++; request.current?.abort(); request.current = null; stopBrowserVoice(); setPhase('idle'); setMessage(''); };
 useEffect(() => {
  cancel(); history.current = []; setQuestion(''); setReply(null);
  return () => { generation.current++; request.current?.abort(); request.current = null; stopBrowserVoice(); };
 }, [open, key, provider]);
 const talk = () => {
  cancel(); setQuestion(''); setReply(null);
  const id = ++generation.current;
  const snapshot = structuredClone(context);
  let finalText = '';
  let submitted = false;
  setPhase('dictating');
  const status = (state: VoiceState, detail: string) => {
   if (id !== generation.current) return;
   if (state === 'error') { setPhase('idle'); setMessage(`${detail} ${t.writeHelp}`); return; }
   if (state !== 'idle') { setMessage(detail); return; }
   if (submitted) return;
   submitted = true;
   const text = finalText.trim();
   if (!text) { setPhase('idle'); setMessage(t.empty); return; }
   if (text.length > MAX_MESSAGE_LENGTH) { setPhase('idle'); setMessage(t.limit); return; }
   setQuestion(text); setMessage(t.pending); setPhase('pending');
   const controller = new AbortController(); request.current = controller;
   const timer = window.setTimeout(() => controller.abort(), 10000);
   void provider.reply({ message: text, history: history.current.slice(-8), context: snapshot, signal: controller.signal }).then(result => {
    if (id !== generation.current || controller.signal.aborted) return;
    history.current = [...history.current, {role:'user' as const,text}, {role:'assistant' as const,text:result.text,intent:result.intent}].slice(-8);
    request.current = null; setReply(result); setPhase('speaking');
    speakLocal(result.text, result.language, (voiceState, voiceMessage) => {
     if (id !== generation.current) return;
     setMessage(voiceMessage);
     if (voiceState === 'idle' || voiceState === 'error') setPhase('idle');
    });
   }).catch(() => { if (id === generation.current) { request.current = null; setPhase('idle'); setMessage(t.error); } }).finally(() => window.clearTimeout(timer));
  };
  void startLocalDictation(context.language, text => { if (id === generation.current) finalText += (finalText ? ' ' : '') + text; }, status);
 };
 useEffect(() => {
  if (!open) { consumedStart.current = startToken; return; }
  if (startToken === consumedStart.current) return;
  let cancelled = false;
  const session = currentSession.current;
  // StrictMode may clean up and replay effects; only the surviving task starts listening.
  queueMicrotask(() => {
   if (cancelled) return;
   consumedStart.current = startToken;
   if (currentSession.current.key !== session.key || currentSession.current.provider !== session.provider) return;
   talk();
  });
  return () => { cancelled = true; };
 }, [open, startToken]);
 const play = () => {
  if (!reply) return;
  cancel(); const id = generation.current; setPhase('speaking');
  speakLocal(reply.text, reply.language, (state, detail) => {
   if (id !== generation.current) return;
   setMessage(detail); if (state === 'idle' || state === 'error') setPhase('idle');
  });
 };
 const close = () => { cancel(); onClose(); };
 if (!open) return null;
 const active = phase !== 'idle';
 return <><button type="button" className="drawer-overlay" onClick={close} aria-label={t.close}/><aside ref={panelRef} className="voice-panel" role="dialog" aria-modal="true" aria-label={t.title}>
  <header className="voice-panel__header"><div><span className="voice-panel__eyebrow">{t.subtitle}</span><h2>{t.title}</h2></div><button className="voice-panel__close" type="button" onClick={close} aria-label={t.close}><X size={21}/></button></header>
  <div className="voice-panel__mode">{provider.id === 'server_rules' ? t.server : t.local}</div>
  <div className="voice-panel__body"><p className="voice-panel__intro">{t.intro}</p>
   <div className="voice-panel__center"><button type="button" className="voice-panel__mic" onClick={active ? cancel : talk} aria-label={active ? t.cancel : t.talk}><span>{active ? <Square size={28} fill="currentColor"/> : <Mic size={34}/>}</span></button><strong>{active ? t.cancel : t.talk}</strong></div>
   <p className="voice-panel__status" role="status" aria-live="polite">{message || t.privacy}</p>
   {(question || reply) && <div className="voice-panel__result">{question && <section><h3>{t.heard}</h3><p>{question}</p></section>}{reply && <section><h3>{t.answer}</h3><p>{reply.text}</p>{reply.sources.length > 0 && <div className="voice-panel__sources">{t.sources}: {reply.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}</div>}</section>}</div>}
   {reply && <button type="button" className="voice-panel__listen" onClick={phase === 'speaking' ? cancel : play} disabled={phase === 'dictating' || phase === 'pending'}><Volume2 size={17}/>{phase === 'speaking' ? t.stop : t.listen}</button>}
  </div></aside></>;
}
