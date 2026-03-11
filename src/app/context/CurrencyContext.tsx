import React, { createContext, useContext, useState, ReactNode } from 'react';
import { type Currency } from '../../types';

// Re-export for backward compatibility
export type { Currency } from '../../types';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  toggleCurrency: () => void;
  // Format WITHOUT converting (amount is already in currency units)
  format: (amount: number, currencyOverride?: Currency) => string;
  // Convert then format (default assumes amount is USD)
  formatFrom: (amount: number, fromCurrency?: Currency, toCurrencyOverride?: Currency) => string;
  // Back-compat: historically treated amount as USD and converted to current currency
  formatCurrency: (amount: number) => string;
  convertAmount: (amount: number, toCurrency: Currency, fromCurrency?: Currency) => number;
  formatMultipleCurrency: (amount: number, baseCurrency: Currency) => { usd: string; vnd: string; krw: string; jpy: string; cny: string };
  updateRates: () => void;
  lastUpdated: Date;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Updated exchange rates (as of March 3, 2026)
// Base: VND
// 1 USD = 26,192 VND
// 1 KRW = 17.77 VND  → 1 USD = 26192 / 17.77 ≈ 1473.66 KRW
// 1 JPY = 166.67 VND → 1 USD = 26192 / 166.67 ≈ 157.16 JPY
// 1 CNY = 3,792 VND  → 1 USD = 26192 / 3792   ≈ 6.91 CNY
export const EXCHANGE_RATES = {
  USD_TO_VND: 26192,
  KRW_TO_VND: 17.77,
  JPY_TO_VND: 166.67,
  CNY_TO_VND: 3792,
  // Derived
  USD_TO_KRW: 26192 / 17.77,   // ≈ 1473.66
  USD_TO_JPY: 26192 / 166.67,  // ≈ 157.16
  USD_TO_CNY: 26192 / 3792,    // ≈ 6.91
  VND_TO_USD: 1 / 26192,
  KRW_TO_USD: 17.77 / 26192,
  JPY_TO_USD: 166.67 / 26192,
  CNY_TO_USD: 3792 / 26192,
};

const STORAGE_KEY = 'app.currency';

const detectDefaultCurrency = (): Currency => {
  const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
  if (saved === 'USD' || saved === 'VND' || saved === 'KRW' || saved === 'JPY' || saved === 'CNY') return saved;
  return 'VND';
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(detectDefaultCurrency());
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Convert any currency → any currency (via VND as base)
  const convertAmount = (amount: number, toCurrency: Currency, fromCurrency: Currency = 'USD'): number => {
    // First convert to VND
    let amountInVND: number;
    switch (fromCurrency) {
      case 'VND': amountInVND = amount; break;
      case 'KRW': amountInVND = amount * EXCHANGE_RATES.KRW_TO_VND; break;
      case 'JPY': amountInVND = amount * EXCHANGE_RATES.JPY_TO_VND; break;
      case 'CNY': amountInVND = amount * EXCHANGE_RATES.CNY_TO_VND; break;
      case 'USD': default: amountInVND = amount * EXCHANGE_RATES.USD_TO_VND; break;
    }
    // Then convert from VND to target
    switch (toCurrency) {
      case 'VND': return amountInVND;
      case 'KRW': return amountInVND / EXCHANGE_RATES.KRW_TO_VND;
      case 'JPY': return amountInVND / EXCHANGE_RATES.JPY_TO_VND;
      case 'CNY': return amountInVND / EXCHANGE_RATES.CNY_TO_VND;
      case 'USD': return amountInVND * EXCHANGE_RATES.VND_TO_USD;
      default: return amountInVND * EXCHANGE_RATES.VND_TO_USD;
    }
  };

  const format = (amount: number, currencyOverride?: Currency): string => {
    const curr = currencyOverride || currency;
    switch (curr) {
      case 'USD':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
      case 'VND':
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
      case 'KRW':
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
      case 'JPY':
        return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
      case 'CNY':
        return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
      default:
        return String(amount);
    }
  };

  const formatFrom = (amount: number, fromCurrency: Currency = 'USD', toCurrencyOverride?: Currency): string => {
    const to = toCurrencyOverride || currency;
    return format(convertAmount(amount, to, fromCurrency), to);
  };

  // Format amount in all 5 currencies for side-by-side display
  // amount is in baseCurrency units
  const formatMultipleCurrency = (amount: number, baseCurrency: Currency = 'USD') => {
    const toVND = convertAmount(amount, 'VND', baseCurrency);
    return {
      usd: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(convertAmount(amount, 'USD', baseCurrency)),
      vnd: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(toVND),
      krw: new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(convertAmount(amount, 'KRW', baseCurrency)),
      jpy: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(convertAmount(amount, 'JPY', baseCurrency)),
      cny: new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(convertAmount(amount, 'CNY', baseCurrency)),
    };
  };

  const updateRates = () => setLastUpdated(new Date());

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency: (next) => {
          setCurrency(next);
          if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, next);
        },
        toggleCurrency: () => {
          const order: Currency[] = ['VND', 'KRW', 'USD', 'JPY', 'CNY'];
          const idx = order.indexOf(currency);
          const next = order[(idx + 1) % order.length];
          setCurrency(next);
          if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, next);
        },
        format,
        formatFrom,
        formatCurrency: (amount: number) => formatFrom(amount, 'USD'),
        convertAmount,
        formatMultipleCurrency,
        updateRates,
        lastUpdated,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) throw new Error('useCurrency must be used within a CurrencyProvider');
  return context;
}
