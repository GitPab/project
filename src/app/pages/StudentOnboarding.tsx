import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { UserPlus, GraduationCap, Phone, Mail, BookOpen, Globe } from 'lucide-react';
import { createTrackingCode } from '../services/trackingCodeSqliteService';
import { generateUniqueTrackingCode } from '../services/trackingCodeService';

export default function StudentOnboarding() {
  const { universities, addStudentOnboarding, user } = useApp();
  const { formatFrom, convertAmount } = useCurrency();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: user?.email || '',
    desiredUniversity: '',
    visaSystem: '',
    topikLevel: '',
    ieltsScore: '',
    notes: ''
  });

  const countWords = (text: string) =>
    text.trim().length === 0 ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
  const notesWordCount = countWords(formData.notes);
  const notesTooLong = notesWordCount > 250;

  // Filter to only Korean universities with visa systems
  const koreanUniversities = universities.filter(u => u.koreanData?.isKoreanUniversity);

  // Get selected university
  const selectedUniversity = universities.find(u => u.id === formData.desiredUniversity);

  // Calculate initial total cost
  const calculateInitialCost = (): number => {
    if (!selectedUniversity) return 0;

    let total = 0;

    // Fixed costs
    if (selectedUniversity.fixedCosts) {
      selectedUniversity.fixedCosts.forEach(cost => {
        const amountInVND = convertAmount(cost.amount, 'VND', (cost.currency || 'VND') as 'VND');
        total += amountInVND;
      });
    }

    // Visa system costs (estimate based on selected visa)
    if (selectedUniversity.koreanData?.visaSystems && formData.visaSystem) {
      const visaSystem = selectedUniversity.koreanData.visaSystems.find(
        v => v.visaType === formData.visaSystem
      );
      
      if (visaSystem) {
        // Application fee
        if (visaSystem.applicationFee) {
          total += convertAmount(visaSystem.applicationFee, 'VND', 'VND');
        }
        
        // Tuition (estimate per term or range average)
        if (visaSystem.tuitionPerTerm) {
          total += convertAmount(visaSystem.tuitionPerTerm, 'VND', 'VND');
        } else if (visaSystem.tuitionRange) {
          const avgTuition = (visaSystem.tuitionRange.min + visaSystem.tuitionRange.max) / 2;
          total += convertAmount(avgTuition, 'VND', 'VND');
        }
        
        // Base yearly fee
        if (visaSystem.baseYearlyFee) {
          total += convertAmount(visaSystem.baseYearlyFee, 'VND', 'VND');
        }

        // Enrollment fee
        if (visaSystem.enrollmentFee) {
          total += convertAmount(visaSystem.enrollmentFee, 'VND', 'VND');
        }
      }
    }

    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.phone || !formData.email || !formData.desiredUniversity || !formData.visaSystem) {
      toast.error(language === 'vi' ? 'Vui lòng điền đầy đủ thông tin bắt buộc' : 
                  language === 'ko' ? '필수 정보를 모두 입력해주세요' :
                  'Please fill in all required fields');
      return;
    }

    if (notesTooLong) {
      toast.error(
        language === 'vi'
          ? 'Ghi chú tối đa 250 từ'
          : language === 'ko'
            ? '메모는 최대 250단어입니다'
            : 'Notes must be at most 250 words',
      );
      return;
    }

    const initialCost = calculateInitialCost();
    const selectedUni = universities.find(u => u.id === formData.desiredUniversity);

    // Generate unique tracking code
    let trackingCode = '';
    try {
      trackingCode = await generateUniqueTrackingCode();
    } catch (err) {
      console.error('Failed to generate tracking code:', err);
      toast.error(language === 'vi' ? 'Lỗi tạo mã theo dõi' : 'Failed to generate tracking code');
      return;
    }

    // Save to SQLite database (persisted)
    const savedCode = await createTrackingCode({
      code: trackingCode,
      student_email: formData.email,
      student_name: formData.name,
      student_phone: formData.phone,
      desired_university_id: formData.desiredUniversity,
      desired_university_name: selectedUni?.name || '',
      visa_system: formData.visaSystem,
      topik_level: formData.topikLevel || '',
      ielts_score: formData.ieltsScore || '',
      initial_total_cost_vnd: Math.round(initialCost),
      status: 'pending',
      notes: formData.notes || `TOPIK Level: ${formData.topikLevel}, System: ${formData.visaSystem}`
    });

    if (!savedCode) {
      toast.error(language === 'vi' ? 'Lỗi lưu dữ liệu' : 'Failed to save data');
      return;
    }

    // Also save to React state (for immediate UI updates)
    addStudentOnboarding({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      desiredUniversity: formData.desiredUniversity,
      visaSystem: formData.visaSystem,
      topikLevel: formData.topikLevel || undefined,
      ieltsScore: formData.ieltsScore || undefined,
      initialTotalCost: initialCost,
      notes: formData.notes || undefined
    });

    toast.success(language === 'vi' ? 'Đã gửi thông tin thành công!' :
                  language === 'ko' ? '정보가 성공적으로 제출되었습니다!' :
                  'Information submitted successfully!');

    // Navigate to tracking page with the generated code
    navigate(`/student/tracking/${trackingCode}`);
  };

  const initialCost = calculateInitialCost();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <UserPlus className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">
            {language === 'vi' ? 'Đăng ký tư vấn du học' :
             language === 'ko' ? '유학 상담 신청' :
             'Study Abroad Consultation'}
          </h1>
        </div>
        <p className="text-gray-600">
          {language === 'vi' ? 'Điền thông tin của bạn để nhận tư vấn chi tiết về chi phí du học' :
           language === 'ko' ? '유학 비용에 대한 자세한 상담을 받으려면 정보를 입력하세요' :
           'Fill in your information to receive detailed consultation about study abroad costs'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              {language === 'vi' ? 'Thông tin cá nhân' :
               language === 'ko' ? '개인 정보' :
               'Personal Information'}
            </CardTitle>
            <CardDescription>
              {language === 'vi' ? 'Thông tin liên hệ của bạn' :
               language === 'ko' ? '연락처 정보' :
               'Your contact information'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {language === 'vi' ? 'Họ và tên' :
                   language === 'ko' ? '이름' :
                   'Full Name'} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={language === 'vi' ? 'Nguyễn Văn A' :
                               language === 'ko' ? '홍길동' :
                               'John Doe'}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {language === 'vi' ? 'Số điện thoại' :
                   language === 'ko' ? '전화번호' :
                   'Phone Number'} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+84 123 456 789"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@example.com"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              {language === 'vi' ? 'Thông tin học thuật' :
               language === 'ko' ? '학업 정보' :
               'Academic Information'}
            </CardTitle>
            <CardDescription>
              {language === 'vi' ? 'Chọn trường và hệ visa mong muốn' :
               language === 'ko' ? '희망 대학 및 비자 시스템 선택' :
               'Choose your desired university and visa system'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="university" className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                {language === 'vi' ? 'Trường đại học mong muốn' :
                 language === 'ko' ? '희망 대학' :
                 'Desired University'} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.desiredUniversity}
                onValueChange={(value) => setFormData({ ...formData, desiredUniversity: value, visaSystem: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    language === 'vi' ? 'Chọn trường đại học' :
                    language === 'ko' ? '대학 선택' :
                    'Select university'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {koreanUniversities.map((uni) => (
                    <SelectItem key={uni.id} value={uni.id}>
                      {uni.name} - {uni.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUniversity && selectedUniversity.koreanData?.visaSystems && (
              <div className="space-y-2">
                <Label htmlFor="visaSystem" className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {language === 'vi' ? 'Hệ visa' :
                   language === 'ko' ? '비자 시스템' :
                   'Visa System'} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.visaSystem}
                  onValueChange={(value) => setFormData({ ...formData, visaSystem: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      language === 'vi' ? 'Chọn hệ visa' :
                      language === 'ko' ? '비자 시스템 선택' :
                      'Select visa system'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedUniversity.koreanData.visaSystems.map((visa) => (
                      <SelectItem key={visa.visaType} value={visa.visaType}>
                        {visa.visaType} - {visa.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="topik">
                  {language === 'vi' ? 'Trình độ TOPIK' :
                   language === 'ko' ? 'TOPIK 레벨' :
                   'TOPIK Level'}
                </Label>
                <Select
                  value={formData.topikLevel}
                  onValueChange={(value) => setFormData({ ...formData, topikLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      language === 'vi' ? 'Chọn trình độ' :
                      language === 'ko' ? '레벨 선택' :
                      'Select level'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {language === 'vi' ? 'Chưa có' :
                       language === 'ko' ? '없음' :
                       'None'}
                    </SelectItem>
                    {[1, 2, 3, 4, 5, 6].map(level => (
                      <SelectItem key={level} value={level.toString()}>
                        TOPIK {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ielts">
                  {language === 'vi' ? 'Điểm IELTS' :
                   language === 'ko' ? 'IELTS 점수' :
                   'IELTS Score'}
                </Label>
                <Input
                  id="ielts"
                  type="text"
                  value={formData.ieltsScore}
                  onChange={(e) => setFormData({ ...formData, ieltsScore: e.target.value })}
                  placeholder="6.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Estimate */}
        {formData.desiredUniversity && formData.visaSystem && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">
                {language === 'vi' ? 'Ước tính chi phí ban đầu' :
                 language === 'ko' ? '초기 비용 예상' :
                 'Initial Cost Estimate'}
              </CardTitle>
              <CardDescription className="text-blue-700">
                {language === 'vi' ? 'Chi phí cơ bản bao gồm phí tư vấn, phí hồ sơ và học phí ước tính' :
                 language === 'ko' ? '기본 비용에는 상담비, 신청비, 예상 수업료가 포함됩니다' :
                 'Basic costs including consulting fees, application fees, and estimated tuition'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">
                {formatFrom(initialCost, 'USD')}
              </div>
              <p className="text-sm text-blue-700 mt-2">
                {language === 'vi' ? '* Đây là chi phí ước tính ban đầu. Chi phí thực tế có thể thay đổi.' :
                 language === 'ko' ? '* 이것은 초기 예상 비용입니다. 실제 비용은 달라질 수 있습니다.' :
                 '* This is an initial cost estimate. Actual costs may vary.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'vi' ? 'Ghi chú thêm' :
               language === 'ko' ? '추가 메모' :
               'Additional Notes'}
            </CardTitle>
            <CardDescription>
              {language === 'vi' ? 'Bất kỳ câu hỏi hoặc yêu cầu đặc biệt nào' :
               language === 'ko' ? '질문이나 특별 요청사항' :
               'Any questions or special requests'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className={notesTooLong ? 'border-orange-400' : undefined}
              placeholder={
                language === 'vi' ? 'Nhập ghi chú của bạn...' :
                language === 'ko' ? '메모를 입력하세요...' :
                'Enter your notes...'
              }
              rows={4}
            />
            <div className={`mt-2 text-xs ${notesTooLong ? 'text-orange-600' : 'text-slate-500'}`}>
              {notesWordCount} / 250 từ
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button type="submit" size="lg" className="flex-1" disabled={notesTooLong}>
            <UserPlus className="w-5 h-5 mr-2" />
            {language === 'vi' ? 'Gửi thông tin' :
             language === 'ko' ? '정보 제출' :
             'Submit Information'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => navigate('/student/universities')}
          >
            {language === 'vi' ? 'Hủy' :
             language === 'ko' ? '취소' :
             'Cancel'}
          </Button>
        </div>
      </form>
    </div>
  );
}
