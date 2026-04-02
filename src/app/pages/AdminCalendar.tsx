import React, { useState, useEffect } from 'react';
import { appointmentApi } from '../services/api';
import { Calendar, Plus, Trash2, Edit2, Clock, Video, MapPin, CheckCircle, XCircle, X, Save, Loader2, AlertCircle } from 'lucide-react';
import { Appointment } from '../../types';

const AdminCalendar: React.FC = () => {
  const [events, setEvents] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch appointments from API
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await appointmentApi.getAll();
        const data = response.data?.data || response.data || [];
        setEvents(data);
      } catch (err: any) {
        console.error('Failed to fetch appointments:', err);
        setError(err.message || 'Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const [formData, setFormData] = useState({
    studentEmail: '',
    title: '',
    description: '',
    appointmentType: 'consultation' as const,
    startTime: '',
    endTime: '',
    location: '',
    isOnline: false,
    meetingLink: '',
    notes: ''
  });

  const refreshAppointments = async () => {
    try {
      const response = await appointmentApi.getAll();
      const data = response.data?.data || response.data || [];
      setEvents(data);
    } catch (err) {
      console.error('Failed to refresh appointments:', err);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'scheduled': 'bg-blue-100 text-blue-700',
      'confirmed': 'bg-green-100 text-green-700',
      'completed': 'bg-gray-100 text-gray-700',
      'cancelled': 'bg-red-100 text-red-700',
      'no_show': 'bg-orange-100 text-orange-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const upcomingEvents = events
    .filter(e => new Date(e.startTime) >= new Date() && e.status !== 'cancelled')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.studentEmail.trim()) {
      errors.studentEmail = 'Email học sinh là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.studentEmail)) {
      errors.studentEmail = 'Email không hợp lệ';
    }
    if (!formData.title.trim()) {
      errors.title = 'Tiêu đề là bắt buộc';
    }
    if (!formData.startTime) {
      errors.startTime = 'Thời gian bắt đầu là bắt buộc';
    }
    if (!formData.endTime) {
      errors.endTime = 'Thời gian kết thúc là bắt buộc';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await appointmentApi.create({
        ...formData,
        status: 'scheduled',
        reminderSent: false
      });
      await refreshAppointments();
      setShowModal(false);
      setFormData({
        studentEmail: '',
        title: '',
        description: '',
        appointmentType: 'consultation',
        startTime: '',
        endTime: '',
        location: '',
        isOnline: false,
        meetingLink: '',
        notes: ''
      });
    } catch (error) {
      console.error('Failed to schedule appointment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await appointmentApi.updateStatus(id, 'confirmed');
      await refreshAppointments();
    } catch (error) {
      console.error('Failed to confirm appointment:', error);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await appointmentApi.delete(id);
      await refreshAppointments();
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch hẹn</h1>
          <p className="text-gray-600 mt-1">Quản lý lịch tư vấn và phỏng vấn</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Đặt lịch mới
        </button>
      </div>

      {/* Calendar View (Simplified) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Lịch hẹn sắp tới
          </h2>
          {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-2 text-gray-300 animate-spin" />
            <p className="text-gray-500">Đang tải lịch hẹn...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-300" />
            <p className="text-red-500">{error}</p>
            <button 
              onClick={refreshAppointments}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Thử lại
            </button>
          </div>
        ) : upcomingEvents.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500">Không có lịch hẹn nào sắp tới</p>
            </div>
          ) : (
            upcomingEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                      {event.isOnline ? (
                        <span className="flex items-center gap-1 text-xs text-blue-600">
                          <Video className="w-3 h-3" /> Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <MapPin className="w-3 h-3" /> Tại văn phòng
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold">{event.title}</h3>
                    <p className="text-sm text-gray-600">{event.description}</p>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Học sinh: {event.studentEmail}</p>
                      <p>Thời gian: {new Date(event.startTime).toLocaleString('vi-VN')}</p>
                      {event.location && <p>Địa điểm: {event.location}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {event.status === 'scheduled' && (
                      <button
                        onClick={() => handleConfirm(event.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Xác nhận"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleCancel(event.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Hủy"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Date Picker */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-4">Chọn ngày</h3>
          <input
            type="date"
            className="w-full border rounded px-3 py-2 mb-4"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-600">Thống kê tháng này</h4>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-blue-50 rounded p-2">
                <p className="text-lg font-bold text-blue-600">
                  {events.filter(e => new Date(e.startTime).getMonth() === new Date().getMonth()).length}
                </p>
                <p className="text-xs text-gray-600">Tổng lịch hẹn</p>
              </div>
              <div className="bg-green-50 rounded p-2">
                <p className="text-lg font-bold text-green-600">
                  {events.filter(e => e.status === 'completed').length}
                </p>
                <p className="text-xs text-gray-600">Đã hoàn thành</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Đặt lịch hẹn mới</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email học sinh *
                  </label>
                  <input
                    type="email"
                    value={formData.studentEmail}
                    onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                    className={`w-full border rounded px-3 py-2 ${formErrors.studentEmail ? 'border-red-500' : ''}`}
                    placeholder="student@example.com"
                  />
                  {formErrors.studentEmail && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.studentEmail}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại lịch hẹn
                  </label>
                  <select
                    value={formData.appointmentType}
                    onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value as any })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="consultation">Tư vấn</option>
                    <option value="interview">Phỏng vấn</option>
                    <option value="review">Rà soát hồ sơ</option>
                    <option value="followup">Theo dõi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full border rounded px-3 py-2 ${formErrors.title ? 'border-red-500' : ''}`}
                  placeholder="Ví dụ: Tư vấn du học Hàn Quốc"
                />
                {formErrors.title && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded px-3 py-2 h-20"
                  placeholder="Mô tả chi tiết về lịch hẹn..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian bắt đầu *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className={`w-full border rounded px-3 py-2 ${formErrors.startTime ? 'border-red-500' : ''}`}
                  />
                  {formErrors.startTime && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.startTime}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian kết thúc *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className={`w-full border rounded px-3 py-2 ${formErrors.endTime ? 'border-red-500' : ''}`}
                  />
                  {formErrors.endTime && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.endTime}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isOnline}
                    onChange={(e) => setFormData({ ...formData, isOnline: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Họp trực tuyến</span>
                </label>
              </div>

              {formData.isOnline && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link họp
                  </label>
                  <input
                    type="url"
                    value={formData.meetingLink}
                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              )}

              {!formData.isOnline && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa điểm
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Văn phòng SACMA / Địa chỉ..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border rounded px-3 py-2 h-20"
                  placeholder="Ghi chú thêm..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Đặt lịch
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendar;
