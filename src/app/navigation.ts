import {
  Home, Package, ShoppingCart, FileText, Brain, Zap, Users, Settings,
  Shield, CreditCard, FileCheck, Receipt, Briefcase, Truck, HandCoins,
  Wallet, TrendingUp, ClipboardList, UserRound,
} from 'lucide-react';

/**
 * Central navigation registry (ERP-PORTAL-UX-ARCHITECTURE-002A).
 * Screen keys are preserved from the legacy state-based navigation so
 * existing components (Sidebar, FloatingAIAssistant, AI demo mode) keep
 * working — only the transport changes (URL instead of local state).
 */

export type Screen =
  | 'pos' | 'inventory' | 'home' | 'reports' | 'pl' | 'ai' | 'automation'
  | 'hr' | 'settings' | 'roles' | 'suppliers' | 'installments' | 'quotations'
  | 'sales' | 'profile' | 'credit' | 'treasury' | 'audit' | 'customers_pos';

/** screen → URL path (stable public contract) */
export const SCREEN_PATHS: Record<Screen, string> = {
  home: '/dashboard',
  pos: '/pos',
  inventory: '/inventory',
  sales: '/sales',
  installments: '/installments',
  credit: '/credit',
  suppliers: '/suppliers',
  customers_pos: '/customers',
  quotations: '/quotations',
  hr: '/hr',
  ai: '/ai',
  automation: '/automation',
  roles: '/roles',
  settings: '/settings',
  reports: '/reports',
  pl: '/pl',
  audit: '/audit',
  treasury: '/treasury',
  profile: '/profile',
};

export const PATH_TO_SCREEN: Record<string, Screen> = Object.fromEntries(
  (Object.entries(SCREEN_PATHS) as [Screen, string][]).map(([s, p]) => [p, s])
) as Record<string, Screen>;

export function screenFromPath(pathname: string): Screen | null {
  // exact match first, then longest-prefix so /sales/123 → 'sales'
  if (PATH_TO_SCREEN[pathname]) return PATH_TO_SCREEN[pathname];
  const match = (Object.keys(SCREEN_PATHS) as Screen[])
    .filter((s) => pathname === SCREEN_PATHS[s] || pathname.startsWith(SCREEN_PATHS[s] + '/'))
    .sort((a, b) => SCREEN_PATHS[b].length - SCREEN_PATHS[a].length)[0];
  return match ?? null;
}

/** Ordered fallback used after login / on `/` when no deep link is given. */
export const SCREEN_PRIORITY: Screen[] = [
  'pos', 'home', 'inventory', 'sales', 'treasury', 'reports',
  'pl', 'hr', 'credit', 'installments', 'suppliers',
  'customers_pos', 'ai', 'automation',
  'roles', 'settings', 'audit', 'quotations', 'profile',
];

export interface NavItem {
  key: string;
  screen: Screen;
  icon: typeof Home;
  /** i18n key under nav.* OR literal Arabic label */
  labelKey?: string;
  label?: string;
}

export interface NavGroup {
  key: string;
  labelKey: string;
  items: NavItem[];
}

/**
 * ERP module grouping for the sidebar (Task 2). Order = display order.
 * Visibility is still filtered per-item by hasScreenPermission; empty
 * groups render nothing.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'overview',
    labelKey: 'nav.groups.overview',
    items: [{ key: 'dashboard', screen: 'home', icon: Home, labelKey: 'nav.home' }],
  },
  {
    key: 'sales',
    labelKey: 'nav.groups.sales',
    items: [
      { key: 'pos', screen: 'pos', icon: ShoppingCart, labelKey: 'nav.pos' },
      { key: 'sales', screen: 'sales', icon: Receipt, labelKey: 'nav.sales' },
      { key: 'installments', screen: 'installments', icon: CreditCard, labelKey: 'nav.installments' },
      { key: 'credit', screen: 'credit', icon: HandCoins, labelKey: 'nav.credit' },
      { key: 'quotations', screen: 'quotations', icon: FileCheck, labelKey: 'nav.quotations' },
    ],
  },
  {
    key: 'inventory',
    labelKey: 'nav.groups.inventory',
    items: [{ key: 'inventory', screen: 'inventory', icon: Package, labelKey: 'nav.inventory' }],
  },
  {
    key: 'purchasing',
    labelKey: 'nav.groups.purchasing',
    items: [{ key: 'suppliers', screen: 'suppliers', icon: Truck, labelKey: 'nav.suppliers' }],
  },
  {
    key: 'customers',
    labelKey: 'nav.groups.customers',
    items: [{ key: 'customers_pos', screen: 'customers_pos', icon: UserRound, labelKey: 'nav.posCustomers' }],
  },
  {
    key: 'finance',
    labelKey: 'nav.groups.finance',
    items: [{ key: 'treasury', screen: 'treasury', icon: Wallet, labelKey: 'nav.treasury' }],
  },
  {
    key: 'hr',
    labelKey: 'nav.groups.hr',
    items: [{ key: 'hr', screen: 'hr', icon: Briefcase, labelKey: 'nav.hr' }],
  },
  {
    key: 'reports',
    labelKey: 'nav.groups.reports',
    items: [
      { key: 'reports', screen: 'reports', icon: FileText, labelKey: 'nav.reports' },
      { key: 'pl', screen: 'pl', icon: TrendingUp, labelKey: 'nav.pl' },
    ],
  },
  {
    key: 'ai',
    labelKey: 'nav.groups.ai',
    items: [
      { key: 'ai', screen: 'ai', icon: Brain, labelKey: 'nav.ai' },
      { key: 'automation', screen: 'automation', icon: Zap, labelKey: 'nav.automation' },
    ],
  },
  {
    key: 'admin',
    labelKey: 'nav.groups.admin',
    items: [
      { key: 'roles', screen: 'roles', icon: Shield, labelKey: 'nav.roles' },
      { key: 'settings', screen: 'settings', icon: Settings, labelKey: 'nav.settings' },
      { key: 'audit', screen: 'audit', icon: ClipboardList, labelKey: 'nav.audit' },
      { key: 'profile', screen: 'profile', icon: Users, labelKey: 'nav.profile' },
    ],
  },
];
