import { speakLocal, stopBrowserVoice, type VoiceLanguage, type VoiceState } from './browser-voice.ts';
import type { DataMode } from './dictation.ts';

type Status = (state: VoiceState, detail: string) => void;
const localPronunciation = (text: string) => text.replace(/\bEUR\b/gi, 'euros');
let generation = 0;
let controller: AbortController | undefined;
let audio: HTMLAudioElement | undefined;
let objectUrl: string | undefined;
let currentStatus: Status | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;

export function stopPlayback() {
  generation++;
  if (timer) clearTimeout(timer); timer = undefined;
  controller?.abort(); controller = undefined;
  if (audio) { audio.onended = null; audio.onerror = null; audio.pause(); audio.src = ''; audio.load(); audio = undefined; }
  if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = undefined; }
  const status = currentStatus; currentStatus = undefined;
  stopBrowserVoice();
  status?.('idle', '');
}

export async function speak(mode: DataMode, text: string, language: VoiceLanguage, status: Status) {
  stopPlayback();
  const id = generation;
  const guard: Status = (state, message) => { if (id === generation) { if (state === 'idle' || state === 'error') currentStatus = undefined; status(state, message); } };
  if (!text.trim() || text.length > 3000) { guard('error', language === 'es' ? 'El texto debe tener entre 1 y 3000 caracteres.' : 'Text must be between 1 and 3000 characters.'); return; }
  if (mode === 'local') { currentStatus = status; speakLocal(localPronunciation(text), language, guard); return; }
  const failed = language === 'es' ? 'No se pudo reproducir la respuesta. Puedes leer el texto.' : 'Could not play the answer. You can read the text.';
  const pending = language === 'es' ? 'Preparando voz…' : 'Preparing voice…';
  const playing = language === 'es' ? 'Reproduciendo respuesta.' : 'Playing answer.';
  const abort = new AbortController(); controller = abort; currentStatus = status;
  guard('starting', pending);
  timer = setTimeout(() => {
    if (id !== generation) return;
    currentStatus = undefined; stopPlayback(); status('error', failed);
  }, 35000);
  try {
    const health = await fetch('/api/health', { signal: abort.signal, cache: 'no-store' });
    if (!health.ok) throw new Error('health');
    const config: unknown = await health.json();
    if (id !== generation) return;
    if (!config || typeof config !== 'object' || !('ttsProvider' in config)) throw new Error('config');
    if (config.ttsProvider === 'browser_local') { if (timer) clearTimeout(timer); timer = undefined; controller = undefined; speakLocal(localPronunciation(text), language, guard); return; }
    if (config.ttsProvider !== 'elevenlabs') throw new Error('config');
    const response = await fetch('/api/speech/synthesize', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({text, language}), signal: abort.signal, cache: 'no-store' });
    if (!response.ok || !response.headers.get('content-type')?.toLowerCase().startsWith('audio/mpeg')) throw new Error('audio');
    const blob = await response.blob();
    if (id !== generation) return;
    objectUrl = URL.createObjectURL(blob);
    audio = new Audio(objectUrl);
    const finish = (state: 'idle' | 'error', message: string) => { if (id !== generation) return; currentStatus = undefined; stopPlayback(); status(state, message); };
    audio.onended = () => finish('idle', '');
    audio.onerror = () => finish('error', failed);
    await audio.play();
    if (id === generation) { if (timer) clearTimeout(timer); timer = undefined; guard('speaking', playing); }
  } catch {
    if (id === generation) { currentStatus = undefined; stopPlayback(); status('error', failed); }
  }
}
