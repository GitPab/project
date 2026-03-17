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
  const koreanData = university?.koreanData;
  const commonFeesVND = koreanData?.commonFeesVND || [
    { id: 'hoc_tieng', amount: 13000000 },
    { id: 'phi_tu_van', amount: 39000000 },
    { id: 'phi_trung_tam', amount: 11000000 },
    { id: 've_may_bay', amount: 8000000 },
  ];
  
  let vndTotal = 0;
  commonFeesVND.forEach((fee: any) => {
    if (fee.id !== 'ktx_vn' && !fee.optional) {
      vndTotal += fee.amount || 0;
    }
  });
  
  if (vndTotal === 0 && university.fixedCosts) {
    university.fixedCosts.forEach((cost: any) => {
      const isScholarship = cost.category === 'scholarship' || cost.type?.toLowerCase().includes('học bổng');
      if (!isScholarship && cost.currency !== 'KRW') {
        vndTotal += cost.amount || 0;
      }
    });
  }
  
  if (vndTotal === 0) {
    vndTotal = 71000000;
  }
  
  let krwTotal = 0;
  const systemsIncluded: string[] = [];
  
  if (koreanData?.visaSystemsDetail?.['D4-1']?.available) {
    const d4_1 = koreanData.visaSystemsDetail['D4-1'];
    krwTotal += d4_1.applyFeeKRW || 0;
    krwTotal += d4_1.enrollmentFeeKRW || 0;
    krwTotal += d4_1.invoiceKRWPerYear || 0;
    systemsIncluded.push('D4-1');
  }
  
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

export default function UniversitiesList() {
  const navigate = useNavigate();
  const { universities, updateUniversity, addUniversities } = useApp();
  const { isAdmin } = useAuth();
  const { currency, setCurrency, formatFrom } = useCurrency();

  const [topFilter, setTopFilter] = useState<TopFilter>('all');
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Open edit modal - only called by button click
  const handleOpenEdit = (university: University) => {
    setEditingUniversity(university);
  };

  // Close edit modal
  const handleCloseEdit = () => {
    setEditingUniversity(null);
  };

  // Open create modal - only called by button click
  const handleOpenCreate = () => {
    setIsCreating(true);
  };

  // Close create modal
  const handleCloseCreate = () => {
    setIsCreating(false);
  };

  const handleSave = async (data: Partial<University>) => {
    if (editingUniversity) {
      // Update existing university
      const universityId = editingUniversity.id;
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
        handleCloseEdit();
      } catch (error: any) {
        console.error('Error updating university:', error);
        toast.error('Lỗi khi cập nhật: ' + (error.message || 'Không xác định'));
      }
    } else {
      // Create new university
      try {
        const timestamp = Date.now();
        const newUniversity = {
          id: `custom-${timestamp}`,
          name: data.name || 'New University',
          koreanName: data.koreanName || '',
          region: data.region || '',
          country: 'South Korea',
          description: data.overview || '',
          systems: [], // Add required systems array
          koreanData: {
            isKoreanUniversity: true,
            topTier: (data as any).topTier || 'Top2',
            address: data.region || '',
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as University;
        
        const { error } = await supabase
          .from('universities')
          .insert(newUniversity);
          
        if (error) throw error;

        addUniversities([newUniversity]);
        toast.success('Đã thêm trường mới');
        handleCloseCreate();
      } catch (error: any) {
        console.error('Error creating university:', error);
        toast.error('Lỗi khi thêm trường: ' + (error.message || 'Không xác định'));
      }
    }
  };

  const costCalculations = useMemo(() => {
    const calculations = new Map<string, SimpleCostCalculation>();
    universities.forEach(university => {
      try {
        const cost = calculateSimpleUniversityCost(university);
        calculations.set(university.id, cost);
      } catch (err) {
        console.error(`Error calculating cost for ${university.name}:`, err);
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
        const tier = uni.koreanData?.topTier;
        return tier === topFilter;
      });
    }
    
    filtered.sort((a, b) => {
      const costA = costCalculations.get(a.id)?.vndTotal || 0;
      const costB = costCalculations.get(b.id)?.vndTotal || 0;
      return sortOrder === 'asc' ? costA - costB : costB - costA;
    });
    
    return filtered;
  }, [koreanUniversities, topFilter, costCalculations, sortOrder]);

  const getAllFixedCostTypes = (universities: University[]): string[] => {
    const typesSet = new Set<string>();
    universities.forEach(uni => {
      uni.fixedCosts?.forEach(cost => {
        typesSet.add(cost.type);
      });
    });
    return Array.from(typesSet);
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
                <Button onClick={handleOpenCreate}>
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
                            <TooltipContent>
                              <pre className="text-xs whitespace-pre-wrap">
                                {generateSimpleCostTooltip(cost || { vndTotal: 0, krwTotal: 0, display: '—', systemsIncluded: [] })}
                              </pre>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>

                        {isAdmin && (
                          <TableCell className="text-center sticky right-0 bg-white z-10">
                            <div className="flex justify-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/admin/university/${uni.id}`)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Xem chi tiết</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenEdit(uni)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Chỉnh sửa</TooltipContent>
                              </Tooltip>
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

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {filteredUniversities.map((uni) => {
              const cost = costCalculations.get(uni.id);
              return (
                <Card key={uni.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{uni.name}</h3>
                        <p className="text-sm text-slate-600">{uni.koreanName || '—'}</p>
                        <p className="text-xs text-slate-500">{uni.region || uni.koreanData?.address || '—'}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-blue-600 text-sm">
                          {cost?.display || '—'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {cost?.systemsIncluded.join(', ')}
                        </div>
                      </div>
                    </div>
                    
                    {isAdmin && (
                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/university/${uni.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(uni)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Edit Modal */}
          {editingUniversity && (
            <EditUniversityModal
              university={editingUniversity}
              onClose={handleCloseEdit}
              onSave={handleSave}
            />
          )}

          {/* Create Modal */}
          {isCreating && (
            <EditUniversityModal
              university={null}
              onClose={handleCloseCreate}
              onSave={handleSave}
            />
          )}

          {/* Import Modal */}
          {importOpen && (
            <ImportUniversitiesModal
              isOpen={importOpen}
              onClose={() => setImportOpen(false)}
              onImport={(items) => {
                addUniversities(items);
                setImportOpen(false);
                toast.success(`Đã import ${items.length} trường`);
              }}
            />
          )}
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  );
}
