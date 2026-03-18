import { useState } from 'react';
import { 
  Zap, 
  CheckCircle, 
  MessageCircle, 
  Mail, 
  AlertTriangle, 
  TrendingUp,
  Package,
  Shield,
  Save,
  Clock,
  Bell
} from 'lucide-react';

interface WorkflowRule {
  id: string;
  title: string;
  description: string;
  icon: typeof Package;
  enabled: boolean;
  color: string;
}

interface ActivityLog {
  id: string;
  time: string;
  message: string;
  type: 'whatsapp' | 'email' | 'alert';
  icon: typeof MessageCircle;
}

export function AutomationEngine() {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([
    {
      id: '1',
      title: 'تنبيه نقص المخزون الحرج',
      description: 'إرسال واتساب تلقائي عند انخفاض المخزون لأقل من الحد الأدنى',
      icon: Package,
      enabled: true,
      color: '#F85554',
    },
    {
      id: '2',
      title: 'تنبيه كشف الشذوذ (AI)',
      description: 'إشعار فوري عند رصد عملية مشبوهة من نظام الذكاء الاصطناعي',
      icon: Shield,
      enabled: true,
      color: '#3B82F6',
    },
    {
      id: '3',
      title: 'تقرير المبيعات الأسبوعي التلقائي',
      description: 'إرسال تقرير شامل كل يوم أحد الساعة 9 صباحاً',
      icon: TrendingUp,
      enabled: false,
      color: '#10B981',
    },
    {
      id: '4',
      title: 'طلب شراء تلقائي للموردين',
      description: 'إنشاء طلبات شراء تلقائية عند الوصول لحد إعادة الطلب',
      icon: Package,
      enabled: false,
      color: '#F59E0B',
    },
  ]);

  const [activityLogs] = useState<ActivityLog[]>([
    {
      id: '1',
      time: '10:00 ص',
      message: 'تم إرسال رسالة WhatsApp للمورد (شركة الأمل) - نقص منتج: سكر',
      type: 'whatsapp',
      icon: MessageCircle,
    },
    {
      id: '2',
      time: '09:00 ص',
      message: 'تم إرسال تقرير الأرباح الأسبوعي لبريد المدير',
      type: 'email',
      icon: Mail,
    },
    {
      id: '3',
      time: 'أمس 11:30 م',
      message: 'تم رصد محاولة دخول مشبوهة وإرسال تنبيه فوراً',
      type: 'alert',
      icon: AlertTriangle,
    },
    {
      id: '4',
      time: 'أمس 03:45 م',
      message: 'تم إرسال طلب شراء تلقائي للمورد (مؤسسة التوريدات) - منتج: لابتوب HP',
      type: 'email',
      icon: Mail,
    },
    {
      id: '5',
      time: 'أمس 01:00 م',
      message: 'تنبيه واتساب: مخزون سماعة بلوتوث وصل للحد الحرج (5 قطع)',
      type: 'whatsapp',
      icon: MessageCircle,
    },
  ]);

  const [settings, setSettings] = useState({
    managerWhatsApp: '+20 1234567890',
    managerEmail: 'manager@company.com',
    supplierEmail: 'supplier@supplies.com',
    enableWhatsApp: true,
    enableEmail: true,
    enableSMS: false,
  });

  const toggleWorkflow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((workflow) =>
        workflow.id === id ? { ...workflow, enabled: !workflow.enabled } : workflow
      )
    );
  };

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return (
          <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg">
            <MessageCircle size={20} className="text-white" />
          </div>
        );
      case 'email':
        return (
          <div className="w-10 h-10 bg-[#3B82F6] rounded-full flex items-center justify-center shadow-lg">
            <Mail size={20} className="text-white" />
          </div>
        );
      case 'alert':
        return (
          <div className="w-10 h-10 bg-[#F85554] rounded-full flex items-center justify-center shadow-lg">
            <AlertTriangle size={20} className="text-white" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            محرك الأتمتة والربط (n8n Engine)
          </h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
            </div>
            <span className="text-green-600 font-semibold">المحرك يعمل بنجاح</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-xs text-gray-500">إجمالي العمليات اليوم</div>
            <div className="text-2xl font-bold text-[#F85554]">147</div>
          </div>
          <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-xs text-gray-500">القواعد النشطة</div>
            <div className="text-2xl font-bold text-[#3B82F6]">
              {workflows.filter((w) => w.enabled).length}/{workflows.length}
            </div>
          </div>
        </div>
      </div>

      {/* Three-Column Grid Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Column 1: Workflows & Rules */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={20} className="text-[#F85554]" />
            <h2 className="text-xl font-bold text-gray-800">قواعد العمل</h2>
          </div>

          {workflows.map((workflow) => {
            const Icon = workflow.icon;
            return (
              <div
                key={workflow.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${workflow.color}15` }}
                  >
                    <Icon size={24} style={{ color: workflow.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-800 text-sm">{workflow.title}</h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={workflow.enabled}
                          onChange={() => toggleWorkflow(workflow.id)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B82F6]"></div>
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">
                      {workflow.description}
                    </p>
                    <div className="flex items-center gap-1">
                      {workflow.enabled ? (
                        <>
                          <CheckCircle size={14} className="text-green-500" />
                          <span className="text-xs text-green-600 font-semibold">مفعّل</span>
                        </>
                      ) : (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full bg-gray-300"></div>
                          <span className="text-xs text-gray-500 font-semibold">معطّل</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Column 2: Live Activity Stream */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-[#3B82F6]" />
            <h2 className="text-xl font-bold text-gray-800">سجل الأنشطة المباشر</h2>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute right-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#3B82F6] to-gray-200"></div>

              {/* Activity Items */}
              <div className="space-y-6">
                {activityLogs.map((log, index) => (
                  <div key={log.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div className="relative z-10">{getActivityIcon(log.type)}</div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <div className="text-xs text-gray-500 mb-1">{log.time}</div>
                      <div className="text-sm text-gray-800 leading-relaxed">{log.message}</div>
                      {index === 0 && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold">
                          <CheckCircle size={12} />
                          تم بنجاح
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Notification Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="text-[#F85554]" size={20} />
            <h2 className="text-xl font-bold text-gray-800">إعدادات التنبيهات</h2>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            {/* Contact Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  رقم واتساب المدير
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={settings.managerWhatsApp}
                    onChange={(e) => handleSettingChange('managerWhatsApp', e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    dir="ltr"
                  />
                  <MessageCircle
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#25D366]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  بريد المدير
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={settings.managerEmail}
                    onChange={(e) => handleSettingChange('managerEmail', e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    dir="ltr"
                  />
                  <Mail
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3B82F6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  بريد المورد الافتراضي
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={settings.supplierEmail}
                    onChange={(e) => handleSettingChange('supplierEmail', e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    dir="ltr"
                  />
                  <Mail
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Notification Channels */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">قنوات التنبيه</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.enableWhatsApp}
                    onChange={(e) => handleSettingChange('enableWhatsApp', e.target.checked)}
                    className="w-5 h-5 text-[#25D366] rounded focus:ring-2 focus:ring-[#25D366]"
                  />
                  <MessageCircle size={20} className="text-[#25D366]" />
                  <span className="text-sm font-semibold text-gray-800">WhatsApp</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.enableEmail}
                    onChange={(e) => handleSettingChange('enableEmail', e.target.checked)}
                    className="w-5 h-5 text-[#3B82F6] rounded focus:ring-2 focus:ring-[#3B82F6]"
                  />
                  <Mail size={20} className="text-[#3B82F6]" />
                  <span className="text-sm font-semibold text-gray-800">البريد الإلكتروني</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.enableSMS}
                    onChange={(e) => handleSettingChange('enableSMS', e.target.checked)}
                    className="w-5 h-5 text-[#F85554] rounded focus:ring-2 focus:ring-[#F85554]"
                  />
                  <MessageCircle size={20} className="text-[#F85554]" />
                  <span className="text-sm font-semibold text-gray-800">رسائل SMS</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <button className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/30">
              <Save size={20} />
              حفظ الإعدادات
            </button>

            {/* n8n Badge */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <span>مدعوم بواسطة</span>
                <span className="font-bold text-[#F85554]">n8n</span>
                <Zap size={16} className="text-[#F85554]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}