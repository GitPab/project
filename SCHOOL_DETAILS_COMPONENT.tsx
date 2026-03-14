/*
SCHOOL DETAILS COMPONENT - Dynamic System Cost Display
File: src/app/pages/UniversityDetail.tsx (or SchoolDetails.tsx)

This component displays university details with:
1. Selected visa systems with toggle availability
2. System costs without duplication/error
3. Optional costs with dynamic selection
4. Real-time updates from Supabase
*/

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router';
import { supabase } from '../../config/supabase';
import type { University, UniversitySystem } from '../../types/university';
import type { FlexibleFee } from '../../types/fees';
import { useCurrency } from '../context/CurrencyContext';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { 
  GraduationCap, 
  DollarSign, 
  Home, 
  Plane, 
  Shield, 
  Percent,
  Calculator,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SelectedFee {
  feeId: string;
  optionId?: string;
  enabled: boolean;
  quantity?: number;
}

export default function SchoolDetails() {
  const { id } = useParams<{ id: string }>();
  const { formatFrom } = useCurrency();
  
  const [university, setUniversity] = useState<University | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<string>('');
  const [selectedFees, setSelectedFees] = useState<Record<string, SelectedFee>>({});
  const [expandedSections, setExpandedSections] = useState<string[]>(['fixed-costs']);

  // Fetch university data
  useEffect(() => {
    if (!id) return;
    
    const fetchUniversity = async () => {
      try {
        setLoading(true);
        const { data, error } = await (supabase as any)
          .from('universities')
          .select('*')
          .eq('id', id)
          .single() as { data: University | null; error: any };

        if (error) throw error;
        if (data) {
          setUniversity(data);
          // Select first available system by default
          const availableSystem = data.systems?.find(s => s.available);
          if (availableSystem) {
            setSelectedSystem(availableSystem.code);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load university');
      } finally {
        setLoading(false);
      }
    };

    fetchUniversity();
  }, [id]);

  // Real-time subscription for immediate updates
  useEffect(() => {
    if (!id) return;

    const channel = (supabase as any)
      .channel(`university-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'universities',
          filter: `id=eq.${id}`
        },
        (payload: any) => {
          if (payload.new) {
            setUniversity(payload.new as University);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [id]);

  // Get available systems
  const availableSystems = useMemo(() => {
    return university?.systems?.filter(s => s.available) || [];
  }, [university]);

  // Get selected system data
  const currentSystem = useMemo(() => {
    return university?.systems?.find(s => s.code === selectedSystem);
  }, [university, selectedSystem]);

  // Group fees by type
  const feeGroups = useMemo(() => {
    if (!currentSystem?.fees) return { fixed: [], optional: [] };
    
    return {
      fixed: currentSystem.fees.filter(f => f.type === 'fixed' || f.required),
      optional: currentSystem.fees.filter(f => f.type !== 'fixed' && !f.required)
    };
  }, [currentSystem]);

  // Calculate total cost
  const calculation = useMemo(() => {
    let total = 0;
    const breakdown: Array<{ name: string; amount: number; type: string }> = [];

    // Add fixed fees
    feeGroups.fixed.forEach(fee => {
      const amount = fee.base_value;
      total += amount;
      breakdown.push({ name: fee.name, amount, type: 'fixed' });
    });

    // Add selected optional fees
    feeGroups.optional.forEach(fee => {
      const selection = selectedFees[fee.id];
      if (selection?.enabled) {
        let amount = fee.base_value;
        
        // Handle options
        if (fee.options && selection.optionId) {
          const option = fee.options.find(o => o.id === selection.optionId);
          if (option) amount = option.value;
        }
        
        // Handle time multiplier
        if (fee.time_unit && selection.quantity) {
          amount *= selection.quantity;
        }
        
        total += amount;
        breakdown.push({ name: fee.name, amount, type: 'optional' });
      }
    });

    return { total, breakdown };
  }, [feeGroups, selectedFees]);

  // Handle fee selection
  const handleFeeToggle = (feeId: string, enabled: boolean) => {
    setSelectedFees(prev => ({
      ...prev,
      [feeId]: { ...prev[feeId], feeId, enabled }
    }));
  };

  // Handle option selection
  const handleOptionSelect = (feeId: string, optionId: string) => {
    setSelectedFees(prev => ({
      ...prev,
      [feeId]: { ...prev[feeId], feeId, optionId, enabled: true }
    }));
  };

  // Toggle section
  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (error) return <div className="p-6 text-red-600">Lỗi: {error}</div>;
  if (!university) return <div className="p-6">Không tìm thấy trường</div>;

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{university.name}</h1>
        <p className="text-slate-600 mt-1">{university.koreanName}</p>
        <p className="text-slate-500 text-sm">{university.country} • {university.region}</p>
      </div>

      {/* Visa System Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Bạn muốn theo học hệ nào?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {university.systems?.map((system) => (
              <div
                key={system.code}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedSystem === system.code
                    ? 'border-[#003AB7] bg-[#003AB7]/5'
                    : 'border-slate-200 hover:border-slate-300'
                } ${!system.available ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => system.available && setSelectedSystem(system.code)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg">{system.code}</div>
                    <div className="text-sm text-slate-600">{system.name}</div>
                  </div>
                  {selectedSystem === system.code && (
                    <CheckCircle className="w-5 h-5 text-[#003AB7]" />
                  )}
                </div>
                {!system.available && (
                  <Badge variant="outline" className="mt-2">Chưa mở</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {currentSystem && (
        <>
          {/* Fixed Costs */}
          {feeGroups.fixed.length > 0 && (
            <Card>
              <Accordion type="single" value={expandedSections.includes('fixed-costs') ? 'fixed-costs' : undefined}>
                <AccordionItem value="fixed-costs">
                  <AccordionTrigger onClick={() => toggleSection('fixed-costs')}>
                    <div className="flex items-center gap-3 w-full">
                      <DollarSign className="w-5 h-5 text-red-500" />
                      <div className="flex-1 text-left">
                        <h3 className="text-lg font-semibold">Chi phí cố định (Fixed Costs)</h3>
                        <p className="text-sm text-slate-600">
                          Luôn được tính vào tổng chi phí
                        </p>
                      </div>
                      <Badge variant="destructive">Bắt buộc</Badge>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-3">
                      {feeGroups.fixed.map((fee) => (
                        <div key={fee.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-slate-900">{fee.name}</h4>
                            {fee.note && (
                              <p className="text-sm text-slate-600 mt-1">{fee.note}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-slate-900">
                              {formatFrom(fee.base_value)}
                            </p>
                            <p className="text-sm text-slate-500">{fee.currency}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          )}

          {/* System Costs */}
          <Card>
            <CardHeader className="bg-blue-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Chi phí theo hệ {currentSystem.code}</CardTitle>
                  <p className="text-sm text-slate-600">
                    Dựa trên visa system đã chọn
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {feeGroups.fixed.length === 0 ? (
                <p className="text-slate-500 text-center py-4">
                  Hệ visa này chưa có dữ liệu chi phí
                </p>
              ) : (
                <div className="space-y-2">
                  {feeGroups.fixed.map(fee => (
                    <div key={fee.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <span className="text-slate-700">{fee.name}</span>
                      <span className="font-semibold">{formatFrom(fee.base_value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Optional Add-ons */}
          {feeGroups.optional.length > 0 && (
            <Card>
              <Accordion type="single" value={expandedSections.includes('optional-addons') ? 'optional-addons' : undefined}>
                <AccordionItem value="optional-addons">
                  <AccordionTrigger onClick={() => toggleSection('optional-addons')}>
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Plus className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="text-lg font-semibold">Chi phí tùy chọn (Optional Add-ons)</h3>
                        <p className="text-sm text-slate-600">
                          Chọn các dịch vụ bổ sung
                        </p>
                      </div>
                      <Badge variant="secondary">Tùy chọn</Badge>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-4">
                      {feeGroups.optional.map((fee) => (
                        <div key={fee.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-slate-900">{fee.name}</h4>
                              {fee.note && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Info className="w-4 h-4 text-slate-400" />
                                  <p className="text-sm text-slate-600">{fee.note}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Checkbox for optional */}
                          {fee.type === 'optional' && (
                            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <Checkbox
                                id={`fee-${fee.id}`}
                                checked={selectedFees[fee.id]?.enabled || false}
                                onCheckedChange={(checked) => handleFeeToggle(fee.id, checked as boolean)}
                              />
                              <Label htmlFor={`fee-${fee.id}`} className="flex-1 cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">Thêm phí này</span>
                                  <span className="text-lg font-bold text-blue-600">
                                    {formatFrom(fee.base_value)}
                                  </span>
                                </div>
                              </Label>
                            </div>
                          )}

                          {/* Radio options for multiple choice */}
                          {(fee.type === 'optional_multiple' || fee.type === 'variable_time') && fee.options && (
                            <RadioGroup
                              value={selectedFees[fee.id]?.optionId || ''}
                              onValueChange={(value) => handleOptionSelect(fee.id, value)}
                            >
                              {fee.options.map((option) => (
                                <div key={option.id} className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg mb-2">
                                  <RadioGroupItem value={option.id} id={option.id} />
                                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium">{option.label || option.name || 'Option'}</p>
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
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          )}

          {/* Total Cost Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-blue-600" />
                  <span className="font-semibold text-lg text-slate-900">Tổng chi phí ước tính:</span>
                </div>
                <span className="text-3xl font-bold text-blue-700">
                  {formatFrom(calculation.total)}
                </span>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                {calculation.breakdown.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className={item.type === 'fixed' ? 'text-slate-700' : 'text-slate-600'}>
                      {item.name} {item.type === 'optional' && '(tùy chọn)'}
                    </span>
                    <span className="font-medium">{formatFrom(item.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
