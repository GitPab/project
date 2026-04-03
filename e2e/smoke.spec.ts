/**
 * E2E Tests: Critical User Flows
 * Smoke test 10 scenarios từ QA Report
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Critical Flows', () => {
  // Test 1: Admin login
  test('TC-001: Admin login flow', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('[name="email"]', 'admin@test.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  // Test 2: Import CSV
  test('TC-002: Import Table_1.csv', async ({ page }) => {
    // Login first
    await page.goto('/admin/login');
    await page.fill('[name="email"]', 'admin@test.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to import
    await page.goto('/admin/import');
    
    // Upload CSV
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/Table_1.csv');
    
    await page.click('button:has-text("Import")');
    
    // Verify success
    await expect(page.locator('.toast-success')).toBeVisible();
  });

  // Test 3: View university with visa calculation
  test('TC-003: View Ajou University D4-1', async ({ page }) => {
    await page.goto('/university/ajou-univ');
    
    // Select D4-1 visa
    await page.click('[data-visa="D4-1"]');
    
    // Verify visa details visible
    await expect(page.locator('[data-testid="visa-details"]')).toBeVisible();
  });

  // Test 4: Cost calculation with TOPIK
  test('TC-004: Calculate costs with TOPIK 6 discount', async ({ page }) => {
    await page.goto('/university/ajou-univ');
    
    // Select visa and TOPIK level
    await page.click('[data-visa="D4-1"]');
    await page.selectOption('[name="topik-level"]', '6');
    
    // Verify 100% discount applied
    const discountEl = page.locator('[data-testid="scholarship-discount"]');
    await expect(discountEl).toContainText('100%');
  });

  // Test 5: Student registration
  test('TC-005: Student registration flow', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('[name="name"]', 'Test Student');
    await page.fill('[name="email"]', 'student@test.com');
    await page.selectOption('[name="university"]', 'ajou-univ');
    await page.selectOption('[name="program"]', 'D4-1');
    
    await page.click('button[type="submit"]');
    
    // Verify tracking code generated
    await expect(page.locator('[data-testid="tracking-code"]')).toBeVisible();
  });

  // Test 6: Currency switching
  test('TC-006: Switch currency VND→USD→KRW', async ({ page }) => {
    await page.goto('/university/ajou-univ');
    
    // Switch to USD
    await page.click('[data-currency="USD"]');
    await expect(page.locator('[data-testid="currency-display"]')).toContainText('$');
    
    // Switch to KRW
    await page.click('[data-currency="KRW"]');
    await expect(page.locator('[data-testid="currency-display"]')).toContainText('₩');
  });

  // Test 7: Responsive mobile
  test('TC-007: Mobile responsive check', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Verify content is readable
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  // Test 8: Security - access admin without auth
  test('TC-008: Unauthorized access redirect', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  // Test 9: Duplicate university validation
  test('TC-009: Add duplicate university name', async ({ page }) => {
    // Login
    await page.goto('/admin/login');
    await page.fill('[name="email"]', 'admin@test.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Try to add duplicate
    await page.goto('/admin/universities/new');
    await page.fill('[name="name"]', 'Ajou University');
    await page.click('button[type="submit"]');
    
    // Verify error toast
    await expect(page.locator('.toast-error')).toBeVisible();
  });

  // Test 10: Zero invoice warning
  test('TC-010: Zero invoice warning display', async ({ page }) => {
    await page.goto('/university/zero-invoice-univ');
    await page.click('[data-visa="D4-1"]');
    
    // Verify warning shown
    await expect(page.locator('[data-testid="invoice-warning"]')).toBeVisible();
  });
});
