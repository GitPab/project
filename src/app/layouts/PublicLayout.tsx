import React from 'react';
import { Link } from 'react-router-dom';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Simple Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              SACMA
            </Link>
            <nav className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Bắt đầu ngay
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">{children}</main>

      {/* Simple Footer */}
      <footer className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Về chúng tôi</h3>
              <ul className="mt-4 space-y-2">
                <li><Link to="/about" className="text-gray-600 hover:text-gray-900">Giới thiệu</Link></li>
                <li><Link to="/team" className="text-gray-600 hover:text-gray-900">Đội ngũ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Dịch vụ</h3>
              <ul className="mt-4 space-y-2">
                <li><Link to="/universities" className="text-gray-600 hover:text-gray-900">Danh sách trường</Link></li>
                <li><Link to="/consulting" className="text-gray-600 hover:text-gray-900">Tư vấn du học</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Hỗ trợ</h3>
              <ul className="mt-4 space-y-2">
                <li><Link to="/faq" className="text-gray-600 hover:text-gray-900">FAQ</Link></li>
                <li><Link to="/contact" className="text-gray-600 hover:text-gray-900">Liên hệ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Liên hệ</h3>
              <p className="mt-4 text-gray-600">
                Email: info@sacma.edu.vn<br />
                Điện thoại: 1900 xxxx
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} SACMA. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
