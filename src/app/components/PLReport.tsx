import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/axiosConfig';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp, TrendingDown, DollarSign,
  ShoppingCart, Users, Receipt,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';

/* ─── Types ────────────────────────────────── */
interface RevenueData {
  cash: string; electronic: string;
  credit: string; installment: string;
  total: string; discount: string; tax: string;
}

interface ExpensesData {
  rent: string; electricity: string;
  maintenance: string; other: string;
  salaries: string; total: string;
}

interface PeriodData {
  period: { date_from: string; date_to: string };
  revenue: RevenueData;
  cogs: string;
  gross_profit: string;
  gross_margin: string;
  expenses: ExpensesData;
  net_profit: string;
  net_margin: string;
  stats: { total_invoices: number; avg_invoice: string };
}

interface PLData {
  current: PeriodData;
  previous: PeriodData;
  comparison: {
    revenue_change: string;
    cogs_change: string;
    gross_profit_change: string;
    expenses_change: string;
    net_profit_change: string;
  };
}

/* ─── Helpers ──────────────────────────────── */
function fmt(value: string): string {
  const n = parseFloat(value);
  return n.toLocaleString('ar-EG', { minimumFractionDigits: 2 });
}

function ChangeBadge({ value }: { value: string }) {
  const n = parseFloat(value);
  if (n > 0) return (
    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
      <ArrowUpRight className="w-3 h-3" />{value}%
    </span>
  );
  if (n < 0) return (
    <span className="inline-flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-50 px-2 py-0.5 rounded-full">
      <ArrowDownRight className="w-3 h-3" />{value}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-gray-400 text-xs font-semibold bg-gray-50 px-2 py-0.5 rounded-full">
      <Minus className="w-3 h-3" />0%
    </span>
  );
}

/* ─── KPI Card ─────────────────────────────── */
function KPICard({
  title, value, currency = true, change, icon: Icon, color
}: {
  title: string; value: string; currency?: boolean;
  change?: string; icon: any; color: string;
}) {
  const isPositive = parseFloat(value) >= 0;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && <ChangeBadge value={change} />}
      </div>
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${isPositive ? 'text-gray-800' : 'text-red-600'}`}>
        {fmt(value)} {currency && <span className="text-sm font-normal text-gray-400">ج.م</span>}
      </p>
    </div>
  );
}

/* ─── Row في جدول التفاصيل ─────────────────── */
function DetailRow({
  label, value, sub = false, bold = false, negative = false
}: {
  label: string; value: string;
  sub?: boolean; bold?: boolean; negative?: boolean;
}) {
  const n = parseFloat(value);
  const colorClass = negative
    ? 'text-red-600'
    : n < 0 ? 'text-red-600' : 'text-gray-800';

  return (
    <div className={`flex items-center justify-between py-2
      ${sub ? 'pr-4 text-sm text-gray-500' : ''}
      ${bold ? 'font-bold border-t border-gray-200 mt-1 pt-3' : ''}
    `}>
      <span>{label}</span>
      <span className={`font-mono ${colorClass} ${bold ? 'text-base' : 'text-sm'}`}>
        {fmt(value)} ج.م
      </span>
    </div>
  );
}

/* ─── Main Component ───────────────────────── */
export default function PLReport() {
  const { t } = useTranslation();
  const [data, setData]       = useState<PLData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // الفلاتر
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo, setDateTo]     = useState(todayStr);
  const [preset, setPreset]     = useState('month');

  const applyPreset = (p: string) => {
    const now = new Date();
    setPreset(p);
    if (p === 'today') {
      const d = now.toISOString().split('T')[0];
      setDateFrom(d); setDateTo(d);
    } else if (p === 'month') {
      setDateFrom(new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0]);
      setDateTo(now.toISOString().split('T')[0]);
    } else if (p === 'year') {
      setDateFrom(`${now.getFullYear()}-01-01`);
      setDateTo(now.toISOString().split('T')[0]);
    }
  };

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await apiClient.get(
        `/reports/pl/?date_from=${dateFrom}&date_to=${dateTo}`
      );
      setData(res.data);
    } catch {
      setError('فشل تحميل تقرير الأرباح والخسائر');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      {t('common.loading')}
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64 text-red-500">
      {error}
    </div>
  );

  if (!data) return null;

  const { current: c, comparison: cmp } = data;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6" dir="rtl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            تقرير الأرباح والخسائر
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {c.period.date_from} — {c.period.date_to}
          </p>
        </div>

        {/* Presets */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'today', label: 'اليوم' },
            { key: 'month', label: 'هذا الشهر' },
            { key: 'year',  label: 'هذا العام' },
            { key: 'custom', label: 'مخصص' },
          ].map(p => (
            <button key={p.key}
              onClick={() => applyPreset(p.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${preset === p.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date picker for custom */}
      {preset === 'custom' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4
          flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">من تاريخ</label>
            <input type="date" value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">إلى تاريخ</label>
            <input type="date" value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <button onClick={load}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            عرض التقرير
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="إجمالي الإيرادات"
          value={c.revenue.total}
          change={cmp.revenue_change}
          icon={DollarSign}
          color="bg-blue-500"
        />
        <KPICard
          title="مجمل الربح"
          value={c.gross_profit}
          change={cmp.gross_profit_change}
          icon={TrendingUp}
          color="bg-emerald-500"
        />
        <KPICard
          title="إجمالي المصروفات"
          value={c.expenses.total}
          change={cmp.expenses_change}
          icon={ShoppingCart}
          color="bg-orange-500"
        />
        <KPICard
          title="صافي الربح"
          value={c.net_profit}
          change={cmp.net_profit_change}
          icon={parseFloat(c.net_profit) >= 0 ? TrendingUp : TrendingDown}
          color={parseFloat(c.net_profit) >= 0 ? 'bg-emerald-600' : 'bg-red-500'}
        />
      </div>

      {/* هامش الربح */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'هامش مجمل الربح', value: c.gross_margin + '%' },
          { label: 'هامش صافي الربح', value: c.net_margin + '%' },
          { label: 'عدد الفواتير', value: String(c.stats.total_invoices) },
          { label: 'متوسط الفاتورة', value: c.stats.avg_invoice + ' ج.م' },
        ].map(item => (
          <div key={item.label}
            className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className="text-xl font-bold text-gray-800">{item.value}</p>
          </div>
        ))}
      </div>

      {/* التفاصيل */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* الإيرادات */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-700 mb-4 pb-2 border-b">
            الإيرادات
          </h3>
          <DetailRow label="مبيعات كاش"        value={c.revenue.cash}        sub />
          <DetailRow label="مبيعات إلكترونية"  value={c.revenue.electronic}  sub />
          <DetailRow label="مبيعات آجل"         value={c.revenue.credit}      sub />
          <DetailRow label="أقساط مستلمة"       value={c.revenue.installment} sub />
          <DetailRow label="إجمالي الإيرادات"   value={c.revenue.total}       bold />
          <div className="mt-3 pt-3 border-t">
            <DetailRow label="إجمالي الخصومات"  value={c.revenue.discount}    sub negative />
            <DetailRow label="إجمالي الضرائب"   value={c.revenue.tax}         sub />
          </div>
          <DetailRow label="تكلفة البضاعة (COGS)" value={c.cogs}             negative />
          <DetailRow label="مجمل الربح"          value={c.gross_profit}        bold />
        </div>

        {/* المصروفات */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-700 mb-4 pb-2 border-b">
            المصروفات التشغيلية
          </h3>
          <DetailRow label="إيجار"              value={c.expenses.rent}        sub negative />
          <DetailRow label="كهرباء"             value={c.expenses.electricity} sub negative />
          <DetailRow label="صيانة"              value={c.expenses.maintenance} sub negative />
          <DetailRow label="مصروفات أخرى"       value={c.expenses.other}       sub negative />
          <DetailRow label="رواتب الموظفين"     value={c.expenses.salaries}    sub negative />
          <DetailRow label="إجمالي المصروفات"   value={c.expenses.total}       bold negative />
          <div className="mt-6 pt-4 border-t-2 border-gray-300">
            <DetailRow
              label="صافي الربح النهائي"
              value={c.net_profit}
              bold
              negative={parseFloat(c.net_profit) < 0}
            />
          </div>
        </div>
      </div>

      {/* مقارنة بالفترة السابقة */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-700 mb-4 pb-2 border-b">
          مقارنة بالفترة السابقة
          <span className="text-xs text-gray-400 font-normal mr-2">
            ({data.previous.period.date_from} — {data.previous.period.date_to})
          </span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'الإيرادات',     change: cmp.revenue_change,
              prev: data.previous.revenue.total },
            { label: 'تكلفة البضاعة', change: cmp.cogs_change,
              prev: data.previous.cogs },
            { label: 'مجمل الربح',    change: cmp.gross_profit_change,
              prev: data.previous.gross_profit },
            { label: 'المصروفات',     change: cmp.expenses_change,
              prev: data.previous.expenses.total },
            { label: 'صافي الربح',    change: cmp.net_profit_change,
              prev: data.previous.net_profit },
          ].map(item => (
            <div key={item.label}
              className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-2">{item.label}</p>
              <ChangeBadge value={item.change} />
              <p className="text-xs text-gray-400 mt-2">
                سابق: {fmt(item.prev)} ج.م
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
