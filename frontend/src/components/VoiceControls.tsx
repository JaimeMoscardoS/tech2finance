import { useEffect, useRef, useState } from 'react';
import { localVoice, subscribeVoicesChanged, type VoiceLanguage, type VoiceState } from '../voice/browser-voice';
import { speak, stopPlayback } from '../voice/playback';
import { cancelDictation, finishDictation, startDictation, type DataMode } from '../voice/dictation';
import './VoiceControls.css';

export interface VoiceControlsProps {
  text?: string;
  language: VoiceLanguage;
  speechLanguage?: VoiceLanguage;
  onTranscript?: (text: string) => void;
  disabled?: boolean;
  onStatus?: (message: string) => void;
  dataMode?: DataMode;
  scopeKey?: string;
}

export default function VoiceControls({ text, language, speechLanguage = language, onTranscript, disabled = false, onStatus, dataMode = 'local', scopeKey }: VoiceControlsProps) {
  const [state, setState] = useState<VoiceState>('idle');
  const [mode, setMode] = useState<'speech' | 'dictation' | null>(null);
  const [message, setMessage] = useState('');
  const callback = useRef(onStatus);
  callback.current = onStatus;
  const status = (requestedMode: 'speech' | 'dictation') => (next: VoiceState, detail: string) => {
    setState(next); setMessage(detail); callback.current?.(detail);
    setMode(next === 'idle' || next === 'error' ? null : requestedMode);
  };
  useEffect(() => { setState('idle'); setMode(null); setMessage(''); return () => { stopPlayback(); cancelDictation(); }; }, [text, language, speechLanguage, dataMode, scopeKey]);
  useEffect(() => { if (disabled) { stopPlayback(); cancelDictation(); } }, [disabled]);
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
        if (active && mode === 'speech') { stopPlayback(); cancelDictation(); return; }
        cancelDictation();
        void speak(dataMode, text, speechLanguage, status('speech'));
      }}>{active && mode === 'speech' ? (spanish ? 'Detener lectura' : 'Stop reading') : (spanish ? 'Escuchar' : 'Listen')}</button>}
      {onTranscript && <button type="button" disabled={disabled} aria-pressed={active && mode === 'dictation'} onClick={() => {
        if (active && mode === 'dictation') { finishDictation(); return; }
        void startDictation(dataMode, language, onTranscript, status('dictation'));
      }}>{active && mode === 'dictation' ? (spanish ? 'Detener dictado' : 'Stop dictation') : (spanish ? 'Dictar' : 'Dictate')}</button>}
    </div>
    {onTranscript && dataMode === 'server' && <small>{spanish ? 'Si ElevenLabs está configurado, tu audio se enviará a ElevenLabs. Idioma: español.' : 'If ElevenLabs is configured, your audio will be sent to ElevenLabs. Language: English.'}</small>}
    {text && dataMode === 'server' && <small>{spanish ? 'Si ElevenLabs está configurado para la lectura, se le enviará este texto.' : 'If ElevenLabs is configured for playback, this text will be sent to it.'}</small>}
    <span className="voice-controls__status" role="status" aria-live="polite">{message}</span>
  </div>;
}
