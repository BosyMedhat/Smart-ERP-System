import { useState, useEffect, Fragment } from 'react';
import { Users } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import FloatingAIAssistant from './components/FloatingAIAssistant';
import { notify } from '../lib/notifications';
import { Sidebar } from './components/Sidebar';
import { ProductGrid } from './components/ProductGrid';
import { Cart } from './components/Cart';
import { InventoryScreen } from './components/InventoryScreen';
import { AICenter } from './components/AICenter';
import { AutomationEngine } from './components/AutomationEngine';
import { Settings } from './components/Settings';
import POSCustomers from './components/POSCustomers';
import { LoginScreen } from './components/LoginScreen';
import { SignUpScreen } from './components/SignUpScreen';
import { Dashboard } from './components/Dashboard';
import { InstallmentsManagement } from './components/InstallmentsManagement';
import { SalesRepresentatives } from './components/SalesRepresentatives';
import { SalesHistory } from './components/SalesHistory';
import { Reports } from './components/Reports';
import PLReport from './components/PLReport';
import AuditLog from './components/AuditLog';
import TreasuryDashboard from './components/treasury/TreasuryDashboard';
import { EmployeeProfile } from './components/EmployeeProfile';
import RBACManagement from './components/RBACManagement';
import { SuppliersScreen } from './components/SuppliersScreen';
import { HRModule } from './components/HRModule';
import { CreditDashboard } from './components/CreditDashboard';
import apiClient from '../api/axiosConfig';
import { useTranslation } from 'react-i18next';
import '../i18n/index';
import { useAuth, getStoredUser, storeUser, clearUser } from '../auth';
import { AdminLoginScreen } from './components/AdminLoginScreen';


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

export type Screen = 'pos' | 'inventory' | 'home' | 'reports' | 'pl' | 'ai' | 'automation' | 'hr' | 'settings' | 'roles' | 'suppliers' | 'installments' | 'representatives' | 'quotations' | 'sales' | 'profile' | 'credit' | 'treasury' | 'audit' | 'customers_pos';

export default function App() {
  const [currentUser, setCurrentUser] = useState(getStoredUser);
  const isLoggedIn = currentUser !== null;
  const [activeScreen, setActiveScreen] = useState<Screen>('pos');
  type LoginPortal = 'admin' | 'employee' | null;
  const [loginPortal, setLoginPortal] = useState<LoginPortal>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const { i18n } = useTranslation();

  // Secret admin route detection
  useEffect(() => {
    const checkSecretPath = () => {
      if (window.location.pathname === '/adminGamal') {
        setLoginPortal('admin');
      }
    };
    checkSecretPath();
    window.addEventListener('popstate', checkSecretPath);
    return () => window.removeEventListener('popstate', checkSecretPath);
  }, []);

  // Products state - fetched from API
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Initialize theme color from localStorage or API
  useEffect(() => {
    const savedColor = localStorage.getItem('primaryColor');
    if (savedColor) {
      document.documentElement.style.setProperty('--primary-color', savedColor);
    }
    // Or fetch from API
    const fetchTheme = async () => {
      try {
        const response = await apiClient.get('/settings/1/');
        if (response.data.primary_color) {
          document.documentElement.style.setProperty('--primary-color', response.data.primary_color);
          localStorage.setItem('primaryColor', response.data.primary_color);
        }
      } catch (err) {
        console.error('Error fetching theme:', err);
      }
    };
    if (isLoggedIn) {
      fetchTheme();
    }
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

  // Fetch products from API - standalone function for reuse
  const fetchProducts = async () => {
    if (!isLoggedIn) return;
    setProductsLoading(true);
    try {
      const response = await apiClient.get('/products/');
      // Map backend data to frontend Product interface
      const mappedProducts = response.data.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        price: parseFloat(p.retail_price || p.price || 0),
        retail_price: parseFloat(p.retail_price || 0),
        category: p.category || 'عام',
        image: p.image || `https://placehold.co/400x400/3B82F6/FFFFFF?text=${encodeURIComponent(p.name.substring(0, 10))}`,
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

  // Fetch products on login + auto-refresh every 60 seconds
  useEffect(() => {
    if (!isLoggedIn) return;

    fetchProducts();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchProducts, 60000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Check if setup wizard should be shown
  useEffect(() => {
    if (isLoggedIn) {
      const checkSettings = async () => {
        try {
          const response = await apiClient.get('/settings/1/');
          if (!response.data.is_configured) {
            setShowSetupWizard(true);
          }
        } catch (err) {
          console.error('Error checking settings:', err);
        } finally {
          setSettingsLoaded(true);
        }
      };
      checkSettings();
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    clearUser();
    setCurrentUser(null);
    setLoginPortal(null);
  };

  // Session polling every 5 minutes
  useEffect(() => {
    if (!isLoggedIn) return;

    const pollSession = async () => {
      try {
        const response = await apiClient.get('/accounts/me/');
        if (response.status === 200) {
          const data = response.data;
          if (data.permissions && currentUser) {
            const updated = {
              ...currentUser,
              permission_list: data.permissions,
              role_obj: data.role ?? currentUser.role_obj,
            };
            const current = JSON.stringify(currentUser.permission_list);
            const incoming = JSON.stringify(data.permissions);
            if (current !== incoming) {
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
    };

    const interval = setInterval(pollSession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isLoggedIn, currentUser]);

  const { hasPermission } = useAuth(currentUser);

  const UnauthorizedScreen = () => (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="text-6xl">🚫</div>
      <h2 className="text-2xl font-bold text-gray-700">
        غير مصرح بالوصول
      </h2>
      <p className="text-gray-500">
        ليس لديك صلاحية لعرض هذه الصفحة
      </p>
    </div>
  );

  if (!currentUser) {
    if (!loginPortal) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
          <div className="text-center max-w-lg w-full">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Smart ERP</h1>
            <p className="text-gray-500 mb-10">اختر بوابة الدخول المناسبة</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              {/* Employee Card */}
              <button
                onClick={() => setLoginPortal('employee')}
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

    if (loginPortal === 'admin') {
      return (
        <AdminLoginScreen
          onLogin={(user) => {
            setCurrentUser(user);
            setLoginPortal(null);
            window.history.pushState({}, '', '/');
          }}
          onGoToEmployeeLogin={() => setLoginPortal('employee')}
        />
      );
    }

    if (authScreen === 'login') {
      return (
        <LoginScreen
          onLogin={(user: any) => {
            setCurrentUser(user);
            setLoginPortal(null);
          }}
          onGoToSignUp={() => setAuthScreen('signup')}
          onBack={() => setLoginPortal(null)}
        />
      );
    }

    if (authScreen === 'signup') {
      return (
        <SignUpScreen
          onBackToLogin={() => setAuthScreen('login')}
        />
      );
    }
  }

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
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
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
              notify.warning(
                `الكمية المتاحة من "${item.name}" هي ${stock} فقط`
              );
              return item;
            }
          }
          return item.id === id
            ? { ...item, quantity: item.quantity + delta }
            : item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setSelectedCustomer('');
    setDiscount(0);
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'الكل' || product.category === selectedCategory || !product.category;
    const matchesSearch =
      searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.id.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const categories = ['الكل', ...Array.from(new Set(products.map((p: Product) => p.category).filter((c): c is string => !!c)))];

  return (
    <>
      <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="h-screen flex bg-gray-50" style={{ fontFamily: 'Cairo, sans-serif' }}>
        {/* Right Sidebar */}
        <Sidebar activeScreen={activeScreen} onScreenChange={setActiveScreen} currentUser={currentUser} onLogout={handleLogout} />

        {/* Main Content */}
        {activeScreen === 'pos' && (
          <div className="flex-1 flex gap-4 p-4">
            {hasPermission('pos') ? (
              <>
                {/* Right Side - Products (60%) */}
                <div className="flex-[60] flex flex-col gap-4">
                  <ProductGrid
                    products={filteredProducts}
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onAddToCart={addToCart}
                    onRefresh={fetchProducts}
                    isLoading={productsLoading}
                  />
                </div>

                {/* Left Side - Cart (40%) */}
                <div className="flex-[40] min-h-0 h-full">
                  <Cart
                    cartItems={cartItems}
                    selectedCustomer={selectedCustomer}
                    onCustomerChange={setSelectedCustomer}
                    discount={discount}
                    onDiscountChange={setDiscount}
                    onUpdateQuantity={updateQuantity}
                    onClearCart={clearCart}
                    onAddToCart={addToCart}
                  />
                </div>
              </>
            ) : (
              <UnauthorizedScreen />
            )}
          </div>
        )}

        {activeScreen === 'inventory' && (
          <div className="flex-1">
            {hasPermission('inventory') ? <InventoryScreen /> : <UnauthorizedScreen />}
          </div>
        )}

        {activeScreen === 'ai' && (
          <div className="flex-1">
            {hasPermission('ai') ? <AICenter /> : <UnauthorizedScreen />}
          </div>
        )}

        {activeScreen === 'automation' && (
          <div className="flex-1">
            {hasPermission('automation') ? <AutomationEngine /> : <UnauthorizedScreen />}
          </div>
        )}

        {activeScreen === 'hr' && (
          <div className="flex-1">
            {hasPermission('hr') ? <HRModule /> : <UnauthorizedScreen />}
          </div>
        )}

        {activeScreen === 'settings' && (
          <div className="flex-1">
            {hasPermission('settings') ? <Settings /> : <UnauthorizedScreen />}
          </div>
        )}

        {activeScreen === 'customers_pos' && (
          <div className="flex-1">
            {hasPermission('customers') ? <POSCustomers /> : <UnauthorizedScreen />}
          </div>
        )}

        {activeScreen === 'roles' && (
          <div className="flex-1 p-4 overflow-auto">
            {hasPermission('roles') ? <RBACManagement /> : <UnauthorizedScreen />}
          </div>
        )}

        {activeScreen === 'home' && (
          <div className="flex-1">
            {hasPermission('home') ? <Dashboard /> : <UnauthorizedScreen />}
          </div>
        )}

        {activeScreen === 'suppliers' && (
          <div className="flex-1">
            {hasPermission('suppliers') ? <SuppliersScreen /> : <UnauthorizedScreen />}
          </div>
        )}

        {activeScreen === 'credit' && (
          <div className="flex-1">
            {hasPermission('credit') ? <CreditDashboard /> : <UnauthorizedScreen />}
          </div>
        )}

        {activeScreen === 'installments' && (
          <div className="flex-1">
            {hasPermission('installments') ? <InstallmentsManagement /> : <UnauthorizedScreen />}
          </div>
        )}

        {activeScreen === 'representatives' && (
          <div className="flex-1">
            {hasPermission('representatives') ? <SalesRepresentatives /> : <UnauthorizedScreen />}
          </div>
        )}

        {activeScreen === 'reports' && (
          <div className="flex-1">
            {hasPermission('reports') ? <Reports /> : <UnauthorizedScreen />}
          </div>
        )}

        {activeScreen === 'pl' && (
          <div className="flex-1">
            {hasPermission('pl') ? <PLReport /> : <UnauthorizedScreen />}
          </div>
        )}

        {activeScreen === 'treasury' && (
          <div className="flex-1">
            {hasPermission('treasury') ? <TreasuryDashboard /> : <UnauthorizedScreen />}
          </div>
        )}

        {activeScreen === 'audit' && (
          <div className="flex-1">
            {hasPermission('audit') ? <AuditLog /> : <UnauthorizedScreen />}
          </div>
        )}

        {activeScreen === 'quotations' && (
          <div className="flex-1">
            {hasPermission('quotations') ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">🚧</div>
                  <div className="text-xl">قريباً</div>
                </div>
              </div>
            ) : <UnauthorizedScreen />}
          </div>
        )}

        {activeScreen === 'sales' && (
          <div className="flex-1">
            {hasPermission('sales') ? <SalesHistory /> : <UnauthorizedScreen />}
          </div>
        )}

        {activeScreen === 'profile' && (
          <div className="flex-1">
            {hasPermission('profile') ? <EmployeeProfile onLogout={handleLogout} /> : <UnauthorizedScreen />}
          </div>
        )}
      </div>
      <FloatingAIAssistant
        onScreenChange={setActiveScreen}
        currentUser={currentUser}
      />
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          style: {
            direction: "rtl",
            fontFamily: "system-ui, -apple-system, sans-serif",
          },
        }}
      />
    </>
  );
}
