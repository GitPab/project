import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

/**
 * Currency-aware price input component
 * Handles internal VND storage with display in selected currency
 */
interface PriceInputProps {
  label: string;
  value: number; // Value in VND (internal storage)
  onChange: (valueInVnd: number) => void;
  onBlur?: () => void;
  error?: string[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function PriceInput({
  label,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  placeholder = '0',
}: PriceInputProps) {
  const { currency, convertAmount } = useCurrency();

  // Convert internal VND value to display currency
  const displayValue = Math.round(convertAmount(value, 'VND', currency));

  // Handle user input - convert back from display currency to VND
  const handleChange = (displayAmount: number) => {
    // Convert from display currency back to VND for internal storage
    const vndValue = convertAmount(displayAmount, currency, 'VND');
    onChange(Math.round(vndValue));
  };

  return (
    <div>
      <label className="block mb-2 font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="number"
          value={displayValue || ''}
          onChange={(e) => {
            const inputValue = e.target.value === '' ? 0 : Number(e.target.value);
            handleChange(inputValue);
          }}
          onBlur={onBlur}
          className={`w-full px-4 py-2 bg-white rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${
            error && error.length > 0
              ? 'border-red-500 focus:border-red-500'
              : 'border-slate-300 focus:border-primary'
          }`}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min="0"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">
          {currency}
        </span>
      </div>
      {error && error.length > 0 && (
        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error[0]}
        </p>
      )}
      <p className="text-xs text-slate-500 mt-1">
        Stored internally in VND. Displayed in {currency}.
      </p>
    </div>
  );
}
