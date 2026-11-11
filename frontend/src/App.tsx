import { BrandMark } from "./components/BrandMark";
import { animate } from "motion/react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Compass,
  FlaskConical,
  GraduationCap,
  Grid2X2,
  LockKeyhole,
  Menu,
  Mic,
  MessageCircle,
  Moon,
  Sparkles,
  Sun,
  TrendingDown,
  Wallet,
  X,
} from "lucide-react";
import BankInfo from "./BankInfo";
import { simulate } from "./demo";
import { annualHistory, replayAnnual } from "./annual-history";
import { banks as localBanks, instruments as localInstruments, bankProfile as localBankProfile, type Instrument } from "./catalog";
import { requestJson, isCatalog, isSimulation, isDecline, serverTutorProvider, type Catalog, type SimulationSpec, type DeclineSpec, type ServerSimulation } from "./server-api";
import FundsExplorer from "./FundsExplorer";
import { scopeCatalog } from "./bank-scope";
import Simulator, { type FieldError } from "./Simulator";
import { MAX_SIMULATION_AMOUNT } from "./simulation-types";
import { copy, type Language } from "./copy";
import { analyzeDecline, type DeclineReport, type DecisionContext, type TutorContext } from "../../tutor-ia/src/index";
import { buildDemoPortfolio } from "./dashboard-portfolio.ts";
import { withDemoDecline } from "../../tutor-ia/src/decline-demo";
import AssistantPanel from "./AssistantPanel";
import VoiceAssistantPanel from "./VoiceAssistantPanel";
import AntiPanicPanel from "./AntiPanicPanel";
import Recovery from "./Recovery";
import HomeDashboard from "./views/home/HomeDashboard.tsx";
import FundsDashboard from "./views/funds/FundsDashboard.tsx";
import EducationDashboard from "./views/learn/EducationDashboard.tsx";
import SimulatorPage from "./views/simulator/SimulatorPage.tsx";
import { AgentPanelSection } from "./components/dashboard/AgentPanel.tsx";
import { LEVELS, type Level, type Theme } from "./types/level";
import { readStoredLevel, writeStoredLevel } from "./preferences";
const PracticeLab = lazy(() => import("./PracticeLab"));

type Page = "home" | "explore" | "simulator" | "portfolio" | "learn";
function saved(key: string, options: string[], fallback: string) {
  try {
    const value = localStorage.getItem(key);
    return value && options.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
export default function App() {
  const [language, setLanguage] = useState<Language>(
    () => saved("t2f-language", ["es", "en"], "es") as Language,
  );
  const [theme, setTheme] = useState<Theme>(
    () => saved("t2f-theme", ["light", "dark"], "light") as Theme,
  );
  const [mode, setMode] = useState<"server" | "local">(() => saved("t2f-data-mode", ["server", "local"], "server") as "server" | "local");
  const [rawCatalog, setCatalog] = useState<Catalog | null>(() => saved("t2f-data-mode", ["server", "local"], "server") === "local" ? {schemaVersion:"1.0",banks:localBanks,instruments:localInstruments,bankProfile:localBankProfile,annualHistory} : null);
  const configuredBank = import.meta.env.VITE_BANK_ID?.trim() || "demo";
  const catalog = useMemo(() => rawCatalog ? scopeCatalog(rawCatalog, configuredBank) : null, [rawCatalog, configuredBank]);
  const catalogMode = useRef<"server" | "local" | null>(saved("t2f-data-mode", ["server", "local"], "server") === "local" ? "local" : null);
  const [serverError, setServerError] = useState(false);
  const [serverLoading, setServerLoading] = useState(false);
  const [operationPending, setOperationPending] = useState(false);
  const retryAction = useRef<(() => void) | null>(null);
  const catalogRequest = useRef<AbortController | null>(null);
  const recoveryRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const restoreRecoveryFocus = useRef(false);
  const [retry, setRetry] = useState(0);
  const simulationRequest = useRef<AbortController | null>(null);
  const simulationGeneration = useRef(0);
  const declineRequest = useRef<AbortController | null>(null);
  const declineGeneration = useRef(0);
  const [declineSpec, setDeclineSpec] = useState<DeclineSpec | undefined>();
  const [demoLaunch, setDemoLaunch] = useState(false);
  const [pauseSell, setPauseSell] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [practiceResult, setPracticeResult] = useState<{spec: SimulationSpec; result: ServerSimulation} | null>(null);
  const [page, setPage] = useState<Page>("home"),
    [level, setLevel] = useState<Level>(() => readStoredLevel("beginner")),
    [levelOpen, setLevelOpen] = useState(false),
    [mobileNav, setMobileNav] = useState(false),
    [assistant, setAssistant] = useState(false),
    [voiceAssistant, setVoiceAssistant] = useState(false),
    [pause, setPause] = useState<DeclineReport | null>(null);
  const [decision,setDecision]=useState<DecisionContext>({needsLiquidity:"unknown"});
  const [voiceStartToken, setVoiceStartToken] = useState(0);
  const [assistantDecline,setAssistantDecline]=useState<DeclineReport | undefined>();
  const [initial, setInitial] = useState("500"),
    [monthly, setMonthly] = useState("50"),
    [annual, setAnnual] = useState("0"),
    [months, setMonths] = useState("12"),
    [result, setResult] = useState<
      | (ReturnType<typeof simulate> & {
          instrumentId: string;
          initial: number;
          monthly: number;
          months: number;
          annual: number;
        })
      | null
    >(null),
    [error, setError] = useState<FieldError>(null);
  const [selectedId, setSelectedId] = useState("demo-mixed");
  useEffect(() => {
    if (!levelOpen) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLevelOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [levelOpen]);
  const instruments = catalog?.instruments ?? [];
  const selected = instruments.find(
    (item) => item.instrumentId === selectedId,
  ) ?? instruments[0] ?? localInstruments[0];
  const modalRef = useRef<HTMLElement>(null),
    assistantRef = useRef<HTMLElement>(null),
    voiceRef = useRef<HTMLElement>(null),
    voiceTriggerRef = useRef<HTMLElement | null>(null),
    navRef = useRef<HTMLElement>(null),
    menuButtonRef = useRef<HTMLButtonElement>(null),
    assistantTriggerRef = useRef<HTMLElement | null>(null),
    pauseTriggerRef = useRef<HTMLElement | null>(null);
  const t = copy[language];
  const names = {
    home: t.home,
    explore: t.explore,
    simulator: t.simulator,
    portfolio: t.portfolio,
    learn: t.learnNav,
  };
  const levelNames = {
    beginner: t.beginner,
    intermediate: t.intermediate,
    advanced: t.advanced,
  };
  const euro = (n: number) =>
    new Intl.NumberFormat(language === "es" ? "es-ES" : "en-GB", {
      style: "currency",
      currency: "EUR",
    }).format(n);
  const shellRef = useRef<HTMLDivElement>(null);
  const themeMounted = useRef(false);
  useEffect(() => {
    // Transición suave al cambiar nivel o tema; no se anima la primera carga ni con movimiento reducido.
    if (!themeMounted.current) { themeMounted.current = true; return; }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || !shellRef.current) return;
    const controls = animate(shellRef.current, { opacity: [0.82, 1] }, { duration: 0.32, ease: "easeOut" });
    return () => controls.stop();
  }, [level, theme]);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.level = level;
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("t2f-language", language);
      localStorage.setItem("t2f-theme", theme);
    } catch {}
    writeStoredLevel(level);
  }, [language, theme, level]);
  useEffect(() => {
    if (!pause && !assistant && !voiceAssistant) return;
    const panel = pause ? modalRef.current : voiceAssistant ? voiceRef.current : assistantRef.current;
    const previous = pause ? pauseTriggerRef.current : voiceAssistant ? voiceTriggerRef.current : assistantTriggerRef.current;
    const items = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          "button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        ) ?? [],
      );
    items()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        pause ? setPause(null) : voiceAssistant ? setVoiceAssistant(false) : setAssistant(false);
        return;
      }
      if (e.key !== "Tab") return;
      const a = items();
      if (!a.length) return;
      if (e.shiftKey && document.activeElement === a[0]) {
        e.preventDefault();
        a[a.length - 1].focus();
      } else if (!e.shiftKey && document.activeElement === a[a.length - 1]) {
        e.preventDefault();
        a[0].focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [pause, assistant, voiceAssistant]);
  useEffect(() => {
    if (!mobileNav) return;
    const items = () =>
      Array.from(
        navRef.current?.querySelectorAll<HTMLElement>(
          "button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        ) ?? [],
      ).filter((item) => item.offsetParent !== null);
    const focusFrame = requestAnimationFrame(() => items()[0]?.focus());
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileNav(false);
        return;
      }
      if (e.key !== "Tab") return;
      const a = items();
      if (!a.length) return;
      if (e.shiftKey && document.activeElement === a[0]) {
        e.preventDefault();
        a[a.length - 1].focus();
      } else if (!e.shiftKey && document.activeElement === a[a.length - 1]) {
        e.preventDefault();
        a[0].focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", key);
      menuButtonRef.current?.focus();
    };
  }, [mobileNav]);
  useEffect(() => {
    try { localStorage.setItem("t2f-data-mode", mode); } catch {}
    simulationGeneration.current++; simulationRequest.current?.abort(); declineGeneration.current++; declineRequest.current?.abort();
    setResult(null); setPracticeResult(null); setPause(null); setAssistantDecline(undefined); setDeclineSpec(undefined); setServerError(false); setOperationPending(false); retryAction.current = null;
    catalogMode.current = mode === "local" ? "local" : null;
    if (mode === "local") { setCatalog({schemaVersion:"1.0",banks:localBanks,instruments:localInstruments,bankProfile:localBankProfile,annualHistory}); setServerLoading(false); return; }
    setCatalog(null); setServerLoading(true); const controller = new AbortController(); catalogRequest.current = controller;
    requestJson("/api/catalog", isCatalog, undefined, controller.signal).then(data => { if (!controller.signal.aborted) {restoreRecoveryFocus.current ||= !!recoveryRef.current?.contains(document.activeElement); catalogMode.current = "server";setCatalog(data);setServerLoading(false);} }).catch(() => {if (!controller.signal.aborted) {setServerError(true);setServerLoading(false);}});
    return () => controller.abort();
  }, [mode, retry]);
  useEffect(() => () => { simulationGeneration.current++; simulationRequest.current?.abort(); declineGeneration.current++; declineRequest.current?.abort(); }, []);
  useEffect(() => { simulationGeneration.current++; simulationRequest.current?.abort(); declineGeneration.current++; declineRequest.current?.abort(); retryAction.current = null; if (catalogMode.current === mode) setServerError(false); setOperationPending(false); }, [initial, monthly, annual, months, mode, language]);
  useEffect(() => { retryAction.current = null; if (catalogMode.current === mode) setServerError(false); }, [level, practiceOpen, decision]);
  useEffect(() => { if (catalog && restoreRecoveryFocus.current) { restoreRecoveryFocus.current = false; mainRef.current?.focus(); } }, [catalog]);
  useEffect(() => { if (catalog && !practiceOpen && catalogMode.current === mode) { const item = catalog.instruments.find(i => i.instrumentId === selectedId) ?? catalog.instruments[0]; if (item) selectInstrument(item); } }, [catalog, mode, practiceOpen]);
  useEffect(() => {
    if (page !== "explore" || !catalog || catalog.instruments.some(item => item.instrumentId === selectedId && item.assetType === "fund")) return;
    const first = catalog.instruments.find(item => item.assetType === "fund");
    if (first) setSelectedId(first.instrumentId);
  }, [page, catalog, selectedId]);
  const demoPortfolio = useMemo(() => buildDemoPortfolio(), []);
  const nav = [
    { key: "home" as const, icon: Grid2X2 },
    { key: "explore" as const, icon: Compass },
    { key: "simulator" as const, icon: FlaskConical },
    { key: "portfolio" as const, icon: Wallet },
    { key: "learn" as const, icon: GraduationCap },
  ];
  const choose = (p: Page) => {
    retryAction.current = null; setServerError(false);
    setPracticeOpen(false); setPracticeResult(null); setAssistantDecline(undefined); setDeclineSpec(undefined);
    if (p !== "simulator") { simulationGeneration.current++; simulationRequest.current?.abort(); declineGeneration.current++; declineRequest.current?.abort(); setOperationPending(false); }
    if (p === "explore" && selected.assetType !== "fund") { const firstFund = instruments.find(item => item.assetType === "fund"); if (firstFund) setSelectedId(firstFund.instrumentId); }
    setPage(p);
    if (mobileNav) {
      setMobileNav(false);
      menuButtonRef.current?.focus();
    }
  };
  const openPractice = () => {
    simulationGeneration.current++; simulationRequest.current?.abort();
    declineGeneration.current++; declineRequest.current?.abort();
    retryAction.current = null; setOperationPending(false); setServerError(false); setResult(null);
    setPracticeResult(null); setAssistantDecline(undefined); setDeclineSpec(undefined);
    setPracticeOpen(true); setPage("simulator");
  };
  const calculatePractice = useCallback(async (spec: SimulationSpec, signal: AbortSignal): Promise<ServerSimulation> => {
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    const item = catalog?.instruments.find(instrument => instrument.instrumentId === spec.instrumentId);
    if (!item || item.dataStatus === "missing_history") throw new Error("History unavailable");
    if (mode === "server") {
      const response = await requestJson("/api/simulations", isSimulation, spec, signal);
      if (response.instrumentId !== spec.instrumentId || response.timeline.length !== spec.periods + 1 || response.kind !== (item.dataStatus === "annual_history" ? "annual_history" : "fictional_monthly")) throw new Error("Unexpected simulation response");
      return response;
    }
    const outcome = item.dataStatus === "annual_history"
      ? (spec.periods === 5 ? replayAnnual(spec.initial, spec.recurringContribution) : null)
      : item.returns ? simulate(spec.initial, spec.recurringContribution, spec.periods, item.returns) : null;
    if (!outcome) throw new Error("Invalid simulation");
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    return {...outcome, instrumentId:item.instrumentId, currency:"EUR", contributionTiming:item.dataStatus === "annual_history" ? "year_end_after_return" : "month_start", sources:item.sourceUrl ? [{label:language === "es" ? "Ficha oficial" : "Official product page",url:item.sourceUrl,checkedAt:item.sourceDate ?? undefined}] : [], assumptions:item.dataStatus === "annual_history" ? [language === "es" ? "Rentabilidades anuales publicadas y redondeadas; aportaciones al cierre." : "Published rounded annual returns; contributions at year end."] : [language === "es" ? "Serie ficticia repetida; aportaciones al inicio de cada mes." : "Repeated fictional series; contributions at the start of each month."]};
  }, [catalog, mode, language]);
  useEffect(() => {
    if (!demoLaunch || !catalog || page !== "simulator" || selectedId !== "demo-mixed" || initial !== "1000" || monthly !== "0" || months !== "6") return;
    setDemoLaunch(false);
    const item = catalog.instruments.find(i => i.instrumentId === "demo-mixed");
    if (!item) return;
    simulationRequest.current?.abort();
    const controller = new AbortController(); simulationRequest.current = controller;
    const id = ++simulationGeneration.current;
    setServerError(false); setError(null); setOperationPending(true);
    retryAction.current = () => setDemoLaunch(true);
    const spec = {instrumentId:"demo-mixed", initial:1000, recurringContribution:0, periods:6};
    calculatePractice(spec, controller.signal).then(outcome => {
      if (controller.signal.aborted || id !== simulationGeneration.current) return;
      setResult({...outcome, initial:1000, monthly:0, annual:0, months:6});
      const decline = {basis:"instrument" as const, language, instrumentId:"demo-mixed", periods:6};
      setPauseSell(false); void showDecline(decline, () => withDemoDecline(analyzeDecline({name:item.name[language], dataKind:"fictional", sources:[], observations:outcome.timeline.map(point=>({label:`${t.month} ${point.period}`,value:100*(1+point.instrumentReturnPercent/100)}))}), "demo-mixed", 6));
    }).catch(() => {if (!controller.signal.aborted && id === simulationGeneration.current) {setServerError(true); setOperationPending(false);}});
  }, [demoLaunch, catalog, page, selectedId, initial, monthly, months, calculatePractice, language]);
  function launchDeclineDemo() {
    choose("simulator"); setSelectedId("demo-mixed"); setInitial("1000"); setMonthly("0"); setMonths("6"); setResult(null); setDemoLaunch(true);
  }
  const openAssistant = () => {
    setAssistantDecline(undefined);
    assistantTriggerRef.current = mobileNav
      ? menuButtonRef.current
      : document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (mobileNav) setMobileNav(false);
    setAssistant(true);
  };
  const openVoice = () => {
    setAssistantDecline(undefined);
    voiceTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setVoiceStartToken(token => token + 1);
    setVoiceAssistant(true);
  };
  const talkDecline = () => { if (!pause) return; setAssistantDecline(pause); setPause(null); voiceTriggerRef.current=pauseTriggerRef.current; setVoiceAssistant(true); };
  const closeMenu = () => {
    setMobileNav(false);
    menuButtonRef.current?.focus();
  };
  function validateInputs(item: Instrument): FieldError {
    const valid = (value: string, required: boolean) => (!required && !value.trim()) || (value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= MAX_SIMULATION_AMOUNT);
    if (!valid(initial, true)) return "initial";
    if (item.dataStatus === "annual_history" && !valid(annual, false)) return "annual";
    if (item.dataStatus === "fictional" && !valid(monthly, false)) return "monthly";
    return null;
  }
  function specFor(item: Instrument): SimulationSpec { return {instrumentId:item.instrumentId, initial:Number(initial), recurringContribution:Number(item.dataStatus === "annual_history" ? annual : monthly), periods:item.dataStatus === "annual_history" ? 5 : Number(months)}; }
  async function calculate(item: Instrument) {
    simulationRequest.current?.abort(); const controller = new AbortController(); simulationRequest.current=controller; const id=++simulationGeneration.current;
    setResult(null); setServerError(false); setOperationPending(mode === "server"); retryAction.current = () => { void calculate(item); }; const invalid = validateInputs(item); if (invalid) {setError(invalid);setOperationPending(false);return;} setError(null); if (item.dataStatus === "missing_history") {setOperationPending(false);return;}
    const spec=specFor(item);
    try {const outcome = mode === "server" ? await requestJson("/api/simulations", isSimulation, spec, controller.signal) : item.dataStatus === "annual_history" ? replayAnnual(spec.initial,spec.recurringContribution) : item.returns ? simulate(spec.initial,spec.recurringContribution,spec.periods,item.returns) : null;
      if (!outcome || ("instrumentId" in outcome && outcome.instrumentId !== item.instrumentId)) throw new Error("Invalid simulation");
      if (id === simulationGeneration.current && !controller.signal.aborted) setResult({...outcome,instrumentId:item.instrumentId,initial:spec.initial,monthly:Number(monthly),annual:Number(annual),months:Number(months)});
    } catch { if (id === simulationGeneration.current && !controller.signal.aborted) { if(mode === "server") setServerError(true); else setError("general"); } } finally {if(id === simulationGeneration.current) setOperationPending(false);}
  }
  function selectInstrument(item: Instrument) { declineGeneration.current++; declineRequest.current?.abort(); setSelectedId(item.instrumentId); setError(null); void calculate(item); }
  function run(e: FormEvent) { e.preventDefault(); void calculate(selected); }
  const source = selected.sourceUrl ? [{label:language === "es" ? "Ficha oficial" : "Official product page",url:selected.sourceUrl,checkedAt:selected.sourceDate ?? undefined}] : [];
  const validResult = page === "simulator" && !practiceOpen && result?.instrumentId === selected.instrumentId ? result : null;
  const practiceInstrument = practiceResult && instruments.find(item => item.instrumentId === practiceResult.spec.instrumentId);
  const tutorInstrument = page === "explore"
    ? instruments.find(item => item.instrumentId === selectedId)
    : page === "simulator" ? (practiceOpen ? practiceInstrument || undefined : selected) : undefined;
  const tutorSource = tutorInstrument?.sourceUrl ? [{label: language === "es" ? "Ficha oficial" : "Official product page", url:tutorInstrument.sourceUrl, checkedAt:tutorInstrument.sourceDate ?? undefined}] : [];
  const activeSpec = practiceOpen ? practiceResult?.spec : validResult ? {instrumentId:validResult.instrumentId,initial:validResult.initial,recurringContribution:validResult.kind === "annual_history" ? validResult.annual : validResult.monthly,periods:validResult.kind === "annual_history" ? 5 : validResult.months} : undefined;
  const activeResult = practiceOpen ? practiceResult?.result : validResult;
  const tutorContext: TutorContext = {page,level,language,...(configuredBank === "demo" && catalog ? {bank:catalog.bankProfile} : {}),
    ...((page === "explore" || page === "simulator") && tutorInstrument ? {instrument:{id:tutorInstrument.instrumentId,name:tutorInstrument.name[language],currency:tutorInstrument.currency,dataKind:tutorInstrument.dataStatus === "annual_history" ? "annual_published_returns" : tutorInstrument.dataStatus,sources:tutorSource,product:configuredBank === "demo" ? catalog?.bankProfile.products.find(p=>p.instrumentId === tutorInstrument.instrumentId) : undefined}} : {}),
    ...(page === "simulator" && activeResult && activeSpec ? {simulation:{kind:activeResult.kind,initial:activeSpec.initial,recurringContribution:activeSpec.recurringContribution,contributionTiming:activeResult.kind === "annual_history" ? "year_end_after_return" : "month_start",periods:activeSpec.periods,finalValue:activeResult.value,totalContributed:activeResult.contributed,profit:activeResult.profit,simpleReturnPercent:activeResult.simpleReturnPercent,instrumentReturnPercent:activeResult.timeline[activeResult.timeline.length-1].instrumentReturnPercent,...(activeResult.kind === "annual_history" ? {periodStart:(catalog?.annualHistory ?? annualHistory).baseline,periodEnd:activeResult.timeline[activeResult.timeline.length-1].date ?? undefined,annualReturns:(catalog?.annualHistory ?? annualHistory).returns.map(row=>({year:row.year,ratePercent:row.rate*100}))} : {})}} : {}),
    ...((page === "home" || page === "portfolio") ? {portfolio:{name:t.examplePortfolio,value:demoPortfolio.totalValue,initial:demoPortfolio.totalCost,dataKind:"fictional" as const}} : {}),
    ...(assistantDecline ? {decline:assistantDecline,decision} : {})};
  async function showDecline(spec: DeclineSpec, local: () => DeclineReport, localOnly = false) {
    pauseTriggerRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
    declineRequest.current?.abort(); const controller=new AbortController(); declineRequest.current=controller; const id=++declineGeneration.current; setServerError(false); setOperationPending(mode === "server" && !localOnly); retryAction.current = () => {void showDecline(spec,local,localOnly);};
    try {const report=mode === "server" && !localOnly ? await requestJson("/api/declines",isDecline,spec,controller.signal) : local(); if(id===declineGeneration.current && !controller.signal.aborted){setDeclineSpec(localOnly?undefined:spec);setPause(report);}}
    catch {if(id===declineGeneration.current && !controller.signal.aborted)setServerError(true);} finally {if(id===declineGeneration.current)setOperationPending(false);}
  }
  // La pausa analiza la cartera DEMO mostrada (M0..M36). El backend solo conoce su propia serie portfolio_demo, asi que se calcula siempre en local
  // y no se envia `decline` al tutor del servidor (describiria una caida distinta de la mostrada).
  function openPortfolioDecline(){setPauseSell(true);void showDecline({basis:"portfolio_demo",language},()=>analyzeDecline({name:t.examplePortfolio,dataKind:"fictional",sources:[],observations:demoPortfolio.valueSeries.map((value,index)=>({label:demoPortfolio.labels[index],value}))}),true);}
  function openSimulationDecline(){if(!validResult)return;setPauseSell(false);void showDecline({basis:"instrument",language,instrumentId:selected.instrumentId,periods:validResult.kind === "annual_history" ? 5 : validResult.months},()=>withDemoDecline(analyzeDecline({name:selected.name[language],dataKind:validResult.kind === "annual_history" ? "annual_published_returns" : "fictional",sources:source,observations:validResult.timeline.map(point=>({label:point.date ?? `${t.month} ${point.period}`,value:100*(1+point.instrumentReturnPercent/100)}))}),selected.instrumentId,validResult.kind === "annual_history" ? 5 : validResult.months));}
  function askDecline(){if(!pause)return;setAssistantDecline(pause);setPause(null);assistantTriggerRef.current=pauseTriggerRef.current;setAssistant(true);}
  const serverContext = {page:(page === "learn" ? "home" : page),level,language,bankId:configuredBank,...( (page === "explore" || page === "simulator") && tutorInstrument ? {instrumentId:tutorInstrument.instrumentId} : {}),...(page === "simulator" && activeSpec ? {simulation:activeSpec} : {}),...(assistantDecline ? {...(declineSpec ? {decline:{...declineSpec,language}} : {}),decision} : {})};
  const serverContextKey = JSON.stringify(serverContext);
  const provider = useMemo(() => serverTutorProvider(serverContext), [serverContextKey]);
  const switchMode = () => { restoreRecoveryFocus.current = !!recoveryRef.current?.contains(document.activeElement); catalogRequest.current?.abort(); simulationGeneration.current++; simulationRequest.current?.abort(); declineGeneration.current++; declineRequest.current?.abort(); retryAction.current = null; setCatalog(null); setResult(null); setMode(mode === "server" ? "local" : "server"); };
  const retryCatalog = () => { restoreRecoveryFocus.current = !!recoveryRef.current?.contains(document.activeElement); catalogRequest.current?.abort(); setServerError(false); setServerLoading(true); setRetry(n => n + 1); };
  const modeControls = <div className="connection-area">
    <details className="connection-settings">
      <summary>{language === "es" ? "Conexión" : "Connection"} · {mode === "server" ? (language === "es" ? "Servidor de demo" : "Demo server") : (language === "es" ? "Demo local" : "Local demo")}</summary>
      <p>{language === "es" ? "Elige dónde se ejecuta la demo. Cambiar de modo descarta los resultados actuales." : "Choose where the demo runs. Switching modes clears current results."}</p>
      <button type="button" onClick={switchMode}>{mode === "server" ? (language === "es" ? "Usar demo local" : "Use local demo") : (language === "es" ? "Usar servidor de demo" : "Use demo server")}</button>
    </details>
    <div role="status" className="connection-status">{(serverLoading || operationPending) ? (language === "es" ? "Conectando…" : "Connecting…") : serverError ? (language === "es" ? "No se pudo completar la solicitud." : "The request could not be completed.") : ""}</div>
    {mode === "server" && serverError && retryAction.current && <button type="button" className="connection-retry" onClick={()=>retryAction.current?.()}>{language === "es" ? "Reintentar" : "Retry"}</button>}
  </div>;
  if (!catalog) return <Recovery ref={recoveryRef} language={language} theme={theme} failed={serverError} onLanguage={setLanguage} onTheme={setTheme} onRetry={retryCatalog} onLocal={switchMode} />;
  if (!catalog.banks.length || !catalog.instruments.length) return <main className="content"><h1>{language === "es" ? "Catálogo no disponible" : "Catalogue unavailable"}</h1><p>{language === "es" ? "La entidad configurada no tiene instrumentos en esta demo. Revisa la configuración del despliegue." : "The configured institution has no instruments in this demo. Check the deployment configuration."}</p></main>;
  return (
    <div className="app-shell" ref={shellRef}>
      <aside
        ref={navRef}
        className={`sidebar ${mobileNav ? "open" : ""}`}
        inert={assistant || voiceAssistant || !!pause ? true : undefined}
        role={mobileNav ? "dialog" : undefined}
        aria-modal={mobileNav ? true : undefined}
        aria-label={t.space}
      >
        <div className="brand">
          <BrandMark />
          <div>
            <strong>
              {catalog.banks[0].name[language]}
            </strong>
            <small>{language === "es" ? "Tech2Finance" : "Tech2Finance"}</small>
          </div>
          <button
            className="icon-button close-mobile"
            onClick={closeMenu}
            aria-label={t.closeMenu}
          >
            <X size={20} />
          </button>
        </div>
        <div className="nav-label">{t.space}</div>
        <nav>
          {nav.map(({ key, icon: Icon }) => (
            <button
              key={key}
              className={`nav-item ${page === key ? "active" : ""}`}
              onClick={() => choose(key)}
              aria-current={page === key ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{names[key]}</span>
              {page === key && <span className="active-dot" />}
            </button>
          ))}
        </nav>
        <div className="side-divider" />
        <div className="nav-label">{t.learn}</div>
        <button className="nav-item" onClick={openAssistant}>
          <MessageCircle size={18} />
          <span>{t.assistant}</span>
        </button>
        <div className="side-bottom">
          <div className="profile">
            <div className="avatar">TF</div>
            <div>
              <strong>{t.demoAccount}</strong>
              <span>{t.personalSpace}</span>
            </div>
          </div>
        </div>
      </aside>
      {mobileNav && (
        <button
          className="scrim"
          onClick={closeMenu}
          aria-label={t.closeMenu}
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
      <main ref={mainRef} tabIndex={-1} className="main" inert={mobileNav || assistant || voiceAssistant || !!pause ? true : undefined}>
        <header className="topbar">
          <div className="top-left">
            <button
              ref={menuButtonRef}
              className="icon-button hamburger"
              onClick={() => setMobileNav(true)}
              aria-label={t.openMenu}
            >
              <Menu size={20} />
            </button>
            <span className="breadcrumb">
              {catalog.banks[0].name[language]} <span>/</span> <strong>{names[page]}</strong>
            </span>
          </div>
          <div className="top-actions">
            <span className="demo-badge">{t.demonstration}</span>
            <div className="preferences" aria-label={t.languageLabel}>
              <button
                className={`preference-button ${language === "es" ? "selected" : ""}`}
                onClick={() => { setPracticeResult(null); setLanguage("es"); }}
                aria-pressed={language === "es"}
                aria-label={t.switchSpanish}
              >
                ES
              </button>
              <button
                className={`preference-button ${language === "en" ? "selected" : ""}`}
                onClick={() => { setPracticeResult(null); setLanguage("en"); }}
                aria-pressed={language === "en"}
                aria-label={t.switchEnglish}
              >
                EN
              </button>
            </div>
            <button
              className="icon-button theme-button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label={theme === "light" ? t.darkTheme : t.lightTheme}
            >
              {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            <button className="icon-button theme-button" onClick={openVoice} aria-label={language === "es" ? "Hablar con IA" : "Talk to AI"}>
              <Mic size={19} />
            </button>
            <button className="icon-button theme-button" onClick={openAssistant} aria-label={t.openAssistant}>
              <Sparkles size={19} />
            </button>
            <div className="level-wrap">
              <button
                className="level-button"
                onClick={() => setLevelOpen((v) => !v)}
                aria-expanded={levelOpen}
                aria-label={`${t.detailLevel}: ${levelNames[level]}`}
              >
                <span>
                  {t.detailLevel}: <strong>{levelNames[level]}</strong>
                </span>
                <ChevronDown size={15} />
              </button>
              {levelOpen && (
                <div className="level-menu">
                  {LEVELS.map(
                    (l) => (
                      <button
                        key={l}
                        onClick={() => {
                          setLevel(l);
                          setLevelOpen(false);
                        }}
                      >
                        {levelNames[l]}
                        {level === l && <Check size={15} />}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="content">
          {modeControls}
          {page === "home" && <>
            {configuredBank === "demo" && <BankInfo profile={catalog.bankProfile} language={language} />}
            <HomeDashboard language={language} level={level} onNavigate={choose} onAskAssistant={openAssistant} />
            <div className="welcome-actions home-extra-actions">
              <button type="button" className="text-link" onClick={openPractice}>{t.practice}<small> · {t.practiceDesc}</small><ArrowRight size={15} /></button>
              {configuredBank === "demo" && <button type="button" className="text-link" onClick={launchDeclineDemo}>{language === "es" ? "Probar una caída" : "Try a decline"}<ArrowRight size={15} /></button>}
            </div>
          </>}
          {page === "explore" && <FundsExplorer language={language} level={level} onLevel={setLevel} banks={catalog.banks} instruments={instruments} history={catalog.annualHistory} bankProfile={configuredBank === "demo" ? catalog.bankProfile : undefined} selectedId={selectedId} onSelect={item => { simulationGeneration.current++; simulationRequest.current?.abort(); declineGeneration.current++; declineRequest.current?.abort(); retryAction.current = null; setOperationPending(false); setServerError(false); setSelectedId(item.instrumentId); setResult(null); }} onPractice={item => { selectInstrument(item); choose("simulator"); }} onVoice={openVoice} onText={openAssistant} />}
          {page === "simulator" && (
            practiceOpen ? <Suspense fallback={<p role="status">{language === "es" ? "Cargando práctica…" : "Loading practice…"}</p>}><PracticeLab language={language} level={level} instruments={instruments} annualHistory={catalog.annualHistory} mode={mode} calculate={calculatePractice} onActiveResult={setPracticeResult} onExit={() => choose("simulator")} openAssistant={openAssistant} /></Suspense> : (
            <SimulatorPage language={language} level={level} onExplain={openAssistant} onPractice={openPractice} product={(embedded) => (
            <Simulator
              {...{
                t,
                language,
                level,
                selected,
                bankProfile: configuredBank === "demo" ? catalog.bankProfile : undefined,
                banks: catalog.banks,
                instruments,
                history: catalog.annualHistory,
                result,
                error,
                initial,
                monthly,
                annual,
                months,
                setInitial,
                setMonthly,
                setAnnual,
                setMonths,
                setResult,
                setError,
                selectInstrument,
                run,
                openAssistant,
                euro,
                openSimulationDecline,
                embedded,
              }}
            />
            )} />
          )
          )}
          {page === "portfolio" && <>
            <div className="info-banner"><LockKeyhole size={19} /><span>{t.portfolioWarning}</span><button type="button" className="button outline" onClick={openPortfolioDecline}><TrendingDown size={17} />{t.understandFall}</button></div>
            <FundsDashboard language={language} level={level} theme={theme} onExplore={()=>choose("explore")} onSimulate={()=>choose("simulator")} onSell={openPortfolioDecline} />
            <AgentPanelSection level={level} language={language} />
          </>}
          {page === "learn" && <EducationDashboard language={language} level={level} theme={theme} onGoSimulation={()=>choose("simulator")} />}
          <footer>
            <span>© Tech2Finance · {t.footer}</span>
          </footer>
        </div>
      </main>
      <AssistantPanel provider={mode === "server" ? provider : undefined} open={assistant} onClose={()=>setAssistant(false)} context={tutorContext} panelRef={assistantRef}/>
      <VoiceAssistantPanel open={voiceAssistant} onClose={()=>setVoiceAssistant(false)} context={tutorContext} panelRef={voiceRef} provider={mode === "server" ? provider : undefined} startToken={voiceStartToken}/>
      {pause && <AntiPanicPanel level={level} sellOption={pauseSell} onTalk={talkDecline} report={pause} language={language} decision={decision} onDecision={setDecision} onClose={()=>setPause(null)} onAsk={askDecline} panelRef={modalRef}/>}

    </div>
  );
}
