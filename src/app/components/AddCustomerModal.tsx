// interface AddCustomerModalProps {
//   onClose: () => void;
// }

// export function AddCustomerModal({ onClose }: AddCustomerModalProps) {
//   return (
//     <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
//       <div className="bg-white rounded-2xl shadow-lg w-[400px] p-6 border border-gray-200">
//         <h2 className="text-lg font-bold mb-4">إضافة عميل جديد</h2>
//         <input
//           type="text"
//           placeholder="اسم العميل"
//           className="w-full border rounded-lg px-3 py-2 mb-3"
//         />
//         <input
//           type="text"
//           placeholder="رقم الهاتف"
//           className="w-full border rounded-lg px-3 py-2 mb-3"
//         />
//         <div className="flex justify-end gap-2 mt-4">
//           <button
//             onClick={onClose}
//             className="px-3 py-2 bg-gray-200 rounded-lg"
//           >
//             إلغاء
//           </button>
//           <button className="px-3 py-2 bg-[#3B82F6] text-white rounded-lg">
//             حفظ
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// import React, { useState } from 'react';

// interface AddCustomerModalProps {
//   onClose: () => void;
// }

// export function AddCustomerModal({ onClose }: AddCustomerModalProps) {
//   // state لكل input
//   const [name, setName] = useState('');
//   const [phone, setPhone] = useState('');
//   const [email, setEmail] = useState('');
//   const [address, setAddress] = useState('');
//   const [notes, setNotes] = useState('');

//   const handleSave = () => {
//     // هنا ممكن تضيفي call للـ backend أو API
//     console.log({ name, phone, email, address, notes });
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/30">
//       <div className="w-[450px] p-6 rounded-3xl shadow-2xl
//                       bg-gradient-to-br from-[#FDE68A] via-[#FCA5A5] to-[#F472B6]">
//         <h2 className="text-2xl font-bold mb-6 text-white text-center">إضافة عميل جديد</h2>

//         <input
//           type="text"
//           placeholder="اسم العميل"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           className="w-full rounded-xl px-4 py-3 mb-4 bg-white/80 border border-white/50 placeholder-gray-700 focus:outline-none"
//         />

//         <input
//           type="text"
//           placeholder="رقم الهاتف"
//           value={phone}
//           onChange={(e) => setPhone(e.target.value)}
//           className="w-full rounded-xl px-4 py-3 mb-4 bg-white/80 border border-white/50 placeholder-gray-700 focus:outline-none"
//         />

//         <input
//           type="email"
//           placeholder="البريد الإلكتروني"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           className="w-full rounded-xl px-4 py-3 mb-4 bg-white/80 border border-white/50 placeholder-gray-700 focus:outline-none"
//         />

//         <input
//           type="text"
//           placeholder="العنوان"
//           value={address}
//           onChange={(e) => setAddress(e.target.value)}
//           className="w-full rounded-xl px-4 py-3 mb-4 bg-white/80 border border-white/50 placeholder-gray-700 focus:outline-none"
//         />

//         <textarea
//           placeholder="ملاحظات"
//           value={notes}
//           onChange={(e) => setNotes(e.target.value)}
//           className="w-full rounded-xl px-4 py-3 mb-4 bg-white/80 border border-white/50 placeholder-gray-700 focus:outline-none resize-none"
//           rows={3}
//         />

//         <div className="flex justify-end gap-3 mt-6">
//           <button
//             onClick={onClose}
//             className="px-5 py-2 rounded-xl bg-white/70 text-gray-800 hover:bg-white transition"
//           >
//             إلغاء
//           </button>
//           <button
//             onClick={handleSave}
//             className="px-5 py-2 rounded-xl bg-white text-[#3B82F6] font-bold hover:scale-105 transition-transform"
//           >
//             حفظ
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


// import React, { useState } from 'react';

// interface AddCustomerModalProps {
//   onClose: () => void;
// }

// export function AddCustomerModal({ onClose }: AddCustomerModalProps) {
//   // State لكل input
//   const [name, setName] = useState('');
//   const [phone, setPhone] = useState('');
//   const [email, setEmail] = useState('');
//   const [address, setAddress] = useState('');
//   const [notes, setNotes] = useState('');
//   const [birthDate, setBirthDate] = useState('');
//   const [clientType, setClientType] = useState('شخص');

//   const handleSave = () => {
//     console.log({ name, phone, email, address, notes, birthDate, clientType });
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/30 animate-fade-in-up">
//       <div className="w-[500px] p-8 rounded-3xl shadow-2xl
//                       bg-gradient-to-br from-[#FFD6BA]/90 via-[#FFB3C1]/80 to-[#C7CEEA]/90 border border-white/20">
//         <h2 className="text-2xl font-bold mb-6 text-white text-center">إضافة عميل جديد</h2>

//         <input
//           type="text"
//           placeholder="اسم العميل"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           className="w-full rounded-xl px-4 py-3 mb-4 bg-white/90 border border-white/30 shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
//         />

//         <input
//           type="text"
//           placeholder="رقم الهاتف"
//           value={phone}
//           onChange={(e) => setPhone(e.target.value)}
//           className="w-full rounded-xl px-4 py-3 mb-4 bg-white/90 border border-white/30 shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
//         />

//         <input
//           type="email"
//           placeholder="البريد الإلكتروني"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           className="w-full rounded-xl px-4 py-3 mb-4 bg-white/90 border border-white/30 shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
//         />

//         <input
//           type="text"
//           placeholder="العنوان"
//           value={address}
//           onChange={(e) => setAddress(e.target.value)}
//           className="w-full rounded-xl px-4 py-3 mb-4 bg-white/90 border border-white/30 shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
//         />

//         <input
//           type="date"
//           placeholder="تاريخ الميلاد"
//           value={birthDate}
//           onChange={(e) => setBirthDate(e.target.value)}
//           className="w-full rounded-xl px-4 py-3 mb-4 bg-white/90 border border-white/30 shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
//         />

//         <select
//           value={clientType}
//           onChange={(e) => setClientType(e.target.value)}
//           className="w-full rounded-xl px-4 py-3 mb-4 bg-white/90 border border-white/30 shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
//         >
//           <option>شخص</option>
//           <option>شركة</option>
//         </select>

//         <textarea
//           placeholder="ملاحظات"
//           value={notes}
//           onChange={(e) => setNotes(e.target.value)}
//           className="w-full rounded-xl px-4 py-3 mb-4 bg-white/90 border border-white/30 shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] resize-none"
//           rows={3}
//         />

//         <div className="flex justify-end gap-3 mt-6">
//           <button
//             onClick={onClose}
//             className="px-5 py-2 rounded-xl bg-white/70 text-gray-800 hover:bg-white transition"
//           >
//             إلغاء
//           </button>
//           <button
//             onClick={handleSave}
//             className="px-5 py-2 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#1E293B] text-white font-bold hover:scale-105 transition-transform"
//           >
//             حفظ
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


//////////////////////////////////////////////////////

// import { useState, useEffect } from "react";

// interface Customer {
//   id: string;
//   name: string;
//   phone: string;
//   email?: string;
//   address?: string;
// }

// interface AddCustomerModalProps {
//   onClose: () => void;
// }

// export function AddCustomerModal({ onClose }: AddCustomerModalProps) {
//   const [name, setName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [email, setEmail] = useState("");
//   const [address, setAddress] = useState("");

//   const [customers, setCustomers] = useState<Customer[]>([]);

//   // Load existing customers
//   useEffect(() => {
//     const stored = localStorage.getItem("customers");
//     if (stored) setCustomers(JSON.parse(stored));
//   }, []);

//   // Save customers on change
//   useEffect(() => {
//     localStorage.setItem("customers", JSON.stringify(customers));
//   }, [customers]);

//   const addCustomer = () => {
//     if (!name.trim()) {
//       alert("الرجاء إدخال اسم العميل");
//       return;
//     }
//     if (!phone.trim()) {
//       alert("الرجاء إدخال رقم الهاتف");
//       return;
//     }

//     const newCustomer: Customer = {
//       id: "C-" + (customers.length + 1).toString().padStart(3, "0"),
//       name,
//       phone,
//       email,
//       address,
//     };

//     setCustomers([...customers, newCustomer]);

//     // Reset fields
//     setName("");
//     setPhone("");
//     setEmail("");
//     setAddress("");

//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
//       <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative animate-fade-in">
//         <h2 className="text-xl font-bold mb-4">إضافة عميل جديد</h2>

//         <input
//           type="text"
//           placeholder="اسم العميل"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           className="border p-2 rounded w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
//         />

//         <input
//           type="tel"
//           placeholder="رقم الهاتف"
//           value={phone}
//           onChange={(e) => setPhone(e.target.value)}
//           className="border p-2 rounded w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
//         />

//         <input
//           type="email"
//           placeholder="البريد الإلكتروني (اختياري)"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           className="border p-2 rounded w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
//         />

//         <input
//           type="text"
//           placeholder="العنوان (اختياري)"
//           value={address}
//           onChange={(e) => setAddress(e.target.value)}
//           className="border p-2 rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
//         />

//         <div className="flex justify-end gap-3">
//           <button
//             onClick={addCustomer}
//             className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
//           >
//             حفظ
//           </button>
//           <button
//             onClick={onClose}
//             className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
//           >
//             إلغاء
//           </button>
//         </div>

//         {/* قائمة العملاء الحاليين (اختياري للعرض) */}
//         {customers.length > 0 && (
//           <div className="mt-6">
//             <h3 className="text-sm font-semibold text-gray-700 mb-2">العملاء الحاليين:</h3>
//             <ul className="max-h-32 overflow-y-auto border rounded p-2">
//               {customers.map((c) => (
//                 <li key={c.id} className="text-sm text-gray-600 border-b last:border-b-0 py-1">
//                   {c.name} - {c.phone}
//                 </li>
//               ))}
//             </ul>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }





// import { useState, useEffect } from "react";

// interface Customer {
//   id: string;
//   name: string;
//   phone: string;
//   email?: string;
//   address?: string;
// }

// interface AddCustomerModalProps {
//   onClose: () => void;
// }

// export function AddCustomerModal({ onClose }: AddCustomerModalProps) {
//   const [name, setName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [email, setEmail] = useState("");
//   const [address, setAddress] = useState("");

//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [search, setSearch] = useState("");

//   useEffect(() => {
//     const stored = localStorage.getItem("customers");
//     if (stored) setCustomers(JSON.parse(stored));
//   }, []);

//   useEffect(() => {
//     localStorage.setItem("customers", JSON.stringify(customers));
//   }, [customers]);

//   const addCustomer = () => {
//     if (!name.trim()) {
//       alert("الرجاء إدخال اسم العميل");
//       return;
//     }
//     if (!phone.trim()) {
//       alert("الرجاء إدخال رقم الهاتف");
//       return;
//     }

//     const newCustomer: Customer = {
//       id: "C-" + (customers.length + 1).toString().padStart(3, "0"),
//       name,
//       phone,
//       email,
//       address,
//     };

//     setCustomers([...customers, newCustomer]);
//     setName("");
//     setPhone("");
//     setEmail("");
//     setAddress("");
//     setSearch("");
//     onClose();
//   };

//   const filteredCustomers = customers.filter(
//     (c) =>
//       c.name.toLowerCase().includes(search.toLowerCase()) ||
//       c.phone.includes(search)
//   );

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
//       <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 animate-fade-in">
//         <h2 className="text-xl font-bold mb-4 text-gray-800">إضافة عميل جديد</h2>

//         <input
//           type="text"
//           placeholder="اسم العميل"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           className="border border-gray-300 p-2 rounded w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
//         />

//         <input
//           type="tel"
//           placeholder="رقم الهاتف"
//           value={phone}
//           onChange={(e) => setPhone(e.target.value)}
//           className="border border-gray-300 p-2 rounded w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
//         />

//         <input
//           type="email"
//           placeholder="البريد الإلكتروني (اختياري)"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           className="border border-gray-300 p-2 rounded w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
//         />

//         <input
//           type="text"
//           placeholder="العنوان (اختياري)"
//           value={address}
//           onChange={(e) => setAddress(e.target.value)}
//           className="border border-gray-300 p-2 rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-300"
//         />

//         <div className="flex justify-end gap-3 mb-4">
//           <button
//             onClick={addCustomer}
//             className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
//           >
//             حفظ العميل
//           </button>
//           <button
//             onClick={onClose}
//             className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded transition-colors"
//           >
//             إلغاء
//           </button>
//         </div>

//         {customers.length > 0 && (
//           <div className="mb-3">
//             <input
//               type="text"
//               placeholder="ابحث في العملاء الحاليين..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-200 mb-2"
//             />
//             <ul className="max-h-40 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
//               {filteredCustomers.length === 0 ? (
//                 <li className="text-gray-500 text-sm text-center py-2">
//                   لا يوجد عملاء مطابقين
//                 </li>
//               ) : (
//                 filteredCustomers.map((c) => (
//                   <li
//                     key={c.id}
//                     className="text-gray-700 text-sm border-b last:border-b-0 py-1 flex justify-between hover:bg-gray-100 px-2 rounded transition-colors"
//                   >
//                     <span>{c.name}</span>
//                     <span className="text-gray-500">{c.phone}</span>
//                   </li>
//                 ))
//               )}
//             </ul>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }



// import { useState, useEffect } from "react";
// import { v4 as uuidv4 } from "uuid";

// interface Customer {
//   id: string;
//   name: string;
//   phone: string;
//   email?: string;
//   address?: string;
// }

// interface AddCustomerModalProps {
//   onClose: () => void;
// }

// export function AddCustomerModal({ onClose }: AddCustomerModalProps) {
//   const [form, setForm] = useState({
//     name: "",
//     phone: "",
//     email: "",
//     address: ""
//   });
//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [search, setSearch] = useState("");

//   // تحميل العملاء من localStorage عند فتح المودال
//   useEffect(() => {
//     const stored = localStorage.getItem("customers");
//     if (stored) setCustomers(JSON.parse(stored));
//   }, []);

//   // حفظ العملاء في localStorage عند التغيير
//   useEffect(() => {
//     localStorage.setItem("customers", JSON.stringify(customers));
//   }, [customers]);

//   // تغيير الحقول
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setForm({ ...form, [name]: value });
//   };

//   // إضافة عميل جديد
//   const addCustomer = () => {
//     if (!form.name.trim()) return alert("الرجاء إدخال اسم العميل");
//     if (!form.phone.trim()) return alert("الرجاء إدخال رقم الهاتف");

//     const newCustomer: Customer = {
//       id: uuidv4(),
//       ...form
//     };

//     setCustomers([...customers, newCustomer]);
//     setForm({ name: "", phone: "", email: "", address: "" });
//     setSearch("");
//     onClose();
//   };

//   // فلترة العملاء
//   const filteredCustomers = customers.filter(c =>
//     c.name.toLowerCase().includes(search.toLowerCase()) ||
//     c.phone.includes(search) ||
//     (c.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
//     (c.address?.toLowerCase().includes(search.toLowerCase()) ?? false)
//   );

//   // حفظ بالضغط على Enter
//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter") addCustomer();
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
//       <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 animate-fade-in">
//         <h2 className="text-xl font-bold mb-4 text-gray-800">إضافة عميل جديد</h2>

//         <input
//           autoFocus
//           type="text"
//           name="name"
//           placeholder="اسم العميل"
//           value={form.name}
//           onChange={handleChange}
//           onKeyDown={handleKeyPress}
//           className="border border-gray-300 p-2 rounded w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
//         />

//         <input
//           type="tel"
//           name="phone"
//           placeholder="رقم الهاتف"
//           value={form.phone}
//           onChange={handleChange}
//           onKeyDown={handleKeyPress}
//           className="border border-gray-300 p-2 rounded w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
//         />

//         <input
//           type="email"
//           name="email"
//           placeholder="البريد الإلكتروني (اختياري)"
//           value={form.email}
//           onChange={handleChange}
//           onKeyDown={handleKeyPress}
//           className="border border-gray-300 p-2 rounded w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
//         />

//         <input
//           type="text"
//           name="address"
//           placeholder="العنوان (اختياري)"
//           value={form.address}
//           onChange={handleChange}
//           onKeyDown={handleKeyPress}
//           className="border border-gray-300 p-2 rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-300"
//         />

//         <div className="flex justify-end gap-3 mb-4">
//           <button
//             onClick={addCustomer}
//             className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
//           >
//             حفظ العميل
//           </button>
//           <button
//             onClick={onClose}
//             className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded transition-colors"
//           >
//             إلغاء
//           </button>
//         </div>

//         {customers.length > 0 && (
//           <div className="mb-3">
//             <input
//               type="text"
//               placeholder="ابحث في العملاء الحاليين..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-200 mb-2"
//             />
//             <ul className="max-h-40 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
//               {filteredCustomers.length === 0 ? (
//                 <li className="text-gray-500 text-sm text-center py-2">
//                   لا يوجد عملاء مطابقين
//                 </li>
//               ) : (
//                 filteredCustomers.map((c) => (
//                   <li
//                     key={c.id}
//                     className="text-gray-700 text-sm border-b last:border-b-0 py-1 flex justify-between hover:bg-gray-100 px-2 rounded transition-colors"
//                   >
//                     <span>{c.name}</span>
//                     <span className="text-gray-500">{c.phone}</span>
//                   </li>
//                 ))
//               )}
//             </ul>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }





// import { useState, useEffect } from "react";
// import { v4 as uuidv4 } from "uuid";
// import { UserPlus } from "lucide-react"; // أيقونة

// interface Customer {
//   id: string;
//   name: string;
//   phone: string;
//   email?: string;
//   address?: string;
// }

// interface AddCustomerModalProps {
//   onClose: () => void;
// }

// export function AddCustomerModal({ onClose }: AddCustomerModalProps) {
//   const [form, setForm] = useState({
//     name: "",
//     phone: "",
//     email: "",
//     address: ""
//   });
//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [search, setSearch] = useState("");

//   useEffect(() => {
//     const stored = localStorage.getItem("customers");
//     if (stored) setCustomers(JSON.parse(stored));
//   }, []);

//   useEffect(() => {
//     localStorage.setItem("customers", JSON.stringify(customers));
//   }, [customers]);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setForm({ ...form, [name]: value });
//   };

//   const addCustomer = () => {
//     if (!form.name.trim()) return alert("الرجاء إدخال اسم العميل");
//     if (!form.phone.trim()) return alert("الرجاء إدخال رقم الهاتف");

//     const newCustomer: Customer = {
//       id: uuidv4(),
//       ...form
//     };

//     setCustomers([...customers, newCustomer]);
//     setForm({ name: "", phone: "", email: "", address: "" });
//     setSearch("");
//     onClose();
//   };

//   const filteredCustomers = customers.filter(c =>
//     c.name.toLowerCase().includes(search.toLowerCase()) ||
//     c.phone.includes(search) ||
//     (c.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
//     (c.address?.toLowerCase().includes(search.toLowerCase()) ?? false)
//   );

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter") addCustomer();
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-r from-black/40 to-black/30">
//       <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in relative">
//         <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
//           <UserPlus className="w-6 h-6 text-blue-500" /> {/* الأيقونة */}
//           إضافة عميل جديد
//         </h2>

//         <input
//           autoFocus
//           type="text"
//           name="name"
//           placeholder="اسم العميل"
//           value={form.name}
//           onChange={handleChange}
//           onKeyDown={handleKeyPress}
//           className="border border-gray-300 p-2 rounded w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
//         />

//         <input
//           type="tel"
//           name="phone"
//           placeholder="رقم الهاتف"
//           value={form.phone}
//           onChange={handleChange}
//           onKeyDown={handleKeyPress}
//           className="border border-gray-300 p-2 rounded w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
//         />

//         <input
//           type="email"
//           name="email"
//           placeholder="البريد الإلكتروني (اختياري)"
//           value={form.email}
//           onChange={handleChange}
//           onKeyDown={handleKeyPress}
//           className="border border-gray-300 p-2 rounded w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
//         />

//         <input
//           type="text"
//           name="address"
//           placeholder="العنوان (اختياري)"
//           value={form.address}
//           onChange={handleChange}
//           onKeyDown={handleKeyPress}
//           className="border border-gray-300 p-2 rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-300"
//         />

//         <div className="flex justify-end gap-3 mb-4">
//           <button
//             onClick={addCustomer}
//             className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
//           >
//             حفظ العميل
//           </button>
//           <button
//             onClick={onClose}
//             className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded transition-colors"
//           >
//             إلغاء
//           </button>
//         </div>

//         {customers.length > 0 && (
//           <div className="mb-3">
//             <input
//               type="text"
//               placeholder="ابحث في العملاء الحاليين..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-200 mb-2"
//             />
//             <ul className="max-h-40 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
//               {filteredCustomers.length === 0 ? (
//                 <li className="text-gray-500 text-sm text-center py-2">
//                   لا يوجد عملاء مطابقين
//                 </li>
//               ) : (
//                 filteredCustomers.map((c) => (
//                   <li
//                     key={c.id}
//                     className="text-gray-700 text-sm border-b last:border-b-0 py-1 flex justify-between hover:bg-gray-100 px-2 rounded transition-colors"
//                   >
//                     <span>{c.name}</span>
//                     <span className="text-gray-500">{c.phone}</span>
//                   </li>
//                 ))
//               )}
//             </ul>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }





import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { UserPlus } from "lucide-react"; // أيقونة

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface AddCustomerModalProps {
  onClose: () => void;
}

export function AddCustomerModal({ onClose }: AddCustomerModalProps) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: ""
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // جلب العملاء من localStorage عند التحميل
  useEffect(() => {
    const stored = localStorage.getItem("customers");
    if (stored) setCustomers(JSON.parse(stored));
  }, []);

  // حفظ العملاء في localStorage عند أي تغيير
  useEffect(() => {
    localStorage.setItem("customers", JSON.stringify(customers));
  }, [customers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const addOrUpdateCustomer = () => {
    if (!form.name.trim()) return alert("الرجاء إدخال اسم العميل");
    if (!form.phone.trim()) return alert("الرجاء إدخال رقم الهاتف");

    if (editingId) {
      // تحديث العميل الحالي
      setCustomers(customers.map(c =>
        c.id === editingId ? { ...c, ...form } : c
      ));
      setEditingId(null);
    } else {
      // إضافة عميل جديد
      const newCustomer: Customer = {
        id: uuidv4(),
        ...form
      };
      setCustomers([...customers, newCustomer]);
    }

    setForm({ name: "", phone: "", email: "", address: "" });
    setSearch("");
    onClose();
  };

  const deleteCustomer = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا العميل؟")) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  const editCustomer = (customer: Customer) => {
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      address: customer.address || ""
    });
    setEditingId(customer.id);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addOrUpdateCustomer();
  };

  // تصفية وترتيب العملاء أبجديًا
  const filteredCustomers = customers
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (c.address?.toLowerCase().includes(search.toLowerCase()) ?? false)
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  // مكون InputField لتقليل التكرار
  const InputField = ({ name, placeholder, type = "text" }: { name: string, placeholder: string, type?: string }) => (
    <input
      autoFocus={name === "name"}
      type={type}
      name={name}
      placeholder={placeholder}
      value={form[name as keyof typeof form]}
      onChange={handleChange}
      onKeyDown={handleKeyPress}
      className="border border-gray-300 p-2 rounded w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
    />
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in relative"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-blue-500" />
          {editingId ? "تعديل بيانات العميل" : "إضافة عميل جديد"}
        </h2>

        <InputField name="name" placeholder="اسم العميل" />
        <InputField name="phone" placeholder="رقم الهاتف" type="tel" />
        <InputField name="email" placeholder="البريد الإلكتروني (اختياري)" type="email" />
        <InputField name="address" placeholder="العنوان (اختياري)" />

        <div className="flex justify-end gap-3 mb-4">
          <button
            onClick={addOrUpdateCustomer}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
          >
            {editingId ? "حفظ التعديلات" : "حفظ العميل"}
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded transition-colors"
          >
            إلغاء
          </button>
        </div>

        {customers.length > 0 && (
          <div className="mb-3">
            <input
              type="text"
              placeholder="ابحث في العملاء الحاليين..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-200 mb-2"
            />
            <ul className="max-h-40 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
              {filteredCustomers.length === 0 ? (
                <li className="text-gray-500 text-sm text-center py-2">
                  لا يوجد عملاء مطابقين
                </li>
              ) : (
                filteredCustomers.map(c => (
                  <li
                    key={c.id}
                    className="text-gray-700 text-sm border-b last:border-b-0 py-1 flex justify-between items-center hover:bg-gray-100 px-2 rounded transition-colors"
                  >
                    <div>
                      <span>{c.name}</span>
                      <span className="text-gray-500 ml-2">{c.phone}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editCustomer(c)}
                        className="text-blue-500 hover:text-blue-600 text-sm"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => deleteCustomer(c.id)}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        حذف
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}