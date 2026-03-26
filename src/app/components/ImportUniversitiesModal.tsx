import React, { useMemo, useState } from 'react';
import ExcelJS from 'exceljs';
import { X, Upload, FileSpreadsheet, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
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

type ParsedUniversity = {
  name: string;
  name_korean: string;
  address: string;
  area: string;
  ranking: number | null;
  majors: string[];
  admission: Record<string, { gpa_min: number | null; gap_year_limit: number | null }>;
  visa_systems: Record<string, any>;
  scholarship_text: { raw: string };
  dormitory_info: string;
  ktx_options: Array<{ name: string; price_krw: number; price_krw_max?: number }>;
  part_time_info: string;
  _warnings: string[];
  _status: 'ok' | 'check' | 'error';
};

const AUTO_MAPPINGS: Record<string, string> = {
  'tên trường': 'name',
  'ten truong': 'name',
  'tên tiếng hàn': 'name_korean',
  'ten tieng han': 'name_korean',
  'địa chỉ': 'address',
  'dia chi': 'address',
  'khu vực': 'area',
  'khu vuc': 'area',
  'địa chỉ & khu vực': 'address',
  'xếp hạng': 'ranking',
  'ranking': 'ranking',
  'chuyên ngành': 'majors',
  'chuyên ngành tiêu biểu': 'majors',
  'dieu kien tuyen sinh': 'admission_raw',
  'điều kiện tuyển sinh': 'admission_raw',
  'học phí hệ tiếng': 'fee_d4_1_raw',
  'học phí d4-1': 'fee_d4_1_raw',
  'học phí hệ d2-2': 'fee_d2_2_raw',
  'học phí d2-2': 'fee_d2_2_raw',
  'học phí hệ d2-3': 'fee_d2_3_raw',
  'học phí d2-3': 'fee_d2_3_raw',
  'chính sách học bổng': 'scholarship_raw',
  'thông tin ký túc xá': 'ktx_raw',
  'ký túc xá': 'ktx_raw',
  'ktx': 'ktx_raw',
  'cơ hội việc làm': 'part_time_info',
  'cơ hội việc làm thêm': 'part_time_info',
  'việc làm thêm': 'part_time_info'
};

const FIELD_DEFS = [
  { key: 'name', label: 'Tên trường', required: true },
  { key: 'name_korean', label: 'Tên tiếng Hàn', required: false },
  { key: 'address', label: 'Địa chỉ', required: false },
  { key: 'area', label: 'Khu vực', required: false },
  { key: 'ranking', label: 'Xếp hạng', required: false },
  { key: 'majors', label: 'Chuyên ngành', required: false },
  { key: 'admission_raw', label: 'Điều kiện tuyển sinh', required: false },
  { key: 'fee_d4_1_raw', label: 'Học phí D4-1', required: false },
  { key: 'fee_d2_2_raw', label: 'Học phí D2-2', required: false },
  { key: 'fee_d2_3_raw', label: 'Học phí D2-3', required: false },
  { key: 'scholarship_raw', label: 'Chính sách học bổng', required: false },
  { key: 'ktx_raw', label: 'Thông tin KTX', required: false },
  { key: 'part_time_info', label: 'Việc làm thêm', required: false },
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

const parseFee = (str: string) => {
  if (!str) return { min: 0, max: 0 };
  const clean = str.replace(/\./g, '').replace(/[^\d~\-]/g, ' ').trim();
  const parts = clean
    .split(/[~\-]/)
    .map(p => parseInt(p.trim(), 10))
    .filter(n => !Number.isNaN(n));
  return { min: parts[0] ?? 0, max: parts[1] ?? parts[0] ?? 0 };
};

const parseUniversityRow = (row: Record<string, string>, mappings: Record<string, string>): ParsedUniversity => {
  const result: ParsedUniversity = {
    name: '',
    name_korean: '',
    address: '',
    area: '',
    ranking: null,
    majors: [],
    admission: {},
    visa_systems: {},
    scholarship_text: { raw: '' },
    dormitory_info: '',
    ktx_options: [],
    part_time_info: '',
    _warnings: [],
    _status: 'ok'
  };

  const getField = (key: string) => {
    const header = mappings[key];
    if (!header) return '';
    return row[header] ?? '';
  };

  // 1. Basic fields
  result.name = String(getField('name') || '').trim();
  result.name_korean = String(getField('name_korean') || '').trim();

  // 2. Address + area
  const addr = String(getField('address') || '').trim();
  const areaRaw = String(getField('area') || '').trim();
  result.address = addr;
  if (areaRaw) {
    result.area = areaRaw;
  } else if (addr) {
    const areaMatch = addr.match(/([^,]+),\s*Hàn Quốc/i);
    result.area = areaMatch ? areaMatch[1].trim() : addr.split(',').slice(-2, -1)[0]?.trim() || '';
  }

  // 3. Ranking
  const rankRaw = String(getField('ranking') || '').trim();
  result.ranking = parseInt(rankRaw.split('/')[0], 10) || null;

  // 4. Majors
  const majorsRaw = String(getField('majors') || '');
  result.majors = majorsRaw.split(',').map(m => m.trim()).filter(Boolean);

  // 5. Admission
  const admissionRaw = String(getField('admission_raw') || '');
  const d41Match = admissionRaw.match(/D4-1[^;]*GPA\s*>=?\s*([\d.]+)/i);
  const d41Gap = admissionRaw.match(/D4-1[^;]*tr[oô]ng\s*<\s*(\d+)/i);
  const d2Match = admissionRaw.match(/D2[^;]*GPA\s*>=?\s*([\d.]+)/i);
  result.admission = {
    'D4-1': {
      gpa_min: d41Match ? parseFloat(d41Match[1]) : null,
      gap_year_limit: d41Gap ? parseInt(d41Gap[1], 10) : null,
    },
    'D2': {
      gpa_min: d2Match ? parseFloat(d2Match[1]) : null,
      gap_year_limit: null,
    }
  };

  // 6. Fees
  const d41Fee = parseFee(String(getField('fee_d4_1_raw') || ''));
  const d22Fee = parseFee(String(getField('fee_d2_2_raw') || ''));
  const d23Fee = parseFee(String(getField('fee_d2_3_raw') || ''));

  result.visa_systems = {
    'D4-1': { available: d41Fee.min > 0, invoice_krw: d41Fee.min, invoice_krw_max: d41Fee.max, apply_fee_krw: 100000, enrollment_fee_krw: 0, scholarships: [], ktx_options: [] },
    'D2-1': { available: false, invoice_krw: 0, scholarships: [], ktx_options: [] },
    'D2-2': { available: d22Fee.min > 0, invoice_krw: d22Fee.min, invoice_krw_max: d22Fee.max, apply_fee_krw: 150000, enrollment_fee_krw: 0, scholarships: [], ktx_options: [] },
    'D2-3M': { available: d23Fee.min > 0, invoice_krw: d23Fee.min, invoice_krw_max: d23Fee.max, apply_fee_krw: 100000, enrollment_fee_krw: 900000, scholarships: [], ktx_options: [] },
    'D2-3P': { available: false, invoice_krw: 0, scholarships: [], ktx_options: [] },
    'D2-6': { available: false, invoice_krw: 0, scholarships: [], ktx_options: [] },
    'D2-6E': { available: false, invoice_krw: 0, scholarships: [], ktx_options: [] },
    'D2-8': { available: false, invoice_krw: 0, scholarships: [], ktx_options: [] },
  };

  // 7. Scholarships
  const scholarshipRaw = String(getField('scholarship_raw') || '');
  result.scholarship_text = { raw: scholarshipRaw };
  const topikLines = scholarshipRaw.match(/TOPIK\s*(\d)[^\n]*?(\d+)%/gi) ?? [];
  const d22Scholarships = topikLines.map(line => {
    const level = parseInt(line.match(/TOPIK\s*(\d)/i)?.[1] || '', 10);
    const pct = parseInt(line.match(/(\d+)%/)?.[1] || '', 10);
    return level && pct ? { condition: `TOPIK ${level}`, topik_level: level, discount_pct: pct } : null;
  }).filter(Boolean) as any[];
  if (d22Scholarships.length > 0) {
    result.visa_systems['D2-2'].scholarships = d22Scholarships;
  }

  // 8. KTX
  const ktxRaw = String(getField('ktx_raw') || '');
  result.dormitory_info = ktxRaw;
  const ktxParts = ktxRaw.split(';').map(p => p.trim()).filter(Boolean);
  result.ktx_options = ktxParts.map(part => {
    const nameMatch = part.match(/^([^:]+):/);
    const priceMatch = part.match(/([\d.]+)\s*(?:~~|~|-)?\s*([\d.]+)?\s*KRW/i);
    if (!nameMatch || !priceMatch) return null;
    const minPrice = parseInt(priceMatch[1].replace(/\./g, ''), 10);
    const maxPrice = priceMatch[2] ? parseInt(priceMatch[2].replace(/\./g, ''), 10) : minPrice;
    return { name: nameMatch[1].trim(), price_krw: minPrice, price_krw_max: maxPrice };
  }).filter(Boolean) as any[];

  if (result.ktx_options.length > 0) {
    ['D4-1', 'D2-2', 'D2-3M'].forEach(key => {
      if (result.visa_systems[key]?.available) {
        result.visa_systems[key].ktx_options = result.ktx_options;
      }
    });
  }

  // 9. Part time info
  result.part_time_info = String(getField('part_time_info') || '').trim();

  // Warnings & status
  if (scholarshipRaw && d22Scholarships.length === 0) result._warnings.push('Không parse được học bổng');
  if (ktxRaw && result.ktx_options.length === 0) result._warnings.push('Không parse được KTX');
  const feeOk = d41Fee.min > 0 || d22Fee.min > 0 || d23Fee.min > 0;
  if (!result.name) result._status = 'error';
  else if (!feeOk) result._status = 'error';
  else if (result._warnings.length > 0) result._status = 'check';
  else result._status = 'ok';

  return result;
};

const formatKRW = (value: number) => value.toLocaleString('vi-VN');

const getTierFromRanking = (ranking: number | null): { label: string; tier: 'Top1' | 'Top2' | 'Top3' } => {
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
  const [parsedRows, setParsedRows] = useState<ParsedUniversity[]>([]);
  const [overwrite, setOverwrite] = useState(true);
  const [results, setResults] = useState<Array<{ name: string; status: 'created' | 'updated' | 'skipped' | 'error'; warnings?: string[]; reason?: string }>>([]);
  const [error, setError] = useState<string | null>(null);

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

  const buildUniversity = (row: ParsedUniversity, index: number) => {
    const tierInfo = getTierFromRanking(row.ranking);
    const id = `import-${Date.now()}-${index}`;

    const visaSystemsDetail: Record<string, any> = {};
    Object.entries(row.visa_systems).forEach(([key, sys]) => {
      if (!sys) return;
      visaSystemsDetail[key] = {
        available: !!sys.available,
        invoiceKRWPerYear: sys.invoice_krw ?? 0,
        applyFeeKRW: sys.apply_fee_krw ?? 0,
        enrollmentFeeKRW: sys.enrollment_fee_krw ?? 0,
        scholarships: (sys.scholarships || []).map((s: any) => ({
          condition: s.condition ?? `TOPIK ${s.topik_level}`,
          discountPct: s.discount_pct,
          topikLevel: s.topik_level
        })),
        ktxOptions: (sys.ktx_options || []).map((k: any) => ({
          name: k.name,
          priceKRWPerKy: k.price_krw
        })),
        financialRequirement: { soTietKiemOptions: [], luiNThang: 0 }
      };
    });

    const university: any = {
      id,
      name: row.name,
      koreanName: row.name_korean || undefined,
      country: 'South Korea',
      region: row.area || undefined,
      ranking: row.ranking ? `${row.ranking}/200` : undefined,
      systems: [],
      majors: row.majors,
      admission: row.admission,
      visa_systems: row.visa_systems,
      top_tier: tierInfo.tier.replace('Top', ''),
      koreanData: {
        isKoreanUniversity: true,
        address: row.address,
        topTier: tierInfo.tier,
        koreanRanking: row.ranking ? `${row.ranking}/200` : undefined,
        majors: row.majors,
        admission: {
          'D4-1': { gpaMin: row.admission['D4-1']?.gpa_min ?? 0, gapYearLimit: row.admission['D4-1']?.gap_year_limit ?? null, regions: [] },
          'D2': { gpaMin: row.admission['D2']?.gpa_min ?? 0, gapYearLimit: null, regions: [] },
        },
        visaSystemsDetail,
        jobOpportunities: row.part_time_info || undefined,
        workOpportunity: row.part_time_info || undefined,
        dormOptions: row.ktx_options.map(k => ({ type: k.name, priceKRW: k.price_krw })),
      }
    };

    return university as University;
  };

  const handleImport = async () => {
    const finalResults: Array<{ name: string; status: 'created' | 'updated' | 'skipped' | 'error'; warnings?: string[]; reason?: string }> = [];
    const parsed = parsedRows.filter(r => r._status !== 'error');
    const byName = (value: string) => value.trim().toLowerCase();
    const nextList = [...universities];

    parsed.forEach((row, idx) => {
      try {
        const existingIndex = nextList.findIndex(u => byName(u.name) === byName(row.name));
        const incoming = buildUniversity(row, idx);

        if (existingIndex >= 0) {
          if (overwrite) {
            nextList[existingIndex] = { ...nextList[existingIndex], ...incoming, id: nextList[existingIndex].id };
            finalResults.push({ name: row.name, status: 'updated', warnings: row._warnings });
          } else {
            finalResults.push({ name: row.name, status: 'skipped', reason: 'Đã tồn tại, không ghi đè' });
          }
        } else {
          nextList.push(incoming);
          finalResults.push({ name: row.name, status: 'created', warnings: row._warnings });
        }
      } catch (err: any) {
        finalResults.push({ name: row.name, status: 'error', reason: err?.message || 'Lỗi không xác định' });
      }
    });

    updateUniversitiesList(() => nextList);
    onImport?.(nextList);
    setResults(finalResults);
    setStep(4);
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
                  Cấu trúc CSV được hỗ trợ
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 text-left">Cột trong CSV</th>
                        <th className="px-4 py-2 text-left">Map vào field</th>
                        <th className="px-4 py-2 text-left">Dùng ở đâu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Tên trường', 'name', 'Danh sách + chi tiết'],
                        ['Tên tiếng Hàn', 'name_korean', 'Danh sách'],
                        ['Địa chỉ & Khu vực', 'address, area', 'Danh sách'],
                        ['Xếp hạng', 'ranking', 'Danh sách'],
                        ['Chuyên ngành tiêu biểu', 'majors[]', 'Chi tiết'],
                        ['Điều kiện tuyển sinh', 'admission', 'Chi tiết + danh sách'],
                        ['Học phí D4-1', 'visa_systems.D4-1.invoice_krw', 'Danh sách'],
                        ['Học phí D2-2', 'visa_systems.D2-2.invoice_krw', 'Danh sách'],
                        ['Học phí D2-3', 'visa_systems.D2-3M.invoice_krw', 'Danh sách'],
                        ['Chính sách học bổng', 'scholarships', 'Chi tiết + danh sách'],
                        ['Thông tin KTX', 'ktx_options', 'Chi tiết + danh sách'],
                        ['Cơ hội việc làm thêm', 'part_time_info', 'Chi tiết'],
                      ].map((row) => (
                        <tr key={row[0]} className="border-b border-slate-100">
                          <td className="px-4 py-2">{row[0]}</td>
                          <td className="px-4 py-2 text-slate-600">{row[1]}</td>
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
                        const ktxMax = row.ktx_options.length ? Math.max(...row.ktx_options.map(k => k.price_krw_max || k.price_krw)) : null;
                        const tierInfo = getTierFromRanking(row.ranking);
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
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                Xác nhận import
                <CheckCircle className="w-4 h-4" />
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
