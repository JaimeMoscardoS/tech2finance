export type AgentSession = {
 provider: 'elevenlabs'; mode: 'agent'; signedUrl: string;
 dynamicVariables: Record<string, string | number | boolean>;
 overrides: {agent: {language: 'es' | 'en'; firstMessage: string}; conversation: {textOnly: boolean}};
};
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
export function isAgentSession(value: unknown, language: 'es' | 'en', textOnly: boolean): value is AgentSession {
 if (!record(value) || value.provider !== 'elevenlabs' || value.mode !== 'agent' || typeof value.signedUrl !== 'string') return false;
 try { if (new URL(value.signedUrl).protocol !== 'wss:') return false; } catch { return false; }
 if (!record(value.dynamicVariables) || !Object.values(value.dynamicVariables).every(v => typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v)))) return false;
 if (!record(value.overrides) || !record(value.overrides.agent) || !record(value.overrides.conversation)) return false;
 return value.overrides.agent.language === language && typeof value.overrides.agent.firstMessage === 'string' && value.overrides.conversation.textOnly === textOnly;
}
