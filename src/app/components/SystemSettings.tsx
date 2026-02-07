import { useState } from 'react';
import {
  Settings,
  Package,
  ShoppingCart,
  Users,
  Brain,
  Zap,
  DollarSign,
  Upload,
  Database,
  Download,
  RefreshCw,
  Building2,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
} from 'lucide-react';

interface Module {
  id: string;
  name: string;
  description: string;
  icon: typeof Package;
  enabled: boolean;
  color: string;
}

export function SystemSettings() {
  const [modules, setModules] = useState<Module[]>([
    {
      id: 'inventory',
      name: 'المخازن',
      description: 'تتبع الكميات، الباركود، الموردين',
      icon: Package,
      enabled: true,
      color: '#F59E0B',
    },
    {
      id: 'sales',
      name: 'المبيعات',
      description: 'نقطة البيع، الفواتير، الديون',
      icon: ShoppingCart,
      enabled: true,
      color: '#3B82F6',
    },
    {
      id: 'employees',
      name: 'الموظفين',
      description: 'الرواتب، السلف، الحضور',
      icon: Users,
      enabled: true,
      color: '#10B981',
    },
    {
      id: 'ai',
      name: 'المساعد الذكي',
      description: 'الأوامر الصوتية، كشف الشذوذ',
      icon: Brain,
      enabled: true,
      color: '#8B5CF6',
    },
    {
      id: 'automation',
      name: 'الأتمتة',
      description: 'الربط مع n8n، رسائل الواتساب',
      icon: Zap,
      enabled: false,
      color: '#F85554',
    },
    {
      id: 'accounting',
      name: 'الحسابات',
      description: 'المصروفات، صافي الربح',
      icon: DollarSign,
      enabled: true,
      color: '#06B6D4',
    },
  ]);

  const [businessProfile, setBusinessProfile] = useState({
    companyName: 'شركة التجارة الذكية',
    phone: '+20 123 456 7890',
    address: 'القاهرة، مصر الجديدة، شارع التحرير 123',
    taxNumber: '123-456-789',
  });

  const toggleModule = (id: string) => {
    setModules((prev) =>
      prev.map((module) => (module.id === id ? { ...module, enabled: !module.enabled } : module))
    );
  };

  const handleProfileChange = (field: string, value: string) => {
    setBusinessProfile((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1E293B] mb-2">إعدادات النظام والتحكم النمطي</h1>
        <p className="text-gray-600">تخصيص الموديولات وإدارة البيانات المحلية</p>
      </div>

      {/* Modular Toggle Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings size={24} className="text-[#3B82F6]" />
          <h2 className="text-2xl font-bold text-[#1E293B]">تخصيص الموديولات (Modular System)</h2>
        </div>
        <p className="text-gray-600 mb-6">
          قم بتفعيل أو إيقاف الموديولات حسب احتياجات مؤسستك
        </p>

        <div className="grid grid-cols-3 gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <div
                key={module.id}
                className={`relative bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 p-6 transition-all ${
                  module.enabled
                    ? 'border-[#3B82F6] shadow-lg shadow-blue-500/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Module Icon */}
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-lg"
                  style={{ backgroundColor: module.color }}
                >
                  <Icon size={32} className="text-white" />
                </div>

                {/* Module Name */}
                <h3 className="text-xl font-bold text-[#1E293B] mb-2">{module.name}</h3>

                {/* Module Description */}
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{module.description}</p>

                {/* Toggle Switch */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">
                    {module.enabled ? 'مفعّل' : 'معطّل'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={module.enabled}
                      onChange={() => toggleModule(module.id)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#3B82F6] shadow-inner"></div>
                  </label>
                </div>

                {/* Enabled Badge */}
                {module.enabled && (
                  <div className="absolute top-4 left-4">
                    <div className="w-8 h-8 bg-[#10B981] rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle size={18} className="text-white" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Business Profile Section */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 size={24} className="text-[#F59E0B]" />
            <h2 className="text-2xl font-bold text-[#1E293B]">الملف التجاري</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">اسم المؤسسة</label>
              <div className="relative">
                <input
                  type="text"
                  value={businessProfile.companyName}
                  onChange={(e) => handleProfileChange('companyName', e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
                <Building2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف</label>
              <div className="relative">
                <input
                  type="tel"
                  value={businessProfile.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  dir="ltr"
                />
                <Phone size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">العنوان</label>
              <div className="relative">
                <input
                  type="text"
                  value={businessProfile.address}
                  onChange={(e) => handleProfileChange('address', e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
                <MapPin size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الرقم الضريبي</label>
              <div className="relative">
                <input
                  type="text"
                  value={businessProfile.taxNumber}
                  onChange={(e) => handleProfileChange('taxNumber', e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  dir="ltr"
                />
                <FileText size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Logo Upload */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Upload size={24} className="text-[#10B981]" />
            <h2 className="text-2xl font-bold text-[#1E293B]">شعار المؤسسة</h2>
          </div>

          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#1E293B] flex items-center justify-center mb-6 shadow-2xl">
              <span className="text-white text-5xl font-bold">ERP</span>
            </div>

            <button className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-lg">
              <Upload size={20} />
              رفع شعار جديد
            </button>
            <p className="text-xs text-gray-500 mt-3">PNG, JPG (الحد الأقصى: 2MB)</p>
          </div>
        </div>
      </div>

      {/* Local System & Security */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-6 text-white">
        <div className="flex items-center gap-3 mb-6">
          <Database size={24} className="text-[#10B981]" />
          <h2 className="text-2xl font-bold">إدارة البيانات المحلية (Offline Management)</h2>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Backup Card */}
          <div className="bg-slate-700/50 rounded-xl border border-slate-600 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#10B981] rounded-lg flex items-center justify-center">
                <Database size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">النسخ الاحتياطي</h3>
                <p className="text-xs text-slate-400">آخر نسخة: منذ ساعتين</p>
              </div>
            </div>
            <button className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <Download size={18} />
              إنشاء نسخة الآن
            </button>
          </div>

          {/* System Update Card */}
          <div className="bg-slate-700/50 rounded-xl border border-slate-600 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#3B82F6] rounded-lg flex items-center justify-center">
                <RefreshCw size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">تحديث النظام</h3>
                <p className="text-xs text-slate-400">الإصدار: v2.5.1</p>
              </div>
            </div>
            <button className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <RefreshCw size={18} />
              فحص التحديثات
            </button>
          </div>

          {/* Security Status */}
          <div className="bg-slate-700/50 rounded-xl border border-slate-600 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">حالة الأمان</h3>
                <p className="text-xs text-green-400">النظام آمن</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">التشفير</span>
                <CheckCircle size={16} className="text-green-400" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">النسخ الاحتياطي</span>
                <CheckCircle size={16} className="text-green-400" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">المصادقة</span>
                <CheckCircle size={16} className="text-green-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <button className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors">
          إلغاء التغييرات
        </button>
        <button className="px-8 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-lg">
          <CheckCircle size={20} />
          حفظ جميع الإعدادات
        </button>
      </div>
    </div>
  );
}
