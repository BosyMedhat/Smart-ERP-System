import { useState, useEffect } from 'react';
import { Home, Package, ShoppingCart, FileText, Brain, Zap, Users, Settings, Shield, CreditCard, FileCheck, LogOut, Receipt, Briefcase, Truck, HandCoins, Wallet, TrendingUp, ClipboardList, UserRound, ChevronLeft, ChevronRight } from 'lucide-react';
import { Screen } from '../App';
import { useTranslation } from 'react-i18next';
import { hasScreenPermission } from '../../auth';
import AlertsBell from './AlertsBell';

interface SidebarProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  currentUser?: any;
  onLogout?: () => void;
}

// Cached settings from localStorage
interface CachedSettings {
  system_name?: string;
  store_logo?: string | null;
}

export function Sidebar({ activeScreen, onScreenChange, currentUser, onLogout }: SidebarProps) {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [cachedSettings, setCachedSettings] = useState<CachedSettings>({
    system_name: 'Smart ERP',
    store_logo: null,
  });

  // Load cached settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const stored = localStorage.getItem('storeSettings');
        if (stored) {
          const parsed = JSON.parse(stored);
          setCachedSettings({
            system_name: parsed.system_name || 'Smart ERP',
            store_logo: parsed.store_logo || null,
          });
        }
      } catch (e) {
        console.error('Error loading cached settings:', e);
      }
    };

    loadSettings();
    // Listen for storage changes to update in real-time
    window.addEventListener('storage', loadSettings);
    return () => window.removeEventListener('storage', loadSettings);
  }, []);

  const menuItems: { key: string; icon: typeof Home; label: string; screen: Screen }[] = [
    { key: 'dashboard', icon: Home, label: t('nav.home'), screen: 'home' },
    { key: 'inventory', icon: Package, label: t('nav.inventory'), screen: 'inventory' },
    { key: 'pos', icon: ShoppingCart, label: t('nav.pos'), screen: 'pos' },
    { key: 'sales', icon: Receipt, label: t('nav.sales'), screen: 'sales' },
    { key: 'installments', icon: CreditCard, label: t('nav.installments'), screen: 'installments' },
    { key: 'credit', icon: HandCoins, label: t('nav.credit'), screen: 'credit' },
    { key: 'suppliers', icon: Truck, label: t('nav.suppliers'), screen: 'suppliers' },
    { key: 'customers_pos', icon: UserRound, label: 'عملاء POS', screen: 'customers_pos' },
    { key: 'quotations', icon: FileCheck, label: 'عروض الأسعار', screen: 'quotations' },
    { key: 'hr', icon: Briefcase, label: t('nav.hr'), screen: 'hr' },
    { key: 'ai', icon: Brain, label: t('nav.ai'), screen: 'ai' },
    { key: 'automation', icon: Zap, label: 'الأتمتة', screen: 'automation' },
    { key: 'roles', icon: Shield, label: 'الأدوار والصلاحيات', screen: 'roles' },
    { key: 'settings', icon: Settings, label: t('nav.settings'), screen: 'settings' },
    { key: 'reports', icon: FileText, label: t('nav.reports'), screen: 'reports' },
    { key: 'pl', icon: TrendingUp, label: t('nav.pl') || 'الأرباح والخسائر', screen: 'pl' },
    { key: 'audit', icon: ClipboardList, label: t('nav.audit') || 'سجل التدقيق', screen: 'audit' },
    { key: 'treasury', icon: Wallet, label: t('nav.treasury'), screen: 'treasury' },
  ];

  return (
    <div
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-sidebar flex flex-col py-4 gap-1 overflow-y-auto overflow-x-hidden transition-all duration-300 flex-shrink-0 border-l border-sidebar-border`}
    >
      {/* Logo + Toggle Row */}
      <div className={`flex items-center mb-4 px-3 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {cachedSettings.store_logo ? (
              <img
                src={cachedSettings.store_logo}
                alt={cachedSettings.system_name}
                className="w-8 h-8 object-contain rounded"
              />
            ) : null}
            <span className="text-sidebar-foreground text-lg font-bold tracking-wide truncate">
              {cachedSettings.system_name || 'Smart ERP'}
            </span>
          </div>
        )}
        {isCollapsed && (
          <div className="flex flex-col items-center">
            {cachedSettings.store_logo ? (
              <img
                src={cachedSettings.store_logo}
                alt={cachedSettings.system_name}
                className="w-8 h-8 object-contain rounded mb-1"
              />
            ) : (
              <span className="text-sidebar-foreground text-xl font-bold">
                {cachedSettings.system_name?.charAt(0) || 'E'}
              </span>
            )}
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(prev => !prev)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all flex-shrink-0"
          title={isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex flex-col gap-1 px-2 flex-1">
        {menuItems
          .filter(item => hasScreenPermission(
            currentUser?.permission_list ?? [],
            item.screen,
            currentUser?.role_obj?.level
          ))
          .map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.screen;
            return (
              <button
                key={item.key}
                onClick={() => onScreenChange(item.screen)}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-xl transition-all flex-shrink-0 ${
                  isCollapsed
                    ? 'w-12 h-12 justify-center mx-auto'
                    : 'w-full h-11 px-3 justify-start'
                } ${
                  isActive
                    ? 'text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`}
                style={{ backgroundColor: isActive ? 'var(--primary-color)' : undefined }}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
              </button>
            );
          })}
      </div>

      {/* Alerts Bell */}
      <div className={`px-2 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <AlertsBell />
      </div>

      {/* Logout Button */}
      {onLogout && (
        <div className="px-2 pb-2">
          <button
            onClick={onLogout}
            title={isCollapsed ? t('nav.logout') : undefined}
            className={`flex items-center gap-3 rounded-xl transition-all flex-shrink-0 text-red-500 hover:bg-red-500/10 hover:text-red-400 ${
              isCollapsed
                ? 'w-12 h-12 justify-center mx-auto'
                : 'w-full h-11 px-3 justify-start'
            }`}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-medium truncate">{t('nav.logout')}</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}