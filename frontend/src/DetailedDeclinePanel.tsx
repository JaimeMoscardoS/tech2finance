import { useEffect, useRef, useState } from 'react';
import { buildDetailedDeclineAnalysis, type DecisionContext, type DeclineReport, type DetailedDeclineAnalysis } from '../../tutor-ia/src/index';
import type { DeclineSpec } from './server-api';
import type { Language } from './copy';
import { isNews, newsMatchesReport, type News } from './decline-events';
type Level = 'beginner' | 'intermediate' | 'advanced';

type Props = { initialNews: News|null; report: DeclineReport; spec: DeclineSpec; language: Language; level: Level; mode: 'local' | 'server'; decision: DecisionContext };
const ids = ['observed', 'context', 'mechanism', 'portfolio', 'decision', 'uncertainty'];
const record = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const safeUrl = (v: unknown) => typeof v === 'string' && (() => { try { return new URL(v).protocol === 'https:'; } catch { return false; } })();
const valid = (v: unknown, language: Language): v is DetailedDeclineAnalysis => {
 if (!record(v) || v.schemaVersion !== '1.0' || v.language !== language || !((v.mode === 'demo' && v.provider === 'local_rules' && v.model === null) || (v.mode === 'ai' && v.provider === 'anthropic' && typeof v.model === 'string' && /^claude-sonnet-[a-z0-9.-]+$/i.test(v.model))) || typeof v.summary !== 'string' || !v.summary.trim() || !Array.isArray(v.sources) || !Array.isArray(v.sections) || v.sections.length !== ids.length) return false;
 if (!v.sources.every((source: unknown) => record(source) && typeof source.id === 'string' && !!source.id && typeof source.label === 'string' && !!source.label && safeUrl(source.url) && (source.checkedAt === undefined || typeof source.checkedAt === 'string'))) return false;
 const sourceIds = v.sources.map((source: {id:string}) => source.id);
 if (new Set(sourceIds).size !== sourceIds.length) return false;
 return v.sections.every((section: unknown, i: number) => record(section) && section.id === ids[i] && typeof section.title === 'string' && !!section.title.trim() && Array.isArray(section.paragraphs) && section.paragraphs.length > 0 && section.paragraphs.every((p: unknown) => typeof p === 'string' && !!p.trim()) && Array.isArray(section.sourceIds) && section.sourceIds.every((id: unknown) => typeof id === 'string' && sourceIds.includes(id)));
};

export default function DetailedDeclinePanel({report,initialNews,spec,language,level,mode,decision}: Props) {
 const [news,setNews] = useState<News|null>(initialNews && newsMatchesReport(initialNews,report) ? initialNews : null);
 const [analysis,setAnalysis] = useState<DetailedDeclineAnalysis | null>(null);
 const [state,setState] = useState<'loading'|'ready'|'error'|'cancelled'>('loading');
 const [analysisDecision,setAnalysisDecision] = useState('');
 const controller = useRef<AbortController | null>(null);
 const generation = useRef(0);
 const currentDecision = useRef(decision);
 currentDecision.current = decision;
 const es = language === 'es';
 useEffect(() => {
  if (mode === 'server' && initialNews && newsMatchesReport(initialNews, report)) setNews(initialNews);
 }, [initialNews, report, mode]);
 const run = () => {
  controller.current?.abort();
  const aborter = new AbortController(); controller.current = aborter;
  const id = ++generation.current; const snapshot = structuredClone(currentDecision.current);
  setState('loading');
  if (mode === 'local') {
   try { const result = buildDetailedDeclineAnalysis({report,language,level,decision:snapshot}); if (!valid(result,language)) throw new Error('Invalid analysis'); setAnalysis(result); setAnalysisDecision(JSON.stringify(snapshot)); setState('ready'); }
   catch { setState('error'); }
   return;
  }
  const timer = setTimeout(() => aborter.abort(), 65000);
  void (async () => {
   try {
    const response = await fetch('/api/decline-explanations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decline:{...spec,language},level,decision:snapshot}),signal:aborter.signal});
    if (!response.ok) throw new Error('Analysis request failed');
    const result: unknown = await response.json();
    if (!valid(result,language)) throw new Error('Invalid analysis response');
    const resultNews = (result as unknown as {news?:unknown}).news;
    if (!isNews(resultNews) || !newsMatchesReport(resultNews,report)) throw new Error('Invalid news response');
    if (id === generation.current) { setNews(resultNews); setAnalysis(result); setAnalysisDecision(JSON.stringify(snapshot)); setState('ready'); }
   } catch {
    if (id === generation.current) setState('error');
   } finally { clearTimeout(timer); }
  })();
 };
 useEffect(() => { const start = setTimeout(run, 0); return () => { clearTimeout(start); generation.current++; controller.current?.abort(); }; }, [report,spec,language,level,mode]);
 const cancel = () => { generation.current++; controller.current?.abort(); setState('cancelled'); };
 return <><section className="detailed-analysis" aria-labelledby="detailed-title">
  <h3 id="detailed-title">{es ? 'Análisis detallado' : 'Detailed analysis'}</h3>
  <div role="status" aria-live="polite">{state === 'loading' ? (es ? 'Preparando el análisis…' : 'Preparing the analysis…') : state === 'error' ? (es ? 'No se ha podido generar el análisis. Los datos observados siguen disponibles debajo.' : 'The analysis could not be generated. The observed data remain available below.') : state === 'cancelled' ? (es ? 'Análisis cancelado. Los datos observados siguen disponibles debajo.' : 'Analysis cancelled. The observed data remain available below.') : ''}</div>
  {analysis && analysisDecision !== JSON.stringify(decision) && <p role="status">{es ? 'Contexto cambiado: actualiza el análisis para incluirlo.' : 'Context changed: update the analysis to include it.'}</p>}
  {analysis && state !== 'ready' && <p>{es ? 'Se conserva el análisis anterior mientras no haya uno nuevo.' : 'The previous analysis remains until a new one is available.'}</p>}
  <button type="button" className="button outline" onClick={state === 'loading' ? cancel : run}>{state === 'loading' ? (es ? 'Cancelar análisis' : 'Cancel analysis') : state === 'ready' ? (es ? 'Actualizar análisis con mi contexto' : 'Update analysis with my context') : (es ? 'Reintentar análisis' : 'Retry analysis')}</button>
  {analysis && <><p className="detailed-analysis__mode">{analysis.mode === 'ai' ? `${es ? 'Explicación generada con IA' : 'AI-generated explanation'} · Claude Sonnet (${analysis.model})` : (es ? 'Análisis educativo de demostración' : 'Educational demonstration analysis')}</p><p className="detailed-analysis__summary">{analysis.summary}</p><div className="detailed-analysis__sections">{analysis.sections.map(section => <section key={section.id}><h4>{section.title}</h4>{section.paragraphs.filter(p=>p !== analysis.summary || section.paragraphs.length === 1).map((p,i)=><p key={i}>{p}</p>)}{section.sourceIds.length > 0 && <p className="detailed-analysis__sources">{es ? 'Fuentes:' : 'Sources:'} {section.sourceIds.map(id => {const source=analysis.sources.find(s=>s.id===id)!; return <a key={id} href={source.url} target="_blank" rel="noreferrer">{source.label}{source.checkedAt ? ` (${source.checkedAt})` : ''}</a>;})}</p>}</section>)}</div></>}
 </section><section className="news-context" aria-labelledby="news-title"><h3 id="news-title">{es ? 'Contexto del BCE en el periodo' : 'ECB context for the period'}</h3>
  {mode === 'local' ? <p>{es ? 'Noticias no disponibles en la demo local.' : 'News is unavailable in the local demo.'}</p> : news ? <><p>{news.periodStart && news.periodEnd ? `${news.periodStart} – ${news.periodEnd}` : (es ? "Periodo no disponible" : "Period unavailable")}</p>{news.items.map(item=><article key={item.id}><span>{item.publishedAt} · {item.publisher}</span><h4 lang="en"><a href={item.url} target="_blank" rel="noreferrer">{item.title}</a></h4><p lang="en">{item.excerpt}</p><small>{es ? "Texto original en inglés. " : "Original text in English. "}</small><small>{es ? 'Contexto de mercado' : 'Market context'}</small></article>)}{news.status !== 'ready' && <p>{news.status === 'empty' ? (es ? 'No se encontraron documentos del BCE para este periodo.' : 'No ECB documents were found for this period.') : (es ? 'El contexto del BCE no está disponible.' : 'ECB context is unavailable.')}</p>}<p>{es ? "Cobertura: archivo BCE. No se han establecido noticias específicas de este fondo." : "Coverage: ECB archive. No fund-specific news has been established."}</p><p>{es ? 'La coincidencia temporal no demuestra causalidad ni identifica los activos del fondo.' : 'Timing alone does not establish causation or identify the fund holdings.'}</p></> : <p>{es ? 'El contexto del BCE aún no está disponible.' : 'ECB context is not yet available.'}</p>}
  </section></>;
}
