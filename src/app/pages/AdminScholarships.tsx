import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { GraduationCap, Plus, Trash2, Edit2, Save, X, DollarSign, Users, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { Scholarship } from '../../types';

const AdminScholarships: React.FC = () => {
  const { scholarships, addScholarship, updateScholarship, deleteScholarship, universities } = useApp();
  const [items, setItems] = useState<Scholarship[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Scholarship | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    universityId: '',
    name: '',
    nameKorean: '',
    description: '',
    amountVnd: '',
    amountKrw: '',
    eligibilityCriteria: '',
    applicationDeadline: '',
    requirements: '',
    isActive: true
  });

  useEffect(() => {
    setItems(scholarships);
  }, [scholarships]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Tên học bổng là bắt buộc';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEdit = (item: Scholarship) => {
    setEditing(item);
    setFormData({
      universityId: item.universityId || '',
      name: item.name,
      nameKorean: item.nameKorean || '',
      description: item.description || '',
      amountVnd: item.amountVnd?.toString() || '',
      amountKrw: item.amountKrw?.toString() || '',
      eligibilityCriteria: item.eligibilityCriteria || '',
      applicationDeadline: item.applicationDeadline || '',
      requirements: item.requirements || '',
      isActive: item.isActive
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      if (editing) {
        await updateScholarship(editing.id, {
          ...formData,
          amountVnd: formData.amountVnd ? Number(formData.amountVnd) : undefined,
          amountKrw: formData.amountKrw ? Number(formData.amountKrw) : undefined
        });
      } else {
        await addScholarship({
          ...formData,
          amountVnd: formData.amountVnd ? Number(formData.amountVnd) : undefined,
          amountKrw: formData.amountKrw ? Number(formData.amountKrw) : undefined
        });
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteScholarship(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      universityId: '',
      name: '',
      nameKorean: '',
      description: '',
      amountVnd: '',
      amountKrw: '',
      eligibilityCriteria: '',
      applicationDeadline: '',
      requirements: '',
      isActive: true
    });
    setEditing(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Học bổng</h1>
          <p className="text-gray-600 mt-1">Thêm và quản lý các suất học bổng</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Thêm học bổng
        </button>
      </div>

      {/* Scholarships List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
            <GraduationCap className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500">Chưa có học bổng nào</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  <span className={`px-2 py-1 rounded text-xs ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.isActive ? 'Đang mở' : 'Đã đóng'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleEdit(item)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Sửa"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(item.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{item.nameKorean}</p>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium">
                    {item.amountVnd ? `${item.amountVnd.toLocaleString()} VND` : ''}
                    {item.amountVnd && item.amountKrw ? ' / ' : ''}
                    {item.amountKrw ? `${item.amountKrw.toLocaleString()} KRW` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Hạn: {item.applicationDeadline ? new Date(item.applicationDeadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>Trường: {universities.find(u => u.id === item.universityId)?.name || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editing ? 'Sửa học bổng' : 'Thêm học bổng mới'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên học bổng *</label>
                <input
                  type="text"
                  className={`w-full border rounded px-3 py-2 ${formErrors.name ? 'border-red-500' : ''}`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Học bổng Toàn phần"
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên tiếng Hàn</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={formData.nameKorean}
                  onChange={(e) => setFormData({ ...formData, nameKorean: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền (VND)</label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={formData.amountVnd}
                    onChange={(e) => setFormData({ ...formData, amountVnd: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền (KRW)</label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={formData.amountKrw}
                    onChange={(e) => setFormData({ ...formData, amountKrw: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Điều kiện đủ</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  value={formData.eligibilityCriteria}
                  onChange={(e) => setFormData({ ...formData, eligibilityCriteria: e.target.value })}
                  placeholder="Ví dụ: GPA trên 3.5, IELTS 6.5+"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hạn nộp hồ sơ</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={formData.applicationDeadline}
                  onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yêu cầu hồ sơ</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Các giấy tờ cần nộp..."
                  rows={2}
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-2">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                ) : (
                  <><Save className="w-4 h-4" /> {editing ? 'Cập nhật' : 'Lưu'}</>
                )}
              </button>
            </div>
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
              Bạn có chắc chắn muốn xóa học bổng này? Hành động này không thể hoàn tác.
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

export default AdminScholarships;
