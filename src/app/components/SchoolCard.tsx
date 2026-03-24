import React from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { University } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

interface SchoolCardProps {
  university: University;
  onSelect?: (universityId: string) => void;
}

export default function SchoolCard({ university, onSelect }: SchoolCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();

  // Extract 2-3 keywords from university data
  const getKeywords = (): string[] => {
    const keywords: string[] = [];

    // Add major categories (first 2)
    if (university.koreanData?.majorCategories) {
      keywords.push(...university.koreanData.majorCategories.slice(0, 2).map(m => m.category));
    }

    // Add student support highlights
    if (university.koreanData?.studentSupport) {
      const support = university.koreanData.studentSupport[0];
      if (support && keywords.length < 3) {
        // Translate common support terms
        const supportMap: Record<string, string> = {
          'Job Opportunity': language === 'vi' ? 'Cơ hội việc làm' : language === 'ko' ? '취업기회' : 'Job Opportunity',
          'Scholarship': language === 'vi' ? 'Học bổng' : language === 'ko' ? '장학금' : 'Scholarship',
          'Dormitory': language === 'vi' ? 'Ký túc xá' : language === 'ko' ? '기숙사' : 'Dormitory',
          'International': language === 'vi' ? 'Quốc tế' : language === 'ko' ? '국제적' : 'International',
          'Strong': language === 'vi' ? 'Mạnh' : language === 'ko' ? '강함' : 'Strong',
          'Top': language === 'vi' ? 'Top đầu' : language === 'ko' ? '최고' : 'Top',
          'Engineering': language === 'vi' ? 'Kỹ thuật' : language === 'ko' ? '공학' : 'Engineering',
          'Studies': language === 'vi' ? 'Nghiên cứu' : language === 'ko' ? '연구' : 'Studies',
        };
        const translated = Object.entries(supportMap).find(([key]) =>
          support.toLowerCase().includes(key.toLowerCase())
        );
        if (translated) keywords.push(translated[1]);
      }
    }

    // Fallback keywords based on ranking
    if (keywords.length === 0) {
      const worldRank = university.koreanData?.koreanRanking ? parseInt(university.koreanData.koreanRanking.split('/')[0]) : 999;
      if (worldRank < 200) {
        keywords.push(language === 'vi' ? 'Top đầu' : language === 'ko' ? '최고 등급' : 'Top Tier');
      }
      if (university.tagline?.toLowerCase().includes('engineer')) {
        keywords.push(
          language === 'vi' ? 'Kỹ thuật mạnh' : language === 'ko' ? '공학 우수' : 'Strong Engineering'
        );
      }
    }

    return keywords.slice(0, 3);
  };

  const handleSelectSchool = () => {
    if (onSelect) {
      onSelect(university.id);
    } else {
      // Navigate to onboarding with pre-selected university
      navigate(`/?uni=${university.id}#onboarding-form`);
    }
  };

  const keywords = getKeywords();
  const topTier = university.koreanData?.topTier;

  // Get tier icon
  const getTierIcon = () => {
    switch (topTier) {
      case 'Top1':
        return '⭐';
      case 'Top2':
        return '🥈';
      case 'Top3':
        return '📋';
      default:
        return '🎓';
    }
  };

  return (
    <div className="group relative h-full">
      {/* Card Container */}
      <div className="h-full flex flex-col bg-white rounded-xl border border-blue-200 hover:border-blue-400 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
        {/* Photo Section */}
        <div className="relative flex-shrink-0 h-40 bg-gradient-to-br from-blue-100 to-blue-50 overflow-hidden">
          {/* Placeholder with university thumbnail */}
          {university.thumbnail ? (
            <img
              src={university.thumbnail}
              alt={university.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🏫</div>
                <p className="text-xs text-blue-600 font-semibold">
                  {language === 'vi' ? 'Không ảnh' : language === 'ko' ? '이미지 없음' : 'No image'}
                </p>
              </div>
            </div>
          )}

          {/* Tier Badge */}
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-bold shadow-sm">
            {getTierIcon()} {topTier || 'Info'}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col p-4 space-y-3">
          {/* School Names */}
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm line-clamp-2 hover:text-primary transition-colors">
              {university.name}
            </h3>
            <p className="text-xs text-slate-500">{university.koreanName || university.name}</p>
          </div>

          {/* Location & Ranking */}
          <div className="flex items-center justify-between text-xs text-slate-600 border-b border-slate-100 pb-2">
            <span className="font-semibold">📍 {university.region || university.country}</span>
            <span className="text-slate-500">{university.ranking}</span>
          </div>

          {/* Keywords */}
          <div className="flex flex-wrap gap-1">
            {keywords.map((keyword, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>

          {/* CTA Button - Takes up remaining space and stays at bottom */}
          <div className="flex-1 flex items-end mt-auto">
            <button
              onClick={handleSelectSchool}
              className="w-full bg-gradient-to-r from-primary to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 group/btn hover:gap-3"
            >
              {language === 'vi' ? 'Chọn trường' : language === 'ko' ? '선택' : 'Select'}
              <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
