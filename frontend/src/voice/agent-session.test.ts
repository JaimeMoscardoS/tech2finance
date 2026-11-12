import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { isAgentSession } from './agent-session.ts';

test('accepts only a complete signed agent session with scalar dynamic variables', () => {
 const session = {provider:'elevenlabs', mode:'agent', signedUrl:'wss://api.elevenlabs.io/v1/convai/conversation?signature=short', dynamicVariables:{language:'es', knowledge_level:'beginner', page_context:'home', portfolio_facts:'{}'}, overrides:{agent:{language:'es',firstMessage:'Hola'},conversation:{textOnly:false}}};
 assert.equal(isAgentSession(session, 'es', false), true);
 assert.equal(isAgentSession({...session, signedUrl:'https://example.com'}, 'es', false), false);
 assert.equal(isAgentSession({...session, dynamicVariables:{facts:{balance:2}}}, 'es', false), false);
 assert.equal(isAgentSession(session, 'en', false), false);
 assert.equal(isAgentSession(session, 'es', true), false);
});
