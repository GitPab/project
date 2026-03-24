// Design tokens from Figma specification
export const DESIGN_TOKENS = {
  colors: {
    primaryBlue: '#1B3F8B',        /* Hero, headers, total box */
    top1Green: '#2D8C4E',          /* TOP VISA 01 badge */
    top2Orange: '#F5A623',         /* TOP VISA 02 badge */
    top3Red: '#E53935',            /* TOP VISA 03 badge, CTA button */
    admissionBg: '#FFF4E5',        /* Điều kiện tuyển sinh box */
    admissionBorder: '#F5A623',
    scholarshipBg: '#F0FAF3',      /* Học bổng box */
    scholarshipBorder: '#2D8C4E',
    textPrimary: '#1A1A1A',
    textSecondary: '#666666',
    borderLight: '#E8E8E8',
  },
  typography: {
    sectionTitle: { fontSize: 18, fontWeight: 700, color: '#1B3F8B' },
    body: { fontSize: 14, color: '#1A1A1A' },
    label: { fontSize: 13, color: '#666666' },
  }
};

// VISA systems for selector
export const VISA_SYSTEMS = [
  { key: 'D4-1', label: 'D4-1 (Ngôn ngữ)' },
  { key: 'D2-2', label: 'D2-2 (Đại học)' },
  { key: 'D2-3', label: 'D2-3 (Cao học)' },
  { key: 'D2-6', label: 'D2-6 (Nghiên cứu)' },
];

// Utility function to normalize tier
export const normalizeTier = (tier: any): string => {
  if (!tier) return '1';
  const str = String(tier).toLowerCase().replace(/\s/g, '');
  if (str.includes('1') && !str.includes('2') && !str.includes('3')) return '1';
  if (str.includes('2')) return '2';
  if (str.includes('3')) return '3';
  return '1';
};
