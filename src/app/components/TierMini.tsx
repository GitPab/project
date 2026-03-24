import React from 'react';

interface TierMiniProps {
  label: string;
  count: number;
  color: 'blue' | 'green' | 'red';
  desc: string;
}

const colorStyles = {
  blue: { bg: '#E6F1FB', text: '#0C447C', border: '#B5D4F4' },
  green: { bg: '#EAF3DE', text: '#3B6D11', border: '#C0DD97' },
  red: { bg: '#FCEBEB', text: '#A32D2D', border: '#F7C1C1' }
};

export default function TierMini({ label, count, color, desc }: TierMiniProps) {
  const style = colorStyles[color];

  return (
    <div style={{
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: 10,
      padding: '8px 10px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: style.text, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: style.text, marginBottom: 2 }}>
        {count}
      </div>
      <div style={{ fontSize: 10, color: '#7B7267' }}>
        {desc}
      </div>
    </div>
  );
}
