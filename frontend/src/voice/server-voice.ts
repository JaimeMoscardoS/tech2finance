/** Optional server voice (ElevenLabs through POST /api/tts) with automatic fallback to the browser voice. */
import { registerVoiceStopper, speakLocal, stopBrowserVoice, type VoiceLanguage, type VoiceState } from './browser-voice.ts';

type Status = (state: VoiceState, message: string) => void;
const MAX_TEXT = 1500;
const messages = {
  es: { starting: 'Preparando voz…', speaking: 'Reproduciendo voz (ElevenLabs).', finished: 'Voz detenida.' },
  en: { starting: 'Preparing voice…', speaking: 'Playing voice (ElevenLabs).', finished: 'Voice stopped.' },
} as const;

let availability: Promise<boolean> | undefined;
let generation = 0;
let controller: AbortController | undefined;
let audio: HTMLAudioElement | undefined;
let objectUrl: string | undefined;
let activeStatus: Status | undefined;

export function serverVoiceAvailable(): Promise<boolean> {
  if (availability) return availability;
  const aborter = new AbortController();
  const timer = setTimeout(() => aborter.abort(), 3000);
  const attempt = (async () => {
    try {
      const response = await fetch('/api/health', { signal: aborter.signal });
      if (!response.ok) return false;
      const body = await response.json() as { voiceProvider?: unknown };
      return body.voiceProvider === 'elevenlabs';
    } catch { return false; }
    finally { clearTimeout(timer); }
  })();
  availability = attempt;
  void attempt.then(ok => { if (!ok && availability === attempt) availability = undefined; });
  return attempt;
}

/** Test helper: forget the cached health result. */
export function resetServerVoiceCache(): void { availability = undefined; }

function releaseAudio(): void {
  controller?.abort();
  controller = undefined;
  const current = audio;
  audio = undefined;
  if (current) {
    current.onplaying = null; current.onended = null; current.onerror = null;
    try { current.pause(); } catch { /* Already stopped. */ }
  }
  if (objectUrl) { try { URL.revokeObjectURL(objectUrl); } catch { /* Ignore. */ } objectUrl = undefined; }
  activeStatus = undefined;
}

registerVoiceStopper(() => {
  generation++;
  const status = activeStatus;
  releaseAudio();
  status?.('idle', '');
});

/** Stops server audio and browser voice; the registered stopper reports idle once. */
export function stopVoice(): void { stopBrowserVoice(); }

export async function speak(text: string, language: VoiceLanguage, status: Status): Promise<void> {
  stopBrowserVoice();
  if (text.length > MAX_TEXT) { speakLocal(text, language, status); return; }
  const id = ++generation;
  const m = messages[language];
  activeStatus = status;
  status('starting', m.starting);
  const available = await serverVoiceAvailable();
  if (id !== generation) return;
  if (!available) { activeStatus = undefined; speakLocal(text, language, status); return; }
  const fallback = () => { if (id !== generation) return; releaseAudio(); speakLocal(text, language, status); };
  const aborter = new AbortController();
  controller = aborter;
  const timer = setTimeout(() => aborter.abort(), 25000);
  try {
    const response = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }), signal: aborter.signal });
    if (!response.ok || !(response.headers.get('content-type') ?? '').toLowerCase().startsWith('audio/mpeg')) throw new Error();
    const blob = await response.blob();
    if (id !== generation) return;
    objectUrl = URL.createObjectURL(blob);
    const player = new Audio(objectUrl);
    audio = player;
    player.onplaying = () => { if (id === generation) status('speaking', m.speaking); };
    player.onended = () => { if (id === generation) { releaseAudio(); status('idle', m.finished); } };
    player.onerror = fallback;
    await player.play();
  } catch { fallback(); }
  finally { clearTimeout(timer); }
}
