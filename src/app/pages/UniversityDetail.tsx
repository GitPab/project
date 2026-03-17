import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  ArrowLeft, MapPin, Star, GraduationCap, Home, Briefcase, Award,
  Clock, CheckCircle, Users
} from 'lucide-react';
import { toast } from 'sonner';
import type { AcademicProgram } from '../../types/university';
import type { Currency } from '../../types/common';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import CostCalculator from '../components/CostCalculator';
import { VISA_SYSTEMS } from '../../constants/visaSystems';

export default function UniversityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { universities, registrations, registerForUniversity, user, fetchUniversity } = useApp();

  const university = universities.find(uni => uni.id === id);

  // Force fresh data fetch on mount and when ID changes
  useEffect(() => {
    if (id) {
      fetchUniversity(id); // Fetch fresh data every time component mounts
    }
  }, [id, fetchUniversity]);

  if (!university) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy trường đại học</h2>
          <Button onClick={() => navigate(-1)}>Quay lại</Button>
        </div>
      </div>
    );
  }

  const isRegistered = registrations.some(r => r.universityId === id && r.studentEmail === user?.email);
  const isKorean = university.koreanData?.isKoreanUniversity ?? true;

  const handleRegister = () => {
    registerForUniversity(university.id);
    toast.success('Đăng ký thành công!', {
      description: `Bạn đã đăng ký tư vấn tại ${university.name}`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Section */}
      <div className="relative h-[420px] overflow-hidden">
        <img 
          src={university.heroImage || university.thumbnail || '/default-university.jpg'} 
          alt={university.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />

        <div className="absolute top-6 left-6">
          <Button 
            onClick={() => navigate(-1)}
            variant="secondary"
            className="bg-white/90 hover:bg-white text-slate-900"
          >
            ← Quay lại
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Hàn Quốc
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{university.ranking}</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-1">{university.name}</h1>
            <p className="text-xl opacity-90">{university.koreanName}</p>
            <p className="mt-2 flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5" /> {university.region || university.koreanData?.address}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        {/* Thông tin chung */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Thông tin chung</h2>
            <div className="prose text-slate-600 leading-relaxed">
              {university.overview}
            </div>

            {university.academicPrograms && (
              <div className="mt-8">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <GraduationCap className="text-[#003AB7]" /> Chuyên ngành tiêu biểu
                </h3>
                <div className="flex flex-wrap gap-2">
                  {university.academicPrograms?.map((prog: AcademicProgram, i: number) => (
                    <Badge key={i} variant="outline" className="px-4 py-1.5">{prog.title}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Xếp hạng & Khu vực</h3>
              <p className="text-2xl font-bold text-[#003AB7]">{university.ranking}</p>
              <p className="text-slate-600 mt-1">{university.region}</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="text-emerald-600" /> Cơ hội việc làm thêm
              </h3>
              <p className="text-sm text-slate-600">{(university.koreanData as any)?.workOpportunity || university.description || "Nhiều cơ hội tại khu vực gần trường"}</p>
            </div>
          </div>
        </div>

        {/* Chi phí du học chi tiết - Use new CostCalculator */}
        <CostCalculator university={university} />

        {/* Nút đăng ký */}
        {!isRegistered && user?.role === 'student' && (
          <Button 
            onClick={handleRegister}
            size="lg"
            className="w-full py-7 text-lg font-semibold rounded-2xl bg-gradient-to-r from-[#003AB7] to-blue-600 hover:from-[#002A8F]"
          >
            <CheckCircle className="mr-3 w-5 h-5" />
            Đăng ký tư vấn ngay
          </Button>
        )}
      </div>
    </div>
  );
}