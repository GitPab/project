import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { RefreshCw, Save, TrendingUp, DollarSign, Wallet, Loader2 } from 'lucide-react';
import api from '../services/api';

interface ExchangeRate {
  code: string;
  name: string;
  symbol: string;
  rate: number; // 1 unit = X VND
  lastUpdated: string;
}

const DEFAULT_RATES: ExchangeRate[] = [
  { code: 'KRW', name: 'Hàn Quốc Won', symbol: '₩', rate: 18.9, lastUpdated: '2024-01-01' },
  { code: 'USD', name: 'Mỹ Dollar', symbol: '$', rate: 25500, lastUpdated: '2024-01-01' },
  { code: 'JPY', name: 'Nhật Yên', symbol: '¥', rate: 170, lastUpdated: '2024-01-01' },
  { code: 'CNY', name: 'Trung Quốc Yuan', symbol: '¥', rate: 3500, lastUpdated: '2024-01-01' },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 28000, lastUpdated: '2024-01-01' },
];

export default function AdminExchangeRates() {
  const [rates, setRates] = useState<ExchangeRate[]>(DEFAULT_RATES);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load rates from API on mount
  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/exchange-rates');
      if (response.data.success && response.data.data.length > 0) {
        setRates(response.data.data);
      } else {
        // Fallback: try localStorage
        const saved = localStorage.getItem('exchangeRates');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setRates(prev => prev.map(r => {
              const found = parsed.find((s: ExchangeRate) => s.code === r.code);
              return found ? { ...r, rate: found.rate, lastUpdated: found.lastUpdated } : r;
            }));
          } catch (e) {
            console.error('Failed to parse saved rates:', e);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch rates:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('exchangeRates');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setRates(prev => prev.map(r => {
            const found = parsed.find((s: ExchangeRate) => s.code === r.code);
            return found ? { ...r, rate: found.rate, lastUpdated: found.lastUpdated } : r;
          }));
        } catch (e) {
          console.error('Failed to parse saved rates:', e);
        }
      }
      toast.error('Không thể tải tỷ giá từ server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateChange = (code: string, newRate: number) => {
    setRates(prev => prev.map(r => 
      r.code === code ? { ...r, rate: newRate } : r
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Update last updated time
      const updatedRates = rates.map(r => ({
        ...r,
        lastUpdated: new Date().toISOString().split('T')[0]
      }));
      
      // Save to API
      const response = await api.put('/exchange-rates', { rates: updatedRates });
      
      if (response.data.success) {
        // Also save to localStorage as backup
        localStorage.setItem('exchangeRates', JSON.stringify(updatedRates));
        
        setRates(updatedRates);
        setHasChanges(false);
        toast.success('Đã lưu tỷ giá ngoại tệ!');
      } else {
        throw new Error(response.data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save exchange rates error:', error);
      
      // Fallback: save to localStorage only
      const updatedRates = rates.map(r => ({
        ...r,
        lastUpdated: new Date().toISOString().split('T')[0]
      }));
      localStorage.setItem('exchangeRates', JSON.stringify(updatedRates));
      setRates(updatedRates);
      setHasChanges(false);
      
      toast.warning('Đã lưu tỷ giá vào bộ nhớ local (không có kết nối server)');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setRates(DEFAULT_RATES);
    setHasChanges(true);
    toast.info('Đã reset về mặc định');
  };

  const getExampleCalculation = (rate: number) => {
    const krwAmount = 1000000; // 1 triệu KRW
    const vndAmount = Math.round(krwAmount * rate);
    return `1,000,000 KRW = ${vndAmount.toLocaleString('vi-VN')} VND`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Cài đặt Tỷ giá Ngoại tệ
          </h1>
          <p className="text-slate-500 mt-1">
            Quản lý tỷ giá chuyển đổi từ ngoại tệ sang VNĐ
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>

      {/* Main Rate Card - KRW (most important) */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <span className="text-2xl">🇰🇷</span>
            Tỷ giá Hàn Quốc Won (KRW)
          </CardTitle>
          <CardDescription>
            Đây là tỷ giá quan trọng nhất cho hệ thống du học Hàn Quốc
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-blue-600">
              1 KRW =
            </div>
            <div className="flex-1">
              <Input
                type="number"
                step="0.1"
                value={rates.find(r => r.code === 'KRW')?.rate || 18.9}
                onChange={(e) => handleRateChange('KRW', parseFloat(e.target.value) || 0)}
                className="text-2xl font-bold text-blue-600"
              />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              VND
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-sm text-slate-600 mb-2">Ví dụ tính toán:</p>
            <p className="text-lg font-medium text-blue-800">
              {getExampleCalculation(rates.find(r => r.code === 'KRW')?.rate || 18.9)}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Wallet className="w-4 h-4" />
            Cập nhật lần cuối: {rates.find(r => r.code === 'KRW')?.lastUpdated}
          </div>
        </CardContent>
      </Card>

      {/* Other Currencies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rates.filter(r => r.code !== 'KRW').map((rate) => (
          <Card key={rate.code} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="text-xl">{rate.symbol}</span>
                  {rate.name}
                </span>
                <span className="text-sm font-normal text-slate-500">
                  {rate.code}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">1 {rate.code} =</span>
                <Input
                  type="number"
                  value={rate.rate}
                  onChange={(e) => handleRateChange(rate.code, parseFloat(e.target.value) || 0)}
                  className="w-32"
                />
                <span className="text-sm font-medium">VND</span>
              </div>
              
              <p className="text-xs text-slate-500">
                Cập nhật: {rate.lastUpdated}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-yellow-800 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Lưu ý quan trọng
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-yellow-700 space-y-1">
          <p>• Tỷ giá được sử dụng để tính toán chi phí du học tự động</p>
          <p>• Học viên sẽ thấy chi phí được quy đổi sang VNĐ khi tra cứu</p>
          <p>• Nên cập nhật tỷ giá định kỳ theo thị trường thực tế</p>
          <p>• Tỷ giá mặc định: 1 KRW ≈ 18.9 VND (có thể thay đổi theo thị trường)</p>
        </CardContent>
      </Card>
    </div>
  );
}
