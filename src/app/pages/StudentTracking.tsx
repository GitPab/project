import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Copy, Check, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getTrackingCode } from '../services/trackingCodeService';
import type { TrackingCode } from '@/types/tracking';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';

export default function StudentTracking() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { format } = useCurrency();
  const { language } = useLanguage();
  const [trackingData, setTrackingData] = useState<TrackingCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadTrackingCode = async () => {
      if (!code) {
        setLoading(false);
        return;
      }

      try {
        const data = await getTrackingCode(code);
        if (data) {
          setTrackingData(data);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading tracking code:', error);
        setLoading(false);
      }
    };

    loadTrackingCode();
  }, [code]);

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusLabels = {
      pending: { vi: 'Chờ xử lý', ko: '대기 중', en: 'Pending' },
      'in-review': { vi: 'Đang xem xét', ko: '검토 중', en: 'In Review' },
      approved: { vi: 'Được duyệt', ko: '승인됨', en: 'Approved' },
      contacted: { vi: 'Đã liên hệ', ko: '연락됨', en: 'Contacted' }
    };
    const labels = statusLabels[status as keyof typeof statusLabels] || { vi: 'Không xác định', ko: '알 수 없음', en: 'Unknown' };
    return language === 'vi' ? labels.vi : language === 'ko' ? labels.ko : labels.en;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'in-review': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'approved': return 'bg-green-50 border-green-200 text-white';
      case 'contacted': return 'bg-purple-50 border-purple-200 text-purple-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-lg font-bold text-slate-900">
            {language === 'vi' ? 'Theo dõi hồ sơ' : language === 'ko' ? '신청서 추적' : 'Track Application'}
          </h1>
          <div className="w-12"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
            <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-r-primary mb-4"></div>
            <p className="text-slate-600">
              {language === 'vi' ? 'Đang tải...' : language === 'ko' ? '로딩 중...' : 'Loading...'}
            </p>
          </div>
        ) : !trackingData ? (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">
                  {language === 'vi' ? 'Không tìm thấy' : language === 'ko' ? '찾을 수 없음' : 'Not Found'}
                </h2>
                <p className="text-slate-600 mb-4">
                  {language === 'vi'
                    ? 'Mã theo dõi không tồn tại hoặc không hợp lệ. Vui lòng kiểm tra lại mã của bạn.'
                    : language === 'ko'
                    ? '추적 코드가 존재하지 않거나 유효하지 않습니다. 코드를 확인해주세요.'
                    : 'The tracking code does not exist or is invalid. Please check your code.'}
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 bg-white text-[#003AB7] border border-[#003AB7] rounded-lg hover:bg-[#003AB7] hover:text-white active:bg-[#002A8F] active:text-white transition-all duration-200 shadow-sm hover:shadow-md active:shadow-inner"
                >
                  {language === 'vi' ? 'Quay lại' : language === 'ko' ? '돌아가기' : 'Go Back'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Header */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-6 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {language === 'vi' ? 'Thông tin khái quát của bạn' : language === 'ko' ? '요약 정보' : 'Your Overview'}
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{trackingData.studentName}</h2>
                    <p className="text-slate-700">{trackingData.studentPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 mb-1">{language === 'vi' ? 'Mã theo dõi' : language === 'ko' ? '추적 코드' : 'Tracking Code'}</p>
                    <p className="font-mono font-semibold text-lg text-primary">{code}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Code Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-6">
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
                {language === 'vi' ? 'Mã theo dõi' : language === 'ko' ? '추적 코드' : 'Tracking Code'}
              </h2>
              <div className="flex items-center gap-3 mb-4">
                <code className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 font-mono text-lg text-slate-900 font-semibold">
                  {code}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="flex-shrink-0 p-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  title={language === 'vi' ? 'Sao chép' : language === 'ko' ? '복사' : 'Copy'}
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <Copy className="w-5 h-5 text-slate-600" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {language === 'vi'
                  ? 'Sử dụng mã này để theo dõi hồ sơ của bạn'
                  : language === 'ko'
                  ? '이 코드를 사용하여 신청서를 추적하세요'
                  : 'Use this code to track your application'}
              </p>
            </div>

            {/* Success Message */}
            <div className="bg-green-50 rounded-2xl shadow-lg border border-green-200 p-6 mb-6 flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-white flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-bold text-white mb-2">
                  {language === 'vi' ? 'Đăng ký thành công!' : language === 'ko' ? '등록 완료!' : 'Registration Complete!'}
                </h2>
                <p className="text-sm text-white">
                  {language === 'vi'
                    ? 'Cảm ơn bạn đã đăng ký. Chúng tôi sẽ xem xét hồ sơ của bạn và liên hệ với bạn sớm.'
                    : language === 'ko'
                    ? '등록해주셔서 감사합니다. 곧 신청서를 검토하고 연락드리겠습니다.'
                    : 'Thank you for registering. We will review your application and contact you shortly.'}
                </p>
              </div>
            </div>

            {/* Application Status */}
            <div className={`rounded-2xl shadow-lg border p-6 mb-6 ${getStatusColor(trackingData.status)}`}>
              <div className="flex items-center gap-3 mb-2">
                <Info className="w-5 h-5" />
                <h3 className="font-semibold">
                  {language === 'vi' ? 'Trạng thái hồ sơ' : language === 'ko' ? '신청 상태' : 'Application Status'}
                </h3>
              </div>
              <p className="text-lg font-bold">{getStatusLabel(trackingData.status)}</p>
              {trackingData.notes && (
                <p className="text-sm opacity-75 mt-2">{trackingData.notes}</p>
              )}
            </div>

            {/* Student Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-6">
                {language === 'vi' ? 'Thông tin cá nhân' : language === 'ko' ? '개인정보' : 'Personal Information'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">
                    {language === 'vi' ? 'Họ tên' : language === 'ko' ? '이름' : 'Name'}
                  </p>
                  <p className="text-lg text-slate-900">{trackingData.studentName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">
                    {language === 'vi' ? 'Email' : 'Email'}
                  </p>
                  <p className="text-lg text-slate-900">{trackingData.studentEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">
                    {language === 'vi' ? 'Số điện thoại' : language === 'ko' ? '전화번호' : 'Phone'}
                  </p>
                  <p className="text-lg text-slate-900">{trackingData.studentPhone}</p>
                </div>
              </div>
            </div>

            {/* University & Program Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-6">
                {language === 'vi' ? 'Thông tin trường đại học' : language === 'ko' ? '대학교 정보' : 'University Information'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">
                    {language === 'vi' ? 'Trường đại học' : language === 'ko' ? '대학교' : 'University'}
                  </p>
                  <p className="text-lg text-slate-900">{trackingData.desiredUniversityName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">
                    {language === 'vi' ? 'Hệ thống visa' : language === 'ko' ? '비자 시스템' : 'Visa System'}
                  </p>
                  <p className="text-lg text-slate-900">{trackingData.visaSystem}</p>
                </div>
                {trackingData.topikLevel && (
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mb-1">
                      {language === 'vi' ? 'Cấp độ TOPIK' : language === 'ko' ? 'TOPIK 레벨' : 'TOPIK Level'}
                    </p>
                    <p className="text-lg text-slate-900">TOPIK {trackingData.topikLevel}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Estimated Cost */}
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-2">
                {language === 'vi' ? 'Chi phí ước tính' : language === 'ko' ? '예상 비용' : 'Estimated Cost'}
              </h2>
              <p className="text-3xl font-bold text-primary mb-2">
                {format(trackingData.initialTotalCostVnd)}
              </p>
              <p className="text-sm text-blue-700">
                {language === 'vi'
                  ? 'Mục tiêu tính toán dựa trên hệ thống visa và các lựa chọn được chọn'
                  : language === 'ko'
                  ? '선택한 비자 시스템 및 옵션을 기반으로 한 예상 비용입니다'
                  : 'Estimated based on selected visa system and options'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
