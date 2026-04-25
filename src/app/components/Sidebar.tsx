import { Home, Package, ShoppingCart, FileText, Brain, Zap, Users, Settings, Shield, CreditCard, UserCheck, FileCheck, LogOut, Receipt } from 'lucide-react';
import { Screen } from '../App';

interface SidebarProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  currentUser?: any;
  onLogout?: () => void;
}

const menuItems: { key: string; icon: typeof Home; label: string; screen: Screen }[] = [
  { key: 'dashboard', icon: Home, label: 'الرئيسية', screen: 'home' },
  { key: 'inventory', icon: Package, label: 'المخازن', screen: 'inventory' },
  { key: 'pos', icon: ShoppingCart, label: 'نقطة البيع', screen: 'pos' },
  { key: 'sales', icon: Receipt, label: 'سجل المبيعات', screen: 'sales' },
  { key: 'installments', icon: CreditCard, label: 'التقسيط', screen: 'installments' },
  { key: 'representatives', icon: UserCheck, label: 'المناديب', screen: 'representatives' },
  { key: 'quotations', icon: FileCheck, label: 'عروض الأسعار', screen: 'quotations' },
  { key: 'employees', icon: Users, label: 'الموظفين', screen: 'employees' },
  { key: 'ai', icon: Brain, label: 'الذكاء الاصطناعي', screen: 'ai' },
  { key: 'automation', icon: Zap, label: 'الأتمتة', screen: 'automation' },
  { key: 'user_management', icon: Shield, label: 'الصلاحيات', screen: 'users' },
  { key: 'settings', icon: Settings, label: 'الإعدادات', screen: 'settings' },
  { key: 'reports', icon: FileText, label: 'التقارير', screen: 'reports' },
];

export function Sidebar({ activeScreen, onScreenChange, currentUser, onLogout }: SidebarProps) {
  const canAccessScreen = (screen: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'مدير') return true;
    const screenPermissions: Record<string, string[]> = {
      'home'            : [],
      'pos'             : ['add_invoice'],
      'inventory'       : ['add_product', 'inventory_count'],
      'installments'    : ['add_invoice'],
      'representatives' : [],
      'quotations'      : ['add_invoice'],
      'employees'       : ['employee_report'],
      'ai'              : [],
      'automation'      : [],
      'users'           : ['user_management'],
      'settings'        : ['system_settings'],
      'reports'         : ['profit_report', 'daily_sales'],
      'sales'           : ['daily_sales'],
    };
    const required = screenPermissions[screen];
    if (!required || required.length === 0) return true;
    const userPerms = currentUser.permissions || {};
    const allUserPerms = Object.values(userPerms).flat() as string[];
    return required.some(p => allUserPerms.includes(p));
  };

  return (
    <div className="w-20 bg-[#1E293B] flex flex-col items-center py-6 gap-4 overflow-y-auto">
      <div className="text-white text-2xl font-bold mb-6">POS</div>
      {menuItems
        .filter(item => canAccessScreen(item.screen))
        .map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onScreenChange(item.screen)}
              className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                activeScreen === item.screen
                  ? 'text-white'
                  : 'text-gray-400 hover:bg-slate-700 hover:text-white'
              }`}
              style={{ backgroundColor: activeScreen === item.screen ? 'var(--primary-color)' : undefined }}
              title={item.label}
            >
              <Icon size={24} />
            </button>
          );
        })}
      {/* Logout Button */}
      {onLogout && (
        <button
          onClick={onLogout}
          className="w-14 h-14 rounded-xl flex items-center justify-center transition-all flex-shrink-0 mt-auto text-red-400 hover:bg-red-900/50 hover:text-red-300"
          title="تسجيل الخروج"
        >
          <LogOut size={24} />
        </button>
      )}
    </div>
  );
}