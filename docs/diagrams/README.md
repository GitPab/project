# SACMA Diagrams - Index

Tài liệu này liệt kê tất cả các diagram PlantUML trong dự án SACMA.

## 📁 Cấu Trúc Thư Mục

```
docs/diagrams/
├── COMPONENT_DIAGRAMS.puml      # Component architecture (Updated v2.0)
├── CLASS_DIAGRAMS.puml          # Class diagrams (Updated v2.0)
├── SEQUENCE_DIAGRAMS.puml       # Sequence diagrams (Original)
├── SEQUENCE_DIAGRAMS_V2.puml    # Sequence diagrams v2.0 (NEW)
├── ACTIVITY_DIAGRAMS.puml       # Activity diagrams (Original)
├── ACTIVITY_DIAGRAMS_V2.puml    # Activity diagrams v2.0 (NEW)
├── USECASE_DIAGRAMS.puml         # Use case diagrams (Original)
├── USECASE_DIAGRAMS_V2.puml      # Use case diagrams v2.0 (NEW)
├── STATE_DIAGRAMS.puml          # State diagrams
├── DEPLOYMENT_DIAGRAMS.puml     # Deployment architecture
├── TIMING_DIAGRAMS.puml         # Timing diagrams
└── README.md                    # This file
```

## 📊 Component Diagrams (COMPONENT_DIAGRAMS.puml)

### 1. Component_SystemOverview
**Mô tả:** Tổng quan kiến trúc hệ thống SACMA v2.0

**Thành phần chính:**
- Client Browser
- Frontend Application (React + Vite)
- Backend API (Express + Node.js)
- Database (PostgreSQL)
- External Services (Imgur, JWT, Email, Redis)

**Cập nhật v2.0:**
- ✅ Thêm 10 API routes mới (Payments, Notifications, Documents, Programs, Messages, Appointments, Scholarships, Visa, Preferences)
- ✅ Thêm SSE Manager cho real-time updates
- ✅ Thêm Redis Cache
- ✅ Mở rộng database tables từ 5 lên 15 tables

### 2. Component_FrontendArchitecture
**Mô tả:** Kiến trúc frontend chi tiết

**Thành phần:**
- Entry Point (main.tsx, App.tsx)
- Routing (BrowserRouter, Guards)
- Layout Components
- Page Components
- Feature Components
- Services/API

### 3. Component_BackendArchitecture
**Mô tả:** Kiến trúc backend chi tiết

**Thành phần:**
- Server Core
- Middleware Pipeline
- Security Components
- Route Controllers
- Data Access Layer
- External Integrations

## 🏛️ Class Diagrams (CLASS_DIAGRAMS.puml)

### 1. Class_FrontendComponents
**Mô tả:** Class diagram cho frontend components

**Các class chính:**
- Layout, UniversitiesList, UniversityForm
- EditUniversityModal, AdminInvite, AdminDashboard
- AdminRoles, PermissionGuard, QuickInfoModal
- AuthProvider, AppProvider

### 2. Class_BackendAPI
**Mô tả:** Class diagram cho backend API

**Cập nhật v2.0:**
- ✅ Thêm 8 controllers mới:
  - PaymentController
  - NotificationController
  - DocumentController
  - MessageController
  - AppointmentController
  - ScholarshipController
  - VisaController
  - PreferenceController

- ✅ Thêm 11 models mới:
  - PaymentModel
  - NotificationModel
  - DocumentModel
  - MessageModel
  - AppointmentModel
  - ScholarshipModel
  - ScholarshipApplicationModel
  - VisaApplicationModel
  - UserPreferenceModel

## 📈 Sequence Diagrams

### Original (SEQUENCE_DIAGRAMS.puml)
1. **Sequence_Authentication** - Luồng đăng nhập/đăng xuất
2. **Sequence_UniversityCRUD** - Quản lý trường đại học
3. **Sequence_AdminInvite** - Mời admin và thiết lập
4. **Sequence_StudentRegistration** - Đăng ký học sinh
5. **Sequence_ImportCSV** - Import CSV

### V2.0 New (SEQUENCE_DIAGRAMS_V2.puml)
1. **Sequence_PaymentFlow** - Quản lý thanh toán
2. **Sequence_NotificationFlow** - Hệ thống thông báo
3. **Sequence_DocumentFlow** - Upload và review tài liệu
4. **Sequence_ScholarshipFlow** - Ứng dụng học bổng
5. **Sequence_VisaApplicationFlow** - Xử lý visa
6. **Sequence_RealTimeUpdates** - SSE real-time updates

## 📋 Use Case Diagrams

### Original (USECASE_DIAGRAMS.puml)
1. **UseCase_SystemOverview** - Tổng quan use cases
2. **UseCase_RegistrationWorkflow** - Luồng đăng ký chi tiết
3. **UseCase_UniversityManagement** - Quản lý trường

### V2.0 New (USECASE_DIAGRAMS_V2.puml)
1. **UseCase_v2_SystemOverview** - Tổng quan v2.0 (64 use cases)
2. **UseCase_PaymentManagement** - Quản lý thanh toán
3. **UseCase_DocumentManagement** - Quản lý tài liệu
4. **UseCase_MessagingSystem** - Hệ thống tin nhắn
5. **UseCase_AppointmentSystem** - Lịch hẹn
6. **UseCase_ScholarshipSystem** - Hệ thống học bổng

## 🔄 Activity Diagrams

### Original (ACTIVITY_DIAGRAMS.puml)
1. **Activity_Login** - Đăng nhập
2. **Activity_UniversityCRUD** - CRUD trường
3. **Activity_AdminInvite** - Mời admin
4. **Activity_RegistrationApproval** - Phê duyệt đăng ký
5. **Activity_ImportCSV** - Import CSV
6. **Activity_SetupPassword** - Thiết lập mật khẩu

### V2.0 New (ACTIVITY_DIAGRAMS_V2.puml)
1. **Activity_PaymentProcess** - Xử lý thanh toán
2. **Activity_NotificationProcess** - Xử lý thông báo
3. **Activity_DocumentUpload** - Upload và review tài liệu
4. **Activity_MessageFlow** - Luồng tin nhắn
5. **Activity_ScholarshipApplication** - Ứng dụng học bổng
6. **Activity_AppointmentScheduling** - Đặt lịch hẹn
7. **Activity_VisaApplication** - Xử lý visa
8. **Activity_OfflineSync** - Đồng bộ offline

## 🚀 Cách Sử Dụng

### Xem Diagram
Các diagram có thể được xem bằng:
1. **PlantUML Online:** https://www.plantuml.com/plantuml
2. **VS Code Extension:** PlantUML extension
3. **IntelliJ Plugin:** PlantUML integration
4. **Local Server:** Chạy PlantUML server locally

### Export Diagram
```bash
# Export to PNG
java -jar plantuml.jar COMPONENT_DIAGRAMS.puml

# Export to SVG
java -jar plantuml.jar -tsvg COMPONENT_DIAGRAMS.puml

# Export to PDF
java -jar plantuml.jar -tpdf COMPONENT_DIAGRAMS.puml
```

## 📊 Thống Kê

| Loại Diagram | Original | V2.0 | Tổng |
|-------------|----------|------|------|
| Component | 3 | 0 | 3 |
| Class | 2 | 0 | 2 |
| Sequence | 5 | 6 | 11 |
| Use Case | 3 | 6 | 9 |
| Activity | 6 | 8 | 14 |
| **Tổng** | **19** | **20** | **39** |

## 🔄 Version History

### v2.0 (April 2026)
- Thêm 20 diagram mới cho các tính năng v2.0
- Cập nhật component và class diagrams
- Thêm real-time, offline-sync diagrams

### v1.0 (March 2026)
- 19 diagram cơ bản cho hệ thống

## 📚 Tài Liệu Liên Quan

- [Architecture Documentation](../architecture/README.md)
- [API Reference](../api/API_REFERENCE.md)
- [Project Structure](../PROJECT_STRUCTURE.md)
- [Development Guide](../DEVELOPMENT.md)

---

**Last Updated:** April 2, 2026  
**Version:** 2.0.0
