import { useState, useEffect } from 'react';
import { Save, Store, Palette, CheckCircle, Globe } from 'lucide-react';
import apiClient from '../../api/axiosConfig';

interface StoreSettings {
  id?: number;
  store_name: string;
  store_logo: string | null;
  currency: string;
  tax_rate: number;
  primary_color: string;
  system_name: string;
  is_configured: boolean;
}

export function Settings() {
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: 'Smart ERP',
    store_logo: null,
    currency: 'EGP',
    tax_rate: 14.00,
    primary_color: '#3B82F6',
    system_name: 'Smart ERP',
    is_configured: false,
  });
  const [activeTab, setActiveTab] = useState<'store' | 'appearance' | 'language'>('store');
  const [language, setLanguage] = useState(() => localStorage.getItem('lang') || 'ar');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    localStorage.setItem('lang', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
    window.location.reload(); // Reload to apply RTL/LTR changes
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiClient.get('/settings/1/');
        setSettings(response.data);
      } catch (err) {
        setError('تعذر تحميل الإعدادات');
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await apiClient.patch('/settings/1/', {
        ...settings,
        is_configured: true,
      });
      // Apply theme color immediately
      document.documentElement.style.setProperty('--primary-color', settings.primary_color);
      localStorage.setItem('primaryColor', settings.primary_color);
      localStorage.setItem('systemName', settings.system_name);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('فشل حفظ الإعدادات');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof StoreSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">جاري تحميل الإعدادات...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1E293B] mb-2">إعدادات النظام</h1>
        <p className="text-gray-600">تخصيص إعدادات المتجر والمظهر</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('store')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'store'
                ? 'text-[#3B82F6] border-b-2 border-[#3B82F6]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Store size={20} />
            معلومات المتجر
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'appearance'
                ? 'border-b-2'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            style={{
              color: activeTab === 'appearance' ? 'var(--primary-color)' : undefined,
              borderColor: activeTab === 'appearance' ? 'var(--primary-color)' : undefined
            }}
          >
            <Palette size={20} />
            المظهر
          </button>
          <button
            onClick={() => setActiveTab('language')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'language'
                ? 'border-b-2'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            style={{
              color: activeTab === 'language' ? 'var(--primary-color)' : undefined,
              borderColor: activeTab === 'language' ? 'var(--primary-color)' : undefined
            }}
          >
            <Globe size={20} />
            اللغة والاتجاه
          </button>
        </div>

        <div className="p-6">
          {/* Store Info Tab */}
          {activeTab === 'store' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    اسم المتجر
                  </label>
                  <input
                    type="text"
                    value={settings.store_name}
                    onChange={(e) => updateSetting('store_name', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    placeholder="اسم المتجر"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    العملة
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => updateSetting('currency', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  >
                    <option value="EGP">جنيه مصري (EGP)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="AED">درهم إماراتي (AED)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    نسبة الضريبة (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.tax_rate}
                    onChange={(e) => updateSetting('tax_rate', parseFloat(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    placeholder="14.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    اسم النظام
                  </label>
                  <input
                    type="text"
                    value={settings.system_name}
                    onChange={(e) => updateSetting('system_name', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    placeholder="Smart ERP"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  اللون الأساسي
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => updateSetting('primary_color', e.target.value)}
                    className="w-16 h-16 rounded-lg cursor-pointer border border-gray-200"
                  />
                  <input
                    type="text"
                    value={settings.primary_color}
                    onChange={(e) => updateSetting('primary_color', e.target.value)}
                    className="w-32 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-center uppercase"
                    placeholder="#3B82F6"
                    maxLength={7}
                  />
                  <div 
                    className="w-12 h-12 rounded-lg border border-gray-200"
                    style={{ backgroundColor: settings.primary_color }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  هذا اللون سيستخدم في أزرار التنقل والعناصر الرئيسية
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-3">معاينة الألوان</h4>
                <div className="flex gap-4">
                  <button
                    className="px-6 py-3 rounded-lg text-white font-semibold"
                    style={{ backgroundColor: settings.primary_color }}
                  >
                    زر رئيسي
                  </button>
                  <button
                    className="px-6 py-3 rounded-lg border-2 font-semibold"
                    style={{ borderColor: settings.primary_color, color: settings.primary_color }}
                  >
                    زر ثانوي
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Language Tab */}
          {activeTab === 'language' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">اللغة والاتجاه</h3>
              <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-xl">
                <div className="text-4xl">
                  {language === 'ar' ? '🇸🇦' : '🇬🇧'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">
                    {language === 'ar' ? 'اللغة العربية (RTL)' : 'English (LTR)'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {language === 'ar' ? 'تخطيط من اليمين لليسار' : 'Left-to-Right layout'}
                  </p>
                </div>
                <button
                  onClick={toggleLanguage}
                  className="px-6 py-3 rounded-xl font-bold transition-all"
                  style={{
                    backgroundColor: 'var(--primary-color)',
                    color: 'white'
                  }}
                >
                  {language === 'ar' ? '🌐 Switch to English' : '🌐 التحول للعربية'}
                </button>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-blue-700 text-sm">
                💡 ملاحظة: تغيير اللغة يتطلب إعادة تحميل الصفحة لتطبيق التغييرات
              </div>
            </div>
          )}

          {/* Error & Success Messages */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 flex items-center gap-2">
              <CheckCircle size={20} />
              تم حفظ الإعدادات بنجاح!
            </div>
          )}

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>جاري الحفظ...</>
              ) : (
                <>
                  <Save size={20} />
                  حفظ الإعدادات
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
