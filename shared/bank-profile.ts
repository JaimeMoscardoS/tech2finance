export type LocalizedText = { es: string; en: string };

export type ProductFees = {
  annualOngoingBps: number | null;
  entryBps: number;
  exitBps: number;
  orderFixedEur: number;
  custodyAnnualBps: number;
  treatment: 'illustrative_excluded';
};

export type BankProduct = {
  instrumentId: string;
  minimumInitialEur: number;
  minimumRecurringEur: number;
  fees: ProductFees;
  description: LocalizedText;
};

export type BankProfile = {
  bankId: 'demo';
  profileVersion: 'bank-demo-2026-11-10.1';
  classification: 'synthetic_demo';
  name: LocalizedText;
  description: LocalizedText;
  source: { kind: 'synthetic_seed'; asOf: '2026-11-10' };
  services: Array<{ id: 'catalogue' | 'practice' | 'tutor' | 'portfolio_pause'; name: LocalizedText; description: LocalizedText }>;
  conditions: { currency: 'EUR'; maintenanceMonthlyEur: 0; requiresRealAccount: false; realOrdersAvailable: false; externalConnections: false; text: LocalizedText };
  products: BankProduct[];
  faq: Array<{ id: 'identity' | 'services' | 'conditions' | 'fees' | 'real_money' | 'external_products'; question: LocalizedText; answer: LocalizedText }>;
  calculationNotice: LocalizedText;
};
