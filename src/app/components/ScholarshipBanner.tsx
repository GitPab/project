import React from 'react';
import { Award, Gift, TrendingUp, ChevronRight, Sparkles, Clock, Users } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router';

interface ScholarshipBannerProps {
  variant?: 'hero' | 'inline' | 'compact';
  topikLevel?: number;
  className?: string;
}

/**
 * Marketing Banner for "Học bổng 39TR" promotion
 * Displays scholarship offer based on TOPIK level
 */
export default function ScholarshipBanner({ 
  variant = 'inline',
  topikLevel = 0,
  className = ''
}: ScholarshipBannerProps) {
  const navigate = useNavigate();

  // Determine scholarship amount based on TOPIK
  const getScholarshipInfo = (level: number) => {
    if (level >= 6) return { percent: 50, amount: '48 triệu', label: 'TOPIK 6' };
    if (level >= 5) return { percent: 40, amount: '39 triệu', label: 'TOPIK 5' };
    if (level >= 4) return { percent: 30, amount: '29 triệu', label: 'TOPIK 4' };
    if (level >= 3) return { percent: 20, amount: '19 triệu', label: 'TOPIK 3' };
    return { percent: 0, amount: '0', label: 'Chưa đủ TOPIK' };
  };

  const scholarship = getScholarshipInfo(topikLevel);

  // Hero variant - full width banner
  if (variant === 'hero') {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 rounded-2xl p-8 text-white ${className}`}>
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                CHƯƠNG TRÌNH ĐẶC BIỆT 2024
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2 font-['Be_Vietnam_Pro']">
              🎓 Học Bổng Du Học Hàn Quốc
            </h2>
            <p className="text-xl md:text-2xl font-bold text-yellow-300 mb-4">
              LÊN ĐẾN 39 TRIỆU VNĐ
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4" />
                <span>TOPIK 5: Giảm 40%</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4" />
                <span>TOPIK 6: Giảm 50%</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Có hạn - 50 suất đầu tiên</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              size="lg"
              className="bg-white text-orange-600 hover:bg-gray-100 font-bold shadow-lg"
              onClick={() => navigate('/#quick-search')}
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              ĐĂNG KÝ NGAY
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-xs text-center text-white/80">
              * Áp dụng cho học viên đăng ký trong tháng này
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Compact variant - small banner
  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-orange-800 text-sm font-['Be_Vietnam_Pro']">
              Học bổng 39TR cho TOPIK 5+
            </p>
            <p className="text-xs text-orange-700">
              Giảm 40-50% học phí • Còn 23 suất
            </p>
          </div>
          <Button 
            size="sm" 
            className="bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0"
            onClick={() => navigate('/#quick-search')}
          >
            Đăng ký
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // Inline variant - default (shown in forms, cards)
  return (
    <div className={`bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 border border-yellow-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Award className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-orange-800 font-['Be_Vietnam_Pro'] flex items-center gap-2">
            Học bổng 39TR
            <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">
              HOT
            </span>
          </h4>
          
          {topikLevel >= 5 ? (
            <div className="mt-2">
              <p className="text-sm text-orange-700">
                🎉 Chúc mừng! Với TOPIK {topikLevel}, bạn được giảm 
                <span className="font-bold text-orange-800"> {scholarship.percent}% </span>
                học phí!
              </p>
              <p className="text-lg font-bold text-orange-800 mt-1 font-['Be_Vietnam_Pro']">
                Tiết kiệm: ~{scholarship.amount} VNĐ
              </p>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-sm text-orange-700">
                Đạt TOPIK 5 để nhận học bổng 39 triệu VNĐ
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-orange-600">
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  TOPIK 3: 20%
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  TOPIK 4: 30%
                </span>
                <span className="flex items-center gap-1 font-bold">
                  <Award className="w-3 h-3" />
                  TOPIK 5: 40%
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  TOPIK 6: 50%
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-yellow-200">
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <Users className="w-3 h-3" />
              <span>Đã có 127 học viên đăng ký</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <Clock className="w-3 h-3" />
              <span>Còn 23 suất</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
