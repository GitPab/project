import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useApp, University } from '../context/AppContext';
import { useCurrency, Currency } from '../context/CurrencyContext';
import UniversityForm from '../components/UniversityForm';
import ImportUniversitiesModal from '../components/ImportUniversitiesModal';
import { Edit, Plus, Trash2, X, Lock, RefreshCw, Eye, Upload, ImageIcon, AlertCircle, Save, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';

export default function UniversitiesList() {
  const navigate = useNavigate();
  const { universities, updateUniversity, addUniversities, user } = useApp();
  const { currency, setCurrency, formatFrom } = useCurrency();
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
  const [createMode, setCreateMode] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [topFilter, setTopFilter] = useState<'all' | 'Top1' | 'Top2' | 'Top3'>('all');
  
  const isAdmin = user?.role === 'admin';

  const filteredUniversities = universities.filter((uni) => {
    if (topFilter === 'all') return true;
    const tier = (uni.topTier as any) || uni.koreanData?.topTier || uni.koreanData?.topVisa;
    return tier === topFilter;
  });

  const calculateTotal = (uni: University) => {
    return uni.generalTuition + uni.visaFee + uni.accommodationFee + uni.insuranceFee +
           uni.additionalFees.reduce((sum, fee) => sum + fee.amount, 0);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Currency Selector - Fixed Position */}
      <div className="fixed bottom-6 right-6 z-40 bg-white border-2 border-primary rounded-full shadow-lg overflow-hidden">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          className="px-5 py-3 font-semibold text-primary bg-white cursor-pointer focus:outline-none appearance-none pr-10"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231E40AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
        >
          <option value="VND">VND ₫</option>
          <option value="KRW">KRW ₩</option>
          <option value="USD">USD $</option>
          <option value="JPY">JPY ¥</option>
          <option value="CNY">CNY ¥</option>
        </select>
      </div>

      {/* Read-Only Notice for Students */}
      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Chế độ xem - Không thể chỉnh sửa</p>
            <p className="text-xs text-blue-700 mt-1">Thông tin chi phí chỉ để tham khảo. Liên hệ quản trị viên để cập nhật.</p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {isAdmin ? 'Universities List' : 'Danh sách trường đại học'}
        </h1>
        <p className="text-slate-600 mt-1">
          {isAdmin ? 'Manage university costs and information' : 'Xem thông tin chi phí các trường đại học'}
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          {(['all', 'Top1', 'Top2', 'Top3'] as Array<'all' | 'Top1' | 'Top2' | 'Top3'>).map((tier) => (
            <button
              key={tier}
              onClick={() => setTopFilter(tier)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                topFilter === tier ? 'bg-primary text-white shadow' : 'text-slate-700 hover:bg-white'
              }`}
            >
              {tier === 'all' ? 'Tất cả' : tier === 'Top3' ? 'Top 3 (Hạn chế visa)' : tier.replace('Top', 'Top ')}
            </button>
          ))}
        </div>

        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setCreateMode(true);
                setEditingUniversity(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm trường
            </button>
            <button
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-900">
                  {isAdmin ? 'University Name' : 'Tên trường'}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-900">
                  {isAdmin ? 'Korean Name' : 'Tên tiếng Hàn'}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-900">
                  {isAdmin ? 'Country' : 'Quốc gia'}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-900">
                  {isAdmin ? 'Region' : 'Khu vực'}
                </th>
                <th className="text-right px-4 py-3 font-semibold text-slate-900">
                  {isAdmin ? 'Tuition' : 'Học phí'}
                </th>
                <th className="text-right px-4 py-3 font-semibold text-slate-900">
                  {isAdmin ? 'Visa' : 'Visa'}
                </th>
                <th className="text-right px-4 py-3 font-semibold text-slate-900">
                  {isAdmin ? 'Accommodation' : 'Lưu trú'}
                </th>
                <th className="text-right px-4 py-3 font-semibold text-slate-900">
                  {isAdmin ? 'Insurance' : 'Bảo hiểm'}
                </th>
                <th className="text-right px-4 py-3 font-semibold text-slate-900">
                  {isAdmin ? 'Total' : 'Tổng'}
                </th>
                {isAdmin && (
                  <th className="text-center px-4 py-3 font-semibold text-slate-900">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredUniversities.map((uni) => (
                <tr key={uni.id} className="border-b border-slate-200 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{uni.name}</td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{uni.koreanName || '—'}</td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{uni.country}</td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{uni.region || uni.koreanData?.address || '—'}</td>
                  <td className="px-4 py-3 text-right text-slate-900 font-medium">{formatFrom(uni.generalTuition, 'VND')}</td>
                  <td className="px-4 py-3 text-right text-slate-900 font-medium">{formatFrom(uni.visaFee, 'VND')}</td>
                  <td className="px-4 py-3 text-right text-slate-900 font-medium">{formatFrom(uni.accommodationFee, 'VND')}</td>
                  <td className="px-4 py-3 text-right text-slate-900 font-medium">{formatFrom(uni.insuranceFee, 'VND')}</td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">{formatFrom(calculateTotal(uni), 'VND')}</td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-center">
                        <button
                          onClick={() => navigate(`/admin/university/${uni.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => setEditingUniversity(uni)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {filteredUniversities.map((uni) => (
          <div key={uni.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Thumbnail Image */}
            <div className="relative h-40 overflow-hidden">
              <img 
                src={uni.thumbnail} 
                alt={uni.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="text-white font-semibold text-base leading-tight mb-1">{uni.name}</h3>
                <p className="text-sm text-white/90">{uni.country}</p>
              </div>
              {isAdmin ? (
                <button
                  onClick={() => setEditingUniversity(uni)}
                  className="absolute top-3 right-3 p-2 bg-white/95 backdrop-blur-sm text-primary hover:bg-white rounded-lg transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
              ) : (
                <Lock className="absolute top-3 right-3 w-5 h-5 text-white/80" />
              )}
            </div>
            
            <div className="p-4">
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">{isAdmin ? 'Tuition:' : 'Học phí:'}</span>
                  <span className="font-medium text-slate-900">{formatFrom(uni.generalTuition, 'VND')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{isAdmin ? 'Visa:' : 'Visa:'}</span>
                  <span className="font-medium text-slate-900">{formatFrom(uni.visaFee, 'VND')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{isAdmin ? 'Accommodation:' : 'Lưu trú:'}</span>
                  <span className="font-medium text-slate-900">{formatFrom(uni.accommodationFee, 'VND')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{isAdmin ? 'Insurance:' : 'Bảo hiểm:'}</span>
                  <span className="font-medium text-slate-900">{formatFrom(uni.insuranceFee, 'VND')}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-900">{isAdmin ? 'Total:' : 'Tổng:'}</span>
                  <span className="font-semibold text-primary">{formatFrom(calculateTotal(uni), 'VND')}</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <button
                onClick={() => navigate(isAdmin ? `/admin/university/${uni.id}` : `/student/university/${uni.id}`)}
                className="w-full px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
              >
                {isAdmin ? 'View Details' : 'Xem chi tiết'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Add Modal - Admin Only */}
      {isAdmin && (createMode || editingUniversity) && (
        <UniversityForm
          university={createMode ? undefined : editingUniversity || undefined}
          onClose={() => {
            setCreateMode(false);
            setEditingUniversity(null);
          }}
          onSave={(data) => {
            if (createMode) {
              const newUni: University = {
                id: data.id || `custom-${Date.now()}`,
                name: data.name || 'New University',
                koreanName: data.koreanName,
                region: data.region,
                topTier: (data.topTier as any) || 'Top2',
                country: data.country || 'South Korea',
                countryCode: '🇰🇷',
                tagline: data.tagline || 'Trường mới thêm',
                thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&auto=format&fit=crop',
                heroImage: data.heroImage || 'https://images.unsplash.com/photo-1460518451285-97b6aa326961?w=1600&auto=format&fit=crop',
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
                koreanData: data.koreanData || { isKoreanUniversity: true, topTier: (data.topTier as any) || 'Top2', address: data.region },
                fixedCosts: data.fixedCosts || [],
                optionalAddons: data.optionalAddons || [],
                majors: data.majors || [],
              };
              addUniversities([newUni]);
            } else if (editingUniversity) {
              updateUniversity(editingUniversity.id, data);
            }
            setCreateMode(false);
            setEditingUniversity(null);
            toast.success('Đã lưu thông tin trường');
          }}
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
  );
}
