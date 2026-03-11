import React from 'react';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { Calendar, School, User, RefreshCw } from 'lucide-react';

export default function AdminRegistrations() {
  const { registrations, universities, user: currentUser } = useApp();
  const { currency, toggleCurrency, formatCurrency } = useCurrency();

  const getUniversityById = (id: string) => {
    return universities.find(uni => uni.id === id);
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
        <h1 className="text-3xl font-bold text-slate-900">Student Registrations</h1>
        <p className="text-slate-600 mt-1">View all student university registrations</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-slate-900">Total Registrations: {registrations.length}</h3>
        </div>

        {registrations.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No registrations yet</p>
            <p className="text-sm text-slate-500 mt-1">Students will appear here when they register for universities</p>
          </div>
        ) : (
          <div className="space-y-3">
            {registrations.map((registration, index) => {
              const university = getUniversityById(registration.universityId);
              if (!university) return null;

              return (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <School className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-900 mb-1">{university.name}</h4>
                      <p className="text-sm text-slate-600">{university.country}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="font-medium">Student:</span> {registration.studentEmail}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    {formatDate(registration.registeredAt)}
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