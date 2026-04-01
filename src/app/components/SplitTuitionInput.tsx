import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Calculator, Type, Hash, ArrowRight } from 'lucide-react';

interface SplitTuitionInputProps {
  value: {
    text: string;
    amount: number;
    currency: 'VND' | 'KRW' | 'USD';
  };
  onChange: (value: { text: string; amount: number; currency: 'VND' | 'KRW' | 'USD' }) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Split Tuition Input Component
 * Allows entering tuition as both text (for display) and number (for calculation)
 * Example: "13,000,000 VND/kỳ" (text) + 13000000 (number for calculation)
 */
export default function SplitTuitionInput({
  value,
  onChange,
  label = "Học phí",
  placeholder = "VD: 13 triệu VND/kỳ",
  className = ""
}: SplitTuitionInputProps) {
  const [textValue, setTextValue] = useState(value.text || '');
  const [numValue, setNumValue] = useState(value.amount?.toString() || '');
  const [currency, setCurrency] = useState<'VND' | 'KRW' | 'USD'>(value.currency || 'VND');

  // Sync with external value
  useEffect(() => {
    setTextValue(value.text || '');
    setNumValue(value.amount?.toString() || '');
    setCurrency(value.currency || 'VND');
  }, [value.text, value.amount, value.currency]);

  const handleTextChange = (newText: string) => {
    setTextValue(newText);
    onChange({
      text: newText,
      amount: parseFloat(numValue) || 0,
      currency
    });
  };

  const handleNumChange = (newNum: string) => {
    setNumValue(newNum);
    onChange({
      text: textValue,
      amount: parseFloat(newNum) || 0,
      currency
    });
  };

  const handleCurrencyChange = (newCurrency: 'VND' | 'KRW' | 'USD') => {
    setCurrency(newCurrency);
    onChange({
      text: textValue,
      amount: parseFloat(numValue) || 0,
      currency: newCurrency
    });
  };

  // Auto-generate text from number if text is empty
  const autoGenerateText = () => {
    if (!textValue && numValue) {
      const num = parseFloat(numValue);
      let formatted = '';
      if (currency === 'VND') {
        formatted = num >= 1000000 
          ? `${(num / 1000000).toFixed(1)} triệu VND` 
          : `${num.toLocaleString('vi-VN')} VND`;
      } else if (currency === 'KRW') {
        formatted = num >= 10000 
          ? `${(num / 10000).toFixed(0)}만 원` 
          : `${num.toLocaleString('ko-KR')} 원`;
      } else {
        formatted = `$${num.toLocaleString('en-US')}`;
      }
      setTextValue(formatted);
      onChange({
        text: formatted,
        amount: num,
        currency
      });
    }
  };

  return (
    <div className={className}>
      {label && (
        <Label className="text-sm font-medium mb-2 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-500" />
          {label}
        </Label>
      )}

      <Card className="border-blue-200">
        <CardContent className="p-4 space-y-4">
          {/* Text Input Row */}
          <div className="space-y-2">
            <Label className="text-xs text-slate-500 flex items-center gap-1">
              <Type className="w-3 h-3" />
              Dạng hiển thị (Text)
            </Label>
            <Input
              value={textValue}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={placeholder}
              className="font-['Be_Vietnam_Pro']"
            />
            <p className="text-xs text-slate-400">
              Ví dụ: "13 triệu VND/kỳ", "500만 원/학기", "$5,000/semester"
            </p>
          </div>

          {/* Number Input Row */}
          <div className="space-y-2">
            <Label className="text-xs text-slate-500 flex items-center gap-1">
              <Hash className="w-3 h-3" />
              Giá trị số (dùng để tính toán)
            </Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={numValue}
                onChange={(e) => handleNumChange(e.target.value)}
                placeholder="VD: 13000000"
                className="flex-1 font-mono"
              />
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value as any)}
                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
              >
                <option value="VND">VND</option>
                <option value="KRW">KRW (원)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          {/* Preview */}
          {numValue && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <ArrowRight className="w-4 h-4" />
                <span className="font-medium">Xem trước tính toán:</span>
              </div>
              <div className="text-blue-800 font-['Be_Vietnam_Pro']">
                {textValue || '(Chưa có text hiển thị)'} = {parseFloat(numValue).toLocaleString('vi-VN')} {currency}
              </div>
            </div>
          )}

          {/* Auto-generate button */}
          {!textValue && numValue && (
            <button
              onClick={autoGenerateText}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Tự động tạo text từ số
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
