import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Plane, Home, BookOpen, Wallet, GraduationCap, PiggyBank, Receipt } from 'lucide-react';
import { Badge } from './ui/badge';
import type { University, KoreanUniversityData, VisaSystemDetail, CommonFeeVND, CalculatedCosts, KTXOption, FinancialRequirementOption } from '../../types/university';
import { useCurrency } from '../context/CurrencyContext';
import { TOPIK_DISCOUNT_LEVELS, DEFAULT_COMMON_FEES } from '../../constants/scholarships';
import { EXCHANGE_RATES } from '../../constants/exchangeRates';
import { VISA_SYSTEMS } from '../../constants/visaSystems';

interface CostCalculatorProps {
  university: University;
}

// Imported from constants - using DEFAULT_COMMON_FEES from scholarships.ts

// Imported from constants - using TOPIK_DISCOUNT_LEVELS from scholarships.ts

// Imported from constants - using EXCHANGE_RATES from scholarships.ts

export default function CostCalculator({ university }: CostCalculatorProps) {
  const { formatFrom } = useCurrency();
  const koreanData = university.koreanData as KoreanUniversityData | undefined;

  // Get new schema data or use defaults, fallback to old schema for backward compatibility
  const commonFees = (koreanData as any)?.common_fees_vnd || (koreanData as any)?.commonFeesVND || DEFAULT_COMMON_FEES;
  const visaSystemsDetail = (koreanData as any)?.visa_systems || (koreanData as any)?.visaSystemsDetail || {};

  // All visa systems from shared constant
  // Build labels from shared VISA_SYSTEMS
  const VISA_LABELS = Object.fromEntries(
    VISA_SYSTEMS.map(v => [v.key, v.name])
  );
  
  // Get available visa systems
  const availableVisaSystems = useMemo(() => {
    const systems: string[] = [];
    if (visaSystemsDetail) {
      Object.entries(visaSystemsDetail as Record<string, VisaSystemDetail>).forEach(([code, system]: [string, VisaSystemDetail]) => {
        if (!system.available) return;
        if (code === 'D2-3') {
          systems.push('D2-3M', 'D2-3P');
        } else {
          systems.push(code);
        }
      });
    }
    // Fallback to legacy data
    if (systems.length === 0 && koreanData?.visaSystems) {
      koreanData.visaSystems.forEach((v: any) => {
        if (v.available === false) return;
        if (v.visaType === 'D2-3') {
          systems.push('D2-3M', 'D2-3P');
        } else {
          systems.push(v.visaType);
        }
      });
    }
    return systems;
  }, [visaSystemsDetail, koreanData?.visaSystems]);
  
  // State
  const [selectedVisa, setSelectedVisa] = useState<string>('D4-1');
  const [topikLevel, setTopikLevel] = useState<number>(0);
  const [selectedKTXOption, setSelectedKTXOption] = useState<string>('');
  const [selectedSoTietKiemOption, setSelectedSoTietKiemOption] = useState<string>('');
  const [ktxVNMonths, setKtxVNMonths] = useState<number>(0);
  const [includeFlight, setIncludeFlight] = useState<boolean>(false);
  const [expandedSubItems, setExpandedSubItems] = useState<Record<string, boolean>>({});
  
  // Get current visa system data
  const mappedVisaKey = (selectedVisa === 'D2-3M' || selectedVisa === 'D2-3P') ? 'D2-3' : selectedVisa;
  const currentVisaSystem: VisaSystemDetail | undefined = visaSystemsDetail?.[mappedVisaKey] || {
    available: true,
    invoiceKRWPerYear: 5800000,
    applyFeeKRW: 100000,
    enrollmentFeeKRW: 0,
    scholarships: TOPIK_DISCOUNT_LEVELS.filter(d => d.level >= 3).map(d => ({
      condition: `TOPIK ${d.level}`,
      discountPct: d.discount,
      topikLevel: d.level,
    })),
    ktxOptions: [
      { name: 'Phòng 4 người', priceKRWPerKy: 747000 },
      { name: 'Phòng 2 người', priceKRWPerKy: 1102000 },
      { name: 'Phòng 2 người (Quốc tế)', priceKRWPerKy: 1440000 },
    ],
    financialRequirement: {
      soTietKiemOptions: [
        { label: 'Khu vực Gyeonggi', amountKRW: 10000000 },
        { label: 'Ngoài Gyeonggi', amountKRW: 8000000 },
      ],
      luiNThang: 6,
    },
  };
  
  // Calculate costs
  const calculatedCosts: CalculatedCosts = useMemo(() => {
    // VND Fees
  const hocTieng = commonFees.find((f: CommonFeeVND) => f.id === 'hoc_tieng')?.amount || DEFAULT_COMMON_FEES.find(f => f.id === 'hoc_tieng')!.amount;
  const phiTuVan = commonFees.find((f: CommonFeeVND) => f.id === 'phi_tu_van')?.amount || DEFAULT_COMMON_FEES.find(f => f.id === 'phi_tu_van')!.amount;
  const phiTrungTam = commonFees.find((f: CommonFeeVND) => f.id === 'phi_trung_tam')?.amount || DEFAULT_COMMON_FEES.find(f => f.id === 'phi_trung_tam')!.amount;
  const veMayBay = includeFlight ? (commonFees.find((f: CommonFeeVND) => f.id === 've_may_bay')?.amount || DEFAULT_COMMON_FEES.find(f => f.id === 've_may_bay')!.amount) : 0;
  const ktxVN = ktxVNMonths > 0 
    ? ktxVNMonths * (commonFees.find((f: CommonFeeVND) => f.id === 'ktx_vn')?.amountPerMonth || DEFAULT_COMMON_FEES.find(f => f.id === 'ktx_vn')!.amountPerMonth)
    : 0;
    
    const totalVND = hocTieng + phiTuVan + phiTrungTam + veMayBay + ktxVN;
    
    // KRW Fees
    const applyFee = currentVisaSystem?.applyFeeKRW || 0;
    const enrollmentFee = currentVisaSystem?.enrollmentFeeKRW || 0;
    const invoice = currentVisaSystem?.invoiceKRWPerYear || 0;
    
    // Scholarship calculation
    // TC-E004: Guard against division by zero when invoice = 0
    const safeInvoice = invoice || 0;
    const scholarshipDiscount = TOPIK_DISCOUNT_LEVELS.find(d => d.level === topikLevel)?.discount || 0;
    const hocBong = (scholarshipDiscount > 0 && safeInvoice > 0) 
      ? -Math.round((safeInvoice * scholarshipDiscount) / 100) 
      : 0;
    
    // Show warning if invoice is 0 (unconfigured university)
    const showInvoiceWarning = safeInvoice === 0;
    
    // KTX HQ
    const ktxOptions = currentVisaSystem?.ktxOptions || [];
    const ktxHQ = ktxOptions.find((option: KTXOption) => option.name === selectedKTXOption)?.priceKRWPerKy || 0;
    
    // Sổ tiết kiệm
    const soTietKiemOptions = currentVisaSystem?.financialRequirement?.soTietKiemOptions || [];
    const soTietKiem = soTietKiemOptions.find((option: FinancialRequirementOption) => option.label === selectedSoTietKiemOption)?.amountKRW || 0;
    
    const totalKRW = applyFee + enrollmentFee + invoice + hocBong + ktxHQ + soTietKiem;
    
    // USD conversion (approximate) using centralized exchange rates
    // TC-E004: Guard against zero rates
    const usdRate = EXCHANGE_RATES.USD || 25500;
    const krwRate = EXCHANGE_RATES.KRW || 18.9;
    const totalVNDinUSD = usdRate > 0 ? totalVND / usdRate : 0;
    const totalKRWinUSD = (totalKRW * krwRate) / usdRate;
    const approximateUSD = totalVNDinUSD + totalKRWinUSD;
    
    return {
      hocTieng,
      phiTuVan,
      phiTrungTam,
      ktxVN,
      veMayBay,
      totalVND,
      applyFee,
      enrollmentFee,
      invoice,
      hocBong,
      ktxHQ,
      soTietKiem,
      totalKRW,
      approximateUSD,
      scholarshipApplied: scholarshipDiscount > 0,
      scholarshipDescription: scholarshipDiscount > 0 ? `Học bổng TOPIK ${topikLevel} (−${scholarshipDiscount}%)` : undefined,
      showInvoiceWarning, // TC-E004: Add warning flag
    };
  }, [commonFees, currentVisaSystem, topikLevel, selectedKTXOption, selectedSoTietKiemOption, ktxVNMonths, includeFlight]);
  
  // Reset TOPIK when switching visa systems
  const handleVisaChange = (visaType: string) => {
    setSelectedVisa(visaType);
    setTopikLevel(0);
  };
  
  // Toggle sub-items expansion
  const toggleSubItems = (feeId: string) => {
    setExpandedSubItems((prev: Record<string, boolean>) => ({
      ...prev,
      [feeId]: !prev[feeId]
    }));
  };
  
  // If no visa systems available
  if (availableVisaSystems.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Chi phí du học chi tiết</h2>
        <p className="text-slate-500">Chưa có thông tin chi phí cho trường này.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm">
      <h2 className="text-2xl font-bold mb-8">Chi phí du học chi tiết</h2>
      
      {/* TC-E004: Warning for unconfigured university */}
      {calculatedCosts.showInvoiceWarning && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-amber-800 font-medium">
            ⚠️ Trường chưa được cấu hình đầy đủ - Một số chi phí có thể hiển thị 0
          </p>
          <p className="text-amber-700 text-sm mt-1">
            Vui lòng liên hệ admin để cập nhật thông tin chi phí cho trường này.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel - Controls */}
        <div className="space-y-6">
          {/* Visa System Tabs */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              <BookOpen className="inline w-4 h-4 mr-1" /> Hệ du học
            </label>
            <div className="flex flex-wrap gap-2">
              {VISA_SYSTEMS.map((visa) => {
                const isAvailable = availableVisaSystems.includes(visa.key);
                const isSelected = selectedVisa === visa.key;

                return (
                  <button
                    key={visa.key}
                    disabled={!isAvailable}
                    onClick={() => isAvailable && handleVisaChange(visa.key)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all relative ${
                      isSelected
                        ? 'bg-[#003AB7] text-white border-[#003AB7] shadow-lg'
                        : isAvailable
                        ? 'bg-white border-slate-200 hover:border-[#003AB7]/50 hover:bg-slate-50'
                        : 'bg-slate-100 border-slate-200 opacity-45 cursor-not-allowed'
                    }`}
                  >
                    <span className={isAvailable ? '' : 'opacity-60'}>
                      {visa.label}
                    </span>
                    <div className={`text-xs mt-1 ${isSelected ? 'text-white/70' : isAvailable ? 'text-slate-500' : 'text-red-500'}`}>
                      {isAvailable ? VISA_LABELS[visa.key] : 'Không có'}
                    </div>
                    {isAvailable && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* TOPIK Level */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              <GraduationCap className="inline w-4 h-4 mr-1" /> Trình độ TOPIK
            </label>
            <select
              value={topikLevel}
              onChange={(e) => setTopikLevel(Number(e.target.value))}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#003AB7] focus:border-transparent"
            >
              <option value={0}>Chưa có TOPIK</option>
              {TOPIK_DISCOUNT_LEVELS.slice(1).map(({level, discount}) => (
                <option key={level} value={level}>
                  TOPIK {level}{discount > 0 ? ` — Giảm ${discount}% học phí` : ''}
                </option>
              ))}
            </select>
            {calculatedCosts.scholarshipApplied && (
              <p className="mt-2 text-sm text-emerald-600 font-medium">
                ✓ Áp dụng {calculatedCosts.scholarshipDescription}
              </p>
            )}
          </div>
          
          {/* KTX HQ Options */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              <Home className="inline w-4 h-4 mr-1" /> KTX tại Hàn Quốc (1 kỳ)
            </label>
            <select
              value={selectedKTXOption}
              onChange={(e) => setSelectedKTXOption((e.target as HTMLSelectElement).value as string)}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#003AB7] focus:border-transparent"
            >
              {(currentVisaSystem?.ktxOptions || []).map((option: any, idx: number) => (
                <option key={idx} value={idx}>
                  {option.name} — {formatFrom(option.priceKRWPerKy, 'KRW')}
                </option>
              ))}
            </select>
          </div>
          
          {/* Sổ tiết kiệm */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              <PiggyBank className="inline w-4 h-4 mr-1" /> Sổ tiết kiệm chứng minh tài chính
            </label>
            <select
              value={selectedSoTietKiemOption}
              onChange={(e) => setSelectedSoTietKiemOption((e.target as HTMLSelectElement).value as string)}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#003AB7] focus:border-transparent"
            >
              {(currentVisaSystem?.financialRequirement?.soTietKiemOptions || []).map((option: any, idx: number) => (
                <option key={idx} value={idx}>
                  {option.label} — {formatFrom(option.amountKRW, 'KRW')}
                </option>
              ))}
            </select>
          </div>
          
          {/* KTX VN Months */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              <Home className="inline w-4 h-4 mr-1" /> KTX tại Việt Nam
            </label>
            <select
              value={ktxVNMonths}
              onChange={(e) => setKtxVNMonths(Number(e.target.value))}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#003AB7] focus:border-transparent"
            >
              <option value={0}>Không ở KTX</option>
              {TOPIK_DISCOUNT_LEVELS.slice(1).map(({level}) => (
                <option key={level} value={level}>
                  {level} tháng — {formatFrom(level * DEFAULT_COMMON_FEES.find(f => f.id === 'ktx_vn')!.amountPerMonth!, 'VND')}
                </option>
              ))}
            </select>
          </div>
          
          {/* Flight Checkbox */}
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={includeFlight}
              onChange={(e) => setIncludeFlight(e.target.checked)}
              className="w-5 h-5 text-[#003AB7] rounded focus:ring-[#003AB7]"
            />
            <Plane className="w-5 h-5 text-slate-500" />
            <span className="font-medium text-slate-700">Bao gồm vé máy bay 1 chiều</span>
          </label>
        </div>
        
        {/* Right Panel - Fee Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Phí tại Việt Nam */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
            <h3 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5" /> Phí tại Việt Nam (VNĐ)
            </h3>
            
            <div className="space-y-3">
              {DEFAULT_COMMON_FEES.filter((f: any) => !f.optional || (f.id === 've_may_bay' && includeFlight) || (f.id === 'ktx_vn' && ktxVNMonths > 0)).map((fee: any) => (
                <div key={fee.id} className="flex justify-between items-start py-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">{fee.name}</span>
                      {fee.subItems && fee.subItems.length > 0 && (
                        <button
                          onClick={() => toggleSubItems(fee.id)}
                          className="text-slate-400 hover:text-[#003AB7] transition-colors"
                        >
                          {expandedSubItems[fee.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    {fee.note && (
                      <p className="text-xs text-slate-500 mt-1">{fee.note}</p>
                    )}
                    {fee.subItems && fee.subItems.length > 0 && expandedSubItems[fee.id] && (
                      <div className="mt-2 pl-4 space-y-1">
                        {fee.subItems.map((subItem: string, idx: number) => (
                          <div key={idx} className="text-xs text-slate-600 flex items-center gap-1">
                            <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                            {subItem}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-slate-800">
                    {formatFrom(fee.amount, 'VND')}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-emerald-200">
              <div className="flex justify-between items-center">
                <span className="font-bold text-emerald-800">Tổng phí VNĐ</span>
                <span className="text-xl font-bold text-emerald-700">
                  {formatFrom(calculatedCosts.totalVND, 'VND')}
                </span>
              </div>
            </div>
          </div>
          
          {/* Phí tại Hàn Quốc */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5" /> Phí tại Hàn Quốc (KRW)
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-slate-700">Phí apply</span>
                <span className="font-semibold text-slate-800">{formatFrom(calculatedCosts.applyFee, 'KRW')}</span>
              </div>
              
              {calculatedCosts.enrollmentFee > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-slate-700">Phí nhập học</span>
                  <span className="font-semibold text-slate-800">{formatFrom(calculatedCosts.enrollmentFee, 'KRW')}</span>
                </div>
              )}
              
              <div className="flex justify-between py-2">
                <span className="text-slate-700">Invoice học phí (1 năm)</span>
                <span className="font-semibold text-slate-800">{formatFrom(calculatedCosts.invoice, 'KRW')}</span>
              </div>
              
              {/* Scholarship - shown in red as negative */}
              {calculatedCosts.hocBong < 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-slate-700">{calculatedCosts.scholarshipDescription}</span>
                  <span className="font-semibold text-red-600">{formatFrom(calculatedCosts.hocBong, 'KRW')}</span>
                </div>
              )}
              
              <div className="flex justify-between py-2">
                <span className="text-slate-700">KTX tại HQ (1 kỳ)</span>
                <span className="font-semibold text-slate-800">{formatFrom(calculatedCosts.ktxHQ, 'KRW')}</span>
              </div>
              
              <div className="flex justify-between py-2">
                <span className="text-slate-700">Sổ tiết kiệm chứng minh TC</span>
                <span className="font-semibold text-slate-800">{formatFrom(calculatedCosts.soTietKiem, 'KRW')}</span>
              </div>
              
              <div className="pt-4 border-t border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-800">Tổng phí KRW</span>
                  <span className="text-xl font-bold text-blue-700">
                    {formatFrom(calculatedCosts.totalKRW, 'KRW')}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Total Section */}
          <div className="bg-gradient-to-r from-[#003AB7] to-blue-600 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Tổng chi phí ước tính</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-blue-100 text-sm mb-1">Tổng VNĐ</p>
                <p className="text-2xl font-bold">{formatFrom(calculatedCosts.totalVND, 'VND')}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-blue-100 text-sm mb-1">Tổng KRW</p>
                <p className="text-2xl font-bold">{formatFrom(calculatedCosts.totalKRW, 'KRW')}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-4">
                <p className="text-blue-100 text-sm mb-1">Ước tính USD</p>
                <p className="text-2xl font-bold">≈ ${calculatedCosts.approximateUSD.toLocaleString()}</p>
              </div>
            </div>
            
            {/* Scholarship notification */}
            {calculatedCosts.scholarshipApplied ? (
              <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-xl p-3">
                <p className="text-emerald-100 font-medium">
                  ✓ Tiết kiệm {formatFrom(Math.abs(calculatedCosts.hocBong), 'KRW')} nhờ {calculatedCosts.scholarshipDescription}
                </p>
              </div>
            ) : (
              <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-3">
                <p className="text-amber-100 text-sm">
                  💡 Đạt TOPIK 3+ để nhận học bổng từ 30% học phí
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
