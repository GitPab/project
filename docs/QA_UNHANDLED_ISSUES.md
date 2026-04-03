# SACMA - PHÂN TÍCH VẤN ĐỀ CHƯA XỬ LÝ & KẾ HOẠCH FIX

**Ngày:** April 3, 2026  
**Từ:** QA Report Analysis  
**Mục tiêu:** Xử lý tất cả vấn đề chưa hoàn thành trước khi deploy

---

## 📊 TỔNG QUAN

| Category | Đã Xử Lý | Chưa Xử Lý | Tổng |
|----------|----------|------------|------|
| 15 Rủi Ro | 9 | 6 | 15 |
| Test Cases FAIL/WARN | 4 | 8 | 12 |
| Khuyến Nghị Pre-Deploy | 4 | 2 | 6 |

---

## 🔴 6 RỦI RO CHƯA XỬ LÝ (Theo Thứ Tự Nguy Hiểm)

### 1. Rủi Ro #6: Render Cold Start 30-45s (HIGH)
**Mô tả:** Render free tier sleep sau 15 phút không hoạt động → user đầu tiên mỗi sáng bị timeout 30-45s

**Impact:** User đầu tiên mỗi ngày có trải nghiệm kém

**Giải pháp đề xuất:**
- [ ] Upgrade lên Render paid plan ($7/tháng)
- [ ] Hoặc: Tạo cron job ping `/health` mỗi 10 phút để giữ server awake

**Effort:** 30 phút (cron job) hoặc $7/tháng

---

### 2. Rủi Ro #7: SSE Disconnect Liên Tục (HIGH)
**Mô tả:** Real-time notifications không hoạt động ổn định do Render timeout 30s

**Impact:** Notifications không real-time, student không thấy update

**Giải pháp đề xuất:**
- [x] Đã có heartbeat 20s trong SSE (line 277 server.js) 
- [ ] Thêm exponential backoff reconnect ở frontend
- [ ] Thêm fallback polling khi SSE disconnect

**Effort:** 2-3 giờ

---

### 3. Rủi Ro #9: PostgreSQL Connection Pool Exhausted (HIGH)
**Mô tả:** Render free PostgreSQL max 25 connections, app có thể "too many connections"

**Impact:** App crash sau vài giờ nhiều users

**Giải pháp đề xuất:**
- [ ] Set connection pool max = 10-15 trong dbAdapter.js
- [ ] Thêm connection retry logic
- [ ] Close connections properly sau mỗi query

**Effort:** 1-2 giờ

---

### 4. Rủi Ro #10: 22 V2 Features Không Hoạt Động (MEDIUM)
**Mô tả:** API routes tồn tại nhưng frontend không gọi → data mất sau refresh

**Impact:** Student không thấy payments, appointments, scholarships, v.v.

**Giải pháp đề xuất:**
- [ ] Wire AppContext init để load từ API khi user login
- [ ] Thêm data fetching cho: payments, profiles, notifications, documents, programs, messages, appointments, scholarships, visa, preferences

**Effort:** 1-2 ngày

---

### 5. Rủi Ro #12: Không Có Rate Limiting (MEDIUM)
**Mô tả:** Public API endpoints không có rate limiting → DDoS risk

**Impact:** Có thể bị DDoS hoặc scraping

**Giải pháp đề xuất:**
- [ ] Thêm express-rate-limit cho tất cả public endpoints
- [ ] Stricter limit cho auth routes (đã có, cần verify)

**Status:** Cần kiểm tra lại - đã có rate limiting trong server.js:122-141

---

### 6. Rủi Ro #13: CSV Import Encoding (MEDIUM)
**Mô tả:** CSV từ Excel tiếng Việt (CP1252) không được xử lý → ký tự bị lỗi (Ä, Ã...)

**Impact:** Import CSV từ Excel VN thất bại

**Giải pháp đề xuất:**
- [ ] Thêm encoding detection (chardet)
- [ ] Convert CP1252 → UTF-8 trước khi parse
- [ ] Hiển thị warning về encoding

**Effort:** 2-3 giờ

---

## 🧪 8 TEST CASES FAIL/WARN CHƯA XỬ LÝ

### Module A - Admin Universities List
| TC | Status | Vấn đề | Giải pháp |
|----|--------|--------|-----------|
| TC-A003 | WARN | Sorting logic không rõ | Kiểm tra code sorting, thêm test case |
| TC-A005 | **FAIL** | Data không persist sau refresh | Wire AppContext với API /universities |

### Module B - Admin Edit/Add University
| TC | Status | Vấn đề | Giải pháp |
|----|--------|--------|-----------|
| TC-B001 | **FAIL** | Visa panels rỗng khi mở lại | Fix state initialization từ existing data |
| TC-B004 | **FAIL** | Không validation duplicate tên trường | Thêm check duplicate trong EditUniversityModal |
| TC-B008 | WARN | Routes /edit và /cost-config confusion | Verify AdminLoginSimple.tsx không gây confusion |

### Module E - Calculation Engine
| TC | Status | Vấn đề | Giải pháp |
|----|--------|--------|-----------|
| TC-E004 | WARN | Invoice KRW = 0 có thể crash | Thêm check division by zero |

### Module F - Currency Conversion
| TC | Status | Vấn đề | Giải pháp |
|----|--------|--------|-----------|
| TC-F001 | **FAIL** | Rate inconsistency (đã fix EXCHANGE_RATES) | Cần verify components đọc từ AdminExchangeRates API |

### Module G - Registration & Tracking
| TC | Status | Vấn đề | Giải pháp |
|----|--------|--------|-----------|
| TC-G001 | **FAIL** | Registration không persist sau refresh | Wire AppContext với API /registrations |
| TC-G004 | WARN | File upload là mock | Implement thật với Supabase/R2 hoặc ch í í í at th least show warning |

### Module I - Security & Performance
| TC | Status | Vấn đề | Giải pháp |
|----|--------|--------|-----------|
| TC-I001 | **FAIL** | Reset password route không auth | Không tìm thấy route này - cần double check |

---

## 🚀 2 KHUYẾN NGHỊ PRE-DEPLOY CHƯA XỬ LÝ

### Khuyến Nghị #5: JWT_SECRET throw Error (ĐÃ FIX)
✅ Đã có trong server.js:69-77

### Khuyến Nghị #6: Wire AppContext (CHƯA FIX)
⚠️ Cần implement loading từ API cho 22 features

---

## 📋 KẾ HOẠCH XỬ LÝ (Prioritized)

### Phase 1: Critical Fixes (2-3 giờ)
1. **Fix TC-B001**: Visa panels rỗng - state initialization
2. **Fix TC-B004**: Validation duplicate tên trường
3. **Fix TC-E004**: Division by zero check
4. **Verify Rate Limiting**: Check đã đúng chưa

### Phase 2: Data Persistence (4-6 giờ)
5. **Fix TC-A005, TC-G001**: Wire AppContext với APIs
6. **Implement API calls** cho: universities, registrations, payments, v.v.

### Phase 3: Infrastructure (2-3 giờ)
7. **Rủi Ro #9**: PostgreSQL connection pool config
8. **Rủi Ro #7**: SSE fallback/reconnect logic
9. **Rủi Ro #6**: Cron job ping (nếu không upgrade Render)

### Phase 4: Polish (2-3 giờ)
10. **Rủi Ro #13**: CSV encoding handling
11. **TC-G004**: Real file upload hoặc warning
12. **TC-F001**: Verify rate từ AdminExchangeRates

---

## ✅ SMOKE TEST 10 CASES (Trước Khi Deploy)

| # | Test | Expected | Status |
|---|------|----------|--------|
| 1 | Login admin → /admin/dashboard | 200 OK | ✅ Pass |
| 2 | Import Table_1.csv | 6 trường xuất hiện | ✅ Pass |
| 3 | Ajou detail → D4-1 → Total đúng | VNĐ+KRW đúng | ✅ Pass (đã fix EXCHANGE_RATES) |
| 4 | TOPIK 6 discount 100% | Total không âm | ⚠️ Cần verify |
| 5 | Student đăng ký → tracking code | Code format SACMA-* | ✅ Pass |
| 6 | POST /reset-admin-password | 401 (nếu có) | ✅ Không tìm thấy route |
| 7 | Student → /admin/universities | 403 hoặc /login | ✅ Pass |
| 8 | Currency switch | Convert đúng | ✅ Pass |
| 9 | F5 university detail | Không blank | ⚠️ Cần verify |
| 10 | Mobile 375px | No horizontal scroll | ⚠️ Cần verify |

---

## 🎯 KẾT LUẬN

**Tổng effort còn lại:** ~8-12 giờ  
**Các vấn đề nghiêm trọng nhất còn lại:**
1. Data persistence sau refresh (TC-A005, TC-G001)
2. Visa panels rỗng (TC-B001)
3. PostgreSQL connection pool (Rủi Ro #9)

**Khuyến nghị:** Nên hoàn thành Phase 1 và Phase 2 trước khi deploy.

---

**File này được tạo:** April 3, 2026  
**Cập nhật gần nhất:** April 3, 2026
