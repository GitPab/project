import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface University {
  id: string;
  name: string;
  koreanName?: string;
  country: string;
  ranking?: number;
  topTier?: 'Top1' | 'Top2' | 'Top3';
  region?: string;
  address?: string;
  description?: string;
  majors: string[];
  isActive: boolean;
}

interface UniversityListProps {
  universities?: University[];
  onViewDetail?: (id: string) => void;
}

export default function UniversityList({ universities = [], onViewDetail }: UniversityListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');

  const filteredUniversities = universities.filter(uni => {
    const matchesSearch = 
      uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uni.koreanName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uni.region?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'all' || uni.topTier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const getTierBadge = (tier?: string) => {
    const styles = {
      Top1: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Top2: 'bg-blue-100 text-blue-800 border-blue-200',
      Top3: 'bg-green-100 text-green-800 border-green-200',
    };
    const labels = {
      Top1: 'Top 1',
      Top2: 'Top 2',
      Top3: 'Top 3',
    };
    if (!tier) return null;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[tier as keyof typeof styles]}`}>
        {labels[tier as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Danh sách trường đại học</h1>
              <Link
                to="/universities/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
              >
                + Thêm trường
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên trường, khu vực..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả hạng</option>
                  <option value="Top1">Top 1</option>
                  <option value="Top2">Top 2</option>
                  <option value="Top3">Top 3</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="p-6">
            {filteredUniversities.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Không tìm thấy trường nào
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUniversities.map((uni) => (
                  <div
                    key={uni.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{uni.name}</h3>
                        {uni.koreanName && (
                          <p className="text-sm text-gray-500">{uni.koreanName}</p>
                        )}
                      </div>
                      {getTierBadge(uni.topTier)}
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      {uni.ranking && (
                        <p>Xếp hạng: {uni.ranking}/200</p>
                      )}
                      {uni.region && (
                        <p>Khu vực: {uni.region}</p>
                      )}
                      {uni.majors.length > 0 && (
                        <p>Ngành: {uni.majors.slice(0, 3).join(', ')}{uni.majors.length > 3 && '...'}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onViewDetail?.(uni.id)}
                        className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        Xem chi tiết
                      </button>
                      <Link
                        to={`/universities/${uni.id}/edit`}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Sửa
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
