import React, { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp, Settings, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import PriceInput from './PriceInput';
import type { University as UniversityType, UniversitySystem } from '../../types/university';
import type { FeeType, TimeUnit, FeeOption, FeeCondition, FlexibleFee } from '../../types/fees';

// Validation schemas
const systemSchema = z.object({
  code: z.enum(['D4-1', 'D2-1', 'D2-2', 'D2-3', 'D2-6']),
  name: z.string().min(1, 'Tên hệ không được để trống'),
  nameVi: z.string().optional(),
  nameKo: z.string().optional(),
  description: z.string().optional(),
  available: z.boolean().default(true),
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
  category: z.string().optional(),
  required: z.boolean().default(false),
  note: z.string().optional(),
  applies_to: z.array(z.string()).default([]),
});

const FEE_TYPES = [
  { value: 'fixed', label: 'Phí cố định', description: 'Giá trị không đổi' },
  { value: 'optional', label: 'Phí tùy chọn', description: 'Học sinh có thể chọn' },
  { value: 'optional_multiple', label: 'Nhiều lựa chọn', description: 'Chọn một trong nhiều' },
  { value: 'percentage', label: 'Phần trăm', description: 'Giảm giá theo %' },
  { value: 'variable_time', label: 'Thời gian biến đổi', description: 'Giá thay đổi theo thời gian' },
];

const TIME_UNITS = [
  { value: 'month', label: 'Tháng' },
  { value: 'year', label: 'Năm' },
  { value: 'semester', label: 'Học kỳ' },
  { value: 'one_time', label: 'Một lần' },
];

const SYSTEM_CODES = [
  { value: 'D4-1', label: 'D4-1', description: 'Chương trình tiếng Hàn' },
  { value: 'D2-1', label: 'D2-1', description: 'Chương trình chuẩn bị' },
  { value: 'D2-2', label: 'D2-2', description: 'Chương trình đại học' },
  { value: 'D2-3', label: 'D2-3', description: 'Chương trình sau đại học' },
  { value: 'D2-6', label: 'D2-6', description: 'Chương trình nâng cao' },
];

interface UniversitySystemsManagerProps {
  university: UniversityType;
  systems: UniversitySystem[];
  onChange: (systems: UniversitySystem[]) => void;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export default function UniversitySystemsManager({ 
  university: UniversityType, 
  systems, 
  onChange, 
  onError, 
  onSuccess 
}: UniversitySystemsManagerProps) {
  const [expandedSystems, setExpandedSystems] = useState<string[]>([]);
  const [editingSystem, setEditingSystem] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleSystem = (systemId: string) => {
    setExpandedSystems(prev =>
      prev.includes(systemId) 
        ? prev.filter(id => id !== systemId)
        : [...prev, systemId]
    );
  };

  const addSystem = useCallback(() => {
    const existingCodes = systems.map(s => s.code);
    const availableCodes = SYSTEM_CODES.filter(sc => !existingCodes.includes(sc.value));
    
    if (availableCodes.length === 0) {
      onError?.('Đã thêm tất cả các hệ thống có sẵn');
      return;
    }

    const newSystem: UniversitySystem = {
      id: `system-${Date.now()}`,
      code: availableCodes[0].value,
      name: availableCodes[0].label,
      available: true,
      fees: [],
    };

    onChange([...systems, newSystem]);
    onSuccess?.(`Đã thêm hệ thống ${availableCodes[0].label}`);
  }, [systems, onChange, onError, onSuccess]);

  const updateSystem = useCallback((index: number, field: string, value: any) => {
    const updatedSystems = [...systems];
    updatedSystems[index] = { ...updatedSystems[index], [field]: value };
    onChange(updatedSystems);
  }, [systems, onChange]);

  const removeSystem = useCallback((index: number) => {
    const systemToRemove = systems[index];
    onChange(systems.filter((_, i) => i !== index));
    onSuccess?.(`Đã xóa hệ thống ${systemToRemove.name}`);
  }, [systems, onChange, onSuccess]);

  const addFee = useCallback((systemIndex: number) => {
    const newFee: FlexibleFee = {
      id: `fee-${Date.now()}`,
      name: '',
      type: 'fixed',
      base_value: 0,
      currency: 'VND',
      applies_to: [systems[systemIndex].code],
    };

    const updatedSystems = [...systems];
    updatedSystems[systemIndex] = {
      ...updatedSystems[systemIndex],
      fees: [...updatedSystems[systemIndex].fees, newFee]
    };
    onChange(updatedSystems);
  }, [systems, onChange]);

  const updateFee = useCallback((systemIndex: number, feeIndex: number, field: string, value: any) => {
    const updatedSystems = [...systems];
    const updatedFees = [...updatedSystems[systemIndex].fees];
    updatedFees[feeIndex] = { ...updatedFees[feeIndex], [field]: value };
    updatedSystems[systemIndex] = { ...updatedSystems[systemIndex], fees: updatedFees };
    onChange(updatedSystems);
  }, [systems, onChange]);

  const removeFee = useCallback((systemIndex: number, feeIndex: number) => {
    const updatedSystems = [...systems];
    updatedSystems[systemIndex] = {
      ...updatedSystems[systemIndex],
      fees: updatedSystems[systemIndex].fees.filter((_: any, i: number) => i !== feeIndex)
    };
    onChange(updatedSystems);
  }, [systems, onChange]);

  const addFeeOption = useCallback((systemIndex: number, feeIndex: number) => {
    const newOption: FeeOption = {
      id: `option-${Date.now()}`,
      label: '',
      value: 0,
      currency: 'VND',
    };

    updateFee(systemIndex, feeIndex, 'options', [
      ...(systems[systemIndex].fees[feeIndex].options || []),
      newOption
    ]);
  }, [systems, updateFee]);

  const removeFeeOption = useCallback((systemIndex: number, feeIndex: number, optionIndex: number) => {
    const options = systems[systemIndex].fees[feeIndex].options || [];
    const newOptions = options.filter((_, i: number) => i !== optionIndex);
    updateFee(systemIndex, feeIndex, 'options', newOptions);
  }, [systems, updateFee]);

  const addFeeCondition = useCallback((systemIndex: number, feeIndex: number) => {
    const newCondition: FeeCondition = {
      id: `condition-${Date.now()}`,
      label: '',
      percentage: 0,
    };

    updateFee(systemIndex, feeIndex, 'conditions', [
      ...(systems[systemIndex].fees[feeIndex].conditions || []),
      newCondition
    ]);
  }, [systems, updateFee]);

  const removeFeeCondition = useCallback((systemIndex: number, feeIndex: number, conditionIndex: number) => {
    const conditions = systems[systemIndex].fees[feeIndex].conditions || [];
    const newConditions = conditions.filter((_, i: number) => i !== conditionIndex);
    updateFee(systemIndex, feeIndex, 'conditions', newConditions);
  }, [systems, updateFee]);

  const getFeeTypeLabel = (type: FeeType) => {
    return FEE_TYPES.find(t => t.value === type)?.label || type;
  };

  const getSystemCodeLabel = (code: string) => {
    return SYSTEM_CODES.find(sc => sc.value === code)?.label || code;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Hệ thống học phí</h3>
          <p className="text-sm text-slate-600">
            Quản lý các hệ thống và học phí cho trường {university?.name || 'Chưa có tên'}
          </p>
        </div>
        <Button onClick={addSystem} className="bg-[#003AB7] hover:bg-[#002A8F]">
          <Plus className="w-4 h-4 mr-2" />
          Thêm hệ thống
        </Button>
      </div>

      {systems.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Chưa có hệ thống nào được thêm. Hãy thêm hệ thống đầu tiên để quản lý học phí.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {systems.map((system, systemIndex) => (
          <Card key={system.id} className="border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={system.available ? 'default' : 'secondary'}>
                      {getSystemCodeLabel(system.code)}
                    </Badge>
                    {system.available ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Đang hoạt động
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        Tạm dừng
                      </Badge>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{system.name}</CardTitle>
                    {system.description && (
                      <p className="text-sm text-slate-600 mt-1">{system.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingSystem(editingSystem === system.id ? null : system.id)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSystem(systemIndex)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSystem(system.id)}
                  >
                    {expandedSystems.includes(system.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* System Basic Info */}
              {editingSystem === system.id && (
                <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Mã hệ thống</Label>
                      <Select
                        value={system.code}
                        onValueChange={(value) => updateSystem(systemIndex, 'code', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SYSTEM_CODES.map(code => (
                            <SelectItem 
                              key={code.value} 
                              value={code.value}
                              disabled={systems.some(s => s.id !== system.id && s.code === code.value)}
                            >
                              <div>
                                <div className="font-medium">{code.label}</div>
                                <div className="text-sm text-slate-600">{code.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tên hệ thống</Label>
                      <Input
                        value={system.name}
                        onChange={(e) => updateSystem(systemIndex, 'name', e.target.value)}
                        placeholder="Nhập tên hệ thống"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Tên tiếng Việt</Label>
                      <Input
                        value={system.nameVi || ''}
                        onChange={(e) => updateSystem(systemIndex, 'nameVi', e.target.value)}
                        placeholder="Nhập tên tiếng Việt"
                      />
                    </div>
                    <div>
                      <Label>Tên tiếng Hàn</Label>
                      <Input
                        value={system.nameKo || ''}
                        onChange={(e) => updateSystem(systemIndex, 'nameKo', e.target.value)}
                        placeholder="Nhập tên tiếng Hàn"
                      />
                    </div>
                    <div>
                      <Label>Mô tả</Label>
                      <Textarea
                        value={system.description || ''}
                        onChange={(e) => updateSystem(systemIndex, 'description', e.target.value)}
                        placeholder="Nhập mô tả hệ thống"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={system.available}
                        onCheckedChange={(checked) => updateSystem(systemIndex, 'available', checked)}
                      />
                      <Label>Đang hoạt động</Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Fees Management */}
              {expandedSystems.includes(system.id) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Học phí ({system.fees.length})</h4>
                    <Button
                      size="sm"
                      onClick={() => addFee(systemIndex)}
                      className="bg-[#003AB7] hover:bg-[#002A8F]"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Thêm học phí
                    </Button>
                  </div>

                  {system.fees.length === 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Chưa có học phí nào. Hãy thêm học phí đầu tiên cho hệ thống này.
                      </AlertDescription>
                    </Alert>
                  )}

                  {system.fees.map((fee, feeIndex) => (
                    <Card key={fee.id} className="border-slate-100">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {getFeeTypeLabel(fee.type)}
                            </Badge>
                            <span className="font-medium">{fee.name || 'Học phí chưa đặt tên'}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFee(systemIndex, feeIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <Label>Tên học phí *</Label>
                            <Input
                              value={fee.name}
                              onChange={(e) => updateFee(systemIndex, feeIndex, 'name', e.target.value)}
                              placeholder="Nhập tên học phí"
                            />
                          </div>
                          <div>
                            <Label>Loại học phí *</Label>
                            <Select
                              value={fee.type}
                              onValueChange={(value: FeeType) => updateFee(systemIndex, feeIndex, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FEE_TYPES.map(type => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div>
                                      <div className="font-medium">{type.label}</div>
                                      <div className="text-sm text-slate-600">{type.description}</div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Giá trị *</Label>
                            <PriceInput
                              value={fee.base_value}
                              onChange={(value) => updateFee(systemIndex, feeIndex, 'base_value', value)}
                              id={`fee-value-${fee.id}`}
                            />
                          </div>
                          <div>
                            <Label>Đơn vị tiền tệ</Label>
                            <Select
                              value={fee.currency}
                              onValueChange={(value) => updateFee(systemIndex, feeIndex, 'currency', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="VND">VND</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="KRW">KRW</SelectItem>
                                <SelectItem value="JPY">JPY</SelectItem>
                                <SelectItem value="CNY">CNY</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Đơn vị thời gian</Label>
                            <Select
                              value={fee.time_unit}
                              onValueChange={(value: TimeUnit) => updateFee(systemIndex, feeIndex, 'time_unit', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_UNITS.map(unit => (
                                  <SelectItem key={unit.value} value={unit.value}>
                                    {unit.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Ghi chú</Label>
                            <Textarea
                              value={fee.note || ''}
                              onChange={(e) => updateFee(systemIndex, feeIndex, 'note', e.target.value)}
                              placeholder="Nhập ghi chú"
                              rows={2}
                            />
                          </div>
                        </div>

                        {/* Options for optional_multiple and variable_time */}
                        {(fee.type === 'optional_multiple' || fee.type === 'variable_time') && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-3">
                              <Label className="text-base font-medium">Lựa chọn</Label>
                              <Button
                                size="sm"
                                onClick={() => addFeeOption(systemIndex, feeIndex)}
                                className="bg-[#003AB7] hover:bg-[#002A8F]"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Thêm lựa chọn
                              </Button>
                            </div>
                            
                            <div className="space-y-3">
                              {(fee.options || []).map((option, optionIndex) => (
                                <div key={option.id} className="border border-slate-200 rounded-lg p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <Label>Tên lựa chọn</Label>
                                      <Input
                                        value={option.label}
                                        onChange={(e) => {
                                          const newOptions = [...(fee.options || [])];
                                          newOptions[optionIndex] = { ...newOptions[optionIndex], label: e.target.value };
                                          updateFee(systemIndex, feeIndex, 'options', newOptions);
                                        }}
                                        placeholder="Nhập tên lựa chọn"
                                      />
                                    </div>
                                    <div>
                                      <Label>Giá trị</Label>
                                      <PriceInput
                                        value={option.value}
                                        onChange={(value) => {
                                          const newOptions = [...(fee.options || [])];
                                          newOptions[optionIndex] = { ...newOptions[optionIndex], value };
                                          updateFee(systemIndex, feeIndex, 'options', newOptions);
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
                                          updateFee(systemIndex, feeIndex, 'options', newOptions);
                                        }}
                                        placeholder="Nhập ghi chú cho lựa chọn"
                                        rows={2}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end mt-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFeeOption(systemIndex, feeIndex, optionIndex)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Xóa
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Conditions for percentage type */}
                        {fee.type === 'percentage' && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-3">
                              <Label className="text-base font-medium">Điều kiện giảm giá</Label>
                              <Button
                                size="sm"
                                onClick={() => addFeeCondition(systemIndex, feeIndex)}
                                className="bg-[#003AB7] hover:bg-[#002A8F]"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Thêm điều kiện
                              </Button>
                            </div>
                            
                            <div className="space-y-3">
                              {(fee.conditions || []).map((condition, conditionIndex) => (
                                <div key={condition.id} className="border border-slate-200 rounded-lg p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <Label>Tên điều kiện</Label>
                                      <Input
                                        value={condition.label}
                                        onChange={(e) => {
                                          const newConditions = [...(fee.conditions || [])];
                                          newConditions[conditionIndex] = { ...newConditions[conditionIndex], label: e.target.value };
                                          updateFee(systemIndex, feeIndex, 'conditions', newConditions);
                                        }}
                                        placeholder="Nhập tên điều kiện"
                                      />
                                    </div>
                                    <div>
                                      <Label>Phần trăm (%)</Label>
                                      <Input
                                        type="number"
                                        value={condition.percentage}
                                        onChange={(e) => {
                                          const newConditions = [...(fee.conditions || [])];
                                          newConditions[conditionIndex] = { ...newConditions[conditionIndex], percentage: Number(e.target.value) };
                                          updateFee(systemIndex, feeIndex, 'conditions', newConditions);
                                        }}
                                        placeholder="Nhập phần trăm"
                                        min="0"
                                        max="100"
                                      />
                                    </div>
                                    <div>
                                      <Label>Ghi chú</Label>
                                      <Textarea
                                        value={condition.note || ''}
                                        onChange={(e) => {
                                          const newConditions = [...(fee.conditions || [])];
                                          newConditions[conditionIndex] = { ...newConditions[conditionIndex], note: e.target.value };
                                          updateFee(systemIndex, feeIndex, 'conditions', newConditions);
                                        }}
                                        placeholder="Nhập ghi chú cho điều kiện"
                                        rows={2}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end mt-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFeeCondition(systemIndex, feeIndex, conditionIndex)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Xóa
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
