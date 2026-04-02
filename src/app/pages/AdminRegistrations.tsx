import React, { useEffect, useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { Calendar, School, User, RefreshCw, Code } from 'lucide-react';
import { searchTrackingCodesByEmail } from '../services/trackingCodeService';
import { registrationApi } from '../services/api';
import type { TrackingCode } from '@/types/tracking';

interface Registration {
  id: string;
  student_id: string;
  student_name?: string;
  studentEmail?: string;
  university_id: string;
  university_name?: string;
  status: string;
  visa_system?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminRegistrations() {
  const { currency, toggleCurrency, formatCurrency } = useCurrency();
  const { language } = useLanguage();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingCodesByEmail, setTrackingCodesByEmail] = useState<Map<string, TrackingCode>>(new Map());

  // Fetch registrations from API
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await registrationApi.getAll();
        const data = response.data || [];
        setRegistrations(data);
      } catch (err: any) {
        console.error('Failed to fetch registrations:', err);
        setError(err.message || 'Failed to load registrations');
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, []);

  // Load tracking codes for each unique email
  useEffect(() => {
    const loadTrackingCodes = async () => {
      if (registrations.length === 0) return;
      
      try {
        const codeMap = new Map<string, TrackingCode>();
        const uniqueEmails = [...new Set(registrations.map(r => r.student_name || r.studentEmail).filter(Boolean))];

        for (const email of uniqueEmails) {
          if (!email) continue;
          const codes = await searchTrackingCodesByEmail(email);
          if (codes.length > 0) {
            codeMap.set(email, codes[0]);
          }
        }

        setTrackingCodesByEmail(codeMap);
      } catch (error) {
        console.error('Failed to load tracking codes:', error);
      }
    };

    loadTrackingCodes();
  }, [registrations]);

  // Không cần lookup universities nữa vì API đã trả về university_name
  const getUniversityName = (registration: Registration) => {
    return registration.university_name || 'Unknown University';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Currency Toggle Button - Fixed Position */}
      <button
        onClick={toggleCurrency}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-white border-2 border-primary text-primary rounded-full shadow-lg hover:bg-primary hover:text-white transition-colors"
        title="Toggle currency"
      >
        <RefreshCw className="w-5 h-5" />
        <span className="font-semibold">{currency}</span>
      </button>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {language === 'vi' ? 'Đăng ký học sinh' : language === 'ko' ? '학생 등록' : 'Student Registrations'}
        </h1>
        <p className="text-slate-600 mt-1">
          {language === 'vi' ? 'Xem tất cả đăng ký đại học của học sinh' : language === 'ko' ? '모든 학생 대학 등록 보기' : 'View all student university registrations'}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-slate-900">
            {language === 'vi' ? 'Tổng đăng ký' : language === 'ko' ? '총 등록' : 'Total Registrations'}: {registrations.length}
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-slate-400 mx-auto mb-3 animate-spin" />
            <p className="text-slate-600">Loading registrations...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
            >
              Retry
            </button>
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">
              {language === 'vi' ? 'Chưa có đăng ký nào' : language === 'ko' ? '등록 없음' : 'No registrations yet'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {language === 'vi' ? 'Học sinh sẽ xuất hiện ở đây khi đăng ký đại học' : language === 'ko' ? '학생이 대학교에 등록하면 여기에 표시됩니다' : 'Students will appear here when they register for universities'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {registrations.map((registration, index) => {
              const universityName = getUniversityName(registration);

              return (
                <div
                  key={registration.id || index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <School className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-slate-900 mb-1">{universityName}</h4>
                      <p className="text-sm text-slate-600">{registration.status || 'pending'}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="font-medium">
                          {language === 'vi' ? 'Học sinh' : language === 'ko' ? '학생' : 'Student'}:
                        </span> {registration.student_name || registration.studentEmail || 'N/A'}
                      </p>
                      {registration.student_name && trackingCodesByEmail.has(registration.student_name) && (
                        <div className="mt-2 flex items-center gap-2">
                          <Code className="w-3 h-3 text-blue-600" />
                          <code className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            {trackingCodesByEmail.get(registration.student_name)?.code}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    {formatDate(registration.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}