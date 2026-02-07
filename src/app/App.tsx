import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ProductGrid } from './components/ProductGrid';
import { Cart } from './components/Cart';
import { InventoryScreen } from './components/InventoryScreen';
import { AICenter } from './components/AICenter';
import { AutomationEngine } from './components/AutomationEngine';
import { EmployeeExpenseManagement } from './components/EmployeeExpenseManagement';
import { SystemSettings } from './components/SystemSettings';
import { UserManagement } from './components/UserManagement';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { InstallmentsManagement } from './components/InstallmentsManagement';
import { SalesRepresentatives } from './components/SalesRepresentatives';

// Mock product data
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export type Screen = 'pos' | 'inventory' | 'home' | 'reports' | 'ai' | 'automation' | 'employees' | 'settings' | 'users' | 'installments' | 'representatives' | 'quotations';

const mockProducts: Product[] = [
  { id: '1', name: 'لابتوب HP', price: 15000, category: 'إلكترونيات', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400' },
  { id: '2', name: 'هاتف سامسونج', price: 8500, category: 'إلكترونيات', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400' },
  { id: '3', name: 'سماعة بلوتوث', price: 450, category: 'إلكترونيات', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400' },
  { id: '4', name: 'قميص رجالي', price: 350, category: 'ملابس', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400' },
  { id: '5', name: 'حذاء ياضي', price: 850, category: 'ملابس', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' },
  { id: '6', name: 'ساعة ذكية', price: 2500, category: 'إلكترونيات', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400' },
  { id: '7', name: 'كاميرا رقمية', price: 12000, category: 'إلكترونيات', image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400' },
  { id: '8', name: 'حقيبة جلدية', price: 650, category: 'إكسسوارات', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400' },
  { id: '9', name: 'نظارة شمسية', price: 320, category: 'إكسسوارات', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
  { id: '10', name: 'تابلت آيباد', price: 9500, category: 'إلكرونيات', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400' },
  { id: '11', name: 'ماوس لاسلكي', price: 180, category: 'إلكترونيات', image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400' },
  { id: '12', name: 'كيبورد ميكانيكي', price: 850, category: 'إلكترونيات', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400' },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeScreen, setActiveScreen] = useState<Screen>('pos');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);

  // If not logged in, show login screen
  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
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

  const filteredProducts = mockProducts.filter((product) => {
    const matchesCategory =
      selectedCategory === 'الكل' || product.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      product.name.includes(searchQuery) ||
      product.id.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const categories = ['الكل', ...Array.from(new Set(mockProducts.map((p) => p.category)))];

  return (
    <div dir="rtl" className="h-screen flex bg-gray-50" style={{ fontFamily: 'Cairo, sans-serif' }}>
      {/* Right Sidebar */}
      <Sidebar activeScreen={activeScreen} onScreenChange={setActiveScreen} />

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
          <InventoryScreen />
        </div>
      )}

      {activeScreen === 'ai' && (
        <div className="flex-1">
          <AICenter />
        </div>
      )}

      {activeScreen === 'automation' && (
        <div className="flex-1">
          <AutomationEngine />
        </div>
      )}

      {activeScreen === 'employees' && (
        <div className="flex-1">
          <EmployeeExpenseManagement />
        </div>
      )}

      {activeScreen === 'settings' && (
        <div className="flex-1">
          <SystemSettings />
        </div>
      )}

      {activeScreen === 'users' && (
        <div className="flex-1">
          <UserManagement />
        </div>
      )}

      {activeScreen === 'login' && (
        <div className="flex-1">
          <LoginScreen />
        </div>
      )}

      {activeScreen === 'home' && (
        <div className="flex-1">
          <Dashboard />
        </div>
      )}

      {activeScreen === 'installments' && (
        <div className="flex-1">
          <InstallmentsManagement />
        </div>
      )}

      {activeScreen === 'representatives' && (
        <div className="flex-1">
          <SalesRepresentatives />
        </div>
      )}

      {(activeScreen === 'reports' || activeScreen === 'quotations') && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-6xl mb-4">🚧</div>
            <div className="text-xl">قريباً</div>
          </div>
        </div>
      )}
    </div>
  );
}