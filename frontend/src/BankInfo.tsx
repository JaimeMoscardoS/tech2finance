import type { BankProduct, BankProfile } from './catalog';
import type { Language } from './copy';
import { BookOpen, CircleHelp, Info, ShieldCheck } from 'lucide-react';
import './bank-info.css';

export function ProductCosts({ product, profile, language }: { product?: BankProduct; profile: BankProfile; language: Language }) {
 const es = language === 'es';
 if (!product) return <div className="bank-costs bank-costs--external"><div className="bank-costs__heading"><strong>{es ? 'Referencia externa' : 'External reference'}</strong></div><div className="bank-costs__notice"><Info size={17} aria-hidden="true" /><p>{es ? 'Consulta las condiciones en la fuente del producto; no se aplican las comisiones ficticias de BancoT2F.' : 'Check the product source for its terms; fictional BancoT2F fees do not apply.'}</p></div></div>;
 const pct = (n: number) => new Intl.NumberFormat(es ? 'es-ES' : 'en-GB', {minimumFractionDigits:2, maximumFractionDigits:2}).format(n / 100) + ' %';
 const money = (n: number) => new Intl.NumberFormat(es ? 'es-ES' : 'en-GB', {style:'currency',currency:'EUR'}).format(n);
 return <div className="bank-costs">
  <div className="bank-costs__heading"><strong>{es ? 'Condiciones del producto' : 'Product terms'}</strong><span className="bank-costs__badge">{es ? 'Ficticias' : 'Fictional'}</span></div>
  <dl className="bank-costs__grid">
   <div className="bank-costs__annual"><dt>{es ? 'Gastos anuales' : 'Annual ongoing charges'}</dt><dd>{product.fees.annualOngoingBps === null ? (es ? 'No definidos' : 'Not defined') : pct(product.fees.annualOngoingBps)}</dd></div>
   <div><dt>{es ? 'Mínimo inicial' : 'Initial minimum'}</dt><dd>{money(product.minimumInitialEur)}</dd></div>
   <div><dt>{es ? 'Aportación mínima' : 'Recurring minimum'}</dt><dd>{money(product.minimumRecurringEur)}</dd></div>
   <div><dt>{es ? 'Por orden' : 'Per order'}</dt><dd>{money(product.fees.orderFixedEur)}</dd></div>
   <div><dt>{es ? 'Entrada' : 'Entry'}</dt><dd>{pct(product.fees.entryBps)}</dd></div>
   <div><dt>{es ? 'Salida' : 'Exit'}</dt><dd>{pct(product.fees.exitBps)}</dd></div>
   <div><dt>{es ? 'Custodia anual' : 'Annual custody'}</dt><dd>{pct(product.fees.custodyAnnualBps)}</dd></div>
  </dl>
  <div className="bank-costs__notice"><Info size={17} aria-hidden="true" /><p>{profile.calculationNotice[language]}</p></div>
 </div>;
}

export default function BankInfo({profile,language}:{profile:BankProfile;language:Language}) {
 const es = language === 'es';
 const conditions = profile.conditions;
 const maintenance = new Intl.NumberFormat(es ? 'es-ES' : 'en-GB', {style:'currency', currency:conditions.currency}).format(conditions.maintenanceMonthlyEur);
 const restrictions = [
  conditions.requiresRealAccount ? (es ? 'Se requiere una cuenta real' : 'A real account is required') : (es ? 'Sin cuenta real' : 'No real account'),
  conditions.realOrdersAvailable ? (es ? 'Órdenes reales disponibles' : 'Real orders available') : (es ? 'Sin órdenes reales' : 'No real orders'),
  conditions.externalConnections ? (es ? 'Conexiones externas disponibles' : 'External connections available') : (es ? 'Sin conexiones externas' : 'No external connections'),
 ];
 return <section className="bank-info" aria-labelledby="bank-info-title">
  <div className="bank-info__intro"><span className="kicker">{es ? 'CONOCE LA DEMO' : 'ABOUT THE DEMO'}</span><h2 id="bank-info-title">{profile.name[language]}</h2><p className="bank-info__description">{profile.description[language]}</p>
   <dl className="bank-info__maintenance"><div><dt>{es ? 'Mantenimiento ficticio' : 'Fictional maintenance'}</dt><dd>{maintenance} <span>{es ? '/ mes' : '/ month'}</span></dd></div></dl>
   <ul className="bank-info__restrictions">{restrictions.map(item=><li key={item}><ShieldCheck size={17} aria-hidden="true" /><span>{item}</span></li>)}</ul>
  </div>
  <div className="bank-info__services"><h3>{es ? 'Servicios' : 'Services'}</h3><ul className="bank-info__service-list">{profile.services.map(s=><li key={s.id}><BookOpen size={18} aria-hidden="true" /><div><strong>{s.name[language]}</strong><p>{s.description[language]}</p></div></li>)}</ul>
   <details className="bank-info__faq"><summary><CircleHelp size={18} aria-hidden="true" />{es ? 'Preguntas frecuentes' : 'Frequently asked questions'}</summary>{profile.faq.map(f=><details key={f.id}><summary>{f.question[language]}</summary><p>{f.answer[language]}</p></details>)}</details>
  </div>
  <div className="bank-info__notice"><Info size={20} aria-hidden="true" /><div><strong>{es ? 'Sobre las comisiones' : 'About fees'}</strong><p>{profile.calculationNotice[language]}</p></div></div>
 </section>;
}
