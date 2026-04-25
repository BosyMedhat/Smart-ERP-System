import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';
import { CreditCard, Plus, X, Calendar, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';

interface Installment {
  id: string;
  customer_name: string;
  invoice_number: string;
  invoice: number;
  amount: number; 
  remaining_amount: number; 
  due_date: string;
  is_paid: boolean;
}

export function InstallmentsManagement() {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewInstallmentModal, setShowNewInstallmentModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({ 
    invoiceId: '', 
    totalAmount: '', 
    installmentsCount: '1', // الخانة الجديدة
    nextDate: '' 
  });
  const [collectAmount, setCollectAmount] = useState('');

  const fetchInstallments = async () => {
    try {
      setError('');
      const response = await apiClient.get('/installments/');
      setInstallments(response.data);
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

  const handleSave = async () => {
    if (!formData.invoiceId || !formData.totalAmount) {
      return alert("برجاء إدخال رقم الفاتورة والمبلغ");
    }
    try {
      const payload = {
        invoice: parseInt(formData.invoiceId),
        amount: parseFloat(formData.totalAmount),
        remaining_amount: parseFloat(formData.totalAmount),
        due_date: formData.nextDate || new Date().toISOString().split('T')[0],
        installments_count: parseInt(formData.installmentsCount), // بنبعت عدد الأقساط
        is_paid: false
      };
      await apiClient.post('/installments/', payload);
      alert("تم حفظ القسط بنجاح! ✅");
      fetchInstallments();
      setShowNewInstallmentModal(false);
      setFormData({ invoiceId: '', totalAmount: '', installmentsCount: '1', nextDate: '' });
    } catch (error: any) {
      console.error("Error saving installment:", error);
      if (error.response?.status === 401) {
        setError('ليس لديك صلاحية لتنفيذ هذا الإجراء');
      } else if (error.response?.status === 403) {
        setError('غير مصرح لك بهذه العملية');
      } else {
        setError('حدث خطأ، يرجى المحاولة مرة أخرى');
      }
    }
  };

  const handleCollect = async () => {
    if (!selectedInstallment || !collectAmount) return;
    try {
      const newRem = selectedInstallment.remaining_amount - Number(collectAmount);
      await apiClient.patch(`/installments/${selectedInstallment.id}/`, {
        remaining_amount: Math.max(0, newRem),
        is_paid: newRem <= 0
      });
      fetchInstallments();
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

  const getStatusBadge = (item: Installment) => {
    const isLate = new Date(item.due_date) < new Date() && !item.is_paid;
    if (item.is_paid || item.remaining_amount <= 0) return <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg border bg-blue-100 text-blue-700 border-blue-300"><CheckCircle size={14} /> مكتمل</span>;
    if (isLate) return <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg border bg-red-100 text-red-700 border-red-300"><AlertTriangle size={14} /> متأخر</span>;
    return <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg border bg-green-100 text-green-700 border-green-300"><CheckCircle size={14} /> منتظم</span>;
  };

  if (loading) return <div className="p-20 text-center font-bold">جاري تحميل الأقساط...</div>;

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 space-y-6 text-right font-sans" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1E293B] mb-2">إدارة عمليات التقسيط</h1>
          <p className="text-gray-600">تتبع شامل لمديونيات العملاء</p>
        </div>
        <button onClick={() => setShowNewInstallmentModal(true)} className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl flex items-center gap-2 shadow-lg transition-transform active:scale-95">
          <Plus size={20} /> قسط جديد
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-sm border border-blue-200">
          <div className="text-sm text-gray-600 mb-1 font-bold">إجمالي المبالغ القائمة</div>
          <div className="text-3xl font-bold text-gray-900">{totalOutstanding.toLocaleString()} ج.م</div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 p-6 shadow-sm border border-red-200">
          <div className="text-sm text-gray-600 mb-1 font-bold">أقساط متأخرة</div>
          <div className="text-3xl font-bold text-gray-900">{lateInstallments}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-[#1E293B] mb-4">جدول عمليات التقسيط</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200 text-sm font-bold text-gray-700">
              <tr>
                <th className="px-4 py-3 text-right">العميل</th>
                <th className="px-4 py-3 text-right">رقم الفاتورة</th>
                <th className="px-4 py-3 text-right">المبلغ المتبقي</th>
                <th className="px-4 py-3 text-right">تاريخ الاستحقاق</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                <th className="px-4 py-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {installments.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 font-bold text-gray-800">{item.customer_name}</td>
                  <td className="px-4 py-4 text-gray-500 font-mono">#{item.invoice_number}</td>
                  <td className="px-4 py-4 font-bold text-orange-600">{Number(item.remaining_amount).toLocaleString()} ج.م</td>
                  <td className="px-4 py-4 flex items-center gap-2"><Calendar size={16} className="text-gray-400" />{item.due_date}</td>
                  <td className="px-4 py-4">{getStatusBadge(item)}</td>
                  <td className="px-4 py-4 text-center">
                    {Number(item.remaining_amount) > 0 ? (
                      <button onClick={() => { setSelectedInstallment(item); setShowCollectModal(true); }} className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold rounded-lg shadow-md mx-auto flex items-center gap-1">
                        <DollarSign size={16} />تحصيل
                      </button>
                    ) : <span className="text-xs text-gray-400 font-bold">خالص ✅</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal New Installment - بنفس التصميم اللي في صورتك بالضبط */}
      {showNewInstallmentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm text-right">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center font-bold">
              <h2 className="text-xl flex items-center gap-2"><Plus /> إضافة قسط جديد</h2>
              <button onClick={() => setShowNewInstallmentModal(false)}><X /></button>
            </div>
            <div className="p-6 space-y-4">
              <label className="block text-sm font-bold text-gray-700">رقم تعريف الفاتورة (ID):</label>
              <input type="number" className="w-full px-4 py-3 border rounded-xl" value={formData.invoiceId} onChange={(e)=>setFormData({...formData, invoiceId: e.target.value})} />
              
              <label className="block text-sm font-bold text-gray-700">قيمة القسط الإجمالية:</label>
              <input type="number" className="w-full px-4 py-3 border rounded-xl font-bold" value={formData.totalAmount} onChange={(e)=>setFormData({...formData, totalAmount: e.target.value})} />
              
              {/* الخانة اللي كانت ناقصة */}
              <label className="block text-sm font-bold text-gray-700">عدد الأقساط:</label>
              <input type="number" className="w-full px-4 py-3 border rounded-xl font-bold" value={formData.installmentsCount} onChange={(e)=>setFormData({...formData, installmentsCount: e.target.value})} />

              <label className="block text-sm font-bold text-gray-700">تاريخ الاستحقاق:</label>
              <input type="date" className="w-full px-4 py-3 border rounded-xl font-bold" value={formData.nextDate} onChange={(e)=>setFormData({...formData, nextDate: e.target.value})} />
              
              <button onClick={handleSave} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg">حفظ في قاعدة البيانات ✅</button>
            </div>
          </div>
        </div>
      )}

      {/* Collect Modal */}
      {showCollectModal && selectedInstallment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm text-right">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-emerald-500 p-6 text-white flex justify-between items-center font-bold">
              <h2 className="text-xl flex items-center gap-2"><DollarSign /> تحصيل قسط</h2>
              <button onClick={() => setShowCollectModal(false)}><X /></button>
            </div>
            <div className="p-6 space-y-4">
                <p className="font-bold">العميل: {selectedInstallment.customer_name}</p>
                <input type="number" placeholder="المبلغ" className="w-full px-4 py-4 border-2 border-emerald-100 rounded-xl text-center text-2xl font-bold" value={collectAmount} onChange={(e)=>setCollectAmount(e.target.value)} />
                <button onClick={handleCollect} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold">تأكيد التحصيل</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}