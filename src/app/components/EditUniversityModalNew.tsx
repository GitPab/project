import React, { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Plus, Trash2, ChevronDown, ChevronUp, Calculator, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import type { University } from '../../types/university';
import { useCurrency } from '../context/CurrencyContext';
import type { Currency } from '../context/CurrencyContext';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../../utils/cn';

const CURRENCY_VALUES = ['VND', 'KRW', 'USD', 'JPY', 'CNY'] as const;
const VISA_TYPES = ['D4-1', 'D2-1', 'D2-2', 'D2-3', 'D2-6'] as const;

const FEE_TYPE_OPTIONS = [
  { value: 'system_cost', label: 'Chi phí hệ' },
  { value: 'consultation', label: 'Phí tư vấn' },
  { value: 'application', label: 'Phí apply' },
  { value: 'visa', label: 'Phí visa' },
  { value: 'accommodation', label: 'Chỗ ở' },
  { value: 'insurance', label: 'Bảo hiểm' },
  { value: 'scholarship', label: 'Học bổng' },
  { value: 'flight', label: 'Vé máy bay' },
  { value: 'savings', label: 'Sổ tiết kiệm' },
  { value: 'other', label: 'Khác' },
] as const;

const feeRowSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Vui lòng nhập tên phí'),
  type: z.enum(['system_cost', 'consultation', 'application', 'visa', 'accommodation', 'insurance', 'scholarship', 'flight', 'savings', 'other']),
  amount: z.number().min(0),
  currency: z.enum(CURRENCY_VALUES).default('VND'),
  appliesToSystems: z.array(z.string()).default([]),
  note: z.string().optional(),
});

const visaSystemSchema = z.object({
  visaType: z.enum(VISA_TYPES),
  visaName: z.string().min(1),
  description: z.string().optional(),
  available: z.boolean().default(false),
  fees: z.array(feeRowSchema).default([]),
  tuitionPerTerm: z.number().min(0).default(0),
  tuitionRangeMin: z.number().min(0).default(0),
  tuitionRangeMax: z.number().min(0).default(0),
  applicationFee: z.number().min(0).default(0),
  enrollmentFee: z.number().min(0).default(0),
});

const formSchema = z.object({
  name: z.string().min(2, 'Tên trường phải có ít nhất 2 ký tự'),
  koreanName: z.string().optional(),
  region: z.string().optional(),
  topTier: z.enum(['Top1', 'Top2', 'Top3']).default('Top2'),
  overview: z.string().max(250, 'Mô tả tối đa 250 từ').optional(),
  visaSystems: z.array(visaSystemSchema).default([]),
  fixedCosts: z.array(feeRowSchema).default([]),
});

type FormValues = z.infer<typeof formSchema>;
type FeeRow = z.infer<typeof feeRowSchema>;
type VisaSystemForm = z.infer<typeof visaSystemSchema>;

type EditUniversityModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  university: University | null | undefined;
  onSave: (university: Partial<University>) => void | Promise<void>;
};

const VISA_TYPE_LABELS: Record<string, string> = {
  'D4-1': 'D4-1 (Tiếng Hàn)',
  'D2-1': 'D2-1 (Chuẩn bị)',
  'D2-2': 'D2-2 (Đại học)',
  'D2-3': 'D2-3 (Sau đại học)',
  'D2-6': 'D2-6 (Nâng cao)',
};

export default function EditUniversityModal({
  open,
  onOpenChange,
  university,
  onSave,
}: EditUniversityModalProps) {
  const { formatFrom, convertAmount } = useCurrency();
  const isEditMode = !!university;
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);

  const defaultValues: FormValues = useMemo(() => {
    const existingSystems = university?.koreanData?.visaSystems || [];
    
    const baseSystems: VisaSystemForm[] = VISA_TYPES.map(visaType => {
      const existing = existingSystems.find(v => v.visaType === visaType);
      
      return {
        visaType,
        visaName: existing?.visaName || VISA_TYPE_LABELS[visaType],
        description: existing?.description || '',
        available: existing ? true : false,
        fees: [],
        tuitionPerTerm: existing?.tuitionPerTerm || 0,
        tuitionRangeMin: existing?.tuitionRange?.min || 0,
        tuitionRangeMax: existing?.tuitionRange?.max || 0,
        applicationFee: existing?.applicationFee || 0,
        enrollmentFee: existing?.enrollmentFee || 0,
      };
    });

    const fixedCosts: FeeRow[] = (university?.fixedCosts || []).map((cost, idx) => ({
      id: `fixed-${idx}`,
      name: cost.type || 'Phí cố định',
      type: 'other',
      amount: cost.amount || 0,
      currency: (cost.currency as any) || 'VND',
      appliesToSystems: VISA_TYPES as unknown as string[],
      note: cost.description || '',
    }));

    (university?.optionalAddons || []).forEach((addon, idx) => {
      const typeMap: Record<string, any> = {
        'dorm-vn': 'accommodation',
        'dorm-kr': 'accommodation',
        'savings': 'savings',
        'flight': 'flight',
        'scholarship': 'scholarship',
        'group': 'other',
        'other': 'other',
      };
      
      fixedCosts.push({
        id: `addon-${idx}`,
        name: addon.name || addon.nameVi || 'Phí tùy chọn',
        type: typeMap[addon.type] || 'other',
        amount: addon.amount || 0,
        currency: (addon.currency as any) || 'VND',
        appliesToSystems: addon.visaType || VISA_TYPES as unknown as string[],
        note: addon.conditional || '',
      });
    });

    return {
      name: university?.name || '',
      koreanName: university?.koreanName || '',
      region: university?.region || '',
      topTier: (university?.koreanData?.topTier || 'Top2') as 'Top1' | 'Top2' | 'Top3',
      overview: university?.overview || university?.description || '',
      visaSystems: baseSystems,
      fixedCosts,
    };
  }, [university]);

  const { control, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const visaSystems = watch('visaSystems') || [];
  const fixedCosts = watch('fixedCosts') || [];

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, defaultValues, reset]);

  const updateSystem = (index: number, data: Partial<VisaSystemForm>) => {
    const current = visaSystems[index];
    const updated = { ...current, ...data };
    const newSystems = [...visaSystems];
    newSystems[index] = updated;
    setValue('visaSystems', newSystems);
  };

  const toggleSystemAvailable = (systemIndex: number, checked: boolean) => {
    const system = visaSystems[systemIndex];
    updateSystem(systemIndex, { available: checked });
    if (checked) {
      setExpandedSystem(system.visaType);
    } else if (expandedSystem === system.visaType) {
      setExpandedSystem(null);
    }
  };

  const addSystemFee = (systemIndex: number) => {
    const system = visaSystems[systemIndex];
    const newFee: FeeRow = {
      id: `sys-fee-${Date.now()}`,
      name: '',
      type: 'system_cost',
      amount: 0,
      currency: 'VND',
      appliesToSystems: [system.visaType],
      note: '',
    };
    updateSystem(systemIndex, {
      fees: [...(system.fees || []), newFee],
    });
  };

  const removeSystemFee = (systemIndex: number, feeIndex: number) => {
    const system = visaSystems[systemIndex];
    const newFees = [...(system.fees || [])];
    newFees.splice(feeIndex, 1);
    updateSystem(systemIndex, { fees: newFees });
  };

  const updateSystemFee = (systemIndex: number, feeIndex: number, updates: Partial<FeeRow>) => {
    const system = visaSystems[systemIndex];
    const newFees = [...(system.fees || [])];
    newFees[feeIndex] = { ...newFees[feeIndex], ...updates };
    updateSystem(systemIndex, { fees: newFees });
  };

  const addFixedCost = () => {
    const newFee: FeeRow = {
      id: `fixed-${Date.now()}`,
      name: '',
      type: 'other',
      amount: 0,
      currency: 'VND',
      appliesToSystems: VISA_TYPES as unknown as string[],
      note: '',
    };
    setValue('fixedCosts', [...fixedCosts, newFee]);
  };

  const removeFixedCost = (index: number) => {
    const newCosts = [...fixedCosts];
    newCosts.splice(index, 1);
    setValue('fixedCosts', newCosts);
  };

  const updateFixedCost = (index: number, updates: Partial<FeeRow>) => {
    const newCosts = [...fixedCosts];
    newCosts[index] = { ...newCosts[index], ...updates };
    setValue('fixedCosts', newCosts);
  };

  const totalCost = useMemo(() => {
    let total = 0;
    
    visaSystems.forEach(system => {
      if (!system.available) return;
      
      if (system.tuitionPerTerm) {
        total += convertAmount(system.tuitionPerTerm, 'VND', 'KRW');
      }
      if (system.applicationFee) {
        total += convertAmount(system.applicationFee, 'VND', 'KRW');
      }
      if (system.enrollmentFee) {
        total += convertAmount(system.enrollmentFee, 'VND', 'KRW');
      }
      
      (system.fees || []).forEach(fee => {
        if (fee.type !== 'scholarship') {
          total += convertAmount(fee.amount, 'VND', fee.currency as Currency);
        }
      });
    });
    
    fixedCosts.forEach(fee => {
      if (fee.type !== 'scholarship') {
        total += convertAmount(fee.amount, 'VND', fee.currency as Currency);
      }
    });
    
    return total;
  }, [visaSystems, fixedCosts, convertAmount]);

  const onSubmit = handleSubmit(async (values) => {
    const fixedCostsData: University['fixedCosts'] = [];
    const optionalAddons: University['optionalAddons'] = [];
    
    values.fixedCosts.forEach(fee => {
      const typeMap: Record<string, any> = {
        'consultation': 'other',
        'application': 'other',
        'visa': 'other',
        'accommodation': 'dorm-vn',
        'insurance': 'other',
        'scholarship': 'scholarship',
        'flight': 'other',
        'savings': 'other',
        'other': 'other',
        'system_cost': 'other',
      };
      
      if (fee.type === 'consultation' || fee.type === 'application' || fee.type === 'visa' || fee.type === 'insurance') {
        fixedCostsData.push({
          type: fee.name,
          amount: fee.amount,
          currency: fee.currency as Currency,
          description: fee.note,
        });
      } else {
        optionalAddons.push({
          id: fee.id || `addon-${Date.now()}`,
          name: fee.name,
          nameVi: fee.name,
          type: typeMap[fee.type] || 'other',
          amount: fee.amount,
          currency: fee.currency,
          selectable: true,
          visaType: fee.appliesToSystems,
          conditional: fee.note,
        });
      }
    });

    const visaSystemsData = values.visaSystems
      .filter(s => s.available)
      .map(s => ({
        visaType: s.visaType as 'D4-1' | 'D2-1' | 'D2-2' | 'D2-3' | 'D2-6',
        visaName: s.visaName,
        description: s.description,
        available: true,
        tuitionPerTerm: s.tuitionPerTerm,
        tuitionRange: s.tuitionRangeMin || s.tuitionRangeMax 
          ? { min: s.tuitionRangeMin || 0, max: s.tuitionRangeMax || 0 }
          : undefined,
        applicationFee: s.applicationFee,
        enrollmentFee: s.enrollmentFee,
      }));

    const payload: Partial<University> = {
      name: values.name,
      koreanName: values.koreanName,
      region: values.region,
      country: 'South Korea',
      overview: values.overview,
      fixedCosts: fixedCostsData,
      optionalAddons,
      koreanData: {
        isKoreanUniversity: true,
        ...(university?.koreanData || {}),
        topTier: values.topTier,
        address: values.region,
        visaSystems: visaSystemsData,
      },
    };

    await onSave(payload);
    onOpenChange(false);
    toast.success(isEditMode ? 'Đã cập nhật trường' : 'Đã thêm trường mới');
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="px-8 py-6 border-b bg-slate-50 sticky top-0 z-10">
          <DialogTitle className="text-2xl font-bold">Chỉnh sửa trường đại học Hàn Quốc</DialogTitle>
          <DialogDescription className="text-base mt-1">
            Quản lý hệ visa và chi phí. Toggle Available/Non-available cho mỗi hệ
          </DialogDescription>
        </DialogHeader>

        <form id="university-form" onSubmit={onSubmit} className="px-8 py-6 space-y-8">
          
          {/* Thông tin cơ bản */}
          <Card className="shadow-md">
            <CardHeader className="bg-blue-50 border-b py-4">
              <h3 className="font-bold text-xl text-slate-800">Thông tin cơ bản</h3>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Tên trường</Label>
                  <Controller 
                    name="name" 
                    control={control} 
                    render={({ field }) => <Input {...field} className="h-12 text-base" />} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Tên tiếng Hàn</Label>
                  <Controller 
                    name="koreanName" 
                    control={control} 
                    render={({ field }) => <Input {...field} className="h-12 text-base" />} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Khu vực</Label>
                  <Controller 
                    name="region" 
                    control={control} 
                    render={({ field }) => <Input {...field} className="h-12 text-base" />} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Top Tier</Label>
                  <Controller 
                    name="topTier" 
                    control={control} 
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Top1">Top 1</SelectItem>
                          <SelectItem value="Top2">Top 2</SelectItem>
                          <SelectItem value="Top3">Top 3</SelectItem>
                        </SelectContent>
                      </Select>
                    )} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-base font-semibold">Mô tả (tối đa 250 từ)</Label>
                <Controller 
                  name="overview" 
                  control={control} 
                  render={({ field }) => <Textarea {...field} rows={3} className="text-base resize-none" />} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Hệ thống Visa & Chi phí */}
          <Card className="shadow-md">
            <CardHeader className="bg-blue-50 border-b py-4">
              <h3 className="font-bold text-xl text-slate-800">Hệ thống Visa & Chi phí</h3>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {/* 5 Visa Buttons with Toggle */}
              <div className="flex flex-wrap gap-4">
                {visaSystems.map((system, systemIndex) => (
                  <div 
                    key={system.visaType}
                    className={cn(
                      "flex items-center gap-3 px-5 py-4 rounded-xl border-2 transition-all",
                      system.available 
                        ? 'bg-blue-50 border-blue-400 shadow-md' 
                        : 'bg-slate-100 border-slate-200 opacity-70'
                    )}
                  >
                    <span className={cn(
                      "font-bold text-xl",
                      system.available ? 'text-blue-700' : 'text-slate-500'
                    )}>
                      {system.visaType}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={system.available}
                        onCheckedChange={(checked) => toggleSystemAvailable(systemIndex, checked)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                      <span className={cn(
                        "text-sm font-medium min-w-[100px]",
                        system.available ? 'text-blue-700' : 'text-slate-500'
                      )}>
                        {system.available ? 'Available' : 'Non-available'}
                      </span>
                    </div>
                    
                    {system.available && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setExpandedSystem(expandedSystem === system.visaType ? null : system.visaType)}
                      >
                        {expandedSystem === system.visaType ? (
                          <ChevronUp className="w-5 h-5 text-blue-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-blue-600" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Expanded System Form */}
              {visaSystems.map((system, systemIndex) => {
                if (!system.available || expandedSystem !== system.visaType) return null;
                
                return (
                  <div key={system.visaType} className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50/30">
                    <div className="flex items-center gap-3 mb-6">
                      <Badge className="bg-blue-600 text-white text-lg px-4 py-1">
                        {system.visaType}
                      </Badge>
                      <h4 className="font-bold text-xl text-slate-800">
                        Chi phí theo hệ {system.visaType}
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Học phí/kỳ (KRW)</Label>
                        <Input 
                          type="number" 
                          value={system.tuitionPerTerm}
                          onChange={(e) => updateSystem(systemIndex, { tuitionPerTerm: Number(e.target.value) })}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Phí đơn (KRW)</Label>
                        <Input 
                          type="number" 
                          value={system.applicationFee}
                          onChange={(e) => updateSystem(systemIndex, { applicationFee: Number(e.target.value) })}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Phí nhập học (KRW)</Label>
                        <Input 
                          type="number" 
                          value={system.enrollmentFee}
                          onChange={(e) => updateSystem(systemIndex, { enrollmentFee: Number(e.target.value) })}
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Học phí tối thiểu (KRW)</Label>
                        <Input 
                          type="number" 
                          value={system.tuitionRangeMin}
                          onChange={(e) => updateSystem(systemIndex, { tuitionRangeMin: Number(e.target.value) })}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Học phí tối đa (KRW)</Label>
                        <Input 
                          type="number" 
                          value={system.tuitionRangeMax}
                          onChange={(e) => updateSystem(systemIndex, { tuitionRangeMax: Number(e.target.value) })}
                          className="h-11"
                        />
                      </div>
                    </div>

                    {/* Fees for this system */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-lg text-slate-700">Danh sách phí cho hệ {system.visaType}</h5>
                        <Button type="button" size="sm" onClick={() => addSystemFee(systemIndex)} className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="w-4 h-4 mr-1" /> Thêm phí
                        </Button>
                      </div>

                      {system.fees && system.fees.length > 0 ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-12 gap-3 text-sm font-semibold text-slate-700 px-3 py-2 bg-slate-100 rounded-lg">
                            <div className="col-span-3">Tên phí</div>
                            <div className="col-span-2">Loại phí</div>
                            <div className="col-span-2">Số tiền</div>
                            <div className="col-span-4">Hệ áp dụng</div>
                            <div className="col-span-1"></div>
                          </div>
                          
                          {system.fees.map((fee, feeIndex) => (
                            <div key={fee.id || feeIndex} className="grid grid-cols-12 gap-3 items-start bg-white p-3 rounded-lg border border-slate-200">
                              <div className="col-span-3">
                                <Input 
                                  value={fee.name} 
                                  onChange={(e) => updateSystemFee(systemIndex, feeIndex, { name: e.target.value })}
                                  placeholder="Tên phí"
                                  className="h-10 text-sm"
                                />
                              </div>
                              <div className="col-span-2">
                                <Select value={fee.type} onValueChange={(v) => updateSystemFee(systemIndex, feeIndex, { type: v as any })}>
                                  <SelectTrigger className="h-10 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {FEE_TYPE_OPTIONS.map(opt => (
                                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-2 flex gap-1">
                                <Input 
                                  type="number" 
                                  value={fee.amount} 
                                  onChange={(e) => updateSystemFee(systemIndex, feeIndex, { amount: Number(e.target.value) })}
                                  className="h-10 text-sm flex-1"
                                />
                                <Select value={fee.currency} onValueChange={(v) => updateSystemFee(systemIndex, feeIndex, { currency: v as any })}>
                                  <SelectTrigger className="h-10 text-sm w-16">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CURRENCY_VALUES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-4">
                                <div className="flex flex-wrap gap-2">
                                  {VISA_TYPES.map(visaType => (
                                    <label key={visaType} className="flex items-center gap-1 text-xs bg-slate-100 px-2 py-1 rounded border cursor-pointer hover:bg-slate-200">
                                      <Checkbox 
                                        checked={fee.appliesToSystems?.includes(visaType)}
                                        onCheckedChange={(checked) => {
                                          const current = fee.appliesToSystems || [];
                                          const updated = checked ? [...current, visaType] : current.filter(v => v !== visaType);
                                          updateSystemFee(systemIndex, feeIndex, { appliesToSystems: updated });
                                        }}
                                        className="w-3 h-3"
                                      />
                                      <span>{visaType}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeSystemFee(systemIndex, feeIndex)} className="h-8 w-8 p-0">
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                              <div className="col-span-12">
                                <Input 
                                  value={fee.note || ''} 
                                  onChange={(e) => updateSystemFee(systemIndex, feeIndex, { note: e.target.value })}
                                  placeholder="Ghi chú"
                                  className="h-9 text-sm"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm italic">Chưa có phí nào cho hệ này</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Danh sách phí chung */}
          <Card className="shadow-md">
            <CardHeader className="bg-slate-50 border-b py-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xl text-slate-800">Danh sách phí chung</h3>
                <Button type="button" size="sm" variant="outline" onClick={addFixedCost}>
                  <Plus className="w-4 h-4 mr-1" /> Thêm phí
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {fixedCosts.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-3 text-sm font-semibold text-slate-700 px-3 py-2 bg-slate-100 rounded-lg">
                    <div className="col-span-3">Tên phí</div>
                    <div className="col-span-2">Loại phí</div>
                    <div className="col-span-2">Số tiền</div>
                    <div className="col-span-4">Hệ áp dụng</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {fixedCosts.map((fee, index) => (
                    <div key={fee.id || index} className="grid grid-cols-12 gap-3 items-start bg-white p-3 rounded-lg border border-slate-200">
                      <div className="col-span-3">
                        <Input 
                          value={fee.name} 
                          onChange={(e) => updateFixedCost(index, { name: e.target.value })}
                          placeholder="Tên phí"
                          className="h-10 text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Select value={fee.type} onValueChange={(v) => updateFixedCost(index, { type: v as any })}>
                          <SelectTrigger className="h-10 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FEE_TYPE_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 flex gap-1">
                        <Input 
                          type="number" 
                          value={fee.amount} 
                          onChange={(e) => updateFixedCost(index, { amount: Number(e.target.value) })}
                          className="h-10 text-sm flex-1"
                        />
                        <Select value={fee.currency} onValueChange={(v) => updateFixedCost(index, { currency: v as any })}>
                          <SelectTrigger className="h-10 text-sm w-16">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCY_VALUES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4">
                        <div className="flex flex-wrap gap-2">
                          {VISA_TYPES.map(visaType => (
                            <label key={visaType} className="flex items-center gap-1 text-xs bg-slate-100 px-2 py-1 rounded border cursor-pointer hover:bg-slate-200">
                              <Checkbox 
                                checked={fee.appliesToSystems?.includes(visaType)}
                                onCheckedChange={(checked) => {
                                  const current = fee.appliesToSystems || [];
                                  const updated = checked ? [...current, visaType] : current.filter(v => v !== visaType);
                                  updateFixedCost(index, { appliesToSystems: updated });
                                }}
                                className="w-3 h-3"
                              />
                              <span>{visaType}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeFixedCost(index)} className="h-8 w-8 p-0">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="col-span-12">
                        <Input 
                          value={fee.note || ''} 
                          onChange={(e) => updateFixedCost(index, { note: e.target.value })}
                          placeholder="Ghi chú"
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm italic">Chưa có phí chung nào</p>
              )}
            </CardContent>
          </Card>

          {/* Total Summary */}
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl">
            <CardContent className="py-6 px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Calculator className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-lg text-blue-100 block">Tổng chi phí ước tính</span>
                    <span className="text-sm text-blue-200">(Các hệ Available + Phí chung)</span>
                  </div>
                </div>
                <div className="text-4xl font-bold">
                  {formatFrom(totalCost)}
                </div>
              </div>
            </CardContent>
          </Card>

        </form>

        <DialogFooter className="px-8 py-6 border-t bg-slate-50 gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} size="lg" className="px-6">
            <X className="w-4 h-4 mr-2" /> Hủy
          </Button>
          <Button type="submit" form="university-form" disabled={isSubmitting} size="lg" className="bg-blue-600 hover:bg-blue-700 px-8">
            <Save className="w-4 h-4 mr-2" />
            {isEditMode ? 'Lưu thay đổi' : 'Thêm trường'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
