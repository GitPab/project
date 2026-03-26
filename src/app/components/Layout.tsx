import React from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, School, Users, LogOut, Menu, X, Shield, UserCircle, Lock, Edit3, TrendingUp, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Layout() {
  const { logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const handleLogout = () => { 
    logout(); 
    navigate('/login'); 
  };
  if (!user) return <Navigate to="/login" replace />;

  const menuItems = isAdmin
    ? [
        { path: '/admin/dashboard',     icon: LayoutDashboard, label: 'Trang chủ' },
        { path: '/admin/universities',  icon: School,          label: 'Danh sách trường' },
        { path: '/admin/students',      icon: Users,           label: 'Theo dõi học viên' },
        { path: '/admin/registrations', icon: Users,           label: 'Đăng ký' },
      ]
    : [
        { path: '/student/home',         icon: LayoutDashboard, label: 'Trang chủ' },
        { path: '/student/universities', icon: School,          label: 'Danh sách trường' },
        { path: '/student/my-costs',     icon: Users,           label: 'Chi phí của tôi' },
        { path: '/student/my-progress',  icon: TrendingUp,      label: 'Tiến trình' },
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-end px-6 shadow-sm gap-3">
          <div className={`flex items-center gap-3 px-4 py-2 ${isAdmin ? 'bg-blue-600' : 'bg-emerald-600'} text-white rounded-lg text-sm font-medium`}>
            {isAdmin ? <Shield className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <div className="flex flex-col leading-tight">
              <span>{isAdmin ? 'Quản trị viên' : 'Học viên'}</span>
              <span className="text-xs opacity-90">{user?.name}</span>
            </div>
          </div>
        </header>

        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-700"><Menu className="w-6 h-6" /></button>
          <h1 className="ml-4 text-xl font-bold text-primary flex-1">Du Học Cost</h1>
          <div className="flex items-center gap-2">
          </div>
        </header>

        <main className="flex-1 overflow-auto"><Outlet /></main>
      </div>
    </div>
  );
}
