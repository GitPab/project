import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { DESIGN_TOKENS, VISA_SYSTEMS, normalizeTier } from '../styles/designTokens';

// Import redesigned components
import {
  HeroBanner,
  ThongTinChungCard,
  BangBocTachChiPhi,
  TotalSection
} from './UniversityDetailRedesigned';

// Admin Controls Component
const AdminControls = ({ university, onEditClick, onCostConfigClick }: { 
  university: any; 
  onEditClick: () => void;
  onCostConfigClick: () => void;
}) => {
  return (
    <div style={{
      background: '#fff', 
      border: `1px solid ${DESIGN_TOKENS.colors.borderLight}`,
      borderRadius: 12, 
      padding: 20, 
      marginBottom: 24
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: DESIGN_TOKENS.colors.textPrimary }}>
          Quản lý trường đại học
        </h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button
            onClick={onEditClick}
            style={{
              background: DESIGN_TOKENS.colors.primaryBlue,
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              fontSize: 13,
              borderRadius: 6
            }}
          >
            Chỉnh sửa thông tin
          </Button>
          <Button
            onClick={onCostConfigClick}
            style={{
              background: DESIGN_TOKENS.colors.top1Green,
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              fontSize: 13,
              borderRadius: 6
            }}
          >
            Cấu hình chi phí
          </Button>
        </div>
      </div>
    </div>
  );
};

// Admin Statistics Component
const AdminStatistics = ({ university }: { university: any }) => {
  const stats = {
    totalRegistrations: 45,
    pendingRegistrations: 12,
    completedRegistrations: 33,
    averageRating: 4.5,
    lastUpdated: new Date().toLocaleDateString('vi-VN')
  };

  return (
    <div style={{
      background: '#fff', 
      border: `1px solid ${DESIGN_TOKENS.colors.borderLight}`,
      borderRadius: 12, 
      padding: 20, 
      marginBottom: 24
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: DESIGN_TOKENS.colors.textPrimary, marginBottom: 16 }}>
        Thống kê trường
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        <div style={{ textAlign: 'center', padding: 12, background: '#f8f9fa', borderRadius: 8 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: DESIGN_TOKENS.colors.primaryBlue }}>
            {stats.totalRegistrations}
          </div>
          <div style={{ fontSize: 12, color: DESIGN_TOKENS.colors.textSecondary }}>
            Tổng đăng ký
          </div>
        </div>
        
        <div style={{ textAlign: 'center', padding: 12, background: '#fff3cd', borderRadius: 8 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#856404' }}>
            {stats.pendingRegistrations}
          </div>
          <div style={{ fontSize: 12, color: DESIGN_TOKENS.colors.textSecondary }}>
            Chờ xử lý
          </div>
        </div>
        
        <div style={{ textAlign: 'center', padding: 12, background: '#d4edda', borderRadius: 8 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#155724' }}>
            {stats.completedRegistrations}
          </div>
          <div style={{ fontSize: 12, color: DESIGN_TOKENS.colors.textSecondary }}>
            Hoàn thành
          </div>
        </div>
        
        <div style={{ textAlign: 'center', padding: 12, background: '#f8f9fa', borderRadius: 8 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: DESIGN_TOKENS.colors.primaryBlue }}>
            {stats.averageRating}
          </div>
          <div style={{ fontSize: 12, color: DESIGN_TOKENS.colors.textSecondary }}>
            Đánh giá TB
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: 16, fontSize: 12, color: DESIGN_TOKENS.colors.textSecondary }}>
        Cập nhật lần cuối: {stats.lastUpdated}
      </div>
    </div>
  );
};

// Admin Cost Configuration Summary
const AdminCostSummary = ({ university }: { university: any }) => {
  const visaSystems = university.visa_systems || {};
  
  return (
    <div style={{
      background: '#fff', 
      border: `1px solid ${DESIGN_TOKENS.colors.borderLight}`,
      borderRadius: 12, 
      padding: 20, 
      marginBottom: 24
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: DESIGN_TOKENS.colors.textPrimary, marginBottom: 16 }}>
        Tóm tắt cấu hình chi phí
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Object.entries(visaSystems).map(([key, system]: [string, any]) => {
          if (!system?.available) return null;
          
          return (
            <div key={key} style={{
              padding: 12, 
              background: '#f8f9fa', 
              borderRadius: 8,
              border: `1px solid ${DESIGN_TOKENS.colors.borderLight}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: DESIGN_TOKENS.colors.textPrimary }}>
                    {key}
                  </div>
                  <div style={{ fontSize: 12, color: DESIGN_TOKENS.colors.textSecondary }}>
                    Học phí: {system.invoice_krw?.toLocaleString('vi-VN') || 'N/A'} ₩/năm
                  </div>
                </div>
                <div style={{
                  padding: '4px 8px', 
                  borderRadius: 4, 
                  fontSize: 11,
                  background: system.available ? DESIGN_TOKENS.colors.scholarshipBg : '#f8d7da',
                  color: system.available ? DESIGN_TOKENS.colors.top1Green : '#666'
                }}>
                  {system.available ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              {system.scholarships && system.scholarships.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: DESIGN_TOKENS.colors.textSecondary }}>
                  Học bổng: {system.scholarships.length} gói
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main Admin Component
export default function UniversityDetailAdmin() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { universities, user, fetchUniversity } = useApp();
  const { formatFrom } = useCurrency();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showCostConfigModal, setShowCostConfigModal] = useState(false);

  const university = universities.find(uni => uni.id === id);

  // Force fresh data fetch on mount and when ID changes
  useEffect(() => {
    if (id) {
      fetchUniversity(id);
    }
  }, [id, fetchUniversity]);

  // Redirect non-admin users
  if (!university) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Không tìm thấy trường đại học</h2>
          <Button onClick={() => navigate(-1)}>Quay lại</Button>
        </div>
      </div>
    );
  }

  // Redirect non-admin users to student view
  if (user?.role !== 'admin') {
    navigate(`/university/${id}`);
    return null;
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Admin Controls */}
      <AdminControls 
        university={university}
        onEditClick={() => setShowEditModal(true)}
        onCostConfigClick={() => setShowCostConfigModal(true)}
      />

      {/* Hero Banner */}
      <HeroBanner university={university} />

      {/* Main Content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          
          {/* LEFT: Thông tin chung */}
          <ThongTinChungCard university={university} />

          {/* RIGHT: Admin Statistics & Cost Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <AdminStatistics university={university} />
            <AdminCostSummary university={university} />
          </div>

        </div>

        {/* FULL WIDTH: Bảng bóc tách chi phí */}
        <BangBocTachChiPhi university={university} />

        {/* FULL WIDTH: Total section (without CTA for admin) */}
        <div style={{
          background: DESIGN_TOKENS.colors.primaryBlue, 
          borderRadius: 12, 
          padding: '24px 32px',
          marginTop: 20, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
            Tổng chi phí trọn gói (tham khảo)
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#fff' }}>
              150.000.000 đ
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
              *Giá tham khảo, có thể thay đổi theo cấu hình
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <div style={{
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff', 
            borderRadius: 12, 
            padding: 24, 
            maxWidth: 600, 
            width: '90%',
            maxHeight: '80vh', 
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: 16 }}>Chỉnh sửa thông tin trường</h3>
            <p>Edit modal placeholder - to be implemented</p>
            <Button onClick={() => setShowEditModal(false)} style={{ marginTop: 16 }}>
              Đóng
            </Button>
          </div>
        </div>
      )}

      {showCostConfigModal && (
        <div style={{
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff', 
            borderRadius: 12, 
            padding: 24, 
            maxWidth: 800, 
            width: '90%',
            maxHeight: '80vh', 
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: 16 }}>Cấu hình chi phí</h3>
            <p>Cost config modal placeholder - to be implemented</p>
            <Button onClick={() => setShowCostConfigModal(false)} style={{ marginTop: 16 }}>
              Đóng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
