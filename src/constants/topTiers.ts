/**
 * Top tier system definitions for Korean universities
 * Defines visa accessibility levels and associated metadata
 */

export interface TopTier {
  label: string;
  icon: string;
  color: string;
  bg: string;
  description: string;
  count?: number;
  warning: string | null;
}

export const TOP_TIERS: Record<string, TopTier> = {
  '1': {
    label: 'Top 1',
    icon: '★',
    color: '#185FA5',
    bg: '#E6F1FB',
    description: 'Dễ xin visa nhất',
    warning: null
  },
  '2': {
    label: 'Top 2',
    icon: '◆',
    color: '#3B6D11',
    bg: '#EAF3DE',
    description: 'Visa trung bình',
    warning: null
  },
  '3': {
    label: 'Top 3',
    icon: '⚠',
    color: '#A32D2D',
    bg: '#FCEBEB',
    description: 'Hạn chế visa',
    warning: 'Các trường Top 3 có hạn chế visa — tỉ lệ đậu thấp hơn, cần tư vấn kỹ trước khi đăng ký'
  }
};

export const getTierColor = (tier: string | undefined): string => {
  if (!tier) return '#9CA3AF';
  const tierKey = tier === 'Top1' ? '1' : tier === 'Top2' ? '2' : tier === 'Top3' ? '3' : null;
  return tierKey ? TOP_TIERS[tierKey]?.color || '#9CA3AF' : '#9CA3AF';
};

export const getTierBg = (tier: string | undefined): string => {
  if (!tier) return '#F3F4F6';
  const tierKey = tier === 'Top1' ? '1' : tier === 'Top2' ? '2' : tier === 'Top3' ? '3' : null;
  return tierKey ? TOP_TIERS[tierKey]?.bg || '#F3F4F6' : '#F3F4F6';
};
