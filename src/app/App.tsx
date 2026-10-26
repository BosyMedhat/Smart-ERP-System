import { useState, useEffect, useRef, useCallback, lazy, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import type { FloatingAIAssistantHandle } from './components/FloatingAIAssistant';
import { useAIDemoMode } from './hooks/useAIDemoMode';
import { notify } from '../lib/notifications';
import { ThemeProvider } from './providers/ThemeProvider';
import { ProductGrid } from './components/ProductGrid';
import { Cart } from './components/Cart';
import { LoginScreen } from './components/LoginScreen';
import { SignUpScreen } from './components/SignUpScreen';
import { AppLayout } from './components/AppLayout';
import { AccessDenied } from './pages/AccessDenied';
import { NotFound } from './pages/NotFound';
import apiClient from '../api/axiosConfig';
import { cachedGet, invalidate as invalidateApiCache } from './utils/apiCache';
import { applyCurrencyData } from './utils/currency';
import { usePolling } from './hooks/usePolling';

// Route-level code splitting — heavy screens load on demand.
// POS components (ProductGrid/Cart) stay eager: the cashier hot path.
const InventoryScreen = lazy(() => import('./components/InventoryScreen').then(m => ({ default: m.InventoryScreen })));
const AICenter = lazy(() => import('./components/AICenter').then(m => ({ default: m.AICenter })));
const AutomationEngine = lazy(() => import('./components/AutomationEngine').then(m => ({ default: m.AutomationEngine })));
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
const POSCustomers = lazy(() => import('./components/POSCustomers'));
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const InstallmentsManagement = lazy(() => import('./components/InstallmentsManagement').then(m => ({ default: m.InstallmentsManagement })));
const SalesHistory = lazy(() => import('./components/SalesHistory').then(m => ({ default: m.SalesHistory })));
const Reports = lazy(() => import('./components/Reports'));
const PLReport = lazy(() => import('./components/PLReport'));
const AuditLog = lazy(() => import('./components/AuditLog'));
const TreasuryDashboard = lazy(() => import('./components/treasury/TreasuryDashboard'));
const EmployeeProfile = lazy(() => import('./components/EmployeeProfile').then(m => ({ default: m.EmployeeProfile })));
const RBACManagement = lazy(() => import('./components/RBACManagement'));
const SuppliersScreen = lazy(() => import('./components/SuppliersScreen').then(m => ({ default: m.SuppliersScreen })));
const HRModule = lazy(() => import('./components/HRModule').then(m => ({ default: m.HRModule })));
const CreditDashboard = lazy(() => import('./components/CreditDashboard').then(m => ({ default: m.CreditDashboard })));
import { useTranslation } from 'react-i18next';
import '../i18n/index';
import { getStoredUser, storeUser, clearUser } from '../auth';
import { hasScreenPermission } from '../auth/systemPermissions';
import type { AuthUser } from '../auth/useAuth';
import { AdminLoginScreen } from './components/AdminLoginScreen';
import {
  Screen, SCREEN_PATHS, SCREEN_PRIORITY,
} from './navigation';

export type { Screen };

// Product interface matching backend API
export interface Product {
  id: string;
  name: string;
  price: number;
  retail_price?: number;
  category?: string;
  image?: string;
  current_stock?: number;
  min_stock_level?: number;
  sku?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

function getDefaultScreenForUser(user: AuthUser): Screen {
  const perms = user.permission_list ?? [];
  const level = user.role_obj?.level;
  for (const screen of SCREEN_PRIORITY) {
    if (hasScreenPermission(perms, screen, level)) return screen;
  }
  return 'profile';
}

/* ─────────────────────────── POS screen ─────────────────────────── */

interface PosPageProps {
  products: Product[];
  productsLoading: boolean;
  fetchProducts: () => void;
  cartItems: CartItem[];
  addToCart: (p: Product) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  selectedCustomer: string;
  setSelectedCustomer: (c: string) => void;
  discount: number;
  setDiscount: (d: number) => void;
  discountType: 'percentage' | 'fixed';
  setDiscountType: (t: 'percentage' | 'fixed') => void;
}

function PosPage(p: PosPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredProducts = p.products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'الكل' || product.category === selectedCategory || !product.category;
    const matchesSearch =
      searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.id.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });
  const categories = ['الكل', ...Array.from(new Set(p.products.map((x) => x.category).filter((c): c is string => !!c)))];

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-y-auto lg:overflow-hidden">
      <div data-demo-id="pos-product-grid" className="lg:flex-[60] flex flex-col gap-4">
        <ProductGrid
          products={filteredProducts}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddToCart={p.addToCart}
          onRefresh={p.fetchProducts}
          isLoading={p.productsLoading}
        />
      </div>
      <div data-demo-id="pos-cart" className="lg:flex-[40] min-h-[480px] lg:min-h-0 lg:h-full">
        <Cart
          cartItems={p.cartItems}
          selectedCustomer={p.selectedCustomer}
          onCustomerChange={p.setSelectedCustomer}
          discount={p.discount}
          onDiscountChange={p.setDiscount}
          discountType={p.discountType}
          onDiscountTypeChange={p.setDiscountType}
          onUpdateQuantity={p.updateQuantity}
          onClearCart={p.clearCart}
          onAddToCart={p.addToCart}
          onSaleComplete={p.fetchProducts}
        />
      </div>
    </div>
  );
}

/* ─────────────────────── Portal chooser (unauth /) ─────────────────────── */

function PortalChooser() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="text-center max-w-lg w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Smart ERP</h1>
        <p className="text-gray-500 mb-10">اختر بوابة الدخول المناسبة</p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button
            onClick={() => navigate('/login')}
            className="flex-1 bg-white rounded-2xl p-8 border border-emerald-100 shadow-lg hover:shadow-xl hover:border-emerald-300 transition-all text-center group"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-2xl mb-4 group-hover:bg-emerald-100 transition-colors">
              <Users className="w-8 h-8 text-emerald-700" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">بوابة الموظفين</h2>
            <p className="text-sm text-gray-500">الكاشير والمحاسب والمخزن</p>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Root component ─────────────────────────── */

function AppRoot() {
  const [currentUser, setCurrentUser] = useState(getStoredUser);
  const isLoggedIn = currentUser !== null;
  const navigate = useNavigate();
  const fabRef = useRef<FloatingAIAssistantHandle>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const { i18n } = useTranslation();

  const navigateToScreen = useCallback(
    (screen: Screen) => navigate(SCREEN_PATHS[screen] ?? '/'),
    [navigate]
  );

  // Products state - fetched from API
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Single settings fetch on login — applies theme, wizard check, and
  // currency from the same payload (previously 3 separate GETs).
  useEffect(() => {
    const savedColor = localStorage.getItem('primaryColor');
    if (savedColor) {
      document.documentElement.style.setProperty('--primary-color', savedColor);
    }
    if (!isLoggedIn) return;
    const loadSettings = async () => {
      try {
        const data = await cachedGet('/settings/1/', 60_000);
        if (data.primary_color) {
          document.documentElement.style.setProperty('--primary-color', data.primary_color);
          localStorage.setItem('primaryColor', data.primary_color);
        }
        if (data.system_name) {
          document.title = data.system_name;
          localStorage.setItem('systemName', data.system_name);
        }
        localStorage.setItem('storeSettings', JSON.stringify(data));
        if (data.currency) {
          applyCurrencyData(data);
        }
        if (!data.is_configured) {
          setShowSetupWizard(true);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setSettingsLoaded(true);
      }
    };
    loadSettings();
  }, [isLoggedIn]);

  // Initialize language direction on mount
  useEffect(() => {
    const lang = localStorage.getItem('lang') || 'ar';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [i18n]);

  const fetchProducts = async () => {
    if (!isLoggedIn) return;
    setProductsLoading(true);
    try {
      const response = await apiClient.get('/products/');
      const mappedProducts = response.data.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        price: parseFloat(p.retail_price || p.price || 0),
        retail_price: parseFloat(p.retail_price || 0),
        category: p.category || 'عام',
        image: p.image || undefined,
        current_stock: parseFloat(p.current_stock || 0),
        min_stock_level: parseFloat(p.min_stock_level || 5),
        sku: p.sku,
      }));
      setProducts(mappedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // Products are only consumed by the POS screen — fetch on login for a
  // warm start, refresh when entering /pos if stale, and poll ONLY while
  // the POS route is mounted (previously polled every 60s for the whole
  // session on every screen).
  const location = useLocation();
  const isOnPos = location.pathname === SCREEN_PATHS.pos;
  const lastProductsFetch = useRef(0);

  const fetchProductsTracked = useCallback(async () => {
    lastProductsFetch.current = Date.now();
    await fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) fetchProductsTracked();
  }, [isLoggedIn, fetchProductsTracked]);

  useEffect(() => {
    if (isOnPos && Date.now() - lastProductsFetch.current > 60_000) {
      fetchProductsTracked();
    }
  }, [isOnPos, fetchProductsTracked]);

  usePolling(fetchProductsTracked, 60_000, isLoggedIn && isOnPos);

  const handleLogout = () => {
    clearUser();
    invalidateApiCache();
    setCurrentUser(null);
    navigate('/', { replace: true });
  };

  // Session polling every 5 minutes (skipped while tab is hidden)
  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  });
  const pollSession = useCallback(async () => {
    const user = currentUserRef.current;
    try {
      const response = await apiClient.get('/accounts/me/');
      if (response.status === 200 && user) {
        const data = response.data;
        if (data.permissions) {
          const updated = {
            ...user,
            permission_list: data.permissions,
            role_obj: data.role ?? user.role_obj,
          };
          if (JSON.stringify(user.permission_list) !== JSON.stringify(data.permissions)) {
            storeUser(updated);
            setCurrentUser(updated);
          }
        }
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        handleLogout();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  usePolling(pollSession, 5 * 60 * 1000, isLoggedIn);

  const handleDemoAssistantMessage = useCallback((content: string) => {
    fabRef.current?.addDemoMessage(content);
  }, []);
  const handleDemoActionMessage = useCallback((content: string) => {
    fabRef.current?.addDemoActionMessage(content);
  }, []);
  const handleDemoOpenPanel = useCallback(() => {
    fabRef.current?.openPanel();
  }, []);

  const { demoState, start: startDemo, pause: pauseDemo, resume: resumeDemo, stop: stopDemo } = useAIDemoMode({
    onNavigate: navigateToScreen,
    onAssistantMessage: handleDemoAssistantMessage,
    onActionMessage: handleDemoActionMessage,
    onOpenPanel: handleDemoOpenPanel,
  });

  /** Screen-gate helper — identical semantics to the old per-screen hasPermission() checks. */
  const gate = (screen: Screen, el: ReactNode): ReactNode =>
    hasScreenPermission(
      currentUser?.permission_list ?? [],
      screen,
      currentUser?.role_obj?.level
    )
      ? el
      : <AccessDenied />;

  const addToCart = (product: Product) => {
    const stock = Number(product.current_stock || 0);
    if (stock <= 0) {
      notify.error(`المنتج "${product.name}" غير متوفر في المخزون`);
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= stock) {
          notify.warning(
            `لا يمكن إضافة المزيد — الكمية المتاحة من "${product.name}" هي ${stock} فقط`
          );
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id && delta > 0) {
            const stock = Number(item.current_stock || 0);
            if (item.quantity >= stock) {
              notify.warning(`الكمية المتاحة من "${item.name}" هي ${stock} فقط`);
              return item;
            }
          }
          return item.id === id ? { ...item, quantity: item.quantity + delta } : item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setSelectedCustomer('');
    setDiscount(0);
    setDiscountType('percentage');
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    navigate(SCREEN_PATHS[getDefaultScreenForUser(user)], { replace: true });
  };

  /* ───── Unauthenticated branch ───── */
  if (!currentUser) {
    return (
      <>
        <Routes>
          <Route path="/login" element={<LoginScreen onLogin={handleLoginSuccess} onGoToSignUp={() => navigate('/signup')} onBack={() => navigate('/')} />} />
          <Route path="/signup" element={<SignUpScreen onBackToLogin={() => navigate('/login')} />} />
          <Route path="/adminGamal" element={
            <AdminLoginScreen
              onLogin={handleLoginSuccess}
              onGoToEmployeeLogin={() => navigate('/login')}
            />
          } />
          <Route path="*" element={<PortalChooser />} />
        </Routes>
        <Toaster position="top-center" richColors closeButton />
      </>
    );
  }

  /* ───── Authenticated branch ───── */
  const layoutProps = {
    currentUser,
    onLogout: handleLogout,
    fabRef,
    demoState,
    onStartDemo: startDemo,
    onPauseDemo: pauseDemo,
    onResumeDemo: resumeDemo,
    onStopDemo: stopDemo,
  };

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/adminGamal" element={<Navigate to="/" replace />} />
      <Route element={<AppLayout {...layoutProps} />}>
        <Route index element={<Navigate to={SCREEN_PATHS[getDefaultScreenForUser(currentUser)]} replace />} />
        <Route path={SCREEN_PATHS.pos} element={gate('pos',
          <PosPage
            products={products} productsLoading={productsLoading} fetchProducts={fetchProductsTracked}
            cartItems={cartItems} addToCart={addToCart} updateQuantity={updateQuantity}
            clearCart={clearCart} selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer}
            discount={discount} setDiscount={setDiscount} discountType={discountType} setDiscountType={setDiscountType}
          />)} />
        <Route path={SCREEN_PATHS.home} element={gate('home', <Dashboard onStartDemo={startDemo} />)} />
        <Route path={SCREEN_PATHS.inventory} element={gate('inventory', <InventoryScreen />)} />
        <Route path={SCREEN_PATHS.sales} element={gate('sales', <SalesHistory />)} />
        <Route path={SCREEN_PATHS.installments} element={gate('installments', <InstallmentsManagement />)} />
        <Route path={SCREEN_PATHS.credit} element={gate('credit', <CreditDashboard />)} />
        <Route path={SCREEN_PATHS.suppliers} element={gate('suppliers', <SuppliersScreen />)} />
        <Route path={SCREEN_PATHS.customers_pos} element={gate('customers_pos', <POSCustomers />)} />
        <Route path={SCREEN_PATHS.hr} element={gate('hr', <HRModule />)} />
        <Route path={SCREEN_PATHS.ai} element={gate('ai', <AICenter />)} />
        <Route path={SCREEN_PATHS.automation} element={gate('automation', <AutomationEngine />)} />
        <Route path={SCREEN_PATHS.roles} element={gate('roles', <div className="flex-1 p-4 overflow-auto"><RBACManagement /></div>)} />
        <Route path={SCREEN_PATHS.settings} element={gate('settings', <Settings />)} />
        <Route path={SCREEN_PATHS.reports} element={gate('reports', <Reports />)} />
        <Route path={SCREEN_PATHS.pl} element={gate('pl', <PLReport />)} />
        <Route path={SCREEN_PATHS.treasury} element={gate('treasury', <TreasuryDashboard />)} />
        <Route path={SCREEN_PATHS.audit} element={gate('audit', <AuditLog />)} />
        <Route path={SCREEN_PATHS.quotations} element={gate('quotations',
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4">🚧</div>
              <div className="text-xl">قريباً</div>
            </div>
          </div>)} />
        <Route path={SCREEN_PATHS.profile} element={gate('profile', <EmployeeProfile onLogout={handleLogout} />)} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoot />
      </BrowserRouter>
    </ThemeProvider>
  );
}
