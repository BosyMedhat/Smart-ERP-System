import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/axiosConfig';
import {
  Shield, Search, RefreshCw,
  LogIn, LogOut, Plus, Edit, Trash2,
  Download, Eye, ChevronLeft, ChevronRight
} from 'lucide-react';

/* ─── Types ───────────────────────────────── */
interface AuditEntry {
  id: number;
  user: string;
  action: string;
  action_display: string;
  model_name: string;
  object_id: number | null;
  object_repr: string;
  changes: Record<string, { from: string; to: string }>;
  ip_address: string | null;
  extra_data: Record<string, unknown>;
  created_at: string;
}

interface AuditResponse {
  count: number;
  page: number;
  page_size: number;
  results: AuditEntry[];
}

/* ─── Action Badge ────────────────────────── */
const ACTION_CONFIG: Record<string, {
  label: string; color: string; icon: React.ComponentType<{ className?: string }>
}> = {
  CREATE:  { label: 'إنشاء',           color: 'bg-emerald-100 text-emerald-700', icon: Plus },
  UPDATE:  { label: 'تعديل',           color: 'bg-blue-500/10 text-blue-700',       icon: Edit },
  DELETE:  { label: 'حذف',             color: 'bg-red-500/10 text-red-700',         icon: Trash2 },
  LOGIN:   { label: 'دخول',            color: 'bg-purple-100 text-purple-700',   icon: LogIn },
  LOGOUT:  { label: 'خروج',            color: 'bg-muted text-muted-foreground',       icon: LogOut },
  EXPORT:  { label: 'تصدير',           color: 'bg-orange-100 text-orange-700',   icon: Download },
  VIEW:    { label: 'عرض',             color: 'bg-slate-100 text-slate-600',     icon: Eye },
};

const MODEL_NAMES: Record<string, string> = {
  Sale:          'فاتورة بيع',
  Product:       'منتج',
  Purchase:      'مشتريات',
  Expense:       'مصروف',
  Employee:      'موظف',
  PayrollRun:    'مسير رواتب',
  StoreSettings: 'إعدادات',
  Customer:      'عميل',
  Supplier:      'مورد',
  UserProfile:   'مستخدم',
  User:          'مستخدم',
};

function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_CONFIG[action] ?? {
    label: action, color: 'bg-muted text-muted-foreground', icon: Eye
  };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

/* ─── Changes Viewer ──────────────────── */
function ChangesViewer({ changes }: { changes: Record<string, { from: string; to: string }> }) {
  if (!changes || Object.keys(changes).length === 0) return null;
  return (
    <div className="mt-2 bg-muted rounded-lg p-2 text-xs space-y-1">
      {Object.entries(changes).map(([field, { from, to }]) => (
        <div key={field} className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-muted-foreground">{field}:</span>
          <span className="text-red-500 line-through">{from}</span>
          <span className="text-gray-400">&larr;</span>
          <span className="text-emerald-600 font-medium">{to}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ───────────────────── */
export default function AuditLog() {
  const [data, setData]         = useState<AuditResponse | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  // فلاتر
  const [search, setSearch]         = useState('');
  const [filterAction, setAction]   = useState('');
  const [filterModel, setModel]     = useState('');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [page, setPage]             = useState(1);
  const PAGE_SIZE = 50;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('page_size', String(PAGE_SIZE));
      if (search)       params.append('search',     search);
      if (filterAction) params.append('action',     filterAction);
      if (filterModel)  params.append('model_name', filterModel);
      if (dateFrom)     params.append('date_from',  dateFrom);
      if (dateTo)       params.append('date_to',    dateTo);

      const res = await apiClient.get(`/audit/?${params.toString()}`);
      setData(res.data);
    } catch {
      setError('فشل تحميل سجل التدقيق');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterAction, filterModel, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 1;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-slate-700 p-2 rounded-xl">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">سجل التدقيق</h1>
            <p className="text-sm text-muted-foreground">
              {data ? `${data.count} عملية مسجّلة` : ''}
            </p>
          </div>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 bg-card border border-border text-muted-foreground px-3 py-2 rounded-lg text-sm hover:bg-muted">
          <RefreshCw className="w-4 h-4" />
          تحديث
        </button>
      </div>

      {/* فلاتر */}
      <div className="bg-card rounded-xl border border-border p-4
        grid grid-cols-2 md:grid-cols-5 gap-3">

        {/* بحث */}
        <div className="relative col-span-2 md:col-span-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="بحث..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full border rounded-lg pr-9 pl-3 py-2 text-sm" />
        </div>

        {/* نوع العملية */}
        <select value={filterAction}
          onChange={e => { setAction(e.target.value); setPage(1); }}
          className="border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">كل العمليات</option>
          {Object.entries(ACTION_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>

        {/* النموذج */}
        <select value={filterModel}
          onChange={e => { setModel(e.target.value); setPage(1); }}
          className="border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">كل النماذج</option>
          {Object.entries(MODEL_NAMES).map(([key, val]) => (
            <option key={key} value={key}>{val}</option>
          ))}
        </select>

        {/* من تاريخ */}
        <input type="date" value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm" />

        {/* إلى تاريخ */}
        <input type="date" value={dateTo}
          onChange={e => { setDateTo(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm" />
      </div>

      {/* المحتوى */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          جاري تحميل السجل...
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-48 text-red-500">
          {error}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-right text-sm">
            <thead className="bg-muted border-b text-xs text-muted-foreground uppercase">
              <tr>
                <th className="py-3 px-4">الوقت</th>
                <th className="py-3 px-4">المستخدم</th>
                <th className="py-3 px-4">العملية</th>
                <th className="py-3 px-4">النموذج</th>
                <th className="py-3 px-4">التفاصيل</th>
                <th className="py-3 px-4">IP</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(!data || data.results.length === 0) ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    لا توجد سجلات
                  </td>
                </tr>
              ) : data.results.map(log => (
                <tr key={log.id} className="hover:bg-muted transition-colors">
                  <td className="py-3 px-4 text-muted-foreground whitespace-nowrap text-xs">
                    {log.created_at}
                  </td>
                  <td className="py-3 px-4 font-medium text-card-foreground">
                    {log.user}
                  </td>
                  <td className="py-3 px-4">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {MODEL_NAMES[log.model_name] ?? log.model_name}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                    {log.object_repr}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs font-mono">
                    {log.ip_address ?? '—'}
                  </td>
                  <td className="py-3 px-4">
                    {Object.keys(log.changes).length > 0 && (
                      <button
                        onClick={() => setExpanded(
                          expanded === log.id ? null : log.id
                        )}
                        className="text-blue-500 hover:text-blue-700 text-xs underline">
                        {expanded === log.id ? 'إخفاء' : 'التغييرات'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {expanded !== null && data.results.find(l => l.id === expanded) && (
                <tr className="bg-blue-50/50">
                  <td colSpan={7} className="px-4 pb-3">
                    <ChangesViewer changes={data.results.find(l => l.id === expanded)!.changes} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {data && data.count > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted">
              <p className="text-sm text-muted-foreground">
                صفحة {page} من {totalPages}
                <span className="mr-2 text-gray-400">
                  ({data.count} إجمالي)
                </span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded border disabled:opacity-40 hover:bg-card">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1 rounded border disabled:opacity-40 hover:bg-card">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

