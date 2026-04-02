import React, { useState } from 'react';

interface StudentProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  nationality?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  education?: {
    highestDegree: string;
    school: string;
    graduationYear: number;
  };
  koreanLevel?: 'beginner' | 'intermediate' | 'advanced' | 'native';
  topikLevel?: number;
}

interface StudentProfileProps {
  student?: StudentProfileData;
  onSave?: (data: StudentProfileData) => void;
}

export default function StudentProfile({ student, onSave }: StudentProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<StudentProfileData>(student || {
    id: '',
    name: '',
    email: '',
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Hồ sơ sinh viên</h1>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Chỉnh sửa
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Họ và tên</h3>
                <p className="text-gray-900">{student?.name || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                <p className="text-gray-900">{student?.email || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Số điện thoại</h3>
                <p className="text-gray-900">{student?.phone || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Ngày sinh</h3>
                <p className="text-gray-900">{student?.dateOfBirth || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Quốc tịch</h3>
                <p className="text-gray-900">{student?.nationality || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Trình độ tiếng Hàn</h3>
                <p className="text-gray-900">
                  {student?.koreanLevel ? {
                    beginner: 'Sơ cấp',
                    intermediate: 'Trung cấp',
                    advanced: 'Cao cấp',
                    native: 'Bản ngữ'
                  }[student.koreanLevel] : 'Chưa cập nhật'}
                </p>
              </div>
              {student?.topikLevel && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">TOPIK</h3>
                  <p className="text-gray-900">Cấp {student.topikLevel}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa hồ sơ</h1>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Lưu
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
              <input
                type="date"
                value={formData.dateOfBirth || ''}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
