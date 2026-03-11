import React, { useState } from 'react';
import { useApp, StudentOnboardingData } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  Search,
  User,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  DollarSign,
  Download,
  FileText,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertCircle,
  Filter,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

export default function StudentMonitoring() {
  const { studentOnboardings, universities, updateStudentOnboardingStatus, deleteStudentOnboarding } = useApp();
  const { t, language } = useLanguage();
  const { formatFrom, currency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentOnboardingData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter students based on search and status
  const filteredStudents = studentOnboardings.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: studentOnboardings.length,
    pending: studentOnboardings.filter(s => s.status === 'pending').length,
    inReview: studentOnboardings.filter(s => s.status === 'in-review').length,
    approved: studentOnboardings.filter(s => s.status === 'approved').length,
    contacted: studentOnboardings.filter(s => s.status === 'contacted').length,
    totalCost: studentOnboardings.reduce((sum, s) => sum + s.initialTotalCost, 0)
  };

  // Status badge
  const getStatusBadge = (status: StudentOnboardingData['status']) => {
    const badges = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: language === 'vi' ? 'Chờ xử lý' : language === 'ko' ? '대기 중' : 'Pending' },
      'in-review': { bg: 'bg-blue-100', text: 'text-blue-700', icon: Eye, label: language === 'vi' ? 'Đang xem xét' : language === 'ko' ? '검토 중' : 'In Review' },
      'approved': { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2, label: language === 'vi' ? 'Đã duyệt' : language === 'ko' ? '승인됨' : 'Approved' },
      'contacted': { bg: 'bg-purple-100', text: 'text-purple-700', icon: UserCheck, label: language === 'vi' ? 'Đã liên hệ' : language === 'ko' ? '연락함' : 'Contacted' }
    };
    
    const badge = badges[status];
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  // Export to Excel
  const exportToExcel = () => {
    const data = filteredStudents.map(student => {
      const university = universities.find(u => u.id === student.desiredUniversity);
      // Calculate fixed cost breakdown (Ajou-style)
      const fixedCostVND = 39000000 + 11000000 + 13000000; // Consulting + Agency + Language
      const fixedCostKRW = 100000 + 5800000 + 10000000;    // Apply + Invoice + Savings
      const fixedCostKRW_inVND = fixedCostKRW * 17.77;
      const totalFixedVND = fixedCostVND + fixedCostKRW_inVND;

      return {
        [language === 'vi' ? 'Họ tên' : language === 'ko' ? '이름' : 'Name']: student.name,
        Email: student.email,
        [language === 'vi' ? 'Điện thoại' : language === 'ko' ? '전화번호' : 'Phone']: student.phone,
        [language === 'vi' ? 'Trường mong muốn' : language === 'ko' ? '희망 대학' : 'Desired University']: university?.name || 'N/A',
        [language === 'vi' ? 'Hệ visa' : language === 'ko' ? '비자 시스템' : 'Visa System']: student.visaSystem,
        'TOPIK': student.topikLevel || 'N/A',
        'IELTS': student.ieltsScore || 'N/A',
        // Cost breakdown categories (in VND)
        [language === 'vi' ? 'Phí tư vấn (VND)' : 'Consulting Fee (VND)']: 39000000,
        [language === 'vi' ? 'Phí môi giới (VND)' : 'Agency Fee (VND)']: 11000000,
        [language === 'vi' ? 'Học tiếng Hàn (VND)' : 'Korean Language (VND)']: 13000000,
        [language === 'vi' ? 'Phí apply (KRW)' : 'Application Fee (KRW)']: 100000,
        [language === 'vi' ? 'Phí hóa đơn (KRW)' : 'Invoice Fee (KRW)']: 5800000,
        [language === 'vi' ? 'Tài khoản tiết kiệm (KRW)' : 'Savings Account (KRW)']: 10000000,
        [language === 'vi' ? 'Tổng cố định (VND)' : 'Total Fixed (VND)']: Math.round(totalFixedVND),
        [language === 'vi' ? 'Tổng chi phí ước tính (USD)' : language === 'ko' ? '예상 비용 (USD)' : 'Estimated Cost (USD)']: student.initialTotalCost,
        [language === 'vi' ? 'Trạng thái' : language === 'ko' ? '상태' : 'Status']: student.status,
        [language === 'vi' ? 'Ngày gửi' : language === 'ko' ? '제출일' : 'Submitted']: new Date(student.submittedAt).toLocaleDateString()
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student Onboarding');
    XLSX.writeFile(wb, 'student-onboarding-list.xlsx');
    toast.success(language === 'vi' ? 'Xuất Excel thành công!' : language === 'ko' ? 'Excel 내보내기 성공!' : 'Excel exported successfully!');
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Student Onboarding Report', 20, 20);
    
    doc.setFontSize(12);
    let yPos = 40;
    
    filteredStudents.forEach((student, idx) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      const university = universities.find(u => u.id === student.desiredUniversity);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${student.name}`, 20, yPos);
      yPos += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Email: ${student.email} | Phone: ${student.phone}`, 25, yPos);
      yPos += 6;
      doc.text(`University: ${university?.name || 'N/A'} | Visa: ${student.visaSystem}`, 25, yPos);
      yPos += 6;
      doc.text(`Cost: ${formatFrom(student.initialTotalCost, 'USD')} | Status: ${student.status}`, 25, yPos);
      yPos += 10;
    });
    
    doc.save('student-onboarding-report.pdf');
    toast.success(language === 'vi' ? 'Xuất PDF thành công!' : language === 'ko' ? 'PDF 내보내기 성공!' : 'PDF exported successfully!');
  };

  // Handle status update
  const handleStatusUpdate = (id: string, newStatus: StudentOnboardingData['status']) => {
    updateStudentOnboardingStatus(id, newStatus);
    toast.success(language === 'vi' ? 'Cập nhật trạng thái thành công!' : language === 'ko' ? '상태 업데이트 성공!' : 'Status updated successfully!');
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm(language === 'vi' ? 'Bạn có chắc muốn xóa học sinh này?' : language === 'ko' ? '이 학생을 삭제하시겠습니까?' : 'Are you sure you want to delete this student?')) {
      deleteStudentOnboarding(id);
      toast.success(language === 'vi' ? 'Xóa thành công!' : language === 'ko' ? '삭제 성공!' : 'Deleted successfully!');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {language === 'vi' ? 'Giám sát học sinh' : language === 'ko' ? '학생 모니터링' : 'Student Monitoring'}
            </h1>
            <p className="text-slate-600 mt-1">
              {language === 'vi' ? 'Theo dõi và quản lý các yêu cầu tư vấn từ học sinh' : 
               language === 'ko' ? '학생 상담 요청 추적 및 관리' :
               'Track and manage consultation requests from students'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <User className="w-5 h-5 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-600">
            {language === 'vi' ? 'Tổng số' : language === 'ko' ? '총계' : 'Total'}
          </p>
        </div>

        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
          <p className="text-xs text-yellow-700">
            {language === 'vi' ? 'Chờ xử lý' : language === 'ko' ? '대기 중' : 'Pending'}
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.inReview}</p>
          <p className="text-xs text-blue-700">
            {language === 'vi' ? 'Đang xem' : language === 'ko' ? '검토 중' : 'In Review'}
          </p>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
          <p className="text-xs text-green-700">
            {language === 'vi' ? 'Đã duyệt' : language === 'ko' ? '승인됨' : 'Approved'}
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <UserCheck className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-900">{stats.contacted}</p>
          <p className="text-xs text-purple-700">
            {language === 'vi' ? 'Đã liên hệ' : language === 'ko' ? '연락함' : 'Contacted'}
          </p>
        </div>

        <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-lg font-bold text-orange-900">{formatFrom(stats.totalCost, 'USD')}</p>
          <p className="text-xs text-orange-700">
            {language === 'vi' ? 'Tổng chi phí' : language === 'ko' ? '총 비용' : 'Total Cost'}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'vi' ? 'Tìm theo tên, email, số điện thoại...' : 
                           language === 'ko' ? '이름, 이메일, 전화번호로 검색...' :
                           'Search by name, email, phone...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">
                {language === 'vi' ? 'Tất cả trạng thái' : language === 'ko' ? '모든 상태' : 'All Status'}
              </option>
              <option value="pending">
                {language === 'vi' ? 'Chờ xử lý' : language === 'ko' ? '대기 중' : 'Pending'}
              </option>
              <option value="in-review">
                {language === 'vi' ? 'Đang xem xét' : language === 'ko' ? '검토 중' : 'In Review'}
              </option>
              <option value="approved">
                {language === 'vi' ? 'Đã duyệt' : language === 'ko' ? '승인됨' : 'Approved'}
              </option>
              <option value="contacted">
                {language === 'vi' ? 'Đã liên hệ' : language === 'ko' ? '연락함' : 'Contacted'}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">
            {language === 'vi' ? 'Không có học sinh nào đăng ký tư vấn' : 
             language === 'ko' ? '상담 신청한 학생이 없습니다' :
             'No student consultation requests'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {language === 'vi' ? 'Học sinh' : language === 'ko' ? '학생' : 'Student'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {language === 'vi' ? 'Liên hệ' : language === 'ko' ? '연락처' : 'Contact'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {language === 'vi' ? 'Trường & Visa' : language === 'ko' ? '대학 & 비자' : 'University & Visa'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {language === 'vi' ? 'Trình độ' : language === 'ko' ? '실력' : 'Proficiency'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {language === 'vi' ? 'Chi phí' : language === 'ko' ? '비용' : 'Cost'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {language === 'vi' ? 'Trạng thái' : language === 'ko' ? '상태' : 'Status'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {language === 'vi' ? 'Ngày gửi' : language === 'ko' ? '제출일' : 'Submitted'}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {language === 'vi' ? 'Hành động' : language === 'ko' ? '작업' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStudents.map((student) => {
                  const university = universities.find(u => u.id === student.desiredUniversity);
                  
                  return (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{student.name}</p>
                            <p className="text-xs text-slate-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Phone className="w-4 h-4 text-slate-400" />
                          {student.phone}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{university?.name || 'N/A'}</p>
                          <p className="text-xs text-slate-500">{student.visaSystem}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          {student.topikLevel && (
                            <p className="text-slate-700">TOPIK {student.topikLevel}</p>
                          )}
                          {student.ieltsScore && (
                            <p className="text-slate-700">IELTS {student.ieltsScore}</p>
                          )}
                          {!student.topikLevel && !student.ieltsScore && (
                            <p className="text-slate-400">N/A</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900">{formatFrom(student.initialTotalCost, 'USD')}</p>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(student.status)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {new Date(student.submittedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <select
                            value={student.status}
                            onChange={(e) => handleStatusUpdate(student.id, e.target.value as StudentOnboardingData['status'])}
                            className="px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          >
                            <option value="pending">
                              {language === 'vi' ? 'Chờ' : language === 'ko' ? '대기' : 'Pending'}
                            </option>
                            <option value="in-review">
                              {language === 'vi' ? 'Xem xét' : language === 'ko' ? '검토' : 'Review'}
                            </option>
                            <option value="approved">
                              {language === 'vi' ? 'Duyệt' : language === 'ko' ? '승인' : 'Approved'}
                            </option>
                            <option value="contacted">
                              {language === 'vi' ? 'Đã liên hệ' : language === 'ko' ? '연락함' : 'Contacted'}
                            </option>
                          </select>
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowDetailModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title={language === 'vi' ? 'Xem chi tiết' : language === 'ko' ? '상세보기' : 'View details'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title={language === 'vi' ? 'Xóa' : language === 'ko' ? '삭제' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
              <div>
                <h2 className="text-2xl font-bold">
                  {language === 'vi' ? 'Chi tiết học sinh' : language === 'ko' ? '학생 상세 정보' : 'Student Details'}
                </h2>
                <p className="text-blue-100 text-sm mt-1">{selectedStudent.name}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-white/80 hover:text-white transition-colors p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  {language === 'vi' ? 'Thông tin cá nhân' : language === 'ko' ? '개인 정보' : 'Personal Information'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <User className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500">
                        {language === 'vi' ? 'Họ tên' : language === 'ko' ? '이름' : 'Name'}
                      </p>
                      <p className="font-medium text-slate-900">{selectedStudent.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Mail className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="font-medium text-slate-900">{selectedStudent.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Phone className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500">
                        {language === 'vi' ? 'Điện thoại' : language === 'ko' ? '전화번호' : 'Phone'}
                      </p>
                      <p className="font-medium text-slate-900">{selectedStudent.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500">
                        {language === 'vi' ? 'Ngày gửi' : language === 'ko' ? '제출일' : 'Submitted'}
                      </p>
                      <p className="font-medium text-slate-900">
                        {new Date(selectedStudent.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  {language === 'vi' ? 'Thông tin học thuật' : language === 'ko' ? '학업 정보' : 'Academic Information'}
                </h3>
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      <p className="text-sm font-semibold text-blue-900">
                        {language === 'vi' ? 'Trường mong muốn' : language === 'ko' ? '희망 대학' : 'Desired University'}
                      </p>
                    </div>
                    <p className="text-slate-900 font-medium">
                      {universities.find(u => u.id === selectedStudent.desiredUniversity)?.name || 'N/A'}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">
                        {language === 'vi' ? 'Hệ visa' : language === 'ko' ? '비자 시스템' : 'Visa System'}
                      </p>
                      <p className="font-medium text-slate-900">{selectedStudent.visaSystem}</p>
                    </div>
                    
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">TOPIK</p>
                      <p className="font-medium text-slate-900">{selectedStudent.topikLevel || 'N/A'}</p>
                    </div>
                    
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">IELTS</p>
                      <p className="font-medium text-slate-900">{selectedStudent.ieltsScore || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Estimate */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  {language === 'vi' ? 'Ước tính chi phí' : language === 'ko' ? '비용 예상' : 'Cost Estimate'}
                </h3>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-6 h-6 text-green-600" />
                      <p className="text-sm font-semibold text-green-900">
                        {language === 'vi' ? 'Tổng chi phí ban đầu' : language === 'ko' ? '초기 총 비용' : 'Initial Total Cost'}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      {formatFrom(selectedStudent.initialTotalCost, 'USD')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedStudent.notes && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    {language === 'vi' ? 'Ghi chú' : language === 'ko' ? '메모' : 'Notes'}
                  </h3>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-slate-700">{selectedStudent.notes}</p>
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  {language === 'vi' ? 'Trạng thái' : language === 'ko' ? '상태' : 'Status'}
                </h3>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    {getStatusBadge(selectedStudent.status)}
                  </div>
                  <select
                    value={selectedStudent.status}
                    onChange={(e) => handleStatusUpdate(selectedStudent.id, e.target.value as StudentOnboardingData['status'])}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="pending">
                      {language === 'vi' ? 'Chờ xử lý' : language === 'ko' ? '대기 중' : 'Pending'}
                    </option>
                    <option value="in-review">
                      {language === 'vi' ? 'Đang xem xét' : language === 'ko' ? '검토 중' : 'In Review'}
                    </option>
                    <option value="approved">
                      {language === 'vi' ? 'Đã duyệt' : language === 'ko' ? '승인됨' : 'Approved'}
                    </option>
                    <option value="contacted">
                      {language === 'vi' ? 'Đã liên hệ' : language === 'ko' ? '연락함' : 'Contacted'}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                {language === 'vi' ? 'Đóng' : language === 'ko' ? '닫기' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}