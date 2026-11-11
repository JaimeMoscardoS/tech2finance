import type { RealtimeConnection } from '@elevenlabs/client';
import { startLocalDictation, stopBrowserVoice, type VoiceLanguage, type VoiceState } from './browser-voice.ts';
import { stopPlayback } from './playback.ts';

export type DataMode = 'local' | 'server';
type Status = (state: VoiceState, detail: string) => void;
let generation = 0;
let request: AbortController | undefined;
let connection: RealtimeConnection | undefined;
let timeout: ReturnType<typeof setTimeout> | undefined;
let remoteStatus: Status | undefined;

export function cancelDictation() {
 generation++;
 request?.abort(); request = undefined;
 remoteStatus = undefined;
 if (timeout) clearTimeout(timeout); timeout = undefined;
 const previous = connection; connection = undefined; previous?.close();
 stopBrowserVoice();
}

/** Explicit finish commits audio already recorded; cancellation never submits. */
export function finishDictation() {
 if (connection) { try { connection.mute(); connection.commit(); } catch { const status = remoteStatus; cancelDictation(); status?.('idle', ''); } }
 else if (request) { const status = remoteStatus; cancelDictation(); status?.('idle', ''); }
 else stopBrowserVoice();
}

export async function startDictation(mode: DataMode, language: VoiceLanguage, transcript: (text: string) => void, status: Status) {
 stopPlayback();
 cancelDictation();
 const id = generation;
 const guard: Status = (state, detail) => { if (id === generation) status(state, detail); };
 if (mode === 'local') { await startLocalDictation(language, text => { if (id === generation) transcript(text); }, guard); return; }
 const es = language === 'es';
 const failed = es ? 'No se pudo iniciar el dictado. Puedes escribir.' : 'Dictation could not start. You can type.';
 remoteStatus = status;
 guard('starting', es ? 'Preparando dictado…' : 'Preparing dictation…');
 const controller = new AbortController(); request = controller;
 timeout = setTimeout(() => { if (id === generation) { cancelDictation(); status('error', failed); } }, 30000);
 try {
  const healthResponse = await fetch('/api/health', { signal: controller.signal, cache: 'no-store' });
  if (!healthResponse.ok) throw new Error('health');
  const health: unknown = await healthResponse.json();
  if (id !== generation) return;
  if (!health || typeof health !== 'object' || !('speechProvider' in health)) throw new Error('health');
  if (health.speechProvider === 'browser_local') {
   if (timeout) clearTimeout(timeout); timeout = undefined; request = undefined; remoteStatus = undefined;
   await startLocalDictation(language, text => { if (id === generation) transcript(text); }, guard); return;
  }
  if (health.speechProvider !== 'elevenlabs' || !('speechKeyConfigured' in health) || health.speechKeyConfigured !== true) throw new Error('configuration');
  const response = await fetch('/api/speech/token', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({language}), signal: controller.signal, cache: 'no-store' });
  if (!response.ok) throw new Error('token');
  const value: unknown = await response.json();
  if (id !== generation) return;
  if (!value || typeof value !== 'object' || !('token' in value) || typeof value.token !== 'string' || !value.token || !('language' in value) || value.language !== language || !('provider' in value) || value.provider !== 'elevenlabs' || !('model' in value) || value.model !== 'scribe_v2_realtime' || !('schemaVersion' in value) || value.schemaVersion !== '1.0' || !('expiresInSeconds' in value) || value.expiresInSeconds !== 900) throw new Error('invalid token response');
  const { CommitStrategy, RealtimeEvents, Scribe } = await import('@elevenlabs/client');
  if (id !== generation) return;
  request = undefined;
  const session = Scribe.connect({ token: value.token, modelId: 'scribe_v2_realtime', languageCode: language, commitStrategy: CommitStrategy.VAD, microphone: {echoCancellation: true, noiseSuppression: true} });
  connection = session;
  session.on(RealtimeEvents.AUDIO_STARTED, () => guard('listening', es ? 'Escuchando…' : 'Listening…'));
  session.on(RealtimeEvents.COMMITTED_TRANSCRIPT, data => {
   if (id !== generation || !data.text.trim()) return;
   const text = data.text.trim(); cancelDictation(); transcript(text); status('idle', '');
  });
  session.on(RealtimeEvents.ERROR, () => { if (id === generation) { cancelDictation(); status('error', failed); } });
  session.on(RealtimeEvents.CLOSE, () => { if (id === generation) { cancelDictation(); status('error', failed); } });
 } catch {
  if (id === generation) { cancelDictation(); status('error', failed); }
 }
}
