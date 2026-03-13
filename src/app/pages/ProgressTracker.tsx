import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  GraduationCap,
  User,
  TrendingUp,
  Calendar,
  X,
  ChevronRight,
  Upload,
  Bell,
  CalendarCheck,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { getTrackingCode, searchTrackingCodesByEmail } from '../services/trackingCodeService';
import type { TrackingCode } from '@/types/tracking';
import type { ProgressStage, StudentProgress } from '@/types';

interface StageDetailModalProps {
  stageId: number;
  stageData: ProgressStage;
  onClose: () => void;
  onDocumentUpload: (stageId: number, fileName: string) => void;
}

function StageDetailModal({ stageId, stageData, onClose, onDocumentUpload }: StageDetailModalProps) {
  const { t } = useLanguage();
  const [uploadedDocs, setUploadedDocs] = useState<string[]>(
    (stageData as any).documents || []
  );

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

  const handleFileUpload = () => {
    const mockFileName = `Stage_${stageId}_Document_${Date.now()}.pdf`;
    setUploadedDocs([...uploadedDocs, mockFileName]);
    onDocumentUpload(stageId, mockFileName);
    toast.success(t('progress.documentUploaded'), {
      description: mockFileName,
    });
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

          {stageData.notes && (
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">{t('progress.notes')}</label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-slate-700">{stageData.notes}</p>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">{t('progress.documents')}</label>
            <button
              onClick={handleFileUpload}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-100 transition-colors text-blue-700 font-medium mb-3"
            >
              <Upload className="w-5 h-5" />
              {t('progress.uploadDocument')}
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

export default function ProgressTracker() {
  const { user, universities, studentProgress, studentOnboardings, updateProgress } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState<{ id: number; data: ProgressStage } | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<TrackingCode | null>(null);

  useEffect(() => {
    const loadTracking = async () => {
      if (!user) return;

      if (user.trackingCode) {
        const data = await getTrackingCode(user.trackingCode);
        if (data) {
          setTrackingInfo(data);
          return;
        }
      }

      if (user.email) {
        const matches = await searchTrackingCodesByEmail(user.email);
        if (matches.length > 0) setTrackingInfo(matches[0]);
      }
    };

    loadTracking();
  }, [user]);

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
    if (contextProgress || !derivedProgress || !derivedProgress.studentEmail) return;
    updateProgress(derivedProgress.studentEmail, derivedProgress.universityId, derivedProgress.stages);
  }, [contextProgress, derivedProgress, updateProgress]);

  const userProgress = derivedProgress;

  const calculateEstimatedCompletion = () => {
    if (!userProgress) return null;

    const completedStages = userProgress.stages.filter((s) => s.status === 'completed').length;
    const totalStages = userProgress.stages.length;
    const remainingStages = totalStages - completedStages;
    const daysToCompletion = remainingStages * 30;
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysToCompletion);

    return estimatedDate;
  };

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

  const handleDocumentUpload = (stageId: number, fileName: string) => {
    const newNotification = `${t('progress.documentUploaded')}: ${t(`stage.${stageId}.title`)}`;
    setNotifications([newNotification, ...notifications]);
  };

  if (!userProgress) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('progress.title')}</h1>
          <p className="text-slate-600">{t('progress.subtitle')}</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('progress.noProgress')}</h3>
          <p className="text-slate-600 mb-6">{t('progress.noProgressDesc')}</p>
          <button
            onClick={() => navigate('/student/universities')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
          >
            <GraduationCap className="w-5 h-5" />
            {t('common.universities')}
          </button>
        </div>
      </div>
    );
  }

  const university = universities.find((u) => u.id === userProgress.universityId);
  const currentStageIndex = userProgress.stages.findIndex((s) => s.status === 'in-progress');
  const currentStage = currentStageIndex >= 0 ? userProgress.stages[currentStageIndex] : null;
  const estimatedCompletion = calculateEstimatedCompletion();

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

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('progress.title')}</h1>
          <p className="text-slate-600">{t('progress.subtitle')}</p>
          {trackingInfo?.code && (
            <p className="text-xs text-slate-500 mt-1">Tracking: {trackingInfo.code}</p>
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

      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 md:p-8 mb-8 text-white shadow-lg">
        <div className="grid md:grid-cols-4 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">{t('progress.studentName')}</p>
              <p className="text-xl font-bold">{user?.name || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">{t('progress.targetUniversity')}</p>
              <p className="text-lg font-bold">{university?.name || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-blue-100 text-sm font-medium mb-1">{t('progress.overallProgress')}</p>
              <p className="text-3xl font-bold">{userProgress.overallProgress.toFixed(0)}%</p>
              <div className="mt-2 w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${userProgress.overallProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">{t('progress.estimatedCompletion')}</p>
              <p className="text-lg font-bold">
                {estimatedCompletion?.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {currentStage && (
          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-blue-100 text-sm font-medium mb-2">{t('progress.currentStage')}</p>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5" />
              <span className="text-lg font-semibold">{t(`stage.${currentStage.id}.title`)}</span>
              <ChevronRight className="w-5 h-5" />
              <span className="text-blue-100">{t(`stage.${currentStage.id}.description`)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          {t('progress.timeline')}
        </h2>

        <div className="hidden lg:block">
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
                    className={`w-full border-2 rounded-xl p-4 transition-all hover:shadow-lg ${getStageColor(stage.status)}`}
                  >
                    <div className="flex justify-center mb-3">{getStageIcon(stage.status)}</div>
                    <div className="text-center mb-2">
                      <span className="text-xs font-semibold text-slate-600">{t('progress.stage')} {stage.id}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 text-center mb-2 line-clamp-2">
                      {t(`stage.${stage.id}.title`)}
                    </h3>
                    <div
                      className={`text-xs px-2 py-1 rounded-full text-center ${
                        stage.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : stage.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-700'
                          : stage.status === 'delayed'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t(`progress.status${stage.status.charAt(0).toUpperCase() + stage.status.slice(1).replace('-', '')}`)}
                    </div>
                    {(stage.completedDate || stage.startDate) && (
                      <p className="text-xs text-slate-500 mt-2 text-center">
                        {new Date(stage.completedDate || stage.startDate || '').toLocaleDateString()}
                      </p>
                    )}
                    {(stage.status === 'in-progress' || stage.status === 'completed') && (
                      <div className="mt-2 flex justify-center">
                        <Upload className="w-4 h-4 text-blue-500" />
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:hidden space-y-4">
          {userProgress.stages.map((stage, index) => (
            <button
              key={stage.id}
              onClick={() => setSelectedStage({ id: stage.id, data: stage })}
              className={`relative w-full border-2 rounded-xl p-4 transition-all hover:shadow-lg ${getStageColor(stage.status)}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  {getStageIcon(stage.status)}
                  {index < userProgress.stages.length - 1 && (
                    <div
                      className={`w-0.5 h-12 mt-2 ${
                        stage.status === 'completed' ? 'bg-green-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>

                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600">{t('progress.stage')} {stage.id}</span>
                    <div
                      className={`text-xs px-2 py-1 rounded-full ${
                        stage.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : stage.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-700'
                          : stage.status === 'delayed'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t(`progress.status${stage.status.charAt(0).toUpperCase() + stage.status.slice(1).replace('-', '')}`)}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {t(`stage.${stage.id}.title`)}
                  </h3>

                  <p className="text-sm text-slate-600 mb-2">
                    {t(`stage.${stage.id}.description`)}
                  </p>

                  <div className="flex items-center justify-between">
                    {(stage.completedDate || stage.startDate) && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(stage.completedDate || stage.startDate || '').toLocaleDateString()}
                      </p>
                    )}

                    {(stage.status === 'in-progress' || stage.status === 'completed') && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Upload className="w-3 h-3" />
                        <span>{t('progress.upload')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-sm font-semibold text-slate-700 mb-3">{t('progress.legend')}:</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm text-slate-700">{t('progress.statusCompleted')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-slate-700">{t('progress.statusInProgress')}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-slate-700">{t('progress.statusDelayed')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="w-5 h-5 text-slate-300" />
              <span className="text-sm text-slate-700">{t('progress.statusPending')}</span>
            </div>
          </div>
        </div>
      </div>

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

