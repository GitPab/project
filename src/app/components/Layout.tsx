import React from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { useCurrency, Currency } from '../context/CurrencyContext';
import { 
  LayoutDashboard, 
  School, 
  Users, 
  LogOut,
  Menu,
  X,
  Shield,
  UserCircle,
  Lock,
  Edit3,
  TrendingUp,
  DollarSign,
  Globe,
  ChevronDown,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = React.useState(false);

  const languages = [
    { code: 'vi' as Language, flag: '🇻🇳', label: 'VI', fullName: 'Tiếng Việt' },
    { code: 'en' as Language, flag: '🇬🇧', label: 'EN', fullName: 'English' },
    { code: 'ko' as Language, flag: '🇰🇷', label: 'KR', fullName: '한국어' },
  ];

  const currentLang = languages.find(l => l.code === language);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
      >
        <Globe className="w-5 h-5 text-slate-600" />
        <span className="text-sm font-medium text-slate-700">{currentLang?.flag} {currentLang?.label}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 min-w-[200px]">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 transition-colors ${ 
                  language === lang.code ? 'bg-blue-50 text-primary' : 'text-slate-700'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <div className="flex flex-col items-start flex-1">
                  <span className="font-medium text-sm">{lang.fullName}</span>
                  <span className="text-xs text-slate-500">({lang.label})</span>
                </div>
                {language === lang.code && (
                  <CheckCircle className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CurrencySwitcher() {
  const { currency, setCurrency, updateRates, lastUpdated } = useCurrency();
  const [open, setOpen] = React.useState(false);

  const currencies = [
    { code: 'USD' as Currency, symbol: '$', flag: '🇺🇸', fullName: 'US Dollar' },
    { code: 'VND' as Currency, symbol: '₫', flag: '🇻🇳', fullName: 'Vietnamese Dong' },
    { code: 'KRW' as Currency, symbol: '₩', flag: '🇰🇷', fullName: 'Korean Won' },
    { code: 'JPY' as Currency, symbol: '¥', flag: '🇯🇵', fullName: 'Japanese Yen' },
    { code: 'CNY' as Currency, symbol: '¥', flag: '🇨🇳', fullName: 'Chinese Yuan' },
  ];

  const currentCurrency = currencies.find(c => c.code === currency);

  const handleUpdateRates = () => {
    updateRates();
    toast.success('Exchange rates updated successfully!', {
      description: `Last updated: ${new Date().toLocaleTimeString()}`
    });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
      >
        <DollarSign className="w-5 h-5 text-slate-600" />
        <span className="text-sm font-medium text-slate-700">{currentCurrency?.flag} {currentCurrency?.code}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 min-w-[220px]">
            {/* Update Rates Button */}
            <div className="px-2 py-2 border-b border-slate-200">
              <button
                onClick={handleUpdateRates}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-50 transition-colors text-primary"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-medium">Update Rates</span>
              </button>
              <p className="text-xs text-slate-500 mt-1 px-3">
                Last: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            
            {/* Currency Options */}
            {currencies.map((curr) => (
              <button
                key={curr.code}
                onClick={() => {
                  setCurrency(curr.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 transition-colors ${ 
                  currency === curr.code ? 'bg-blue-50 text-primary' : 'text-slate-700'
                }`}
              >
                <span className="text-xl">{curr.flag}</span>
                <div className="flex flex-col items-start flex-1">
                  <span className="font-medium text-sm">{curr.fullName}</span>
                  <span className="text-xs text-slate-500">({curr.code} - {curr.symbol})</span>
                </div>
                {currency === curr.code && (
                  <CheckCircle className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.role === 'admin';

  const menuItems = isAdmin
    ? [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: t('common.dashboard') },
        { path: '/admin/universities', icon: School, label: t('common.universities') },
        { path: '/admin/students', icon: Users, label: t('common.studentMonitoring') },
        { path: '/admin/registrations', icon: Users, label: t('common.registrations') },
      ]
    : [
        { path: '/student/home', icon: LayoutDashboard, label: t('common.dashboard') },
        { path: '/student/universities', icon: School, label: t('common.universities') },
        { path: '/student/my-costs', icon: Users, label: t('common.myCosts') },
        { path: '/student/my-progress', icon: TrendingUp, label: t('common.myProgress') },
      ];

  return (
    <div className="flex h-screen bg-blue-50">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-slate-200 shadow-sm">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-primary">Du Học Cost</h1>
        </div>

        {/* Role Badge */}
        <div className="p-4 border-b border-slate-200">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            isAdmin 
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
          }`}>
            {isAdmin ? (
              <>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium opacity-90">{t('common.loggedInAs')}</p>
                  <p className="font-bold flex items-center gap-2">
                    {t('common.admin')}
                    <Edit3 className="w-4 h-4" />
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <UserCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium opacity-90">{t('common.loggedInAs')}</p>
                  <p className="font-bold flex items-center gap-2">
                    {t('common.student')}
                    <Lock className="w-4 h-4" />
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Role Indicator + Logout button */}
        <div className="p-4 border-t border-slate-200 space-y-2">
          {/* Access Level Info */}
          <div className="px-3 py-2 bg-slate-50 rounded-lg mb-2">
            <p className="text-xs text-slate-600 mb-1">{t('common.accessLevel')}</p>
            <p className="text-sm font-semibold text-slate-900">
              {isAdmin ? t('common.fullEditAccess') : t('common.viewOnly')}
            </p>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t('common.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col shadow-xl">
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
              <h1 className="text-xl font-bold text-primary">Du Học Cost</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Role Badge */}
            <div className="p-4 border-b border-slate-200">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                isAdmin 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
              }`}>
                {isAdmin ? (
                  <>
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium opacity-90">{t('common.loggedInAs')}</p>
                      <p className="font-bold flex items-center gap-2">
                        {t('common.admin')}
                        <Edit3 className="w-4 h-4" />
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <UserCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium opacity-90">{t('common.loggedInAs')}</p>
                      <p className="font-bold flex items-center gap-2">
                        {t('common.student')}
                        <Lock className="w-4 h-4" />
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Menu */}
            <nav className="flex-1 p-4 space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Role Indicator + Logout button */}
            <div className="p-4 border-t border-slate-200 space-y-2">
              {/* Access Level Info */}
              <div className="px-3 py-2 bg-slate-50 rounded-lg mb-2">
                <p className="text-xs text-slate-600 mb-1">{t('common.accessLevel')}</p>
                <p className="text-sm font-semibold text-slate-900">
                  {isAdmin ? t('common.fullEditAccess') : t('common.viewOnly')}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">{t('common.logout')}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop header with language and currency switchers */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-end px-6 shadow-sm gap-3">
          {/* Currency Toggle */}
          <CurrencySwitcher />

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Role Badge */}
          {isAdmin ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
              <Shield className="w-4 h-4" />
              {t('common.admin')}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium">
              <Lock className="w-4 h-4" />
              {t('common.student')}
            </div>
          )}
        </header>

        {/* Mobile header */}
        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="ml-4 text-xl font-bold text-primary flex-1">Du Học Cost</h1>
          
          {/* Mobile Controls */}
          <div className="flex items-center gap-2">
            {/* Currency Toggle */}
            <CurrencySwitcher />

            {/* Language Switcher */}
            <LanguageSwitcher />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}