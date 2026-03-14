import React from 'react';
import { User, MapPin, GraduationCap, Calendar, Award, Phone, Mail } from 'lucide-react';

interface StudentInfoCardProps {
  name: string;
  university: string;
  program: string;
  startDate: string;
  status: string;
  phone: string;
  email: string;
  avatar?: string;
  className?: string;
}

export default function StudentInfoCard({
  name,
  university,
  program,
  startDate,
  status,
  phone,
  email,
  avatar,
  className = ''
}: StudentInfoCardProps) {
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
