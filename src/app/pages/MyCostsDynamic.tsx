import React, { useEffect, useState, useMemo } from 'react';
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
} from 'lucide-react';
import { getTrackingCode, searchTrackingCodesByEmail } from '../services/trackingCodeService';
import { useFees, saveFeeSelections, loadFeeSelections } from '../../hooks/useFees';
import type { FlexibleFee, FeeOption, FeeCondition } from '../../types/fees';
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
import { VISA_SYSTEMS } from '../../constants/visaSystems';

// Validation schema for fee selections
const feeSelectionSchema = z.object({
  visaType: z.string().optional(),
  options: z.record(z.string()),
  conditions: z.record(z.string()),
  timeValues: z.record(z.number()),
  optionalFees: z.record(z.boolean()),
});

type FeeSelections = z.infer<typeof feeSelectionSchema>;

export default function MyCostsDynamic() {
  const { registrations, universities, user, studentOnboardings } = useApp();
  const { formatFrom, convertAmount } = useCurrency();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  // State for university selection
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<string[]>(['fixed-costs', 'optional-addons']);
  const [trackingInfo, setTrackingInfo] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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

  // Use fees hook
  const {
    fees,
    loading,
    error,
    selectedVisaType,
    setSelectedVisaType,
    selectedOptions,
    setSelectedOptions,
    selectedConditions,
    setSelectedConditions,
    timeValues,
    setTimeValues,
    optionalFees,
    setOptionalFees,
    calculation,
    refreshFees
  } = useFees(selectedUniversityId);

  // Load saved selections
  useEffect(() => {
    if (!trackingInfo?.code || !selectedUniversityId) return;

    const loadSavedSelections = async () => {
      const saved = await loadFeeSelections(trackingInfo.code, selectedUniversityId);
      if (saved) {
        try {
          const validated = feeSelectionSchema.parse(saved);
          setSelectedVisaType(validated.visaType || null);
          setSelectedOptions(validated.options);
          setSelectedConditions(validated.conditions);
          setTimeValues(validated.timeValues);
          setOptionalFees(validated.optionalFees);
        } catch (err) {
          console.error('Invalid saved selections:', err);
        }
      }
    };

    loadSavedSelections();
  }, [trackingInfo?.code, selectedUniversityId]);

  // Save selections
  const saveSelections = async () => {
    if (!trackingInfo?.code || !selectedUniversityId) return;

    setSaveStatus('saving');
    try {
      const selections = {
        visaType: selectedVisaType,
        options: selectedOptions,
        conditions: selectedConditions,
        timeValues: timeValues,
        optionalFees: optionalFees,
      };

      const result = await saveFeeSelections(trackingInfo.code, selectedUniversityId, selections);
      
      if (result.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        console.error('Save error:', result.error);
      }
    } catch (err) {
      setSaveStatus('error');
      console.error('Save failed:', err);
    }
  };

  // Group fees by category
  const feeGroups = useMemo(() => {
    const groups: Record<string, FlexibleFee[]> = {};
    const applicableFees = fees.filter((fee: FlexibleFee) => 
      !fee.applies_to || fee.applies_to.includes(selectedVisaType || '')
    );

    applicableFees.forEach((fee: FlexibleFee) => {
      const category = fee.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(fee);
    });
    return groups;
  }, [fees, selectedVisaType]);

  // Separate fixed and optional fees
  const fixedFees = useMemo(() => 
    fees.filter(fee => fee.type === 'fixed' && 
      (!fee.applies_to || fee.applies_to.includes(selectedVisaType || ''))
    ), [fees, selectedVisaType]);

  const optionalFeesList = useMemo(() => 
    fees.filter(fee => fee.type !== 'fixed' && 
      (!fee.applies_to || fee.applies_to.includes(selectedVisaType || ''))
    ), [fees, selectedVisaType]);

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

  const handleOptionSelect = (feeId: string, optionId: string) => {
    setSelectedOptions((prev: any) => ({ ...(prev || {}), [feeId]: optionId }));
  };

  const handleConditionSelect = (feeId: string, conditionId: string) => {
    setSelectedConditions((prev: any) => ({ ...(prev || {}), [feeId]: conditionId }));
  };

  const handleTimeChange = (feeId: string, value: number) => {
    setTimeValues((prev: any) => ({ ...(prev || {}), [feeId]: value }));
  };

  const handleOptionalFeeToggle = (feeId: string) => {
    setOptionalFees((prev: any) => ({ ...(prev || {}), [feeId]: !(prev || {})[feeId] }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(x => x !== section) : [...prev, section]
    );
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
              <GraduationCap className="w-5 h-5" />
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

        {/* Visa System Selection */}
        {selectedUniversityId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'vi' ? 'Chọn hệ tuyển sinh' : 'Select Visa System'}
              </CardTitle>
              <CardDescription>
                {language === 'vi' 
                  ? 'Chọn hệ tuyển sinh phù hợp với bạn' 
                  : 'Choose the appropriate visa system for you'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {VISA_SYSTEMS.map((system) => (
                  <div
                    key={system.key}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedVisaType === system.key
                        ? 'border-[#003AB7] bg-[#003AB7]/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedVisaType(system.key)}
                  >
                    <div className="font-bold text-lg">{system.label}</div>
                    <div className="text-sm text-slate-600">{system.name}</div>
                    <div className="text-xs text-slate-500">{system.description}</div>
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
                  {language === 'vi' ? 'Đang tải thông tin phí...' : 'Loading fee information...'}
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
                  {language === 'vi' ? 'Lỗi tải phí' : 'Error loading fees'}
                </p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fee Selection */}
        {!loading && !error && selectedVisaType && (
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
                  
                  <div className="ml-4">
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
                          <Plus className="w-4 h-4 mr-2" />
                          {language === 'vi' ? 'Lưu lựa chọn' : 'Save Selections'}
                        </>
                      )}
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
                                        onCheckedChange={(checked) => handleOptionalFeeToggle(fee.id)}
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

