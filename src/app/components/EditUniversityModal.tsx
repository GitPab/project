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
import CostInputForm from './CostInputForm';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { VISA_SYSTEMS } from '../../constants/visaSystems';

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
  university: University | null;
  onClose: () => void;
  onSave: (data: Partial<University>) => Promise<void>;
};

export default function EditUniversityModal({
  onClose,
  university,
  onSave,
}: EditUniversityModalProps) {
  const { currency, formatFrom, convertAmount } = useCurrency();
  const isEditMode = !!university;
  const [selectedVisaType, setSelectedVisaType] = useState<string | null>(null);
  const [enabledVisaSystems, setEnabledVisaSystems] = useState<Set<string>>(new Set());
  const [showCostForm, setShowCostForm] = useState(false);
  const defaultValues: FormValues = useMemo(
    () => ({
      name: university?.name || '',
      koreanName: university?.koreanName || '',
      region: university?.region || university?.koreanData?.address || '',
      topTier: (university?.koreanData?.topTier || 'Top2') as FormValues['topTier'],
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

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { 
      document.body.style.overflow = '';
    };
  }, []);

  // Reset form when university changes
  useEffect(() => {
    reset(defaultValues);
    setSelectedVisaType(defaultValues.selectedVisaType || 'D4-1');
    setEnabledVisaSystems(new Set(currentVisaSystems.map(v => v.visaType)));
  }, [university, defaultValues, reset, currentVisaSystems]);

  const handleSave = handleSubmit((values) => {
    const topVisaLabel = values.topTier === 'Top1' ? 'Top 1' : values.topTier === 'Top2' ? 'Top 2' : 'Top 3';
    const enabledVisaSystemsData = currentVisaSystems.filter(vs => enabledVisaSystems.has(vs.visaType));

    const payload: Partial<University> = {
      name: values.name,
      koreanName: values.koreanName,
      region: values.region,
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
    onClose();
    toast.success(isEditMode ? 'Đã cập nhật trường' : 'Đã thêm trường');
  });

  const allVisaLabels = VISA_SYSTEMS.reduce<Record<string, { label: string; name: string }>>(
    (acc, visa) => {
      acc[visa.key] = { label: visa.label, name: `(${visa.name})` };
      return acc;
    },
    {}
  );
  // Legacy support for existing D2-3 data
  allVisaLabels['D2-3'] = { label: 'D2-3', name: '(Sau dai hoc)' };

  const visaOrder = [...VISA_SYSTEMS.map(visa => visa.key), 'D2-3'];
  const orderIndex = (type: string) => {
    const idx = visaOrder.indexOf(type);
    return idx === -1 ? 999 : idx;
  };

  const visaSystemButtons = currentVisaSystems
    .map(vs => ({
      type: vs.visaType,
      ...allVisaLabels[vs.visaType] || { label: vs.visaType, name: '' }
    }))
    .sort((a, b) => orderIndex(a.type) - orderIndex(b.type));

  return (
    // Overlay
    <div
      onClick={(e) => { 
        if (e.target === e.currentTarget) onClose() 
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        overflowY: 'auto',
        padding: '32px 16px'
      }}
    >
      {/* Modal box */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          width: '100%',
          maxWidth: 1200,
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        {/* Sticky header with X button */}
        <div style={{
          position: 'sticky', 
          top: 0, 
          background: '#fff',
          zIndex: 10, 
          padding: '20px 24px 16px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 500 }}>
              {isEditMode ? 'Chỉnh sửa trường' : 'Thêm trường mới'}
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
              Dữ liệu lưu trữ theo VND. Hiển thị theo {currency}.
            </p>
          </div>
          <button
            onClick={onClose}   // direct call, no wrapper
            style={{
              width: 36, 
              height: 36, 
              borderRadius: 8,
              border: '1px solid #e5e7eb', 
              background: 'none',
              cursor: 'pointer', 
              fontSize: 22, 
              lineHeight: 1,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}
          >×</button>
        </div>

        {/* Scrollable content */}
        <div style={{ padding: 24 }}>
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

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Controller
                    control={control}
                    name="isKorean"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isKorean"
                          checked={field.value ?? true}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor="isKorean" className="text-sm font-medium">
                          Đại học Hàn Quốc (sử dụng cấu trúc chi phí mới)
                        </Label>
                      </div>
                    )}
                  />
                </div>
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
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Quản lý chi phí (Đại học Hàn)</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    console.log('Opening cost form for:', university?.name);
                    setShowCostForm(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Cấu hình chi phí
                </Button>
              </div>
              
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Nhấn "Cấu hình chi phí" để thiết lập chi phí theo cấu trúc mới cho tất cả các hệ visa.
              </div>
            </div>
          )}

          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              Debug: isKorean = {String(isKorean)}, showCostForm = {String(showCostForm)}
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

          {/* Sticky footer */}
          <div style={{
            position: 'sticky', 
            bottom: 0, 
            background: '#fff',
            borderTop: '1px solid #e5e7eb', 
            padding: '16px 24px',
            display: 'flex', 
            justifyContent: 'space-between'
          }}>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEditMode ? 'Lưu thay đổi' : 'Thêm trường'}
            </Button>
          </div>
          </form>
        </div>
      </div>

      {/* Cost Input Form Modal */}
      {showCostForm && (
        <div
          onClick={(e) => { 
            if (e.target === e.currentTarget) setShowCostForm(false) 
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            overflowY: 'auto',
            padding: '32px 16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 12,
              width: '100%',
              maxWidth: 1200,
              maxHeight: 'calc(100vh - 64px)',
              overflowY: 'auto',
              position: 'relative'
            }}
          >
            <CostInputForm
              universityId={university?.id}
              universityName={university?.name}
              onSave={(costData) => {
                // Handle cost data save here
                console.log('Cost data saved:', costData);
                setShowCostForm(false);
              }}
              onCancel={() => setShowCostForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}




