import React, { useState, useRef } from 'react';
import { Download, FileText, X, Check, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { University } from '../../types';

interface CostBreakdown {
  category: string;
  item: string;
  amountKRW: number;
  amountVND: number;
  notes?: string;
}

interface PDFExportButtonProps {
  university: University;
  visaSystem: string;
  topikLevel: number;
  ktxType?: string;
  ktxDuration: number;
  includeScholarship: boolean;
  className?: string;
}

export default function PDFExportButton({
  university,
  visaSystem,
  topikLevel,
  ktxType,
  ktxDuration,
  includeScholarship,
  className = ''
}: PDFExportButtonProps) {
  const { formatFrom, convertAmount } = useCurrency();
  const { language } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const generateCostBreakdown = (): CostBreakdown[] => {
    const breakdown: CostBreakdown[] = [];

    // Fixed costs in VND
    breakdown.push(
      { category: 'Phi cố định', item: 'Học tiếng Hàn (0→TOPIK 2)', amountKRW: 0, amountVND: 13000000, notes: 'E-Learning included' },
      { category: 'Phi cố định', item: 'Phí tư vấn & xử lý hồ sơ', amountKRW: 0, amountVND: 39000000 },
      { category: 'Phi cố định', item: 'Phí trung tâm thu hộ', amountKRW: 0, amountVND: 11000000 },
      { category: 'Phi cố định', item: 'Vé máy bay 1 chiều', amountKRW: 0, amountVND: 8000000, notes: '40kg baggage included' }
    );

    // Visa system costs
    const visaData = university.koreanData?.visaSystems?.find((v: {visaType: string}) => v.visaType === visaSystem);
    if (visaData) {
      breakdown.push(
        { category: `Hệ ${visaSystem}`, item: 'Phí apply', amountKRW: visaData.applicationFee || 100000, amountVND: 0 },
        { category: `Hệ ${visaSystem}`, item: 'Phí nhập học', amountKRW: visaData.enrollmentFee || 5800000, amountVND: 0 },
        { category: `Hệ ${visaSystem}`, item: 'Học phí/kỳ', amountKRW: visaData.tuitionPerTerm || 0, amountVND: 0 }
      );
    }

    // KTX costs
    if (ktxType && ktxDuration > 0) {
      const ktxOptions: Record<string, number> = {
        'Phòng 4 người': 747000,
        'Phòng 2 người': 1102000,
        'Phòng 2 người (Quốc tế)': 1440000
      };
      const ktxPrice = ktxOptions[ktxType] || 747000;
      breakdown.push({
        category: 'KTX',
        item: `${ktxType} × ${ktxDuration} kỳ`,
        amountKRW: ktxPrice * ktxDuration,
        amountVND: 0
      });
    }

    // Scholarship discount (shown as negative)
    if (includeScholarship && topikLevel >= 3) {
      const discounts: Record<number, number> = { 3: 30, 4: 50, 5: 70, 6: 100 };
      const discount = discounts[topikLevel] || 0;
      if (discount > 0 && visaData?.tuitionPerTerm) {
        const scholarshipAmount = Math.floor((visaData.tuitionPerTerm * discount) / 100);
        breakdown.push({
          category: 'Học bổng',
          item: `TOPIK ${topikLevel} - Giảm ${discount}%`,
          amountKRW: -scholarshipAmount,
          amountVND: 0,
          notes: 'Không vượt quá học phí'
        });
      }
    }

    return breakdown;
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const breakdown = generateCostBreakdown();
      
      // Convert all amounts
      const rows = breakdown.map(item => ({
        ...item,
        displayKRW: item.amountKRW > 0 ? `${item.amountKRW.toLocaleString()} KRW` : item.amountKRW < 0 ? `-${Math.abs(item.amountKRW).toLocaleString()} KRW` : '-',
        displayVND: item.amountVND > 0 ? formatFrom(item.amountVND, 'VND') : item.amountVND < 0 ? `-${formatFrom(Math.abs(item.amountVND), 'VND')}` : '-'
      }));

      // Calculate totals
      const totalKRW = breakdown.reduce((sum, item) => sum + item.amountKRW, 0);
      const totalVND = breakdown.reduce((sum, item) => sum + item.amountVND, 0);
      const totalVNDfromKRW = convertAmount(totalKRW, 'VND', 'KRW');
      const grandTotal = totalVND + totalVNDfromKRW;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(27, 63, 139); // #1B3F8B
      doc.text('SACMA - Báo Giá Chi Phí Du Học', 105, 20, { align: 'center' });
      
      // Subheader
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Trường: ${university.name}`, 14, 35);
      doc.text(`Hệ visa: ${visaSystem}`, 14, 42);
      doc.text(`TOPIK Level: ${topikLevel}`, 14, 49);
      doc.text(`Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`, 14, 56);

      // Table
      (doc as any).autoTable({
        startY: 65,
        head: [['Danh mục', 'Khoản mục', 'KRW', 'VNĐ', 'Ghi chú']],
        body: rows.map(r => [r.category, r.item, r.displayKRW, r.displayVND, r.notes || '']),
        headStyles: {
          fillColor: [27, 63, 139],
          textColor: 255,
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [240, 248, 255]
        },
        theme: 'grid'
      });

      // Summary section
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.setFontSize(11);
      doc.setTextColor(27, 63, 139);
      doc.text('TỔNG KẾT CHI PHÍ', 14, finalY);
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Tổng chi phí VNĐ: ${formatFrom(totalVND, 'VND')}`, 14, finalY + 10);
      doc.text(`Tổng chi phí KRW: ${totalKRW.toLocaleString()} KRW`, 14, finalY + 17);
      doc.text(`Quy đổi KRW → VNĐ: ${formatFrom(totalVNDfromKRW, 'VND')}`, 14, finalY + 24);
      
      doc.setFontSize(12);
      doc.setTextColor(220, 38, 38); // Red
      doc.text(`TỔNG CỘNG: ${formatFrom(grandTotal, 'VND')}`, 14, finalY + 35);

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Bản báo giá này có hiệu lực trong 30 ngày. Vui lòng liên hệ TBT GROUP để được tư vấn chi tiết.', 105, 280, { align: 'center' });
      doc.text('Hotline: 1900 1234 | Email: tuvan@tbt-group.vn | Website: duhoc.tbt-group.vn', 105, 285, { align: 'center' });

      // Save
      doc.save(`SACMA-BaoGia-${university.name}-${Date.now()}.pdf`);
    } finally {
      setIsGenerating(false);
      setShowPreview(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowPreview(true)}
        disabled={isGenerating}
        className={`flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 ${className}`}
      >
        <FileText className="w-4 h-4" />
        {isGenerating ? 'Đang tạo...' : 'Xuất PDF'}
      </button>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-red-600 to-red-800 text-white">
              <div className="flex items-center gap-3">
                <Printer className="w-5 h-5" />
                <h2 className="text-xl font-bold">Xuất báo giá PDF</h2>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Thông tin báo giá</h3>
                <p className="text-sm text-blue-700">Trường: <strong>{university.name}</strong></p>
                <p className="text-sm text-blue-700">Hệ visa: <strong>{visaSystem}</strong></p>
                <p className="text-sm text-blue-700">TOPIK: <strong>{topikLevel}</strong></p>
                {ktxType && (
                  <p className="text-sm text-blue-700">KTX: <strong>{ktxType} × {ktxDuration} kỳ</strong></p>
                )}
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-3">Chi phí bao gồm:</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Phí cố định (học tiếng, tư vấn, trung tâm, vé máy bay)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Phí theo hệ visa ({visaSystem})
                  </li>
                  {ktxType && (
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Chi phí KTX ({ktxType})
                    </li>
                  )}
                  {includeScholarship && topikLevel >= 3 && (
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Học bổng TOPIK {topikLevel}
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={generatePDF}
                  disabled={isGenerating}
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isGenerating ? 'Đang tạo PDF...' : 'Tải xuống PDF'}
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
