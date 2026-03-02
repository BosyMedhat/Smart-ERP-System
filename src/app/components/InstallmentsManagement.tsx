
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

import { useState } from 'react';
import { CreditCard, Plus, X, Calendar, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';

interface Installment {
  id: string;
  customerName: string;
  invoiceNumber: string;
  totalAmount: number;
  remainingAmount: number;
  nextPaymentDate: string;
  status: 'regular' | 'late' | 'completed';
}

export function InstallmentsManagement() {
  const [showNewInstallmentModal, setShowNewInstallmentModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [collectFormData, setCollectFormData] = useState({
    amount: '',
    paymentMethod: 'cash',
    notes: '',
  });

  const [installments] = useState<Installment[]>([
    { id: '1', customerName: 'محمد أحمد السيد', invoiceNumber: 'INV-2401', totalAmount: 25000, remainingAmount: 15000, nextPaymentDate: '2026-02-10', status: 'regular' },
    { id: '2', customerName: 'فاطمة حسن علي', invoiceNumber: 'INV-2398', totalAmount: 18000, remainingAmount: 12000, nextPaymentDate: '2026-02-01', status: 'late' },
    { id: '3', customerName: 'أحمد محمود', invoiceNumber: 'INV-2405', totalAmount: 30000, remainingAmount: 20000, nextPaymentDate: '2026-02-15', status: 'regular' },
    { id: '4', customerName: 'سارة عبد الله', invoiceNumber: 'INV-2390', totalAmount: 15000, remainingAmount: 0, nextPaymentDate: '-', status: 'completed' },
    { id: '5', customerName: 'خالد يوسف', invoiceNumber: 'INV-2402', totalAmount: 22000, remainingAmount: 18000, nextPaymentDate: '2026-01-28', status: 'late' },
  ]);

  const regularInstallments = installments.filter((i) => i.status === 'regular').length;
  const lateInstallments = installments.filter((i) => i.status === 'late').length;
  const totalOutstanding = installments.filter((i) => i.status !== 'completed').reduce((sum, i) => sum + i.remainingAmount, 0);
  const collectedThisMonth = 45000; // Mock data

  const openCollectModal = (installment: Installment) => {
    setSelectedInstallment(installment);
    setShowCollectModal(true);
    setCollectFormData({ amount: '', paymentMethod: 'cash', notes: '' });
  };

  const closeCollectModal = () => {
    setShowCollectModal(false);
    setSelectedInstallment(null);
    setCollectFormData({ amount: '', paymentMethod: 'cash', notes: '' });
  };

  const getStatusBadge = (status: Installment['status']) => {
    switch (status) {
      case 'regular':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg border border-green-300"><CheckCircle size={14} />منتظم</span>;
      case 'late':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-300"><AlertTriangle size={14} />متأخر</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-300"><CheckCircle size={14} />مكتمل</span>;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1E293B] mb-2">إدارة عمليات التقسيط</h1>
          <p className="text-gray-600">تتبع شامل لمديونيات العملاء ومواعيد التحصيل</p>
        </div>

        <button
          onClick={() => setShowNewInstallmentModal(true)}
          className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-lg"
        >
          <Plus size={20} />
          قسط جديد
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        {/* Total Outstanding */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-sm border border-blue-200">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center">
              <CreditCard className="text-blue-600" size={24} />
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">نشط</span>
          </div>
          <div className="text-sm text-gray-600 mb-1">إجمالي الأقساط القائمة</div>
          <div className="text-3xl font-bold text-gray-900">{totalOutstanding.toLocaleString()}<span className="text-lg mr-1">ج.م</span></div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-200/40 rounded-full blur-2xl" />
        </div>

        {/* Collected This Month */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 p-6 shadow-sm border border-green-200">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-xl bg-green-600/10 flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">هذا الشهر</span>
          </div>
          <div className="text-sm text-gray-600 mb-1">الأقساط المُحصلة</div>
          <div className="text-3xl font-bold text-gray-900">{collectedThisMonth.toLocaleString()}<span className="text-lg mr-1">ج.م</span></div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-green-200/40 rounded-full blur-2xl" />
        </div>

        {/* Late Installments */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 p-6 shadow-sm border border-red-200">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-xl bg-red-600/10 flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <span className="text-xs font-semibold text-red-600 bg-red-100 px-3 py-1 rounded-full">متأخر</span>
          </div>
          <div className="text-sm text-gray-600 mb-1">أقساط متأخرة</div>
          <div className="text-3xl font-bold text-gray-900">{lateInstallments}</div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-red-200/40 rounded-full blur-2xl" />
        </div>
      </div>

      {/* Installments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-[#1E293B] mb-4">جدول عمليات التقسيط</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">اسم العميل</th>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">رقم الفاتورة</th>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">المبلغ الإجمالي</th>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">المبلغ المتبقي</th>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">تاريخ القسط القادم</th>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">الحالة</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {installments.map((installment) => (
                <tr key={installment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 font-bold text-gray-800">{installment.customerName}</td>
                  <td className="px-4 py-4 text-gray-600">{installment.invoiceNumber}</td>
                  <td className="px-4 py-4 font-bold text-[#1E293B]">{installment.totalAmount.toLocaleString()} ج.م</td>
                  <td className="px-4 py-4 font-bold" style={{color: installment.remainingAmount>0?'#F59E0B':'#10B981'}}>{installment.remainingAmount.toLocaleString()} ج.م</td>
                  <td className="px-4 py-4 flex items-center gap-2"><Calendar size={16} className="text-gray-400" />{installment.nextPaymentDate}</td>
                  <td className="px-4 py-4">{getStatusBadge(installment.status)}</td>
                  <td className="px-4 py-4 flex items-center justify-center">
                    {installment.status !== 'completed' && (
                      <button onClick={() => openCollectModal(installment)} className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold rounded-lg flex items-center gap-1">
                        <DollarSign size={16} />تحصيل قسط
                      </button>
                    )}
                    {installment.status === 'completed' && <span className="text-xs text-gray-400">مكتمل</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {showCollectModal && selectedInstallment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-[#1E293B]">تحصيل قسط</h2>
              <button onClick={closeCollectModal} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center">
                <X size={18} className="text-gray-600" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="text-sm text-blue-700 font-semibold mb-1">اسم العميل</div>
                <div className="text-lg font-bold text-blue-900">{selectedInstallment.customerName}</div>
                <div className="text-xs text-blue-600 mt-2">رقم الفاتورة: {selectedInstallment.invoiceNumber}</div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">المبلغ المطلوب</label>
                <div className="relative">
                  <input type="number" value={collectFormData.amount} onChange={(e)=>setCollectFormData({...collectFormData,amount:e.target.value})} className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] text-lg font-bold" placeholder="0" dir="ltr"/>
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">ج.م</span>
                </div>
                <div className="text-xs text-gray-600 mt-2">المتبقي: {selectedInstallment.remainingAmount.toLocaleString()} ج.م</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-6 border-t border-gray-200">
              <button onClick={closeCollectModal} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors">إلغاء</button>
              <button className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2">
                <CheckCircle size={20}/> تأكيد التحصيل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Installment Modal */}
      {showNewInstallmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-[#1E293B] flex items-center gap-2">
                <CreditCard size={25} className="text-[#3B82F6]" />
                قسط جديد
              </h2>
              <button onClick={() => setShowNewInstallmentModal(false)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" placeholder="اسم العميل" className="w-full px-4 py-3 border rounded-lg"/>
              <input type="text" placeholder="رقم الفاتورة" className="w-full px-4 py-3 border rounded-lg"/>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="إجمالي المبلغ" className="px-4 py-3 border rounded-lg"/>
                <input type="number" placeholder="المقدم" className="px-4 py-3 border rounded-lg"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="عدد الأقساط" className="px-4 py-3 border rounded-lg"/>
                <input type="date" className="px-4 py-3 border rounded-lg"/>
              </div>
              <textarea placeholder="ملاحظات" rows={3} className="w-full px-4 py-3 border rounded-lg resize-none"/>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button onClick={() => setShowNewInstallmentModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-bold">إلغاء</button>
              <button className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white py-3 rounded-xl font-bold">حفظ القسط</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


