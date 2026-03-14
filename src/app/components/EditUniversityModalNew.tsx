import { z } from 'zod';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../config/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, Trash2, Save, X, DollarSign, Building2, FileText } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { University, UniversitySystem } from '../../types/university';
import type { FlexibleFee, FeeOption } from '../../types/fees';

// ============================================================================
// Types
// ============================================================================

type FeeType = 'fixed' | 'optional' | 'optional_multiple' | 'percentage' | 'variable_time';

interface EditUniversityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  university: University | null | undefined;
  onSave: (university: Partial<University>) => void | Promise<void>;
}

// ============================================================================
// Zod Schema Validation
// ============================================================================

const feeOptionSchema = z.object({
  id: z.string().min(1, 'ID không được để trống'),
  name: z.string().min(1, 'Tên không được để trống'),
  value: z.number().min(0, 'Giá trị phải >= 0'),
});

const feeSchema = z.object({
  id: z.string().min(1, 'ID phí không được để trống'),
  name: z.string().min(1, 'Tên phí không được để trống'),
  type: z.enum(['fixed', 'optional', 'optional_multiple', 'percentage', 'variable_time']),
  base_value: z.number().min(0, 'Giá trị cơ bản phải >= 0'),
  currency: z.string().default('KRW'),
  category: z.string().default('other'),
  required: z.boolean().default(false),
  default_selected: z.union([z.boolean(), z.string()]).optional(),
  description: z.string().optional(),
  options: z.array(feeOptionSchema).optional(),
});

const systemSchema = z.object({
  code: z.string().min(1, 'Mã hệ thống không được để trống'),
  name: z.string().min(1, 'Tên hệ thống không được để trống'),
  available: z.boolean().default(false),
  description: z.string().optional(),
  fees: z.array(feeSchema).min(0),
});

const universitySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Tên trường không được để trống'),
  koreanName: z.string().optional(),
  country: z.string().default('South Korea'),
  region: z.string().optional(),
  systems: z.array(systemSchema).min(0),
});

type FormData = z.infer<typeof universitySchema>;

// ============================================================================
// Available System Templates
// ============================================================================

const SYSTEM_TEMPLATES = [
  { code: 'D4-1', name: 'D4-1 (Thẳng lên - 4 năm đại học)', description: 'Chương trình đại học 4 năm trực tiếp' },
  { code: 'D2-1', name: 'D2-1 (Thẳng lên đại học)', description: 'Chương trình đại học trực tiếp' },
  { code: 'D2-2', name: 'D2-2 (Chuẩn bị - 2 năm tiếng Hàn)', description: 'Chương trình học tiếng Hàn 2 năm trước khi vào đại học' },
  { code: 'D2-3', name: 'D2-3 (Cao đẳng)', description: 'Chương trình cao đẳng 2-3 năm' },
  { code: 'D2-6', name: 'D2-6 (Thạc sĩ)', description: 'Chương trình thạc sĩ' },
];

const FEE_CATEGORIES = [
  { value: 'tuition', label: 'Học phí' },
  { value: 'visa', label: 'Phí visa' },
  { value: 'accommodation', label: 'Chỗ ở' },
  { value: 'insurance', label: 'Bảo hiểm' },
  { value: 'other', label: 'Khác' },
];

// ============================================================================
// Component
// ============================================================================

export function EditUniversityModal({ open, onOpenChange, university, onSave }: EditUniversityModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSystems, setExpandedSystems] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    koreanName: '',
    country: 'South Korea',
    region: '',
    systems: [],
  });

  // Reset form when university changes
  useEffect(() => {
    if (university && open) {
      const initialData = {
        id: university.id,
        name: university.name,
        koreanName: university.koreanName || '',
        country: university.country || 'South Korea',
        region: university.region || '',
        systems: university.systems || [],
      };
      setFormData(initialData);
      setExpandedSystems(university.systems?.map((_, i) => `system-${i}`) || []);
    } else if (!university && open) {
      setFormData({
        name: '',
        koreanName: '',
        country: 'South Korea',
        region: '',
        systems: [],
      });
    }
  }, [university, open]);

  // Add new system
  const handleAddSystem = (templateCode?: string) => {
    const template = SYSTEM_TEMPLATES.find(t => t.code === templateCode);
    
    const newSystem = {
      id: `system-${Date.now()}`,
      code: template?.code || '',
      name: template?.name || '',
      available: false,
      description: template?.description || '',
      fees: [],
    } as UniversitySystem;

    const newIndex = formData.systems.length;
    setFormData(prev => ({
      ...prev,
      systems: [...prev.systems, newSystem],
    }));
    setExpandedSystems(prev => [...prev, `system-${newIndex}`]);
    
    toast.success(template ? `Đã thêm hệ ${template.code}` : 'Đã thêm hệ thống mới');
  };

  // Remove system
  const handleRemoveSystem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      systems: prev.systems.filter((_, i) => i !== index),
    }));
    toast.success('Đã xóa hệ thống');
  };

  // Toggle system availability
  const toggleSystemAvailability = (index: number) => {
    setFormData(prev => {
      const newSystems = [...prev.systems];
      newSystems[index] = {
        ...newSystems[index],
        available: !newSystems[index].available,
      };
      return { ...prev, systems: newSystems };
    });
    
    const system = formData.systems[index];
    if (system) {
      toast.success(`${system.code} ${!system.available ? 'đã bật' : 'đã tắt'}`);
    }
  };

  // Update system field
  const updateSystemField = (index: number, field: keyof UniversitySystem, value: any) => {
    setFormData(prev => {
      const newSystems = [...prev.systems];
      newSystems[index] = { ...newSystems[index], [field]: value };
      return { ...prev, systems: newSystems };
    });
  };

  // Add fee to system
  const handleAddFee = (systemIndex: number) => {
    const newFee: Fee = {
      id: `fee-${Date.now()}`,
      name: '',
      type: 'fixed',
      base_value: 0,
      currency: 'KRW',
      category: 'other',
      required: false,
    };

    setFormData(prev => {
      const newSystems = [...prev.systems];
      newSystems[systemIndex] = {
        ...newSystems[systemIndex],
        fees: [...newSystems[systemIndex].fees, newFee],
      };
      return { ...prev, systems: newSystems };
    });
    
    toast.success('Đã thêm phí mới');
  };

  // Remove fee from system
  const handleRemoveFee = (systemIndex: number, feeIndex: number) => {
    setFormData(prev => {
      const newSystems = [...prev.systems];
      newSystems[systemIndex] = {
        ...newSystems[systemIndex],
        fees: newSystems[systemIndex].fees.filter((_, i) => i !== feeIndex),
      };
      return { ...prev, systems: newSystems };
    });
    
    toast.success('Đã xóa phí');
  };

  // Update fee field
  const updateFeeField = (systemIndex: number, feeIndex: number, field: keyof Fee, value: any) => {
    setFormData(prev => {
      const newSystems = [...prev.systems];
      const newFees = [...newSystems[systemIndex].fees];
      newFees[feeIndex] = { ...newFees[feeIndex], [field]: value };
      newSystems[systemIndex] = { ...newSystems[systemIndex], fees: newFees };
      return { ...prev, systems: newSystems };
    });
  };

  // Add option to fee
  const handleAddOption = (systemIndex: number, feeIndex: number) => {
    const newOption: FeeOption = {
      id: `opt-${Date.now()}`,
      name: '',
      value: 0,
    };

    setFormData(prev => {
      const newSystems = [...prev.systems];
      const newFees = [...newSystems[systemIndex].fees];
      const currentFee = newFees[feeIndex];
      newFees[feeIndex] = {
        ...currentFee,
        options: [...(currentFee.options || []), newOption],
      };
      newSystems[systemIndex] = { ...newSystems[systemIndex], fees: newFees };
      return { ...prev, systems: newSystems };
    });
  };

  // Remove option from fee
  const handleRemoveOption = (systemIndex: number, feeIndex: number, optionIndex: number) => {
    setFormData(prev => {
      const newSystems = [...prev.systems];
      const newFees = [...newSystems[systemIndex].fees];
      const currentFee = newFees[feeIndex];
      newFees[feeIndex] = {
        ...currentFee,
        options: currentFee.options?.filter((_, i) => i !== optionIndex) || [],
      };
      newSystems[systemIndex] = { ...newSystems[systemIndex], fees: newFees };
      return { ...prev, systems: newSystems };
    });
  };

  // Update option field
  const updateOptionField = (systemIndex: number, feeIndex: number, optionIndex: number, field: keyof FeeOption, value: any) => {
    setFormData(prev => {
      const newSystems = [...prev.systems];
      const newFees = [...newSystems[systemIndex].fees];
      const currentFee = newFees[feeIndex];
      const newOptions = [...(currentFee.options || [])];
      newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value };
      newFees[feeIndex] = { ...currentFee, options: newOptions };
      newSystems[systemIndex] = { ...newSystems[systemIndex], fees: newFees };
      return { ...prev, systems: newSystems };
    });
  };

  // Calculate estimated total
  const calculateEstimatedTotal = (systems: UniversitySystem[]) => {
    let total = 0;
    
    systems.forEach(system => {
      if (system.available) {
        system.fees.forEach(fee => {
          let feeAmount = 0;
          
          switch (fee.type) {
            case 'fixed':
              feeAmount = fee.base_value;
              break;
            case 'optional':
              if (fee.required || fee.default_selected) {
                feeAmount = fee.base_value;
              }
              break;
            case 'optional_multiple':
            case 'variable_time':
              const defaultOpt = fee.options?.find(o => o.id === fee.default_selected) || fee.options?.[0];
              if (defaultOpt) {
                feeAmount = defaultOpt.value;
              }
              break;
            case 'percentage':
              feeAmount = 0;
              break;
          }
          
          total += feeAmount;
        });
      }
    });
    
    return total;
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Tên trường không được để trống');
      return false;
    }

    for (let i = 0; i < formData.systems.length; i++) {
      const system = formData.systems[i];
      if (!system.code.trim()) {
        toast.error(`Hệ thống ${i + 1}: Mã hệ thống không được để trống`);
        return false;
      }
      if (!system.name.trim()) {
        toast.error(`Hệ thống ${i + 1}: Tên hệ thống không được để trống`);
        return false;
      }

      for (let j = 0; j < system.fees.length; j++) {
        const fee = system.fees[j];
        if (!fee.name.trim()) {
          toast.error(`${system.code} - Phí ${j + 1}: Tên phí không được để trống`);
          return false;
        }
        if (fee.base_value < 0) {
          toast.error(`${system.code} - Phí ${j + 1}: Giá trị phải >= 0`);
          return false;
        }
      }
    }

    return true;
  };

  // Handle form submission
  const onSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // Calculate estimated cost
      const estimatedTotal = calculateEstimatedTotal(formData.systems);
      
      // Prepare update data
      const updateData = {
        ...formData,
        id: university?.id,
        estimated_cost: {
          amount: estimatedTotal,
          currency: 'KRW',
          systems_included: formData.systems.filter(s => s.available).map(s => s.code),
        },
        updated_at: new Date().toISOString(),
      };

      // Update in Supabase
      const { error } = await supabase
        .from('universities')
        .update(updateData)
        .eq('id', university?.id);

      if (error) {
        throw error;
      }

      // Call onSave callback
      onSave(updateData as University);
      
      toast.success('Đã cập nhật trường thành công!');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Lỗi khi cập nhật:', error);
      toast.error('Lỗi khi cập nhật: ' + (error.message || 'Không xác định'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="w-5 h-5" />
            {university ? 'Chỉnh sửa thông tin trường' : 'Thêm trường mới'}
          </DialogTitle>
          <DialogDescription>
            {university 
              ? `Quản lý hệ thống visa và chi phí cho ${university.name}` 
              : 'Thêm trường mới với hệ thống visa và chi phí'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên trường (Tiếng Anh) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nhập tên trường"
                  className={cn(!formData.name.trim() && 'border-red-500')}
                />
                {!formData.name.trim() && (
                  <p className="text-sm text-red-500">Tên trường không được để trống</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="koreanName">Tên trường (Tiếng Hàn)</Label>
                <Input
                  id="koreanName"
                  value={formData.koreanName}
                  onChange={(e) => setFormData(prev => ({ ...prev, koreanName: e.target.value }))}
                  placeholder="Nhập tên tiếng Hàn"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Quốc gia</Label>
                <Input id="country" value={formData.country} readOnly className="bg-gray-100" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Khu vực / Thành phố</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                  placeholder="Ví dụ: Seoul, Busan"
                />
              </div>
            </CardContent>
          </Card>

          {/* Systems Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Hệ thống Visa & Chi phí
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                {SYSTEM_TEMPLATES.map(template => (
                  <Button
                    key={template.code}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddSystem(template.code)}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {template.code}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {formData.systems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Chưa có hệ thống visa nào</p>
                  <p className="text-sm">Nhấn nút bên trên để thêm hệ thống</p>
                </div>
              ) : (
                <Accordion
                  type="multiple"
                  value={expandedSystems}
                  onValueChange={setExpandedSystems}
                  className="space-y-2"
                >
                  {formData.systems.map((system, systemIndex) => (
                    <AccordionItem
                      key={`system-${systemIndex}`}
                      value={`system-${systemIndex}`}
                      className={cn(
                        'border rounded-lg',
                        system.available ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
                      )}
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={system.available}
                              onCheckedChange={() => toggleSystemAvailability(systemIndex)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="text-left">
                              <p className="font-medium text-sm">
                                {system.code || 'Hệ mới'}
                                {system.name && <span className="text-gray-500 ml-2">- {system.name}</span>}
                              </p>
                              <p className="text-xs text-gray-500">
                                {system.fees?.length || 0} phí • 
                                {system.available ? ' Đang hoạt động' : ' Không hoạt động'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-4 pt-2">
                          {/* System Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Mã hệ thống</Label>
                              <Input
                                value={system.code}
                                onChange={(e) => updateSystemField(systemIndex, 'code', e.target.value)}
                                placeholder="VD: D4-1"
                                className="text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Tên hệ thống</Label>
                              <Input
                                value={system.name}
                                onChange={(e) => updateSystemField(systemIndex, 'name', e.target.value)}
                                placeholder="Tên đầy đủ"
                                className="text-sm"
                              />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                              <Label className="text-xs">Mô tả</Label>
                              <Input
                                value={system.description || ''}
                                onChange={(e) => updateSystemField(systemIndex, 'description', e.target.value)}
                                placeholder="Mô tả về hệ thống này"
                                className="text-sm"
                              />
                            </div>
                          </div>

                          {/* Fees Section */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Danh sách phí</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddFee(systemIndex)}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Thêm phí
                              </Button>
                            </div>

                            {system.fees?.length === 0 ? (
                              <p className="text-sm text-gray-500 italic">Chưa có phí nào</p>
                            ) : (
                              <div className="space-y-3">
                                {system.fees.map((fee, feeIndex) => (
                                  <Card key={fee.id} className="border-gray-200">
                                    <CardContent className="p-3 space-y-3">
                                      {/* Fee Header */}
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                                          <Input
                                            value={fee.name}
                                            onChange={(e) => updateFeeField(systemIndex, feeIndex, 'name', e.target.value)}
                                            placeholder="Tên phí"
                                            className="text-sm"
                                          />
                                          <Select
                                            value={fee.type}
                                            onValueChange={(value) => updateFeeField(systemIndex, feeIndex, 'type', value)}
                                          >
                                            <SelectTrigger className="text-sm">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="fixed">Cố định</SelectItem>
                                              <SelectItem value="optional">Tùy chọn</SelectItem>
                                              <SelectItem value="optional_multiple">Nhiều lựa chọn</SelectItem>
                                              <SelectItem value="percentage">Phần trăm</SelectItem>
                                              <SelectItem value="variable_time">Thời gian biến đổi</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <Select
                                            value={fee.category}
                                            onValueChange={(value) => updateFeeField(systemIndex, feeIndex, 'category', value)}
                                          >
                                            <SelectTrigger className="text-sm">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {FEE_CATEGORIES.map(cat => (
                                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveFee(systemIndex, feeIndex)}
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>

                                      {/* Fee Details */}
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        <div className="space-y-1">
                                          <Label className="text-xs">Giá trị</Label>
                                          <Input
                                            type="number"
                                            value={fee.base_value}
                                            onChange={(e) => updateFeeField(systemIndex, feeIndex, 'base_value', parseFloat(e.target.value) || 0)}
                                            className="text-sm"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">Đơn vị</Label>
                                          <Select
                                            value={fee.currency}
                                            onValueChange={(value) => updateFeeField(systemIndex, feeIndex, 'currency', value)}
                                          >
                                            <SelectTrigger className="text-sm">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="KRW">KRW (₩)</SelectItem>
                                              <SelectItem value="VND">VND (₫)</SelectItem>
                                              <SelectItem value="USD">USD ($)</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">Bắt buộc</Label>
                                          <div className="pt-2">
                                            <Switch
                                              checked={fee.required}
                                              onCheckedChange={(checked) => updateFeeField(systemIndex, feeIndex, 'required', checked)}
                                            />
                                          </div>
                                        </div>
                                        {(fee.type === 'optional' || fee.type === 'optional_multiple' || fee.type === 'variable_time') && (
                                          <div className="space-y-1">
                                            <Label className="text-xs">Mặc định chọn</Label>
                                            <div className="pt-2">
                                              <Switch
                                                checked={!!fee.default_selected}
                                                onCheckedChange={(checked) => updateFeeField(systemIndex, feeIndex, 'default_selected', checked)}
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* Options for multiple choice fees */}
                                      {(fee.type === 'optional_multiple' || fee.type === 'variable_time') && (
                                        <div className="space-y-2 pt-2 border-t">
                                          <div className="flex items-center justify-between">
                                            <Label className="text-xs">Lựa chọn</Label>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleAddOption(systemIndex, feeIndex)}
                                            >
                                              <Plus className="w-3 h-3 mr-1" />
                                              Thêm
                                            </Button>
                                          </div>
                                          {fee.options?.map((option, optIndex) => (
                                            <div key={option.id} className="flex items-center gap-2">
                                              <Input
                                                value={option.name}
                                                onChange={(e) => updateOptionField(systemIndex, feeIndex, optIndex, 'name', e.target.value)}
                                                placeholder="Tên lựa chọn"
                                                className="text-sm flex-1"
                                              />
                                              <Input
                                                type="number"
                                                value={option.value}
                                                onChange={(e) => updateOptionField(systemIndex, feeIndex, optIndex, 'value', parseFloat(e.target.value) || 0)}
                                                placeholder="Giá"
                                                className="text-sm w-24"
                                              />
                                              <Switch
                                                checked={fee.default_selected === option.id}
                                                onCheckedChange={() => updateFeeField(systemIndex, feeIndex, 'default_selected', option.id)}
                                              />
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveOption(systemIndex, feeIndex, optIndex)}
                                              >
                                                <X className="w-3 h-3 text-red-500" />
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Delete System */}
                          <div className="flex justify-end pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveSystem(systemIndex)}
                              className="text-red-500 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Xóa hệ thống
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>

          {/* Estimated Total Preview */}
          {formData.systems?.some(s => s.available) && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Tổng chi phí ước tính</span>
                  </div>
                  <span className="text-xl font-bold text-blue-700">
                    {calculateEstimatedTotal(formData.systems).toLocaleString()} KRW
                  </span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  Hệ thống: {formData.systems.filter(s => s.available).map(s => s.code).join(', ')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Footer Actions */}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-1" />
              Hủy
            </Button>
            <Button
              type="button"
              disabled={isLoading}
              onClick={onSubmit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EditUniversityModal;
