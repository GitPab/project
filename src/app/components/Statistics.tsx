import React, { useEffect, useState } from 'react';
import { GraduationCap, Users, Globe, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';
// Note: User data will come from API in future - currently using fallback
// import { getAllUsers } from '../services/sqliteDatabase';

interface StatProps {
  icon: React.ReactNode;
  number: string;
  label: string;
  color?: string;
}

const StatCard: React.FC<StatProps> = ({ icon, number, label, color = '#003AB7' }) => (
  <div className="bg-white rounded-[20px] border-2 border-[#558EFF] shadow-[14px_22px_25px_-9px_rgba(85,142,255,0.25)] p-6 text-center group hover:shadow-xl transition-all">
    <div className="w-16 h-16 bg-gradient-to-br from-[#003AB7] to-[#558EFF] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
      <div className="text-white">
        {icon}
      </div>
    </div>
    <div className="text-3xl font-bold text-[#003AB7] mb-2 font-['Be_Vietnam_Pro']">
      {number}
    </div>
    <div className="text-sm text-[#4D4D4D] font-['Be_Vietnam_Pro']">
      {label}
    </div>
  </div>
);

interface StatisticsProps {
  className?: string;
}

export default function Statistics({ className = '' }: StatisticsProps) {
  const { universities } = useApp();
  const [studentCount, setStudentCount] = useState(0);
  const [avgRating, setAvgRating] = useState(4.8);

  useEffect(() => {
    // Note: User stats will come from API in future
    // For now, using fallback static data
    setStudentCount(1000);
  }, []);

  const stats = [
    {
      icon: <GraduationCap className="w-8 h-8" />,
      number: `${universities.length}+`,
      label: "Trường Đại Học",
      color: "#003AB7"
    },
    {
      icon: <Users className="w-8 h-8" />,
      number: studentCount > 0 ? `${studentCount.toLocaleString()}+` : "1000+",
      label: "Sinh Viên Việt Nam",
      color: "#558EFF"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      number: "95%",
      label: "Tỷ Lệ Visa Thành Công",
      color: "#28A745"
    },
    {
      icon: <Award className="w-8 h-8" />,
      number: `${avgRating.toFixed(1)}/5.0`,
      label: "Điểm Hài Lòng Trung Bình",
      color: "#FFC107"
    }
  ];

  return (
    <div className={`py-16 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#003AB7] mb-4 font-['Be_Vietnam_Pro']">
            Số Liệu Nổi Bật
          </h2>
          <p className="text-lg text-[#4D4D4D] font-['Be_Vietnam_Pro']">
            Những con số biết nói về thành công của chúng tôi
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              number={stat.number}
              label={stat.label}
              color={stat.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
