import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Database, Upload, Download, Trash2, RefreshCw, FileSpreadsheet, Users, CheckCircle, AlertCircle } from 'lucide-react';

const AdminBulkOperations: React.FC = () => {
  const { bulkOperations, createBulkOperation, updateBulkOperationStatus } = useApp();
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'update' | 'delete'>('import');
  const [file, setFile] = useState<File | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteType, setDeleteType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const operationId = await createBulkOperation({
        operationType: 'import_students',
        totalRecords: 0,
        inputData: file.name,
        performedBy: 'admin'
      });
      // Simulate processing
      setTimeout(() => {
        updateBulkOperationStatus(operationId, 'completed', 100, 95, 5);
      }, 2000);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const operationId = await createBulkOperation({
        operationType: 'export_students',
        performedBy: 'admin'
      });
      // Simulate export
      setTimeout(() => {
        updateBulkOperationStatus(operationId, 'completed', 100, 100, 0);
        // Trigger download
        alert('Xuất file thành công!');
      }, 1500);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!statusFilter) return;
    setLoading(true);
    try {
      const operationId = await createBulkOperation({
        operationType: 'update_status',
        performedBy: 'admin'
      });
      setTimeout(() => {
        updateBulkOperationStatus(operationId, 'completed', 50, 50, 0);
      }, 1500);
    } catch (error) {
      console.error('Bulk update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!deleteType) return;
    
    const confirmMessage = deleteType === 'old_records' 
      ? 'Bạn có chắc muốn xóa các bản ghi cũ? Hành động này không thể hoàn tác.'
      : deleteType === 'inactive_students'
      ? 'Bạn có chắc muốn xóa học sinh không hoạt động?'
      : 'Bạn có chắc muốn xóa đơn nháp?';
      
    if (!confirm(confirmMessage)) return;
    
    setLoading(true);
    try {
      const operationId = await createBulkOperation({
        operationType: 'delete_records',
        totalRecords: 0,
        inputData: deleteType,
        performedBy: 'admin'
      });
      
      // Simulate processing
      setTimeout(() => {
        updateBulkOperationStatus(operationId, 'completed', 100, 100, 0);
        alert('Xóa dữ liệu thành công!');
        setDeleteType('');
      }, 2000);
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Thao tác hàng loạt</h1>
        <p className="text-gray-600 mt-1">Import/Export và cập nhật dữ liệu hàng loạt</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'import', label: 'Import', icon: Upload },
          { id: 'export', label: 'Export', icon: Download },
          { id: 'update', label: 'Cập nhật', icon: RefreshCw },
          { id: 'delete', label: 'Xóa', icon: Trash2 },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              activeTab === id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        {activeTab === 'import' && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import danh sách học sinh
            </h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">Chọn file CSV hoặc Excel để import</p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
              >
                Chọn file
              </label>
              {file && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  {file.name}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleImport}
                disabled={!file || loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Bắt đầu Import
              </button>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export danh sách học sinh
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bộ lọc xuất dữ liệu</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span>Tất cả học sinh</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" />
                    <span>Chỉ học sinh đang học</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Định dạng file</label>
                <select className="border rounded px-3 py-2 w-full">
                  <option value="csv">CSV (.csv)</option>
                  <option value="excel">Excel (.xlsx)</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleExport}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Xuất dữ liệu
              </button>
            </div>
          </div>
        )}

        {activeTab === 'update' && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Cập nhật trạng thái hàng loạt
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái hiện tại</label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Chọn trạng thái...</option>
                  <option value="pending">Đang chờ</option>
                  <option value="in-progress">Đang xử lý</option>
                  <option value="completed">Hoàn thành</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái mới</label>
                <select className="border rounded px-3 py-2 w-full">
                  <option value="approved">Đã duyệt</option>
                  <option value="rejected">Từ chối</option>
                  <option value="processing">Đang xử lý</option>
                </select>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Thao tác này sẽ cập nhật tất cả học sinh có trạng thái đã chọn. Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleBulkUpdate}
                disabled={!statusFilter || loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Cập nhật hàng loạt
              </button>
            </div>
          </div>
        )}

        {activeTab === 'delete' && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Xóa dữ liệu hàng loạt
            </h3>
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-800 font-medium mb-2">⚠️ Cảnh báo</p>
              <p className="text-sm text-red-700">
                Thao tác xóa dữ liệu không thể hoàn tác. Dữ liệu đã xóa sẽ không thể khôi phục.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại dữ liệu cần xóa</label>
                <select 
                  className="border rounded px-3 py-2 w-full"
                  value={deleteType}
                  onChange={(e) => setDeleteType(e.target.value)}
                >
                  <option value="">Chọn loại dữ liệu...</option>
                  <option value="old_records">Bản ghi cũ (trước 2020)</option>
                  <option value="inactive_students">Học sinh không hoạt động</option>
                  <option value="draft_applications">Đơn nháp</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                onClick={handleBulkDelete}
                disabled={!deleteType || loading}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Xóa dữ liệu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Operations History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Lịch sử thao tác
        </h3>
        {bulkOperations.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Chưa có thao tác nào</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium">Thời gian</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Loại</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Trạng thái</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Tiến độ</th>
              </tr>
            </thead>
            <tbody>
              {bulkOperations.slice(0, 10).map((op) => (
                <tr key={op.id} className="border-b">
                  <td className="px-4 py-3 text-sm">{new Date(op.startedAt).toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3 text-sm">{op.operationType}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(op.operationStatus)}`}>
                      {op.operationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {op.processedRecords} / {op.totalRecords || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminBulkOperations;
