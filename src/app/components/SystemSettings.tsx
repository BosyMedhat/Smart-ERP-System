import { useState, useEffect } from 'react';
import axios from 'axios';
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
interface BusinessProfile {
  companyName: string;
  phone: string;
  address: string;
  taxNumber: string;
  logo: string; 
}

export function SystemSettings() {
  const [modules, setModules] = useState<Module[]>([
    {
      id: 'inventory',
      name: 'المخازن',
      description: 'تتبع الكميات، الباركود، الموردين',
      icon: Package,
      enabled: false,
      color: '#F59E0B',
    },
    {
      id: 'sales',
      name: 'المبيعات',
      description: 'نقطة البيع، الفواتير، الديون',
      icon: ShoppingCart,
      enabled: false,
      color: '#3B82F6',
    },
    {
      id: 'employees',
      name: 'الموظفين',
      description: 'الرواتب، السلف، الحضور',
      icon: Users,
      enabled: false,
      color: '#10B981',
    },
    {
      id: 'ai',
      name: 'المساعد الذكي',
      description: 'الأوامر الصوتية، كشف الشذوذ',
      icon: Brain,
      enabled: false,
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
      enabled: false,
      color: '#06B6D4',
    },
  ]);

  const [businessProfile, setBusinessProfile] = useState({
    companyName: 'شركة التجارة الذكية',
    phone: '+20 123 456 7890',
    address: 'القاهرة، مصر الجديدة، شارع التحرير 123',
    taxNumber: '123-456-789',
    logo: '',
  });
    
  const [configId, setConfigId] = useState<number | null>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false); 
  const [securityStatus, setSecurityStatus] = useState({
    encryption: true, // لأن Django بيشفر الباسوردات تلقائياً
    backup: false,   // هتتغير لـ true لما تدوسي على "إنشاء نسخة" وتنجح
    auth: true         // لأننا بنستخدم نظام صلاحيات Django
  });

  // التعديل هنا: الدالة بقت تفرق بين التلقائي واليدوي
  const fetchSettings = async (isManual = false) => {
    if (isManual === true) setIsUpdating(true); // اللف يشتغل لو يدوي بس
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/system-config/');
      const serverData = response.data[0] || response.data;
      
      if (serverData) {
        setConfigId(serverData.id);
        setOriginalData(serverData);
        
        setBusinessProfile({
          companyName: serverData.company_name || '',
          phone: serverData.phone_number || '',
          address: serverData.address || '',
          taxNumber: serverData.commercial_register || '',
          logo: serverData.logo || '',
        });

        setModules(prev => prev.map(mod => {
          if (mod.id === 'inventory') return { ...mod, enabled: serverData.enable_inventory };
          if (mod.id === 'sales') return { ...mod, enabled: serverData.enable_sales };
          if (mod.id === 'employees') return { ...mod, enabled: serverData.enable_employees };
          if (mod.id === 'ai') return { ...mod, enabled: serverData.enable_ai_assistant };
          if (mod.id === 'automation') return { ...mod, enabled: serverData.enable_automation };
          if (mod.id === 'accounting') return { ...mod, enabled: serverData.enable_accounts }; 
          return mod;
        }));

        if (isManual === true) {
          alert("تم تحديث البيانات من السيرفر بنجاح 🔄");
        }
      }
    } catch (error) {
      console.error("خطأ في الربط:", error);
      if (isManual === true) alert("فشل الاتصال بالسيرفر");
    } finally {
      if (isManual === true) setIsUpdating(false); // اللف يوقف لو يدوي
    }
  };
    
  useEffect(() => {
    fetchSettings(false); // تحديث صامت عند فتح الصفحة (isManual = false)
  }, []);

  const handleSaveAll = async () => {
    const dataToSend = {
      company_name: businessProfile.companyName,
      phone_number: businessProfile.phone,
      address: businessProfile.address,
      commercial_register: businessProfile.taxNumber,
      enable_inventory: modules.find(m => m.id === 'inventory')?.enabled,
      enable_sales: modules.find(m => m.id === 'sales')?.enabled,
      enable_employees: modules.find(m => m.id === 'employees')?.enabled,
      enable_ai_assistant: modules.find(m => m.id === 'ai')?.enabled,
      enable_automation: modules.find(m => m.id === 'automation')?.enabled,
      enable_accounts: modules.find(m => m.id === 'accounting')?.enabled,
    };

    try {
      let response;
      if (configId) {
        response = await axios.put(`http://127.0.0.1:8000/api/system-config/${configId}/`, dataToSend);
      } else {
        response = await axios.post(`http://127.0.0.1:8000/api/system-config/`, dataToSend);
        setConfigId(response.data.id);
      }

      if (response.status === 200 || response.status === 201) {
        setOriginalData(response.data);
        alert("تم حفظ الإعدادات بنجاح في الباك إيند! ✅");
      }
    } catch (error) {
      console.error("خطأ أثناء الحفظ:", error);
      alert("فشل الحفظ، تأكدي من اتصال السيرفر.");
    }
  };

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !configId) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("حجم الصورة كبير جداً! الحد الأقصى المسموح به هو 2 ميجابايت.");
      return;
    }

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await axios.patch(`http://127.0.0.1:8000/api/system-config/${configId}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.logo) {
        setBusinessProfile(prev => ({
          ...prev,
          logo: response.data.logo
        }));
      }
      alert("تم رفع الشعار بنجاح! 🖼️");
    } catch (error) {
      console.error("خطأ في رفع الصورة:", error);
      alert("فشل رفع الشعار.");
    }
  };

  const toggleModule = (id: string) => {
    setModules((prev) =>
      prev.map((module) => (module.id === id ? { ...module, enabled: !module.enabled } : module))
    );
  };

  const handleProfileChange = (field: string, value: string) => {
    let cleanValue = value;

    // 1. لو بنعدل اسم المؤسسة: ممنوع كتابة أرقام نهائياً
    if (field === 'companyName') {
      cleanValue = value.replace(/[0-9]/g, ''); // بيمسح أي رقم بمجرد كتابته
    }

    // 2. لو بنعدل رقم الهاتف: ممنوع كتابة حروف (يسمح بالأرقام وعلامة + فقط)
    if (field === 'phone') {
      cleanValue = value.replace(/[^\d+ ]/g, ''); // بيمسح أي حرف فوراً
    }

    // 3. لو بنعدل السجل الضريبي: أرقام وشرط فقط
    if (field === 'taxNumber') {
      cleanValue = value.replace(/[^\d-]/g, '');
    }

    setBusinessProfile((prev) => ({ ...prev, [field]: cleanValue }));
  };

  const handleCancel = () => {
    if (!originalData) {
      alert("لا توجد بيانات أصلية للعودة إليها.");
      return;
    }
    setBusinessProfile({
      companyName: originalData.company_name || '',
      phone: originalData.phone_number || '',
      address: originalData.address || '',
      taxNumber: originalData.commercial_register || '',
      logo: originalData.logo || '',
    });
    setModules(prev => prev.map(mod => {
      if (mod.id === 'inventory') return { ...mod, enabled: originalData.enable_inventory };
      if (mod.id === 'sales') return { ...mod, enabled: originalData.enable_sales };
      if (mod.id === 'employees') return { ...mod, enabled: originalData.enable_employees };
      if (mod.id === 'ai') return { ...mod, enabled: originalData.enable_ai_assistant };
      if (mod.id === 'automation') return { ...mod, enabled: originalData.enable_automation };
      if (mod.id === 'accounting') return { ...mod, enabled: originalData.enable_accounts };
      return mod;
    }));
    alert("تم إلغاء كافة التعديلات بنجاح 🔄");
  };

  const handleProfessionalBackup = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/system-config/backup-server/');
      if (response.data.status === 'success') {
        setSecurityStatus(prev => ({ ...prev, backup: true })); // تخلي علامة الصح تنور
        alert(`تم بنجاح! النسخة محفوظة باسم: ${response.data.filename} 🔒`);
      }
    } catch (error) {
      console.error("خطأ في النسخ الاحتياطي المحترف:", error);
      alert("حدث خطأ تقني أثناء محاولة تأمين البيانات.");
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 space-y-6" dir="rtl">
      <div className="text-right">
        <h1 className="text-3xl font-bold text-[#1E293B] mb-2">إعدادات النظام والتحكم النمطي</h1>
        <p className="text-gray-600">تخصيص الموديولات وإدارة البيانات المحلية</p>
      </div>

      {/* موديولات النظام - كودك الأصلي بالكامل */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings size={24} className="text-[#3B82F6]" />
          <h2 className="text-2xl font-bold text-[#1E293B]">تخصيص الموديولات (Modular System)</h2>
        </div>
        <p className="text-gray-600 mb-6 text-right">
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
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-lg"
                  style={{ backgroundColor: module.color }}
                >
                  <Icon size={32} className="text-white" />
                </div>

                <h3 className="text-xl font-bold text-[#1E293B] mb-2 text-right">{module.name}</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed text-right">{module.description}</p>

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

      <div className="grid grid-cols-2 gap-6">
        {/* الملف التجاري - كودك الأصلي */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-right">
          <div className="flex items-center gap-3 mb-6 flex-row-reverse">
            <Building2 size={24} className="text-[#F59E0B]" />
            <h2 className="text-2xl font-bold text-[#1E293B]">الملف التجاري</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">اسم المؤسسة</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={businessProfile.companyName}
                  onChange={(e) => handleProfileChange('companyName', e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-right"
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
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-right"
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

        {/* شعار المؤسسة - كودك الأصلي */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6 flex-row-reverse">
            <Upload size={24} className="text-[#10B981]" />
            <h2 className="text-2xl font-bold text-[#1E293B]">شعار المؤسسة</h2>
          </div>

          <div className="flex flex-col items-center justify-center py-8">
            <input 
              type="file" 
              id="logo-upload" 
              className="hidden" 
              accept="image/*" 
              onChange={handleLogoChange} 
            />
            
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#1E293B] flex items-center justify-center mb-6 shadow-2xl overflow-hidden border-4 border-white">
              {businessProfile.logo ? (
                <img 
                  src={businessProfile.logo.startsWith('http') 
                       ? businessProfile.logo 
                       : `http://127.0.0.1:8000${businessProfile.logo}`} 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if(e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerHTML = '<span class="text-white text-5xl font-bold">ERP</span>';
                    }
                  }}
                />
              ) : (
                <span className="text-white text-5xl font-bold">ERP</span>
              )}
            </div>

            <button 
              onClick={() => document.getElementById('logo-upload')?.click()}
              className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-lg"
            >
              <Upload size={20} />
              رفع شعار جديد
            </button>
            <p className="text-xs text-gray-500 mt-3">PNG, JPG (الحد الأقصى: 2MB)</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-6 text-white text-right">
        <div className="flex items-center gap-3 mb-6 flex-row-reverse">
          <Database size={24} className="text-[#10B981]" />
          <h2 className="text-2xl font-bold">إدارة البيانات المحلية (Offline Management)</h2>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* كود النسخ الاحتياطي - كودك الأصلي */}
          <div className="bg-slate-700/50 rounded-xl border border-slate-600 p-6">
            <div className="flex items-center gap-3 mb-4 flex-row-reverse">
              <div className="w-12 h-12 bg-[#10B981] rounded-lg flex items-center justify-center">
                <Database size={24} className="text-white" />
              </div>
              <div className="text-right">
                <h3 className="font-bold text-white">النسخ الاحتياطي</h3>
                <p className="text-xs text-slate-400">آخر نسخة: منذ ساعتين</p>
              </div>
            </div>
            <button 
            onClick={handleProfessionalBackup}
            className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <Download size={18} />
              إنشاء نسخة الآن
            </button>
          </div>

          {/* تعديل زرار التحديث هنا بالظبط */}
          <div className="bg-slate-700/50 rounded-xl border border-slate-600 p-6">
            <div className="flex items-center gap-3 mb-4 flex-row-reverse">
              <div className="w-12 h-12 bg-[#3B82F6] rounded-lg flex items-center justify-center">
                <RefreshCw size={24} className="text-white" />
              </div>
              <div className="text-right">
                <h3 className="font-bold text-white">تحديث النظام</h3>
                <p className="text-xs text-slate-400">الإصدار: v2.5.1</p>
              </div>
            </div>
            <button 
            onClick={() => fetchSettings(true)} // بنبعت true عشان يلف ويطلع alert
            disabled={isUpdating}
            className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
              <RefreshCw size={18} className={isUpdating ? "animate-spin" : ""} />
              {isUpdating ? "جاري الفحص..." : "فحص التحديثات"}
            </button>
          </div>

          {/* حالة الأمان - ربطتها بالـ state عشان علامات الصح تنور */}
          <div className="bg-slate-700/50 rounded-xl border border-slate-600 p-6">
            <div className="flex items-center gap-3 mb-4 flex-row-reverse">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle size={24} className="text-white" />
              </div>
              <div className="text-right">
                <h3 className="font-bold text-white">حالة الأمان</h3>
                <p className="text-xs text-green-400">النظام آمن</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm flex-row-reverse">
                <span className="text-slate-400">التشفير</span>
                <CheckCircle size={16} className={securityStatus.encryption ? "text-green-400" : "text-gray-500"} />
              </div>
              <div className="flex items-center justify-between text-sm flex-row-reverse">
                <span className="text-slate-400">النسخ الاحتياطي</span>
                <CheckCircle size={16} className={securityStatus.backup ? "text-green-400" : "text-gray-500"} />
              </div>
              <div className="flex items-center justify-between text-sm flex-row-reverse">
                <span className="text-slate-400">المصادقة</span>
                <CheckCircle size={16} className={securityStatus.auth ? "text-green-400" : "text-gray-500"} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
        onClick={handleCancel}
         className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors">
          إلغاء التغييرات
        </button>
        <button 
          onClick={handleSaveAll}
          className="px-8 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-lg"
        >
          <CheckCircle size={20} />
          حفظ جميع الإعدادات
        </button>
      </div>
    </div>
  );
}