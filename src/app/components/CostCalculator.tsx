import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, TrendingUp, Clock, Percent, Home, Plane, Shield } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import type { FlexibleFee, FeeOption, FeeCondition, CostCalculation } from '../types/fees';

interface CostCalculatorProps {
  fees: FlexibleFee[];
  visaType?: string;
  onCalculationChange?: (calculation: CostCalculation) => void;
}

export default function CostCalculator({ fees, visaType, onCalculationChange }: CostCalculatorProps) {
  const { currency, formatFrom, convertAmount } = useCurrency();
  const { language, t } = useLanguage();
  
  // State for selected options and values
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedConditions, setSelectedConditions] = useState<Record<string, string>>({});
  const [timeValues, setTimeValues] = useState<Record<string, number>>({});
  const [optionalFees, setOptionalFees] = useState<Record<string, boolean>>({});

  // Filter fees based on visa type
  const applicableFees = useMemo(() => {
    return fees.filter(fee => !fee.applies_to || fee.applies_to.includes(visaType || ''));
  }, [fees, visaType]);

  // Group fees by category
  const feeGroups = useMemo(() => {
    const groups: Record<string, FlexibleFee[]> = {};
    applicableFees.forEach(fee => {
      const category = fee.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(fee);
    });
    return groups;
  }, [applicableFees]);

  // Calculate total costs
  const calculation = useMemo((): CostCalculation => {
    let totalFees = 0;
    let totalDiscounts = 0;
    const breakdown: CostCalculation['breakdown'] = [];

    applicableFees.forEach(fee => {
      let feeAmount = 0;
      let discount = 0;

      switch (fee.type) {
        case 'fixed':
          feeAmount = fee.base_value;
          break;
          
        case 'optional':
          if (optionalFees[fee.id]) {
            feeAmount = fee.base_value;
          }
          break;
          
        case 'optional_multiple':
        case 'variable_time':
          const selectedOptionId = selectedOptions[fee.id];
          const selectedOption = fee.options?.find(opt => opt.id === selectedOptionId);
          if (selectedOption) {
            feeAmount = selectedOption.value;
          }
          break;
          
        case 'percentage':
          const selectedConditionId = selectedConditions[fee.id];
          const selectedCondition = fee.conditions?.find(cond => cond.id === selectedConditionId);
          if (selectedCondition) {
            const baseAmount = fee.base_value;
            discount = (baseAmount * selectedCondition.percentage) / 100;
            feeAmount = baseAmount - discount;
          }
          break;
      }

      // Apply time-based calculations
      if (fee.time_unit && timeValues[fee.id]) {
        const multiplier = timeValues[fee.id];
        feeAmount = feeAmount * multiplier;
      }

      totalFees += feeAmount;
      totalDiscounts += discount;

      breakdown.push({
        fee_id: fee.id,
        fee_name: fee.name,
        selected_option: selectedOptions[fee.id],
        quantity: timeValues[fee.id],
        amount: feeAmount + discount,
        discount,
        final_amount: feeAmount
      });
    });

    return {
      total_fees: totalFees,
      total_discounts: totalDiscounts,
      final_total: totalFees,
      currency,
      breakdown
    };
  }, [applicableFees, selectedOptions, selectedConditions, timeValues, optionalFees, currency]);

  // Notify parent of calculation changes
  useEffect(() => {
    if (onCalculationChange) {
      onCalculationChange(calculation);
    }
  }, [calculation, onCalculationChange]);

  const handleOptionSelect = (feeId: string, optionId: string) => {
    setSelectedOptions(prev => ({ ...prev, [feeId]: optionId }));
  };

  const handleConditionSelect = (feeId: string, conditionId: string) => {
    setSelectedConditions(prev => ({ ...prev, [feeId]: conditionId }));
  };

  const handleTimeChange = (feeId: string, value: number) => {
    setTimeValues(prev => ({ ...prev, [feeId]: value }));
  };

  const handleOptionalToggle = (feeId: string, checked: boolean) => {
    setOptionalFees(prev => ({ ...prev, [feeId]: checked }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'accommodation': return <Home className="w-5 h-5" />;
      case 'travel': return <Plane className="w-5 h-5" />;
      case 'insurance': return <Shield className="w-5 h-5" />;
      case 'scholarship': return <Percent className="w-5 h-5" />;
      case 'service': return <Calculator className="w-5 h-5" />;
      default: return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, { vi: string; ko: string; en: string }> = {
      accommodation: { vi: 'Chi phí ở', ko: '숙박비', en: 'Accommodation' },
      travel: { vi: 'Chi phí di chuyển', ko: '이동비', en: 'Travel Costs' },
      insurance: { vi: 'Bảo hiểm', ko: '보험', en: 'Insurance' },
      scholarship: { vi: 'Học bổng', ko: '장학금', en: 'Scholarships' },
      service: { vi: 'Phí dịch vụ', ko: '서비스 수수료', en: 'Service Fees' },
      tuition: { vi: 'Học phí', ko: '수업료', en: 'Tuition Fees' },
      other: { vi: 'Khác', ko: '기타', en: 'Other' }
    };
    return names[category]?.[language] || category;
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            {language === 'vi' ? 'Tính toán Chi phí' : language === 'ko' ? '비용 계산' : 'Cost Calculator'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-slate-600 mb-1">
                  {language === 'vi' ? 'Tổng phí' : language === 'ko' ? '총 비용' : 'Total Fees'}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatFrom(calculation.total_fees)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">
                  {language === 'vi' ? 'Giảm giá' : language === 'ko' ? '할인' : 'Discounts'}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  -{formatFrom(calculation.total_discounts)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">
                  {language === 'vi' ? 'Thành tiền' : language === 'ko' ? '최종 금액' : 'Final Total'}
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {formatFrom(calculation.final_total)}
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>{language === 'vi' ? 'Tiến độ hoàn thành' : language === 'ko' ? '완료 진행률' : 'Completion Progress'}</span>
              <span>{Math.round((calculation.final_total / 10000000) * 100)}%</span>
            </div>
            <Progress value={Math.min((calculation.final_total / 10000000) * 100, 100)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Fee Groups */}
      {Object.entries(feeGroups).map(([category, categoryFees]) => (
        <Card key={category} className="border-slate-200">
          <Accordion type="single" collapsible>
            <AccordionTrigger className="px-6">
              <div className="flex items-center gap-3 w-full">
                {getCategoryIcon(category)}
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-semibold">{getCategoryName(category)}</h3>
                  <p className="text-sm text-slate-600">
                    {categoryFees.length} {language === 'vi' ? 'loại phí' : language === 'ko' ? '개 항목' : 'items'}
                  </p>
                </div>
                <Badge variant="secondary">
                  {categoryFees.filter(f => f.required).length} {language === 'vi' ? 'bắt buộc' : language === 'ko' ? '필수' : 'required'}
                </Badge>
              </div>
            </AccordionTrigger>
            
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                {categoryFees.map((fee) => (
                  <div key={fee.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-slate-900">{fee.name}</h4>
                        {fee.note && (
                          <p className="text-sm text-slate-600 mt-1">{fee.note}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={fee.required ? 'destructive' : 'secondary'}>
                          {fee.required ? 
                            (language === 'vi' ? 'Bắt buộc' : language === 'ko' ? '필수' : 'Required') : 
                            (language === 'vi' ? 'Tùy chọn' : language === 'ko' ? '선택' : 'Optional')
                          }
                        </Badge>
                        {fee.currency && (
                          <span className="text-sm text-slate-600">{fee.currency}</span>
                        )}
                      </div>
                    </div>

                    {/* Fixed Fee */}
                    {fee.type === 'fixed' && (
                      <div className="bg-slate-50 rounded p-3">
                        <p className="text-lg font-medium">
                          {formatFrom(fee.base_value)}
                        </p>
                        {fee.time_unit && (
                          <p className="text-sm text-slate-600">
                            /{language === 'vi' ? 
                              (fee.time_unit === 'month' ? 'tháng' : 
                              fee.time_unit === 'year' ? 'năm' : 
                              fee.time_unit === 'semester' ? 'học kỳ' : 'lần') : 
                              fee.time_unit}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Optional Fee */}
                    {fee.type === 'optional' && (
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`optional-${fee.id}`}
                          checked={optionalFees[fee.id] || false}
                          onCheckedChange={(checked) => handleOptionalToggle(fee.id, checked)}
                        />
                        <Label htmlFor={`optional-${fee.id}`} className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {language === 'vi' ? 'Thêm phí này' : language === 'ko' ? '이 수수료 추가' : 'Add this fee'}
                            </span>
                            <span className="text-lg font-bold text-blue-600">
                              {formatFrom(fee.base_value)}
                            </span>
                          </div>
                        </Label>
                      </div>
                    )}

                    {/* Optional Multiple */}
                    {fee.type === 'optional_multiple' && fee.options && (
                      <div>
                        <Label className="block text-sm font-medium mb-3">
                          {language === 'vi' ? 'Chọn một lựa chọn:' : language === 'ko' ? '옵션 선택:' : 'Select an option:'}
                        </Label>
                        <RadioGroup
                          value={selectedOptions[fee.id] || ''}
                          onValueChange={(value) => handleOptionSelect(fee.id, value)}
                        >
                          {fee.options.map((option) => (
                            <div key={option.id} className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg mb-2">
                              <RadioGroupItem value={option.id} id={option.id} />
                              <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{option.label}</p>
                                    {option.note && (
                                      <p className="text-sm text-slate-600">{option.note}</p>
                                    )}
                                  </div>
                                  <p className="text-lg font-bold text-blue-600">
                                    {formatFrom(option.value)}
                                  </p>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    )}

                    {/* Variable Time */}
                    {fee.type === 'variable_time' && fee.options && (
                      <div>
                        <Label className="block text-sm font-medium mb-3">
                          {language === 'vi' ? 'Chọn thời điểm:' : language === 'ko' ? '시점 선택:' : 'Select timing:'}
                        </Label>
                        <RadioGroup
                          value={selectedOptions[fee.id] || ''}
                          onValueChange={(value) => handleOptionSelect(fee.id, value)}
                        >
                          {fee.options.map((option) => (
                            <div key={option.id} className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg mb-2">
                              <RadioGroupItem value={option.id} id={option.id} />
                              <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{option.label}</p>
                                    {option.note && (
                                      <p className="text-sm text-slate-600">{option.note}</p>
                                    )}
                                  </div>
                                  <p className="text-lg font-bold text-blue-600">
                                    {formatFrom(option.value)}
                                  </p>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    )}

                    {/* Percentage (Scholarship) */}
                    {fee.type === 'percentage' && fee.conditions && (
                      <div>
                        <Label className="block text-sm font-medium mb-3">
                          {language === 'vi' ? 'Chọn điều kiện học bổng:' : language === 'ko' ? '장학금 조건 선택:' : 'Select scholarship condition:'}
                        </Label>
                        <RadioGroup
                          value={selectedConditions[fee.id] || ''}
                          onValueChange={(value) => handleConditionSelect(fee.id, value)}
                        >
                          {fee.conditions.map((condition) => (
                            <div key={condition.id} className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg mb-2">
                              <RadioGroupItem value={condition.id} id={condition.id} />
                              <Label htmlFor={condition.id} className="flex-1 cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{condition.label}</p>
                                    <p className="text-lg font-bold text-green-600">
                                      -{condition.percentage}%
                                    </p>
                                    {condition.note && (
                                      <p className="text-sm text-slate-600">{condition.note}</p>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-600">
                                    {language === 'vi' ? 'Tiết kiệm:' : language === 'ko' ? '절약:' : 'Savings:'} {formatFrom((fee.base_value * condition.percentage) / 100)}
                                  </p>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    )}

                    {/* Time-based multiplier */}
                    {fee.time_unit && fee.type !== 'percentage' && (
                      <div className="mt-4">
                        <Label className="block text-sm font-medium mb-3">
                          {language === 'vi' ? `Số ${fee.time_unit === 'month' ? 'tháng' : fee.time_unit === 'year' ? 'năm' : fee.time_unit === 'semester' ? 'học kỳ' : 'lần'}:` : 
                            language === 'ko' ? `${fee.time_unit === 'month' ? '월' : fee.time_unit === 'year' ? '년' : fee.time_unit === 'semester' ? '학기' : '번'}:` : 
                            `Number of ${fee.time_unit}s:`}
                        </Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[timeValues[fee.id] || 1]}
                            onValueChange={(value) => handleTimeChange(fee.id, value[0])}
                            max={fee.time_unit === 'month' ? 12 : fee.time_unit === 'year' ? 4 : fee.time_unit === 'semester' ? 8 : 24}
                            min={1}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-lg font-bold text-blue-600 min-w-[3rem] text-center">
                            {timeValues[fee.id] || 1}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </Accordion>
        </Card>
      ))}
    </div>
  );
}
