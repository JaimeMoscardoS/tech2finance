import type { BankProduct, BankProfile } from './catalog';
import type { Language } from './copy';
import './bank-info.css';

export function ProductCosts({ product, profile, language }: { product?: BankProduct; profile: BankProfile; language: Language }) {
 const es = language === 'es';
 if (!product) return <div className="bank-costs"><strong>{es ? 'Referencia externa' : 'External reference'}</strong><p>{es ? 'Consulta las condiciones en la fuente del producto; no se aplican las comisiones ficticias de BancoT2F.' : 'Check the product source for its terms; fictional BancoT2F fees do not apply.'}</p></div>;
 const pct = (n: number) => new Intl.NumberFormat(es ? 'es-ES' : 'en-GB', {minimumFractionDigits:2, maximumFractionDigits:2}).format(n / 100) + ' %';
 const money = (n: number) => new Intl.NumberFormat(es ? 'es-ES' : 'en-GB', {style:'currency',currency:'EUR'}).format(n);
 return <div className="bank-costs">
  <strong>{es ? 'Condiciones ficticias del producto' : 'Fictional product terms'}</strong>
  <p>{es ? 'Mínimo inicial' : 'Initial minimum'}: {money(product.minimumInitialEur)} · {es ? 'Aportación mínima' : 'Recurring minimum'}: {money(product.minimumRecurringEur)}</p>
  <p>{es ? 'Gastos anuales' : 'Annual ongoing charges'}: {product.fees.annualOngoingBps === null ? (es ? 'No definidos' : 'Not defined') : pct(product.fees.annualOngoingBps)} · {es ? 'Por orden' : 'Per order'}: {money(product.fees.orderFixedEur)}</p>
  <p>{es ? 'Entrada' : 'Entry'}: {pct(product.fees.entryBps)} · {es ? 'Salida' : 'Exit'}: {pct(product.fees.exitBps)} · {es ? 'Custodia anual' : 'Annual custody'}: {pct(product.fees.custodyAnnualBps)}</p>
  <small>{profile.calculationNotice[language]}</small>
 </div>;
}

export default function BankInfo({profile,language}:{profile:BankProfile;language:Language}) {
 const es = language === 'es';
 return <section className="bank-info" aria-labelledby="bank-info-title">
  <div className="bank-info__intro"><span className="kicker">{es ? 'CONOCE LA DEMO' : 'ABOUT THE DEMO'}</span><h2 id="bank-info-title">{profile.name[language]}</h2><p>{profile.description[language]}</p><p>{profile.conditions.text[language]}</p><p>{profile.calculationNotice[language]}</p></div>
  <div><h3>{es ? 'Servicios' : 'Services'}</h3><ul>{profile.services.map(s=><li key={s.id}><strong>{s.name[language]}</strong> · {s.description[language]}</li>)}</ul>
   <details><summary>{es ? 'Preguntas frecuentes' : 'Frequently asked questions'}</summary>{profile.faq.map(f=><details key={f.id}><summary>{f.question[language]}</summary><p>{f.answer[language]}</p></details>)}</details>
  </div>
 </section>;
}
