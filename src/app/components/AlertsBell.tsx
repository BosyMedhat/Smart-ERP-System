import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, AlertTriangle, AlertCircle, Info,
         Package, CreditCard, Wallet } from 'lucide-react';
import apiClient from '../../api/axiosConfig';

/* ─── Types ────────────────────────────────── */
interface AlertItem {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  count: number;
  data: any[];
}

interface AlertsResponse {
  total: number;
  alerts: AlertItem[];
  checked_at: string;
}

/* ─── Config ───────────────────────────────── */
const SEVERITY_CONFIG = {
  critical: {
    color:  'text-red-600',
    bg:     'bg-red-50 border-red-200',
    badge:  'bg-red-500',
    icon:   AlertCircle,
  },
  warning: {
    color:  'text-orange-600',
    bg:     'bg-orange-50 border-orange-200',
    badge:  'bg-orange-500',
    icon:   AlertTriangle,
  },
  info: {
    color:  'text-blue-600',
    bg:     'bg-blue-50 border-blue-200',
    badge:  'bg-blue-500',
    icon:   Info,
  },
};

const TYPE_ICONS: Record<string, any> = {
  out_of_stock:          Package,
  low_stock:             Package,
  overdue_installment:   CreditCard,
  due_today_installment: CreditCard,
  low_treasury:          Wallet,
  negative_treasury:     Wallet,
};

/* ─── Single Alert Card ────────────────────── */
function AlertCard({ alert }: { alert: AlertItem }) {
  const cfg  = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info;
  const Icon = TYPE_ICONS[alert.type] ?? AlertTriangle;
  const SevIcon = cfg.icon;

  return (
    <div className={`border rounded-xl p-3 ${cfg.bg} mb-2`}>
      <div className="flex items-start gap-2">
        <div className={`mt-0.5 ${cfg.color}`}>
          <SevIcon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
            <p className={`text-sm font-semibold ${cfg.color}`}>
              {alert.title}
            </p>
          </div>
          <p className="text-xs text-gray-600">{alert.message}</p>

          {/* تفاصيل أول 3 عناصر */}
          {alert.data && alert.data.length > 0 && (
            <div className="mt-2 space-y-1">
              {alert.data.slice(0, 3).map((item, i) => (
                <div key={i}
                  className="text-xs text-gray-500 bg-white/60 rounded px-2 py-1">
                  {alert.type.includes('stock') && (
                    <span>{item.name} — متبقي: {item.current_stock}</span>
                  )}
                  {alert.type.includes('installment') && (
                    <span>
                      {item.customer || 'عميل'} — {item.remaining} ج.م
                      {item.days_overdue && ` (${item.days_overdue} يوم)`}
                    </span>
                  )}
                  {alert.type.includes('treasury') && (
                    <span>{item.display_name} — {item.balance} ج.م</span>
                  )}
                </div>
              ))}
              {alert.data.length > 3 && (
                <p className="text-xs text-gray-400 text-center">
                  +{alert.data.length - 3} أخرى
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ───────────────────────── */
export default function AlertsBell() {
  const [data, setData]       = useState<AlertsResponse | null>(null);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords]   = useState<{ top: number; left: number } | null>(null);
  const dropdownRef           = useRef<HTMLDivElement>(null);
  const bellRef               = useRef<HTMLButtonElement>(null);
  const popupRef              = useRef<HTMLDivElement>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/alerts/');
      setData(res.data);
    } catch {
      // لا نوقف النظام
    } finally {
      setLoading(false);
    }
  }, []);

  // تحميل أولي + polling كل 5 دقائق
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // إغلاق عند الضغط خارج الـ dropdown (مع مراعاة أن الـ popup مُصيَّر عبر portal)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideBell = dropdownRef.current?.contains(target);
      const insidePopup = popupRef.current?.contains(target);
      if (!insideBell && !insidePopup) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // حساب موقع الـ popup عند الفتح + إعادة الحساب عند تغيير حجم النافذة
  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = bellRef.current?.getBoundingClientRect();
      if (!rect) return;
      const popupWidth = 320; // w-80
      const dropdownHeight = 480; // max expected height

      // ── Smart vertical positioning ──
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      let topPos: number;
      if (spaceBelow >= dropdownHeight) {
        // مساحة كافية أسفل الجرس → افتح للأسفل
        topPos = rect.bottom + 8;
      } else if (spaceAbove >= dropdownHeight) {
        // لا توجد مساحة أسفل → افتح للأعلى
        topPos = rect.top - dropdownHeight - 8;
      } else {
        // لا يوجد مكان كافٍ → وسّطه عمودياً
        topPos = Math.max(8, (window.innerHeight - dropdownHeight) / 2);
      }

      // ── Horizontal positioning (يخرج بجوار Sidebar اليمنى عند RTL) ──
      let left = rect.right + 8;
      if (left + popupWidth > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - popupWidth - 8);
      }

      setCoords({ top: topPos, left });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  const totalAlerts    = data?.total ?? 0;
  const criticalCount  = data?.alerts.filter(a => a.severity === 'critical').length ?? 0;
  const badgeColor     = criticalCount > 0 ? 'bg-red-500' : 'bg-orange-400';

  return (
    <div className="relative" ref={dropdownRef} dir="rtl">

      {/* Bell Button */}
      <button
        ref={bellRef}
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-white/10 transition-colors">
        <Bell className={`w-5 h-5 ${totalAlerts > 0 ? 'text-yellow-300' : 'text-white/60'}`} />

        {/* Badge */}
        {totalAlerts > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 ${badgeColor}
            text-white text-[10px] font-bold rounded-full
            min-w-[18px] h-[18px] flex items-center justify-center px-1`}>
            {totalAlerts > 9 ? '9+' : totalAlerts}
          </span>
        )}
      </button>

      {/* Dropdown — مُصيَّر عبر portal لتجنّب clipping من Sidebar */}
      {open && coords && createPortal(
        <div
          ref={popupRef}
          dir="rtl"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            zIndex: 9999,
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
          className="w-80 bg-white rounded-2xl shadow-2xl border border-gray-200">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
            border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-gray-800 text-sm">
                التنبيهات
              </span>
              {totalAlerts > 0 && (
                <span className={`${badgeColor} text-white text-xs
                  font-bold px-2 py-0.5 rounded-full`}>
                  {totalAlerts}
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto p-3">
            {loading && !data ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                جاري التحميل...
              </div>
            ) : totalAlerts === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-emerald-100 rounded-full
                  flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-gray-600">
                  كل شيء على ما يرام
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  لا توجد تنبيهات حالياً
                </p>
              </div>
            ) : (
              data?.alerts.map((alert, i) => (
                <AlertCard key={i} alert={alert} />
              ))
            )}
          </div>

          {/* Footer */}
          {data && (
            <div className="px-4 py-2 border-t bg-gray-50
              flex items-center justify-between">
              <span className="text-xs text-gray-400">
                آخر تحديث: {new Date(data.checked_at).toLocaleTimeString('ar-EG')}
              </span>
              <button onClick={fetchAlerts}
                className="text-xs text-blue-500 hover:text-blue-700 font-medium">
                تحديث
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
