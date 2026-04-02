# Development Guide

Hướng dẫn phát triển và đóng góp cho SACMA Project.

---

## 📋 Mục Lục

1. [Môi Trường Phát Triển](#môi-trường-phát-triển)
2. [Cấu Trúc Project](#cấu-trúc-project)
3. [Quy Trình Phát Triển](#quy-trình-phát-triển)
4. [Tiêu Chuẩn Code](#tiêu-chuẩn-code)
5. [Testing](#testing)
6. [Debugging](#debugging)
7. [API Development](#api-development)
8. [Frontend Development](#frontend-development)

---

## Môi Trường Phát Triển

### Yêu Cầu Hệ Thống

- **Node.js**: 18.x LTS trở lên
- **npm**: 9.x trở lên
- **PostgreSQL**: 14.x trở lên
- **Git**: 2.x trở lên
- **VS Code**: Khuyến nghị (với extensions)

### VS Code Extensions Khuyến Nghị

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Thiết Lập Môi Trường

```bash
# 1. Clone repository
git clone <repository-url>
cd project

# 2. Cài đặt dependencies
npm install
cd server && npm install && cd ..

# 3. Thiết lập environment
cp .env.example .env.local
cp server/.env.example server/.env

# 4. Chỉnh sửa file .env với thông tin của bạn
# VITE_API_URL=http://localhost:3001/api
# DATABASE_URL=postgresql://...

# 5. Chạy development server
npm run dev:full
```

---

## Cấu Trúc Project

### Frontend (`src/`)

```
src/
├── app/
│   ├── features/          # Feature-based modules
│   │   ├── auth/         # Authentication
│   │   ├── universities/ # University management
│   │   ├── students/     # Student portal
│   │   ├── payments/     # Payment system
│   │   └── ...
│   ├── layouts/          # Layout components
│   └── shared/           # Shared resources
│       ├── components/   # Reusable UI
│       ├── hooks/        # Custom hooks
│       └── utils/        # Utilities
├── assets/               # Static assets
└── styles/               # Global styles
```

### Backend (`server/`)

```
server/
├── src/
│   ├── config/           # Configuration
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   │   ├── auth.js
│   │   ├── payments.js
│   │   └── ...
│   ├── services/         # Business logic
│   └── utils/            # Utilities
├── tests/                # Server tests
└── migrations/             # DB migrations
```

### Nguyên Tắc Tổ Chức

1. **Feature-Based**: Code được tổ chức theo tính năng, không theo loại
2. **Clean Exports**: Dùng index.ts để export gọn gàng
3. **Separation of Concerns**: Tách biệt rõ ràng giữa các layer

---

## Quy Trình Phát Triển

### 1. Tạo Branch Mới

```bash
# Từ main branch
git checkout main
git pull origin main

# Tạo branch mới
git checkout -b feature/ten-tinh-nang
# hoặc
git checkout -b fix/mo-ta-loi
```

### 2. Commit Changes

```bash
# Stage changes
git add .

# Commit với message rõ ràng
git commit -m "feat: thêm tính năng thanh toán"
git commit -m "fix: sửa lỗi đăng nhập"
git commit -m "docs: cập nhật API documentation"
```

### 3. Pull Request

1. Push branch lên remote
2. Tạo Pull Request với mô tả rõ ràng
3. Yêu cầu review từ team member
4. Merge sau khi được approve

---

## Tiêu Chuẩn Code

### Naming Conventions

| Loại | Quy ước | Ví dụ |
|------|---------|-------|
| Components | PascalCase | `PaymentForm.tsx` |
| Hooks | camelCase + use | `usePayments.ts` |
| Utils | camelCase | `formatCurrency.ts` |
| Constants | SCREAMING_SNAKE | `API_BASE_URL` |
| API Routes | camelCase | `payments.js` |
| Database | snake_case | `student_profiles` |

### File Structure

```typescript
// 1. Imports
import React from 'react';
import { useAuth } from '@/app/features/auth';

// 2. Types/Interfaces
interface Props {
  userId: string;
}

// 3. Component/Function
export const ComponentName: React.FC<Props> = ({ userId }) => {
  // Logic
  
  // Return
  return <div>...</div>;
};

// 4. Exports
export default ComponentName;
```

### Error Handling

```typescript
// ✅ Tốt
try {
  const data = await api.get('/payments');
  return data;
} catch (error) {
  logger.error('Failed to fetch payments', { error });
  throw new Error('Unable to load payments');
}

// ❌ Không tốt
try {
  const data = await api.get('/payments');
} catch (e) {
  console.log(e);
}
```

---

## Testing

### Unit Tests

```bash
# Chạy tất cả tests
npm test

# Chạy tests với coverage
npm run test:coverage

# Chạy tests cho file cụ thể
npm test -- payments.test.ts
```

### Test Structure

```typescript
describe('PaymentService', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should create payment successfully', async () => {
    // Arrange
    const paymentData = { amount: 1000000 };
    
    // Act
    const result = await createPayment(paymentData);
    
    // Assert
    expect(result.status).toBe('pending');
    expect(result.amount).toBe(1000000);
  });
});
```

### Integration Tests

```bash
# Chạy integration tests
npm run test:integration

# Chạy E2E tests
npm run test:e2e
```

---

## Debugging

### Backend Debugging

```bash
# Chạy với debug mode
cd server
node --inspect server.js

# Hoặc dùng nodemon
npx nodemon --inspect server.js
```

### Frontend Debugging

```typescript
// Thêm breakpoint
console.log('Debug:', data);
debugger;

// Hoặc dùng React DevTools
// Cài đặt extension React Developer Tools
```

### Log Levels

```typescript
import { logger } from '@/app/shared/utils';

logger.debug('Debug info');      // Development only
logger.info('General info');     // Always logged
logger.warn('Warning');          // Potential issues
logger.error('Error occurred');  // Errors
```

---

## API Development

### Tạo Route Mới

```javascript
// server/routes/newFeature.js
import express from 'express';
import { requirePermission } from '../utils/rbac.js';
import { logger } from '../logger.js';

const router = express.Router();

/**
 * GET /api/new-feature
 * List items
 */
router.get('/', async (req, res) => {
  try {
    // Logic
    res.json({ data: [] });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
```

### Register Route

```javascript
// server/server.js
import newFeatureRoutes from './routes/newFeature.js';

// ... other routes
app.use('/api/new-feature', newFeatureRoutes);
```

### Validation

```javascript
import { body, validationResult } from 'express-validator';

router.post('/', [
  body('name').notEmpty().trim(),
  body('email').isEmail(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ...
});
```

---

## Frontend Development

### Tạo Feature Mới

```bash
# 1. Tạo thư mục feature
mkdir -p src/app/features/newFeature

# 2. Tạo files
# - index.ts (exports)
# - Component.tsx
# - useNewFeature.ts (hook)
# - types.ts
```

### Hook Pattern

```typescript
// useNewFeature.ts
import { useState, useEffect } from 'react';
import { api } from '@/app/shared/utils';

export const useNewFeature = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/new-feature');
      setData(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};
```

### Component Pattern

```typescript
// Component.tsx
import React from 'react';
import { useNewFeature } from './useNewFeature';
import { Loading, ErrorState } from '@/app/shared/components';

export const FeatureComponent: React.FC = () => {
  const { data, loading, error } = useNewFeature();

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} />;

  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
};
```

---

## Database Development

### Tạo Migration

```bash
cd server
npm run migration:create ten_migration
```

### Migration Template

```javascript
export async function up(pool) {
  await pool.query(`
    CREATE TABLE new_table (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

export async function down(pool) {
  await pool.query(`DROP TABLE IF EXISTS new_table;`);
}
```

### Chạy Migration

```bash
# Development
npm run migrate

# Production
npm run migrate:prod
```

---

## Troubleshooting

### Lỗi Thường Gặp

#### 1. Server không khởi động

```bash
# Kiểm tra database connection
psql $DATABASE_URL -c "SELECT 1;"

# Kiểm tra port
lsof -i :3001

# Xem logs
cd server && npm start 2>&1 | tee server.log
```

#### 2. API returns 500

```bash
# Kiểm tra database tables
psql $DATABASE_URL -c "\dt"

# Kiểm tra logs
tail -f server/server-start.log
```

#### 3. Frontend không kết nối API

```bash
# Kiểm tra CORS
curl -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -I http://localhost:3001/api/health

# Kiểm tra proxy (nếu dùng Vite)
cat vite.config.ts | grep proxy
```

---

## Liên Hệ & Hỗ Trợ

- **Email**: dev@sacma.com
- **Slack**: #sacma-dev
- **Documentation**: `/docs` trong project
- **Issues**: GitHub Issues

---

**Last Updated:** 2026-04-02
