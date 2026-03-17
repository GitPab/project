import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Info,
  Calculator,
  University as UniversityIcon,
  MapPin,
  Star
} from 'lucide-react';
import type { University } from '../../types/university';
import { calculateUniversityEstimatedCost, formatCostDisplay, generateCostTooltip, type EstimatedTotalCost } from '../../utils/costCalculations';
import { getMaxScholarship, getMinGPA, getCheapestKTX, getLowestTuition, getPerks, getVisaSystemLabel } from '../../utils/universityPerks';
import { TOP_TIERS, getTierColor, getTierBg } from '../../constants/topTiers';
import TierTab from './TierTab';

interface UniversitiesListEnhancedProps {
  onUniversitySelect?: (university: University) => void;
  showActions?: boolean;
  maxHeight?: string;
}

export default function UniversitiesListEnhanced({ 
  onUniversitySelect, 
  showActions = true,
  maxHeight = '600px'
}: UniversitiesListEnhancedProps) {
  const { language } = useLanguage();
  const { formatFrom } = useCurrency();
  
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTier, setActiveTier] = useState<string>('all');
  const [activePerk, setActivePerk] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'cost' | 'ranking'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [costCalculations, setCostCalculations] = useState<Map<string, EstimatedTotalCost>>(new Map());

  // Load universities data
  useEffect(() => {
    loadUniversities();
  }, []);

  // Real-time subscription for university updates
  useEffect(() => {
    const channel = supabase
      .channel('universities-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'universities'
      }, (payload: { new: University }) => {
        if (payload.new) {
          setUniversities((prev: University[]) => {
            const index = prev.findIndex(u => u.id === payload.new.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = payload.new;
              return updated;
            } else {
              return [...prev, payload.new];
            }
          });
          
          // Recalculate costs for updated university
          recalculateCosts([payload.new]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUniversities = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('universities')
        .select('*')
        .order('name');

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (data) {
        setUniversities(data);
        await recalculateCosts(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load universities');
    } finally {
      setLoading(false);
    }
  };

  const recalculateCosts = async (universityData: University[]) => {
    const calculations = new Map<string, EstimatedTotalCost>();
    
    universityData.forEach(university => {
      try {
        const cost = calculateUniversityEstimatedCost(university);
        calculations.set(university.id, cost);
      } catch (err) {
        console.error(`Error calculating cost for ${university.name}:`, err);
        // Set default cost calculation
        calculations.set(university.id, {
          amount: 0,
          currency: 'VND',
          breakdown: {
            fixedCosts: 0,
            optionalCosts: 0,
            totalCosts: 0,
            currency: 'VND',
            breakdown: []
          },
          systemsIncluded: []
        });
      }
    });
    
    setCostCalculations(calculations);
  };

  // Perk filter definitions
  const PERK_FILTERS = [
    { key: 'all', label: 'Tất cả' },
    { key: 'hb100', label: '🎓 HB 100%', match: (u: University) => getMaxScholarship(u) === 100 },
    { key: 'hb50', label: '🎓 HB 50%+', match: (u: University) => getMaxScholarship(u) >= 50 },
    { key: 'gpa65', label: '📋 GPA ≤ 6.5', match: (u: University) => getMinGPA(u) <= 6.5 },
    { key: 'ktx', label: '🏠 Có KTX rẻ', match: (u: University) => getCheapestKTX(u) !== null },
    { key: 'vl', label: '💼 Việc làm', match: (u: University) => !!u.koreanData?.jobOpportunities || !!u.koreanData?.workOpportunity },
    { key: 'seoul', label: '📍 Seoul', match: (u: University) => u.koreanData?.address?.toLowerCase().includes('seoul') || false }
  ];

  // Filter and sort universities
  const filteredUniversities = useMemo(() => {
    let filtered = universities.filter(university => {
      // Tier filter (Korean universities only)
      if (!university.koreanData?.isKoreanUniversity) return false;

      if (activeTier !== 'all') {
        const tierMatch = activeTier === '1' && university.koreanData?.topTier === 'Top1' ||
          activeTier === '2' && university.koreanData?.topTier === 'Top2' ||
          activeTier === '3' && university.koreanData?.topTier === 'Top3';
        if (!tierMatch) return false;
      }

      // Perk filter
      if (activePerk !== 'all') {
        const perkDef = PERK_FILTERS.find(p => p.key === activePerk);
        if (perkDef && !perkDef.match(university)) return false;
      }

      // Search filter
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const searchable = [university.name, university.koreanName, university.koreanData?.address]
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'cost':
          const costA = costCalculations.get(a.id)?.amount || 0;
          const costB = costCalculations.get(b.id)?.amount || 0;
          comparison = costA - costB;
          break;
        case 'ranking':
          const rankA = a.koreanData?.koreanRanking ? parseInt(a.koreanData.koreanRanking) : Infinity;
          const rankB = b.koreanData?.koreanRanking ? parseInt(b.koreanData.koreanRanking) : Infinity;
          comparison = rankA - rankB;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [universities, searchTerm, activeTier, activePerk, sortBy, sortOrder, costCalculations]);

  // Get tier counts
  const tierCounts = useMemo(() => {
    const counts = { all: universities.length, '1': 0, '2': 0, '3': 0 };
    universities.forEach(uni => {
      if (uni.koreanData?.isKoreanUniversity) {
        counts.all++;
        if (uni.koreanData?.topTier === 'Top1') counts['1']++;
        else if (uni.koreanData?.topTier === 'Top2') counts['2']++;
        else if (uni.koreanData?.topTier === 'Top3') counts['3']++;
      }
    });
    return counts;
  }, [universities]);

  // Handle sorting
  const handleSort = (column: 'name' | 'cost' | 'ranking') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Get cost display for university
  const getCostDisplay = (university: University) => {
    const cost = costCalculations.get(university.id);
    if (!cost) {
      return { amount: 'Loading...', hasRange: false };
    }
    return formatCostDisplay(cost);
  };

  // Get cost tooltip content
  const getCostTooltip = (university: University) => {
    const cost = costCalculations.get(university.id);
    if (!cost) {
      return language === 'vi' ? 'Đang tính toán...' : 'Calculating...';
    }
    return generateCostTooltip(cost, language);
  };

  // Get tier badge
  const getTierBadge = (tier: string | undefined) => {
    if (!tier) return null;
    const tierKey = tier === 'Top1' ? '1' : tier === 'Top2' ? '2' : tier === 'Top3' ? '3' : null;
    if (!tierKey) return null;

    const tierData = TOP_TIERS[tierKey];
    return (
      <Badge
        style={{
          backgroundColor: tierData.bg,
          color: tierData.color,
          border: `1px solid ${tierData.color}`
        }}
      >
        {tierData.label}
      </Badge>
    );
  };

  const labels = {
    vi: {
      title: 'Danh sách trường đại học',
      search: 'Tìm kiếm trường...',
      country: 'Quốc gia',
      tier: 'Xếp hạng',
      all: 'Tất cả',
      top1: 'Top 1',
      top2: 'Top 2', 
      top3: 'Top 3',
      regular: 'Thông thường',
      name: 'Tên trường',
      estimatedCost: 'Tổng chi phí ước tính',
      countryColumn: 'Quốc gia',
      tierColumn: 'Xếp hạng',
      actions: 'Thao tác',
      view: 'Xem chi tiết',
      loading: 'Đang tải...',
      error: 'Lỗi tải dữ liệu',
      noResults: 'Không tìm thấy trường nào',
      refresh: 'Làm mới',
      searchPlaceholder: 'Tìm kiếm theo tên, quốc gia...',
      costTooltip: 'Chi phí bao gồm học phí cố định và các chi phí tùy chọn mặc định'
    },
    ko: {
      title: '대학교 목록',
      search: '대학교 검색...',
      country: '국가',
      tier: '등급',
      all: '전체',
      top1: '최상위',
      top2: '상위',
      top3: '중상위',
      regular: '일반',
      name: '대학교명',
      estimatedCost: '예상 총비용',
      countryColumn: '국가',
      tierColumn: '등급',
      actions: '작업',
      view: '상세 보기',
      loading: '로딩 중...',
      error: '데이터 로딩 오류',
      noResults: '대학교를 찾을 수 없습니다',
      refresh: '새로고침',
      searchPlaceholder: '이름, 국가로 검색...',
      costTooltip: '비용에는 고정 수수료와 기본 선택적 수수료가 포함됩니다'
    },
    en: {
      title: 'Universities List',
      search: 'Search universities...',
      country: 'Country',
      tier: 'Tier',
      all: 'All',
      top1: 'Top 1',
      top2: 'Top 2',
      top3: 'Top 3',
      regular: 'Regular',
      name: 'University Name',
      estimatedCost: 'Estimated Total Cost',
      countryColumn: 'Country',
      tierColumn: 'Tier',
      actions: 'Actions',
      view: 'View Details',
      loading: 'Loading...',
      error: 'Error loading data',
      noResults: 'No universities found',
      refresh: 'Refresh',
      searchPlaceholder: 'Search by name, country...',
      costTooltip: 'Cost includes fixed fees and default optional fees'
    }
  };

  const t = labels[language];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003AB7] mx-auto mb-2"></div>
            <p className="text-slate-600">{t.loading}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-3 py-4">
          <Info className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-medium text-red-900">{t.error}</p>
            <p className="text-sm text-red-700">{error}</p>
            <Button onClick={loadUniversities} className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t.refresh}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UniversityIcon className="w-5 h-5" />
              {t.title}
            </CardTitle>
            <Button onClick={loadUniversities} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t.refresh}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder={language === 'vi' ? 'Tìm kiếm trường...' : 'Search universities...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tier tabs (primary navigation) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            <TierTab
              active={activeTier === 'all'}
              onClick={() => setActiveTier('all')}
              icon="☰"
              label={language === 'vi' ? 'Tất cả' : 'All'}
              count={tierCounts.all}
              colorClass="gray"
            />
            <TierTab
              active={activeTier === '1'}
              onClick={() => setActiveTier('1')}
              icon={TOP_TIERS['1'].icon}
              label={TOP_TIERS['1'].label}
              count={tierCounts['1']}
              description={TOP_TIERS['1'].description}
              colorClass="blue"
            />
            <TierTab
              active={activeTier === '2'}
              onClick={() => setActiveTier('2')}
              icon={TOP_TIERS['2'].icon}
              label={TOP_TIERS['2'].label}
              count={tierCounts['2']}
              description={TOP_TIERS['2'].description}
              colorClass="green"
            />
            <TierTab
              active={activeTier === '3'}
              onClick={() => setActiveTier('3')}
              icon={TOP_TIERS['3'].icon}
              label={TOP_TIERS['3'].label}
              count={tierCounts['3']}
              description={TOP_TIERS['3'].description}
              colorClass="red"
            />
          </div>

          {/* Top 3 warning banner */}
          {activeTier === '3' && TOP_TIERS['3'].warning && (
            <div
              style={{
                background: TOP_TIERS['3'].bg,
                border: `0.5px solid #F7C1C1`,
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                color: TOP_TIERS['3'].color,
                marginBottom: 8
              }}
            >
              {TOP_TIERS['3'].warning}
            </div>
          )}

          {/* Perk filter bar */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12, paddingBottom: 4 }}>
            {PERK_FILTERS.map(perk => (
              <button
                key={perk.key}
                onClick={() => setActivePerk(perk.key)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid #E5E7EB',
                  backgroundColor: activePerk === perk.key ? '#003AB7' : '#FFFFFF',
                  color: activePerk === perk.key ? '#FFFFFF' : '#6B7280',
                  fontSize: '12px',
                  fontWeight: activePerk === perk.key ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {perk.label}
              </button>
            ))}
          </div>

          {/* Results count */}
          <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: 12, fontWeight: 500 }}>
            {filteredUniversities.length} trường · {activeTier === 'all' ? '3 cấp độ visa' : `Top ${activeTier}`}
            {activePerk !== 'all' && ` · ${PERK_FILTERS.find(p => p.key === activePerk)?.label}`}
          </div>

          {/* Universities Table */}
          <div className="border rounded-lg overflow-hidden" style={{ maxHeight }}>
            <Table>
              <TableHead className="bg-slate-50 sticky top-0">
                <TableRow>
                  <TableHead className="w-[300px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('name')}
                      className="p-0 h-auto font-semibold text-left"
                    >
                      {language === 'vi' ? 'Tên trường' : 'University'}
                      {sortBy === 'name' && (
                        sortOrder === 'asc' ? <TrendingUp className="w-4 h-4 ml-1 inline" /> : <TrendingDown className="w-4 h-4 ml-1 inline" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[180px]">
                    {language === 'vi' ? 'Học phí thấp nhất' : 'Lowest Tuition'}
                  </TableHead>
                  <TableHead className="w-[200px]">
                    {language === 'vi' ? 'Ưu đãi nổi bật' : 'Featured Perks'}
                  </TableHead>
                  <TableHead className="w-[180px]">
                    {language === 'vi' ? 'Học bổng tốt nhất' : 'Scholarship'}
                  </TableHead>
                  {showActions && <TableHead className="w-[120px] text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</TableHead>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUniversities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showActions ? 5 : 4} className="text-center py-8 text-slate-600">
                      {language === 'vi' ? 'Không tìm thấy trường nào' : 'No universities found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUniversities.map((university) => {
                    const maxScholarship = getMaxScholarship(university);
                    const minGPA = getMinGPA(university);
                    const perks = getPerks(university);
                    const lowestTuition = getLowestTuition(university);
                    const isTop3 = university.koreanData?.topTier === 'Top3';

                    return (
                      <TableRow key={university.id} className="hover:bg-slate-50">
                        {/* Column 1: Tên trường */}
                        <TableCell>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              {university.name}
                              {getTierBadge(university.koreanData?.topTier)}
                            </div>
                            {university.koreanName && (
                              <div className="text-xs text-slate-600 mt-1">{university.koreanName}</div>
                            )}
                            {university.koreanData?.address && (
                              <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {university.koreanData.address}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Column 2: Học phí thấp nhất */}
                        <TableCell>
                          {lowestTuition ? (
                            <div>
                              <div className="font-semibold text-blue-600">
                                {(lowestTuition.amount / 1000).toFixed(0)}K ₩
                              </div>
                              <div className="text-xs text-slate-600">
                                {getVisaSystemLabel(lowestTuition.visaSystem)}/kỳ
                              </div>
                              {!isTop3 && (
                                <div style={{ color: minGPA <= 6.5 ? '#10B981' : '#9CA3AF', fontSize: '11px', marginTop: '4px' }}>
                                  {minGPA <= 6.5 ? `✓ GPA ${minGPA}` : `GPA ${minGPA}`}
                                </div>
                              )}
                              {isTop3 && (
                                <div style={{ color: '#A32D2D', fontSize: '11px', marginTop: '4px', fontWeight: 500 }}>
                                  — Hạn chế visa
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-slate-400">—</div>
                          )}
                        </TableCell>

                        {/* Column 3: Ưu đãi nổi bật */}
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {perks.slice(0, 4).map((perk, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                style={{ fontSize: '11px', padding: '2px 8px' }}
                              >
                                {perk.label}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>

                        {/* Column 4: Học bổng tốt nhất */}
                        <TableCell>
                          {maxScholarship > 0 ? (
                            <div>
                              <div
                                style={{
                                  width: '100%',
                                  height: '8px',
                                  backgroundColor: '#E5E7EB',
                                  borderRadius: '4px',
                                  overflow: 'hidden',
                                  marginBottom: '4px'
                                }}
                              >
                                <div
                                  style={{
                                    width: `${maxScholarship}%`,
                                    height: '100%',
                                    backgroundColor:
                                      maxScholarship === 100
                                        ? '#639922'
                                        : maxScholarship >= 50
                                          ? '#EF9F27'
                                          : '#E5E7EB'
                                  }}
                                />
                              </div>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#1F2937' }}>
                                {maxScholarship}%
                              </div>
                            </div>
                          ) : (
                            <div className="text-slate-400" style={{ fontSize: '12px' }}>
                              —
                            </div>
                          )}
                        </TableCell>

                        {/* Column 5: Thao tác */}
                        {showActions && (
                          <TableCell className="text-right">
                            <Button
                              onClick={() => onUniversitySelect?.(university)}
                              className="bg-[#003AB7] hover:bg-[#002A8F] text-white"
                              style={{ fontSize: '12px', padding: '6px 12px' }}
                            >
                              {language === 'vi' ? 'Xem' : 'View'}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
