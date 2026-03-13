import React, { useState, useEffect, useCallback } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import type { University, AdditionalFee } from '../context/AppContext';
import PriceInput from './PriceInput';
import {
  X,
  Plus,
  Trash2,
  Upload,
  AlertCircle,
  Save,
  Check,
  Loader,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  validateCost,
  validateWordCount,
  validateImage,
  validateUniversityName,
  validateCountry,
  combineValidationErrors,
  createFieldValidationResult,
} from '../utils/validation';

/**
 * Unified university form for creating and editing universities
 * Merges functionality from AddUniversityModal and EditUniversityModal
 *
 * Props:
 * - university?: University - undefined for new, defined for edit mode
 * - onClose: () => void - callback to close the form
 * - onSave: (data: Partial<University>) => void - callback on successful save
 */

export interface UniversityFormProps {
  university?: University;
  onClose: () => void;
  onSave: (data: Partial<University>) => void;
}

export default function UniversityForm({ university, onClose, onSave }: UniversityFormProps) {
  const { currency, formatFrom } = useCurrency();
  const { isAdmin } = useAuth();
  const isEditMode = !!university;
  const draftKey = university ? `university-draft-${university.id}` : null;

  // Form State
  const [formData, setFormData] = useState({
    name: university?.name || '',
    koreanName: university?.koreanName || '',
    region: university?.region || university?.koreanData?.address || '',
    topTier: (university?.topTier as any) || university?.koreanData?.topTier || 'Top2',
    country: university?.country || '',
    overview: university?.overview || '',
    generalTuition: university?.generalTuition || 0,
    visaFee: university?.visaFee || 0,
    accommodationFee: university?.accommodationFee || 0,
    insuranceFee: university?.insuranceFee || 0,
    additionalFees: university?.additionalFees ? [...university.additionalFees] : [],
    galleryImages: university?.galleryImages ? [...university.galleryImages] : [],
  });

  // UI State
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [wordCount, setWordCount] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveErrorShown, setAutoSaveErrorShown] = useState(false);

  /**
   * Load draft from localStorage on mount (edit mode only)
   */
  useEffect(() => {
    if (!isEditMode || !draftKey) return;

    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.overview && draft.overview !== university?.overview) {
          const shouldRestore = window.confirm(
            'A saved draft was found for the description. Would you like to restore it?'
          );
          if (shouldRestore) {
            setFormData((prev) => ({ ...prev, overview: draft.overview }));
          }
        }
      } catch (e) {
        // Silent fail for draft loading
      }
    }
  }, [isEditMode, draftKey, university?.overview]);

  /**
   * Auto-save description to localStorage (edit mode only)
   */
  useEffect(() => {
    if (!isEditMode || !draftKey || !formData.overview) return;

    if (formData.overview !== university?.overview) {
      setAutoSaveStatus('saving');

      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem(
            draftKey,
            JSON.stringify({
              overview: formData.overview,
              timestamp: new Date().toISOString(),
            })
          );
          setAutoSaveStatus('saved');

          // Reset to idle after 2 seconds
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        } catch (e) {
          // Handle quota exceeded or other localStorage errors gracefully
          console.warn('Auto-save failed:', e);
          setAutoSaveStatus('idle');

          // Show user-friendly error only once per session
          if (!autoSaveErrorShown) {
            toast.warning('Could not auto-save draft (storage quota may be full)', {
              description: 'Your changes are still in the form. Save before closing.',
              duration: 5000,
            });
            setAutoSaveErrorShown(true);
          }
        }
      }, 1000); // Auto-save after 1 second of no typing

      return () => clearTimeout(timeoutId);
    }
  }, [formData.overview, isEditMode, draftKey, university?.overview, autoSaveErrorShown]);

  /**
   * Count words in description
   */
  useEffect(() => {
    const words = formData.overview.trim().split(/\s+/).filter((word) => word.length > 0);
    setWordCount(words.length);
  }, [formData.overview]);

  /**
   * Drag and drop handler for images (edit mode only)
   */
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setIsDragging(false);

    let validFiles = 0;
    const imageErrors: string[] = [];

    acceptedFiles.forEach((file) => {
      // Validate image
      const errors = validateImage(file);
      if (errors.length > 0) {
        imageErrors.push(...errors);
      } else {
        validFiles++;
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          setFormData((prev) => ({
            ...prev,
            galleryImages: [...prev.galleryImages, result],
          }));
          // Clear gallery error after adding image
          setFieldErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.galleryImages;
            return newErrors;
          });
        };
        reader.readAsDataURL(file);
      }
    });

    if (imageErrors.length > 0) {
      toast.error('Some images could not be added', {
        description: imageErrors.join('; '),
        duration: 5000,
      });
    }

    if (validFiles > 0) {
      toast.success(`${validFiles} image(s) added`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    multiple: true,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  /**
   * Remove image from gallery
   */
  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
    }));
    toast.success('Image removed');
  };

  /**
   * Add additional fee
   */
  const addFee = () => {
    setFormData({
      ...formData,
      additionalFees: [
        ...formData.additionalFees,
        { type: '', amount: 0 },
      ],
    });
    toast.success('Fee added');
  };

  /**
   * Remove additional fee
   */
  const removeFee = (index: number) => {
    setFormData({
      ...formData,
      additionalFees: formData.additionalFees.filter((_, i) => i !== index),
    });
    toast.success('Fee removed');
  };

  /**
   * Update additional fee
   */
  const handleFeeChange = (index: number, field: keyof AdditionalFee, value: string | number) => {
    const newFees = [...formData.additionalFees];
    newFees[index] = { ...newFees[index], [field]: value };
    setFormData({ ...formData, additionalFees: newFees });
  };

  /**
   * Validate individual fields and update fieldErrors state
   */
  const validateFieldName = (value: string) => {
    const errors = validateUniversityName(value);
    setFieldErrors((prev) => ({ ...prev, name: errors }));
  };

  const validateFieldCountry = (value: string) => {
    const errors = validateCountry(value);
    setFieldErrors((prev) => ({ ...prev, country: errors }));
  };

  const validateFieldCost = (fieldName: string, value: number | string) => {
    const errors = validateCost(value);
    setFieldErrors((prev) => ({ ...prev, [fieldName]: errors }));
  };

  const validateFieldDescription = (value: string) => {
    const result = validateWordCount(value);
    setFieldErrors((prev) => ({ ...prev, overview: result.errors }));
  };

  /**
   * Validate form data
   * For new universities: skip images and description
   * For existing: validate both
   */
  const validateForm = (): boolean => {
    const errors: string[] = [];
    const newFieldErrors: Record<string, string[]> = {};

    // Validate university name
    const nameErrors = validateUniversityName(formData.name);
    if (nameErrors.length > 0) {
      errors.push(...nameErrors);
      newFieldErrors.name = nameErrors;
    }

    // Validate country
    const countryErrors = validateCountry(formData.country);
    if (countryErrors.length > 0) {
      errors.push(...countryErrors);
      newFieldErrors.country = countryErrors;
    }

    // Validate costs
    const tuitionErrors = validateCost(formData.generalTuition);
    if (tuitionErrors.length > 0) {
      errors.push(...tuitionErrors);
      newFieldErrors.generalTuition = tuitionErrors;
    }

    const visaErrors = validateCost(formData.visaFee);
    if (visaErrors.length > 0) {
      errors.push(...visaErrors);
      newFieldErrors.visaFee = visaErrors;
    }

    const accommodationErrors = validateCost(formData.accommodationFee);
    if (accommodationErrors.length > 0) {
      errors.push(...accommodationErrors);
      newFieldErrors.accommodationFee = accommodationErrors;
    }

    const insuranceErrors = validateCost(formData.insuranceFee);
    if (insuranceErrors.length > 0) {
      errors.push(...insuranceErrors);
      newFieldErrors.insuranceFee = insuranceErrors;
    }

    // Edit-mode specific validation
    if (isEditMode) {
      // Validate description word count
      const descriptionResult = validateWordCount(formData.overview);
      if (!descriptionResult.isValid) {
        errors.push(...descriptionResult.errors);
        newFieldErrors.overview = descriptionResult.errors;
      }

      // Validate images (at least 1 required)
      if (formData.galleryImages.length === 0) {
        errors.push('At least 1 image is required in the gallery');
        newFieldErrors.galleryImages = ['At least 1 image is required'];
      }
    }

    setValidationErrors(errors);
    setFieldErrors(newFieldErrors);
    return errors.length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    try {
      setIsSubmitting(true);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Clear draft after successful save (edit mode only)
      if (draftKey) {
        localStorage.removeItem(draftKey);
      }

      // Prepare data for save
      const dataToSave: Partial<University> = {
        name: formData.name,
        koreanName: formData.koreanName,
        region: formData.region,
        topTier: formData.topTier as any,
        country: formData.country,
        generalTuition: formData.generalTuition,
        visaFee: formData.visaFee,
        accommodationFee: formData.accommodationFee,
        insuranceFee: formData.insuranceFee,
        additionalFees: formData.additionalFees,
        koreanData: {
          ...(university?.koreanData || { isKoreanUniversity: true }),
          topTier: formData.topTier as any,
          topVisa: formData.topTier === 'Top3' ? 'Top 3' : formData.topTier === 'Top2' ? 'Top 2' : 'Top 1',
          address: formData.region || university?.koreanData?.address,
        },
      };

      // Include edit-mode specific data
      if (isEditMode) {
        dataToSave.overview = formData.overview;
        dataToSave.galleryImages = formData.galleryImages;
      }

      onSave(dataToSave);
      toast.success(isEditMode ? 'University updated successfully!' : 'University added successfully!');
    } catch (error) {
      toast.error('Failed to save university');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isEditMode ? 'Edit University' : 'Add New University'}
            </h2>
            {isEditMode && (
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
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
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

            {/* Basic Info Section */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    University Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      // Clear error on change
                      setFieldErrors((prev) => ({ ...prev, name: [] }));
                    }}
                    onBlur={() => validateFieldName(formData.name)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${
                      fieldErrors.name && fieldErrors.name.length > 0
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-slate-300 focus:border-primary'
                    }`}
                    placeholder="Enter university name"
                    required
                    disabled={isSubmitting}
                  />
                    {fieldErrors.name && fieldErrors.name.length > 0 && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors.name[0]}
                      </p>
                    )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Korean Name
                  </label>
                  <input
                    type="text"
                    value={formData.koreanName}
                    onChange={(e) => {
                      setFormData({ ...formData, koreanName: e.target.value });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${
                      'border-slate-300 focus:border-primary'
                    }`}
                    placeholder="Tên tiếng Hàn"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Khu vực
                  </label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 border-slate-300 focus:border-primary"
                    placeholder="Seoul, Busan, Gyeonggi..."
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Top Tier
                  </label>
                  <select
                    value={formData.topTier}
                    onChange={(e) => setFormData({ ...formData, topTier: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 border-slate-300 focus:border-primary"
                  >
                    <option value="Top1">Top 1</option>
                    <option value="Top2">Top 2</option>
                    <option value="Top3">Top 3 (Hạn chế visa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => {
                      setFormData({ ...formData, country: e.target.value });
                      setFieldErrors((prev) => ({ ...prev, country: [] }));
                    }}
                    onBlur={() => validateFieldCountry(formData.country)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${
                      fieldErrors.country && fieldErrors.country.length > 0
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-slate-300 focus:border-primary'
                    }`}
                    placeholder="Enter country name"
                    required
                    disabled={isSubmitting}
                  />
                  {fieldErrors.country && fieldErrors.country.length > 0 && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.country[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Description Section (Edit Mode Only) */}
            {isEditMode && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-slate-700">
                    Description / Overview
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm ${
                        wordCount <= 250 ? 'text-green-600' : 'text-red-600'
                      } font-medium`}
                    >
                      {wordCount} / 250 words
                    </span>
                  </div>
                </div>
                <textarea
                  value={formData.overview}
                  onChange={(e) => {
                    setFormData({ ...formData, overview: e.target.value });
                    // Clear error on change
                    setFieldErrors((prev) => ({ ...prev, overview: [] }));
                  }}
                  onBlur={() => validateFieldDescription(formData.overview)}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    fieldErrors.overview && fieldErrors.overview.length > 0
                      ? 'border-red-500 focus:border-red-500'
                      : wordCount > 250
                      ? 'border-orange-400'
                      : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[150px]`}
                  placeholder="Describe the university (max 250 words)..."
                  disabled={isSubmitting}
                />
                {fieldErrors.overview && fieldErrors.overview.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {fieldErrors.overview.map((error, idx) => (
                      <p key={idx} className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {error}
                      </p>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Your draft is automatically saved as you type
                </p>
              </div>
            )}

            {/* Image Gallery Section (Edit Mode Only) */}
            {isEditMode && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="font-medium text-slate-700">
                    Gallery Images
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <span
                    className={`text-sm ${
                      formData.galleryImages.length > 0 ? 'text-green-600' : 'text-orange-600'
                    } font-medium`}
                  >
                    {formData.galleryImages.length} image(s) - Minimum 1 required
                  </span>
                </div>

                {/* Dropzone */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                    isDragActive || isDragging
                      ? 'border-primary bg-primary/5 scale-[0.98]'
                      : fieldErrors.galleryImages && fieldErrors.galleryImages.length > 0
                      ? 'border-red-400 bg-red-50 hover:border-red-500'
                      : 'border-slate-300 hover:border-primary hover:bg-slate-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload
                    className={`w-12 h-12 mx-auto mb-3 ${
                      isDragActive
                        ? 'text-primary'
                        : fieldErrors.galleryImages && fieldErrors.galleryImages.length > 0
                        ? 'text-red-500'
                        : 'text-slate-400'
                    }`}
                  />
                  <p className="text-slate-700 font-medium mb-1">
                    {isDragActive ? 'Drop images here...' : 'Drag & drop images here'}
                  </p>
                  <p className="text-sm text-slate-500">or click to browse files</p>
                  <p className="text-xs text-slate-400 mt-2">
                    Supports: PNG, JPG, JPEG, GIF, WebP
                  </p>
                </div>

                {fieldErrors.galleryImages && fieldErrors.galleryImages.length > 0 && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.galleryImages[0]}
                  </p>
                )}

                {/* Image Preview Grid */}
                {formData.galleryImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {formData.galleryImages.map((image, index) => (
                      <div
                        key={index}
                        className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200"
                      >
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
                            disabled={isSubmitting}
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
            )}

            {/* Cost Information Section */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-slate-900 mb-4">Cost Information ({currency})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PriceInput
                  label="General Tuition"
                  value={formData.generalTuition}
                  onChange={(vnd) => {
                    setFormData({ ...formData, generalTuition: vnd });
                    setFieldErrors((prev) => ({ ...prev, generalTuition: [] }));
                  }}
                  onBlur={() => validateFieldCost('generalTuition', formData.generalTuition)}
                  error={fieldErrors.generalTuition}
                  required
                  disabled={isSubmitting}
                  placeholder="0"
                />

                <PriceInput
                  label="Visa Fee"
                  value={formData.visaFee}
                  onChange={(vnd) => {
                    setFormData({ ...formData, visaFee: vnd });
                    setFieldErrors((prev) => ({ ...prev, visaFee: [] }));
                  }}
                  onBlur={() => validateFieldCost('visaFee', formData.visaFee)}
                  error={fieldErrors.visaFee}
                  required
                  disabled={isSubmitting}
                  placeholder="0"
                />

                <PriceInput
                  label="Accommodation Fee"
                  value={formData.accommodationFee}
                  onChange={(vnd) => {
                    setFormData({ ...formData, accommodationFee: vnd });
                    setFieldErrors((prev) => ({ ...prev, accommodationFee: [] }));
                  }}
                  onBlur={() => validateFieldCost('accommodationFee', formData.accommodationFee)}
                  error={fieldErrors.accommodationFee}
                  required
                  disabled={isSubmitting}
                  placeholder="0"
                />

                <PriceInput
                  label="Insurance Fee"
                  value={formData.insuranceFee}
                  onChange={(vnd) => {
                    setFormData({ ...formData, insuranceFee: vnd });
                    setFieldErrors((prev) => ({ ...prev, insuranceFee: [] }));
                  }}
                  onBlur={() => validateFieldCost('insuranceFee', formData.insuranceFee)}
                  error={fieldErrors.insuranceFee}
                  required
                  disabled={isSubmitting}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Additional Fees Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-medium text-slate-700">Additional Fees ({currency})</label>
                <button
                  type="button"
                  onClick={addFee}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  <Plus className="w-4 h-4" />
                  Add Fee
                </button>
              </div>

              {/* Existing Fees */}
              <div className="space-y-3 mb-4">
                {formData.additionalFees.map((fee, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_auto] gap-3 items-end">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Loại phí</label>
                      <input
                        type="text"
                        value={fee.type}
                        onChange={(e) => handleFeeChange(index, 'type', e.target.value)}
                        placeholder="Phí hồ sơ, phí nhập học..."
                        className="w-full px-4 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        disabled={isSubmitting}
                      />
                    </div>
                    <PriceInput
                      label="Số tiền"
                      value={fee.amount}
                      onChange={(vnd) => handleFeeChange(index, 'amount', vnd)}
                      disabled={isSubmitting}
                      placeholder="0"
                    />
                    <button
                      type="button"
                      onClick={() => removeFee(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {formData.additionalFees.length === 0 && (
                <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center text-slate-600 text-sm">
                  {isAdmin ? 'No additional fees added yet' : 'Chưa có phí bổ sung'}
                </div>
              )}

              {formData.additionalFees.length > 0 && (
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 uppercase">
                    Bảng phí bổ sung
                  </div>
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loại phí</TableHead>
                      <TableHead className="text-right">Số tiền</TableHead>
                      <TableHead className="text-right">Xóa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.additionalFees.map((fee, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-slate-700">{fee.type || '—'}</TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          {formatFrom(fee.amount || 0, 'VND')}
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            type="button"
                            onClick={() => removeFee(index)}
                            className="inline-flex items-center justify-center rounded-md p-2 text-red-600 hover:bg-red-50 transition-colors"
                            aria-label="Xóa phí"
                            disabled={isSubmitting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-slate-50">
                      <TableCell className="font-semibold text-slate-800">Tổng phí bổ sung</TableCell>
                      <TableCell className="text-right font-bold text-slate-900">
                        {formatFrom(
                          formData.additionalFees.reduce((sum, fee) => sum + (fee.amount || 0), 0),
                          'VND'
                        )}
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

        {/* Footer with Actions */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {isEditMode ? 'Save Changes' : 'Add University'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
