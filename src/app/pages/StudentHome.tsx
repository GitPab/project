import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, CheckCircle, Lock, Search, Star, UserPlus, GraduationCap, FileText, ArrowRight } from 'lucide-react';
import StudentInfoSidebar from '../components/StudentInfoSidebar';
import { searchTrackingCodesByEmail, getTrackingCode } from '../services/trackingCodeService';
import { getStudentProgress, getPayments } from '../services/sqliteDatabase';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function StudentHome() {
  const { universities, registrations, user } = useApp();
  const { language } = useLanguage();
  const { formatFrom } = useCurrency();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [trackingCodeInput, setTrackingCodeInput] = React.useState('');
  const [isLookingUp, setIsLookingUp] = React.useState(false);
  const itemsPerPage = 12;

  // Handle tracking code lookup
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingCodeInput.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập mã theo dõi' : 'Please enter tracking code');
      return;
    }

    setIsLookingUp(true);
    try {
      const data = await getTrackingCode(trackingCodeInput.trim());
      if (data) {
        // Redirect to Tracking page to see progress pipeline
        navigate(`/student/tracking/${encodeURIComponent(trackingCodeInput.trim())}`);
      } else {
        toast.error(
          language === 'vi' ? 'Mã theo dõi không tồn tại' : 
          'Tracking code not found'
        );
      }
    } catch (error) {
      console.error('Lookup error:', error);
      toast.error(language === 'vi' ? 'Lỗi khi tìm kiếm' : 'Error searching');
    } finally {
      setIsLookingUp(false);
    }
  };

  // Load student profile from tracking codes
  const [studentProfile, setStudentProfile] = React.useState({
    name: user?.name || 'Chưa có tên',
    email: user?.email || 'Chưa có email',
    phone: user?.phone || 'Chưa có SĐT',
    university: 'Chưa chọn trường',
    program: 'Chưa đăng ký',
    startDate: '-',
    status: 'pending',
    gpa: 'N/A',
    totalCost: '0 ₫',
    remainingCost: '0 ₫',
    nextPayment: 'Chưa có',
    progress: 0
  });

  // Sync with tracking code data on mount
  useEffect(() => {
    const syncWithTrackingData = async () => {
      if (!user?.email) {
        console.log('[StudentHome] No user email, skipping sync');
        return;
      }
      
      console.log('[StudentHome] Syncing tracking data for:', user.email);
      
      try {
        // Use getTrackingCodesByEmail to find user's tracking code
        const userCodes = await searchTrackingCodesByEmail(user.email);
        console.log('[StudentHome] Found tracking codes:', userCodes.length);
        
        const userCode = userCodes[0]; // Get most recent
        console.log('[StudentHome] User code:', userCode);
        
        if (!userCode) {
          console.log('[StudentHome] No tracking code found for user');
          return;
        }
        
        // Fetch real student progress from database
        let realProgress = 0;
        let realGPA = 'N/A';
        if (userCode?.desiredUniversityId) {
          console.log('[StudentHome] Fetching progress for university:', userCode.desiredUniversityId);
          const progressData = await getStudentProgress(user.email, userCode.desiredUniversityId);
          console.log('[StudentHome] Progress data:', progressData);
          if (progressData && progressData.length > 0) {
            const completedStages = progressData.filter((p: any) => p.status === 'completed').length;
            realProgress = Math.round((completedStages / progressData.length) * 100);
            console.log('[StudentHome] Calculated progress:', realProgress);
          }
        }
        
        // Fetch real payments from database
        console.log('[StudentHome] Fetching payments...');
        const payments = await getPayments(user.email, userCode?.desiredUniversityId);
        console.log('[StudentHome] Payments:', payments);
        const totalPaid = payments
          .filter((p: any) => p.status === 'completed')
          .reduce((sum: number, p: any) => sum + (p.amount_vnd || 0), 0);
        
        // Calculate real costs
        const initialCost = userCode?.initialTotalCostVnd || 0;
        const realRemaining = Math.max(0, initialCost - totalPaid);
        
        // Find next payment date
        let nextPaymentDate = 'Chưa có';
        const pendingPayments = payments
          .filter((p: any) => p.status === 'pending' && p.due_date)
          .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        if (pendingPayments.length > 0) {
          nextPaymentDate = new Date(pendingPayments[0].due_date).toLocaleDateString('vi-VN');
        }
        
        const updatedProfile = {
          name: userCode.studentName || user?.name || 'Chưa có tên',
          email: userCode.studentEmail || user?.email || 'Chưa có email',
          phone: userCode.studentPhone || user?.phone || 'Chưa có SĐT',
          university: userCode.desiredUniversityName || 'Chưa chọn trường',
          program: `Du học ${userCode.visaSystem || 'D4-1'}`,
          startDate: new Date(userCode.createdAt || Date.now()).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }),
          status: userCode.status || 'pending',
          gpa: realGPA,
          totalCost: formatFrom(initialCost, 'VND'),
          remainingCost: formatFrom(realRemaining, 'VND'),
          nextPayment: nextPaymentDate,
          progress: realProgress || 25
        };
        
        console.log('[StudentHome] Setting student profile:', updatedProfile);
        setStudentProfile(updatedProfile);
      } catch (error) {
        console.error('[StudentHome] Failed to sync with tracking data:', error);
      }
    };
    
    syncWithTrackingData();
  }, [user, formatFrom]);

  // Update student profile
  const handleStudentUpdate = (updatedStudent: any) => {
    setStudentProfile(updatedStudent);
    // Also update user context if needed
    if (user) {
      // Sync with user context
    }
  };

  const isRegistered = (uniId: string) => {
    return registrations.some(r => r.universityId === uniId && r.studentEmail === user?.email);
  };

  // Filter universities based on search
  const filteredUniversities = universities.filter(uni =>
    uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    uni.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (uni.tagline || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate results
  const totalPages = Math.ceil(filteredUniversities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUniversities = filteredUniversities.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex gap-6 min-h-full">
      {/* Main Content */}
      <div className="flex-1 space-y-6 p-6">
        {/* Tra Cứu Hồ Sơ Card */}
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg text-slate-800">
                {language === 'vi' ? 'Tra Cứu Hồ Sơ' : 'Application Lookup'}
              </CardTitle>
            </div>
            <CardDescription>
              {language === 'vi' 
                ? 'Nhập mã theo dõi để xem trạng thái hồ sơ và chi phí của bạn'
                : 'Enter your tracking code to view application status and costs'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLookup} className="flex gap-3">
              <Input
                type="text"
                placeholder={language === 'vi' ? 'SACMA-YYYYMMDD-XXXXXX' : 'Enter tracking code'}
                value={trackingCodeInput}
                onChange={(e) => setTrackingCodeInput(e.target.value.toUpperCase())}
                className="flex-1 font-mono"
                disabled={isLookingUp}
              />
              <Button 
                type="submit" 
                disabled={isLookingUp}
                className="whitespace-nowrap"
              >
                {isLookingUp ? (
                  <span className="animate-spin">⌛</span>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    {language === 'vi' ? 'Tra Cứu' : 'Lookup'}
                  </>
                )}
              </Button>
            </form>
            <p className="text-xs text-slate-500 mt-2">
              {language === 'vi' 
                ? 'Mã theo dõi được gửi qua email khi bạn hoàn tất đơn tư vấn'
                : 'Tracking code is sent via email when you complete your application'}
            </p>
          </CardContent>
        </Card>

        {/* CTA Banner for Consultation */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">
                  {language === 'vi' ? 'Đăng ký tư vấn miễn phí' :
                   language === 'ko' ? '무료 상담 신청' :
                   'Free Consultation Sign Up'}
                </h3>
                <p className="text-blue-100 text-sm">
                  {language === 'vi' ? 'Nhận tư vấn chi tiết về chi phí và hồ sơ du học Hàn Quốc' :
                   language === 'ko' ? '한국 유학 비용 및 서류에 대한 자세한 상담을 받으세요' :
                   'Get detailed consultation on Korean study abroad costs and applications'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/onboarding')}
              className="px-6 py-3 bg-white text-[#003AB7] border border-[#003AB7] rounded-lg hover:bg-[#003AB7] hover:text-white active:bg-[#002A8F] active:text-white transition-all duration-200 font-semibold flex items-center gap-2 whitespace-nowrap shadow-sm hover:shadow-md active:shadow-inner"
            >
              <GraduationCap className="w-5 h-5" />
              {language === 'vi' ? 'Đăng ký ngay' :
               language === 'ko' ? '지금 신청' :
               'Apply Now'}
            </button>
          </div>
        </div>

        {/* Read-Only Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              {language === 'vi' ? 'Chế độ xem - Không thể chỉnh sửa' :
               language === 'ko' ? '보기 모드 - 편집 불가' :
               'View Mode - Cannot Edit'}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {language === 'vi' ? 'Khám phá các trường đại học và đăng ký chương trình phù hợp.' :
               language === 'ko' ? '대학을 탐색하고 적합한 프로그램에 등록하세요.' :
               'Explore universities and register for suitable programs.'}
            </p>
          </div>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {language === 'vi' ? 'Khám phá các trường đại học' :
             language === 'ko' ? '대학 탐색' :
             'Explore Universities'}
          </h1>
          <p className="text-slate-600 mt-1">
            {language === 'vi' ? 'Tìm hiểu các cơ hội du học trên toàn thế giới' :
             language === 'ko' ? '전 세계 유학 기회를 알아보세요' :
             'Discover study abroad opportunities worldwide'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm trường đại học theo tên, quốc gia..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-sm text-slate-600 mb-1">Tổng số trường</p>
            <p className="text-2xl font-bold text-slate-900">{universities.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-sm text-slate-600 mb-1">Đã đăng ký</p>
            <p className="text-2xl font-bold text-primary">{registrations.filter(r => r.studentEmail === user?.email).length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-sm text-slate-600 mb-1">Quốc gia</p>
            <p className="text-2xl font-bold text-slate-900">{new Set(universities.map(u => u.country)).size}</p>
          </div>
        </div>

        {/* Search Results Info */}
        {searchTerm && (
          <div className="text-sm text-slate-600">
            Tìm thấy <span className="font-semibold text-slate-900">{filteredUniversities.length}</span> trường đại học
          </div>
        )}

        {/* University Cards - Redesigned for better visibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginatedUniversities.map((university) => {
            const registered = isRegistered(university.id);

            return (
              <div
                key={university.id}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:border-blue-300 transition-all duration-300 cursor-pointer flex flex-col"
                onClick={() => navigate(`/student/university/${university.id}`)}
              >
                {/* Thumbnail Image with Overlay */}
                <div className="relative h-52 overflow-hidden">
                  <img 
                    src={university.thumbnail} 
                    alt={university.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                  
                  {/* Top Tier Badge */}
                  {university.top_tier && (
                    <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
                      university.top_tier === 'Top1' ? 'bg-green-500' :
                      university.top_tier === 'Top2' ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}>
                      {university.top_tier === 'Top1' ? 'TOP 01' :
                       university.top_tier === 'Top2' ? 'TOP 02' : 'TOP 03'}
                    </div>
                  )}
                  
                  {/* Country Badge */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {university.country || 'Hàn Quốc'}
                  </div>
                  
                  {/* University Name Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-xl leading-tight mb-1 drop-shadow-lg">{university.name || 'Chưa có tên'}</h3>
                    {university.koreanName && (
                      <p className="text-white/80 text-sm">{university.koreanName}</p>
                    )}
                  </div>
                </div>
                
                {/* University Info */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* Ranking */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-semibold text-slate-700">{university.ranking || university.top_tier || 'Chưa xếp hạng'}</span>
                    </div>
                    {registered && (
                      <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-green-700">Đã đăng ký</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Tagline */}
                  <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">
                    {university.tagline || university.description || `Trường thuộc nhóm ${university.top_tier || 'chưa phân loại'}`}
                  </p>

                  {/* Action Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/student/university/${university.id}`);
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    Xem chi tiết
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-primary text-white'
                        : 'border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        )}

        {/* No Results */}
        {paginatedUniversities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600">Không tìm thấy trường đại học phù hợp</p>
          </div>
        )}
      </div>
      
      {/* Student Info Sidebar */}
      <div className="w-80 flex-shrink-0">
        <StudentInfoSidebar 
          student={studentProfile}
          onStudentUpdate={handleStudentUpdate}
        />
      </div>
    </div>
  );
}