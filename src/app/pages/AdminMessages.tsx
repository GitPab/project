import React, { useState, useEffect } from 'react';
import { usePermission, PermissionGuard } from '../components/PermissionGuard';
import { toast } from 'sonner';
import { Search, RefreshCw, Mail, Inbox, Send, Trash2, Plus, Filter, MessageSquare, User, Clock } from 'lucide-react';
import { messageApi } from '../services/api';

interface Message {
  id: string;
  sender_id: string;
  sender_name?: string;
  sender_email?: string;
  recipient_id: string;
  recipient_name?: string;
  recipient_email?: string;
  subject: string;
  content: string;
  is_read: boolean;
  parent_id?: string;
  created_at: string;
}

export default function AdminMessages() {
  const { hasPermission } = usePermission();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'inbox' | 'sent'>('inbox');
  const [refreshing, setRefreshing] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const canManageMessages = hasPermission('MESSAGE_CREATE');

  useEffect(() => {
    fetchMessages();
  }, [filterType]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await messageApi.getAll({ type: filterType, limit: 50 });
      const rows = response.data?.data || response.data || [];
      setMessages(rows);
    } catch (error) {
      toast.error('Không thể tải tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMessages();
    setRefreshing(false);
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('Bạn có chắc muốn xóa tin nhắn này?')) return;

    try {
      await messageApi.delete(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
      toast.success('Đã xóa tin nhắn');
    } catch (error) {
      toast.error('Xóa thất bại');
    }
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await messageApi.create({
        recipient_id: formData.get('recipient_id') as string,
        subject: formData.get('subject') as string,
        content: formData.get('content') as string
      });
      toast.success('Đã gửi tin nhắn');
      setShowCompose(false);
      fetchMessages();
    } catch (error) {
      toast.error('Gửi tin nhắn thất bại');
    }
  };

  const filteredMessages = messages.filter(message => {
    const searchLower = searchTerm.toLowerCase();
    return (
      message.subject?.toLowerCase().includes(searchLower) ||
      message.content?.toLowerCase().includes(searchLower) ||
      message.sender_name?.toLowerCase().includes(searchLower) ||
      message.recipient_name?.toLowerCase().includes(searchLower) ||
      message.sender_email?.toLowerCase().includes(searchLower) ||
      message.recipient_email?.toLowerCase().includes(searchLower)
    );
  });

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tin nhắn nội bộ</h1>
            <p className="text-slate-600 mt-1">Quản lý liên lạc với học sinh và nhân viên</p>
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
            <PermissionGuard permission="MESSAGE_CREATE">
              <button
                onClick={() => setShowCompose(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Soạn tin
              </button>
            </PermissionGuard>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setFilterType('inbox')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              filterType === 'inbox' ? 'bg-blue-100 text-blue-700' : 'bg-white border border-slate-200'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Hộp thư đến
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilterType('sent')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              filterType === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-white border border-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            Đã gửi
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tin nhắn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Message List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-slate-400 mx-auto mb-3 animate-spin" />
            <p className="text-slate-600">Đang tải...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">
              {searchTerm ? 'Không tìm thấy tin nhắn' : 'Không có tin nhắn nào'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                onClick={() => setSelectedMessage(message)}
                className={`p-4 hover:bg-slate-50 cursor-pointer flex items-start gap-4 ${
                  !message.is_read && filterType === 'inbox' ? 'bg-blue-50' : ''
                }`}
              >
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-medium truncate ${!message.is_read && filterType === 'inbox' ? 'text-slate-900' : 'text-slate-700'}`}>
                      {filterType === 'inbox' ? (message.sender_name || message.sender_email) : (message.recipient_name || message.recipient_email)}
                    </h4>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(message.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <h5 className={`text-sm mb-1 ${!message.is_read && filterType === 'inbox' ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                    {message.subject}
                  </h5>
                  <p className="text-sm text-slate-500 truncate">{message.content}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(message.id);
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Soạn tin nhắn mới</h3>
              <button
                onClick={() => setShowCompose(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSendMessage} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Người nhận (ID)</label>
                <input
                  name="recipient_id"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập ID người nhận..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề</label>
                <input
                  name="subject"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập tiêu đề..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung</label>
                <textarea
                  name="content"
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập nội dung tin nhắn..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Gửi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{selectedMessage.subject}</h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                <span className="font-medium">Từ:</span> {selectedMessage.sender_name || selectedMessage.sender_email}
                <span className="mx-2">•</span>
                <span className="font-medium">Đến:</span> {selectedMessage.recipient_name || selectedMessage.recipient_email}
                <span className="mx-2">•</span>
                <Clock className="w-3 h-3" />
                {new Date(selectedMessage.created_at).toLocaleString('vi-VN')}
              </div>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t bg-slate-50">
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-white"
              >
                Đóng
              </button>
              <button
                onClick={() => handleDelete(selectedMessage.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 inline mr-2" />
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
