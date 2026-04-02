import React from 'react';
import { useParams, Link } from 'react-router-dom';

interface UniversityDetailProps {
  // University data would typically come from props or API
}

export default function UniversityDetail({}: UniversityDetailProps) {
  const { id } = useParams<{ id: string }>();

  // Mock data - replace with actual data fetch
  const university = {
    id,
    name: 'Đại học Quốc gia Seoul',
    koreanName: '서울대학교',
    country: 'South Korea',
    ranking: 1,
    topTier: 'Top1' as const,
    region: 'Seoul',
    address: 'Gwanak-gu, Seoul',
    description: 'Trường đại học danh giá nhất Hàn Quốc, nổi tiếng với chất lượng giảng dạy và nghiên cứu hàng đầu.',
    majors: ['Kinh tế', 'Kỹ thuật', 'Khoa học máy tính', 'Y học'],
    website: 'https://www.snu.ac.kr',
    systems: ['D4-1', 'D2-1', 'D2-2'],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/universities" className="hover:text-blue-600">Danh sách trường</Link>
            <span>/</span>
            <span className="text-gray-900">{university.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{university.name}</h1>
              <p className="text-lg text-gray-600 mt-1">{university.koreanName}</p>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/universities/${id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Chỉnh sửa
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tổng quan</h2>
              <p className="text-gray-700 leading-relaxed">{university.description}</p>
            </div>

            {/* Majors */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ngành học</h2>
              <div className="flex flex-wrap gap-2">
                {university.majors.map((major, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                  >
                    {major}
                  </span>
                ))}
              </div>
            </div>

            {/* Visa Systems */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Hệ visa hỗ trợ</h2>
              <div className="flex flex-wrap gap-2">
                {university.systems.map((system) => (
                  <span
                    key={system}
                    className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium"
                  >
                    {system}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Thông tin</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-500">Xếp hạng</dt>
                  <dd className="font-medium text-gray-900">{university.ranking}/200</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Hạng</dt>
                  <dd>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Top 1
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Khu vực</dt>
                  <dd className="font-medium text-gray-900">{university.region}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Địa chỉ</dt>
                  <dd className="font-medium text-gray-900">{university.address}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Website</dt>
                  <dd className="font-medium text-blue-600">
                    <a href={university.website} target="_blank" rel="noopener noreferrer">
                      {university.website}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Thao tác</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors">
                  Xem học phí
                </button>
                <button className="w-full px-4 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors">
                  Xem học bổng
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                  Liên hệ tư vấn
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
