import React from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { Globe, Phone, Mail, User, LogOut, Shield } from 'lucide-react';

interface HeaderProps {
  showContact?: boolean;
}

export default function Header({ showContact = true }: HeaderProps) {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const languages = [
    { code: 'vi' as Language, flag: '🇻🇳', label: 'VI', fullName: 'Tiếng Việt' },
    { code: 'en' as Language, flag: '🇬🇧', label: 'EN', fullName: 'English' },
    { code: 'ko' as Language, flag: '🇰🇷', label: 'KR', fullName: '한국어' },
  ];

  const currentLang = languages.find(l => l.code === language);

  const handleLogoClick = () => {
    if (isAuthenticated) {
      navigate(isAdmin ? '/admin/dashboard' : '/student/home');
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="w-full h-20 bg-white border-b border-[#558EFF] flex items-center justify-between px-6 lg:px-12">
      {/* Logo/Brand */}
      <div 
        className="flex items-center cursor-pointer"
        onClick={handleLogoClick}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#003AB7] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">SACMA</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-[#003AB7] font-['Be_Vietnam_Pro']">
              Student Abroad Cost Management
            </h1>
            <p className="text-xs text-[#4D4D4D] font-['Be_Vietnam_Pro']">
              Vietnamese Students in Korea
            </p>
          </div>
        </div>
      </div>

      {/* Navigation & Actions */}
      <div className="flex items-center space-x-6">
        {/* Contact Info - Desktop */}
        {showContact && (
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-[#4D4D4D]">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-['Be_Vietnam_Pro']">+84-123-456-789</span>
            </div>
            <div className="flex items-center space-x-2 text-[#4D4D4D]">
              <Mail className="w-4 h-4" />
              <span className="text-sm font-['Be_Vietnam_Pro']">info@sacma.vn</span>
            </div>
          </div>
        )}

        {/* Language Switcher */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F8F9FA] transition-colors border border-[#558EFF]">
            <Globe className="w-5 h-5 text-[#003AB7]" />
            <span className="text-sm font-medium text-[#003AB7] font-['Be_Vietnam_Pro']">
              {currentLang?.flag} {currentLang?.label}
            </span>
          </button>
          
          {/* Language Dropdown */}
          <div className="absolute right-0 mt-2 w-40 bg-white border border-[#558EFF] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className="w-full px-4 py-2 text-left hover:bg-[#F8F9FA] transition-colors flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg"
              >
                <span>{lang.flag}</span>
                <span className="text-sm font-['Be_Vietnam_Pro']">{lang.fullName}</span>
                {lang.code === language && (
                  <span className="text-[#003AB7]">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Auth Section */}
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            {isAdmin && (
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                <Shield className="w-3 h-3" />
                ADMIN
              </span>
            )}
            
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F8F9FA] transition-colors border border-[#558EFF]">
                <User className="w-5 h-5 text-[#003AB7]" />
                <span className="hidden md:block text-sm font-medium text-[#003AB7] font-['Be_Vietnam_Pro']">
                  {user?.name}
                </span>
              </button>
              
              {/* User Dropdown */}
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#558EFF] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {isAdmin ? (
                  <>
                    <button
                      onClick={() => navigate('/admin/dashboard')}
                      className="w-full px-4 py-2 text-left hover:bg-[#F8F9FA] transition-colors flex items-center gap-2 first:rounded-t-lg"
                    >
                      <Shield className="w-4 h-4 text-[#003AB7]" />
                      <span className="text-sm font-['Be_Vietnam_Pro']">Quản trị</span>
                    </button>
                    <button
                      onClick={() => navigate('/admin/universities')}
                      className="w-full px-4 py-2 text-left hover:bg-[#F8F9FA] transition-colors flex items-center gap-2"
                    >
                      <span className="text-sm font-['Be_Vietnam_Pro']">Danh sách trường</span>
                    </button>
                    <button
                      onClick={() => navigate('/admin/students')}
                      className="w-full px-4 py-2 text-left hover:bg-[#F8F9FA] transition-colors flex items-center gap-2"
                    >
                      <span className="text-sm font-['Be_Vietnam_Pro']">Học sinh</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/student/home')}
                      className="w-full px-4 py-2 text-left hover:bg-[#F8F9FA] transition-colors flex items-center gap-2 first:rounded-t-lg"
                    >
                      <User className="w-4 h-4 text-[#003AB7]" />
                      <span className="text-sm font-['Be_Vietnam_Pro']">Hồ sơ của tôi</span>
                    </button>
                    <button
                      onClick={() => navigate('/student/universities')}
                      className="w-full px-4 py-2 text-left hover:bg-[#F8F9FA] transition-colors flex items-center gap-2"
                    >
                      <span className="text-sm font-['Be_Vietnam_Pro']">Danh sách trường</span>
                    </button>
                  </>
                )}
                <div className="border-t border-[#558EFF]/20 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left hover:bg-red-50 transition-colors flex items-center gap-2 text-red-600 last:rounded-b-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-['Be_Vietnam_Pro']">Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-[#003AB7] font-medium hover:bg-[#F8F9FA] rounded-lg transition-colors font-['Be_Vietnam_Pro']"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 bg-[#003AB7] text-white font-medium rounded-lg hover:bg-[#002A8F] transition-colors font-['Be_Vietnam_Pro']"
            >
              Đăng ký
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
