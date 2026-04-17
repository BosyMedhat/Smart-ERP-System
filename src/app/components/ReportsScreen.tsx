// import { useState } from 'react';
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// // تعريف بيانات التقارير
// interface ReportItem {
//   id: string;
//   type: string;
//   date: string;
//   details: string;
//   amount: number;
// }

// const mockReports: ReportItem[] = [
//   { id: '1', type: 'مبيعات', date: '2026-03-01', details: 'فاتورة #001', amount: 15000 },
//   { id: '2', type: 'مخزون', date: '2026-03-02', details: 'لابتوب HP', amount: 50 },
//   { id: '3', type: 'موظفين', date: '2026-03-03', details: 'مرتب الموظف #1', amount: 5000 },
//   { id: '4', type: 'مبيعات', date: '2026-03-04', details: 'فاتورة #002', amount: 12000 },
//   { id: '5', type: 'مخزون', date: '2026-03-05', details: 'هاتف سامسونج', amount: 30 },
// ];

// export function ReportsScreen() {
//   // حالات البحث والفلترة
//   const [filter, setFilter] = useState<string>('الكل');
//   const [searchQuery, setSearchQuery] = useState<string>('');

//   // فلترة البيانات حسب النوع والبحث
//   const filteredReports = mockReports
//     .filter(r => filter === 'الكل' || r.type === filter)
//     .filter(r => searchQuery === '' || r.details.includes(searchQuery));

//   // حساب إجماليات لكل نوع
//   const totalSales = mockReports
//     .filter(r => r.type === 'مبيعات')
//     .reduce((sum, r) => sum + r.amount, 0);
//   const totalStock = mockReports
//     .filter(r => r.type === 'مخزون')
//     .reduce((sum, r) => sum + r.amount, 0);
//   const totalSalaries = mockReports
//     .filter(r => r.type === 'موظفين')
//     .reduce((sum, r) => sum + r.amount, 0);

//   // بيانات للـ chart (المبيعات فقط)
//   const salesData = mockReports.filter(r => r.type === 'مبيعات');

//   return (
//     <div className="p-6 flex flex-col gap-6 bg-gray-50">
//       <h1 className="text-3xl font-bold text-gray-800">التقارير</h1>

//       {/* بطاقات الإجماليات */}
//       <div className="flex gap-4 flex-wrap">
//         <div className="bg-white shadow p-4 rounded flex-1 text-center">
//           <h3 className="text-gray-500">إجمالي المبيعات</h3>
//           <p className="text-2xl font-bold">{totalSales.toLocaleString()} ج.م</p>
//         </div>
//         <div className="bg-white shadow p-4 rounded flex-1 text-center">
//           <h3 className="text-gray-500">عدد المخزون</h3>
//           <p className="text-2xl font-bold">{totalStock}</p>
//         </div>
//         <div className="bg-white shadow p-4 rounded flex-1 text-center">
//           <h3 className="text-gray-500">إجمالي المرتبات</h3>
//           <p className="text-2xl font-bold">{totalSalaries.toLocaleString()} ج.م</p>
//         </div>
//       </div>

//       {/* Chart للمبيعات */}
//       <div className="bg-white shadow rounded p-4">
//         <h3 className="text-gray-600 mb-2 font-semibold">المبيعات حسب الفاتورة</h3>
//         <ResponsiveContainer width="100%" height={250}>
//           <BarChart data={salesData}>
//             <XAxis dataKey="details" />
//             <YAxis />
//             <Tooltip />
//             <Bar dataKey="amount" fill="#3b82f6" />
//           </BarChart>
//         </ResponsiveContainer>
//       </div>

//       {/* فلترة وبحث */}
//       <div className="flex gap-4 flex-wrap items-center">
//         <select
//           className="border p-2 rounded"
//           value={filter}
//           onChange={(e) => setFilter(e.target.value)}
//         >
//           <option value="الكل">الكل</option>
//           <option value="مبيعات">مبيعات</option>
//           <option value="مخزون">مخزون</option>
//           <option value="موظفين">موظفين</option>
//         </select>

//         <input
//           type="text"
//           placeholder="ابحث في التقارير..."
//           className="border p-2 rounded flex-1"
//           value={searchQuery}
//           onChange={e => setSearchQuery(e.target.value)}
//         />
//       </div>

//       {/* جدول التقارير */}
//       <div className="overflow-x-auto">
//         <table className="w-full border-collapse">
//           <thead className="bg-blue-100">
//             <tr>
//               <th className="border p-3 text-right">النوع</th>
//               <th className="border p-3 text-right">التاريخ</th>
//               <th className="border p-3 text-right">التفاصيل</th>
//               <th className="border p-3 text-right">المبلغ/الكمية</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredReports.map((r) => (
//               <tr key={r.id} className="hover:bg-blue-50">
//                 <td className="border p-2 text-right">{r.type}</td>
//                 <td className="border p-2 text-right">{r.date}</td>
//                 <td className="border p-2 text-right">{r.details}</td>
//                 <td className="border p-2 text-right">{r.amount.toLocaleString()}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );} 



// import { useState } from 'react';
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell
// } from 'recharts';
// import { DollarSign, Package, Users, Download } from 'lucide-react';

// interface ReportItem {
//   id: string;
//   type: string;
//   date: string;
//   details: string;
//   amount: number;
// }

// const mockReports: ReportItem[] = [
//   { id: '1', type: 'مبيعات', date: '2026-03-01', details: 'فاتورة #001', amount: 15000 },
//   { id: '2', type: 'مخزون', date: '2026-03-02', details: 'لابتوب HP', amount: 50 },
//   { id: '3', type: 'موظفين', date: '2026-03-03', details: 'مرتب الموظف #1', amount: 5000 },
//   { id: '4', type: 'مبيعات', date: '2026-03-04', details: 'فاتورة #002', amount: 12000 },
//   { id: '5', type: 'مخزون', date: '2026-03-05', details: 'هاتف سامسونج', amount: 30 },
// ];

// const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

// export function ReportsScreen() {

//   const [filter, setFilter] = useState<string>('الكل');
//   const [searchQuery, setSearchQuery] = useState<string>('');

//   const filteredReports = mockReports
//     .filter(r => filter === 'الكل' || r.type === filter)
//     .filter(r => searchQuery === '' || r.details.includes(searchQuery));

//   const totalSales = mockReports
//     .filter(r => r.type === 'مبيعات')
//     .reduce((sum, r) => sum + r.amount, 0);

//   const totalStock = mockReports
//     .filter(r => r.type === 'مخزون')
//     .reduce((sum, r) => sum + r.amount, 0);

//   const totalSalaries = mockReports
//     .filter(r => r.type === 'موظفين')
//     .reduce((sum, r) => sum + r.amount, 0);

//   const pieData = [
//     { name: 'مبيعات', value: totalSales },
//     { name: 'مخزون', value: totalStock },
//     { name: 'موظفين', value: totalSalaries },
//   ];

//   const salesData = mockReports.filter(r => r.type === 'مبيعات');

//   return (
//     <div className="p-6 flex flex-col gap-6 bg-gray-50 min-h-screen">

//       <div className="flex justify-between items-center">
//         <h1 className="text-3xl font-bold text-gray-800">📊 التقارير</h1>

//         <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
//           <Download size={18} />
//           تصدير التقرير
//         </button>
//       </div>

//       {/* بطاقات الاحصائيات */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

//         <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
//           <div className="flex justify-between items-center">
//             <h3 className="text-gray-500">إجمالي المبيعات</h3>
//             <DollarSign className="text-green-500" />
//           </div>
//           <p className="text-2xl font-bold mt-2">{totalSales.toLocaleString()} ج.م</p>

//           <div className="w-full bg-gray-200 h-2 rounded mt-3">
//             <div className="bg-green-500 h-2 rounded w-[80%]"></div>
//           </div>
//         </div>

//         <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
//           <div className="flex justify-between items-center">
//             <h3 className="text-gray-500">المخزون</h3>
//             <Package className="text-blue-500" />
//           </div>
//           <p className="text-2xl font-bold mt-2">{totalStock}</p>

//           <div className="w-full bg-gray-200 h-2 rounded mt-3">
//             <div className="bg-blue-500 h-2 rounded w-[60%]"></div>
//           </div>
//         </div>

//         <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
//           <div className="flex justify-between items-center">
//             <h3 className="text-gray-500">المرتبات</h3>
//             <Users className="text-yellow-500" />
//           </div>
//           <p className="text-2xl font-bold mt-2">{totalSalaries.toLocaleString()} ج.م</p>

//           <div className="w-full bg-gray-200 h-2 rounded mt-3">
//             <div className="bg-yellow-500 h-2 rounded w-[40%]"></div>
//           </div>
//         </div>

//       </div>

//       {/* الرسوم البيانية */}
//       <div className="grid md:grid-cols-2 gap-4">

//         {/* Bar Chart */}
//         <div className="bg-white shadow rounded-xl p-4">
//           <h3 className="mb-3 font-semibold text-gray-600">المبيعات حسب الفاتورة</h3>

//           <ResponsiveContainer width="100%" height={250}>
//             <BarChart data={salesData}>
//               <XAxis dataKey="details" />
//               <YAxis />
//               <Tooltip />
//               <Bar dataKey="amount" fill="#3b82f6" radius={[5,5,0,0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>

//         {/* Pie Chart */}
//         <div className="bg-white shadow rounded-xl p-4">
//           <h3 className="mb-3 font-semibold text-gray-600">توزيع التقارير</h3>

//           <ResponsiveContainer width="100%" height={250}>
//             <PieChart>
//               <Pie
//                 data={pieData}
//                 dataKey="value"
//                 outerRadius={90}
//                 label
//               >
//                 {pieData.map((entry, index) => (
//                   <Cell key={index} fill={COLORS[index]} />
//                 ))}
//               </Pie>
//               <Tooltip />
//             </PieChart>
//           </ResponsiveContainer>

//         </div>

//       </div>

//       {/* الفلترة */}
//       <div className="flex gap-4 flex-wrap items-center">

//         <select
//           className="border p-2 rounded"
//           value={filter}
//           onChange={(e) => setFilter(e.target.value)}
//         >
//           <option value="الكل">الكل</option>
//           <option value="مبيعات">مبيعات</option>
//           <option value="مخزون">مخزون</option>
//           <option value="موظفين">موظفين</option>
//         </select>

//         <input
//           type="text"
//           placeholder="ابحث في التقارير..."
//           className="border p-2 rounded flex-1"
//           value={searchQuery}
//           onChange={e => setSearchQuery(e.target.value)}
//         />

//       </div>

//       {/* جدول التقارير */}
//       <div className="bg-white shadow rounded-xl overflow-hidden">

//         <table className="w-full">

//           <thead className="bg-gray-100">
//             <tr>
//               <th className="p-3 text-right">النوع</th>
//               <th className="p-3 text-right">التاريخ</th>
//               <th className="p-3 text-right">التفاصيل</th>
//               <th className="p-3 text-right">القيمة</th>
//             </tr>
//           </thead>

//           <tbody>
//             {filteredReports.map((r) => (
//               <tr
//                 key={r.id}
//                 className="border-t hover:bg-gray-50 transition"
//               >
//                 <td className="p-3">{r.type}</td>
//                 <td className="p-3">{r.date}</td>
//                 <td className="p-3">{r.details}</td>
//                 <td className="p-3 font-medium">{r.amount.toLocaleString()}</td>
//               </tr>
//             ))}
//           </tbody>

//         </table>

//       </div>

//     </div>
//   );
// }





import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Download, Printer, FileText, DollarSign, Package, Users } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportItem {
  id: string;
  type: string;
  date: string;
  details: string;
  amount: number;
}

interface ReportsScreenProps {
  reports?: ReportItem[]; // يفضل تمرير البيانات من App لاحقاً
}

// بيانات تجريبية (تُستخدم فقط لو لم يتم تمرير بيانات)
const mockReports: ReportItem[] = [
  { id: "1", type: "مبيعات", date: "2026-03-01", details: "فاتورة #001", amount: 15000 },
  { id: "2", type: "مخزون", date: "2026-03-02", details: "لابتوب HP", amount: 50 },
  { id: "3", type: "موظفين", date: "2026-03-03", details: "مرتب الموظف #1", amount: 5000 },
  { id: "4", type: "مبيعات", date: "2026-03-04", details: "فاتورة #002", amount: 12000 },
  { id: "5", type: "مخزون", date: "2026-03-05", details: "هاتف سامسونج", amount: 30 },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

export function ReportsScreen({ reports }: ReportsScreenProps) {
  const data = reports && reports.length ? reports : mockReports;

  const [filter, setFilter] = useState("الكل");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredReports = useMemo(() => {
    return data
      .filter((r) => filter === "الكل" || r.type === filter)
      .filter((r) => (searchQuery ? r.details.includes(searchQuery) : true))
      .filter((r) => (fromDate ? new Date(r.date) >= new Date(fromDate) : true))
      .filter((r) => (toDate ? new Date(r.date) <= new Date(toDate) : true));
  }, [data, filter, searchQuery, fromDate, toDate]);

  const totalSales = data
    .filter((r) => r.type === "مبيعات")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalStock = data
    .filter((r) => r.type === "مخزون")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalSalaries = data
    .filter((r) => r.type === "موظفين")
    .reduce((sum, r) => sum + r.amount, 0);

  const pieData = [
    { name: "مبيعات", value: totalSales },
    { name: "مخزون", value: totalStock },
    { name: "موظفين", value: totalSalaries },
  ];

  const salesData = data.filter((r) => r.type === "مبيعات");

  // تصدير Excel
  const exportExcel = () => {
    const sheetData = filteredReports.map((r) => ({
      النوع: r.type,
      التاريخ: r.date,
      التفاصيل: r.details,
      القيمة: r.amount,
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(fileData, "ERP_Reports.xlsx");
  };

  // تصدير PDF
  const exportPDF = () => {
    const doc = new jsPDF();

    doc.text("ERP Reports", 14, 15);

    const tableData = filteredReports.map((r) => [
      r.type,
      r.date,
      r.details,
      r.amount,
    ]);

    autoTable(doc, {
      startY: 20,
      head: [["Type", "Date", "Details", "Amount"]],
      body: tableData,
    });

    doc.save("ERP_Reports.pdf");
  };

  // طباعة
  const printReport = () => {
    window.print();
  };

  return (
    <div className="p-6 flex flex-col gap-6 bg-gray-50 min-h-screen">

      {/* العنوان */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">📊 التقارير</h1>

        <div className="flex gap-2">
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded"
          >
            <Download size={18} /> Excel
          </button>

          <button
            onClick={exportPDF}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded"
          >
            <FileText size={18} /> PDF
          </button>

          <button
            onClick={printReport}
            className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded"
          >
            <Printer size={18} /> طباعة
          </button>
        </div>
      </div>

      {/* الكروت */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow">
          <div className="flex justify-between">
            <h3>المبيعات</h3>
            <DollarSign className="text-green-500" />
          </div>
          <p className="text-2xl font-bold">{totalSales.toLocaleString()}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <div className="flex justify-between">
            <h3>المخزون</h3>
            <Package className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold">{totalStock}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <div className="flex justify-between">
            <h3>المرتبات</h3>
            <Users className="text-yellow-500" />
          </div>
          <p className="text-2xl font-bold">{totalSalaries}</p>
        </div>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid md:grid-cols-2 gap-4">

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="mb-2">المبيعات</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesData}>
              <XAxis dataKey="details" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="mb-2">توزيع التقارير</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" outerRadius={90} label>
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* الفلترة */}
      <div className="flex gap-4 flex-wrap">
        <select
          className="border p-2 rounded"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="الكل">الكل</option>
          <option value="مبيعات">مبيعات</option>
          <option value="مخزون">مخزون</option>
          <option value="موظفين">موظفين</option>
        </select>

        <input
          type="text"
          placeholder="بحث..."
          className="border p-2 rounded"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <input
          type="date"
          className="border p-2 rounded"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />

        <input
          type="date"
          className="border p-2 rounded"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
      </div>

      {/* الجدول */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-right">النوع</th>
              <th className="p-3 text-right">التاريخ</th>
              <th className="p-3 text-right">التفاصيل</th>
              <th className="p-3 text-right">القيمة</th>
            </tr>
          </thead>

          <tbody>
            {filteredReports.map((r) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{r.type}</td>
                <td className="p-3">{r.date}</td>
                <td className="p-3">{r.details}</td>
                <td className="p-3">{r.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}