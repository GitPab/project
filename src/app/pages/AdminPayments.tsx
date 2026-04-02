import React, { useState, useEffect } from 'react';
import { usePermission, PermissionGuard } from '../components/PermissionGuard';
import { toast } from 'sonner';
import { Search, RefreshCw, DollarSign, CreditCard, CheckCircle, XCircle, Trash2, Filter, Plus, AlertTriangle } from 'lucide-react';
import { paymentApi } from '../services/api';

interface Payment {
  id: string;
  student_id: string;
  student_name?: string;
  university_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string;
  payment_type: string;
  description?: string;
  created_at: string;
  paid_at?: string;
}

export default function AdminPayments() {
  const { hasPermission } = usePermission();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'failed' | 'refunded'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const canManagePayments = hasPermission('PAYMENT_MANAGE');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentApi.getAll();
      const rows = response.data || [];
      setPayments(rows);
    } catch (error) {
      toast.error('Không thể tải danh sách thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  };

  const handleStatusUpdate = async (paymentId: string, newStatus: string) => {
    if (!canManagePayments) {
      toast.error('Bạn không có quyền cập nhật thanh toán');
      return;
    }

    try {
      await paymentApi.update(paymentId, { status: newStatus });
      setPayments(prev => prev.map(p => 
        p.id === paymentId ? { ...p, status: newStatus as Payment['status'] } : p
      ));
      toast.success('Đã cập nhật trạng thái thanh toán');
    } catch (error) {
      toast.error('Cập nhật thất bại');
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (!canManagePayments) {
      toast.error('Bạn không có quyền xóa thanh toán');
      return;
    }

    if (!confirm('Bạn có chắc muốn xóa thanh toán này?')) return;

    try {
      await paymentApi.delete(paymentId);
      setPayments(prev => prev.filter(p => p.id !== paymentId));
      toast.success('Đã xóa thanh toán');
    } catch (error) {
      toast.error('Xóa thất bại');
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.payment_method?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    const labels: Record<string, string> = {
      pending: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      failed: 'Thất bại',
      refunded: 'Đã hoàn tiền'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý thanh toán</h1>
            <p className="text-slate-600 mt-1">Theo dõi và quản lý các giao dịch tài chính</p>
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
            <PermissionGuard permission="PAYMENT_MANAGE">
              <button
                onClick={() => toast.info('Tính năng tạo thanh toán đang phát triển')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Tạo thanh toán
              </button>
            </PermissionGuard>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Tổng giao dịch</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{payments.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Đã thanh toán</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {payments.filter(p => p.status === 'paid').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm">Chờ thanh toán</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              {payments.filter(p => p.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm">Thất bại</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {payments.filter(p => p.status === 'failed').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên học sinh, mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="paid">Đã thanh toán</option>
              <option value="failed">Thất bại</option>
              <option value="refunded">Đã hoàn tiền</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-slate-400 mx-auto mb-3 animate-spin" />
            <p className="text-slate-600">Đang tải...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">Không có giao dịch nào</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Học sinh</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Số tiền</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Phương thức</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Loại</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Trạng thái</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Ngày tạo</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{payment.student_name || 'N/A'}</div>
                    <div className="text-sm text-slate-500">{payment.description || payment.payment_type}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">
                      {formatCurrency(payment.amount, payment.currency)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{payment.payment_method}</td>
                  <td className="px-6 py-4 text-slate-700">{payment.payment_type}</td>
                  <td className="px-6 py-4">{getStatusBadge(payment.status)}</td>
                  <td className="px-6 py-4 text-slate-700">
                    {new Date(payment.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {payment.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(payment.id, 'paid')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="Đánh dấu đã thanh toán"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <PermissionGuard permission="PAYMENT_MANAGE">
                        <button
                          onClick={() => handleDelete(payment.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </PermissionGuard>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
