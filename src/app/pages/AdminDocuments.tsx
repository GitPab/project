import React, { useState, useEffect } from 'react';
import { usePermission, PermissionGuard } from '../components/PermissionGuard';
import { toast } from 'sonner';
import { Search, RefreshCw, FileText, CheckCircle, XCircle, Trash2, Filter, Plus, Download, Clock, User, AlertTriangle, FileCheck } from 'lucide-react';
import { documentApi } from '../services/api';

interface Document {
  id: string;
  student_id: string;
  student_name?: string;
  document_type: string;
  file_name: string;
  file_url?: string;
  file_size?: number;
  mime_type?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export default function AdminDocuments() {
  const { hasPermission } = usePermission();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const canReviewDocs = hasPermission('DOCUMENT_REVIEW');

  useEffect(() => {
    fetchDocuments();
  }, [filterStatus, filterType]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterType !== 'all') params.type = filterType;
      
      const response = await documentApi.getAll(params);
      const rows = response.data || [];
      setDocuments(rows);
    } catch (error) {
      toast.error('Không thể tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDocuments();
    setRefreshing(false);
  };

  const handleReview = async (documentId: string, status: 'approved' | 'rejected') => {
    if (!canReviewDocs) {
      toast.error('Bạn không có quyền phê duyệt tài liệu');
      return;
    }

    try {
      await documentApi.review(documentId, { status, notes: reviewNotes });
      setDocuments(prev => prev.map(d => 
        d.id === documentId ? { ...d, status, reviewed_at: new Date().toISOString() } : d
      ));
      toast.success(status === 'approved' ? 'Đã phê duyệt tài liệu' : 'Đã từ chối tài liệu');
      setSelectedDoc(null);
      setReviewNotes('');
    } catch (error) {
      toast.error('Phê duyệt thất bại');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Bạn có chắc muốn xóa tài liệu này?')) return;

    try {
      await documentApi.delete(documentId);
      setDocuments(prev => prev.filter(d => d.id !== documentId));
      toast.success('Đã xóa tài liệu');
    } catch (error) {
      toast.error('Xóa thất bại');
    }
  };

  const filteredDocs = documents.filter(doc => {
    const searchLower = searchTerm.toLowerCase();
    return (
      doc.file_name?.toLowerCase().includes(searchLower) ||
      doc.student_name?.toLowerCase().includes(searchLower) ||
      doc.document_type?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    const labels: Record<string, string> = {
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Từ chối'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uniqueTypes = [...new Set(documents.map(d => d.document_type))];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý tài liệu</h1>
            <p className="text-slate-600 mt-1">Xem và phê duyệt tài liệu của học sinh</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <FileText className="w-4 h-4" />
              <span className="text-sm">Tổng tài liệu</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{documents.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm">Chờ duyệt</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              {documents.filter(d => d.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Đã duyệt</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {documents.filter(d => d.status === 'approved').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm">Từ chối</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {documents.filter(d => d.status === 'rejected').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu, học sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả loại</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-slate-400 mx-auto mb-3 animate-spin" />
            <p className="text-slate-600">Đang tải...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">Không có tài liệu nào</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Tài liệu</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Học sinh</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Loại</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Kích thước</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Trạng thái</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Ngày tải lên</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <div className="font-medium text-slate-900">{doc.file_name}</div>
                        {doc.file_url && (
                          <a 
                            href={doc.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Tải xuống
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{doc.student_name || 'N/A'}</td>
                  <td className="px-6 py-4 text-slate-700">{doc.document_type}</td>
                  <td className="px-6 py-4 text-slate-700">{formatFileSize(doc.file_size)}</td>
                  <td className="px-6 py-4">{getStatusBadge(doc.status)}</td>
                  <td className="px-6 py-4 text-slate-700">
                    {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {doc.status === 'pending' && canReviewDocs && (
                        <>
                          <button
                            onClick={() => setSelectedDoc(doc)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                            title="Phê duyệt"
                          >
                            <FileCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReview(doc.id, 'rejected')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Từ chối"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Phê duyệt tài liệu</h3>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-slate-500">Tài liệu</p>
                <p className="font-medium">{selectedDoc.file_name}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-slate-500">Học sinh</p>
                <p className="font-medium">{selectedDoc.student_name || 'N/A'}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú (tùy chọn)</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập ghi chú phê duyệt..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t bg-slate-50">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-white"
              >
                Hủy
              </button>
              <button
                onClick={() => handleReview(selectedDoc.id, 'approved')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Phê duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
