import React from 'react';
import { Link } from 'react-router-dom';

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'pending';
  university?: string;
  program?: string;
  createdAt: string;
}

interface StudentDashboardProps {
  student?: Student;
}

export default function StudentDashboard({ student }: StudentDashboardProps) {
  const stats = [
    { label: 'Hồ sơ đã nộp', value: 5, total: 8 },
    { label: 'Thông báo mới', value: 3 },
    { label: 'Tin nhắn chưa đọc', value: 1 },
  ];

  const quickLinks = [
    { label: 'Xem hồ sơ', href: '/student/profile', icon: '👤' },
    { label: 'Đăng ký trường', href: '/universities', icon: '🎓' },
    { label: 'Lịch hẹn', href: '/appointments', icon: '📅' },
    { label: 'Thanh toán', href: '/payments', icon: '💳' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Xin chào, {student?.name || 'Sinh viên'}!
              </h1>
              <p className="text-gray-600 mt-1">
                Chào mừng bạn đến với hệ thống SACMA
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                student?.status === 'active' ? 'bg-green-100 text-green-800' :
                student?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {student?.status === 'active' ? 'Đang học' :
                 student?.status === 'pending' ? 'Chờ xác nhận' : 'Không hoạt động'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
              <div className="text-gray-600 mt-1">{stat.label}</div>
              {stat.total && (
                <div className="text-sm text-gray-400 mt-2">
                  / {stat.total} tổng cộng
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Truy cập nhanh</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickLinks.map((link, index) => (
              <Link
                key={index}
                to={link.href}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <span className="text-2xl mb-2">{link.icon}</span>
                <span className="text-sm font-medium text-gray-700">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h2>
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-gray-50 rounded">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Hồ sơ đã được cập nhật</p>
                <p className="text-xs text-gray-500">2 giờ trước</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-gray-50 rounded">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Đăng ký trường thành công</p>
                <p className="text-xs text-gray-500">1 ngày trước</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-gray-50 rounded">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Có thông báo mới từ tư vấn viên</p>
                <p className="text-xs text-gray-500">2 ngày trước</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
