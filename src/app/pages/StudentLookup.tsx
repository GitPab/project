import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, CheckCircle2, AlertCircle, Loader, Info } from 'lucide-react';
import { toast } from 'sonner';
import { getTrackingCode } from '../services/trackingCodeService';
import { useLanguage } from '../context/LanguageContext';

/**
 * Student Lookup / Tra cứu Page
 * Public page where students can enter their tracking code to view their application status
 * URL: /student/lookup
 */
export default function StudentLookup() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error(
        language === 'vi' ? 'Vui lòng nhập mã theo dõi' :
        language === 'ko' ? '추적 코드를 입력하세요' :
        'Please enter tracking code'
      );
      return;
    }

    setLoading(true);
    try {
      const data = await getTrackingCode(code.trim());
      if (data) {
        navigate(`/student/tracking/${code.trim()}`);
      } else {
        toast.error(
          language === 'vi' ? 'Mã theo dõi không tồn tại' :
          language === 'ko' ? '추적 코드를 찾을 수 없습니다' :
          'Tracking code not found'
        );
        setCode('');
      }
    } catch (error) {
      console.error('Lookup error:', error);
      toast.error(
        language === 'vi' ? 'Lỗi khi tìm kiếm mã theo dõi' :
        language === 'ko' ? '추적 코드 검색 중 오류 발생' :
        'Error looking up tracking code'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-blue-700 rounded-2xl mb-4">
            <Search className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {language === 'vi' ? 'Tra Cứu Hồ Sơ' :
             language === 'ko' ? '신청 현황 조회' :
             'Check Application Status'}
          </h1>
          <p className="text-slate-600">
            {language === 'vi' ? 'Nhập mã theo dõi để xem trạng thái hồ sơ của bạn' :
             language === 'ko' ? '추적 코드를 입력하여 신청 현황을 확인하세요' :
             'Enter your tracking code to view your application status'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLookup} className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
          {/* Code Input */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-700">
              {language === 'vi' ? 'Mã Theo Dõi' :
               language === 'ko' ? '추적 코드' :
               'Tracking Code'}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SACMA-20260313-ABC123"
              className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono text-center"
              disabled={loading}
            />
            <p className="text-xs text-slate-500 mt-1">
              {language === 'vi' ? 'Mã có dạng: SACMA-YYYYMMDD-XXXXXX' :
               language === 'ko' ? '형식: SACMA-YYYYMMDD-XXXXXX' :
               'Format: SACMA-YYYYMMDD-XXXXXX'}
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#003AB7] to-[#558EFF] text-white py-3 rounded-xl hover:from-[#002A8F] hover:to-[#447DFF] active:from-[#001F70] active:to-[#003580] transition-all duration-200 font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:shadow-inner"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                {language === 'vi' ? 'Đang tìm kiếm...' :
                 language === 'ko' ? '검색 중...' :
                 'Searching...'}
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                {language === 'vi' ? 'Tra Cứu' :
                 language === 'ko' ? '조회' :
                 'Lookup'}
              </>
            )}
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <div className="flex gap-2 items-start">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              {language === 'vi' ? (
                <>
                  <p className="font-semibold mb-1">Cần giúp đỡ?</p>
                  <p>Mã theo dõi được gửi khi bạn hoàn tất đơn tư vấn. Kiểm tra email hoặc tin nhắn của bạn.</p>
                </>
              ) : language === 'ko' ? (
                <>
                  <p className="font-semibold mb-1">도움이 필요하신가요?</p>
                  <p>추적 코드는 상담 신청 후 이메일 또는 문자로 전송됩니다.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold mb-1">Need help?</p>
                  <p>Your tracking code was sent via email when you submitted your application.</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-slate-600 hover:text-primary transition-colors underline"
          >
            {language === 'vi' ? '← Quay lại trang chủ' :
             language === 'ko' ? '← 홈으로 돌아가기' :
             '← Back to home'}
          </button>
        </div>
      </div>
    </div>
  );
}
