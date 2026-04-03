import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface StudentLayoutProps {
  children: React.ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { label: 'Dashboard', href: '/student/dashboard', icon: '📊' },
    { label: 'Hồ sơ', href: '/student/home', icon: '👤' },
    { label: 'Đăng ký trường', href: '/student/universities', icon: '🏫' },
    { label: 'Chat trực tuyến', href: '/student/chat', icon: '�' },
    { label: 'Đặt lịch tư vấn', href: '/student/appointments', icon: '�' },
    { label: 'Tiến trình', href: '/student/my-progress', icon: '�' },
    { label: 'Đánh giá', href: '/student/feedback', icon: '⭐' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sticky Sidebar - stays visible while scrolling */}
        <aside className="w-64 bg-white shadow-md sticky top-0 h-screen overflow-y-auto z-20">
          <div className="p-6 border-b">
            <Link to="/student/dashboard" className="text-xl font-bold text-blue-600">
              SACMA Student
            </Link>
          </div>

          <nav className="p-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
              >
                <span className="mr-3">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t mt-auto">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Sinh viên'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </aside>

        {/* Main Content - scrollable */}
        <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
          <header className="bg-white shadow-sm px-8 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-800">Student Portal</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">{new Date().toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </header>

          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
