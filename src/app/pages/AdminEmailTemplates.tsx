import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Plus, Trash2, Edit2, Save, X, Variable } from 'lucide-react';
import { EmailTemplate } from '../../types';

const AdminEmailTemplates: React.FC = () => {
  const { emailTemplates, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate } = useApp();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    templateType: 'general',
    variables: [] as string[],
    isActive: true
  });
  const [newVariable, setNewVariable] = useState('');

  useEffect(() => {
    setTemplates(emailTemplates);
  }, [emailTemplates]);

  const handleSave = async () => {
    // Form validation
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên mẫu email');
      return;
    }
    if (!formData.subject.trim()) {
      alert('Vui lòng nhập tiêu đề email');
      return;
    }
    if (!formData.content.trim()) {
      alert('Vui lòng nhập nội dung email');
      return;
    }
    
    try {
      if (editingTemplate) {
        await updateEmailTemplate(editingTemplate.id, formData);
      } else {
        await createEmailTemplate(formData);
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Có lỗi xảy ra khi lưu mẫu email');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      content: '',
      templateType: 'general',
      variables: [],
      isActive: true
    });
    setEditingTemplate(null);
  };

  const addVariable = () => {
    if (newVariable && !formData.variables.includes(newVariable)) {
      setFormData({
        ...formData,
        variables: [...formData.variables, newVariable]
      });
      setNewVariable('');
    }
  };

  const removeVariable = (v: string) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter(variable => variable !== v)
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'welcome': return 'bg-green-100 text-green-700';
      case 'payment': return 'bg-blue-100 text-blue-700';
      case 'reminder': return 'bg-orange-100 text-orange-700';
      case 'notification': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mẫu Email</h1>
          <p className="text-gray-600 mt-1">Quản lý các mẫu email tự động</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Thêm mẫu mới
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
            <Mail className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500">Chưa có mẫu email nào</p>
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`px-2 py-1 rounded text-xs ${getTypeColor(template.templateType)}`}>
                    {template.templateType}
                  </span>
                  <h3 className="font-semibold mt-2">{template.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingTemplate(template);
                      setFormData({
                        name: template.name,
                        subject: template.subject,
                        content: template.content,
                        templateType: template.templateType,
                        variables: template.variables,
                        isActive: template.isActive
                      });
                      setShowModal(true);
                    }}
                    className="p-2 text-gray-500 hover:text-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Bạn có chắc muốn xóa mẫu email này?')) {
                        deleteEmailTemplate(template.id);
                      }
                    }}
                    className="p-2 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Tiêu đề:</span> {template.subject}
              </p>
              <div className="flex flex-wrap gap-1 mt-3">
                {template.variables.map((v) => (
                  <span key={v} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t">
                <span className={`text-xs ${template.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                  {template.isActive ? '● Đang hoạt động' : '○ Đã tắt'}
                </span>
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
              <h2 className="text-xl font-bold">
                {editingTemplate ? 'Chỉnh sửa mẫu' : 'Thêm mẫu mới'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên mẫu</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: welcome_email"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại mẫu</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.templateType}
                    onChange={(e) => setFormData({ ...formData, templateType: e.target.value as any })}
                  >
                    <option value="general">Chung</option>
                    <option value="welcome">Chào mừng</option>
                    <option value="payment">Thanh toán</option>
                    <option value="reminder">Nhắc nhở</option>
                    <option value="notification">Thông báo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Tắt</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề email</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ví dụ: Chào mừng {{studentName}}!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                <textarea
                  className="w-full border rounded px-3 py-2 h-40"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Nhập nội dung email với các biến {{variable}}..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Biến sử dụng</label>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Variable className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      className="w-full border rounded pl-9 pr-3 py-2"
                      value={newVariable}
                      onChange={(e) => setNewVariable(e.target.value)}
                      placeholder="Tên biến (không dấu {{}})"
                    />
                  </div>
                  <button
                    onClick={addVariable}
                    className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Thêm
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.variables.map((v) => (
                    <span key={v} className="px-3 py-1 bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                      {`{{${v}}}`}
                      <button onClick={() => removeVariable(v)} className="hover:text-blue-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmailTemplates;
