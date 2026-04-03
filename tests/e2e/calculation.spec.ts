/**
 * E2E Tests for SACMA Calculation Engine
 * Tests critical calculation flows using Playwright
 * 
 * Run with: npx playwright test calculation.spec.ts
 */

import { test, expect } from '@playwright/test';

// Test data
const TEST_UNIVERSITY = 'Ajou University';
const TEST_VISA_SYSTEMS = ['D4-1', 'D2-2', 'D2-3'];
const TEST_TOPIK_LEVELS = [0, 3, 5, 6];

/**
 * Test: Cost calculation formula accuracy
 * TC-E002 from QA Report
 */
test('TC-E002: Formula tổng chi phí chuẩn', async ({ page }) => {
  // Navigate to university detail
  await page.goto('/#/university/ajou-university');
  
  // Wait for cost calculator to load
  await page.waitForSelector('[data-testid="cost-calculator"]');
  
  // Select D2-2 visa system
  await page.click('[data-testid="visa-tab-d2-2"]');
  
  // Verify fixed costs display correctly
  const fixedCostVND = await page.locator('[data-testid="fixed-cost-vnd"]').textContent();
  expect(fixedCostVND).toContain('71,000,000'); // 13M + 39M + 11M + 8M
  
  // Verify KRW costs
  const krwCosts = await page.locator('[data-testid="krw-costs"]').textContent();
  expect(krwCosts).toMatch(/\d+,\d+.*KRW/);
});

/**
 * Test: Scholarship calculation with TOPIK 6 (100% discount)
 * TC-E003 from QA Report
 */
test('TC-E003: Học bổng 100% không làm total âm', async ({ page }) => {
  await page.goto('/#/university/ajou-university');
  await page.waitForSelector('[data-testid="cost-calculator"]');
  
  // Select D2-2 with high tuition
  await page.click('[data-testid="visa-tab-d2-2"]');
  
  // Select TOPIK 6 (100% scholarship)
  await page.selectOption('[data-testid="topik-select"]', '6');
  
  // Verify total is not negative
  const totalText = await page.locator('[data-testid="grand-total"]').textContent();
  const totalNumber = parseInt(totalText?.replace(/[^\d]/g, '') || '0');
  
  expect(totalNumber).toBeGreaterThanOrEqual(71000000); // At least fixed costs remain
  expect(totalText).not.toContain('-');
});

/**
 * Test: TOPIK scholarship dropdown updates costs
 * TC-D002 from QA Report
 */
test('TC-D002: TOPIK scholarship dropdown giảm học phí đúng', async ({ page }) => {
  await page.goto('/#/university/ajou-university');
  await page.waitForSelector('[data-testid="cost-calculator"]');
  
  await page.click('[data-testid="visa-tab-d2-2"]');
  
  // Get base cost without scholarship
  await page.selectOption('[data-testid="topik-select"]', '0');
  const baseCost = await page.locator('[data-testid="total-krw"]').textContent();
  const baseNumber = parseInt(baseCost?.replace(/[^\d]/g, '') || '0');
  
  // Apply TOPIK 4 (50% scholarship)
  await page.selectOption('[data-testid="topik-select"]', '4');
  const discountedCost = await page.locator('[data-testid="total-krw"]').textContent();
  const discountedNumber = parseInt(discountedCost?.replace(/[^\d]/g, '') || '0');
  
  // Verify discount was applied
  expect(discountedNumber).toBeLessThan(baseNumber);
  
  // Verify discount amount displayed
  const discountText = await page.locator('[data-testid="scholarship-amount"]').textContent();
  expect(discountText).toContain('50%');
});

/**
 * Test: Currency conversion consistency
 * TC-F001 from QA Report
 */
test('TC-F001: Currency conversion nhất quán', async ({ page }) => {
  await page.goto('/#/university/ajou-university');
  await page.waitForSelector('[data-testid="cost-calculator"]');
  
  // Get costs in different currencies
  const vndCost = await page.locator('[data-testid="total-vnd"]').textContent();
  const krwCost = await page.locator('[data-testid="total-krw"]').textContent();
  const usdCost = await page.locator('[data-testid="total-usd"]').textContent();
  
  // Extract numbers
  const vnd = parseInt(vndCost?.replace(/[^\d]/g, '') || '0');
  const krw = parseInt(krwCost?.replace(/[^\d]/g, '') || '0');
  const usd = parseInt(usdCost?.replace(/[^\d]/g, '') || '0');
  
  // Verify conversion rates are consistent (within 5% tolerance)
  const expectedUSD = Math.floor(vnd / 25500);
  expect(usd).toBeGreaterThanOrEqual(expectedUSD * 0.95);
  expect(usd).toBeLessThanOrEqual(expectedUSD * 1.05);
  
  const expectedKRW = Math.floor(vnd / 18.9);
  expect(krw).toBeGreaterThanOrEqual(expectedKRW * 0.95);
  expect(krw).toBeLessThanOrEqual(expectedKRW * 1.05);
});

/**
 * Test: Registration flow creates tracking code
 * TC-G001 from QA Report
 */
test('TC-G001: Registration tạo tracking code đúng format', async ({ page }) => {
  await page.goto('/#/student/dashboard');
  
  // Fill registration form
  await page.fill('[data-testid="student-name"]', 'Test Student');
  await page.fill('[data-testid="student-email"]', 'test@example.com');
  await page.fill('[data-testid="student-phone"]', '0912345678');
  await page.selectOption('[data-testid="visa-system"]', 'D2-2');
  
  // Submit form
  await page.click('[data-testid="submit-registration"]');
  
  // Wait for success message
  await page.waitForSelector('[data-testid="tracking-code"]');
  
  // Verify tracking code format
  const trackingCode = await page.locator('[data-testid="tracking-code"]').textContent();
  expect(trackingCode).toMatch(/^SACMA-\d{8}-[A-Z0-9]{6}$/);
});

/**
 * Test: Page refresh preserves data
 * TC-D004 from QA Report
 */
test('TC-D004: Refresh giữ nguyên selections', async ({ page }) => {
  await page.goto('/#/university/ajou-university');
  await page.waitForSelector('[data-testid="cost-calculator"]');
  
  // Make selections
  await page.click('[data-testid="visa-tab-d2-2"]');
  await page.selectOption('[data-testid="topik-select"]', '4');
  
  // Get current state
  const visaBefore = await page.locator('[data-testid="visa-tab-d2-2"]').getAttribute('aria-selected');
  const topikBefore = await page.locator('[data-testid="topik-select"]').inputValue();
  
  // Refresh page
  await page.reload();
  await page.waitForSelector('[data-testid="cost-calculator"]');
  
  // Verify state preserved (via URL params or localStorage)
  const visaAfter = await page.locator('[data-testid="visa-tab-d2-2"]').getAttribute('aria-selected');
  expect(visaAfter).toBe(visaBefore);
});

/**
 * Test: KTX calculation with multiple terms
 * TC-D003 from QA Report
 */
test('TC-D003: KTX tính đúng theo số kỳ', async ({ page }) => {
  await page.goto('/#/university/ajou-university');
  await page.waitForSelector('[data-testid="cost-calculator"]');
  
  // Select KTX 4-person room
  await page.selectOption('[data-testid="ktx-type"]', 'Phòng 4 người');
  await page.selectOption('[data-testid="ktx-duration"]', '2');
  
  const cost2Ky = await page.locator('[data-testid="ktx-cost"]').textContent();
  const cost2KyNum = parseInt(cost2Ky?.replace(/[^\d]/g, '') || '0');
  
  // Change to 4 kỳ
  await page.selectOption('[data-testid="ktx-duration"]', '4');
  const cost4Ky = await page.locator('[data-testid="ktx-cost"]').textContent();
  const cost4KyNum = parseInt(cost4Ky?.replace(/[^\d]/g, '') || '0');
  
  // Verify 4 kỳ costs twice as much as 2 kỳ (±5% tolerance)
  expect(cost4KyNum).toBeGreaterThanOrEqual(cost2KyNum * 1.9);
  expect(cost4KyNum).toBeLessThanOrEqual(cost2KyNum * 2.1);
});

/**
 * Test: Multi-university comparison
 */
test('So sánh 2 trường hiển thị đúng', async ({ page }) => {
  await page.goto('/#/student/dashboard');
  
  // Open comparison tool
  await page.click('[data-testid="compare-button"]');
  
  // Add first university
  await page.click('[data-testid="add-university-ajou"]');
  
  // Add second university
  await page.click('[data-testid="add-university-konkuk"]');
  
  // Verify both displayed
  await expect(page.locator('[data-testid="comparison-card"]')).toHaveCount(2);
  
  // Verify costs shown for both
  const cards = await page.locator('[data-testid="comparison-card"]').all();
  for (const card of cards) {
    await expect(card.locator('[data-testid="comparison-cost"]')).toBeVisible();
  }
});

/**
 * Test: PDF export generates file
 */
test('Xuất PDF tạo file tải về', async ({ page }) => {
  await page.goto('/#/university/ajou-university');
  await page.waitForSelector('[data-testid="cost-calculator"]');
  
  // Click PDF export
  await page.click('[data-testid="export-pdf-button"]');
  
  // Wait for modal
  await page.waitForSelector('[data-testid="pdf-preview-modal"]');
  
  // Click download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('[data-testid="download-pdf"]')
  ]);
  
  // Verify filename
  expect(download.suggestedFilename()).toMatch(/^SACMA-BaoGia-.*\.pdf$/);
});

/**
 * Test: Live chat counselor availability
 */
test('Live chat hiển thị tư vấn viên online', async ({ page }) => {
  await page.goto('/#/student/chat');
  await page.waitForSelector('[data-testid="chat-container"]');
  
  // Verify counselor list
  const counselors = await page.locator('[data-testid="counselor-item"]').count();
  expect(counselors).toBeGreaterThan(0);
  
  // Verify online indicator
  const onlineCount = await page.locator('[data-testid="online-indicator"]').count();
  expect(onlineCount).toBeGreaterThanOrEqual(1);
});

/**
 * Test: Booking appointment calendar
 */
test('Đặt lịch hiển thị calendar đúng', async ({ page }) => {
  await page.goto('/#/student/appointments');
  await page.waitForSelector('[data-testid="booking-calendar"]');
  
  // Select counselor
  await page.click('[data-testid="counselor-1"]');
  
  // Verify calendar shows working days
  const workingDays = await page.locator('[data-testid="working-day"]').count();
  expect(workingDays).toBeGreaterThan(0);
  
  // Verify weekend days are disabled
  const disabledDays = await page.locator('[data-testid="disabled-day"]').count();
  expect(disabledDays).toBeGreaterThanOrEqual(2); // Sat, Sun
});
