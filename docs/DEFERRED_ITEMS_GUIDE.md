# 3 ITEMS DEFERRED - HƯỚNG DẪN XỬ LÝ CHI TIẾT

**Ngày:** April 3, 2026  
**Priority:** Medium → Low (Không blocker cho deploy)

---

## 1. CSV ENCODING (CP1252 → UTF-8)

### 🔍 Vấn Đề
- CSV từ Excel tiếng Việt dùng encoding **CP1252/Windows-1252**
- App hiện tại chỉ đọc **UTF-8** → ký tự bị lỗi (Ä, Ã, áº­...)
- Không blocker vì: Admin có thể save as UTF-8 từ Excel

### ✅ Giải Pháp (2 cách)

#### Cách 1: Auto-detect encoding (Khuyến nghị)
**Thư viện cần:** `chardet` (Node.js) hoặc `jschardet` (browser)

```typescript
// src/utils/csvEncoding.ts (NEW FILE)
import * as chardet from 'chardet';
import { decode } from 'iconv-lite';

export async function detectAndConvertEncoding(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const detected = chardet.detect(Buffer.from(buffer));
  
  // Nếu là UTF-8, trả về nguyên bản
  if (detected === 'UTF-8') {
    return new TextDecoder('utf-8').decode(buffer);
  }
  
  // Nếu là CP1252/Windows-1252, convert sang UTF-8
  if (detected === 'windows-1252' || detected === 'ISO-8859-1') {
    const converted = decode(Buffer.from(buffer), 'win1252');
    return converted;
  }
  
  // Fallback: thử UTF-8 trước, nếu lỗi thì thử CP1252
  try {
    return new TextDecoder('utf-8').decode(buffer);
  } catch {
    return decode(Buffer.from(buffer), 'win1252');
  }
}

export function hasEncodingIssues(text: string): boolean {
  // Detect common encoding corruption patterns
  const corruptionPatterns = [/Ã¢/, /áº/, /á»/, /Ã©/, /Ã¬/, /Ã²/, /Ã¹/];
  return corruptionPatterns.some(pattern => pattern.test(text));
}
```

**Cài đặt dependencies:**
```bash
npm install chardet iconv-lite
npm install -D @types/chardet @types/iconv-lite
```

#### Cách 2: Warning UI (Simple fix)
Thêm warning khi import CSV:

```typescript
// Trong ImportUniversitiesModal.tsx
const handleFileUpload = async (file: File) => {
  const text = await file.text();
  
  // Check for encoding issues
  if (hasEncodingIssues(text)) {
    toast.warning(
      'File CSV có thể có lỗi encoding. ' +
      'Vui lòng save as UTF-8 từ Excel: File → Save As → CSV UTF-8',
      { duration: 10000 }
    );
  }
  
  // Continue processing...
};
```

### ⏱️ Effort: 2-3 giờ (Cách 1) hoặc 30 phút (Cách 2)

---

## 2. 22 API ROUTES WIRING (Frontend → Backend)

### 🔍 Vấn Đề
- Backend đã có đầy đủ 22 API routes v2
- Frontend chưa gọi các API này trong `AppContext.tsx`
- Data không persist sau refresh (vì chỉ lưu trong state, không fetch từ API)

### ✅ Backend Routes Đã Có
```
/api/payments          - Financial transactions
/api/student-profiles  - Extended student info
/api/notifications     - System alerts
/api/documents         - File uploads
/api/programs          - Study programs
/api/messages          - Internal messaging
/api/appointments      - Calendar & scheduling
/api/scholarships      - Scholarship data
/api/visa-applications - Visa tracking
/api/user-preferences  - Settings
... và 12 routes khác
```

### ✅ Giải Pháp: Wire AppContext

**File cần sửa:** `src/app/context/AppContext.tsx`

```typescript
// 1. Thêm state cho các features mới
interface AppState {
  universities: University[];
  students: Student[];
  registrations: Registration[];
  // NEW: Add missing states
  payments: Payment[];
  studentProfiles: StudentProfile[];
  notifications: Notification[];
  documents: Document[];
  programs: Program[];
  messages: Message[];
  appointments: Appointment[];
  scholarships: Scholarship[];
  visaApplications: VisaApplication[];
  userPreferences: UserPreferences;
}

// 2. Thêm loading effects
useEffect(() => {
  if (user) {
    loadUniversities();
    loadStudents();
    loadRegistrations();
    // NEW: Load all data when user logs in
    loadPayments();
    loadStudentProfiles();
    loadNotifications();
    loadDocuments();
    loadPrograms();
    loadMessages();
    loadAppointments();
    loadScholarships();
    loadVisaApplications();
    loadUserPreferences();
  }
}, [user]);

// 3. Thêm API functions
const loadPayments = async () => {
  try {
    const response = await apiClient.get('/api/payments');
    dispatch({ type: 'SET_PAYMENTS', payload: response.data });
  } catch (error) {
    console.error('Failed to load payments:', error);
  }
};

// Tương tự cho 21 functions khác...
```

### ✅ Alternative: Lazy Loading
Thay vì load tất cả cùng lúc, chỉ load khi cần:

```typescript
// src/app/services/apiService.ts (NEW FILE)
export const paymentsApi = {
  getAll: () => apiClient.get('/api/payments'),
  getById: (id: string) => apiClient.get(`/api/payments/${id}`),
  create: (data: PaymentCreate) => apiClient.post('/api/payments', data),
  update: (id: string, data: PaymentUpdate) => apiClient.patch(`/api/payments/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/payments/${id}`),
};

export const scholarshipsApi = {
  getAll: () => apiClient.get('/api/scholarships'),
  apply: (scholarshipId: string, studentId: string) => 
    apiClient.post(`/api/scholarships/${scholarshipId}/apply`, { studentId }),
  // ...
};

// Sử dụng trong component
import { paymentsApi } from '@/app/services/apiService';

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  
  useEffect(() => {
    paymentsApi.getAll().then(res => setPayments(res.data));
  }, []);
};
```

### ⏱️ Effort: 1-2 ngày (full wiring) hoặc 4-6 giờ (lazy loading)

---

## 3. AUTOMATED TESTS

### 🔍 Vấn Đề
- Không có test suite để verify functionality
- QA phải test manual mỗi lần deploy
- High risk khi thêm features mới

### ✅ Giải Pháp: Setup Vitest + React Testing Library

**Vitest đã có trong project** (theo package.json)

#### Bước 1: Setup config
```typescript
// vitest.config.ts (hoặc cập nhật)
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
});
```

#### Bước 2: Setup test utilities
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

#### Bước 3: Viết tests cho critical functions

**Test 1: EXCHANGE_RATES calculation**
```typescript
// src/constants/__tests__/exchangeRates.test.ts
import { describe, it, expect } from 'vitest';
import { EXCHANGE_RATES, convertToVND, convertFromVND } from '../exchangeRates';

describe('EXCHANGE_RATES', () => {
  it('should have correct KRW rate (18.9)', () => {
    expect(EXCHANGE_RATES.KRW).toBe(18.9);
  });

  it('should have correct USD rate (25500)', () => {
    expect(EXCHANGE_RATES.USD).toBe(25500);
  });

  it('should convert KRW to VND correctly', () => {
    const result = convertToVND(1000000, 'KRW'); // 1M KRW
    expect(result).toBe(18900000); // 18.9M VND
  });

  it('should convert USD to VND correctly', () => {
    const result = convertToVND(1000, 'USD'); // 1K USD
    expect(result).toBe(25500000); // 25.5M VND
  });
});
```

**Test 2: CSV sanitization**
```typescript
// src/utils/__tests__/csvImport.test.ts
import { describe, it, expect } from 'vitest';
import { sanitizeField, detectInjectionAttempts } from '../csvImport';

describe('CSV Import Security', () => {
  it('should detect SQL injection', () => {
    const result = sanitizeField('DROP TABLE users', 'name');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Trường "name" chứa ký tự nguy hiểm');
  });

  it('should detect formula injection', () => {
    const issues = detectInjectionAttempts([['=cmd|/C calc']);
    expect(issues.length).toBeGreaterThan(0);
  });

  it('should sanitize dangerous characters', () => {
    const result = sanitizeField('test<script>alert(1)</script>', 'name');
    expect(result.sanitizedValue).not.toContain('<script>');
  });
});
```

**Test 3: Cost calculation**
```typescript
// src/app/components/__tests__/CostCalculator.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCostCalculation } from '../hooks/useCostCalculation';

describe('CostCalculator', () => {
  it('should handle invoice = 0 without crash', () => {
    const { result } = renderHook(() => useCostCalculation({
      invoice: 0,
      topikLevel: 6,
      scholarshipDiscount: 100,
    }));
    
    expect(result.totalKRW).not.toBeNaN();
    expect(result.totalKRW).toBeGreaterThanOrEqual(0);
  });

  it('should calculate TOPIK discount correctly', () => {
    const { result } = renderHook(() => useCostCalculation({
      invoice: 5800000,
      topikLevel: 3,
      scholarshipDiscount: 30,
    }));
    
    // 30% of 5.8M = 1.74M discount
    expect(result.hocBong).toBe(-1740000);
  });
});
```

#### Bước 4: Thêm smoke tests
```typescript
// src/test/smoke.test.ts
import { describe, it, expect } from 'vitest';

describe('Smoke Tests', () => {
  it('should have all required env variables', () => {
    expect(import.meta.env.VITE_API_URL).toBeDefined();
  });

  it('should have valid JWT_SECRET in production', () => {
    if (process.env.NODE_ENV === 'production') {
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.JWT_SECRET).not.toBe('dev-secret-do-not-use-in-production');
    }
  });
});
```

#### Bước 5: Chạy tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode (dev)
npm run test:watch
```

### ⏱️ Effort: 1 ngày (setup + 10-15 core tests)

---

## 📊 TỔNG KẾT

| Item | Effort | Priority | Approach |
|------|--------|----------|----------|
| **CSV Encoding** | 2-3 giờ | Medium | Cách 2 (warning UI) trước, sau đó Cách 1 (auto-detect) |
| **22 API Wiring** | 1-2 ngày | Medium | Lazy loading (4-6 giờ) trước, full wiring sau |
| **Automated Tests** | 1 ngày | Low | Core tests trước, coverage sau |

---

## 🎯 KHUYẾN NGHỊ THỰC HIỆN

### Phase 1 (Sau deploy 1-2 tuần)
1. ✅ CSV Encoding warning UI (30 phút)
2. ✅ Lazy loading cho 22 API routes (4-6 giờ)
3. ✅ 10-15 core unit tests (1 ngày)

### Phase 2 (Sau 1 tháng)
1. CSV auto-detect encoding
2. Full AppContext wiring
3. E2E tests với Playwright

---

**File này được tạo:** April 3, 2026
