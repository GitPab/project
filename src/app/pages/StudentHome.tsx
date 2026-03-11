import React from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, CheckCircle, Lock, Search, Star, UserPlus, GraduationCap } from 'lucide-react';

export default function StudentHome() {
  const { universities, registrations, user } = useApp();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 12;

  const isRegistered = (uniId: string) => {
    return registrations.some(r => r.universityId === uniId && r.studentEmail === user?.email);
  };

  // Filter universities based on search
  const filteredUniversities = universities.filter(uni =>
    uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    uni.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    uni.tagline.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate results
  const totalPages = Math.ceil(filteredUniversities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUniversities = filteredUniversities.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 p-6">
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
            className="px-6 py-3 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center gap-2 whitespace-nowrap"
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

      {/* University Cards - Only showing intro info, NO costs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {paginatedUniversities.map((university) => {
          const registered = isRegistered(university.id);

          return (
            <div
              key={university.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/student/university/${university.id}`)}
            >
              {/* Thumbnail Image */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={university.thumbnail} 
                  alt={university.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                {registered && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1 font-medium shadow-md z-10">
                    <CheckCircle className="w-3 h-3" />
                    Đã đăng ký
                  </div>
                )}
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-white font-semibold text-lg leading-tight mb-1">{university.name}</h3>
                  <div className="flex items-center gap-2 text-white/90">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-sm">{university.country}</span>
                  </div>
                </div>
              </div>
              
              {/* University Info - ONLY intro, NO costs */}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{university.ranking}</span>
                </div>
                
                <p className="text-sm text-slate-700 line-clamp-2">
                  {university.tagline}
                </p>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/student/university/${university.id}`);
                  }}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  Xem chi tiết
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
  );
}