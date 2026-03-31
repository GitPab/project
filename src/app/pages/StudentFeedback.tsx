import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Star, MessageSquare, Send, CheckCircle, AlertCircle, Building2, HeadphonesIcon } from 'lucide-react';
import { toast } from 'sonner';
import { FeatureAPI } from '../services/featureApi';
import type { StudentApplication } from '@/types/university';

export default function StudentFeedback() {
  const { user, studentApplications, universities } = useApp();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'university' | 'service'>('university');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // University rating form
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [universityRating, setUniversityRating] = useState({
    overallRating: 5,
    teachingQuality: 5,
    facilities: 5,
    supportServices: 5,
    valueForMoney: 5,
    reviewTitle: '',
    reviewText: ''
  });
  
  // Service feedback form
  const [serviceFeedback, setServiceFeedback] = useState({
    feedbackType: 'general' as 'general' | 'complaint' | 'suggestion' | 'praise',
    rating: 5,
    feedbackText: ''
  });

  const myApplications = studentApplications.filter(
    app => app.studentEmail === user?.email
  );

  const t = {
    vi: {
      title: 'Đánh giá & Phản hồi',
      subtitle: 'Chia sẻ trải nghiệm của bạn',
      universityTab: 'Đánh giá trường',
      serviceTab: 'Phản hồi dịch vụ',
      selectUniversity: 'Chọn trường đã đăng ký',
      overallRating: 'Đánh giá tổng thể',
      teachingQuality: 'Chất lượng giảng dạy',
      facilities: 'Cơ sở vật chất',
      supportServices: 'Dịch vụ hỗ trợ',
      valueForMoney: 'Giá trị chi phí',
      reviewTitle: 'Tiêu đề đánh giá',
      reviewText: 'Nội dung đánh giá',
      feedbackType: 'Loại phản hồi',
      general: 'Chung',
      complaint: 'Khiếu nại',
      suggestion: 'Góp ý',
      praise: 'Khen ngợi',
      serviceRating: 'Đánh giá dịch vụ',
      feedbackText: 'Nội dung phản hồi',
      submit: 'Gửi',
      submitting: 'Đang gửi...',
      successUniversity: 'Đánh giá trường đã được gửi!',
      successService: 'Phản hồi dịch vụ đã được gửi!',
      error: 'Có lỗi xảy ra, vui lòng thử lại',
      noApplications: 'Bạn chưa có đơn đăng ký nào để đánh giá'
    },
    en: {
      title: 'Feedback & Reviews',
      subtitle: 'Share your experience',
      universityTab: 'University Rating',
      serviceTab: 'Service Feedback',
      selectUniversity: 'Select registered university',
      overallRating: 'Overall Rating',
      teachingQuality: 'Teaching Quality',
      facilities: 'Facilities',
      supportServices: 'Support Services',
      valueForMoney: 'Value for Money',
      reviewTitle: 'Review Title',
      reviewText: 'Review Content',
      feedbackType: 'Feedback Type',
      general: 'General',
      complaint: 'Complaint',
      suggestion: 'Suggestion',
      praise: 'Praise',
      serviceRating: 'Service Rating',
      feedbackText: 'Feedback Content',
      submit: 'Submit',
      submitting: 'Submitting...',
      successUniversity: 'University rating submitted!',
      successService: 'Service feedback submitted!',
      error: 'An error occurred, please try again',
      noApplications: 'You have no applications to review'
    }
  }[language === 'vi' ? 'vi' : 'en'];

  const handleUniversitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUniversity || !user?.email) return;
    
    setIsSubmitting(true);
    try {
      await FeatureAPI.UniversityRatings.create({
        university_id: selectedUniversity,
        overall_rating: universityRating.overallRating,
        teaching_quality: universityRating.teachingQuality,
        facilities: universityRating.facilities,
        support_services: universityRating.supportServices,
        value_for_money: universityRating.valueForMoney,
        review_title: universityRating.reviewTitle,
        review_text: universityRating.reviewText
      });
      toast.success(t.successUniversity);
      setUniversityRating({
        overallRating: 5, teachingQuality: 5, facilities: 5,
        supportServices: 5, valueForMoney: 5, reviewTitle: '', reviewText: ''
      });
      setSelectedUniversity('');
    } catch (error) {
      toast.error(t.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    
    setIsSubmitting(true);
    try {
      await FeatureAPI.ServiceFeedback.create({
        feedback_type: serviceFeedback.feedbackType,
        rating: serviceFeedback.rating,
        feedback_text: serviceFeedback.feedbackText
      });
      toast.success(t.successService);
      setServiceFeedback({ feedbackType: 'general', rating: 5, feedbackText: '' });
    } catch (error) {
      toast.error(t.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-1 transition-colors ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            <Star className="w-6 h-6 fill-current" />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="text-gray-600 mt-1">{t.subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('university')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'university'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Building2 className="w-5 h-5" />
          {t.universityTab}
        </button>
        <button
          onClick={() => setActiveTab('service')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'service'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <HeadphonesIcon className="w-5 h-5" />
          {t.serviceTab}
        </button>
      </div>

      {activeTab === 'university' ? (
        <div className="bg-white rounded-lg shadow p-6">
          {myApplications.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t.noApplications}</p>
            </div>
          ) : (
            <form onSubmit={handleUniversitySubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.selectUniversity} *
                </label>
                <select
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">-- Chọn trường --</option>
                  {myApplications.map((app) => (
                    <option key={app.id} value={app.universityId}>
                      {app.universityName || universities.find(u => u.id === app.universityId)?.name || app.universityId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StarRating
                  label={t.overallRating}
                  value={universityRating.overallRating}
                  onChange={(v) => setUniversityRating({ ...universityRating, overallRating: v })}
                />
                <StarRating
                  label={t.teachingQuality}
                  value={universityRating.teachingQuality}
                  onChange={(v) => setUniversityRating({ ...universityRating, teachingQuality: v })}
                />
                <StarRating
                  label={t.facilities}
                  value={universityRating.facilities}
                  onChange={(v) => setUniversityRating({ ...universityRating, facilities: v })}
                />
                <StarRating
                  label={t.supportServices}
                  value={universityRating.supportServices}
                  onChange={(v) => setUniversityRating({ ...universityRating, supportServices: v })}
                />
                <StarRating
                  label={t.valueForMoney}
                  value={universityRating.valueForMoney}
                  onChange={(v) => setUniversityRating({ ...universityRating, valueForMoney: v })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.reviewTitle}
                </label>
                <input
                  type="text"
                  value={universityRating.reviewTitle}
                  onChange={(e) => setUniversityRating({ ...universityRating, reviewTitle: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Tiêu đề ngắn gọn về trải nghiệm của bạn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.reviewText}
                </label>
                <textarea
                  value={universityRating.reviewText}
                  onChange={(e) => setUniversityRating({ ...universityRating, reviewText: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={4}
                  placeholder="Chia sẻ chi tiết về trải nghiệm của bạn tại trường..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !selectedUniversity}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><Send className="w-4 h-4 animate-pulse" /> {t.submitting}</>
                ) : (
                  <><Send className="w-4 h-4" /> {t.submit}</>
                )}
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleServiceSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.feedbackType}
              </label>
              <div className="flex flex-wrap gap-2">
                {(['general', 'complaint', 'suggestion', 'praise'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setServiceFeedback({ ...serviceFeedback, feedbackType: type })}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      serviceFeedback.feedbackType === type
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {t[type]}
                  </button>
                ))}
              </div>
            </div>

            <StarRating
              label={t.serviceRating}
              value={serviceFeedback.rating}
              onChange={(v) => setServiceFeedback({ ...serviceFeedback, rating: v })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.feedbackText} *
              </label>
              <textarea
                value={serviceFeedback.feedbackText}
                onChange={(e) => setServiceFeedback({ ...serviceFeedback, feedbackText: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                rows={6}
                required
                placeholder="Mô tả chi tiết phản hồi của bạn..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !serviceFeedback.feedbackText.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <><Send className="w-4 h-4 animate-pulse" /> {t.submitting}</>
              ) : (
                <><Send className="w-4 h-4" /> {t.submit}</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Info box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Lưu ý</p>
            <p className="text-sm text-blue-700 mt-1">
              Phản hồi của bạn sẽ được gửi đến ban quản trị và xem xét trong vòng 24-48 giờ. 
              Đánh giá trường sẽ được hiển thị công khai sau khi được phê duyệt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
