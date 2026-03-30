import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import AdminInvite from '../components/AdminInvite';
import { Shield, Plus, Trash2, Edit2, Save, X, UserPlus, CheckSquare, Square, Loader2, AlertCircle, Users } from 'lucide-react';
import { Role, UserRole } from '../../types';

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
  const [assignForm, setAssignForm] = useState({
    userEmail: '',
    roleId: ''
  });

  const availablePermissions = [
    // Universities
    { key: 'view_universities', label: 'Xem danh sách trường', category: 'Trường học' },
    { key: 'create_universities', label: 'Thêm trường mới', category: 'Trường học' },
    { key: 'edit_universities', label: 'Sửa thông tin trường', category: 'Trường học' },
    { key: 'delete_universities', label: 'Xóa trường', category: 'Trường học' },
    { key: 'configure_fees', label: 'Cấu hình chi phí', category: 'Trường học' },
    { key: 'import_universities', label: 'Import danh sách trường', category: 'Trường học' },
    
    // Students
    { key: 'view_students', label: 'Xem học viên', category: 'Học viên' },
    { key: 'manage_students', label: 'Quản lý học viên', category: 'Học viên' },
    { key: 'edit_student_status', label: 'Sửa trạng thái học viên', category: 'Học viên' },
    { key: 'view_student_progress', label: 'Xem tiến độ học viên', category: 'Học viên' },
    
    // Applications
    { key: 'view_applications', label: 'Xem đơn đăng ký', category: 'Đơn đăng ký' },
    { key: 'approve_applications', label: 'Duyệt đơn', category: 'Đơn đăng ký' },
    { key: 'reject_applications', label: 'Từ chối đơn', category: 'Đơn đăng ký' },
    
    // Payments
    { key: 'view_payments', label: 'Xem thanh toán', category: 'Thanh toán' },
    { key: 'manage_payments', label: 'Quản lý thanh toán', category: 'Thanh toán' },
    { key: 'confirm_payments', label: 'Xác nhận thanh toán', category: 'Thanh toán' },
    { key: 'create_invoices', label: 'Tạo hóa đơn', category: 'Thanh toán' },
    
    // Documents
    { key: 'view_documents', label: 'Xem tài liệu', category: 'Tài liệu' },
    { key: 'verify_documents', label: 'Xác minh tài liệu', category: 'Tài liệu' },
    { key: 'upload_documents', label: 'Upload tài liệu', category: 'Tài liệu' },
    { key: 'delete_documents', label: 'Xóa tài liệu', category: 'Tài liệu' },
    
    // Analytics & Reports
    { key: 'view_analytics', label: 'Xem thống kê', category: 'Báo cáo' },
    { key: 'view_dashboard', label: 'Xem dashboard', category: 'Báo cáo' },
    { key: 'export_data', label: 'Xuất dữ liệu (Export)', category: 'Báo cáo' },
    { key: 'export_reports', label: 'Xuất báo cáo', category: 'Báo cáo' },
    
    // User Management
    { key: 'view_users', label: 'Xem người dùng', category: 'Người dùng' },
    { key: 'manage_users', label: 'Quản lý người dùng', category: 'Người dùng' },
    { key: 'manage_roles', label: 'Phân quyền (RBAC)', category: 'Người dùng' },
    { key: 'assign_roles', label: 'Gán vai trò', category: 'Người dùng' },
    
    // Settings
    { key: 'view_settings', label: 'Xem cài đặt', category: 'Cài đặt' },
    { key: 'manage_settings', label: 'Quản lý cài đặt', category: 'Cài đặt' },
    { key: 'manage_email_templates', label: 'Quản lý mẫu email', category: 'Cài đặt' },
    { key: 'manage_workflows', label: 'Quản lý workflow', category: 'Cài đặt' },
    
    // Scholarships
    { key: 'view_scholarships', label: 'Xem học bổng', category: 'Học bổng' },
    { key: 'manage_scholarships', label: 'Quản lý học bổng', category: 'Học bổng' },
    
    // Visa
    { key: 'view_visa', label: 'Xem theo dõi visa', category: 'Visa' },
    { key: 'manage_visa', label: 'Quản lý visa', category: 'Visa' },
    
    // Appointments
    { key: 'view_appointments', label: 'Xem lịch hẹn', category: 'Lịch hẹn' },
    { key: 'manage_appointments', label: 'Quản lý lịch hẹn', category: 'Lịch hẹn' },
    
    // Notifications
    { key: 'send_notifications', label: 'Gửi thông báo', category: 'Thông báo' },
    { key: 'manage_notifications', label: 'Quản lý thông báo', category: 'Thông báo' },
    
    // System
    { key: 'sync_database', label: 'Sync dữ liệu', category: 'Hệ thống' },
    { key: 'backup_database', label: 'Backup/Restore', category: 'Hệ thống' },
    { key: 'view_audit_logs', label: 'Xem nhật ký hệ thống', category: 'Hệ thống' },
    { key: 'system_admin', label: 'Quản trị viên hệ thống', category: 'Hệ thống' }
  ];

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
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || []
    });
    setShowRoleModal(true);
  };

  const handleCreateRole = async () => {
    if (!validateRoleForm()) return;
    
    setIsSubmitting(true);
    try {
      if (editingRole) {
        await updateRole(editingRole.id, {
          name: roleForm.name,
          description: roleForm.description,
          permissions: roleForm.permissions
        });
      } else {
        await createRole({
          ...roleForm,
          permissions: roleForm.permissions
        });
      }
      setShowRoleModal(false);
      setEditingRole(null);
      setRoleForm({ name: '', description: '', permissions: [] });
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
                        return (
                          <span key={permKey} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded" title={perm?.label || permKey}>
                            {perm?.label || permKey}
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
                  {['Trường học', 'Học viên', 'Đơn đăng ký', 'Thanh toán', 'Tài liệu', 'Báo cáo', 'Người dùng', 'Cài đặt', 'Học bổng', 'Visa', 'Lịch hẹn', 'Thông báo', 'Hệ thống'].map((category) => {
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
