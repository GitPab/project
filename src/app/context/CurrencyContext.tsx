import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Currency = 'VND' | 'USD' | 'KRW' | 'JPY' | 'CNY' | 'EUR';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  toggleCurrency: () => void;
  format: (amount: number, currencyOverride?: Currency) => string;
  formatFrom: (amount: number, fromCurrency?: Currency, toCurrencyOverride?: Currency) => string;
  formatCurrency: (amount: number) => string;
  convertAmount: (amount: number, toCurrency: Currency, fromCurrency?: Currency) => number;
  formatMultipleCurrency: (amount: number, baseCurrency: Currency) => { usd: string; vnd: string; krw: string; jpy: string; cny: string };
  updateRates: () => void;
  lastUpdated: Date;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('VND');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const format = (amount: number, currencyOverride?: Currency): string => {
    const curr = currencyOverride || currency;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: curr, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const formatFrom = (amount: number, _fromCurrency?: Currency, _toCurrencyOverride?: Currency): string => {
    return format(amount);
  };

  const formatCurrency = (amount: number): string => {
    return format(amount);
  };

  const convertAmount = (amount: number, toCurrency: Currency, fromCurrency?: Currency): number => {
    const from = fromCurrency || 'VND';
    const to = toCurrency || 'VND';
    
    // Simple conversion rates (approximate)
    const rates: Record<string, number> = {
      'VND': 1,
      'USD': 25500,
      'KRW': 18.9,  // 1 KRW = ~18.9 VND
      'JPY': 170,
      'CNY': 3500,
      'EUR': 28000
    };
    
    // Convert to VND first, then to target currency
    const amountInVND = amount * (rates[from] || 1);
    return amountInVND / (rates[to] || 1);
  };

  const formatMultipleCurrency = (amount: number, _baseCurrency?: Currency) => {
    const formatted = format(amount);
    return {
      usd: formatted,
      vnd: formatted,
      krw: formatted,
      jpy: formatted,
      cny: formatted,
    };
  };

  const updateRates = () => setLastUpdated(new Date());

  const toggleCurrency = () => {}; // No-op, currency switching disabled

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        toggleCurrency,
        format,
        formatFrom,
        formatCurrency,
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
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
