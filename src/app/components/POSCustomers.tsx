import { useEffect, useMemo, useState } from 'react';
import { Users, Phone, Search, ShoppingBag, Wallet } from 'lucide-react';
import apiClient from '../../api/axiosConfig';

interface POSCustomer {
  id: number | string;
  name: string;
  phone?: string;
  email?: string;
  balance?: number;
  sales_count?: number;
  total_purchases?: number;
  created_at?: string;
}

export default function POSCustomers() {
  const [customers, setCustomers] = useState<POSCustomer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    const fetchCustomers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get('/customers/');
        if (!mounted) return;
        const data = Array.isArray(response.data)
          ? response.data
          : (response.data?.results ?? []);
        setCustomers(data);
      } catch (err: any) {
        if (!mounted) return;
        setError('تعذر تحميل بيانات العملاء. حاول مرة أخرى.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchCustomers();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [customers, query]);

  return (
    <div
      dir="rtl"
      className="flex-1 p-6 overflow-auto"
      style={{ fontFamily: 'Cairo, sans-serif' }}
    >
      {/* Header */}
      <div data-demo-id="customers-header" className="bg-card rounded-2xl shadow p-5 mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Users className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-card-foreground">عملاء نقطة البيع</h1>
            <p className="text-sm text-muted-foreground">
              قائمة العملاء المسجلين من خلال نقطة البيع (CRM)
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <span>الإجمالي:</span>
          <span className="font-semibold text-card-foreground">{customers.length}</span>
        </div>
      </div>

      {/* Search */}
      <div data-demo-id="customers-search" className="bg-card rounded-2xl shadow p-4 mb-5">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute top-1/2 -translate-y-1/2 right-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم أو رقم الهاتف..."
            className="w-full bg-muted border border-border rounded-xl py-2.5 pr-10 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
          />
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="bg-card rounded-2xl shadow p-10 text-center text-muted-foreground">
          جاري التحميل...
        </div>
      )}

      {!loading && error && (
        <div className="bg-card rounded-2xl shadow p-10 text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="bg-card rounded-2xl shadow p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-muted-foreground font-semibold">لا يوجد عملاء حالياً</p>
          <p className="text-sm text-gray-400 mt-1">
            سيظهر هنا العملاء بمجرد تسجيلهم من نقطة البيع
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div data-demo-id="customers-list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const purchases = c.sales_count ?? c.total_purchases ?? 0;
            const balance = typeof c.balance === 'number' ? c.balance : null;
            return (
              <div
                key={c.id}
                className="bg-card rounded-2xl shadow p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-card-foreground truncate">
                      {c.name || 'بدون اسم'}
                    </p>
                    {c.phone ? (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="w-3.5 h-3.5" />
                        <span dir="ltr">{c.phone}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5">لا يوجد رقم هاتف</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="bg-muted rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>عدد المشتريات</span>
                    </div>
                    <p className="font-bold text-card-foreground text-sm">{purchases}</p>
                  </div>
                  <div className="bg-muted rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                      <Wallet className="w-3.5 h-3.5" />
                      <span>الرصيد المستحق</span>
                    </div>
                    <p
                      className={`font-bold text-sm ${
                        balance && balance > 0 ? 'text-red-600' : 'text-card-foreground'
                      }`}
                    >
                      {balance !== null ? `${balance} ج.م` : '—'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    // Placeholder for future CRM detail screen
                  }}
                  className="mt-1 w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold py-2 rounded-xl transition-colors"
                >
                  عرض التفاصيل
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

