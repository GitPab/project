import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { GraduationCap, Mail, Lock, UserCircle, Shield, ArrowLeft } from 'lucide-react';

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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#003AB7]/50 focus:border-[#003AB7] transition-all"
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
                    className={`flex flex-col items-center justify-center gap-2 py-4 px-4 rounded-lg border-2 transition-all active:scale-95 ${
                      role === 'student'
                        ? 'border-[#003AB7] bg-[#003AB7]/5 text-[#003AB7] shadow-sm'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-[#003AB7]/50 active:bg-[#F0F7FF] active:text-[#003AB7]'
                    }`}
                  >
                    <UserCircle className="w-6 h-6" />
                    <span className="font-medium">Student</span>
                    <span className="text-xs opacity-75">View Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex flex-col items-center justify-center gap-2 py-4 px-4 rounded-lg border-2 transition-all active:scale-95 ${
                      role === 'admin'
                        ? 'border-[#003AB7] bg-[#003AB7]/5 text-[#003AB7] shadow-sm'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-[#003AB7]/50 active:bg-[#F0F7FF] active:text-[#003AB7]'
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
                className="w-full bg-[#003AB7] text-white py-3 rounded-lg hover:bg-[#002A8F] active:bg-[#001F70] transition-colors font-medium shadow-md hover:shadow-lg active:shadow-inner"
              >
                Sign In
              </button>
            </form>
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