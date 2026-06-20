import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { notify } from '@/lib/notifications';
import { DollarSign, Phone, Mail, Search, X, TrendingDown } from 'lucide-react';
import apiClient from '../../api/axiosConfig';
import { formatCurrency } from '../utils/currency';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  balance: number;
}

interface CreditSale {
  id: number;
  invoice_number: string;
  customer: number;
  final_amount: number;
  created_at: string;
}

export function CreditDashboard() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [creditSales, setCreditSales] = useState<CreditSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'debtors' | 'history'>('debtors');

  const fetchData = async () => {
    try {
      const [custRes, salesRes] = await Promise.all([
        apiClient.get('/customers/'),
        apiClient.get('/sales/?payment_type=credit'),
      ]);
      const allCustomers = Array.isArray(custRes.data) ? custRes.data : custRes.data.results ?? [];
      setCustomers(allCustomers.filter((c: Customer) => Number(c.balance) > 0));
      const sales = Array.isArray(salesRes.data) ? salesRes.data : salesRes.data.results ?? [];
      setCreditSales(sales.filter((s: CreditSale & { payment_type: string }) => s.payment_type === 'credit'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone || '').includes(searchQuery)
  );

  const totalDebt = customers.reduce((sum, c) => sum + Number(c.balance), 0);

  const handleCollect = async () => {
    if (!selectedCustomer || !collectAmount) return;
    try {
      await apiClient.post(`/customers/${selectedCustomer.id}/collect/`, {
        amount: parseFloat(collectAmount)
      });
      await fetchData();
      setShowCollectModal(false);
      setCollectAmount('');
      setSelectedCustomer(null);
    } catch (e) { notify.error('حدث خطأ أثناء التحصيل'); }
  };

  if (loading) return <div className="p-20 text-center text-muted-foreground font-bold">{t('common.loading')}</div>;

  return (
    <div className="h-full overflow-y-auto bg-background p-6 space-y-6 text-right font-sans" dir="rtl">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-card-foreground mb-1">لوحة المبيعات الآجلة</h1>
        <p className="text-muted-foreground text-sm">تتبع ديون العملاء وعمليات التحصيل</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-red-200/50">
          <div className="text-sm text-muted-foreground mb-1">إجمالي الديون</div>
          <div className="text-3xl font-bold text-red-600">{formatCurrency(totalDebt)}</div>
        </div>
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <div className="text-sm text-muted-foreground mb-1">عدد العملاء المديونين</div>
          <div className="text-3xl font-bold text-orange-500">{customers.length}</div>
        </div>
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <div className="text-sm text-muted-foreground mb-1">عمليات آجل مسجلة</div>
          <div className="text-3xl font-bold text-blue-600">{creditSales.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {[{ key: 'debtors', label: '👥 العملاء المديونون' }, { key: 'history', label: '📋 سجل المبيعات الآجلة' }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`px-5 py-2.5 font-bold text-sm rounded-t-xl transition-colors ${activeTab === tab.key ? 'bg-card border-b-2 border-[#3B82F6] text-[#3B82F6]' : 'text-muted-foreground hover:text-card-foreground'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Debtors */}
      {activeTab === 'debtors' && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="ابحث بالاسم أو الهاتف..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-2.5 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-background text-foreground" />
          </div>

          {filteredCustomers.length === 0 && (
            <div className="bg-card rounded-2xl p-16 text-center text-muted-foreground">
              <div className="text-5xl mb-3">✅</div>
              <div className="font-bold">لا توجد ديون مستحقة</div>
            </div>
          )}

          {filteredCustomers.map(c => (
            <div key={c.id} className="bg-card rounded-2xl p-5 shadow-sm border border-border flex items-center justify-between hover:shadow-md transition">
              <div>
                <div className="font-bold text-card-foreground text-lg">{c.name}</div>
                <div className="flex gap-3 mt-1">
                  {c.phone && <span className="flex items-center gap-1 text-sm text-muted-foreground"><Phone size={13} />{c.phone}</span>}
                  {c.email && <span className="flex items-center gap-1 text-sm text-muted-foreground"><Mail size={13} />{c.email}</span>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground/60">الدين المستحق</div>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(c.balance)}</div>
                </div>
                <button
                  onClick={() => { setSelectedCustomer(c); setShowCollectModal(true); }}
                  className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center gap-2 transition shadow">
                  <DollarSign size={16} /> تحصيل
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted text-xs font-bold text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 text-right">رقم الفاتورة</th>
                  <th className="px-4 py-3 text-right">العميل</th>
                  <th className="px-4 py-3 text-right">{t('sales.amount')}</th>
                  <th className="px-4 py-3 text-right">{t('common.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {creditSales.map(s => (
                  <tr key={s.id} className="hover:bg-muted/50 transition">
                    <td className="px-4 py-3 font-mono text-muted-foreground">#{s.invoice_number}</td>
                    <td className="px-4 py-3 font-bold text-card-foreground">
                      {customers.find(c => c.id === s.customer)?.name || `عميل #${s.customer}`}
                    </td>
                    <td className="px-4 py-3 font-bold text-red-600">{formatCurrency(s.final_amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">{new Date(s.created_at).toLocaleDateString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {creditSales.length === 0 && <div className="py-16 text-center text-muted-foreground">لا توجد مبيعات آجلة مسجلة</div>}
          </div>
        </div>
      )}

      {/* Collect Modal */}
      {showCollectModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm" dir="rtl">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border">
            <div className="bg-green-600 p-5 text-white flex justify-between items-center rounded-t-2xl">
              <h2 className="text-lg font-bold flex items-center gap-2"><TrendingDown size={20} /> تحصيل دين</h2>
              <button onClick={() => { setShowCollectModal(false); setCollectAmount(''); }}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-red-500/10 rounded-xl p-4 text-center border border-red-200/50">
                <div className="font-bold text-card-foreground text-lg">{selectedCustomer.name}</div>
                <div className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(selectedCustomer.balance)}</div>
                <div className="text-xs text-muted-foreground mt-1">الدين الحالي</div>
              </div>
              <div>
                <label className="block text-sm font-bold text-card-foreground mb-2">المبلغ المحصّل (ج.م)</label>
                <input type="number" min="0"
                  className="w-full px-4 py-3 border-2 border-input rounded-xl text-center text-2xl font-bold focus:outline-none focus:border-green-400 bg-background text-foreground"
                  value={collectAmount} onChange={e => setCollectAmount(e.target.value)} placeholder="0" />
              </div>
              {collectAmount && (
                <div className="bg-green-500/10 rounded-xl p-3 text-center text-sm border border-green-200/50">
                  <span className="text-muted-foreground">المتبقي بعد التحصيل: </span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(Math.max(0, Number(selectedCustomer.balance) - parseFloat(collectAmount)))}
                  </span>
                </div>
              )}
              <button onClick={handleCollect}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition">
                تأكيد التحصيل ✅
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
