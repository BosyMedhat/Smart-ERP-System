import { useState, useEffect } from 'react';
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
    } catch (e) { alert('حدث خطأ أثناء التحصيل'); }
  };

  if (loading) return <div className="p-20 text-center text-gray-400 font-bold">جاري التحميل...</div>;

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 space-y-6 text-right font-sans" dir="rtl">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1E293B] mb-1">لوحة المبيعات الآجلة</h1>
        <p className="text-gray-500 text-sm">تتبع ديون العملاء وعمليات التحصيل</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
          <div className="text-sm text-gray-500 mb-1">إجمالي الديون</div>
          <div className="text-3xl font-bold text-red-600">{formatCurrency(totalDebt)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">عدد العملاء المديونين</div>
          <div className="text-3xl font-bold text-orange-500">{customers.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">عمليات آجل مسجلة</div>
          <div className="text-3xl font-bold text-blue-600">{creditSales.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[{ key: 'debtors', label: '👥 العملاء المديونون' }, { key: 'history', label: '📋 سجل المبيعات الآجلة' }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`px-5 py-2.5 font-bold text-sm rounded-t-xl transition-colors ${activeTab === tab.key ? 'bg-white border-b-2 border-[#3B82F6] text-[#3B82F6]' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Debtors */}
      {activeTab === 'debtors' && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="ابحث بالاسم أو الهاتف..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
          </div>

          {filteredCustomers.length === 0 && (
            <div className="bg-white rounded-2xl p-16 text-center text-gray-400">
              <div className="text-5xl mb-3">✅</div>
              <div className="font-bold">لا توجد ديون مستحقة</div>
            </div>
          )}

          {filteredCustomers.map(c => (
            <div key={c.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition">
              <div>
                <div className="font-bold text-gray-800 text-lg">{c.name}</div>
                <div className="flex gap-3 mt-1">
                  {c.phone && <span className="flex items-center gap-1 text-sm text-gray-500"><Phone size={13} />{c.phone}</span>}
                  {c.email && <span className="flex items-center gap-1 text-sm text-gray-500"><Mail size={13} />{c.email}</span>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-gray-400">الدين المستحق</div>
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs font-bold text-gray-600 uppercase">
                <tr>
                  <th className="px-4 py-3 text-right">رقم الفاتورة</th>
                  <th className="px-4 py-3 text-right">العميل</th>
                  <th className="px-4 py-3 text-right">المبلغ</th>
                  <th className="px-4 py-3 text-right">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {creditSales.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-gray-600">#{s.invoice_number}</td>
                    <td className="px-4 py-3 font-bold text-gray-800">
                      {customers.find(c => c.id === s.customer)?.name || `عميل #${s.customer}`}
                    </td>
                    <td className="px-4 py-3 font-bold text-red-600">{formatCurrency(s.final_amount)}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{new Date(s.created_at).toLocaleDateString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {creditSales.length === 0 && <div className="py-16 text-center text-gray-400">لا توجد مبيعات آجلة مسجلة</div>}
          </div>
        </div>
      )}

      {/* Collect Modal */}
      {showCollectModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="bg-green-600 p-5 text-white flex justify-between items-center rounded-t-2xl">
              <h2 className="text-lg font-bold flex items-center gap-2"><TrendingDown size={20} /> تحصيل دين</h2>
              <button onClick={() => { setShowCollectModal(false); setCollectAmount(''); }}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <div className="font-bold text-gray-800 text-lg">{selectedCustomer.name}</div>
                <div className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(selectedCustomer.balance)}</div>
                <div className="text-xs text-gray-500 mt-1">الدين الحالي</div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">المبلغ المحصّل (ج.م)</label>
                <input type="number" min="0"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-2xl font-bold focus:outline-none focus:border-green-400"
                  value={collectAmount} onChange={e => setCollectAmount(e.target.value)} placeholder="0" />
              </div>
              {collectAmount && (
                <div className="bg-green-50 rounded-xl p-3 text-center text-sm">
                  <span className="text-gray-600">المتبقي بعد التحصيل: </span>
                  <span className="font-bold text-green-700">
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
