import React, { useState, useMemo } from 'react';
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
  X,
  AlertCircle
} from 'lucide-react';

export default function MyCosts() {
  const { registrations, universities, user, updateRegistration } = useApp();
  const { currency, formatFrom } = useCurrency();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [expandedCards, setExpandedCards] = useState<string[]>([]);

  // Get current student's registrations
  // Can match by email (for logged-in students) or by tracking code
  const studentRegistrations = useMemo(() => {
    if (!user) return [];
    return registrations.filter(
      reg => reg.studentEmail === user.email ||
              (user.trackingCode && reg.trackingCode === user.trackingCode)
    );
  }, [registrations, user]);

  // Calculate costs for each registration
  const registeredUniversities = useMemo(() => {
    return studentRegistrations.map(reg => {
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
        registrationId: reg.id,
        trackingCode: reg.trackingCode,
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
  }, [studentRegistrations, universities]);

  const grandTotal = useMemo(
    () => registeredUniversities.reduce((sum, reg) => sum + (reg?.costs.total || 0), 0),
    [registeredUniversities]
  );

  // Mock budget goal for progress bar
  const budgetGoal = 500000000; // 500M VND mock budget
  const progressPercentage = Math.min((grandTotal / budgetGoal) * 100, 100);

  const toggleCard = (id: string) => {
    setExpandedCards(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // If student is not logged in or is admin
  if (!user || user.role === 'admin') {
    return (
      <div className="space-y-6 p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              {language === 'vi' ? 'Chế độ xem giác hạn' : 'View mode restricted'}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              {language === 'vi'
                ? 'Vui lòng hoàn thành đơn tư vấn để xem chi phí của bạn.'
                : 'Please complete your application to view costs.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {language === 'vi' ? 'Chi phí của tôi' : 'My Costs'}
        </h1>
        <p className="text-slate-600 mt-1">
          {language === 'vi'
            ? 'Quản lý và theo dõi chi phí học tập của bạn'
            : 'Manage and track your study costs'}
        </p>
      </div>

      {/* Summary Card */}
      {registeredUniversities.length > 0 ? (
        <div className="bg-gradient-to-br from-primary/10 to-blue-100 rounded-xl border border-primary/20 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-slate-600 mb-1">
                {language === 'vi' ? 'Tổng chi phí' : 'Total Costs'}
              </p>
              <h2 className="text-4xl font-bold text-primary">
                {formatFrom(grandTotal, 'VND')}
              </h2>
            </div>
            <DollarSign className="w-12 h-12 text-primary/30" />
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>{progressPercentage.toFixed(0)}% of budget</span>
              <span>{formatFrom(budgetGoal, 'VND')} goal</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-blue-600 h-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <GraduationCap className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <p className="text-slate-700 font-medium">
            {language === 'vi' ? 'Chưa có đơn đăng ký' : 'No registrations yet'}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            {language === 'vi'
              ? 'Hoàn thành đơn tư vấn để xem chi phí ước tính.'
              : 'Complete an application to see estimated costs.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {language === 'vi' ? 'Bắt đầu tư vấn' : 'Start Application'}
          </button>
        </div>
      )}

      {/* Cost Cards by University */}
      <div className="space-y-4">
        {registeredUniversities.map((item) => {
          const isExpanded = expandedCards.includes(item.registrationId);

          return (
            <div
              key={item.registrationId}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all"
            >
              {/* Card Header - Clickable to Expand */}
              <button
                onClick={() => toggleCard(item.registrationId)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {item.university.name}
                    </h3>
                    <p className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {item.university.region || item.university.country}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">
                      {language === 'vi' ? 'Tổng cộng' : 'Total'}
                    </p>
                    <p className="text-xl font-bold text-primary">
                      {formatFrom(item.costs.total, 'VND')}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 space-y-3">
                  {/* Cost Breakdown */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">
                        {language === 'vi' ? 'Học phí' : 'Tuition'}
                      </p>
                      <p className="font-semibold text-slate-900">
                        {formatFrom(item.costs.tuition, 'VND')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">
                        {language === 'vi' ? 'Phí visa' : 'Visa'}
                      </p>
                      <p className="font-semibold text-slate-900">
                        {formatFrom(item.costs.visa, 'VND')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">
                        {language === 'vi' ? 'Lưu trú' : 'Accommodation'}
                      </p>
                      <p className="font-semibold text-slate-900">
                        {formatFrom(item.costs.accommodation, 'VND')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">
                        {language === 'vi' ? 'Bảo hiểm & khác' : 'Insurance & Other'}
                      </p>
                      <p className="font-semibold text-slate-900">
                        {formatFrom(item.costs.insuranceAndMisc, 'VND')}
                      </p>
                    </div>
                  </div>

                  {/* Tracking Code */}
                  {item.trackingCode && (
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-slate-600 mb-1">
                        {language === 'vi' ? 'Mã theo dõi' : 'Tracking Code'}
                      </p>
                      <p className="font-mono text-sm font-semibold text-primary">
                        {item.trackingCode}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => navigate(`/student/university/${item.university.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
                    >
                      <TrendingUp className="w-4 h-4" />
                      {language === 'vi' ? 'Chi tiết' : 'Details'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {registeredUniversities.length === 0 && (
        <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-700 font-medium">
            {language === 'vi' ? 'Không có chi phí' : 'No costs'}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            {language === 'vi'
              ? 'Hoàn thành quá trình tư vấn để xem chi phí.'
              : 'Complete an application to view costs.'}
          </p>
        </div>
      )}
    </div>
  );
}
