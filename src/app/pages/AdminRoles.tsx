import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import AdminInvite from '../components/AdminInvite';
import { Shield, Plus, Trash2, Edit2, Save, X, UserPlus, CheckSquare, Square, Loader2, AlertCircle, Users } from 'lucide-react';
import { Role, UserRole } from '../../types';
import { PERMISSIONS } from '../constants/rbac';

const AdminRoles: React.FC = () => {
  const { roles, userRoles, createRole, updateRole, deleteRole, assignUserRole, getUserRoles } = useApp();
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [allUserRoles, setAllUserRoles] = useState<UserRole[]>([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'invite' | 'roles'>('invite');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });
  const [legacyPermissions, setLegacyPermissions] = useState<string[]>([]);
  const [assignForm, setAssignForm] = useState({
    userEmail: '',
    roleId: ''
  });

  const LEGACY_PERMISSION_MAP: Record<string, string> = {
    view_universities: 'UNIVERSITY_VIEW',
    create_universities: 'UNIVERSITY_CREATE',
    edit_universities: 'UNIVERSITY_EDIT',
    delete_universities: 'UNIVERSITY_DELETE',
    view_students: 'STUDENT_VIEW',
    manage_students: 'STUDENT_EDIT',
    edit_student_status: 'STUDENT_EDIT',
    view_student_progress: 'STUDENT_PROGRESS',
    view_applications: 'APPLICATION_VIEW',
    approve_applications: 'APPLICATION_MANAGE',
    reject_applications: 'APPLICATION_MANAGE',
    view_payments: 'PAYMENT_VIEW',
    manage_payments: 'PAYMENT_CREATE',
    confirm_payments: 'PAYMENT_APPROVE',
    create_invoices: 'PAYMENT_CREATE',
    view_analytics: 'ANALYTICS_VIEW',
    view_dashboard: 'ANALYTICS_VIEW',
    export_data: 'UNIVERSITY_EXPORT',
    export_reports: 'ANALYTICS_VIEW',
    view_users: 'USER_MANAGE',
    manage_users: 'USER_MANAGE',
    manage_roles: 'ROLE_MANAGE',
    assign_roles: 'ROLE_MANAGE',
    view_settings: 'SETTINGS_MANAGE',
    manage_settings: 'SETTINGS_MANAGE',
    manage_email_templates: 'SETTINGS_MANAGE',
    manage_workflows: 'SETTINGS_MANAGE',
    view_scholarships: 'UNIVERSITY_VIEW',
    manage_scholarships: 'UNIVERSITY_EDIT',
    view_visa: 'STUDENT_VIEW',
    manage_visa: 'STUDENT_EDIT',
    view_appointments: 'STUDENT_VIEW',
    manage_appointments: 'STUDENT_EDIT',
  };

  const CATEGORY_LABELS: Record<string, string> = {
    university: 'Trường học',
    student: 'Học viên',
    student_progress: 'Học viên',
    application: 'Đơn đăng ký',
    payment: 'Thanh toán',
    analytics: 'Báo cáo',
    user: 'Người dùng',
    role: 'Người dùng',
    settings: 'Cài đặt'
  };

  const availablePermissions = Object.entries(PERMISSIONS).map(([key, perm]) => ({
    key,
    label: perm.description,
    category: CATEGORY_LABELS[perm.resource] || 'Khác'
  }));

  const categoryOrder = Array.from(new Set(availablePermissions.map((p) => p.category)));

  const normalizePermissions = (permissions: string[]) => {
    const normalized: string[] = [];
    const legacy: string[] = [];
    permissions.forEach((perm) => {
      if (perm in PERMISSIONS) {
        normalized.push(perm);
        return;
      }
      if (LEGACY_PERMISSION_MAP[perm]) {
        normalized.push(LEGACY_PERMISSION_MAP[perm]);
        return;
      }
      legacy.push(perm);
    });
    return {
      normalized: Array.from(new Set(normalized)),
      legacy
    };
  };

  const getPermissionLabel = (permKey: string) => {
    if (permKey in PERMISSIONS) return PERMISSIONS[permKey as keyof typeof PERMISSIONS].description;
    if (LEGACY_PERMISSION_MAP[permKey]) {
      const mapped = LEGACY_PERMISSION_MAP[permKey] as keyof typeof PERMISSIONS;
      return PERMISSIONS[mapped]?.description || permKey;
    }
    return permKey;
  };

  useEffect(() => {
    setAllRoles(roles);
    setAllUserRoles(userRoles);
  }, [roles, userRoles]);

  const validateRoleForm = () => {
    const errors: Record<string, string> = {};
    if (!roleForm.name.trim()) {
      errors.name = 'Tên vai trò là bắt buộc';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditRole = (role: Role) => {
    const { normalized, legacy } = normalizePermissions(role.permissions || []);
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || '',
      permissions: normalized
    });
    setLegacyPermissions(legacy);
    setShowRoleModal(true);
  };

  const handleCreateRole = async () => {
    if (!validateRoleForm()) return;
    
    setIsSubmitting(true);
    try {
      const permissionsToSave = Array.from(new Set([...roleForm.permissions, ...legacyPermissions]));
      if (editingRole) {
        await updateRole(editingRole.id, {
          name: roleForm.name,
          description: roleForm.description,
          permissions: permissionsToSave
        });
      } else {
        await createRole({
          ...roleForm,
          permissions: permissionsToSave
        });
      }
      setShowRoleModal(false);
      setEditingRole(null);
      setRoleForm({ name: '', description: '', permissions: [] });
      setLegacyPermissions([]);
    } catch (error) {
      console.error('Failed to save role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      await deleteRole(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  const handleAssignRole = async () => {
    try {
      await assignUserRole({
        userEmail: assignForm.userEmail,
        roleId: assignForm.roleId
      } as any);
      setShowAssignModal(false);
      setAssignForm({ userEmail: '', roleId: '' });
    } catch (error) {
      console.error('Failed to assign role:', error);
    }
  };

  const togglePermission = (perm: string) => {
    setRoleForm({
      ...roleForm,
      permissions: roleForm.permissions.includes(perm)
        ? roleForm.permissions.filter(p => p !== perm)
        : [...roleForm.permissions, perm]
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Phân quyền</h1>
        <p className="text-gray-600 mt-1">Quản lý vai trò và quyền hạn</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('invite')}
          className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 ${
            activeTab === 'invite'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Mời Admin mới
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 ${
            activeTab === 'roles'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          Quản lý vai trò
        </button>
      </div>

      {/* Content */}
      {activeTab === 'invite' ? (
        <AdminInvite />
      ) : (
        <>
          {/* Roles Management Content */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Vai trò</h2>
              <p className="text-gray-600 mt-1">Tạo và quản lý vai trò</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <UserPlus className="w-4 h-4" />
                Gán quyền
              </button>
              <button
                onClick={() => setShowRoleModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Tạo vai trò
              </button>
            </div>
          </div>

          {/* Roles List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {allRoles.length === 0 ? (
              <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
                <Shield className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">Chưa có vai trò nào</p>
              </div>
            ) : (
              allRoles.map((role) => (
                <div key={role.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold">{role.name}</h3>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleEditRole(role)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(role.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Quyền hạn ({role.permissions?.length || 0}):</p>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {role.permissions?.slice(0, 8).map((permKey) => {
                        const perm = availablePermissions.find(p => p.key === permKey);
                        const label = perm?.label || getPermissionLabel(permKey);
                        return (
                          <span key={permKey} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded" title={label}>
                            {label}
                          </span>
                        );
                      }) || <span className="text-sm text-gray-400">Không có quyền</span>}
                      {(role.permissions?.length || 0) > 8 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{role.permissions.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* User Roles */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Người dùng và vai trò</h2>
            {allUserRoles.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Chưa có gán quyền nào</p>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Email</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Vai trò</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Ngày gán</th>
                  </tr>
                </thead>
                <tbody>
                  {allUserRoles.map((ur) => (
                    <tr key={ur.id} className="border-b">
                      <td className="px-4 py-3">{ur.userEmail}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                          {allRoles.find(r => r.id === ur.roleId)?.name || ur.roleId}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(ur.assignedAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Create Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingRole ? 'Sửa vai trò' : 'Tạo vai trò mới'}</h2>
              <button onClick={() => { setShowRoleModal(false); setEditingRole(null); }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên vai trò *</label>
                <input
                  type="text"
                  className={`w-full border rounded px-3 py-2 ${formErrors.name ? 'border-red-500' : ''}`}
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  placeholder="Ví dụ: Manager"
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quyền hạn</label>
                <div className="max-h-80 overflow-y-auto space-y-4">
                  {categoryOrder.map((category) => {
                    const categoryPerms = availablePermissions.filter(p => p.category === category);
                    if (categoryPerms.length === 0) return null;
                    return (
                      <div key={category} className="border rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {categoryPerms.map((perm) => (
                            <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                              <button
                                onClick={() => togglePermission(perm.key)}
                                className="text-blue-600"
                              >
                                {roleForm.permissions.includes(perm.key) ? (
                                  <CheckSquare className="w-5 h-5" />
                                ) : (
                                  <Square className="w-5 h-5" />
                                )}
                              </button>
                              <span className="text-sm">{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateRole}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                ) : (
                  <><Save className="w-4 h-4" /> {editingRole ? 'Cập nhật' : 'Tạo'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Gán vai trò cho người dùng</h2>
              <button onClick={() => setShowAssignModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email người dùng</label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2"
                  value={assignForm.userEmail}
                  onChange={(e) => setAssignForm({ ...assignForm, userEmail: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn vai trò</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={assignForm.roleId}
                  onChange={(e) => setAssignForm({ ...assignForm, roleId: e.target.value })}
                >
                  <option value="">Chọn vai trò...</option>
                  {allRoles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleAssignRole}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <UserPlus className="w-4 h-4" />
                Gán quyền
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold">Xác nhận xóa</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa vai trò này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteRole(showDeleteConfirm)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoles;
