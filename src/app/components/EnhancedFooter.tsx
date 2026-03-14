import React from 'react';
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, Globe } from 'lucide-react';
import TBTLogo from './TBTLogo';

interface EnhancedFooterProps {
  className?: string;
}

export default function EnhancedFooter({ className = '' }: EnhancedFooterProps) {
  const socialLinks = [
    {
      icon: <Facebook className="w-5 h-5" />,
      href: "https://facebook.com/duhoccost",
      label: "Facebook"
    },
    {
      icon: <Instagram className="w-5 h-5" />,
      href: "https://instagram.com/duhoccost",
      label: "Instagram"
    },
    {
      icon: <Youtube className="w-5 h-5" />,
      href: "https://youtube.com/duhoccost",
      label: "YouTube"
    }
  ];

  const contactInfo = [
    {
      icon: <Phone className="w-4 h-4" />,
      text: "+84-123-456-789",
      label: "Hotline"
    },
    {
      icon: <Mail className="w-4 h-4" />,
      text: "info@duhoccost.vn",
      label: "Email"
    },
    {
      icon: <MapPin className="w-4 h-4" />,
      text: "Hà Nội, Đà Nẵng, TP.HCM",
      label: "Văn phòng"
    },
    {
      icon: <Globe className="w-4 h-4" />,
      text: "www.duhoccost.vn",
      label: "Website"
    }
  ];

  const quickLinks = [
    {
      text: "Về chúng tôi",
      href: "/about"
    },
    {
      text: "Dịch vụ",
      href: "/services"
    },
    {
      text: "Tin tức",
      href: "/news"
    },
    {
      text: "Liên hệ",
      href: "/contact"
    }
  ];

  return (
    <footer className={`bg-white border-t-2 border-[#558EFF] ${className}`}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <TBTLogo size="md" variant="icon-only" />
              <div>
                <h3 className="font-bold text-[#003AB7] text-lg font-['Be_Vietnam_Pro']">
                  Du Học Cost
                </h3>
                <p className="text-sm text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                  TBT Group
                </p>
              </div>
            </div>
            <p className="text-sm text-[#4D4D4D] leading-relaxed font-['Be_Vietnam_Pro']">
              Đơn vị hàng đầu Việt Nam về tư vấn và hỗ trợ du học Hàn Quốc với hơn 10 năm kinh nghiệm.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-[#003AB7] mb-4 font-['Be_Vietnam_Pro']">
              Liên Kết Nhanh
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="text-sm text-[#4D4D4D] hover:text-[#003AB7] transition-colors font-['Be_Vietnam_Pro']"
                  >
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold text-[#003AB7] mb-4 font-['Be_Vietnam_Pro']">
              Thông Tin Liên Hệ
            </h4>
            <div className="space-y-3">
              {contactInfo.map((info, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="text-[#558EFF]">
                    {info.icon}
                  </div>
                  <div>
                    <p className="text-xs text-[#6C757D] font-['Be_Vietnam_Pro']">
                      {info.label}
                    </p>
                    <p className="text-sm text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                      {info.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="font-bold text-[#003AB7] mb-4 font-['Be_Vietnam_Pro']">
              Theo Dõi Chúng Tôi
            </h4>
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-[#F8F9FA] border border-[#558EFF] rounded-lg flex items-center justify-center text-[#558EFF] hover:bg-[#003AB7] hover:text-white transition-all group"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[#558EFF]/20 pt-8 text-center">
          <p className="text-sm text-[#4D4D4D] italic font-['Be_Vietnam_Pro'] leading-relaxed">
            Bản quyền của Công Ty Cổ Phần Quốc Tế TBT GROUP<br />
            Giấy chứng nhận Đăng ký Kinh doanh số 0110863947 do Sở Kế hoạch và Đầu tư Thành phố Hà Nội cấp ngày 24/01/2025<br />
            Giấy chứng nhận hoạt động đào tạo, bồi dưỡng do Sở Giáo Dục và Đào Tạo Thành Phố Hà Nội cấp ngày 21/04/2021
          </p>
        </div>
      </div>
    </footer>
  );
}
