import test from 'node:test';
import assert from 'node:assert/strict';
import { localVoice, speakLocal, startLocalDictation, stopBrowserVoice, subscribeVoicesChanged } from './browser-voice.ts';

const voice = (lang: string, localService: boolean) => ({ lang, localService }) as SpeechSynthesisVoice;
test('selects only a local compatible voice, preferring the exact locale', () => {
  assert.equal(localVoice([voice('es-ES', false), voice('en-US', true)], 'es'), undefined);
  const exact = voice('es-ES', true);
  assert.equal(localVoice([voice('es-MX', true), exact], 'es'), exact);
  assert.equal(localVoice([voice('en-GB', true)], 'en')?.lang, 'en-GB');
});

test('speech discovery, cancellation, errors and stale events are truthful', () => {
  let voices: SpeechSynthesisVoice[] = [];
  let changed: (() => void) | undefined;
  let spoken: MockUtterance[] = [];
  let cancels = 0;
  class MockUtterance {
    voice?: SpeechSynthesisVoice; lang = ''; onstart?: () => void; onend?: () => void;
    onerror?: (event: { error: string }) => void;
    text: string;
    constructor(text: string) { this.text = text; }
  }
  const synthesis = { getVoices: () => voices, cancel: () => { cancels++; }, speak: (u: MockUtterance) => { spoken.push(u); }, addEventListener: (_: string, f: () => void) => { changed = f; }, removeEventListener: () => { changed = undefined; } };
  Object.assign(globalThis, { window: { speechSynthesis: synthesis }, SpeechSynthesisUtterance: MockUtterance });
  const states: string[] = [];
  const status = (s: string, m: string) => states.push(`${s}:${m}`);
  let updates = 0;
  const unsubscribe = subscribeVoicesChanged(() => updates++);
  speakLocal('Hola', 'es', status);
  assert.equal(spoken.length, 0);
  assert.match(states.at(-1)!, /voz local no disponible/);
  voices = [voice('es-ES', false), voice('es-ES', true)]; changed?.();
  assert.equal(updates, 1);
  speakLocal('Primera', 'es', status);
  assert.equal(spoken[0].voice, voices[1]);
  spoken[0].onstart?.();
  speakLocal('Segunda', 'es', status);
  const before = states.length;
  spoken[0].onend?.();
  assert.equal(states.length, before);
  spoken[1].onerror?.({ error: 'not-allowed' });
  assert.match(states.at(-1)!, /denegado/);
  speakLocal('x'.repeat(3001), 'es', status);
  assert.equal(spoken.length, 2);
  assert.ok(cancels >= 3);
  unsubscribe(); assert.equal(changed, undefined);
  stopBrowserVoice();
});

test('dictation requires verified on-device availability and ignores cancelled checks', async () => {
  let startCount = 0;
  let resolveAvailability: ((value: string) => void) | undefined;
  let latest: MockRecognition;
  class MockRecognition {
    static available = async (_options: { langs: string[]; processLocally: boolean }): Promise<string> => 'downloadable';
    processLocally = false; lang = ''; continuous = false; interimResults = false;
    onstart: (() => void) | null = null; onend: (() => void) | null = null;
    onerror: ((event: { error: string }) => void) | null = null;
    onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null = null;
    constructor() { latest = this; }
    start() { startCount++; this.onstart?.(); } stop() { this.onend?.(); } abort() {}
  }
  Object.assign(globalThis, { window: { SpeechRecognition: MockRecognition } });
  const states: string[] = []; const results: string[] = [];
  const status = (s: string, m: string) => states.push(`${s}:${m}`);
  await startLocalDictation('es', value => results.push(value), status);
  assert.equal(startCount, 0); assert.match(states.at(-1)!, /no disponible/);
  MockRecognition.available = options => {
    assert.deepEqual(options, { langs: ['es-ES'], processLocally: true });
    return new Promise(resolve => { resolveAvailability = resolve; });
  };
  const pending = startLocalDictation('es', value => results.push(value), status);
  stopBrowserVoice(); resolveAvailability!('available'); await pending;
  assert.equal(startCount, 0);
  MockRecognition.available = async () => 'available';
  await startLocalDictation('es', value => results.push(value), status);
  assert.equal(latest!.processLocally, true); assert.equal(startCount, 1);
  latest!.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: 'Hola' } }] });
  assert.deepEqual(results, ['Hola']);
  latest!.onerror?.({ error: 'not-allowed' });
  assert.match(states.at(-1)!, /denegado/);
  stopBrowserVoice();
});

test('unsupported recognition and network errors never fall back to remote recognition', async () => {
  let starts = 0;
  class LegacyRecognition { static async available() { return 'available'; } start() { starts++; } }
  Object.assign(globalThis, { window: { webkitSpeechRecognition: LegacyRecognition } });
  const states: string[] = [];
  await startLocalDictation('en', () => {}, (s, m) => states.push(`${s}:${m}`));
  assert.equal(starts, 0);
  assert.match(states.at(-1)!, /unavailable/);
  let instance: LocalRecognition;
  class LocalRecognition {
    static async available() { return 'available'; }
    processLocally = false; lang = ''; continuous = false; interimResults = false;
    onstart: (() => void) | null = null; onend: (() => void) | null = null;
    onerror: ((event: { error: string }) => void) | null = null; onresult = null;
    constructor() { instance = this; }
    start() { starts++; } stop() {} abort() {}
  }
  Object.assign(globalThis, { window: { SpeechRecognition: LocalRecognition } });
  await startLocalDictation('en', () => {}, (s, m) => states.push(`${s}:${m}`));
  instance!.onerror?.({ error: 'network' });
  assert.match(states.at(-1)!, /unavailable/);
  assert.equal(starts, 1);
  stopBrowserVoice();
});
