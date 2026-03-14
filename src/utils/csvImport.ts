import * as XLSX from 'xlsx';
import type { FlexibleFee, FeeOption, FeeCondition } from '../types/fees';

export interface ParsedCSVData {
  fees: FlexibleFee[];
  errors: string[];
  warnings: string[];
}

// Parse accommodation fees (Ký túc xá)
export function parseAccommodationCSV(csvData: any[][]): FlexibleFee[] {
  const fees: FlexibleFee[] = [];
  
  // Skip header row
  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i];
    if (!row || row.length < 5) continue;
    
    const fee: FlexibleFee = {
      id: `accommodation-${Date.now()}-${i}`,
      name: 'Ký túc xá',
      nameVi: 'Ký túc xá',
      nameKo: '기숙사',
      type: 'optional_multiple',
      base_value: 0,
      currency: 'VND',
      time_unit: 'month',
      category: 'accommodation',
      options: [],
      applies_to: ['D4-1', 'D2-1', 'D2-2', 'D2-3'],
      note: 'Chi phí ở theo lựa chọn phòng'
    };

    // Parse room options
    if (row[1]) {
      fee.options?.push({
        id: `room-2p-${i}`,
        label: 'Phòng 2 người',
        value: parseInt(row[1].replace(/[^\d]/g, '')) || 800000,
        currency: 'VND',
        note: 'Phòng ở chung 2 người'
      });
    }

    if (row[2]) {
      fee.options?.push({
        id: `room-1p-${i}`,
        label: 'Phòng 1 người',
        value: parseInt(row[2].replace(/[^\d]/g, '')) || 1200000,
        currency: 'VND',
        note: 'Phòng riêng 1 người'
      });
    }

    if (row[3]) {
      fee.options?.push({
        id: `room-dorm-${i}`,
        label: 'Ký túc xá trường',
        value: parseInt(row[3].replace(/[^\d]/g, '')) || 600000,
        currency: 'VND',
        note: 'Ký túc xá trong khuôn viên trường'
      });
    }

    if (row[4]) {
      fee.options?.push({
        id: `room-outside-${i}`,
        label: 'Ở ngoài tự tìm',
        value: parseInt(row[4].replace(/[^\d]/g, '')) || 1000000,
        currency: 'VND',
        note: 'Tự tìm phòng ở bên ngoài'
      });
    }

    fees.push(fee);
  }

  return fees;
}

// Parse general fees (Thông tin chung)
export function parseGeneralCSV(csvData: any[][]): FlexibleFee[] {
  const fees: FlexibleFee[] = [];
  
  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i];
    if (!row || row.length < 3) continue;
    
    const feeName = row[0]?.trim();
    const amount = parseInt(row[1]?.replace(/[^\d]/g, '')) || 0;
    const note = row[2]?.trim();
    
    if (!feeName) continue;

    const fee: FlexibleFee = {
      id: `general-${Date.now()}-${i}`,
      name: feeName,
      nameVi: feeName,
      nameKo: feeName,
      type: 'fixed',
      base_value: amount,
      currency: 'VND',
      note: note,
      applies_to: ['D4-1', 'D2-1', 'D2-2', 'D2-3']
    };

    // Categorize based on fee name
    if (feeName.toLowerCase().includes('học phí') || feeName.toLowerCase().includes('tuition')) {
      fee.category = 'tuition';
    } else if (feeName.toLowerCase().includes('visa')) {
      fee.category = 'visa';
    } else if (feeName.toLowerCase().includes('bảo hiểm')) {
      fee.category = 'insurance';
    } else if (feeName.toLowerCase().includes('dịch vụ')) {
      fee.category = 'service';
    } else {
      fee.category = 'other';
    }

    fees.push(fee);
  }

  return fees;
}

// Parse D2-2 system fees
export function parseD22CSV(csvData: any[][]): FlexibleFee[] {
  const fees: FlexibleFee[] = [];
  
  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i];
    if (!row || row.length < 4) continue;
    
    const feeName = row[0]?.trim();
    const amount1 = parseInt(row[1]?.replace(/[^\d]/g, '')) || 0;
    const amount2 = parseInt(row[2]?.replace(/[^\d]/g, '')) || 0;
    const amount3 = parseInt(row[3]?.replace(/[^\d]/g, '')) || 0;
    
    if (!feeName) continue;

    // Create separate fees for different amounts
    if (amount1 > 0) {
      fees.push({
        id: `d22-1-${Date.now()}-${i}`,
        name: `${feeName} - Lần 1`,
        nameVi: `${feeName} - Lần 1`,
        nameKo: `${feeName} - 1차`,
        type: 'fixed',
        base_value: amount1,
        currency: 'VND',
        category: 'tuition',
        applies_to: ['D2-2'],
        note: 'Học phí lần 1 hệ D2-2'
      });
    }

    if (amount2 > 0) {
      fees.push({
        id: `d22-2-${Date.now()}-${i}`,
        name: `${feeName} - Lần 2`,
        nameVi: `${feeName} - Lần 2`,
        nameKo: `${feeName} - 2차`,
        type: 'fixed',
        base_value: amount2,
        currency: 'VND',
        category: 'tuition',
        applies_to: ['D2-2'],
        note: 'Học phí lần 2 hệ D2-2'
      });
    }

    if (amount3 > 0) {
      fees.push({
        id: `d22-3-${Date.now()}-${i}`,
        name: `${feeName} - Lần 3`,
        nameVi: `${feeName} - Lần 3`,
        nameKo: `${feeName} - 3차`,
        type: 'fixed',
        base_value: amount3,
        currency: 'VND',
        category: 'tuition',
        applies_to: ['D2-2'],
        note: 'Học phí lần 3 hệ D2-2'
      });
    }
  }

  return fees;
}

// Parse D2-3 system fees (similar to D2-2)
export function parseD23CSV(csvData: any[][]): FlexibleFee[] {
  return parseD22CSV(csvData); // Same structure
}

// Parse scholarship data
export function parseScholarshipCSV(csvData: any[][]): FlexibleFee[] {
  const fees: FlexibleFee[] = [];
  
  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i];
    if (!row || row.length < 5) continue;
    
    const condition = row[0]?.trim();
    const percentage = parseInt(row[1]?.replace(/[^\d]/g, '')) || 0;
    const note = row[2]?.trim();
    const appliesTo = row[3]?.trim();
    const description = row[4]?.trim();
    
    if (!condition) continue;

    const fee: FlexibleFee = {
      id: `scholarship-${Date.now()}-${i}`,
      name: 'Học bổng',
      nameVi: 'Học bổng',
      nameKo: '장학금',
      type: 'percentage',
      base_value: 50000000, // Base tuition for calculation
      currency: 'VND',
      category: 'scholarship',
      conditions: [{
        id: `condition-${i}`,
        label: condition,
        percentage: percentage,
        note: note || description,
        requirement: appliesTo
      }],
      applies_to: ['D4-1', 'D2-1', 'D2-2', 'D2-3']
    };

    fees.push(fee);
  }

  return fees;
}

// Main CSV import function
export async function importFeesFromCSV(file: File): Promise<ParsedCSVData> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let allFees: FlexibleFee[] = [];

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      throw new Error('CSV file is empty or invalid');
    }

    // Detect CSV type based on headers or content
    const firstRow = jsonData[0] as any;
    const csvType = detectCSVType(firstRow);

    switch (csvType) {
      case 'accommodation':
        allFees = parseAccommodationCSV(jsonData);
        break;
      case 'general':
        allFees = parseGeneralCSV(jsonData);
        break;
      case 'd22':
        allFees = parseD22CSV(jsonData);
        break;
      case 'd23':
        allFees = parseD23CSV(jsonData);
        break;
      case 'scholarship':
        allFees = parseScholarshipCSV(jsonData);
        break;
      default:
        // Try to auto-detect and parse
        warnings.push('Không thể xác định loại CSV, đang cố gắng phân tích tự động...');
        allFees = parseGeneralCSV(jsonData);
    }

    // Validate parsed fees
    allFees.forEach((fee, index) => {
      if (!fee.name || fee.name.trim() === '') {
        errors.push(`Dòng ${index + 2}: Tên phí không được để trống`);
      }
      if (fee.base_value < 0) {
        errors.push(`Dòng ${index + 2}: Giá trị phải là số không âm`);
      }
    });

  } catch (error) {
    errors.push(`Lỗi khi đọc file CSV: ${error.message}`);
  }

  return {
    fees: allFees,
    errors,
    warnings
  };
}

// Helper function to detect CSV type
function detectCSVType(firstRow: any): string {
  const headers = Object.keys(firstRow).map(key => key.toLowerCase());
  
  if (headers.some(h => h.includes('phòng') || h.includes('room') || h.includes('ký túc'))) {
    return 'accommodation';
  }
  
  if (headers.some(h => h.includes('d4-1'))) {
    return 'accommodation';
  }
  
  if (headers.some(h => h.includes('d2-2'))) {
    return 'd22';
  }
  
  if (headers.some(h => h.includes('d2-3'))) {
    return 'd23';
  }
  
  if (headers.some(h => h.includes('học bổng') || h.includes('scholarship') || h.includes('topik'))) {
    return 'scholarship';
  }
  
  return 'general';
}

// Export function to download fees as CSV
export function exportFeesToCSV(fees: FlexibleFee[]): void {
  const worksheet = XLSX.utils.json_to_sheet(fees.map(fee => ({
    'Tên phí': fee.name,
    'Loại': fee.type,
    'Giá trị': fee.base_value,
    'Đơn vị': fee.currency,
    'Danh mục': fee.category || '',
    'Ghi chú': fee.note || '',
    'Áp dụng cho': fee.applies_to?.join(', ') || ''
  })));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fees Export');
  
  XLSX.writeFile(workbook, 'fees_export.xlsx');
}
