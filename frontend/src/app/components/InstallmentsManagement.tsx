import { useState, useEffect } from 'react';
import { CreditCard, Plus, X, Calendar, DollarSign, CheckCircle, AlertTriangle, Search, Loader2 } from 'lucide-react';
import { salesService } from '../../services/salesService';

interface Installment {
  id: number;
  customer_name: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  status: 'PENDING' | 'PAID' | 'LATE';
  plan_remaining: number;
}

export function InstallmentsManagement() {
  const [loading, setLoading] = useState(true);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total_pending: 0, total_paid: 0, late_count: 0 });
  
  const [showNewInstallmentModal, setShowNewInstallmentModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);

  const [newInstallmentForm, setNewInstallmentForm] = useState({
    customer_name: '',
    invoice_number: '',
    total_amount: '',
    down_payment: '',
    installments_count: '1',
    notes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [data, statistics] = await Promise.all([
        salesService.getInstallments(),
        salesService.getInstallmentStats()
      ]);
      setInstallments(data);
      setStats(statistics);
    } catch (error) {
      console.error("Error loading installments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredInstallments = installments.filter(inst => 
    inst.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inst.invoice_number && inst.invoice_number.includes(searchTerm))
  );

  const handleConfirmPayment = async () => {
    if (!selectedInstallment) return;
    try {
      await salesService.payInstallment(selectedInstallment.id);
      setShowCollectModal(false);
      loadData();
    } catch (error) { alert("حدث خطأ أثناء التحصيل"); }
  };

  const handleSaveManualInstallment = async () => {
    try {
      await salesService.createManualInstallment(newInstallmentForm);
      setShowNewInstallmentModal(false);
      loadData();
      setNewInstallmentForm({ customer_name: '', invoice_number: '', total_amount: '', down_payment: '', installments_count: '1', notes: '' });
    } catch (error) { alert("فشل الحفظ"); }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F8FAFC] p-6 space-y-6 text-right" dir="rtl">
      {/* Header مع زر الإضافة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">إدارة عمليات التقسيط</h1>
          <p className="text-gray-500 text-sm">تتبع شامل لمديونيات العملاء ومواعيد التحصيل</p>
        </div>
        <button
          onClick={() => setShowNewInstallmentModal(true)}
          className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-lg flex items-center gap-2 transition-all shadow-md"
        >
          <Plus size={18} />
          قسط جديد
        </button>
      </div>

      {/* Stats Cards - نفس ترتيب وألوان الصورة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* إجمالي القائمة - الأزرق */}
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><CreditCard size={20}/></div>
            <span className="text-[10px] font-bold bg-blue-200 text-blue-700 px-2 py-0.5 rounded">نشط</span>
          </div>
          <div className="mt-4">
            <p className="text-gray-600 text-sm">إجمالي الأقساط القائمة</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.total_pending.toLocaleString()} <span className="text-sm">ج.م</span></h3>
          </div>
        </div>

        {/* الأقساط المحصلة - الأخضر */}
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-green-100 rounded-lg text-green-600"><CheckCircle size={20}/></div>
            <span className="text-[10px] font-bold bg-green-200 text-green-700 px-2 py-0.5 rounded">هذا الشهر</span>
          </div>
          <div className="mt-4">
            <p className="text-gray-600 text-sm">الأقساط المحصلة</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.total_paid.toLocaleString()} <span className="text-sm">ج.م</span></h3>
          </div>
        </div>

        {/* الأقساط المتأخرة - الأحمر */}
        <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-red-100 rounded-lg text-red-600"><AlertTriangle size={20}/></div>
            <span className="text-[10px] font-bold bg-red-200 text-red-700 px-2 py-0.5 rounded">متأخر</span>
          </div>
          <div className="mt-4">
            <p className="text-gray-600 text-sm">أقساط متأخرة</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.late_count}</h3>
          </div>
        </div>
      </div>

      {/* الجدول مع البحث */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1E293B]">جدول عمليات التقسيط</h2>
          <div className="relative w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="بحث باسم العميل..." 
              className="w-full pr-10 pl-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC] text-gray-600 font-bold border-b">
            <tr>
              <th className="px-6 py-4 text-right">اسم العميل</th>
              <th className="px-6 py-4 text-right">رقم الفاتورة</th>
              <th className="px-6 py-4 text-right">المبلغ الإجمالي</th>
              <th className="px-6 py-4 text-right">المبلغ المتبقي</th>
              <th className="px-6 py-4 text-right">تاريخ القسط القادم</th>
              <th className="px-6 py-4 text-right">الحالة</th>
              <th className="px-6 py-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredInstallments.map((inst) => (
              <tr key={inst.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-bold text-gray-800">{inst.customer_name}</td>
                <td className="px-6 py-4 text-gray-500">{inst.invoice_number || '---'}</td>
                <td className="px-6 py-4 font-bold">{inst.amount.toLocaleString()} ج.م</td>
                <td className="px-6 py-4 font-bold text-orange-500">{inst.plan_remaining.toLocaleString()} ج.م</td>
                <td className="px-6 py-4 text-gray-600 flex items-center gap-1.5 mt-1">
                  <Calendar size={14} className="text-gray-400" /> {inst.due_date}
                </td>
                <td className="px-6 py-4">
                   {inst.status === 'PAID' ? 
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[11px] font-bold border border-blue-100 flex items-center w-fit gap-1"><CheckCircle size={12}/> مكتمل</span> :
                    <span className={`px-2 py-1 rounded-md text-[11px] font-bold border flex items-center w-fit gap-1 ${inst.status === 'LATE' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                      {inst.status === 'LATE' ? <AlertTriangle size={12}/> : <CheckCircle size={12}/>}
                      {inst.status === 'LATE' ? 'متأخر' : 'منتظم'}
                    </span>
                   }
                </td>
                <td className="px-6 py-4 text-center">
                  {inst.status !== 'PAID' && (
                    <button 
                      onClick={() => { setSelectedInstallment(inst); setShowCollectModal(true); }}
                      className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-lg flex items-center gap-1 mx-auto transition-colors"
                    >
                      <DollarSign size={14} /> تحصيل قسط
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* مودال التحصيل - مطابق للصورة الثالثة */}
      {showCollectModal && selectedInstallment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">تحصيل قسط</h2>
              <button onClick={() => setShowCollectModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-[#F0F7FF] border border-[#E0E7FF] rounded-xl p-4 text-center">
                <p className="text-blue-600 text-xs font-bold">اسم العميل</p>
                <p className="text-lg font-black text-blue-900">{selectedInstallment.customer_name}</p>
                <p className="text-[10px] text-blue-500 mt-1">رقم الفاتورة: {selectedInstallment.invoice_number}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">المبلغ المطلوب</label>
                <div className="relative">
                  <input type="number" defaultValue={selectedInstallment.amount} className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 font-bold text-xl text-center outline-none focus:border-green-500 transition-all"/>
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">ج.م</span>
                </div>
                <p className="text-[11px] text-gray-400 text-center">المتبقي: {selectedInstallment.plan_remaining.toLocaleString()} ج.م</p>
              </div>
            </div>
            <div className="p-5 bg-gray-50 rounded-b-2xl flex gap-3">
               <button onClick={handleConfirmPayment} className="flex-1 py-3 bg-[#10B981] text-white font-bold rounded-xl shadow-lg shadow-green-100 flex items-center justify-center gap-2">
                <CheckCircle size={18}/> تأكيد التحصيل
              </button>
              <button onClick={() => setShowCollectModal(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* مودال قسط جديد - مطابق للصورة الثانية */}
      {showNewInstallmentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><CreditCard size={18}/></div>
                <h2 className="text-lg font-bold">قسط جديد</h2>
              </div>
              <button onClick={() => setShowNewInstallmentModal(false)}><X size={20}/></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <input type="text" placeholder="اسم العميل" className="col-span-2 p-3 border rounded-lg bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={newInstallmentForm.customer_name} onChange={(e)=>setNewInstallmentForm({...newInstallmentForm, customer_name: e.target.value})}/>
              <input type="text" placeholder="رقم الفاتورة" className="col-span-2 p-3 border rounded-lg bg-gray-50 text-sm" value={newInstallmentForm.invoice_number} onChange={(e)=>setNewInstallmentForm({...newInstallmentForm, invoice_number: e.target.value})}/>
              <input type="number" placeholder="إجمالي المبلغ" className="p-3 border rounded-lg bg-gray-50 text-sm" value={newInstallmentForm.total_amount} onChange={(e)=>setNewInstallmentForm({...newInstallmentForm, total_amount: e.target.value})}/>
              <input type="number" placeholder="المقدم" className="p-3 border rounded-lg bg-gray-50 text-sm" value={newInstallmentForm.down_payment} onChange={(e)=>setNewInstallmentForm({...newInstallmentForm, down_payment: e.target.value})}/>
              <input type="number" placeholder="عدد الأقساط" className="p-3 border rounded-lg bg-gray-50 text-sm" value={newInstallmentForm.installments_count} onChange={(e)=>setNewInstallmentForm({...newInstallmentForm, installments_count: e.target.value})}/>
              <input type="date" className="p-3 border rounded-lg bg-gray-50 text-sm" />
              <textarea placeholder="ملاحظات" className="col-span-2 p-3 border rounded-lg bg-gray-50 text-sm h-20 resize-none" value={newInstallmentForm.notes} onChange={(e)=>setNewInstallmentForm({...newInstallmentForm, notes: e.target.value})}></textarea>
            </div>
            <div className="p-5 bg-gray-50 flex gap-3">
              <button onClick={handleSaveManualInstallment} className="flex-1 py-3 bg-[#3B82F6] text-white font-bold rounded-xl shadow-lg shadow-blue-100">حفظ القسط</button>
              <button onClick={() => setShowNewInstallmentModal(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// import { useState, useEffect } from 'react';
// import { CreditCard, Plus, X, Calendar, DollarSign, CheckCircle, AlertTriangle, Search, Loader2 } from 'lucide-react';
// import { salesService } from '../../services/salesService';

// interface Installment {
//   id: number;
//   customer_name: string;
//   invoice_number: string;
//   amount: number;
//   due_date: string;
//   status: 'PENDING' | 'PAID' | 'LATE';
//   plan_remaining: number; // المبلغ المتبقي الكلي في الخطة
// }

// export function InstallmentsManagement() {
//   const [loading, setLoading] = useState(true);
//   const [installments, setInstallments] = useState<Installment[]>([]);
//   const [searchTerm, setSearchTerm] = useState(''); // ✅ حالة البحث
//   const [stats, setStats] = useState({ total_pending: 0, total_paid: 0, late_count: 0 });
  
//   const [showNewInstallmentModal, setShowNewInstallmentModal] = useState(false);
//   const [showCollectModal, setShowCollectModal] = useState(false);
//   const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);

//   // ✅ بيانات القسط الجديد اليدوي
//   const [newInstallmentForm, setNewInstallmentForm] = useState({
//     customer_name: '',
//     total_amount: '',
//     down_payment: '',
//     installments_count: '1',
//   });

//   // ✅ جلب البيانات من السيرفر
//   const loadData = async () => {
//     try {
//       setLoading(true);
//       const [data, statistics] = await Promise.all([
//         salesService.getInstallments(),
//         salesService.getInstallmentStats()
//       ]);
//       setInstallments(data);
//       setStats(statistics);
//     } catch (error) {
//       console.error("Error loading installments:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadData();
//   }, []);

//   // ✅ وظيفة البحث (فلترة بالاسم أو رقم الفاتورة)
//   const filteredInstallments = installments.filter(inst => 
//     inst.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     (inst.invoice_number && inst.invoice_number.includes(searchTerm))
//   );

//   // ✅ وظيفة تحصيل القسط
//   const handleConfirmPayment = async () => {
//     if (!selectedInstallment) return;
//     try {
//       await salesService.payInstallment(selectedInstallment.id);
//       setShowCollectModal(false);
//       loadData(); // تحديث البيانات بعد الدفع
//     } catch (error) {
//       alert("حدث خطأ أثناء محاولة التحصيل");
//     }
//   };

//   // ✅ وظيفة حفظ قسط جديد يدوي
//   const handleSaveManualInstallment = async () => {
//     try {
//       if (!newInstallmentForm.customer_name || !newInstallmentForm.total_amount) {
//         alert("برجاء إدخال البيانات الأساسية");
//         return;
//       }
//       // @ts-ignore (بافتراض إضافة الدالة في السيرفس)
//       await salesService.createManualInstallment(newInstallmentForm);
//       setShowNewInstallmentModal(false);
//       loadData();
//       setNewInstallmentForm({ customer_name: '', total_amount: '', down_payment: '', installments_count: '1' });
//     } catch (error) {
//       alert("فشل في إنشاء القسط");
//     }
//   };

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case 'PENDING':
//         return <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg border border-yellow-300">منتظر</span>;
//       case 'PAID':
//         return <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg border border-green-300"><CheckCircle size={14} />تم التحصيل</span>;
//       case 'LATE':
//         return <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-300"><AlertTriangle size={14} />متأخر</span>;
//       default: return null;
//     }
//   };

//   if (loading) return <div className="h-full flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

//   return (
//     <div className="h-full overflow-y-auto bg-gray-50 p-6 space-y-6">
//       {/* Page Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-[#1E293B] mb-2">إدارة عمليات التقسيط</h1>
//           <p className="text-gray-600">تتبع شامل لمديونيات العملاء ومواعيد التحصيل</p>
//         </div>

//         <button
//           onClick={() => setShowNewInstallmentModal(true)}
//           className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-lg"
//         >
//           <Plus size={20} />
//           قسط جديد
//         </button>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-3 gap-6">
//         <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-blue-200">
//           <div className="text-sm text-gray-600 mb-1">إجمالي الأقساط القائمة</div>
//           <div className="text-3xl font-bold text-blue-600">{stats.total_pending.toLocaleString()} ج.م</div>
//           <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-50 rounded-full blur-2xl" />
//         </div>

//         <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-green-200">
//           <div className="text-sm text-gray-600 mb-1">الأقساط المُحصلة</div>
//           <div className="text-3xl font-bold text-green-600">{stats.total_paid.toLocaleString()} ج.م</div>
//           <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-green-50 rounded-full blur-2xl" />
//         </div>

//         <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-red-200">
//           <div className="text-sm text-gray-600 mb-1">أقساط متأخرة</div>
//           <div className="text-3xl font-bold text-red-600">{stats.late_count}</div>
//           <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-red-50 rounded-full blur-2xl" />
//         </div>
//       </div>

//       {/* Search Bar */}
//       <div className="relative max-w-md">
//         <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
//         <input 
//           type="text" 
//           placeholder="ابحث باسم العميل أو رقم الفاتورة..." 
//           className="w-full pr-12 pl-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//       </div>

//       {/* Installments Table */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//         <h2 className="text-xl font-bold text-[#1E293B] mb-4">جدول عمليات التقسيط</h2>
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gray-50 border-b-2 border-gray-200">
//               <tr>
//                 <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">العميل</th>
//                 <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">الفاتورة</th>
//                 <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">مبلغ القسط</th>
//                 <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">تاريخ الاستحقاق</th>
//                 <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">الحالة</th>
//                 <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">الإجراءات</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               {filteredInstallments.map((inst) => (
//                 <tr key={inst.id} className="hover:bg-gray-50 transition-colors">
//                   <td className="px-4 py-4 font-bold text-gray-800">{inst.customer_name}</td>
//                   <td className="px-4 py-4 text-gray-600">{inst.invoice_number || 'يدوي'}</td>
//                   <td className="px-4 py-4 font-bold text-[#1E293B]">{inst.amount.toLocaleString()} ج.م</td>
//                   <td className="px-4 py-4 flex items-center gap-2"><Calendar size={16} className="text-gray-400" />{inst.due_date}</td>
//                   <td className="px-4 py-4">{getStatusBadge(inst.status)}</td>
//                   <td className="px-4 py-4 text-center">
//                     {inst.status !== 'PAID' && (
//                       <button 
//                         onClick={() => { setSelectedInstallment(inst); setShowCollectModal(true); }}
//                         className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold rounded-lg flex items-center gap-1 mx-auto"
//                       >
//                         <DollarSign size={16} />تحصيل
//                       </button>
//                     )}
//                     {inst.status === 'PAID' && <span className="text-xs text-green-500 font-bold">مكتمل</span>}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Collect Modal */}
//       {showCollectModal && selectedInstallment && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4 backdrop-blur-sm">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
//             <div className="flex items-center justify-between p-6 border-b">
//               <h2 className="text-xl font-bold text-[#1E293B]">تحصيل قسط</h2>
//               <button onClick={() => setShowCollectModal(false)}><X /></button>
//             </div>
//             <div className="p-6 space-y-4">
//               <div className="bg-blue-50 p-4 rounded-xl">
//                 <div className="text-sm text-blue-700">اسم العميل</div>
//                 <div className="text-lg font-bold">{selectedInstallment.customer_name}</div>
//               </div>
//               <div className="text-center py-4">
//                 <div className="text-gray-500 text-sm">المبلغ المطلوب استلامه</div>
//                 <div className="text-4xl font-black text-gray-900">{selectedInstallment.amount.toLocaleString()} <span className="text-lg">ج.م</span></div>
//               </div>
//             </div>
//             <div className="flex gap-3 p-6 border-t">
//               <button onClick={() => setShowCollectModal(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold">إلغاء</button>
//               <button onClick={handleConfirmPayment} className="flex-1 bg-[#10B981] text-white py-3 rounded-xl font-bold">تأكيد التحصيل</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* New Installment Modal */}
//       {showNewInstallmentModal && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
//             <div className="flex items-center justify-between p-6 border-b text-[#1E293B]">
//               <h2 className="text-xl font-bold flex items-center gap-2"><CreditCard className="text-blue-500" />قسط جديد يدوي</h2>
//               <button onClick={() => setShowNewInstallmentModal(false)}><X /></button>
//             </div>
//             <div className="p-6 space-y-4">
//               <input 
//                 type="text" placeholder="اسم العميل" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
//                 value={newInstallmentForm.customer_name} onChange={(e)=>setNewInstallmentForm({...newInstallmentForm, customer_name: e.target.value})}
//               />
//               <div className="grid grid-cols-2 gap-4">
//                 <input 
//                   type="number" placeholder="إجمالي المبلغ" className="px-4 py-3 border rounded-lg"
//                   value={newInstallmentForm.total_amount} onChange={(e)=>setNewInstallmentForm({...newInstallmentForm, total_amount: e.target.value})}
//                 />
//                 <input 
//                   type="number" placeholder="المقدم" className="px-4 py-3 border rounded-lg"
//                   value={newInstallmentForm.down_payment} onChange={(e)=>setNewInstallmentForm({...newInstallmentForm, down_payment: e.target.value})}
//                 />
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <select 
//                   className="px-4 py-3 border rounded-lg"
//                   value={newInstallmentForm.installments_count} onChange={(e)=>setNewInstallmentForm({...newInstallmentForm, installments_count: e.target.value})}
//                 >
//                   {[1,2,3,4,6,12,24].map(n => <option key={n} value={n}>{n} أقساط</option>)}
//                 </select>
//                 <div className="px-4 py-3 bg-gray-50 text-gray-500 rounded-lg text-sm flex items-center italic">يبدأ من الشهر القادم</div>
//               </div>
//             </div>
//             <div className="flex gap-3 p-6 border-t">
//               <button onClick={() => setShowNewInstallmentModal(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold">إلغاء</button>
//               <button onClick={handleSaveManualInstallment} className="flex-1 bg-[#3B82F6] text-white py-3 rounded-xl font-bold hover:bg-blue-700">حفظ وحساب الأقساط</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


//اخر تعديل قبل اضافة الاقساط

// import { useState } from 'react';
// import { CreditCard, Plus, X, Calendar, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';

// interface Installment {
//   id: string;
//   customerName: string;
//   invoiceNumber: string;
//   totalAmount: number;
//   remainingAmount: number;
//   nextPaymentDate: string;
//   status: 'regular' | 'late' | 'completed';
// }

// export function InstallmentsManagement() {
//   const [showNewInstallmentModal, setShowNewInstallmentModal] = useState(false);
//   const [showCollectModal, setShowCollectModal] = useState(false);
//   const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
//   const [collectFormData, setCollectFormData] = useState({
//     amount: '',
//     paymentMethod: 'cash',
//     notes: '',
//   });

//   const [installments] = useState<Installment[]>([
//     { id: '1', customerName: 'محمد أحمد السيد', invoiceNumber: 'INV-2401', totalAmount: 25000, remainingAmount: 15000, nextPaymentDate: '2026-02-10', status: 'regular' },
//     { id: '2', customerName: 'فاطمة حسن علي', invoiceNumber: 'INV-2398', totalAmount: 18000, remainingAmount: 12000, nextPaymentDate: '2026-02-01', status: 'late' },
//     { id: '3', customerName: 'أحمد محمود', invoiceNumber: 'INV-2405', totalAmount: 30000, remainingAmount: 20000, nextPaymentDate: '2026-02-15', status: 'regular' },
//     { id: '4', customerName: 'سارة عبد الله', invoiceNumber: 'INV-2390', totalAmount: 15000, remainingAmount: 0, nextPaymentDate: '-', status: 'completed' },
//     { id: '5', customerName: 'خالد يوسف', invoiceNumber: 'INV-2402', totalAmount: 22000, remainingAmount: 18000, nextPaymentDate: '2026-01-28', status: 'late' },
//   ]);

//   const regularInstallments = installments.filter((i) => i.status === 'regular').length;
//   const lateInstallments = installments.filter((i) => i.status === 'late').length;
//   const totalOutstanding = installments.filter((i) => i.status !== 'completed').reduce((sum, i) => sum + i.remainingAmount, 0);
//   const collectedThisMonth = 45000; // Mock data

//   const openCollectModal = (installment: Installment) => {
//     setSelectedInstallment(installment);
//     setShowCollectModal(true);
//     setCollectFormData({ amount: '', paymentMethod: 'cash', notes: '' });
//   };

//   const closeCollectModal = () => {
//     setShowCollectModal(false);
//     setSelectedInstallment(null);
//     setCollectFormData({ amount: '', paymentMethod: 'cash', notes: '' });
//   };

//   const getStatusBadge = (status: Installment['status']) => {
//     switch (status) {
//       case 'regular':
//         return <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg border border-green-300"><CheckCircle size={14} />منتظم</span>;
//       case 'late':
//         return <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-300"><AlertTriangle size={14} />متأخر</span>;
//       case 'completed':
//         return <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-300"><CheckCircle size={14} />مكتمل</span>;
//     }
//   };

//   return (
//     <div className="h-full overflow-y-auto bg-gray-50 p-6 space-y-6">
//       {/* Page Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-[#1E293B] mb-2">إدارة عمليات التقسيط</h1>
//           <p className="text-gray-600">تتبع شامل لمديونيات العملاء ومواعيد التحصيل</p>
//         </div>

//         <button
//           onClick={() => setShowNewInstallmentModal(true)}
//           className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-lg"
//         >
//           <Plus size={20} />
//           قسط جديد
//         </button>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-3 gap-6">
//         {/* Total Outstanding */}
//         <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-sm border border-blue-200">
//           <div className="flex items-center justify-between mb-6">
//             <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center">
//               <CreditCard className="text-blue-600" size={24} />
//             </div>
//             <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">نشط</span>
//           </div>
//           <div className="text-sm text-gray-600 mb-1">إجمالي الأقساط القائمة</div>
//           <div className="text-3xl font-bold text-gray-900">{totalOutstanding.toLocaleString()}<span className="text-lg mr-1">ج.م</span></div>
//           <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-200/40 rounded-full blur-2xl" />
//         </div>

//         {/* Collected This Month */}
//         <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 p-6 shadow-sm border border-green-200">
//           <div className="flex items-center justify-between mb-6">
//             <div className="w-12 h-12 rounded-xl bg-green-600/10 flex items-center justify-center">
//               <CheckCircle className="text-green-600" size={24} />
//             </div>
//             <span className="text-xs font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">هذا الشهر</span>
//           </div>
//           <div className="text-sm text-gray-600 mb-1">الأقساط المُحصلة</div>
//           <div className="text-3xl font-bold text-gray-900">{collectedThisMonth.toLocaleString()}<span className="text-lg mr-1">ج.م</span></div>
//           <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-green-200/40 rounded-full blur-2xl" />
//         </div>

//         {/* Late Installments */}
//         <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 p-6 shadow-sm border border-red-200">
//           <div className="flex items-center justify-between mb-6">
//             <div className="w-12 h-12 rounded-xl bg-red-600/10 flex items-center justify-center">
//               <AlertTriangle className="text-red-600" size={24} />
//             </div>
//             <span className="text-xs font-semibold text-red-600 bg-red-100 px-3 py-1 rounded-full">متأخر</span>
//           </div>
//           <div className="text-sm text-gray-600 mb-1">أقساط متأخرة</div>
//           <div className="text-3xl font-bold text-gray-900">{lateInstallments}</div>
//           <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-red-200/40 rounded-full blur-2xl" />
//         </div>
//       </div>

//       {/* Installments Table */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//         <h2 className="text-xl font-bold text-[#1E293B] mb-4">جدول عمليات التقسيط</h2>
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gray-50 border-b-2 border-gray-200">
//               <tr>
//                 <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">اسم العميل</th>
//                 <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">رقم الفاتورة</th>
//                 <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">المبلغ الإجمالي</th>
//                 <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">المبلغ المتبقي</th>
//                 <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">تاريخ القسط القادم</th>
//                 <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">الحالة</th>
//                 <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">الإجراءات</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               {installments.map((installment) => (
//                 <tr key={installment.id} className="hover:bg-gray-50 transition-colors">
//                   <td className="px-4 py-4 font-bold text-gray-800">{installment.customerName}</td>
//                   <td className="px-4 py-4 text-gray-600">{installment.invoiceNumber}</td>
//                   <td className="px-4 py-4 font-bold text-[#1E293B]">{installment.totalAmount.toLocaleString()} ج.م</td>
//                   <td className="px-4 py-4 font-bold" style={{color: installment.remainingAmount>0?'#F59E0B':'#10B981'}}>{installment.remainingAmount.toLocaleString()} ج.م</td>
//                   <td className="px-4 py-4 flex items-center gap-2"><Calendar size={16} className="text-gray-400" />{installment.nextPaymentDate}</td>
//                   <td className="px-4 py-4">{getStatusBadge(installment.status)}</td>
//                   <td className="px-4 py-4 flex items-center justify-center">
//                     {installment.status !== 'completed' && (
//                       <button onClick={() => openCollectModal(installment)} className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold rounded-lg flex items-center gap-1">
//                         <DollarSign size={16} />تحصيل قسط
//                       </button>
//                     )}
//                     {installment.status === 'completed' && <span className="text-xs text-gray-400">مكتمل</span>}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Collect Payment Modal */}
//       {showCollectModal && selectedInstallment && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
//             <div className="flex items-center justify-between p-6 border-b border-gray-200">
//               <h2 className="text-xl font-bold text-[#1E293B]">تحصيل قسط</h2>
//               <button onClick={closeCollectModal} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center">
//                 <X size={18} className="text-gray-600" />
//               </button>
//             </div>
//             {/* Modal Body */}
//             <div className="p-6 space-y-4">
//               <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
//                 <div className="text-sm text-blue-700 font-semibold mb-1">اسم العميل</div>
//                 <div className="text-lg font-bold text-blue-900">{selectedInstallment.customerName}</div>
//                 <div className="text-xs text-blue-600 mt-2">رقم الفاتورة: {selectedInstallment.invoiceNumber}</div>
//               </div>
//               <div>
//                 <label className="block text-sm font-bold text-gray-700 mb-2">المبلغ المطلوب</label>
//                 <div className="relative">
//                   <input type="number" value={collectFormData.amount} onChange={(e)=>setCollectFormData({...collectFormData,amount:e.target.value})} className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] text-lg font-bold" placeholder="0" dir="ltr"/>
//                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">ج.م</span>
//                 </div>
//                 <div className="text-xs text-gray-600 mt-2">المتبقي: {selectedInstallment.remainingAmount.toLocaleString()} ج.م</div>
//               </div>
//             </div>
//             <div className="flex items-center gap-3 p-6 border-t border-gray-200">
//               <button onClick={closeCollectModal} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors">إلغاء</button>
//               <button className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2">
//                 <CheckCircle size={20}/> تأكيد التحصيل
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* New Installment Modal */}
//       {showNewInstallmentModal && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
//             <div className="flex items-center justify-between p-6 border-b">
//               <h2 className="text-xl font-bold text-[#1E293B] flex items-center gap-2">
//                 <CreditCard size={25} className="text-[#3B82F6]" />
//                 قسط جديد
//               </h2>
//               <button onClick={() => setShowNewInstallmentModal(false)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center">
//                 <X size={18} />
//               </button>
//             </div>
//             <div className="p-6 space-y-4">
//               <input type="text" placeholder="اسم العميل" className="w-full px-4 py-3 border rounded-lg"/>
//               <input type="text" placeholder="رقم الفاتورة" className="w-full px-4 py-3 border rounded-lg"/>
//               <div className="grid grid-cols-2 gap-4">
//                 <input type="number" placeholder="إجمالي المبلغ" className="px-4 py-3 border rounded-lg"/>
//                 <input type="number" placeholder="المقدم" className="px-4 py-3 border rounded-lg"/>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <input type="number" placeholder="عدد الأقساط" className="px-4 py-3 border rounded-lg"/>
//                 <input type="date" className="px-4 py-3 border rounded-lg"/>
//               </div>
//               <textarea placeholder="ملاحظات" rows={3} className="w-full px-4 py-3 border rounded-lg resize-none"/>
//             </div>
//             <div className="flex gap-3 p-6 border-t">
//               <button onClick={() => setShowNewInstallmentModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-bold">إلغاء</button>
//               <button className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white py-3 rounded-xl font-bold">حفظ القسط</button>
//             </div>
//           </div>
//         </div>
//       )}

//     </div>
//   );
// }






//-------------------------===============================================

// import { useState } from 'react';
// import { CreditCard, Plus, X, Calendar, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';

// interface Installment {
//   id: string;
//   customerName: string;
//   invoiceNumber: string;
//   totalAmount: number;
//   remainingAmount: number;
//   nextPaymentDate: string;
//   status: 'regular' | 'late' | 'completed';
// }

// export function InstallmentsManagement() {
//   const [showNewInstallmentModal, setShowNewInstallmentModal] = useState(false);
//   const [showCollectModal, setShowCollectModal] = useState(false);
//   const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
//   const [collectFormData, setCollectFormData] = useState({
//     amount: '',
//     paymentMethod: 'cash',
//     notes: '',
//   });

//   const [installments] = useState<Installment[]>([
//     { id: '1', customerName: 'محمد أحمد السيد', invoiceNumber: 'INV-2401', totalAmount: 25000, remainingAmount: 15000, nextPaymentDate: '2026-02-10', status: 'regular' },
//     { id: '2', customerName: 'فاطمة حسن علي', invoiceNumber: 'INV-2398', totalAmount: 18000, remainingAmount: 12000, nextPaymentDate: '2026-02-01', status: 'late' },
//     { id: '3', customerName: 'أحمد محمود', invoiceNumber: 'INV-2405', totalAmount: 30000, remainingAmount: 20000, nextPaymentDate: '2026-02-15', status: 'regular' },
//     { id: '4', customerName: 'سارة عبد الله', invoiceNumber: 'INV-2390', totalAmount: 15000, remainingAmount: 0, nextPaymentDate: '-', status: 'completed' },
//     { id: '5', customerName: 'خالد يوسف', invoiceNumber: 'INV-2402', totalAmount: 22000, remainingAmount: 18000, nextPaymentDate: '2026-01-28', status: 'late' },
//   ]);

//   const regularInstallments = installments.filter((i) => i.status === 'regular').length;
//   const lateInstallments = installments.filter((i) => i.status === 'late').length;
//   const totalOutstanding = installments.filter((i) => i.status !== 'completed').reduce((sum, i) => sum + i.remainingAmount, 0);
//   const collectedThisMonth = 45000; // Mock data

//   const openCollectModal = (installment: Installment) => {
//     setSelectedInstallment(installment);
//     setShowCollectModal(true);
//     setCollectFormData({ amount: '', paymentMethod: 'cash', notes: '' });
//   };

//   const closeCollectModal = () => {
//     setShowCollectModal(false);
//     setSelectedInstallment(null);
//     setCollectFormData({ amount: '', paymentMethod: 'cash', notes: '' });
//   };

//   const getStatusBadge = (status: Installment['status']) => {
//     switch (status) {
//       case 'regular':
//         return <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg border border-green-300"><CheckCircle size={14} />منتظم</span>;
//       case 'late':
//         return <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-300"><AlertTriangle size={14} />متأخر</span>;
//       case 'completed':
//         return <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-300"><CheckCircle size={14} />مكتمل</span>;
//     }
//   };

//   return (
//     <div className="h-full overflow-y-auto bg-gray-50 p-6 space-y-6">
//       {/* Page Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-[#1E293B] mb-2">إدارة عمليات التقسيط</h1>
//           <p className="text-gray-600">تتبع شامل لمديونيات العملاء ومواعيد التحصيل</p>
//         </div>

//         <button
//           onClick={() => setShowNewInstallmentModal(true)}
//           className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-lg"
//         >
//           <Plus size={20} />
//           قسط جديد
//         </button>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-3 gap-6">
//         {/* Total Outstanding */}
//         <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-sm border border-blue-200">
//           <div className="flex items-center justify-between mb-6">
//             <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center">
//               <CreditCard className="text-blue-600" size={24} />
//             </div>
//             <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">نشط</span>
//           </div>
//           <div className="text-sm text-gray-600 mb-1">إجمالي الأقساط القائمة</div>
//           <div className="text-3xl font-bold text-gray-900">{totalOutstanding.toLocaleString()}<span className="text-lg mr-1">ج.م</span></div>
//           <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-200/40 rounded-full blur-2xl" />
//         </div>

//         {/* Collected This Month */}
//         <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 p-6 shadow-sm border border-green-200">
//           <div className="flex items-center justify-between mb-6">
//             <div className="w-12 h-12 rounded-xl bg-green-600/10 flex items-center justify-center">
//               <CheckCircle className="text-green-600" size={24} />
//             </div>
//             <span className="text-xs font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">هذا الشهر</span>
//           </div>
//           <div className="text-sm text-gray-600 mb-1">الأقساط المُحصلة</div>
//           <div className="text-3xl font-bold text-gray-900">{collectedThisMonth.toLocaleString()}<span className="text-lg mr-1">ج.م</span></div>
//           <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-green-200/40 rounded-full blur-2xl" />
//         </div>

//         {/* Late Installments */}
//         <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 p-6 shadow-sm border border-red-200">
//           <div className="flex items-center justify-between mb-6">
//             <div className="w-12 h-12 rounded-xl bg-red-600/10 flex items-center justify-center">
//               <AlertTriangle className="text-red-600" size={24} />
//             </div>
//             <span className="text-xs font-semibold text-red-600 bg-red-100 px-3 py-1 rounded-full">متأخر</span>
//           </div>
//           <div className="text-sm text-gray-600 mb-1">أقساط متأخرة</div>
//           <div className="text-3xl font-bold text-gray-900">{lateInstallments}</div>
//           <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-red-200/40 rounded-full blur-2xl" />
//         </div>
//       </div>

//       {/* Installments Table */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//         <h2 className="text-xl font-bold text-[#1E293B] mb-4">جدول عمليات التقسيط</h2>
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gray-50 border-b-2 border-gray-200">
//               <tr>
//                 <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">اسم العميل</th>
//                 <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">رقم الفاتورة</th>
//                 <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">المبلغ الإجمالي</th>
//                 <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">المبلغ المتبقي</th>
//                 <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">تاريخ القسط القادم</th>
//                 <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">الحالة</th>
//                 <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">الإجراءات</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               {installments.map((installment) => (
//                 <tr key={installment.id} className="hover:bg-gray-50 transition-colors">
//                   <td className="px-4 py-4 font-bold text-gray-800">{installment.customerName}</td>
//                   <td className="px-4 py-4 text-gray-600">{installment.invoiceNumber}</td>
//                   <td className="px-4 py-4 font-bold text-[#1E293B]">{installment.totalAmount.toLocaleString()} ج.م</td>
//                   <td className="px-4 py-4 font-bold" style={{color: installment.remainingAmount>0?'#F59E0B':'#10B981'}}>{installment.remainingAmount.toLocaleString()} ج.م</td>
//                   <td className="px-4 py-4 flex items-center gap-2"><Calendar size={16} className="text-gray-400" />{installment.nextPaymentDate}</td>
//                   <td className="px-4 py-4">{getStatusBadge(installment.status)}</td>
//                   <td className="px-4 py-4 flex items-center justify-center">
//                     {installment.status !== 'completed' && (
//                       <button onClick={() => openCollectModal(installment)} className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold rounded-lg flex items-center gap-1">
//                         <DollarSign size={16} />تحصيل قسط
//                       </button>
//                     )}
//                     {installment.status === 'completed' && <span className="text-xs text-gray-400">مكتمل</span>}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Collect Payment Modal */}
//       {showCollectModal && selectedInstallment && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
//             <div className="flex items-center justify-between p-6 border-b border-gray-200">
//               <h2 className="text-xl font-bold text-[#1E293B]">تحصيل قسط</h2>
//               <button onClick={closeCollectModal} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center">
//                 <X size={18} className="text-gray-600" />
//               </button>
//             </div>
//             {/* Modal Body */}
//             <div className="p-6 space-y-4">
//               <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
//                 <div className="text-sm text-blue-700 font-semibold mb-1">اسم العميل</div>
//                 <div className="text-lg font-bold text-blue-900">{selectedInstallment.customerName}</div>
//                 <div className="text-xs text-blue-600 mt-2">رقم الفاتورة: {selectedInstallment.invoiceNumber}</div>
//               </div>
//               <div>
//                 <label className="block text-sm font-bold text-gray-700 mb-2">المبلغ المطلوب</label>
//                 <div className="relative">
//                   <input type="number" value={collectFormData.amount} onChange={(e)=>setCollectFormData({...collectFormData,amount:e.target.value})} className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] text-lg font-bold" placeholder="0" dir="ltr"/>
//                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">ج.م</span>
//                 </div>
//                 <div className="text-xs text-gray-600 mt-2">المتبقي: {selectedInstallment.remainingAmount.toLocaleString()} ج.م</div>
//               </div>
//             </div>
//             <div className="flex items-center gap-3 p-6 border-t border-gray-200">
//               <button onClick={closeCollectModal} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors">إلغاء</button>
//               <button className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2">
//                 <CheckCircle size={20}/> تأكيد التحصيل
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* New Installment Modal */}
//       {showNewInstallmentModal && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
//             <div className="flex items-center justify-between p-6 border-b">
//               <h2 className="text-xl font-bold text-[#1E293B]">قسط جديد</h2>
//               <button onClick={() => setShowNewInstallmentModal(false)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center">
//                 <X size={18} />
//               </button>
//             </div>
//             <div className="p-6 space-y-4">
//               <input type="text" placeholder="اسم العميل" className="w-full px-4 py-3 border rounded-lg"/>
//               <input type="text" placeholder="رقم الفاتورة" className="w-full px-4 py-3 border rounded-lg"/>
//               <div className="grid grid-cols-2 gap-4">
//                 <input type="number" placeholder="إجمالي المبلغ" className="px-4 py-3 border rounded-lg"/>
//                 <input type="number" placeholder="المقدم" className="px-4 py-3 border rounded-lg"/>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <input type="number" placeholder="عدد الأقساط" className="px-4 py-3 border rounded-lg"/>
//                 <input type="date" className="px-4 py-3 border rounded-lg"/>
//               </div>
//               <textarea placeholder="ملاحظات" rows={3} className="w-full px-4 py-3 border rounded-lg resize-none"/>
//             </div>
//             <div className="flex gap-3 p-6 border-t">
//               <button onClick={() => setShowNewInstallmentModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-bold">إلغاء</button>
//               <button className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white py-3 rounded-xl font-bold">حفظ القسط</button>
//             </div>
//           </div>
//         </div>
//       )}

//     </div>
//   );
// }


