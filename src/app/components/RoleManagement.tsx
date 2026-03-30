import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLE_DEFINITIONS, hasPermission, getRoleLabel, type Role } from '../constants/rbac';
import { Shield, Users, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export default function RoleManagement() {
  const { user } = useAuth();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<Role>('viewer');

  // Check if current user can manage roles
  const canManageRoles = (user?.role as string) === 'super_admin' || hasPermission((user?.role as string) as Role, 'ROLE_MANAGE');
  const canManageUsers = (user?.role as string) === 'super_admin' || hasPermission((user?.role as string) as Role, 'USER_MANAGE');

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setAdminUsers(data);
    } catch (error) {
      toast.error('Không thể tải danh sách admin');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: Role) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      });
      if (!res.ok) throw new Error('Failed to update role');
      toast.success('Đã cập nhật vai trò');
      fetchAdminUsers();
      setSelectedUser(null);
    } catch (error) {
      toast.error('Không thể cập nhật vai trò');
    }
  };

  if (!canManageUsers) {
    return (
      <div className="p-6 text-center">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-600">Truy cập bị từ chối</h2>
        <p className="text-slate-600 mt-2">Bạn không có quyền quản lý người dùng</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-slate-900">Quản lý Vai trò & Phân quyền</h1>
      </div>

      {/* Role Definitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Object.entries(ROLE_DEFINITIONS).map(([role, def]) => (
          <div key={role} className={`p-4 rounded-lg border ${
            role === 'super_admin' ? 'bg-red-50 border-red-200' :
            role === 'admin_manager' ? 'bg-blue-50 border-blue-200' :
            role === 'finance_admin' ? 'bg-green-50 border-green-200' :
            role === 'content_editor' ? 'bg-purple-50 border-purple-200' :
            'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{def.label}</h3>
              {role === 'super_admin' && <Shield className="w-4 h-4 text-red-500" />}
            </div>
            <p className="text-sm text-slate-600 mb-3">{def.description}</p>
            <div className="text-xs text-slate-500">
              {def.permissions.length} quyền
            </div>
          </div>
        ))}
      </div>

      {/* Admin Users List */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-lg">Danh sách Admin</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải...</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {adminUsers.map((adminUser) => (
              <div key={adminUser.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                    {adminUser.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="font-medium">{adminUser.name}</div>
                    <div className="text-sm text-slate-500">{adminUser.email}</div>
                    <div className="text-xs mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                        adminUser.role === 'super_admin' ? 'bg-red-100 text-red-700' :
                        adminUser.role === 'admin_manager' ? 'bg-blue-100 text-blue-700' :
                        adminUser.role === 'finance_admin' ? 'bg-green-100 text-green-700' :
                        adminUser.role === 'content_editor' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {getRoleLabel(adminUser.role as Role)}
                      </span>
                    </div>
                  </div>
                </div>

                {canManageRoles && adminUser.id !== user?.id && (
                  <button
                    onClick={() => {
                      setSelectedUser(adminUser);
                      setNewRole(adminUser.role as Role);
                    }}
                    className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Đổi vai trò
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Đổi vai trò: {selectedUser.name}
            </h3>
            
            <div className="space-y-2 mb-6">
              {Object.keys(ROLE_DEFINITIONS).map((role) => (
                <label
                  key={role}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                    newRole === role ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={newRole === role}
                    onChange={(e) => setNewRole(e.target.value as Role)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">{ROLE_DEFINITIONS[role as Role].label}</div>
                    <div className="text-sm text-slate-500">
                      {ROLE_DEFINITIONS[role as Role].description}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={() => updateUserRole(selectedUser.id, newRole)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
