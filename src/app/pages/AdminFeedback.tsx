import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MessageSquare, Star, CheckCircle, XCircle, ThumbsUp, ThumbsDown, Filter } from 'lucide-react';
import { UniversityRating, ServiceFeedback } from '../../types';

const AdminFeedback: React.FC = () => {
  const { universityRatings, serviceFeedback, approveRating, resolveFeedback } = useApp();
  const [ratings, setRatings] = useState<UniversityRating[]>([]);
  const [feedback, setFeedback] = useState<ServiceFeedback[]>([]);
  const [activeTab, setActiveTab] = useState<'ratings' | 'feedback'>('ratings');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  useEffect(() => {
    setRatings(universityRatings);
    setFeedback(serviceFeedback);
  }, [universityRatings, serviceFeedback]);

  const filteredRatings = filter === 'all' ? ratings :
    filter === 'pending' ? ratings.filter(r => !r.isApproved) :
    ratings.filter(r => r.isApproved);

  const renderStars = (count: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= count ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Đánh giá & Phản hồi</h1>
        <p className="text-gray-600 mt-1">Quản lý đánh giá từ học sinh</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('ratings')}
          className={`flex items-center gap-2 px-4 py-2 rounded ${
            activeTab === 'ratings' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Star className="w-4 h-4" />
          Đánh giá trường ({ratings.length})
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex items-center gap-2 px-4 py-2 rounded ${
            activeTab === 'feedback' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Phản hồi dịch vụ ({feedback.length})
        </button>
      </div>

      {activeTab === 'ratings' && (
        <>
          <div className="flex gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              className="border rounded px-3 py-1"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
            </select>
          </div>
          <div className="space-y-4">
            {filteredRatings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Star className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">Chưa có đánh giá nào</p>
              </div>
            ) : (
              filteredRatings.map((rating) => (
                <div key={rating.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{rating.studentEmail}</span>
                        {!rating.isApproved ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">Chờ duyệt</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Đã duyệt</span>
                        )}
                      </div>
                      {renderStars(rating.overallRating || 0)}
                      <h3 className="font-semibold mt-2">{rating.reviewTitle}</h3>
                      <p className="text-gray-600 mt-1">{rating.reviewText}</p>
                      <div className="mt-3 flex gap-4 text-sm text-gray-500">
                        <span>Giảng dạy: {rating.teachingQuality}/5</span>
                        <span>Cơ sở vật chất: {rating.facilities}/5</span>
                        <span>Hỗ trợ: {rating.supportServices}/5</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!rating.isApproved && (
                        <button
                          onClick={() => approveRating(rating.id, 'admin')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="Duyệt"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-4">
          {feedback.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500">Chưa có phản hồi nào</p>
            </div>
          ) : (
            feedback.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{item.studentEmail}</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        item.isResolved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.isResolved ? 'Đã giải quyết' : 'Chưa giải quyết'}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded capitalize">
                        {item.feedbackType}
                      </span>
                    </div>
                    {item.rating && renderStars(item.rating)}
                    <p className="text-gray-600 mt-2">{item.feedbackText}</p>
                    {item.resolutionNotes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Ghi chú giải quyết:</span> {item.resolutionNotes}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!item.isResolved && (
                      <button
                        onClick={() => {
                          const notes = prompt('Nhập ghi chú giải quyết:');
                          if (notes !== null) {
                            resolveFeedback(item.id, 'admin', notes);
                          }
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Giải quyết"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
