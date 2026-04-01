import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermission, PermissionGuard } from './PermissionGuard';
import { toast } from 'sonner';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  RefreshCw, 
  Download,
  Upload,
  X,
  AlertTriangle,
  Filter
} from 'lucide-react';
import api from '../services/api';
import type { University } from '../context/AppContext';

interface BulkOperationsPanelProps {
  universities: University[];
  onRefresh: () => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
}

export default function BulkOperationsPanel({ 
  universities, 
  onRefresh, 
  selectedIds, 
  setSelectedIds 
}: BulkOperationsPanelProps) {
  const { hasPermission } = usePermission();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  const canDelete = hasPermission('university:delete');
  const canEdit = hasPermission('university:edit');
  
  const selectedUniversities = universities.filter(u => selectedIds.includes(u.id));
  const allSelected = selectedIds.length === universities.length && universities.length > 0;
  const someSelected = selectedIds.length > 0 && selectedIds.length < universities.length;
  
  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(universities.map(u => u.id));
    }
  };
  
  const handleBulkDelete = async () => {
    if (!confirm(`Bạn có chắc muốn xóa ${selectedIds.length} trường đã chọn?`)) return;
    
    setIsDeleting(true);
    try {
      const promises = selectedIds.map(id => 
        api.delete(`/universities/${id}`)
      );
      await Promise.all(promises);
      toast.success(`Đã xóa ${selectedIds.length} trường`);
      setSelectedIds([]);
      onRefresh();
    } catch (error) {
      toast.error('Không thể xóa một số trường');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleBulkRestore = async () => {
    setIsRestoring(true);
    try {
      const promises = selectedIds.map(id => 
        api.patch(`/universities/${id}/restore`)
      );
      await Promise.all(promises);
      toast.success(`Đã khôi phục ${selectedIds.length} trường`);
      setSelectedIds([]);
      onRefresh();
    } catch (error) {
      toast.error('Không thể khôi phục một số trường');
    } finally {
      setIsRestoring(false);
    }
  };
  
  const handleExportCSV = () => {
    const data = selectedUniversities.map(u => ({
      id: u.id,
      name: u.name,
      koreanName: u.koreanName,
      region: u.region,
      country: u.country,
      topTier: u.koreanData?.topTier,
      isActive: u.is_active
    }));
    
    const headers = ['ID', 'Tên', 'Tên tiếng Hàn', 'Khu vực', 'Quốc gia', 'Hạng', 'Trạng thái'];
    const csv = [
      headers.join(','),
      ...data.map(row => [
        row.id,
        `"${row.name}"`,
        `"${row.koreanName || ''}"`,
        `"${row.region || ''}"`,
        row.country,
        row.topTier,
        row.isActive !== false ? 'Hoạt động' : 'Đã xóa'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `universities_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success(`Đã xuất ${selectedIds.length} trường`);
    setShowExportModal(false);
  };
  
  if (selectedIds.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <Square size={20} />
            <span className="text-sm">Chọn tất cả</span>
          </button>
          <span className="text-sm text-gray-500">
            {universities.length} trường
          </span>
        </div>
        
        <PermissionGuard permission="university:export">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Download size={16} />
            Xuất CSV
          </button>
        </PermissionGuard>
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-blue-700 hover:text-blue-900"
            >
              {allSelected ? <CheckSquare size={20} /> : <Square size={20} />}
              <span className="text-sm font-medium">
                {selectedIds.length} trường đã chọn
              </span>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <PermissionGuard permission="university:export">
              <button
                onClick={() => setShowExportModal(true)}
                disabled={selectedIds.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 rounded-lg disabled:opacity-50"
              >
                <Download size={16} />
                Xuất CSV
              </button>
            </PermissionGuard>
            
            {canEdit && (
              <button
                onClick={handleBulkRestore}
                disabled={isRestoring || selectedIds.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-green-700 bg-green-100 hover:bg-green-200 rounded-lg disabled:opacity-50"
              >
                <RefreshCw size={16} className={isRestoring ? 'animate-spin' : ''} />
                Khôi phục
              </button>
            )}
            
            {canDelete && (
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting || selectedIds.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-700 bg-red-100 hover:bg-red-200 rounded-lg disabled:opacity-50"
              >
                <Trash2 size={16} />
                {isDeleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            )}
            
            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Download size={24} className="text-blue-600" />
              <h3 className="text-lg font-semibold">Xuất dữ liệu</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Bạn sắp xuất <strong>{selectedIds.length}</strong> trường ra file CSV. 
              File sẽ bao gồm: ID, Tên, Tên tiếng Hàn, Khu vực, Quốc gia, Hạng, Trạng thái.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Xuất CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
