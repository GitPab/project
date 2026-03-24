import React from 'react';

interface StatCardProps {
  label: string;
  value: number;
  sub?: string;
  icon: string;
  color: 'blue' | 'green' | 'teal' | 'amber' | 'gray';
}

const palette = {
  cardBg: '#FFFFFF',
  border: '#E7DFD6',
  text: '#3F3730',
  textMuted: '#7B7267'
};

const colorStyles = {
  blue: { accent: '#2C6DB4', soft: '#E6F1FB' },
  green: { accent: '#639922', soft: '#EAF3DE' },
  teal: { accent: '#1D9E75', soft: '#E1F5EE' },
  amber: { accent: '#EF9F27', soft: '#FAEEDA' },
  gray: { accent: '#888780', soft: '#F1EFE8' }
};

export default function StatCard({ label, value, sub, icon, color }: StatCardProps) {
  const c = colorStyles[color] ?? colorStyles.gray;

  return (
    <div style={{
      background: palette.cardBg,
      border: `1px solid ${palette.border}`,
      borderRadius: 14,
      padding: '14px 16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: palette.textMuted, fontWeight: 600 }}>{label}</span>
        <span style={{
          fontSize: 16,
          width: 30,
          height: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: c.soft,
          color: c.accent,
          borderRadius: 8
        }}>{icon}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, color: palette.text }}>{value?.toLocaleString()}</div>
      {sub && (
        <div style={{ fontSize: 11, color: palette.textMuted, marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}
