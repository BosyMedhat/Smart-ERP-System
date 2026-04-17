// import { useState } from "react";

// interface Quotation {
//   id: string;
//   customer: string;
//   date: string;
//   total: number;
//   status: string;
// }

// export function QuotationsScreen() {

//   const [quotations, setQuotations] = useState<Quotation[]>([]);
//   const [showForm, setShowForm] = useState(false);

//   const [customer, setCustomer] = useState("");
//   const [date, setDate] = useState("");
//   const [total, setTotal] = useState<number>(0);
//   const [status, setStatus] = useState("معلق");

//   const addQuotation = () => {

//     const newQuotation: Quotation = {
//       id: "Q-" + (quotations.length + 1).toString().padStart(3, "0"),
//       customer,
//       date,
//       total,
//       status
//     };

//     setQuotations([...quotations, newQuotation]);

//     setCustomer("");
//     setDate("");
//     setTotal(0);
//     setStatus("معلق");
//     setShowForm(false);
//   };

//   return (
//     <div className="p-6 flex flex-col gap-6 bg-gray-50 h-full">

//       {/* العنوان */}
//       <div className="flex justify-between items-center">

//         <h1 className="text-2xl font-bold">عروض الأسعار</h1>

//         <button
//           onClick={() => setShowForm(true)}
//           className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//         >
//           عرض سعر جديد
//         </button>

//       </div>


//       {/* فورم إضافة عرض سعر */}

//       {showForm && (

//         <div className="bg-white p-4 rounded shadow flex flex-col gap-4">

//           <h2 className="font-semibold text-lg">إضافة عرض سعر</h2>

//           <input
//             type="text"
//             placeholder="اسم العميل"
//             value={customer}
//             onChange={(e) => setCustomer(e.target.value)}
//             className="border p-2 rounded"
//           />

//           <input
//             type="date"
//             value={date}
//             onChange={(e) => setDate(e.target.value)}
//             className="border p-2 rounded"
//           />

//           <input
//             type="number"
//             placeholder="المبلغ"
//             value={total}
//             onChange={(e) => setTotal(Number(e.target.value))}
//             className="border p-2 rounded"
//           />

//           <select
//             value={status}
//             onChange={(e) => setStatus(e.target.value)}
//             className="border p-2 rounded"
//           >
//             <option>معلق</option>
//             <option>تم الإرسال</option>
//             <option>مقبول</option>
//             <option>مرفوض</option>
//           </select>

//           <div className="flex gap-2">

//             <button
//               onClick={addQuotation}
//               className="bg-green-600 text-white px-4 py-2 rounded"
//             >
//               حفظ
//             </button>

//             <button
//               onClick={() => setShowForm(false)}
//               className="bg-gray-400 text-white px-4 py-2 rounded"
//             >
//               إلغاء
//             </button>

//           </div>

//         </div>

//       )}


//       {/* جدول العروض */}

//       <div className="bg-white rounded shadow overflow-hidden">

//         <table className="w-full">

//           <thead className="bg-gray-100">
//             <tr>
//               <th className="p-3 text-right">رقم العرض</th>
//               <th className="p-3 text-right">العميل</th>
//               <th className="p-3 text-right">التاريخ</th>
//               <th className="p-3 text-right">الإجمالي</th>
//               <th className="p-3 text-right">الحالة</th>
//             </tr>
//           </thead>

//           <tbody>

//             {quotations.map((q) => (

//               <tr key={q.id} className="border-t hover:bg-gray-50">

//                 <td className="p-3">{q.id}</td>
//                 <td className="p-3">{q.customer}</td>
//                 <td className="p-3">{q.date}</td>
//                 <td className="p-3">{q.total.toLocaleString()} ج.م</td>
//                 <td className="p-3">{q.status}</td>

//               </tr>

//             ))}

//           </tbody>

//         </table>

//       </div>

//     </div>
//   );
// }


import { useState, useEffect } from "react";

interface Quotation {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: string;
}

export function QuotationsScreen() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [customer, setCustomer] = useState("");
  const [date, setDate] = useState("");
  const [total, setTotal] = useState<number>(0);
  const [status, setStatus] = useState("معلق");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "total" | "id">("id");

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("quotations");
    if (stored) setQuotations(JSON.parse(stored));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("quotations", JSON.stringify(quotations));
  }, [quotations]);

  const addQuotation = () => {
    if (!customer || !date || total <= 0) {
      alert("يرجى إدخال جميع البيانات بشكل صحيح");
      return;
    }

    const newQuotation: Quotation = {
      id: "Q-" + (quotations.length + 1).toString().padStart(3, "0"),
      customer,
      date,
      total,
      status,
    };

    setQuotations([...quotations, newQuotation]);

    setCustomer("");
    setDate("");
    setTotal(0);
    setStatus("معلق");
    setShowForm(false);
  };

  const deleteQuotation = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا العرض؟")) {
      setQuotations(quotations.filter((q) => q.id !== id));
    }
  };

  const editQuotation = (id: string) => {
    const q = quotations.find((q) => q.id === id);
    if (q) {
      setCustomer(q.customer);
      setDate(q.date);
      setTotal(q.total);
      setStatus(q.status);
      setShowForm(true);
      deleteQuotation(id); // remove old while editing
    }
  };

  const filteredQuotations = quotations
    .filter((q) => q.customer.includes(search) || q.id.includes(search))
    .sort((a, b) => {
      if (sortBy === "date") return a.date.localeCompare(b.date);
      if (sortBy === "total") return b.total - a.total;
      return a.id.localeCompare(b.id);
    });

  return (
    <div className="p-6 flex flex-col gap-6 bg-gray-50 h-full">

      {/* العنوان + زر إضافة */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">عروض الأسعار</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          عرض سعر جديد
        </button>
      </div>

      {/* البحث + الفرز */}
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="بحث بالعميل أو رقم العرض"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="border p-2 rounded"
        >
          <option value="id">فرز حسب رقم العرض</option>
          <option value="date">فرز حسب التاريخ</option>
          <option value="total">فرز حسب الإجمالي</option>
        </select>
      </div>

      {/* فورم إضافة/تعديل عرض سعر */}
      {showForm && (
        <div className="bg-white p-4 rounded shadow flex flex-col gap-4 animate-fade-in">
          <h2 className="font-semibold text-lg">إضافة / تعديل عرض سعر</h2>

          <input
            type="text"
            placeholder="اسم العميل"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="number"
            placeholder="المبلغ"
            value={total}
            onChange={(e) => setTotal(Number(e.target.value))}
            className="border p-2 rounded"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border p-2 rounded"
          >
            <option>معلق</option>
            <option>تم الإرسال</option>
            <option>مقبول</option>
            <option>مرفوض</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={addQuotation}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              حفظ
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* جدول العروض */}
      <div className="bg-white rounded shadow overflow-hidden">
        {filteredQuotations.length === 0 ? (
          <p className="p-3 text-center text-gray-500">لا توجد عروض سعر حالياً</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-right">رقم العرض</th>
                <th className="p-3 text-right">العميل</th>
                <th className="p-3 text-right">التاريخ</th>
                <th className="p-3 text-right">الإجمالي</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right">خيارات</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.map((q) => (
                <tr key={q.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{q.id}</td>
                  <td className="p-3">{q.customer}</td>
                  <td className="p-3">{q.date}</td>
                  <td className="p-3">{q.total.toLocaleString()} ج.م</td>
                  <td
                    className={`p-3 font-semibold ${
                      q.status === "معلق"
                        ? "text-yellow-600"
                        : q.status === "تم الإرسال"
                        ? "text-blue-600"
                        : q.status === "مقبول"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {q.status}
                  </td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => editQuotation(q.id)}
                      className="text-blue-500 hover:underline"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => deleteQuotation(q.id)}
                      className="text-red-500 hover:underline"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}