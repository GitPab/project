import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { GraduationCap, Mail, Lock, UserCircle, Shield, Zap, Eye, Edit3, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'student'>('student');
  const { login } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password, role);
    navigate(role === 'admin' ? '/admin/dashboard' : '/student/home');
  };

  const handleQuickDemo = (demoRole: 'admin' | 'student', demoEmail?: string) => {
    const finalEmail = demoEmail || (demoRole === 'admin' ? 'admin@demo.com' : 'student@demo.com');
    login(finalEmail, 'demo', demoRole);
    navigate(demoRole === 'admin' ? '/admin/dashboard' : '/student/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Back to Onboarding Link */}
        <div className="mb-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-slate-500 hover:text-primary transition-colors inline-flex items-center gap-1"
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Demo Buttons */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="text-center mb-6">
              <Zap className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Quick Demo Access</h2>
              <p className="text-slate-600 text-sm">Experience the platform instantly</p>
            </div>

            <div className="space-y-4">
              {/* Admin Demo Button */}
              <button
                onClick={() => handleQuickDemo('admin')}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl p-6 transition-all shadow-md hover:shadow-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xl font-bold">Admin Demo</h3>
                      <Edit3 className="w-5 h-5 opacity-75" />
                    </div>
                    <p className="text-blue-100 text-sm mb-3">Full management access</p>
                    <ul className="text-xs text-blue-100 space-y-1">
                      <li>✓ Edit university costs</li>
                      <li>✓ Manage registrations</li>
                      <li>✓ View analytics dashboard</li>
                    </ul>
                  </div>
                </div>
              </button>

              {/* Student Demo Button */}
              <button
                onClick={() => handleQuickDemo('student')}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl p-6 transition-all shadow-md hover:shadow-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <UserCircle className="w-6 h-6" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xl font-bold">Student Demo</h3>
                      <Eye className="w-5 h-5 opacity-75" />
                    </div>
                    <p className="text-emerald-100 text-sm mb-3">View-only access</p>
                    <ul className="text-xs text-emerald-100 space-y-1">
                      <li>✓ Browse universities</li>
                      <li>✓ View costs (read-only)</li>
                      <li>✓ Track registrations</li>
                    </ul>
                  </div>
                </div>
              </button>

              {/* Demo Students with Progress */}
              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-3">🎯 Try Demo Students with Progress Tracking:</p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleQuickDemo('student', 'nguyenvana@example.com')}
                    className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Nguyễn Văn A 🇻🇳</p>
                        <p className="text-xs text-slate-600">University of Melbourne • 65% Progress</p>
                      </div>
                      <div className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Active</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleQuickDemo('student', 'kimjihoon@example.com')}
                    className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Kim Ji-hoon (김지훈) 🇰🇷</p>
                        <p className="text-xs text-slate-600">MIT • 40% Progress</p>
                      </div>
                      <div className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">In Progress</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-xs text-center text-slate-500">
                💡 Click above to instantly explore each role's interface
              </p>
            </div>
          </div>

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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-3 text-sm font-medium text-slate-700">Login as</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex flex-col items-center justify-center gap-2 py-4 px-4 rounded-lg border-2 transition-all ${
                      role === 'student'
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-primary/50'
                    }`}
                  >
                    <UserCircle className="w-6 h-6" />
                    <span className="font-medium">Student</span>
                    <span className="text-xs opacity-75">View Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex flex-col items-center justify-center gap-2 py-4 px-4 rounded-lg border-2 transition-all ${
                      role === 'admin'
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-primary/50'
                    }`}
                  >
                    <Shield className="w-6 h-6" />
                    <span className="font-medium">Admin</span>
                    <span className="text-xs opacity-75">Full Access</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                Sign In
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-xs text-center text-slate-500">
                Demo mode: Use any email/password combination
              </p>
            </div>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 text-center">Role Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Shield className="w-5 h-5" />
                <span>Admin Features</span>
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Edit university information
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Update cost breakdowns
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Manage additional fees
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  View all registrations
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Analytics dashboard
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                <UserCircle className="w-5 h-5" />
                <span>Student Features</span>
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Browse universities
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  View costs (read-only)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Register for programs
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Track personal costs
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  No edit permissions 🔒
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}