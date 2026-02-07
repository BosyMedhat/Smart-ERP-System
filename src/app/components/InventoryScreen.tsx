import { useState } from 'react';
import { Plus, Search, Barcode, FileDown, Edit2, Trash2 } from 'lucide-react';
import { ProductModal } from './ProductModal';

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

const mockInventory: InventoryProduct[] = [
  {
    id: '1',
    barcode: '8901234567890',
    name: 'لابتوب HP Pavilion 15',
    category: 'إلكترونيات',
    currentStock: 25,
    costPrice: 12000,
    retailPrice: 15000,
    wholesalePrice: 13500,
    halfWholesalePrice: 14000,
    supplier: 'شركة التكنولوجيا المتقدمة',
    unit: 'قطعة',
    minReorderLevel: 5,
    status: 'available',
  },
  {
    id: '2',
    barcode: '8901234567891',
    name: 'هاتف سامسونج Galaxy A54',
    category: 'إلكترونيات',
    currentStock: 8,
    costPrice: 7000,
    retailPrice: 8500,
    wholesalePrice: 7800,
    halfWholesalePrice: 8100,
    supplier: 'مؤسسة الإلكترونيات',
    unit: 'قطعة',
    minReorderLevel: 10,
    status: 'low',
  },
  {
    id: '3',
    barcode: '8901234567892',
    name: 'سماعة بلوتوث JBL',
    category: 'إلكترونيات',
    currentStock: 0,
    costPrice: 350,
    retailPrice: 450,
    wholesalePrice: 400,
    halfWholesalePrice: 425,
    supplier: 'شركة الصوتيات',
    unit: 'قطعة',
    minReorderLevel: 15,
    status: 'out',
  },
  {
    id: '4',
    barcode: '8901234567893',
    name: 'قميص رجالي قطن',
    category: 'ملابس',
    currentStock: 45,
    costPrice: 250,
    retailPrice: 350,
    wholesalePrice: 300,
    halfWholesalePrice: 320,
    supplier: 'مصنع النسيج الحديث',
    unit: 'قطعة',
    minReorderLevel: 20,
    status: 'available',
  },
  {
    id: '5',
    barcode: '8901234567894',
    name: 'حذاء رياضي Nike',
    category: 'ملابس',
    currentStock: 18,
    costPrice: 650,
    retailPrice: 850,
    wholesalePrice: 750,
    halfWholesalePrice: 800,
    supplier: 'وكيل الأحذية الرياضية',
    unit: 'زوج',
    minReorderLevel: 12,
    status: 'available',
  },
  {
    id: '6',
    barcode: '8901234567895',
    name: 'ساعة ذكية Apple Watch',
    category: 'إلكترونيات',
    currentStock: 6,
    costPrice: 2000,
    retailPrice: 2500,
    wholesalePrice: 2250,
    halfWholesalePrice: 2350,
    supplier: 'شركة التكنولوجيا المتقدمة',
    unit: 'قطعة',
    minReorderLevel: 8,
    status: 'low',
  },
  {
    id: '7',
    barcode: '8901234567896',
    name: 'كاميرا Canon EOS',
    category: 'إلكترونيات',
    currentStock: 12,
    costPrice: 10000,
    retailPrice: 12000,
    wholesalePrice: 11000,
    halfWholesalePrice: 11500,
    supplier: 'شركة التصوير الاحترافي',
    unit: 'قطعة',
    minReorderLevel: 3,
    status: 'available',
  },
  {
    id: '8',
    barcode: '8901234567897',
    name: 'حقيبة جلدية فاخرة',
    category: 'إكسسوارات',
    currentStock: 30,
    costPrice: 500,
    retailPrice: 650,
    wholesalePrice: 575,
    halfWholesalePrice: 600,
    supplier: 'مصنع الجلود',
    unit: 'قطعة',
    minReorderLevel: 10,
    status: 'available',
  },
];

export function InventoryScreen() {
  const [products, setProducts] = useState<InventoryProduct[]>(mockInventory);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedSupplier, setSelectedSupplier] = useState('الكل');
  const [selectedStatus, setSelectedStatus] = useState('الكل');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);

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

  const handleDeleteProduct = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleSaveProduct = (product: InventoryProduct) => {
    if (editingProduct) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
    } else {
      setProducts((prev) => [...prev, { ...product, id: Date.now().toString() }]);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
            متوفر
          </span>
        );
      case 'low':
        return (
          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
            مخزون منخفض
          </span>
        );
      case 'out':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
            نفذ
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">إدارة المخازن والمنتجات</h1>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl flex items-center gap-2 transition-colors">
            <FileDown size={20} />
            تصدير Excel
          </button>
          <button
            onClick={handleAddProduct}
            className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold rounded-xl flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            إضافة منتج جديد
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-4 gap-4">
          {/* Search */}
          <div className="col-span-1">
            <div className="relative">
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="بحث بالاسم أو الباركود..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Barcode size={18} />
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  التصنيف: {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier Filter */}
          <div>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              {suppliers.map((sup) => (
                <option key={sup} value={sup}>
                  المورد: {sup === 'الكل' ? 'الكل' : sup}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="الكل">حالة المخزون: الكل</option>
              <option value="available">متوفر</option>
              <option value="low">مخزون منخفض</option>
              <option value="out">نفذ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead className="bg-[#1E293B] text-white sticky top-0">
              <tr>
                <th className="px-4 py-3 text-right font-semibold">الباركود</th>
                <th className="px-4 py-3 text-right font-semibold">اسم المنتج</th>
                <th className="px-4 py-3 text-right font-semibold">التصنيف</th>
                <th className="px-4 py-3 text-right font-semibold">الكمية الحالية</th>
                <th className="px-4 py-3 text-right font-semibold">سعر التكلفة</th>
                <th className="px-4 py-3 text-right font-semibold">سعر البيع</th>
                <th className="px-4 py-3 text-right font-semibold">الحالة</th>
                <th className="px-4 py-3 text-center font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product, index) => (
                <tr
                  key={product.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="px-4 py-3 text-gray-600 font-mono text-sm">{product.barcode}</td>
                  <td className="px-4 py-3 text-gray-800 font-semibold">{product.name}</td>
                  <td className="px-4 py-3 text-gray-600">{product.category}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${
                      product.currentStock === 0
                        ? 'text-red-600'
                        : product.currentStock <= product.minReorderLevel
                        ? 'text-orange-600'
                        : 'text-green-600'
                    }`}>
                      {product.currentStock} {product.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{product.costPrice.toFixed(2)} ج.م</td>
                  <td className="px-4 py-3 text-gray-700 font-semibold">
                    {product.retailPrice.toFixed(2)} ج.م
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(product.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-2 text-[#3B82F6] hover:bg-blue-50 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
          <div className="text-sm text-gray-600">
            عرض <span className="font-semibold">{filteredProducts.length}</span> من أصل{' '}
            <span className="font-semibold">{products.length}</span> منتج
          </div>
        </div>
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onSave={handleSaveProduct}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}
