import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function FirstTimeSetup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');

  // Verify token on mount
  useEffect(() => {
    if (!token || !email) {
      setError('Liên kết không hợp lệ. Vui lòng kiểm tra email hoặc liên hệ quản trị viên.');
      setVerifying(false);
      return;
    }

    verifyToken();
  }, [token, email]);

  const verifyToken = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-setup-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Liên kết đã hết hạn hoặc không hợp lệ');
        setIsValid(false);
      } else {
        setIsValid(true);
      }
    } catch (err) {
      setError('Không thể xác minh liên kết. Vui lòng thử lại sau.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Mật khẩu không khớp');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Không thể đặt mật khẩu');
        return;
      }

      // Save auth token and redirect
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      
      toast.success('Mật khẩu đã được đặt thành công!');
      
      // Redirect based on role
      const adminRoles = ['admin', 'super_admin', 'admin_manager', 'content_editor', 'finance_admin', 'viewer'];
      if (adminRoles.includes(data.user.role)) {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/home');
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Đang xác minh liên kết...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-2">Lỗi</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Về trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Thiết lập mật khẩu</h1>
          <p className="text-slate-600 mt-2">
            Chào mừng! Vui lòng tạo mật khẩu cho tài khoản của bạn
          </p>
          <p className="text-sm text-blue-600 mt-1 font-medium">{email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Xác nhận mật khẩu
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập lại mật khẩu"
              required
            />
          </div>

          {/* Password requirements */}
          <div className="text-sm text-slate-500 space-y-1">
            <p className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${password.length >= 6 ? 'text-green-500' : 'text-slate-300'}`} />
              Ít nhất 6 ký tự
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${password === confirmPassword && password !== '' ? 'text-green-500' : 'text-slate-300'}`} />
              Mật khẩu khớp
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || password.length < 6 || password !== confirmPassword}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Đang xử lý...' : 'Hoàn tất thiết lập'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Liên kết này sẽ hết hạn sau 24 giờ
        </p>
      </div>
    </div>
  );
}
