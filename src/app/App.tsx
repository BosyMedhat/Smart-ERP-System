import { useState, useEffect, useCallback } from 'react'; // استيراد هوكس إدارة الحالة والتأثيرات
import { Sidebar } from './components/Sidebar';
import { ProductGrid } from './components/ProductGrid';
import { Cart } from './components/Cart';
import {InventoryScreen}  from './components/InventoryScreen';
import { AICenter } from './components/AICenter';
import { AutomationEngine } from './components/AutomationEngine';
import { EmployeeExpenseManagement } from './components/EmployeeExpenseManagement';
import { SystemSettings } from './components/SystemSettings';
import { UserManagement } from './components/UserManagement';
import { LoginScreen } from './components/LoginScreen';
import { SignUpScreen } from './components/SignUpScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { QuotationsScreen } from './components/QuotationsScreen';
import { Dashboard } from './components/Dashboard';
import { InstallmentsManagement } from './components/InstallmentsManagement';
import { SalesRepresentatives } from './components/SalesRepresentatives';
import { ShiftOpeningModal } from './components/ShiftOpeningModal'; // استيراد واجهة فتح الوردية الجديدة
import { getProducts } from '../api/inventoryApi'; // دالة جلب المنتجات من الداتابيز
import apiClient from '../api/axiosConfig'; // لإجراء طلبات مباشرة للسيرفر

// Mock product data
export interface Product {
  id: string;
  name: string;
  retail_price: number;
  wholesale_price: number;
  price: number; // current price based on type
  category: string;
  image: string;
  current_stock: number;
  sku: string;
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
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  const [priceType, setPriceType] = useState<'retail' | 'wholesale'>('retail');
  
  // حالات البيانات الحقيقية من السيرفر
  const [products, setProducts] = useState<Product[]>([]); // حالة المنتجات الحقيقية
  const [activeShift, setActiveShift] = useState<any>(null); // حالة الوردية الحالية
  const [isLoading, setIsLoading] = useState(false); // حالة التحميل العامة

  // 1. دالة للتحقق من وجود وردية نشطة عند الدخول
  const checkActiveShift = useCallback(async () => {
    try {
      const response = await apiClient.get('shifts/active/');
      if (response.data && !response.data.active === false) {
        setActiveShift(response.data);
      } else {
        setActiveShift(null);
      }
    } catch (err) {
      console.error("Error checking shift:", err);
    }
  }, []);

  // 2. دالة جلب المنتجات من قاعدة البيانات
  const fetchProducts = useCallback(async () => {
    try {
      const data = await getProducts();
      // تحويل البيانات من الـ API لشكل المنتجات المتوقع في الـ UI
      const mappedProducts = data.map((p: any) => {
        const retail = parseFloat(p.retail_price);
        const wholesale = parseFloat(p.wholesale_price) || retail;
        return {
          id: p.id.toString(),
          name: p.name,
          retail_price: retail,
          wholesale_price: wholesale,
          price: priceType === 'retail' ? retail : wholesale,
          category: p.category || 'عام',
          image: p.image || 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=400',
          current_stock: parseFloat(p.current_stock),
          sku: p.sku || ''
        };
      });
      setProducts(mappedProducts);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  }, []);

  // تحديث السعر المعروض عند تغيير نوع السعر
  useEffect(() => {
    setProducts(prev => prev.map(p => ({
      ...p,
      price: priceType === 'retail' ? p.retail_price : p.wholesale_price
    })));
  }, [priceType]);

  // 3. منطق الباركود: البحث التلقائي والإضافة للسلة
  useEffect(() => {
    if (searchQuery.length > 3) { // افترضنا أن الباركود طولة أكبر من 3
      const matched = products.find(p => p.sku === searchQuery);
      if (matched && matched.current_stock > 0) {
        addToCart(matched);
        setSearchQuery(''); // مسح البحث بعد الإضافة
      }
    }
  }, [searchQuery, products]);

  // تنفيذ الجلب عند تسجيل الدخول
  useEffect(() => {
    if (isLoggedIn) {
      checkActiveShift();
      fetchProducts();
    }
  }, [isLoggedIn, checkActiveShift, fetchProducts]);

  if (!isLoggedIn) {
    if (authScreen === 'login') {
      return (
        <LoginScreen
          onLogin={() => setIsLoggedIn(true)}
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
      const currentQtyInCart = existing ? existing.quantity : 0;

      // المنع من بيع منتج غير متوفر (مهمة: منع بيع المنتجات منتهية المخزون)
      if (product.current_stock <= currentQtyInCart) {
        alert("⚠️ عذراً، الكمية المطلوبة غير متوفرة في المخزن حالياً!");
        return prev;
      }

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

  const filteredProducts = products.filter((product) => { // استبدال mockProducts بـ products
    const matchesCategory =
      selectedCategory === 'الكل' || product.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      product.name.includes(searchQuery) ||
      product.id.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const categories = ['الكل', ...Array.from(new Set(products.map((p) => p.category)))];

  const hasPermission = (screen: Screen) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // 1. المدير يرى كل شيء
    const role = user.role || '';
    if (role === 'مدير_نظام' || role === 'مدير' || role === 'ADMIN' || user.is_superuser) return true;
    
    const permissions = user.permissions || {};
    const django_permissions = user.django_permissions || [];

    // 2. خريطة الربط بين اسم الشاشة والـ ID في الداتا بيز
    const screenToIdMap: Record<string, string[]> = {
      'pos': ['view_pos', 'pos'],
      'inventory': ['view_stock', 'add_product', 'inventory'],
      'home': ['view_home', 'home'],
      'reports': ['dashboard_charts', 'daily_summary', 'reports'],
      'users': ['users'],
      'settings': ['settings']
    };

    const targetIds = screenToIdMap[screen] || [screen];

    // فحص تواجد الصلاحية في مصفوفة جانغو نيتف أولاً
    if (targetIds.some(id => django_permissions.includes(id))) {
        return true;
    }

    // فحص الصلاحيات المحفوظة في UserProfile إذا كانت مصفوفة مسطحة
    if (Array.isArray(permissions)) {
        return targetIds.some(id => permissions.includes(id));
    }

    // فحص الصلاحيات إذا كانت كائن (Object) يحتوي على مصفوفات مثل { sales: ["view_pos"] }
    return Object.values(permissions).some((pArray: any) => 
      Array.isArray(pArray) && targetIds.some(id => pArray.includes(id))
    );
  };

  return (
    <div dir="rtl" className="h-screen flex bg-gray-50" style={{ fontFamily: 'Cairo, sans-serif' }}>
      <Sidebar activeScreen={activeScreen} onScreenChange={setActiveScreen} />

      <div className="flex-1 overflow-auto">
        {/* شاشة فتح الوردية الإجبارية للكاشير إذا لم تكن هناك وردية نشطة */}
        {/* تهميش المودال مؤقتاً للتسهيل في التست كما طلب العميل */}
        {/* {isLoggedIn && !activeShift && (
          <ShiftOpeningModal onShiftStarted={(shift) => setActiveShift(shift)} />
        )} */}

        {activeScreen === 'pos' ? (
          <div className="flex gap-4 p-4">
            <div className="flex-[65] flex flex-col gap-4">
              <ProductGrid
                products={filteredProducts}
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddToCart={addToCart}
                priceType={priceType}
                onPriceTypeChange={setPriceType}
              />
            </div>
            <div className="flex-[35]">
              <Cart
                cartItems={cartItems}
                selectedCustomer={selectedCustomer}
                onCustomerChange={setSelectedCustomer}
                discount={discount}
                onDiscountChange={setDiscount}
                onUpdateQuantity={updateQuantity}
                onClearCart={clearCart}
                onSaleSuccess={fetchProducts} // تحديث البيانات عند نجاح البيع
              />
            </div>
          </div>
        ) : (
          hasPermission(activeScreen) ? (
            <>
              {activeScreen === 'inventory' && <InventoryScreen />}
              {activeScreen === 'ai' && <AICenter />}
              {activeScreen === 'automation' && <AutomationEngine />}
              {activeScreen === 'employees' && <EmployeeExpenseManagement />}
              {activeScreen === 'settings' && <SystemSettings />}
              {activeScreen === 'users' && <UserManagement />}
              {activeScreen === 'home' && <Dashboard />}
              {activeScreen === 'installments' && <InstallmentsManagement />}
              {activeScreen === 'representatives' && <SalesRepresentatives />}
              {activeScreen === 'reports' && <ReportsScreen />}
              {activeScreen === 'quotations' && <QuotationsScreen />}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <div className="text-6xl mb-4">🚫</div>
              <div className="text-xl font-bold">عفواً، لا تملك صلاحية الوصول لهذه الصفحة</div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
