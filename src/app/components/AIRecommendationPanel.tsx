import React, { useState, useMemo } from 'react';
import { Sparkles, Target, TrendingUp, AlertCircle, CheckCircle2, Globe, GraduationCap, DollarSign, MapPin, ChevronRight, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getRecommendations, quickMatch, StudentProfile, RecommendationResult } from '../services/aiRecommendationService';
import { SUPPORTED_COUNTRIES, CountryConfig } from '../../constants/countries';

interface AIRecommendationPanelProps {
  studentGPA?: number;
  studentTOPIK?: number;
  studentBudget?: number;
  onSelectUniversity?: (uni: any) => void;
}

export default function AIRecommendationPanel({ 
  studentGPA = 3.0,
  studentTOPIK = 3,
  studentBudget = 500000000,
  onSelectUniversity 
}: AIRecommendationPanelProps) {
  const { universities } = useApp();
  const [selectedCountry, setSelectedCountry] = useState<string>('KR');
  const [showFilters, setShowFilters] = useState(false);
  const [gpa, setGpa] = useState(studentGPA);
  const [topik, setTopik] = useState(studentTOPIK);
  const [budget, setBudget] = useState(studentBudget);
  const [major, setMajor] = useState('Computer Science');

  const recommendations = useMemo(() => {
    const profile: StudentProfile = {
      academicInfo: {
        gpa,
        topikLevel: selectedCountry === 'KR' ? topik : undefined,
        major,
        degreeLevel: 'bachelor'
      },
      preferences: {
        budget: { min: 0, max: budget, currency: 'VND' },
        countries: [selectedCountry],
        cities: [],
        universityTier: 'any',
        campusPreference: 'any',
        scholarshipNeed: true,
        partTimeWork: true
      },
      constraints: {
        startDate: 'any',
        duration: 48
      }
    };

    return getRecommendations(profile, universities, 5);
  }, [universities, gpa, topik, budget, selectedCountry, major]);

  const quickMatchResult = useMemo(() => {
    return quickMatch(gpa, selectedCountry === 'KR' ? topik : undefined, budget, selectedCountry);
  }, [gpa, topik, budget, selectedCountry]);

  const selectedCountryInfo = SUPPORTED_COUNTRIES.find((c: CountryConfig) => c.code === selectedCountry);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">AI Gợi ý trường</h2>
            <p className="text-sm text-gray-500">Cá nhân hóa dựa trên hồ sơ của bạn</p>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        >
          <Filter className="w-4 h-4" />
          Tùy chỉnh
        </button>
      </div>

      {/* Quick Match Card */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 text-white">
        <div className="flex items-center gap-3 mb-3">
          <Target className="w-5 h-5" />
          <span className="font-semibold">Phân tích nhanh</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{quickMatchResult.tier}</p>
            <p className="text-xs text-white/80">Phù hợp</p>
          </div>
          <div className="h-10 w-px bg-white/30" />
          <div className="text-center">
            <p className="text-2xl font-bold">{quickMatchResult.confidence}</p>
            <p className="text-xs text-white/80">Độ tin cậy</p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-white/90">{quickMatchResult.advice}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          {/* Country Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quốc gia</label>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_COUNTRIES.map((country: CountryConfig) => (
                <button
                  key={country.code}
                  onClick={() => setSelectedCountry(country.code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedCountry === country.code
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{country.flag}</span>
                  <span>{country.nameVi}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
              <input
                type="number"
                min="0"
                max="4"
                step="0.1"
                value={gpa}
                onChange={(e) => setGpa(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {selectedCountry === 'KR' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TOPIK</label>
                <select
                  value={topik}
                  onChange={(e) => setTopik(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((level) => (
                    <option key={level} value={level}>TOPIK {level}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngân sách (VND)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Country Info Card */}
      {selectedCountryInfo && (
        <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
          <span className="text-2xl">{selectedCountryInfo.flag}</span>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{selectedCountryInfo.nameVi}</p>
            <p className="text-sm text-gray-600">
              Học phí TB: {selectedCountryInfo.currencySymbol}15,000 | 
              Chi phí sinh hoạt: ${selectedCountryInfo.avgLivingCost.accommodation}/tháng
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-blue-600">{selectedCountryInfo.visaTypes.length} loại visa</p>
            <p className="text-xs text-gray-500">{selectedCountryInfo.scholarships.government.length} học bổng</p>
          </div>
        </div>
      )}

      {/* Recommendations List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Top đề xuất ({recommendations.length} trường)
        </h3>

        {recommendations.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Chưa có đề xuất phù hợp</p>
            <p className="text-sm text-gray-400">Thử điều chỉnh tiêu chí tìm kiếm</p>
          </div>
        ) : (
          recommendations.map((rec: RecommendationResult, index: number) => (
            <RecommendationCard
              key={rec.university.id}
              rec={rec}
              index={index}
              onSelect={() => onSelectUniversity?.(rec.university)}
            />
          ))
        )}
      </div>

      {/* Multi-country CTA */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
        <div className="flex items-start gap-3">
          <Globe className="w-5 h-5 text-emerald-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-800">Mở rộng lựa chọn</p>
            <p className="text-sm text-emerald-700 mt-1">
              SACMA hiện hỗ trợ du học {SUPPORTED_COUNTRIES.length} quốc gia: 
              {SUPPORTED_COUNTRIES.map((c: CountryConfig) => ' ' + c.nameVi).join(', ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({ rec, index, onSelect }: { rec: RecommendationResult; index: number; onSelect: () => void; }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Rank */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
            index === 0 ? 'bg-yellow-100 text-yellow-700' :
            index === 1 ? 'bg-gray-100 text-gray-700' :
            index === 2 ? 'bg-orange-100 text-orange-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            #{index + 1}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900 truncate">{rec.university.name}</h4>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                {rec.university.country || rec.countryInfo.nameVi}
              </span>
            </div>
            
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                Hạng {rec.university.top_tier || rec.university.koreanData?.topTier || 'N/A'}
              </span>
              {rec.university.ranking && (
                <span>#{rec.university.ranking}</span>
              )}
            </div>

            {/* Match Score */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">Độ phù hợp</span>
                  <span className="font-semibold text-purple-600">{rec.matchScore}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                    style={{ width: `${rec.matchScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Reasons */}
            <div className="flex flex-wrap gap-1 mt-2">
              {rec.reasons.slice(0, 2).map((reason: string, i: number) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded">
                  <CheckCircle2 className="w-3 h-3" />
                  {reason}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className={`w-5 h-5 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Học thuật</p>
              <p className="font-semibold text-gray-900">{rec.breakdown.academic}/100</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Tài chính</p>
              <p className="font-semibold text-gray-900">{rec.breakdown.financial}/100</p>
            </div>
          </div>

          {rec.warnings.length > 0 && (
            <div className="mb-3 p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Lưu ý</p>
                  <ul className="mt-1 space-y-1">
                    {rec.warnings.map((w: string, i: number) => (
                      <li key={i} className="text-sm text-yellow-700">• {w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {rec.scholarshipEligibility.eligible && (
            <div className="mb-3 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Đủ điều kiện học bổng ~{rec.scholarshipEligibility.estimatedAmount.toLocaleString()} VND
                </span>
              </div>
            </div>
          )}

          <button
            onClick={onSelect}
            className="w-full py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Xem chi tiết trường
          </button>
        </div>
      )}
    </div>
  );
}
