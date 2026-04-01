import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Lock, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { saveToken } from '../services/tokenHelper';

export default function AdminLoginSimple() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Vui lòng nhập email và mật khẩu');
      return;
    }

    setIsLoading(true);

    try {
      // Call login API (login route also works for admin)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Save token using helper
        saveToken(data.token, data.user);
        
        toast.success('Đăng nhập thành công!');
        
        // Navigate immediately to dashboard
        navigate('/admin/dashboard', { replace: true });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      // Fallback for development - mock login
      if (email === 'admin@duhoccost.vn' && password === 'admin123') {
        const mockUser = { 
          email: 'admin@duhoccost.vn', 
          name: 'Admin',
          role: 'admin'
        };
        const mockToken = 'dev-token';
        
        // Save token using helper
        saveToken(mockToken, mockUser);
        
        toast.success('Đăng nhập thành công! (Dev Mode)');
        navigate('/admin/dashboard', { replace: true });
      } else {
        toast.error('Email hoặc mật khẩu không đúng');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003AB7] to-[#558EFF] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#003AB7] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#003AB7]">SACMA Admin</h1>
            <p className="text-gray-500 text-sm mt-1">Hệ thống quản trị du học Hàn Quốc</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Admin
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003AB7]"
                  placeholder="admin@duhoccost.vn"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003AB7]"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#003AB7] hover:bg-[#002A8F] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
            <p className="font-medium">Demo credentials:</p>
            <p>Email: admin@duhoccost.vn</p>
            <p>Password: admin123</p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-4 text-gray-500 hover:text-[#003AB7] text-sm"
          >
            ← Quay lại trang chủ
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-8">
          © 2024 SACMA - Hệ thống du học Hàn Quốc
        </p>
      </div>
    </div>
  );
}
