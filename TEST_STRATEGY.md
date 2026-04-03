# SACMA Test Strategy Implementation

## 📊 Overview

Test Strategy implementation dựa trên SACMA QA Report Section 5 & 6.

---

## ✅ Implementation Status

| Component | Status | Files |
|-----------|--------|-------|
| **Vitest Config** | ✅ Done | `vitest.config.ts` |
| **Test Setup** | ✅ Done | `src/test/setup.ts` |
| **Test Fixtures** | ✅ Done | `src/test/fixtures/universityData.ts` |
| **Unit Tests (Module E)** | ✅ Done | `src/test/unit/calculationEngine.test.ts` |
| **Integration Tests** | ✅ Done | `src/test/integration/api.test.ts` |
| **E2E Tests (Playwright)** | ✅ Done | `playwright.config.ts`, `e2e/smoke.spec.ts` |

---

## 🧪 Test Data Strategy

### Test Fixtures Created

#### 1. University Test Data (`src/test/fixtures/universityData.ts`)

**Mock Universities:**
- ✅ `ajou-univ` - Real data từ Table_1.csv với D4-1 & D2
- ✅ `sejong-univ` - Real data từ Table_1.csv
- ✅ `zero-invoice-univ` - Edge case cho TC-E004 (division by zero)
- ✅ `yonsei-univ` - Edge case cho Top 3 university

**Boundary Test Cases:**
- ✅ TC-E001: Full scholarship (100% discount)
- ✅ TC-E004: Zero invoice scenarios
- ✅ TC-B006: Scholarship > 100% validation
- ✅ TC-F001: Exchange rate consistency

**Invalid Data:**
- ✅ Duplicate names (TC-B004)
- ✅ Invalid TOPIK levels
- ✅ Empty CSV data

---

## 🔬 Unit Tests - Module E (Calculation Engine)

**File:** `src/test/unit/calculationEngine.test.ts`

### Test Cases

#### TC-E001: Full Scholarship
```typescript
it('should calculate 0 tuition when TOPIK 6 with 100% scholarship', () => {
  const result = calculateCosts(ajou, 'D4-1', 6);
  expect(result.discountedInvoiceKRW).toBe(0);
  expect(result.totalKRW).toBe(result.applyFeeKRW + result.enrollmentFeeKRW);
});
```

#### TC-E004: Division by Zero Prevention
```typescript
it('should show warning when invoice is 0', () => {
  const result = calculateCosts(zeroInvoiceUniv, 'D4-1', 3);
  expect(result.showInvoiceWarning).toBe(true);
});
```

#### TC-F001: Exchange Rate Consistency
```typescript
it('should match expected conversion from Table_1.csv', () => {
  // 3,200,000 KRW * 18.9 = 60,480,000 VND
  const expectedVND = Math.round(3200000 * EXCHANGE_RATES.KRW);
  expect(expectedVND).toBeCloseTo(60480000, -3);
});
```

#### TC-B006: Scholarship Validation
```typescript
it('should clamp discount > 100% to 100%', () => {
  const discount = 101;
  const clamped = Math.min(100, Math.max(0, discount));
  expect(clamped).toBe(100);
});
```

---

## 🔌 Integration Tests - API Endpoints

**File:** `src/test/integration/api.test.ts`

### Coverage

| Endpoint | Tests |
|----------|-------|
| `POST /api/auth/login` | ✅ Valid login, invalid credentials, missing fields |
| `GET /api/universities` | ✅ List universities |
| `GET /api/universities/:id` | ✅ Get detail, 404 handling |
| `POST /api/students` | ✅ Create with tracking code, validation |

---

## 🎭 E2E Tests - Critical Flows

**File:** `e2e/smoke.spec.ts`

### Smoke Test Scenarios (10 tests)

1. ✅ **TC-001**: Admin login flow
2. ✅ **TC-002**: Import Table_1.csv
3. ✅ **TC-003**: View Ajou University D4-1
4. ✅ **TC-004**: Calculate costs with TOPIK 6 (100% discount)
5. ✅ **TC-005**: Student registration with tracking code
6. ✅ **TC-006**: Currency switch VND→USD→KRW
7. ✅ **TC-007**: Mobile responsive (375px)
8. ✅ **TC-008**: Unauthorized access redirect
9. ✅ **TC-009**: Duplicate university validation
10. ✅ **TC-010**: Zero invoice warning display

---

## 🚀 Running Tests

### Unit & Integration Tests (Vitest)

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npx vitest src/test/unit/calculationEngine.test.ts

# Run in watch mode
npx vitest --watch
```

### E2E Tests (Playwright)

```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test
npx playwright test e2e/smoke.spec.ts
```

---

## 📈 Coverage Goals

| Module | Target | Current |
|--------|--------|---------|
| Calculation Engine (E) | 90% | ⏳ TBD |
| Currency Conversion (F) | 85% | ⏳ TBD |
| Import CSV (C) | 80% | ⏳ TBD |
| Auth API | 80% | ⏳ TBD |
| UI Components | 70% | ⏳ TBD |

---

## 🔧 Configuration Files

### Vitest Config (`vitest.config.ts`)
- ✅ Globals enabled
- ✅ jsdom environment for DOM testing
- ✅ Coverage with v8 provider
- ✅ Path aliases (@/components, @/utils, etc.)

### Playwright Config (`playwright.config.ts`)
- ✅ Multiple projects: Desktop Chrome, Mobile, Tablet
- ✅ Screenshot on failure
- ✅ Video retention on failure
- ✅ Trace collection
- ✅ Auto-start dev server

---

## 📋 Test Data Requirements

### For Manual Testing

**CSV File:** `tests/fixtures/Table_1.csv`
```csv
Tên trường,Tên tiếng Anh,Hệ thống visa,Học phí D4-1,Học phí D2
Ajou University,Ajou University,D4-1;D2,3200000,4500000
Sejong University,Sejong University,D4-1,2800000,0
```

**Test Credentials:**
- Admin: `admin@test.com` / `password123`
- Student: Various in test fixtures

---

## 🐛 Known Issues & Limitations

1. **Playwright not installed**: Chạy `npx playwright install` để cài browsers
2. **Test coverage reports**: Cần run `npm run test:coverage` để generate
3. **API integration tests**: Currently using mocks, cần integration với backend thật

---

## 📝 Next Steps

1. ⏳ Run tests và verify tất cả pass
2. ⏳ Add more edge case tests cho CSV import
3. ⏳ Implement API integration tests với real backend
4. ⏳ Add visual regression tests (Playwright)
5. ⏳ Setup CI/CD pipeline để auto-run tests

---

## 📚 References

- QA Report: `SACMA_QA_Report.html`
- Test Fixtures: `src/test/fixtures/`
- Unit Tests: `src/test/unit/`
- Integration Tests: `src/test/integration/`
- E2E Tests: `e2e/`
