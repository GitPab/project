import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface UniversityFormData {
  name: string;
  koreanName: string;
  country: string;
  ranking?: number;
  topTier?: 'Top1' | 'Top2' | 'Top3';
  region: string;
  address: string;
  description: string;
  website: string;
  majors: string[];
}

interface UniversityFormProps {
  initialData?: UniversityFormData;
  onSubmit?: (data: UniversityFormData) => void;
}

export default function UniversityForm({ initialData, onSubmit }: UniversityFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState<UniversityFormData>(initialData || {
    name: '',
    koreanName: '',
    country: 'South Korea',
    region: '',
    address: '',
    description: '',
    website: '',
    majors: [],
  });

  const [newMajor, setNewMajor] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
    navigate('/universities');
  };

  const addMajor = () => {
    if (newMajor.trim() && !formData.majors.includes(newMajor.trim())) {
      setFormData({ ...formData, majors: [...formData.majors, newMajor.trim()] });
      setNewMajor('');
    }
  };

  const removeMajor = (major: string) => {
    setFormData({ ...formData, majors: formData.majors.filter((m) => m !== major) });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Chỉnh sửa trường' : 'Thêm trường mới'}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên trường <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Korean Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên tiếng Hàn
                </label>
                <input
                  type="text"
                  value={formData.koreanName}
                  onChange={(e) => setFormData({ ...formData, koreanName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Ranking */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xếp hạng
                </label>
                <input
                  type="number"
                  value={formData.ranking || ''}
                  onChange={(e) => setFormData({ ...formData, ranking: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Top Tier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hạng
                </label>
                <select
                  value={formData.topTier || ''}
                  onChange={(e) => setFormData({ ...formData, topTier: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn hạng</option>
                  <option value="Top1">Top 1</option>
                  <option value="Top2">Top 2</option>
                  <option value="Top3">Top 3</option>
                </select>
              </div>

              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khu vực <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quốc gia
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Website */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Majors */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngành học
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newMajor}
                    onChange={(e) => setNewMajor(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMajor())}
                    placeholder="Nhập ngành học"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addMajor}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Thêm
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.majors.map((major) => (
                    <span
                      key={major}
                      className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {major}
                      <button
                        type="button"
                        onClick={() => removeMajor(major)}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/universities')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {isEditing ? 'Lưu thay đổi' : 'Tạo trường'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
