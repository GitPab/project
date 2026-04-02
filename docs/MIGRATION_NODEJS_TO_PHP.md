# Kế Hoạch Migration: Node.js → PHP (Laravel)

**Phiên bản:** 1.0  
**Ngày:** April 2, 2026  
**Dự án:** SACMA - Student Abroad Cost Management Application  
**Migration từ:** Node.js + Express → PHP + Laravel  
**Database:** PostgreSQL (giữ nguyên 100%)

---

## 📋 Tóm Tắt

Dự án SACMA hiện tại sử dụng:
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js 18 + Express.js
- **Database:** PostgreSQL (31 tables)
- **API:** 22 REST endpoints

**Mục tiêu:** Chuyển backend sang PHP (Laravel) để team dễ maintain, giữ nguyên database và frontend.

---

## ✅ Điều Kiện Tiên Quyết

### 1. Database (KHÔNG THAY ĐỔI)
```
✓ PostgreSQL giữ nguyên
✓ 31 tables giữ nguyên structure
✓ All data giữ nguyên
✓ Indexes, constraints giữ nguyên
✓ Chỉ thay đổi connection string
```

### 2. Frontend (KHÔNG THAY ĐỔI)
```
✓ React + TypeScript giữ nguyên
✓ API calls giữ nguyên format
✓ Chỉ thay đổi base URL nếu cần
```

### 3. Yêu Cầu PHP Environment
```
✓ PHP 8.2+
✓ Composer
✓ Laravel 10.x
✓ PostgreSQL extension (pdo_pgsql)
✓ Web server (Nginx/Apache)
```

---

## 🗓️ Timeline Migration (4-6 tuần)

### Tuần 1: Setup & Foundation
| Ngày | Nhiệm vụ | Output |
|------|----------|--------|
| 1-2 | Tạo Laravel project, config DB | `sacma-php/` project |
| 3 | Migrate authentication (JWT → Sanctum) | Auth API hoạt động |
| 4-5 | Migrate Users & Roles API | Users CRUD hoạt động |

### Tuần 2: Core APIs
| Ngày | Nhiệm vụ | Output |
|------|----------|--------|
| 6-7 | Migrate Universities API | Universities CRUD |
| 8-9 | Migrate Students API | Students CRUD |
| 10-12 | Migrate Registrations API | Registrations + tracking |

### Tuần 3: Feature APIs (v2.0)
| Ngày | Nhiệm vụ | Output |
|------|----------|--------|
| 13-14 | Migrate Payments API | Payment management |
| 15-16 | Migrate Notifications API | Notification system |
| 17-19 | Migrate Documents API | Document upload/review |

### Tuần 4: Advanced Features
| Ngày | Nhiệm vụ | Output |
|------|----------|--------|
| 20-21 | Migrate Messages API | Internal messaging |
| 22-23 | Migrate Appointments API | Calendar scheduling |
| 24-26 | Migrate Scholarships & Visa | Complex workflows |

### Tuần 5: Integration & Testing
| Ngày | Nhiệm vụ | Output |
|------|----------|--------|
| 27-28 | Migrate remaining APIs (Preferences, Programs) | All 22 APIs done |
| 29-30 | Integration testing | Bug fixes |
| 31-33 | Frontend integration test | Full system test |

### Tuần 6: Deployment
| Ngày | Nhiệm vụ | Output |
|------|----------|--------|
| 34-35 | Staging deployment | Test on staging |
| 36-37 | Production deployment | Go live |
| 38-42 | Monitoring & bug fixes | Stable system |

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

## 📊 Effort Estimation

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
| **Tổng** | **30-33 ngày** | **~1.5 tháng** |

---

## ✅ Success Criteria

1. **All 22 API endpoints** hoạt động giống Node.js
2. **Frontend không cần thay đổi** (chỉ đổi base URL)
3. **Database giữ nguyên** (không mất data)
4. **Authentication** hoạt động (JWT → Sanctum)
5. **RBAC** hoạt động đúng permissions
6. **Response format** giống Node.js (để frontend không broken)

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
**Version:** 1.0
