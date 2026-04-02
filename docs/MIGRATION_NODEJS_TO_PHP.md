# Kế Hoạch Migration: Node.js → PHP (Laravel) — Phiên bản 2.0

**Phiên bản:** 2.0 (Cập nhật sau review kỹ thuật)  
**Ngày:** April 2, 2026  
**Dự án:** SACMA - Student Abroad Cost Management Application  
**Migration từ:** Node.js + Express → PHP + Laravel  
**Database:** PostgreSQL (giữ nguyên 100%)

---

## 📋 Tóm Tắt

Dự án SACMA hiện tại sử dụng:
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS (giữ nguyên, deploy Vercel)
- **Backend:** Node.js 18 + Express.js → **chuyển sang Laravel 10.x + PHP 8.2**
- **Real-time:** SSE (Server-Sent Events) → **chuyển sang Laravel Reverb WebSocket**
- **Database:** PostgreSQL (31 tables, giữ nguyên 100%)
- **API:** 22 REST endpoints

**⚠️ Lưu ý quan trọng sau review:**
- Laravel **không chạy được trên Vercel** - cần chọn Railway/Render/DigitalOcean cho PHP backend
- SSE trong PHP **block worker** - cần Laravel Reverb hoặc Pusher (thêm effort ~3-4 ngày)
- Frontend có thay đổi nhỏ ở AuthContext để support Sanctum token format

---

## ⚠️ 3 Vấn Đề Kỹ Thuật Nghiêm Trọng & Giải Pháp

### 1. Hosting — Laravel Không Chạy Trên Vercel

**Vấn đề:** Vercel chỉ hỗ trợ Serverless Functions (Node.js, Python, Go), không hỗ trợ PHP runtime.

**Giải pháp đề xuất:**

| Option | Platform | Chi phí | Ưu điểm | Nhược điểm |
|--------|----------|---------|---------|------------|
| **Khuyến nghị** | **Railway** | Free tier + pay-as-you-go | Auto-deploy từ GitHub, PostgreSQL built-in, dễ setup | Cần thẻ tín dụng |
| **Khuyến nghị** | **Render** | Free tier + $7/tháng | Docker support, migration từ Node.js dễ, cùng platform | Web service sleep after 15min idle |
| Cân nhắc | DigitalOcean App Platform | $12/tháng | Managed PostgreSQL, reliable | Phí cố định cao hơn |

**Khuyến nghị cuối cùng:**
- **Chọn Render** vì team đã dùng cho Node.js → migration dễ, cùng 1 platform quản lý
- **Config `vercel.json` rewrite:** Frontend Vercel gọi API qua `destination: https://sacma-php.onrender.com/api/$1`

---

### 2. SSE Real-time → Laravel Reverb

**Vấn đề:** Node.js dùng `sseManager.js` với `broadcastEvent()` để gửi real-time updates. PHP-FPM xử lý SSE kém:
- Mỗi SSE connection block 1 worker process
- PHP-FPM không share memory giữa các request → không thể dùng Map() giống Node.js
- Max ~20 concurrent users là crash

**Giải pháp:**

| Option | Công nghệ | Chi phí | Effort |
|--------|-----------|---------|--------|
| **Khuyến nghị** | **Laravel Reverb** | Free (official Laravel) | ~3-4 ngày setup + test |
| Backup | Pusher | Free tier giới hạn | 1 ngày setup, nhưng phí khi scale |
| Backup | Ably | Free tier | 1 ngày setup, config phức tạp hơn Reverb |

**Chi tiết implement Reverb:**
```bash
# 1. Setup Reverb server
composer require laravel/reverb
php artisan reverb:install

# 2. Start WebSocket server
php artisan reverb:start

# 3. Frontend đổi EventSource → Laravel Echo
npm install laravel-echo pusher-js
```

**Frontend changes:**
```typescript
// Thay thế EventSource SSE
// const source = new EventSource(`${API_URL}/sse/registrations?token=${token}`);

// Bằng Laravel Echo
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;
const echo = new Echo({
  broadcaster: 'reverb',
  key: 'sacma-app-key',
  wsHost: 'sacma-php.onrender.com',
  wsPort: 6001,
  wssPort: 6001,
  useTLS: true,
});

echo.channel('registrations')
  .listen('NewRegistration', (e) => {
    console.log('New registration:', e);
  });
```

---

### 3. Frontend AuthContext — Cần Update Cho Sanctum

**Vấn đề:** Plan gốc nói "frontend không thay đổi" nhưng không hoàn toàn đúng. JWT Node.js trả về object có `userId, role, name` trong payload. Sanctum trả về `{ token, user: { id, name, role } }`.

**Thay đổi cần thiết:**

```typescript
// AuthContext.tsx — sửa phần decode token

// JWT Node.js (cũ):
const user = jwtDecode(token); // { userId, role, name, email }

// Sanctum Laravel (mới):
// Token là plain string, không chứa payload
// Cần lưu user object riêng từ response
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { token, user } = response.data; // Lấy cả token + user
  
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user)); // Lưu user riêng
  
  setUser(user);
  setToken(token);
};
```

**Khác biệt quan trọng:**
| | JWT Node.js | Sanctum Laravel |
|---|---|---|
| Token chứa payload | Có (decode được user) | Không (plain random string) |
| Cần lưu user riêng | Không cần | **Cần lưu `auth_user`** |
| Expiry check | Decode JWT xem `exp` | Gọi API `/auth/me` để check |

---

## ✅ Điều Kiện Tiên Quyết (Cập nhật)
✓ Web server (Nginx/Apache)
```

---

## 🗓️ Timeline Migration (7-8 tuần — có buffer cho Reverb)

### Tuần 0 (Chuẩn bị — MỚI)
| Ngày | Nhiệm vụ | Output |
|------|----------|--------|
| 1 | Setup Render service PHP + Dockerfile Laravel | Xác nhận deploy được trước khi viết code |
| 2 | Setup Laravel Reverb server | Test WebSocket echo thành công |
| 3 | Tạo Postman collection từ 22 Node.js endpoints | Dùng để test PHP sau này |

### Tuần 1-2 (Foundation — giữ nguyên plan gốc)
| Ngày | Nhiệm vụ | Output |
|------|----------|--------|
| 1-2 | Laravel project + PostgreSQL + Auth (Sanctum) + RBAC | Base Laravel chạy được |
| 3-5 | Universities API + Students API + Registrations API | 3 core APIs hoạt động |
| 6-10 | Redis cache config + Storage config | Cache & file upload ready |

### Tuần 3-4 (Feature APIs — thêm 2-3 ngày buffer)
| Ngày | Nhiệm vụ | Output |
|------|----------|--------|
| 1-3 | Payments + Student Profiles + Documents API | 3 APIs |
| 4-6 | Notifications + Messages + Appointments API | 3 APIs |
| 7-10 | Scholarships + Visa Applications + User Preferences | 3 APIs + buffer |

### Tuần 5 (Real-time + Email — THÊM MỚI)
| Ngày | Nhiệm vụ | Output |
|------|----------|--------|
| 1-2 | Laravel Reverb setup + broadcast events | `new_registration`, `status_update` events |
| 3-4 | Frontend: đổi EventSource → Laravel Echo | Real-time hoạt động trên PHP |
| 5 | Laravel Mail setup (SendGrid + SMTP fallback) | Email gửi được |

### Tuần 6 (Testing — mở rộng thêm 1 tuần)
| Ngày | Nhiệm vụ | Output |
|------|----------|--------|
| 1-3 | Chạy toàn bộ Postman collection | So sánh response Node.js vs Laravel |
| 4-5 | Load test: 50 concurrent users | Response time < 500ms |
| 6-7 | Frontend integration test | Tất cả flows hoạt động |

### Tuần 7-8 (Parallel run + Cut over — THÊM MỚI)
| Ngày | Nhiệm vụ | Output |
|------|----------|--------|
| 1-3 | Chạy song song: 10% traffic → PHP, 90% → Node.js | Monitor error rate |
| 4-7 | Tăng dần: 50% → 100% | Node.js vẫn live như fallback |
| 8-10 | Cut over hoàn toàn | Giữ Node.js running thêm 2 tuần phòng rollback |

---

## 🏗️ Chiến Lược Chạy Song Song (Blue-Green Deployment)

**Không tắt Node.js ngay khi Laravel xong. Chạy cả 2, chuyển traffic dần dần:**

```
┌─────────────────┐         ┌─────────────────┐
│  Node.js (Blue) │         │ Laravel (Green) │
│  ─────────────  │         │  ─────────────  │
│  sacma-node.    │         │  sacma-php.     │
│  onrender.com   │         │  onrender.com   │
│                 │         │                 │
│  Traffic:       │         │  Traffic:       │
│  100% → 90% →   │         │  0% → 10% →     │
│  50% → 0%       │         │  50% → 100%     │
└────────┬────────┘         └────────┬────────┘
         │                           │
         └───────────┬───────────────┘
                     │
              ┌──────▼──────┐
              │   Vercel    │
              │  Frontend   │
              │             │
              │ vercel.json │
              │ rewrites:   │
              │ 10% → PHP   │
              │ 90% → Node  │
              └─────────────┘
```

**Config `vercel.json`:**
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://sacma-php.onrender.com/api/:path*",
      "has": [{ "type": "header", "key": "x-beta-user", "value": "true" }]
    },
    {
      "source": "/api/:path*",
      "destination": "https://sacma-node.onrender.com/api/:path*"
    }
  ]
}
```

---

## 🛠️ Chi Tiết Kỹ Thuật

### 1. Database Configuration

#### Node.js (Hiện tại)
```javascript
// server/dbAdapter.js
import pg from 'pg';
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

#### Laravel (Mới)
```php
// .env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=sacma
DB_USERNAME=postgres
DB_PASSWORD=your_password

// config/database.php (mặc định Laravel đã có)
'pgsql' => [
    'driver' => 'pgsql',
    'host' => env('DB_HOST', '127.0.0.1'),
    'port' => env('DB_PORT', '5432'),
    'database' => env('DB_DATABASE', 'sacma'),
    'username' => env('DB_USERNAME', 'postgres'),
    'password' => env('DB_PASSWORD', ''),
    'charset' => 'utf8',
    'prefix' => '',
    'schema' => 'public',
    'sslmode' => 'prefer',
],
```

### 2. Authentication Migration

#### Node.js JWT (Hiện tại)
```javascript
// server/routes/auth.js
import jwt from 'jsonwebtoken';

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
};
```

#### Laravel Sanctum (Mới)
```php
// Installation
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate

// app/Models/User.php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
    
    protected $fillable = ['email', 'password', 'name', 'role', 'is_active'];
    protected $hidden = ['password', 'remember_token'];
}

// routes/api.php
use App\Http\Controllers\AuthController;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// app/Http/Controllers/AuthController.php
class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);
        
        $user = User::where('email', $request->email)->first();
        
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }
        
        $token = $user->createToken('auth-token')->plainTextToken;
        
        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role
            ]
        ]);
    }
}
```

### 3. API Route Mapping

#### Node.js Routes (Hiện tại)
```javascript
// server/server.js
app.use('/api/auth', authRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/payments', paymentsRoutes);           // v2.0
app.use('/api/student-profiles', studentProfilesRoutes); // v2.0
app.use('/api/notifications', notificationsRoutes);     // v2.0
app.use('/api/documents', documentsRoutes);            // v2.0
app.use('/api/programs', programsRoutes);              // v2.0
app.use('/api/messages', messagesRoutes);              // v2.0
app.use('/api/appointments', appointmentsRoutes);      // v2.0
app.use('/api/scholarships', scholarshipsRoutes);       // v2.0
app.use('/api/visa-applications', visaApplicationsRoutes); // v2.0
app.use('/api/user-preferences', userPreferencesRoutes);   // v2.0
```

#### Laravel Routes (Mới)
```php
// routes/api.php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API;

// Public routes
Route::post('/auth/login', [API\AuthController::class, 'login']);
Route::post('/auth/register', [API\AuthController::class, 'register']);
Route::get('/universities', [API\UniversityController::class, 'index']);
Route::get('/universities/{id}', [API\UniversityController::class, 'show']);
Route::get('/programs', [API\ProgramController::class, 'index']);
Route::get('/scholarships', [API\ScholarshipController::class, 'index']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout', [API\AuthController::class, 'logout']);
    Route::get('/auth/me', [API\AuthController::class, 'me']);
    
    // Universities (Admin only)
    Route::post('/universities', [API\UniversityController::class, 'store']);
    Route::put('/universities/{id}', [API\UniversityController::class, 'update']);
    Route::delete('/universities/{id}', [API\UniversityController::class, 'destroy']);
    Route::post('/universities/import', [API\UniversityController::class, 'import']);
    
    // Students
    Route::get('/students', [API\StudentController::class, 'index']);
    Route::get('/students/{id}', [API\StudentController::class, 'show']);
    Route::put('/students/{id}', [API\StudentController::class, 'update']);
    Route::post('/students/{id}/toggle-status', [API\StudentController::class, 'toggleStatus']);
    
    // Registrations
    Route::get('/registrations', [API\RegistrationController::class, 'index']);
    Route::post('/registrations', [API\RegistrationController::class, 'store']);
    Route::get('/registrations/{id}', [API\RegistrationController::class, 'show']);
    Route::put('/registrations/{id}', [API\RegistrationController::class, 'update']);
    Route::delete('/registrations/{id}', [API\RegistrationController::class, 'destroy']);
    
    // Payments (v2.0)
    Route::get('/payments', [API\PaymentController::class, 'index']);
    Route::post('/payments', [API\PaymentController::class, 'store']);
    Route::get('/payments/{id}', [API\PaymentController::class, 'show']);
    Route::put('/payments/{id}', [API\PaymentController::class, 'update']);
    Route::delete('/payments/{id}', [API\PaymentController::class, 'destroy']);
    Route::get('/payments/student/summary', [API\PaymentController::class, 'studentSummary']);
    
    // Student Profiles (v2.0)
    Route::get('/student-profiles', [API\StudentProfileController::class, 'show']);
    Route::post('/student-profiles', [API\StudentProfileController::class, 'store']);
    Route::put('/student-profiles', [API\StudentProfileController::class, 'update']);
    Route::put('/student-profiles/{userId}', [API\StudentProfileController::class, 'updateById']);
    
    // Notifications (v2.0)
    Route::get('/notifications', [API\NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [API\NotificationController::class, 'unreadCount']);
    Route::post('/notifications', [API\NotificationController::class, 'store']);
    Route::post('/notifications/broadcast', [API\NotificationController::class, 'broadcast']);
    Route::put('/notifications/{id}/read', [API\NotificationController::class, 'markAsRead']);
    Route::put('/notifications/mark-all-read', [API\NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/clear-all', [API\NotificationController::class, 'clearAll']);
    Route::delete('/notifications/{id}', [API\NotificationController::class, 'destroy']);
    
    // Documents (v2.0)
    Route::get('/documents', [API\DocumentController::class, 'index']);
    Route::post('/documents', [API\DocumentController::class, 'store']);
    Route::get('/documents/{id}', [API\DocumentController::class, 'show']);
    Route::put('/documents/{id}/review', [API\DocumentController::class, 'review']);
    Route::delete('/documents/{id}', [API\DocumentController::class, 'destroy']);
    
    // Programs (v2.0)
    Route::post('/programs', [API\ProgramController::class, 'store']);
    Route::put('/programs/{id}', [API\ProgramController::class, 'update']);
    Route::delete('/programs/{id}', [API\ProgramController::class, 'destroy']);
    
    // Messages (v2.0)
    Route::get('/messages/inbox', [API\MessageController::class, 'inbox']);
    Route::get('/messages/sent', [API\MessageController::class, 'sent']);
    Route::get('/messages/{id}', [API\MessageController::class, 'show']);
    Route::post('/messages', [API\MessageController::class, 'store']);
    Route::delete('/messages/{id}', [API\MessageController::class, 'destroy']);
    
    // Appointments (v2.0)
    Route::get('/appointments', [API\AppointmentController::class, 'index']);
    Route::post('/appointments', [API\AppointmentController::class, 'store']);
    Route::get('/appointments/{id}', [API\AppointmentController::class, 'show']);
    Route::put('/appointments/{id}', [API\AppointmentController::class, 'update']);
    Route::put('/appointments/{id}/cancel', [API\AppointmentController::class, 'cancel']);
    Route::delete('/appointments/{id}', [API\AppointmentController::class, 'destroy']);
    Route::get('/appointments/available-slots', [API\AppointmentController::class, 'availableSlots']);
    
    // Scholarships (v2.0)
    Route::post('/scholarships', [API\ScholarshipController::class, 'store']);
    Route::put('/scholarships/{id}', [API\ScholarshipController::class, 'update']);
    Route::delete('/scholarships/{id}', [API\ScholarshipController::class, 'destroy']);
    Route::post('/scholarships/{id}/apply', [API\ScholarshipController::class, 'apply']);
    Route::get('/scholarships/my-applications', [API\ScholarshipController::class, 'myApplications']);
    Route::put('/scholarships/applications/{id}/review', [API\ScholarshipController::class, 'reviewApplication']);
    
    // Visa Applications (v2.0)
    Route::get('/visa-applications', [API\VisaApplicationController::class, 'index']);
    Route::post('/visa-applications', [API\VisaApplicationController::class, 'store']);
    Route::get('/visa-applications/{id}', [API\VisaApplicationController::class, 'show']);
    Route::put('/visa-applications/{id}', [API\VisaApplicationController::class, 'update']);
    Route::put('/visa-applications/{id}/status', [API\VisaApplicationController::class, 'updateStatus']);
    Route::delete('/visa-applications/{id}', [API\VisaApplicationController::class, 'destroy']);
    
    // User Preferences (v2.0)
    Route::get('/user-preferences', [API\UserPreferenceController::class, 'show']);
    Route::post('/user-preferences', [API\UserPreferenceController::class, 'store']);
    Route::put('/user-preferences', [API\UserPreferenceController::class, 'update']);
    
    // Health Check
    Route::get('/health', [API\HealthController::class, 'check']);
});
```

### 4. Controller Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── API/              # All API controllers
│   │   │   ├── AuthController.php
│   │   │   ├── UniversityController.php
│   │   │   ├── StudentController.php
│   │   │   ├── RegistrationController.php
│   │   │   ├── PaymentController.php         # v2.0
│   │   │   ├── StudentProfileController.php   # v2.0
│   │   │   ├── NotificationController.php     # v2.0
│   │   │   ├── DocumentController.php        # v2.0
│   │   │   ├── ProgramController.php         # v2.0
│   │   │   ├── MessageController.php          # v2.0
│   │   │   ├── AppointmentController.php      # v2.0
│   │   │   ├── ScholarshipController.php    # v2.0
│   │   │   ├── VisaApplicationController.php # v2.0
│   │   │   ├── UserPreferenceController.php   # v2.0
│   │   │   └── HealthController.php
│   │   └── Controller.php
│   ├── Middleware/
│   │   ├── Authenticate.php
│   │   └── CheckRole.php       # RBAC middleware
│   └── Requests/              # Form validation
│       ├── Auth/
│       │   ├── LoginRequest.php
│       │   └── RegisterRequest.php
│       ├── University/
│       │   └── StoreUniversityRequest.php
│       └── ...
├── Models/                    # Eloquent models
│   ├── User.php
│   ├── University.php
│   ├── Student.php
│   ├── Registration.php
│   ├── Payment.php            # v2.0
│   ├── Notification.php        # v2.0
│   ├── Document.php            # v2.0
│   ├── Program.php            # v2.0
│   ├── Message.php            # v2.0
│   ├── Appointment.php        # v2.0
│   ├── Scholarship.php        # v2.0
│   ├── ScholarshipApplication.php # v2.0
│   ├── VisaApplication.php    # v2.0
│   ├── UserPreference.php     # v2.0
│   └── ...
├── Services/                  # Business logic
│   ├── PaymentService.php
│   ├── NotificationService.php
│   └── ...
└── ...
```

### 5. Model Example (Migration từ JS sang PHP)

#### Node.js Query Style
```javascript
// Get payments for student
const { rows } = await pool.query(
  `SELECT p.*, u.name as student_name 
   FROM payments p 
   JOIN users u ON p.student_id = u.id 
   WHERE p.student_id = $1 
   ORDER BY p.created_at DESC`,
  [studentId]
);
```

#### Laravel Eloquent Style
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;
    
    protected $table = 'payments';
    protected $primaryKey = 'id';
    public $incrementing = false; // UUID
    protected $keyType = 'string';
    
    protected $fillable = [
        'id',
        'student_id',
        'registration_id',
        'amount',
        'currency',
        'payment_method',
        'payment_type',
        'status',
        'transaction_id',
        'paid_at',
        'description',
        'notes'
    ];
    
    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // Relationships
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }
    
    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }
    
    // Scopes
    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }
    
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }
    
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}

// Usage in Controller
class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        if ($user->role === 'admin') {
            $payments = Payment::with('student')
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            $payments = Payment::forStudent($user->id)
                ->orderBy('created_at', 'desc')
                ->get();
        }
        
        return response()->json($payments);
    }
    
    public function studentSummary(Request $request)
    {
        $studentId = $request->user()->id;
        
        $summary = Payment::forStudent($studentId)
            ->selectRaw('
                COUNT(*) as total_payments,
                COUNT(CASE WHEN status = ? THEN 1 END) as completed_payments,
                COUNT(CASE WHEN status = ? THEN 1 END) as pending_payments,
                COALESCE(SUM(CASE WHEN status = ? THEN amount ELSE 0 END), 0) as total_paid,
                COALESCE(SUM(CASE WHEN status = ? THEN amount ELSE 0 END), 0) as total_pending
            ', ['completed', 'pending', 'completed', 'pending'])
            ->first();
        
        return response()->json($summary);
    }
}
```

---

## 🔐 RBAC Implementation (Role-Based Access Control)

### Laravel Middleware
```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();
        
        if (!$user || !in_array($user->role, $roles)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
        
        return $next($request);
    }
}

// routes/api.php
Route::middleware(['auth:sanctum', 'role:admin,super_admin'])->group(function () {
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::delete('/payments/{id}', [PaymentController::class, 'destroy']);
});
```

---

## 🧪 Testing Strategy

### 1. API Testing
```php
<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;

class PaymentTest extends TestCase
{
    use RefreshDatabase;
    
    public function test_student_can_view_own_payments()
    {
        $student = User::factory()->create(['role' => 'student']);
        
        $response = $this->actingAs($student)
            ->getJson('/api/payments');
        
        $response->assertStatus(200);
    }
    
    public function test_admin_can_create_payment()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        
        $response = $this->actingAs($admin)
            ->postJson('/api/payments', [
                'student_id' => 'uuid-here',
                'amount' => 1000000,
                'currency' => 'VND',
                'payment_method' => 'bank_transfer'
            ]);
        
        $response->assertStatus(201);
    }
}
```

### 2. Postman Collection
- Export Postman collection từ Node.js APIs
- Import vào Postman
- Chạy tests để verify PHP APIs trả về cùng format

---

## 🚀 Deployment Checklist

### Staging Environment
```bash
# 1. Clone repository
git clone <repo-url> sacma-php
cd sacma-php

# 2. Install dependencies
composer install --no-dev --optimize-autoloader

# 3. Environment setup
cp .env.example .env
php artisan key:generate

# 4. Database (giữ nguyên, chỉ test connection)
php artisan migrate:status  # Verify tables exist

# 5. Cache config
php artisan config:cache
php artisan route:cache

# 6. Start server
php artisan serve --host=0.0.0.0 --port=8000
```

### Production Environment
```bash
# Nginx configuration
server {
    listen 80;
    server_name api.sacma.com;
    root /var/www/sacma-php/public;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

---

## � Docker + Render Deployment (NEW)

### Dockerfile (Laravel + Reverb)
```dockerfile
# sacma-php/Dockerfile
FROM php:8.2-fpm

# Install dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    unzip \
    git \
    curl \
    && docker-php-ext-install pdo_pgsql pgsql zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy composer files first (for caching)
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader --no-dev

# Copy application
COPY . .

# Generate autoloader and run scripts
RUN composer dump-autoload --optimize \
    && composer run-script post-autoload-dump

# Set permissions
RUN chown -R www-data:www-data /var/www \
    && chmod -R 755 /var/www/storage \
    && chmod -R 755 /var/www/bootstrap/cache

# Copy startup script
COPY docker/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# Expose port for PHP-FPM
EXPOSE 9000

CMD ["/usr/local/bin/start.sh"]
```

### Render Web Service Config (render.yaml)
```yaml
# sacma-php/render.yaml
services:
  # Main Laravel API
  - type: web
    name: sacma-php
    runtime: docker
    branch: main
    dockerfilePath: ./Dockerfile
    envVars:
      - key: APP_ENV
        value: production
      - key: APP_KEY
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: sacma-postgres
          property: connectionString
      - key: JWT_SECRET  # For compatibility during migration
        generateValue: true
      - key: FRONTEND_URL
        value: https://your-project.vercel.app
      - key: CORS_ALLOWED_ORIGINS
        value: https://your-project.vercel.app,https://www.your-domain.com
      - key: IMGUR_CLIENT_ID
        sync: false  # Set manually in Render dashboard
    healthCheckPath: /api/health
    buildCommand: composer install --optimize-autoloader --no-dev
    startCommand: php artisan serve --host=0.0.0.0 --port=8000

  # Laravel Reverb WebSocket (separate service)
  - type: worker
    name: sacma-reverb
    runtime: docker
    branch: main
    dockerfilePath: ./Dockerfile
    envVars:
      - key: APP_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: sacma-postgres
          property: connectionString
    startCommand: php artisan reverb:start --host=0.0.0.0 --port=6001

  # Queue worker for notifications/emails
  - type: worker
    name: sacma-queue
    runtime: docker
    branch: main
    dockerfilePath: ./Dockerfile
    envVars:
      - key: APP_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: sacma-postgres
          property: connectionString
    startCommand: php artisan queue:work --sleep=3 --tries=3 --timeout=90

databases:
  - name: sacma-postgres
    databaseName: sacma
    user: sacma
    plan: free  # Upgrade to starter ($7/month) for production
```

### Startup Script (docker/start.sh)
```bash
#!/bin/bash
# docker/start.sh - Laravel startup script for Render

cd /var/www

# Clear and cache config
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations (skip if failed - for zero-downtime deploys)
php artisan migrate --force || echo "Migration skipped or failed"

# Start PHP-FPM
php-fpm
```

### Build & Deploy Commands
```bash
# Local build test
docker build -t sacma-php .
docker run -p 8000:8000 -e DATABASE_URL=postgres://... sacma-php

# Deploy to Render
# 1. Push to GitHub
# 2. Connect Render to repo
# 3. Render auto-deploys on push to main
```

---

## �📊 Effort Estimation

| Task | Effort (days) | Người thực hiện |
|------|--------------|-----------------|
| Laravel setup + Auth | 2-3 | Senior PHP |
| Universities API | 2 | PHP Dev |
| Students API | 2 | PHP Dev |
| Registrations API | 3 | PHP Dev |
| Payments API | 2 | PHP Dev |
| Notifications API | 2 | PHP Dev |
| Documents API | 2 | PHP Dev |
| Messages API | 2 | PHP Dev |
| Appointments API | 2 | PHP Dev |
| Scholarships API | 2 | PHP Dev |
| Visa Applications API | 2 | PHP Dev |
| Preferences + Programs | 1 | PHP Dev |
| Testing & Bug fix | 5 | QA + Dev |
| Deployment | 2 | DevOps |
| **Tổng** | **34-38 ngày** | **~8 tuần** |

---

## ✅ Checklist Trước Khi Bắt Đầu Migrate

### Bắt buộc
- [ ] **Backup toàn bộ PostgreSQL** database vào file `.sql`
- [ ] **Tạo Postman collection** cho tất cả 22 endpoints của Node.js, save response mẫu
- [ ] **Xác nhận hosting PHP** (Railway/Render) deploy thành công với project Laravel trống
- [ ] **Test Laravel Reverb WebSocket** với 10 connections đồng thời

### Nên có
- [ ] Đọc toàn bộ `server/routes/features.js` (687 lines) — đây là file phức tạp nhất, migrate cẩn thận
- [ ] Viết test case cho các business logic quan trọng (cost calculation, scholarship discount)

---

## ✅ Checklist Trước Khi Cut Over Production

### Bắt buộc
- [ ] Tất cả 22 endpoints Postman test pass 100%
- [ ] Response format giống hệt Node.js — không vỡ frontend
- [ ] Auth flow đầy đủ: login → token → protected routes → logout
- [ ] Sanctum token expiry set đúng: `1440` minutes (24h)
- [ ] CORS config đúng: allow `https://your-project.vercel.app`
- [ ] WebSocket (Reverb) kết nối được từ production domain

### Nên có
- [ ] Upload ảnh test: gửi file lên Imgur/R2, nhận URL về
- [ ] Email test: gửi email qua SendGrid từ Laravel
- [ ] Load test 50 concurrent: response time < 500ms

---

## 🔄 Rollback Plan (Nếu Laravel Có Bug Nghiêm Trọng)

```
Bước 1: Đổi vercel.json destination về Node.js URL — 30 giây
Bước 2: Push commit → Vercel auto redeploy — 2 phút
Bước 3: 100% traffic về Node.js. Zero downtime.
```

---

## 📞 Support

Nếu có vấn đề trong quá trình migration:
1. Kiểm tra Laravel logs: `storage/logs/laravel.log`
2. Verify database connection
3. Check API response format với Postman
4. Compare với Node.js implementation gốc

---

**Prepared by:** Development Team  
**Date:** April 2, 2026  
**Version:** 2.0 (Sau review kỹ thuật)
