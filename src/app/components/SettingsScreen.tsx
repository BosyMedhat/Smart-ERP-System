import React, { useState, useEffect } from 'react';
import { Settings, Building2, Wallet, ShieldCheck, Palette, PackageSearch, Save, RefreshCcw } from 'lucide-react';
import axios from 'axios';

interface SystemSettings {
  company_name: string;
  company_address: string;
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

export default function SettingsScreen() {
  const [activeTab, setActiveTab ] = useState('company');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
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
      alert("✅ تم حفظ الإعدادات بنجاح!");
    } catch (e) {
      console.error("Error saving settings", e);
      alert("❌ فشل في حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SystemSettings, value: any) => {
    if (settings) {
      setSettings({ ...settings, [field]: value });
    }
  };

  if (loading) return <div className="p-10 text-center text-blue-400">جاري تحميل الإعدادات...</div>;

  const tabs = [
    { id: 'company', label: 'المؤسسة', icon: <Building2 size={18} /> },
    { id: 'financial', label: 'المالية', icon: <Wallet size={18} /> },
    { id: 'inventory', label: 'المخازن', icon: <PackageSearch size={18} /> },
    { id: 'security', label: 'الأمان', icon: <ShieldCheck size={18} /> },
    { id: 'ui', label: 'الواجهة', icon: <Palette size={18} /> },
  ];

  return (
    <div className="h-full bg-[#0F172A] p-6 text-right" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center">
                <Settings size={24} />
             </div>
             <div>
                <h1 className="text-2xl font-bold text-white">إعدادات النظام</h1>
                <p className="text-slate-400 text-sm">إدارة السلوك العام والخيارات المتقدمة</p>
             </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {saving ? <RefreshCcw className="animate-spin" size={18} /> : <Save size={18} />}
            حفظ التغييرات
          </button>
        </div>

        <div className="flex gap-2 p-1 bg-slate-900/50 border border-slate-800 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 min-h-[400px]">
          {activeTab === 'company' && settings && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-slate-400 text-sm">اسم الشركة</label>
                <input type="text" value={settings.company_name} onChange={e => handleChange('company_name', e.target.value)} className="w-full bg-slate-800 border-slate-700 text-white rounded-xl focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-slate-400 text-sm">الرقم الضريبي</label>
                <input type="text" value={settings.tax_number} onChange={e => handleChange('tax_number', e.target.value)} className="w-full bg-slate-800 border-slate-700 text-white rounded-xl" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-slate-400 text-sm">العنوان الكامل</label>
                <textarea rows={3} value={settings.company_address} onChange={e => handleChange('company_address', e.target.value)} className="w-full bg-slate-800 border-slate-700 text-white rounded-xl" />
              </div>
            </div>
          )}

          {activeTab === 'financial' && settings && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-slate-400 text-sm">نسبة الضريبة VAT (%)</label>
                <input type="number" value={settings.vat_percentage} onChange={e => handleChange('vat_percentage', e.target.value)} className="w-full bg-slate-800 border-slate-700 text-white rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-slate-400 text-sm">العملة</label>
                <input type="text" value={settings.currency} onChange={e => handleChange('currency', e.target.value)} className="w-full bg-slate-800 border-slate-700 text-white rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-slate-400 text-sm">ضريبة الرواتب (%)</label>
                <input type="number" value={settings.payroll_tax_rate} onChange={e => handleChange('payroll_tax_rate', e.target.value)} className="w-full bg-slate-800 border-slate-700 text-white rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-slate-400 text-sm">سقف السلف (ج.م)</label>
                <input type="number" value={settings.max_advance_limit} onChange={e => handleChange('max_advance_limit', e.target.value)} className="w-full bg-slate-800 border-slate-700 text-white rounded-xl" />
              </div>
            </div>
          )}

          {activeTab === 'inventory' && settings && (
            <div className="space-y-6">
               <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <div>
                    <h4 className="text-white font-bold">السماح بالبيع بالسالب</h4>
                    <p className="text-slate-500 text-xs">تمكين تسجيل مبيعات حتى لو كان المخزون المتاح صفر</p>
                  </div>
                  <input type="checkbox" checked={settings.allow_negative_stock} onChange={e => handleChange('allow_negative_stock', e.target.checked)} className="w-6 h-6 rounded bg-slate-700 border-slate-600 text-blue-500" />
               </div>
               <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <div>
                    <h4 className="text-white font-bold">تحديث أسعار البيع تلقائياً</h4>
                    <p className="text-slate-500 text-xs">تغيير سعر البيع بناءً على تغير سعر الشراء الأخير</p>
                  </div>
                  <input type="checkbox" checked={settings.auto_update_retail_price} onChange={e => handleChange('auto_update_retail_price', e.target.checked)} className="w-6 h-6 rounded bg-slate-700 border-slate-600 text-blue-500" />
               </div>
               <div className="space-y-2">
                <label className="text-slate-400 text-sm">حد التنبيه للنواقص (Low Stock)</label>
                <input type="number" value={settings.low_stock_threshold} onChange={e => handleChange('low_stock_threshold', e.target.value)} className="w-full bg-slate-800 border-slate-700 text-white rounded-xl" />
              </div>
            </div>
          )}

          {activeTab === 'security' && settings && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-slate-400 text-sm">بداية ساعات العمل الرسمي</label>
                <input type="time" value={settings.work_start_time} onChange={e => handleChange('work_start_time', e.target.value)} className="w-full bg-slate-800 border-slate-700 text-white rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-slate-400 text-sm">نهاية ساعات العمل الرسمي</label>
                <input type="time" value={settings.work_end_time} onChange={e => handleChange('work_end_time', e.target.value)} className="w-full bg-slate-800 border-slate-700 text-white rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-slate-400 text-sm">سقف خصم الكاشير (%)</label>
                <input type="number" value={settings.max_cashier_discount} onChange={e => handleChange('max_cashier_discount', e.target.value)} className="w-full bg-slate-800 border-slate-700 text-white rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-slate-400 text-sm">صلاحية الجلسة (يوم)</label>
                <input type="number" value={settings.token_expiry_days} onChange={e => handleChange('token_expiry_days', e.target.value)} className="w-full bg-slate-800 border-slate-700 text-white rounded-xl" />
              </div>
            </div>
          )}

          {activeTab === 'ui' && settings && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="space-y-1">
                   <h4 className="text-white font-bold text-sm">اللون الأساسي للنظام</h4>
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg shadow-inner border border-white/20" style={{ backgroundColor: settings.primary_color }}></div>
                      <span className="text-slate-400 font-mono">{settings.primary_color}</span>
                   </div>
                </div>
                <input type="color" value={settings.primary_color} onChange={e => handleChange('primary_color', e.target.value)} className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0" />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <div>
                    <h4 className="text-white font-bold">إظهار اللوجو في الفاتورة</h4>
                    <p className="text-slate-500 text-xs">طباعة شعار الشركة في أعلى فواتير الـ POS</p>
                  </div>
                  <input type="checkbox" checked={settings.print_logo_on_invoice} onChange={e => handleChange('print_logo_on_invoice', e.target.checked)} className="w-6 h-6 rounded bg-slate-700 border-slate-600 text-blue-500" />
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
