import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, UserPlus, Copy, CheckCircle, Clock, RefreshCw, Shield, X } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '../services/portDetector';

interface InvitedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  setup_token_expiry: string;
}

const ROLE_OPTIONS = [
  { value: 'admin_manager', label: 'Quản lý Admin', description: 'Quản lý học sinh, đơn đăng ký, tiến độ' },
  { value: 'content_editor', label: 'Biên tập viên', description: 'Chỉnh sửa thông tin trường' },
  { value: 'finance_admin', label: 'Quản lý Tài chính', description: 'Quản lý thanh toán' },
  { value: 'viewer', label: 'Người xem', description: 'Chỉ xem, không chỉnh sửa' },
];

export default function AdminInvite() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('admin_manager');
  const [loading, setLoading] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Check if current user can invite (super_admin or admin)
  const canInvite = (user?.role as string) === 'super_admin' || (user?.role as string) === 'admin';

  useEffect(() => {
    if (canInvite) {
      fetchInvitedUsers();
    }
  }, [canInvite]);

  const fetchInvitedUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('adminToken');
      const API_URL = await getApiUrl();
      const res = await fetch(`${API_URL}/admin/invited-users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch invited users');
      const data = await res.json();
      setInvitedUsers(data);
    } catch (error) {
      console.error('Error fetching invited users:', error);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      toast.error('Vui lòng nhập email và tên');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('adminToken');
      const API_URL = await getApiUrl();
      const res = await fetch(`${API_URL}/admin/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, name, phone, role })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Không thể mời người dùng');
        return;
      }

      toast.success('Đã gửi lời mời thành công!');
      setEmail('');
      setName('');
      setPhone('');
      setShowInviteForm(false);
      fetchInvitedUsers();

      // Show the setup link to copy
      if (data.setupUrl) {
        setCopiedLink(data.setupUrl);
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi gửi lời mời');
    } finally {
      setLoading(false);
    }
  };

  const resendInvite = async (userId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const API_URL = await getApiUrl();
      const res = await fetch(`${API_URL}/admin/resend-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Không thể gửi lại lời mời');
        return;
      }

      toast.success('Đã gửi lại lời mời!');
      if (data.setupUrl) {
        setCopiedLink(data.setupUrl);
      }
      fetchInvitedUsers();
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép liên kết!');
    setCopiedLink(null);
  };

  const getRoleLabel = (roleValue: string) => {
    return ROLE_OPTIONS.find(r => r.value === roleValue)?.label || roleValue;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!canInvite) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Bạn không có quyền mời người dùng mới
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Mời Admin mới</h3>
          <p className="text-sm text-slate-500">Tạo tài khoản admin mà không cần đăng ký</p>
        </div>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-4 h-4" />
          {showInviteForm ? 'Hủy' : 'Mời người mới'}
        </button>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <form onSubmit={handleInvite} className="bg-slate-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Nguyễn Văn A"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0901234567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vai trò *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-sm text-slate-500 bg-white p-3 rounded border">
            <p className="font-medium mb-1">{ROLE_OPTIONS.find(r => r.value === role)?.label}:</p>
            <p>{ROLE_OPTIONS.find(r => r.value === role)?.description}</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowInviteForm(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300"
            >
              {loading ? 'Đang xử lý...' : 'Gửi lời mời'}
            </button>
          </div>
        </form>
      )}

      {/* Setup Link Modal */}
      {copiedLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg">Liên kết thiết lập</h4>
              <button onClick={() => setCopiedLink(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Gửi liên kết này cho người được mời. Liên kết sẽ hết hạn sau 24 giờ.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={copiedLink}
                readOnly
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm"
              />
              <button
                onClick={() => copyToClipboard(copiedLink)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Sao chép
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invited Users List */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h4 className="font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            Lời mời đang chờ ({invitedUsers.length})
          </h4>
        </div>
        
        {invitedUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Mail className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Chưa có lời mời nào đang chờ</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {invitedUsers.map((invitedUser) => (
              <div key={invitedUser.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                    {invitedUser.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{invitedUser.name}</div>
                    <div className="text-sm text-slate-500">{invitedUser.email}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        {getRoleLabel(invitedUser.role)}
                      </span>
                      <span className="text-xs text-slate-400">
                        Hết hạn: {formatDate(invitedUser.setup_token_expiry)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => resendInvite(invitedUser.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <RefreshCw className="w-4 h-4" />
                  Gửi lại
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
