import { useState, useEffect } from 'react';
import { Plus, X, Phone, Mail, MapPin, ShoppingCart, DollarSign, Building2, Search, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/axiosConfig';
import { formatCurrency } from '../utils/currency';
import { notify } from '@/lib/notifications';

interface Supplier {
  id: number;
  name: string;
  phone: string;
  email: string;
  company: string;
  address: string;
  balance: number;
  purchase_count: number;
  total_purchases: number;
  supplier_score: number | null;
  evaluation_count: number;
  created_at: string;
}

interface Evaluation {
  id: number;
  supplier: number;
  delivery_rating: number;
  quality_rating: number;
  price_rating: number;
  communication_rating: number;
  notes: string;
  evaluated_by_name: string;
  average_score: number;
  created_at: string;
}

interface EvalForm {
  delivery_rating: number;
  quality_rating: number;
  price_rating: number;
  communication_rating: number;
  notes: string;
}

interface Product {
  id: number;
  name: string;
  cost_price: number;
}

interface Purchase {
  id: number;
  supplier: number;
  supplier_name: string;
  product: number;
  product_name: string;
  quantity: number;
  cost_price: number;
  total_amount: number;
  invoice_number: string;
  notes: string;
  created_at: string;
}

export function SuppliersScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'suppliers' | 'purchases' | 'debts' | 'evaluations'>('suppliers');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', email: '', company: '', address: '' });
  const [purchaseForm, setPurchaseForm] = useState({ supplier: '', product: '', quantity: '', cost_price: '', invoice_number: '', notes: '' });
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [evalLoading, setEvalLoading] = useState(false);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalTargetId, setEvalTargetId] = useState<number | null>(null);
  const [evalTargetName, setEvalTargetName] = useState('');
  const [evalForm, setEvalForm] = useState<EvalForm>({
    delivery_rating: 3,
    quality_rating: 3,
    price_rating: 3,
    communication_rating: 3,
    notes: ''
  });

  const [invoiceImageFile, setInvoiceImageFile] = useState<File | null>(null);
  const [goodsImageFile, setGoodsImageFile] = useState<File | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<string | null>(null);
  const [goodsPreview, setGoodsPreview] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      const [suppRes, purRes, prodRes] = await Promise.all([
        apiClient.get('/suppliers/'),
        apiClient.get('/purchases/'),
        apiClient.get('/products/'),
      ]);
      setSuppliers(Array.isArray(suppRes.data) ? suppRes.data : suppRes.data.results ?? []);
      setPurchases(Array.isArray(purRes.data) ? purRes.data : purRes.data.results ?? []);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.results ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (activeTab === 'evaluations') {
      fetchEvaluations();
    }
  }, [activeTab]);

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.company || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveSupplier = async () => {
    if (!supplierForm.name) {
      notify.warning('برجاء إدخال اسم المورد');
      return;
    }
    try {
      if (selectedSupplier) {
        await apiClient.patch(`/suppliers/${selectedSupplier.id}/`, supplierForm);
      } else {
        await apiClient.post('/suppliers/', supplierForm);
      }
      fetchAll();
      setShowSupplierModal(false);
      setSupplierForm({ name: '', phone: '', email: '', company: '', address: '' });
      setSelectedSupplier(null);
    } catch (e) { notify.error('حدث خطأ'); }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!confirm('هل تريد حذف هذا المورد؟')) return;
    try {
      await apiClient.delete(`/suppliers/${id}/`);
      fetchAll();
    } catch (e) { notify.error('حدث خطأ أثناء الحذف'); }
  };

  const handleSavePurchase = async () => {
    if (!purchaseForm.supplier || !purchaseForm.product || !purchaseForm.quantity || !purchaseForm.cost_price) {
      notify.warning('برجاء إدخال جميع البيانات المطلوبة');
      return;
    }
    try {
      await apiClient.post('/purchases/', {
        supplier: parseInt(purchaseForm.supplier),
        product: parseInt(purchaseForm.product),
        quantity: parseFloat(purchaseForm.quantity),
        cost_price: parseFloat(purchaseForm.cost_price),
        invoice_number: purchaseForm.invoice_number,
        notes: purchaseForm.notes,
      });
      fetchAll();
      setShowPurchaseModal(false);
      setPurchaseForm({ supplier: '', product: '', quantity: '', cost_price: '', invoice_number: '', notes: '' });
    } catch (e) { notify.error('حدث خطأ'); }
  };

  const handlePayDebt = async () => {
    if (!selectedSupplier || !payAmount) return;
    try {
      await apiClient.post(`/suppliers/${selectedSupplier.id}/pay_debt/`, { amount: parseFloat(payAmount) });
      fetchAll();
      setShowPayModal(false);
      setPayAmount('');
    } catch (e) { notify.error('حدث خطأ'); }
  };

  const fetchEvaluations = async (supplierId?: number) => {
    setEvalLoading(true);
    try {
      const url = supplierId
        ? `/supplier-evaluations/?supplier=${supplierId}`
        : '/supplier-evaluations/';
      const res = await apiClient.get(url);
      setEvaluations(res.data);
    } catch {
      notify.error('فشل في تحميل التقييمات');
    } finally {
      setEvalLoading(false);
    }
  };

  const handleImageSelect = (
    type: 'invoice' | 'goods',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (type === 'invoice') {
        setInvoiceImageFile(file);
        setInvoicePreview(result);
      } else {
        setGoodsImageFile(file);
        setGoodsPreview(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitEval = async () => {
    if (!evalTargetId) return;
    try {
      const formData = new FormData();
      formData.append('supplier', String(evalTargetId));
      formData.append('delivery_rating',
        String(evalForm.delivery_rating));
      formData.append('quality_rating',
        String(evalForm.quality_rating));
      formData.append('price_rating',
        String(evalForm.price_rating));
      formData.append('communication_rating',
        String(evalForm.communication_rating));
      formData.append('notes', evalForm.notes);
      if (invoiceImageFile) {
        formData.append('invoice_image', invoiceImageFile);
      }
      if (goodsImageFile) {
        formData.append('goods_image', goodsImageFile);
      }
      await apiClient.post('/supplier-evaluations/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      notify.success('تم حفظ التقييم بنجاح');
      setShowEvalModal(false);
      setEvalForm({
        delivery_rating: 3, quality_rating: 3,
        price_rating: 3, communication_rating: 3, notes: ''
      });
      setInvoiceImageFile(null);
      setGoodsImageFile(null);
      setInvoicePreview(null);
      setGoodsPreview(null);
      fetchAll();
      fetchEvaluations();
    } catch {
      notify.error('فشل في حفظ التقييم');
    }
  };

  const totalDebt = suppliers.reduce((sum, s) => sum + Number(s.balance), 0);
  const suppliersWithDebt = suppliers.filter(s => Number(s.balance) > 0).length;

  if (loading) return <div className="p-20 text-center font-bold text-gray-500">{t('common.loading')}</div>;

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 space-y-6 text-right font-sans" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1E293B] mb-1">إدارة الموردين</h1>
          <p className="text-gray-500 text-sm">تتبع الموردين والمشتريات والديون</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setShowPurchaseModal(true); }} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center gap-2 shadow transition">
            <ShoppingCart size={18} /> فاتورة شراء
          </button>
          <button onClick={() => { setSelectedSupplier(null); setSupplierForm({ name: '', phone: '', email: '', company: '', address: '' }); setShowSupplierModal(true); }} className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl flex items-center gap-2 shadow transition">
            <Plus size={18} /> مورد جديد
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">إجمالي الموردين</div>
          <div className="text-3xl font-bold text-gray-800">{suppliers.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
          <div className="text-sm text-gray-500 mb-1">إجمالي الديون</div>
          <div className="text-3xl font-bold text-red-600">{formatCurrency(totalDebt)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">موردين لديهم ديون</div>
          <div className="text-3xl font-bold text-orange-500">{suppliersWithDebt}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[{ key: 'suppliers', label: '🏭 الموردين' }, { key: 'purchases', label: '🛒 المشتريات' }, { key: 'debts', label: '💰 الديون' }, { key: 'evaluations', label: '⭐ التقييمات' }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`px-5 py-2.5 font-bold text-sm rounded-t-xl transition-colors ${activeTab === tab.key ? 'bg-white border-b-2 border-[#3B82F6] text-[#3B82F6]' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Suppliers */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="ابحث عن مورد..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs font-bold text-gray-600 uppercase">
                <tr>
                  <th className="px-4 py-3 text-right">المورد</th>
                  <th className="px-4 py-3 text-right">الشركة</th>
                  <th className="px-4 py-3 text-right">التواصل</th>
                  <th className="px-4 py-3 text-right">عدد المشتريات</th>
                  <th className="px-4 py-3 text-right">إجمالي المشتريات</th>
                  <th className="px-4 py-3 text-right">الدين المستحق</th>
                  <th className="px-4 py-3 text-center">التقييم</th>
                  <th className="px-4 py-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSuppliers.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-bold text-gray-800">{s.name}</td>
                    <td className="px-4 py-3 text-gray-600">{s.company || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {s.phone && <span className="flex items-center gap-1 text-xs text-gray-600"><Phone size={12} />{s.phone}</span>}
                        {s.email && <span className="flex items-center gap-1 text-xs text-gray-600"><Mail size={12} />{s.email}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-blue-600">{s.purchase_count}</td>
                    <td className="px-4 py-3 font-bold text-green-600">{formatCurrency(s.total_purchases)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${Number(s.balance) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {Number(s.balance) > 0 ? formatCurrency(s.balance) : 'لا يوجد'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.supplier_score !== null && s.supplier_score !== undefined ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                            s.supplier_score >= 4 ? 'bg-green-100 text-green-700' :
                            s.supplier_score >= 3 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            <Star size={10} fill="currentColor" /> {s.supplier_score}
                          </span>
                          <span className="text-[10px] text-gray-400">({s.evaluation_count} تقييم)</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">لم يُقيَّم</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => {
                          setEvalTargetId(s.id);
                          setEvalTargetName(s.name);
                          setEvalForm({
                            delivery_rating: 3, quality_rating: 3,
                            price_rating: 3, communication_rating: 3, notes: ''
                          });
                          setShowEvalModal(true);
                        }}
                          className="px-3 py-1 border border-blue-300 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-50 transition">تقييم</button>
                        {Number(s.balance) > 0 && (
                          <button onClick={() => { setSelectedSupplier(s); setShowPayModal(true); }}
                            className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg hover:bg-green-200 transition flex items-center gap-1">
                            <DollarSign size={12} /> سداد
                          </button>
                        )}
                        <button onClick={() => { setSelectedSupplier(s); setSupplierForm({ name: s.name, phone: s.phone || '', email: s.email || '', company: s.company || '', address: s.address || '' }); setShowSupplierModal(true); }}
                          className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-200 transition">{t('common.edit')}</button>
                        <button onClick={() => handleDeleteSupplier(s.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 transition">{t('common.delete')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSuppliers.length === 0 && <div className="py-16 text-center text-gray-400">{t('suppliers.noSuppliers')}</div>}
          </div>
        </div>
      )}

      {/* Tab: Purchases */}
      {activeTab === 'purchases' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs font-bold text-gray-600 uppercase">
                <tr>
                  <th className="px-4 py-3 text-right">المورد</th>
                  <th className="px-4 py-3 text-right">المنتج</th>
                  <th className="px-4 py-3 text-right">الكمية</th>
                  <th className="px-4 py-3 text-right">سعر التكلفة</th>
                  <th className="px-4 py-3 text-right">الإجمالي</th>
                  <th className="px-4 py-3 text-right">رقم الفاتورة</th>
                  <th className="px-4 py-3 text-right">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchases.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-bold text-gray-800">{p.supplier_name}</td>
                    <td className="px-4 py-3 text-gray-700">{p.product_name}</td>
                    <td className="px-4 py-3 text-center font-bold">{p.quantity}</td>
                    <td className="px-4 py-3 text-blue-600 font-bold">{formatCurrency(p.cost_price)}</td>
                    <td className="px-4 py-3 text-green-600 font-bold">{formatCurrency(p.total_amount)}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono">{p.invoice_number || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{new Date(p.created_at).toLocaleDateString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {purchases.length === 0 && <div className="py-16 text-center text-gray-400">لا توجد مشتريات بعد</div>}
          </div>
        </div>
      )}

      {/* Tab: Debts */}
      {activeTab === 'debts' && (
        <div className="space-y-3">
          {suppliers.filter(s => Number(s.balance) > 0).length === 0 && (
            <div className="bg-white rounded-2xl p-16 text-center text-gray-400">✅ لا توجد ديون مستحقة</div>
          )}
          {suppliers.filter(s => Number(s.balance) > 0).map(s => (
            <div key={s.id} className="bg-white rounded-2xl p-5 shadow-sm border border-red-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-800 text-lg">{s.name}</div>
                {s.company && <div className="text-sm text-gray-500 flex items-center gap-1"><Building2 size={12} />{s.company}</div>}
                {s.phone && <div className="text-sm text-gray-500 flex items-center gap-1"><Phone size={12} />{s.phone}</div>}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-gray-500">الدين المستحق</div>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(s.balance)}</div>
                </div>
                <button onClick={() => { setSelectedSupplier(s); setShowPayModal(true); }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center gap-2 transition">
                  <DollarSign size={16} /> سداد
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Evaluations */}
      {activeTab === 'evaluations' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {evalLoading && (
            <div className="p-16 text-center text-gray-400">{t('common.loading')}</div>
          )}
          {!evalLoading && evaluations.length === 0 && (
            <div className="p-16 text-center text-gray-400">لا توجد تقييمات بعد</div>
          )}
          {!evalLoading && evaluations.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs font-bold text-gray-600 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-right">المورد</th>
                    <th className="px-4 py-3 text-center">تسليم</th>
                    <th className="px-4 py-3 text-center">جودة</th>
                    <th className="px-4 py-3 text-center">سعر</th>
                    <th className="px-4 py-3 text-center">تواصل</th>
                    <th className="px-4 py-3 text-center">المتوسط</th>
                    <th className="px-4 py-3 text-right">بواسطة</th>
                    <th className="px-4 py-3 text-right">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {evaluations.map(ev => (
                    <tr key={ev.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-bold text-gray-800">
                        {suppliers.find(s => s.id === ev.supplier)?.name || ev.supplier}
                      </td>
                      {([ev.delivery_rating, ev.quality_rating, ev.price_rating, ev.communication_rating] as number[]).map((r, idx) => (
                        <td key={idx} className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                            r >= 5 ? 'bg-emerald-100 text-emerald-700' :
                            r >= 4 ? 'bg-green-100 text-green-700' :
                            r >= 3 ? 'bg-yellow-100 text-yellow-700' :
                            r >= 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>{r}</span>
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center font-bold text-blue-700">
                        <span className="inline-flex items-center gap-1"><Star size={12} fill="currentColor" /> {ev.average_score}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{ev.evaluated_by_name}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">{new Date(ev.created_at).toLocaleDateString('ar-EG')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add/Edit Supplier */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-[#3B82F6] p-5 text-white flex justify-between items-center rounded-t-2xl">
              <h2 className="text-lg font-bold">{selectedSupplier ? 'تعديل مورد' : 'إضافة مورد جديد'}</h2>
              <button onClick={() => setShowSupplierModal(false)}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: t('common.name') + ' *', key: 'name', type: 'text' },
                { label: t('common.phone'), key: 'phone', type: 'text' },
                { label: t('common.email'), key: 'email', type: 'email' },
                { label: 'الشركة', key: 'company', type: 'text' },
                { label: t('common.address'), key: 'address', type: 'text' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{field.label}</label>
                  <input type={field.type} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={supplierForm[field.key as keyof typeof supplierForm]}
                    onChange={e => setSupplierForm({ ...supplierForm, [field.key]: e.target.value })} />
                </div>
              ))}
              <button onClick={handleSaveSupplier} className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3 rounded-xl mt-2">
                {selectedSupplier ? 'حفظ التعديلات' : 'إضافة المورد'} ✅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Purchase */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-green-600 p-5 text-white flex justify-between items-center rounded-t-2xl">
              <h2 className="text-lg font-bold">🛒 فاتورة شراء جديدة</h2>
              <button onClick={() => setShowPurchaseModal(false)}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">المورد *</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
                  value={purchaseForm.supplier} onChange={e => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}>
                  <option value="">-- اختر مورد --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">المنتج *</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
                  value={purchaseForm.product} onChange={e => setPurchaseForm({ ...purchaseForm, product: e.target.value })}>
                  <option value="">-- اختر منتج --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الكمية *</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                    value={purchaseForm.quantity} onChange={e => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">سعر التكلفة *</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                    value={purchaseForm.cost_price} onChange={e => setPurchaseForm({ ...purchaseForm, cost_price: e.target.value })} />
                </div>
              </div>
              {purchaseForm.quantity && purchaseForm.cost_price && (
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <span className="text-sm text-gray-600">الإجمالي: </span>
                  <span className="font-bold text-green-700">{formatCurrency(parseFloat(purchaseForm.quantity) * parseFloat(purchaseForm.cost_price))}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">رقم الفاتورة</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  value={purchaseForm.invoice_number} onChange={e => setPurchaseForm({ ...purchaseForm, invoice_number: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('common.notes')}</label>
                <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none text-sm" rows={2}
                  value={purchaseForm.notes} onChange={e => setPurchaseForm({ ...purchaseForm, notes: e.target.value })} />
              </div>
              <button onClick={handleSavePurchase} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl">
                حفظ فاتورة الشراء ✅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Evaluation */}
      {showEvalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-800">تقييم المورد: {evalTargetName}</h2>
              <button onClick={() => setShowEvalModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'تسليم الطلبات', key: 'delivery_rating' as const },
                { label: 'جودة البضاعة', key: 'quality_rating' as const },
                { label: 'تنافسية الأسعار', key: 'price_rating' as const },
                { label: 'جودة التواصل', key: 'communication_rating' as const },
              ].map(field => (
                <div key={field.key} className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">{field.label}</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEvalForm(prev => ({ ...prev, [field.key]: star }))}
                        className="text-xl transition-colors"
                        style={{ color: star <= evalForm[field.key] ? '#F59E0B' : '#D1D5DB' }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ملاحظات إضافية (اختياري)</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                  rows={3}
                  value={evalForm.notes}
                  onChange={e => setEvalForm({ ...evalForm, notes: e.target.value })}
                />
              </div>

              <div style={{marginTop: '12px'}}>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px'
                }}>
                  صور اختيارية
                </p>

                <div style={{display: 'flex', gap: '12px'}}>

                  {/* Invoice image */}
                  <label style={{
                    flex: 1, border: '2px dashed #CBD5E1',
                    borderRadius: '10px', padding: '10px',
                    textAlign: 'center', cursor: 'pointer',
                    fontSize: '12px', color: '#64748B'
                  }}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{display: 'none'}}
                      onChange={(e) => handleImageSelect('invoice', e)}
                    />
                    {invoicePreview ? (
                      <img
                        src={invoicePreview}
                        alt="فاتورة"
                        style={{
                          height: '60px', width: '100%',
                          objectFit: 'cover', borderRadius: '6px'
                        }}
                      />
                    ) : (
                      <div>
                        <div style={{fontSize: '20px'}}>🧾</div>
                        <div>صورة الفاتورة</div>
                      </div>
                    )}
                  </label>

                  {/* Goods image */}
                  <label style={{
                    flex: 1, border: '2px dashed #CBD5E1',
                    borderRadius: '10px', padding: '10px',
                    textAlign: 'center', cursor: 'pointer',
                    fontSize: '12px', color: '#64748B'
                  }}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{display: 'none'}}
                      onChange={(e) => handleImageSelect('goods', e)}
                    />
                    {goodsPreview ? (
                      <img
                        src={goodsPreview}
                        alt="بضاعة"
                        style={{
                          height: '60px', width: '100%',
                          objectFit: 'cover', borderRadius: '6px'
                        }}
                      />
                    ) : (
                      <div>
                        <div style={{fontSize: '20px'}}>📦</div>
                        <div>صورة البضاعة</div>
                      </div>
                    )}
                  </label>

                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleSubmitEval} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition">
                  حفظ التقييم
                </button>
                <button onClick={() => {
                  setShowEvalModal(false);
                  setInvoiceImageFile(null);
                  setGoodsImageFile(null);
                  setInvoicePreview(null);
                  setGoodsPreview(null);
                }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl transition">
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Pay Debt */}
      {showPayModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="bg-green-600 p-5 text-white flex justify-between items-center rounded-t-2xl">
              <h2 className="text-lg font-bold">💰 سداد دين</h2>
              <button onClick={() => setShowPayModal(false)}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-center bg-red-50 rounded-xl p-3">
                <div className="text-sm text-gray-600">{selectedSupplier.name}</div>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(selectedSupplier.balance)}</div>
                <div className="text-xs text-gray-500">الدين الحالي</div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">المبلغ المدفوع</label>
                <input type="number" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-xl font-bold focus:outline-none focus:border-green-400"
                  value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0" />
              </div>
              <button onClick={handlePayDebt} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl">
                تأكيد السداد ✅
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
