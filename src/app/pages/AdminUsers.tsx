import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermission, PermissionGuard } from '../components/PermissionGuard';
import { toast } from 'sonner';
import { Search, UserX, UserCheck, RefreshCw, Clock, Users, Filter, Trash2, AlertTriangle } from 'lucide-react';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export default function AdminUsers() {
  const { token } = useAuth();
  const { hasPermission } = usePermission();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [togglingUser, setTogglingUser] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const canManageUsers = hasPermission('USER_MANAGE');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/students');
      const rows = response.data?.data || response.data || [];
      setUsers(rows.map((row: User) => ({ ...row, role: row.role || 'student' })));
    } catch (error) {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    if (!canManageUsers) {
      toast.error('Bạn không có quyền thực hiện thao tác này');
      return;
    }

    setTogglingUser(userId);
    try {
      const response = await api.patch(`/students/${userId}/toggle-active`);
      
      const result = response.data;
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_active: result.is_active } : u
      ));
      
      toast.success(result.is_active ? 'Đã kích hoạt người dùng' : 'Đã vô hiệu hóa người dùng');
    } catch (error) {
      toast.error('Thao tác thất bại');
    } finally {
      setTogglingUser(null);
    }
  };

  const openDeleteModal = (user: User) => {
    setDeleteConfirm({ isOpen: true, user });
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm.user || !canManageUsers) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/students/${deleteConfirm.user.id}`);
      setUsers(prev => prev.filter(u => u.id !== deleteConfirm.user!.id));
      toast.success('Đã xóa người dùng thành công');
      setDeleteConfirm({ isOpen: false, user: null });
    } catch (error) {
      toast.error('Không thể xóa người dùng');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa đăng nhập';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // If less than 24 hours, show relative time
    if (diff < 24 * 60 * 60 * 1000) {
      if (diff < 60 * 60 * 1000) return 'Vài phút trước';
      return `${Math.floor(diff / (60 * 60 * 1000))} giờ trước`;
    }
    
    return date.toLocaleDateString('vi-VN');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'active' ? user.is_active :
      !user.is_active;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    neverLoggedIn: users.filter(u => !u.last_login).length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản lý người dùng</h1>
        <p className="text-gray-600">Quản lý trạng thái tài khoản và theo dõi hoạt động đăng nhập</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Users size={16} />
            <span className="text-sm">Tổng người dùng</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <UserCheck size={16} />
            <span className="text-sm">Đang hoạt động</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <UserX size={16} />
            <span className="text-sm">Vô hiệu hóa</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Clock size={16} />
            <span className="text-sm">Chưa đăng nhập</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.neverLoggedIn}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Vô hiệu hóa</option>
            </select>
          </div>

          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Người dùng</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vai trò</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Đăng nhập cuối</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw size={20} className="animate-spin" />
                    Đang tải...
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Không tìm thấy người dùng nào
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className={!user.is_active ? 'bg-gray-50' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                      user.role === 'student' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.is_active ? 'Hoạt động' : 'Vô hiệu hóa'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock size={14} />
                      {formatDate(user.last_login)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <PermissionGuard permission="USER_MANAGE">
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          disabled={togglingUser === user.id}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            user.is_active 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {togglingUser === user.id ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : user.is_active ? (
                            <>
                              <UserX size={14} className="inline mr-1" />
                              Vô hiệu hóa
                            </>
                          ) : (
                            <>
                              <UserCheck size={14} className="inline mr-1" />
                              Kích hoạt
                            </>
                          )}
                        </button>
                      </PermissionGuard>
                      <PermissionGuard permission="USER_MANAGE">
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          title="Xóa người dùng"
                        >
                          <Trash2 size={14} />
                        </button>
                      </PermissionGuard>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && deleteConfirm.user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
                <p className="text-sm text-gray-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Bạn sắp xóa người dùng:</p>
              <p className="font-medium text-gray-900">{deleteConfirm.user.name}</p>
              <p className="text-sm text-gray-500">{deleteConfirm.user.email}</p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, user: null })}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Xóa người dùng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
