import React from 'react';
import { useCurrency, Currency } from '../context/CurrencyContext';

interface MultiCurrencyDisplayProps {
  amount: number;
  baseCurrency?: Currency;
  compact?: boolean;
  className?: string;
}

export function MultiCurrencyDisplay({ amount, baseCurrency = 'VND', compact = false, className = '' }: MultiCurrencyDisplayProps) {
  const { formatMultipleCurrency } = useCurrency();
  
  const formatted = formatMultipleCurrency(amount, baseCurrency);

  if (compact) {
    return (
      <span className={`text-sm text-slate-600 ${className}`}>
        ({formatted.vnd} | {formatted.krw})
      </span>
    );
  }

  return (
    <div className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      <span className="font-semibold text-slate-900">{formatted.usd}</span>
      <span className="text-slate-400">|</span>
      <span className="text-slate-600">{formatted.vnd}</span>
      <span className="text-slate-400">|</span>
      <span className="text-slate-600">{formatted.krw}</span>
    </div>
  );
}

interface TotalWithConversionsProps {
  amount: number;
  baseCurrency?: Currency;
  label?: string;
  className?: string;
}

export function TotalWithConversions({ amount, baseCurrency = 'VND', label = 'Total', className = '' }: TotalWithConversionsProps) {
  const { currency, formatCurrency, formatMultipleCurrency } = useCurrency();
  
  const formatted = formatMultipleCurrency(amount, baseCurrency);
  const primaryAmount = currency === 'USD' ? formatted.usd : currency === 'VND' ? formatted.vnd : formatted.krw;

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 ${className}`}>
      <div className="flex items-baseline justify-between">
        <span className="text-lg font-semibold text-slate-700">{label}:</span>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">{primaryAmount}</div>
          <div className="text-sm text-slate-600 mt-1 space-x-2">
            <span className="opacity-75">~{currency === 'USD' ? formatted.vnd : formatted.usd}</span>
            <span className="opacity-50">|</span>
            <span className="opacity-75">~{formatted.krw}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
