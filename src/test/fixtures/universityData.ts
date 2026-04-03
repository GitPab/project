/**
 * Test Data Fixtures for SACMA
 * Based on QA Report Section 6 - Test Data Strategy
 */

import { University, KoreanUniversityData, VisaSystemDetail, ScholarshipCondition } from '../../types/university';

// Helper to create proper VisaSystemDetail
const createVisaSystem = (data: Partial<VisaSystemDetail>): VisaSystemDetail => ({
  available: true,
  invoiceKRWPerYear: 0,
  applyFeeKRW: 0,
  enrollmentFeeKRW: 0,
  scholarships: [],
  ktxOptions: [],
  financialRequirement: {
    soTietKiemOptions: [],
    luiNThang: 3,
  },
  ...data,
});

// Real-world universities based on Table_1.csv
export const mockUniversities: University[] = [
  {
    id: 'ajou-univ',
    name: 'Ajou University',
    country: 'South Korea',
    countryCode: '🇰🇷',
    koreanData: {
      isKoreanUniversity: true,
      address: 'Suwon, Gyeonggi-do',
      topVisa: 'D4-1',
      visaSystemsDetail: {
        'D4-1': createVisaSystem({
          invoiceKRWPerYear: 3200000,
          applyFeeKRW: 80000,
          enrollmentFeeKRW: 500000,
          scholarships: [
            { condition: 'TOPIK 3', discountPct: 30, topikLevel: 3 },
            { condition: 'TOPIK 4', discountPct: 50, topikLevel: 4 },
            { condition: 'TOPIK 5', discountPct: 70, topikLevel: 5 },
            { condition: 'TOPIK 6', discountPct: 100, topikLevel: 6 },
          ],
        }),
        'D2-2': createVisaSystem({
          invoiceKRWPerYear: 4500000,
          applyFeeKRW: 100000,
          enrollmentFeeKRW: 1000000,
          scholarships: [
            { condition: 'TOPIK 4', discountPct: 30, topikLevel: 4 },
            { condition: 'TOPIK 5', discountPct: 50, topikLevel: 5 },
            { condition: 'TOPIK 6', discountPct: 100, topikLevel: 6 },
          ],
        }),
      },
      commonFeesVND: [
        { id: 'd4-visa', name: 'Phí visa D4', amount: 3150000, editable: true },
        { id: 'd2-visa', name: 'Phí visa D2', amount: 9450000, editable: true },
        { id: 'insurance', name: 'Bảo hiểm y tế', amount: 12000000, editable: true },
        { id: 'airfare', name: 'Vé máy bay', amount: 6300000, editable: true },
      ],
    } as KoreanUniversityData,
    systems: [],
  },
  {
    id: 'sejong-univ',
    name: 'Sejong University',
    country: 'South Korea',
    countryCode: '🇰🇷',
    koreanData: {
      isKoreanUniversity: true,
      address: 'Seoul',
      topVisa: 'D4-1',
      visaSystemsDetail: {
        'D4-1': createVisaSystem({
          invoiceKRWPerYear: 2800000,
          applyFeeKRW: 50000,
          enrollmentFeeKRW: 0,
          scholarships: [
            { condition: 'TOPIK 3', discountPct: 20, topikLevel: 3 },
            { condition: 'TOPIK 4', discountPct: 40, topikLevel: 4 },
            { condition: 'TOPIK 5', discountPct: 60, topikLevel: 5 },
            { condition: 'TOPIK 6', discountPct: 100, topikLevel: 6 },
          ],
        }),
      },
      commonFeesVND: [
        { id: 'd4-visa', name: 'Phí visa D4', amount: 3150000, editable: true },
        { id: 'insurance', name: 'Bảo hiểm y tế', amount: 12000000, editable: true },
        { id: 'airfare', name: 'Vé máy bay', amount: 6300000, editable: true },
      ],
    } as KoreanUniversityData,
    systems: [],
  },
  // Edge case: Zero invoice (TC-E004)
  {
    id: 'zero-invoice-univ',
    name: 'Zero Invoice University',
    country: 'South Korea',
    countryCode: '🇰🇷',
    koreanData: {
      isKoreanUniversity: true,
      visaSystemsDetail: {
        'D4-1': createVisaSystem({
          invoiceKRWPerYear: 0,
          applyFeeKRW: 50000,
          enrollmentFeeKRW: 0,
          scholarships: [
            { condition: 'TOPIK 3', discountPct: 50, topikLevel: 3 },
          ],
        }),
      },
      commonFeesVND: [
        { id: 'd4-visa', name: 'Phí visa D4', amount: 3150000, editable: true },
        { id: 'airfare', name: 'Vé máy bay', amount: 6300000, editable: true },
      ],
    } as KoreanUniversityData,
    systems: [],
  },
  // Edge case: Top 3 university
  {
    id: 'yonsei-univ',
    name: 'Yonsei University',
    country: 'South Korea',
    countryCode: '🇰🇷',
    top_tier: 'Top1',
    koreanData: {
      isKoreanUniversity: true,
      topTier: 'Top1',
      address: 'Seoul',
      visaSystemsDetail: {
        'D4-1': createVisaSystem({
          invoiceKRWPerYear: 5000000,
          applyFeeKRW: 100000,
          enrollmentFeeKRW: 1000000,
          scholarships: [
            { condition: 'TOPIK 4', discountPct: 20, topikLevel: 4 },
            { condition: 'TOPIK 5', discountPct: 40, topikLevel: 5 },
            { condition: 'TOPIK 6', discountPct: 100, topikLevel: 6 },
          ],
        }),
      },
      commonFeesVND: [
        { id: 'd4-visa', name: 'Phí visa D4', amount: 3150000, editable: true },
        { id: 'insurance', name: 'Bảo hiểm y tế', amount: 12000000, editable: true },
        { id: 'airfare', name: 'Vé máy bay', amount: 6300000, editable: true },
      ],
    } as KoreanUniversityData,
    systems: [],
  },
];

// Boundary test data for Module E (Calculation Engine)
export const boundaryTestCases = {
  // TC-E001: Full scholarship edge case
  fullScholarship: {
    invoiceKRW: 5000000,
    applyFeeKRW: 100000,
    enrollmentFeeKRW: 1000000,
    topikLevel: 6,
    scholarshipDiscount: 100,
    expectedTotalKRW: 1100000, // Only fees, no tuition
  },
  
  // TC-E004: Division by zero scenarios
  zeroInvoice: {
    invoiceKRW: 0,
    applyFeeKRW: 50000,
    enrollmentFeeKRW: 0,
    topikLevel: 3,
    scholarshipDiscount: 50,
    expectedBehavior: 'showInvoiceWarning',
  },
  
  // Scholarship percentage boundaries
  scholarshipBoundaries: [
    { discount: 0, description: 'No discount' },
    { discount: 30, description: 'Standard discount' },
    { discount: 50, description: 'Half tuition' },
    { discount: 99, description: 'Near full' },
    { discount: 100, description: 'Full scholarship' },
    { discount: 101, description: 'Invalid >100% (TC-B006)' },
  ],
  
  // TOPIK levels
  topikLevels: [0, 1, 2, 3, 4, 5, 6, 7], // 7 is invalid
};

// TC-B004: Duplicate name test data
export const duplicateNameTestCases = [
  { name: 'Ajou University', existingNames: ['Ajou University', 'Sejong University'], shouldFail: true },
  { name: 'New University', existingNames: ['Ajou University', 'Sejong University'], shouldFail: false },
  { name: '   Ajou University   ', existingNames: ['Ajou University'], shouldFail: true }, // Whitespace
  { name: 'AJOU UNIVERSITY', existingNames: ['Ajou University'], shouldFail: true }, // Case insensitive
];

// CSV test data for Module C (Import)
export const csvTestData = {
  valid: `Tên trường,Tên tiếng Anh,Hệ thống visa,Học phí D4-1,Học phí D2
Ajou University,Ajou University,D4-1;D2,3200000,4500000
Sejong University,Sejong University,D4-1,2800000,0`,
  
  invalid: {
    empty: '',
    noHeader: 'Ajou University,3200000',
    wrongFormat: 'Name|Tuition\nAjou|abc',
    missingRequired: 'Name\nTest University',
  },
};

// Cost calculation test cases (Module E)
export const costCalculationTestCases = [
  {
    name: 'Ajou D4-1 TOPIK 3 (30% discount)',
    university: 'ajou-univ',
    visaSystem: 'D4-1',
    topikLevel: 3,
    expectedDiscount: 30,
    expectedInvoiceAfterDiscount: 2240000, // 3200000 * 0.7
  },
  {
    name: 'Ajou D4-1 TOPIK 6 (100% discount)',
    university: 'ajou-univ',
    visaSystem: 'D4-1',
    topikLevel: 6,
    expectedDiscount: 100,
    expectedInvoiceAfterDiscount: 0,
  },
  {
    name: 'Zero invoice university',
    university: 'zero-invoice-univ',
    visaSystem: 'D4-1',
    topikLevel: 3,
    expectedBehavior: 'showInvoiceWarning',
  },
];
