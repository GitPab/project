import React from 'react';
import { Outlet, NavLink, useNavigate, Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { usePermission } from './PermissionGuard';
import api from '../services/api';
import { LayoutDashboard, School, Users, LogOut, Menu, X, Shield, UserCircle, Lock, Edit3, TrendingUp, ChevronsLeft, ChevronsRight, BarChart3, ClipboardList, Mail, Workflow, Settings, Database, GraduationCap, Calendar, MessageSquare, ShieldCheck } from 'lucide-react';

export default function Layout() {
  const { logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [healthStatus, setHealthStatus] = React.useState<'ok' | 'degraded' | 'unknown'>('unknown');
  const [healthTooltip, setHealthTooltip] = React.useState('Health: unknown');

  // Helper to check if user has permission for a feature
  const { hasPermission } = usePermission();

  const handleLogout = () => { 
    logout(); 
    navigate('/login'); 
  };
  if (!user) return <Navigate to='/login' replace />;

  // Reset scroll on route change to avoid blank space after navigation
  React.useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname, location.hash]);

  React.useEffect(() => {
    let isMounted = true;
    let intervalId: number | null = null;

    const fetchHealth = async () => {
      try {
        const response = await api.get('/health');
        const status = response?.data?.status || 'unknown';
        if (!isMounted) return;
        setHealthStatus(status === 'ok' ? 'ok' : 'degraded');
        setHealthTooltip(`Health: ${status}`);
      } catch (error: any) {
        if (!isMounted) return;
        setHealthStatus('degraded');
        setHealthTooltip('Health: error');
      }
    };

    if (isAdmin) {
      fetchHealth();
      intervalId = window.setInterval(fetchHealth, 30000);
    }

    return () => {
      isMounted = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [isAdmin]);

  // Admin menu items with required permissions
  const adminMenuItems = [
    { path: '/admin/dashboard',     icon: LayoutDashboard, label: 'Trang chủ',        permission: 'university:view' },
    { path: '/admin/analytics',     icon: BarChart3,       label: 'Thống kê',        permission: 'analytics:view' },
    { path: '/admin/universities',  icon: School,          label: 'Danh sách trường', permission: 'university:view' },
    { path: '/admin/students',      icon: Users,           label: 'Theo dõi học viên',permission: 'student:view' },
    { path: '/admin/registrations', icon: Users,           label: 'Đăng ký',         permission: 'application:view' },
    { path: '/admin/calendar',      icon: Calendar,        label: 'Lịch hẹn',        permission: 'student:view' },
    { path: '/admin/scholarships',  icon: GraduationCap,   label: 'Học bổng',        permission: 'university:view' },
    { path: '/admin/visa',          icon: ShieldCheck,     label: 'Theo dõi Visa',   permission: 'student:view' },
    { path: '/admin/feedback',      icon: MessageSquare,   label: 'Đánh giá',        permission: 'analytics:view' },
    { path: '/admin/audit',        icon: ClipboardList,   label: 'Nhật ký',         permission: 'manage:user' },
    { path: '/admin/templates',     icon: Mail,            label: 'Mẫu Email',       permission: 'manage:settings' },
    { path: '/admin/workflow',      icon: Workflow,        label: 'Tự động hóa',     permission: 'manage:settings' },
    { path: '/admin/bulk',         icon: Database,        label: 'Thao tác hàng loạt', permission: 'university:create' },
    { path: '/admin/maintenance',  icon: Database,        label: 'Bảo trì',          permission: 'view:database' },
    { path: '/admin/roles',        icon: Shield,          label: 'Phân quyền',      permission: 'manage:user' },
    { path: '/admin/settings',      icon: Settings,        label: 'Cài đặt',         permission: 'manage:settings' },
  ];

  // Filter menu items - show all for admin, filtered for students
  const menuItems = isAdmin
    ? adminMenuItems
    : [
        { path: '/student/home',         icon: LayoutDashboard, label: 'Trang chủ' },
        { path: '/student/universities', icon: School,          label: 'Danh sách trường' },
        { path: '/student/my-costs',     icon: Users,           label: 'Chi phí của tôi' },
        { path: '/student/my-progress',  icon: TrendingUp,      label: 'Tiến trình' },
        { path: '/student/feedback',    icon: MessageSquare,   label: 'Đánh giá & Phản hồi' },
      ];

  return (
    <div className="flex h-screen bg-blue-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col bg-white border-r border-slate-200 shadow-sm" style={{ width: sidebarCollapsed ? '88px' : '256px' }}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          {!sidebarCollapsed && <h1 className="text-xl font-bold text-primary">Du Học Cost</h1>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
            {sidebarCollapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="p-4 border-b border-slate-200">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isAdmin ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'}`}>
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                {isAdmin ? <Shield className="w-5 h-5" /> : <UserCircle className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-medium opacity-90">Đã đăng nhập với vai trò</p>
                <p className="font-bold flex items-center gap-2">
                  {isAdmin ? 'Quản trị viên' : 'Học viên'}
                  {isAdmin ? <Edit3 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </p>
              </div>
            </div>
            {isAdmin && (
              <div title={healthTooltip} style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: healthStatus === 'ok' ? '#10B981' : healthStatus === 'degraded' ? '#F59E0B' : '#9CA3AF'
                }} />
                <span style={{ fontSize: 12, color: '#6B7280' }}>Health status</span>
              </div>
            )}
          </div>
        )}
        {sidebarCollapsed && isAdmin && (
          <div title={healthTooltip} style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
            <span style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: healthStatus === 'ok' ? '#10B981' : healthStatus === 'degraded' ? '#F59E0B' : '#9CA3AF'
            }} />
          </div>
        )}

        <nav className={`flex-1 ${sidebarCollapsed ? 'p-2' : 'p-4'} space-y-1`}>
          {menuItems.map((item) => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) => `flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-[#003AB7] text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
              <item.icon className="w-5 h-5" />
              {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={`${sidebarCollapsed ? 'p-2' : 'p-4'} border-t border-slate-200 space-y-2`}>
          {!sidebarCollapsed && (
            <div className="px-3 py-2 bg-slate-50 rounded-lg mb-2">
              <p className="text-xs text-slate-600 mb-1">Cấp độ truy cập</p>
              <p className="text-sm font-semibold text-slate-900">{isAdmin ? '✓ Quyền chỉnh sửa đầy đủ' : 'Chỉ xem'}</p>
            </div>
          )}
          <button onClick={handleLogout} className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 w-full rounded-lg text-slate-700 hover:bg-slate-100 transition-colors`}>
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span className="font-medium">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col shadow-xl">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
              <h1 className="text-xl font-bold text-primary">Du Học Cost</h1>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-slate-700"><X className="w-6 h-6" /></button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {menuItems.map((item) => (
                <NavLink key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-200">
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-slate-700 hover:bg-slate-100 transition-colors">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Đăng xuất</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div ref={contentRef} className="flex-1 flex flex-col overflow-auto">
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-end px-6 shadow-sm gap-3 shrink-0">
          {isAdmin && (
            <div title={healthTooltip} style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
              <span style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: healthStatus === 'ok' ? '#10B981' : healthStatus === 'degraded' ? '#F59E0B' : '#9CA3AF'
              }} />
              <span style={{ fontSize: 12, color: '#6B7280' }}>Health</span>
            </div>
          )}
          <div className={`flex items-center gap-3 px-4 py-2 ${isAdmin ? 'bg-blue-600' : 'bg-emerald-600'} text-white rounded-lg text-sm font-medium`}>
            {isAdmin ? <Shield className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <div className="flex flex-col leading-tight">
              <span>{isAdmin ? 'Quản trị viên' : 'Học viên'}</span>
              <span className="text-xs opacity-90">{user?.name}</span>
            </div>
          </div>
        </header>

        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 shadow-sm shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-700"><Menu className="w-6 h-6" /></button>
          <h1 className="ml-4 text-xl font-bold text-primary flex-1">Du Học Cost</h1>
          {isAdmin && (
            <div title={healthTooltip} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: healthStatus === 'ok' ? '#10B981' : healthStatus === 'degraded' ? '#F59E0B' : '#9CA3AF'
              }} />
              <span style={{ fontSize: 11, color: '#6B7280' }}>Health</span>
            </div>
          )}
          <div className="flex items-center gap-2">
          </div>
        </header>

        <main className="flex-1"><Outlet /></main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 px-6 shrink-0">
          <div className="flex items-center justify-between">
            {/* Logo Left */}
            <div className="flex items-center gap-2">
              <img src="/img/tbt-logo.png" alt="TBT GROUP" className="h-8 w-auto" />
            </div>
            
            {/* Copyright Right */}
            <div className="text-right text-xs text-slate-600">
              <p className="font-semibold">Bản quyền của Công Ty Cổ Phần Quốc Tế TBT GROUP</p>
              <p>Giấy chứng nhận Đăng ký Kinh doanh số 0110863947 do Sở Kế hoạch và Đầu tư Thành phố Hà Nội cấp ngày 24/01/2025</p>
              <p>Giấy chứng nhận hoạt động đào tạo, bồi dưỡng do Sở Giáo Dục và Đào Tạo Thành Phố Hà Nội cấp ngày 21/04/2021</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
