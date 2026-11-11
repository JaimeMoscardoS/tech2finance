import test from 'node:test';
import assert from 'node:assert/strict';
import { stopBrowserVoice } from './browser-voice.ts';
import { resetServerVoiceCache, speak, stopVoice } from './server-voice.ts';

type Handler = (url: string) => Response | Promise<Response>;
const audioResponse = () => new Response(new Blob(['mp3']), { status: 200, headers: { 'content-type': 'audio/mpeg' } });
const health = (provider: string) => new Response(JSON.stringify({ speechProvider: provider, speechKeyConfigured: provider === 'elevenlabs' }), { status: 200 });

function setup(handler: Handler) {
  resetServerVoiceCache();
  const urls: string[] = [];
  const local: string[] = [];
  const players: MockAudio[] = [];
  let revoked = 0;
  class MockAudio {
    onplaying: (() => void) | null = null; onended: (() => void) | null = null; onerror: (() => void) | null = null;
    paused = false;
    src: string;
    constructor(src: string) { this.src = src; players.push(this); }
    async play() { this.onplaying?.(); }
    pause() { this.paused = true; }
  }
  Object.assign(globalThis, {
    window: { speechSynthesis: { cancel() {}, getVoices: () => [] } },
    Audio: MockAudio,
    fetch: async (url: string) => { urls.push(url); return handler(url); },
  });
  URL.createObjectURL = () => 'blob:mock';
  URL.revokeObjectURL = () => { revoked++; };
  const states: string[] = [];
  const status = (s: string, m: string) => { states.push(`${s}:${m}`); if (m.includes('local no disponible')) local.push(m); };
  return { urls, local, players, states, status, revoked: () => revoked };
}

test('falls back to local voice when health reports browser', async () => {
  const t = setup(url => url === '/api/health' ? health('browser_local') : audioResponse());
  await speak('Hola', 'es', t.status);
  assert.deepEqual(t.urls, ['/api/health']);
  assert.equal(t.local.length, 1);
});

test('falls back to local voice when /api/tts fails', async () => {
  const t = setup(url => url === '/api/health' ? health('elevenlabs') : new Response('{}', { status: 503 }));
  await speak('Hola', 'es', t.status);
  assert.deepEqual(t.urls, ['/api/health', '/api/tts']);
  assert.equal(t.local.length, 1);
  assert.equal(t.players.length, 0);
});

test('falls back to local voice when text exceeds 1500 characters', async () => {
  const t = setup(() => audioResponse());
  await speak('a'.repeat(1501), 'en', t.status);
  assert.deepEqual(t.urls, []);
  assert.equal(t.states.at(-1)!.startsWith('error:'), true);
});

test('plays server audio and stop cancels it', async () => {
  const t = setup(url => url === '/api/health' ? health('elevenlabs') : audioResponse());
  await speak('Hola', 'es', t.status);
  assert.equal(t.players.length, 1);
  assert.equal(t.states.at(-1), 'speaking:Reproduciendo voz (ElevenLabs).');
  stopVoice();
  assert.equal(t.players[0].paused, true);
  assert.equal(t.revoked(), 1);
  assert.equal(t.states.at(-1), 'idle:');
  assert.equal(t.local.length, 0);
});

test('stopBrowserVoice during playback reports idle', async () => {
  const t = setup(url => url === '/api/health' ? health('elevenlabs') : audioResponse());
  await speak('Hola', 'es', t.status);
  stopBrowserVoice();
  assert.equal(t.players[0].paused, true);
  assert.equal(t.states.filter(s => s === 'idle:').length, 1);
});

test('stopVoice during the health check starts nothing', async () => {
  let release: (r: Response) => void = () => {};
  const t = setup(url => url === '/api/health' ? new Promise<Response>(r => { release = r; }) : audioResponse());
  const pending = speak('Hola', 'es', t.status);
  stopVoice();
  release(health('elevenlabs'));
  await pending;
  assert.deepEqual(t.urls, ['/api/health']);
  assert.equal(t.local.length, 0);
  assert.equal(t.states.at(-1), 'idle:');
});
