import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
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
} from 'lucide-react';
import { getTrackingCode, searchTrackingCodesByEmail } from '../services/trackingCodeService';
import type { TrackingCode } from '@/types/tracking';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';

export default function MyCosts() {
  const { registrations, universities, user, studentOnboardings } = useApp();
  const { formatFrom, convertAmount } = useCurrency();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [trackingInfo, setTrackingInfo] = useState<TrackingCode | null>(null);

  useEffect(() => {
    const loadTracking = async () => {
      if (!user) return;

      if (user.trackingCode) {
        const data = await getTrackingCode(user.trackingCode);
        if (data) {
          setTrackingInfo(data);
          return;
        }
      }

      if (user.email) {
        const matches = await searchTrackingCodesByEmail(user.email);
        if (matches.length > 0) setTrackingInfo(matches[0]);
      }
    };

    loadTracking();
  }, [user]);

  const studentRegistrations = useMemo(() => {
    if (!user) return [];
    return registrations.filter(
      (reg) => reg.studentEmail === user.email
    );
  }, [registrations, user]);

  const latestOnboarding = useMemo(() => {
    if (!user) return null;
    const matches = studentOnboardings.filter((ob) => ob.email === user.email);
    if (matches.length === 0) return null;
    return matches.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))[0];
  }, [studentOnboardings, user]);

  const estimatedTotalVnd = useMemo(() => {
    if (trackingInfo?.initialTotalCostVnd) return trackingInfo.initialTotalCostVnd;
    if (latestOnboarding?.initialTotalCost) {
      return convertAmount(latestOnboarding.initialTotalCost, 'VND', 'USD');
    }
    return 0;
  }, [trackingInfo, latestOnboarding, convertAmount]);

  const registeredUniversities = useMemo(() => {
    if (studentRegistrations.length > 0) {
      return studentRegistrations
        .map((reg) => {
          const university = universities.find((uni) => uni.id === reg.universityId);
          if (!university) return null;

          const selectedFees = reg.selectedFees || {
            visa: true,
            accommodation: true,
            insurance: true,
            additional: (university.additionalFees || []).map(() => true),
          };

          const visa = selectedFees.visa ? university.visaFee : 0;
          const accommodation = selectedFees.accommodation ? university.accommodationFee : 0;
          const insurance = selectedFees.insurance ? university.insuranceFee : 0;
          const additionalTotal = (university.additionalFees || []).reduce((sum, fee, index) => {
            if (selectedFees.additional && selectedFees.additional[index]) {
              return sum + fee.amount;
            }
            return sum;
          }, 0);

          const tuition = university.generalTuition;
          const insuranceAndMisc = (insurance || 0) + additionalTotal;
          const total = (tuition || 0) + (visa || 0) + (accommodation || 0) + insuranceAndMisc;

          return {
            registrationId: `${reg.studentEmail}-${reg.universityId}`,
            trackingCode: user?.trackingCode,
            university,
            selectedFees,
            costs: { tuition, visa, accommodation, insuranceAndMisc, total },
            isEstimated: false,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
    }

    const fallbackUniversityId =
      trackingInfo?.desiredUniversityId || latestOnboarding?.desiredUniversity;
    if (!fallbackUniversityId) return [];

    const university = universities.find((uni) => uni.id === fallbackUniversityId);
    if (!university) return [];

    const baseTotal =
      (university.generalTuition || 0) +
      (university.visaFee || 0) +
      (university.accommodationFee || 0) +
      (university.insuranceFee || 0) +
      (university.additionalFees || []).reduce((sum, fee) => sum + fee.amount, 0);

    const useEstimate = baseTotal === 0 && estimatedTotalVnd > 0;

    return [
      {
        registrationId: `fallback-${fallbackUniversityId}`,
        trackingCode: user?.trackingCode || trackingInfo?.code,
        university,
        selectedFees: {
          visa: true,
          accommodation: true,
          insurance: true,
          additional: (university.additionalFees || []).map(() => true),
        },
        costs: {
          tuition: useEstimate ? estimatedTotalVnd : university.generalTuition || 0,
          visa: university.visaFee || 0,
          accommodation: university.accommodationFee || 0,
          insuranceAndMisc: (university.insuranceFee || 0) + (university.additionalFees || []).reduce((sum, fee) => sum + fee.amount, 0),
          total: useEstimate ? estimatedTotalVnd : baseTotal,
        },
        isEstimated: useEstimate,
      },
    ];
  }, [studentRegistrations, universities, user?.trackingCode, trackingInfo, latestOnboarding, estimatedTotalVnd]);

  const grandTotal = useMemo(
    () => registeredUniversities.reduce((sum, reg) => sum + reg.costs.total, 0),
    [registeredUniversities]
  );

  const budgetGoal = 500000000;
  const progressPercentage = Math.min((grandTotal / budgetGoal) * 100, 100);

  const toggleCard = (id: string) => {
    setExpandedCards((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
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
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {language === 'vi' ? 'Chi phí của tôi' : 'My Costs'}
        </h1>
        <p className="text-slate-600 mt-1">
          {language === 'vi'
            ? 'Theo dõi chi phí du học theo từng trường'
            : 'Track your study costs by university'}
        </p>
      </div>

      {registeredUniversities.length > 0 ? (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-blue-100">
          <CardHeader>
            <CardTitle className="text-base text-slate-600">
              {language === 'vi' ? 'Tổng chi phí' : 'Total Costs'}
            </CardTitle>
            <div className="text-4xl font-bold text-primary">
              {formatFrom(grandTotal, 'VND')}
            </div>
            {trackingInfo?.code && (
              <p className="text-xs text-slate-600">Tracking: {trackingInfo.code}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>{progressPercentage.toFixed(0)}% of budget</span>
              <span>{formatFrom(budgetGoal, 'VND')} goal</span>
            </div>
            <Progress value={progressPercentage} />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base">
              {language === 'vi' ? 'Chưa có đơn đăng ký' : 'No registrations yet'}
            </CardTitle>
            <CardDescription>
              {language === 'vi'
                ? 'Hoàn thành đơn tư vấn để xem chi phí ước tính.'
                : 'Complete an application to see estimated costs.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>
              <Plus />
              {language === 'vi' ? 'Bắt đầu tư vấn' : 'Start Application'}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {registeredUniversities.map((item) => {
          const isExpanded = expandedCards.includes(item.registrationId);

          return (
            <Card key={item.registrationId}>
              <button
                onClick={() => toggleCard(item.registrationId)}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.university.name}</h3>
                    <p className="text-sm text-slate-500">
                      {item.university.region || item.university.country}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {language === 'vi' ? 'Tổng cộng' : 'Total'}
                    </p>
                    <p className="text-xl font-bold text-primary">
                      {formatFrom(item.costs.total, 'VND')}
                    </p>
                    {item.isEstimated && (
                      <p className="text-[11px] text-slate-500">
                        {language === 'vi' ? 'Ước tính từ onboarding' : 'Estimated from onboarding'}
                      </p>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-600">Học phí</p>
                      <p className="font-semibold text-slate-900">
                        {formatFrom(item.costs.tuition || 0, 'VND')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Phí visa</p>
                      <p className="font-semibold text-slate-900">
                        {formatFrom(item.costs.visa || 0, 'VND')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Lưu trú</p>
                      <p className="font-semibold text-slate-900">
                        {formatFrom(item.costs.accommodation || 0, 'VND')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Bảo hiểm & khác</p>
                      <p className="font-semibold text-slate-900">
                        {formatFrom(item.costs.insuranceAndMisc || 0, 'VND')}
                      </p>
                    </div>
                  </div>

                  {item.trackingCode && (
                    <div className="rounded-lg border border-blue-200 bg-white p-3 text-xs">
                      <div className="text-slate-600">Tracking Code</div>
                      <div className="font-mono font-semibold text-primary">
                        {item.trackingCode}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => navigate(`/student/university/${item.university.id}`)}
                    className="w-full"
                  >
                    <TrendingUp />
                    {language === 'vi' ? 'Chi tiết' : 'Details'}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {registeredUniversities.length === 0 && (
        <Card className="border-dashed border-slate-300 bg-slate-50">
          <CardHeader className="items-center text-center">
            <AlertCircle className="w-10 h-10 text-slate-400" />
            <CardTitle>{language === 'vi' ? 'Không có chi phí' : 'No costs'}</CardTitle>
            <CardDescription>
              {language === 'vi'
                ? 'Hoàn thành quá trình tư vấn để xem chi phí.'
                : 'Complete an application to view costs.'}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
