import React from 'react';
import { useNavigate } from 'react-router';
import { useLanguage, Language } from '../context/LanguageContext';
import { Globe, Phone, Mail } from 'lucide-react';

interface HeaderProps {
  showContact?: boolean;
}

export default function Header({ showContact = true }: HeaderProps) {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'vi' as Language, flag: '🇻🇳', label: 'VI', fullName: 'Tiếng Việt' },
    { code: 'en' as Language, flag: '🇬🇧', label: 'EN', fullName: 'English' },
    { code: 'ko' as Language, flag: '🇰🇷', label: 'KR', fullName: '한국어' },
  ];

  const currentLang = languages.find(l => l.code === language);

  const handleLogoClick = () => {
    navigate('/');
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

        {/* Mobile Menu Button */}
        <button className="lg:hidden p-2 rounded-lg hover:bg-[#F8F9FA] transition-colors">
          <div className="space-y-1">
            <div className="w-6 h-0.5 bg-[#003AB7]"></div>
            <div className="w-6 h-0.5 bg-[#003AB7]"></div>
            <div className="w-6 h-0.5 bg-[#003AB7]"></div>
          </div>
        </button>
      </div>
    </header>
  );
}
