import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, LogOut } from 'lucide-react';
import { Screen, NAV_GROUPS } from '../navigation';
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
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
    window.addEventListener('storage', loadSettings);
    return () => window.removeEventListener('storage', loadSettings);
  }, []);

  const perms = currentUser?.permission_list ?? [];
  const level = currentUser?.role_obj?.level;

  /** Groups with only the items the user may see; empty groups dropped. */
  const visibleGroups = useMemo(
    () =>
      NAV_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter((i) => hasScreenPermission(perms, i.screen, level)),
      })).filter((g) => g.items.length > 0),
    [perms, level]
  );

  const activeGroupKey = visibleGroups.find((g) =>
    g.items.some((i) => i.screen === activeScreen)
  )?.key;

  // Auto-open the group containing the active screen (never close others).
  useEffect(() => {
    if (activeGroupKey) {
      setOpenGroups((prev) => (prev[activeGroupKey] ? prev : { ...prev, [activeGroupKey]: true }));
    }
  }, [activeGroupKey]);

  const itemLabel = (item: { labelKey?: string; label?: string }) =>
    item.labelKey ? t(item.labelKey, item.label ?? '') : item.label ?? '';

  const renderItem = (item: (typeof NAV_GROUPS)[number]['items'][number]) => {
    const Icon = item.icon;
    const isActive = activeScreen === item.screen;
    const label = itemLabel(item);
    return (
      <button
        key={item.key}
        onClick={() => onScreenChange(item.screen)}
        title={isCollapsed ? label : undefined}
        aria-current={isActive ? 'page' : undefined}
        className={`flex items-center gap-3 rounded-xl transition-all flex-shrink-0 ${
          isCollapsed
            ? 'w-12 h-12 justify-center mx-auto'
            : 'w-full h-10 px-3 justify-start'
        } ${
          isActive
            ? 'text-sidebar-primary-foreground shadow-sm'
            : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
        }`}
        style={{ backgroundColor: isActive ? 'var(--primary-color)' : undefined }}
      >
        <Icon size={20} className="flex-shrink-0" />
        {!isCollapsed && <span className="text-sm font-medium truncate">{label}</span>}
      </button>
    );
  };

  return (
    <div
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-sidebar flex flex-col py-4 gap-1 overflow-y-auto overflow-x-hidden transition-all duration-300 flex-shrink-0 border-l border-sidebar-border`}
    >
      {/* Logo + Toggle Row */}
      <div className={`flex items-center mb-3 px-3 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
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
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all flex-shrink-0"
          title={isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation — grouped modules */}
      <nav className="flex flex-col gap-1 px-2 flex-1" aria-label={t('nav.mainMenu', 'القائمة الرئيسية')}>
        {visibleGroups.map((group) => {
          const single = group.items.length === 1;
          const open = isCollapsed || single || openGroups[group.key] === true || group.key === activeGroupKey;

          // Collapsed icon rail: flat items only (no group headers).
          if (isCollapsed) {
            return (
              <div key={group.key} className="contents">
                {group.items.map(renderItem)}
              </div>
            );
          }

          // Single-item groups render as plain top-level items (no header).
          if (single) {
            return (
              <div key={group.key} className="contents">
                {group.items.map(renderItem)}
              </div>
            );
          }

          return (
            <div key={group.key} className="mb-1">
              <button
                onClick={() =>
                  setOpenGroups((prev) => ({ ...prev, [group.key]: !open }))
                }
                className="w-full flex items-center justify-between px-3 h-8 text-xs font-semibold tracking-wide text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
                aria-expanded={open}
              >
                <span className="truncate">{t(group.labelKey)}</span>
                <ChevronDown
                  size={14}
                  className={`flex-shrink-0 transition-transform duration-200 ${open ? '' : 'ltr:-rotate-90 rtl:rotate-90'}`}
                />
              </button>
              <div
                className={`flex flex-col gap-0.5 overflow-hidden transition-all duration-200 ${
                  open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                {group.items.map(renderItem)}
              </div>
            </div>
          );
        })}
      </nav>

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
