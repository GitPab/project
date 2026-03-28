import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
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
  FileText,
  CheckCircle,
} from 'lucide-react';
import { getTrackingCode, searchTrackingCodesByEmail } from '../services/trackingCodeService';
import type { TrackingCode } from '@/types/tracking';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';

export default function MyCosts() {
  const { registrations, universities, user, studentOnboardings } = useApp();
  const { formatFrom, convertAmount } = useCurrency();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [trackingInfo, setTrackingInfo] = useState<TrackingCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get tracking code from URL query param or user context
  const urlTrackingCode = searchParams.get('code');

  useEffect(() => {
    const loadTracking = async () => {
      setIsLoading(true);
      try {
        // First check URL query param (from StudentLookup redirect)
        if (urlTrackingCode) {
          const data = await getTrackingCode(urlTrackingCode);
          if (data) {
            setTrackingInfo(data);
            setIsLoading(false);
            return;
          }
        }

        // Then check user context
        if (!user) {
          setIsLoading(false);
          return;
        }

        if (user.trackingCode) {
          const data = await getTrackingCode(user.trackingCode);
          if (data) {
            setTrackingInfo(data);
            setIsLoading(false);
            return;
          }
        }

        if (user.email) {
          const matches = await searchTrackingCodesByEmail(user.email);
          if (matches.length > 0) setTrackingInfo(matches[0]);
        }
      } catch (error) {
        console.error('Error loading tracking info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTracking();
  }, [user, urlTrackingCode]);

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
      return convertAmount(latestOnboarding.initialTotalCost, 'VND', 'VND');
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

  // Generate estimated costs for all universities when no tracking code exists
  const estimatedUniversities = useMemo(() => {
    // If we have registered universities from tracking, use those
    if (registeredUniversities.length > 0) return [];
    
    // Otherwise, show estimates for all Korean universities
    return universities
      .filter(u => u.koreanData?.isKoreanUniversity)
      .map(uni => {
        const baseTotal =
          (uni.generalTuition || 0) +
          (uni.visaFee || 0) +
          (uni.accommodationFee || 0) +
          (uni.insuranceFee || 0) +
          (uni.additionalFees || []).reduce((sum, fee) => sum + fee.amount, 0);

        return {
          registrationId: `estimate-${uni.id}`,
          trackingCode: undefined as string | undefined,
          university: uni,
          selectedFees: {
            visa: true,
            accommodation: true,
            insurance: true,
            additional: (uni.additionalFees || []).map(() => true),
          },
          costs: {
            tuition: uni.generalTuition || baseTotal * 0.6,
            visa: uni.visaFee || baseTotal * 0.1,
            accommodation: uni.accommodationFee || baseTotal * 0.15,
            insuranceAndMisc: (uni.insuranceFee || 0) + (uni.additionalFees || []).reduce((sum, fee) => sum + fee.amount, 0) || baseTotal * 0.15,
            total: baseTotal || 150000000,
          },
          isEstimated: true,
        };
      });
  }, [registeredUniversities, universities]);

  const displayUniversities = registeredUniversities.length > 0 ? registeredUniversities : estimatedUniversities;
  const displayTotal = displayUniversities.reduce((sum, reg) => sum + reg.costs.total, 0);

  const budgetGoal = 500000000;

  const toggleCard = (id: string) => {
    setExpandedCards((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-slate-600">Đang tải...</span>
        </div>
      </div>
    );
  }

  // Allow access for all users (logged-in students see personalized, others see estimates)
  const isLoggedInStudent = user && user.role === 'student';
  const hasValidTracking = !!trackingInfo;
  const isGuestWithTracking = urlTrackingCode && hasValidTracking;

  // Block only admins (students and guests can view)
  if (user?.role === 'admin') {
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

      {displayUniversities.length > 0 ? (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-blue-100">
          <CardHeader>
            <CardTitle className="text-base text-slate-600">
              {language === 'vi' ? 'Tổng chi phí ước tính' : 'Estimated Total Costs'}
            </CardTitle>
            <div className="text-4xl font-bold text-primary">
              {formatFrom(displayTotal, 'VND')}
            </div>
            {trackingInfo?.code && (
              <p className="text-xs text-slate-600">Tracking: {trackingInfo.code}</p>
            )}
            {!trackingInfo && (
              <p className="text-xs text-amber-600">
                {language === 'vi' ? 'Chi phí ước tính - có thể thay đổi tùy theo lựa chọn' : 'Estimated costs - may vary based on selections'}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>{Math.min((displayTotal / budgetGoal) * 100, 100).toFixed(0)}% of budget</span>
              <span>{formatFrom(budgetGoal, 'VND')} goal</span>
            </div>
            <Progress value={Math.min((displayTotal / budgetGoal) * 100, 100)} />
          </CardContent>
        </Card>
      ) : null}

      {/* Hồ sơ / Application Status Section */}
      {trackingInfo && (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-base text-slate-700">
                {language === 'vi' ? 'Hồ sơ đăng ký' : 'Application Status'}
              </CardTitle>
            </div>
            
            {/* Tracking Code */}
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="font-mono text-sm">
                {trackingInfo.code}
              </Badge>
              {trackingInfo.status && (
                <Badge 
                  className={
                    trackingInfo.status === 'approved' ? 'bg-green-100 text-green-700' :
                    trackingInfo.status === 'in-review' ? 'bg-blue-100 text-blue-700' :
                    trackingInfo.status === 'contacted' ? 'bg-purple-100 text-purple-700' :
                    'bg-amber-100 text-amber-700'
                  }
                >
                  {trackingInfo.status === 'pending' && (language === 'vi' ? 'Đang chờ' : 'Pending')}
                  {trackingInfo.status === 'in-review' && (language === 'vi' ? 'Đang xem xét' : 'In Review')}
                  {trackingInfo.status === 'approved' && (language === 'vi' ? 'Đã duyệt' : 'Approved')}
                  {trackingInfo.status === 'contacted' && (language === 'vi' ? 'Đã liên hệ' : 'Contacted')}
                </Badge>
              )}
            </div>

            {/* Total Cost */}
            {trackingInfo.initialTotalCostVnd > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">
                    {language === 'vi' ? 'Tổng chi phí:' : 'Total Cost:'}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {formatFrom(trackingInfo.initialTotalCostVnd, 'VND')}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {language === 'vi' ? 'Bao gồm: Học phí, phí visa, chỗ ở, bảo hiểm' : 'Includes: Tuition, visa, accommodation, insurance'}
                </div>
              </div>
            )}

            {/* Student Info */}
            <div className="space-y-2 text-sm">
              {trackingInfo.studentName && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{language === 'vi' ? 'Họ tên:' : 'Name:'}</span>
                  <span className="font-medium text-slate-800">{trackingInfo.studentName}</span>
                </div>
              )}
              {trackingInfo.studentPhone && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{language === 'vi' ? 'SĐT:' : 'Phone:'}</span>
                  <span className="font-medium text-slate-800">{trackingInfo.studentPhone}</span>
                </div>
              )}
              {trackingInfo.studentEmail && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-medium text-slate-800">{trackingInfo.studentEmail}</span>
                </div>
              )}
            </div>

            {/* Visa & University Info */}
            <div className="mt-4 pt-4 border-t border-blue-200 space-y-2">
              {trackingInfo.desiredUniversityName && (
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">{language === 'vi' ? 'Trường:' : 'University:'}</span>
                  <span className="font-medium text-slate-800">{trackingInfo.desiredUniversityName}</span>
                </div>
              )}
              {trackingInfo.visaSystem && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{language === 'vi' ? 'Hệ visa:' : 'Visa System:'}</span>
                  <Badge variant="secondary">{trackingInfo.visaSystem}</Badge>
                </div>
              )}
              {(trackingInfo.topikLevel || trackingInfo.ieltsScore) && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{language === 'vi' ? 'Chứng chỉ:' : 'Certificates:'}</span>
                  {trackingInfo.topikLevel && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      TOPIK {trackingInfo.topikLevel}
                    </Badge>
                  )}
                  {trackingInfo.ieltsScore && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      IELTS {trackingInfo.ieltsScore}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            {trackingInfo.notes && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-slate-500">{language === 'vi' ? 'Ghi chú:' : 'Notes:'}</p>
                <p className="text-sm text-slate-700 mt-1">{trackingInfo.notes}</p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>{language === 'vi' 
                ? `Đăng ký thành công: ${new Date(trackingInfo.createdAt || Date.now()).toLocaleDateString('vi-VN')}`
                : `Registered: ${new Date(trackingInfo.createdAt || Date.now()).toLocaleDateString()}`
              }</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!registeredUniversities.length && !trackingInfo && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base">
              {language === 'vi' ? 'Chi phí ước tính' : 'Estimated Costs'}
            </CardTitle>
            <CardDescription>
              {language === 'vi'
                ? 'Dưới đây là chi phí ước tính cho các trường. Hoàn thành đơn tư vấn để nhận báo giá chính xác.'
                : 'Below are estimated costs for universities. Complete consultation for accurate pricing.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/student/onboarding')}>
              <Plus />
              {language === 'vi' ? 'Đăng ký tư vấn ngay' : 'Register for Consultation'}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {displayUniversities.map((item) => {
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

      {displayUniversities.length === 0 && (
        <Card className="border-dashed border-slate-300 bg-slate-50">
          <CardHeader className="items-center text-center">
            <AlertCircle className="w-10 h-10 text-slate-400" />
            <CardTitle>{language === 'vi' ? 'Không có chi phí' : 'No costs'}</CardTitle>
            <CardDescription>
              {language === 'vi'
                ? 'Không tìm thấy thông tin chi phí cho các trường.'
                : 'No cost information found for universities.'}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
