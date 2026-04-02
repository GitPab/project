/**
 * 📚 API Documentation
 * SACMA v2.0 - Complete API Reference
 * 
 * ## 🗂️ API Categories
 * 
 * ### 1. Authentication APIs
 * Base: `/api/auth`
 * 
 * | Method | Endpoint | Description | Auth Required |
 * |--------|----------|-------------|---------------|
 * | POST | /api/auth/login | User login | No |
 * | POST | /api/auth/register | User registration | No |
 * | POST | /api/auth/verify | Verify JWT token | Yes |
 * | POST | /api/auth/refresh | Refresh token | Yes |
 * | POST | /api/auth/logout | User logout | Yes |
 * 
 * **Request/Response Examples:**
 * ```json
 * // POST /api/auth/login
 * Request: {
 *   "email": "student@example.com",
 *   "password": "password123"
 * }
 * Response: {
 *   "token": "eyJhbGciOiJIUzI1NiIs...",
 *   "user": {
 *     "id": "uuid",
 *     "email": "student@example.com",
 *     "name": "Nguyen Van A",
 *     "role": "student"
 *   }
 * }
 * ```
 * 
 * ---
 * 
 * ### 2. University APIs
 * Base: `/api/universities`
 * 
 * | Method | Endpoint | Description | Auth Required |
 * |--------|----------|-------------|---------------|
 * | GET | /api/universities | List all universities | No |
 * | GET | /api/universities/:id | Get university details | No |
 * | POST | /api/universities | Create university | Yes (Admin) |
 * | PUT | /api/universities/:id | Update university | Yes (Admin) |
 * | DELETE | /api/universities/:id | Delete university | Yes (Admin) |
 * | POST | /api/universities/import | Bulk import | Yes (Admin) |
 * 
 * ---
 * 
 * ### 3. Student APIs
 * Base: `/api/students`
 * 
 * | Method | Endpoint | Description | Auth Required |
 * |--------|----------|-------------|---------------|
 * | GET | /api/students | List students | Yes (Admin) |
 * | GET | /api/students/:id | Get student details | Yes |
 * | PUT | /api/students/:id | Update student | Yes |
 * | POST | /api/students/:id/toggle-status | Toggle active status | Yes (Admin) |
 * 
 * ---
 * 
 * ### 4. Registration APIs
 * Base: `/api/registrations`
 * 
 * | Method | Endpoint | Description | Auth Required |
 * |--------|----------|-------------|---------------|
 * | GET | /api/registrations | List registrations | Yes |
 * | GET | /api/registrations/:id | Get registration | Yes |
 * | POST | /api/registrations | Create registration | No/Yes |
 * | PUT | /api/registrations/:id | Update registration | Yes |
 * | DELETE | /api/registrations/:id | Delete registration | Yes (Admin) |
 * 
 * **Real-time Updates:**
 * Connect to SSE endpoint for live registration updates:
 * ```javascript
 * const eventSource = new EventSource('/api/sse/registrations');
 * eventSource.onmessage = (event) => {
 *   const data = JSON.parse(event.data);
 *   console.log('New registration:', data);
 * };
 * ```
 * 
 * ---
 * 
 * ### 5. Payment APIs ⭐ NEW
 * Base: `/api/payments`
 * 
 * | Method | Endpoint | Description | Auth Required |
 * |--------|----------|-------------|---------------|
 * | GET | /api/payments | List payments | Yes |
 * | GET | /api/payments/:id | Get payment details | Yes |
 * | POST | /api/payments | Create payment | Yes (Admin) |
 * | PUT | /api/payments/:id | Update payment | Yes (Admin) |
 * | DELETE | /api/payments/:id | Delete payment | Yes (Admin) |
 * | GET | /api/payments/student/summary | Get payment summary | Yes (Student) |
 * 
 * **Payment Status Values:**
 * - `pending` - Awaiting payment
 * - `completed` - Payment received
 * - `failed` - Payment failed
 * - `refunded` - Payment refunded
 * 
 * ---
 * 
 * ### 6. Student Profile APIs ⭐ NEW
 * Base: `/api/student-profiles`
 * 
 * | Method | Endpoint | Description | Auth Required |
 * |--------|----------|-------------|---------------|
 * | GET | /api/student-profiles | Get my profile | Yes (Student) |
 * | GET | /api/student-profiles/:userId | Get profile by ID | Yes (Admin) |
 * | POST | /api/student-profiles | Create profile | Yes (Student) |
 * | PUT | /api/student-profiles | Update my profile | Yes (Student) |
 * | PUT | /api/student-profiles/:userId | Update any profile | Yes (Admin) |
 * 
 * ---
 * 
 * ### 7. Notification APIs ⭐ NEW
 * Base: `/api/notifications`
 * 
 * | Method | Endpoint | Description | Auth Required |
 * |--------|----------|-------------|---------------|
 * | GET | /api/notifications | List my notifications | Yes |
 * | GET | /api/notifications/unread-count | Get unread count | Yes |
 * | POST | /api/notifications | Create notification | Yes (Admin) |
 * | POST | /api/notifications/broadcast | Broadcast to all | Yes (Admin) |
 * | PUT | /api/notifications/:id/read | Mark as read | Yes |
 * | PUT | /api/notifications/mark-all-read | Mark all read | Yes |
 * | DELETE | /api/notifications/clear-all | Clear all | Yes |
 * | DELETE | /api/notifications/:id | Delete notification | Yes |
 * 
 * **Notification Types:**
 * - `payment` - Payment reminders
 * - `document` - Document status updates
 * - `appointment` - Appointment reminders
 * - `system` - System announcements
 * - `message` - New message notifications
 * 
 * ---
 * 
 * ### 8. Document APIs ⭐ NEW
 * Base: `/api/documents`
 * 
 * | Method | Endpoint | Description | Auth Required |
 * |--------|----------|-------------|---------------|
 * | GET | /api/documents | List documents | Yes |
 * | GET | /api/documents/:id | Get document | Yes |
 * | POST | /api/documents | Upload document | Yes |
 * | PUT | /api/documents/:id/review | Review document | Yes (Admin) |
 * | DELETE | /api/documents/:id | Delete document | Yes |
 * 
 * **Document Types:**
 * - `passport` - Passport copy
 * - `transcript` - Academic transcript
 * - `certificate` - Language certificates
 * - `recommendation` - Recommendation letters
 * - `financial` - Financial documents
 * - `other` - Other documents
 * 
 * **Review Status:**
 * - `pending` - Awaiting review
 * - `approved` - Document approved
 * - `rejected` - Document rejected
 * - `needs_revision` - Needs changes
 * 
 * ---
 * 
 * ### 9. Program APIs ⭐ NEW
 * Base: `/api/programs`
 * 
 * | Method | Endpoint | Description | Auth Required |
 * |--------|----------|-------------|---------------|
 * | GET | /api/programs | List programs | No |
 * | GET | /api/programs/:id | Get program | No |
 * | POST | /api/programs | Create program | Yes (Admin) |
 * | PUT | /api/programs/:id | Update program | Yes (Admin) |
 * | DELETE | /api/programs/:id | Delete program | Yes (Admin) |
 * | GET | /api/programs/university/:id | Get by university | No |
 * 
 * ---
 * 
 * ### 10. Message APIs ⭐ NEW
 * Base: `/api/messages`
 * 
 * | Method | Endpoint | Description | Auth Required |
 * |--------|----------|-------------|---------------|
 * | GET | /api/messages/inbox | Get inbox | Yes |
 * | GET | /api/messages/sent | Get sent messages | Yes |
 * | GET | /api/messages/:id | Get message | Yes |
 * | POST | /api/messages | Send message | Yes |
 * | DELETE | /api/messages/:id | Soft delete | Yes |
 * 
 * ---
 * 
 * ### 11. Appointment APIs ⭐ NEW
 * Base: `/api/appointments`
 * 
 * | Method | Endpoint | Description | Auth Required |
 * |--------|----------|-------------|---------------|
 * | GET | /api/appointments | List appointments | Yes |
 * | GET | /api/appointments/:id | Get appointment | Yes |
 * | POST | /api/appointments | Create appointment | Yes |
 * | PUT | /api/appointments/:id | Update appointment | Yes |
 * | PUT | /api/appointments/:id/cancel | Cancel appointment | Yes |
 * | DELETE | /api/appointments/:id | Delete appointment | Yes (Admin) |
 * | GET | /api/appointments/available-slots | Get available slots | Yes |
 * 
 * **Appointment Status:**
 * - `scheduled` - Confirmed appointment
 * - `completed` - Appointment completed
 * - `cancelled` - Cancelled by student/staff
 * - `no_show` - Student didn't show up
 * 
 * ---
 * 
 * ### 12. Scholarship APIs ⭐ NEW
 * Base: `/api/scholarships`
 * 
 * | Method | Endpoint | Description | Auth Required |
 * |--------|----------|-------------|---------------|
 * | GET | /api/scholarships | List scholarships | No |
 * | GET | /api/scholarships/:id | Get scholarship | No |
 * | POST | /api/scholarships | Create scholarship | Yes (Admin) |
 * | PUT | /api/scholarships/:id | Update scholarship | Yes (Admin) |
 * | DELETE | /api/scholarships/:id | Delete scholarship | Yes (Admin) |
 * | POST | /api/scholarships/:id/apply | Apply for scholarship | Yes (Student) |
 * | GET | /api/scholarships/my-applications | My applications | Yes (Student) |
 * | PUT | /api/scholarships/applications/:id/review | Review application | Yes (Admin) |
 * 
 * **Application Status:**
 * - `draft` - Draft application
 * - `submitted` - Submitted for review
 * - `under_review` - Being reviewed
 * - `approved` - Scholarship approved
 * - `rejected` - Application rejected
 * 
 * ---
 * 
 * ### 13. Visa Application APIs ⭐ NEW
 * Base: `/api/visa-applications`
 * 
 * | Method | Endpoint | Description | Auth Required |
 * |--------|----------|-------------|---------------|
 * | GET | /api/visa-applications | List applications | Yes |
 * | GET | /api/visa-applications/:id | Get application | Yes |
 * | POST | /api/visa-applications | Create application | Yes |
 * | PUT | /api/visa-applications/:id | Update application | Yes |
 * | DELETE | /api/visa-applications/:id | Delete application | Yes |
 * | PUT | /api/visa-applications/:id/status | Update status | Yes (Admin) |
 * 
 * **Visa Status Values:**
 * - `draft` - Draft application
 * - `submitted` - Submitted to embassy
 * - `under_review` - Embassy reviewing
 * - `approved` - Visa approved
 * - `rejected` - Visa rejected
 * - `collected` - Passport collected
 * 
 * **Visa Types:**
 * - `D-2` - Student visa (degree)
 * - `D-4` - General trainee
 * - `D-4-1` - Language study
 * - `D-2-2` - Exchange student
 * - `D-2-3` - Research student
 * 
 * ---
 * 
 * ### 14. User Preference APIs ⭐ NEW
 * Base: `/api/user-preferences`
 * 
 * | Method | Endpoint | Description | Auth Required |
 * |--------|----------|-------------|---------------|
 * | GET | /api/user-preferences | Get preferences | Yes |
 * | POST | /api/user-preferences | Create preferences | Yes |
 * | PUT | /api/user-preferences | Update preferences | Yes |
 * | PATCH | /api/user-preferences/:key | Update single setting | Yes |
 * 
 * **Preference Keys:**
 * - `language` - Preferred language (vi, ko, en)
 * - `theme` - UI theme (light, dark, auto)
 * - `currency` - Default currency (VND, USD, KRW, JPY, CNY)
 * - `notifications_enabled` - Global notification toggle
 * - `email_notifications` - Email notification toggle
 * - `push_notifications` - Push notification toggle
 * 
 * ---
 * 
 * ### 15. System APIs
 * 
 * #### Health Check
 * Base: `/api/health`
 * 
 * | Method | Endpoint | Description | Auth Required |
 * |--------|----------|-------------|---------------|
 * | GET | /api/health | Basic health check | No |
 * | GET | /api/health/detailed | Detailed status | No |
 * | GET | /api/health/db | Database health | No |
 * 
 * **Response Example:**
 * ```json
 * {
 *   "status": "healthy",
 *   "timestamp": "2026-04-02T10:30:00Z",
 *   "database": "connected",
 *   "version": "2.0.0"
 * }
 * ```
 * 
 * #### Exchange Rates
 * Base: `/api/exchange-rates`
 * 
 * | Method | Endpoint | Description | Auth Required |
 * |--------|----------|-------------|---------------|
 * | GET | /api/exchange-rates | Get all rates | No |
 * | GET | /api/exchange-rates/:currency | Get single rate | No |
 * | POST | /api/exchange-rates/update | Update rates | Yes (Admin) |
 * | GET | /api/exchange-rates/convert | Convert currency | No |
 * 
 * **Supported Currencies:**
 * - VND (base)
 * - USD
 * - KRW
 * - JPY
 * - CNY
 * 
 * ---
 * 
 * ## 🔐 Authentication
 * 
 * All protected endpoints require Bearer token in Authorization header:
 * ```
 * Authorization: Bearer <jwt_token>
 * ```
 * 
 * ### JWT Token Structure
 * ```json
 * {
 *   "userId": "uuid",
 *   "email": "user@example.com",
 *   "role": "student|admin|staff",
 *   "iat": 1712345678,
 *   "exp": 1712349278
 * }
 * ```
 * 
 * ### Role-Based Access Control (RBAC)
 * 
 * | Role | Permissions |
 * |------|-------------|
 * | `student` | View own data, upload documents, send messages |
 * | `staff` | View all student data, manage appointments, review documents |
 * | `admin` | Full system access, manage users, configure system |
 * 
 * ---
 * 
 * ## 📊 Response Format
 * 
 * ### Success Response (200 OK)
 * ```json
 * {
 *   "data": {
 *     // Response data
 *   }
 * }
 * ```
 * 
 * ### Error Response (4xx/5xx)
 * ```json
 * {
 *   "error": "Error message",
 *   "code": "ERROR_CODE",
 *   "details": {}
 * }
 * ```
 * 
 * ### Common Error Codes
 * 
 * | Code | HTTP | Description |
 * |------|------|-------------|
 * | UNAUTHORIZED | 401 | Missing or invalid token |
 * | FORBIDDEN | 403 | Insufficient permissions |
 * | NOT_FOUND | 404 | Resource not found |
 * | VALIDATION_ERROR | 400 | Invalid request data |
 * | INTERNAL_ERROR | 500 | Server error |
 * 
 * ---
 * 
 * ## 🌐 Rate Limiting
 * 
 * API endpoints are rate-limited to prevent abuse:
 * 
 * | Endpoint Type | Limit | Window |
 * |---------------|-------|--------|
 * | Authentication | 5 requests | 1 minute |
 * | General API | 100 requests | 15 minutes |
 * | File Uploads | 10 requests | 1 hour |
 * 
 * ---
 * 
 * ## 📡 Real-time Events (SSE)
 * 
 * Connect to Server-Sent Events endpoint for live updates:
 * 
 * ```javascript
 * const eventSource = new EventSource('/api/sse/registrations', {
 *   headers: { 'Authorization': 'Bearer ' + token }
 * });
 * 
 * eventSource.onmessage = (event) => {
 *   const data = JSON.parse(event.data);
 *   // Handle new registration
 * };
 * 
 * eventSource.onerror = (error) => {
 *   console.error('SSE error:', error);
 *   // Connection will auto-retry
 * };
 * ```
 * 
 * **Event Types:**
 * - `new_registration` - New student registered
 * - `payment_received` - Payment confirmed
 * - `document_reviewed` - Document status changed
 * - `notification` - New notification
 * 
 * ---
 * 
 * ## 📚 Additional Resources
 * 
 * - [Architecture Docs](../architecture/) - System architecture
 * - [Deployment Guide](../deployment/) - Deployment instructions
 * - [Project Structure](../PROJECT_STRUCTURE.md) - Project organization
 * 
 * ---
 * 
 * **Version:** 2.0.0  
 * **Last Updated:** April 2, 2026
 */

export {};
