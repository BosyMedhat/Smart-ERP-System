import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

// تعريف الـ Interface محلياً لضمان عدم وجود أخطاء في الـ Import
export interface InventoryProduct {
  id?: string | number;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // تجهيز البيانات لتطابق الـ Backend في Django
    const productData = {
      sku: formData.barcode,
      name: formData.name,
      category: formData.category,
      current_stock: Number(formData.currentStock),
      cost_price: Number(formData.costPrice),
      retail_price: Number(formData.retailPrice),
      wholesale_price: Number(formData.wholesalePrice),
      half_wholesale_price: Number(formData.halfWholesalePrice),
      unit: formData.unit,
      min_stock_level: Number(formData.minReorderLevel),
      supplier_name: formData.supplier
    };

    try {
      // إرسال البيانات للـ API الذي يعمل على منفذ 8000
      const url = product && product.id 
        ? `http://127.0.0.1:8000/api/products/${product.id}/` 
        : 'http://127.0.0.1:8000/api/products/';
      
      const method = product && product.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        const result = await response.json();
        onSave(result); // تحديث القائمة في الشاشة الرئيسية
        onClose();
        alert('تم حفظ المنتج في قاعدة البيانات بنجاح!');
      } else {
        const errorData = await response.json();
        alert('خطأ من السيرفر: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error('Connection Error:', error);
      alert('تأكد من تشغيل سيرفر Django (المنفذ 8000)');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto text-right" dir="rtl">
        <div className="sticky top-0 bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold">
            {product ? 'تعديل منتج' : 'إضافة منتج جديد'}
          </h2>
          <button onClick={onClose} className="text-white hover:bg-slate-700 p-2 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-semibold mb-2">اسم المنتج *</label>
              <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-semibold mb-2">الباركود (SKU) *</label>
              <input type="text" value={formData.barcode} onChange={(e) => handleChange('barcode', e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2">سعر التكلفة *</label>
              <input type="number" value={formData.costPrice} onChange={(e) => handleChange('costPrice', e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">سعر القطاعي *</label>
              <input type="number" value={formData.retailPrice} onChange={(e) => handleChange('retailPrice', e.target.value)} className="w-full px-4 py-2 border-2 border-green-400 rounded-lg bg-green-50" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2">الكمية الحالية *</label>
              <input type="number" value={formData.currentStock} onChange={(e) => handleChange('currentStock', e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">حد التنبيه *</label>
              <input type="number" value={formData.minReorderLevel} onChange={(e) => handleChange('minReorderLevel', e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 rounded-lg">إلغاء</button>
            <button type="submit" className="px-6 py-2 bg-[#10B981] text-white font-semibold rounded-lg flex items-center gap-2">
              <Save size={20} />
              {product ? 'حفظ التعديلات' : 'إضافة المنتج'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}