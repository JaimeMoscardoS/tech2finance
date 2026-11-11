import test from 'node:test';
import assert from 'node:assert/strict';
import { speak, stopPlayback } from './playback.ts';

test('server playback sends language, cancels old audio and releases URLs', async () => {
 const oldFetch = globalThis.fetch, oldAudio = globalThis.Audio, oldCreate = URL.createObjectURL, oldRevoke = URL.revokeObjectURL;
 const requests: string[] = [], revoked: string[] = [], instances: FakeAudio[] = [];
 class FakeAudio {
  src: string; onended: (() => void) | null = null; onerror: (() => void) | null = null; paused = false;
  constructor(src: string) { this.src = src; instances.push(this); }
  play() { return Promise.resolve(); } pause() { this.paused = true; } load() {}
 }
 globalThis.Audio = FakeAudio as unknown as typeof Audio;
 URL.createObjectURL = () => `blob:${instances.length}`;
 URL.revokeObjectURL = url => { revoked.push(url); };
 globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
  if (String(url).endsWith('health')) return new Response(JSON.stringify({ttsProvider:'elevenlabs'}));
  requests.push(JSON.parse(init!.body as string).language);
  return new Response('ID3audio', {headers: {'content-type':'audio/mpeg'}});
 }) as typeof fetch;
 try {
  const states: string[] = [];
  await speak('server', 'hola', 'es', state => states.push(state));
  const staleEnd = instances[0].onended;
  await speak('server', 'hello', 'en', state => states.push(state));
  assert.equal(instances[0].paused, true); assert.equal(instances[0].src, '');
  staleEnd?.(); assert.equal(states.at(-1), 'speaking');
  instances[1].onended?.();
  assert.deepEqual(requests, ['es', 'en']); assert.deepEqual(revoked, ['blob:0', 'blob:1']);
  assert.equal(states.at(-1), 'idle');
 } finally { stopPlayback(); globalThis.fetch = oldFetch; globalThis.Audio = oldAudio; URL.createObjectURL = oldCreate; URL.revokeObjectURL = oldRevoke; }
});

test('cancellation suppresses stale response; local mode makes no requests', async () => {
 const oldFetch = globalThis.fetch; let resolve!: (response: Response) => void; let calls = 0;
 globalThis.fetch = (() => { calls++; return new Promise<Response>(r => { resolve = r; }); }) as typeof fetch;
 try {
  const states: string[] = [];
  const pending = speak('server', 'hello', 'en', state => states.push(state));
  stopPlayback(); resolve(new Response(JSON.stringify({ttsProvider:'elevenlabs'})));
  await pending; assert.equal(calls, 1); assert.equal(states.at(-1), 'idle');
  await speak('local', 'hello', 'en', state => states.push(state));
  assert.equal(calls, 1);
 } finally { stopPlayback(); globalThis.fetch = oldFetch; }
});

test('preparation times out, aborts and does not allow a late response', async () => {
 const oldFetch = globalThis.fetch, oldSet = globalThis.setTimeout, oldClear = globalThis.clearTimeout;
 let timeout!: () => void; let resolve!: (response: Response) => void; let signal: AbortSignal | undefined;
 globalThis.setTimeout = ((fn: () => void) => { timeout = fn; return 1; }) as unknown as typeof setTimeout;
 globalThis.clearTimeout = (() => {}) as typeof clearTimeout;
 globalThis.fetch = ((_url: unknown, init?: RequestInit) => { signal = init?.signal as AbortSignal; return new Promise<Response>(r => {resolve = r;}); }) as typeof fetch;
 try {
  const states: string[] = [];
  const pending = speak('server', 'hello', 'en', state => states.push(state));
  timeout(); assert.equal(signal?.aborted, true); assert.equal(states.at(-1), 'error');
  resolve(new Response(JSON.stringify({ttsProvider:'elevenlabs'}))); await pending;
  assert.equal(states.at(-1), 'error');
 } finally { stopPlayback(); globalThis.fetch = oldFetch; globalThis.setTimeout = oldSet; globalThis.clearTimeout = oldClear; }
});

test('a stale preparation cannot clear the current session timeout', async () => {
 const oldFetch = globalThis.fetch, oldSet = globalThis.setTimeout, oldClear = globalThis.clearTimeout;
 const callbacks: Array<() => void> = []; const cleared: number[] = []; const resolves: Array<(response: Response) => void> = [];
 globalThis.setTimeout = ((fn: () => void) => { callbacks.push(fn); return callbacks.length; }) as unknown as typeof setTimeout;
 globalThis.clearTimeout = ((id: number) => {cleared.push(id);}) as unknown as typeof clearTimeout;
 globalThis.fetch = (() => new Promise<Response>(r => {resolves.push(r);})) as typeof fetch;
 try {
  const states: string[] = [];
  const first = speak('server', 'hola', 'es', () => {});
  const second = speak('server', 'hello', 'en', state => states.push(state));
  resolves[0](new Response(JSON.stringify({ttsProvider:'browser_local'}))); await first;
  assert.deepEqual(cleared, [1]); callbacks[1](); assert.equal(states.at(-1), 'error');
  resolves[1](new Response(JSON.stringify({ttsProvider:'browser_local'}))); await second;
 } finally { stopPlayback(); globalThis.fetch = oldFetch; globalThis.setTimeout = oldSet; globalThis.clearTimeout = oldClear; }
});

test('stopping local playback reports idle once and ignores late events', async () => {
 const oldWindow = (globalThis as any).window, oldUtterance = globalThis.SpeechSynthesisUtterance;
 let utterance: any;
 class FakeUtterance { voice: any; lang = ''; onstart: any; onend: any; constructor(_text: string) { utterance = this; } }
 (globalThis as any).window = {speechSynthesis:{paused:false,cancel(){},getVoices(){return [{localService:true,lang:'en-US'}];},speak(value:any){value.onstart();}}};
 globalThis.SpeechSynthesisUtterance = FakeUtterance as unknown as typeof SpeechSynthesisUtterance;
 try {
  const states: string[] = [];
  await speak('local', 'hello', 'en', state => states.push(state));
  stopPlayback(); utterance.onend();
  assert.deepEqual(states, ['starting', 'speaking', 'idle']);
 } finally { stopPlayback(); (globalThis as any).window = oldWindow; globalThis.SpeechSynthesisUtterance = oldUtterance; }
});
