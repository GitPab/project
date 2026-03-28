import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Workflow, Plus, Trash2, Edit2, Save, X, Play, Pause, AlertCircle } from 'lucide-react';
import { WorkflowRule } from '../../types';

const AdminWorkflow: React.FC = () => {
  const { workflowRules, createWorkflowRule, updateWorkflowRule, deleteWorkflowRule } = useApp();
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerType: 'status_change',
    triggerCondition: '',
    actionType: 'send_notification',
    actionConfig: {} as Record<string, any>,
    isActive: true,
    priority: 1
  });

  useEffect(() => {
    setRules(workflowRules);
  }, [workflowRules]);

  const handleSave = async () => {
    // Form validation
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên quy tắc');
      return;
    }
    if (!formData.description.trim()) {
      alert('Vui lòng nhập mô tả quy tắc');
      return;
    }
    if (formData.priority < 1) {
      alert('Độ ưu tiên phải lớn hơn 0');
      return;
    }
    
    try {
      if (editingRule) {
        await updateWorkflowRule(editingRule.id, formData);
      } else {
        await createWorkflowRule(formData);
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save rule:', error);
      alert('Có lỗi xảy ra khi lưu quy tắc');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      triggerType: 'status_change',
      triggerCondition: '',
      actionType: 'send_notification',
      actionConfig: {},
      isActive: true,
      priority: 1
    });
    setEditingRule(null);
  };

  const getTriggerLabel = (type: string) => {
    const labels: Record<string, string> = {
      'status_change': 'Thay đổi trạng thái',
      'payment_received': 'Nhận thanh toán',
      'document_uploaded': 'Tải lên hồ sơ',
      'deadline_approaching': 'Sắp đến hạn',
      'manual': 'Thủ công'
    };
    return labels[type] || type;
  };

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      'send_notification': 'Gửi thông báo',
      'send_email': 'Gửi email',
      'update_status': 'Cập nhật trạng thái',
      'create_reminder': 'Tạo nhắc nhở',
      'trigger_webhook': 'Gọi webhook'
    };
    return labels[type] || type;
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tự động hóa Workflow</h1>
          <p className="text-gray-600 mt-1">Thiết lập quy tắc tự động cho hệ thống</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Thêm quy tắc
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Workflow className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500">Chưa có quy tắc tự động nào</p>
          </div>
        ) : (
          rules.sort((a, b) => a.priority - b.priority).map((rule) => (
            <div key={rule.id} className={`bg-white rounded-lg shadow p-6 ${!rule.isActive && 'opacity-60'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded font-medium">
                      #{rule.priority}
                    </span>
                    <h3 className="font-semibold">{rule.name}</h3>
                    {rule.isActive ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <Play className="w-3 h-3" /> Đang chạy
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Pause className="w-3 h-3" /> Đã tắt
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded">
                      Khi: {getTriggerLabel(rule.triggerType)}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                      Thì: {getActionLabel(rule.actionType)}
                    </span>
                  </div>
                  {rule.triggerCondition && (
                    <div className="mt-2 text-sm text-gray-500">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      Điều kiện: {rule.triggerCondition}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 ml-4">
                  <button
                    onClick={() => {
                      setEditingRule(rule);
                      setFormData({
                        name: rule.name,
                        description: rule.description || '',
                        triggerType: rule.triggerType,
                        triggerCondition: rule.triggerCondition,
                        actionType: rule.actionType,
                        actionConfig: rule.actionConfig,
                        isActive: rule.isActive,
                        priority: rule.priority
                      });
                      setShowModal(true);
                    }}
                    className="p-2 text-gray-500 hover:text-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Bạn có chắc muốn xóa quy tắc này?')) {
                        deleteWorkflowRule(rule.id);
                      }
                    }}
                    className="p-2 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
              <h2 className="text-xl font-bold">
                {editingRule ? 'Chỉnh sửa quy tắc' : 'Thêm quy tắc mới'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên quy tắc</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Độ ưu tiên</label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                    min={1}
                  />
                </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trigger (Kích hoạt)</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.triggerType}
                    onChange={(e) => setFormData({ ...formData, triggerType: e.target.value as any })}
                  >
                    <option value="status_change">Thay đổi trạng thái</option>
                    <option value="payment_received">Nhận thanh toán</option>
                    <option value="document_uploaded">Tải lên hồ sơ</option>
                    <option value="deadline_approaching">Sắp đến hạn</option>
                    <option value="manual">Thủ công</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hành động</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.actionType}
                    onChange={(e) => setFormData({ ...formData, actionType: e.target.value as any })}
                  >
                    <option value="send_notification">Gửi thông báo</option>
                    <option value="send_email">Gửi email</option>
                    <option value="update_status">Cập nhật trạng thái</option>
                    <option value="create_reminder">Tạo nhắc nhở</option>
                    <option value="trigger_webhook">Gọi webhook</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Điều kiện (tùy chọn)</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={formData.triggerCondition}
                  onChange={(e) => setFormData({ ...formData, triggerCondition: e.target.value })}
                  placeholder="Ví dụ: status === 'pending' && days > 7"
                />
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

export default AdminWorkflow;
