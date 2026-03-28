import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, GraduationCap, Calendar, Award, FileText, TrendingUp, Clock, DollarSign, Target, X } from 'lucide-react';

interface StudentInfoSidebarProps {
  className?: string;
  student?: {
    name: string;
    email: string;
    phone: string;
    university: string;
    program: string;
    startDate: string;
    status: string;
    gpa?: string;
    totalCost?: string;
    remainingCost?: string;
    nextPayment?: string;
    progress?: number;
  };
  onStudentUpdate?: (updatedStudent: any) => void;
}

export default function StudentInfoSidebar({ className = '', student, onStudentUpdate }: StudentInfoSidebarProps) {
  const defaultStudent = {
    name: "Nguyễn Văn A",
    email: "nguyenvana@email.com",
    phone: "+84-123-456-789",
    university: "Konkuk University",
    program: "Du học D4-1",
    startDate: "09/2023",
    status: "active",
    gpa: "3.2",
    totalCost: "₩15,000,000",
    remainingCost: "₩8,500,000",
    nextPayment: "15/03/2025",
    progress: 65
  };
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<StudentInfoSidebarProps['student']>(student || defaultStudent);
  
  const studentData = student || defaultStudent;

  const statusColors = {
    'active': 'bg-green-100 text-green-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-blue-100 text-blue-800'
  };

  const handleViewDetails = () => {
    window.location.href = '/#/student/my-costs';
  };

  const handleEditClick = () => {
    setEditForm(studentData);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (onStudentUpdate) {
      onStudentUpdate(editForm);
    }
    setIsEditModalOpen(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => prev ? { ...prev, [field]: value } : { ...defaultStudent, [field]: value });
  };

  return (
    <div className={`bg-white rounded-[20px] border-2 border-[#558EFF] shadow-[14px_22px_25px_-9px_rgba(85,142,255,0.25)] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#003AB7] to-[#558EFF] p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-[#003AB7]" />
          </div>
          <div className="text-white">
            <h3 className="font-bold text-lg font-['Be_Vietnam_Pro']">{studentData.name}</h3>
            <p className="text-sm opacity-90 font-['Be_Vietnam_Pro']">{studentData.university}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[studentData.status as keyof typeof statusColors] || statusColors.active} font-['Be_Vietnam_Pro']`}>
            {studentData.status === 'active' ? 'Đang học' : studentData.status === 'pending' ? 'Chờ xử lý' : 'Đã tốt nghiệp'}
          </span>
        </div>

        {/* Personal Info */}
        <div className="space-y-3">
          <h4 className="font-bold text-[#003AB7] text-sm font-['Be_Vietnam_Pro'] flex items-center gap-2">
            <User className="w-4 h-4" />
            Thông tin cá nhân
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#558EFF]" />
              <span className="text-sm text-[#4D4D4D] font-['Be_Vietnam_Pro']">{studentData.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#558EFF]" />
              <span className="text-sm text-[#4D4D4D] font-['Be_Vietnam_Pro']">{studentData.phone}</span>
            </div>
          </div>
        </div>

        {/* Academic Info */}
        <div className="space-y-3">
          <h4 className="font-bold text-[#003AB7] text-sm font-['Be_Vietnam_Pro'] flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Thông tin học tập
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#558EFF]" />
              <div>
                <p className="text-xs text-[#6C757D] font-['Be_Vietnam_Pro']">Chương trình</p>
                <p className="text-sm font-medium text-[#003AB7] font-['Be_Vietnam_Pro']">{studentData.program}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#558EFF]" />
              <div>
                <p className="text-xs text-[#6C757D] font-['Be_Vietnam_Pro']">Bắt đầu</p>
                <p className="text-sm font-medium text-[#003AB7] font-['Be_Vietnam_Pro']">{studentData.startDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#558EFF]" />
              <div>
                <p className="text-xs text-[#6C757D] font-['Be_Vietnam_Pro']">GPA</p>
                <p className="text-sm font-medium text-[#003AB7] font-['Be_Vietnam_Pro']">{studentData.gpa}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Info */}
        <div className="space-y-3">
          <h4 className="font-bold text-[#003AB7] text-sm font-['Be_Vietnam_Pro'] flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Chi phí
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#4D4D4D] font-['Be_Vietnam_Pro']">Tổng chi phí</span>
              <span className="text-sm font-bold text-[#003AB7] font-['Be_Vietnam_Pro']">{studentData.totalCost}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#4D4D4D] font-['Be_Vietnam_Pro']">Còn lại</span>
              <span className="text-sm font-bold text-[#FF6B6B] font-['Be_Vietnam_Pro']">{studentData.remainingCost}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#558EFF]" />
              <div>
                <p className="text-xs text-[#6C757D] font-['Be_Vietnam_Pro']">Thanh toán tiếp theo</p>
                <p className="text-sm font-medium text-[#003AB7] font-['Be_Vietnam_Pro']">{studentData.nextPayment}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <h4 className="font-bold text-[#003AB7] text-sm font-['Be_Vietnam_Pro'] flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Tiến độ
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#4D4D4D] font-['Be_Vietnam_Pro']">Hoàn thành</span>
              <span className="text-sm font-bold text-[#003AB7] font-['Be_Vietnam_Pro']">{studentData.progress}%</span>
            </div>
            
            <div className="w-full bg-[#F8F9FA] rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#003AB7] to-[#558EFF] h-2 rounded-full transition-all duration-300"
                style={{ width: `${studentData.progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2 pt-4 border-t border-[#558EFF]/20">
          <button 
            onClick={handleViewDetails}
            className="w-full bg-[#003AB7] text-white py-2 rounded-lg hover:bg-[#002A8F] transition-all text-sm font-['Be_Vietnam_Pro']"
          >
            Xem chi tiết
          </button>
          <button 
            onClick={handleEditClick}
            className="w-full bg-[#F8F9FA] text-[#003AB7] py-2 rounded-lg hover:bg-[#003AB7] hover:text-white transition-all text-sm font-['Be_Vietnam_Pro'] border border-[#558EFF]"
          >
            Chỉnh sửa thông tin
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#003AB7] font-['Be_Vietnam_Pro']">Chỉnh sửa thông tin</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4D4D4D] mb-1 font-['Be_Vietnam_Pro']">Họ và tên</label>
                <input
                  type="text"
                  value={(editForm!).name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-[#558EFF]/30 rounded-lg focus:outline-none focus:border-[#003AB7] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4D4D4D] mb-1 font-['Be_Vietnam_Pro']">Email</label>
                <input
                  type="email"
                  value={(editForm!).email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-[#558EFF]/30 rounded-lg focus:outline-none focus:border-[#003AB7] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4D4D4D] mb-1 font-['Be_Vietnam_Pro']">Số điện thoại</label>
                <input
                  type="tel"
                  value={(editForm!).phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-[#558EFF]/30 rounded-lg focus:outline-none focus:border-[#003AB7] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4D4D4D] mb-1 font-['Be_Vietnam_Pro']">Trường</label>
                <input
                  type="text"
                  value={(editForm!).university || ''}
                  onChange={(e) => handleInputChange('university', e.target.value)}
                  className="w-full px-3 py-2 border border-[#558EFF]/30 rounded-lg focus:outline-none focus:border-[#003AB7] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4D4D4D] mb-1 font-['Be_Vietnam_Pro']">Chương trình</label>
                <select
                  value={(editForm!).program || ''}
                  onChange={(e) => handleInputChange('program', e.target.value)}
                  className="w-full px-3 py-2 border border-[#558EFF]/30 rounded-lg focus:outline-none focus:border-[#003AB7] text-sm"
                >
                  <option value="Du học D4-1">Du học D4-1</option>
                  <option value="Du học D2-2">Du học D2-2</option>
                  <option value="Du học D2-3">Du học D2-3</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2 border border-[#558EFF] text-[#003AB7] rounded-lg hover:bg-[#F8F9FA] transition-all text-sm font-['Be_Vietnam_Pro']"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-2 bg-[#003AB7] text-white rounded-lg hover:bg-[#002A8F] transition-all text-sm font-['Be_Vietnam_Pro']"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
