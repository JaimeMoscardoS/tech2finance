import { useEffect, useRef, useState } from 'react';
import { isDecline, type DeclineSpec } from './server-api';
import type { DeclineReport } from '../../tutor-ia/src/index';

type NewsItem = {id:string; title:string; url:string; publisher:string; publishedAt:string; excerpt:string; scope:'market_context'};
export type News = {status:'ready'|'empty'|'unavailable'; provider:'ecb_archive'; checkedAt:string; periodStart:string|null; periodEnd:string|null; items:NewsItem[]; limitations:string[]};
type Event = {schemaVersion:'1.0'; status:'triggered'|'not_triggered'; eventId:string|null; thresholdPercent:5; report:DeclineReport; news:News};
const obj = (v:unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v:unknown,max:number) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const date = (v:unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v;
const url = (v:unknown) => { try { const u = new URL(String(v)); return u.protocol === 'https:' && (u.hostname === 'ecb.europa.eu' || u.hostname.endsWith('.ecb.europa.eu')) && !u.username && !u.password && String(v).length <= 2048; } catch { return false; } };
export function isNews(v:unknown): v is News {
 if (!obj(v) || !['ready','empty','unavailable'].includes(v.status) || v.provider !== 'ecb_archive' || typeof v.checkedAt !== 'string' || v.checkedAt.length > 40 || Number.isNaN(Date.parse(v.checkedAt)) || !Array.isArray(v.items) || v.items.length > 20 || !Array.isArray(v.limitations) || v.limitations.length > 20 || !v.limitations.every((x:unknown)=>str(x,1000))) return false;
 if (v.periodStart === null && v.periodEnd === null) return v.status === 'unavailable' && v.items.length === 0;
 if (!date(v.periodStart) || !date(v.periodEnd) || v.periodStart > v.periodEnd) return false;
 if ((v.status === 'ready') !== (v.items.length > 0)) return false;
 const ids = new Set();
 return v.items.every((i:unknown) => { if (!obj(i) || !str(i.id,200) || ids.has(i.id) || !str(i.title,500) || !url(i.url) || !str(i.publisher,200) || !date(i.publishedAt) || i.publishedAt < v.periodStart || i.publishedAt > v.periodEnd || !str(i.excerpt,3000) || i.scope !== 'market_context') return false; ids.add(i.id); return true; });
}
export function newsMatchesReport(news:News, report:DeclineReport):boolean {
 if (news.periodEnd !== report.latestLabel) return false;
 if (news.periodEnd === null) return news.periodStart === null && news.status === 'unavailable';
 const open = report.episodes.filter(e=>e.recoveryLabel === null).at(-1);
 const peak = open?.peakLabel ?? news.periodEnd;
 if (!date(peak)) return false;
 const floor = new Date(Date.parse(news.periodEnd) - 365*86400000).toISOString().slice(0,10);
 return news.periodStart === (peak > floor ? peak : floor);
}
export function isDeclineEvent(v:unknown): v is Event { return obj(v) && v.schemaVersion === '1.0' && ['triggered','not_triggered'].includes(v.status) && (v.status === 'triggered' ? str(v.eventId,200) : v.eventId === null) && v.thresholdPercent === 5 && isDecline(v.report) && isNews(v.news) && newsMatchesReport(v.news,v.report) && (v.status === 'triggered') === (v.report.status === 'ok' && v.report.currentDrawdownPercent !== null && v.report.currentDrawdownPercent >= 5); }

export function useDeclineEvent(enabled:boolean, mode:'local'|'server', language:'es'|'en', fingerprint:string) {
 const [value,setValue] = useState<Event|null>(null); const [state,setState] = useState<'idle'|'loading'|'ready'|'error'>('idle'); const [attempt,setAttempt] = useState(0);
 const [hasError,setHasError] = useState(false);
 const cache = useRef(new Map<string,{value:Event; time:number}>()); const serial = useRef(0); const previousKey = useRef('');
 useEffect(() => {
  const id=++serial.current;
  if (!enabled || mode !== 'server') { previousKey.current=''; setValue(null); setState('idle'); return; }
  const key=JSON.stringify({fingerprint,language}); const cached=cache.current.get(key);
  if (key !== previousKey.current) {setValue(null); previousKey.current=key;}
  if (cached && Date.now()-cached.time < 300000) {setValue(cached.value);setState('ready');return;}
  cache.current.delete(key);
  const controller=new AbortController(); let deadline:ReturnType<typeof setTimeout>;
  const start=setTimeout(()=>{setState('loading'); deadline=setTimeout(()=>controller.abort(),25000); void (async()=>{try {
    const spec:DeclineSpec={basis:'portfolio_demo',language};
    const response=await fetch('/api/decline-events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decline:spec}),signal:controller.signal});
    if (!response.ok) throw new Error('request'); const result:unknown=await response.json(); if (!isDeclineEvent(result)) throw new Error('invalid');
    if (id===serial.current && !controller.signal.aborted) {if (result.news.status !== 'unavailable') {cache.current.set(key,{value:result,time:Date.now()}); if (cache.current.size > 64) cache.current.delete(cache.current.keys().next().value!);} else if (result.status === 'triggered') setHasError(true); setValue(result);setState(result.status === 'triggered' && result.news.status === 'unavailable' ? 'error' : 'ready');}
   } catch {if (id===serial.current) {setHasError(true);setState('error');}} finally {clearTimeout(deadline);} })();},0);
  return ()=>{++serial.current;clearTimeout(start);clearTimeout(deadline);controller.abort();};
 },[enabled,mode,language,fingerprint,attempt]);
 return {event:value,state,hasError,retry:()=>{if (state === 'loading') return; cache.current.delete(previousKey.current); setAttempt(n=>n+1);}};
}
