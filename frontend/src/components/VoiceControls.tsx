import { useEffect, useRef, useState } from 'react';
import { localVoice, speakLocal, startLocalDictation, stopBrowserVoice, subscribeVoicesChanged, type VoiceLanguage, type VoiceState } from '../voice/browser-voice';
import './VoiceControls.css';

export interface VoiceControlsProps {
  text?: string;
  language: VoiceLanguage;
  speechLanguage?: VoiceLanguage;
  onTranscript?: (text: string) => void;
  disabled?: boolean;
  onStatus?: (message: string) => void;
}

export default function VoiceControls({ text, language, speechLanguage = language, onTranscript, disabled = false, onStatus }: VoiceControlsProps) {
  const [state, setState] = useState<VoiceState>('idle');
  const [mode, setMode] = useState<'speech' | 'dictation' | null>(null);
  const [message, setMessage] = useState('');
  const callback = useRef(onStatus);
  callback.current = onStatus;
  const status = (requestedMode: 'speech' | 'dictation') => (next: VoiceState, detail: string) => {
    setState(next); setMessage(detail); callback.current?.(detail);
    setMode(next === 'idle' || next === 'error' ? null : requestedMode);
  };
  useEffect(() => () => { stopBrowserVoice(); }, [text, language, speechLanguage]);
  useEffect(() => { if (disabled) stopBrowserVoice(); }, [disabled]);
  useEffect(() => subscribeVoicesChanged(() => {
    // Voice discovery may complete after the first request; let the user retry.
    if (localVoice(window.speechSynthesis.getVoices(), speechLanguage)) {
      setMessage(current => current === 'Texto disponible; voz local no disponible.' || current === 'Text available; local voice unavailable.' ? '' : current);
    }
  }), [speechLanguage]);
  const active = state === 'starting' || state === 'speaking' || state === 'paused' || state === 'listening';
  const spanish = language === 'es';
  return <div className="voice-controls">
    <div className="voice-controls__actions">
      {text && <button type="button" disabled={disabled} aria-pressed={active && mode === 'speech'} onClick={() => {
        if (active && mode === 'speech') { stopBrowserVoice(); return; }
        speakLocal(text, speechLanguage, status('speech'));
      }}>{active && mode === 'speech' ? (spanish ? 'Detener lectura' : 'Stop reading') : (spanish ? 'Escuchar' : 'Listen')}</button>}
      {onTranscript && <button type="button" disabled={disabled} aria-pressed={active && mode === 'dictation'} onClick={() => {
        if (active && mode === 'dictation') { stopBrowserVoice(); return; }
        void startLocalDictation(language, onTranscript, status('dictation'));
      }}>{active && mode === 'dictation' ? (spanish ? 'Detener dictado' : 'Stop dictation') : (spanish ? 'Dictar' : 'Dictate')}</button>}
    </div>
    <span className="voice-controls__status" role="status" aria-live="polite">{message}</span>
  </div>;
}
