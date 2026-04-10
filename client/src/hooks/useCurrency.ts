import { useState, useEffect } from 'react';

const currencies = {
  USD: { symbol: '$', code: 'USD' },
  UGX: { symbol: 'USh', code: 'UGX' },
};

export type CurrencyCode = keyof typeof currencies;

export interface Currency {
  symbol: string;
  code: string;
}

const CURRENCY_KEY = 'schofy_currency';

export function useCurrency() {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const stored = localStorage.getItem(CURRENCY_KEY);
    if (stored && currencies[stored as CurrencyCode]) {
      return currencies[stored as CurrencyCode];
    }
    return currencies.USD;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem(CURRENCY_KEY);
      if (stored && currencies[stored as CurrencyCode]) {
        setCurrencyState(currencies[stored as CurrencyCode]);
      }
    };

    const handleSettingsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.currency && currencies[customEvent.detail.currency as CurrencyCode]) {
        setCurrencyState(currencies[customEvent.detail.currency as CurrencyCode]);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('currencyChanged', handleStorageChange);
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('currencyChanged', handleStorageChange);
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, []);

  function formatMoney(amount: number): string {
    return `${currency.symbol}${amount.toLocaleString()}`;
  }

  function setCurrency(code: CurrencyCode) {
    const newCurrency = currencies[code];
    if (newCurrency) {
      setCurrencyState(newCurrency);
      localStorage.setItem(CURRENCY_KEY, code);
      window.dispatchEvent(new Event('currencyChanged'));
    }
  }

  return { currency, setCurrency, formatMoney };
}
