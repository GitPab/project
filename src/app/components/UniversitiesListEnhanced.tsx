import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
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
  University,
  MapPin,
  Star
} from 'lucide-react';
import type { University } from '../types/university';
import { calculateUniversityEstimatedCost, formatCostDisplay, generateCostTooltip, type EstimatedTotalCost } from '../utils/costCalculations';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
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
      }, (payload) => {
        if (payload.new) {
          setUniversities(prev => {
            const index = prev.findIndex(u => u.id === payload.new.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = payload.new as University;
              return updated;
            } else {
              return [...prev, payload.new as University];
            }
          });
          
          // Recalculate costs for updated university
          recalculateCosts([payload.new as University]);
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

  // Filter and sort universities
  const filteredUniversities = useMemo(() => {
    let filtered = universities.filter(university => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        university.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        university.koreanName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        university.country.toLowerCase().includes(searchTerm.toLowerCase());

      // Country filter
      const matchesCountry = selectedCountry === 'all' || university.country === selectedCountry;

      // Tier filter
      const matchesTier = selectedTier === 'all' || 
        (selectedTier === 'top1' && university.topTier === 'Top1') ||
        (selectedTier === 'top2' && university.topTier === 'Top2') ||
        (selectedTier === 'top3' && university.topTier === 'Top3') ||
        (selectedTier === 'regular' && !university.topTier);

      return matchesSearch && matchesCountry && matchesTier;
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
          const rankA = a.worldRanking || Infinity;
          const rankB = b.worldRanking || Infinity;
          comparison = rankA - rankB;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [universities, searchTerm, selectedCountry, selectedTier, sortBy, sortOrder, costCalculations]);

  // Get unique countries for filter
  const countries = useMemo(() => {
    const uniqueCountries = [...new Set(universities.map(u => u.country))];
    return uniqueCountries.sort();
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
  const getTierBadge = (university: University) => {
    switch (university.topTier) {
      case 'Top1':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Top 1</Badge>;
      case 'Top2':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Top 2</Badge>;
      case 'Top3':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Top 3</Badge>;
      default:
        return null;
    }
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
              <University className="w-5 h-5" />
              {t.title}
            </CardTitle>
            <Button onClick={loadUniversities} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t.refresh}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t.country} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all}</SelectItem>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {country}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder={t.tier} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all}</SelectItem>
                <SelectItem value="top1">{t.top1}</SelectItem>
                <SelectItem value="top2">{t.top2}</SelectItem>
                <SelectItem value="top3">{t.top3}</SelectItem>
                <SelectItem value="regular">{t.regular}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="text-sm text-slate-600 mb-4">
            {filteredUniversities.length} {language === 'vi' ? 'trường được tìm thấy' : language === 'ko' ? '개 대학교를 찾았습니다' : 'universities found'}
          </div>

          {/* Universities Table */}
          <div className="border rounded-lg overflow-hidden" style={{ maxHeight }}>
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0">
                <TableRow>
                  <TableHead className="w-[300px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('name')}
                      className="p-0 h-auto font-semibold"
                    >
                      {t.name}
                      {sortBy === 'name' && (
                        sortOrder === 'asc' ? <TrendingUp className="w-4 h-4 ml-1" /> : <TrendingDown className="w-4 h-4 ml-1" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[200px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('cost')}
                      className="p-0 h-auto font-semibold"
                    >
                      <div className="flex items-center gap-1">
                        <Calculator className="w-4 h-4" />
                        {t.estimatedCost}
                      </div>
                      {sortBy === 'cost' && (
                        sortOrder === 'asc' ? <TrendingUp className="w-4 h-4 ml-1" /> : <TrendingDown className="w-4 h-4 ml-1" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[120px]">{t.countryColumn}</TableHead>
                  <TableHead className="w-[100px]">{t.tierColumn}</TableHead>
                  {showActions && <TableHead className="w-[120px] text-right">{t.actions}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUniversities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showActions ? 5 : 4} className="text-center py-8 text-slate-600">
                      {t.noResults}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUniversities.map((university) => {
                    const costDisplay = getCostDisplay(university);
                    const costTooltip = getCostTooltip(university);
                    
                    return (
                      <TableRow key={university.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div>
                            <div className="font-medium text-slate-900">{university.name}</div>
                            {university.koreanName && (
                              <div className="text-sm text-slate-600">{university.koreanName}</div>
                            )}
                            {university.ranking && (
                              <div className="text-xs text-slate-500 mt-1">
                                {language === 'vi' ? 'Xếp hạng: ' : language === 'ko' ? '순위: ' : 'Ranking: '}{university.ranking}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 cursor-help">
                                <DollarSign className="w-4 h-4 text-slate-400" />
                                <div>
                                  <div className="font-semibold text-blue-600">
                                    {costDisplay.amount}
                                  </div>
                                  {costDisplay.hasRange && (
                                    <div className="text-xs text-slate-600">
                                      {costDisplay.minAmount} - {costDisplay.maxAmount}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <pre className="text-xs whitespace-pre-wrap">{costTooltip}</pre>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            {university.country}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTierBadge(university)}
                            {university.worldRanking && (
                              <div className="text-xs text-slate-600">
                                #{university.worldRanking}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        {showActions && (
                          <TableCell className="text-right">
                            <Button
                              onClick={() => onUniversitySelect?.(university)}
                              className="bg-[#003AB7] hover:bg-[#002A8F]"
                            >
                              {t.view}
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
