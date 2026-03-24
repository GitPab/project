/**
 * TierTab - Card-style tier tab for primary navigation
 */

import React from 'react';
import { TOP_TIERS, getTierColor, getTierBg } from '../../constants/topTiers';

interface TierTabProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  count?: number;
  description?: string;
  colorClass: string;
}

const colorStyles: Record<string, { bg: string; border: string; text: string; textMuted: string }> = {
  gray: {
    bg: '#F3F4F6',
    border: '#9CA3AF',
    text: '#6B7280',
    textMuted: '#4B5563'
  },
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
    textMuted: '#0C447C'
  },
  red: {
    bg: '#FCEBEB',
    border: '#A32D2D',
    text: '#A32D2D',
    textMuted: '#A32D2D'
  }
};

export default function TierTab({ 
  active, 
  onClick, 
  icon, 
  label, 
  count, 
  description, 
  colorClass 
}: TierTabProps) {
  const tierData = TOP_TIERS[colorClass as keyof typeof TOP_TIERS];
  const colors = colorStyles[colorClass as keyof typeof colorStyles];
  
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: '20px',
        border: `1px solid ${colors.border}`,
        backgroundColor: active ? colors.bg : '#FFFFFF',
        color: active ? '#FFFFFF' : colors.text,
        fontSize: '12px',
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        minWidth: '80px'
      }}
    >
      <span style={{ fontSize: '14px', marginRight: '4px' }}>{icon}</span>
      <span style={{ fontSize: '12px', fontWeight: 500 }}>{label}</span>
      {count !== undefined && (
        <span style={{
          backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
          padding: '2px 6px',
          borderRadius: '10px',
          fontSize: '10px',
          marginLeft: '4px'
        }}>
          {count}
        </span>
      )}
      {description && (
        <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text }}>
          {description}
        </div>
      )}
    </button>
  );
}
