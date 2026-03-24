import React from 'react';

interface TierBreakdownBarProps {
  top1: number;
  top2: number;
  top3: number;
}

export default function TierBreakdownBar({ top1, top2, top3 }: TierBreakdownBarProps) {
  const total = (top1 ?? 0) + (top2 ?? 0) + (top3 ?? 0);

  if (!total) return null;

  return (
    <div style={{ display: 'flex', height: 6, borderRadius: 6, overflow: 'hidden', gap: 2, background: '#EFE6DB', padding: 1 }}>
      <div style={{ flex: top1, background: '#2C6DB4', borderRadius: '6px 0 0 6px' }} />
      <div style={{ flex: top2, background: '#639922' }} />
      <div style={{ flex: top3, background: '#E24B4A', borderRadius: '0 6px 6px 0' }} />
    </div>
  );
}
