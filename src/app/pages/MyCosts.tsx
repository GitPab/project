import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  DollarSign, 
  ChevronDown, 
  ChevronUp, 
  GraduationCap,
  MapPin,
  Calendar,
  Plus,
  TrendingUp,
  RefreshCw,
  Lock,
  Edit,
  Check,
  X
} from 'lucide-react';

export default function MyCosts() {
  const { registrations, universities, user, studentProgress, updateRegistration } = useApp();
  const { currency, toggleCurrency, formatFrom } = useCurrency();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [tempSelectedFees, setTempSelectedFees] = useState<{
    visa: boolean;
    accommodation: boolean;
    insurance: boolean;
    additional: boolean[];
  } | null>(null);

  // Get registrations for current student
  const studentRegistrations = registrations.filter(
    reg => reg.studentEmail === user?.email
  );

  // Check if user has progress tracking
  const hasProgress = studentProgress.some(p => p.studentEmail === user?.email);

  // Calculate costs
  const registeredUniversities = studentRegistrations.map(reg => {
    const university = universities.find(uni => uni.id === reg.universityId);
    if (!university) return null;

    // Always include tuition (it's mandatory)
    const tuition = university.generalTuition;
    
    // Check selectedFees from registration, default to all selected if not specified
    const selectedFees = reg.selectedFees || {
      visa: true,
      accommodation: true,
      insurance: true,
      additional: university.additionalFees.map(() => true)
    };
    
    // Calculate fees based on selection
    const visa = selectedFees.visa ? university.visaFee : 0;
    const accommodation = selectedFees.accommodation ? university.accommodationFee : 0;
    const insurance = selectedFees.insurance ? university.insuranceFee : 0;
    
    // Calculate additional fees based on selection
    const additionalTotal = university.additionalFees.reduce((sum, fee, index) => {
      if (selectedFees.additional && selectedFees.additional[index]) {
        return sum + fee.amount;
      }
      return sum;
    }, 0);
    
    const insuranceAndMisc = insurance + additionalTotal;
    const total = tuition + visa + accommodation + insuranceAndMisc;

    return {
      ...reg,
      university,
      selectedFees,
      costs: {
        tuition,
        visa,
        accommodation,
        insuranceAndMisc,
        total
      }
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  const grandTotal = registeredUniversities.reduce(
    (sum, reg) => sum + (reg?.costs.total || 0), 
    0
  );

  // Mock budget goal for progress bar
  const budgetGoal = 100000; // $100k mock budget
  const progressPercentage = Math.min((grandTotal / budgetGoal) * 100, 100);

  const toggleCard = (id: string) => {
    setExpandedCards(prev => 
      prev.includes(id) 
        ? prev.filter(cardId => cardId !== id)
        : [...prev, id]
    );
  };

  const startEditing = (universityId: string) => {
    const reg = registeredUniversities.find(r => r.universityId === universityId);
    if (!reg) return;

    setEditingCard(universityId);
    setTempSelectedFees({
      visa: reg.costs.visa > 0,
      accommodation: reg.costs.accommodation > 0,
      insurance: reg.costs.insuranceAndMisc > 0,
      additional: reg.university.additionalFees.map(fee => fee.amount > 0)
    });
  };

  const cancelEditing = () => {
    setEditingCard(null);
    setTempSelectedFees(null);
  };

  const saveChanges = (universityId: string) => {
    const reg = registeredUniversities.find(r => r.universityId === universityId);
    if (!reg || !tempSelectedFees) return;

    const newCosts = {
      tuition: reg.costs.tuition,
      visa: tempSelectedFees.visa ? reg.costs.visa : 0,
      accommodation: tempSelectedFees.accommodation ? reg.costs.accommodation : 0,
      insuranceAndMisc: tempSelectedFees.insurance ? reg.costs.insuranceAndMisc : 0,
      total: reg.costs.total
    };

    updateRegistration(reg.universityId, reg.studentEmail, tempSelectedFees);
    setEditingCard(null);
    setTempSelectedFees(null);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Currency Toggle Button - Fixed Position */}
      <button
        onClick={toggleCurrency}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-white border-2 border-primary text-primary rounded-full shadow-lg hover:bg-primary hover:text-white transition-colors"
        title="Toggle currency"
      >
        <RefreshCw className="w-5 h-5" />
        <span className="font-semibold">{currency}</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Chi phí của tôi</h1>
        <p className="text-slate-600">Theo dõi chi phí du học của bạn</p>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 md:p-8 mb-8 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-blue-50 text-sm font-medium flex items-center gap-2">
              Tổng chi phí ước tính du học
              <Lock className="w-4 h-4" />
            </p>
            <h2 className="text-4xl font-bold">{formatFrom(grandTotal, 'USD')}</h2>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-blue-50">Tiến độ ngân sách</span>
            <span className="font-semibold">{progressPercentage.toFixed(0)}% / {formatFrom(budgetGoal, 'USD')}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-white h-full rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-blue-50 text-sm">
          <TrendingUp className="w-4 h-4" />
          <span>
            {registeredUniversities.length} {registeredUniversities.length === 1 ? 'trường đại học' : 'trường đại học'} đã đăng ký
          </span>
        </div>
      </div>

      {/* University Cards */}
      {registeredUniversities.length > 0 ? (
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Chi tiết chi phí theo trường</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Lock className="w-4 h-4" />
              <span>Chỉ xem</span>
            </div>
          </div>
          
          {registeredUniversities.map((reg) => {
            if (!reg) return null;
            const isExpanded = expandedCards.includes(reg.universityId);
            
            return (
              <div 
                key={reg.universityId}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <button
                  onClick={() => toggleCard(reg.universityId)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-4 text-left">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 text-lg mb-1">
                        {reg.university.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {reg.university.country}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Registered: {new Date(reg.registeredAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-600">
                        {formatFrom(reg.costs.total, 'USD')}
                      </div>
                      <div className="text-xs text-slate-500">Total Cost</div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Card Content - Expandable */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-slate-100 pt-4 bg-slate-50">
                    <h5 className="text-sm font-semibold text-slate-700 mb-3">Cost Breakdown</h5>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-slate-200">
                        <span className="text-slate-700">Tuition</span>
                        <span className="font-semibold text-slate-900">
                          {formatFrom(reg.costs.tuition, 'USD')}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between py-2 border-b border-slate-200">
                        <span className="text-slate-700">Visa</span>
                        <span className="font-semibold text-slate-900">
                          {formatFrom(reg.costs.visa, 'USD')}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between py-2 border-b border-slate-200">
                        <span className="text-slate-700">Accommodation</span>
                        <span className="font-semibold text-slate-900">
                          {formatFrom(reg.costs.accommodation, 'USD')}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between py-2 border-b border-slate-200">
                        <span className="text-slate-700">Insurance + Misc</span>
                        <span className="font-semibold text-slate-900">
                          {formatFrom(reg.costs.insuranceAndMisc, 'USD')}
                        </span>
                      </div>

                      {/* Additional Fees Details */}
                      {reg.university.additionalFees.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-200">
                          <p className="text-xs font-semibold text-slate-600 mb-2">Miscellaneous Fees Include:</p>
                          <div className="flex flex-wrap gap-2">
                            {reg.university.additionalFees.map((fee, idx) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded"
                              >
                                {fee.type}: {formatFrom(fee.amount, 'USD')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between py-3 bg-emerald-50 -mx-6 px-6 rounded-lg mt-4">
                        <span className="font-semibold text-slate-900">Total for this university</span>
                        <span className="text-xl font-bold text-emerald-600">
                          {formatFrom(reg.costs.total, 'USD')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center mb-8">
          <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Chưa đăng ký trường nào</h3>
          <p className="text-slate-600 mb-6">
            Bắt đầu bằng cách tìm kiếm và đăng ký các trường đại học bạn quan tâm
          </p>
          <button
            onClick={() => navigate('/student/universities')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Xem danh sách trường
          </button>
        </div>
      )}

      {/* Grand Total Card */}
      {registeredUniversities.length > 0 && (
        <div className="bg-white rounded-lg border-2 border-emerald-500 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 mb-1">Grand Total Across All Universities</p>
              <h3 className="text-3xl font-bold text-emerald-600">
                {formatFrom(grandTotal, 'USD')}
              </h3>
            </div>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Average per University</p>
                <p className="font-semibold text-slate-900">
                  {formatFrom(Math.round(grandTotal / registeredUniversities.length), 'USD')}
                </p>
              </div>
              <div>
                <p className="text-slate-600">Total Tuition</p>
                <p className="font-semibold text-slate-900">
                  {formatFrom(registeredUniversities.reduce((sum, reg) => sum + (reg?.costs.tuition || 0), 0), 'USD')}
                </p>
              </div>
              <div>
                <p className="text-slate-600">Total Accommodation</p>
                <p className="font-semibold text-slate-900">
                  {formatFrom(registeredUniversities.reduce((sum, reg) => sum + (reg?.costs.accommodation || 0), 0), 'USD')}
                </p>
              </div>
              <div>
                <p className="text-slate-600">Other Fees</p>
                <p className="font-semibold text-slate-900">
                  {formatFrom(registeredUniversities.reduce((sum, reg) => sum + (reg?.costs.visa || 0) + (reg?.costs.insuranceAndMisc || 0), 0), 'USD')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add More Universities Button */}
      {registeredUniversities.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {hasProgress && (
            <button
              onClick={() => navigate('/student/my-progress')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
            >
              <TrendingUp className="w-5 h-5" />
              {t('progress.viewProgress')}
            </button>
          )}
          <button
            onClick={() => navigate('/student/universities')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add More Universities
          </button>
        </div>
      )}
    </div>
  );
}