/** Browser-only local voice. No network-backed recognition or remote voices are used. */
export type VoiceLanguage = 'es' | 'en';
export type VoiceState = 'idle' | 'starting' | 'speaking' | 'paused' | 'listening' | 'error';
type Status = (state: VoiceState, message: string) => void;
type Recognition = {
  processLocally: boolean; lang: string; continuous: boolean; interimResults: boolean;
  onstart: (() => void) | null; onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  start(): void; stop(): void; abort(): void;
};
type RecognitionConstructor = {
  new(): Recognition;
  available?: (options: { langs: string[]; processLocally: boolean }) => Promise<string>;
};
type VoiceWindow = Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
let generation = 0;
let activeRecognition: Recognition | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let activeStatus: Status | undefined;

const messages = {
  es: { unavailable: 'Texto disponible; voz local no disponible.', tooLong: 'El texto supera el límite de 3000 caracteres.', starting: 'Preparando voz local.', speaking: 'Reproduciendo voz local.', paused: 'Lectura pausada.', listening: 'Escuchando en este dispositivo.', finished: 'Voz detenida.', failed: 'No se ha podido usar la voz local.', denied: 'Permiso de micrófono o voz denegado.', dictation: 'Dictado local no disponible; puedes escribir.' },
  en: { unavailable: 'Text available; local voice unavailable.', tooLong: 'Text exceeds the 3000 character limit.', starting: 'Preparing local voice.', speaking: 'Playing local voice.', paused: 'Reading paused.', listening: 'Listening on this device.', finished: 'Voice stopped.', failed: 'Local voice could not be used.', denied: 'Microphone or voice permission denied.', dictation: 'Local dictation unavailable; you can type.' },
} as const;
const locale = (language: VoiceLanguage) => language === 'es' ? 'es-ES' : 'en-US';

export function localVoice(voices: SpeechSynthesisVoice[], language: VoiceLanguage): SpeechSynthesisVoice | undefined {
  const matching = voices.filter(voice => voice.localService === true && voice.lang.toLowerCase().split('-')[0] === language);
  return matching.find(voice => voice.lang.toLowerCase() === locale(language).toLowerCase()) ?? matching[0];
}

/** Stop every active browser voice session, including pending availability checks. */
export function stopBrowserVoice(): void {
  generation++;
  if (timer) clearTimeout(timer);
  timer = undefined;
  const recognition = activeRecognition;
  activeRecognition = undefined;
  if (recognition) { try { recognition.abort(); } catch { /* Already stopped. */ } }
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  const status = activeStatus;
  activeStatus = undefined;
  status?.('idle', '');
}

export function subscribeVoicesChanged(listener: () => void): () => void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return () => {};
  const synthesis = window.speechSynthesis;
  synthesis.addEventListener('voiceschanged', listener);
  return () => synthesis.removeEventListener('voiceschanged', listener);
}

export function speakLocal(text: string, language: VoiceLanguage, status: Status): void {
  stopBrowserVoice();
  const m = messages[language];
  if (text.length > 3000) { status('error', m.tooLong); return; }
  if (typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') { status('error', m.unavailable); return; }
  const voice = localVoice(window.speechSynthesis.getVoices(), language);
  if (!voice) { status('error', m.unavailable); return; }
  const id = generation;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  activeStatus = status;
  status('starting', m.starting);
  utterance.onstart = () => { if (id === generation) status('speaking', m.speaking); };
  utterance.onpause = () => { if (id === generation) status('paused', m.paused); };
  utterance.onresume = () => { if (id === generation) status('speaking', m.speaking); };
  utterance.onend = () => { if (id === generation) { activeStatus = undefined; status('idle', m.finished); } };
  utterance.onerror = event => { if (id === generation) { activeStatus = undefined; status('error', event.error === 'not-allowed' ? m.denied : m.failed); } };
  try { if (window.speechSynthesis.paused) window.speechSynthesis.resume(); window.speechSynthesis.speak(utterance); } catch { activeStatus = undefined; status('error', m.failed); }
}

export async function startLocalDictation(language: VoiceLanguage, transcript: (text: string) => void, status: Status): Promise<void> {
  stopBrowserVoice();
  const id = generation;
  const m = messages[language];
  if (typeof window === 'undefined') { status('error', m.dictation); return; }
  const browser = window as VoiceWindow;
  const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
  if (!Constructor || typeof Constructor.available !== 'function') { status('error', m.dictation); return; }
  let recognition: Recognition;
  try { recognition = new Constructor(); } catch { status('error', m.dictation); return; }
  if (!('processLocally' in recognition)) { status('error', m.dictation); return; }
  activeStatus = status;
  status('starting', m.starting);
  let available: string;
  try { available = await Constructor.available({ langs: [locale(language)], processLocally: true }); }
  catch { if (id === generation) { activeStatus = undefined; status('error', m.dictation); } return; }
  if (id !== generation) return;
  if (available !== 'available') { activeStatus = undefined; status('error', m.dictation); return; }
  try { recognition.processLocally = true; } catch { activeStatus = undefined; status('error', m.dictation); return; }
  if (recognition.processLocally !== true) { activeStatus = undefined; status('error', m.dictation); return; }
  recognition.lang = locale(language);
  recognition.continuous = false;
  recognition.interimResults = false;
  activeRecognition = recognition;
  recognition.onstart = () => { if (id === generation) status('listening', m.listening); };
  recognition.onresult = event => {
    if (id !== generation) return;
    for (let i = event.resultIndex; i < event.results.length; i++) if (event.results[i].isFinal) transcript(event.results[i][0].transcript);
  };
  recognition.onerror = event => {
    if (id !== generation) return;
    if (timer) clearTimeout(timer);
    timer = undefined; activeRecognition = undefined; activeStatus = undefined;
    status('error', event.error === 'not-allowed' || event.error === 'service-not-allowed' ? m.denied : m.dictation);
  };
  recognition.onend = () => {
    if (id !== generation || !activeRecognition) return;
    if (timer) clearTimeout(timer);
    timer = undefined; activeRecognition = undefined; activeStatus = undefined; status('idle', m.finished);
  };
  try {
    recognition.start();
    timer = setTimeout(() => { if (id === generation && activeRecognition) { try { recognition.stop(); } catch { stopBrowserVoice(); } } }, 30000);
  } catch { activeRecognition = undefined; activeStatus = undefined; status('error', m.dictation); }
}
