// Visible origin of a server tutor reply: rules, or Claude writing from verified data.
export function replyOrigin(provider: string, language: 'es' | 'en'): string | null {
 if (provider === 'anthropic') return language === 'es' ? 'Redactada con IA (Claude); cifras contrastadas con datos del servidor' : 'Written by AI (Claude); figures checked against server data';
 if (provider === 'server_rules') return language === 'es' ? 'Respuesta por reglas' : 'Rule-based response';
 return null;
}
