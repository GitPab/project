import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { University } from '../../types';
import { X, Plus, Trash2, ArrowRightLeft, GraduationCap, DollarSign, MapPin, Award } from 'lucide-react';

interface UniversityComparison {
  university: University;
  visaSystem: string;
  totalCost: number;
  highlights: string[];
  warnings: string[];
}

export default function UniversityComparisonTool() {
  const { universities } = useApp();
  const [selectedUniversities, setSelectedUniversities] = useState<UniversityComparison[]>([]);
  const [showSelector, setShowSelector] = useState(false);
  const [selectedVisa, setSelectedVisa] = useState('D2-2');

  const visaOptions = ['D4-1', 'D2-1', 'D2-2', 'D2-3', 'D2-6'];

  const addUniversity = (university: University) => {
    if (selectedUniversities.length >= 4) {
      alert('Chỉ có thể so sánh tối đa 4 trường');
      return;
    }
    if (selectedUniversities.some(u => u.university.id === university.id)) {
      alert('Trường này đã được thêm');
      return;
    }

    const visaData = university.koreanData?.visaSystems?.find((v: {visaType: string}) => v.visaType === selectedVisa);
    const totalCost = calculateEstimatedCost(visaData);

    const highlights: string[] = [];
    const warnings: string[] = [];

    // Generate highlights
    if (university.top_tier === 'Top1') highlights.push('Trường Top 1');
    if (university.top_tier === 'Top2') highlights.push('Trường Top 2');
    if (visaData?.tuitionPerTerm && visaData.tuitionPerTerm < 3000000) {
      highlights.push('Học phí thấp');
    }
    if (visaData?.scholarships && visaData.scholarships.length > 0) {
      highlights.push(`Có ${visaData.scholarships.length} học bổng`);
    }

    // Generate warnings
    if (university.top_tier === 'Top3') warnings.push('Visa hạn chế');
    if (!visaData) warnings.push('Chưa cấu hình hệ visa');

    setSelectedUniversities(prev => [...prev, {
      university,
      visaSystem: selectedVisa,
      totalCost,
      highlights,
      warnings
    }]);
    setShowSelector(false);
  };

  const removeUniversity = (id: string) => {
    setSelectedUniversities(prev => prev.filter(u => u.university.id !== id));
  };

  const calculateEstimatedCost = (visaData: any): number => {
    const fixedVND = 71000000; // 13M + 39M + 11M + 8M
    const krwCosts = (visaData?.applicationFee || 100000) + 
                     (visaData?.enrollmentFee || 5800000) + 
                     (visaData?.tuitionPerTerm || 0);
    const krwToVND = 18.9;
    return fixedVND + (krwCosts * krwToVND);
  };

  const formatCost = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (selectedUniversities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ArrowRightLeft className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">So sánh nhiều trường</h3>
        <p className="text-gray-500 mb-4">Chọn từ 2-4 trường để so sánh chi phí và điều kiện</p>
        <button
          onClick={() => setShowSelector(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Thêm trường để so sánh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">So sánh {selectedUniversities.length} trường</h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedVisa}
            onChange={(e) => setSelectedVisa(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            {visaOptions.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          {selectedUniversities.length < 4 && (
            <button
              onClick={() => setShowSelector(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Comparison Cards */}
      <div className={`grid gap-4 ${
        selectedUniversities.length === 2 ? 'grid-cols-2' :
        selectedUniversities.length === 3 ? 'grid-cols-3' :
        'grid-cols-4'
      }`}>
        {selectedUniversities.map((item, index) => (
          <div key={item.university.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className={`p-4 ${
              index === 0 ? 'bg-yellow-50 border-b border-yellow-200' :
              index === 1 ? 'bg-gray-50 border-b border-gray-200' :
              index === 2 ? 'bg-orange-50 border-b border-orange-200' :
              'bg-blue-50 border-b border-blue-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-lg shadow-sm">
                  #{index + 1}
                </div>
                <button
                  onClick={() => removeUniversity(item.university.id)}
                  className="p-1 hover:bg-red-100 rounded text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h4 className="font-semibold text-gray-900 mt-2 line-clamp-2">{item.university.name}</h4>
              <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${
                item.university.top_tier === 'Top1' ? 'bg-blue-100 text-blue-700' :
                item.university.top_tier === 'Top2' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {item.university.top_tier || 'N/A'}
              </span>
            </div>

            {/* Cost */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <DollarSign className="w-4 h-4" />
                Tổng chi phí ước tính
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCost(item.totalCost)}</p>
              <p className="text-xs text-gray-400">Hệ {item.visaSystem}</p>
            </div>

            {/* Location */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <MapPin className="w-4 h-4" />
                Khu vực
              </div>
              <p className="text-sm font-medium text-gray-900">{item.university.region || 'N/A'}</p>
            </div>

            {/* Scholarships */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Award className="w-4 h-4" />
                Học bổng
              </div>
              <p className="text-sm text-gray-900">
                {(item.university.koreanData?.visaSystems?.find((v: any) => v.visaType === selectedVisa) as any)?.scholarships?.length || 0} chương trình
              </p>
            </div>

            {/* Highlights */}
            {item.highlights.length > 0 && (
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <GraduationCap className="w-4 h-4" />
                  Điểm nổi bật
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.highlights.map((h, i) => (
                    <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {item.warnings.length > 0 && (
              <div className="p-4 bg-yellow-50">
                <div className="flex flex-wrap gap-1">
                  {item.warnings.map((w, i) => (
                    <span key={i} className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                      ⚠ {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      {selectedUniversities.length >= 2 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Tóm tắt so sánh</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-600">Rẻ nhất:</span>{' '}
              <span className="font-medium">
                {selectedUniversities.reduce((min, u) => u.totalCost < min.totalCost ? u : min).university.name}
              </span>
            </div>
            <div>
              <span className="text-blue-600">Hạng cao nhất:</span>{' '}
              <span className="font-medium">
                {selectedUniversities.find(u => u.university.top_tier === 'Top1')?.university.name || 
                 selectedUniversities.find(u => u.university.top_tier === 'Top2')?.university.name ||
                 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-blue-600">Nhiều học bổng nhất:</span>{' '}
              <span className="font-medium">
                {selectedUniversities.reduce((max, u) => 
                  (((u.university.koreanData?.visaSystems?.find((v: any) => v.visaType === selectedVisa) as any)?.scholarships?.length || 0) > 
                   ((max.university.koreanData?.visaSystems?.find((v: any) => v.visaType === selectedVisa) as any)?.scholarships?.length || 0) ? u : max)
                ).university.name}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* University Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Chọn trường để so sánh</h3>
              <button
                onClick={() => setShowSelector(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {universities.map(uni => (
                  <button
                    key={uni.id}
                    onClick={() => addUniversity(uni)}
                    disabled={selectedUniversities.some(u => u.university.id === uni.id)}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      selectedUniversities.some(u => u.university.id === uni.id)
                        ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{uni.name}</p>
                    <p className="text-sm text-gray-500">{uni.region || 'N/A'}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${
                      uni.top_tier === 'Top1' ? 'bg-blue-100 text-blue-700' :
                      uni.top_tier === 'Top2' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {uni.top_tier || 'N/A'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
