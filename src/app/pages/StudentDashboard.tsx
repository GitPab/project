import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { searchTrackingCodesByEmail, getTrackingCode } from '../services/trackingCodeService';
import { getAllUniversities } from '../services/universityService';
import { uploadApi } from '../services/api';
import { toast } from 'sonner';
import type { TrackingCode } from '@/types/tracking';
import type { ProgressStage, StudentProgress } from '@/types';
import {
  LayoutDashboard, School, Wallet, TrendingUp, MessageSquare,
  User, GraduationCap, Search, MapPin, ArrowRight, Bell, FileText,
  CheckCircle2, Circle, Clock, AlertCircle, ChevronRight,
  Calendar, Upload, CheckCircle, Copy, Check, X, CalendarCheck, Loader2
} from 'lucide-react';

// Simple currency formatter
const formatFrom = (amount: number, currency: string) => {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
};

// Stage detail modal component
interface StageDetailModalProps {
  stageId: number;
  stageData: ProgressStage;
  onClose: () => void;
  onDocumentUpload: (stageId: number, fileName: string, url?: string) => void;
}

function StageDetailModal({ stageId, stageData, onClose, onDocumentUpload }: StageDetailModalProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>(
    (stageData as any).documents || []
  );
  const [uploading, setUploading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'in-progress':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'delayed':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File quá lớn', { description: 'Kích thước tối đa 5MB' });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Định dạng không hỗ trợ', { description: 'Chỉ chấp nhận ảnh và PDF' });
      return;
    }

    setUploading(true);
    try {
      const url = await uploadApi.uploadImage(file);
      setUploadedDocs([...uploadedDocs, file.name]);
      onDocumentUpload(stageId, file.name, url);
      toast.success(t('progress.documentUploaded'), {
        description: file.name,
      });
    } catch (error: any) {
      toast.error('Upload thất bại', { description: error.message || 'Vui lòng thử lại' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{t(`stage.${stageId}.title`)}</h3>
            <p className="text-sm text-slate-600 mt-1">{t(`stage.${stageId}.description`)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">{t('progress.status')}</label>
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor(stageData.status)}`}>
              {stageData.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
              {stageData.status === 'in-progress' && <Clock className="w-4 h-4" />}
              {stageData.status === 'delayed' && <AlertCircle className="w-4 h-4" />}
              {stageData.status === 'pending' && <Circle className="w-4 h-4" />}
              <span className="font-medium">
                {t(`progress.status${stageData.status.charAt(0).toUpperCase() + stageData.status.slice(1).replace('-', '')}`)}
              </span>
            </div>
          </div>

          {stageData.startDate && (
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">{t('progress.startDate')}</label>
              <div className="flex items-center gap-2 text-slate-900">
                <Calendar className="w-5 h-5 text-slate-500" />
                <span>{new Date(stageData.startDate).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {stageData.completedDate && (
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">{t('progress.completedDate')}</label>
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                <span>{new Date(stageData.completedDate).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">{t('progress.documents')}</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf"
              className="hidden"
            />
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-100 transition-colors text-blue-700 font-medium mb-3 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  {t('progress.uploadDocument')}
                </>
              )}
            </button>

            {uploadedDocs.length > 0 && (
              <div className="space-y-2">
                {uploadedDocs.map((doc, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{doc}</p>
                      <p className="text-xs text-slate-500">{t('progress.uploaded')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

const buildDefaultStages = (startDate?: string): ProgressStage[] => {
  const stages: ProgressStage[] = [];
  for (let i = 1; i <= 8; i++) {
    if (i === 1) {
      stages.push({ id: i, status: 'completed', completedDate: startDate });
    } else if (i === 2) {
      stages.push({ id: i, status: 'in-progress', startDate: startDate || new Date().toISOString() });
    } else {
      stages.push({ id: i, status: 'pending' });
    }
  }
  return stages;
};

const calculateOverallProgress = (stages: ProgressStage[]): number => {
  const totalStages = stages.length;
  const completedStages = stages.filter((stage) => stage.status === 'completed').length;
  return totalStages > 0 ? (completedStages / totalStages) * 100 : 0;
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const { universities, studentProgress, studentOnboardings, updateProgress, registrations } = useApp();
  const { t, language } = useLanguage();
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlTrackingCode = searchParams.get('code');

  const [selectedStage, setSelectedStage] = useState<{ id: number; data: ProgressStage } | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<TrackingCode | null>(null);
  const [copied, setCopied] = useState(false);
  const progressInitializedRef = useRef(false);

  const [allUniversities, setAllUniversities] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      // Load universities
      const unis = await getAllUniversities();
      setAllUniversities(unis);

      // Load tracking info
      if (urlTrackingCode) {
        const data = await getTrackingCode(urlTrackingCode);
        if (data) setTrackingInfo(data);
      } else if (user?.email) {
        const matches = await searchTrackingCodesByEmail(user.email);
        if (matches.length > 0) setTrackingInfo(matches[0]);
      }
    };

    loadData();
  }, [user, urlTrackingCode]);

  // Calculate progress
  const contextProgress = useMemo(() => {
    if (!user) return null;
    return studentProgress.find((p) => p.studentEmail === user.email) || null;
  }, [studentProgress, user]);

  const latestOnboarding = useMemo(() => {
    if (!user) return null;
    const matches = studentOnboardings.filter((ob) => ob.email === user.email);
    if (matches.length === 0) return null;
    return matches.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))[0];
  }, [studentOnboardings, user]);

  const derivedProgress: StudentProgress | null = useMemo(() => {
    if (contextProgress) return contextProgress;

    const universityId = trackingInfo?.desiredUniversityId || latestOnboarding?.desiredUniversity;
    if (!universityId) return null;

    const email = user?.email || trackingInfo?.studentEmail || '';
    const startDate = latestOnboarding?.submittedAt || trackingInfo?.createdAt;
    const stages = buildDefaultStages(startDate);

    return {
      studentEmail: email,
      universityId,
      stages,
      overallProgress: calculateOverallProgress(stages),
    };
  }, [contextProgress, trackingInfo, latestOnboarding, user]);

  useEffect(() => {
    if (contextProgress || !derivedProgress || !derivedProgress.studentEmail || progressInitializedRef.current) return;
    progressInitializedRef.current = true;
    updateProgress(derivedProgress.studentEmail, derivedProgress.universityId, derivedProgress.stages);
  }, [contextProgress, derivedProgress, updateProgress]);

  const userProgress = derivedProgress;

  // Notifications
  useEffect(() => {
    if (!userProgress) return;
    const completedStages = userProgress.stages.filter((s) => s.status === 'completed');
    if (completedStages.length > 0 && notifications.length === 0) {
      const latestCompleted = completedStages[completedStages.length - 1];
      setNotifications([
        `${t(`stage.${latestCompleted.id}.title`)} - ${t('progress.statusCompleted')}!`,
      ]);
    }
  }, [userProgress, notifications.length, t]);

  const handleDocumentUpload = (stageId: number, fileName: string, url?: string) => {
    const newNotification = `${t('progress.documentUploaded')}: ${t(`stage.${stageId}.title`)}`;
    setNotifications([newNotification, ...notifications]);
  };

  const handleCopyCode = () => {
    if (trackingInfo?.code) {
      navigator.clipboard.writeText(trackingInfo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Stats data
  const myRegistrations = registrations.filter((r) => r.studentEmail === user?.email);
  const studentProfile = {
    name: trackingInfo?.studentName || user?.name || 'Học viên',
    email: trackingInfo?.studentEmail || user?.email || 'Chưa có email',
    phone: trackingInfo?.studentPhone || 'Chưa có SĐT',
    university: trackingInfo?.desiredUniversityName || 'Chưa chọn trường',
    program: `Du học ${trackingInfo?.visaSystem || 'D4-1'}`,
    startDate: trackingInfo?.createdAt ? new Date(trackingInfo.createdAt).toLocaleDateString('vi-VN') : '-',
    totalCost: formatFrom(trackingInfo?.initialTotalCostVnd || 0, 'VND'),
    progress: userProgress?.overallProgress || 0,
    trackingCode: trackingInfo?.code || ''
  };

  const filteredUniversities = allUniversities.filter(uni =>
    uni.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    uni.country?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 4);

  // Stage helpers
  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'in-progress':
        return <Clock className="w-6 h-6 text-blue-600 animate-pulse" />;
      case 'delayed':
        return <AlertCircle className="w-6 h-6 text-orange-600" />;
      default:
        return <Circle className="w-6 h-6 text-slate-300" />;
    }
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'in-progress':
        return 'border-blue-500 bg-blue-50';
      case 'delayed':
        return 'border-orange-500 bg-orange-50';
      default:
        return 'border-slate-200 bg-white';
    }
  };

  const calculateEstimatedCompletion = () => {
    if (!userProgress) return null;
    const completedStages = userProgress.stages.filter((s) => s.status === 'completed').length;
    const remainingStages = 8 - completedStages;
    const daysToCompletion = remainingStages * 30;
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysToCompletion);
    return estimatedDate;
  };

  const currentStageIndex = userProgress?.stages.findIndex((s) => s.status === 'in-progress') ?? -1;
  const currentStage = currentStageIndex >= 0 ? userProgress?.stages[currentStageIndex] : null;
  const estimatedCompletion = calculateEstimatedCompletion();
  const university = universities.find((u) => u.id === userProgress?.universityId);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Xin chào, {studentProfile.name}
          </h1>
          <p className="text-slate-600">Cổng thông tin học viên Du Học Cost</p>
          {trackingInfo?.code && (
            <p className="text-xs text-slate-500 mt-1">Mã theo dõi: {trackingInfo.code}</p>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-3 bg-white border-2 border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Bell className="w-6 h-6 text-slate-700" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && notifications.length > 0 && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
              <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900">{t('progress.notifications')}</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {notifications.map((notif, index) => (
                    <div key={index} className="p-4 hover:bg-slate-50">
                      <p className="text-sm text-slate-700">{notif}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <School className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Trường đã đăng ký</div>
            <div className="text-xl font-bold text-slate-900">{myRegistrations.length}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-3">
          <div className="p-3 bg-amber-100 rounded-lg">
            <Wallet className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Tổng chi phí</div>
            <div className="text-lg font-bold text-slate-900">{studentProfile.totalCost}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Tiến độ</div>
            <div className="text-xl font-bold text-green-600">{studentProfile.progress.toFixed(0)}%</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Trạng thái</div>
            <div className={`text-xs font-semibold px-2 py-1 rounded-full inline-block ${
              userProgress?.stages.some(s => s.status === 'in-progress')
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {userProgress?.stages.some(s => s.status === 'in-progress') ? 'Đang xử lý' : 'Hoàn thành'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column - Progress Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overall Progress Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Tiến trình tổng quan
              </h2>
              <span className="text-2xl font-bold text-blue-600">{studentProfile.progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${studentProfile.progress}%` }}
              />
            </div>
            {currentStage && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Giai đoạn hiện tại: <strong>{t(`stage.${currentStage.id}.title`)}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Stage Timeline - Desktop */}
          {userProgress && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hidden lg:block">
              <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Các giai đoạn xử lý
              </h2>

              <div className="relative">
                <div className="absolute top-14 left-0 right-0 h-1 bg-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
                    style={{
                      width: `${(userProgress.stages.filter((s) => s.status === 'completed').length / userProgress.stages.length) * 100}%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-8 gap-2">
                  {userProgress.stages.map((stage) => (
                    <div key={stage.id} className="relative">
                      <button
                        onClick={() => setSelectedStage({ id: stage.id, data: stage })}
                        className={`w-full border-2 rounded-xl p-3 transition-all hover:shadow-lg ${getStageColor(stage.status)}`}
                      >
                        <div className="flex justify-center mb-2">{getStageIcon(stage.status)}</div>
                        <div className="text-center mb-1">
                          <span className="text-xs font-semibold text-slate-600">{stage.id}</span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 text-center mb-1 line-clamp-2">
                          {t(`stage.${stage.id}.title`)}
                        </h3>
                        <div
                          className={`text-xs px-2 py-0.5 rounded-full text-center ${
                            stage.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : stage.status === 'in-progress'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {stage.status === 'completed' ? 'Xong' : stage.status === 'in-progress' ? 'Đang' : 'Chờ'}
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stage Timeline - Mobile */}
          {userProgress && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:hidden">
              <h2 className="font-bold text-slate-900 mb-4">Các giai đoạn</h2>
              <div className="space-y-3">
                {userProgress.stages.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => setSelectedStage({ id: stage.id, data: stage })}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${getStageColor(stage.status)}`}
                  >
                    {getStageIcon(stage.status)}
                    <div className="flex-1 text-left">
                      <div className="font-medium text-slate-900">{t(`stage.${stage.id}.title`)}</div>
                      <div className="text-xs text-slate-500">{t(`stage.${stage.id}.description`)}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Universities Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <School className="w-5 h-5 text-blue-600" />
                Khám phá trường đại học
              </h2>
              <button
                onClick={() => navigate('/student/universities')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Xem tất cả →
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm trường..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {filteredUniversities.map((uni) => (
                <div
                  key={uni.id}
                  onClick={() => navigate(`/student/university/${uni.id}`)}
                  className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                    {uni.thumbnail ? (
                      <img src={uni.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <School className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">{uni.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {uni.country || 'Hàn Quốc'}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Student Info */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-bold text-slate-900 mb-4">Thông tin của tôi</h2>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <div className="font-bold text-slate-900">{studentProfile.name}</div>
                <div className="text-sm text-slate-500">{studentProfile.program}</div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Email</span>
                <span className="font-medium text-slate-900">{studentProfile.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Số điện thoại</span>
                <span className="font-medium text-slate-900">{studentProfile.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Trường đăng ký</span>
                <span className="font-medium text-slate-900 text-right">{studentProfile.university}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Ngày bắt đầu</span>
                <span className="font-medium text-slate-900">{studentProfile.startDate}</span>
              </div>
            </div>

            {trackingInfo && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Mã theo dõi</span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 text-sm font-mono font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {trackingInfo.code}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-bold text-slate-900 mb-4">Truy cập nhanh</h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/student/universities')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <School className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-slate-700">Danh sách trường</span>
              </button>
              <button
                onClick={() => navigate('/student/my-costs')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <Wallet className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-slate-700">Chi phí của tôi</span>
              </button>
              <button
                onClick={() => navigate('/student/my-progress')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="font-medium text-slate-700">Tiến trình chi tiết</span>
              </button>
              <button
                onClick={() => navigate('/student/feedback')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-slate-700">Đánh giá & Phản hồi</span>
              </button>
            </div>
          </div>

          {/* Registration Info Card */}
          {trackingInfo && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h2 className="font-bold text-green-900">Thông tin đăng ký</h2>
              </div>
              <p className="text-sm text-green-700 mb-4">
                Đăng ký tư vấn thành công
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Trường</span>
                  <span className="font-medium text-green-900">{trackingInfo.desiredUniversityName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Visa</span>
                  <span className="font-medium text-green-900">{trackingInfo.visaSystem}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Chi phí</span>
                  <span className="font-bold text-green-900">{format(trackingInfo.initialTotalCostVnd)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Estimated Completion */}
          {estimatedCompletion && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <div className="flex items-center gap-2 mb-2">
                <CalendarCheck className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-blue-900">Dự kiến hoàn thành</h2>
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {estimatedCompletion.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Còn khoảng {Math.ceil((estimatedCompletion.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} ngày
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stage Detail Modal */}
      {selectedStage && (
        <StageDetailModal
          stageId={selectedStage.id}
          stageData={selectedStage.data}
          onClose={() => setSelectedStage(null)}
          onDocumentUpload={handleDocumentUpload}
        />
      )}
    </div>
  );
}
