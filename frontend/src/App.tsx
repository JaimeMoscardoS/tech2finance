import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  Compass,
  FlaskConical,
  Grid2X2,
  Leaf,
  LockKeyhole,
  Menu,
  MessageCircle,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingDown,
  Wallet,
  X,
} from "lucide-react";
import CountUp from "./CountUp";
import { simulate } from "./demo";
import { annualHistory, replayAnnual } from "./annual-history";
import { instruments, type Instrument } from "./catalog";
import InvestmentChart from "./LazyInvestmentChart";
import Simulator, { type FieldError } from "./Simulator";
import { MAX_SIMULATION_AMOUNT } from "./simulation-types";
import { copy, type Language } from "./copy";
import { analyzeDecline, type DeclineReport, type DecisionContext, type TutorContext } from "../../tutor-ia/src/index";
import { portfolioPoints } from "./portfolio-demo";
import AssistantPanel from "./AssistantPanel";
import AntiPanicPanel from "./AntiPanicPanel";

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
export default function App() {
  const [language, setLanguage] = useState<Language>(
    () => saved("t2f-language", ["es", "en"], "es") as Language,
  );
  const [theme, setTheme] = useState<"light" | "dark">(
    () => saved("t2f-theme", ["light", "dark"], "light") as "light" | "dark",
  );
  const [page, setPage] = useState<Page>("home"),
    [level, setLevel] = useState<Level>("beginner"),
    [levelOpen, setLevelOpen] = useState(false),
    [mobileNav, setMobileNav] = useState(false),
    [assistant, setAssistant] = useState(false),
    [pause, setPause] = useState<DeclineReport | null>(null);
  const [decision,setDecision]=useState<DecisionContext>({needsLiquidity:"unknown"});
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
    >(() => ({
      ...simulate(500, 50, 12),
      instrumentId: "demo-mixed",
      initial: 500,
      monthly: 50,
      months: 12,
      annual: 0,
    })),
    [error, setError] = useState<FieldError>(null),
    [notice, setNotice] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState("demo-mixed");
  useEffect(() => {
    if (!levelOpen) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLevelOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [levelOpen]);
  const selected = instruments.find(
    (item) => item.instrumentId === selectedId,
  )!;
  const modalRef = useRef<HTMLElement>(null),
    assistantRef = useRef<HTMLElement>(null),
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
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("t2f-language", language);
      localStorage.setItem("t2f-theme", theme);
    } catch {}
  }, [language, theme]);
  useEffect(() => {
    if (!pause && !assistant) return;
    const panel = pause ? modalRef.current : assistantRef.current;
    const previous = pause
      ? document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
      : assistantTriggerRef.current;
    const items = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          "button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        ) ?? [],
      );
    items()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        pause ? setPause(null) : setAssistant(false);
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
  }, [pause, assistant]);
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
  const points = portfolioPoints;
  const nav = [
    { key: "home" as const, icon: Grid2X2 },
    { key: "explore" as const, icon: Compass },
    { key: "simulator" as const, icon: FlaskConical },
    { key: "portfolio" as const, icon: Wallet },
  ];
  const cards = [
    {
      name: t.fundOne,
      tag: t.diversified,
      risk: 3,
      desc: t.fundOneDesc,
      color: "sage",
    },
    {
      name: t.fundTwo,
      tag: t.equities,
      risk: 5,
      desc: t.fundTwoDesc,
      color: "sand",
    },
    {
      name: t.fundThree,
      tag: t.fixedIncome,
      risk: 2,
      desc: t.fundThreeDesc,
      color: "lavender",
    },
  ];
  const choose = (p: Page) => {
    setPage(p);
    if (mobileNav) {
      setMobileNav(false);
      menuButtonRef.current?.focus();
    }
    setNotice(null);
  };
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
  function selectInstrument(item: Instrument) {
    setSelectedId(item.instrumentId);
    setResult(null);
    setError(null);
    const invalid = validateInputs(item);
    if (invalid) { setError(invalid); return; }
    try {
      const outcome =
        item.dataStatus === "annual_history"
          ? replayAnnual(Number(initial), Number(annual))
          : item.dataStatus === "fictional" && item.returns && months.trim()
            ? simulate(
                Number(initial),
                Number(monthly),
                Number(months),
                item.returns,
              )
            : null;
      if (outcome)
        setResult({
          ...outcome,
          instrumentId: item.instrumentId,
          initial: Number(initial),
          monthly: Number(monthly),
          annual: Number(annual),
          months: Number(months),
        });
    } catch {
      setError("general");
    }
  }
  function run(e: FormEvent) {
    e.preventDefault();
    const invalid = validateInputs(selected);
    if (invalid) { setResult(null); setError(invalid); return; }
    try {
      const outcome =
        selected.dataStatus === "annual_history"
          ? replayAnnual(Number(initial), Number(annual))
          : selected.dataStatus === "fictional" &&
              selected.returns &&
              months.trim()
            ? simulate(
                Number(initial),
                Number(monthly),
                Number(months),
                selected.returns,
              )
            : null;
      if (!outcome) throw Error();
      setResult({
        ...outcome,
        instrumentId: selected.instrumentId,
        initial: Number(initial),
        monthly: Number(monthly),
        annual: Number(annual),
        months: Number(months),
      });
      setError(null);
    } catch {
      setResult(null);
      setError("general");
    }
  }
  const source = selected.sourceUrl ? [{label:language === "es" ? "Ficha oficial" : "Official product page",url:selected.sourceUrl,checkedAt:selected.sourceDate ?? undefined}] : [];
  const validResult = page === "simulator" && result?.instrumentId === selected.instrumentId ? result : null;
  const tutorContext: TutorContext = {page,level,language,
    ...(page === "simulator" ? {instrument:{id:selected.instrumentId,name:selected.name[language],currency:selected.currency,dataKind:selected.dataStatus === "annual_history" ? "annual_published_returns" : selected.dataStatus,sources:source}} : {}),
    ...(validResult ? {simulation:{kind:validResult.kind,initial:validResult.initial,recurringContribution:validResult.kind === "annual_history" ? validResult.annual : validResult.monthly,contributionTiming:validResult.kind === "annual_history" ? "year_end_after_return" : "month_start",periods:validResult.kind === "annual_history" ? 5 : validResult.months,finalValue:validResult.value,totalContributed:validResult.contributed,profit:validResult.profit,simpleReturnPercent:validResult.simpleReturnPercent,instrumentReturnPercent:validResult.timeline[validResult.timeline.length-1].instrumentReturnPercent,...(validResult.kind === "annual_history" ? {periodStart:annualHistory.baseline,periodEnd:validResult.timeline[validResult.timeline.length-1].date ?? undefined,annualReturns:annualHistory.returns.map(row=>({year:row.year,ratePercent:row.rate*100}))} : {})}} : {}),
    ...((page === "home" || page === "portfolio") ? {portfolio:{name:t.examplePortfolio,value:1093,initial:1000,dataKind:"fictional" as const}} : {}),
    ...(assistantDecline ? {decline:assistantDecline,decision} : {})};
  function openPortfolioDecline(){pauseTriggerRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;setPause(analyzeDecline({name:t.examplePortfolio,dataKind:"fictional",sources:[],observations:points.map((value,index)=>({label:`${t.pointLabel} ${index+1}`,value}))}));}
  function openSimulationDecline(){if(!validResult)return;pauseTriggerRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;setPause(analyzeDecline({name:selected.name[language],dataKind:validResult.kind === "annual_history" ? "annual_published_returns" : "fictional",sources:source,observations:validResult.timeline.map(point=>({label:point.date ?? `${t.month} ${point.period}`,value:100*(1+point.instrumentReturnPercent/100)}))}));}
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
  return (
    <div className="app-shell">
      <aside
        ref={navRef}
        className={`sidebar ${mobileNav ? "open" : ""}`}
        inert={assistant || !!pause ? true : undefined}
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
              tech<span>2</span>finance
            </strong>
            <small>{t.app}</small>
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
          <span className="new-tag">{t.demo}</span>
        </button>
        <button className="nav-item" onClick={() => choose("explore")}>
          <BookOpen size={18} />
          <span>{t.basics}</span>
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
      <main className="main" inert={mobileNav || assistant || !!pause ? true : undefined}>
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
              {t.space} <span>/</span> <strong>{names[page]}</strong>
            </span>
          </div>
          <div className="top-actions">
            <span className="demo-badge">{t.demonstration}</span>
            <div className="preferences" aria-label={t.languageLabel}>
              <button
                className={`preference-button ${language === "es" ? "selected" : ""}`}
                onClick={() => setLanguage("es")}
                aria-pressed={language === "es"}
                aria-label={t.switchSpanish}
              >
                ES
              </button>
              <button
                className={`preference-button ${language === "en" ? "selected" : ""}`}
                onClick={() => setLanguage("en")}
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
            <button className="icon-button theme-button" onClick={openAssistant} aria-label={t.openAssistant}>
              <Sparkles size={19} />
            </button>
            <div className="level-wrap">
              <button
                className="level-button"
                onClick={() => setLevelOpen((v) => !v)}
                aria-expanded={levelOpen}
                aria-label={`${t.level}: ${levelNames[level]}`}
              >
                <span>
                  {t.level}: <strong>{levelNames[level]}</strong>
                </span>
                <ChevronDown size={15} />
              </button>
              {levelOpen && (
                <div className="level-menu">
                  {(["beginner", "intermediate", "advanced"] as Level[]).map(
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
          {page === "home" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">{t.eyebrow}</div>
                  <h1>{t.title}</h1>
                  <p>{t.intro}</p>
                </div>
              </div>
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
                    <button
                      className="text-link"
                      onClick={() => choose("explore")}
                    >
                      {t.viewFunds}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
                {level !== "beginner" && (
                  <div className="view-summary">
                    <span className="kicker">{t.examplePortfolio}</span>
                    <strong>{euro(1093)}</strong>
                    <small>{t.fictional}</small>
                    {level === "advanced" && <p>{t.detailNote}</p>}
                  </div>
                )}
              </section>
              {level === "intermediate" && (
                <div className="metric-grid">
                  <div className="metric-card">
                    <span>{t.portfolioValue}</span>
                    <strong>{euro(1093)}</strong>
                    <small>{t.fictional}</small>
                  </div>
                  <div className="metric-card">
                    <span>{t.goal}</span>
                    <strong>{t.longTerm}</strong>
                    <small>{t.exampleGoal}</small>
                  </div>
                  <div className="metric-card">
                    <span>{t.assumptions}</span>
                    <strong>—</strong>
                    <small>{t.noHistory}</small>
                  </div>
                </div>
              )}
              {level === "advanced" && (
                <div className="metric-grid advanced">
                  <div className="metric-card">
                    <span>{t.portfolioValue}</span>
                    <strong>{euro(1093)}</strong>
                    <small>{t.fictional}</small>
                  </div>
                  <div className="metric-card">
                    <span>{t.totalContributions}</span>
                    <strong>—</strong>
                    <small>{t.unavailable}</small>
                  </div>
                  <div className="metric-card">
                    <span>{t.difference}</span>
                    <strong>—</strong>
                    <small>{t.unavailable}</small>
                  </div>
                  <div className="metric-card">
                    <span>{t.assumptions}</span>
                    <strong>—</strong>
                    <small>{t.noHistory}</small>
                  </div>
                </div>
              )}
              <div className="section-head">
                <div>
                  <span className="kicker">{t.learn}</span>
                  <h2>{t.learnSteps}</h2>
                </div>
              </div>
              <div className="action-grid">
                <button
                  className="action-card"
                  onClick={() => choose("explore")}
                >
                  <div className="action-icon mint">
                    <Compass size={21} />
                  </div>
                  <h3>{t.discoverFunds}</h3>
                  <p>{t.discoverDesc}</p>
                  <span>
                    {t.go}
                    <ArrowRight size={14} />
                  </span>
                </button>
                <button
                  className="action-card"
                  onClick={() => choose("simulator")}
                >
                  <div className="action-icon peach">
                    <FlaskConical size={21} />
                  </div>
                  <h3>{t.practice}</h3>
                  <p>{t.practiceDesc}</p>
                  <span>
                    {t.go}
                    <ArrowRight size={14} />
                  </span>
                </button>
                <button className="action-card" onClick={openAssistant}>
                  <div className="action-icon lilac">
                    <MessageCircle size={21} />
                  </div>
                  <h3>{t.ask}</h3>
                  <p>{t.askDesc}</p>
                  <span>
                    {t.go}
                    <ArrowRight size={14} />
                  </span>
                </button>
              </div>
              <div className="lower-grid">
                <section className="portfolio-card">
                  <div className="card-heading">
                    <div>
                      <span className="kicker">{t.fictional}</span>
                      <h3>{t.examplePortfolio}</h3>
                    </div>
                    <button
                      className="mini-link"
                      onClick={() => choose("portfolio")}
                    >
                      {t.viewDetails}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="portfolio-content">
                    <div>
                      <p>{t.portfolioValue}</p>
                      <div className="amount">
                        <CountUp
                          from={1093}
                          to={1093}
                          duration={1.2}
                          separator={language === "es" ? "." : ","}
                          trigger="load"
                        />{" "}
                        €
                      </div>
                      <small>{t.noRealValue}</small>
                    </div>
                    <InvestmentChart
                      compact
                      language={language}
                      title={t.examplePortfolio}
                      description={t.portfolioChartDescription}
                      data={points.map((value, index) => ({
                        label:
                          index === 0 ? t.start : `${t.pointLabel} ${index}`,
                        value,
                        contributed: 1000,
                        returnPercent: (value / 1000 - 1) * 100,
                      }))}
                    />
                  </div>
                </section>
                <section className="insight-card">
                  <div className="insight-icon">
                    <Sparkles size={18} />
                  </div>
                  <span className="kicker">{t.assistantTitle}</span>
                  <h3>{t.levelExplanation}</h3>
                  <p>{t.knowledgeNote}</p>
                  <button onClick={openAssistant}>
                    {t.askButton}
                    <ArrowRight size={15} />
                  </button>
                </section>
              </div>
            </>
          )}
          {page === "explore" && (
            <>
              <PageIntro
                label={t.catalog}
                title={t.exploreTitle}
                description={t.exploreIntro}
              />
              <div className="info-banner">
                <ShieldCheck size={20} />
                <span>{t.fictionalFunds}</span>
              </div>
              {notice !== null && (
                <div className="notice" role="status">
                  {cards[notice].name} {t.fundNotice}
                  <button onClick={() => setNotice(null)} aria-label={t.close}>
                    <X size={15} />
                  </button>
                </div>
              )}
              <div className="section-head">
                <h2>{t.funds}</h2>
              </div>
              <div className="fund-grid">
                {cards.map((c, i) => (
                  <article className="fund-card" key={i}>
                    <div className={`fund-art ${c.color}`}>
                      <span>0{i + 1}</span>
                      <Leaf size={26} />
                    </div>
                    <div className="fund-body">
                      <span className="kicker">{c.tag}</span>
                      <h3>{c.name}</h3>
                      <p>{c.desc}</p>
                      <div className="fund-meta">
                        <span>{t.exampleRisk}</span>
                        <strong>
                          {c.risk} {t.of} 7
                        </strong>
                      </div>
                      {level !== "beginner" && (
                        <div className="fund-meta">
                          <span>{t.costData}</span>
                          <strong>{t.unavailable}</strong>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          selectInstrument(
                            instruments.find(
                              (item) =>
                                item.instrumentId ===
                                ["demo-mixed", "demo-equity", "demo-fixed"][i],
                            )!,
                          );
                          choose("simulator");
                        }}
                      >
                        {t.practiceInstrument}
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
          {page === "simulator" && (
            <Simulator
              {...{
                t,
                language,
                level,
                selected,
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
              }}
            />
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
                      <div className="big-amount">{euro(1093)}</div>
                      <span className="change">{t.fictional}</span>
                    </div>
                    <span className="pill">{t.examplePortfolioLabel}</span>
                  </div>
                  <InvestmentChart
                    compact
                    language={language}
                    title={t.examplePortfolio}
                    description={t.portfolioChartDescription}
                    data={points.map((value, index) => ({
                      label: index === 0 ? t.start : `${t.pointLabel} ${index}`,
                      value,
                      contributed: 1000,
                      returnPercent: (value / 1000 - 1) * 100,
                    }))}
                  />
                  <div className="chart-labels">
                    <span>{t.start}</span>
                    <span>{t.now}</span>
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
                  <strong>{t.fundOne}</strong>
                  <small>{t.fictionalFund}</small>
                </div>
                <div className="holding-value">
                  <strong>{euro(1093)}</strong>
                  <small>{t.fullPortfolio}</small>
                </div>
              </div>
              {level === "advanced" && (
                <p className="advanced-note">{t.dataUnavailable}</p>
              )}
            </>
          )}
          <footer>
            <span>© Tech2Finance · {t.footer}</span>
            <span>
              <LockKeyhole size={13} />
              {t.noAccounts}
            </span>
          </footer>
        </div>
      </main>
      <AssistantPanel open={assistant} onClose={()=>setAssistant(false)} context={tutorContext} panelRef={assistantRef}/>
      {pause && <AntiPanicPanel report={pause} language={language} decision={decision} onDecision={setDecision} onClose={()=>setPause(null)} onAsk={askDecline} panelRef={modalRef}/>}

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
