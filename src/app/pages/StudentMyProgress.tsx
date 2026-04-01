import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { searchTrackingCodesByEmail } from '../services/trackingCodeService';
import { 
  TrendingUp, CheckCircle2, Circle, Clock, GraduationCap, 
  FileText, Calendar, AlertCircle, ChevronRight, School
} from 'lucide-react';

interface ProgressStage {
  id: number;
  name: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  date?: string;
}

export default function StudentMyProgress() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('Học viên');
  const [overallProgress, setOverallProgress] = useState(0);
  const [stages, setStages] = useState<ProgressStage[]>([
    { id: 1, name: 'Đăng ký tư vấn', description: 'Hoàn thành đơn đăng ký tư vấn', status: 'completed', date: '2025-01-15' },
    { id: 2, name: 'Tư vấn & đánh giá', description: 'Tư vấn và đánh giá hồ sơ', status: 'in-progress', date: '2025-01-20' },
    { id: 3, name: 'Chuẩn bị hồ sơ', description: 'Chuẩn bị giấy tờ cần thiết', status: 'pending' },
    { id: 4, name: 'Nộp hồ sơ trường', description: 'Nộp hồ sơ vào trường', status: 'pending' },
    { id: 5, name: 'Nhận thư mời (COE)', description: 'Nhận chứng nhận nhập học', status: 'pending' },
    { id: 6, name: 'Xin visa', description: 'Nộp hồ sơ xin visa', status: 'pending' },
    { id: 7, name: 'Nhận visa', description: 'Nhận visa du học', status: 'pending' },
    { id: 8, name: 'Chuẩn bị lên đường', description: 'Chuẩn bị bay sang Hàn Quốc', status: 'pending' },
  ]);

  useEffect(() => {
    const loadProgress = async () => {
      if (user?.email) {
        try {
          const codes = await searchTrackingCodesByEmail(user.email);
          if (codes.length > 0) {
            const code = codes[0];
            setStudentName(code.studentName || 'Học viên');
            
            // Calculate progress based on status
            const statusProgress: Record<string, number> = {
              'pending': 25,
              'processing': 50,
              'interview': 60,
              'coe_received': 75,
              'visa_applied': 85,
              'visa_received': 95,
              'ready': 100,
              'completed': 100
            };
            const progress = statusProgress[code.status] || 25;
            setOverallProgress(progress);
            
            // Update stages based on progress
            const completedCount = Math.floor((progress / 100) * 8);
            setStages(prev => prev.map((stage, idx) => ({
              ...stage,
              status: idx < completedCount ? 'completed' : 
                      idx === completedCount ? 'in-progress' : 'pending'
            })));
          }
        } catch (error) {
          console.error('Failed to load progress:', error);
        }
      }
      setLoading(false);
    };
    
    loadProgress();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-6 h-6 text-blue-500" />;
      default:
        return <Circle className="w-6 h-6 text-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'in-progress':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Tiến trình của {studentName}
        </h1>
        <p className="text-gray-600">
          Theo dõi tiến độ hồ sơ du học của bạn
        </p>
      </div>

      {/* Overall Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Tổng tiến độ</h2>
              <p className="text-sm text-gray-500">Hoàn thành {overallProgress}%</p>
            </div>
          </div>
          <span className="text-3xl font-bold text-blue-600">{overallProgress}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          Các giai đoạn xử lý
        </h2>
        
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div 
              key={stage.id}
              className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${getStatusColor(stage.status)}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(stage.status)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-800">
                    {index + 1}. {stage.name}
                  </h3>
                  {stage.status === 'completed' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Hoàn thành
                    </span>
                  )}
                  {stage.status === 'in-progress' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      Đang xử lý
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{stage.description}</p>
                {stage.date && stage.status === 'completed' && (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Hoàn thành: {new Date(stage.date).toLocaleDateString('vi-VN')}
                  </p>
                )}
              </div>
              
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-amber-800">Lưu ý</h4>
          <p className="text-sm text-amber-700 mt-1">
            Tiến độ được cập nhật tự động khi có thay đổi từ phía trường và cơ quan xét duyệt. 
            Vui lòng liên hệ tư vấn viên nếu cần hỗ trợ.
          </p>
        </div>
      </div>
    </div>
  );
}
