import { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon } from 'lucide-react';
import { createProduct, updateProduct } from '../../api/inventoryApi';

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
  image?: any;
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
    image: null
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData(product);
      if (product.image && typeof product.image === 'string') {
        setImagePreview(`http://127.0.0.1:8000${product.image}`);
      }
    }
  }, [product]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append('sku', formData.barcode || '');
    fd.append('name', formData.name || '');
    fd.append('category', formData.category || 'إلكترونيات');
    fd.append('current_stock', String(formData.currentStock || 0));
    fd.append('cost_price', String(formData.costPrice || 0));
    fd.append('retail_price', String(formData.retailPrice || 0));
    fd.append('wholesale_price', String(formData.wholesalePrice || 0));
    fd.append('unit', formData.unit || 'قطعة');
    fd.append('min_stock_level', String(formData.minReorderLevel || 5));
    
    if (imageFile) {
        fd.append('image', imageFile);
    }

    try {
      let result;
      if (product && product.id) {
        result = await updateProduct(product.id.toString(), fd);
      } else {
        result = await createProduct(fd);
      }

      onSave(result);
      onClose();
      alert('تم حفظ المنتج بنجاح!');
    } catch (error) {
      console.error('Save Error:', error);
      alert('حدث خطأ أثناء الحفظ. تأكد من صحة البيانات.');
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
              <label className="block text-sm font-semibold mb-2">التصنيف</label>
              <select value={formData.category} onChange={(e) => handleChange('category', e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                <option value="Gaming">Gaming</option>
                <option value="Mobiles">Mobiles</option>
                <option value="Accessories">Accessories</option>
                <option value="Audio">Audio</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">صورة المنتج</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-2 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-gray-500">
                  <ImageIcon size={20} />
                  <span className="text-xs">اختر صورة</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
                {imagePreview && (
                  <div className="w-12 h-12 rounded-lg border overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
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