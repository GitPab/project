import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Edit, Eye, Lock, Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { useApp, University } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency, Currency } from '../context/CurrencyContext';
import EditUniversityModal from '../components/EditUniversityModal';
import ImportUniversitiesModal from '../components/ImportUniversitiesModal';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import ErrorBoundary from '../../ErrorBoundary';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

const TOP_FILTERS = ['all', 'Top1', 'Top2', 'Top3'] as const;

type TopFilter = typeof TOP_FILTERS[number];

type NormalizedTier = 'Top1' | 'Top2' | 'Top3' | undefined;

const normalizeTier = (tier?: string): NormalizedTier => {
  if (!tier) return undefined;
  if (tier.startsWith('Top ')) return `Top${tier.replace('Top ', '')}` as NormalizedTier;
  if (tier.startsWith('Top')) return tier as NormalizedTier;
  return undefined;
};

const calculateTotal = (uni: University) =>
  uni.generalTuition +
  uni.visaFee +
  uni.accommodationFee +
  uni.insuranceFee +
  uni.additionalFees.reduce((sum, fee) => sum + fee.amount, 0);

const calculateFixedCosts = (uni: University) =>
  uni.fixedCosts?.reduce((sum, cost) => sum + (cost.amount || 0), 0) || 0;

export default function UniversitiesList() {
  const navigate = useNavigate();
  const { universities, updateUniversity, addUniversities } = useApp();
  const { isAdmin } = useAuth();
  const { currency, setCurrency, formatFrom } = useCurrency();

  const [topFilter, setTopFilter] = useState<TopFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [activeUniversity, setActiveUniversity] = useState<University | undefined>(undefined);
  const [importOpen, setImportOpen] = useState(false);

  const koreanUniversities = useMemo(() => {
    return universities.filter((uni) => uni.koreanData?.isKoreanUniversity || uni.country === 'South Korea');
  }, [universities]);

  const filteredUniversities = useMemo(() => {
    if (topFilter === 'all') return koreanUniversities;
    return koreanUniversities.filter((uni) => {
      const tier = normalizeTier(uni.topTier || uni.koreanData?.topTier || uni.koreanData?.topVisa);
      return tier === topFilter;
    });
  }, [koreanUniversities, topFilter]);

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

  const handleSave = (data: Partial<University>) => {
    if (createMode) {
      const timestamp = Date.now();
      const newUni: University = {
        id: data.id || `custom-${timestamp}`,
        name: data.name || 'New University',
        koreanName: data.koreanName,
        region: data.region,
        topTier: data.topTier || 'Top2',
        country: 'South Korea',
        countryCode: 'KR',
        tagline: data.tagline || 'Trường đại học Hàn Quốc',
        thumbnail:
          data.thumbnail ||
          'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&auto=format&fit=crop',
        heroImage:
          data.heroImage ||
          'https://images.unsplash.com/photo-1460518451285-97b6aa326961?w=1600&auto=format&fit=crop',
        overview: data.overview || '',
        academicPrograms: data.academicPrograms || [],
        galleryImages: data.galleryImages || [],
        ranking: data.ranking || '',
        worldRanking: data.worldRanking || 0,
        generalTuition: data.generalTuition || 0,
        visaFee: data.visaFee || 0,
        accommodationFee: data.accommodationFee || 0,
        insuranceFee: data.insuranceFee || 0,
        additionalFees: data.additionalFees || [],
        koreanData: data.koreanData || {
          isKoreanUniversity: true,
          topTier: data.topTier || 'Top2',
          topVisa: data.topTier === 'Top1' ? 'Top 1' : data.topTier === 'Top3' ? 'Top 3' : 'Top 2',
          address: data.region,
        },
        fixedCosts: data.fixedCosts || [],
        optionalAddons: data.optionalAddons || [],
        majors: data.majors || [],
      };
      addUniversities([newUni]);
      toast.success('Đã thêm trường mới');
    } else if (activeUniversity) {
      updateUniversity(activeUniversity.id, data);
      toast.success('Đã cập nhật thông tin trường');
    }
  };

  return (
    <ErrorBoundary>
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
                  ? 'bg-primary text-white shadow'
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

      <Card className="hidden lg:block">
        <CardContent className="p-0">
          <Table className="min-w-[1200px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Tên trường</TableHead>
                <TableHead className="w-[220px]">Tên tiếng Hàn</TableHead>
                <TableHead className="w-[130px]">Quốc gia</TableHead>
                <TableHead className="w-[160px]">Khu vực</TableHead>
                <TableHead className="text-right w-[140px]">Chi phí cố định</TableHead>
                <TableHead className="text-right w-[120px]">Học phí</TableHead>
                <TableHead className="text-right w-[120px]">Phí visa</TableHead>
                <TableHead className="text-right w-[120px]">Lưu trú</TableHead>
                <TableHead className="text-right w-[120px]">Bảo hiểm</TableHead>
                <TableHead className="text-right w-[140px]">Tổng ước tính</TableHead>
                {isAdmin && <TableHead className="text-center w-[140px]">Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUniversities.map((uni) => (
                <TableRow key={uni.id}>
                  <TableCell className="font-semibold text-slate-900 truncate">{uni.name}</TableCell>
                  <TableCell className="truncate">{uni.koreanName || '—'}</TableCell>
                  <TableCell>{uni.country || 'South Korea'}</TableCell>
                  <TableCell className="truncate">{uni.region || uni.koreanData?.address || '—'}</TableCell>
                  <TableCell className="text-right">{formatFrom(calculateFixedCosts(uni), 'VND')}</TableCell>
                  <TableCell className="text-right">{formatFrom(uni.generalTuition, 'VND')}</TableCell>
                  <TableCell className="text-right">{formatFrom(uni.visaFee, 'VND')}</TableCell>
                  <TableCell className="text-right">{formatFrom(uni.accommodationFee, 'VND')}</TableCell>
                  <TableCell className="text-right">{formatFrom(uni.insuranceFee, 'VND')}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {formatFrom(calculateTotal(uni), 'VND')}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="lg:hidden space-y-4">
        {filteredUniversities.map((uni) => (
          <Card key={uni.id}>
            <CardHeader>
              <CardTitle className="text-base">{uni.name}</CardTitle>
              <CardDescription>{uni.koreanName || '—'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Quốc gia</span><span>{uni.country}</span></div>
              <div className="flex justify-between"><span>Khu vực</span><span>{uni.region || uni.koreanData?.address || '—'}</span></div>
              <div className="flex justify-between"><span>Chi phí cố định</span><span>{formatFrom(calculateFixedCosts(uni), 'VND')}</span></div>
              <div className="flex justify-between"><span>Học phí</span><span>{formatFrom(uni.generalTuition, 'VND')}</span></div>
              <div className="flex justify-between"><span>Phí visa</span><span>{formatFrom(uni.visaFee, 'VND')}</span></div>
              <div className="flex justify-between"><span>Lưu trú</span><span>{formatFrom(uni.accommodationFee, 'VND')}</span></div>
              <div className="flex justify-between"><span>Bảo hiểm</span><span>{formatFrom(uni.insuranceFee, 'VND')}</span></div>
              <div className="flex justify-between font-semibold"><span>Tổng ước tính</span><span>{formatFrom(calculateTotal(uni), 'VND')}</span></div>

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
        ))}
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
    </ErrorBoundary>
  );
}
