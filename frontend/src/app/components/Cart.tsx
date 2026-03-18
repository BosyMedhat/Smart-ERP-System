


import React, { useEffect, useState } from 'react';
import { Plus, Minus, Printer, Clock, CreditCard, X, Calculator } from 'lucide-react';
import { CartItem } from '../App';
import { salesService } from '../../services/salesService'; 

interface CartProps {
  cartItems: CartItem[];
  selectedCustomer: string;
  onCustomerChange: (customer: string) => void;
  discount: number;
  onDiscountChange: (discount: number) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onClearCart: () => void;
}

export function Cart({
  cartItems,
  selectedCustomer,
  onCustomerChange,
  discount,
  onDiscountChange,
  onUpdateQuantity,
  onClearCart,
}: CartProps) {
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  
  // --- حالات جديدة للتقسيط ---
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'INSTALLMENT'>('CASH');
  const [installmentsCount, setInstallmentsCount] = useState<number>(3);
  const [downPayment, setDownPayment] = useState<number>(0);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await salesService.getCustomers();
        setCustomers([{ id: '', name: 'عميل نقدي' }, ...data]);
      } catch (error) {
        console.error('Error loading customers:', error);
      }
    };
    loadCustomers();
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const tax = subtotal * 0.14; 
  const total = subtotal + tax - discount;

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    // التحقق من اختيار عميل في حالة التقسيط
    if (paymentMethod === 'INSTALLMENT' && !selectedCustomer) {
        alert('يجب اختيار عميل لإتمام عملية التقسيط');
        return;
    }

    const invoiceData = {
      invoice_number: `INV-${Date.now()}`,
      customer: selectedCustomer || null,
      total_amount: total,
      payment_method: paymentMethod,
      // بيانات التقسيط (ستُرسل حتى لو كانت كاش والباك إيند سيتجاهلها بناءً على الـ method)
      installments_count: paymentMethod === 'INSTALLMENT' ? installmentsCount : null,
      down_payment: paymentMethod === 'INSTALLMENT' ? downPayment : 0,
      items: cartItems.map(item => ({
        product: item.id.toString(), 
        quantity: item.quantity,
        unit_price: parseFloat((item.price || 0).toString()), 
      })),
    };

    try {
      await salesService.createInvoice(invoiceData);
      alert(paymentMethod === 'INSTALLMENT' ? 'تم إنشاء فاتورة التقسيط وجدولة الأقساط بنجاح!' : 'تم حفظ الفاتورة بنجاح!');
      onClearCart();
      setPaymentMethod('CASH'); // إعادة الحالة للافتراضي
    } catch (error: any) {
      console.error('Error checking out:', error.response?.data || error);
      const errorMessage = error.response?.data?.error || 'الرجاء المحاولة مرة أخرى';
      alert('حدث خطأ: ' + errorMessage);
    }
  };

  return (
    <div className="h-full bg-white rounded-xl shadow-sm flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <label className="block text-sm font-semibold text-gray-700 mb-2">اختيار العميل</label>
        <select
          value={selectedCustomer}
          onChange={(e) => onCustomerChange(e.target.value)}
          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none"
        >
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {cartItems.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 italic">السلة فارغة</div>
        ) : (
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="border border-gray-100 rounded-lg p-3 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{item.name}</div>
                    <div className="text-[#3B82F6] font-bold">{(item.price || 0).toFixed(2)} ج.م</div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg">
                    <button onClick={() => onUpdateQuantity(item.id, -1)} className="text-red-500 p-1"><Minus size={14}/></button>
                    <span className="font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => onUpdateQuantity(item.id, 1)} className="text-green-500 p-1"><Plus size={14}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- قسم التقسيط (يظهر فقط عند الضغط على زر تقسيط) --- */}
      {paymentMethod === 'INSTALLMENT' && (
        <div className="p-4 bg-blue-50 border-t border-blue-100 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-blue-700 font-bold mb-3">
            <Calculator size={18} /> إعدادات التقسيط
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-blue-600 mb-1">عدد الأقساط</label>
              <input 
                type="number" 
                value={installmentsCount} 
                onChange={(e) => setInstallmentsCount(parseInt(e.target.value) || 1)}
                className="w-full p-2 border border-blue-200 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-600 mb-1">المقدم المدفوع</label>
              <input 
                type="number" 
                value={downPayment} 
                onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-blue-200 rounded-lg outline-none"
              />
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-800">
            القسط الشهري التقريبي: <span className="font-bold">{((total - downPayment) / installmentsCount).toFixed(2)} ج.م</span>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">الإجمالي</span>
            <span className="font-semibold">{(subtotal + tax).toFixed(2)} ج.م</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">الخصم</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-center outline-none"
            />
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-lg font-bold text-gray-800">الصافي</span>
            <span className="text-2xl font-bold text-[#10B981]">{total.toFixed(2)} ج.م</span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleCheckout}
            className={`w-full text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors ${paymentMethod === 'INSTALLMENT' ? 'bg-[#3B82F6]' : 'bg-[#10B981]'}`}
            disabled={cartItems.length === 0}
          >
            <Printer size={20} />
            {paymentMethod === 'INSTALLMENT' ? 'إتمام عملية التقسيط' : 'إتمام البيع نقدي'}
          </button>
          
          <div className="grid grid-cols-3 gap-2">
            <button className="bg-[#F59E0B] text-white py-2 rounded-xl flex items-center justify-center gap-1 text-sm"><Clock size={16} /> تعليق</button>
            <button 
                onClick={() => setPaymentMethod(paymentMethod === 'INSTALLMENT' ? 'CASH' : 'INSTALLMENT')}
                className={`py-2 rounded-xl flex items-center justify-center gap-1 text-sm font-semibold transition-all ${paymentMethod === 'INSTALLMENT' ? 'bg-blue-700 text-white ring-2 ring-blue-300' : 'bg-[#3B82F6] text-white'}`}
            >
              <CreditCard size={16} /> {paymentMethod === 'INSTALLMENT' ? 'إلغاء التقسيط' : 'تقسيط'}
            </button>
            <button onClick={onClearCart} className="bg-red-600 text-white py-2 rounded-xl flex items-center justify-center gap-1 text-sm"><X size={16} /> إلغاء</button>
          </div>
        </div>
      </div>
    </div>
  );
}




///------------اخر كود لعمل الفاتورة

// import React, { useEffect, useState } from 'react';
// import { Plus, Minus, Printer, Clock, CreditCard, X } from 'lucide-react';
// import { CartItem } from '../App';
// import { salesService } from '../../services/salesService'; 

// interface CartProps {
//   cartItems: CartItem[];
//   selectedCustomer: string;
//   onCustomerChange: (customer: string) => void;
//   discount: number;
//   onDiscountChange: (discount: number) => void;
//   onUpdateQuantity: (id: string, delta: number) => void;
//   onClearCart: () => void;
// }

// export function Cart({
//   cartItems,
//   selectedCustomer,
//   onCustomerChange,
//   discount,
//   onDiscountChange,
//   onUpdateQuantity,
//   onClearCart,
// }: CartProps) {
//   const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  
//   useEffect(() => {
//     const loadCustomers = async () => {
//       try {
//         const data = await salesService.getCustomers();
//         setCustomers([{ id: '', name: 'عميل نقدي' }, ...data]);
//       } catch (error) {
//         console.error('Error loading customers:', error);
//       }
//     };
//     loadCustomers();
//   }, []);

//   // حساب الإجماليات
//   const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
//   const tax = subtotal * 0.14; // ضريبة 14%
//   const total = subtotal + tax - discount;

//   const handleCheckout = async () => {
//     if (cartItems.length === 0) return;

//     // ✅ هيكل البيانات المعدل ليتوافق مع الـ View الجديد في Django
//     const invoiceData = {
//       invoice_number: `INV-${Date.now()}`, // توليد رقم فاتورة مؤقت
//       customer: selectedCustomer || null,
//       // shift تم حذفه مؤقتاً لأننا جعلناه اختيارياً في الباك إيند
//       total_amount: total,
//       payment_method: 'CASH',
//       items: cartItems.map(item => ({
//         // ✅ التأكد من إرسال الـ ID كنص أو رقم حسب إعدادات الباك إيند (غالباً String في JSON)
//         product: item.id.toString(), 
//         quantity: item.quantity,
//         // ✅ التأكد من أن السعر رقم (Number) وليس نصاً
//         unit_price: parseFloat((item.price || 0).toString()), 
//       })),
//     };

//     try {
//       await salesService.createInvoice(invoiceData);
//       alert('تم حفظ الفاتورة بنجاح وخصم المخزون!');
//       onClearCart();
//     } catch (error: any) {
//       console.error('Error checking out:', error.response?.data || error);
      
//       // ✅ عرض رسالة الخطأ القادمة من الباك إيند (مثل نقص المخزون)
//       const errorMessage = error.response?.data?.error || 
//                            error.response?.data?.detail || 
//                            'الرجاء المحاولة مرة أخرى';
//       alert('حدث خطأ: ' + errorMessage);
//     }
//   };

//   return (
//     <div className="h-full bg-white rounded-xl shadow-sm flex flex-col">
//       {/* ... (الجزء العلوي للمكون) ... */}
//       <div className="p-4 border-b border-gray-200">
//         <label className="block text-sm font-semibold text-gray-700 mb-2">
//           اختيار العميل
//         </label>
//         <select
//           value={selectedCustomer}
//           onChange={(e) => onCustomerChange(e.target.value)}
//           className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
//         >
//           {customers.map((customer) => (
//             <option key={customer.id} value={customer.id}>
//               {customer.name}
//             </option>
//           ))}
//         </select>
//       </div>

//       <div className="flex-1 overflow-y-auto p-4">
//         {cartItems.length === 0 ? (
//           <div className="h-full flex items-center justify-center text-gray-400">
//             <div className="text-center">
//               <div className="text-4xl mb-2">🛒</div>
//               <div>السلة فارغة</div>
//             </div>
//           </div>
//         ) : (
//           <div className="space-y-3">
//             {cartItems.map((item) => (
//               <div key={item.id} className="border border-gray-200 rounded-lg p-3">
//                 <div className="flex items-center gap-3">
//                   <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
//                   <div className="flex-1 min-w-0">
//                     <div className="font-semibold text-gray-800 text-sm truncate">{item.name}</div>
//                     {/* ✅ التعامل الآمن مع السعر */}
//                     <div className="text-[#3B82F6] font-bold text-sm">{(item.price || 0).toFixed(2)} ج.م</div>
//                   </div>
//                 </div>
//                 <div className="flex items-center justify-between mt-3">
//                   <div className="flex items-center gap-2">
//                     <button onClick={() => onUpdateQuantity(item.id, -1)} className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
//                       <Minus size={16} />
//                     </button>
//                     <span className="w-12 text-center font-bold text-gray-800">{item.quantity}</span>
//                     <button onClick={() => onUpdateQuantity(item.id, 1)} className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
//                       <Plus size={16} />
//                     </button>
//                   </div>
//                   <div className="font-bold text-gray-800">
//                     {/* ✅ التعامل الآمن مع الإجمالي */}
//                     {((item.price || 0) * item.quantity).toFixed(2)} ج.م
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* ... (الجزء السفلي للمكون) ... */}
//       <div className="border-t border-gray-200 p-4 bg-gray-50">
//         <div className="space-y-2 mb-4">
//           <div className="flex justify-between text-sm">
//             <span className="text-gray-600">الإجمالي الفرعي</span>
//             <span className="font-semibold text-gray-800">{subtotal.toFixed(2)} ج.م</span>
//           </div>
//           <div className="flex justify-between text-sm">
//             <span className="text-gray-600">الضريبة (14%)</span>
//             <span className="font-semibold text-gray-800">{tax.toFixed(2)} ج.م</span>
//           </div>
//           <div className="flex justify-between text-sm items-center">
//             <span className="text-gray-600">الخصم</span>
//             <input
//               type="number"
//               value={discount}
//               onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
//               className="w-24 px-2 py-1 border border-gray-300 rounded text-left focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
//               placeholder="0.00"
//             />
//           </div>
//         </div>
//         <div className="border-t border-gray-300 pt-3 mb-4">
//           <div className="flex justify-between items-center">
//             <span className="text-lg font-bold text-gray-800">الصافي النهائي</span>
//             <span className="text-2xl font-bold text-[#10B981]">
//               {total.toFixed(2)} ج.م
//             </span>
//           </div>
//         </div>

//         <div className="space-y-2">
//           <button
//             onClick={handleCheckout}
//             className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
//             disabled={cartItems.length === 0}
//           >
//             <Printer size={20} />
//             إتمام البيع وطباعة
//           </button>
//           <div className="grid grid-cols-3 gap-2">
//             <button className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1 text-sm">
//               <Clock size={16} /> تعليق
//             </button>
//             <button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1 text-sm">
//               <CreditCard size={16} /> آجل
//             </button>
//             <button
//               onClick={onClearCart}
//               className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1 text-sm"
//             >
//               <X size={16} /> إلغاء
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


//الكود الاساسي

// import React, { useEffect, useState } from 'react';
// import { Plus, Minus, Printer, Clock, CreditCard, X } from 'lucide-react';
// import { CartItem } from '../App';
// import { salesService } from '../../services/salesService'; 

// interface CartProps {
//   cartItems: CartItem[];
//   selectedCustomer: string;
//   onCustomerChange: (customer: string) => void;
//   discount: number;
//   onDiscountChange: (discount: number) => void;
//   onUpdateQuantity: (id: string, delta: number) => void;
//   onClearCart: () => void;
// }

// export function Cart({
//   cartItems,
//   selectedCustomer,
//   onCustomerChange,
//   discount,
//   onDiscountChange,
//   onUpdateQuantity,
//   onClearCart,
// }: CartProps) {
//   const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  
//   useEffect(() => {
//     const loadCustomers = async () => {
//       try {
//         const data = await salesService.getCustomers();
//         setCustomers([{ id: '', name: 'عميل نقدي' }, ...data]);
//       } catch (error) {
//         console.error('Error loading customers:', error);
//       }
//     };
//     loadCustomers();
//   }, []);

//   // حساب الإجماليات
//   const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
//   const tax = subtotal * 0.14; // ضريبة 14%
//   const total = subtotal + tax - discount;

//   const handleCheckout = async () => {
//     if (cartItems.length === 0) return;

//     // ✅ هيكل البيانات المعدل ليتوافق مع الـ View الجديد في Django
//     const invoiceData = {
//       invoice_number: `INV-${Date.now()}`, // توليد رقم فاتورة مؤقت
//       customer: selectedCustomer || null,
//       // shift تم حذفه مؤقتاً لأننا جعلناه اختيارياً في الباك إيند
//       total_amount: total,
//       payment_method: 'CASH',
//       items: cartItems.map(item => ({
//         product: parseInt(item.id),
//         quantity: item.quantity,
//         unit_price: item.price || 0,
//       })),
//     };

//     try {
//       await salesService.createInvoice(invoiceData);
//       alert('تم حفظ الفاتورة بنجاح وخصم المخزون!');
//       onClearCart();
//     } catch (error: any) {
//       console.error('Error checking out:', error.response?.data || error);
//       // ✅ عرض رسالة الخطأ القادمة من الباك إيند (مثل نقص المخزون)
//       alert('حدث خطأ: ' + (error.response?.data?.error || 'الرجاء المحاولة مرة أخرى'));
//     }
//   };

//   return (
//     <div className="h-full bg-white rounded-xl shadow-sm flex flex-col">
//       {/* ... (الجزء العلوي للمكون) ... */}
//       <div className="p-4 border-b border-gray-200">
//         <label className="block text-sm font-semibold text-gray-700 mb-2">
//           اختيار العميل
//         </label>
//         <select
//           value={selectedCustomer}
//           onChange={(e) => onCustomerChange(e.target.value)}
//           className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
//         >
//           {customers.map((customer) => (
//             <option key={customer.id} value={customer.id}>
//               {customer.name}
//             </option>
//           ))}
//         </select>
//       </div>

//       <div className="flex-1 overflow-y-auto p-4">
//         {cartItems.length === 0 ? (
//           <div className="h-full flex items-center justify-center text-gray-400">
//             <div className="text-center">
//               <div className="text-4xl mb-2">🛒</div>
//               <div>السلة فارغة</div>
//             </div>
//           </div>
//         ) : (
//           <div className="space-y-3">
//             {cartItems.map((item) => (
//               <div key={item.id} className="border border-gray-200 rounded-lg p-3">
//                 <div className="flex items-center gap-3">
//                   <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
//                   <div className="flex-1 min-w-0">
//                     <div className="font-semibold text-gray-800 text-sm truncate">{item.name}</div>
//                     {/* ✅ التعامل الآمن مع السعر */}
//                     <div className="text-[#3B82F6] font-bold text-sm">{(item.price || 0).toFixed(2)} ج.م</div>
//                   </div>
//                 </div>
//                 <div className="flex items-center justify-between mt-3">
//                   <div className="flex items-center gap-2">
//                     <button onClick={() => onUpdateQuantity(item.id, -1)} className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
//                       <Minus size={16} />
//                     </button>
//                     <span className="w-12 text-center font-bold text-gray-800">{item.quantity}</span>
//                     <button onClick={() => onUpdateQuantity(item.id, 1)} className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
//                       <Plus size={16} />
//                     </button>
//                   </div>
//                   <div className="font-bold text-gray-800">
//                     {/* ✅ التعامل الآمن مع الإجمالي */}
//                     {((item.price || 0) * item.quantity).toFixed(2)} ج.م
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* ... (الجزء السفلي للمكون) ... */}
//       <div className="border-t border-gray-200 p-4 bg-gray-50">
//         <div className="space-y-2 mb-4">
//           <div className="flex justify-between text-sm">
//             <span className="text-gray-600">الإجمالي الفرعي</span>
//             <span className="font-semibold text-gray-800">{subtotal.toFixed(2)} ج.م</span>
//           </div>
//           <div className="flex justify-between text-sm">
//             <span className="text-gray-600">الضريبة (14%)</span>
//             <span className="font-semibold text-gray-800">{tax.toFixed(2)} ج.م</span>
//           </div>
//           <div className="flex justify-between text-sm items-center">
//             <span className="text-gray-600">الخصم</span>
//             <input
//               type="number"
//               value={discount}
//               onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
//               className="w-24 px-2 py-1 border border-gray-300 rounded text-left focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
//               placeholder="0.00"
//             />
//           </div>
//         </div>
//         <div className="border-t border-gray-300 pt-3 mb-4">
//           <div className="flex justify-between items-center">
//             <span className="text-lg font-bold text-gray-800">الصافي النهائي</span>
//             <span className="text-2xl font-bold text-[#10B981]">
//               {total.toFixed(2)} ج.م
//             </span>
//           </div>
//         </div>

//         <div className="space-y-2">
//           <button
//             onClick={handleCheckout}
//             className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
//             disabled={cartItems.length === 0}
//           >
//             <Printer size={20} />
//             إتمام البيع وطباعة
//           </button>
//           <div className="grid grid-cols-3 gap-2">
//             <button className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1 text-sm">
//               <Clock size={16} /> تعليق
//             </button>
//             <button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1 text-sm">
//               <CreditCard size={16} /> آجل
//             </button>
//             <button
//               onClick={onClearCart}
//               className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1 text-sm"
//             >
//               <X size={16} /> إلغاء
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }








////////////الاخير تحديث في الكود هو اضافة زر تعليق و اجل في صفحة الكارت

// import { Plus, Minus, Printer, Clock, CreditCard, X } from 'lucide-react';
// import { CartItem } from '../App';


// interface CartProps {
//   cartItems: CartItem[];
//   selectedCustomer: string;
//   onCustomerChange: (customer: string) => void;
//   discount: number;
//   onDiscountChange: (discount: number) => void;
//   onUpdateQuantity: (id: string, delta: number) => void;
//   onClearCart: () => void;
// }

// const customers = [
//   { id: '', name: 'عميل نقدي' },
//   { id: '1', name: 'أحمد محمد - شركة النور' },
//   { id: '2', name: 'فاطمة علي - مؤسسة الأمل' },
//   { id: '3', name: 'محمود حسن - متجر السلام' },
// ];

// export function Cart({
//   cartItems,
//   selectedCustomer,
//   onCustomerChange,
//   discount,
//   onDiscountChange,
//   onUpdateQuantity,
//   onClearCart,
// }: CartProps) {
//   const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
//   const tax = subtotal * 0.14;
//   const total = subtotal + tax - discount;

//   return (
//     <div className="h-full bg-white rounded-xl shadow-sm flex flex-col">
//       {/* Customer Selection */}
//       <div className="p-4 border-b border-gray-200">
//         <label className="block text-sm font-semibold text-gray-700 mb-2">
//           اختيار العميل
//         </label>
//         <select
//           value={selectedCustomer}
//           onChange={(e) => onCustomerChange(e.target.value)}
//           className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
//         >
//           {customers.map((customer) => (
//             <option key={customer.id} value={customer.id}>
//               {customer.name}
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* Cart Items */}
//       <div className="flex-1 overflow-y-auto p-4">
//         {cartItems.length === 0 ? (
//           <div className="h-full flex items-center justify-center text-gray-400">
//             <div className="text-center">
//               <div className="text-4xl mb-2">🛒</div>
//               <div>السلة فارغة</div>
//             </div>
//           </div>
//         ) : (
//           <div className="space-y-3">
//             {cartItems.map((item) => (
//               <div
//                 key={item.id}
//                 className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
//               >
//                 <div className="flex items-center gap-3">
//                   <img
//                     src={item.image}
//                     alt={item.name}
//                     className="w-16 h-16 object-cover rounded-lg"
//                   />
//                   <div className="flex-1 min-w-0">
//                     <div className="font-semibold text-gray-800 text-sm truncate">
//                       {item.name}
//                     </div>
//                     <div className="text-[#3B82F6] font-bold text-sm">
//                       {item.price.toFixed(2)} ج.م
//                     </div>
//                   </div>
//                 </div>
//                 <div className="flex items-center justify-between mt-3">
//                   <div className="flex items-center gap-2">
//                     <button
//                       onClick={() => onUpdateQuantity(item.id, -1)}
//                       className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition-colors"
//                     >
//                       <Minus size={16} />
//                     </button>
//                     <span className="w-12 text-center font-bold text-gray-800">
//                       {item.quantity}
//                     </span>
//                     <button
//                       onClick={() => onUpdateQuantity(item.id, 1)}
//                       className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center hover:bg-green-200 transition-colors"
//                     >
//                       <Plus size={16} />
//                     </button>
//                   </div>
//                   <div className="font-bold text-gray-800">
//                     {(item.price * item.quantity).toFixed(2)} ج.م
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Financial Summary */}
//       <div className="border-t border-gray-200 p-4 bg-gray-50">
//         <div className="space-y-2 mb-4">
//           <div className="flex justify-between text-sm">
//             <span className="text-gray-600">الإجمالي الفرعي</span>
//             <span className="font-semibold text-gray-800">{subtotal.toFixed(2)} ج.م</span>
//           </div>
//           <div className="flex justify-between text-sm">
//             <span className="text-gray-600">الضريبة (14%)</span>
//             <span className="font-semibold text-gray-800">{tax.toFixed(2)} ج.م</span>
//           </div>
//           <div className="flex justify-between text-sm items-center">
//             <span className="text-gray-600">الخصم</span>
//             <input
//               type="number"
//               value={discount}
//               onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
//               className="w-24 px-2 py-1 border border-gray-300 rounded text-left focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
//               placeholder="0.00"
//             />
//           </div>
//         </div>
//         <div className="border-t border-gray-300 pt-3 mb-4">
//           <div className="flex justify-between items-center">
//             <span className="text-lg font-bold text-gray-800">الصافي النهائي</span>
//             <span className="text-2xl font-bold text-[#10B981]">
//               {total.toFixed(2)} ج.م
//             </span>
//           </div>
//         </div>

//         {/* Action Buttons */}
//         <div className="space-y-2">
//           <button
//             className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//             disabled={cartItems.length === 0}
//           >
//             <Printer size={20} />
//             إتمام البيع وطباعة
//           </button>
//           <div className="grid grid-cols-3 gap-2">
//             <button
//               className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//               disabled={cartItems.length === 0}
//             >
//               <Clock size={16} />
//               تعليق
//             </button>
//             <button
//               className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//               disabled={cartItems.length === 0}
//             >
//               <CreditCard size={16} />
//               آجل
//             </button>
//             <button
//               onClick={onClearCart}
//               className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//               disabled={cartItems.length === 0}
//             >
//               <X size={16} />
//               إلغاء
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
