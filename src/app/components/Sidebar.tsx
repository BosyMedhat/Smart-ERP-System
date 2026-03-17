import { Home, Package, ShoppingCart, FileText, Brain, Zap, Users, Settings, Shield, CreditCard, UserCheck, FileCheck } from 'lucide-react';
import { Screen } from '../App';

interface SidebarProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

// أضفنا adminOnly لتحديد العناصر المحمية
const menuItems: { icon: typeof Home; label: string; screen: Screen; adminOnly: boolean }[] = [
  { icon: Home, label: 'الرئيسية', screen: 'home', adminOnly: false },
  { icon: Package, label: 'المخازن', screen: 'inventory', adminOnly: true },
  { icon: ShoppingCart, label: 'المبيعات', screen: 'pos', adminOnly: false },
  { icon: CreditCard, label: 'التقسيط', screen: 'installments', adminOnly: false },
  { icon: UserCheck, label: 'المناديب', screen: 'representatives', adminOnly: false },
  { icon: FileCheck, label: 'عروض الأسعار', screen: 'quotations', adminOnly: false },
  { icon: Users, label: 'الموظفين', screen: 'employees', adminOnly: true },
  { icon: Brain, label: 'الذكاء الاصطناعي', screen: 'ai', adminOnly: true },
  { icon: Zap, label: 'الأتمتة', screen: 'automation', adminOnly: true },
  { icon: Shield, label: 'الصلاحيات', screen: 'users', adminOnly: true },
  { icon: Settings, label: 'الإعدادات', screen: 'settings', adminOnly: true },
  { icon: FileText, label: 'التقارير', screen: 'reports', adminOnly: false },
];

export function Sidebar({ activeScreen, onScreenChange }: SidebarProps) {
  // 1. استخراج بيانات المستخدم من الـ Storage (تأكد أن Login يحفظها باسم 'user')
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // 2. شرط الأدمن: إما أن يكون is_staff أو يكون اليوزر هو mostaf
  const isAdmin = user.is_staff === true || user.username === 'mostaf';

  // 3. فلترة القائمة بناءً على الصلاحية
  const filteredItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="w-20 bg-[#1E293B] flex flex-col items-center py-6 gap-4 overflow-y-auto h-screen sticky top-0">
      <div className="text-white text-2xl font-bold mb-6">POS</div>
      
      {/* 4. استخدام القائمة المفلترة هنا */}
      {filteredItems.map((item) => {
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