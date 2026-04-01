import React, { useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import { FeatureAPI } from '../services/featureApi';

interface TestimonialProps {
  name: string;
  university: string;
  story: string;
  rating: number;
  avatar: string;
}

const TestimonialCard: React.FC<TestimonialProps> = ({ name, university, story, rating, avatar }) => (
  <div className="bg-white rounded-[20px] border-2 border-[#558EFF] shadow-[14px_22px_25px_-9px_rgba(85,142,255,0.25)] p-6 hover:shadow-xl transition-all">
    <div className="flex items-start gap-4 mb-4">
      {/* Avatar */}
      <div className="w-16 h-16 bg-gradient-to-br from-[#003AB7] to-[#558EFF] rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-white font-bold text-lg font-['Be_Vietnam_Pro']">
          {name.charAt(0)}
        </span>
      </div>
      
      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-bold text-[#003AB7] font-['Be_Vietnam_Pro']">
            {name}
          </h4>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
        </div>
        <p className="text-sm text-[#4D4D4D] font-['Be_Vietnam_Pro']">
          {university}
        </p>
      </div>
    </div>
    
    {/* Quote */}
    <div className="relative">
      <Quote className="absolute -top-2 -left-2 text-[#558EFF] w-6 h-6 opacity-20" />
      <p className="text-[#4D4D4D] italic font-['Be_Vietnam_Pro'] leading-relaxed pl-6">
        "{story}"
      </p>
    </div>
  </div>
);

interface TestimonialsProps {
  className?: string;
}

export default function Testimonials({ className = '' }: TestimonialsProps) {
  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        // If not logged in, skip API and use static data to avoid 401 spam
        if (!localStorage.getItem('auth_token')) {
          setTestimonials(staticTestimonials);
          return;
        }
        // Try to load from API first
        const response = await FeatureAPI.ServiceFeedback.getAll({ is_resolved: true });
        const feedback = response.feedback || [];
        
        // Filter approved feedback with ratings >= 4
        const approved = feedback
          .filter((f: any) => f.rating >= 4 && f.is_approved)
          .slice(0, 6)
          .map((f: any) => ({
            name: f.student_email?.split('@')[0]?.replace(/\./g, ' ') || 'Học viên',
            university: 'Du học Hàn Quốc',
            story: f.feedback_text,
            rating: f.rating,
            avatar: f.student_email?.charAt(0).toUpperCase() || 'H'
          }));
        
        // Fallback to static if no approved feedback
        if (approved.length === 0) {
          setTestimonials(staticTestimonials);
        } else {
          setTestimonials(approved);
        }
      } catch (error) {
        console.log('Using static testimonials (API not ready)');
        setTestimonials(staticTestimonials);
      }
    };
    loadTestimonials();
  }, []);

  const staticTestimonials = [
    {
      name: "Nguyễn Thị An",
      university: "Konkuk University - Du học D4-1",
      story: "TBT đã giúp tôi hoàn thành ước mơ du học Hàn Quốc. Quy trình tư vấn chuyên nghiệp, hỗ trợ tận tình từ lúc đăng ký đến khi đến Seoul.",
      rating: 5,
      avatar: "NTA"
    },
    {
      name: "Trần Minh Hoàng",
      university: "Korea University - Học bổng TOPIK 5",
      story: "Nhờ sự hướng dẫn của TBT, tôi đã nhận được học bổng 50% học phí. Các thủ tục visa được hỗ trợ rất nhanh chóng.",
      rating: 5,
      avatar: "TMH"
    },
    {
      name: "Lê Thuỳ Trang",
      university: "Yonsei University - Thạc sĩ",
      story: "Tôi rất hài lòng với dịch vụ của TBT. Từ việc chọn trường, chuẩn bị hồ sơ đến tìm nhà ở, mọi thứ đều được hỗ trợ.",
      rating: 4,
      avatar: "LTT"
    }
  ];

  return (
    <div className={`py-16 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#003AB7] mb-4 font-['Be_Vietnam_Pro']">
            Câu Chuyện Thành Công
          </h2>
          <p className="text-lg text-[#4D4D4D] font-['Be_Vietnam_Pro']">
            Những chia sẻ từ sinh viên đã du học thành công
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              name={testimonial.name}
              university={testimonial.university}
              story={testimonial.story}
              rating={testimonial.rating}
              avatar={testimonial.avatar}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
