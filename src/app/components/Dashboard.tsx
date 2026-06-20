import { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';
import { formatCurrency } from '../utils/currency';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
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
  DoorOpen,
  Lock,
  UserRound,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// Import all modals
import { ShiftClosingModal } from './ShiftClosingModal';
import { OpenShiftModal } from './OpenShiftModal';
import { SalesInvoiceModal } from './SalesInvoiceModal';
import { PurchaseInvoiceModal } from './PurchaseInvoiceModal';
import { CashPermissionModal } from './CashPermissionModal';
import { PriceQuotationModal } from './PriceQuotationModal';
import { InventoryAuditModal } from './InventoryAuditModal';

interface DashboardData {
  total_sales_today: number;
  total_cash_today: number;
  operations_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
  sales_chart: { date: string; total: number }[];
  recent_activities: {
    type: string;
    description: string;
    amount: number;
    payment: string;
    customer: string;
    cashier: string;
    time: string;
    date: string;
  }[];
  // ERP-DASH-001B: Monthly metrics
  total_sales_month: number;
  operations_count_month: number;
}

interface Debtor {
  id: number;
  name: string;
  phone: string;
  balance: number;
  // DASH-DEBTORS-001: real total debt (balance + installment debt)
  total_debt: number;
}

interface DueInstallment {
  id: string;
  customer_name: string;
  invoice_number: string;
  remaining_amount: number;
  due_date: string;
}

interface DashboardProps {
  onStartDemo?: () => void;
}

export function Dashboard({ onStartDemo }: DashboardProps = {}) {
  const { t } = useTranslation();

  // Modals state
  const [showShiftClosingModal, setShowShiftClosingModal] = useState(false);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showSalesInvoiceModal, setShowSalesInvoiceModal] = useState(false);
  const [showPurchaseInvoiceModal, setShowPurchaseInvoiceModal] = useState(false);
  const [showCashPermissionModal, setShowCashPermissionModal] = useState(false);
  const [showPriceQuoteModal, setShowPriceQuoteModal] = useState(false);
  const [showInventoryAuditModal, setShowInventoryAuditModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Dashboard data state
  const [data, setData] = useState<DashboardData | null>(null);
  
  // ERP-DASH-001B: Additional KPI data
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [dueInstallments, setDueInstallments] = useState<DueInstallment[]>([]);
  
  // Shift status state - REAL DATA from API
  const [shiftStatus, setShiftStatus] = useState<'open' | 'closed' | 'loading'>('loading');
  const [currentShift, setCurrentShift] = useState<{id: number; shift_date: string; starting_cash: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get current user data
  const savedUser = localStorage.getItem('erp_user');
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const displayName = currentUser?.first_name || currentUser?.username || 'المستخدم';

  const fetchDashboard = async () => {
    try {
      const res = await apiClient.get('/dashboard/');
      setData(res.data);
    } catch {
      setError(t('errors.loadFailed'));
    }
  };

  // ERP-DASH-001B: Fetch customers with debt
  const fetchDebtors = async () => {
    try {
      const res = await apiClient.get('/customers/debtors/');
      const debtorsData = Array.isArray(res.data) ? res.data : res.data.results || [];
      setDebtors(debtorsData.slice(0, 5)); // Show top 5
    } catch (err) {
      console.error('Error fetching debtors:', err);
    }
  };

  // ERP-DASH-001B: Fetch due installments
  const fetchDueInstallments = async () => {
    try {
      const res = await apiClient.get('/installments/');
      const allInstallments = Array.isArray(res.data) ? res.data : res.data.results || [];
      // Filter due installments (past due date and not paid)
      const today = new Date().toISOString().split('T')[0];
      const due = allInstallments.filter((inst: DueInstallment & { is_paid: boolean; due_date: string }) => {
        return inst.due_date <= today && !inst.is_paid && inst.remaining_amount > 0;
      }).slice(0, 5); // Show top 5
      setDueInstallments(due);
    } catch (err) {
      console.error('Error fetching installments:', err);
    }
  };

  // Fetch real shift status from API
  const fetchShiftStatus = async () => {
    try {
      setShiftStatus('loading');
      const res = await apiClient.get('/shifts/current/');
      setShiftStatus('open');
      setCurrentShift(res.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setShiftStatus('closed');
        setCurrentShift(null);
      } else {
        // On error, assume closed to allow opening new shift
        setShiftStatus('closed');
        setCurrentShift(null);
      }
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboard(),
        fetchShiftStatus(),
        fetchDebtors(),
        fetchDueInstallments(),
      ]);
      setLoading(false);
    };
    
    loadAllData();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboard();
      fetchShiftStatus();
      fetchDebtors();
      fetchDueInstallments();
    }, 30000);
    return () => clearInterval(interval);
  }, []);


  // Dynamic quick actions based on shift status
  const getQuickActions = () => {
    const baseActions = [
      { id: '1', label: 'فاتورة بيع', icon: ShoppingCart, color: '#3B82F6' },
      { id: '2', label: 'فاتورة شراء', icon: ShoppingBag, color: '#F59E0B' },
      { id: '3', label: 'إذن صرف نقدية', icon: Wallet, color: '#FBBF24' },
      { id: '4', label: 'عرض سعر جديد', icon: FileText, color: '#8B5CF6' },
      { id: '5', label: 'جرد المخزن', icon: Package, color: '#06B6D4' },
    ];
    
    // Add shift action based on current status
    if (shiftStatus === 'open') {
      baseActions.push({ id: '6', label: 'غلق الوردية', icon: Clock, color: '#EF4444' });
    } else {
      baseActions.push({ id: '6', label: 'فتح وردية', icon: DoorOpen, color: '#10B981' });
    }
    
    return baseActions;
  };

  const quickActions = getQuickActions();

  return (
    <div className="flex-1 h-screen overflow-hidden bg-background">
      {/* Top Navbar */}
      <div className="bg-card border-b border-border px-6 py-4">
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
  className={`w-full px-4 py-2.5 pr-12 border rounded-xl focus:outline-none focus:ring-2 bg-background text-foreground
    ${isRecording
      ? 'border-blue-500 focus:ring-blue-400'
      : 'border-input focus:ring-[#3B82F6]'}`}
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
            {/* Real Shift Status Badge */}
            {shiftStatus === 'loading' && (
              <div className="bg-muted border-2 border-muted-foreground/30 px-4 py-2 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                <span className="text-sm font-bold text-muted-foreground">جاري التحميل...</span>
              </div>
            )}
            {shiftStatus === 'open' && (
              <div className="bg-green-500/10 border-2 border-green-500 px-4 py-2 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold text-green-600">الوردية: مفتوحة</span>
              </div>
            )}
            {shiftStatus === 'closed' && (
              <div className="bg-red-500/10 border-2 border-red-500 px-4 py-2 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-bold text-red-600">الوردية: مغلقة</span>
              </div>
            )}
            <div className="flex items-center gap-3 bg-muted px-4 py-2 rounded-xl">
              <div className="text-left">
                <div className="text-sm font-bold text-card-foreground">{displayName}</div>
                <div className="text-xs text-muted-foreground">
                  {currentUser?.role === 'مدير' ? 'مدير النظام' : 'كاشير'}
                </div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-[#3B82F6] to-[#1E293B] rounded-full flex items-center justify-center text-white font-bold">
                {displayName.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - ERP-DASH-001B + ERP-DASH-001C Theme Support */}
      <div className="h-[calc(100vh-80px)] overflow-y-auto bg-background p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Loading & Error States */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">جاري تحميل البيانات...</div>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-center p-8">{error}</div>
          )}

          {!loading && !error && (
            <>
              {/* Welcome Section - Reference Style */}
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">مرحباً، أهلاً {displayName} 👋</h1>
                  <p className="text-muted-foreground text-sm">نظرة شاملة على أداء مؤسستك وإحصائيات اليوم</p>
                </div>
                {onStartDemo && (
                  <button
                    type="button"
                    onClick={onStartDemo}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)' }}
                  >
                    🚀 ابدأ العرض الذكي
                  </button>
                )}
              </div>

              {/* ===== ROW 1: PRIMARY KPIs (Theme-Aware Cards) ===== */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1 - Today's Sales (Green accent) */}
                <div data-demo-id="dashboard-sales-card" className="bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <ShoppingCart className="text-green-600" size={24} />
                    </div>
                    <div className="flex items-center text-green-600 text-xs font-medium">
                      <ArrowUpRight size={14} className="ml-1" />
                      +{data?.operations_count || 0} عملية
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">مبيعات اليوم</p>
                  <h2 className="text-2xl font-bold text-card-foreground">{formatCurrency(data?.total_sales_today)}</h2>
                </div>

                {/* Card 2 - Cash Collections (Blue accent) */}
                <div data-demo-id="dashboard-revenue-card" className="bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <CreditCard className="text-blue-600" size={24} />
                    </div>
                    <div className="flex items-center text-blue-600 text-xs font-medium">
                      <span>كاش + بطاقات</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">التحصيلات الفورية</p>
                  <h2 className="text-2xl font-bold text-card-foreground">{formatCurrency(data?.total_cash_today)}</h2>
                </div>

                {/* Card 3 - Monthly Sales (Indigo accent) */}
                <div data-demo-id="dashboard-monthly-card" className="bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <TrendingUp className="text-indigo-600" size={24} />
                    </div>
                    <div className="flex items-center text-indigo-600 text-xs font-medium">
                      <span>{data?.operations_count_month || 0} عملية</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">مبيعات الشهر</p>
                  <h2 className="text-2xl font-bold text-card-foreground">{formatCurrency(data?.total_sales_month)}</h2>
                </div>

                {/* Card 4 - Operations Count (Purple accent) */}
                <div data-demo-id="dashboard-ops-card" className="bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Users className="text-purple-600" size={24} />
                    </div>
                    <div className="flex items-center text-purple-600 text-xs font-medium">
                      <span>اليوم</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">عدد العمليات</p>
                  <h2 className="text-2xl font-bold text-card-foreground">{data?.operations_count || 0}</h2>
                </div>
              </div>

              {/* ===== ROW 2: INVENTORY ALERTS ===== */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card - Low Stock (Orange accent) */}
                <div data-demo-id="dashboard-stock-alert" className="bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <Bell className="text-orange-600" size={28} />
                    </div>
                    <div className="flex-1">
                      <p className="text-muted-foreground text-sm">مخزون منخفض</p>
                      <h2 className="text-3xl font-bold text-card-foreground">{data?.low_stock_count || 0}</h2>
                      <p className="text-orange-600 text-xs mt-1">منتجات تحت الحد الأدنى</p>
                    </div>
                  </div>
                </div>

                {/* Card - Out of Stock (Red accent) */}
                <div className="bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <AlertTriangle className="text-red-600" size={28} />
                    </div>
                    <div className="flex-1">
                      <p className="text-muted-foreground text-sm">نفد من المخزون</p>
                      <h2 className="text-3xl font-bold text-card-foreground">{data?.out_of_stock_count || 0}</h2>
                      <p className="text-red-600 text-xs mt-1">منتجات منعدمة - يحتاج تعبئة</p>
                    </div>
                  </div>
                </div>
              </div> 







              {/* ===== ROW 3: CREDIT & INSTALLMENTS ===== */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card - Customers with Debt (Red accent) */}
                <div className="bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <UserRound className="text-red-600" size={28} />
                    </div>
                    <div className="flex-1">
                      <p className="text-muted-foreground text-sm">عملاء عليهم ديون</p>
                      <h2 className="text-3xl font-bold text-card-foreground">{debtors.length}</h2>
                    </div>
                  </div>
                  {debtors.length > 0 ? (
                    <div className="space-y-2">
                      {debtors.slice(0, 3).map((debtor) => (
                        <div key={debtor.id} className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg">
                          <span className="text-sm font-medium text-card-foreground">{debtor.name}</span>
                          <span className="text-sm font-bold text-red-600">{formatCurrency(debtor.total_debt)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-2">لا يوجد عملاء مديونين</p>
                  )}
                </div>

                {/* Card - Due Installments (Yellow accent) */}
                <div className="bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                      <Calendar className="text-yellow-600" size={28} />
                    </div>
                    <div className="flex-1">
                      <p className="text-muted-foreground text-sm">أقساط مستحقة</p>
                      <h2 className="text-3xl font-bold text-card-foreground">{dueInstallments.length}</h2>
                    </div>
                  </div>
                  {dueInstallments.length > 0 ? (
                    <div className="space-y-2">
                      {dueInstallments.slice(0, 3).map((inst) => (
                        <div key={inst.id} className="flex items-center justify-between p-2 bg-yellow-500/10 rounded-lg">
                          <div className="text-sm">
                            <span className="font-medium text-card-foreground">{inst.customer_name}</span>
                            <span className="text-xs text-muted-foreground block">فاتورة {inst.invoice_number}</span>
                          </div>
                          <span className="text-sm font-bold text-yellow-600">{formatCurrency(inst.remaining_amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-2">لا يوجد أقساط مستحقة</p>
                  )}
                </div>
              </div>

              {/* ===== QUICK ACTIONS ===== */}
              <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
                <h2 className="text-lg font-bold text-card-foreground mb-4">إجراءات سريعة</h2>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    const isShiftClosing = action.label === 'غلق الوردية';
                    const isShiftOpening = action.label === 'فتح وردية';
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
                          else if (isShiftOpening) setShowOpenShiftModal(true);
                          else if (isSalesInvoice) setShowSalesInvoiceModal(true);
                          else if (isPurchaseInvoice) setShowPurchaseInvoiceModal(true);
                          else if (isCashPermission) setShowCashPermissionModal(true);
                          else if (isPriceQuote) setShowPriceQuoteModal(true);
                          else if (isInventoryAudit) setShowInventoryAuditModal(true);
                        }}
                        className="group bg-secondary hover:bg-secondary/80 border border-border hover:border-border/80 rounded-xl p-4 transition-all hover:shadow-sm"
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center mb-2 mx-auto"
                          style={{ backgroundColor: action.color + '20' }}
                        >
                          <Icon size={20} style={{ color: action.color }} />
                        </div>
                        <div className="text-xs font-medium text-card-foreground text-center">{action.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ===== ROW 4: CHARTS & ACTIVITY ===== */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Chart */}
                <div className="lg:col-span-2 bg-card rounded-2xl shadow-sm border border-border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-card-foreground">مبيعات آخر 7 أيام</h2>
                      <p className="text-muted-foreground text-sm">تحليل يومي للمبيعات</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp size={16} className="text-green-600" />
                      <span>محدث لحظياً</span>
                    </div>
                  </div>
                  <div className="h-64 flex items-end gap-3 px-4">
                    {data?.sales_chart.map((day, i) => {
                      const max = Math.max(...(data?.sales_chart?.map(d => d.total) || [1]), 1);
                      const height = max > 0 ? (day.total / max) * 100 : 0;
                      const isToday = i === 6;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <span className="text-xs font-medium text-card-foreground">
                            {day.total > 0 ? day.total.toFixed(0) : ''}
                          </span>
                          <div
                            className={`w-full rounded-t-lg transition-all hover:opacity-80 ${
                              isToday ? 'bg-[#3B82F6]' : 'bg-muted hover:bg-muted-foreground/30'
                            }`}
                            style={{ height: `${Math.max(height, 4)}%`, minHeight: '4px' }}
                          />
                          <span className={`text-xs ${isToday ? 'text-[#3B82F6] font-medium' : 'text-muted-foreground'}`}>
                            {day.date}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-card-foreground">آخر الأنشطة</h2>
                      <p className="text-muted-foreground text-sm">عمليات اليوم</p>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {data?.recent_activities.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                          <ShoppingCart size={20} className="text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground text-sm">لا توجد أنشطة اليوم</p>
                      </div>
                    ) : (
                      data?.recent_activities.map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-secondary/50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-500/10">
                            <ShoppingCart size={18} className="text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-card-foreground">{activity.description}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {activity.customer} • {activity.payment === 'cash' ? 'كاش' : 'آجل'}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-green-600 text-sm">{formatCurrency(activity.amount)}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showShiftClosingModal && (
        <ShiftClosingModal 
          onClose={() => {
            setShowShiftClosingModal(false);
            fetchShiftStatus(); // Refresh status after close
          }} 
        />
      )}
      {showOpenShiftModal && (
        <OpenShiftModal 
          onClose={() => setShowOpenShiftModal(false)}
          onSuccess={() => {
            fetchShiftStatus(); // Refresh status after open
          }}
        />
      )}
      {showSalesInvoiceModal && <SalesInvoiceModal onClose={() => setShowSalesInvoiceModal(false)} />}
      {showPurchaseInvoiceModal && <PurchaseInvoiceModal onClose={() => setShowPurchaseInvoiceModal(false)} />}
      {showCashPermissionModal && <CashPermissionModal onClose={() => setShowCashPermissionModal(false)} />}
      {showPriceQuoteModal && <PriceQuotationModal onClose={() => setShowPriceQuoteModal(false)} />}
      {showInventoryAuditModal && <InventoryAuditModal onClose={() => setShowInventoryAuditModal(false)} />}
    </div>
  );
}




























