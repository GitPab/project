import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { User, Phone, GraduationCap, Award, Calculator, Wallet, TrendingUp, ChevronRight, X, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { getTrackingCode, searchTrackingCodesByEmail } from '../services/trackingCodeService';

interface StudentFixedSidebarProps {
  universityId?: string;
  currentCost?: number;
  className?: string;
}

export default function StudentFixedSidebar({ universityId, currentCost = 0, className = '' }: StudentFixedSidebarProps) {
  const navigate = useNavigate();
  const { user, universities } = useApp();
  const { formatFrom, convertAmount } = useCurrency();
  const { language } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    phone: '',
    visaSystem: 'D4-1',
    topikLevel: 0,
    gpa: 0,
    email: ''
  });
  const [trackingInfo, setTrackingInfo] = useState<any>(null);

  // Load student data from tracking code or user context
  useEffect(() => {
    const loadStudentData = async () => {
      // Try session storage first (from quick search)
      const quickSearch = sessionStorage.getItem('quickSearch');
      if (quickSearch) {
        const data = JSON.parse(quickSearch);
        setStudentInfo({
          name: data.fullName || '',
          phone: data.phone || '',
          visaSystem: data.visaSystem || 'D4-1',
          topikLevel: data.topik || 0,
          gpa: parseFloat(data.gpa) || 0,
          email: ''
        });
      }

      // If logged in, try to get more data
      if (user?.email) {
        try {
          const codes = await searchTrackingCodesByEmail(user.email);
          if (codes.length > 0) {
            setTrackingInfo(codes[0]);
            setStudentInfo(prev => ({
              ...prev,
              name: codes[0].studentName || user.name || prev.name,
              phone: codes[0].studentPhone || user.phone || prev.phone,
              visaSystem: codes[0].visaSystem || prev.visaSystem,
              email: user.email
            }));
          }
        } catch (err) {
          console.error('Error loading tracking info:', err);
        }
      }
    };

    loadStudentData();
  }, [user]);

  // Get current university
  const university = useMemo(() => {
    return universities.find(u => u.id === universityId);
  }, [universities, universityId]);

  // Calculate scholarship based on TOPIK
  const scholarshipInfo = useMemo(() => {
    if (studentInfo.topikLevel >= 6) {
      return { percent: 50, amount: currentCost * 0.5, label: 'TOPIK 6 - Giảm 50%' };
    }
    if (studentInfo.topikLevel >= 5) {
      return { percent: 40, amount: currentCost * 0.4, label: 'TOPIK 5 - Giảm 40%' };
    }
    if (studentInfo.topikLevel >= 4) {
      return { percent: 30, amount: currentCost * 0.3, label: 'TOPIK 4 - Giảm 30%' };
    }
    if (studentInfo.topikLevel >= 3) {
      return { percent: 20, amount: currentCost * 0.2, label: 'TOPIK 3 - Giảm 20%' };
    }
    return { percent: 0, amount: 0, label: 'Không đủ điều kiện học bổng' };
  }, [studentInfo.topikLevel, currentCost]);

  // Calculate final cost
  const finalCost = useMemo(() => {
    return Math.max(0, currentCost - scholarshipInfo.amount);
  }, [currentCost, scholarshipInfo.amount]);

  // Check visa system availability
  const visaAvailable = useMemo(() => {
    if (!university || !studentInfo.visaSystem) return false;
    return university.koreanData?.visaSystemsDetail?.[studentInfo.visaSystem]?.available || false;
  }, [university, studentInfo.visaSystem]);

  if (isCollapsed) {
    return (
      <>
        {/* Desktop collapsed button */}
        <button
          onClick={() => setIsCollapsed(false)}
          className="hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 z-40 bg-[#003AB7] text-white p-3 rounded-l-xl shadow-lg hover:bg-[#002A8F] transition-all"
        >
          <Menu className="w-5 h-5" />
          <span className="ml-2 text-sm font-medium">Học viên</span>
        </button>

        {/* Mobile toggle button */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden fixed right-0 bottom-20 z-40 bg-[#003AB7] text-white p-3 rounded-l-xl shadow-lg"
        >
          <User className="w-5 h-5" />
        </button>
      </>
    );
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden md:block fixed right-0 top-0 h-screen w-80 bg-white border-l-2 border-[#558EFF] shadow-2xl z-40 overflow-y-auto ${className}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#003AB7] to-[#558EFF] text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="font-bold font-['Be_Vietnam_Pro']">Thông tin học viên</span>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Student Info Card */}
          <Card className="border-[#558EFF]/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 bg-[#003AB7]/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-[#003AB7]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#003AB7] truncate font-['Be_Vietnam_Pro']">
                    {studentInfo.name || 'Chưa nhập tên'}
                  </p>
                  {studentInfo.phone && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {studentInfo.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Academic Info */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-[#F8F9FA] rounded-lg p-2">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    Hệ visa
                  </p>
                  <p className="font-medium text-[#003AB7] font-['Be_Vietnam_Pro']">
                    {studentInfo.visaSystem}
                  </p>
                  {!visaAvailable && universityId && (
                    <p className="text-[10px] text-red-500 mt-1">Trường chưa có hệ này</p>
                  )}
                </div>
                <div className="bg-[#F8F9FA] rounded-lg p-2">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    TOPIK
                  </p>
                  <p className={`font-medium font-['Be_Vietnam_Pro'] ${studentInfo.topikLevel >= 5 ? 'text-green-600' : 'text-[#003AB7]'}`}>
                    {studentInfo.topikLevel > 0 ? `Level ${studentInfo.topikLevel}` : 'Chưa có'}
                  </p>
                </div>
              </div>

              {studentInfo.gpa > 0 && (
                <div className="bg-[#F8F9FA] rounded-lg p-2">
                  <p className="text-xs text-gray-500 mb-1">GPA</p>
                  <p className="font-medium text-[#003AB7] font-['Be_Vietnam_Pro']">{studentInfo.gpa}/4.0</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost Calculation Card */}
          <Card className="border-[#558EFF]/30 bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-[#003AB7] font-['Be_Vietnam_Pro']">
                <Calculator className="w-4 h-4" />
                Tính toán chi phí
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {/* Base Cost */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Chi phí gốc:</span>
                <span className="font-medium font-['Be_Vietnam_Pro']">
                  {formatFrom(currentCost, 'VND')}
                </span>
              </div>

              {/* Scholarship */}
              {scholarshipInfo.percent > 0 && (
                <div className="flex items-center justify-between text-sm bg-green-50 p-2 rounded-lg">
                  <span className="text-green-700 flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    Học bổng {scholarshipInfo.percent}%:
                  </span>
                  <span className="font-bold text-green-700 font-['Be_Vietnam_Pro']">
                    -{formatFrom(scholarshipInfo.amount, 'VND')}
                  </span>
                </div>
              )}

              {scholarshipInfo.percent === 0 && studentInfo.topikLevel > 0 && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  TOPIK {studentInfo.topikLevel} chưa đủ điều kiện học bổng. 
                  Cần TOPIK 4+ để được giảm 20%+.
                </div>
              )}

              {/* Final Cost */}
              <div className="pt-2 border-t-2 border-[#558EFF]/30">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#003AB7] flex items-center gap-1">
                    <Wallet className="w-4 h-4" />
                    Chi phí thực tế:
                  </span>
                  <span className="text-xl font-bold text-[#003AB7] font-['Be_Vietnam_Pro']">
                    {formatFrom(finalCost, 'VND')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">
                  Tiết kiệm: {formatFrom(scholarshipInfo.amount, 'VND')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Scholarship Banner */}
          {studentInfo.topikLevel >= 5 && (
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-5 h-5 text-orange-600" />
                <span className="font-bold text-orange-800 text-sm font-['Be_Vietnam_Pro']">
                  Học bổng 39TR!
                </span>
              </div>
              <p className="text-xs text-orange-700">
                Với TOPIK {studentInfo.topikLevel}, bạn được giảm {scholarshipInfo.percent}% học phí 
                (~{formatFrom(scholarshipInfo.amount, 'VND')})
              </p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button 
              className="w-full bg-[#003AB7] hover:bg-[#002A8F] text-white"
              onClick={() => navigate('/register')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Đăng ký tư vấn
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            
            {!studentInfo.name && (
              <p className="text-xs text-center text-gray-500">
                Nhập thông tin ở form tra cứu để xem chi tiết
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <>
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="md:hidden fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto">
            {/* Same content as desktop but with close button */}
            <div className="bg-gradient-to-r from-[#003AB7] to-[#558EFF] text-white p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold font-['Be_Vietnam_Pro']">Thông tin học viên</span>
                <button onClick={() => setIsMobileOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* Same card content... */}
              <Card className="border-[#558EFF]/30">
                <CardContent className="p-4">
                  <p className="font-bold text-[#003AB7] mb-2">{studentInfo.name || 'Chưa nhập'}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-500">Visa</p>
                      <p className="font-medium">{studentInfo.visaSystem}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-500">TOPIK</p>
                      <p className={`font-medium ${studentInfo.topikLevel >= 5 ? 'text-green-600' : ''}`}>
                        {studentInfo.topikLevel > 0 ? studentInfo.topikLevel : 'Chưa có'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#558EFF]/30">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-2">Chi phí ước tính:</p>
                  <p className="text-2xl font-bold text-[#003AB7] font-['Be_Vietnam_Pro']">
                    {formatFrom(finalCost, 'VND')}
                  </p>
                  {scholarshipInfo.percent > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      Giảm {scholarshipInfo.percent}% ({formatFrom(scholarshipInfo.amount, 'VND')})
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  );
}
