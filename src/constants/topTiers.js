// Top tier definitions for universities list
export const TOP_TIERS = {
  '1': {
    label: 'Top 1',
    icon: '★',
    color: '#0C447C',
    bg: '#E6F1FB',
    description: 'Dễ xin visa nhất',
    count: 32,
    warning: null
  },
  '2': {
    label: 'Top 2', 
    icon: '◆',
    color: '#3B6D11',
    bg: '#EAF3DE',
    description: 'Visa trung bình',
    count: 92,
    warning: null
  },
  '3': {
    label: 'Top 3',
    icon: '⚠',
    color: '#A32D2D',
    bg: '#FCEBEB',
    description: 'Hạn chế visa',
    count: 11,
    warning: 'Các trường Top 3 có hạn chế visa — tỉ lệ đậu thấp hơn, cần tư vấn kỹ trước khi đăng ký'
  },
  'gray': {
    label: 'Gray',
    icon: '☰',
    color: '#6B7280',
    bg: '#F3F4F6',
    description: 'Tất cả',
    count: 0,
    warning: null
  }
};

export const getTierColor = (tier) => {
  return TOP_TIERS[tier]?.color || '#6B7280';
};

export const getTierBg = (tier) => {
  return TOP_TIERS[tier]?.bg || '#F3F4F6';
};
