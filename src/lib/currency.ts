export const MAJOR_FIAT_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'] as const;

export type CurrencyCatalog = {
  majorFiat: string[];
  bitcoin: 'BTC';
  otherFiat: string[];
  all: string[];
};
