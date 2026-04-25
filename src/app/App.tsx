import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ProductGrid } from './components/ProductGrid';
import { Cart } from './components/Cart';
import { InventoryScreen } from './components/InventoryScreen';
import { AICenter } from './components/AICenter';
import { AutomationEngine } from './components/AutomationEngine';
import { EmployeeExpenseManagement } from './components/EmployeeExpenseManagement';
import { Settings } from './components/Settings';
import { UserManagement } from './components/UserManagement';
import { LoginScreen } from './components/LoginScreen';
import { SignUpScreen } from './components/SignUpScreen';
import { Dashboard } from './components/Dashboard';
import { InstallmentsManagement } from './components/InstallmentsManagement';
import { SalesRepresentatives } from './components/SalesRepresentatives';
import { SalesHistory } from './components/SalesHistory';
import { Reports } from './components/Reports';
import { EmployeeProfile } from './components/EmployeeProfile';
import apiClient from '../api/axiosConfig';



// Product interface matching backend API
export interface Product {
  id: string;
  name: string;
  price: number;
  retail_price?: number;
  category?: string;
  image?: string;
  current_stock?: number;
  sku?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export type Screen = 'pos' | 'inventory' | 'home' | 'reports' | 'ai' | 'automation' | 'employees' | 'settings' | 'users' | 'installments' | 'representatives' | 'quotations' | 'sales' | 'profile';

export default function App() {
  const savedUser = localStorage.getItem('erp_user');
  const [currentUser, setCurrentUser] = useState(
    savedUser ? JSON.parse(savedUser) : null
  );
  const isLoggedIn = currentUser !== null;
  const [activeScreen, setActiveScreen] = useState<Screen>('pos');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  
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
  }, []);

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
    localStorage.removeItem('erp_user');
    setCurrentUser(null);
  };

  const hasPermission = (screen: string): boolean => {
    if (!currentUser) return false;
    // المدير له وصول كامل
    if (currentUser.role === 'مدير') return true;
    // mapping بين الـ screens والـ permissions
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

if (!isLoggedIn) {
  if (authScreen === 'login') {
    return (
      <LoginScreen
        onLogin={(userData) => setCurrentUser(userData)}
        onGoToSignUp={() => setAuthScreen('signup')}
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
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
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
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item
        )
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
    <div dir="rtl" className="h-screen flex bg-gray-50" style={{ fontFamily: 'Cairo, sans-serif' }}>
      {/* Right Sidebar */}
      <Sidebar activeScreen={activeScreen} onScreenChange={setActiveScreen} currentUser={currentUser} onLogout={handleLogout} />

      {/* Main Content */}
      {activeScreen === 'pos' && (
        <div className="flex-1 flex gap-4 p-4">
          {/* Right Side - Products (65%) */}
          <div className="flex-[65] flex flex-col gap-4">
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

          {/* Left Side - Cart (35%) */}
          <div className="flex-[35]">
            <Cart
              cartItems={cartItems}
              selectedCustomer={selectedCustomer}
              onCustomerChange={setSelectedCustomer}
              discount={discount}
              onDiscountChange={setDiscount}
              onUpdateQuantity={updateQuantity}
              onClearCart={clearCart}
            />
          </div>
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

      {activeScreen === 'employees' && (
        <div className="flex-1">
          {hasPermission('employees') ? <EmployeeExpenseManagement /> : <UnauthorizedScreen />}
        </div>
      )}

      {activeScreen === 'settings' && (
        <div className="flex-1">
          {hasPermission('settings') ? <Settings /> : <UnauthorizedScreen />}
        </div>
      )}

      {activeScreen === 'users' && (
        <div className="flex-1">
          {hasPermission('users') ? <UserManagement /> : <UnauthorizedScreen />}
        </div>
      )}

      {/* {activeScreen === 'login' && (
        <div className="flex-1">
          <LoginScreen />
        </div>
      )} */}




      {activeScreen === 'home' && (
        <div className="flex-1">
          <Dashboard />
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
          <EmployeeProfile onLogout={handleLogout} />
        </div>
      )}
    </div>
  );
}
