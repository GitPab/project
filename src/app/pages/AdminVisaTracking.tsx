import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Plus, Trash2, Save, X, AlertCircle, Loader2 } from 'lucide-react';
import { VisaApplication } from '../../types';

const AdminVisaTracking: React.FC = () => {
  const { visaApplications, addVisaApplication, updateVisaStatus, deleteVisaApplication, universities } = useApp();
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    studentEmail: '',
    studentName: '',
    universityId: '',
    visaType: 'D-2',
    embassyLocation: '',
    submissionDate: '',
    appointmentDate: '',
    status: 'preparing' as string,
    interviewRequired: false,
    notes: ''
  });

  useEffect(() => {
    setApplications(visaApplications);
  }, [visaApplications]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'preparing': 'bg-gray-100 text-gray-700',
      'submitted': 'bg-blue-100 text-blue-700',
      'under_review': 'bg-yellow-100 text-yellow-700',
      'interview_scheduled': 'bg-purple-100 text-purple-700',
      'approved': 'bg-green-100 text-green-700',
      'rejected': 'bg-red-100 text-red-700',
      'issued': 'bg-emerald-100 text-emerald-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'preparing': 'Đang chuẩn bị',
      'submitted': 'Đã nộp',
      'under_review': 'Đang xem xét',
      'interview_scheduled': 'Đã hẹn phỏng vấn',
      'approved': 'Đã duyệt',
      'rejected': 'Bị từ chối',
      'issued': 'Đã cấp visa'
    };
    return labels[status] || status;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.studentEmail.trim()) {
      errors.studentEmail = 'Email học sinh là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.studentEmail)) {
      errors.studentEmail = 'Email không hợp lệ';
    }
    if (!formData.visaType.trim()) {
      errors.visaType = 'Loại visa là bắt buộc';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await addVisaApplication({
        ...formData,
        studentApplicationId: undefined
      });
      setShowModal(false);
      setFormData({
        studentEmail: '',
        studentName: '',
        universityId: '',
        visaType: 'D-2',
        embassyLocation: '',
        submissionDate: '',
        appointmentDate: '',
        status: 'preparing',
        interviewRequired: false,
        notes: ''
      });
    } catch (error) {
      console.error('Failed to add visa application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVisaApplication(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete visa application:', error);
    }
  };

  const filteredApplications = filterStatus
    ? applications.filter(a => a.status === filterStatus)
    : applications;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Theo dõi Visa</h1>
          <p className="text-gray-600 mt-1">Quản lý hồ sơ visa của học sinh</p>
        </div>
        <div className="flex gap-2">
          <select
            className="border rounded px-3 py-2"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="preparing">Đang chuẩn bị</option>
            <option value="submitted">Đã nộp</option>
            <option value="under_review">Đang xem xét</option>
            <option value="interview_scheduled">Đã hẹn phỏng vấn</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Bị từ chối</option>
            <option value="issued">Đã cấp visa</option>
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Thêm hồ sơ
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Tổng hồ sơ</p>
          <p className="text-2xl font-bold">{applications.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Đã cấp visa</p>
          <p className="text-2xl font-bold text-green-600">
            {applications.filter(a => a.status === 'issued').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Đang xử lý</p>
          <p className="text-2xl font-bold text-blue-600">
            {applications.filter(a => ['submitted', 'under_review'].includes(a.status)).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Bị từ chối</p>
          <p className="text-2xl font-bold text-red-600">
            {applications.filter(a => a.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Học sinh</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Trường</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Loại visa</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Trạng thái</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ngày nộp</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  Chưa có hồ sơ visa nào
                </td>
              </tr>
            ) : (
              filteredApplications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{app.studentName || app.studentEmail}</p>
                    <p className="text-sm text-gray-500">{app.studentEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {universities.find(u => u.id === app.universityId)?.name || app.universityId}
                  </td>
                  <td className="px-4 py-3 text-sm">{app.visaType}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(app.status)}`}>
                      {getStatusLabel(app.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {app.submissionDate ? new Date(app.submissionDate).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        className="text-sm border rounded px-2 py-1"
                        value={app.status}
                        onChange={(e) => updateVisaStatus(app.id, e.target.value)}
                      >
                        <option value="preparing">Đang chuẩn bị</option>
                        <option value="submitted">Đã nộp</option>
                        <option value="under_review">Đang xem xét</option>
                        <option value="interview_scheduled">Đã hẹn phỏng vấn</option>
                        <option value="approved">Đã duyệt</option>
                        <option value="rejected">Bị từ chối</option>
                        <option value="issued">Đã cấp visa</option>
                      </select>
                      <button
                        onClick={() => setShowDeleteConfirm(app.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Visa Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Thêm hồ sơ visa mới</h2>
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
                    Tên học sinh
                  </label>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trường đại học
                  </label>
                  <select
                    value={formData.universityId}
                    onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Chọn trường</option>
                    {universities.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại visa *
                  </label>
                  <select
                    value={formData.visaType}
                    onChange={(e) => setFormData({ ...formData, visaType: e.target.value })}
                    className={`w-full border rounded px-3 py-2 ${formErrors.visaType ? 'border-red-500' : ''}`}
                  >
                    <option value="D-2">D-2 (Du học)</option>
                    <option value="D-4">D-4 (Đào tạo)</option>
                    <option value="D-10">D-10 (Tìm việc)</option>
                    <option value="E-7">E-7 (Chuyên gia)</option>
                  </select>
                  {formErrors.visaType && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.visaType}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa điểm đại sứ quán
                  </label>
                  <input
                    type="text"
                    value={formData.embassyLocation}
                    onChange={(e) => setFormData({ ...formData, embassyLocation: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Hà Nội / TP.HCM"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="preparing">Đang chuẩn bị</option>
                    <option value="submitted">Đã nộp</option>
                    <option value="under_review">Đang xem xét</option>
                    <option value="interview_scheduled">Đã hẹn phỏng vấn</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="rejected">Bị từ chối</option>
                    <option value="issued">Đã cấp visa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày nộp hồ sơ
                  </label>
                  <input
                    type="date"
                    value={formData.submissionDate}
                    onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày hẹn phỏng vấn
                  </label>
                  <input
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border rounded px-3 py-2 h-20"
                  placeholder="Ghi chú thêm về hồ sơ..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="interviewRequired"
                  checked={formData.interviewRequired}
                  onChange={(e) => setFormData({ ...formData, interviewRequired: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="interviewRequired" className="text-sm font-medium text-gray-700">
                  Yêu cầu phỏng vấn
                </label>
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
                      Lưu hồ sơ
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold">Xác nhận xóa</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa hồ sơ visa này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVisaTracking;
