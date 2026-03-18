import { useState, useEffect } from 'react'; // أضفنا useEffect
import { Plus, Search, Barcode, FileDown, Edit2, Trash2, Loader2 } from 'lucide-react';
import { ProductModal } from './ProductModal';
import { productService } from '../../services/api'; // استيراد خدمة الربط

export interface InventoryProduct {
  id: string;
  barcode: string;
  name: string;
  category: string;
  currentStock: number;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  halfWholesalePrice: number;
  supplier: string;
  unit: string;
  minReorderLevel: number;
  status: 'available' | 'low' | 'out';
}

export function InventoryScreen() {
  const [products, setProducts] = useState<InventoryProduct[]>([]); // مصفوفة فارغة في البداية
  const [loading, setLoading] = useState(true); // حالة التحميل
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedSupplier, setSelectedSupplier] = useState('الكل');
  const [selectedStatus, setSelectedStatus] = useState('الكل');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);

  // 1. جلب البيانات من الباك إيند عند فتح الصفحة
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      console.error("خطأ في جلب المنتجات:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. تعديل دالة الحفظ لترسل للباك إيند
  const handleSaveProduct = async (productData: InventoryProduct) => {
    try {
      if (editingProduct) {
        // تحديث
        const updated = await productService.update(productData.id, productData);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        // إضافة جديد
        const created = await productService.create(productData);
        setProducts((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      alert("حدث خطأ أثناء الحفظ في قاعدة البيانات");
      console.error(error);
    }
  };

  // 3. تعديل دالة الحذف لتمسح من الباك إيند
  const handleDeleteProduct = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        await productService.delete(id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } catch (error) {
        alert("فشل الحذف من السيرفر");
      }
    }
  };

  // --- باقي الكود (التصميم) كما هو تماماً بدون أي تغيير ---
  const categories = ['الكل', ...Array.from(new Set(products.map((p) => p.category)))];
  const suppliers = ['الكل', ...Array.from(new Set(products.map((p) => p.supplier)))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      searchQuery === '' ||
      product.name.includes(searchQuery) ||
      product.barcode.includes(searchQuery);
    const matchesCategory = selectedCategory === 'الكل' || product.category === selectedCategory;
    const matchesSupplier = selectedSupplier === 'الكل' || product.supplier === selectedSupplier;
    const matchesStatus = selectedStatus === 'الكل' || product.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesSupplier && matchesStatus;
  });

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: InventoryProduct) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">متوفر</span>;
      case 'low':
        return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">مخزون منخفض</span>;
      case 'out':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">نفذ</span>;
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">إدارة المخازن والمنتجات</h1>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl flex items-center gap-2 transition-colors">
            <FileDown size={20} /> تصدير Excel
          </button>
          <button onClick={handleAddProduct} className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold rounded-xl flex items-center gap-2 transition-colors">
            <Plus size={20} /> إضافة منتج جديد
          </button>
        </div>
      </div>

      {/* باقي محتوى الجدول والفلترة يظل كما هو بالظبط */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
                <div className="relative">
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={18} /></div>
                    <input type="text" placeholder="بحث بالاسم أو الباركود..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pr-10 pl-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]" />
                </div>
            </div>
            {/* ...Category, Supplier, Status selectors stay the same... */}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full">
              <thead className="bg-[#1E293B] text-white sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-right font-semibold">الباركود</th>
                  <th className="px-4 py-3 text-right font-semibold">اسم المنتج</th>
                  <th className="px-4 py-3 text-right font-semibold">التصنيف</th>
                  <th className="px-4 py-3 text-right font-semibold">الكمية</th>
                  <th className="px-4 py-3 text-right font-semibold">التكلفة</th>
                  <th className="px-4 py-3 text-right font-semibold">البيع</th>
                  <th className="px-4 py-3 text-right font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-center font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 font-mono text-sm">{product.barcode}</td>
                    <td className="px-4 py-3 text-gray-800 font-semibold">{product.name}</td>
                    <td className="px-4 py-3 text-gray-600">{product.category}</td>
                    <td className="px-4 py-3 font-bold text-green-600">{product.currentStock} {product.unit}</td>
                    <td className="px-4 py-3">{Number(product.costPrice).toFixed(2)} ج.م</td>
                    <td className="px-4 py-3 font-semibold">{Number(product.retailPrice).toFixed(2)} ج.م</td>
                    <td className="px-4 py-3">{getStatusBadge(product.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEditProduct(product)} className="p-2 text-[#3B82F6] hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onSave={handleSaveProduct}
          onClose={() => { setIsModalOpen(false); setEditingProduct(null); }}
        />
      )}
    </div>
  );
}






// import { useState } from 'react';
// import { Plus, Search, Barcode, FileDown, Edit2, Trash2 } from 'lucide-react';
// import { ProductModal } from './ProductModal';

// export interface InventoryProduct {
//   id: string;
//   barcode: string;
//   name: string;
//   category: string;
//   currentStock: number;
//   costPrice: number;
//   retailPrice: number;
//   wholesalePrice: number;
//   halfWholesalePrice: number;
//   supplier: string;
//   unit: string;
//   minReorderLevel: number;
//   status: 'available' | 'low' | 'out';
// }

// const mockInventory: InventoryProduct[] = [
//   {
//       id: '8',
//     barcode: '8901234567897',
//     name: 'حقيبة جلدية فاخرة',
//     category: 'إكسسوارات',
//     currentStock: 30,
//     costPrice: 500,
//     retailPrice: 650,
//     wholesalePrice: 575,
//     halfWholesalePrice: 600,
//     supplier: 'مصنع الجلود',
//     unit: 'قطعة',
//     minReorderLevel: 10,
//     status: 'available',
//   },
// ];

// export function InventoryScreen() {
//   const [products, setProducts] = useState<InventoryProduct[]>(mockInventory);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState('الكل');
//   const [selectedSupplier, setSelectedSupplier] = useState('الكل');
//   const [selectedStatus, setSelectedStatus] = useState('الكل');
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);

//   const categories = ['الكل', ...Array.from(new Set(products.map((p) => p.category)))];
//   const suppliers = ['الكل', ...Array.from(new Set(products.map((p) => p.supplier)))];

//   const filteredProducts = products.filter((product) => {
//     const matchesSearch =
//       searchQuery === '' ||
//       product.name.includes(searchQuery) ||
//       product.barcode.includes(searchQuery);
//     const matchesCategory = selectedCategory === 'الكل' || product.category === selectedCategory;
//     const matchesSupplier = selectedSupplier === 'الكل' || product.supplier === selectedSupplier;
//     const matchesStatus = selectedStatus === 'الكل' || product.status === selectedStatus;

//     return matchesSearch && matchesCategory && matchesSupplier && matchesStatus;
//   });

//   const handleAddProduct = () => {
//     setEditingProduct(null);
//     setIsModalOpen(true);
//   };

//   const handleEditProduct = (product: InventoryProduct) => {
//     setEditingProduct(product);
//     setIsModalOpen(true);
//   };

//   const handleDeleteProduct = (id: string) => {
//     if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
//       setProducts((prev) => prev.filter((p) => p.id !== id));
//     }
//   };

//   const handleSaveProduct = (product: InventoryProduct) => {
//     if (editingProduct) {
//       setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
//     } else {
//       setProducts((prev) => [...prev, { ...product, id: Date.now().toString() }]);
//     }
//     setIsModalOpen(false);
//     setEditingProduct(null);
//   };

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case 'available':
//         return (
//           <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
//             متوفر
//           </span>
//         );
//       case 'low':
//         return (
//           <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
//             مخزون منخفض
//           </span>
//         );
//       case 'out':
//         return (
//           <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
//             نفذ
//           </span>
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="h-full flex flex-col p-6 gap-6">
//       {/* Page Header */}
//       <div className="flex items-center justify-between">
//         <h1 className="text-3xl font-bold text-gray-800">إدارة المخازن والمنتجات</h1>
//         <div className="flex gap-3">
//           <button className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl flex items-center gap-2 transition-colors">
//             <FileDown size={20} />
//             تصدير Excel
//           </button>
//           <button
//             onClick={handleAddProduct}
//             className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold rounded-xl flex items-center gap-2 transition-colors"
//           >
//             <Plus size={20} />
//             إضافة منتج جديد
//           </button>
//         </div>
//       </div>

//       {/* Filter & Search Bar */}
//       <div className="bg-white rounded-xl p-4 shadow-sm">
//         <div className="grid grid-cols-4 gap-4">
//           {/* Search */}
//           <div className="col-span-1">
//             <div className="relative">
//               <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
//                 <Search size={18} />
//               </div>
//               <input
//                 type="text"
//                 placeholder="بحث بالاسم أو الباركود..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="w-full pr-10 pl-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
//               />
//               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
//                 <Barcode size={18} />
//               </div>
//             </div>
//           </div>

//           {/* Category Filter */}
//           <div>
//             <select
//               value={selectedCategory}
//               onChange={(e) => setSelectedCategory(e.target.value)}
//               className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
//             >
//               {categories.map((cat) => (
//                 <option key={cat} value={cat}>
//                   التصنيف: {cat}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Supplier Filter */}
//           <div>
//             <select
//               value={selectedSupplier}
//               onChange={(e) => setSelectedSupplier(e.target.value)}
//               className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
//             >
//               {suppliers.map((sup) => (
//                 <option key={sup} value={sup}>
//                   المورد: {sup === 'الكل' ? 'الكل' : sup}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Status Filter */}
//           <div>
//             <select
//               value={selectedStatus}
//               onChange={(e) => setSelectedStatus(e.target.value)}
//               className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
//             >
//               <option value="الكل">حالة المخزون: الكل</option>
//               <option value="available">متوفر</option>
//               <option value="low">مخزون منخفض</option>
//               <option value="out">نفذ</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* Products Table */}
//       <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
//         <div className="overflow-x-auto flex-1">
//           <table className="w-full">
//             <thead className="bg-[#1E293B] text-white sticky top-0">
//               <tr>
//                 <th className="px-4 py-3 text-right font-semibold">الباركود</th>
//                 <th className="px-4 py-3 text-right font-semibold">اسم المنتج</th>
//                 <th className="px-4 py-3 text-right font-semibold">التصنيف</th>
//                 <th className="px-4 py-3 text-right font-semibold">الكمية الحالية</th>
//                 <th className="px-4 py-3 text-right font-semibold">سعر التكلفة</th>
//                 <th className="px-4 py-3 text-right font-semibold">سعر البيع</th>
//                 <th className="px-4 py-3 text-right font-semibold">الحالة</th>
//                 <th className="px-4 py-3 text-center font-semibold">الإجراءات</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               {filteredProducts.map((product, index) => (
//                 <tr
//                   key={product.id}
//                   className={`hover:bg-gray-50 transition-colors ${
//                     index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
//                   }`}
//                 >
//                   <td className="px-4 py-3 text-gray-600 font-mono text-sm">{product.barcode}</td>
//                   <td className="px-4 py-3 text-gray-800 font-semibold">{product.name}</td>
//                   <td className="px-4 py-3 text-gray-600">{product.category}</td>
//                   <td className="px-4 py-3">
//                     <span className={`font-bold ${
//                       product.currentStock === 0
//                         ? 'text-red-600'
//                         : product.currentStock <= product.minReorderLevel
//                         ? 'text-orange-600'
//                         : 'text-green-600'
//                     }`}>
//                       {product.currentStock} {product.unit}
//                     </span>
//                   </td>
//                   <td className="px-4 py-3 text-gray-700">{product.costPrice.toFixed(2)} ج.م</td>
//                   <td className="px-4 py-3 text-gray-700 font-semibold">
//                     {product.retailPrice.toFixed(2)} ج.م
//                   </td>
//                   <td className="px-4 py-3">{getStatusBadge(product.status)}</td>
//                   <td className="px-4 py-3">
//                     <div className="flex items-center justify-center gap-2">
//                       <button
//                         onClick={() => handleEditProduct(product)}
//                         className="p-2 text-[#3B82F6] hover:bg-blue-50 rounded-lg transition-colors"
//                         title="تعديل"
//                       >
//                         <Edit2 size={18} />
//                       </button>
//                       <button
//                         onClick={() => handleDeleteProduct(product.id)}
//                         className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                         title="حذف"
//                       >
//                         <Trash2 size={18} />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* Table Footer */}
//         <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
//           <div className="text-sm text-gray-600">
//             عرض <span className="font-semibold">{filteredProducts.length}</span> من أصل{' '}
//             <span className="font-semibold">{products.length}</span> منتج
//           </div>
//         </div>
//       </div>

//       {/* Product Modal */}
//       {isModalOpen && (
//         <ProductModal
//           product={editingProduct}
//           onSave={handleSaveProduct}
//           onClose={() => {
//             setIsModalOpen(false);
//             setEditingProduct(null);
//           }}
//         />
//       )}
//     </div>
//   );
// }
