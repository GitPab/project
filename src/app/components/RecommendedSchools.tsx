import React, { useState, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { useApp, University } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import SchoolCard from './SchoolCard';

type TopTier = 'Top1' | 'Top2' | 'Top3';

interface RecommendedSchoolsProps {
  onUniversitySelect?: (universityId: string) => void;
}

export default function RecommendedSchools({ onUniversitySelect }: RecommendedSchoolsProps) {
  const { universities } = useApp();
  const { language } = useLanguage();

  // State
  const [activeTier, setActiveTier] = useState<TopTier>('Top1');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMore, setShowMore] = useState<Record<TopTier, boolean>>({
    Top1: false,
    Top2: false,
    Top3: false,
  });

  // Filter universities by tier
  const tierUniversities = useMemo(() => {
    const group: Record<TopTier, University[]> = { Top1: [], Top2: [], Top3: [] };

    universities.forEach((uni) => {
      const tier =
        (uni.topTier as TopTier | undefined) ||
        (uni.koreanData?.topTier as TopTier | undefined) ||
        (uni.koreanData?.topVisa === 'Top 1'
          ? 'Top1'
          : uni.koreanData?.topVisa === 'Top 2'
            ? 'Top2'
            : uni.koreanData?.topVisa === 'Top 3'
              ? 'Top3'
              : undefined);
      if (tier) {
        group[tier].push(uni);
      }
    });

    return group;
  }, [universities]);

  // Filter by search query
  const filteredUniversities = useMemo(() => {
    if (!searchQuery.trim()) {
      return tierUniversities[activeTier];
    }

    const query = searchQuery.toLowerCase();
    return tierUniversities[activeTier].filter((uni) => {
      return (
        uni.name.toLowerCase().includes(query) ||
        uni.koreanName?.toLowerCase().includes(query) ||
        uni.region?.toLowerCase().includes(query) ||
        uni.country.toLowerCase().includes(query)
      );
    });
  }, [tierUniversities, activeTier, searchQuery]);

  // Pagination logic: Show 12 by default, expand on "Show more"
  const itemsToShow = showMore[activeTier] ? filteredUniversities.length : Math.min(12, filteredUniversities.length);
  const displayedUniversities = filteredUniversities.slice(0, itemsToShow);
  const hasMore = itemsToShow < filteredUniversities.length;

  const handleUniversitySelect = (universityId: string) => {
    if (onUniversitySelect) {
      onUniversitySelect(universityId);
    } else {
      // Default behavior - scroll to form
      window.location.href = `/?uni=${universityId}#onboarding-form`;
    }
  };

  const getTierLabel = (tier: TopTier) => {
    const labels = {
      Top1: language === 'vi' ? 'Top 1' : language === 'ko' ? 'Top 1' : 'Top 1',
      Top2: language === 'vi' ? 'Top 2' : language === 'ko' ? 'Top 2' : 'Top 2',
      Top3:
        language === 'vi'
          ? 'Top 3 (Hạn chế visa)'
          : language === 'ko'
            ? 'Top 3 (비자 제한)'
            : 'Top 3 (Visa Limited)',
    };
    return labels[tier];
  };

  const getTierIcon = (tier: TopTier) => {
    switch (tier) {
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
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex-1">
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            {language === 'vi'
              ? '✨ Gợi ý Trường Hàng Đầu'
              : language === 'ko'
                ? '✨ 추천 대학'
                : '✨ Recommended Schools'}
          </h3>
          <p className="text-slate-600 text-sm md:text-base">
            {language === 'vi'
              ? 'Dữ liệu 100% từ CSV: Top 1, Top 2, Top 3 (hạn chế visa). Nhấn để xem chi tiết trường và tính chi phí.'
              : language === 'ko'
                ? 'CSV에서 불러온 Top1/Top2/Top3 대학 목록. 선택하여 비용 계산.'
                : 'Pulled directly from CSV: Top 1, Top 2, Top 3 lists. Select to estimate costs.'}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm flex-shrink-0">
          {(['Top1', 'Top2', 'Top3'] as TopTier[]).map((tier) => (
            <button
              key={tier}
              onClick={() => {
                setActiveTier(tier);
                setSearchQuery('');
              }}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTier === tier
                  ? `bg-white text-primary shadow-md border border-primary/20`
                  : `text-slate-700 hover:bg-white/50`
              }`}
            >
              <span className="mr-1">{getTierIcon(tier)}</span>
              {getTierLabel(tier)}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 md:mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={
              language === 'vi'
                ? '🔍 Tìm kiếm tên trường hoặc khu vực...'
                : language === 'ko'
                  ? '🔍 대학명 또는 지역 검색...'
                  : '🔍 Search university name or region...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm md:text-base"
          />
        </div>
        {searchQuery && (
          <p className="text-xs text-slate-500 mt-2">
            {language === 'vi'
              ? `Tìm thấy ${filteredUniversities.length} trường`
              : language === 'ko'
                ? `${filteredUniversities.length}개 대학 찾음`
                : `Found ${filteredUniversities.length} universities`}
          </p>
        )}
      </div>

      {/* Grid of School Cards */}
      {displayedUniversities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">
            {language === 'vi'
              ? 'Không tìm thấy trường phù hợp'
              : language === 'ko'
                ? '해당하는 대학이 없습니다'
                : 'No universities found'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 mb-8">
            {displayedUniversities.map((uni) => (
              <SchoolCard key={uni.id} university={uni} onSelect={handleUniversitySelect} />
            ))}
          </div>

          {/* Show More Button */}
          {hasMore && (
            <div className="flex justify-center">
              <button
                onClick={() =>
                  setShowMore({
                    ...showMore,
                    [activeTier]: !showMore[activeTier],
                  })
                }
                className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-300 hover:border-slate-400 transition-all flex items-center gap-2 text-sm md:text-base"
              >
                {showMore[activeTier]
                  ? language === 'vi'
                    ? '✕ Thu gọn'
                    : language === 'ko'
                      ? '✕ 접기'
                      : '✕ Show less'
                  : language === 'vi'
                    ? `📋 Xem thêm ${getTierLabel(activeTier)} (${filteredUniversities.length - itemsToShow} trường)`
                    : language === 'ko'
                      ? `📋 더보기 ${getTierLabel(activeTier)} (${filteredUniversities.length - itemsToShow}개)`
                      : `📋 Show more ${getTierLabel(activeTier)} (${filteredUniversities.length - itemsToShow} schools)`}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showMore[activeTier] ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
