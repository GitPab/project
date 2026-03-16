import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Edit, Eye, Lock, Plus, Upload, Calculator, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../config/supabase';

import { useApp, University } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency, Currency } from '../context/CurrencyContext';
import EditUniversityModal from '../components/EditUniversityModal';
import ImportUniversitiesModal from '../components/ImportUniversitiesModal';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import ErrorBoundary from '../../ErrorBoundary';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

// Inline cost calculation using new schema
interface SimpleCostCalculation {
  vndTotal: number; // Fixed base in VND
  krwTotal: number; // Variable costs in KRW
  display: string; // Formatted display string
  systemsIncluded: string[];
}

function calculateSimpleUniversityCost(university: any): SimpleCostCalculation {
  // Default base costs in VND (hoc_tieng + phi_tu_van + phi_trung_tam + ve_may_bay)
  // 13M + 39M + 11M + 8M = 71M VND
  const koreanData = university?.koreanData;
  
  // Get common fees VND from new schema or use defaults
  const commonFeesVND = koreanData?.commonFeesVND || [
    { id: 'hoc_tieng', amount: 13000000 },
    { id: 'phi_tu_van', amount: 39000000 },
    { id: 'phi_trung_tam', amount: 11000000 },
    { id: 've_may_bay', amount: 8000000 },
  ];
  
  // Calculate fixed VND base (exclude KTX VN as it's optional)
  let vndTotal = 0;
  commonFeesVND.forEach((fee: any) => {
    if (fee.id !== 'ktx_vn' && !fee.optional) {
      vndTotal += fee.amount || 0;
    }
  });
  
  // If no new data, fallback to legacy calculation
  if (vndTotal === 0 && university.fixedCosts) {
    university.fixedCosts.forEach((cost: any) => {
      const isScholarship = cost.category === 'scholarship' || cost.type?.toLowerCase().includes('học bổng');
      if (!isScholarship && cost.currency !== 'KRW') {
        vndTotal += cost.amount || 0;
      }
    });
  }
  
  // Default to 71M if still zero
  if (vndTotal === 0) {
    vndTotal = 71000000;
  }
  
  // Calculate KRW costs for D4-1 (default system)
  let krwTotal = 0;
  const systemsIncluded: string[] = [];
  
  // Try new schema first - visaSystemsDetail
  if (koreanData?.visaSystemsDetail?.['D4-1']?.available) {
    const d4_1 = koreanData.visaSystemsDetail['D4-1'];
    krwTotal += d4_1.applyFeeKRW || 0;
    krwTotal += d4_1.enrollmentFeeKRW || 0;
    krwTotal += d4_1.invoiceKRWPerYear || 0;
    
    // Add cheapest KTX option
    const ktxOptions = d4_1.ktxOptions || [];
    if (ktxOptions.length > 0) {
      const cheapestKTX = ktxOptions.reduce((min: number, opt: any) => 
        opt.priceKRWPerKy < min ? opt.priceKRWPerKy : min, 
        ktxOptions[0]?.priceKRWPerKy || 0
      );
      krwTotal += cheapestKTX;
    }
    
    // Add sổ tiết kiệm (financial requirement)
    const soTietKiemOptions = d4_1.financialRequirement?.soTietKiemOptions || [];
    if (soTietKiemOptions.length > 0) {
      const cheapestSoTietKiem = soTietKiemOptions.reduce((min: number, opt: any) => 
        opt.amountKRW < min ? opt.amountKRW : min, 
        soTietKiemOptions[0]?.amountKRW || 0
      );
      krwTotal += cheapestSoTietKiem;
    }
    
    systemsIncluded.push('D4-1');
  }
  
  // Fallback to legacy visaSystems
  if (krwTotal === 0 && koreanData?.visaSystems) {
    const d4_1_legacy = koreanData.visaSystems.find((s: any) => s.visaType === 'D4-1' && s.available !== false);
    if (d4_1_legacy) {
      krwTotal += d4_1_legacy.applicationFee || 0;
      krwTotal += d4_1_legacy.enrollmentFee || 0;
      krwTotal += d4_1_legacy.tuitionPerTerm || 0;
      krwTotal += d4_1_legacy.tuitionRange?.max || 0;
      systemsIncluded.push('D4-1');
    }
  }
  
  // Format display string
  const formatNumber = (num: number) => num.toLocaleString('vi-VN');
  const display = krwTotal > 0 
    ? `${formatNumber(vndTotal)}đ + ${formatNumber(krwTotal)} KRW`
    : `${formatNumber(vndTotal)}đ`;
  
  return {
    vndTotal,
    krwTotal,
    display,
    systemsIncluded
  };
}

function generateSimpleCostTooltip(cost: SimpleCostCalculation): string {
  let tooltip = `Tổng chi phí ước tính:\n`;
  tooltip += `• VNĐ: ${cost.vndTotal.toLocaleString('vi-VN')}đ\n`;
  if (cost.krwTotal > 0) {
    tooltip += `• KRW: ${cost.krwTotal.toLocaleString('vi-VN')} KRW\n`;
  }
  
  if (cost.systemsIncluded.length > 0) {
    tooltip += `\nHệ thống: ${cost.systemsIncluded.join(', ')}`;
  }
  
  return tooltip;
}

const TOP_FILTERS = ['all', 'Top1', 'Top2', 'Top3'] as const;

type TopFilter = typeof TOP_FILTERS[number];

type NormalizedTier = 'Top1' | 'Top2' | 'Top3' | undefined;

const normalizeTier = (tier?: string): NormalizedTier => {
  if (!tier) return undefined;
  if (tier.startsWith('Top ')) return `Top${tier.replace('Top ', '')}` as NormalizedTier;
  if (tier.startsWith('Top')) return tier as NormalizedTier;
  return undefined;
};

// Get all unique fixed cost types from a university
const getFixedCostTypes = (uni: University): Array<{ type: string; amount: number; currency?: Currency }> => {
  return (uni.fixedCosts || []).map(cost => ({
    type: cost.type,
    amount: cost.amount || 0,
    currency: cost.currency,
  }));
};

// Get all unique fixed cost types across filtered universities
const getAllFixedCostTypes = (universities: University[]): string[] => {
  const typesSet = new Set<string>();
  universities.forEach(uni => {
    uni.fixedCosts?.forEach(cost => {
      typesSet.add(cost.type);
    });
  });
  return Array.from(typesSet);
};

export default function UniversitiesList() {
  const navigate = useNavigate();
  const { universities, updateUniversity, addUniversities, setUniversities } = useApp();
  const { isAdmin } = useAuth();
  const { currency, setCurrency, formatFrom, convertAmount } = useCurrency();

  const [topFilter, setTopFilter] = useState<TopFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [activeUniversity, setActiveUniversity] = useState<University | undefined>(undefined);
  const [importOpen, setImportOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Supabase Realtime Subscription for universities
  useEffect(() => {
    // Subscribe to universities table changes
    const subscription = supabase
      .channel('universities-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'universities'
        },
        (payload: any) => {
          console.log('Real-time update received:', payload);
          
          if (payload.eventType === 'UPDATE') {
            // Update the university in the list
            const updatedUniversity = payload.new as University;
            updateUniversity(updatedUniversity.id, updatedUniversity);
            
            // If this is the active university being edited, update it too
            if (activeUniversity?.id === updatedUniversity.id) {
              setActiveUniversity(updatedUniversity);
            }
            
            toast.success(`Dữ liệu trường ${updatedUniversity.name} đã được cập nhật`);
          } else if (payload.eventType === 'INSERT') {
            // Add new university
            const newUniversity = payload.new as University;
            addUniversities([newUniversity]);
            toast.success(`Trường ${newUniversity.name} đã được thêm`);
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted university
            const deletedId = payload.old.id;
            setUniversities((prev: University[]) => prev.filter((u: University) => u.id !== deletedId));
            toast.success('Trường đã được xóa');
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [updateUniversity, addUniversities, setUniversities, activeUniversity]);

  // Calculate estimated costs for all universities
  const costCalculations = useMemo(() => {
    const calculations = new Map<string, SimpleCostCalculation>();
    universities.forEach(university => {
      try {
        const cost = calculateSimpleUniversityCost(university);
        calculations.set(university.id, cost);
      } catch (err) {
        console.error(`Error calculating cost for ${university.name}:`, err);
        // Set default cost calculation
        calculations.set(university.id, {
          vndTotal: 0,
          krwTotal: 0,
          display: '—',
          systemsIncluded: []
        });
      }
    });
    return calculations;
  }, [universities]);

  const handleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const SortIcon = () => {
    return sortOrder === 'asc' ? 
      <TrendingUp className="w-4 h-4" /> : 
      <TrendingDown className="w-4 h-4" />;
  };

  const koreanUniversities = useMemo(() => {
    return universities.filter((uni) => uni.koreanData?.isKoreanUniversity || uni.country === 'South Korea');
  }, [universities]);

  const filteredUniversities = useMemo(() => {
    let filtered = koreanUniversities;
    
    if (topFilter !== 'all') {
      filtered = filtered.filter((uni) => {
        const tier = normalizeTier(uni.koreanData?.topTier || uni.koreanData?.topVisa);
        return tier === topFilter;
      });
    }
    
    // Sort by cost (use vndTotal for sorting)
    filtered.sort((a, b) => {
      const costA = costCalculations.get(a.id)?.vndTotal || 0;
      const costB = costCalculations.get(b.id)?.vndTotal || 0;
      return sortOrder === 'asc' ? costA - costB : costB - costA;
    });
    
    return filtered;
  }, [koreanUniversities, topFilter, costCalculations, sortOrder]);

  const openCreate = () => {
    setCreateMode(true);
    setActiveUniversity(undefined);
    setModalOpen(true);
  };

  const openEdit = (uni: University) => {
    setCreateMode(false);
    setActiveUniversity(uni);
    setModalOpen(true);
  };

  const handleSave = async (data: Partial<University>) => {
    if (createMode) {
      // Create new university
      const timestamp = Date.now();
      const newUni = {
        id: data.id || `custom-${timestamp}`,
        name: data.name || 'New University',
        koreanName: data.koreanName,
        region: data.region,
        country: 'South Korea',
        ranking: data.ranking || '',
        description: data.description || '',
        generalTuition: data.generalTuition || 0,
        visaFee: data.visaFee || 0,
        accommodationFee: data.accommodationFee || 0,
        insuranceFee: data.insuranceFee || 0,
        additionalFees: data.additionalFees || [],
        systems: data.systems || [],
        koreanData: data.koreanData || {
          isKoreanUniversity: true,
          topTier: 'Top2',
          topVisa: 'Top 2',
          address: data.region,
        },
        fixedCosts: data.fixedCosts || [],
        optionalAddons: data.optionalAddons || [],
        majors: data.majors || [],
      } as University;
      
      try {
        const { error } = await supabase
          .from('universities')
          .insert(newUni);
          
        if (error) throw error;
        
        addUniversities([newUni]);
        toast.success('Đã thêm trường mới');
      } catch (error: any) {
        console.error('Error creating university:', error);
        toast.error('Lỗi khi thêm trường: ' + (error.message || 'Không xác định'));
      }
    } else if (activeUniversity) {
      // Update existing university - use activeUniversity.id as fallback
      const universityId = data.id || activeUniversity.id;
      if (!universityId) {
        toast.error('Không xác định được ID trường cần cập nhật');
        return;
      }
      
      try {
        const updateData = {
          ...data,
          id: universityId,
          updated_at: new Date().toISOString(),
        };
        
        const { error } = await supabase
          .from('universities')
          .update(updateData)
          .eq('id', universityId);
          
        if (error) throw error;
        
        updateUniversity(universityId, updateData);
        toast.success('Đã cập nhật thông tin trường');
      } catch (error: any) {
        console.error('Error updating university:', error);
        toast.error('Lỗi khi cập nhật: ' + (error.message || 'Không xác định'));
      }
    }
  };

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <div className="space-y-6 p-6">
      <div className="fixed bottom-6 right-6 z-40">
        <div className="rounded-full border border-slate-200 bg-white shadow-lg px-4 py-2">
          <label className="text-xs text-slate-500 block">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="bg-white text-sm font-semibold text-slate-900 focus:outline-none"
          >
            <option value="VND">VND ₫</option>
            <option value="KRW">KRW ₩</option>
            <option value="USD">USD $</option>
            <option value="JPY">JPY ¥</option>
            <option value="CNY">CNY ¥</option>
          </select>
        </div>
      </div>

      {!isAdmin && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4" /> Chế độ xem
            </CardTitle>
            <CardDescription>
              Thông tin chỉ để tham khảo. Liên hệ quản trị viên để chỉnh sửa.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900">
          {isAdmin ? 'Universities List' : 'Danh sách trường đại học'}
        </h1>
        <p className="text-slate-600">
          {isAdmin ? 'Manage Korean universities' : 'Chỉ hiển thị trường Hàn Quốc (Top 1-3)'}
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          {TOP_FILTERS.map((tier) => (
            <button
              key={tier}
              onClick={() => setTopFilter(tier)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                topFilter === tier
                  ? 'bg-[#003AB7] text-white shadow'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              {tier === 'all' ? 'Tất cả' : tier === 'Top3' ? 'Top 3 (Hạn chế visa)' : tier.replace('Top', 'Top ')}
            </button>
          ))}
        </div>

        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={openCreate}>
              <Plus />
              Thêm trường
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload />
              Import CSV
            </Button>
          </div>
        )}
      </div>

      <Card className="hidden lg:block overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-full table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px] sticky left-0 bg-slate-50 z-10">Tên trường</TableHead>
                <TableHead className="w-[220px]">Tên tiếng Hàn</TableHead>
                <TableHead className="w-[130px]">Quốc gia</TableHead>
                <TableHead className="w-[160px]">Khu vực</TableHead>

                {/* Dynamic Fixed Cost Columns */}
                {getAllFixedCostTypes(filteredUniversities).map((costType) => (
                  <TableHead key={`header-${costType}`} className="text-right w-[140px]">
                    {costType}
                  </TableHead>
                ))}

                <TableHead className="text-right w-[180px] cursor-pointer hover:bg-slate-100" onClick={handleSort}>
                  <div className="flex items-center justify-end gap-2">
                    <Calculator className="w-4 h-4" />
                    Tổng
                    <SortIcon />
                  </div>
                </TableHead>
                {isAdmin && <TableHead className="text-center w-[140px] sticky right-0 bg-slate-50 z-10">Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUniversities.map((uni) => {
                const cost = costCalculations.get(uni.id);
                const costTypes = getAllFixedCostTypes(filteredUniversities);
                return (
                  <TableRow key={uni.id}>
                    <TableCell className="font-semibold text-slate-900 truncate sticky left-0 bg-white z-10">{uni.name}</TableCell>
                    <TableCell className="truncate">{uni.koreanName || '—'}</TableCell>
                    <TableCell>{uni.country || 'South Korea'}</TableCell>
                    <TableCell className="truncate">{uni.region || uni.koreanData?.address || '—'}</TableCell>

                    {/* Dynamic Fixed Cost Cells */}
                    {costTypes.map((costType) => {
                      const costValue = uni.fixedCosts?.find(c => c.type === costType)?.amount || 0;
                      return (
                        <TableCell key={`${uni.id}-${costType}`} className="text-right">
                          <span className="text-sm">{formatFrom(costValue, uni.fixedCosts?.find(c => c.type === costType)?.currency || 'VND')}</span>
                        </TableCell>
                      );
                    })}

                    <TableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-end gap-2 cursor-help">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="font-semibold text-blue-600 text-sm">
                                {cost?.display || '—'}
                              </div>
                              {(cost?.systemsIncluded.length || 0) > 0 && (
                                <div className="text-xs text-slate-500">
                                  {cost?.systemsIncluded.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <pre className="text-xs whitespace-pre-wrap">
                            {generateSimpleCostTooltip(cost || { vndTotal: 0, krwTotal: 0, display: '—', systemsIncluded: [] })}
                          </pre>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="sticky right-0 bg-white z-10">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/university/${uni.id}`)}
                          >
                            <Eye />
                            Xem
                          </Button>
                          <Button size="sm" onClick={() => openEdit(uni)}>
                            <Edit />
                            Sửa
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="lg:hidden space-y-4">
        {filteredUniversities.map((uni) => {
          const cost = costCalculations.get(uni.id);
          const costTypes = getAllFixedCostTypes(filteredUniversities);
          return (
            <Card key={uni.id}>
              <CardHeader>
                <CardTitle className="text-base">{uni.name}</CardTitle>
                <CardDescription>{uni.koreanName || '—'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Quốc gia</span><span>{uni.country}</span></div>
                <div className="flex justify-between"><span>Khu vực</span><span>{uni.region || uni.koreanData?.address || '—'}</span></div>

                {/* Dynamic Fixed Costs for Mobile */}
                {costTypes.map((costType) => {
                  const costValue = uni.fixedCosts?.find(c => c.type === costType)?.amount || 0;
                  return (
                    <div key={`mobile-${uni.id}-${costType}`} className="flex justify-between">
                      <span>{costType}</span>
                      <span className="font-semibold">{formatFrom(costValue, uni.fixedCosts?.find(c => c.type === costType)?.currency || 'VND')}</span>
                    </div>
                  );
                })}

                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Tổng chi phí ước tính</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <DollarSign className="w-4 h-4 text-slate-400" />
                        <span className="text-blue-600">{cost?.display || '—'}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <pre className="text-xs whitespace-pre-wrap">
                        {generateSimpleCostTooltip(cost || { vndTotal: 0, krwTotal: 0, display: '—', systemsIncluded: [] })}
                      </pre>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {(cost?.systemsIncluded.length || 0) > 0 && (
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Hệ thống</span>
                    <span>{cost?.systemsIncluded.join(', ') || ''}</span>
                  </div>
                )}

                <Button
                  className="w-full mt-2"
                  onClick={() =>
                    navigate(isAdmin ? `/admin/university/${uni.id}` : `/student/university/${uni.id}`)
                  }
                >
                  {isAdmin ? 'Xem chi tiết' : 'Xem chi tiết'}
                </Button>
                {isAdmin && (
                  <Button variant="outline" className="w-full" onClick={() => openEdit(uni)}>
                    <Edit />
                    Chỉnh sửa
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isAdmin && (
        <EditUniversityModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          university={createMode ? undefined : activeUniversity}
          onSave={handleSave}
        />
      )}

      {isAdmin && importOpen && (
        <ImportUniversitiesModal
          isOpen={importOpen}
          onClose={() => setImportOpen(false)}
          onImport={(items) => {
            addUniversities(items);
            setImportOpen(false);
            toast.success(`Đã import ${items.length} trường từ CSV`);
          }}
        />
      )}
    </div>
  </TooltipProvider>
</ErrorBoundary>
  );
}
