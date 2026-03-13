import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import type { University } from '../context/AppContext';
import { topCsvParsers } from '../data/top-universities';

interface ImportUniversitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (universities: University[]) => void;
}

export default function ImportUniversitiesModal({ isOpen, onClose, onImport }: ImportUniversitiesModalProps) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [previewData, setPreviewData] = useState<University[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const detectTopTier = (file: string): 'Top1' | 'Top2' | 'Top3' => {
    if (/top\s*1/i.test(file)) return 'Top1';
    if (/top\s*3/i.test(file) || /hạn\s*chế|han\s*che/i.test(file)) return 'Top3';
    return 'Top2';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = reader.result as string;
          const tier = detectTopTier(file.name);
          const parsed = topCsvParsers.parseCsv(text, tier);
          setPreviewData(parsed);
          setStep('preview');
          setError(null);
        } catch (err) {
          console.error(err);
          setError('Không thể đọc file. Vui lòng kiểm tra định dạng CSV Top 1 / Top 2 / Top 3.');
        }
      };
      reader.readAsText(file, 'utf-8');
    }
  };

  const handleImport = () => {
    onImport(previewData);
    handleClose();
  };

  const handleClose = () => {
    setStep('upload');
    setPreviewData([]);
    setFileName('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-primary to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Import Top Lists</h2>
              <p className="text-sm text-white/80">CSV Top 1 / Top 2 / Top 3 (Hạn chế visa)</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {step === 'upload' ? (
            <div className="p-8">
              {/* Instructions */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Hướng dẫn CSV</h3>
                    <p className="text-sm text-blue-700 mb-2">
                      Hỗ trợ đúng 3 file CSV bạn cung cấp (cột: STT, TÊN TRƯỜNG, TÊN TIẾNG HÀN, KHU VỰC).
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside mb-3">
                      <li>Tự nhận diện hạng Top 1 / Top 2 / Top 3 qua tên file.</li>
                      <li>Tự động gắn tên tiếng Hàn và khu vực.</li>
                      <li>Chỉ nhập trường Hàn Quốc, bỏ qua quốc gia khác.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-primary hover:bg-blue-50/50 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {fileName || 'Click to upload or drag and drop'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    CSV Top 1 / Top 2 / Top 3
                  </p>
                </label>
              </div>

              {error && (
                <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Preview Header */}
              <div className="mb-2 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">
                    File xử lý thành công
                  </h3>
                  <p className="text-sm text-green-700">
                    {previewData.length} trường sẵn sàng import từ <strong>{fileName}</strong>
                  </p>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Tên trường</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Tên tiếng Hàn</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Hạng</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Khu vực</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((uni, index) => (
                        <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-900">{uni.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{uni.koreanName}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{uni.topTier || uni.koreanData?.topTier}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{uni.region || uni.koreanData?.address}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          
          {step === 'preview' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('upload')}
                className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Back to Upload
              </button>
              <button
                onClick={handleImport}
                className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Import {previewData.length} trường
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

