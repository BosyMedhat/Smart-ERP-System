import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/axiosConfig';
import { CreditCard, Calendar, DollarSign, CheckCircle, AlertTriangle, X, History, User, FileText } from 'lucide-react';

interface Installment {
  id: string;
  customer_name: string;
  invoice_number: string;
  sale: number;
  amount: number;
  remaining_amount: number;
  down_payment: number;
  months_count: number;
  monthly_amount: number;
  sale_final_amount: number;
  due_date: string;
  is_paid: boolean;
}

interface Payment {
  id: number;
  amount: string;
  paid_at: string;
  recorded_by: string | null;
  recorded_by_name: string | null;
  description: string;
  transaction_type: string;
}

interface PaymentHistory {
  installment_id: number;
  invoice_number: string | null;
  customer_name: string | null;
  total_amount: string;
  installment_amount: string;
  down_payment: string;
  current_remaining: string;
  is_paid: boolean;
  payments: Payment[];
  payment_summary: {
    total_paid: string;
    remaining: string;
    payments_count: number;
  };
}

export function InstallmentsManagement() {
  const { t } = useTranslation();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [collectAmount, setCollectAmount] = useState('');

  const fetchInstallments = async () => {
    try {
      setError('');
      const response = await apiClient.get('/installments/');
      setInstallments(Array.isArray(response.data) ? response.data : response.data.results ?? []);
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching installments:", error);
      if (error.response?.status === 401) {
        setError('ليس لديك صلاحية لتنفيذ هذا الإجراء');
      } else if (error.response?.status === 403) {
        setError('غير مصرح لك بهذه العملية');
      } else {
        setError('حدث خطأ، يرجى المحاولة مرة أخرى');
      }
      setLoading(false);
    }
  };

  useEffect(() => { fetchInstallments(); }, []);

  const totalOutstanding = installments.reduce((sum, i) => sum + Number(i.remaining_amount), 0);
  const lateInstallments = installments.filter(i => {
      const isLate = new Date(i.due_date) < new Date() && !i.is_paid;
      return isLate;
  }).length;

  const handleCollect = async () => {
    if (!selectedInstallment || !collectAmount) return;
    try {
      await apiClient.post(`/installments/${selectedInstallment.id}/pay/`, {
        amount: parseFloat(collectAmount)
      });
      await fetchInstallments();
      setShowCollectModal(false);
      setCollectAmount('');
    } catch (error: any) {
      console.error("Error collecting installment:", error);
      if (error.response?.status === 401) {
        setError('ليس لديك صلاحية لتنفيذ هذا الإجراء');
      } else if (error.response?.status === 403) {
        setError('غير مصرح لك بهذه العملية');
      } else {
        setError('حدث خطأ، يرجى المحاولة مرة أخرى');
      }
    }
  };

  const fetchPaymentHistory = async (installmentId: string) => {
    setLoadingHistory(true);
    setError('');
    try {
      const response = await apiClient.get(`/installments/${installmentId}/payment-history/`);
      setPaymentHistory(response.data);
    } catch (error: any) {
      console.error("Error fetching payment history:", error);
      setError('فشل في تحميل سجل المدفوعات');
    } finally {
      setLoadingHistory(false);
    }
  };

  const openPaymentHistory = (installment: Installment) => {
    setSelectedInstallment(installment);
    fetchPaymentHistory(installment.id);
    setShowHistoryModal(true);
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (item: Installment) => {
    const isLate = new Date(item.due_date) < new Date() && !item.is_paid;
    if (item.is_paid || item.remaining_amount <= 0) return <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg border bg-blue-100 text-blue-700 border-blue-300"><CheckCircle size={14} /> {t('installments.paid')}</span>;
    if (isLate) return <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg border bg-red-100 text-red-700 border-red-300"><AlertTriangle size={14} /> {t('installments.overdue')}</span>;
    return <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg border bg-green-100 text-green-700 border-green-300"><CheckCircle size={14} /> {t('installments.pending')}</span>;
  };

  if (loading) return <div className="p-20 text-center font-bold">{t('common.loading')}</div>;

  return (
    <div className="h-full overflow-y-auto bg-background p-6 space-y-6 text-right font-sans" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-card-foreground mb-2">{t('installments.title')}</h1>
          <p className="text-muted-foreground">تتبع شامل لمديونيات العملاء</p>
        </div>
        <div className="px-4 py-3 bg-purple-500/10 text-purple-600 font-bold rounded-xl text-sm text-center border border-purple-200/50">
          📅 الأقساط تُنشأ تلقائياً عند البيع بالتقسيط من شاشة POS
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-6 shadow-sm border border-blue-200/50">
          <div className="text-sm text-muted-foreground mb-1 font-bold">إجمالي المبالغ القائمة</div>
          <div className="text-3xl font-bold text-card-foreground">{totalOutstanding.toLocaleString()} ج.م</div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 p-6 shadow-sm border border-red-200/50">
          <div className="text-sm text-muted-foreground mb-1 font-bold">أقساط متأخرة</div>
          <div className="text-3xl font-bold text-card-foreground">{lateInstallments}</div>
        </div>
      </div>

      {/* Table */}
      <div data-demo-id="installments-table" className="bg-card rounded-xl shadow-sm border border-border p-6">
        <h2 className="text-xl font-bold text-card-foreground mb-4">جدول عمليات التقسيط</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b-2 border-border text-sm font-bold text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-right">{t('sales.customer')}</th>
                <th className="px-4 py-3 text-right">رقم الفاتورة</th>
                <th className="px-4 py-3 text-right">إجمالي الفاتورة</th>
                <th className="px-4 py-3 text-right">{t('installments.downPayment')}</th>
                <th className="px-4 py-3 text-right">القسط الشهري</th>
                <th className="px-4 py-3 text-right">{t('installments.remainingAmount')}</th>
                <th className="px-4 py-3 text-right">{t('installments.monthsCount')}</th>
                <th className="px-4 py-3 text-right">{t('installments.dueDate')}</th>
                <th className="px-4 py-3 text-right">{t('common.status')}</th>
                <th className="px-4 py-3 text-center">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {installments.map((item) => (
                <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-4 font-bold text-card-foreground">{item.customer_name}</td>
                  <td className="px-4 py-4 text-muted-foreground font-mono">#{item.invoice_number}</td>
                  <td className="px-4 py-4 font-bold text-card-foreground">{Number(item.sale_final_amount).toLocaleString()} ج.م</td>
                  <td className="px-4 py-4 font-bold text-blue-600">{Number(item.down_payment).toLocaleString()} ج.م</td>
                  <td className="px-4 py-4 font-bold text-purple-600">{Number(item.monthly_amount).toLocaleString()} ج.م</td>
                  <td className="px-4 py-4 font-bold text-orange-600">{Number(item.remaining_amount).toLocaleString()} ج.م</td>
                  <td className="px-4 py-4 text-center text-muted-foreground font-bold">{item.months_count} شهر</td>
                  <td className="px-4 py-4 flex items-center gap-2 text-muted-foreground"><Calendar size={16} className="text-muted-foreground/60" />{item.due_date}</td>
                  <td className="px-4 py-4">{getStatusBadge(item)}</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col gap-2">
                      {Number(item.remaining_amount) > 0 ? (
                        <button onClick={() => { setSelectedInstallment(item); setShowCollectModal(true); }} className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1">
                          <DollarSign size={14} />تحصيل
                        </button>
                      ) : <span className="text-xs text-muted-foreground font-bold">خالص ✅</span>}
                      <button
                        onClick={() => openPaymentHistory(item)}
                        className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 text-xs font-bold rounded-lg flex items-center justify-center gap-1"
                      >
                        <History size={14} />سجل المدفوعات
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Modal */}
      {showCollectModal && selectedInstallment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm text-right">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border">
            <div className="bg-emerald-500 p-6 text-white flex justify-between items-center font-bold">
              <h2 className="text-xl flex items-center gap-2"><DollarSign /> تحصيل قسط</h2>
              <button onClick={() => setShowCollectModal(false)}><X /></button>
            </div>
            <div className="p-6 space-y-4">
                <p className="font-bold text-card-foreground">العميل: {selectedInstallment.customer_name}</p>
                <input type="number" placeholder={t('common.amount')} className="w-full px-4 py-4 border-2 border-emerald-200/50 rounded-xl text-center text-2xl font-bold bg-background text-foreground" value={collectAmount} onChange={(e)=>setCollectAmount(e.target.value)} />
                <button onClick={handleCollect} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold">تأكيد التحصيل</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showHistoryModal && selectedInstallment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm text-right" dir="rtl">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col border border-border">
            {/* Header */}
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center font-bold">
              <div>
                <h2 className="text-xl flex items-center gap-2"><History /> سجل المدفوعات</h2>
                <p className="text-blue-100 text-sm mt-1">
                  {paymentHistory?.customer_name} - فاتورة {paymentHistory?.invoice_number}
                </p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="hover:bg-blue-700 p-1 rounded"><X /></button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto">
              {loadingHistory ? (
                <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : paymentHistory ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-500/10 border border-green-200/50 rounded-xl p-4 text-center">
                      <div className="text-xs text-muted-foreground mb-1">إجمالي المدفوع</div>
                      <div className="text-xl font-bold text-green-600">
                        {Number(paymentHistory.payment_summary.total_paid).toLocaleString()} ج.م
                      </div>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-200/50 rounded-xl p-4 text-center">
                      <div className="text-xs text-muted-foreground mb-1">المتبقي</div>
                      <div className="text-xl font-bold text-orange-600">
                        {Number(paymentHistory.payment_summary.remaining).toLocaleString()} ج.م
                      </div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-200/50 rounded-xl p-4 text-center">
                      <div className="text-xs text-muted-foreground mb-1">عدد المدفوعات</div>
                      <div className="text-xl font-bold text-blue-600">
                        {paymentHistory.payment_summary.payments_count}
                      </div>
                    </div>
                  </div>

                  {/* Installment Details */}
                  <div className="bg-muted rounded-xl p-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div><span className="text-muted-foreground">مبلغ التقسيط:</span> <span className="font-bold text-card-foreground">{Number(paymentHistory.installment_amount).toLocaleString()} ج.م</span></div>
                      <div><span className="text-muted-foreground">المقدم:</span> <span className="font-bold text-card-foreground">{Number(paymentHistory.down_payment).toLocaleString()} ج.م</span></div>
                    </div>
                  </div>

                  {/* Payments Table */}
                  {paymentHistory.payments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted rounded-xl">
                      <FileText size={48} className="mx-auto mb-2 opacity-50" />
                      <p>لا توجد مدفوعات مسجلة</p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-bold text-card-foreground mb-3 flex items-center gap-2">
                        <FileText size={18} /> تفاصيل المدفوعات
                      </h3>
                      <table className="w-full text-sm">
                        <thead className="bg-secondary text-muted-foreground">
                          <tr>
                            <th className="px-4 py-2 text-right">#</th>
                            <th className="px-4 py-2 text-right">المبلغ</th>
                            <th className="px-4 py-2 text-right">التاريخ</th>
                            <th className="px-4 py-2 text-right">سجلها</th>
                            <th className="px-4 py-2 text-right">الوصف</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {paymentHistory.payments.map((payment, index) => (
                            <tr key={payment.id} className="hover:bg-muted/50">
                              <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                              <td className="px-4 py-3 font-bold text-green-600">
                                {Number(payment.amount).toLocaleString()} ج.م
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {formatDateTime(payment.paid_at)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <User size={14} />
                                  {payment.recorded_by_name || payment.recorded_by || 'غير معروف'}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">{payment.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-6 py-2 bg-secondary hover:bg-secondary/80 text-card-foreground font-bold rounded-lg"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}