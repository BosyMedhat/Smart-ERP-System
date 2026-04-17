// import { useState } from 'react';
// import { Users, Plus, X, CheckCircle, UserPlus, Shield } from 'lucide-react';

// // تعريف هيكل بيانات المستخدم
// interface User {
//   id: string;
//   name: string;
//   role: string;
//   permissions: {
//     sales: string[];
//     inventory: string[];
//     reports: string[];
//     settings: string[];
//   };
// }

// // تصنيفات الصلاحيات المتاحة في النظام
// const permissionCategories = {
//   sales: {
//     title: 'المبيعات',
//     color: '#3B82F6',
//     permissions: [
//       { id: 'view_pos', label: 'شاشة الكاشير' }, // بناءً على طلب "حساب الكاشير يرى فقط شاشة الكاشير"
//       { id: 'add_invoice', label: 'إضافة فاتورة' },
//       { id: 'edit_price', label: 'تعديل سعر' },
//       { id: 'apply_discount', label: 'عمل خصم' },
//       { id: 'returns', label: 'مرتجع' },
//     ],
//   },
//   inventory: {
//     title: 'المخازن',
//     color: '#F59E0B',
//     permissions: [
//       { id: 'add_product', label: 'إضافة منتج' },
//       { id: 'inventory_count', label: 'جرد المخزن' },
//       { id: 'view_cost_price', label: 'رؤية أسعار التكلفة' },
//       { id: 'manage_suppliers', label: 'إدارة الموردين' },
//     ],
//   },
//   reports: {
//     title: 'التقارير',
//     color: '#10B981',
//     permissions: [
//       { id: 'profit_report', label: 'تقرير الأرباح' },
//       { id: 'daily_sales', label: 'تقرير المبيعات اليومي' },
//       { id: 'inventory_report', label: 'تقرير المخزون' },
//     ],
//   },
//   settings: {
//     title: 'الإعدادات',
//     color: '#8B5CF6',
//     permissions: [
//       { id: 'user_management', label: 'إدارة المستخدمين' },
//       { id: 'system_settings', label: 'إعدادات النظام' },
//     ],
//   },
// };

// export function UserManagement() {
//   // الحالة الأساسية: قائمة المستخدمين (تبدأ فارغة)
//   const [users, setUsers] = useState<User[]>([]);
//   const [selectedUser, setSelectedUser] = useState<User | null>(null);
//   const [showAddUserModal, setShowAddUserModal] = useState(false);

//   // حالة إدخال بيانات المستخدم الجديد
//   const [newUser, setNewUser] = useState({
//     name: '',
//     role: '',
//     password: ''
//   });

//   // وظيفة إضافة المستخدم (تطبيقاً للمطلوب في الصورة: تخصيص الصلاحيات)
//   const handleAddUser = () => {
//     if (!newUser.name.trim() || !newUser.role) {
//       alert("برجاء إدخال الاسم واختيار الوظيفة");
//       return;
//     }

//     const createdUser: User = {
//       id: Date.now().toString(),
//       name: newUser.name,
//       role: newUser.role,
//       permissions: {
//         sales: [],
//         inventory: [],
//         reports: [],
//         settings: [],
//       },
//     };

//     setUsers([...users, createdUser]);
//     setSelectedUser(createdUser); // فتحه فوراً لتخصيص صلاحياته
//     setNewUser({ name: '', role: '', password: '' });
//     setShowAddUserModal(false);
//   };

//   // وظيفة تبديل الصلاحية (اختبار النظام لضمان عمل الصلاحيات بشكل صحيح)
//   const togglePermission = (category: keyof User['permissions'], permissionId: string) => {
//     if (!selectedUser) return;

//     const updatedPermissions = { ...selectedUser.permissions };
//     if (updatedPermissions[category].includes(permissionId)) {
//       updatedPermissions[category] = updatedPermissions[category].filter(p => p !== permissionId);
//     } else {
//       updatedPermissions[category] = [...updatedPermissions[category], permissionId];
//     }

//     const updatedUser = { ...selectedUser, permissions: updatedPermissions };
//     setSelectedUser(updatedUser);
//     setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
//   };

//   const hasPermission = (category: keyof User['permissions'], permissionId: string) => {
//     return selectedUser?.permissions[category].includes(permissionId) || false;
//   };

//   return (
//     <div className="h-full bg-gray-50 p-6 space-y-6 text-right" dir="rtl">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-[#1E293B] mb-2">إدارة الأدوار والصلاحيات (Roles & Permissions)</h1>
//           <p className="text-gray-600">تنفيذ نظام يتيح للأدمن التحكم في رؤية أجزاء النظام</p>
//         </div>
//         <button
//           onClick={() => setShowAddUserModal(true)}
//           className="px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all"
//         >
//           <Plus size={20} />
//           إضافة مستخدم جديد
//         </button>
//       </div>

//       <div className="grid grid-cols-12 gap-6">
//         {/* قائمة المستخدمين (الجانب الأيمن) */}
//         <div className="col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           <div className="flex items-center gap-2 mb-6 border-b pb-4">
//             <Users size={24} className="text-[#3B82F6]" />
//             <h2 className="text-xl font-bold">المستخدمين المضافين</h2>
//           </div>

//           <div className="space-y-3">
//             {users.length === 0 ? (
//               <p className="text-center text-gray-400 py-10 font-medium">لا يوجد مستخدمين، ابدأ بإضافة أول مستخدم</p>
//             ) : (
//               users.map(user => (
//                 <button
//                   key={user.id}
//                   onClick={() => setSelectedUser(user)}
//                   className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
//                     selectedUser?.id === user.id ? 'border-[#3B82F6] bg-blue-50' : 'border-gray-100 hover:bg-gray-50'
//                   }`}
//                 >
//                   <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-[#1E293B]">
//                     {user.name.charAt(0)}
//                   </div>
//                   <div className="flex-1">
//                     <div className="font-bold">{user.name}</div>
//                     <div className="text-sm text-gray-500">{user.role}</div>
//                   </div>
//                   {selectedUser?.id === user.id && <CheckCircle size={18} className="text-[#3B82F6]" />}
//                 </button>
//               ))
//             )}
//           </div>
//         </div>

//         {/* لوحة التحكم في الصلاحيات (الجانب الأيسر) */}
//         <div className="col-span-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           {selectedUser ? (
//             <div className="animate-in fade-in duration-300">
//               <div className="flex items-center justify-between mb-8 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-800">تخصيص صلاحيات: {selectedUser.name}</h3>
//                   <p className="text-sm text-gray-500">الوظيفة: {selectedUser.role}</p>
//                 </div>
//                 <Shield className="text-[#3B82F6]" size={32} />
//               </div>

//               <div className="grid grid-cols-2 gap-6">
//                 {(Object.keys(permissionCategories) as Array<keyof typeof permissionCategories>).map(catKey => {
//                   const category = permissionCategories[catKey];
//                   return (
//                     <div key={catKey} className="border rounded-xl p-4 space-y-4 shadow-sm">
//                       <h4 className="font-bold flex items-center gap-2 pb-2 border-b" style={{ color: category.color }}>
//                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }}></div>
//                         {category.title}
//                       </h4>
//                       <div className="space-y-2">
//                         {category.permissions.map(p => (
//                           <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
//                             <input
//                               type="checkbox"
//                               checked={hasPermission(catKey, p.id)}
//                               onChange={() => togglePermission(catKey, p.id)}
//                               className="w-5 h-5 accent-[#10B981]"
//                             />
//                             <span className="text-gray-700 font-medium">{p.label}</span>
//                           </label>
//                         ))}
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           ) : (
//             <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
//               <Shield size={80} strokeWidth={1} className="mb-4" />
//               <p className="text-lg">اختر مستخدم من القائمة لتخصيص صلاحياته</p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* نافذة إضافة مستخدم جديد (Modal) */}
//       {showAddUserModal && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
//             <div className="bg-[#1E293B] p-6 text-white flex justify-between items-center">
//               <h2 className="text-xl font-bold">بيانات الموظف الجديد</h2>
//               <button onClick={() => setShowAddUserModal(false)}><X size={24} /></button>
//             </div>
            
//             <div className="p-6 space-y-5">
//               <div>
//                 <label className="block text-sm font-bold mb-2">اسم الموظف</label>
//                 <input
//                   type="text"
//                   value={newUser.name}
//                   onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3B82F6] outline-none"
//                   placeholder="أدخل الاسم الثلاثي"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-2">الدور الوظيفي</label>
//                 <select
//                   value={newUser.role}
//                   onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3B82F6] outline-none"
//                 >
//                   <option value="">-- اختر الوظيفة --</option>
//                   <option value="كاشير">كاشير (Cashier)</option>
//                   <option value="محاسب">محاسب (Accountant)</option>
//                   <option value="أمين مخزن">أمين مخزن (Storekeeper)</option>
//                   <option value="مدير">مدير (Manager)</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-2">كلمة المرور المؤقتة</label>
//                 <input
//                   type="password"
//                   value={newUser.password}
//                   onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3B82F6] outline-none"
//                   placeholder="••••••••"
//                 />
//               </div>

//               <div className="flex gap-3 pt-4">
//                 <button
//                   onClick={handleAddUser}
//                   className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
//                 >
//                   <UserPlus size={20} />
//                   إضافة للنظام
//                 </button>
//                 <button
//                   onClick={() => setShowAddUserModal(false)}
//                   className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl"
//                 >
//                   إلغاء
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }













// import { useState, useEffect } from 'react';
// import { Users, Plus, X, CheckCircle, UserPlus, Shield } from 'lucide-react';

// // تعريف هيكل بيانات المستخدم
// interface User {
//   id: string;
//   name: string;
//   role: string;
//   password: string;
//   permissions: {
//     sales: string[];
//     inventory: string[];
//     reports: string[];
//     settings: string[];
//   };
// }





// // تصنيفات الصلاحيات المتاحة في النظام
// const permissionCategories = {
//   sales: {
//     title: 'المبيعات',
//     color: '#3B82F6',
//     permissions: [
//       { id: 'view_pos', label: 'شاشة الكاشير' }, // بناءً على طلب "حساب الكاشير يرى فقط شاشة الكاشير"
//       { id: 'add_invoice', label: 'إضافة فاتورة' },
//       { id: 'edit_price', label: 'تعديل سعر' },
//       { id: 'apply_discount', label: 'عمل خصم' },
//       { id: 'returns', label: 'مرتجع' },
//     ],
//   },
//   inventory: {
//     title: 'المخازن',
//     color: '#F59E0B',
//     permissions: [
//       { id: 'add_product', label: 'إضافة منتج' },
//       { id: 'inventory_count', label: 'جرد المخزن' },
//       { id: 'view_cost_price', label: 'رؤية أسعار التكلفة' },
//       { id: 'manage_suppliers', label: 'إدارة الموردين' },
//     ],
//   },
//   reports: {
//     title: 'التقارير',
//     color: '#10B981',
//     permissions: [
//       { id: 'profit_report', label: 'تقرير الأرباح' },
//       { id: 'daily_sales', label: 'تقرير المبيعات اليومي' },
//       { id: 'inventory_report', label: 'تقرير المخزون' },
//     ],
//   },
//   settings: {
//     title: 'الإعدادات',
//     color: '#8B5CF6',
//     permissions: [
//       { id: 'user_management', label: 'إدارة المستخدمين' },
//       { id: 'system_settings', label: 'إعدادات النظام' },
//     ],
//   },
// };




// export function UserManagement() {
//   // الحالة الأساسية: قائمة المستخدمين (تبدأ فارغة)
//   const [users, setUsers] = useState<User[]>([]);
//   const [selectedUser, setSelectedUser] = useState<User | null>(null);
//   const [showAddUserModal, setShowAddUserModal] = useState(false);

//   // حالة إدخال بيانات المستخدم الجديد
//   const [newUser, setNewUser] = useState({
//     name: '',
//     role: '',
//     password: ''
//   });

// const handleAddUser = async () => {
//   if (!newUser.name.trim() || !newUser.role || !newUser.password) {
//     alert("برجاء إدخال الاسم والوظيفة وكلمة المرور");
//     return;
//   }

//   try {
//     const response = await fetch("http://127.0.0.1:8000/api/users/", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         username: newUser.name,
//         password: newUser.password,
//         role: newUser.role,
//       }),
//     });

//     if (response.ok) {
//       const createdUser = await response.json();

//       // إضافة المستخدم في الواجهة
//       setUsers((prev) => [...prev, createdUser]);

//       setNewUser({
//         name: "",
//         role: "",
//         password: "",
//       });

//       setShowAddUserModal(false);
//     } else {
//       alert("حدث خطأ أثناء إضافة المستخدم");
//     }
//   } catch (error) {
//     console.error("Error:", error);
//     alert("فشل الاتصال بالسيرفر");
//   }
// };
// // useEffect(() => {
// //   const fetchUsers = async () => {
// //     try {
// //       const response = await fetch("http://127.0.0.1:8000/api/users/");
// //       const data = await response.json();

// //       const formattedUsers = data.map((u: any) => ({
// //         id: u.id.toString(),
// //         name: u.username,
// //         role: u.role,
// //         password: "",
// //         permissions: {
// //           sales: [],
// //           inventory: [],
// //           reports: [],
// //           settings: [],
// //         },
// //       }));

// //       setUsers(formattedUsers);
// //     } catch (error) {
// //       console.error("Error loading users:", error);
// //     }
// //   };

// //   fetchUsers();
// // }, []);





// useEffect(() => {
//   const fetchUsers = async () => {
//     try {
//       const response = await fetch("http://127.0.0.1:8000/api/users/");
      
//       // التأكد من نجاح الطلب قبل محاولة تحويل البيانات
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
      
//       const data = await response.json();

//       // التأكد من أن data عبارة عن مصفوفة قبل عمل map
//       if (Array.isArray(data)) {
//         const formattedUsers = data.map((u: any) => ({
//           // استخدام || لتوفير قيم افتراضية في حال كانت البيانات ناقصة
//           id: u?.id?.toString() || Math.random().toString(), 
//           name: u?.username || "مستخدم غير معروف",
//           role: u?.role || "بدون دور",
//           password: "",
//           permissions: {
//             sales: [],
//             inventory: [],
//             reports: [],
//             settings: [],
//           },
//         }));

//         setUsers(formattedUsers);
//       }
//     } catch (error) {
//       console.error("Error loading users:", error);
//     }
//   };

//   fetchUsers();
// }, []);


//   // وظيفة تبديل الصلاحية (اختبار النظام لضمان عمل الصلاحيات بشكل صحيح)
//   const togglePermission = (category: keyof User['permissions'], permissionId: string) => {
//     if (!selectedUser) return;

//     const updatedPermissions = { ...selectedUser.permissions };
//     if (updatedPermissions[category].includes(permissionId)) {
//       updatedPermissions[category] = updatedPermissions[category].filter(p => p !== permissionId);
//     } else {
//       updatedPermissions[category] = [...updatedPermissions[category], permissionId];
//     }

//     const updatedUser = { ...selectedUser, permissions: updatedPermissions };
//     setSelectedUser(updatedUser);
//     setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
//   };

//   const hasPermission = (category: keyof User['permissions'], permissionId: string) => {
//     return selectedUser?.permissions[category].includes(permissionId) || false;
//   };

//   return (
//     <div className="h-full bg-gray-50 p-6 space-y-6 text-right" dir="rtl">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-[#1E293B] mb-2">إدارة الأدوار والصلاحيات (Roles & Permissions)</h1>
//           <p className="text-gray-600">تنفيذ نظام يتيح للأدمن التحكم في رؤية أجزاء النظام</p>
//         </div>
//         <button
//           onClick={() => setShowAddUserModal(true)}
//           className="px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all"
//         >
//           <Plus size={20} />
//           إضافة مستخدم جديد
//         </button>
//       </div>

//       <div className="grid grid-cols-12 gap-6">
//         {/* قائمة المستخدمين (الجانب الأيمن) */}
//         <div className="col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           <div className="flex items-center gap-2 mb-6 border-b pb-4">
//             <Users size={24} className="text-[#3B82F6]" />
//             <h2 className="text-xl font-bold">المستخدمين المضافين</h2>
//           </div>

//           <div className="space-y-3">
//             {users.length === 0 ? (
//               <p className="text-center text-gray-400 py-10 font-medium">لا يوجد مستخدمين، ابدأ بإضافة أول مستخدم</p>
//             ) : (
//               users.map(user => (
//                 <button
//                   key={user.id}
//                   onClick={() => setSelectedUser(user)}
//                   className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
//                     selectedUser?.id === user.id ? 'border-[#3B82F6] bg-blue-50' : 'border-gray-100 hover:bg-gray-50'
//                   }`}
//                 >
//                   <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-[#1E293B]">
//             {user.name?.charAt(0) || '?'}

//                   </div>
//                   <div className="flex-1">
//                    <div className="font-bold">{user.name}</div>


//                     <div className="text-sm text-gray-500">{user.role}</div>
//                   </div>
//                   {selectedUser?.id === user.id && <CheckCircle size={18} className="text-[#3B82F6]" />}
//                 </button>
//               ))
//             )}
//           </div>
//         </div>

//         {/* لوحة التحكم في الصلاحيات (الجانب الأيسر) */}
//         <div className="col-span-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           {selectedUser ? (
//             <div className="animate-in fade-in duration-300">
//               <div className="flex items-center justify-between mb-8 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-800">تخصيص صلاحيات: {selectedUser.name}</h3>
//                   <p className="text-sm text-gray-500">الوظيفة: {selectedUser.role}</p>
//                 </div>
//                 <Shield className="text-[#3B82F6]" size={32} />
//               </div>

//               <div className="grid grid-cols-2 gap-6">
//                 {(Object.keys(permissionCategories) as Array<keyof typeof permissionCategories>).map(catKey => {
//                   const category = permissionCategories[catKey];
//                   return (
//                     <div key={catKey} className="border rounded-xl p-4 space-y-4 shadow-sm">
//                       <h4 className="font-bold flex items-center gap-2 pb-2 border-b" style={{ color: category.color }}>
//                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }}></div>
//                         {category.title}
//                       </h4>
//                       <div className="space-y-2">
//                         {category.permissions.map(p => (
//                           <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
//                             <input
//                               type="checkbox"
//                               checked={hasPermission(catKey, p.id)}
//                               onChange={() => togglePermission(catKey, p.id)}
//                               className="w-5 h-5 accent-[#10B981]"
//                             />
//                             <span className="text-gray-700 font-medium">{p.label}</span>
//                           </label>
//                         ))}
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           ) : (
//             <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
//               <Shield size={80} strokeWidth={1} className="mb-4" />
//               <p className="text-lg">اختر مستخدم من القائمة لتخصيص صلاحياته</p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* نافذة إضافة مستخدم جديد (Modal) */}
//       {showAddUserModal && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
//             <div className="bg-[#1E293B] p-6 text-white flex justify-between items-center">
//               <h2 className="text-xl font-bold">بيانات الموظف الجديد</h2>
//               <button onClick={() => setShowAddUserModal(false)}><X size={24} /></button>
//             </div>
            
//             <div className="p-6 space-y-5">
//               <div>
//                 <label className="block text-sm font-bold mb-2">اسم الموظف</label>
//                 <input
//                   type="text"
//                   value={newUser.name}
//                   onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3B82F6] outline-none"
//                   placeholder="أدخل الاسم الثلاثي"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-2">الدور الوظيفي</label>
//                 <select
//                   value={newUser.role}
//                   onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3B82F6] outline-none"
//                 >
//                   <option value="">-- اختر الوظيفة --</option>
//                   <option value="كاشير">كاشير (Cashier)</option>
//                   <option value="محاسب">محاسب (Accountant)</option>
//                   <option value="أمين مخزن">أمين مخزن (Storekeeper)</option>
//                   <option value="مدير">مدير (Manager)</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-2">كلمة المرور المؤقتة</label>
//                 <input
//                   type="password"
//                   value={newUser.password}
//                   onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3B82F6] outline-none"
//                   placeholder="••••••••"
//                 />
//               </div>

//               <div className="flex gap-3 pt-4">
//                <button
//   onClick={handleAddUser} // تأكدي أن هذا السطر موجود في الزر
//  className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 rounded-xl"

// >
//   إضافة للنظام
// </button>
//                 <button
//                   onClick={() => setShowAddUserModal(false)}
//                   className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl"
//                 >
//                   إلغاء
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }







import { useState, useEffect } from 'react';
// import { Users, Plus, X, CheckCircle, Shield } from 'lucide-react';
import { Users, Plus, X, CheckCircle, Shield, Trash2 } from 'lucide-react';

// interface User {
//   id: string;
//   name: string;
//   role: string;
//   password: string;
//   permissions: {
//     sales: string[];
//     inventory: string[];
//     reports: string[];
//     settings: string[];
//     general: string[];
    
//   };
// }

interface User {
  id: string;
  name: string;
  role: string;
  password: string;
  permissions: {
    sales: string[];
    inventory: string[];
    reports: string[];
    settings: string[];
    general: string[];
    // 👇 ضيفي الثلاثة دول هنا
    finance: string[];
    hr: string[];
    advanced: string[];
  };
}








// const permissionCategories = {
//   sales: { title: 'المبيعات', color: '#3B82F6', permissions: [{ id: 'pos', label: 'شاشة الكاشير' }, { id: 'add_invoice', label: 'إضافة فاتورة' }, { id: 'edit_price', label: 'تعديل سعر' }, { id: 'apply_discount', label: 'عمل خصم' }, { id: 'returns', label: 'مرتجع' }] },
//   inventory: { title: 'المخازن', color: '#F59E0B', permissions: [{ id: 'add_product', label: 'إضافة منتج' }, { id: 'inventory_count', label: 'جرد المخزن' }, { id: 'view_cost_price', label: 'رؤية أسعار التكلفة' }, { id: 'manage_suppliers', label: 'إدارة الموردين' }] },
//   reports: { title: 'التقارير', color: '#10B981', permissions: [{ id: 'profit_report', label: 'تقرير الأرباح' }, { id: 'daily_sales', label: 'تقرير المبيعات اليومي' }, { id: 'inventory_report', label: 'تقرير المخزون' }] },
//   settings: { title: 'الإعدادات', color: '#8B5CF6', permissions: [{ id: 'user_management', label: 'إدارة المستخدمين' }, { id: 'system_settings', label: 'إعدادات النظام' }] },
// };
// const permissionCategories = {
//   sales: { 
//     title: 'المبيعات', 
//     color: '#3B82F6', 
//     permissions: [
//       { id: 'pos', label: 'شاشة الكاشير' }, 
//       { id: 'add_invoice', label: 'إضافة فاتورة' }, 
//       { id: 'edit_price', label: 'تعديل سعر' }, 
//       { id: 'apply_discount', label: 'عمل خصم' }, 
//       { id: 'returns', label: 'مرتجع' }
//     ] 
//   },
//   inventory: { 
//     title: 'المخازن', 
//     color: '#F59E0B', 
//     permissions: [
//       { id: 'inventory', label: 'إدارة المخزن' }, // خليناها inventory عشان تطابق السايد بار
//       { id: 'add_product', label: 'إضافة منتج' }, 
//       { id: 'inventory_count', label: 'جرد المخزن' }, 
//       { id: 'view_cost_price', label: 'رؤية أسعار التكلفة' }, 
//       { id: 'manage_suppliers', label: 'إدارة الموردين' }
//     ] 
//   },
//   reports: { 
//     title: 'التقارير', 
//     color: '#10B981', 
//     permissions: [
//       { id: 'reports', label: 'دخول التقارير' }, // دي اللي هتفتح الأيقونة
//       { id: 'profit_report', label: 'تقرير الأرباح' }, 
//       { id: 'daily_sales', label: 'تقرير المبيعات اليومي' }, 
//       { id: 'inventory_report', label: 'تقرير المخزون' }
//     ] 
//   },
//   settings: { 
//     title: 'الإعدادات', 
//     color: '#8B5CF6', 
//     permissions: [
//       { id: 'users', label: 'إدارة المستخدمين والصلاحيات' }, // دي اللي هتفتح أيقونة Shield
//       { id: 'settings', label: 'إعدادات النظام' }
//     ] 
//   },
// };

// const permissionCategories = {
//   sales: { 
//     title: 'المبيعات', 
//     color: '#3B82F6', 
//     permissions: [
//       { id: 'pos', label: 'شاشة الكاشير' }, 
//       { id: 'add_invoice', label: 'إضافة فاتورة' }, 
//       { id: 'apply_discount', label: 'عمل خصم' }, 
//       { id: 'view_reports', label: 'عرض تقارير المبيعات' }, // مطابقة للأدمن
//       { id: 'returns', label: 'مرتجع' }
//     ] 
//   },
//   inventory: { 
//     title: 'المخازن', 
//     color: '#F59E0B', 
//     permissions: [
//       { id: 'add_product', label: 'إضافة منتج' }, // مطابقة للأدمن
//       { id: 'view_stock', label: 'عرض المخزون' }, // مطابقة للأدمن
//       { id: 'inventory_count', label: 'جرد المخزن' }, 
//       { id: 'manage_suppliers', label: 'إدارة الموردين' }
//     ] 
//   },
//   reports: { 
//     title: 'التقارير', 
//     color: '#10B981', 
//     permissions: [
//       { id: 'dashboard_charts', label: 'رسوم بيانية (Dashboard)' }, // مطابقة للأدمن
//       { id: 'daily_summary', label: 'ملخص يومي' }, // مطابقة للأدمن
//       { id: 'inventory_report', label: 'تقرير المخزون' }
//     ] 
//   },
//   general: { // ضفنا القسم ده عشان "الرئيسية"
//     title: 'عام',
//     color: '#6366F1',
//     permissions: [
//       { id: 'view_home', label: 'عرض الشاشة الرئيسية' } // مطابقة للأدمن
//     ]
//   },
//   settings: { 
//     title: 'الإعدادات', 
//     color: '#8B5CF6', 
//     permissions: [
//       { id: 'users', label: 'إدارة المستخدمين والصلاحيات' }, 
//       { id: 'settings', label: 'إعدادات النظام' }
//     ] 
//   },
// };

// const permissionCategories = {
//   sales: { 
//     title: 'المبيعات', 
//     color: '#3B82F6', 
//     permissions: [
//       { id: 'view_pos', label: 'شاشة الكاشير' }, // 👈 عدلي دي لـ view_pos عشان تطابق الأدمن
//       { id: 'add_invoice', label: 'إضافة فاتورة' }, 
//       { id: 'apply_discount', label: 'عمل خصم' }, 
//       { id: 'view_reports', label: 'عرض تقارير المبيعات' }, 
//       { id: 'returns', label: 'مرتجع' }
//     ] 
//   },
//   inventory: { 
//     title: 'المخازن', 
//     color: '#F59E0B', 
//     permissions: [
//       { id: 'add_product', label: 'إضافة منتج' }, 
//       { id: 'view_stock', label: 'عرض المخزون' }, 
//       { id: 'inventory_count', label: 'جرد المخزن' }, 
//       { id: 'manage_suppliers', label: 'إدارة الموردين' }
//     ] 
//   },
//   reports: { 
//     title: 'التقارير', 
//     color: '#10B981', 
//     permissions: [
//       { id: 'dashboard_charts', label: 'رسوم بيانية (Dashboard)' }, 
//       { id: 'daily_summary', label: 'ملخص يومي' }, 
//       { id: 'inventory_report', label: 'تقرير المخزون' }
//     ] 
//   },
//   general: {
//     title: 'عام',
//     color: '#6366F1',
//     permissions: [
//       { id: 'view_home', label: 'عرض الشاشة الرئيسية' }
//     ]
//   },
//   settings: { 
//     title: 'الإعدادات', 
//     color: '#8B5CF6', 
//     permissions: [
//       { id: 'users', label: 'إدارة المستخدمين والصلاحيات' }, 
//       { id: 'settings', label: 'إعدادات النظام' }
//     ] 
//   },
// };



const permissionCategories = {
  general: {
    title: 'النظام الأساسي',
    color: '#6366F1',
    permissions: [
      { id: 'view_home', label: 'عرض الشاشة الرئيسية' },
      { id: 'settings', label: 'إعدادات النظام' }
    ]
  },
  // sales: { 
  //   title: 'المبيعات وعروض الأسعار', 
  //   color: '#3B82F6', 
  //   permissions: [
  //     { id: 'view_pos', label: 'شاشة الكاشير' },
  //     { id: 'add_invoice', label: 'إضافة فاتورة' },
  //     { id: 'apply_discount', label: 'عمل خصم' },
  //     { id: 'view_quotations', label: 'عرض عروض الأسعار' },
  //     { id: 'returns', label: 'مرتجع' }
  //   ] 
  // },
  sales: { 
    title: 'المبيعات وعروض الأسعار', 
    color: '#3B82F6', 
    permissions: [
      { id: 'view_pos', label: 'شاشة الكاشير' },
      { id: 'add_invoice', label: 'إضافة فاتورة' },
      { id: 'quotations', label: 'عرض عروض الأسعار' }, // 👈 غيري الـ ID هنا لـ quotations
      { id: 'returns', label: 'مرتجع' }
    ] 
  },
  inventory: { 
    title: 'المخازن والموردين', 
    color: '#F59E0B', 
    permissions: [
      { id: 'view_stock', label: 'عرض المخزون' },
      { id: 'add_product', label: 'إضافة منتج' },
      { id: 'inventory_count', label: 'جرد المخزن' },
      { id: 'manage_suppliers', label: 'إدارة الموردين' }
    ] 
  },
  // finance: { 
  //   title: 'التقسيط والمناديب', 
  //   color: '#EC4899', 
  //   permissions: [
  //     { id: 'view_installments', label: 'إدارة الأقساط' },
  //     { id: 'manage_reps', label: 'إدارة المناديب' }
  //   ] 
  // },
  finance: { 
    title: 'التقسيط والمناديب', 
    color: '#EC4899', 
    permissions: [
      { id: 'installments', label: 'إدارة الأقساط' }, // 👈 غيري الـ ID هنا لـ installments
      { id: 'representatives', label: 'إدارة المناديب' } // 👈 غيري الـ ID هنا لـ representatives
    ] 
  },
  // hr: { 
  //   title: 'الموظفين والصلاحيات', 
  //   color: '#10B981', 
  //   permissions: [
  //     { id: 'employees', label: 'إدارة شؤون الموظفين' },
  //     { id: 'users', label: 'إدارة المستخدمين والصلاحيات' }
  //   ] 
  // },
  hr: { 
    title: 'الموظفين والصلاحيات', 
    color: '#10B981', 
    permissions: [
      { id: 'employees', label: 'إدارة شؤون الموظفين' }, // 👈 غيري الـ ID هنا لـ employees
      { id: 'users', label: 'إدارة المستخدمين والصلاحيات' }
    ] 
  },
  advanced: { 
    title: 'الذكاء الاصطناعي والأتمتة', 
    color: '#8B5CF6', 
    permissions: [
      { id: 'ai', label: 'مركز الذكاء الاصطناعي' },
      { id: 'automation', label: 'محرك الأتمتة' }
    ] 
  },
  reports: { 
    title: 'التقارير المتقدمة', 
    color: '#06B6D4', 
    permissions: [
      { id: 'dashboard_charts', label: 'رسوم بيانية (Dashboard)' },
      { id: 'daily_summary', label: 'ملخص يومي' },
      { id: 'view_reports', label: 'عرض تقارير المبيعات' }
    ] 
  }
};




export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ name: '', role: '', password: '' });

  



//   const fetchUsers = async () => {
//   try {
//     setLoading(true);
//     const response = await fetch("http://127.0.0.1:8000/api/users/");
//     const data = await response.json();

//     if (Array.isArray(data)) {
//       const formattedUsers = data.map((u: any) => ({
//         id: u.id.toString(), // هنا سيتم قراءة الـ id القادم من السيرفر
//         name: u.username,
//         role: u.role,
//         password: "",
//         permissions: u.permissions || { sales: [], inventory: [], reports: [], settings: [] },
//       }));
//       setUsers(formattedUsers);
//     }
//   } catch (error) {
//     console.error("Error loading users:", error);
//   } finally {
//     setLoading(false);
//   }
// };

const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://127.0.0.1:8000/api/users/");
      const data = await response.json();

      if (Array.isArray(data)) {
      //   const formattedUsers = data.map((u: any) => ({
      //     id: u.id.toString(),
      //     name: u.username,
      //     role: u.role,
      //     password: "",
      //     // التعديل هنا: بنضمن وجود كل الأقسام حتى لو الداتا بيز مفهاش القسم الجديد
      //     permissions: {
      //       sales: u.permissions?.sales || [],
      //       inventory: u.permissions?.inventory || [],
      //       reports: u.permissions?.reports || [],
      //       settings: u.permissions?.settings || [],
      //       general: u.permissions?.general || [], 
      //     },
      //   }
      // ));
      const formattedUsers = data.map((u: any) => {
  // بنشوف الصلاحيات فين: هل هي مباشرة ولا جوه profile؟
  const rawPermissions = u.profile?.permissions || u.permissions;

  return {
    id: u.id.toString(),
    name: u.username,
    role: u.profile?.role || u.role || "كاشير",
    password: "",
    permissions: {
      sales: rawPermissions?.sales || [],
      inventory: rawPermissions?.inventory || [],
      reports: rawPermissions?.reports || [],
      settings: rawPermissions?.settings || [],
      general: rawPermissions?.general || [],


      finance: rawPermissions?.finance || [],
      hr: rawPermissions?.hr || [],
      advanced: rawPermissions?.advanced || [],
    },
  };
});

setUsers(formattedUsers);

// 💡 السطر ده "إجباري" عشان علامة الصح تثبت بعد ما الصفحة تحمل
if (selectedUser) {
  const current = formattedUsers.find(user => user.id === selectedUser.id);
  if (current) setSelectedUser(current);
}
        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      alert("فشل في تحميل بيانات المستخدمين");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    if (!newUser.name.trim() || !newUser.role || !newUser.password) {
      alert("برجاء إدخال الاسم والوظيفة وكلمة المرور");
      return;
    }
    try {
      const response = await fetch("http://127.0.0.1:8000/api/users/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUser.name, password: newUser.password, role: newUser.role }),
      });

      // if (response.ok) {
      //   const createdUser = await response.json();
      //   setUsers((prev) => [...prev, { 
      //       id: createdUser.id.toString(), 
      //       name: createdUser.username, 
      //       role: createdUser.role, 
      //       password: "", 
      //       permissions: { sales: [], inventory: [], reports: [], settings: [] } 
      //   }]);
      //   setNewUser({ name: "", role: "", password: "" });
      //   setShowAddUserModal(false);
      // } 

      if (response.ok) {
  const createdUser = await response.json();
  // التأكد من استخدام id القادم من السيرفر فور الإنشاء
  setUsers((prev) => [...prev, { 
      id: createdUser.id.toString(), 
      name: createdUser.username, 
      role: createdUser.role, 
      password: "", 
      permissions: createdUser.permissions || { sales: [], inventory: [], reports: [], settings: [] } 
  }]);
  setShowAddUserModal(false);
}
      else {
        const err = await response.json();
        console.error("Server Error:", err);
        alert("حدث خطأ في السيرفر: " + JSON.stringify(err));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("فشل الاتصال بالسيرفر");
    }
  };




  // const togglePermission = async (cat: keyof User['permissions'], pId: string) => {
  //   if (!selectedUser) return;
    
  //   // 1. تحديث البيانات محلياً
  //   const newPerms = { ...selectedUser.permissions };
  //   newPerms[cat] = newPerms[cat].includes(pId) 
  //     ? newPerms[cat].filter(i => i !== pId) 
  //     : [...newPerms[cat], pId];
    
  //   // 2. إرسال التحديث للسيرفر (هذا الجزء اللي بيحفظها في قاعدة البيانات)
  //   await fetch(`http://127.0.0.1:8000/api/users/${selectedUser.id}/`, {
  //     method: "PATCH",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ permissions: newPerms })
  //   });
    
  //   // 3. تحديث الواجهة
  //   const updatedUser = { ...selectedUser, permissions: newPerms };
  //   setSelectedUser(updatedUser);
  //   setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  // };
  // const togglePermission = async (cat: keyof User['permissions'], pId: string) => {
  //   if (!selectedUser) return;
    
  //   // 1. تحديث البيانات محلياً (نفس الكود بتاعك)
  //   const newPerms = { ...selectedUser.permissions };
  //   newPerms[cat] = newPerms[cat].includes(pId) 
  //     ? newPerms[cat].filter(i => i !== pId) 
  //     : [...newPerms[cat], pId];
    
  //   try {
  //     // 2. إرسال التحديث للسيرفر
  //     // لاحظي هنا إني ببعت الـ role كمان عشان الـ Backend يحفظه صح لو اتغير
  //     const response = await fetch(`http://127.0.0.1:8000/api/users/${selectedUser.id}/`, {
  //       method: "PATCH",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ 
  //         profile: { // لو إنتِ عاملة Nested Serializer
  //           permissions: newPerms 
  //         }
  //       })
  //     });

  //     if (response.ok) {
  //       // 3. تحديث الواجهة لو السيرفر وافق
  //       const updatedUser = { ...selectedUser, permissions: newPerms };
  //       setSelectedUser(updatedUser);
  //       setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  //       console.log("تم حفظ الصلاحيات بنجاح");
  //     }
  //   } catch (error) {
  //     alert("فشل حفظ الصلاحيات في قاعدة البيانات");
  //   }
  // };
const togglePermission = async (cat: keyof User['permissions'], pId: string) => {
  if (!selectedUser) return;
  
  // 1. تحديث البيانات محلياً فوراً عشان اليوزر ميحسش بتأخير
  const newPerms = { ...selectedUser.permissions };
  newPerms[cat] = newPerms[cat].includes(pId) 
    ? newPerms[cat].filter(i => i !== pId) 
    : [...newPerms[cat], pId];
  
  try {
    // 2. إرسال التحديث للسيرفر
    const response = await fetch(`http://127.0.0.1:8000/api/users/${selectedUser.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
body: JSON.stringify({ 
  profile: { 
    permissions: newPerms 
  } 
})
    });

    if (response.ok) {
      // 3. تحديث الحالة العامة للتطبيق
      const updatedUser = { ...selectedUser, permissions: newPerms };
      setSelectedUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      console.log("تم الحفظ في قاعدة البيانات بنجاح ✅");
    } else {
      const errorData = await response.json();
      console.error("فشل الحفظ:", errorData);
      alert("السيرفر رفض التعديل، تأكدي من الـ Serializer");
    }
  } catch (error) {
    alert("فشل الاتصال بالسيرفر");
  }
};

const handleDeleteUser = async (id: string) => {
  if (!window.confirm('هل تريد حذف هذا المستخدم نهائياً؟')) return;
  try {
    const response = await fetch(`http://127.0.0.1:8000/api/users/${id}/`, {
      method: 'DELETE',
    });
    if (response.ok) {
      setUsers(users.filter(u => u.id !== id));
      setSelectedUser(null);
    }
  } catch (error) {
    alert('فشل في الاتصال بالسيرفر');
  }
};


  // const hasPermission = (category: keyof User['permissions'], permissionId: string) => {
  //   return selectedUser?.permissions[category].includes(permissionId) || false;
  // };
  const hasPermission = (category: keyof User['permissions'], permissionId: string) => {
  // الـ ?. قبل [category] وقبل .includes بتضمن إن لو الداتا ناقصة السيستم ميفصلش
  return selectedUser?.permissions?.[category]?.includes(permissionId) || false;
};

  if (loading) return <div className="p-10 text-center">جاري تحميل البيانات...</div>;

  return (
    <div className="h-full bg-gray-50 p-6 space-y-6 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1E293B] mb-2">إدارة الأدوار والصلاحيات</h1>
          <p className="text-gray-600">تنفيذ نظام يتيح للأدمن التحكم في رؤية أجزاء النظام</p>
        </div>
        <button onClick={() => setShowAddUserModal(true)} className="px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all">
          <Plus size={20} /> إضافة مستخدم جديد
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <Users size={24} className="text-[#3B82F6]" />
            <h2 className="text-xl font-bold">المستخدمين المضافين</h2>
          </div>
          {/* <div className="space-y-3">
            {users.map(user => (
              <button key={user.id} onClick={() => setSelectedUser(user)} className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${selectedUser?.id === user.id ? 'border-[#3B82F6] bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-[#1E293B]">
                  {user?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <div className="font-bold">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.role}</div>
                </div>
              </button>
              
            ))}
          </div> */}
          <div className="space-y-2">
  {users.map((user) => (
    <div
      key={user.id}
      onClick={() => setSelectedUser(user)}
      className={`w-full cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-3 group ${
        selectedUser?.id === user.id 
          ? 'border-[#3B82F6] bg-blue-50' 
          : 'border-gray-100 hover:bg-gray-50'
      }`}
    >
      {/* دائرة الحرف الأول */}
      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-[#1E293B]">
        {user?.name?.charAt(0) || '?'}
      </div>

      {/* بيانات المستخدم */}
      <div className="flex-1 text-right">
        <div className="font-bold">{user.name}</div>
        <div className="text-sm text-gray-500">{user.role}</div>
      </div>

      {/* زرار الحذف الجديد */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // يمنع اختيار المستخدم عند الضغط على حذف
          handleDeleteUser(user.id);
        }}
        className="p-2 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-100 rounded-full transition-all"
        title="حذف المستخدم"
      >
        <Trash2 size={18} /> 
      </button>
    </div>
  ))}
</div>
          
        </div>

        <div className="col-span-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {selectedUser ? (
            <div className="grid grid-cols-2 gap-6">
              {(Object.keys(permissionCategories) as Array<keyof typeof permissionCategories>).map(catKey => (
                <div key={catKey} className="border rounded-xl p-4 space-y-4 shadow-sm">
                  <h4 className="font-bold border-b pb-2" style={{ color: permissionCategories[catKey].color }}>{permissionCategories[catKey].title}</h4>
                  {permissionCategories[catKey].permissions.map(p => (
                    <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input type="checkbox" checked={hasPermission(catKey, p.id)} onChange={() => togglePermission(catKey, p.id)} className="w-5 h-5 accent-[#10B981]" />
                      <span className="text-gray-700">{p.label}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          ) : <p className="text-center text-gray-400">اختر مستخدم لتخصيص صلاحياته</p>}
        </div>
      </div>
      {/* ... Modal code ... */}





      
       {/* نافذة إضافة مستخدم جديد (Modal) */}
       {showAddUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
          <div className="bg-[#1E293B] p-6 text-white flex justify-between items-center">
            <h2 className="text-xl font-bold">بيانات الموظف الجديد</h2>
             <button onClick={() => setShowAddUserModal(false)}><X size={24} /></button>
           </div>
            
            <div className="p-6 space-y-5">
                             <div>
                <label className="block text-sm font-bold mb-2">اسم الموظف</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3B82F6] outline-none"
                  placeholder="أدخل الاسم الثلاثي"
                />
              </div>

               <div>
                 <label className="block text-sm font-bold mb-2">الدور الوظيفي</label>
                 <select
                   value={newUser.role}
                   onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3B82F6] outline-none"
                 >
                  <option value="">-- اختر الوظيفة --</option>
                  <option value="كاشير">كاشير (Cashier)</option>
                  <option value="محاسب">محاسب (Accountant)</option>
                  <option value="أمين مخزن">أمين مخزن (Storekeeper)</option>
                  <option value="مدير">مدير (Manager)</option>
                </select>
              </div>

              <div>
                 <label className="block text-sm font-bold mb-2">كلمة المرور المؤقتة</label>
                 <input
                   type="password"
                   value={newUser.password}
                   onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3B82F6] outline-none"
                   placeholder="••••••••"
                 />
               </div>

              <div className="flex gap-3 pt-4">
               <button
  onClick={handleAddUser} // تأكدي أن هذا السطر موجود في الزر
 className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 rounded-xl"

 >
   إضافة للنظام
 </button>
                 <button
                   onClick={() => setShowAddUserModal(false)}
                   className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl"
                 >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
     </div>
   );
 }
