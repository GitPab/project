import React from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { MapPin, Building2, GraduationCap, Banknote, Info, ChevronRight } from 'lucide-react';
import type { University } from '../context/AppContext';
import { getMaxScholarship } from '../../utils/universityPerks';

interface UniversityCardProps {
  university: University;
  onEdit?: (university: University) => void;
  onQuickInfo?: (university: University) => void;
}

const palette = {
  cardBg: '#FFFFFF',
  border: '#E7DFD6',
  text: '#3F3730',
  textMuted: '#7B7267',
  accent: '#2C6DB4',
  accentSoft: '#E6F1FB',
};

const formatKRW = (amount?: number | null) => Number(amount ?? 0).toLocaleString('vi-VN');

export default function UniversityCard({ university, onEdit, onQuickInfo }: UniversityCardProps) {
  const navigate = useNavigate();
  const { user } = useApp();

  const bestPrice = React.useMemo(() => {
    const systems = Object.values((university as any).visa_systems || {});
    const available = systems.filter((s: any) => s?.available);
    if (!available.length) return null;
    return available.reduce((min: number, s: any) => {
      const price = s.invoice_krw || 0;
      return price < min ? price : min;
    }, Infinity);
  }, [(university as any).visa_systems]);

  const maxHB = getMaxScholarship(university);
  const hasVisa = !!bestPrice && bestPrice !== Infinity;

  const visaChips = React.useMemo(() => {
    const systems = (university as any).visa_systems || {};
    return Object.entries(systems)
      .filter(([_, s]: [string, any]) => s?.available)
      .slice(0, 5)
      .map(([key, _]) => key);
  }, [(university as any).visa_systems]);

  return (
    <div
      style={{
        background: palette.cardBg,
        border: `1px solid ${palette.border}`,
        borderRadius: 14,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 12,
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
      onClick={() => navigate(`/${user?.role}/university/${university.id}`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
        e.currentTarget.style.borderColor = '#D4C8BC';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = palette.border;
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Logo placeholder */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #F4EEE7 0%, #E7DFD6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {(university as any).logo || '🏫'}
        </div>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: palette.text,
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {(university as any).name_vi || university.name}
            </h3>
            {university.top_tier && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                  background: university.top_tier === 'Top1' ? '#2D8C4E' : university.top_tier === 'Top2' ? '#F5A623' : '#E53935',
                  padding: '2px 8px',
                  borderRadius: 20,
                  flexShrink: 0,
                }}
              >
                {university.top_tier}
              </span>
            )}
          </div>

          <div style={{ fontSize: 12, color: palette.textMuted, marginBottom: 4 }}>
            <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
            {(university as any).address || (university as any).area || 'Hàn Quốc'}
          </div>

          <div style={{ fontSize: 11, color: palette.textMuted }}>
            <Building2 size={11} style={{ display: 'inline', marginRight: 4 }} />
            {university.koreanName || (university as any).koreanName}
          </div>
        </div>
      </div>

      {/* Visa chips */}
      {visaChips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
          {visaChips.map((v) => (
            <span
              key={v}
              style={{
                fontSize: 11,
                color: palette.textMuted,
                background: '#F4EEE7',
                padding: '3px 10px',
                borderRadius: 20,
                fontWeight: 500,
              }}
            >
              {v}
            </span>
          ))}
        </div>
      )}

      {/* Price & Scholarship */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
        {hasVisa ? (
          <div>
            <div style={{ fontSize: 12, color: palette.textMuted, marginBottom: 2 }}>
              <Banknote size={12} style={{ display: 'inline', marginRight: 4 }} />
              Học phí thấp nhất
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: palette.text }}>
              {formatKRW(bestPrice)} KRW
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>Chưa cấu hình</div>
          </div>
        )}

        {maxHB > 0 ? (
          <div>
            <div style={{ fontSize: 12, color: palette.textMuted, marginBottom: 2 }}>
              <GraduationCap size={12} style={{ display: 'inline', marginRight: 4 }} />
              Học bổng tốt nhất
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#2D8C4E' }}>
              -{maxHB}%
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>—</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 4 }}>
        {onQuickInfo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickInfo(university);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: `1px solid ${palette.border}`,
              background: '#fff',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              color: palette.text,
            }}
          >
            <Info size={14} style={{ display: 'inline', marginRight: 4 }} />
            TT
          </button>
        )}
        
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(university);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: `1px solid ${palette.border}`,
              background: palette.cardBg,
              color: palette.textMuted,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sửa
          </button>
        )}
      </div>
    </div>
  );
}
