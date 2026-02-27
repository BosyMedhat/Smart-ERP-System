import { Home, Package, ShoppingCart, FileText, Brain, Zap, Users, Settings, Shield, CreditCard, UserCheck, FileCheck } from 'lucide-react';
import { Screen } from '../App';

interface SidebarProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

const menuItems: { icon: typeof Home; label: string; screen: Screen }[] = [
  { icon: Home, label: 'الرئيسية', screen: 'home' },
  { icon: Package, label: 'المخازن', screen: 'inventory' },
  { icon: ShoppingCart, label: 'المبيعات', screen: 'pos' },
  { icon: CreditCard, label: 'التقسيط', screen: 'installments' },
  { icon: UserCheck, label: 'المناديب', screen: 'representatives' },
  { icon: FileCheck, label: 'عروض الأسعار', screen: 'quotations' },
  { icon: Users, label: 'الموظفين', screen: 'employees' },
  { icon: Brain, label: 'الذكاء الاصطناعي', screen: 'ai' },
  { icon: Zap, label: 'الأتمتة', screen: 'automation' },
  { icon: Shield, label: 'الصلاحيات', screen: 'users' },
  { icon: Settings, label: 'الإعدادات', screen: 'settings' },
  { icon: FileText, label: 'التقارير', screen: 'reports' },
];

export function Sidebar({ activeScreen, onScreenChange }: SidebarProps) {
  return (
    <div className="w-20 bg-[#1E293B] flex flex-col items-center py-6 gap-4 overflow-y-auto">
      <div className="text-white text-2xl font-bold mb-6">POS</div>
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            onClick={() => onScreenChange(item.screen)}
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${ 
              activeScreen === item.screen
                ? 'bg-[#3B82F6] text-white'
                : 'text-gray-400 hover:bg-slate-700 hover:text-white'
            }`}
            title={item.label}
          >
            <Icon size={24} />
          </button>
        );
      })}
    </div>
  );
}