import React, { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { University } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import type { Currency } from '../context/CurrencyContext';
import PriceInput from './PriceInput';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const countWords = (text: string) =>
  text.trim().length === 0 ? 0 : text.trim().split(/\s+/).filter(Boolean).length;

const feeSchema = z.object({
  type: z.string().min(1, 'Vui lòng nhập loại phí'),
  amount: z.number().min(0, 'Số tiền phải là số không âm'),
});

// ✅ FIX 2: currency must be a valid Currency union type, not plain string
const CURRENCY_VALUES = ['VND', 'KRW', 'USD', 'JPY', 'CNY'] as const;

const fixedCostSchema = z.object({
  type: z.string().min(1, 'Vui lòng nhập loại phí'),
  amount: z.number().min(0, 'Số tiền phải là số không âm'),
  currency: z.enum(CURRENCY_VALUES).optional(),
});

// ✅ FIX 3 & 5: Add 'type' field to addonSchema so Controller name is valid
const addonSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Vui lòng nhập tên phí'),
  amount: z.number().optional(),
  type: z.string().optional(),
});

const formSchema = z.object({
  name: z.string().min(2, 'Tên trường phải có ít nhất 2 ký tự'),
  koreanName: z.string().optional(),
  region: z.string().optional(),
  topTier: z.enum(['Top1', 'Top2', 'Top3']),
  country: z.string().min(1),
  overview: z.string().optional().superRefine((value, ctx) => {
    if (!value) return;
    const total = countWords(value);
    if (total > 250) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Mô tả không được vượt quá 250 từ (hiện tại: ${total} từ)`,
      });
    }
  }),
  generalTuition: z.number().min(0).optional(),
  visaFee: z.number().min(0).optional(),
  accommodationFee: z.number().min(0).optional(),
  insuranceFee: z.number().min(0).optional(),
  additionalFees: z.array(feeSchema).optional(),
  isKorean: z.boolean().optional(),
  selectedVisaType: z.string().optional(),
  fixedCosts: z.array(fixedCostSchema).optional(),
  optionalAddons: z.array(addonSchema).optional(),
});

type FormValues = z.infer<typeof formSchema>;

type EditUniversityModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  university?: University;
  onSave: (data: Partial<University>) => void;
};

export default function EditUniversityModal({
  open,
  onOpenChange,
  university,
  onSave,
}: EditUniversityModalProps) {
  const { currency, formatFrom, convertAmount } = useCurrency();
  const isEditMode = !!university;
  const [selectedVisaType, setSelectedVisaType] = useState<string | null>(null);
  const [enabledVisaSystems, setEnabledVisaSystems] = useState<Set<string>>(new Set());

  const ALL_VISA_OPTIONS = [
    { type: 'D4-1' as const, label: 'D4-1', name: '(Tiếng Hàn)', description: 'Korean Language Program' },
    { type: 'D2-1' as const, label: 'D2-1', name: '(Chuẩn bị)', description: 'University Preparation' },
    { type: 'D2-2' as const, label: 'D2-2', name: '(Đại học)', description: 'Undergraduate' },
    { type: 'D2-3' as const, label: 'D2-3', name: '(Sau đại học)', description: 'Graduate' },
    { type: 'D2-6' as const, label: 'D2-6', name: '(Nâng cao)', description: 'Advanced' },
  ];

  const defaultValues: FormValues = useMemo(
    () => ({
      name: university?.name || '',
      koreanName: university?.koreanName || '',
      region: university?.region || university?.koreanData?.address || '',
      topTier: (university?.topTier || university?.koreanData?.topTier || 'Top2') as FormValues['topTier'],
      country: university?.country || 'South Korea',
      overview: university?.overview || '',
      isKorean: university?.koreanData?.isKoreanUniversity ?? true,
      selectedVisaType: university?.koreanData?.visaSystems?.[0]?.visaType || 'D4-1',
      generalTuition: university?.generalTuition || 0,
      visaFee: university?.visaFee || 0,
      accommodationFee: university?.accommodationFee || 0,
      insuranceFee: university?.insuranceFee || 0,
      additionalFees: university?.additionalFees?.length ? university.additionalFees : [],
      fixedCosts: (university?.fixedCosts || []).map(c => ({
        ...c,
        // ✅ FIX 2: cast currency to the enum type
        currency: (c.currency as (typeof CURRENCY_VALUES)[number] | undefined) ?? 'VND',
      })),
      optionalAddons: (university?.optionalAddons || []).map(addon => ({
        id: addon.id,
        name: addon.name,
        amount: addon.amount,
        type: addon.type || 'other',
      })),
    }),
    [university]
  );

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const { fields: additionalFeeFields, append: appendAdditional, remove: removeAdditional } = useFieldArray({
    control,
    name: 'additionalFees',
  });

  const { fields: fixedCostFields, append: appendFixedCost, remove: removeFixedCost } = useFieldArray({
    control,
    name: 'fixedCosts',
  });

  const { fields: addonFields, append: appendAddon, remove: removeAddon } = useFieldArray({
    control,
    name: 'optionalAddons',
  });

  const isKorean = watch('isKorean') ?? true;
  const overviewValue = watch('overview') || '';
  const overviewCount = countWords(overviewValue);
  const selectedVisa = watch('selectedVisaType') || 'D4-1';

  const fixedCostsSnapshot = watch('fixedCosts') || [];
  const fixedCostsTotal = useMemo(
    () => fixedCostsSnapshot.reduce((sum, cost) => {
      // ✅ FIX 1: cast cost.currency to Currency before passing to convertAmount
      const src = (cost?.currency as Currency | undefined) || 'VND';
      const converted = convertAmount(cost?.amount || 0, currency, src);
      return sum + converted;
    }, 0),
    [fixedCostsSnapshot, currency, convertAmount]
  );

  const optionalAddonsSnapshot = watch('optionalAddons') || [];
  const addonsCostsTotal = useMemo(
    () => optionalAddonsSnapshot.reduce((sum, addon) => sum + (addon?.amount || 0), 0),
    [optionalAddonsSnapshot]
  );

  const additionalFeesSnapshot = watch('additionalFees') || [];
  const additionalFeesTotal = useMemo(
    () => additionalFeesSnapshot.reduce((sum, fee) => sum + (fee?.amount || 0), 0),
    [additionalFeesSnapshot]
  );

  const currentVisaSystems = university?.koreanData?.visaSystems || [];
  const selectedVisaSystem = currentVisaSystems.find(v => v.visaType === selectedVisa);

  const visaSystemCostTotal = useMemo(() => {
    if (!selectedVisaSystem) return 0;
    let total = 0;
    if (selectedVisaSystem.tuitionPerTerm) total += selectedVisaSystem.tuitionPerTerm;
    if (selectedVisaSystem.tuitionRange?.max) total += selectedVisaSystem.tuitionRange.max;
    if (selectedVisaSystem.applicationFee) total += selectedVisaSystem.applicationFee;
    if (selectedVisaSystem.enrollmentFee) total += selectedVisaSystem.enrollmentFee;
    if (selectedVisaSystem.baseYearlyFee) total += selectedVisaSystem.baseYearlyFee;
    return convertAmount(total, currency, 'KRW');
  }, [selectedVisaSystem, currency, convertAmount]);

  const totalCost = useMemo(() => {
    if (isKorean && selectedVisaSystem) {
      return fixedCostsTotal + visaSystemCostTotal + addonsCostsTotal;
    }
    const traditional =
      (watch('generalTuition') || 0) +
      (watch('visaFee') || 0) +
      (watch('accommodationFee') || 0) +
      (watch('insuranceFee') || 0) +
      additionalFeesTotal;
    return traditional;
  }, [isKorean, selectedVisaSystem, fixedCostsTotal, visaSystemCostTotal, addonsCostsTotal, additionalFeesTotal, watch]);

  useEffect(() => {
    if (open) {
      reset(defaultValues);
      setSelectedVisaType(defaultValues.selectedVisaType || 'D4-1');
      setEnabledVisaSystems(new Set(currentVisaSystems.map(v => v.visaType)));
    }
  }, [open, defaultValues, reset, currentVisaSystems]);

  const handleSave = handleSubmit((values) => {
    const topVisaLabel = values.topTier === 'Top1' ? 'Top 1' : values.topTier === 'Top2' ? 'Top 2' : 'Top 3';
    const enabledVisaSystemsData = currentVisaSystems.filter(vs => enabledVisaSystems.has(vs.visaType));

    const payload: Partial<University> = {
      name: values.name,
      koreanName: values.koreanName,
      region: values.region,
      topTier: values.topTier,
      country: 'South Korea',
      overview: values.overview || '',
      koreanData: {
        ...(university?.koreanData || { isKoreanUniversity: true }),
        isKoreanUniversity: isKorean ?? true,
        address: values.region || university?.koreanData?.address,
        topTier: values.topTier,
        topVisa: topVisaLabel,
        visaSystems: enabledVisaSystemsData.length > 0 ? enabledVisaSystemsData : undefined,
      },
    };

    if (isKorean) {
      // ✅ FIX 2: cast currency field when saving
      payload.fixedCosts = (values.fixedCosts || []).map(c => ({
        ...c,
        currency: c.currency as Currency | undefined,
      }));
      payload.optionalAddons = (values.optionalAddons || []).map(addon => ({
        id: addon.id,
        name: addon.name,
        nameVi: addon.name,
        type: (addon.type || 'other') as 'dorm-vn' | 'dorm-kr' | 'flight' | 'savings' | 'scholarship' | 'group' | 'other',
        amount: addon.amount,
        selectable: true,
      }));
    } else {
      payload.generalTuition = values.generalTuition || 0;
      payload.visaFee = values.visaFee || 0;
      payload.accommodationFee = values.accommodationFee || 0;
      payload.insuranceFee = values.insuranceFee || 0;
      payload.additionalFees = values.additionalFees || [];
    }

    onSave(payload);
    onOpenChange(false);
    toast.success(isEditMode ? 'Đã cập nhật trường' : 'Đã thêm trường');
  });

  const allVisaLabels: Record<string, { label: string; name: string }> = {
    'D4-1': { label: 'D4-1', name: '(Tiếng Hàn)' },
    'D2-1': { label: 'D2-1', name: '(Chuẩn bị)' },
    'D2-2': { label: 'D2-2', name: '(Đại học)' },
    'D2-3': { label: 'D2-3', name: '(Sau đại học)' },
    'D2-6': { label: 'D2-6', name: '(Nâng cao)' },
  };

  const visaSystemButtons = currentVisaSystems
    .map(vs => ({
      type: vs.visaType,
      ...allVisaLabels[vs.visaType] || { label: vs.visaType, name: '' }
    }))
    .sort((a, b) =>
      ['D4-1', 'D2-1', 'D2-2', 'D2-3', 'D2-6'].indexOf(a.type) -
      ['D4-1', 'D2-1', 'D2-2', 'D2-3', 'D2-6'].indexOf(b.type)
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Chỉnh sửa trường' : 'Thêm trường mới'}</DialogTitle>
          <DialogDescription>
            Dữ liệu lưu trữ theo VND. Hiển thị theo {currency}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Thông tin cơ bản</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên trường</Label>
                <Controller
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <Input id="name" {...field} placeholder="Ajou University" aria-invalid={!!errors.name} />
                  )}
                />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="koreanName">Tên tiếng Hàn</Label>
                <Controller
                  control={control}
                  name="koreanName"
                  render={({ field }) => (
                    <Input id="koreanName" {...field} placeholder="아주대학교" />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Khu vực</Label>
                <Controller
                  control={control}
                  name="region"
                  render={({ field }) => (
                    <Input id="region" {...field} placeholder="Seoul, Busan..." />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Top Tier</Label>
                <Controller
                  control={control}
                  name="topTier"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn hạng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Top1">Top 1</SelectItem>
                        <SelectItem value="Top2">Top 2</SelectItem>
                        <SelectItem value="Top3">Top 3 (Hạn chế visa)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Quốc gia</Label>
                <Controller
                  control={control}
                  name="country"
                  render={({ field }) => <Input id="country" {...field} disabled />}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Mô tả (tối đa 250 từ)</Label>
                <span className={`text-xs font-semibold ${overviewCount > 250 ? 'text-red-600' : 'text-slate-500'}`}>
                  {overviewCount} / 250
                </span>
              </div>
              <Controller
                control={control}
                name="overview"
                render={({ field }) => (
                  <Textarea
                    {...field}
                    rows={4}
                    placeholder="Mô tả ngắn về trường, chương trình, ưu điểm..."
                    aria-invalid={!!errors.overview}
                  />
                )}
              />
              {errors.overview && <p className="text-xs text-red-600">{errors.overview.message}</p>}
            </div>
          </div>

          {/* Korean University Cost Management */}
          {isKorean && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Quản lý chi phí (Đại học Hàn)</h3>

              {/* Visa System Selector */}
              <div className="space-y-3">
                <Label>Hệ Visa Có Sẵn (Chọn những hệ bạn muốn cung cấp)</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {ALL_VISA_OPTIONS.map((visa) => (
                    <button
                      key={visa.type}
                      type="button"
                      onClick={() => {
                        const newSet = new Set(enabledVisaSystems);
                        if (newSet.has(visa.type)) {
                          newSet.delete(visa.type);
                          if (selectedVisa === visa.type) {
                            setSelectedVisaType(Array.from(newSet)[0] || null);
                          }
                        } else {
                          newSet.add(visa.type);
                        }
                        setEnabledVisaSystems(newSet);
                      }}
                      className={`px-3 py-3 rounded-lg text-xs font-semibold transition-all border-2 ${
                        enabledVisaSystems.has(visa.type)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-primary/50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold">{visa.label}</div>
                      <div className="text-[10px] font-normal opacity-75 mt-1">{visa.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Three-Section Cost Manager */}
              <Accordion type="single" collapsible className="space-y-3">
                {/* Section 1: Fixed Costs */}
                <AccordionItem value="fixed-costs" className="border border-slate-200 rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold">Chi phí cố định</span>
                      <span className="text-sm text-slate-500">{formatFrom(fixedCostsTotal, 'VND')}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    {fixedCostFields.length === 0 && (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                        Chưa có chi phí cố định. Nhấn "+ Thêm" để bắt đầu.
                      </div>
                    )}

                    {fixedCostFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_auto] gap-3 items-end p-3 bg-slate-50 rounded-lg">
                        <div className="space-y-2">
                          <Label className="text-xs">Loại phí</Label>
                          <Controller
                            control={control}
                            name={`fixedCosts.${index}.type`}
                            render={({ field }) => (
                              <Input {...field} placeholder="Phí tư vấn, phí môi giới..." className="text-sm" />
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Số tiền</Label>
                          <Controller
                            control={control}
                            name={`fixedCosts.${index}.amount`}
                            render={({ field }) => (
                              <Input
                                type="number"
                                {...field}
                                onChange={e => field.onChange(Number(e.target.value))}
                                placeholder="0"
                                className="text-sm"
                              />
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Tiền tệ</Label>
                          {/* ✅ FIX 2: Use string value from enum */}
                          <Controller
                            control={control}
                            name={`fixedCosts.${index}.currency`}
                            render={({ field }) => (
                              <Select
                                value={field.value || 'VND'}
                                onValueChange={(val) => field.onChange(val as (typeof CURRENCY_VALUES)[number])}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="VND">VND</SelectItem>
                                  <SelectItem value="KRW">KRW</SelectItem>
                                  <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        <Button type="button" variant="ghost" size="icon" onClick={() => removeFixedCost(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendFixedCost({ type: '', amount: 0, currency: 'VND' })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm chi phí cố định
                    </Button>
                  </AccordionContent>
                </AccordionItem>

                {/* Section 2: System-Specific Costs */}
                <AccordionItem value="system-costs" className="border border-slate-200 rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold">Chi phí theo hệ ({selectedVisa})</span>
                      <span className="text-sm text-slate-500">{formatFrom(visaSystemCostTotal, 'VND')}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    {selectedVisaSystem ? (
                      <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedVisaSystem.visaName || selectedVisaSystem.description}
                        </p>
                        {selectedVisaSystem.tuitionPerTerm && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-700">Tuition/Term:</span>
                            <span className="font-semibold">{formatFrom(selectedVisaSystem.tuitionPerTerm, 'VND', 'KRW')}</span>
                          </div>
                        )}
                        {selectedVisaSystem.tuitionRange && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-700">Tuition Range:</span>
                            <span className="font-semibold">
                              {formatFrom(selectedVisaSystem.tuitionRange.min, 'VND', 'KRW')} - {formatFrom(selectedVisaSystem.tuitionRange.max, 'VND', 'KRW')}
                            </span>
                          </div>
                        )}
                        {selectedVisaSystem.applicationFee && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-700">Application Fee:</span>
                            <span className="font-semibold">{formatFrom(selectedVisaSystem.applicationFee, 'VND', 'KRW')}</span>
                          </div>
                        )}
                        {selectedVisaSystem.enrollmentFee && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-700">Enrollment Fee:</span>
                            <span className="font-semibold">{formatFrom(selectedVisaSystem.enrollmentFee, 'VND', 'KRW')}</span>
                          </div>
                        )}
                        {selectedVisaSystem.baseYearlyFee && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-700">Base Yearly Fee:</span>
                            <span className="font-semibold">{formatFrom(selectedVisaSystem.baseYearlyFee, 'VND', 'KRW')}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                        Hệ visa này chưa có dữ liệu chi phí.
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Section 3: Optional Add-ons */}
                <AccordionItem value="addons" className="border border-slate-200 rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold">Phí tùy chọn</span>
                      <span className="text-sm text-slate-500">{formatFrom(addonsCostsTotal, 'VND')}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <p className="text-xs text-slate-600 bg-blue-50 border border-blue-200 rounded p-2">
                      Phí tùy chọn có thể là KTX, vé máy bay, học bổng hoặc các loại phí khác.
                    </p>

                    {addonFields.length === 0 && (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                        Chưa có phí tùy chọn. Nhấn "+ Thêm" để thêm.
                      </div>
                    )}

                    {addonFields.map((field, index) => (
                      <div key={field.id} className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Loại phí</Label>
                            {/* ✅ FIX 3 & 4: name is now valid since 'type' is in addonSchema; value cast to string */}
                            <Controller
                              control={control}
                              name={`optionalAddons.${index}.type`}
                              render={({ field }) => (
                                <Select
                                  value={String(field.value || 'other')}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger className="text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="other">Khác</SelectItem>
                                    <SelectItem value="dorm-vn">KTX Việt Nam</SelectItem>
                                    <SelectItem value="dorm-kr">KTX Hàn Quốc</SelectItem>
                                    <SelectItem value="flight">Vé máy bay</SelectItem>
                                    <SelectItem value="savings">Sổ tiết kiệm</SelectItem>
                                    <SelectItem value="scholarship">Học bổng</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Tên phí</Label>
                            <Controller
                              control={control}
                              name={`optionalAddons.${index}.name`}
                              render={({ field }) => (
                                <Input {...field} placeholder="VD: KTX 4-người, Vé Hà Nội..." className="text-sm" />
                              )}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                          <div className="space-y-2">
                            <Label className="text-xs">Số tiền (VND)</Label>
                            <Controller
                              control={control}
                              name={`optionalAddons.${index}.amount`}
                              render={({ field }) => (
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={e => field.onChange(Number(e.target.value))}
                                  placeholder="0"
                                  className="text-sm"
                                />
                              )}
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => removeAddon(index)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Xóa
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* ✅ FIX 5: 'type' is now valid in appendAddon since schema includes it */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendAddon({ id: Date.now().toString(), name: '', type: 'other', amount: 0 })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm phí tùy chọn
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Total Cost Summary */}
              <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50 p-4 mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">Chi phí cố định:</span>
                    <span className="font-semibold">{formatFrom(fixedCostsTotal, 'VND')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">Chi phí hệ ({selectedVisa}):</span>
                    <span className="font-semibold">{formatFrom(visaSystemCostTotal, 'VND')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">Phí tùy chọn:</span>
                    <span className="font-semibold">{formatFrom(addonsCostsTotal, 'VND')}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between text-base font-bold">
                    <span>Tổng:</span>
                    <span className="text-primary">{formatFrom(totalCost, 'VND')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Traditional Cost Management */}
          {!isKorean && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Chi phí ({currency})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="generalTuition"
                  render={({ field }) => (
                    <PriceInput label="Học phí" value={field.value || 0} onChange={field.onChange} error={errors.generalTuition?.message} />
                  )}
                />
                <Controller
                  control={control}
                  name="visaFee"
                  render={({ field }) => (
                    <PriceInput label="Phí visa" value={field.value || 0} onChange={field.onChange} error={errors.visaFee?.message} />
                  )}
                />
                <Controller
                  control={control}
                  name="accommodationFee"
                  render={({ field }) => (
                    <PriceInput label="Lưu trú" value={field.value || 0} onChange={field.onChange} error={errors.accommodationFee?.message} />
                  )}
                />
                <Controller
                  control={control}
                  name="insuranceFee"
                  render={({ field }) => (
                    <PriceInput label="Bảo hiểm" value={field.value || 0} onChange={field.onChange} error={errors.insuranceFee?.message} />
                  )}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Phí bổ sung</Label>
                  <Button type="button" size="sm" onClick={() => appendAdditional({ type: '', amount: 0 })}>
                    <Plus />
                    Thêm phí
                  </Button>
                </div>

                {additionalFeeFields.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    Chưa có phí bổ sung.
                  </div>
                )}

                {additionalFeeFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_auto] gap-3 items-end">
                    <div className="space-y-2">
                      <Label>Loại phí</Label>
                      <Controller
                        control={control}
                        name={`additionalFees.${index}.type`}
                        render={({ field }) => (
                          <Input {...field} placeholder="Phí hồ sơ, phí nhập học..." />
                        )}
                      />
                    </div>
                    <div>
                      <Controller
                        control={control}
                        name={`additionalFees.${index}.amount`}
                        render={({ field }) => (
                          <PriceInput
                            label="Số tiền"
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.additionalFees?.[index]?.amount?.message}
                          />
                        )}
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAdditional(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {additionalFeeFields.length > 0 && (
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 uppercase">
                      Bảng phí bổ sung
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Loại phí</TableHead>
                          <TableHead className="text-right">Số tiền</TableHead>
                          <TableHead className="text-right">Xóa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {additionalFeeFields.map((fee, index) => (
                          <TableRow key={fee.id}>
                            <TableCell className="text-slate-700">
                              {additionalFeesSnapshot[index]?.type || '—'}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-slate-900">
                              {formatFrom(additionalFeesSnapshot[index]?.amount || 0, 'VND')}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeAdditional(index)}
                                aria-label="Xóa phí"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-slate-50">
                          <TableCell className="font-semibold text-slate-800">Tổng phí bổ sung</TableCell>
                          <TableCell className="text-right font-bold text-slate-900">
                            {formatFrom(additionalFeesTotal, 'VND')}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-right">
                  <div className="text-sm text-slate-600 mb-1">Tổng chi phí</div>
                  <div className="text-2xl font-bold text-primary">{formatFrom(totalCost, 'VND')}</div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEditMode ? 'Lưu thay đổi' : 'Thêm trường'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
