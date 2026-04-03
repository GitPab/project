import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, Phone, Video, MoreVertical, Check, CheckCheck, Image as ImageIcon, Smile, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'counselor' | 'admin';
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: { url: string; name: string; type: string }[];
}

interface Counselor {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  isOnline: boolean;
  lastSeen?: string;
}

export default function StudentLiveChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock counselors for demo
  useEffect(() => {
    setCounselors([
      {
        id: 'counselor-1',
        name: 'Nguyễn Thị Hương',
        avatar: 'H',
        specialty: 'Tư vấn visa D2, D4',
        isOnline: true
      },
      {
        id: 'counselor-2',
        name: 'Trần Văn Minh',
        avatar: 'M',
        specialty: 'Chuyên gia học bổng',
        isOnline: false,
        lastSeen: '10 phút trước'
      },
      {
        id: 'counselor-3',
        name: 'Lê Thị Lan',
        avatar: 'L',
        specialty: 'Hỗ trợ nhà ở Hàn Quốc',
        isOnline: true
      }
    ]);
  }, []);

  // Auto-select first counselor
  useEffect(() => {
    if (counselors.length > 0 && !selectedCounselor) {
      setSelectedCounselor(counselors[0]);
    }
  }, [counselors, selectedCounselor]);

  // Simulate initial messages
  useEffect(() => {
    if (selectedCounselor) {
      setMessages([
        {
          id: '1',
          senderId: selectedCounselor.id,
          senderName: selectedCounselor.name,
          senderRole: 'counselor',
          content: `Xin chào ${user?.name || 'bạn'}! Tôi là ${selectedCounselor.name}, ${selectedCounselor.specialty}. Tôi có thể giúp gì cho bạn hôm nay?`,
          timestamp: new Date().toISOString(),
          isRead: true
        }
      ]);
      setIsConnected(true);
    }
  }, [selectedCounselor, user?.name]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedCounselor) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: user?.id || 'student',
      senderName: user?.name || 'Bạn',
      senderRole: 'student',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
      isRead: false
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    // Simulate typing indicator
    setIsTyping(true);

    // Simulate counselor response after 2-3 seconds
    setTimeout(() => {
      setIsTyping(false);
      const autoReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        senderId: selectedCounselor.id,
        senderName: selectedCounselor.name,
        senderRole: 'counselor',
        content: 'Cảm ơn bạn đã liên hệ! Tôi đã nhận được tin nhắn và sẽ phản hồi sớm nhất có thể. Nếu cần gấp, bạn có thể đặt lịch hẹn tư vấn trực tiếp.',
        timestamp: new Date().toISOString(),
        isRead: true
      };
      setMessages(prev => [...prev, autoReply]);
    }, 2000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-[calc(100vh-200px)] flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Sidebar - Counselor List */}
      <div className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Tư vấn viên</h2>
          <p className="text-sm text-gray-500">Chọn để bắt đầu trò chuyện</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {counselors.map((counselor) => (
            <button
              key={counselor.id}
              onClick={() => setSelectedCounselor(counselor)}
              className={`w-full p-4 flex items-center gap-3 hover:bg-gray-100 transition-colors text-left ${
                selectedCounselor?.id === counselor.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  {counselor.avatar}
                </div>
                {counselor.isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{counselor.name}</p>
                <p className="text-sm text-gray-500 truncate">{counselor.specialty}</p>
                <p className={`text-xs ${counselor.isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                  {counselor.isOnline ? 'Đang trực tuyến' : counselor.lastSeen}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 bg-blue-50">
          <p className="text-sm text-blue-800 font-medium mb-1">Cần tư vấn chuyên sâu?</p>
          <a 
            href="/student/appointments" 
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Đặt lịch hẹn tại đây →
          </a>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        {selectedCounselor && (
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  {selectedCounselor.avatar}
                </div>
                {selectedCounselor.isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selectedCounselor.name}</p>
                <p className="text-sm text-gray-500">
                  {selectedCounselor.isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title="Gọi điện">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title="Gọi video">
                <Video className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message, index) => {
            const isStudent = message.senderRole === 'student';
            const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;

            return (
              <div
                key={message.id}
                className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[70%] ${isStudent ? 'flex-row-reverse' : ''}`}>
                  {showAvatar && !isStudent && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {message.senderName.charAt(0)}
                    </div>
                  )}
                  {showAvatar && isStudent && (
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {message.senderName.charAt(0)}
                    </div>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isStudent
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <div className={`flex items-center gap-1 mt-1 ${isStudent ? 'justify-end' : ''}`}>
                      <span className={`text-xs ${isStudent ? 'text-blue-200' : 'text-gray-400'}`}>
                        {formatTime(message.timestamp)}
                      </span>
                      {isStudent && (
                        <span className="text-blue-200">
                          {message.isRead ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                  {selectedCounselor?.avatar}
                </div>
                <div className="px-4 py-2 bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500" title="Đính kèm">
              <Paperclip className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500" title="Ảnh">
              <ImageIcon className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500" title="Emoji">
              <Smile className="w-5 h-5" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
