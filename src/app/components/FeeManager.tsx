import React, { useState, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Badge } from './ui/badge';
import PriceInput from './PriceInput';
import type { FlexibleFee, FeeType, TimeUnit, FeeOption, FeeCondition } from '../../types/fees';

const optionSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Vui lòng nhập nhãn'),
  value: z.number().min(0, 'Giá trị phải là số không âm'),
  currency: z.string().default('VND'),
  note: z.string().optional(),
  condition: z.string().optional(),
});

const conditionSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Vui lòng nhập nhãn điều kiện'),
  percentage: z.number().min(0).max(100, 'Phần trăm phải từ 0-100'),
  note: z.string().optional(),
  requirement: z.string().optional(),
});

const feeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Vui lòng nhập tên phí'),
  nameVi: z.string().optional(),
  nameKo: z.string().optional(),
  type: z.enum(['fixed', 'optional', 'optional_multiple', 'percentage', 'variable_time']),
  base_value: z.number().min(0, 'Giá trị phải là số không âm'),
  currency: z.string().default('VND'),
  time_unit: z.enum(['month', 'year', 'semester', 'one_time']).optional(),
  default_selected: z.union([z.string(), z.array(z.string())]).optional(),
  note: z.string().optional(),
  category: z.string().optional(),
  required: z.boolean().default(false),
  min_value: z.number().optional(),
  max_value: z.number().optional(),
  applies_to: z.array(z.string()).default([]),
  options: z.array(optionSchema).optional(),
  conditions: z.array(conditionSchema).optional(),
});

type FeeFormData = z.infer<typeof feeSchema>;

interface FeeManagerProps {
  fees: FlexibleFee[];
  onChange: (fees: FlexibleFee[]) => void;
  visaTypes?: string[];
}

const FEE_TYPES: { value: FeeType; label: string; description: string }[] = [
  {
    value: 'fixed',
    label: 'Phí cố định',
    description: 'Phí không đổi, bắt buộc phải trả'
  },
  {
    value: 'optional',
    label: 'Phí tùy chọn',
    description: 'Phí có thể chọn hoặc không'
  },
  {
    value: 'optional_multiple',
    label: 'Phí tùy chọn đa lựa chọn',
    description: 'Phí có nhiều lựa chọn (VD: phòng ở, loại vé)'
  },
  {
    value: 'percentage',
    label: 'Phí theo phần trăm',
    description: 'Giảm giá theo phần trăm (VD: học bổng)'
  },
  {
    value: 'variable_time',
    label: 'Phí biến đổi theo thời gian',
    description: 'Phí thay đổi theo thời gian (VD: vé máy bay)'
  }
];

const TIME_UNITS: { value: TimeUnit; label: string }[] = [
  { value: 'month', label: 'Tháng' },
  { value: 'year', label: 'Năm' },
  { value: 'semester', label: 'Học kỳ' },
  { value: 'one_time', label: 'Một lần' }
];

export default function FeeManager({ fees, onChange, visaTypes = [] }: FeeManagerProps) {
  const [expandedFees, setExpandedFees] = useState<Set<string>>(new Set());
  
  const { control, handleSubmit, watch, setValue } = useForm<FeeFormData>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      currency: 'VND',
      applies_to: visaTypes,
    }
  });

  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: 'options',
  });

  const { fields: conditionFields, append: appendCondition, remove: removeCondition } = useFieldArray({
    control,
    name: 'conditions',
  });

  const watchedType = watch('type');
  const showOptions = ['optional_multiple', 'variable_time'].includes(watchedType);
  const showConditions = watchedType === 'percentage';
  const showTimeUnit = ['optional', 'optional_multiple', 'variable_time'].includes(watchedType);

  const addNewFee = useCallback(() => {
    const newFee: FlexibleFee = {
      id: `fee-${Date.now()}`,
      name: '',
      type: 'fixed',
      base_value: 0,
      currency: 'VND',
      applies_to: visaTypes,
    };
    onChange([...fees, newFee]);
  }, [fees, onChange, visaTypes]);

  const updateFee = useCallback((index: number, field: string, value: any) => {
    const updatedFees = [...fees];
    updatedFees[index] = { ...updatedFees[index], [field]: value };
    onChange(updatedFees);
  }, [fees, onChange]);

  const deleteFee = useCallback((index: number) => {
    const updatedFees = fees.filter((_, i) => i !== index);
    onChange(updatedFees);
  }, [fees, onChange]);

  const toggleExpanded = useCallback((feeId: string) => {
    const newExpanded = new Set(expandedFees);
    if (newExpanded.has(feeId)) {
      newExpanded.delete(feeId);
    } else {
      newExpanded.add(feeId);
    }
    setExpandedFees(newExpanded);
  }, [expandedFees]);

  const addOption = useCallback((feeIndex: number) => {
    const newOption: FeeOption = {
      id: `option-${Date.now()}`,
      label: '',
      value: 0,
      currency: 'VND',
    };
    updateFee(feeIndex, 'options', [...(fees[feeIndex].options || []), newOption]);
  }, [fees, updateFee]);

  const removeFeeOption = useCallback((feeIndex: number, optionIndex: number) => {
    const options = fees[feeIndex].options || [];
    const newOptions = options.filter((_, i: number) => i !== optionIndex);
    updateFee(feeIndex, 'options', newOptions);
  }, [fees, updateFee]);

  const addFeeCondition = useCallback((feeIndex: number) => {
    const newCondition: FeeCondition = {
      id: `condition-${Date.now()}`,
      label: '',
      percentage: 0,
    };
    updateFee(feeIndex, 'conditions', [...(fees[feeIndex].conditions || []), newCondition]);
  }, [fees, updateFee]);

  const removeFeeCondition = useCallback((feeIndex: number, conditionIndex: number) => {
    const conditions = fees[feeIndex].conditions || [];
    const newConditions = conditions.filter((_, i: number) => i !== conditionIndex);
    updateFee(feeIndex, 'conditions', newConditions);
  }, [fees, updateFee]);

  const getFeeTypeLabel = (type: FeeType) => {
    return FEE_TYPES.find(t => t.value === type)?.label || type;
  };

  const getFeeTypeDescription = (type: FeeType) => {
    return FEE_TYPES.find(t => t.value === type)?.description || '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Quản lý Phí & Học bổng</h3>
        <Button onClick={addNewFee} className="bg-[#003AB7] hover:bg-[#002A8F]">
          <Plus className="w-4 h-4 mr-2" />
          Thêm phí mới
        </Button>
      </div>

      <div className="space-y-4">
        {fees.map((fee, feeIndex) => (
          <Card key={fee.id} className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{fee.name || 'Phí chưa đặt tên'}</CardTitle>
                  <Badge variant={fee.required ? 'destructive' : 'secondary'}>
                    {fee.required ? 'Bắt buộc' : 'Tùy chọn'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpanded(fee.id)}
                  >
                    {expandedFees.has(fee.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteFee(feeIndex)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <Accordion type="single" value={expandedFees.has(fee.id) ? fee.id : undefined} collapsible>
              <AccordionTrigger className="px-6">
                <div className="w-full text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{getFeeTypeLabel(fee.type)}</Badge>
                    {fee.category && <Badge variant="secondary">{fee.category}</Badge>}
                    {fee.currency && <span className="text-sm text-slate-600">{fee.currency}</span>}
                  </div>
                  {getFeeTypeDescription(fee.type) && (
                    <p className="text-sm text-slate-600">{getFeeTypeDescription(fee.type)}</p>
                  )}
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor={`name-${fee.id}`}>Tên phí *</Label>
                    <Input
                      id={`name-${fee.id}`}
                      value={fee.name}
                      onChange={(e) => updateFee(feeIndex, 'name', e.target.value)}
                      placeholder="VD: Ký túc xá, Học bổng TOPIK"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`type-${fee.id}`}>Loại phí *</Label>
                    <Select value={fee.type} onValueChange={(value) => updateFee(feeIndex, 'type', value as FeeType)}>
                      <SelectTrigger id={`type-${fee.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FEE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-slate-600">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`base_value-${fee.id}`}>Giá trị cơ bản *</Label>
                    <PriceInput
                      label="Giá trị cơ bản"
                      id={`base_value-${fee.id}`}
                      value={fee.base_value}
                      onChange={(value) => updateFee(feeIndex, 'base_value', value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`currency-${fee.id}`}>Đơn vị tiền tệ</Label>
                    <Select value={fee.currency} onValueChange={(value) => updateFee(feeIndex, 'currency', value)}>
                      <SelectTrigger id={`currency-${fee.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VND">VND - Việt Nam Đồng</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="KRW">KRW - Korean Won</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {showTimeUnit && (
                    <div>
                      <Label htmlFor={`time_unit-${fee.id}`}>Đơn vị thời gian</Label>
                      <Select value={fee.time_unit} onValueChange={(value) => updateFee(feeIndex, 'time_unit', value as TimeUnit)}>
                        <SelectTrigger id={`time_unit-${fee.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_UNITS.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`required-${fee.id}`}
                      checked={fee.required || false}
                      onChange={(e) => updateFee(feeIndex, 'required', e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    <Label htmlFor={`required-${fee.id}`}>Phí bắt buộc</Label>
                  </div>

                  <div>
                    <Label htmlFor={`category-${fee.id}`}>Danh mục</Label>
                    <Input
                      id={`category-${fee.id}`}
                      value={fee.category || ''}
                      onChange={(e) => updateFee(feeIndex, 'category', e.target.value)}
                      placeholder="VD: accommodation, scholarship, travel"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <Label htmlFor={`note-${fee.id}`}>Ghi chú</Label>
                  <Textarea
                    id={`note-${fee.id}`}
                    value={fee.note || ''}
                    onChange={(e) => updateFee(feeIndex, 'note', e.target.value)}
                    placeholder="Thêm ghi chú cho loại phí này..."
                    rows={3}
                  />
                </div>

                {/* Options for optional_multiple and variable_time */}
                {showOptions && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-medium">Lựa chọn</Label>
                      <Button
                        size="sm"
                        onClick={() => appendOption({
                          id: `option-${Date.now()}`,
                          label: '',
                          value: 0,
                          currency: 'VND'
                        })}
                        className="bg-[#003AB7] hover:bg-[#002A8F]"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Thêm lựa chọn
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {(fee.options || []).map((option, optionIndex) => (
                        <div key={option.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">Lựa chọn {optionIndex + 1}</h4>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeOption(optionIndex)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label>Nhãn lựa chọn *</Label>
                              <Input
                                value={option.label}
                                onChange={(e) => {
                                  const newOptions = [...(fee.options || [])];
                                  newOptions[optionIndex] = { ...newOptions[optionIndex], label: e.target.value };
                                  updateFee(feeIndex, 'options', newOptions);
                                }}
                                placeholder="VD: Phòng 2 người, Đặt sớm"
                              />
                            </div>
                            
                            <div>
                              <Label>Giá trị *</Label>
                              <PriceInput
                                label="Giá trị"
                                value={option.value}
                                onChange={(value) => {
                                  const newOptions = [...(fee.options || [])];
                                  newOptions[optionIndex] = { ...newOptions[optionIndex], value };
                                  updateFee(feeIndex, 'options', newOptions);
                                }}
                                id={`option-value-${option.id}`}
                              />
                            </div>
                            
                            <div className="md:col-span-2">
                              <Label>Ghi chú</Label>
                              <Textarea
                                value={option.note || ''}
                                onChange={(e) => {
                                  const newOptions = [...(fee.options || [])];
                                  newOptions[optionIndex] = { ...newOptions[optionIndex], note: e.target.value };
                                  updateFee(feeIndex, 'options', newOptions);
                                }}
                                placeholder="Ghi chú cho lựa chọn này..."
                                rows={2}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conditions for percentage type */}
                {showConditions && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-medium">Điều kiện giảm giá</Label>
                      <Button
                        size="sm"
                        onClick={() => addFeeCondition(feeIndex)}
                        className="bg-[#003AB7] hover:bg-[#002A8F]"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Thêm điều kiện
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {(fee.conditions || []).map((condition, conditionIndex) => (
                        <div key={condition.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">Điều kiện {conditionIndex + 1}</h4>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeCondition(conditionIndex)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <Label>Nhãn điều kiện *</Label>
                              <Input
                                value={condition.label}
                                onChange={(e) => {
                                  const newConditions = [...(fee.conditions || [])];
                                  newConditions[conditionIndex] = { ...newConditions[conditionIndex], label: e.target.value };
                                  updateFee(feeIndex, 'conditions', newConditions);
                                }}
                                placeholder="VD: TOPIK 6 cấp, IELTS 7.0"
                              />
                            </div>
                            
                            <div>
                              <Label>Phần trăm giảm (%) *</Label>
                              <Input
                                type="number"
                                value={condition.percentage}
                                onChange={(e) => {
                                  const newConditions = [...(fee.conditions || [])];
                                  newConditions[conditionIndex] = { ...newConditions[conditionIndex], percentage: Number(e.target.value) };
                                  updateFee(feeIndex, 'conditions', newConditions);
                                }}
                                placeholder="VD: 100, 70, 50"
                                min={0}
                                max={100}
                              />
                            </div>
                            
                            <div className="md:col-span-3">
                              <Label>Ghi chú</Label>
                              <Textarea
                                value={condition.note || ''}
                                onChange={(e) => {
                                  const newConditions = [...(fee.conditions || [])];
                                  newConditions[conditionIndex] = { ...newConditions[conditionIndex], note: e.target.value };
                                  updateFee(feeIndex, 'conditions', newConditions);
                                }}
                                placeholder="Ghi chú cho điều kiện này..."
                                rows={2}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </AccordionContent>
            </Accordion>
          </Card>
        ))}
      </div>
    </div>
  );
}
