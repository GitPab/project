import React, { useState, useEffect } from 'react';
import { User, MapPin, GraduationCap, Calendar, Award, Phone, Mail } from 'lucide-react';

interface StudentInfoCardProps {
  name?: string;
  university?: string;
  program?: string;
  startDate?: string;
  status?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  className?: string;
}

interface StudentProfile {
  fullName: string;
  phone: string;
  email?: string;
  university?: string;
  program?: string;
  startDate?: string;
  status?: string;
}

export default function StudentInfoCard({
  name: propName,
  university: propUniversity,
  program: propProgram,
  startDate: propStartDate,
  status: propStatus,
  phone: propPhone,
  email: propEmail,
  avatar,
  className = ''
}: StudentInfoCardProps) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  // Load from localStorage/sessionStorage if props not provided
  useEffect(() => {
    if (!propName || !propPhone) {
      // Try sessionStorage first (from QuickSearchForm)
      const sessionData = sessionStorage.getItem('quickSearch');
      if (sessionData) {
        try {
          const parsed = JSON.parse(sessionData);
          setProfile({
            fullName: parsed.fullName || '',
            phone: parsed.phone || '',
            email: parsed.email || '',
            university: parsed.university || 'Chưa chọn trường',
            program: parsed.visaSystem || 'Chưa chọn chương trình',
            startDate: parsed.startDate || new Date().toLocaleDateString('vi-VN'),
            status: 'pending'
          });
          return;
        } catch (e) {
          console.error('Failed to parse sessionStorage:', e);
        }
      }

      // Try localStorage (from registered student profile)
      const localData = localStorage.getItem('studentProfile');
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          setProfile({
            fullName: parsed.fullName || parsed.name || '',
            phone: parsed.phone || '',
            email: parsed.email || '',
            university: parsed.university || 'Chưa chọn trường',
            program: parsed.program || parsed.visaSystem || 'Chưa chọn chương trình',
            startDate: parsed.startDate || new Date().toLocaleDateString('vi-VN'),
            status: parsed.status || 'pending'
          });
        } catch (e) {
          console.error('Failed to parse localStorage:', e);
        }
      }
    }
  }, [propName, propPhone]);

  // Use props if provided, otherwise use loaded profile
  const name = propName || profile?.fullName || 'Chưa có thông tin';
  const university = propUniversity || profile?.university || 'Chưa chọn trường';
  const program = propProgram || profile?.program || 'Chưa chọn chương trình';
  const startDate = propStartDate || profile?.startDate || new Date().toLocaleDateString('vi-VN');
  const status = propStatus || profile?.status || 'pending';
  const phone = propPhone || profile?.phone || 'Chưa có SĐT';
  const email = propEmail || profile?.email || 'Chưa có email';
  const statusColors = {
    'active': 'bg-green-100 text-green-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-blue-100 text-blue-800'
  };

  return (
    <div className={`bg-white rounded-[20px] border-2 border-[#558EFF] shadow-[14px_22px_25px_-9px_rgba(85,142,255,0.25)] overflow-hidden hover:shadow-xl transition-all ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#003AB7] to-[#558EFF] p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-[#003AB7]" />
          </div>
          <div className="text-white">
            <h3 className="font-bold text-lg font-['Be_Vietnam_Pro']">{name}</h3>
            <p className="text-sm opacity-90 font-['Be_Vietnam_Pro']">{university}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[status as keyof typeof statusColors] || statusColors.active} font-['Be_Vietnam_Pro']`}>
            {status === 'active' ? 'Đang học' : status === 'pending' ? 'Chờ xử lý' : 'Đã tốt nghiệp'}
          </span>
        </div>

        {/* Program Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-4 h-4 text-[#558EFF]" />
            <div>
              <p className="text-xs text-[#6C757D] font-['Be_Vietnam_Pro']">Chương trình</p>
              <p className="text-sm font-medium text-[#003AB7] font-['Be_Vietnam_Pro']">{program}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-[#558EFF]" />
            <div>
              <p className="text-xs text-[#6C757D] font-['Be_Vietnam_Pro']">Bắt đầu</p>
              <p className="text-sm font-medium text-[#003AB7] font-['Be_Vietnam_Pro']">{startDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-[#558EFF]" />
            <div>
              <p className="text-xs text-[#6C757D] font-['Be_Vietnam_Pro']">Địa điểm</p>
              <p className="text-sm font-medium text-[#003AB7] font-['Be_Vietnam_Pro']">Seoul, Hàn Quốc</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="border-t border-[#558EFF]/20 pt-4 space-y-2">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#558EFF]" />
            <span className="text-sm text-[#4D4D4D] font-['Be_Vietnam_Pro']">{phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#558EFF]" />
            <span className="text-sm text-[#4D4D4D] font-['Be_Vietnam_Pro']">{email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
