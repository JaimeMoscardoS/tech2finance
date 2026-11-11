import { useEffect, useState } from 'react';

type TutorStatus = 'checking' | 'anthropic' | 'server_rules' | 'unavailable';

export function useTutorStatus(open: boolean, mode: 'local' | 'server'): TutorStatus {
 const [status, setStatus] = useState<TutorStatus>('checking');
 useEffect(() => {
  if (!open || mode !== 'server') return;
  const controller = new AbortController();
  const timer = setTimeout(() => { if (!controller.signal.aborted) { controller.abort(); setStatus('unavailable'); } }, 8000);
  setStatus('checking');
  void fetch('/api/health', {signal: controller.signal, cache: 'no-store'}).then(async response => {
   if (!response.ok) throw new Error('health');
   const value: unknown = await response.json();
   if (!value || typeof value !== 'object' || !('tutorProvider' in value) || (value.tutorProvider !== 'anthropic' && value.tutorProvider !== 'server_rules')) throw new Error('provider');
   if (!controller.signal.aborted) setStatus(value.tutorProvider);
  }).catch(() => { if (!controller.signal.aborted) setStatus('unavailable'); }).finally(() => clearTimeout(timer));
  return () => { clearTimeout(timer); controller.abort(); };
 }, [open, mode]);
 return status;
}

export function tutorStatusLabel(status: TutorStatus, language: 'es' | 'en'): string {
 const es = language === 'es';
 if (status === 'anthropic') return es ? 'Asistente con IA · Claude Sonnet' : 'AI assistant · Claude Sonnet';
 if (status === 'server_rules') return es ? 'Explicaciones de demostración' : 'Demo explanations';
 if (status === 'unavailable') return es ? 'Conexión al servidor no disponible' : 'Server connection unavailable';
 return es ? 'Comprobando conexión…' : 'Checking connection…';
}
