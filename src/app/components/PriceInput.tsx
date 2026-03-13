import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { Input } from './ui/input';

/**
 * Currency-aware price input
 * Stores values internally in VND and renders in selected currency
 */
interface PriceInputProps {
  label: string;
  value: number; // VND
  onChange: (valueInVnd: number) => void;
  onBlur?: () => void;
  error?: string | string[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
  helperText?: string;
}

const normalizeError = (error?: string | string[]) => {
  if (!error) return '';
  return Array.isArray(error) ? error[0] || '' : error;
};

const sanitizeNumberInput = (value: string) => value.replace(/,/g, '').trim();

export default function PriceInput({
  label,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  placeholder = '0',
  id,
  name,
  helperText,
}: PriceInputProps) {
  const { currency, convertAmount, formatFrom } = useCurrency();
  const [rawValue, setRawValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const errorMessage = normalizeError(error);

  const displayValue = useMemo(() => {
    if (!value || value === 0) return '';
    const converted = convertAmount(value, currency, 'VND');
    if (!Number.isFinite(converted)) return '';
    return Math.round(converted).toString();
  }, [value, currency, convertAmount]);

  useEffect(() => {
    if (!isFocused) setRawValue(displayValue);
  }, [displayValue, isFocused]);

  const handleChange = (next: string) => {
    const cleaned = sanitizeNumberInput(next);
    if (!/^\d*(?:\.\d*)?$/.test(cleaned)) return;

    setRawValue(cleaned);

    if (cleaned === '') {
      onChange(0);
      return;
    }

    const numeric = Number(cleaned);
    if (Number.isNaN(numeric)) return;

    const vndValue = convertAmount(numeric, 'VND', currency);
    onChange(Math.round(vndValue));
  };

  const vndHelper = currency !== 'VND' ? `~ ${formatFrom(value, 'VND', 'VND')}` : undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          value={rawValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!errorMessage}
          className="pr-16"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
          {currency}
        </span>
      </div>
      {errorMessage && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {errorMessage}
        </p>
      )}
      {(helperText || vndHelper) && (
        <p className="text-xs text-slate-500">
          {helperText || vndHelper}
        </p>
      )}
    </div>
  );
}

