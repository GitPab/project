import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import type { University, AdditionalFee } from '../context/AppContext';
import PriceInput from './PriceInput';
import { X, Plus, Trash2, Upload, AlertCircle, Save, Check, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import CostInputForm from './CostInputForm';
import {
  validateCost, validateWordCount, validateImage,
  validateUniversityName, validateCountry,
} from '../utils/validation';

interface CostConfig {
  visa_systems?: Record<string, any>;
  common_fees_vnd?: Record<string, any>;
}

const TUITION_FIELDS = ['generalTuition', 'visaFee', 'accommodationFee', 'insuranceFee'] as const;
const MAX_WORD_COUNT = 250;
const DRAFT_SAVE_DELAY = 1000;
const DRAFT_RESTORE_TIMEOUT = 2000;

export interface UniversityFormProps {
  university?: University;
  onClose: () => void;
  onSave: (data: Partial<University>) => void;
}

interface FormData {
  name: string;
  koreanName: string;
  region: string;
  topTier: 'Top1' | 'Top2' | 'Top3';
  country: string;
  overview: string;
  generalTuition: number;
  visaFee: number;
  accommodationFee: number;
  insuranceFee: number;
  additionalFees: AdditionalFee[];
  galleryImages: string[];
  isKoreanUniversity: boolean;
  majors: string[];
  ranking: string;
  partTimeInfo: string;
  supportPolicies: string[];
  refundPolicy: string;
  admissionsType: string;
}

export default function UniversityForm({ university, onClose, onSave }: UniversityFormProps) {
  const { currency, formatFrom } = useCurrency();
  const isEditMode = !!university;
  const draftKey = university ? `university-draft-${university.id}` : null;

  const [formData, setFormData] = useState<FormData>({
    name: university?.name || '',
    koreanName: university?.koreanName || '',
    region: university?.region || university?.koreanData?.address || '',
    topTier: university?.koreanData?.topTier || 'Top2',
    country: university?.country || '',
    overview: university?.overview || '',
    generalTuition: university?.generalTuition || 0,
    visaFee: university?.visaFee || 0,
    accommodationFee: university?.accommodationFee || 0,
    insuranceFee: university?.insuranceFee || 0,
    additionalFees: university?.additionalFees ? [...university.additionalFees] : [],
    galleryImages: university?.galleryImages ? [...university.galleryImages] : [],
    isKoreanUniversity: university?.koreanData?.isKoreanUniversity ?? true,
    majors: university?.majors || university?.koreanData?.majors || [],
    ranking: university?.ranking || university?.koreanData?.koreanRanking || '',
    partTimeInfo: university?.koreanData?.partTimeInfo || '',
    supportPolicies: university?.koreanData?.supportPolicies || [],
    refundPolicy: university?.koreanData?.refundPolicy || '',
    admissionsType: university?.koreanData?.admissionsType || '',
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [wordCount, setWordCount] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveErrorShown, setAutoSaveErrorShown] = useState(false);
  const [showCostForm, setShowCostForm] = useState(false);
  const [pendingCostConfig, setPendingCostConfig] = useState<CostConfig | null>(null);

  useEffect(() => {
    if (!isEditMode || !draftKey) return;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.overview && draft.overview !== university?.overview) {
          const shouldRestore = window.confirm('Tìm thấy bản nháp đã lưu. Bạn có muốn khôi phục không?');
          if (shouldRestore) setFormData((prev) => ({ ...prev, overview: draft.overview }));
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') console.error('Failed to parse draft:', e);
      }
    }
  }, [isEditMode, draftKey, university?.overview]);

  useEffect(() => {
    if (!isEditMode || !draftKey || !formData.overview) return;
    if (formData.overview !== university?.overview) {
      setAutoSaveStatus('saving');
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem(draftKey, JSON.stringify({ overview: formData.overview, timestamp: new Date().toISOString() }));
          setAutoSaveStatus('saved');
          setTimeout(() => setAutoSaveStatus('idle'), DRAFT_RESTORE_TIMEOUT);
        } catch (e) {
          setAutoSaveStatus('idle');
          if (!autoSaveErrorShown) {
            toast.warning('Không thể tự động lưu nháp (bộ nhớ có thể đầy)');
            setAutoSaveErrorShown(true);
          }
        }
      }, DRAFT_SAVE_DELAY);
      return () => clearTimeout(timeoutId);
    }
  }, [formData.overview, isEditMode, draftKey, university?.overview, autoSaveErrorShown]);

  useEffect(() => {
    const words = formData.overview.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  }, [formData.overview]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setIsDragging(false);
    let validFiles = 0;
    const imageErrors: string[] = [];
    acceptedFiles.forEach((file) => {
      const errors = validateImage(file);
      if (errors.length > 0) { imageErrors.push(...errors); }
      else {
        validFiles++;
        const reader = new FileReader();
        reader.onload = () => {
          setFormData((prev) => ({ ...prev, galleryImages: [...prev.galleryImages, reader.result as string] }));
          setFieldErrors((prev) => { const n = { ...prev }; delete n.galleryImages; return n; });
        };
        reader.readAsDataURL(file);
      }
    });
    if (imageErrors.length > 0) toast.error('Không thể thêm một số ảnh', { description: imageErrors.join('; ') });
    if (validFiles > 0) toast.success(`Đã thêm ${validFiles} ảnh`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    multiple: true,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  const removeImage = (index: number) => {
    setFormData((prev) => ({ ...prev, galleryImages: prev.galleryImages.filter((_, i) => i !== index) }));
    toast.success('Đã xóa ảnh');
  };

  const addFee = () => {
    setFormData({ ...formData, additionalFees: [...formData.additionalFees, { type: '', amount: 0 }] });
  };

  const removeFee = (index: number) => {
    setFormData({ ...formData, additionalFees: formData.additionalFees.filter((_, i) => i !== index) });
  };

  const handleFeeChange = (index: number, field: keyof AdditionalFee, value: string | number) => {
    const newFees = [...formData.additionalFees];
    newFees[index] = { ...newFees[index], [field]: value };
    setFormData({ ...formData, additionalFees: newFees });
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const newFieldErrors: Record<string, string[]> = {};
    const nameErrors = validateUniversityName(formData.name);
    if (nameErrors.length > 0) {
      errors.push(...nameErrors);
      newFieldErrors.name = nameErrors;
    }
    const countryErrors = validateCountry(formData.country);
    if (countryErrors.length > 0) {
      errors.push(...countryErrors);
      newFieldErrors.country = countryErrors;
    }
    TUITION_FIELDS.forEach((field) => {
      const errs = validateCost(formData[field]);
      if (errs.length > 0) {
        errors.push(...errs);
        newFieldErrors[field] = errs;
      }
    });
    if (isEditMode) {
      const descResult = validateWordCount(formData.overview);
      if (!descResult.isValid) {
        errors.push(...descResult.errors);
        newFieldErrors.overview = descResult.errors;
      }
      if (formData.galleryImages.length === 0) {
        errors.push('Cần ít nhất 1 ảnh trong thư viện');
        newFieldErrors.galleryImages = ['Cần ít nhất 1 ���nh'];
      }
    }
    setValidationErrors(errors);
    setFieldErrors(newFieldErrors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Vui lòng sửa các lỗi trước khi lưu');
      return;
    }
    try {
      setIsSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (draftKey) localStorage.removeItem(draftKey);
      const dataToSave: Partial<University> = {
        name: formData.name,
        koreanName: formData.koreanName,
        region: formData.region,
        country: formData.country,
        ranking: formData.ranking,
        generalTuition: formData.generalTuition,
        visaFee: formData.visaFee,
        accommodationFee: formData.accommodationFee,
        insuranceFee: formData.insuranceFee,
        additionalFees: formData.additionalFees,
        majors: formData.majors,
        ...(pendingCostConfig?.visa_systems ? { visa_systems: pendingCostConfig.visa_systems } : {}),
        koreanData: {
          ...(university?.koreanData || { isKoreanUniversity: true }),
          topTier: formData.topTier,
          topVisa: formData.topTier === 'Top3' ? 'Top 3' : formData.topTier === 'Top2' ? 'Top 2' : 'Top 1',
          address: formData.region || university?.koreanData?.address,
          isKoreanUniversity: formData.isKoreanUniversity,
          koreanRanking: formData.ranking,
          majors: formData.majors,
          partTimeInfo: formData.partTimeInfo,
          supportPolicies: formData.supportPolicies,
          refundPolicy: formData.refundPolicy,
          admissionsType: formData.admissionsType,
          commonFeesVND: Array.isArray((pendingCostConfig as any)?.common_fees) ? (pendingCostConfig as any).common_fees : undefined,
        } as any,
      };
      if (isEditMode) {
        dataToSave.overview = formData.overview;
        dataToSave.galleryImages = formData.galleryImages;
      }
      onSave(dataToSave);
      toast.success(isEditMode ? 'Cập nhật trường thành công!' : 'Thêm trường thành công!');
    } catch (error) {
      toast.error('Lưu thất bại, vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = useMemo(() => (field: string) =>
    `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${
      fieldErrors[field]?.length ? 'border-red-500' : 'border-slate-300 focus:border-primary'
    }`, [fieldErrors]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col my-8">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isEditMode ? 'Chỉnh sửa trường' : 'Thêm trường mới'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEditMode ? `Dữ liệu lưu trữ theo VND. Hiển thị theo ${currency}.` : 'Điền thông tin cơ bản để thêm trường mới'}
            </p>
            {isEditMode && autoSaveStatus === 'saving' && (
              <span className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                <Save className="w-3 h-3 animate-pulse" /> Đang lưu nháp...
              </span>
            )}
            {isEditMode && autoSaveStatus === 'saved' && (
              <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <Check className="w-3 h-3" /> Đã lưu nháp
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1" disabled={isSubmitting}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Validation errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-2">Có lỗi xảy ra</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                    {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {/* Thông tin cơ bản */}
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                Thông tin cơ bản
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tên trường <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.name}
                    onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setFieldErrors((p) => ({ ...p, name: [] })); }}
                    className={inputClass('name')} placeholder="Nhập tên trường" required disabled={isSubmitting} />
                  {fieldErrors.name?.[0] && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.name[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên tiếng Hàn</label>
                  <input type="text" value={formData.koreanName}
                    onChange={(e) => setFormData({ ...formData, koreanName: e.target.value })}
                    className={inputClass('koreanName')} placeholder="Tên tiếng Hàn" disabled={isSubmitting} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Khu vực</label>
                  <input type="text" value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className={inputClass('region')} placeholder="Seoul, Busan, Gyeonggi..." disabled={isSubmitting} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Top Tier</label>
                  <select value={formData.topTier}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, topTier: e.target.value as 'Top1' | 'Top2' | 'Top3' })}
                    className={inputClass('topTier')} disabled={isSubmitting}>
                    <option value="Top1">Top 1 — Dễ visa nhất</option>
                    <option value="Top2">Top 2 — Visa trung bình</option>
                    <option value="Top3">Top 3 — Hạn chế visa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Quốc gia <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.country}
                    onChange={(e) => { setFormData({ ...formData, country: e.target.value }); setFieldErrors((p) => ({ ...p, country: [] })); }}
                    className={inputClass('country')} placeholder="South Korea" required disabled={isSubmitting} />
                  {fieldErrors.country?.[0] && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.country[0]}</p>}
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input type="checkbox" id="isKorean" checked={formData.isKoreanUniversity}
                    onChange={(e) => setFormData({ ...formData, isKoreanUniversity: e.target.checked })}
                    className="w-4 h-4" disabled={isSubmitting} />
                  <label htmlFor="isKorean" className="text-sm text-slate-700">
                    Đại học Hàn Quốc (sử dụng cấu trúc chi phí mới)
                  </label>
                </div>
              </div>
            </div>

            {/* Mô tả (cả Add và Edit) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">
                  Mô tả (tối đa {MAX_WORD_COUNT} từ)
                </label>
                <span className={`text-xs font-medium ${wordCount <= MAX_WORD_COUNT ? 'text-green-600' : 'text-red-600'}`}>
                  {wordCount} / {MAX_WORD_COUNT}
                </span>
              </div>
              <textarea value={formData.overview}
                onChange={(e) => { setFormData({ ...formData, overview: e.target.value }); setFieldErrors((p) => ({ ...p, overview: [] })); }}
                className={`w-full px-4 py-3 rounded-lg border min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none ${
                  fieldErrors.overview?.length ? 'border-red-500' : wordCount > MAX_WORD_COUNT ? 'border-orange-400' : 'border-slate-300'
                }`}
                placeholder="Mô tả ngắn về trường..."
                disabled={isSubmitting} />
              {fieldErrors.overview?.[0] && <p className="text-xs text-red-600 mt-1">{fieldErrors.overview[0]}</p>}
            </div>

            {/* Chuyên ngành (majors) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Chuyên ngành đào tạo
              </label>
              <p className="text-xs text-slate-500 mb-2">Nhập mỗi chuyên ngành trên một dòng hoặc cách nhau bằng dấu phẩy</p>
              <textarea
                value={formData.majors.join('\n')}
                onChange={(e) => {
                  const value = e.target.value;
                  const majors = value.split(/[\n,]+/).map(m => m.trim()).filter(m => m.length > 0);
                  setFormData({ ...formData, majors });
                }}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="Khoa học máy tính\nKinh tế\nQuản trị kinh doanh"
                disabled={isSubmitting}
              />
              {formData.majors.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.majors.map((major, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {major}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Xếp hạng */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Xếp hạng
              </label>
              <input
                type="text"
                value={formData.ranking}
                onChange={(e) => setFormData({ ...formData, ranking: e.target.value })}
                className={inputClass('ranking')}
                placeholder="Ví dụ: 15/200 trường đại học tại Hàn Quốc"
                disabled={isSubmitting}
              />
            </div>

            {/* Thông tin bổ sung cho Đại học Hàn */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 pb-2 border-b border-slate-100">
                Thông tin bổ sung
              </h3>

              {/* Việc làm thêm */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Việc làm thêm
                </label>
                <textarea
                  value={formData.partTimeInfo}
                  onChange={(e) => setFormData({ ...formData, partTimeInfo: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="Thông tin về việc làm thêm cho sinh viên..."
                  disabled={isSubmitting}
                />
              </div>

              {/* Chính sách hỗ trợ */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Chính sách hỗ trợ
                </label>
                <p className="text-xs text-slate-500 mb-2">Mỗi dòng một chính sách</p>
                <textarea
                  value={formData.supportPolicies.join('\n')}
                  onChange={(e) => {
                    const value = e.target.value;
                    const policies = value.split('\n').map(p => p.trim()).filter(p => p.length > 0);
                    setFormData({ ...formData, supportPolicies: policies });
                  }}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="Đón sân bay\nHỗ trợ CCCC nước ngoài\nChuyển đổi visa"
                  disabled={isSubmitting}
                />
                {formData.supportPolicies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.supportPolicies.map((policy, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {policy}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Chính sách hoàn tiền */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Chính sách hoàn tiền
                </label>
                <textarea
                  value={formData.refundPolicy}
                  onChange={(e) => setFormData({ ...formData, refundPolicy: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="Linh hoạt, hoàn 100% nếu TKN học viên, trung tâm hoặc người ủy quyền"
                  disabled={isSubmitting}
                />
              </div>

              {/* Hình thức xét tuyển */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hình thức xét tuyển
                </label>
                <input
                  type="text"
                  value={formData.admissionsType}
                  onChange={(e) => setFormData({ ...formData, admissionsType: e.target.value })}
                  className={inputClass('admissionsType')}
                  placeholder="Xét hồ sơ + Phỏng vấn"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Gallery ảnh (chỉ Edit) */}
            {isEditMode && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-700">
                    Thư viện ảnh <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-xs font-medium ${formData.galleryImages.length > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    {formData.galleryImages.length} ảnh — Cần ít nhất 1 ảnh
                  </span>
                </div>
                <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                  isDragActive || isDragging ? 'border-primary bg-primary/5' :
                  fieldErrors.galleryImages?.length ? 'border-red-400 bg-red-50' :
                  'border-slate-300 hover:border-primary hover:bg-slate-50'
                }`}>
                  <input {...getInputProps()} />
                  <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragActive ? 'text-primary' : 'text-slate-400'}`} />
                  <p className="text-slate-700 font-medium mb-1">{isDragActive ? 'Thả ảnh vào đây...' : 'Kéo thả ảnh vào đây'}</p>
                  <p className="text-sm text-slate-500">hoặc click để chọn file</p>
                  <p className="text-xs text-slate-400 mt-2">PNG, JPG, JPEG, GIF, WebP</p>
                </div>
                {fieldErrors.galleryImages?.[0] && <p className="text-xs text-red-600 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.galleryImages[0]}</p>}
                {formData.galleryImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {formData.galleryImages.map((img, i) => (
                      <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
                        <img src={img} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => removeImage(i)} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quản lý chi phí */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-slate-900">
                  Quản lý chi phí (Đại học Hàn)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCostForm(true)}
                  className="relative z-10 flex items-center gap-1 px-3 py-1.5 text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Cấu hình chi phí
                </button>
              </div>
              <div onClick={() => setShowCostForm(true)} className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-700 cursor-pointer">
                {pendingCostConfig ? (
                  <span>Da co cau hinh chi phi. Ban co the mo lai de chinh sua.</span>
                ) : (
                  <span>Nhan "Cau hinh chi phi" de thiet lap chi phi theo cau truc moi cho tat ca cac he visa.</span>
                )}
              </div>
            </div>

            {/* Phí bổ sung */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-700">Phí bổ sung ({currency})</label>
                <button type="button" onClick={addFee}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  disabled={isSubmitting}>
                  <Plus className="w-4 h-4" /> Thêm phí
                </button>
              </div>
              <div className="space-y-3 mb-3">
                {formData.additionalFees.map((fee, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                    <div>
                      <label className="text-xs text-slate-600 mb-1 block">Loại phí</label>
                      <input type="text" value={fee.type}
                        onChange={(e) => handleFeeChange(index, 'type', e.target.value)}
                        placeholder="Phí hồ sơ, phí nhập học..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        disabled={isSubmitting} />
                    </div>
                    <PriceInput label="Số tiền" value={fee.amount}
                      onChange={(vnd) => handleFeeChange(index, 'amount', vnd)}
                      disabled={isSubmitting} placeholder="0" />
                    <button type="button" onClick={() => removeFee(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mb-0.5"
                      disabled={isSubmitting}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              {formData.additionalFees.length === 0 && (
                <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center text-slate-500 text-sm">
                  Chưa có phí bổ sung
                </div>
              )}
              {formData.additionalFees.length > 0 && (
                <div className="rounded-lg border border-slate-200 overflow-hidden mt-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loại phí</TableHead>
                        <TableHead className="text-right">Số tiền</TableHead>
                        <TableHead className="text-right">Xóa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.additionalFees.map((fee, i) => (
                        <TableRow key={i}>
                          <TableCell>{fee.type || '—'}</TableCell>
                          <TableCell className="text-right font-semibold">{formatFrom(fee.amount || 0, 'VND')}</TableCell>
                          <TableCell className="text-right">
                            <button type="button" onClick={() => removeFee(i)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" disabled={isSubmitting}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-slate-50">
                        <TableCell className="font-semibold">Tổng phí bổ sung</TableCell>
                        <TableCell className="text-right font-bold">
                          {formatFrom(formData.additionalFees.reduce((s, f) => s + (f.amount || 0), 0), 'VND')}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium disabled:opacity-50"
            disabled={isSubmitting}>
            Hủy
          </button>
          <button type="button" onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader className="w-4 h-4 animate-spin" /> Đang lưu...</>
            ) : (
              <><Check className="w-4 h-4" />{isEditMode ? 'Lưu thay đổi' : 'Thêm trường'}</>
            )}
          </button>
        </div>
      </div>

      {showCostForm && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCostForm(false);
          }}
          className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ zIndex: 70 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden my-8"
          >
            <CostInputForm
              universityName={formData.name}
              initialData={pendingCostConfig as any || undefined}
              onSave={(costData) => {
                setPendingCostConfig(costData);
                setShowCostForm(false);
                toast.success('Da luu cau hinh chi phi');
              }}
              onCancel={() => setShowCostForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
