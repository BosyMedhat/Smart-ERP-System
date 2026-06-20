import { useState, useEffect } from 'react';
import { Plus, X, Phone, Mail, MapPin, ShoppingCart, DollarSign, Building2, Search, Star, Trophy, TrendingUp, Lightbulb, ArrowDownUp, Package, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/axiosConfig';
import { formatCurrency } from '../utils/currency';
import { notify } from '../../lib/notifications';

interface RatingBreakdown {
  delivery: number | null;
  quality: number | null;
  price: number | null;
  communication: number | null;
}

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
  rank: number | null;
  badge: 'Recommended' | 'Good' | 'Risky' | 'New';
  recommendation_reason: string;
  rating_breakdown: RatingBreakdown;
  latest_purchase_date: string | null;
  purchase_frequency: number | null;
  created_at: string;
}

interface TopSupplier {
  supplier_id: number;
  supplier_name: string;
  supplier_score: number | null;
  badge: string;
  rating_breakdown: RatingBreakdown;
  purchase_count: number;
  total_purchases: number;
  recommendation_reason: string;
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
  const [activeTab, setActiveTab] = useState<'suppliers' | 'purchases' | 'debts' | 'evaluations' | 'intelligence'>('suppliers');
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
  const [topSuppliers, setTopSuppliers] = useState<{
    best_overall: TopSupplier | null;
    best_quality: TopSupplier | null;
    best_price: TopSupplier | null;
    best_delivery: TopSupplier | null;
  }>({ best_overall: null, best_quality: null, best_price: null, best_delivery: null });
  const [sortMode, setSortMode] = useState<'recommended' | 'score' | 'purchases'>('recommended');
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [insightsSupplier, setInsightsSupplier] = useState<Supplier | null>(null);

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
  };

  const fetchRecommendations = async () => {
    try {
      const res = await apiClient.get('/suppliers/recommendations/');
      setTopSuppliers(res.data.top_suppliers || {
        best_overall: null,
        best_quality: null,
        best_price: null,
        best_delivery: null,
      });
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchAll();
      await fetchRecommendations();
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (activeTab === 'evaluations') {
      fetchEvaluations();
    }
  }, [activeTab]);

  const badgeConfig: Record<Supplier['badge'], { label: string; className: string; icon: string }> = {
    Recommended: { label: 'موصى به', className: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30', icon: '🏆' },
    Good: { label: 'جيد', className: 'bg-blue-500/15 text-blue-700 border-blue-500/30', icon: '✅' },
    Risky: { label: 'محفوف بالمخاطر', className: 'bg-red-500/15 text-red-700 border-red-500/30', icon: '⚠️' },
    New: { label: 'جديد', className: 'bg-slate-500/15 text-slate-700 border-slate-500/30', icon: '🆕' },
  };

  const sortedSuppliers = [...suppliers].sort((a, b) => {
    if (sortMode === 'recommended') {
      const order = { Recommended: 0, Good: 1, Risky: 3, New: 2 };
      const rankA = order[a.badge] ?? 99;
      const rankB = order[b.badge] ?? 99;
      if (rankA !== rankB) return rankA - rankB;
      return (b.supplier_score ?? 0) - (a.supplier_score ?? 0);
    }
    if (sortMode === 'score') {
      return (b.supplier_score ?? 0) - (a.supplier_score ?? 0);
    }
    return (b.total_purchases ?? 0) - (a.total_purchases ?? 0);
  });

  const filteredSuppliers = sortedSuppliers.filter(s =>
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

  if (loading) return <div className="p-20 text-center font-bold text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div className="h-full overflow-y-auto bg-muted p-6 space-y-6 text-right font-sans" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1E293B] mb-1">إدارة الموردين</h1>
          <p className="text-muted-foreground text-sm">تتبع الموردين والمشتريات والديون</p>
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
      <div data-demo-id="suppliers-stats" className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <div className="text-sm text-muted-foreground mb-1">إجمالي الموردين</div>
          <div className="text-3xl font-bold text-card-foreground">{suppliers.length}</div>
        </div>
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-red-100">
          <div className="text-sm text-muted-foreground mb-1">إجمالي الديون</div>
          <div className="text-3xl font-bold text-red-600">{formatCurrency(totalDebt)}</div>
        </div>
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <div className="text-sm text-muted-foreground mb-1">موردين لديهم ديون</div>
          <div className="text-3xl font-bold text-orange-500">{suppliersWithDebt}</div>
        </div>
      </div>

      {/* Tabs */}
      <div data-demo-id="suppliers-tabs" className="flex gap-2 border-b border-border">
        {[
          { key: 'suppliers', label: '🏭 الموردين' },
          { key: 'intelligence', label: '🧠 الذكاء' },
          { key: 'purchases', label: '🛒 المشتريات' },
          { key: 'debts', label: '💰 الديون' },
          { key: 'evaluations', label: '⭐ التقييمات' }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`px-5 py-2.5 font-bold text-sm rounded-t-xl transition-colors ${activeTab === tab.key ? 'bg-card border-b-2 border-[#3B82F6] text-[#3B82F6]' : 'text-muted-foreground hover:text-card-foreground'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Suppliers */}
      {activeTab === 'suppliers' && (
        <div data-demo-id="suppliers-table" className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="ابحث عن مورد..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ArrowDownUp size={16} className="text-muted-foreground" />
              <select value={sortMode} onChange={e => setSortMode(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-300">
                <option value="recommended">الترتيب: الأفضل</option>
                <option value="score">الترتيب: التقييم</option>
                <option value="purchases">الترتيب: المشتريات</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted text-xs font-bold text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 text-right">#</th>
                  <th className="px-4 py-3 text-right">المورد</th>
                  <th className="px-4 py-3 text-right">الشركة</th>
                  <th className="px-4 py-3 text-right">التواصل</th>
                  <th className="px-4 py-3 text-center">التصنيف</th>
                  <th className="px-4 py-3 text-right">المشتريات</th>
                  <th className="px-4 py-3 text-right">إجمالي المشتريات</th>
                  <th className="px-4 py-3 text-right">الدين المستحق</th>
                  <th className="px-4 py-3 text-center">التقييم</th>
                  <th className="px-4 py-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSuppliers.map(s => {
                  const badge = badgeConfig[s.badge] || badgeConfig.New;
                  return (
                  <tr key={s.id} className="hover:bg-muted transition">
                    <td className="px-4 py-3 font-bold text-muted-foreground">{s.rank ?? '—'}</td>
                    <td className="px-4 py-3 font-bold text-card-foreground">
                      {s.name}
                      <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[160px]" title={s.recommendation_reason}>
                        {s.recommendation_reason}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.company || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {s.phone && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone size={12} />{s.phone}</span>}
                        {s.email && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail size={12} />{s.email}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${badge.className}`}>
                        {badge.icon} {badge.label}
                      </span>
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
                            s.supplier_score >= 4 ? 'bg-green-500/10 text-green-700' :
                            s.supplier_score >= 3 ? 'bg-yellow-500/10 text-yellow-700' :
                            'bg-red-500/10 text-red-700'
                          }`}>
                            <Star size={10} fill="currentColor" /> {s.supplier_score}
                          </span>
                          <span className="text-[10px] text-gray-400">({s.evaluation_count} تقييم)</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">لم يُقَيَّم</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <button onClick={() => {
                          setInsightsSupplier(s);
                          setShowInsightsModal(true);
                        }}
                          className="px-3 py-1 border border-purple-300 text-purple-600 text-xs font-bold rounded-lg hover:bg-purple-50 transition flex items-center gap-1">
                          <Lightbulb size={12} /> رؤية
                        </button>
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
                            className="px-3 py-1 bg-green-500/10 text-green-700 text-xs font-bold rounded-lg hover:bg-green-200 transition flex items-center gap-1">
                            <DollarSign size={12} /> سداد
                          </button>
                        )}
                        <button onClick={() => { setSelectedSupplier(s); setSupplierForm({ name: s.name, phone: s.phone || '', email: s.email || '', company: s.company || '', address: s.address || '' }); setShowSupplierModal(true); }}
                          className="px-3 py-1 bg-blue-500/10 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-200 transition">{t('common.edit')}</button>
                        <button onClick={() => handleDeleteSupplier(s.id)}
                          className="px-3 py-1 bg-red-500/10 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 transition">{t('common.delete')}</button>
                      </div>
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
            {filteredSuppliers.length === 0 && <div className="py-16 text-center text-gray-400">{t('suppliers.noSuppliers')}</div>}
          </div>
        </div>
      )}

      {/* Tab: Intelligence */}
      {activeTab === 'intelligence' && (
        <div className="space-y-6">
          {/* Top Suppliers Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { key: 'best_overall', title: 'أفضل مورد بشكل عام', icon: Trophy, color: 'text-amber-500', bg: 'from-amber-500/10 to-amber-600/5 border-amber-500/20' },
              { key: 'best_quality', title: 'أفضل مورد جودة', icon: Award, color: 'text-emerald-500', bg: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20' },
              { key: 'best_price', title: 'أفضل مورد سعر', icon: TrendingUp, color: 'text-blue-500', bg: 'from-blue-500/10 to-blue-600/5 border-blue-500/20' },
              { key: 'best_delivery', title: 'أفضل مورد استلام', icon: Package, color: 'text-violet-500', bg: 'from-violet-500/10 to-violet-600/5 border-violet-500/20' },
            ].map(card => {
              const supplier = topSuppliers[card.key as keyof typeof topSuppliers];
              const Icon = card.icon;
              return (
                <div key={card.key} className={`bg-gradient-to-br ${card.bg} rounded-2xl border p-5`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-card flex items-center justify-center shadow-sm ${card.color}`}>
                      <Icon size={20} />
                    </div>
                    <h3 className="font-bold text-card-foreground">{card.title}</h3>
                  </div>
                  {supplier ? (
                    <div className="space-y-2">
                      <div className="text-xl font-bold text-card-foreground">{supplier.supplier_name}</div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="inline-flex items-center gap-1 text-xs font-bold">
                          <Star size={12} fill="currentColor" /> {supplier.supplier_score ?? '—'}
                        </span>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-muted-foreground">{supplier.purchase_count} مشتريات</span>
                      </div>
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        {supplier.recommendation_reason}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">لا توجد بيانات كافية</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Smart Insights Panel */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center text-indigo-500">
                <Lightbulb size={20} />
              </div>
              <h3 className="text-lg font-bold text-card-foreground">رؤى الموردين الذكية</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suppliers.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-8">لا توجد موردين لتحليل الرؤى</div>
              )}
              {suppliers.map(s => {
                const badge = badgeConfig[s.badge] || badgeConfig.New;
                return (
                  <div key={s.id} className="rounded-xl border border-border p-4 hover:border-indigo-300 transition">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-card-foreground">{s.name}</div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badge.className}`}>
                        {badge.icon} {badge.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      {s.recommendation_reason}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {s.rating_breakdown.delivery !== null && (
                        <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600">استلام: {s.rating_breakdown.delivery}</span>
                      )}
                      {s.rating_breakdown.quality !== null && (
                        <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600">جودة: {s.rating_breakdown.quality}</span>
                      )}
                      {s.rating_breakdown.price !== null && (
                        <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600">سعر: {s.rating_breakdown.price}</span>
                      )}
                      {s.rating_breakdown.communication !== null && (
                        <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600">تواصل: {s.rating_breakdown.communication}</span>
                      )}
                      {s.latest_purchase_date && (
                        <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600">آخر فاتورة: {s.latest_purchase_date}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Purchases */}
      {activeTab === 'purchases' && (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted text-xs font-bold text-muted-foreground uppercase">
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
              <tbody className="divide-y divide-border">
                {purchases.map(p => (
                  <tr key={p.id} className="hover:bg-muted transition">
                    <td className="px-4 py-3 font-bold text-card-foreground">{p.supplier_name}</td>
                    <td className="px-4 py-3 text-card-foreground">{p.product_name}</td>
                    <td className="px-4 py-3 text-center font-bold">{p.quantity}</td>
                    <td className="px-4 py-3 text-blue-600 font-bold">{formatCurrency(p.cost_price)}</td>
                    <td className="px-4 py-3 text-green-600 font-bold">{formatCurrency(p.total_amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono">{p.invoice_number || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">{new Date(p.created_at).toLocaleDateString('ar-EG')}</td>
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
            <div className="bg-card rounded-2xl p-16 text-center text-gray-400">✅ لا توجد ديون مستحقة</div>
          )}
          {suppliers.filter(s => Number(s.balance) > 0).map(s => (
            <div key={s.id} className="bg-card rounded-2xl p-5 shadow-sm border border-red-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-card-foreground text-lg">{s.name}</div>
                {s.company && <div className="text-sm text-muted-foreground flex items-center gap-1"><Building2 size={12} />{s.company}</div>}
                {s.phone && <div className="text-sm text-muted-foreground flex items-center gap-1"><Phone size={12} />{s.phone}</div>}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">الدين المستحق</div>
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
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          {evalLoading && (
            <div className="p-16 text-center text-gray-400">{t('common.loading')}</div>
          )}
          {!evalLoading && evaluations.length === 0 && (
            <div className="p-16 text-center text-gray-400">لا توجد تقييمات بعد</div>
          )}
          {!evalLoading && evaluations.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted text-xs font-bold text-muted-foreground uppercase">
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
                <tbody className="divide-y divide-border">
                  {evaluations.map(ev => (
                    <tr key={ev.id} className="hover:bg-muted transition">
                      <td className="px-4 py-3 font-bold text-card-foreground">
                        {suppliers.find(s => s.id === ev.supplier)?.name || ev.supplier}
                      </td>
                      {([ev.delivery_rating, ev.quality_rating, ev.price_rating, ev.communication_rating] as number[]).map((r, idx) => (
                        <td key={idx} className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                            r >= 5 ? 'bg-emerald-100 text-emerald-700' :
                            r >= 4 ? 'bg-green-500/10 text-green-700' :
                            r >= 3 ? 'bg-yellow-500/10 text-yellow-700' :
                            r >= 2 ? 'bg-orange-500/10 text-orange-700' :
                            'bg-red-500/10 text-red-700'
                          }`}>{r}</span>
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center font-bold text-blue-700">
                        <span className="inline-flex items-center gap-1"><Star size={12} fill="currentColor" /> {ev.average_score}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">{ev.evaluated_by_name}</td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">{new Date(ev.created_at).toLocaleDateString('ar-EG')}</td>
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
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
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
                  <label className="block text-sm font-bold text-card-foreground mb-1">{field.label}</label>
                  <input type={field.type} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
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
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-green-600 p-5 text-white flex justify-between items-center rounded-t-2xl">
              <h2 className="text-lg font-bold">🛒 فاتورة شراء جديدة</h2>
              <button onClick={() => setShowPurchaseModal(false)}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-sm font-bold text-card-foreground mb-1">المورد *</label>
                <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 bg-background text-foreground"
                  value={purchaseForm.supplier} onChange={e => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}>
                  <option value="">-- اختر مورد --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-card-foreground mb-1">المنتج *</label>
                <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 bg-background text-foreground"
                  value={purchaseForm.product} onChange={e => setPurchaseForm({ ...purchaseForm, product: e.target.value })}>
                  <option value="">-- اختر منتج --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-card-foreground mb-1">الكمية *</label>
                  <input type="number" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none"
                    value={purchaseForm.quantity} onChange={e => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-card-foreground mb-1">سعر التكلفة *</label>
                  <input type="number" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none"
                    value={purchaseForm.cost_price} onChange={e => setPurchaseForm({ ...purchaseForm, cost_price: e.target.value })} />
                </div>
              </div>
              {purchaseForm.quantity && purchaseForm.cost_price && (
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <span className="text-sm text-muted-foreground">الإجمالي: </span>
                  <span className="font-bold text-green-700">{formatCurrency(parseFloat(purchaseForm.quantity) * parseFloat(purchaseForm.cost_price))}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-card-foreground mb-1">رقم الفاتورة</label>
                <input type="text" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none"
                  value={purchaseForm.invoice_number} onChange={e => setPurchaseForm({ ...purchaseForm, invoice_number: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold text-card-foreground mb-1">{t('common.notes')}</label>
                <textarea className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none text-sm" rows={2}
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
          <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-card-foreground">تقييم المورد: {evalTargetName}</h2>
              <button onClick={() => setShowEvalModal(false)} className="text-gray-400 hover:text-muted-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'تسليم الطلبات', key: 'delivery_rating' as const },
                { label: 'جودة البضاعة', key: 'quality_rating' as const },
                { label: 'تنافسية الأسعار', key: 'price_rating' as const },
                { label: 'جودة التواصل', key: 'communication_rating' as const },
              ].map(field => (
                <div key={field.key} className="flex items-center justify-between">
                  <label className="text-sm font-bold text-card-foreground">{field.label}</label>
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
                <label className="block text-sm font-bold text-card-foreground mb-1">ملاحظات إضافية (اختياري)</label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
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
                }} className="flex-1 bg-muted hover:bg-gray-200 text-card-foreground font-bold py-2.5 rounded-xl transition">
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
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="bg-green-600 p-5 text-white flex justify-between items-center rounded-t-2xl">
              <h2 className="text-lg font-bold">💰 سداد دين</h2>
              <button onClick={() => setShowPayModal(false)}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-center bg-red-50 rounded-xl p-3">
                <div className="text-sm text-muted-foreground">{selectedSupplier.name}</div>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(selectedSupplier.balance)}</div>
                <div className="text-xs text-muted-foreground">الدين الحالي</div>
              </div>
              <div>
                <label className="block text-sm font-bold text-card-foreground mb-1">المبلغ المدفوع</label>
                <input type="number" className="w-full px-4 py-3 border-2 border-border rounded-xl text-center text-xl font-bold focus:outline-none focus:border-green-400"
                  value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0" />
              </div>
              <button onClick={handlePayDebt} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl">
                تأكيد السداد ✅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Supplier Insights */}
      {showInsightsModal && insightsSupplier && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm" dir="rtl">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white flex justify-between items-center rounded-t-2xl">
              <h2 className="text-lg font-bold flex items-center gap-2"><Lightbulb size={18} /> رؤية المورد</h2>
              <button onClick={() => setShowInsightsModal(false)}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-bold text-xl text-card-foreground">{insightsSupplier.name}</div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${badgeConfig[insightsSupplier.badge].className}`}>
                  {badgeConfig[insightsSupplier.badge].icon} {badgeConfig[insightsSupplier.badge].label}
                </span>
              </div>
              <div className="bg-muted rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">سبب التوصية</div>
                <p className="text-sm font-medium text-card-foreground leading-relaxed">{insightsSupplier.recommendation_reason}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-xl p-3 text-center">
                  <div className="text-xs text-muted-foreground">التقييم</div>
                  <div className="font-bold text-lg text-indigo-600">{insightsSupplier.supplier_score ?? '—'}</div>
                </div>
                <div className="bg-muted rounded-xl p-3 text-center">
                  <div className="text-xs text-muted-foreground">الترتيب</div>
                  <div className="font-bold text-lg text-indigo-600">{insightsSupplier.rank ?? '—'}</div>
                </div>
                <div className="bg-muted rounded-xl p-3 text-center">
                  <div className="text-xs text-muted-foreground">المشتريات</div>
                  <div className="font-bold text-lg text-indigo-600">{insightsSupplier.purchase_count}</div>
                </div>
                <div className="bg-muted rounded-xl p-3 text-center">
                  <div className="text-xs text-muted-foreground">إجمالي المشتريات</div>
                  <div className="font-bold text-lg text-indigo-600">{formatCurrency(insightsSupplier.total_purchases)}</div>
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-card-foreground mb-2">تفاصيل التقييم</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'الاستلام', value: insightsSupplier.rating_breakdown.delivery },
                    { label: 'الجودة', value: insightsSupplier.rating_breakdown.quality },
                    { label: 'السعر', value: insightsSupplier.rating_breakdown.price },
                    { label: 'التواصل', value: insightsSupplier.rating_breakdown.communication },
                  ].map(dim => (
                    <div key={dim.label} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                      <span className="text-sm text-muted-foreground">{dim.label}</span>
                      <span className="font-bold text-sm">{dim.value ?? '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
              {insightsSupplier.latest_purchase_date && (
                <div className="text-xs text-muted-foreground">
                  آخر فاتورة شراء: {insightsSupplier.latest_purchase_date}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

