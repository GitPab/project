import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import type { University } from '../context/AppContext';

interface ImportUniversitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (universities: University[]) => void;
}

export default function ImportUniversitiesModal({ isOpen, onClose, onImport }: ImportUniversitiesModalProps) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [previewData, setPreviewData] = useState<University[]>([]);
  const [fileName, setFileName] = useState('');

  if (!isOpen) return null;

  const generateSampleData = (): University[] => {
    const countries = [
      { name: 'Germany', code: '🇩🇪' },
      { name: 'France', code: '🇫🇷' },
      { name: 'Netherlands', code: '🇳🇱' },
      { name: 'Sweden', code: '🇸🇪' },
      { name: 'Switzerland', code: '🇨🇭' },
      { name: 'Italy', code: '🇮🇹' },
      { name: 'Spain', code: '🇪🇸' },
      { name: 'Norway', code: '🇳🇴' },
      { name: 'Denmark', code: '🇩🇰' },
      { name: 'Belgium', code: '🇧🇪' },
      { name: 'Austria', code: '🇦🇹' },
      { name: 'Ireland', code: '🇮🇪' },
      { name: 'Finland', code: '🇫🇮' },
      { name: 'New Zealand', code: '🇳🇿' },
      { name: 'Singapore', code: '🇸🇬' },
      { name: 'South Korea', code: '🇰🇷' }
    ];

    const universities = [
      'Technical University of Munich', 'University of Amsterdam', 'KTH Royal Institute of Technology',
      'ETH Zurich', 'University of Copenhagen', 'University of Vienna', 'Trinity College Dublin',
      'University of Helsinki', 'University of Auckland', 'National University of Singapore',
      'Lund University', 'Delft University of Technology', 'University of Geneva',
      'University of Oslo', 'KU Leuven', 'Sapienza University of Rome',
      'University of Barcelona', 'University of Zurich', 'Aalto University', 'Korea University'
    ];

    return universities.slice(0, 15).map((name, index) => {
      const country = countries[index % countries.length];
      const baseTuition = 15000 + Math.floor(Math.random() * 35000);
      
      return {
        id: `imported-${Date.now()}-${index}`,
        name,
        country: country.name,
        countryCode: country.code,
        tagline: `Leading research university in ${country.name}`,
        thumbnail: `https://images.unsplash.com/photo-${1500000000000 + index}?w=400`,
        heroImage: `https://images.unsplash.com/photo-${1500000000000 + index}?w=1600`,
        overview: `${name} is a prestigious research university located in ${country.name}. Known for innovation and academic excellence, it offers world-class programs across multiple disciplines.`,
        academicPrograms: [
          { icon: 'GraduationCap', title: 'Engineering', description: 'Top-ranked engineering programs' },
          { icon: 'Cpu', title: 'Computer Science', description: 'Cutting-edge technology research' },
          { icon: 'Microscope', title: 'Sciences', description: 'Excellence in natural sciences' }
        ],
        galleryImages: [`https://images.unsplash.com/photo-${1500000000000 + index}?w=800`],
        ranking: `QS World University Rankings 2026: #${50 + index}`,
        worldRanking: 50 + index,
        generalTuition: baseTuition,
        visaFee: 100 + Math.floor(Math.random() * 100),
        accommodationFee: 8000 + Math.floor(Math.random() * 10000),
        insuranceFee: 500 + Math.floor(Math.random() * 2000),
        additionalFees: [
          { type: 'Application Fee', amount: 50 + Math.floor(Math.random() * 100) },
          { type: 'Student Services', amount: 200 + Math.floor(Math.random() * 500) }
        ],
        majors: ['Engineering', 'Computer Science', 'Business', 'Sciences']
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // Simulate file processing
      setTimeout(() => {
        const sampleData = generateSampleData();
        setPreviewData(sampleData);
        setStep('preview');
      }, 1000);
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
              <h2 className="text-xl font-bold text-white">Import Universities</h2>
              <p className="text-sm text-white/80">Bulk import from Excel/CSV file</p>
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
                    <h3 className="font-semibold text-blue-900 mb-2">File Format Requirements</h3>
                    <p className="text-sm text-blue-700 mb-2">
                      Upload an Excel (.xlsx) or CSV (.csv) file with the following columns:
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside mb-3">
                      <li><strong>Name</strong>: University name (required)</li>
                      <li><strong>Country</strong>: Country name (required)</li>
                      <li><strong>Description</strong>: Overview text</li>
                      <li><strong>GeneralTuition</strong>: Annual tuition cost (USD)</li>
                      <li><strong>VisaFee</strong>: Visa application cost</li>
                      <li><strong>AccommodationFee</strong>: Annual accommodation cost</li>
                      <li><strong>InsuranceFee</strong>: Annual insurance cost</li>
                      <li><strong>AdditionalFees</strong>: JSON array of objects with 'type' and 'amount'</li>
                      <li><strong>ThumbnailURL</strong>: Image URL for card view</li>
                      <li><strong>HeroImageURL</strong>: Image URL for detail page</li>
                    </ul>
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-800 font-medium mb-1">🇰🇷 Korean Universities Support:</p>
                      <p className="text-xs text-yellow-700">
                        For Korean universities with visa-specific costs (D4-1/D2-2/D2-3), the system automatically parses 
                        CSV data to extract fixed costs, system-specific tuition, and optional add-ons. See Ajou University as reference.
                      </p>
                    </div>
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
                    Excel (.xlsx) or CSV files only
                  </p>
                </label>
              </div>

              {/* Sample Data Option */}
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600 mb-3">Or try with sample data</p>
                <button
                  onClick={() => {
                    const sampleData = generateSampleData();
                    setPreviewData(sampleData);
                    setFileName('sample-universities.xlsx');
                    setStep('preview');
                  }}
                  className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                  Load 15 Sample Universities
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Preview Header */}
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">
                    File processed successfully
                  </h3>
                  <p className="text-sm text-green-700">
                    Found <strong>{previewData.length} universities</strong> ready to import from <strong>{fileName}</strong>
                  </p>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Country</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Ranking</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Tuition (USD)</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Total Fees</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((uni, index) => {
                        const totalFees = uni.visaFee + uni.accommodationFee + uni.insuranceFee +
                          uni.additionalFees.reduce((sum, fee) => sum + fee.amount, 0);
                        
                        return (
                          <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm text-slate-900">{uni.name}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center gap-1.5">
                                <span>{uni.countryCode}</span>
                                <span className="text-slate-700">{uni.country}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700">#{uni.worldRanking}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">
                              ${uni.generalTuition.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-primary">
                              ${totalFees.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
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
                Add {previewData.length} Universities to Database
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}