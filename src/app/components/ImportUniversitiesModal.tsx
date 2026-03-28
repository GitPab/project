import React, { useMemo, useState } from 'react';
import ExcelJS from 'exceljs';
import { X, Upload, FileSpreadsheet, CheckCircle, ChevronRight, ChevronLeft, Loader } from 'lucide-react';
import type { University } from '../context/AppContext';
import { useApp } from '../context/AppContext';

const FILE_READ_ERROR = 'Không thể đọc file. Vui lòng kiểm tra định dạng CSV/XLSX.';

interface ImportUniversitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport?: (universities: University[]) => void;
}

type Step = 1 | 2 | 3 | 4;

type MappingConfidence = 'auto' | 'check' | 'manual';
type MappingEntry = { field: string; confidence: MappingConfidence; manual?: boolean };

type ParsedRow = {
  name: string;
  name_korean: string;
  country: string;
  address: string;
  area: string;
  ranking: number | null;
  top_tier: string;
  majors: string[];
  visa_systems: Record<string, any>;
  admission: Record<string, { gpa_min: number | null; gap_year_limit: number | null }>;
  scholarships: Record<string, any[]>;
  ktx_options: Array<{ name: string; price_krw: number }>;
  dormitory_info: string;
  part_time_info: string;
  support_policies: string[];
  notes: string;
  _warnings: string[];
  _status: 'ok' | 'check' | 'error';
};

// Auto-detect CSV column names to field keys
const AUTO_MAPPINGS: Record<string, string> = {
  // Basic info - exact matches from CSV header
  'name': 'name',
  'name_korean': 'name_korean',
  'country': 'country',
  'address': 'address',
  'area': 'area',
  'ranking': 'ranking',
  'top_tier': 'top_tier',
  'majors': 'majors',
  
  // Fees - exact matches
  'fee_d4_1_krw': 'fee_d4_1_krw',
  'fee_d2_1_krw': 'fee_d2_1_krw',
  'fee_d2_2_min_krw': 'fee_d2_2_min_krw',
  'fee_d2_2_max_krw': 'fee_d2_2_max_krw',
  'fee_d2_3m_min_krw': 'fee_d2_3m_min_krw',
  'fee_d2_3m_max_krw': 'fee_d2_3m_max_krw',
  'fee_d2_3p_min_krw': 'fee_d2_3p_min_krw',
  'fee_d2_3p_max_krw': 'fee_d2_3p_max_krw',
  'fee_d2_6_krw': 'fee_d2_6_krw',
  'fee_exchange_krw': 'fee_exchange_krw',
  'fee_short_krw': 'fee_short_krw',
  
  // Admission
  'admission_d4_gpa_min': 'admission_d4_gpa_min',
  'admission_d4_gap_year': 'admission_d4_gap_year',
  'admission_d2_gpa_min': 'admission_d2_gpa_min',
  'admission_d2_gap_year': 'admission_d2_gap_year',
  
  // Scholarships
  'scholarship_d4_1': 'scholarship_d4_1',
  'scholarship_d2_2': 'scholarship_d2_2',
  'scholarship_d2_3': 'scholarship_d2_3',
  
  // KTX
  'ktx_room_types': 'ktx_room_types',
  'ktx_prices_krw': 'ktx_prices_krw',
  'dormitory_info': 'dormitory_info',
  
  // Other
  'part_time_info': 'part_time_info',
  'support_policies': 'support_policies',
  'notes': 'notes',
  
  // Vietnamese variations
  'tên trường': 'name',
  'ten truong': 'name',
  'tên tiếng hàn': 'name_korean',
  'ten tieng han': 'name_korean',
  'quốc gia': 'country',
  'địa chỉ': 'address',
  'dia chi': 'address',
  'khu vực': 'area',
  'khu vuc': 'area',
  'xếp hạng': 'ranking',
  'chuyên ngành': 'majors',
  'chính sách hỗ trợ': 'support_policies',
  'chính sách ho tro': 'support_policies'
};

// Field definitions for the new CSV format
const FIELD_DEFS = [
  // Basic info
  { key: 'name', label: 'Tên trường (Việt)', required: true },
  { key: 'name_korean', label: 'Tên tiếng Hàn', required: false },
  { key: 'country', label: 'Quốc gia', required: false },
  { key: 'address', label: 'Địa chỉ', required: false },
  { key: 'area', label: 'Khu vực/Thành phố', required: false },
  { key: 'ranking', label: 'Xếp hạng', required: false },
  { key: 'top_tier', label: 'Top Tier (1-3)', required: false },
  { key: 'majors', label: 'Chuyên ngành', required: false },
  
  // Visa system fees
  { key: 'fee_d4_1_krw', label: 'Học phí D4-1 (Tiếng Hàn)', required: false },
  { key: 'fee_d2_1_krw', label: 'Học phí D2-1', required: false },
  { key: 'fee_d2_2_min_krw', label: 'Học phí D2-2 (Đại học) min', required: false },
  { key: 'fee_d2_2_max_krw', label: 'Học phí D2-2 (Đại học) max', required: false },
  { key: 'fee_d2_3m_min_krw', label: 'Học phí D2-3 Thạc sĩ min', required: false },
  { key: 'fee_d2_3m_max_krw', label: 'Học phí D2-3 Thạc sĩ max', required: false },
  { key: 'fee_d2_3p_min_krw', label: 'Học phí D2-3 Tiến sĩ min', required: false },
  { key: 'fee_d2_3p_max_krw', label: 'Học phí D2-3 Tiến sĩ max', required: false },
  { key: 'fee_d2_6_krw', label: 'Học phí D2-6', required: false },
  { key: 'fee_exchange_krw', label: 'Học phí Trao đổi', required: false },
  { key: 'fee_short_krw', label: 'Học phí Ngắn hạn', required: false },
  
  // Admission requirements
  { key: 'admission_d4_gpa_min', label: 'GPA min D4-1', required: false },
  { key: 'admission_d4_gap_year', label: 'Năm trống D4-1', required: false },
  { key: 'admission_d2_gpa_min', label: 'GPA min D2', required: false },
  { key: 'admission_d2_gap_year', label: 'Năm trống D2', required: false },
  
  // Scholarships
  { key: 'scholarship_d4_1', label: 'Học bổng D4-1', required: false },
  { key: 'scholarship_d2_2', label: 'Học bổng D2-2', required: false },
  { key: 'scholarship_d2_3', label: 'Học bổng D2-3', required: false },
  
  // KTX/Dormitory
  { key: 'ktx_room_types', label: 'Loại phòng KTX', required: false },
  { key: 'ktx_prices_krw', label: 'Giá KTX', required: false },
  { key: 'dormitory_info', label: 'Thông tin KTX chi tiết', required: false },
  
  // Other
  { key: 'part_time_info', label: 'Việc làm thêm', required: false },
  { key: 'support_policies', label: 'Chính sách hỗ trợ', required: false },
  { key: 'notes', label: 'Ghi chú', required: false },
  
  { key: 'ignore', label: 'Bỏ qua', required: false }
];

const detectMapping = (header: string): { field: string; confidence: MappingConfidence } => {
  const normalized = header
    .toLowerCase()
    .trim()
    .replace(/[()（）]/g, '')
    .replace(/\s+/g, ' ');
  for (const [key, field] of Object.entries(AUTO_MAPPINGS)) {
    if (normalized.includes(key)) return { field, confidence: 'auto' };
  }
  return { field: 'ignore', confidence: 'manual' };
};

const parseCsvText = (raw: string): { headers: string[]; rows: Record<string, string>[] } => {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    const next = raw[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(current);
      if (row.some(value => value.trim().length > 0)) rows.push(row);
      row = [];
      current = '';
      continue;
    }

    if (!inQuotes && char === ',') {
      row.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    if (row.some(value => value.trim().length > 0)) rows.push(row);
  }

  const headers = rows[0]?.map(h => h?.trim() || '') || [];
  const dataRows = rows.slice(1);
  const mapped = dataRows.map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      obj[header] = String(cells[idx] ?? '').trim();
    });
    return obj;
  });

  return { headers, rows: mapped };
};

const parseXlsx = async (file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> => {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in file');
  }
  
  const rows: any[][] = [];
  worksheet.eachRow((row) => {
    const rowValues = row.values as any[];
    // Remove first element if it's null/undefined (exceljs adds extra element)
    const cleanValues = rowValues.slice(1);
    rows.push(cleanValues.map(cell => String(cell || '')));
  });
  
  const headers = rows[0]?.map(h => String(h || '').trim()) || [];
  const dataRows = rows.slice(1);
  const mapped = dataRows.map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      obj[header] = String(cells[idx] ?? '').trim();
    });
    return obj;
  });
  return { headers, rows: mapped };
};

// Parse number from string, handling various formats
const parseNumber = (str: string | undefined): number | null => {
  if (!str || str === '' || str === 'null' || str === 'undefined') return null;
  const clean = str.replace(/[.,](?=.*[.,])/g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
};

// Parse integer from string
const parseIntValue = (str: string | undefined): number | null => {
  if (!str || str === '') return null;
  const clean = str.replace(/\./g, '').replace(/,/g, '');
  const num = parseInt(clean, 10);
  return isNaN(num) ? null : num;
};

// Parse scholarship string format: "TOPIK3:30|TOPIK4:50|TOPIK5:70|TOPIK6:100"
const parseScholarships = (str: string | undefined): Array<{ condition: string; topik_level: number | null; discount_pct: number }> => {
  if (!str || str === '' || str === 'none') return [];
  
  const results: Array<{ condition: string; topik_level: number | null; discount_pct: number }> = [];
  const parts = str.split('|');
  
  for (const part of parts) {
    const match = part.match(/^(TOPIK|IELTS)?\s*(\d+(?:\.\d+)?)\s*:\s*(\d+)$/i);
    if (match) {
      const type = match[1]?.toUpperCase() || 'TOPIK';
      const level = parseFloat(match[2]);
      const discount = parseInt(match[3], 10);
      
      results.push({
        condition: `${type} ${level}`,
        topik_level: type === 'TOPIK' ? level : null,
        discount_pct: discount
      });
    }
  }
  
  return results;
};

// Parse pipe-separated values
const parsePipeList = (str: string | undefined): string[] => {
  if (!str || str === '') return [];
  return str.split('|').map(s => s.trim()).filter(Boolean);
};

const parseFee = (str: string) => {
  if (!str) return { min: 0, max: 0 };
  const clean = str.replace(/\./g, '').replace(/[^\d~\-]/g, ' ').trim();
  const parts = clean
    .split(/[~\-]/)
    .map(p => parseInt(p.trim(), 10))
    .filter(n => !Number.isNaN(n));
  return { min: parts[0] ?? 0, max: parts[1] ?? parts[0] ?? 0 };
};

const parseUniversityRow = (row: Record<string, string>, mappings: Record<string, string>): ParsedRow => {
  const result: ParsedRow = {
    name: '',
    name_korean: '',
    country: 'South Korea',
    address: '',
    area: '',
    ranking: null,
    top_tier: '',
    majors: [],
    visa_systems: {},
    admission: {},
    scholarships: {},
    ktx_options: [],
    dormitory_info: '',
    part_time_info: '',
    support_policies: [],
    notes: '',
    _warnings: [],
    _status: 'ok'
  };

  const getField = (key: string): string => {
    const header = mappings[key];
    if (!header) return '';
    return row[header] ?? '';
  };

  // Basic fields
  result.name = getField('name').trim();
  result.name_korean = getField('name_korean').trim();
  result.country = getField('country') || 'South Korea';
  result.address = getField('address').trim();
  result.area = getField('area').trim();
  result.ranking = parseIntValue(getField('ranking'));
  result.top_tier = getField('top_tier').trim();
  result.majors = parsePipeList(getField('majors'));

  // Parse visa system fees
  const feeD4_1 = parseIntValue(getField('fee_d4_1_krw'));
  const feeD2_1 = parseIntValue(getField('fee_d2_1_krw'));
  const feeD2_2_min = parseIntValue(getField('fee_d2_2_min_krw'));
  const feeD2_2_max = parseIntValue(getField('fee_d2_2_max_krw'));
  const feeD2_3m_min = parseIntValue(getField('fee_d2_3m_min_krw'));
  const feeD2_3m_max = parseIntValue(getField('fee_d2_3m_max_krw'));
  const feeD2_3p_min = parseIntValue(getField('fee_d2_3p_min_krw'));
  const feeD2_3p_max = parseIntValue(getField('fee_d2_3p_max_krw'));
  const feeD2_6 = parseIntValue(getField('fee_d2_6_krw'));
  const feeExchange = parseIntValue(getField('fee_exchange_krw'));
  const feeShort = parseIntValue(getField('fee_short_krw'));

  // Build visa systems
  result.visa_systems = {
    'D4-1': {
      available: !!feeD4_1,
      invoice_krw: feeD4_1 || 0,
      invoice_krw_max: null,
      apply_fee_krw: 100000,
      enrollment_fee_krw: 0
    },
    'D2-1': {
      available: !!feeD2_1,
      invoice_krw: feeD2_1 || 0,
      invoice_krw_max: null,
      apply_fee_krw: 150000,
      enrollment_fee_krw: 0
    },
    'D2-2': {
      available: !!feeD2_2_min,
      invoice_krw: feeD2_2_min || 0,
      invoice_krw_max: feeD2_2_max || null,
      apply_fee_krw: 150000,
      enrollment_fee_krw: 0
    },
    'D2-3M': {
      available: !!feeD2_3m_min,
      invoice_krw: feeD2_3m_min || 0,
      invoice_krw_max: feeD2_3m_max || null,
      apply_fee_krw: 100000,
      enrollment_fee_krw: 900000
    },
    'D2-3P': {
      available: !!feeD2_3p_min,
      invoice_krw: feeD2_3p_min || 0,
      invoice_krw_max: feeD2_3p_max || null,
      apply_fee_krw: 100000,
      enrollment_fee_krw: 900000
    },
    'D2-6': {
      available: !!feeD2_6,
      invoice_krw: feeD2_6 || 0,
      invoice_krw_max: null,
      apply_fee_krw: 150000,
      enrollment_fee_krw: 0
    },
    'exchange': {
      available: !!feeExchange,
      invoice_krw: feeExchange || 0,
      invoice_krw_max: null,
      apply_fee_krw: 100000,
      enrollment_fee_krw: 0
    },
    'short': {
      available: !!feeShort,
      invoice_krw: feeShort || 0,
      invoice_krw_max: null,
      apply_fee_krw: 100000,
      enrollment_fee_krw: 0
    }
  };

  // Parse admission requirements
  const d4GapYearRaw = getField('admission_d4_gap_year').toLowerCase();
  const d2GapYearRaw = getField('admission_d2_gap_year').toLowerCase();
  
  result.admission = {
    'D4-1': {
      gpa_min: parseNumber(getField('admission_d4_gpa_min')),
      gap_year_limit: d4GapYearRaw === 'unlimited' ? null : parseIntValue(getField('admission_d4_gap_year'))
    },
    'D2': {
      gpa_min: parseNumber(getField('admission_d2_gpa_min')),
      gap_year_limit: d2GapYearRaw === 'unlimited' ? null : parseIntValue(getField('admission_d2_gap_year'))
    }
  };

  // Parse scholarships
  result.scholarships = {
    'D4-1': parseScholarships(getField('scholarship_d4_1')),
    'D2-2': parseScholarships(getField('scholarship_d2_2')),
    'D2-3M': parseScholarships(getField('scholarship_d2_3'))
  };

  // Parse KTX options
  const roomTypes = parsePipeList(getField('ktx_room_types'));
  const roomPrices = parsePipeList(getField('ktx_prices_krw')).map(p => parseIntValue(p) || 0);
  
  result.ktx_options = roomTypes.map((name, idx) => ({
    name,
    price_krw: roomPrices[idx] || 0
  })).filter(opt => opt.price_krw > 0);

  result.dormitory_info = getField('dormitory_info').trim();
  result.part_time_info = getField('part_time_info').trim();
  result.support_policies = parsePipeList(getField('support_policies'));
  result.notes = getField('notes').trim();

  // Warnings & status
  if (!result.name) {
    result._status = 'error';
    result._warnings.push('Thiếu tên trường');
  } else if (!Object.values(result.visa_systems).some((s: any) => s.available)) {
    result._warnings.push('Chưa có học phí cho hệ nào');
    result._status = 'check';
  } else if (result._warnings.length > 0) {
    result._status = 'check';
  }

  return result;
};

const formatKRW = (value: number | null | undefined): string => {
  if (!value) return '—';
  return value.toLocaleString('vi-VN');
};

const getTierFromRanking = (ranking: number | null, topTier: string): { label: string; tier: 'Top1' | 'Top2' | 'Top3' } => {
  // Use explicit top_tier if provided
  if (topTier === '1') return { label: 'Top 1', tier: 'Top1' };
  if (topTier === '2') return { label: 'Top 2', tier: 'Top2' };
  if (topTier === '3') return { label: 'Top 3', tier: 'Top3' };
  
  // Fallback to ranking-based calculation
  if (!ranking) return { label: 'Top 2', tier: 'Top2' };
  if (ranking <= 30) return { label: 'Top 1', tier: 'Top1' };
  if (ranking <= 80) return { label: 'Top 2', tier: 'Top2' };
  return { label: 'Top 3', tier: 'Top3' };
};

export default function ImportUniversitiesModal({ isOpen, onClose, onImport }: ImportUniversitiesModalProps) {
  const { universities, updateUniversitiesList } = useApp();
  const [step, setStep] = useState<Step>(1);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mappings, setMappings] = useState<Record<string, MappingEntry>>({});
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [overwrite, setOverwrite] = useState(true);
  const [results, setResults] = useState<Array<{ name: string; status: 'created' | 'updated' | 'skipped' | 'error'; warnings?: string[]; reason?: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const previews = useMemo(() => rawRows.slice(0, 3), [rawRows]);

  if (!isOpen) return null;

  const resetAll = () => {
    setStep(1);
    setFileName('');
    setHeaders([]);
    setRawRows([]);
    setMappings({});
    setParsedRows([]);
    setOverwrite(true);
    setResults([]);
    setError(null);
  };

  const buildInitialMappings = (headerList: string[]) => {
    const next: Record<string, MappingEntry> = {};
    headerList.forEach((header) => {
      const detected = detectMapping(header);
      next[header] = { field: detected.field, confidence: detected.confidence, manual: detected.confidence === 'manual' };
    });

    const fieldCounts: Record<string, number> = {};
    Object.values(next).forEach((entry) => {
      if (entry.field !== 'ignore') fieldCounts[entry.field] = (fieldCounts[entry.field] || 0) + 1;
    });

    Object.keys(next).forEach((key) => {
      const entry = next[key];
      if (!entry.manual && entry.field !== 'ignore' && fieldCounts[entry.field] > 1) {
        next[key] = { ...entry, confidence: 'check' };
      }
    });

    setMappings(next);
  };

  const handleFile = async (file: File) => {
    setError(null);
    setFileName(file.name);
    try {
      let parsed: { headers: string[]; rows: Record<string, string>[] } | null = null;
      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text();
        parsed = parseCsvText(text);
      } else {
        parsed = await parseXlsx(file);
      }

      if (!parsed || parsed.headers.length === 0) {
        setError('Không đọc được tiêu đề cột từ file.');
        return;
      }

      setHeaders(parsed.headers);
      setRawRows(parsed.rows);
      buildInitialMappings(parsed.headers);
      setStep(2);
    } catch (err) {
      setError(FILE_READ_ERROR);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const updateMapping = (header: string, field: string) => {
    setMappings((prev: any) => {
      const next = { ...prev, [header]: { field, confidence: 'manual', manual: true } };
      return next;
    });
  };

  const mappingByField = useMemo(() => {
    const fieldMap: Record<string, string> = {};
    Object.entries(mappings).forEach(([header, entry]) => {
      if (entry.field !== 'ignore' && !fieldMap[entry.field]) fieldMap[entry.field] = header;
    });
    return fieldMap;
  }, [mappings]);

  const parseAllRows = () => {
    const next = rawRows.map(row => parseUniversityRow(row, mappingByField));
    setParsedRows(next);
  };

  const statusSummary = useMemo(() => {
    const ok = parsedRows.filter(r => r._status === 'ok').length;
    const check = parsedRows.filter(r => r._status === 'check').length;
    const errorCount = parsedRows.filter(r => r._status === 'error').length;
    return { ok, check, error: errorCount };
  }, [parsedRows]);

  const buildUniversity = (row: ParsedRow, index: number) => {
    const tierInfo = getTierFromRanking(row.ranking, row.top_tier);
    const id = `import-${Date.now()}-${index}`;

    // Build visaSystemsDetail in camelCase format for the app
    const visaSystemsDetail: Record<string, any> = {};
    Object.entries(row.visa_systems).forEach(([key, sys]: [string, any]) => {
      if (!sys || !sys.available) return;
      visaSystemsDetail[key] = {
        available: true,
        invoiceKRWPerYear: sys.invoice_krw ?? 0,
        invoiceKRWPerYearMax: sys.invoice_krw_max || null,
        applyFeeKRW: sys.apply_fee_krw ?? 0,
        enrollmentFeeKRW: sys.enrollment_fee_krw ?? 0,
        scholarships: (row.scholarships[key] || []).map((s: any) => ({
          condition: s.condition,
          discountPct: s.discount_pct,
          topikLevel: s.topik_level
        })),
        ktxOptions: row.ktx_options.map((k: any) => ({
          name: k.name,
          priceKRWPerKy: k.price_krw
        })),
        financialRequirement: { soTietKiemOptions: [], luiNThang: 0 },
        admission: {
          gpaMin: row.admission[key === 'D4-1' ? 'D4-1' : 'D2']?.gpa_min ?? 0,
          gapYearLimit: row.admission[key === 'D4-1' ? 'D4-1' : 'D2']?.gap_year_limit ?? null,
          regions: []
        }
      };
    });

    const university: University = {
      id,
      name: row.name,
      koreanName: row.name_korean || undefined,
      country: row.country,
      countryCode: '🇰🇷',
      region: row.area || undefined,
      top_tier: tierInfo.tier,
      ranking: row.ranking ? `${row.ranking}/200` : undefined,
      description: undefined,
      systems: [] as any[],
      majors: row.majors,
      koreanData: {
        isKoreanUniversity: true,
        address: row.address,
        topTier: tierInfo.tier,
        koreanRanking: row.ranking ? `${row.ranking}/200` : undefined,
        majors: row.majors,
        admission: {
          'D4-1': {
            gpaMin: row.admission['D4-1']?.gpa_min ?? 0,
            gapYearLimit: row.admission['D4-1']?.gap_year_limit ?? null,
            regions: []
          },
          'D2': {
            gpaMin: row.admission['D2']?.gpa_min ?? 0,
            gapYearLimit: row.admission['D2']?.gap_year_limit ?? null,
            regions: []
          }
        },
        visaSystemsDetail,
        jobOpportunities: row.part_time_info || undefined,
        workOpportunity: row.part_time_info || undefined,
        dormOptions: row.ktx_options.map(k => ({ type: k.name, priceKRW: k.price_krw })),
        supportPolicies: row.support_policies,
        dormitoryInfo: row.dormitory_info || undefined,
        notes: row.notes || undefined
      }
    };

    return university;
  };

  // Deep merge helper - keeps existing data, only updates with non-empty new values
  const deepMerge = (target: any, source: any): any => {
    if (source === null || source === undefined) return target;
    if (target === null || target === undefined) return source;
    
    // Handle arrays - replace if source has items, keep target if empty
    if (Array.isArray(source)) {
      return source.length > 0 ? source : target;
    }
    
    // Handle objects
    if (typeof source === 'object' && typeof target === 'object') {
      const result = { ...target };
      for (const key of Object.keys(source)) {
        const sourceVal = source[key];
        const targetVal = target[key];
        
        // Skip empty values from source
        if (sourceVal === '' || sourceVal === null || sourceVal === undefined) {
          result[key] = targetVal;
        } else if (typeof sourceVal === 'object' && !Array.isArray(sourceVal)) {
          // Recursively merge nested objects
          result[key] = deepMerge(targetVal, sourceVal);
        } else {
          // Use source value
          result[key] = sourceVal;
        }
      }
      return result;
    }
    
    return source !== '' ? source : target;
  };

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);
    
    const finalResults: Array<{ name: string; status: 'created' | 'updated' | 'skipped' | 'error'; warnings?: string[]; reason?: string }> = [];
    const parsed = parsedRows.filter(r => r._status !== 'error');
    const byName = (value: string) => value.trim().toLowerCase();
    const nextList = [...universities];

    try {
      // Import service for database save
      const { saveUniversity } = await import('../services/universityService');

      for (let idx = 0; idx < parsed.length; idx++) {
        const row = parsed[idx];
        try {
          const existingIndex = nextList.findIndex(u => byName(u.name) === byName(row.name));
          const incoming = buildUniversity(row, idx);

          // Prepare database data
          const dbData = {
            id: incoming.id,
            name: incoming.name,
            name_korean: incoming.koreanName,
            region: incoming.region,
            top_tier: incoming.top_tier,
            ranking: incoming.ranking,
            country: incoming.country,
            country_code: incoming.countryCode,
            address: incoming.koreanData?.address,
            korean_data: JSON.stringify(incoming.koreanData)
          };

          if (existingIndex >= 0) {
            const existing = nextList[existingIndex];
            
            if (overwrite) {
              // Smart merge: keep existing data, only update with non-empty CSV values
              const merged = deepMerge(existing, incoming);
              // Always preserve the original ID
              merged.id = existing.id;
              
              // Save merged data to database
              await saveUniversity({
                ...dbData,
                id: existing.id
              });
              
              nextList[existingIndex] = merged;
              finalResults.push({ 
                name: row.name, 
                status: 'updated', 
                warnings: row._warnings,
                reason: 'Đã cập nhật dữ liệu mới, giữ nguyên dữ liệu cũ'
              });
            } else {
              finalResults.push({ name: row.name, status: 'skipped', reason: 'Đã tồn tại, không ghi đè' });
            }
          } else {
            // Save new university to database
            await saveUniversity(dbData);
            
            nextList.push(incoming);
            finalResults.push({ name: row.name, status: 'created', warnings: row._warnings });
          }
        } catch (err: any) {
          console.error(`Error importing ${row.name}:`, err);
          finalResults.push({ name: row.name, status: 'error', reason: err?.message || 'Lỗi không xác định' });
        }
      }

      updateUniversitiesList(() => nextList);
      onImport?.(nextList);
      setResults(finalResults);
      setStep(4);
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err?.message || 'Lỗi trong quá trình import');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadWarnings = () => {
    const rows = results.filter(r => r.warnings && r.warnings.length > 0);
    const csv = [
      ['Ten truong', 'Trang thai', 'Canh bao'].join(','),
      ...rows.map(r => [r.name, r.status, (r.warnings || []).join(' | ')].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'import-warnings.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-[#1E3A8A] to-[#2563EB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Import danh sách trường từ CSV</h2>
              <p className="text-sm text-white/80">Nhập đồng thời thông tin hiển thị danh sách và chi tiết</p>
            </div>
          </div>
          <button
            onClick={() => { resetAll(); onClose(); }}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            {['Upload CSV', 'Mapping cột', 'Preview & xác nhận', 'Kết quả'].map((label, idx) => {
              const active = step === (idx + 1);
              const done = step > (idx + 1);
              return (
                <div key={label} className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {done ? '✓' : idx + 1}
                  </span>
                  <span className={`${active ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(92vh-190px)] p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div
                className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:border-blue-500 hover:bg-blue-50/40 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="csv-upload"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Kéo thả file CSV vào đây
                  </h3>
                  <p className="text-sm text-slate-600">
                    hoặc click để chọn file. Hỗ trợ .csv, .xlsx
                  </p>
                </label>
              </div>

              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                  Cấu trúc CSV được hỗ trợ (31 cột)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 text-left">Nhóm</th>
                        <th className="px-4 py-2 text-left">Cột trong CSV</th>
                        <th className="px-4 py-2 text-left">Mô tả</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Thông tin cơ bản', 'name, name_korean, country', 'Tên trường (bắt buộc), tên tiếng Hàn, quốc gia'],
                        ['Địa điểm', 'address, area', 'Địa chỉ đầy đủ, thành phố/tỉnh'],
                        ['Xếp hạng', 'ranking, top_tier', 'Xếp hạng (số), Top tier (1-3)'],
                        ['Ngành học', 'majors', 'Chuyên ngành, phân cách bằng |'],
                        ['Học phí D4-1', 'fee_d4_1_krw', 'Học phí tiếng Hàn (KRW/kỳ)'],
                        ['Học phí D2-1', 'fee_d2_1_krw', 'Học phí hệ D2-1'],
                        ['Học phí D2-2', 'fee_d2_2_min_krw, fee_d2_2_max_krw', 'Học phí Đại học (min-max)'],
                        ['Học phí D2-3 Thạc sĩ', 'fee_d2_3m_min_krw, fee_d2_3m_max_krw', 'Học phí Thạc sĩ (min-max)'],
                        ['Học phí D2-3 Tiến sĩ', 'fee_d2_3p_min_krw, fee_d2_3p_max_krw', 'Học phí Tiến sĩ (min-max)'],
                        ['Học phí D2-6', 'fee_d2_6_krw', 'Học phí hệ D2-6'],
                        ['Học phí khác', 'fee_exchange_krw, fee_short_krw', 'Trao đổi & Ngắn hạn'],
                        ['Điều kiện D4-1', 'admission_d4_gpa_min, admission_d4_gap_year', 'GPA min, năm trống tối đa'],
                        ['Điều kiện D2', 'admission_d2_gpa_min, admission_d2_gap_year', 'GPA min, năm trống (unlimited)'],
                        ['Học bổng', 'scholarship_d4_1, scholarship_d2_2, scholarship_d2_3', 'Format: TOPIK3:30|TOPIK4:50'],
                        ['KTX', 'ktx_room_types, ktx_prices_krw, dormitory_info', 'Loại phòng | Giá | Mô tả chi tiết'],
                        ['Khác', 'part_time_info, support_policies, notes', 'Việc làm thêm, hỗ trợ, ghi chú'],
                      ].map((row) => (
                        <tr key={row[0]} className="border-b border-slate-100">
                          <td className="px-4 py-2 font-medium">{row[0]}</td>
                          <td className="px-4 py-2 text-slate-600 font-mono text-xs">{row[1]}</td>
                          <td className="px-4 py-2 text-slate-500">{row[2]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <div className="text-sm text-blue-800">
                  Đã nhận file <strong>{fileName}</strong>. Hệ thống tự gợi ý mapping cột.
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 text-left">Cột trong CSV</th>
                        <th className="px-4 py-2 text-left">Map vào field</th>
                        <th className="px-4 py-2 text-left">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {headers.map((header) => {
                        const entry = mappings[header];
                        const status = entry?.confidence || 'manual';
                        const statusLabel = status === 'auto' ? 'Tự động' : status === 'check' ? 'Kiểm tra' : 'Thủ công';
                        const statusClass = status === 'auto' ? 'bg-green-100 text-green-700' : status === 'check' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600';
                        return (
                          <tr key={header} className="border-b border-slate-100">
                            <td className="px-4 py-2 font-medium text-slate-700">{header}</td>
                            <td className="px-4 py-2">
                              <select
                                value={entry?.field || 'ignore'}
                                onChange={(e) => updateMapping(header, e.target.value)}
                                className="border border-slate-200 rounded px-2 py-1 text-sm w-full"
                              >
                                {FIELD_DEFS.map(field => (
                                  <option key={field.key} value={field.key}>
                                    {field.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                                {status === 'auto' ? '✓' : status === 'check' ? '⚠' : '•'} {statusLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {previews.length > 0 && (
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">Xem trước 3 dòng đầu</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-white border-b border-slate-200">
                        <tr>
                          {headers.map(h => (
                            <th key={h} className="px-3 py-2 text-left text-slate-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previews.map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-100">
                            {headers.map(h => (
                              <td key={h} className="px-3 py-2 text-slate-700">{row[h]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          {step === 3 && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <div className="text-sm text-green-700">
                  {statusSummary.ok} OK · {statusSummary.check} cảnh báo · {statusSummary.error} lỗi
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={overwrite}
                    onChange={(e) => setOverwrite(e.target.checked)}
                  />
                  Ghi đè nếu đã tồn tại
                </label>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">Tên trường</th>
                        <th className="px-3 py-2 text-left">Khu vực · Top</th>
                        <th className="px-3 py-2 text-left">D4-1</th>
                        <th className="px-3 py-2 text-left">D2-2</th>
                        <th className="px-3 py-2 text-left">HB tốt nhất</th>
                        <th className="px-3 py-2 text-left">KTX</th>
                        <th className="px-3 py-2 text-left">GPA D4-1</th>
                        <th className="px-3 py-2 text-left">Chuyên ngành</th>
                        <th className="px-3 py-2 text-left">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row, idx) => {
                        const d41 = row.visa_systems['D4-1'];
                        const d22 = row.visa_systems['D2-2'];
                        const scholarships = d22?.scholarships || [];
                        const maxScholar = scholarships.length ? Math.max(...scholarships.map((s: any) => s.discount_pct || 0)) : 0;
                        const topik = scholarships.find((s: any) => s.discount_pct === maxScholar)?.topik_level;
                        const ktxMin = row.ktx_options.length ? Math.min(...row.ktx_options.map(k => k.price_krw)) : null;
                        const ktxMax = row.ktx_options.length ? Math.max(...row.ktx_options.map(k => k.price_krw)) : null;
                        const tierInfo = getTierFromRanking(row.ranking, row.top_tier);
                        const statusClass =
                          row._status === 'ok'
                            ? 'bg-green-100 text-green-700'
                            : row._status === 'check'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700';
                        return (
                          <tr key={idx} className="border-b border-slate-100">
                            <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                            <td className="px-3 py-2 font-semibold text-slate-800">{row.name}</td>
                            <td className="px-3 py-2">
                              <div className="text-slate-700">{row.area || '—'}</div>
                              <div className="text-xs text-slate-500">{tierInfo.label}</div>
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {d41?.invoice_krw ? `${formatKRW(d41.invoice_krw)} KRW` : '—'}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {d22?.invoice_krw ? `${formatKRW(d22.invoice_krw)} KRW` : '—'}
                            </td>
                            <td className="px-3 py-2">
                              {maxScholar > 0 ? (
                                <span className="inline-flex px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                  {topik ? `TOPIK ${topik}` : 'HB'} {maxScholar}%
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {ktxMin ? `${formatKRW(ktxMin)}-${formatKRW(ktxMax || ktxMin)}` : '—'}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {row.admission['D4-1']?.gpa_min ?? '—'}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                {row.majors.slice(0, 3).map((m) => (
                                  <span key={m} className="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-600">{m}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                                {row._status === 'ok' ? '✓ OK' : row._status === 'check' ? '⚠ Kiểm tra' : '✗ Lỗi'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Import hoàn tất</h3>
                <p className="text-sm text-slate-600">
                  {results.filter(r => r.status === 'created').length} tạo mới · {results.filter(r => r.status === 'updated').length} cập nhật · {results.filter(r => r.status === 'error').length} lỗi
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-y-auto max-h-80">
                  {results.map((res, idx) => {
                    const statusClass =
                      res.status === 'created'
                        ? 'bg-green-50 text-green-700'
                        : res.status === 'updated'
                          ? 'bg-blue-50 text-blue-700'
                          : res.status === 'skipped'
                            ? 'bg-slate-50 text-slate-600'
                            : 'bg-red-50 text-red-700';
                    return (
                      <div key={`${res.name}-${idx}`} className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-800">{res.name}</div>
                          {res.reason && <div className="text-xs text-slate-500">{res.reason}</div>}
                          {res.warnings && res.warnings.length > 0 && (
                            <div className="text-xs text-amber-600">⚠ {res.warnings.join(', ')}</div>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                          {res.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={() => { resetAll(); onClose(); }}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            Đóng
          </button>

          <div className="flex items-center gap-3">
            {step > 1 && step < 4 && (
              <button
                onClick={() => setStep((step - 1) as Step)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Quay lại
              </button>
            )}

            {step === 2 && (
              <button
                onClick={() => { parseAllRows(); setStep(3); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                Xem Preview
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Đang import...
                  </>
                ) : (
                  <>
                    Xác nhận import
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            {step === 4 && (
              <>
                <button
                  onClick={downloadWarnings}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Xuất log cảnh báo
                </button>
                <button
                  onClick={() => { resetAll(); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Import file khác
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
