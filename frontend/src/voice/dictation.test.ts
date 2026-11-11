import test from 'node:test';
import assert from 'node:assert/strict';
import { Scribe } from '@elevenlabs/client';
import { cancelDictation, startDictation } from './dictation.ts';

test('server dictation selects language, emits only committed text and cancels stale events', async () => {
 const originalFetch = globalThis.fetch;
 const originalConnect = Scribe.connect;
 const callbacks: Record<string, (data: any) => void> = {};
 const requests: {url: string; body?: string}[] = [];
 let options: any; let closed = 0;
 globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
  requests.push({url: String(url), body: init?.body as string | undefined});
  return new Response(JSON.stringify(String(url).endsWith('health') ? {speechProvider: 'elevenlabs', speechKeyConfigured: true} : {schemaVersion:'1.0',provider:'elevenlabs',language:JSON.parse(init!.body as string).language,model:'scribe_v2_realtime',token:'one-use',expiresInSeconds:900}), {status: 200});
 }) as typeof fetch;
 Scribe.connect = ((value: any) => { options = value; return {on: (event: string, fn: (data:any)=>void) => {callbacks[event] = fn;}, close: () => {closed++;}}; }) as typeof Scribe.connect;
 try {
  for (const language of ['es', 'en'] as const) {
   const results: string[] = []; const states: string[] = [];
   await startDictation('server', language, text => results.push(text), state => states.push(state));
   assert.equal(options.languageCode, language); assert.equal(options.token, 'one-use'); assert.equal(options.commitStrategy, 'vad');
   callbacks.partial_transcript?.({text:'draft'}); assert.deepEqual(results, []);
   callbacks.committed_transcript({text:'finished'}); callbacks.committed_transcript({text:'stale'});
   assert.deepEqual(results, ['finished']); assert.equal(states.at(-1), 'idle');
  }
  assert.deepEqual(requests.filter(r => r.url.endsWith('/token')).map(r => JSON.parse(r.body!).language), ['es','en']);
  assert.equal(closed, 2);
 } finally { cancelDictation(); globalThis.fetch = originalFetch; Scribe.connect = originalConnect; }
});

test('missing key and cancellation during token request never start capture', async () => {
 const originalFetch = globalThis.fetch; const originalConnect = Scribe.connect; let connected = 0;
 Scribe.connect = (() => {connected++; throw new Error('unexpected');}) as typeof Scribe.connect;
 try {
  globalThis.fetch = (async () => new Response(JSON.stringify({speechProvider:'elevenlabs',speechKeyConfigured:false}))) as typeof fetch;
  const states: string[] = []; await startDictation('server','es',()=>{},state=>states.push(state));
  assert.equal(states.at(-1), 'error'); assert.equal(connected, 0);
  let resolve!: (response: Response) => void;
  globalThis.fetch = (() => new Promise<Response>(r => {resolve = r;})) as typeof fetch;
  const pending = startDictation('server','en',()=>{},state=>states.push(state));
  cancelDictation(); resolve(new Response(JSON.stringify({speechProvider:'elevenlabs',speechKeyConfigured:true})));
  await pending; assert.equal(connected, 0);
 } finally { cancelDictation(); globalThis.fetch = originalFetch; Scribe.connect = originalConnect; }
});

test('local mode never requests server or external services', async () => {
 const originalFetch = globalThis.fetch;
 let requests = 0; const states: string[] = [];
 globalThis.fetch = (() => { requests++; throw new Error('unexpected request'); }) as typeof fetch;
 try {
  await startDictation('local', 'es', () => {}, state => states.push(state));
  assert.equal(requests, 0); assert.equal(states.at(-1), 'error');
 } finally { cancelDictation(); globalThis.fetch = originalFetch; }
});
