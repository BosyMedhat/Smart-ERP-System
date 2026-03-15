// import sideLogo from '../../assets/side.png';
// import {
//   Home,
//   Package,
//   ShoppingCart,
//   FileText,
//   Brain,
//   Zap,
//   Users,
//   Settings,
//   Shield,
//   CreditCard,
//   UserCheck,
//   FileCheck,
// } from 'lucide-react';
// import { Screen } from '../App';

// interface SidebarProps {
//   activeScreen: Screen;
//   onScreenChange: (screen: Screen) => void;
// }

// const menuItems: { icon: typeof Home; label: string; screen: Screen }[] = [
//   { icon: Home, label: 'الرئيسية', screen: 'home' },
//   { icon: Package, label: 'المخازن', screen: 'inventory' },
//   { icon: ShoppingCart, label: 'المبيعات', screen: 'pos' },
//   { icon: CreditCard, label: 'التقسيط', screen: 'installments' },
//   { icon: UserCheck, label: 'المناديب', screen: 'representatives' },
//   { icon: FileCheck, label: 'عروض الأسعار', screen: 'quotations' },
//   { icon: Users, label: 'الموظفين', screen: 'employees' },
//   { icon: Brain, label: 'الذكاء الاصطناعي', screen: 'ai' },
//   { icon: Zap, label: 'الأتمتة', screen: 'automation' },
//   { icon: Shield, label: 'الصلاحيات', screen: 'users' },
//   { icon: Settings, label: 'الإعدادات', screen: 'settings' },
//   { icon: FileText, label: 'التقارير', screen: 'reports' },
// ];

// // export function Sidebar({ activeScreen, onScreenChange }: SidebarProps) {
// //   // 1. استرجاع بيانات المستخدم والصلاحيات من التخزين المحلي
// //   const user = JSON.parse(localStorage.getItem('user') || '{}');
// //   const permissions = user.profile?.permissions || {};
// //   const isManager = user.profile?.role === 'مدير';

// //   // 2. دالة التحقق من الصلاحية
// //   const canAccess = (screen: Screen) => {
// //     // هذه الشاشات متاحة دائماً للجميع
// //     if (screen === 'pos' || screen === 'home') return true; 
// //     // المدير يرى كل شيء
// //     if (isManager) return true; 
// //     // الكاشير يرى فقط ما تم السماح له به في الـ permissions
// //     return permissions[screen] === true;
// //   };





// export function Sidebar({ activeScreen, onScreenChange }: SidebarProps) {
//   // 1. استرجاع بيانات المستخدم
//   const userData = JSON.parse(localStorage.getItem('user') || '{}');
  
//   // التعديل هنا: الوصول للبيانات مباشرة بدون .profile
//   const permissions = userData.permissions || {};
//   const role = userData.role; 
//   const isManager = role === 'مدير_نظام'; // تأكدي أن هذا الاسم يطابق تماماً ما في قاعدة البيانات

//   // 2. دالة التحقق من الصلاحية
//   const canAccess = (screen: Screen) => {
//     if (screen === 'pos' || screen === 'home') return true; 
//     if (isManager) return true; 
    
 
//     // تأكدي أن مفاتيح الـ permissions في السيرفر تطابق قيم الـ screen
//     return permissions[screen] === true;
   
//   };
  
 
//     console.log("Is Manager:", isManager);
// console.log("Permissions:", permissions);

//   return (
//     <div className="w-20 bg-[#1E293B] flex flex-col items-center py-6 gap-4 overflow-y-auto">
//       {/* شعار Mora */}
//       <div className="flex justify-center mb-6">
//         <img
//           src={sideLogo}
//           alt="Mora Logo"
//           className="w-28 h-auto object-contain"
//         />
//       </div>

//       {/* قائمة الايقونات مع الفلترة بناءً على الصلاحيات */}
//       {menuItems
//         .filter((item) => canAccess(item.screen))
//         .map((item) => {
//           const Icon = item.icon;
//           return (
//             <button
//               key={item.label}
//               onClick={() => onScreenChange(item.screen)}
//               className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
//                 activeScreen === item.screen
//                   ? 'bg-[#3B82F6] text-white'
//                   : 'text-gray-400 hover:bg-slate-700 hover:text-white'
//               }`}
//               title={item.label}
//             >
//               <Icon size={24} />
//             </button>
//           );
//         })}
//     </div>
//   );
// }









// import sideLogo from '../../assets/side.png';
// import {
//   Home,
//   Package,
//   ShoppingCart,
//   FileText,
//   Brain,
//   Zap,
//   Users,
//   Settings,
//   Shield,
//   CreditCard,
//   UserCheck,
//   FileCheck,
// } from 'lucide-react';
// import { Screen } from '../App';

// interface SidebarProps {
//   activeScreen: Screen;
//   onScreenChange: (screen: Screen) => void;
// }

// const menuItems: { icon: typeof Home; label: string; screen: Screen }[] = [
//   { icon: Home, label: 'الرئيسية', screen: 'home' },
//   { icon: Package, label: 'المخازن', screen: 'inventory' },
//   { icon: ShoppingCart, label: 'المبيعات', screen: 'pos' },
//   { icon: CreditCard, label: 'التقسيط', screen: 'installments' },
//   { icon: UserCheck, label: 'المناديب', screen: 'representatives' },
//   { icon: FileCheck, label: 'عروض الأسعار', screen: 'quotations' },
//   { icon: Users, label: 'الموظفين', screen: 'employees' },
//   { icon: Brain, label: 'الذكاء الاصطناعي', screen: 'ai' },
//   { icon: Zap, label: 'الأتمتة', screen: 'automation' },
//   { icon: Shield, label: 'الصلاحيات', screen: 'users' },
//   { icon: Settings, label: 'الإعدادات', screen: 'settings' },
//   { icon: FileText, label: 'التقارير', screen: 'reports' },
// ];



// export function Sidebar({ activeScreen, onScreenChange }: SidebarProps) {
//   // 1. استرجاع بيانات المستخدم
//   const userData = JSON.parse(localStorage.getItem('user') || '{}');
//   const permissions = userData.permissions || { sales: [], inventory: [], reports: [], settings: [] };
//   const role = userData.role; 

//   // تأكدي أن المسميات تطابق ما يخرج من الـ login_view في Django
//   const isManager = role === 'مدير' || role === 'ADMIN'; 

//   // 2. دالة التحقق المطورة
//   const canAccess = (screen: Screen) => {
//     // الرئيسية وشاشة الكاشير متاحة دائماً (أو حسب رغبتك)
//     if (screen === 'home') return true; 
    
//     // المدير له صلاحية كاملة
//     if (isManager) return true; 

//     // التحقق من الصلاحيات بناءً على المجموعات اللي في الداتابيز
//     switch (screen) {
//       case 'inventory':
//         return permissions.inventory.includes('add_product') || permissions.inventory.includes('inventory_count');
//       case 'pos':
//         return permissions.sales.includes('view_pos');
//       case 'installments':
//         return permissions.sales.includes('apply_discount'); // أو أي صلاحية مناسبة
//       case 'reports':
//         return permissions.reports.length > 0; // لو معاه أي صلاحية في التقارير تظهر له القائمة
//       case 'users':
//       case 'settings':
//         return false; // الكاشير مستحيل يدخل هنا حتى لو حاول
//       default:
//         return false;
//     }
//   };

//   return (
//     <div className="w-20 bg-[#1E293B] flex flex-col items-center py-6 gap-4 overflow-y-auto h-full">
//       <div className="flex justify-center mb-6">
//         <img src={sideLogo} alt="Mora Logo" className="w-28 h-auto object-contain" />
//       </div>

//       {menuItems.map((item) => {
//         const Icon = item.icon;
//         const isAllowed = canAccess(item.screen);

//         // إذا لم يكن مسموحاً له، لا نظهر الزرار أصلاً (أفضل لتجربة المستخدم)
//         if (!isAllowed) return null;

//         return (
//           <button
//             key={item.label}
//             onClick={() => onScreenChange(item.screen)}
//             className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all flex-shrink-0 
//               ${activeScreen === item.screen ? 'bg-[#3B82F6] text-white' : 'text-gray-400 hover:bg-slate-700 hover:text-white'}`}
//             title={item.label}
//           >
//             <Icon size={24} />
//           </button>
//         );
//       })}
//     </div>
//   );
// }

import sideLogo from '../../assets/side.png';
import {
  Home, Package, ShoppingCart, FileText, Brain, Zap, Users,
  Settings, Shield, CreditCard, UserCheck, FileCheck,
} from 'lucide-react';
import { Screen } from '../App';

interface SidebarProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

const menuItems: { icon: typeof Home; label: string; screen: Screen }[] = [
  { icon: Home, label: 'الرئيسية', screen: 'home' },
  { icon: Package, label: 'المخازن', screen: 'inventory' },
  { icon: ShoppingCart, label: 'المبيعات', screen: 'pos' },
  { icon: CreditCard, label: 'التقسيط', screen: 'installments' },
  { icon: UserCheck, label: 'المناديب', screen: 'representatives' },
  { icon: FileCheck, label: 'عروض الأسعار', screen: 'quotations' },
  { icon: Users, label: 'الموظفين', screen: 'employees' },
  { icon: Brain, label: 'الذكاء الاصطناعي', screen: 'ai' },
  { icon: Zap, label: 'الأتمتة', screen: 'automation' },
  { icon: Shield, label: 'الصلاحيات', screen: 'users' },
  { icon: Settings, label: 'الإعدادات', screen: 'settings' },
  { icon: FileText, label: 'التقارير', screen: 'reports' },
];

export function Sidebar({ activeScreen, onScreenChange }: SidebarProps) {
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const permissions = userData.permissions || {};
  const role = userData.role; 

  const isManager = role === 'مدير' || role === 'ADMIN'; 

  // 1. دالة التحقق الذكية (بتدور في الـ JSON كله تلقائياً)
  // const canAccess = (screen: Screen) => {
  //   if (screen === 'home') return true; 
  //   if (isManager) return true; 

  //   // بيلف على كل مصفوفات الصلاحيات (sales, inventory, etc) 
  //   // وبيشوف لو اسم الشاشة موجود جوه أي واحدة فيهم
  //   return Object.values(permissions).some((group: any) => 
  //     Array.isArray(group) && group.includes(screen)
  //   );
  // };
  // 1. دالة التحقق الذكية (معدلة لقفل الرئيسية)
  // const canAccess = (screen: Screen) => {
  //   // المدير له صلاحية كاملة على كل شيء بما فيها الرئيسية
  //   if (isManager) return true; 

  //   // هنا شلنا استثناء الـ 'home' عشان تبقى مقفولة زيهم
  //   // الكود هيدور في الـ JSON: لو لقى كلمة pos يفتح مبيعات، لو لقى home يفتح رئيسية
  //   return Object.values(permissions).some((group: any) => 
  //     Array.isArray(group) && group.includes(screen)
  //   );
  // };
const canAccess = (screen: Screen) => {
    // 1. المدير يشوف كل حاجة
    if (isManager) return true; 

    // 2. تحويل اسم الشاشة للاسم اللي كتبناه في الداتا بيز (Mapping)
    const screenMap: Record<string, string[]> = {
      'pos': ['view_pos', 'pos'], // بيدور على دي أو دي
      'inventory': ['view_stock', 'add_product', 'inventory'],
      'reports': ['dashboard_charts', 'daily_summary', 'reports'],
      'home': ['view_home', 'home'],
      'users': ['users']
    };

    const targetIDs = screenMap[screen] || [screen];

    // 3. البحث في كل الصلاحيات عن أي ID من اللي حددناهم
    return Object.values(permissions).some((group: any) => 
      Array.isArray(group) && targetIDs.some(id => group.includes(id))
    );
  };
  // 2. دالة التعامل مع الضغط على الأيقونة
  const handleItemClick = (item: { label: string; screen: Screen }) => {
    if (canAccess(item.screen)) {
      onScreenChange(item.screen);
    } else {
      // الرسالة اللي طلبتيها تظهر لو الصلاحية مش موجودة
      alert(`عفواً، لا تملك صلاحية الوصول لقسم (${item.label})`);
    }
  };

  return (
    <div className="w-20 bg-[#1E293B] flex flex-col items-center py-6 gap-4 overflow-y-auto h-full shadow-xl">
      <div className="flex justify-center mb-6">
        <img src={sideLogo} alt="Mora Logo" className="w-28 h-auto object-contain" />
      </div>

      {menuItems.map((item) => {
        const Icon = item.icon;
        const isAllowed = canAccess(item.screen);

        return (
          <button
            key={item.label}
            onClick={() => handleItemClick(item)}
            // لو ملوش صلاحية بنخلي الأيقونة شفافة شوية (opacity-40)
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0 
              ${activeScreen === item.screen ? 'bg-[#3B82F6] text-white shadow-lg' : 'text-gray-400 hover:bg-slate-700 hover:text-white'}
              ${!isAllowed ? 'opacity-40 grayscale' : 'opacity-100'} 
            `}
            title={item.label}
          >
            <Icon size={24} />
          </button>
        );
      })}
    </div>
  );
}