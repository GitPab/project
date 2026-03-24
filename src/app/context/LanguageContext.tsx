import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'vi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, string> = {
  // Common
  'common.dashboard': 'Trang chủ',
  'common.universities': 'Danh sách trường',
  'common.registrations': 'Đăng ký',
  'common.myCosts': 'Chi phí của tôi',
  'common.myProgress': 'Tiến trình của tôi',
  'common.studentMonitoring': 'Theo dõi học viên',
  'common.viewDetails': 'Xem chi tiết',
  'common.logout': 'Đăng xuất',
  'common.admin': 'Quản trị viên',
  'common.student': 'Sinh viên',
  'common.edit': 'Chỉnh sửa',
  'common.save': 'Lưu',
  'common.cancel': 'Hủy',
  'common.register': 'Đăng ký',
  'common.close': 'Đóng',
  'common.loading': 'Đang tải...',
  'common.backToList': 'Quay lại danh sách',
  'common.accessLevel': 'Cấp độ truy cập:',
  'common.fullEditAccess': '✓ Quyền chỉnh sửa đầy đủ',
  'common.viewOnly': '🔒 Chỉ xem',
  'common.loggedInAs': 'Đã đăng nhập với vai trò',
  'common.email': 'Email',
  'common.actions': 'Hành động',
  
  // Login Page
  'login.title': 'Đăng nhập',
  'login.subtitle': 'Quản lý chi phí du học của bạn',
  'login.email': 'Email',
  'login.password': 'Mật khẩu',
  'login.role': 'Vai trò',
  'login.adminRole': 'Quản trị viên (Admin)',
  'login.studentRole': 'Sinh viên (Student)',
  'login.loginButton': 'Đăng nhập',
  'login.adminDescription': 'Quản lý chi phí trường đại học và đăng ký',
  'login.studentDescription': 'Xem trường đại học và theo dõi chi phí của bạn',
  
  // Dashboard
  'dashboard.title': 'Dashboard',
  'dashboard.overview': 'Tổng quan',
  'dashboard.totalUniversities': 'Tổng số trường',
  'dashboard.totalRegistrations': 'Tổng số đăng ký',
  'dashboard.avgCost': 'Chi phí trung bình',
  'dashboard.recentRegistrations': 'Đăng ký gần đây',
  'dashboard.universityName': 'Tên trường',
  'dashboard.student': 'Sinh viên',
  'dashboard.date': 'Ngày',
  'dashboard.tuitionTrends': 'Xu hướng học phí',
  'dashboard.university': 'Trường',
  'dashboard.tuition': 'Học phí',
  
  // Universities List
  'universities.title': 'Danh sách các trường đại học',
  'universities.subtitle': 'Khám phá các trường đại học hàng đầu',
  'universities.worldRanking': 'Xếp hạng thế giới',
  'universities.tuition': 'Học phí',
  'universities.totalCost': 'Tổng chi phí',
  'universities.actions': 'Hành động',
  'universities.registered': 'Đã đăng ký',
  'universities.alreadyRegistered': 'Đã đăng ký',
  
  // University Detail
  'university.overview': 'Tổng quan',
  'university.academicPrograms': 'Định hướng học thuật',
  'university.costs': 'Chi phí',
  'university.gallery': 'Thư viện ảnh',
  'university.ranking': 'Xếp hạng',
  'university.topPrograms': 'Các chương trình hàng đầu',
  'university.costBreakdown': 'Chi tiết chi phí',
  'university.generalTuition': 'Học phí chung',
  'university.visaFee': 'Phí visa',
  'university.accommodation': 'Chi phí lưu trú',
  'university.insurance': 'Bảo hiểm',
  'university.additionalFees': 'Phí bổ sung',
  'university.totalEstimated': 'Tổng ước tính',
  'university.registerSuccess': 'Đăng ký thành công!',
  'university.registerNow': 'Đăng ký ngay',
  'university.updateSuccess': 'Cập nhật thành công!',
  
  // My Costs
  'myCosts.title': 'Chi phí của tôi',
  'myCosts.subtitle': 'Theo dõi chi phí du học của bạn',
  
  // Costs
  'costs.tuition': 'Học phí',
  'costs.visa': 'Phí visa',
  'costs.accommodation': 'Chi phí lưu trú',
  'costs.insurance': 'Bảo hiểm',
  'costs.totalCost': 'Tổng chi phí',
  
  // Progress Tracker
  'progress.title': 'Tiến trình đăng ký du học',
  'progress.subtitle': 'Theo dõi tiến trình đăng ký của bạn',
  'progress.studentName': 'Tên sinh viên',
  'progress.targetUniversity': 'Trường mục tiêu',
  'progress.overallProgress': 'Tiến độ tổng thể',
  'progress.currentStage': 'Giai đoạn hiện tại',
  'progress.timeline': 'Lộ trình',
  'progress.viewDetails': 'Xem chi tiết',
  'progress.startDate': 'Ngày bắt đầu',
  'progress.completedDate': 'Ngày hoàn thành',
  'progress.estimatedDate': 'Ngày dự kiến',
  'progress.status': 'Trạng thái',
  'progress.statusPending': 'Chưa bắt đầu',
  'progress.statusInProgress': 'Đang thực hiện',
  'progress.statusCompleted': 'Hoàn thành',
  'progress.statusDelayed': 'Trễ hạn',
  'progress.noProgress': 'Chưa có tiến trình',
  'progress.noProgressDesc': 'Đăng ký một trường đại học để bắt đầu theo dõi tiến trình của bạn',
  'progress.viewProgress': 'Xem tiến trình',
  'progress.accessFromCosts': 'Truy cập từ trang Chi phí của tôi',
  'progress.estimatedCompletion': 'Hoàn thành dự kiến',
  'progress.notifications': 'Thông báo',
  'progress.documents': 'Tài liệu',
  'progress.uploadDocument': 'Tải lên tài liệu',
  'progress.uploaded': 'Đã tải lên',
  'progress.documentUploaded': 'Tài liệu đã được tải lên',
  'progress.notes': 'Ghi chú',
  'progress.stage': 'Giai đoạn',
  'progress.upload': 'Tải lên',
  'progress.legend': 'Chú thích',
  
  // Progress Stages
  'stage.1.title': 'Đăng ký',
  'stage.1.description': 'Đã nộp hồ sơ đăng ký du học',
  'stage.2.title': 'Học tập',
  'stage.2.description': 'Chuẩn bị học thuật và ngoại ngữ',
  'stage.3.title': 'Hoàn thành việc học',
  'stage.3.description': 'Hoàn tất các khóa học chuẩn bị',
  'stage.4.title': 'Đủ điều kiện du học',
  'stage.4.description': 'Đạt yêu cầu tuyển sinh',
  'stage.5.title': 'Đăng ký visa',
  'stage.5.description': 'Đã nộp hồ sơ xin visa',
  'stage.6.title': 'Xử lý visa',
  'stage.6.description': 'Visa đang được xử lý',
  'stage.7.title': 'Nhận visa',
  'stage.7.description': 'Đã nhận được visa du học',
  'stage.8.title': 'Đi du học',
  'stage.8.description': 'Khởi hành đến trường',
  
  // Registrations
  'registrations.title': 'Quản lý đăng ký',
  'registrations.subtitle': 'Theo dõi tất cả đăng ký sinh viên',
  'registrations.totalCount': 'Tổng số đăng ký',
  'registrations.studentEmail': 'Email sinh viên',
  'registrations.registrationDate': 'Ngày đăng ký',
  'registrations.noRegistrations': 'Chưa có đăng ký nào',
  
  // Admin
  'admin.studentMonitoringTitle': 'Theo dõi học viên',
  'admin.studentMonitoringSubtitle': 'Quản lý tất cả học viên và tiến trình của họ',
  'admin.totalStudents': 'Tổng số học viên',
  'admin.totalRegistrations': 'Tổng đăng ký',
  'admin.totalRevenue': 'Tổng doanh thu',
  'admin.searchStudents': 'Tìm kiếm học viên...',
  'admin.studentName': 'Tên học viên',
  'admin.registeredUniversities': 'Trường đã đăng ký',
  'admin.totalCost': 'Tổng chi phí',
  'admin.progress': 'Tiến độ',
  'admin.studentDetails': 'Thông tin chi tiết học viên',
  'admin.phone': 'Số điện thoại',
  'admin.studentCosts': 'Chi phí của học viên',
  'admin.studentProgress': 'Tiến trình của học viên',
  'admin.paymentHistory': 'Lịch sử thanh toán',
  'admin.paymentPaid': 'Đã thanh toán',
  'admin.paymentPending': 'Chờ thanh toán',
  'admin.paymentOverdue': 'Quá hạn',
  'admin.progressUpdated': 'Cập nhật tiến trình thành công!',
  'admin.noStudentsFound': 'Không tìm thấy học viên nào',
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('vi');

  const t = (key: string): string => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
