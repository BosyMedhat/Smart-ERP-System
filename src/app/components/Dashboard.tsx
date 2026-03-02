import { useState } from 'react';
import {
  TrendingUp,
  Bell,
  Users,
  ShoppingCart,
  ShoppingBag,
  Wallet,
  FileText,
  Package,
  Clock,
  AlertTriangle,
  User,
  CreditCard,
    Mic,
} from 'lucide-react';

// Import all modals
import { ShiftClosingModal } from './ShiftClosingModal';
import { SalesInvoiceModal } from './SalesInvoiceModal';
import { PurchaseInvoiceModal } from './PurchaseInvoiceModal';
import { CashPermissionModal } from './CashPermissionModal';
import { PriceQuotationModal } from './PriceQuotationModal';
import { InventoryAuditModal } from './InventoryAuditModal';

interface Activity {
  id: string;
  type: 'sale' | 'purchase' | 'payment' | 'representative' | 'installment' | 'alert';
  message: string;
  time: string;
  icon: typeof ShoppingCart;
  color: string;
}

export function Dashboard() {
  const [showShiftClosingModal, setShowShiftClosingModal] = useState(false);
  const [showSalesInvoiceModal, setShowSalesInvoiceModal] = useState(false);
  const [showPurchaseInvoiceModal, setShowPurchaseInvoiceModal] = useState(false);
  const [showCashPermissionModal, setShowCashPermissionModal] = useState(false);
  const [showPriceQuoteModal, setShowPriceQuoteModal] = useState(false);
  const [showInventoryAuditModal, setShowInventoryAuditModal] = useState(false);
const [isRecording, setIsRecording] = useState(false);


  const [activities] = useState<Activity[]>([
    { id: '1', type: 'representative', message: 'المندوب أحمد: تم إتمام فاتورة #22', time: 'منذ 5 دقائق', icon: User, color: '#3B82F6' },
    { id: '2', type: 'installment', message: 'تم تحصيل قسط من العميل محمد - 1,500 ج.م', time: 'منذ 12 دقيقة', icon: CreditCard, color: '#10B981' },
    { id: '3', type: 'sale', message: 'فاتورة مبيعات جديدة #221 - 8,450 ج.م', time: 'منذ 18 دقيقة', icon: ShoppingCart, color: '#3B82F6' },
    { id: '4', type: 'alert', message: 'تنبيه: منتج "لابتوب HP" أقل من الحد الأدنى', time: 'منذ 25 دقيقة', icon: AlertTriangle, color: '#F59E0B' },
    { id: '5', type: 'representative', message: 'المندوبة سارة: زيارة عميل جديد بالمنطقة الشرقية', time: 'منذ 35 دقيقة', icon: User, color: '#8B5CF6' },
    { id: '6', type: 'installment', message: 'تم تحصيل قسط من العميل فاطمة - 2,000 ج.م', time: 'منذ 42 دقيقة', icon: CreditCard, color: '#10B981' },
    { id: '7', type: 'purchase', message: 'فاتورة مشتريات #115 تم استلامها', time: 'منذ 1 ساعة', icon: ShoppingBag, color: '#F59E0B' },
  ]);


  const quickActions = [
    { id: '1', label: 'فاتورة بيع', icon: ShoppingCart, color: '#3B82F6' },
    { id: '2', label: 'فاتورة شراء', icon: ShoppingBag, color: '#F59E0B' },
    { id: '3', label: 'إذن صرف نقدية', icon: Wallet, color: '#FBBF24' },
    { id: '4', label: 'عرض سعر جديد', icon: FileText, color: '#8B5CF6' },
    { id: '5', label: 'جرد المخزن', icon: Package, color: '#06B6D4' },
    { id: '6', label: 'غلق الوردية', icon: Clock, color: '#EF4444' },
  ];

  return (
    <div className="flex-1 h-screen overflow-hidden bg-gray-50">
      {/* Top Navbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <input
  type="text"
  placeholder={
    isRecording
      ? '🎙️ جاري الاستماع... تحدث الآن'
      : 'ابحث عن أي شيء أو استخدم الأوامر الصوتية...'
  }
  className={`w-full px-4 py-2.5 pr-12 border rounded-xl focus:outline-none focus:ring-2
    ${isRecording
      ? 'bg-blue-50 border-blue-500 focus:ring-blue-400'
      : 'border-gray-300 focus:ring-[#3B82F6]'}`}
/>

              <button
  onClick={() => setIsRecording(!isRecording)}
  className={`absolute left-3 top-1/2 -translate-y-1/2
    w-10 h-10 rounded-xl flex items-center justify-center transition-all
    ${isRecording
      ? 'bg-blue-600 animate-pulse shadow-lg'
      : 'bg-gradient-to-br from-[#3B82F6] to-[#1E293B] hover:scale-110'}`}
>
  <Mic className="text-white" size={20} />
</button>

            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-green-100 border-2 border-green-500 px-4 py-2 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-bold text-green-700">الوردية: مفتوحة</span>
            </div>
            <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-xl">
              <div className="text-left">
                <div className="text-sm font-bold text-gray-800">أحمد المدير</div>
                <div className="text-xs text-gray-600">مدير النظام</div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-[#3B82F6] to-[#1E293B] rounded-full flex items-center justify-center text-white font-bold">
                أ
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-80px)] overflow-y-auto p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Welcome */}
          <div>
            <h1 className="text-3xl font-bold text-[#1E293B] mb-2">مرحباً بك في لوحة التحكم</h1>
            <p className="text-gray-600">نظرة شاملة على أداء مؤسستك</p>
          </div>

                {/* ===== KPI CARDS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">


{/* Card 1 */}
<div className="rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br from-green-300 to-green-500">
  <ShoppingCart size={28} />
  <p className="mt-4 text-base md:text-lg font-semibold">مبيعات اليوم</p>
  <h2 className="text-3xl md:text-4xl font-bold">47,850 ج.م</h2> {/* أصغر شويه */}
  <span className="text-sm md:text-base opacity-90">+18%</span>
</div>

{/* Card 2 */}
<div className="rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br from-blue-300 to-blue-500">
  <CreditCard size={28} />
  <p className="mt-4 text-base md:text-lg font-semibold">تحصيلات اليوم</p>
  <h2 className="text-3xl md:text-4xl font-bold">12,500 ج.م</h2> {/* أصغر شويه */}
  <span className="text-sm md:text-base opacity-90">8 عمليات</span>
</div>

{/* Card 3 */}
<div className="rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br from-orange-300 to-orange-500">
  <Bell size={28} />
  <p className="mt-4 text-base md:text-lg font-semibold">تنبيهات</p>
  <h2 className="text-3xl md:text-4xl font-bold">5</h2>
  <span className="text-sm md:text-base opacity-90">عاجلة</span>
</div>

{/* Card 4 */}
<div className="rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br from-purple-300 to-purple-500">
  <Users size={28} />
  <p className="mt-4 text-base md:text-lg font-semibold">المناديب</p>
  <h2 className="text-3xl md:text-4xl font-bold">4</h2>
  <span className="text-sm md:text-base opacity-90">نشطين</span>
</div>





        </div> 







           {/* Quick Actions */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-[#1E293B] mb-4">إجراءات سريعة</h2>
             <div className="grid grid-cols-6 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                const isShiftClosing = action.label === 'غلق الوردية';
                const isSalesInvoice = action.label === 'فاتورة بيع';
                const isPurchaseInvoice = action.label === 'فاتورة شراء';
                const isCashPermission = action.label === 'إذن صرف نقدية';
                const isPriceQuote = action.label === 'عرض سعر جديد';
                const isInventoryAudit = action.label === 'جرد المخزن';

                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      if (isShiftClosing) setShowShiftClosingModal(true);
                      else if (isSalesInvoice) setShowSalesInvoiceModal(true);
                      else if (isPurchaseInvoice) setShowPurchaseInvoiceModal(true);
                      else if (isCashPermission) setShowCashPermissionModal(true);
                      else if (isPriceQuote) setShowPriceQuoteModal(true);
                      else if (isInventoryAudit) setShowInventoryAuditModal(true);
                    }}
                    className="group bg-gradient-to-br from-gray-50 to-slate-50 hover:from-slate-50 hover:to-slate-100 border-2 border-gray-200 hover:border-[#3B82F6] rounded-xl p-6 transition-all hover:shadow-lg hover:-translate-y-1"
                  >
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 mx-auto transition-transform group-hover:scale-110"
                      style={{ backgroundColor: action.color }}
                    >
                      <Icon size={28} className="text-white" />
                    </div>
                    <div className="text-sm font-bold text-gray-800 text-center">{action.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Charts + Activity Feed */}
          <div className="grid grid-cols-3 gap-6">
            {/* Sales Chart */}
            <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-[#1E293B] mb-4">مبيعات آخر 7 أيام</h2>
              <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border border-gray-200">
                <div className="text-center text-gray-400">
                  <TrendingUp size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">الرسم البياني سيظهر هنا</p>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#1E293B]">آخر الأنشطة</h2>
                <button className="text-xs text-[#3B82F6] hover:text-[#2563EB] font-semibold">عرض الكل</button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${activity.color}15` }}
                      >
                        <Icon size={18} style={{ color: activity.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium leading-snug">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showShiftClosingModal && <ShiftClosingModal onClose={() => setShowShiftClosingModal(false)} />}
      {showSalesInvoiceModal && <SalesInvoiceModal onClose={() => setShowSalesInvoiceModal(false)} />}
      {showPurchaseInvoiceModal && <PurchaseInvoiceModal onClose={() => setShowPurchaseInvoiceModal(false)} />}
      {showCashPermissionModal && <CashPermissionModal onClose={() => setShowCashPermissionModal(false)} />}
      {showPriceQuoteModal && <PriceQuotationModal onClose={() => setShowPriceQuoteModal(false)} />}
      {showInventoryAuditModal && <InventoryAuditModal onClose={() => setShowInventoryAuditModal(false)} />}
    </div>
  );
}




























