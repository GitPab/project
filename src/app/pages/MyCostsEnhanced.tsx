import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import {
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Lock,
  Plus,
  TrendingUp,
  AlertCircle,
  Calculator,
  Home,
  Plane,
  Shield,
  Percent,
  Clock,
  CheckCircle,
  Info,
  RefreshCw,
  Save,
  University,
} from 'lucide-react';
import { getTrackingCode, searchTrackingCodesByEmail } from '../services/trackingCodeService';
import { createClient } from '@supabase/supabase-js';
import type { UniversitySystem, FlexibleFee, FeeOption, FeeCondition } from '../types/fees';
import type { University } from '../types/university';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { Separator } from '../components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Alert, AlertDescription } from '../components/ui/alert';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Validation schema for student selections
const studentSelectionSchema = z.object({
  systemCode: z.string(),
  options: z.record(z.string()),
  conditions: z.record(z.string()),
  timeValues: z.record(z.number()),
  optionalFees: z.record(z.boolean()),
});

type StudentSelections = z.infer<typeof studentSelectionSchema>;

// System code options
const SYSTEM_OPTIONS = [
  { code: 'D4-1', name: 'D4-1', nameVi: 'Chương trình tiếng Hàn', description: 'Học tiếng Hàn 6 tháng' },
  { code: 'D2-1', name: 'D2-1', nameVi: 'Chương trình chuẩn bị', description: 'Chuẩn bị vào đại học' },
  { code: 'D2-2', name: 'D2-2', nameVi: 'Chương trình đại học', description: 'Học đại học 4 năm' },
  { code: 'D2-3', name: 'D2-3', nameVi: 'Chương trình sau đại học', description: 'Học thạc sĩ/tiến sĩ' },
  { code: 'D2-6', name: 'D2-6', nameVi: 'Chương trình nâng cao', description: 'Chương trình chuyên sâu' },
];

export default function MyCostsEnhanced() {
  const { universities, user } = useApp();
  const { formatFrom, convertAmount } = useCurrency();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  // State management
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('');
  const [selectedSystemCode, setSelectedSystemCode] = useState<string>('');
  const [university, setUniversity] = useState<University | null>(null);
  const [systems, setSystems] = useState<UniversitySystem[]>([]);
  const [currentSystem, setCurrentSystem] = useState<UniversitySystem | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>(['fixed-costs', 'optional-addons']);
  const [trackingInfo, setTrackingInfo] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection states
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedConditions, setSelectedConditions] = useState<Record<string, string>>({});
  const [timeValues, setTimeValues] = useState<Record<string, number>>({});
  const [optionalFees, setOptionalFees] = useState<Record<string, boolean>>({});

  // Load tracking info
  useEffect(() => {
    const loadTracking = async () => {
      if (!user) return;

      if (user.trackingCode) {
        const data = await getTrackingCode(user.trackingCode);
        if (data) {
          setTrackingInfo(data);
          setSelectedUniversityId(data.desiredUniversityId || '');
          return;
        }
      }

      if (user.email) {
        const matches = await searchTrackingCodesByEmail(user.email);
        if (matches.length > 0) {
          setTrackingInfo(matches[0]);
          setSelectedUniversityId(matches[0].desiredUniversityId || '');
        }
      }
    };

    loadTracking();
  }, [user]);

  // Load university and systems data
  useEffect(() => {
    if (!selectedUniversityId) return;

    const loadUniversityData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load university with systems
        const { data: universityData, error: universityError } = await supabase
          .from('universities')
          .select('*')
          .eq('id', selectedUniversityId)
          .single();

        if (universityError) {
          throw new Error(universityError.message);
        }

        if (universityData) {
          setUniversity(universityData);
          setSystems(universityData.systems || []);
        }

        // Load saved selections
        if (trackingInfo?.code) {
          const { data: savedData } = await supabase
            .from('student_system_selections')
            .select('system_code, selections')
            .eq('tracking_code', trackingInfo.code)
            .eq('university_id', selectedUniversityId)
            .single();

          if (savedData) {
            try {
              const selections = studentSelectionSchema.parse(savedData.selections);
              setSelectedSystemCode(savedData.system_code);
              setSelectedOptions(selections.options);
              setSelectedConditions(selections.conditions);
              setTimeValues(selections.timeValues);
              setOptionalFees(selections.optionalFees);
            } catch (err) {
              console.error('Invalid saved selections:', err);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load university data');
      } finally {
        setLoading(false);
      }
    };

    loadUniversityData();
  }, [selectedUniversityId, trackingInfo?.code]);

  // Set current system when system code changes
  useEffect(() => {
    const system = systems.find(s => s.code === selectedSystemCode);
    setCurrentSystem(system || null);

    // Initialize default selections for new system
    if (system) {
      const defaults: Record<string, any> = {};
      const timeDefaults: Record<string, number> = {};
      const optionalDefaults: Record<string, boolean> = {};
      
      system.fees.forEach((fee) => {
        if (fee.default_selected && (fee.type === 'optional_multiple' || fee.type === 'variable_time')) {
          defaults[fee.id] = fee.default_selected;
        }
        
        if (fee.type === 'percentage' && fee.conditions?.length) {
          defaults[fee.id] = fee.conditions[0].id;
        }
        
        if (fee.time_unit && fee.type !== 'percentage') {
          timeDefaults[fee.id] = 1;
        }
        
        if (fee.type === 'optional' && fee.required) {
          optionalDefaults[fee.id] = true;
        }
      });
      
      setSelectedOptions(prev => ({ ...prev, ...defaults }));
      setTimeValues(prev => ({ ...prev, ...timeDefaults }));
      setOptionalFees(prev => ({ ...prev, ...optionalDefaults }));
    }
  }, [selectedSystemCode, systems]);

  // Real-time subscription for system updates
  useEffect(() => {
    if (!selectedUniversityId) return;

    const channel = supabase
      .channel('systems-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'university_systems',
          filter: `university_id=eq.${selectedUniversityId}`
        },
        (payload) => {
          if (payload.new) {
            // Update systems array when changes occur
            setSystems(prev => {
              const updated = [...prev];
              const index = updated.findIndex(s => s.id === payload.new.id);
              if (index >= 0) {
                updated[index] = payload.new as UniversitySystem;
              } else {
                updated.push(payload.new as UniversitySystem);
              }
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUniversityId]);

  // Calculate total costs
  const calculation = useMemo(() => {
    if (!currentSystem) {
      return {
        total_fees: 0,
        total_discounts: 0,
        final_total: 0,
        currency: 'VND',
        breakdown: []
      };
    }

    let totalFees = 0;
    let totalDiscounts = 0;
    const breakdown: any[] = [];

    currentSystem.fees.forEach(fee => {
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
      currency: 'VND',
      breakdown
    };
  }, [currentSystem, selectedOptions, selectedConditions, timeValues, optionalFees]);

  // Group fees by category
  const feeGroups = useMemo(() => {
    if (!currentSystem) return {};

    const groups: Record<string, FlexibleFee[]> = {};
    currentSystem.fees.forEach(fee => {
      const category = fee.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(fee);
    });
    return groups;
  }, [currentSystem]);

  // Separate fixed and optional fees
  const fixedFees = useMemo(() => 
    currentSystem?.fees.filter(fee => fee.type === 'fixed') || []
  , [currentSystem]);

  const optionalFeesList = useMemo(() => 
    currentSystem?.fees.filter(fee => fee.type !== 'fixed') || []
  , [currentSystem]);

  // Event handlers
  const handleOptionSelect = useCallback((feeId: string, optionId: string) => {
    setSelectedOptions(prev => ({ ...prev, [feeId]: optionId }));
  }, []);

  const handleConditionSelect = useCallback((feeId: string, conditionId: string) => {
    setSelectedConditions(prev => ({ ...prev, [feeId]: conditionId }));
  }, []);

  const handleTimeChange = useCallback((feeId: string, value: number) => {
    setTimeValues(prev => ({ ...prev, [feeId]: value }));
  }, []);

  const handleOptionalToggle = useCallback((feeId: string, checked: boolean) => {
    setOptionalFees(prev => ({ ...prev, [feeId]: checked }));
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(x => x !== section) : [...prev, section]
    );
  }, []);

  // Save selections to database
  const saveSelections = useCallback(async () => {
    if (!trackingInfo?.code || !selectedUniversityId || !selectedSystemCode) return;

    setSaveStatus('saving');
    try {
      const selections = {
        systemCode: selectedSystemCode,
        options: selectedOptions,
        conditions: selectedConditions,
        timeValues: timeValues,
        optionalFees: optionalFees,
      };

      const { error } = await supabase
        .from('student_system_selections')
        .upsert({
          tracking_code: trackingInfo.code,
          university_id: selectedUniversityId,
          system_code: selectedSystemCode,
          selections: selections,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(error.message);
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('error');
      console.error('Save failed:', err);
    }
  }, [trackingInfo?.code, selectedUniversityId, selectedSystemCode, selectedOptions, selectedConditions, timeValues, optionalFees]);

  // Get category icon and name
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'accommodation': return <Home className="w-5 h-5" />;
      case 'travel': return <Plane className="w-5 h-5" />;
      case 'insurance': return <Shield className="w-5 h-5" />;
      case 'scholarship': return <Percent className="w-5 h-5" />;
      case 'service': return <Calculator className="w-5 h-5" />;
      case 'tuition': return <GraduationCap className="w-5 h-5" />;
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

  if (!user || user.role === 'admin') {
    return (
      <div className="space-y-6 p-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {language === 'vi' ? 'Chế độ xem giới hạn' : 'View mode restricted'}
            </CardTitle>
            <CardDescription>
              {language === 'vi'
                ? 'Vui lòng hoàn thành đơn tư vấn để xem chi phí của bạn.'
                : 'Please complete your application to view costs.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {language === 'vi' ? 'Chi phí của tôi' : 'My Costs'}
          </h1>
          <p className="text-slate-600 mt-1">
            {language === 'vi'
              ? 'Tùy chỉnh và tính toán chi phí du học của bạn'
              : 'Customize and calculate your study abroad costs'}
          </p>
        </div>

        {/* University Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <University className="w-5 h-5" />
              {language === 'vi' ? 'Chọn trường đại học' : 'Select University'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedUniversityId} onValueChange={setSelectedUniversityId}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'vi' ? 'Chọn trường...' : 'Select university...'} />
              </SelectTrigger>
              <SelectContent>
                {universities.map((university) => (
                  <SelectItem key={university.id} value={university.id}>
                    <div>
                      <div className="font-medium">{university.name}</div>
                      <div className="text-sm text-slate-600">{university.country}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* System Selection */}
        {university && systems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'vi' ? 'Bạn muốn theo học hệ nào?' : 'Which system do you want to study?'}
              </CardTitle>
              <CardDescription>
                {language === 'vi' 
                  ? 'Chọn hệ tuyển sinh phù hợp với bạn' 
                  : 'Choose the appropriate admission system for you'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systems
                  .filter(system => system.available)
                  .map((system) => (
                    <div
                      key={system.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedSystemCode === system.code
                          ? 'border-[#003AB7] bg-[#003AB7]/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => setSelectedSystemCode(system.code)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-sm">
                          {system.code}
                        </Badge>
                        {system.available ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {language === 'vi' ? 'Có sẵn' : 'Available'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            {language === 'vi' ? 'Tạm dừng' : 'Unavailable'}
                          </Badge>
                        )}
                      </div>
                      <div className="font-bold text-lg mb-1">{system.name}</div>
                      {system.description && (
                        <div className="text-sm text-slate-600">{system.description}</div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003AB7] mx-auto mb-2"></div>
                <p className="text-slate-600">
                  {language === 'vi' ? 'Đang tải thông tin hệ thống...' : 'Loading system information...'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">
                  {language === 'vi' ? 'Lỗi tải dữ liệu' : 'Error loading data'}
                </p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fee Selection and Calculation */}
        {!loading && !error && currentSystem && (
          <>
            {/* Cost Summary */}
            <Card className="border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  {language === 'vi' ? 'Tổng chi phí' : 'Total Cost'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-4">
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
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                      <span>{language === 'vi' ? 'Tiến độ hoàn thành' : language === 'ko' ? '완료 진행률' : 'Completion Progress'}</span>
                      <span>{Math.round((calculation.final_total / 10000000) * 100)}%</span>
                    </div>
                    <Progress value={Math.min((calculation.final_total / 10000000) * 100, 100)} className="h-2" />
                  </div>
                  
                  <div className="ml-4 flex gap-2">
                    <Button
                      onClick={saveSelections}
                      disabled={saveStatus === 'saving'}
                      className="bg-[#003AB7] hover:bg-[#002A8F]"
                    >
                      {saveStatus === 'saving' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {language === 'vi' ? 'Đang lưu...' : 'Saving...'}
                        </>
                      ) : saveStatus === 'saved' ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {language === 'vi' ? 'Đã lưu' : 'Saved'}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {language === 'vi' ? 'Lưu lựa chọn' : 'Save Selections'}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.reload()}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {language === 'vi' ? 'Làm mới' : 'Refresh'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fixed Costs */}
            {fixedFees.length > 0 && (
              <Card>
                <Accordion type="single" value={expandedSections.includes('fixed-costs') ? 'fixed-costs' : undefined}>
                  <AccordionItem value="fixed-costs">
                    <AccordionTrigger onClick={() => toggleSection('fixed-costs')}>
                      <div className="flex items-center gap-3 w-full">
                        <TrendingUp className="w-5 h-5" />
                        <div className="flex-1 text-left">
                          <h3 className="text-lg font-semibold">
                            {language === 'vi' ? 'Phí cố định' : language === 'ko' ? '고정 수수료' : 'Fixed Costs'}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {fixedFees.length} {language === 'vi' ? 'loại phí bắt buộc' : language === 'ko' ? '개 필수 수수료' : 'required fees'}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {language === 'vi' ? 'Bắt buộc' : language === 'ko' ? '필수' : 'Required'}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-6 pb-6">
                      <div className="space-y-4">
                        {fixedFees.map((fee) => (
                          <div key={fee.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                              <h4 className="font-medium text-slate-900">{fee.name}</h4>
                              {fee.note && (
                                <p className="text-sm text-slate-600 mt-1">{fee.note}</p>
                              )}
                              {fee.time_unit && (
                                <p className="text-xs text-slate-500 mt-1">
                                  /{language === 'vi' ? 
                                    (fee.time_unit === 'month' ? 'tháng' : 
                                    fee.time_unit === 'year' ? 'năm' : 
                                    fee.time_unit === 'semester' ? 'học kỳ' : 'lần') : 
                                    fee.time_unit}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-blue-600">
                                {formatFrom(fee.base_value)}
                              </p>
                              {fee.currency && (
                                <p className="text-sm text-slate-600">{fee.currency}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            )}

            {/* Optional Add-ons */}
            {optionalFeesList.length > 0 && (
              <Card>
                <Accordion type="single" value={expandedSections.includes('optional-addons') ? 'optional-addons' : undefined}>
                  <AccordionItem value="optional-addons">
                    <AccordionTrigger onClick={() => toggleSection('optional-addons')}>
                      <div className="flex items-center gap-3 w-full">
                        <Plus className="w-5 h-5" />
                        <div className="flex-1 text-left">
                          <h3 className="text-lg font-semibold">
                            {language === 'vi' ? 'Phí tùy chọn' : language === 'ko' ? '선택적 수수료' : 'Optional Add-ons'}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {optionalFeesList.length} {language === 'vi' ? 'loại phí tùy chọn' : language === 'ko' ? '개 선택적 수수료' : 'optional fees'}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {language === 'vi' ? 'Tùy chọn' : language === 'ko' ? '선택' : 'Optional'}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-6 pb-6">
                      <div className="space-y-6">
                        {Object.entries(feeGroups).map(([category, categoryFees]) => (
                          <div key={category}>
                            <div className="flex items-center gap-2 mb-4">
                              {getCategoryIcon(category)}
                              <h4 className="font-medium text-slate-900">{getCategoryName(category)}</h4>
                              <Badge variant="outline">{categoryFees.length}</Badge>
                            </div>
                            
                            <div className="space-y-4">
                              {categoryFees.map((fee) => (
                                <div key={fee.id} className="border border-slate-200 rounded-lg p-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <h5 className="font-medium text-slate-900">{fee.name}</h5>
                                      {fee.note && (
                                        <div className="flex items-center gap-1 mt-1">
                                          <Info className="w-4 h-4 text-slate-400" />
                                          <p className="text-sm text-slate-600">{fee.note}</p>
                                        </div>
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

                                  {/* Optional Fee (Checkbox) */}
                                  {fee.type === 'optional' && (
                                    <div className="flex items-center gap-3">
                                      <Checkbox
                                        id={`optional-${fee.id}`}
                                        checked={optionalFees[fee.id] || false}
                                        onCheckedChange={(checked: boolean) => handleOptionalToggle(fee.id, checked)}
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

                                  {/* Optional Multiple (Radio Options) */}
                                  {fee.type === 'optional_multiple' && fee.options && (
                                    <div>
                                      <Label className="block text-sm font-medium mb-3">
                                        {language === 'vi' ? 'Chọn một lựa chọn:' : language === 'ko' ? '옵션 선택:' : 'Select an option:'}
                                      </Label>
                                      <RadioGroup
                                        value={selectedOptions[fee.id] || ''}
                                        onValueChange={(value) => handleOptionSelect(fee.id, value)}
                                      >
                                        {fee.options.map((option: FeeOption) => (
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

                                  {/* Variable Time (Radio Options + Time Input) */}
                                  {fee.type === 'variable_time' && fee.options && (
                                    <div>
                                      <Label className="block text-sm font-medium mb-3">
                                        {language === 'vi' ? 'Chọn thời điểm:' : language === 'ko' ? '시점 선택:' : 'Select timing:'}
                                      </Label>
                                      <RadioGroup
                                        value={selectedOptions[fee.id] || ''}
                                        onValueChange={(value) => handleOptionSelect(fee.id, value)}
                                      >
                                        {fee.options.map((option: FeeOption) => (
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
                                        {fee.conditions.map((condition: FeeCondition) => (
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
                            <Separator className="my-4" />
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
