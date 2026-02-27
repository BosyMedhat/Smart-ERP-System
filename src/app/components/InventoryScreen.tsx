import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Users } from 'lucide-react';
import { ProductModal } from './ProductModal';
import { deleteProduct, getProducts } from '../../api/inventoryApi';

export function InventoryScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedSupplier, setSelectedSupplier] = useState('الكل');
  const [selectedStatus, setSelectedStatus] = useState('الكل');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // دالة جلب البيانات لتحديث الجدول تلقائياً
  const fetchMyData = async () => {
    try {
      const data = await getProducts();
      setProducts(data || []);
    } catch (error) {
      console.error("خطأ في جلب البيانات:", error);
    }
  };

  useEffect(() => {
    fetchMyData();
  }, []);

  const categories = ['الكل', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];
  const suppliers = ['الكل', ...Array.from(new Set(products.map((p) => p.supplier_name).filter(Boolean)))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = searchQuery === '' || 
                         (product.name && product.name.includes(searchQuery)) || 
                         (product.sku && product.sku.includes(searchQuery));
    const matchesCategory = selectedCategory === 'الكل' || product.category === selectedCategory;
    const matchesSupplier = selectedSupplier === 'الكل' || product.supplier_name === selectedSupplier;
    const matchesStatus = selectedStatus === 'الكل' || product.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesSupplier && matchesStatus;
  });

  const handleEditProduct = (product: any) => {
    // تحويل البيانات من snake_case (Django) لـ camelCase (Modal) عشان تظهر في الفورم
    const formattedProduct = {
      ...product,
      barcode: product.sku,
      currentStock: product.current_stock,
      costPrice: product.cost_price,
      retailPrice: product.retail_price,
      minReorderLevel: product.min_stock_level,
      supplier: product.supplier_name
    };
    setEditingProduct(formattedProduct);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        await deleteProduct(id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
        alert('تم الحذف بنجاح');
      } catch (error) {
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">إدارة المخازن والمنتجات</h1>
        <button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="px-6 py-3 bg-[#3B82F6] text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all">
          <Plus size={20} /> إضافة منتج جديد
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 border border-gray-100">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="بحث بالاسم أو الكود..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pr-10 pl-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500">
          {categories.map(cat => <option key={cat} value={cat}>التصنيف: {cat}</option>)}
        </select>

        <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500">
          {suppliers.map(sup => <option key={sup} value={sup}>المورد: {sup}</option>)}
        </select>

        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500">
          <option value="الكل">الحالة: الكل</option>
          <option value="متوفر">متوفر</option>
          <option value="نفذت الكمية">نفذت الكمية</option>
        </select>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <div className="overflow-y-auto h-[60vh]">
          <table className="w-full text-sm text-right">
            <thead className="bg-[#1E293B] text-white sticky top-0">
              <tr>
                <th className="px-4 py-4">الكود</th>
                <th className="px-4 py-4">اسم المنتج</th>
                <th className="px-4 py-4">المورد</th>
                <th className="px-4 py-4">الكمية</th>
                <th className="px-4 py-4">سعر التكلفة</th>
                <th className="px-4 py-4">سعر البيع</th>
                <th className="px-4 py-4">الحالة</th>
                <th className="px-4 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-500">{product.sku}</td>
                  <td className="px-4 py-3 font-bold text-gray-700">{product.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users size={14} className="text-blue-400" />
                      {product.supplier_name || 'غير محدد'}
                    </div>
                  </td>
                  <td className={`px-4 py-3 font-bold ${Number(product.current_stock) <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {Number(product.current_stock).toFixed(0)} {product.unit}
                  </td>
                  {/* تصليح الحقول لتطابق الـ API واختفاء الـ NaN */}
                  <td className="px-4 py-3 text-gray-600">{Number(product.cost_price || 0).toFixed(2)} ج.م</td>
                  <td className="px-4 py-3 font-bold text-blue-700">{Number(product.retail_price || 0).toFixed(2)} ج.م</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${Number(product.current_stock) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {Number(product.current_stock) > 0 ? 'متوفر' : 'نفذت الكمية'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => handleEditProduct(product)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Edit2 size={16}/></button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onSave={() => { 
            fetchMyData(); // تحديث الجدول فوراً بعد الحفظ
            setIsModalOpen(false); 
          }}
          onClose={() => { setIsModalOpen(false); setEditingProduct(null); }}
        />
      )}
    </div>
  );
}