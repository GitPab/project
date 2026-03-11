import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useApp, University } from '../context/AppContext';
import { useCurrency, Currency } from '../context/CurrencyContext';
import UniversityForm from '../components/UniversityForm';
import { Edit, Plus, Trash2, X, Lock, RefreshCw, Eye, Upload, ImageIcon, AlertCircle, Save, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';

export default function UniversitiesList() {
  const navigate = useNavigate();
  const { universities, updateUniversity, user } = useApp();
  const { currency, setCurrency, formatFrom } = useCurrency();
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
  
  const isAdmin = user?.role === 'admin';

  const calculateTotal = (uni: University) => {
    return uni.generalTuition + uni.visaFee + uni.accommodationFee + uni.insuranceFee +
           uni.additionalFees.reduce((sum, fee) => sum + fee.amount, 0);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Currency Selector - Fixed Position */}
      <div className="fixed bottom-6 right-6 z-40 bg-white border-2 border-primary rounded-full shadow-lg overflow-hidden">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          className="px-5 py-3 font-semibold text-primary bg-white cursor-pointer focus:outline-none appearance-none pr-10"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231E40AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
        >
          <option value="VND">VND ₫</option>
          <option value="KRW">KRW ₩</option>
          <option value="USD">USD $</option>
          <option value="JPY">JPY ¥</option>
          <option value="CNY">CNY ¥</option>
        </select>
      </div>

      {/* Read-Only Notice for Students */}
      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Chế độ xem - Không thể chỉnh sửa</p>
            <p className="text-xs text-blue-700 mt-1">Thông tin chi phí chỉ để tham khảo. Liên hệ quản trị viên để cập nhật.</p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {isAdmin ? 'Universities List' : 'Danh sách trường đại học'}
        </h1>
        <p className="text-slate-600 mt-1">
          {isAdmin ? 'Manage university costs and information' : 'Xem thông tin chi phí các trường đại học'}
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">
                  {isAdmin ? 'University Name' : 'Tên trường'}
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">
                  {isAdmin ? 'Country' : 'Quốc gia'}
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">
                  {isAdmin ? 'General Tuition' : 'Học phí'}
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">
                  {isAdmin ? 'Visa Fee' : 'Phí visa'}
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">
                  {isAdmin ? 'Accommodation' : 'Lưu trú'}
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">
                  {isAdmin ? 'Insurance' : 'Bảo hiểm'}
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">
                  {isAdmin ? 'Total Estimated' : 'Tổng ước tính'}
                </th>
                {isAdmin && (
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-900">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {universities.map((uni) => (
                <tr key={uni.id} className="border-b border-slate-200 last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{uni.name}</td>
                  <td className="px-6 py-4 text-slate-700">{uni.country}</td>
                  <td className="px-6 py-4 text-right text-slate-900">{formatFrom(uni.generalTuition, 'USD')}</td>
                  <td className="px-6 py-4 text-right text-slate-900">{formatFrom(uni.visaFee, 'USD')}</td>
                  <td className="px-6 py-4 text-right text-slate-900">{formatFrom(uni.accommodationFee, 'USD')}</td>
                  <td className="px-6 py-4 text-right text-slate-900">{formatFrom(uni.insuranceFee, 'USD')}</td>
                  <td className="px-6 py-4 text-right font-semibold text-primary">{formatFrom(calculateTotal(uni), 'USD')}</td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-center">
                        <button
                          onClick={() => navigate(`/admin/university/${uni.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => setEditingUniversity(uni)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {universities.map((uni) => (
          <div key={uni.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Thumbnail Image */}
            <div className="relative h-40 overflow-hidden">
              <img 
                src={uni.thumbnail} 
                alt={uni.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="text-white font-semibold text-base leading-tight mb-1">{uni.name}</h3>
                <p className="text-sm text-white/90">{uni.country}</p>
              </div>
              {isAdmin ? (
                <button
                  onClick={() => setEditingUniversity(uni)}
                  className="absolute top-3 right-3 p-2 bg-white/95 backdrop-blur-sm text-primary hover:bg-white rounded-lg transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
              ) : (
                <Lock className="absolute top-3 right-3 w-5 h-5 text-white/80" />
              )}
            </div>
            
            <div className="p-4">
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">{isAdmin ? 'Tuition:' : 'Học phí:'}</span>
                  <span className="font-medium text-slate-900">{formatFrom(uni.generalTuition, 'USD')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{isAdmin ? 'Visa:' : 'Visa:'}</span>
                  <span className="font-medium text-slate-900">{formatFrom(uni.visaFee, 'USD')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{isAdmin ? 'Accommodation:' : 'Lưu trú:'}</span>
                  <span className="font-medium text-slate-900">{formatFrom(uni.accommodationFee, 'USD')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{isAdmin ? 'Insurance:' : 'Bảo hiểm:'}</span>
                  <span className="font-medium text-slate-900">{formatFrom(uni.insuranceFee, 'USD')}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-900">{isAdmin ? 'Total:' : 'Tổng:'}</span>
                  <span className="font-semibold text-primary">{formatFrom(calculateTotal(uni), 'USD')}</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <button
                onClick={() => navigate(isAdmin ? `/admin/university/${uni.id}` : `/student/university/${uni.id}`)}
                className="w-full px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
              >
                {isAdmin ? 'View Details' : 'Xem chi tiết'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal - Admin Only */}
      {isAdmin && editingUniversity && (
        <UniversityForm
          university={editingUniversity}
          onClose={() => setEditingUniversity(null)}
          onSave={() => {
            setEditingUniversity(null)
            toast.success('Đã cập nhật thông tin trường thành công!');
          }}
        />
      )}
    </div>
  );
}

