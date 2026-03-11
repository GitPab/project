import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useApp, University, AdditionalFee } from '../context/AppContext';
import { useCurrency, Currency } from '../context/CurrencyContext';
import { Edit, Plus, Trash2, X, Lock, RefreshCw, Eye, Upload, ImageIcon, AlertCircle, Save, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';

export default function UniversitiesList() {
  const navigate = useNavigate();
  const { universities, updateUniversity, user } = useApp();
  const { currency, setCurrency, formatFrom } = useCurrency();
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
  
  const isAdmin = user?.role === 'admin';

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

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">
                  {isAdmin ? 'University Name' : 'Tên trường'}
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">
                  {isAdmin ? 'Country' : 'Quốc gia'}
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">
                  {isAdmin ? 'General Tuition' : 'Học phí'}
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">
                  {isAdmin ? 'Visa Fee' : 'Phí visa'}
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">
                  {isAdmin ? 'Accommodation' : 'Lưu trú'}
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">
                  {isAdmin ? 'Insurance' : 'Bảo hiểm'}
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">
                  {isAdmin ? 'Total Estimated' : 'Tổng ước tính'}
                </th>
                {isAdmin && (
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-900">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {universities.map((uni) => (
                <tr key={uni.id} className="border-b border-slate-200 last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{uni.name}</td>
                  <td className="px-6 py-4 text-slate-700">{uni.country}</td>
                  <td className="px-6 py-4 text-right text-slate-900">{formatFrom(uni.generalTuition, 'USD')}</td>
                  <td className="px-6 py-4 text-right text-slate-900">{formatFrom(uni.visaFee, 'USD')}</td>
                  <td className="px-6 py-4 text-right text-slate-900">{formatFrom(uni.accommodationFee, 'USD')}</td>
                  <td className="px-6 py-4 text-right text-slate-900">{formatFrom(uni.insuranceFee, 'USD')}</td>
                  <td className="px-6 py-4 text-right font-semibold text-primary">{formatFrom(calculateTotal(uni), 'USD')}</td>
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
        {universities.map((uni) => (
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
                  <span className="font-medium text-slate-900">{formatFrom(uni.generalTuition, 'USD')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{isAdmin ? 'Visa:' : 'Visa:'}</span>
                  <span className="font-medium text-slate-900">{formatFrom(uni.visaFee, 'USD')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{isAdmin ? 'Accommodation:' : 'Lưu trú:'}</span>
                  <span className="font-medium text-slate-900">{formatFrom(uni.accommodationFee, 'USD')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{isAdmin ? 'Insurance:' : 'Bảo hiểm:'}</span>
                  <span className="font-medium text-slate-900">{formatFrom(uni.insuranceFee, 'USD')}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-900">{isAdmin ? 'Total:' : 'Tổng:'}</span>
                  <span className="font-semibold text-primary">{formatFrom(calculateTotal(uni), 'USD')}</span>
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

      {/* Edit Modal - Admin Only */}
      {isAdmin && editingUniversity && (
        <EditUniversityModal
          university={editingUniversity}
          onClose={() => setEditingUniversity(null)}
          onSave={(updates) => {
            updateUniversity(editingUniversity.id, updates);
            setEditingUniversity(null);
            toast.success('Đã cập nhật thông tin trường thành công!');
          }}
        />
      )}
    </div>
  );
}

interface EditUniversityModalProps {
  university: University;
  onClose: () => void;
  onSave: (updates: Partial<University>) => void;
}

function EditUniversityModal({ university, onClose, onSave }: EditUniversityModalProps) {
  const { currency, convertAmount, formatFrom } = useCurrency();
  const [formData, setFormData] = useState({
    name: university.name,
    country: university.country,
    overview: university.overview || '',
    generalTuition: university.generalTuition,
    visaFee: university.visaFee,
    accommodationFee: university.accommodationFee,
    insuranceFee: university.insuranceFee,
    additionalFees: [...university.additionalFees],
    galleryImages: [...university.galleryImages]
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [isDragging, setIsDragging] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    const draftKey = `university-draft-${university.id}`;
    const savedDraft = localStorage.getItem(draftKey);
    
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        // Only load overview from draft, keep other fields from university
        if (draft.overview && draft.overview !== university.overview) {
          const shouldRestore = window.confirm(
            'A saved draft was found for the description. Would you like to restore it?'
          );
          if (shouldRestore) {
            setFormData(prev => ({ ...prev, overview: draft.overview }));
          }
        }
      } catch (e) {
        // Silent fail for draft loading
      }
    }
  }, [university.id, university.overview]);

  // Auto-save description to localStorage
  useEffect(() => {
    const draftKey = `university-draft-${university.id}`;
    
    if (formData.overview && formData.overview !== university.overview) {
      setAutoSaveStatus('saving');
      
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem(draftKey, JSON.stringify({ 
            overview: formData.overview,
            timestamp: new Date().toISOString()
          }));
          setAutoSaveStatus('saved');
          
          // Reset to idle after 2 seconds
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        } catch (e) {
          // Silent fail for draft saving
          setAutoSaveStatus('idle');
        }
      }, 1000); // Auto-save after 1 second of no typing

      return () => clearTimeout(timeoutId);
    }
  }, [formData.overview, university.id, university.overview]);

  // Count words in description
  useEffect(() => {
    const words = formData.overview.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [formData.overview]);

  // Drag and drop for images
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setIsDragging(false);
    
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setFormData(prev => ({
          ...prev,
          galleryImages: [...prev.galleryImages, result]
        }));
      };
      reader.readAsDataURL(file);
    });

    toast.success(`${acceptedFiles.length} image(s) added`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: true,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false)
  });

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index)
    }));
    toast.success('Image removed');
  };

  const handleAddFee = () => {
    setFormData({
      ...formData,
      additionalFees: [...formData.additionalFees, { type: '', amount: 0 }]
    });
  };

  const handleRemoveFee = (index: number) => {
    setFormData({
      ...formData,
      additionalFees: formData.additionalFees.filter((_, i) => i !== index)
    });
  };

  const handleFeeChange = (index: number, field: keyof AdditionalFee, value: string | number) => {
    const newFees = [...formData.additionalFees];
    newFees[index] = { ...newFees[index], [field]: value };
    setFormData({ ...formData, additionalFees: newFees });
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Validate images (at least 1 required)
    if (formData.galleryImages.length === 0) {
      errors.push('At least 1 image is required in the gallery');
    }

    // Validate description (100-250 words)
    if (wordCount < 100) {
      errors.push(`Description must be at least 100 words (current: ${wordCount} words)`);
    }
    if (wordCount > 250) {
      errors.push(`Description must be at most 250 words (current: ${wordCount} words)`);
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    // Clear draft after successful save
    const draftKey = `university-draft-${university.id}`;
    localStorage.removeItem(draftKey);

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Edit University</h2>
            <div className="flex items-center gap-2 mt-1">
              {autoSaveStatus === 'saving' && (
                <span className="text-xs text-blue-600 flex items-center gap-1">
                  <Save className="w-3 h-3 animate-pulse" />
                  Saving draft...
                </span>
              )}
              {autoSaveStatus === 'saved' && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Draft saved
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 mb-2">Validation Errors</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                      {validationErrors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium text-slate-700">University Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-slate-700">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            {/* Description with word count and auto-save */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium text-slate-700">
                  Description / Overview
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm ${
                      wordCount >= 100 && wordCount <= 250 ? 'text-green-600' : 'text-orange-600'
                    } font-medium`}
                  >
                    {wordCount} từ (yêu cầu: 100–250)
                  </span>
                </div>
              </div>
              <textarea
                value={formData.overview}
                onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                className={`w-full px-4 py-3 bg-input-background rounded-lg border ${
                  wordCount > 250 || (wordCount > 0 && wordCount < 100) ? 'border-orange-400' : 'border-border'
                } focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[150px]`}
                placeholder="Mô tả trường (100–250 từ)..."
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Your draft is automatically saved as you type
              </p>
            </div>

            {/* Image Gallery with Drag & Drop */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-medium text-slate-700">
                  Gallery Images
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <span className={`text-sm ${formData.galleryImages.length > 0 ? 'text-green-600' : 'text-orange-600'} font-medium`}>
                  {formData.galleryImages.length} image(s) - Minimum 1 required
                </span>
              </div>

              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                  isDragActive || isDragging
                    ? 'border-primary bg-primary/5 scale-[0.98]'
                    : 'border-slate-300 hover:border-primary hover:bg-slate-50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className={`w-12 h-12 mx-auto mb-3 ${isDragActive ? 'text-primary' : 'text-slate-400'}`} />
                <p className="text-slate-700 font-medium mb-1">
                  {isDragActive ? 'Drop images here...' : 'Drag & drop images here'}
                </p>
                <p className="text-sm text-slate-500">or click to browse files</p>
                <p className="text-xs text-slate-400 mt-2">Supports: PNG, JPG, JPEG, GIF, WebP</p>
              </div>

              {/* Image Preview Grid */}
              {formData.galleryImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {formData.galleryImages.map((image, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
                      <img
                        src={image}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cost Fields */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-slate-900 mb-4">Cost Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium text-slate-700">General Tuition ({currency})</label>
                  <input
                    type="number"
                    value={Math.round(convertAmount(formData.generalTuition, currency, 'USD'))}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        generalTuition: convertAmount(Number(e.target.value), 'USD', currency),
                      })
                    }
                    className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Lưu nội bộ theo USD. Hiển thị theo {currency}.</p>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-slate-700">Visa Fee ({currency})</label>
                  <input
                    type="number"
                    value={Math.round(convertAmount(formData.visaFee, currency, 'USD'))}
                    onChange={(e) =>
                      setFormData({ ...formData, visaFee: convertAmount(Number(e.target.value), 'USD', currency) })
                    }
                    className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-slate-700">Accommodation Fee ({currency})</label>
                  <input
                    type="number"
                    value={Math.round(convertAmount(formData.accommodationFee, currency, 'USD'))}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accommodationFee: convertAmount(Number(e.target.value), 'USD', currency),
                      })
                    }
                    className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-slate-700">Insurance Fee ({currency})</label>
                  <input
                    type="number"
                    value={Math.round(convertAmount(formData.insuranceFee, currency, 'USD'))}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        insuranceFee: convertAmount(Number(e.target.value), 'USD', currency),
                      })
                    }
                    className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Additional Fees */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-medium text-slate-700">Additional Fees</label>
                <button
                  type="button"
                  onClick={handleAddFee}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4" />
                  Add Fee
                </button>
              </div>
              <div className="space-y-3">
                {formData.additionalFees.map((fee, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <input
                      type="text"
                      value={fee.type}
                      onChange={(e) => handleFeeChange(index, 'type', e.target.value)}
                      placeholder="Fee type"
                      className="flex-1 px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      type="number"
                      value={Math.round(convertAmount(fee.amount, currency, 'USD'))}
                      onChange={(e) => handleFeeChange(index, 'amount', convertAmount(Number(e.target.value), 'USD', currency))}
                      placeholder="Amount"
                      className="w-32 px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFee(index)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}