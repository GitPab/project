import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowLeft, GraduationCap } from 'lucide-react';
import { getApiUrl } from '../services/portDetector';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'init'|'loading'|'ready'|'error'>('init');
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Check API connection on mount
  useEffect(() => {
    const checkApi = async () => {
      setApiStatus('loading');
      try {
        // Dynamic health check
        const apiUrl = await getApiUrl();
        const response = await fetch(`${apiUrl}/health`);
        if (response.ok) {
          setApiStatus('ready');
        } else {
          setApiStatus('error');
        }
      } catch (err) {
        console.warn('API connection failed, continuing anyway:', err);
        setApiStatus('ready');
      }
    };
    checkApi();
  }, []);

  // Already logged in → auto redirect based on role
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/home');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(form.email, form.password);
      // Redirect happens automatically via useEffect above
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Back to Onboarding Link */}
        <div className="mb-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-slate-500 hover:text-[#003AB7] transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Student Onboarding
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-blue-700 rounded-2xl mb-4 shadow-lg">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Du Học Cost Manager</h1>
          <p className="text-slate-600 text-lg">Asia-Focused International Education Journey</p>
          <p className="text-slate-500 text-sm mt-1">🌏 Featuring 50+ top Asian universities | 🇰🇷🇨🇳🇯🇵🇸🇬🇻🇳🇮🇳🇹🇭🇲🇾</p>
        </div>

        <div className="max-w-md mx-auto">
          {/* Traditional Login Form */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="text-center mb-6">
              <Lock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Manual Login</h2>
              <p className="text-slate-600 text-sm">Enter your credentials</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#003AB7]/50 focus:border-[#003AB7] transition-all"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#003AB7]/50 focus:border-[#003AB7] transition-all"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}

              {apiStatus === 'loading' && (
                <div className="text-blue-600 text-sm text-center">Connecting to server...</div>
              )}

              {apiStatus === 'error' && (
                <div className="text-yellow-500 text-sm text-center">Server connection issue. Login may still work.</div>
              )}

              <button
                type="submit"
                disabled={loading || apiStatus === 'loading'}
                className="w-full bg-[#003AB7] text-white py-3 rounded-lg font-semibold hover:bg-[#002A8F] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              Chưa có tài khoản?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-[#003AB7] font-semibold hover:underline"
              >
                Đăng ký học viên
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}