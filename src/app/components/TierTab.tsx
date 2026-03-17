/**
 * TierTab - Card-style tier tab for primary navigation
 */

import React from 'react';

interface TierTabProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  count: number;
  description?: string;
  colorClass?: 'blue' | 'green' | 'red' | 'gray';
}

const colorStyles = {
  blue: {
    bg: '#E6F1FB',
    border: '#185FA5',
    text: '#185FA5',
    textMuted: '#0C447C'
  },
  green: {
    bg: '#EAF3DE',
    border: '#3B6D11',
    text: '#3B6D11',
    textMuted: '#2D5417'
  },
  red: {
    bg: '#FCEBEB',
    border: '#A32D2D',
    text: '#A32D2D',
    textMuted: '#7A2121'
  },
  gray: {
    bg: '#F3F4F6',
    border: '#9CA3AF',
    text: '#6B7280',
    textMuted: '#4B5563'
  }
};

export default function TierTab({
  active,
  onClick,
  icon,
  label,
  count,
  description,
  colorClass = 'gray'
}: TierTabProps) {
  const colors = colorStyles[colorClass];

  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: active ? colors.bg : '#FFFFFF',
        border: `1.5px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '10px 12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        opacity: active ? 1 : 0.6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        textAlign: 'center',
        fontWeight: active ? 600 : 500
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.opacity = '0.6';
      }}
    >
      <div style={{ fontSize: '18px' }}>{icon}</div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: colors.text, whiteSpace: 'nowrap' }}>
        {label}
      </div>
      {description && (
        <div style={{ fontSize: '10px', color: colors.textMuted, whiteSpace: 'normal', lineHeight: '1.2' }}>
          {description}
        </div>
      )}
      <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text }}>
        {count}
      </div>
    </button>
  );
}
