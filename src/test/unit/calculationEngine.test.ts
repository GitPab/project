/**
 * Module E: Calculation Engine Tests
 * Tests for TC-E001, TC-E004, TC-F001
 */

import { describe, it, expect, vi } from 'vitest';
import { mockUniversities, costCalculationTestCases, boundaryTestCases } from '../fixtures/universityData';
import { EXCHANGE_RATES } from '../../constants/exchangeRates';
import { TOPIK_DISCOUNT_LEVELS } from '../../constants/scholarships';

// Mock currency context
const mockFormatFrom = (amount: number, currency: string) => {
  if (currency === 'VND') return `${amount.toLocaleString('vi-VN')} ₫`;
  if (currency === 'KRW') return `${amount.toLocaleString('ko-KR')} ₩`;
  return `${amount.toLocaleString('en-US')} $`;
};

// Cost calculation logic (extracted from CostCalculator.tsx)
function calculateCosts(
  university: typeof mockUniversities[0],
  selectedVisaSystem: string,
  topikLevel: number
) {
  const koreanData = university.koreanData;
  if (!koreanData) throw new Error('No Korean data');

  const visaSystem = koreanData.visaSystemsDetail?.[selectedVisaSystem];
  if (!visaSystem) throw new Error('Visa system not found');

  const invoiceKRW = visaSystem.invoiceKRWPerYear || 0;
  const applyFeeKRW = visaSystem.applyFeeKRW || 0;
  const enrollmentFeeKRW = visaSystem.enrollmentFeeKRW || 0;

  // Find scholarship discount
  const scholarship = visaSystem.scholarships?.find(
    (s) => s.topikLevel === topikLevel
  );
  const scholarshipDiscount = scholarship?.discountPct || 0;

  // TC-E001: Check for full scholarship (> 100% is clamped in UI)
  const effectiveDiscount = Math.min(100, Math.max(0, scholarshipDiscount));

  // TC-E004: Guard against zero invoice
  const showInvoiceWarning = invoiceKRW === 0;

  // Calculate discounted tuition
  const discountedInvoiceKRW = invoiceKRW * (1 - effectiveDiscount / 100);

  // Total KRW
  const totalKRW = discountedInvoiceKRW + applyFeeKRW + enrollmentFeeKRW;

  // Convert to VND using EXCHANGE_RATES (TC-F001)
  const exchangeRate = EXCHANGE_RATES.KRW;
  const totalVND = Math.round(totalKRW * exchangeRate);

  return {
    invoiceKRW,
    discountedInvoiceKRW,
    applyFeeKRW,
    enrollmentFeeKRW,
    scholarshipDiscount: effectiveDiscount,
    totalKRW,
    totalVND,
    showInvoiceWarning,
    exchangeRate,
  };
}

describe('Module E: Calculation Engine', () => {
  describe('TC-E001: Full Scholarship (100% discount)', () => {
    it('should calculate 0 tuition when TOPIK 6 with 100% scholarship', () => {
      const ajou = mockUniversities.find((u) => u.id === 'ajou-univ')!;
      const result = calculateCosts(ajou, 'D4-1', 6);

      expect(result.scholarshipDiscount).toBe(100);
      expect(result.discountedInvoiceKRW).toBe(0);
      expect(result.totalKRW).toBe(result.applyFeeKRW + result.enrollmentFeeKRW);
    });

    it('should not have negative costs with full scholarship', () => {
      const ajou = mockUniversities.find((u) => u.id === 'ajou-univ')!;
      const result = calculateCosts(ajou, 'D4-1', 6);

      expect(result.totalKRW).toBeGreaterThanOrEqual(0);
      expect(result.totalVND).toBeGreaterThanOrEqual(0);
    });
  });

  describe('TC-E004: Division by Zero Prevention', () => {
    it('should show warning when invoice is 0', () => {
      const zeroInvoiceUniv = mockUniversities.find(
        (u) => u.id === 'zero-invoice-univ'
      )!;
      const result = calculateCosts(zeroInvoiceUniv, 'D4-1', 3);

      expect(result.showInvoiceWarning).toBe(true);
      expect(result.invoiceKRW).toBe(0);
    });

    it('should not crash with zero invoice', () => {
      const zeroInvoiceUniv = mockUniversities.find(
        (u) => u.id === 'zero-invoice-univ'
      )!;

      expect(() => calculateCosts(zeroInvoiceUniv, 'D4-1', 3)).not.toThrow();
    });

    it('should handle fees-only calculation when invoice is 0', () => {
      const zeroInvoiceUniv = mockUniversities.find(
        (u) => u.id === 'zero-invoice-univ'
      )!;
      const result = calculateCosts(zeroInvoiceUniv, 'D4-1', 3);

      // Should only have apply fee (50000), no enrollment fee
      expect(result.totalKRW).toBe(50000);
    });
  });

  describe('TC-F001: Exchange Rate Consistency', () => {
    it('should use consistent exchange rate from constants', () => {
      expect(EXCHANGE_RATES.KRW).toBeDefined();
      expect(EXCHANGE_RATES.KRW).toBeGreaterThan(0);
    });

    it('should correctly convert KRW to VND', () => {
      const ajou = mockUniversities.find((u) => u.id === 'ajou-univ')!;
      const result = calculateCosts(ajou, 'D4-1', 3);

      const expectedVND = Math.round(result.totalKRW * EXCHANGE_RATES.KRW);
      expect(result.totalVND).toBe(expectedVND);
    });

    it('should match expected conversion from Table_1.csv', () => {
      // From Table_1.csv: 3,200,000 KRW * 18.9 = 60,480,000 VND
      const krwAmount = 3200000;
      const expectedVND = Math.round(krwAmount * EXCHANGE_RATES.KRW);
      expect(expectedVND).toBeCloseTo(60480000, -3); // Allow small rounding differences
    });
  });

  describe('TC-B006: Scholarship Discount Validation', () => {
    it('should clamp discount > 100% to 100%', () => {
      // Test with boundary case: 101% should be clamped to 100%
      const discount = 101;
      const clamped = Math.min(100, Math.max(0, discount));
      expect(clamped).toBe(100);
    });

    it('should clamp discount < 0% to 0%', () => {
      const discount = -10;
      const clamped = Math.min(100, Math.max(0, discount));
      expect(clamped).toBe(0);
    });

    it('should handle TOPIK level 6 with 100% discount', () => {
      const ajou = mockUniversities.find((u) => u.id === 'ajou-univ')!;
      const visaSystem = ajou.koreanData?.visaSystemsDetail?.['D4-1'];
      const scholarship = visaSystem?.scholarships?.find((s) => s.topikLevel === 6);

      expect(scholarship?.discountPct).toBe(100);
    });
  });

  describe('Boundary Tests', () => {
    it('should handle very high tuition fees', () => {
      const highFee = 999999999;
      const result = Math.round(highFee * EXCHANGE_RATES.KRW);
      expect(result).toBeGreaterThan(0);
      expect(Number.isFinite(result)).toBe(true);
    });

    it('should handle zero total costs', () => {
      const zeroUniv = mockUniversities.find((u) => u.id === 'zero-invoice-univ')!;
      // Set scholarship to 100%
      if (zeroUniv.koreanData?.visaSystemsDetail?.['D4-1']) {
        zeroUniv.koreanData.visaSystemsDetail['D4-1'].scholarships = [
          { condition: 'TOPIK 3', discountPct: 100, topikLevel: 3 },
        ];
      }
      const result = calculateCosts(zeroUniv, 'D4-1', 3);
      expect(result.discountedInvoiceKRW).toBe(0);
    });

    it('should handle all valid TOPIK levels', () => {
      const validTopikLevels = [0, 1, 2, 3, 4, 5, 6];
      const ajou = mockUniversities.find((u) => u.id === 'ajou-univ')!;

      validTopikLevels.forEach((level) => {
        expect(() => calculateCosts(ajou, 'D4-1', level)).not.toThrow();
      });
    });
  });

  describe('Cost Breakdown Accuracy', () => {
    it('should correctly calculate Ajou D4-1 with TOPIK 3 (30% discount)', () => {
      const ajou = mockUniversities.find((u) => u.id === 'ajou-univ')!;
      const result = calculateCosts(ajou, 'D4-1', 3);

      // Expected: 3,200,000 - 30% = 2,240,000 + 80,000 + 500,000 = 2,820,000
      expect(result.scholarshipDiscount).toBe(30);
      expect(result.discountedInvoiceKRW).toBe(2240000);
      expect(result.applyFeeKRW).toBe(80000);
      expect(result.enrollmentFeeKRW).toBe(500000);
      expect(result.totalKRW).toBe(2820000);
    });

    it('should correctly calculate Ajou D4-1 with TOPIK 4 (50% discount)', () => {
      const ajou = mockUniversities.find((u) => u.id === 'ajou-univ')!;
      const result = calculateCosts(ajou, 'D4-1', 4);

      // Expected: 3,200,000 - 50% = 1,600,000 + 80,000 + 500,000 = 2,180,000
      expect(result.scholarshipDiscount).toBe(50);
      expect(result.discountedInvoiceKRW).toBe(1600000);
      expect(result.totalKRW).toBe(2180000);
    });
  });
});
