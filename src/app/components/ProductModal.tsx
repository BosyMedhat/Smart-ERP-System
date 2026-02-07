import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { InventoryProduct } from './InventoryScreen';

interface ProductModalProps {
  product: InventoryProduct | null;
  onSave: (product: InventoryProduct) => void;
  onClose: () => void;
}

export function ProductModal({ product, onSave, onClose }: ProductModalProps) {
  const [formData, setFormData] = useState<Partial<InventoryProduct>>({
    barcode: '',
    name: '',
    category: 'إلكترونيات',
    currentStock: 0,
    costPrice: 0,
    retailPrice: 0,
    wholesalePrice: 0,
    halfWholesalePrice: 0,
    supplier: '',
    unit: 'قطعة',
    minReorderLevel: 5,
    status: 'available',
  });

  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-calculate status based on stock
    let status: 'available' | 'low' | 'out' = 'available';
    if (formData.currentStock === 0) {
      status = 'out';
    } else if ((formData.currentStock || 0) <= (formData.minReorderLevel || 0)) {
      status = 'low';
    }

    onSave({
      ...formData,
      id: product?.id || '',
      status,
    } as InventoryProduct);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold">
            {product ? 'تعديل منتج' : 'إضافة منتج جديد'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-slate-700 p-2 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Info Section */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              المعلومات الأساسية
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  اسم المنتج <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  placeholder="أدخل اسم المنتج"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  الباركود (SKU) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => handleChange('barcode', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  placeholder="8901234567890"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  التصنيف <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  required
                >
                  <option value="إلكترونيات">إلكترونيات</option>
                  <option value="ملابس">ملابس</option>
                  <option value="إكسسوارات">إكسسوارات</option>
                  <option value="أدوات منزلية">أدوات منزلية</option>
                  <option value="أغذية">أغذية</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  الوحدة <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  required
                >
                  <option value="قطعة">قطعة</option>
                  <option value="كرتونة">كرتونة</option>
                  <option value="زوج">زوج</option>
                  <option value="كيلو">كيلو</option>
                  <option value="لتر">لتر</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  المورد
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => handleChange('supplier', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  placeholder="اسم المورد أو الشركة"
                />
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              الأسعار
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  سعر التكلفة <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => handleChange('costPrice', parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    placeholder="0.00"
                    required
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    ج.م
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  سعر القطاعي <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.retailPrice}
                    onChange={(e) => handleChange('retailPrice', parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 border border-green-400 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] bg-green-50"
                    placeholder="0.00"
                    required
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    ج.م
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  سعر الجملة <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.wholesalePrice}
                    onChange={(e) => handleChange('wholesalePrice', parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 border border-blue-400 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-blue-50"
                    placeholder="0.00"
                    required
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    ج.م
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  سعر نصف الجملة <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.halfWholesalePrice}
                    onChange={(e) =>
                      handleChange('halfWholesalePrice', parseFloat(e.target.value))
                    }
                    className="w-full px-4 py-2.5 border border-purple-400 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50"
                    placeholder="0.00"
                    required
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    ج.م
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Info Section */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              معلومات المخزون
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  الكمية الحالية <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => handleChange('currentStock', parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  حد التنبيه (الحد الأدنى) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.minReorderLevel}
                  onChange={(e) => handleChange('minReorderLevel', parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  placeholder="5"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  سيتم التنبيه عندما يصل المخزون لهذا الحد
                </p>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-semibold rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save size={20} />
              {product ? 'حفظ التعديلات' : 'إضافة المنتج'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
