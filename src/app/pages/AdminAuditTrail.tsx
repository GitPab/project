import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ClipboardList, Filter, Download, Search, Calendar, User, RefreshCw } from 'lucide-react';

const AdminAuditTrail: React.FC = () => {
  const { getAuditLogs } = useApp();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    entityType: '',
    studentEmail: '',
    performedBy: '',
    limit: 100
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const result = await getAuditLogs(
        filters.entityType || undefined,
        filters.studentEmail || undefined,
        filters.performedBy || undefined,
        filters.limit
      );
      setLogs(result);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-700';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-700';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const exportToCSV = () => {
    if (logs.length === 0) {
      alert('Không có dữ liệu để xuất');
      return;
    }

    const headers = ['Thời gian', 'Hành động', 'Đối tượng', 'Học sinh', 'Thực hiện bởi', 'Chi tiết'];
    const rows = logs.map(log => [
      new Date(log.created_at).toLocaleString('vi-VN'),
      log.action,
      log.entity_type,
      log.student_email || '-',
      log.performed_by,
      log.new_values ? JSON.stringify(log.new_values).slice(0, 100) : '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhật ký hệ thống</h1>
          <p className="text-gray-600 mt-1">Theo dõi mọi thao tác trong hệ thống</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            <Download className="w-4 h-4" />
            Xuất CSV
          </button>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="font-medium">Bộ lọc</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại thao tác</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
            >
              <option value="">Tất cả</option>
              <option value="student">Học sinh</option>
              <option value="university">Trường học</option>
              <option value="payment">Thanh toán</option>
              <option value="document">Hồ sơ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email học sinh</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                className="w-full border rounded pl-9 pr-3 py-2"
                placeholder="Tìm theo email..."
                value={filters.studentEmail}
                onChange={(e) => setFilters({ ...filters, studentEmail: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thực hiện bởi</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                className="w-full border rounded pl-9 pr-3 py-2"
                placeholder="Tên admin..."
                value={filters.performedBy}
                onChange={(e) => setFilters({ ...filters, performedBy: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value) })}
            >
              <option value={50}>50 bản ghi</option>
              <option value={100}>100 bản ghi</option>
              <option value={200}>200 bản ghi</option>
              <option value={500}>500 bản ghi</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={loadLogs}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Áp dụng bộ lọc
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Thời gian</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Hành động</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Đối tượng</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Học sinh</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Thực hiện bởi</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    <ClipboardList className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    Chưa có bản ghi nào
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(log.created_at).toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{log.entity_type}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{log.student_email || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{log.performed_by}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {log.new_values ? JSON.stringify(log.new_values).slice(0, 50) + '...' : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditTrail;
