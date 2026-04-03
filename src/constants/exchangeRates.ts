/**
 * Exchange Rates - Single Source of Truth
 * Centralized exchange rate definitions to ensure consistency across the application
 * 
 * IMPORTANT: All exchange rates are defined relative to VND (Vietnamese Dong) as base currency
 * This matches the business requirement that all costs are stored in VND
 * 
 * QA Report Reference: BUG-001 - Fixed inconsistent EXCHANGE_RATES definitions
 * 
 * Rate sources (as of April 2026):
 * - 1 USD = 25,500 VND
 * - 1 KRW = 18.9 VND (approximately)
 * - 1 JPY = 170 VND
 * - 1 CNY = 3,500 VND
 * - 1 EUR = 28,000 VND
 */

// Base rates: 1 unit of foreign currency = X VND
export const EXCHANGE_RATES = {
  // Base currency
  VND: 1,
  
  // Major currencies
  USD: 25500,    // 1 USD = 25,500 VND
  KRW: 18.9,     // 1 KRW = 18.9 VND (was incorrectly 20 in scholarships.ts)
  JPY: 170,      // 1 JPY = 170 VND
  CNY: 3500,     // 1 CNY = 3,500 VND
  EUR: 28000,    // 1 EUR = 28,000 VND
} as const;

// For backward compatibility with feeDefaults.ts
// These are derived from the base rates above
export const USD_RATES = {
  vndToUsd: EXCHANGE_RATES.USD,      // 1 USD = 25,500 VND
  krwToUsd: EXCHANGE_RATES.USD / EXCHANGE_RATES.KRW,  // ~1,349 KRW = 1 USD
} as const;

// Legacy export names for backward compatibility
export const KRW_TO_VND = EXCHANGE_RATES.KRW;  // 18.9
export const USD_TO_VND = EXCHANGE_RATES.USD;  // 25,500

// Utility functions for currency conversion
export function convertToVND(amount: number, fromCurrency: keyof typeof EXCHANGE_RATES): number {
  return amount * EXCHANGE_RATES[fromCurrency];
}

export function convertFromVND(amountInVND: number, toCurrency: keyof typeof EXCHANGE_RATES): number {
  return amountInVND / EXCHANGE_RATES[toCurrency];
}

export function convertCurrency(
  amount: number, 
  fromCurrency: keyof typeof EXCHANGE_RATES, 
  toCurrency: keyof typeof EXCHANGE_RATES
): number {
  const amountInVND = convertToVND(amount, fromCurrency);
  return convertFromVND(amountInVND, toCurrency);
}

// Format rates for display
export function formatRate(currency: keyof typeof EXCHANGE_RATES): string {
  const rate = EXCHANGE_RATES[currency];
  if (currency === 'VND') return '1 VND = 1 VND';
  return `1 ${currency} = ${rate.toLocaleString('vi-VN')} VND`;
}

// All rates as array for iteration
export const ALL_RATES = Object.entries(EXCHANGE_RATES).map(([currency, rate]) => ({
  currency: currency as keyof typeof EXCHANGE_RATES,
  rate,
  display: formatRate(currency as keyof typeof EXCHANGE_RATES),
}));
