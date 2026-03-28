import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, TrendingUp, Users, DollarSign, GraduationCap, FileCheck, Calendar } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, changeType = 'neutral', icon }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {change && (
          <p className={`text-sm mt-1 ${
            changeType === 'positive' ? 'text-green-600' : 
            changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {change}
          </p>
        )}
      </div>
      <div className="p-3 bg-blue-100 rounded-full">
        {icon}
      </div>
    </div>
  </div>
);

// Chart colors
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const AdminAnalyticsDashboard: React.FC = () => {
  const { 
    universities, 
    studentApplications, 
    payments, 
    documents, 
    getAllApplications,
    getAnalyticsMetrics 
  } = useApp();
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRevenue: 0,
    conversionRate: 0,
    pendingDocuments: 0,
    approvedApplications: 0,
    rejectedApplications: 0
  });
  
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [universityRevenueData, setUniversityRevenueData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const apps = await getAllApplications();
      const totalRevenue = payments.reduce((sum, p) => sum + (p.amountVnd || 0), 0);
      const pendingDocs = documents.filter(d => !d.verified).length;
      const approved = apps.filter((a: any) => a.application_status === 'approved').length;
      const rejected = apps.filter((a: any) => a.application_status === 'rejected').length;
      const pending = apps.filter((a: any) => a.application_status === 'pending').length;
      const inProgress = apps.filter((a: any) => a.application_status === 'in-progress' || a.application_status === 'in-review').length;
      const total = apps.length || 1;
      
      setStats({
        totalStudents: apps.length,
        totalRevenue,
        conversionRate: Math.round((approved / total) * 100),
        pendingDocuments: pendingDocs,
        approvedApplications: approved,
        rejectedApplications: rejected
      });

      // Generate monthly application data from actual applications
      const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
      const currentMonth = new Date().getMonth();
      const monthlyApps = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const year = new Date().getFullYear();
        const monthStart = new Date(year, monthIndex, 1);
        const monthEnd = new Date(year, monthIndex + 1, 0);
        
        // Count actual applications in this month
        const monthApps = apps.filter((a: any) => {
          const appDate = new Date(a.created_at || a.createdAt);
          return appDate >= monthStart && appDate <= monthEnd;
        });
        
        const monthApproved = monthApps.filter((a: any) => a.application_status === 'approved').length;
        const monthRejected = monthApps.filter((a: any) => a.application_status === 'rejected').length;
        
        monthlyApps.push({
          name: months[monthIndex],
          applications: monthApps.length,
          approved: monthApproved,
          rejected: monthRejected
        });
      }
      setMonthlyData(monthlyApps);

      // Generate university revenue data from actual payments
      const uniData = universities
        .filter(u => u.name && u.name.trim().length > 0)
        .slice(0, 5)
        .map((uni) => {
          const uniApps = apps.filter((a: any) => a.university_id === uni.id || a.universityId === uni.id);
          const uniRevenue = payments
            .filter(p => p.universityId === uni.id)
            .reduce((sum, p) => sum + (p.amountVnd || 0), 0);
          
          return {
            name: uni.name.length > 20 ? uni.name.substring(0, 20) + '...' : uni.name,
            revenue: uniRevenue,
            applications: uniApps.length
          };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .filter(u => u.revenue > 0 || u.applications > 0); // Only show universities with data
      
      setUniversityRevenueData(uniData);

      // Generate status distribution data from actual counts
      setStatusData([
        { name: 'Đã duyệt', value: approved, color: '#10B981' },
        { name: 'Đang xử lý', value: inProgress, color: '#3B82F6' },
        { name: 'Chờ duyệt', value: pending, color: '#F59E0B' },
        { name: 'Từ chối', value: rejected, color: '#EF4444' }
      ].filter(s => s.value > 0)); // Only show statuses with data
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Thống kê và phân tích hệ thống</p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Khoảng thời gian:</span>
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          />
          <span>đến</span>
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          />
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Cập nhật
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <MetricCard
          title="Tổng số học sinh"
          value={stats.totalStudents.toString()}
          icon={<Users className="w-6 h-6 text-blue-600" />}
        />
        <MetricCard
          title="Tổng doanh thu"
          value={`${(stats.totalRevenue / 1000000).toFixed(1)}M VND`}
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
        />
        <MetricCard
          title="Tỷ lệ chuyển đổi"
          value={`${stats.conversionRate}%`}
          icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
        />
        <MetricCard
          title="Hồ sơ chờ xác minh"
          value={stats.pendingDocuments.toString()}
          changeType="neutral"
          icon={<FileCheck className="w-6 h-6 text-orange-600" />}
        />
        <MetricCard
          title="Đơn đã duyệt"
          value={stats.approvedApplications.toString()}
          changeType="positive"
          icon={<GraduationCap className="w-6 h-6 text-green-600" />}
        />
        <MetricCard
          title="Đơn bị từ chối"
          value={stats.rejectedApplications.toString()}
          changeType="negative"
          icon={<BarChart3 className="w-6 h-6 text-red-600" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Applications Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Đơn đăng ký theo tháng
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  labelStyle={{ color: '#111827', fontWeight: 600 }}
                />
                <Legend />
                <Bar dataKey="applications" name="Tổng đơn" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" name="Đã duyệt" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected" name="Từ chối" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by University Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Doanh thu theo trường (VND)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={universityRevenueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" fontSize={12} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <YAxis type="category" dataKey="name" stroke="#6B7280" fontSize={11} width={120} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  labelStyle={{ color: '#111827', fontWeight: 600 }}
                  formatter={(value: number) => [`${(value / 1000000).toFixed(1)}M VND`, 'Doanh thu']}
                />
                <Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Status Distribution & Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Application Status Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Phân bố trạng thái đơn</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  formatter={(value: number, name: string) => [value, name]}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Application Trend Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Xu hướng đơn đăng ký 6 tháng gần đây</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  labelStyle={{ color: '#111827', fontWeight: 600 }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="applications" 
                  name="Tổng đơn" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="approved" 
                  name="Đã duyệt" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Universities Table */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-blue-600" />
          Top Trường Đại học Phổ biến
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tên trường</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Số đơn</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Tỷ lệ chấp nhận</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Doanh thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {universities.filter(u => u.name && u.name.trim().length > 0).slice(0, 5).map((uni) => {
                const uniApps = studentApplications.filter(a => a.universityId === uni.id);
                const approved = uniApps.filter(a => a.applicationStatus === 'approved').length;
                const acceptanceRate = uniApps.length > 0 ? Math.round((approved / uniApps.length) * 100) : 0;
                const revenue = payments
                  .filter(p => p.universityId === uni.id)
                  .reduce((sum, p) => sum + (p.amountVnd || 0), 0);
                
                return (
                  <tr key={uni.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {uni.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{uni.name}</p>
                          <p className="text-xs text-gray-500">{uni.koreanName || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {uniApps.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${acceptanceRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-700">{acceptanceRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-green-600">
                        {(revenue / 1000000).toFixed(1)}M VND
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;
