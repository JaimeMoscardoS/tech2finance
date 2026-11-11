import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Mic, Square, Volume2, X } from 'lucide-react';
import { createLocalTutorProvider, MAX_MESSAGE_LENGTH, type TutorContext, type TutorProvider, type TutorReply, type TutorHistoryMessage } from '../../tutor-ia/src/index';
import { type VoiceState } from './voice/browser-voice';
import { speak, stopPlayback } from './voice/playback';
import { cancelDictation, startDictation, type DataMode } from './voice/dictation';
import { replyOrigin } from './reply-origin';
import './voice-assistant.css';

export type VoiceAssistantPanelProps = { open: boolean; onClose: () => void; context: TutorContext; panelRef: RefObject<HTMLElement | null>; provider?: TutorProvider; startToken?: number; dataMode?: DataMode };
const copy = {
 es: { title: 'Habla con tu asistente', subtitle: 'Una pregunta cada vez', close: 'Cerrar asistente de voz', local: 'RESPUESTAS LOCALES · POR REGLAS', server: 'SERVIDOR DE DEMO · REGLAS O IA (CLAUDE)', intro: 'Tu pregunta se procesará cuando termine el dictado.', privacy: 'El dictado y la lectura necesitan voz local disponible en este dispositivo.', talk: 'Hablar', cancel: 'Cancelar', listen: 'Escuchar respuesta', stop: 'Detener voz', heard: 'Tu pregunta', answer: 'Respuesta', pending: 'Preparando respuesta…', empty: 'No se detectó ninguna pregunta. Inténtalo de nuevo.', limit: 'La pregunta supera los 1500 caracteres. Inténtalo con una más corta.', error: 'No se pudo preparar la respuesta. Inténtalo de nuevo.', writeHelp: 'Para escribir, cierra esta ventana y abre Tu asistente.', sources: 'Fuentes' },
 en: { title: 'Talk to your assistant', subtitle: 'One question at a time', close: 'Close voice assistant', local: 'LOCAL RESPONSES · RULE-BASED', server: 'DEMO SERVER · RULES OR AI (CLAUDE)', intro: 'Your question is processed when dictation ends.', privacy: 'Dictation and playback require local voice to be available on this device.', talk: 'Talk', cancel: 'Cancel', listen: 'Listen to answer', stop: 'Stop voice', heard: 'Your question', answer: 'Answer', pending: 'Preparing answer…', empty: 'No question was detected. Try again.', limit: 'The question exceeds 1500 characters. Try a shorter one.', error: 'The answer could not be prepared. Try again.', writeHelp: 'To type, close this window and open Your assistant.', sources: 'Sources' },
} as const;
type Phase = 'idle' | 'dictating' | 'pending' | 'speaking';

export default function VoiceAssistantPanel({ open, onClose, context, panelRef, provider: suppliedProvider, startToken = 0, dataMode = 'local' }: VoiceAssistantPanelProps) {
 const t = copy[context.language];
 const local = useMemo(() => createLocalTutorProvider(), []);
 const provider = suppliedProvider ?? local;
 const key = JSON.stringify(context) + provider.id + dataMode;
 const [phase, setPhase] = useState<Phase>('idle');
 const [message, setMessage] = useState('');
 const [question, setQuestion] = useState('');
 const [draft, setDraft] = useState('');
 const [reply, setReply] = useState<TutorReply | null>(null);
 const [showText, setShowText] = useState(false);
 const [showAnswer, setShowAnswer] = useState(false);
 const generation = useRef(0);
 const request = useRef<AbortController | null>(null);
 const history = useRef<TutorHistoryMessage[]>([]);
 const consumedStart = useRef(0);
 const inputRef = useRef<HTMLInputElement>(null);
 const currentSession = useRef({ key, provider });
 currentSession.current = { key, provider };
 const cancel = () => { generation.current++; request.current?.abort(); request.current = null; stopPlayback(); cancelDictation(); setPhase('idle'); setMessage(''); };
 useEffect(() => {
  cancel(); history.current = []; setQuestion(''); setReply(null); setDraft(''); setShowText(false); setShowAnswer(false);
  return () => { generation.current++; request.current?.abort(); request.current = null; stopPlayback(); cancelDictation(); };
 }, [open, key, provider]);
 const submitQuestion = (text: string, id: number, snapshot: TutorContext) => {
  if (!text) { setPhase('idle'); setMessage(t.empty); return; }
  if (text.length > MAX_MESSAGE_LENGTH) { setPhase('idle'); setMessage(t.limit); return; }
  setQuestion(text); setReply(null); setMessage(t.pending); setPhase('pending');
  const controller = new AbortController(); request.current = controller;
  const timer = window.setTimeout(() => { controller.abort(); if (id === generation.current) { request.current = null; setPhase('idle'); setMessage(t.error); } }, 45000);
  void provider.reply({ message: text, history: history.current.slice(-8), context: snapshot, signal: controller.signal }).then(result => {
   if (id !== generation.current || controller.signal.aborted) return;
   history.current = [...history.current, {role:'user' as const,text}, {role:'assistant' as const,text:result.text,intent:result.intent}].slice(-8);
   request.current = null; setReply(result); setPhase('speaking');
   void speak(dataMode, result.text, result.language, (voiceState, voiceMessage) => {
    if (id !== generation.current) return;
    setMessage(voiceMessage);
    if (voiceState === 'idle' || voiceState === 'error') setPhase('idle');
   });
  }).catch(() => { if (id === generation.current) { request.current = null; setPhase('idle'); setMessage(t.error); } }).finally(() => window.clearTimeout(timer));
 };
 const talk = () => {
  cancel(); setQuestion(''); setReply(null);
  const id = ++generation.current;
  const snapshot = structuredClone(context);
  let finalText = '';
  let submitted = false;
  setPhase('dictating');
  const status = (state: VoiceState, detail: string) => {
   if (id !== generation.current) return;
   if (state === 'error') { setPhase('idle'); setMessage(detail); return; }
   if (state !== 'idle') { setMessage(detail); return; }
   if (submitted) return;
   submitted = true;
   submitQuestion(finalText.trim(), id, snapshot);
  };
  void startDictation(dataMode, context.language, text => { if (id === generation.current) finalText += (finalText ? ' ' : '') + text; }, status);
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
  void speak(dataMode, reply.text, reply.language, (state, detail) => {
   if (id !== generation.current) return;
   setMessage(detail); if (state === 'idle' || state === 'error') setPhase('idle');
  });
 };
 const close = () => { cancel(); onClose(); };
 const submitText = (event: React.FormEvent) => {
  event.preventDefault();
  const text = draft.trim();
  if (!text) return;
  inputRef.current?.focus();
  cancel(); setDraft('');
  submitQuestion(text, generation.current, structuredClone(context));
 };
 if (!open) return null;
 const active = phase !== 'idle';
 const status = phase === 'dictating' ? (context.language === 'es' ? 'Escuchando…' : 'Listening…') : phase === 'pending' ? t.pending : phase === 'speaking' ? (context.language === 'es' ? 'Respondiendo…' : 'Speaking…') : message || (context.language === 'es' ? 'Voz lista' : 'Voice ready');
 return <aside ref={panelRef} className="voice-panel" role="region" aria-label={t.title}>
  <div className="voice-panel__bar">
   <span className="voice-panel__status" role="status" aria-live="polite">{status}</span>
   <button type="button" className="voice-panel__write" onClick={() => setShowText(value => !value)} aria-expanded={showText}>{context.language === 'es' ? 'Escribir' : 'Type'}</button>
   <button type="button" className="voice-panel__icon" onClick={active ? cancel : talk} aria-label={active ? t.cancel : t.talk}>{active ? <Square size={17} fill="currentColor"/> : <Mic size={19}/>}</button>
   <button type="button" className="voice-panel__icon" onClick={close} aria-label={t.close}><X size={20}/></button>
  </div>
  {dataMode === 'server' && <p className="voice-panel__privacy">{context.language === 'es' ? 'Si ElevenLabs está configurado, tu audio se enviará a ElevenLabs. Idioma: español.' : 'If ElevenLabs is configured, your audio will be sent to ElevenLabs. Language: English.'}</p>}
  {dataMode === 'server' && <p className="voice-panel__privacy">{context.language === 'es' ? 'Si ElevenLabs está configurado para la lectura, se le enviará el texto de la respuesta.' : 'If ElevenLabs is configured for playback, the answer text will be sent to it.'}</p>}
  {reply && <div className="voice-panel__actions"><span className="voice-panel__provider">{reply.provider === 'anthropic' ? `Anthropic · ${reply.model ?? 'Claude Sonnet'}` : context.language === 'es' ? 'Respuesta por reglas' : 'Rule-based response'}</span><button type="button" onClick={() => setShowAnswer(value => !value)} aria-expanded={showAnswer}>{context.language === 'es' ? 'Ver respuesta' : 'View answer'}</button></div>}
  {showAnswer && reply && <div className="voice-panel__result">{question && <section><h3>{t.heard}</h3><p>{question}</p></section>}<section><h3>{t.answer}</h3><p>{reply.text}</p>{provider.id === 'server_rules' && replyOrigin(reply.provider, reply.language) && <div className="voice-panel__sources">{replyOrigin(reply.provider, reply.language)}</div>}{reply.sources.length > 0 && <div className="voice-panel__sources">{t.sources}: {reply.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}</div>}</section><button type="button" onClick={phase === 'speaking' ? cancel : play} disabled={phase === 'dictating' || phase === 'pending'}><Volume2 size={17}/>{phase === 'speaking' ? t.stop : t.listen}</button></div>}
  {showText && <form className="voice-panel__form" onSubmit={submitText}><label htmlFor="voice-question">{context.language === 'es' ? 'Escribe tu pregunta' : 'Type your question'}</label><div><input ref={inputRef} id="voice-question" value={draft} onChange={event => setDraft(event.target.value)} maxLength={MAX_MESSAGE_LENGTH}/><button type="submit" disabled={!draft.trim()}>{context.language === 'es' ? 'Enviar' : 'Send'}</button></div></form>}
 </aside>;
}
