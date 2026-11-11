import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BarChart3,
  Compass,
  FlaskConical,
  Grid2X2,
  Leaf,
  LockKeyhole,
  Menu,
  Mic,
  MessageCircle,
  Moon,
  Sun,
  TrendingDown,
  Wallet,
  X,
} from "lucide-react";
import CountUp from "./CountUp";
import LevelSelector from "./LevelSelector";
import { ShinyButton } from "./components/ui/shiny-button";
import BankInfo from "./BankInfo";
import { simulate } from "./demo";
import { annualHistory, replayAnnual } from "./annual-history";
import { banks as localBanks, instruments as localInstruments, bankProfile as localBankProfile, type Instrument } from "./catalog";
import { requestJson, isCatalog, isSimulation, isDecline, serverTutorProvider, type Catalog, type SimulationSpec, type DeclineSpec, type ServerSimulation } from "./server-api";
import InvestmentChart from "./LazyInvestmentChart";
import FundsExplorer from "./FundsExplorer";
import { scopeCatalog } from "./bank-scope";
import Simulator, { type FieldError } from "./Simulator";
import { MAX_SIMULATION_AMOUNT } from "./simulation-types";
import { copy, type Language } from "./copy";
import { analyzeDecline, type DeclineReport, type DecisionContext, type TutorContext } from "../../tutor-ia/src/index";
import navData from "../../shared/nav-history.json";
import dataManifest from "../../shared/data-manifest.json";
import localData from "../../shared/demo-data.json";
import { simulateNav } from "./nav-history";

import AssistantPanel from "./AssistantPanel";
import VoiceAssistantPanel from "./VoiceAssistantPanel";
import AntiPanicPanel from "./AntiPanicPanel";
import Recovery from "./Recovery";
const PracticeLab = lazy(() => import("./PracticeLab"));

type Page = "home" | "explore" | "simulator" | "portfolio";
type Level = "beginner" | "intermediate" | "advanced";
function saved(key: string, options: string[], fallback: string) {
  try {
    const value = localStorage.getItem(key);
    return value && options.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
const localCatalog = {schemaVersion:"2.0",banks:localBanks,instruments:localInstruments,bankProfile:localBankProfile,annualHistory,navHistory:navData,demoStudyInstrumentIds:localData.demoStudyInstrumentIds,portfolioExample:localData.portfolioExample} as Catalog;
export default function App() {
  const [language, setLanguage] = useState<Language>(
    () => saved("t2f-language", ["es", "en"], "es") as Language,
  );
  const [theme, setTheme] = useState<"light" | "dark">(
    () => saved("t2f-theme", ["light", "dark"], "light") as "light" | "dark",
  );
  const [mode, setMode] = useState<"server" | "local">(() => saved("t2f-data-mode", ["server", "local"], "server") as "server" | "local");
  const [rawCatalog, setCatalog] = useState<Catalog | null>(() => saved("t2f-data-mode", ["server", "local"], "server") === "local" ? localCatalog : null);
  const configuredBank = import.meta.env.VITE_BANK_ID?.trim() || "demo";
  const catalog = useMemo(() => rawCatalog && rawCatalog.banks.some(b=>b.id === configuredBank) ? scopeCatalog(rawCatalog, configuredBank) : null, [rawCatalog, configuredBank]);
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
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [practiceResult, setPracticeResult] = useState<{spec: SimulationSpec; result: ServerSimulation} | null>(null);
  const [page, setPage] = useState<Page>("home"),
    [level, setLevel] = useState<Level>("beginner"),
    [mobileNav, setMobileNav] = useState(false),
    [assistant, setAssistant] = useState(false),
    [voiceAssistant, setVoiceAssistant] = useState(false),
    [pause, setPause] = useState<DeclineReport | null>(null);
  const [decision,setDecision]=useState<DecisionContext>({needsLiquidity:"unknown"});
  const [voiceStartToken, setVoiceStartToken] = useState(0);
  const [assistantDecline,setAssistantDecline]=useState<DeclineReport | undefined>();
  const [initial, setInitial] = useState("500"),
    [monthly, setMonthly] = useState("50"),
    [contributionFrequency, setContributionFrequency] = useState<"monthly" | "annual">("monthly"),
    [annual, setAnnual] = useState("0"),
    [months, setMonths] = useState("12"),
    [result, setResult] = useState<
      | (ReturnType<typeof simulate> & {
          instrumentId: string;
          initial: number;
          monthly: number;
          months: number;
          annual: number;
          contributionFrequency?: "monthly" | "annual";
        })
      | null
    >(null),
    [error, setError] = useState<FieldError>(null);
  const [selectedId, setSelectedId] = useState("caixabank-monetario-estandar");
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
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.level = level;
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("t2f-language", language);
      localStorage.setItem("t2f-theme", theme);
    } catch {}
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
      ).filter((item) => !item.matches(":disabled") && !item.closest("[inert]") && item.getClientRects().length > 0 && getComputedStyle(item).visibility !== "hidden");
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
    if (mode === "local") { setCatalog(localCatalog); setServerLoading(false); return; }
    setCatalog(null); setServerLoading(true); const controller = new AbortController(); catalogRequest.current = controller;
    requestJson("/api/catalog", isCatalog, undefined, controller.signal).then(data => { if (!controller.signal.aborted) {restoreRecoveryFocus.current ||= !!recoveryRef.current?.contains(document.activeElement); catalogMode.current = "server";setCatalog(data);setServerLoading(false);} }).catch(() => {if (!controller.signal.aborted) {setServerError(true);setServerLoading(false);}});
    return () => controller.abort();
  }, [mode, retry]);
  useEffect(() => () => { simulationGeneration.current++; simulationRequest.current?.abort(); declineGeneration.current++; declineRequest.current?.abort(); }, []);
  useEffect(() => { simulationGeneration.current++; simulationRequest.current?.abort(); declineGeneration.current++; declineRequest.current?.abort(); retryAction.current = null; if (catalogMode.current === mode) setServerError(false); setOperationPending(false); }, [initial, monthly, annual, months, contributionFrequency, mode, language]);
  useEffect(() => { retryAction.current = null; if (catalogMode.current === mode) setServerError(false); }, [level, practiceOpen, decision]);
  useEffect(() => { if (catalog && restoreRecoveryFocus.current) { restoreRecoveryFocus.current = false; mainRef.current?.focus(); } }, [catalog]);
  useEffect(() => { if (catalog && !practiceOpen && catalogMode.current === mode) { const item = catalog.instruments.find(i => i.instrumentId === selectedId) ?? catalog.instruments[0]; if (item) selectInstrument(item); } }, [catalog, mode, practiceOpen]);
  useEffect(() => {
    if (page !== "explore" || !catalog || catalog.instruments.some(item => item.instrumentId === selectedId && item.assetType === "fund")) return;
    const first = catalog.instruments.find(item => item.assetType === "fund");
    if (first) setSelectedId(first.instrumentId);
  }, [page, catalog, selectedId]);
  const portfolioSpec = catalog?.portfolioExample;
  const portfolioInstrument = catalog?.instruments.find(i => i.instrumentId === portfolioSpec?.instrumentId);
  const portfolioRows = catalog?.navHistory.instruments.find(i => i.isin === portfolioInstrument?.identifier && i.eligible)?.monthly;
  const portfolioResult = (() => { try { return portfolioRows && portfolioSpec ? simulateNav(portfolioRows, portfolioSpec.initial, portfolioSpec.recurringContribution, portfolioSpec.periods, portfolioSpec.startDate, portfolioSpec.contributionFrequency) : null; } catch { return null; } })();
  const points = portfolioResult?.timeline ?? [];
  const nav = [
    { key: "home" as const, icon: Grid2X2 },
    { key: "explore" as const, icon: Compass },
    { key: "simulator" as const, icon: FlaskConical },
    { key: "portfolio" as const, icon: Wallet },
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
    if (!item || item.dataStatus !== "historical_nav") throw new Error("History unavailable");
    if (mode === "server") {
      const response = await requestJson("/api/simulations", isSimulation, spec, signal);
      if (response.instrumentId !== spec.instrumentId || response.timeline.length !== spec.periods + 1 || response.kind !== "real_monthly_nav") throw new Error("Unexpected simulation response");
      return response;
    }
    const history = catalog?.navHistory.instruments.find(h => h.isin === item.identifier && h.eligible);
    if (!history) throw new Error("History unavailable");
    const outcome = simulateNav(history.monthly, spec.initial, spec.recurringContribution, spec.periods, spec.startDate, spec.contributionFrequency);
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    return {...outcome, instrumentId:item.instrumentId, currency:"EUR", contributionTiming:"month_end_after_return", contributionFrequency:spec.contributionFrequency ?? "monthly", sources:[{label:"CNMV: datos oficiales",url:catalog!.navHistory.source.indexUrl,checkedAt:item.sourceDate ?? undefined}], provenance:{datasetVersion:dataManifest.datasetVersion,calculationVersion:dataManifest.calculationVersion,datasetSha256:dataManifest.datasetSha256,navHistorySha256:dataManifest.navHistorySha256}, assumptions:[language === "es" ? "Cierres mensuales observados; aportaciones al cierre tras la rentabilidad. Costes adicionales desconocidos." : "Observed monthly closes; contributions at month end after return. Additional costs unknown."]};
  }, [catalog, mode, language]);
  useEffect(() => {
    if (!demoLaunch || !catalog || page !== "simulator") return;
    const spec = catalog.portfolioExample;
    if (selectedId !== spec.instrumentId || initial !== String(spec.initial) || monthly !== String(spec.recurringContribution) || months !== String(spec.periods) || contributionFrequency !== (spec.contributionFrequency ?? "monthly")) return;
    setDemoLaunch(false);
    const item = catalog.instruments.find(i => i.instrumentId === spec.instrumentId);
    if (!item) return;
    simulationRequest.current?.abort();
    const controller = new AbortController(); simulationRequest.current = controller;
    const id = ++simulationGeneration.current;
    setServerError(false); setError(null); setOperationPending(true);
    retryAction.current = () => setDemoLaunch(true);
    calculatePractice(spec, controller.signal).then(outcome => {
      if (controller.signal.aborted || id !== simulationGeneration.current) return;
      setResult({...outcome, initial:spec.initial, monthly:spec.recurringContribution, annual:0, months:spec.periods});
      const decline = {basis:"portfolio_demo" as const, language};
      void showDecline(decline, () => analyzeDecline({name:t.examplePortfolio, dataKind:"historical_nav", sources:outcome.sources as {label:string;url:string}[], observations:outcome.timeline.map(point=>({label:point.date!,value:100*(1+point.instrumentReturnPercent/100)}))}));
    }).catch(() => {if (!controller.signal.aborted && id === simulationGeneration.current) {setServerError(true); setOperationPending(false);}});
  }, [demoLaunch, catalog, page, selectedId, initial, monthly, months, contributionFrequency, calculatePractice, language]);
  function launchDeclineDemo() {
    if (!catalog) return;
    const spec = catalog.portfolioExample;
    choose("simulator"); setSelectedId(spec.instrumentId); setInitial(String(spec.initial)); setMonthly(String(spec.recurringContribution)); setContributionFrequency(spec.contributionFrequency ?? "monthly"); setMonths(String(spec.periods)); setResult(null); setDemoLaunch(true);
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
    if (item.dataStatus === "historical_nav" && !valid(monthly, false)) return "monthly";
    return null;
  }
  function specFor(item: Instrument): SimulationSpec { return {instrumentId:item.instrumentId, initial:Number(initial), recurringContribution:Number(item.dataStatus === "annual_history" ? annual : monthly), periods:item.dataStatus === "annual_history" ? 5 : Number(months),contributionFrequency}; }
  async function calculate(item: Instrument) {
    simulationRequest.current?.abort(); const controller = new AbortController(); simulationRequest.current=controller; const id=++simulationGeneration.current;
    setResult(null); setServerError(false); setOperationPending(mode === "server"); retryAction.current = () => { void calculate(item); }; const invalid = validateInputs(item); if (invalid) {setError(invalid);setOperationPending(false);return;} setError(null); if (item.dataStatus !== "historical_nav") {setOperationPending(false);return;}
    const spec=specFor(item);
    try {const outcome = await calculatePractice(spec, controller.signal);
      if (!outcome || ("instrumentId" in outcome && outcome.instrumentId !== item.instrumentId)) throw new Error("Invalid simulation");
      if (id === simulationGeneration.current && !controller.signal.aborted) setResult({...outcome,instrumentId:item.instrumentId,initial:spec.initial,monthly:Number(monthly),annual:Number(annual),months:Number(months),contributionFrequency:spec.contributionFrequency});
    } catch { if (id === simulationGeneration.current && !controller.signal.aborted) { if(mode === "server") setServerError(true); else setError("general"); } } finally {if(id === simulationGeneration.current) setOperationPending(false);}
  }
  function selectInstrument(item: Instrument) { declineGeneration.current++; declineRequest.current?.abort(); setSelectedId(item.instrumentId); setError(null); void calculate(item); }
  function run(e: FormEvent) { e.preventDefault(); void calculate(selected); }
  const source = selected.sourceUrl ? [{label:"CNMV",url:selected.sourceUrl,checkedAt:selected.sourceDate ?? undefined}] : [];
  const validResult = page === "simulator" && !practiceOpen && result?.instrumentId === selected.instrumentId ? result : null;
  const practiceInstrument = practiceResult && instruments.find(item => item.instrumentId === practiceResult.spec.instrumentId);
  const tutorInstrument = page === "explore"
    ? instruments.find(item => item.instrumentId === selectedId)
    : page === "simulator" ? (practiceOpen ? practiceInstrument || undefined : selected) : undefined;
  const tutorSource = tutorInstrument?.sourceUrl ? [{label: "CNMV", url:tutorInstrument.sourceUrl, checkedAt:tutorInstrument.sourceDate ?? undefined}] : [];
  const activeSpec = practiceOpen ? practiceResult?.spec : validResult ? {instrumentId:validResult.instrumentId,initial:validResult.initial,recurringContribution:validResult.kind === "annual_history" ? validResult.annual : validResult.monthly,periods:validResult.kind === "annual_history" ? 5 : validResult.months,contributionFrequency:validResult.contributionFrequency} : undefined;
  const activeResult = practiceOpen ? practiceResult?.result : validResult;
  const tutorContext: TutorContext = {page,level,language,...(configuredBank === "demo" && catalog ? {bank:catalog.bankProfile} : {}),
    ...((page === "explore" || page === "simulator") && tutorInstrument ? {instrument:{id:tutorInstrument.instrumentId,name:tutorInstrument.name[language],currency:tutorInstrument.currency,dataKind:tutorInstrument.dataStatus === "annual_history" ? "annual_published_returns" : tutorInstrument.dataStatus,sources:tutorSource,product:configuredBank === "demo" ? catalog?.bankProfile.products.find(p=>p.instrumentId === tutorInstrument.instrumentId) : undefined}} : {}),
    ...(page === "simulator" && activeResult && activeSpec ? {simulation:{kind:activeResult.kind,initial:activeSpec.initial,recurringContribution:activeSpec.recurringContribution,contributionTiming:activeResult.kind === "annual_history" ? "year_end_after_return" : "month_end_after_return",contributionFrequency:activeSpec.contributionFrequency ?? "monthly",periods:activeSpec.periods,finalValue:activeResult.value,totalContributed:activeResult.contributed,profit:activeResult.profit,simpleReturnPercent:activeResult.simpleReturnPercent,instrumentReturnPercent:activeResult.timeline[activeResult.timeline.length-1].instrumentReturnPercent,...(activeResult.kind === "real_monthly_nav" ? {periodStart:activeResult.timeline[0].date!,periodEnd:activeResult.timeline.at(-1)!.date!} : {}),...(activeResult.kind === "annual_history" ? {periodStart:(catalog?.annualHistory ?? annualHistory).baseline,periodEnd:activeResult.timeline[activeResult.timeline.length-1].date ?? undefined,annualReturns:(catalog?.annualHistory ?? annualHistory).returns.map(row=>({year:row.year,ratePercent:row.rate*100}))} : {})}} : {}),
    ...((page === "home" || page === "portfolio") && portfolioResult && portfolioSpec ? {portfolio:{name:portfolioInstrument?.name[language] ?? t.examplePortfolio,value:portfolioResult.value,initial:portfolioSpec.initial,dataKind:"historical_nav" as const}} : {}),
    ...(assistantDecline ? {decline:assistantDecline,decision} : {})};
  async function showDecline(spec: DeclineSpec, local: () => DeclineReport) {
    pauseTriggerRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
    declineRequest.current?.abort(); const controller=new AbortController(); declineRequest.current=controller; const id=++declineGeneration.current; setServerError(false); setOperationPending(mode === "server"); retryAction.current = () => {void showDecline(spec,local);};
    try {const report=mode === "server" ? await requestJson("/api/declines",isDecline,spec,controller.signal) : local();
      if (mode === "local" && report.dataKind === "historical_nav" && report.latestLabel) {
        const first = spec.basis === "portfolio_demo" ? portfolioResult?.timeline[0]?.date : validResult?.timeline[0]?.date;
        const events = (catalog?.navHistory.events ?? []).filter(event => first && event.date >= first && event.date <= report.latestLabel!);
        if (events.length) report.historicalContext = {events};
      } if(id===declineGeneration.current && !controller.signal.aborted){setDeclineSpec(spec);setPause(report);}}
    catch {if(id===declineGeneration.current && !controller.signal.aborted)setServerError(true);} finally {if(id===declineGeneration.current)setOperationPending(false);}
  }
  function openPortfolioDecline(){if(!portfolioResult || !portfolioInstrument)return;void showDecline({basis:"portfolio_demo",language},()=>analyzeDecline({name:t.examplePortfolio,dataKind:"historical_nav",sources:[{label:"CNMV",url:catalog!.navHistory.source.indexUrl}],observations:points.map(point=>({label:point.date!,value:point.value}))}));}
  function openSimulationDecline(){if(!validResult)return;void showDecline({basis:"instrument",language,instrumentId:selected.instrumentId,periods:validResult.months},()=>analyzeDecline({name:selected.name[language],dataKind:"historical_nav",sources:source,observations:validResult.timeline.map(point=>({label:point.date!,value:100*(1+point.instrumentReturnPercent/100)}))}));}
  function askDecline(){if(!pause)return;setAssistantDecline(pause);setPause(null);assistantTriggerRef.current=pauseTriggerRef.current;setAssistant(true);}
  const levelTitle = {
    beginner: t.beginnerView,
    intermediate: t.intermediateView,
    advanced: t.advancedView,
  }[level];
  const levelText = {
    beginner: t.beginnerText,
    intermediate: t.intermediateText,
    advanced: t.advancedText,
  }[level];
  const serverContext = {page,level,language,bankId:configuredBank,...( (page === "explore" || page === "simulator") && tutorInstrument ? {instrumentId:tutorInstrument.instrumentId} : {}),...(page === "simulator" && activeSpec ? {simulation:activeSpec} : {}),...(assistantDecline && declineSpec ? {decline:{...declineSpec,language},decision} : {})};
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
  if (rawCatalog && !rawCatalog.banks.some(b=>b.id === configuredBank)) return <main className="content" role="alert"><h1>{language === "es" ? "Entidad configurada desconocida" : "Unknown configured institution"}</h1><p>{language === "es" ? "Revisa la configuración de la entidad." : "Check the institution configuration."}</p></main>;
  if (!catalog) return <Recovery ref={recoveryRef} language={language} theme={theme} failed={serverError} onLanguage={setLanguage} onTheme={setTheme} onRetry={retryCatalog} onLocal={switchMode} />;
  if (!catalog.banks.length || !catalog.instruments.length) return <main className="content"><h1>{language === "es" ? "Catálogo no disponible" : "Catalogue unavailable"}</h1><p>{language === "es" ? "La entidad configurada no tiene instrumentos en esta demo. Revisa la configuración del despliegue." : "The configured institution has no instruments in this demo. Check the deployment configuration."}</p></main>;
  return (
    <div className="app-shell">
      <aside
        ref={navRef}
        className={`sidebar ${mobileNav ? "open" : ""}`}
        inert={assistant || voiceAssistant || !!pause ? true : undefined}
        role={mobileNav ? "dialog" : undefined}
        aria-modal={mobileNav ? true : undefined}
        aria-label={t.space}
      >
        <div className="brand">
          <div className="brand-mark">
            <span>t</span>
            <span>2</span>
          </div>
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
        <button className="nav-item" onClick={openAssistant} aria-label={t.openAssistant}>
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
            <span className="demo-badge">{language === "es" ? "Modo demo · Sin dinero real" : "Demo mode · No real money"}</span>
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
            <ShinyButton className="top-voice-button" onClick={openVoice} aria-label={language === "es" ? "Hablar con IA" : "Talk to AI"}>
              <Mic size={17} aria-hidden="true" />{language === "es" ? "Hablar con IA" : "Talk to AI"}
            </ShinyButton>
            <LevelSelector level={level} onChange={setLevel} names={levelNames} label={t.detailLevel} backLabel={language === "es" ? "Volver" : "Back"} />
          </div>
        </header>
        <div className="content">
          {modeControls}
          {page === "home" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">{t.eyebrow}</div>
                  <h1>{t.title}</h1>
                  <p>{t.intro}</p>
                </div>
              </div>
              {configuredBank === "demo" && <BankInfo profile={catalog.bankProfile} language={language} />}
              <section className={`welcome-card level-${level}`}>
                <div className="welcome-content">
                  <span className="view-tag">
                    {level === "beginner"
                      ? t.modeSmall
                      : level === "intermediate"
                        ? t.modeMedium
                        : t.modeAdvanced}
                  </span>
                  <h2>{levelTitle}</h2>
                  <p>{levelText}</p>
                  <p>{t.knowledgeNote}</p>
                  <div className="welcome-actions">
                    <button
                      className="button dark"
                      onClick={() => choose("simulator")}
                    >
                      {t.trySimulator}
                      <ArrowRight size={16} />
                    </button>
                    {configuredBank === "demo" && <button className="text-link" onClick={launchDeclineDemo}>
                      {language === "es" ? "Probar una caída" : "Try a decline"}
                      <ArrowRight size={15} />
                    </button>}
                    <button
                      className="text-link"
                      onClick={() => choose("explore")}
                    >
                      {t.viewFunds}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </section>
              <div className="section-head">
                <div>
                  <span className="kicker">{t.learn}</span>
                  <h2>{t.learnSteps}</h2>
                </div>
              </div>
              <div className="action-grid">
                <button
                  className="action-card action-card--funds"
                  onClick={() => choose("explore")}
                >
                  <div className="action-icon mint">
                    <Compass size={21} />
                  </div>
                  <h3>{t.discoverFunds}</h3>
                  <p>{t.discoverDesc}</p>
                  <span>
                    {t.viewFunds}
                    <ArrowRight size={14} />
                  </span>
                </button>
                <button
                  className="action-card action-card--practice"
                  onClick={openPractice}
                >
                  <div className="action-icon peach">
                    <FlaskConical size={21} />
                  </div>
                  <h3>{t.practice}</h3>
                  <p>{t.practiceDesc}</p>
                  <span>
                    {language === "es" ? "Comparar ejemplos" : "Compare examples"}
                    <ArrowRight size={14} />
                  </span>
                </button>
                <button className="action-card action-card--portfolio" onClick={() => choose("portfolio")}>
                  <div className="action-icon lilac"><Wallet size={21} /></div>
                  <h3>{t.examplePortfolio}</h3>
                  <p>{t.portfolioPathDesc}</p>
                  <span>{language === "es" ? "Ver cartera" : "View portfolio"}<ArrowRight size={14} /></span>
                </button>
              </div>

            </>
          )}
          {page === "explore" && <FundsExplorer hostBankId={configuredBank} navHistory={catalog.navHistory} language={language} level={level} onLevel={setLevel} banks={catalog.banks} instruments={instruments} history={catalog.annualHistory} bankProfile={configuredBank === "demo" ? catalog.bankProfile : undefined} selectedId={selectedId} onSelect={item => { simulationGeneration.current++; simulationRequest.current?.abort(); declineGeneration.current++; declineRequest.current?.abort(); retryAction.current = null; setOperationPending(false); setServerError(false); setSelectedId(item.instrumentId); setResult(null); }} onPractice={item => { selectInstrument(item); choose("simulator"); }} onVoice={openVoice} onText={openAssistant} />}
          {page === "simulator" && (
            practiceOpen ? <Suspense fallback={<p role="status">{language === "es" ? "Cargando práctica…" : "Loading practice…"}</p>}><PracticeLab language={language} level={level} instruments={instruments} annualHistory={catalog.annualHistory} mode={mode} calculate={calculatePractice} onActiveResult={setPracticeResult} onExit={() => choose("simulator")} openAssistant={openAssistant} /></Suspense> : <>
            <button type="button" className="text-link history-shortcut" onClick={openPractice}>{language === "es" ? "Abrir práctica guiada" : "Open guided practice"}<ArrowRight size={15}/></button>
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
                contributionFrequency,
                setContributionFrequency,
                maxMonths: Math.max(0, (catalog.navHistory.instruments.find(h => h.isin === selected.identifier && h.eligible)?.monthly.length ?? 1) - 1),
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
              }}
            />
            </>
          )}
          {page === "portfolio" && (
            <>
              <PageIntro
                label={t.examplePortfolioLabel}
                title={t.portfolioTitle}
                description={t.portfolioIntro}
              />
              <div className="info-banner">
                <LockKeyhole size={19} />
                <span>{t.portfolioWarning}</span>
              </div>
              <div className="portfolio-page-grid">
                <section className="panel large-portfolio">
                  <div className="card-heading">
                    <div>
                      <span className="kicker">{t.totalValue}</span>
                      <div className="big-amount">{portfolioResult ? euro(portfolioResult.value) : t.unavailable}</div>
                      <span className="change">{portfolioResult?.timeline.at(-1)?.date}</span>
                    </div>
                    <span className="pill">{t.examplePortfolioLabel}</span>
                  </div>
                  <InvestmentChart
                    compact
                    language={language}
                    title={t.examplePortfolio}
                    description={t.portfolioChartDescription}
                    data={points.map(point => ({label:point.date!,value:point.value,contributed:point.contributed,returnPercent:point.instrumentReturnPercent}))}
                  />
                  <div className="chart-labels">
                    <span>{points[0]?.date}</span>
                    <span>{points.at(-1)?.date}</span>
                  </div>
                </section>
                <section className="panel objective">
                  <div className="action-icon mint">
                    <Leaf size={21} />
                  </div>
                  <span className="kicker">{t.exampleGoal}</span>
                  <h3>{t.goalTitle}</h3>
                  <p>{t.goalText}</p>
                  <div className="objective-row">
                    <span>{t.illustrativeHorizon}</span>
                    <strong>{t.longTerm}</strong>
                  </div>
                  <button
                    className="button outline full"
                    onClick={openPortfolioDecline}
                  >
                    <TrendingDown size={17} />
                    {t.understandFall}
                  </button>
                </section>
              </div>
              <div className="section-head">
                <div>
                  <span className="kicker">{t.insidePortfolio}</span>
                  <h2>{t.distribution}</h2>
                </div>
              </div>
              <div className="holdings">
                <div className="holding-icon">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <strong>{portfolioInstrument?.name[language]}</strong>
                  <small>CNMV · {portfolioInstrument?.identifier}</small>
                </div>
                <div className="holding-value">
                  <strong>{portfolioResult ? euro(portfolioResult.value) : t.unavailable}</strong>
                  <small>{t.fullPortfolio}</small>
                </div>
              </div>
              {level === "advanced" && (
                <p className="advanced-note">{language === "es" ? "Cierres mensuales de la CNMV; análisis limitado al periodo mostrado. La causa de la caída es desconocida." : "Monthly CNMV closes; analysis is limited to the period shown. The cause of the decline is unknown."}</p>
              )}
            </>
          )}
          <footer>
            <span>© Tech2Finance · {t.footer}</span>
          </footer>
        </div>
      </main>
      <AssistantPanel provider={mode === "server" ? provider : undefined} open={assistant} onClose={()=>setAssistant(false)} context={tutorContext} panelRef={assistantRef}/>
      <VoiceAssistantPanel open={voiceAssistant} onClose={()=>setVoiceAssistant(false)} context={tutorContext} panelRef={voiceRef} provider={mode === "server" ? provider : undefined} startToken={voiceStartToken}/>
      {pause && <AntiPanicPanel onTalk={talkDecline} report={pause} language={language} decision={decision} onDecision={setDecision} onClose={()=>setPause(null)} onAsk={askDecline} panelRef={modalRef}/>}

    </div>
  );
}
function PageIntro({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading internal">
      <div>
        <div className="eyebrow">{label}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}
