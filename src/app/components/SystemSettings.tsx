import { useState, useEffect } from 'react';
import {
  Settings, Building2, Wallet, ShieldCheck, Palette, PackageSearch, Save, RefreshCcw, Phone, MapPin, Hash, DollarSign
} from 'lucide-react';
import axios from 'axios';

interface SystemSettingsData {
  company_name: string;
  company_address: string;
  company_phone: string;
  tax_number: string;
  vat_percentage: number;
  currency: string;
  payroll_tax_rate: number;
  max_advance_limit: number;
  allow_negative_stock: boolean;
  auto_update_retail_price: boolean;
  low_stock_threshold: number;
  work_start_time: string;
  work_end_time: string;
  max_cashier_discount: number;
  token_expiry_days: number;
  primary_color: string;
  print_logo_on_invoice: boolean;
}

export function SystemSettings() {
  const [activeTab, setActiveTab] = useState('company');
  const [settings, setSettings] = useState<SystemSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const resp = await axios.get('http://127.0.0.1:8000/api/settings/');
      setSettings(resp.data);
      setLoading(false);
    } catch (e) {
      console.error("Error fetching settings", e);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await axios.patch('http://127.0.0.1:8000/api/settings/1/', settings);
      alert("✅ تم حفظ الإعدادات بنجاح وتعميمها على كافة الموديولات!");
    } catch (e) {
      console.error("Error saving settings", e);
      alert("❌ فشل في حفظ الإعدادات، تأكد من الاتصال بالسيرفر.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SystemSettingsData, value: any) => {
    if (settings) {
      setSettings({ ...settings, [field]: value });
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-[#0F172A]">
      <div className="text-blue-400 font-bold animate-pulse text-xl">جاري تحميل إعدادات النظام...</div>
    </div>
  );

  const tabs = [
    { id: 'company', label: 'بيانات المؤسسة', icon: <Building2 size={18} /> },
    { id: 'financial', label: 'المالية والضرائب', icon: <Wallet size={18} /> },
    { id: 'inventory', label: 'المخازن والمشتريات', icon: <PackageSearch size={18} /> },
    { id: 'security', label: 'الأمان والرقابة', icon: <ShieldCheck size={18} /> },
    { id: 'ui', label: 'تخصيص الواجهة', icon: <Palette size={18} /> },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#0F172A] p-6 text-right" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-8 rounded-3xl border border-slate-700/50 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/30">
              <Settings size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">إعدادات النظام (The Brain)</h1>
              <p className="text-slate-400">التحكم المركزي في سلوك كافة الإدارات</p>
            </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-500/20"
          >
            {saving ? <RefreshCcw className="animate-spin" size={20} /> : <Save size={20} />}
            حفظ كافة التغييرات
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-3 p-2 bg-slate-900/80 border border-slate-800 rounded-2xl sticky top-0 z-10 backdrop-blur-md">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-xl scale-100' 
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-10 min-h-[500px] shadow-inner mb-10">
          
          {/* 1. Company Tab */}
          {activeTab === 'company' && settings && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-slate-300 font-bold flex items-center gap-2"><Building2 size={18} className="text-blue-400" /> اسم المنشأة</label>
                    <input type="text" value={settings.company_name} onChange={e => handleChange('company_name', e.target.value)} className="w-full h-12 bg-slate-800/50 border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 px-4" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-slate-300 font-bold flex items-center gap-2"><Hash size={18} className="text-blue-400" /> الرقم الضريبي (VAT ID)</label>
                    <input type="text" value={settings.tax_number || ''} onChange={e => handleChange('tax_number', e.target.value)} className="w-full h-12 bg-slate-800/50 border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 px-4" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-slate-300 font-bold flex items-center gap-2"><Phone size={18} className="text-blue-400" /> رقم الهاتف</label>
                    <input type="text" value={settings.company_phone || ''} onChange={e => handleChange('company_phone', e.target.value)} className="w-full h-12 bg-slate-800/50 border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 px-4 text-left" dir="ltr" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-slate-300 font-bold flex items-center gap-2"><MapPin size={18} className="text-blue-400" /> العنوان</label>
                    <input type="text" value={settings.company_address || ''} onChange={e => handleChange('company_address', e.target.value)} className="w-full h-12 bg-slate-800/50 border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 px-4" />
                  </div>
               </div>
               
               <div className="space-y-3 p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                  <label className="text-slate-300 font-bold block mb-4">شعار المؤسسة (Company Logo)</label>
                  <div className="flex items-center gap-8">
                     <div className="w-32 h-32 bg-slate-900 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center overflow-hidden">
                        <span className="text-slate-600 text-xs text-center px-2">معاينة الشعار<br/>(قريباً)</span>
                     </div>
                     <div className="space-y-2">
                        <button className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg text-sm transition-colors">اختيار ملف...</button>
                        <p className="text-slate-500 text-xs">PNG, JPG بحد أقصى 2 ميجابايت</p>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* 2. Financial Tab */}
          {activeTab === 'financial' && settings && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 bg-slate-800/30 rounded-3xl border border-slate-700 space-y-6">
                <h3 className="text-blue-400 font-bold border-b border-slate-700/50 pb-4 text-xl flex items-center gap-2">📊 ضرائب المبيعات والعملة</h3>
                <div className="space-y-3">
                  <label className="text-slate-300 font-bold block">نسبة الضريبة القياسية (VAT %)</label>
                  <div className="relative">
                    <input type="number" step="0.01" value={settings.vat_percentage} onChange={e => handleChange('vat_percentage', e.target.value)} className="w-full h-12 bg-slate-900 border-slate-700 text-white rounded-xl px-4 text-left" dir="ltr" />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-slate-300 font-bold block">العملة الأساسية</label>
                  <input type="text" value={settings.currency} onChange={e => handleChange('currency', e.target.value)} className="w-full h-12 bg-slate-900 border-slate-700 text-white rounded-xl px-4" />
                </div>
              </div>
              <div className="p-8 bg-slate-800/30 rounded-3xl border border-slate-700 space-y-6">
                <h3 className="text-green-400 font-bold border-b border-slate-700/50 pb-4 text-xl flex items-center gap-2">💴 ضرائب الرواتب والماليات</h3>
                <div className="space-y-3">
                  <label className="text-slate-300 font-bold block">ضريبة الدخل على الرواتب (%)</label>
                  <div className="relative">
                    <input type="number" step="0.01" value={settings.payroll_tax_rate} onChange={e => handleChange('payroll_tax_rate', e.target.value)} className="w-full h-12 bg-slate-900 border-slate-700 text-white rounded-xl px-4 text-left" dir="ltr" />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-slate-300 font-bold block">الحد الأقصى للسلف الشهرية</label>
                  <div className="relative">
                    <input type="number" value={settings.max_advance_limit} onChange={e => handleChange('max_advance_limit', e.target.value)} className="w-full h-12 bg-slate-900 border-slate-700 text-white rounded-xl px-4 text-left" dir="ltr" />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{settings.currency}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Inventory Tab */}
          {activeTab === 'inventory' && settings && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="p-8 bg-slate-800/40 rounded-3xl border border-blue-500/20 flex items-center justify-between hover:border-blue-500/40 transition-all shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                      <PackageSearch size={24} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-xl">السماح بالبيع بالسالب (Negative Stock)</h4>
                      <p className="text-slate-500 text-sm">تمكين البيع حتى لو كان رصيد الصنف صفر (للمؤسسات الخدمية أو الإنتاجية)</p>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.allow_negative_stock} onChange={e => handleChange('allow_negative_stock', e.target.checked)} className="sr-only peer" />
                    <div className="w-16 h-8 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-1 after:start-[6px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                  </div>
               </div>

               <div className="p-8 bg-slate-800/30 rounded-3xl border border-slate-700 space-y-4">
                  <label className="text-slate-300 font-bold block text-lg">حد التنبيه للنواقص (Low Stock Alert)</label>
                  <div className="flex items-center gap-4">
                     <input type="range" min="0" max="100" value={settings.low_stock_threshold} onChange={e => handleChange('low_stock_threshold', e.target.value)} className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                     <span className="w-16 h-12 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center text-blue-400 font-bold">{settings.low_stock_threshold}</span>
                  </div>
                  <p className="text-slate-500 text-sm">سيتم تلوين المنتجات باللون البرمجي في المخازن إذا قل رصيدها عن هذا الرقم.</p>
               </div>

               <div className="flex items-center justify-between p-8 bg-slate-800/40 rounded-3xl border border-slate-700">
                  <div>
                    <h4 className="text-white font-bold">التحديث التلقائي لأسعار البيع</h4>
                    <p className="text-slate-500 text-sm">تعديل سعر البيع تلقائياً عند تسجيل مشتريات بسعر تكلفة جديد.</p>
                  </div>
                  <input type="checkbox" checked={settings.auto_update_retail_price} onChange={e => handleChange('auto_update_retail_price', e.target.checked)} className="w-6 h-6 rounded bg-slate-900 border-slate-700 text-blue-500" />
               </div>
            </div>
          )}

          {/* 4. Security Tab */}
          {activeTab === 'security' && settings && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="p-8 bg-slate-800/30 rounded-3xl border border-orange-500/20 space-y-8">
                <h3 className="text-orange-400 font-bold border-b border-orange-500/20 pb-4 text-xl flex items-center gap-2">⏱️ مواعيد العمل والرقابة</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-slate-400 text-sm">بداية الدوام</label>
                    <input type="time" value={settings.work_start_time} onChange={e => handleChange('work_start_time', e.target.value)} className="w-full h-12 bg-slate-900 border-slate-700 text-white rounded-xl px-4" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-slate-400 text-sm">نهاية الدوام</label>
                    <input type="time" value={settings.work_end_time} onChange={e => handleChange('work_end_time', e.target.value)} className="w-full h-12 bg-slate-900 border-slate-700 text-white rounded-xl px-4" />
                  </div>
                </div>
                <div className="space-y-3 pt-4">
                  <label className="text-slate-300 font-bold block">سقف خصم الكاشير المسموح (%)</label>
                  <div className="relative">
                    <input type="number" value={settings.max_cashier_discount} onChange={e => handleChange('max_cashier_discount', e.target.value)} className="w-full h-12 bg-slate-900 border-slate-700 text-white rounded-xl px-4 text-left" dir="ltr" />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                  </div>
                </div>
              </div>
              <div className="p-8 bg-slate-800/30 rounded-3xl border border-red-500/20 space-y-8">
                <h3 className="text-red-400 font-bold border-b border-red-500/20 pb-4 text-xl flex items-center gap-2">🛡️ الإدارة والجلسات</h3>
                <div className="space-y-3">
                  <label className="text-slate-300 font-bold block">مدة صلاحية الجلسة (TOKEN)</label>
                  <div className="flex items-center gap-4">
                    <input type="number" value={settings.token_expiry_days} onChange={e => handleChange('token_expiry_days', e.target.value)} className="w-24 h-12 bg-slate-900 border-slate-700 text-white rounded-xl px-4 text-center" />
                    <span className="text-slate-400">أيام</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-slate-300 font-bold block text-sm text-red-300">سقف السلف المسموح للموظف شهرياً</label>
                  <div className="relative">
                    <input type="number" value={settings.max_advance_limit} onChange={e => handleChange('max_advance_limit', e.target.value)} className="w-full h-12 bg-slate-900 border-slate-700 text-white rounded-xl px-4 text-left" dir="ltr" />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{settings.currency}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. UI Tab */}
          {activeTab === 'ui' && settings && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="p-10 bg-slate-800/50 rounded-3xl border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-4">
                    <h4 className="text-2xl font-bold text-white">هوية النظام البصرية</h4>
                    <p className="text-slate-400 max-w-md">اختر اللون الأساسي الذي تفضله للسيستم. سيتم تطبيق هذا اللون على كافة الأزرار والروابط والعناصر النشطة فور الحفظ.</p>
                    <div className="flex items-center gap-4 mt-4 p-4 bg-slate-900 rounded-2xl border border-slate-800 w-fit">
                       <div className="w-16 h-16 rounded-2xl shadow-2xl border border-white/20" style={{ backgroundColor: settings.primary_color }}></div>
                       <div className="space-y-1">
                          <span className="text-slate-500 text-xs block">Hex Code</span>
                          <span className="text-blue-400 font-mono text-xl font-bold">{settings.primary_color}</span>
                       </div>
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <input type="color" value={settings.primary_color} onChange={e => handleChange('primary_color', e.target.value)} className="w-40 h-40 rounded-full cursor-pointer bg-transparent border-0 relative z-10 p-0" />
                  </div>
               </div>
               
               <div className="p-8 bg-slate-800/40 rounded-3xl border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-xl flex items-center justify-center">
                      <Save size={24} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">إظهار اللوجو في الفاتورة المطبوعة</h4>
                      <p className="text-slate-500 text-sm">تمكين طباعة شعار الشركة في ترويسة الفاتورة الحرارية (POS Receipt).</p>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.print_logo_on_invoice} onChange={e => handleChange('print_logo_on_invoice', e.target.checked)} className="sr-only peer" />
                    <div className="w-16 h-8 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:bg-green-600 after:content-[''] after:absolute after:top-1 after:start-[6px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
