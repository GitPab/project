import React from 'react';
import { GraduationCap } from 'lucide-react';
import TBTLogo from './TBTLogo';

interface UniversityPartnersProps {
  className?: string;
}

export default function UniversityPartners({ className = '' }: UniversityPartnersProps) {
  const partners = [
    {
      name: "Konkuk University",
      koreanName: "건국대학교",
      logo: "/img/konkuk-university.jpg",
      description: "Đối tác chiến lược hàng đầu"
    },
    {
      name: "Korea University", 
      koreanName: "고려대학교",
      logo: "/img/konkuk-university.jpg",
      description: "Một trong 3 trường SKY"
    },
    {
      name: "Yonsei University",
      koreanName: "연세대학교", 
      logo: "/img/konkuk-university.jpg",
      description: "Đại học tư thục danh tiếng"
    },
    {
      name: "Sungkyunkwan University",
      koreanName: "성균관대학교",
      logo: "/img/konkuk-university.jpg",
      description: "Đại học nghiên cứu hàng đầu"
    }
  ];

  return (
    <div className={`py-16 bg-[#F8F9FA] ${className}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <TBTLogo size="md" variant="icon-only" />
            <h2 className="text-3xl font-bold text-[#003AB7] font-['Be_Vietnam_Pro']">
              Đối Tác Chiến Lược
            </h2>
          </div>
          <p className="text-lg text-[#4D4D4D] font-['Be_Vietnam_Pro']">
            Các trường đại học hàng đầu Hàn Quốc hợp tác với Du Học Cost
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {partners.map((partner, index) => (
            <div 
              key={index}
              className="bg-white rounded-[20px] border-2 border-[#558EFF] shadow-[14px_22px_25px_-9px_rgba(85,142,255,0.25)] p-6 text-center group hover:shadow-xl transition-all cursor-pointer"
            >
              {/* University Logo */}
              <div className="w-24 h-24 bg-gradient-to-br from-[#003AB7] to-[#558EFF] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-12 h-12 text-white opacity-80" />
              </div>
              
              {/* University Info */}
              <h3 className="font-bold text-[#003AB7] mb-2 font-['Be_Vietnam_Pro'] text-lg">
                {partner.name}
              </h3>
              
              <p className="text-sm text-[#4D4D4D] mb-2 font-['Be_Vietnam_Pro']">
                {partner.koreanName}
              </p>
              
              <p className="text-xs text-[#6C757D] font-['Be_Vietnam_Pro']">
                {partner.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
