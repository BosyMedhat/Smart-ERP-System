import { useState, useEffect } from 'react';
import {
  Save,
  Store,
  Palette,
  CheckCircle,
  Globe,
  Building2,
  Phone,
  MapPin,
  Mail,
  FileText,
  Shield,
  Lock,
  Clock,
  Calendar,
  Hash,
  ToggleLeft,
  StickyNote,
  AlertTriangle,
} from 'lucide-react';
import apiClient from '../../api/axiosConfig';

// Complete StoreSettings interface matching backend model
interface StoreSettings {
  id?: number;
  // معلومات الشركة
  store_name: string;
  system_name: string;
  currency: string;
  tax_rate: number;
  phone: string;
  address: string;
  email: string;
  store_logo: string | null;
  // الفواتير والمبيعات
  invoice_prefix: string;
  invoice_starting_number: number;
  invoice_due_days: number;
  show_tax_on_invoice: boolean;
  invoice_notes: string;
  // الأمان
  session_timeout_hours: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  // المظهر واللغة
  primary_color: string;
  language: 'ar' | 'en';
  date_format: string;
  // الحالة
  is_configured: boolean;
}

type TabType = 'company' | 'invoices' | 'security' | 'appearance';

const defaultSettings: StoreSettings = {
  store_name: 'Smart ERP',
  system_name: 'Smart ERP',
  currency: 'EGP',
  tax_rate: 14.00,
  phone: '',
  address: '',
  email: '',
  store_logo: null,
  invoice_prefix: 'INV',
  invoice_starting_number: 1,
  invoice_due_days: 30,
  show_tax_on_invoice: true,
  invoice_notes: '',
  session_timeout_hours: 8,
  max_login_attempts: 5,
  lockout_duration_minutes: 30,
  primary_color: '#3B82F6',
  language: 'ar',
  date_format: 'DD/MM/YYYY',
  is_configured: false,
};

export function Settings() {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<TabType>('company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [needsReload, setNeedsReload] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiClient.get('/settings/1/');
        const data = response.data;
        setSettings({ ...defaultSettings, ...data });
        // Sync language with localStorage
        const savedLang = localStorage.getItem('lang') || data.language || 'ar';
        if (savedLang !== data.language) {
          localStorage.setItem('lang', savedLang);
        }
        document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = savedLang;
      } catch (err) {
        setError('تعذر تحميل الإعدادات');
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // BUG FIX: Language is now part of settings and saved to backend
  const toggleLanguage = async () => {
    const newLang = settings.language === 'ar' ? 'en' : 'ar';
    setSettings(prev => ({ ...prev, language: newLang }));
    localStorage.setItem('lang', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
    setNeedsReload(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const response = await apiClient.patch('/settings/1/', {
        ...settings,
        is_configured: true,
      });
      setSettings({ ...defaultSettings, ...response.data });

      // Apply theme color immediately
      document.documentElement.style.setProperty('--primary-color', settings.primary_color);
      localStorage.setItem('primaryColor', settings.primary_color);
      localStorage.setItem('systemName', settings.system_name);
      localStorage.setItem('lang', settings.language);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Reload if language changed
      if (needsReload) {
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'فشل حفظ الإعدادات');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof StoreSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'language') {
      setNeedsReload(true);
    }
  };

  const tabs: { id: TabType; label: string; icon: typeof Store }[] = [
    { id: 'company', label: 'معلومات الشركة', icon: Building2 },
    { id: 'invoices', label: 'الفواتير والمبيعات', icon: FileText },
    { id: 'security', label: 'الأمان', icon: Shield },
    { id: 'appearance', label: 'المظهر واللغة', icon: Palette },
  ];

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
        <p className="text-gray-600">إدارة إعدادات النظام والمتجر والأمان</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-[#3B82F6] border-b-2 border-[#3B82F6]'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* TAB 1: معلومات الشركة */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Building2 className="text-[#3B82F6]" />
                معلومات الشركة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    اسم المتجر / الشركة
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    العملة
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => updateSetting('currency', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  >
                    <option value="EGP">EGP جنيه مصري</option>
                    <option value="SAR">SAR ريال سعودي</option>
                    <option value="USD">USD دولار أمريكي</option>
                    <option value="AED">AED درهم إماراتي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    نسبة الضريبة (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={settings.tax_rate}
                    onChange={(e) => updateSetting('tax_rate', parseFloat(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Phone size={16} />
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => updateSetting('phone', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Mail size={16} />
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => updateSetting('email', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    dir="ltr"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin size={16} />
                    العنوان
                  </label>
                  <textarea
                    value={settings.address}
                    onChange={(e) => updateSetting('address', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: الفواتير والمبيعات */}
          {activeTab === 'invoices' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="text-[#3B82F6]" />
                الفواتير والمبيعات
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Hash size={16} />
                    بادئة الفاتورة
                  </label>
                  <input
                    type="text"
                    value={settings.invoice_prefix}
                    onChange={(e) => updateSetting('invoice_prefix', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    dir="ltr"
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">مثال: INV-00001</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    رقم البداية
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.invoice_starting_number}
                    onChange={(e) => updateSetting('invoice_starting_number', parseInt(e.target.value) || 1)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar size={16} />
                    أيام الاستحقاق
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.invoice_due_days}
                    onChange={(e) => updateSetting('invoice_due_days', parseInt(e.target.value) || 30)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <ToggleLeft size={16} />
                      إظهار الضريبة في الفاتورة
                    </label>
                    <p className="text-xs text-gray-500">عرض سطر الضريبة في الفاتورة المطبوعة</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.show_tax_on_invoice}
                      onChange={(e) => updateSetting('show_tax_on_invoice', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B82F6]"></div>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <StickyNote size={16} />
                    ملاحظات ثابتة في الفاتورة
                  </label>
                  <textarea
                    value={settings.invoice_notes}
                    onChange={(e) => updateSetting('invoice_notes', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    rows={3}
                    placeholder="شروط الدفع، سياسة الإرجاع، إلخ..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: الأمان */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Shield className="text-[#3B82F6]" />
                إعدادات الأمان
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Clock size={16} className="text-blue-600" />
                    مدة الجلسة (ساعات)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={settings.session_timeout_hours}
                    onChange={(e) => updateSetting('session_timeout_hours', parseInt(e.target.value) || 8)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  />
                  <p className="text-xs text-gray-500 mt-1">سيتم تسجيل الخروج تلقائياً بعد هذه المدة</p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-orange-600" />
                    محاولات الدخول
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.max_login_attempts}
                    onChange={(e) => updateSetting('max_login_attempts', parseInt(e.target.value) || 5)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  />
                  <p className="text-xs text-gray-500 mt-1">عدد المحاولات قبل حظر المستخدم</p>
                </div>

                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Lock size={16} className="text-red-600" />
                    مدة الحظر (دقائق)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={settings.lockout_duration_minutes}
                    onChange={(e) => updateSetting('lockout_duration_minutes', parseInt(e.target.value) || 30)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  />
                  <p className="text-xs text-gray-500 mt-1">مدة منع المستخدم من تسجيل الدخول</p>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                  <AlertTriangle size={18} />
                  نصائح الأمان
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>استخدم كلمات مرور قوية (8+ أحرف، أرقام، رموز)</li>
                  <li>غيّر كلمة المرور بشكل دوري</li>
                  <li>لا تشارك بيانات تسجيل الدخول مع الموظفين</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: المظهر واللغة */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Palette className="text-[#3B82F6]" />
                المظهر واللغة
              </h3>

              {/* Language Section */}
              <div className="p-6 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Globe size={18} />
                  اللغة والاتجاه
                </h4>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">
                    {settings.language === 'ar' ? '🇸🇦' : '🇬🇧'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {settings.language === 'ar' ? 'اللغة العربية (RTL)' : 'English (LTR)'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {settings.language === 'ar' ? 'تخطيط من اليمين لليسار' : 'Left-to-Right layout'}
                    </p>
                  </div>
                  <button
                    onClick={toggleLanguage}
                    className="px-6 py-3 rounded-xl font-bold transition-all bg-[#3B82F6] hover:bg-[#2563EB] text-white"
                  >
                    {settings.language === 'ar' ? '🌐 Switch to English' : '🌐 التحول للعربية'}
                  </button>
                </div>
                {needsReload && (
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg text-blue-700 text-sm">
                    💡 سيتم إعادة تحميل الصفحة عند الحفظ لتطبيق تغيير اللغة
                  </div>
                )}
              </div>

              {/* Primary Color */}
              <div className="p-6 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-700 mb-4">اللون الأساسي</h4>
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

                {/* Color Preview */}
                <div className="mt-4 flex gap-4">
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

              {/* Date Format */}
              <div className="p-6 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Calendar size={18} />
                  تنسيق التاريخ
                </h4>
                <select
                  value={settings.date_format}
                  onChange={(e) => updateSetting('date_format', e.target.value)}
                  className="w-full md:w-1/2 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                </select>
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

