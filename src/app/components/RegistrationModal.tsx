import React, { useState } from 'react';
import { X, CheckCircle, DollarSign, Building, FileText, Home, Shield } from 'lucide-react';
import type { University } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedFees: {
    visa: boolean;
    accommodation: boolean;
    insurance: boolean;
    additional: boolean[];
  }) => void;
  university: University;
}

export default function RegistrationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  university 
}: RegistrationModalProps) {
  const { formatFrom } = useCurrency();
  
  // Get fees from new visaSystemsDetail (preferred) or legacy fields
  const visaSystems = university.koreanData?.visaSystemsDetail || {};
  const firstVisaSystem = Object.values(visaSystems)[0] as any;
  
  // Extract fees from new system or fallback to legacy
  const tuitionFee = firstVisaSystem?.invoiceKRWPerYear || university.generalTuition || 0;
  const applyFee = firstVisaSystem?.applyFeeKRW || university.visaFee || 0;
  const enrollmentFee = firstVisaSystem?.enrollmentFeeKRW || 0;
  const ktxOptions = firstVisaSystem?.ktxOptions || [];
  const cheapestKTX = ktxOptions.length > 0 
    ? Math.min(...ktxOptions.map((k: any) => k.priceKRWPerKy || 0))
    : university.accommodationFee || 0;
  const insuranceFee = university.insuranceFee || 0;
  
  // Calculate common VND fees from new system
  const commonFees = university.koreanData?.commonFeesVND || [];
  const hocTieng = commonFees.find((f: any) => f.id === 'hoc_tieng')?.amount || 13000000;
  const phiTuVan = commonFees.find((f: any) => f.id === 'phi_tu_van')?.amount || 39000000;
  const phiTrungTam = commonFees.find((f: any) => f.id === 'phi_trung_tam')?.amount || 11000000;
  
  const [selectedFees, setSelectedFees] = useState({
    visa: true,
    accommodation: true,
    insurance: true,
    additional: (university.additionalFees || []).map(() => true)
  });

  if (!isOpen) return null;

  const calculateTotal = () => {
    let total = tuitionFee; // Always included
    
    if (selectedFees.visa) total += applyFee;
    if (selectedFees.accommodation) total += cheapestKTX;
    if (selectedFees.insurance) total += insuranceFee;
    
    selectedFees.additional.forEach((selected, index) => {
      if (selected) {
        total += (university.additionalFees || [])[index]?.amount || 0;
      }
    });
    
    return total;
  };

  const handleConfirm = () => {
    onConfirm(selectedFees);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-primary to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Complete Registration</h2>
              <p className="text-sm text-white/80">{university.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
          <div className="mb-6">
            <p className="text-slate-600 mb-4">
              Chọn các khoản phí bạn muốn đăng ký thanh toán. Bạn có thể điều chỉnh sau trong "Chi phí của tôi".
            </p>
            <p className="text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <strong>Lưu ý:</strong> Học phí (General Tuition) là bắt buộc và không thể bỏ chọn.
            </p>
          </div>

          {/* Fee Selection */}
          <div className="space-y-3">
            {/* General Tuition - Always included */}
            <div className="flex items-center justify-between p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Học phí (Tuition)</p>
                  <p className="text-sm text-slate-600">Bắt buộc - Không thể bỏ chọn</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-lg font-bold text-blue-600">
                  {formatFrom(tuitionFee, 'VND')}
                </p>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="w-5 h-5 cursor-not-allowed opacity-60"
                />
              </div>
            </div>

            {/* Visa Fee */}
            <div className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
              selectedFees.visa 
                ? 'bg-green-50 border-green-200' 
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedFees.visa ? 'bg-green-100' : 'bg-slate-100'
                }`}>
                  <FileText className={`w-5 h-5 ${
                    selectedFees.visa ? 'text-green-600' : 'text-slate-600'
                  }`} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Phí apply</p>
                  <span className="text-xs text-gray-500">Application fee</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className={`text-lg font-bold ${
                  selectedFees.visa ? 'text-green-600' : 'text-slate-900'
                }`}>
                  {formatFrom(applyFee, 'VND')}
                </p>
                <input
                  type="checkbox"
                  checked={selectedFees.visa}
                  onChange={(e) => setSelectedFees({
                    ...selectedFees,
                    visa: e.target.checked
                  })}
                  className="w-5 h-5 cursor-pointer accent-primary"
                />
              </div>
            </div>

            {/* Accommodation Fee */}
            <div className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
              selectedFees.accommodation 
                ? 'bg-green-50 border-green-200' 
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedFees.accommodation ? 'bg-green-100' : 'bg-slate-100'
                }`}>
                  <Home className={`w-5 h-5 ${
                    selectedFees.accommodation ? 'text-green-600' : 'text-slate-600'
                  }`} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">KTX / Lưu trú</p>
                  <p className="text-sm text-slate-600">Accommodation ( cheapest option )</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className={`text-lg font-bold ${
                  selectedFees.accommodation ? 'text-green-600' : 'text-slate-900'
                }`}>
                  {formatFrom(cheapestKTX, 'VND')}
                </p>
                <input
                  type="checkbox"
                  checked={selectedFees.accommodation}
                  onChange={(e) => setSelectedFees({
                    ...selectedFees,
                    accommodation: e.target.checked
                  })}
                  className="w-5 h-5 cursor-pointer accent-primary"
                />
              </div>
            </div>

            {/* Insurance Fee */}
            <div className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
              selectedFees.insurance 
                ? 'bg-green-50 border-green-200' 
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedFees.insurance ? 'bg-green-100' : 'bg-slate-100'
                }`}>
                  <Shield className={`w-5 h-5 ${
                    selectedFees.insurance ? 'text-green-600' : 'text-slate-600'
                  }`} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Phí nhập học</p>
                  <p className="text-sm text-slate-600">Enrollment fee</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className={`text-lg font-bold ${
                  selectedFees.insurance ? 'text-green-600' : 'text-slate-900'
                }`}>
                  {formatFrom(enrollmentFee, 'VND')}
                </p>
                <input
                  type="checkbox"
                  checked={selectedFees.insurance}
                  onChange={(e) => setSelectedFees({
                    ...selectedFees,
                    insurance: e.target.checked
                  })}
                  className="w-5 h-5 cursor-pointer accent-primary"
                />
              </div>
            </div>

            {/* Additional Fees */}
            {(university.additionalFees || []).map((fee, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                  selectedFees.additional[index]
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedFees.additional[index] ? 'bg-green-100' : 'bg-slate-100'
                  }`}>
                    <DollarSign className={`w-5 h-5 ${
                      selectedFees.additional[index] ? 'text-green-600' : 'text-slate-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{fee.type}</p>
                    <p className="text-sm text-slate-600">Additional fee</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`text-lg font-bold ${
                    selectedFees.additional[index] ? 'text-green-600' : 'text-slate-900'
                  }`}>
                    {calculateTotal().toLocaleString()} VND
                  </p>
                  <input
                    type="checkbox"
                    checked={selectedFees.additional[index]}
                    onChange={(e) => {
                      const newAdditional = [...selectedFees.additional];
                      newAdditional[index] = e.target.checked;
                      setSelectedFees({
                        ...selectedFees,
                        additional: newAdditional
                      });
                    }}
                    className="w-5 h-5 cursor-pointer accent-primary"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 p-5 bg-gradient-to-r from-primary/10 to-blue-100/50 border-2 border-primary rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Tổng chi phí đã chọn</p>
                <p className="text-sm text-slate-600">Selected total cost</p>
              </div>
              <p className="text-3xl font-bold text-primary">
                {formatFrom(calculateTotal(), 'VND')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            Hủy / Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Xác nhận đăng ký / Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
