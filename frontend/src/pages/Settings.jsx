import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Upload, Building2, Mail, Tag, PlusCircle, X } from 'lucide-react';
import api from '../utils/api';

export default function Settings() {
  const [settings, setSettings] = useState({ companyName: '', logo: null, emailEnabled: false, azureTenantId: '', azureClientId: '', azureClientSecret: '', smtpFrom: '', categories: ['ไฟฟ้า/แอร์', 'ประปา', 'IT/คอมพิวเตอร์', 'อาคาร/สถานที่', 'อื่นๆ'] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    api.get('/settings')
      .then(res => setSettings(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSettings({ ...settings, logo: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.put('/settings', settings);
      setMessage('บันทึกสำเร็จ');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg">
          <SettingsIcon className="h-5 w-5 text-accent-300" />
        </div>
        <h1 className="text-2xl font-bold text-primary-900">ตั้งค่าองค์กร</h1>
      </div>

      {/* Company Settings */}
      <div className="bg-white/80 backdrop-blur rounded-xl p-6 shadow-sm border border-primary-100 space-y-6 mb-6">
        <h2 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
          <Building2 size={20} className="text-primary-600" />
          ข้อมูลองค์กร
        </h2>

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">โลโก้องค์กร</label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 border-2 border-dashed border-primary-200 rounded-xl flex items-center justify-center bg-primary-50 overflow-hidden">
              {settings.logo ? (
                <img src={settings.logo} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <Building2 size={32} className="text-primary-300" />
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 bg-accent-400 text-primary-900 font-semibold px-4 py-2 rounded-lg hover:bg-accent-500 transition-all cursor-pointer shadow-sm">
                <Upload size={16} />
                <span>อัพโหลดโลโก้</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
              <p className="text-xs text-gray-400 mt-2">PNG, JPG ไม่เกิน 2MB</p>
              {settings.logo && (
                <button onClick={() => setSettings({ ...settings, logo: null })} className="text-xs text-red-500 hover:underline mt-1">ลบโลโก้</button>
              )}
            </div>
          </div>
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อองค์กร</label>
          <input
            type="text"
            value={settings.companyName}
            onChange={e => setSettings({ ...settings, companyName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            placeholder="เช่น บริษัท ABC จำกัด"
          />
        </div>
      </div>

      {/* Email Settings */}
      <div className="bg-white/80 backdrop-blur rounded-xl p-6 shadow-sm border border-primary-100 space-y-5 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
            <Mail size={20} className="text-primary-600" />
            ตั้งค่า Email แจ้งเตือน (Microsoft Graph API)
          </h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailEnabled}
              onChange={e => setSettings({ ...settings, emailEnabled: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-600">เปิดใช้งาน</span>
          </label>
        </div>

        <div className={`space-y-4 ${!settings.emailEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenant ID</label>
            <input
              type="text"
              value={settings.azureTenantId}
              onChange={e => setSettings({ ...settings, azureTenantId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client ID (Application ID)</label>
            <input
              type="text"
              value={settings.azureClientId}
              onChange={e => setSettings({ ...settings, azureClientId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
            <input
              type="password"
              value={settings.azureClientSecret}
              onChange={e => setSettings({ ...settings, azureClientSecret: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ส่งจาก (Email ผู้ส่ง)</label>
            <input
              type="email"
              value={settings.smtpFrom}
              onChange={e => setSettings({ ...settings, smtpFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="anek.m@serialfactoring.co.th"
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800 font-medium mb-1">วิธี setup Azure App Registration:</p>
            <ol className="text-xs text-blue-700 list-decimal list-inside space-y-0.5">
              <li>เข้า entra.microsoft.com → App registrations → New registration</li>
              <li>ตั้งชื่อ เช่น "ระบบแจ้งซ่อม" → Register</li>
              <li>คัดลอก Application (client) ID และ Directory (tenant) ID</li>
              <li>ไป Certificates & secrets → New client secret → คัดลอก Value</li>
              <li>ไป API permissions → Add → Microsoft Graph → Application → Mail.Send → Grant admin consent</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Categories Settings */}
      <div className="bg-white/80 backdrop-blur rounded-xl p-6 shadow-sm border border-primary-100 space-y-5 mb-6">
        <h2 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
          <Tag size={20} className="text-primary-600" />
          หมวดหมู่การแจ้งซ่อม
        </h2>

        <div className="flex flex-wrap gap-2">
          {(settings.categories || []).map((cat, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-lg">
              <span className="text-sm text-primary-800">{cat}</span>
              <button
                onClick={() => setSettings({ ...settings, categories: settings.categories.filter((_, idx) => idx !== i) })}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newCategory.trim()) {
                e.preventDefault();
                setSettings({ ...settings, categories: [...(settings.categories || []), newCategory.trim()] });
                setNewCategory('');
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            placeholder="พิมพ์ชื่อหมวดหมู่ใหม่..."
          />
          <button
            onClick={() => {
              if (newCategory.trim()) {
                setSettings({ ...settings, categories: [...(settings.categories || []), newCategory.trim()] });
                setNewCategory('');
              }
            }}
            className="flex items-center gap-1.5 bg-accent-400 text-primary-900 font-semibold px-4 py-2 rounded-lg hover:bg-accent-500 transition-all"
          >
            <PlusCircle size={16} />
            <span>เพิ่ม</span>
          </button>
        </div>
        <p className="text-xs text-gray-400">หมวดหมู่เหล่านี้จะแสดงในหน้าแจ้งซ่อมใหม่</p>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-primary-700 to-primary-600 text-white px-6 py-2.5 rounded-lg hover:from-primary-800 hover:to-primary-700 disabled:opacity-50 font-medium shadow-md transition-all"
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
        {message && <span className="text-green-600 text-sm font-medium">{message}</span>}
      </div>
    </div>
  );
}
