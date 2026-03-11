# 🚨 Fix Blank Screen Issue - Go Live Troubleshooting

## ✅ Đã làm:
1. ✓ Xóa console statements
2. ✓ Tối ưu bundle với code splitting
3. ✓ Fix TypeScript config
4. ✓ Thêm ErrorBoundary để bắt lỗi

## 🔍 Để fix blank screen, cần biết:

**1. Bạn deploy ở đâu?**
- [ ] Vercel
- [ ] Netlify
- [ ] GitHub Pages
- [ ] Trang web server riêng (Apache, Nginx)
- [ ] Node.js server
- [ ] Figma Plugin

**2. URL deploy là gì?**
Ví dụ:
- `https://example.com/` (root)
- `https://example.com/app/` (subpath)
- `https://my-figma-plugin.com`

## 🔧 Quick Fixes (thử tuần tự):

### Fix 1: Khớp Base URL
Nếu deploy không ở root path, cần thêm `base` trong `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/app/',  // Nếu subpath, hoặc '/' nếu root
  // ... rest của config
})
```

### Fix 2: Check Browser Console (F12)
Mở DevTools > Console tab, báo cáo lỗi gì xuất hiện.

### Fix 3: Thử test local build
```bash
npm run build
npx vite preview
```
Truy cập http://localhost:4173 - có chạy không?

### Fix 4: Kiểm tra Asset Paths
Inspect HTML > xem script/link tags có đúng path không.
- Nếu báo error 404 on `/assets/...` = base URL sai

## 📋 Cung cấp chi tiết để tôi giúp:

1. URL deploy chính xác
2. Lỗi trong browser console
3. Build output từ: `npm run build 2>&1`
4. Webserver config (nếu có)

---

**Main entry point:** `/src/main.tsx`
**Output folder:** `/dist`
**CSS:** Tự động inject vào dist/index.html
