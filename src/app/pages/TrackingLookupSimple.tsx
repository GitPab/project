import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Search, ArrowLeft, GraduationCap, Phone, User, Award, Wallet, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

/**
 * Simple Tracking Code Lookup - No login required
 * Students can enter their tracking code to view their application status
 */
export default function TrackingLookupSimple() {
  const navigate = useNavigate();
  const { code: urlCode } = useParams();
  const [trackingCode, setTrackingCode] = useState(urlCode || '');
  const [isLoading, setIsLoading] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) {
      toast.error('Vui lòng nhập mã tra cứu');
      return;
    }

    setIsLoading(true);

    try {
      // Call backend API
      const response = await fetch(`/api/public/tracking/${trackingCode}`);
      
      if (response.ok) {
        const data = await response.json();
        setStudentData(data);
        toast.success('Tìm thấy thông tin!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Không tìm thấy mã tra cứu');
      }
    } catch (error) {
      console.error('Tracking lookup error:', error);
      toast.error('Lỗi kết nối server. Vui lòng thử lại.');
      
      // Fallback: mock data for development
      const mockData = {
        code: trackingCode,
        name: 'Nguyễn Văn A',
        phone: '0987654321',
        university: 'Seoul National University',
        visaSystem: 'D2-2',
        topikLevel: 5,
        status: 'processing',
        submittedAt: '2024-01-15',
        estimatedCost: 45000000,
        scholarship: '40% (39 triệu VNĐ)',
        nextStep: 'Chờ phỏng vấn visa',
        timeline: [
          { step: 'Đăng ký tư vấn', date: '15/01/2024', status: 'completed' },
          { step: 'Nộp hồ sơ', date: '20/01/2024', status: 'completed' },
          { step: 'Xét duyệt hồ sơ', date: '25/01/2024', status: 'in_progress' },
          { step: 'Phỏng vấn visa', date: 'Chờ lịch', status: 'pending' },
        ]
      };
      setStudentData(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-gray-500 bg-gray-50';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'in_progress': return 'Đang xử lý';
      case 'pending': return 'Chờ xử lý';
      default: return status;
    }
  };

  if (studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#003AB7] to-[#558EFF] p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white hover:text-white/80"
            >
              <ArrowLeft className="w-5 h-5" />
              Về trang chủ
            </button>
            <button
              onClick={() => { setStudentData(null); setTrackingCode(''); }}
              className="text-white hover:text-white/80 text-sm"
            >
              Tra cứu khác
            </button>
          </div>

          {/* Student Info Card */}
          <Card className="mb-4">
            <CardHeader className="bg-gradient-to-r from-[#003AB7] to-[#558EFF] text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-white font-['Be_Vietnam_Pro']">{studentData.name}</CardTitle>
                  <p className="text-white/80 text-sm">Mã: {studentData.code}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{studentData.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Đăng ký: {studentData.submittedAt}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-5 h-5 text-[#003AB7]" />
                  <span className="font-medium">{studentData.university}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Hệ: {studentData.visaSystem}</span>
                  <span>TOPIK: {studentData.topikLevel}</span>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-3 flex items-center gap-3">
                <Award className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Học bổng: {studentData.scholarship}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
                <Wallet className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Chi phí ước tính:</p>
                  <p className="font-bold text-blue-800 font-['Be_Vietnam_Pro']">
                    {studentData.estimatedCost.toLocaleString('vi-VN')} VNĐ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-['Be_Vietnam_Pro']">Tiến độ hồ sơ</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {studentData.timeline.map((item: any, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.status === 'completed' ? 'bg-green-500 text-white' :
                      item.status === 'in_progress' ? 'bg-blue-500 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {item.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="text-sm">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{item.step}</p>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(item.status)}`}>
                          {getStatusText(item.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <div className="mt-6 text-center text-white/80 text-sm">
            <p>Cần hỗ trợ? Gọi ngay: <a href="tel:1900xxxx" className="text-white font-bold">1900 xxxx</a></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003AB7] to-[#558EFF] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white hover:text-white/80 mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Về trang chủ
        </button>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#003AB7] to-[#558EFF] rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#003AB7] font-['Be_Vietnam_Pro']">
              Tra cứu hồ sơ
            </h1>
            <p className="text-gray-500 mt-2">
              Nhập mã tra cứu để xem tiến độ hồ sơ du học
            </p>
          </div>

          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã tra cứu
              </label>
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003AB7] focus:border-transparent font-mono uppercase"
                  placeholder="VD: SAC2024001"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Mã được gửi qua SMS khi bạn đăng ký tư vấn
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#003AB7] hover:bg-[#002A8F] text-white py-3 rounded-lg font-bold"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Tra cứu
                </>
              )}
            </Button>
          </form>

          {/* Help */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Chưa có mã?</strong> Hãy đăng ký tư vấn trên trang chủ để nhận mã tra cứu và theo dõi tiến độ hồ sơ của bạn.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-8">
          © 2024 SACMA - Hệ thống du học Hàn Quốc
        </p>
      </div>
    </div>
  );
}
