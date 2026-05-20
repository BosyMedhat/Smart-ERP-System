import { Home, Package, ShoppingCart, FileText, Brain, Zap, Users, Settings, Shield, CreditCard, UserCheck, FileCheck, LogOut, Receipt, Briefcase, Truck, HandCoins, Wallet, TrendingUp, ClipboardList } from 'lucide-react';
import { Screen } from '../App';
import { useTranslation } from 'react-i18next';
import { canAccessScreen, ROLES } from '../../auth';

interface SidebarProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  currentUser?: any;
  onLogout?: () => void;
}

export function Sidebar({ activeScreen, onScreenChange, currentUser, onLogout }: SidebarProps) {
  const { t } = useTranslation();

  const menuItems: { key: string; icon: typeof Home; label: string; screen: Screen }[] = [
    { key: 'dashboard', icon: Home, label: t('nav.home'), screen: 'home' },
    { key: 'inventory', icon: Package, label: t('nav.inventory'), screen: 'inventory' },
    { key: 'pos', icon: ShoppingCart, label: t('nav.pos'), screen: 'pos' },
    { key: 'sales', icon: Receipt, label: t('nav.sales'), screen: 'sales' },
    { key: 'installments', icon: CreditCard, label: t('nav.installments'), screen: 'installments' },
    { key: 'credit', icon: HandCoins, label: t('nav.credit'), screen: 'credit' },
    { key: 'suppliers', icon: Truck, label: t('nav.suppliers'), screen: 'suppliers' },
    { key: 'representatives', icon: UserCheck, label: 'المناديب', screen: 'representatives' },
    { key: 'quotations', icon: FileCheck, label: 'عروض الأسعار', screen: 'quotations' },
    { key: 'hr', icon: Briefcase, label: t('nav.hr'), screen: 'hr' },
    { key: 'ai', icon: Brain, label: t('nav.ai'), screen: 'ai' },
    { key: 'automation', icon: Zap, label: 'الأتمتة', screen: 'automation' },
    { key: 'user_management', icon: Shield, label: t('nav.users'), screen: 'users' },
    { key: 'settings', icon: Settings, label: t('nav.settings'), screen: 'settings' },
    { key: 'reports', icon: FileText, label: t('nav.reports'), screen: 'reports' },
    { key: 'pl', icon: TrendingUp, label: t('nav.pl') || 'الأرباح والخسائر', screen: 'pl' },
    { key: 'audit', icon: ClipboardList, label: t('nav.audit') || 'سجل التدقيق', screen: 'audit' },
    { key: 'treasury', icon: Wallet, label: t('nav.treasury'), screen: 'treasury' },
  ];
  return (
    <div className="w-20 bg-[#1E293B] flex flex-col items-center py-6 gap-4 overflow-y-auto">
      <div className="text-white text-2xl font-bold mb-6">POS</div>
      {menuItems
        .filter(item => canAccessScreen(currentUser?.role ?? '', item.screen))
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
          title={t('nav.logout')}
        >
          <LogOut size={24} />
        </button>
      )}
    </div>
  );
}