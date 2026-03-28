import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Bell, Moon, Globe, Clock, Save, Shield, Smartphone, X, Loader2, Copy, CheckCircle } from 'lucide-react';
import { UserPreferences } from '../../types';
import { QRCodeSVG } from 'qrcode.react';

const AdminSettings: React.FC = () => {
  const { user, userPreferences, saveUserPreferences, enable2FA, disable2FA, get2FASettings } = useApp();
  const [prefs, setPrefs] = useState<Partial<UserPreferences>>({
    language: 'vi',
    theme: 'light',
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    timezone: 'Asia/Ho_Chi_Minh',
    dateFormat: 'DD/MM/YYYY'
  });
  const [has2FA, setHas2FA] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [setup2FAStep, setSetup2FAStep] = useState<'intro' | 'verify' | 'backup'>('intro');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [copiedBackupCode, setCopiedBackupCode] = useState<string | null>(null);

  useEffect(() => {
    if (userPreferences) {
      setPrefs(userPreferences);
    }
    if (user?.email) {
      check2FA();
    }
  }, [userPreferences, user]);

  const check2FA = async () => {
    if (user?.email) {
      const settings = await get2FASettings(user.email);
      setHas2FA(!!settings?.isEnabled);
    }
  };

  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateBackupCodes = () => {
    return Array.from({ length: 8 }, () => {
      return Array.from({ length: 4 }, () => 
        Math.random().toString(36).substring(2, 6).toUpperCase()
      ).join('-');
    });
  };

  const start2FASetup = () => {
    setSecret(generateSecret());
    setBackupCodes(generateBackupCodes());
    setSetup2FAStep('intro');
    setVerificationCode('');
    setShow2FAModal(true);
  };

  const handleEnable2FA = async () => {
    if (!user?.email) return;
    
    setIsSettingUp2FA(true);
    try {
      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation, verify the code first
      if (verificationCode.length === 6) {
        await enable2FA(user.email, secret, backupCodes);
        setHas2FA(true);
        setShow2FAModal(false);
        setMessage('Đã bật 2FA thành công!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Có lỗi xảy ra khi bật 2FA');
    } finally {
      setIsSettingUp2FA(false);
    }
  };

  const copyBackupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedBackupCode(code);
    setTimeout(() => setCopiedBackupCode(null), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (user?.email) {
        await saveUserPreferences({
          ...prefs,
          userEmail: user.email
        } as any);
        setMessage('Đã lưu cài đặt thành công!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setMessage('Có lỗi xảy ra khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
        <p className="text-gray-600 mt-1">Tùy chỉnh trải nghiệm của bạn</p>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('thành công') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Appearance */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Moon className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Giao diện</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chủ đề</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={prefs.theme}
                onChange={(e) => setPrefs({ ...prefs, theme: e.target.value as any })}
              >
                <option value="light">Sáng</option>
                <option value="dark">Tối</option>
                <option value="system">Theo hệ thống</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={prefs.language}
                onChange={(e) => setPrefs({ ...prefs, language: e.target.value as any })}
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
                <option value="ko">한국어</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Thông báo</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">Thông báo qua email</p>
                  <p className="text-sm text-gray-500">Nhận thông báo qua email</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.emailNotifications}
                onChange={(e) => setPrefs({ ...prefs, emailNotifications: e.target.checked })}
                className="w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">Thông báo qua SMS</p>
                  <p className="text-sm text-gray-500">Nhận tin nhắn SMS</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.smsNotifications}
                onChange={(e) => setPrefs({ ...prefs, smsNotifications: e.target.checked })}
                className="w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium">Thông báo đẩy</p>
                  <p className="text-sm text-gray-500">Thông báo trên trình duyệt</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.pushNotifications}
                onChange={(e) => setPrefs({ ...prefs, pushNotifications: e.target.checked })}
                className="w-5 h-5"
              />
            </label>
          </div>
        </div>

        {/* Regional */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Khu vực & Thời gian</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Múi giờ</label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <select
                  className="w-full border rounded pl-9 pr-3 py-2"
                  value={prefs.timezone}
                  onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
                >
                  <option value="Asia/Ho_Chi_Minh">Hà Nội (GMT+7)</option>
                  <option value="Asia/Seoul">Seoul (GMT+9)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Định dạng ngày</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={prefs.dateFormat}
                onChange={(e) => setPrefs({ ...prefs, dateFormat: e.target.value })}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security - 2FA */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Bảo mật</h2>
          </div>
          <div className="flex items-center justify-between p-4 border rounded">
            <div>
              <p className="font-medium">Xác thực hai yếu tố (2FA)</p>
              <p className="text-sm text-gray-500">
                {has2FA ? 'Đã bật - Tài khoản được bảo vệ' : 'Chưa bật - Khuyến nghị bật để bảo mật'}
              </p>
            </div>
            <button
              onClick={() => {
                if (has2FA) {
                  if (confirm('Bạn có chắc muốn tắt 2FA?')) {
                    disable2FA(user?.email || '');
                    setHas2FA(false);
                  }
                } else {
                  start2FASetup();
                }
              }}
              className={`px-4 py-2 rounded ${has2FA ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
            >
              {has2FA ? 'Tắt 2FA' : 'Bật 2FA'}
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {setup2FAStep === 'intro' && 'Thiết lập 2FA'}
                {setup2FAStep === 'verify' && 'Xác minh ứng dụng'}
                {setup2FAStep === 'backup' && 'Mã dự phòng'}
              </h3>
              <button
                onClick={() => setShow2FAModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {setup2FAStep === 'intro' && (
                <>
                  <div className="text-center mb-6">
                    <div className="inline-block p-4 bg-blue-50 rounded-full mb-4">
                      <Shield className="w-8 h-8 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">Bảo vệ tài khoản của bạn</h4>
                    <p className="text-sm text-gray-600">
                      Xác thực hai yếu tố (2FA) thêm một lớp bảo mật bằng cách yêu cầu mã từ ứng dụng xác thực trên điện thoại của bạn.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">Hướng dẫn thiết lập:</p>
                    <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                      <li>Tải ứng dụng xác thực (Google Authenticator, Authy)</li>
                      <li>Quét mã QR hoặc nhập mã bí mật</li>
                      <li>Nhập mã xác minh từ ứng dụng</li>
                      <li>Lưu mã dự phòng để khôi phục</li>
                    </ol>
                  </div>

                  <button
                    onClick={() => setSetup2FAStep('verify')}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Bắt đầu thiết lập
                  </button>
                </>
              )}

              {setup2FAStep === 'verify' && (
                <>
                  <div className="text-center mb-6">
                    <div className="inline-block p-3 bg-white rounded-xl shadow-lg border-2 border-gray-100 mb-4">
                      <QRCodeSVG
                        value={`otpauth://totp/SACMA:${user?.email}?secret=${secret}&issuer=SACMA`}
                        size={180}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Quét mã QR bằng ứng dụng xác thực
                    </p>
                    <div className="bg-gray-100 rounded-lg p-2 flex items-center justify-between">
                      <code className="text-xs font-mono text-gray-700">{secret}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(secret);
                          setMessage('Đã sao chép mã bí mật');
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nhập mã xác minh từ ứng dụng
                      </label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <button
                      onClick={() => {
                        if (verificationCode.length === 6) {
                          setSetup2FAStep('backup');
                        }
                      }}
                      disabled={verificationCode.length !== 6}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                    >
                      Tiếp tục
                    </button>
                  </div>
                </>
              )}

              {setup2FAStep === 'backup' && (
                <>
                  <div className="text-center mb-6">
                    <div className="inline-block p-3 bg-yellow-50 rounded-full mb-4">
                      <Shield className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">Lưu mã dự phòng</h4>
                    <p className="text-sm text-gray-600">
                      Các mã này cho phép bạn khôi phục tài khoản nếu mất điện thoại. Hãy lưu chúng ở nơi an toàn.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {backupCodes.map((code, idx) => (
                      <div
                        key={idx}
                        onClick={() => copyBackupCode(code)}
                        className="bg-gray-50 rounded-lg p-2 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <code className="text-sm font-mono text-gray-700">
                          {copiedBackupCode === code ? (
                            <span className="text-green-600 flex items-center justify-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Đã sao chép
                            </span>
                          ) : (
                            code
                          )}
                        </code>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleEnable2FA}
                    disabled={isSettingUp2FA}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSettingUp2FA ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      'Hoàn tất thiết lập'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
