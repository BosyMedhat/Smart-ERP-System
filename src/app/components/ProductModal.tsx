import { useState, useEffect, useRef } from 'react';
import { Save, X, Loader2 } from 'lucide-react';
import apiClient from '../../api/axiosConfig';
import { notify } from '@/lib/notifications';

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

const UNITS = ['قطعة', 'كرتونة', 'كيلو', 'جرام', 'لتر', 'متر', 'علبة', 'عبوة'];

export function ProductModal({ product, onSave, onClose }: ProductModalProps) {
  const [formData, setFormData] = useState<Partial<InventoryProduct>>({
    barcode: '',
    name: '',
    category: 'عام',
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
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const savingRef = useRef(false);

  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.name?.trim()) e.name = 'اسم المنتج مطلوب';
    if (!formData.barcode?.trim()) e.barcode = 'الباركود / SKU مطلوب';
    const num = (v: any) => (v === '' || v === undefined || v === null ? NaN : Number(v));
    const checks: Array<[string, any, string]> = [
      ['costPrice', num(formData.costPrice), 'سعر التكلفة'],
      ['retailPrice', num(formData.retailPrice), 'سعر البيع'],
      ['currentStock', num(formData.currentStock), 'الكمية'],
      ['minReorderLevel', num(formData.minReorderLevel), 'حد التنبيه'],
    ];
    for (const [field, value, label] of checks) {
      if (isNaN(value)) e[field] = `${label} يجب أن يكون رقماً`;
      else if (value < 0) e[field] = `${label} لا يمكن أن يكون سالباً`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    if (!validate()) {
      notify.warning('بيانات غير مكتملة', { description: 'راجع الحقول المحددة بالأحمر' });
      return;
    }

    // تجهيز البيانات لتطابق الـ Backend في Django
    const productData = {
      sku: formData.barcode,
      barcode: formData.barcode,
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

    savingRef.current = true;
    setSaving(true);
    try {
      // إرسال البيانات باستخدام apiClient (مع Token تلقائياً)
      let response;
      if (product && product.id) {
        // تعديل منتج موجود
        response = await apiClient.put(`/products/${product.id}/`, productData);
      } else {
        // إضافة منتج جديد
        response = await apiClient.post('/products/', productData);
      }

      onSave(response.data); // تحديث القائمة في الشاشة الرئيسية
      onClose();
      notify.success('تم حفظ المنتج في قاعدة البيانات بنجاح!');
    } catch (error: any) {
      console.error('Connection Error:', error);
      if (error.response?.data) {
        // Surface backend field errors on the matching inputs where possible
        const data = error.response.data;
        if (typeof data === 'object' && !Array.isArray(data)) {
          const fieldErrors: Record<string, string> = {};
          const map: Record<string, string> = {
            sku: 'barcode', barcode: 'barcode', name: 'name',
            current_stock: 'currentStock', cost_price: 'costPrice',
            retail_price: 'retailPrice', min_stock_level: 'minReorderLevel',
          };
          for (const [k, v] of Object.entries(data)) {
            const local = map[k];
            if (local) fieldErrors[local] = Array.isArray(v) ? String(v[0]) : String(v);
          }
          if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
        }
        notify.error('خطأ من السيرفر', { description: JSON.stringify(data) });
      } else {
        notify.error('خطأ في الاتصال', { description: 'تأكد من تشغيل سيرفر Django (المنفذ 8000)' });
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const fieldCls = (field: string, extra = '') =>
    `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'
    } ${extra}`;

  const fieldError = (field: string) =>
    errors[field] ? <p className="text-xs text-red-600 mt-1">{errors[field]}</p> : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto text-right" dir="rtl">
        <div className="sticky top-0 bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold">
            {product ? 'تعديل منتج' : 'إضافة منتج جديد'}
          </h2>
          <button onClick={onClose} className="text-white hover:bg-slate-700 p-2 rounded-lg" disabled={saving}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-semibold mb-2">اسم المنتج *</label>
              <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className={fieldCls('name')} />
              {fieldError('name')}
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-semibold mb-2">الباركود (SKU) *</label>
              <input
                type="text"
                data-barcode-input="true"
                value={formData.barcode}
                onChange={(e) => handleChange('barcode', e.target.value)}
                className={fieldCls('barcode')}
                placeholder="امسح الباركود أو اكتبه يدوياً"
              />
              {fieldError('barcode') || <p className="text-xs text-gray-500 mt-1">يمكنك مسح الباركود مباشرة في هذا الحقل</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2">التصنيف</label>
              <input type="text" value={formData.category} onChange={(e) => handleChange('category', e.target.value)} className={fieldCls('category')} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">الوحدة</label>
              <select value={formData.unit} onChange={(e) => handleChange('unit', e.target.value)} className={fieldCls('unit')}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                {formData.unit && !UNITS.includes(formData.unit) && (
                  <option value={formData.unit}>{formData.unit}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">المورد</label>
              <input type="text" value={formData.supplier} onChange={(e) => handleChange('supplier', e.target.value)} className={fieldCls('supplier')} placeholder="اختياري" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2">سعر التكلفة *</label>
              <input type="number" min="0" step="0.01" value={formData.costPrice} onChange={(e) => handleChange('costPrice', e.target.value)} className={fieldCls('costPrice')} />
              {fieldError('costPrice')}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">سعر القطاعي *</label>
              <input type="number" min="0" step="0.01" value={formData.retailPrice} onChange={(e) => handleChange('retailPrice', e.target.value)} className={fieldCls('retailPrice', 'border-2 border-green-400 bg-green-50')} />
              {fieldError('retailPrice')}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">سعر الجملة</label>
              <input type="number" min="0" step="0.01" value={formData.wholesalePrice} onChange={(e) => handleChange('wholesalePrice', e.target.value)} className={fieldCls('wholesalePrice')} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">سعر نصف الجملة</label>
              <input type="number" min="0" step="0.01" value={formData.halfWholesalePrice} onChange={(e) => handleChange('halfWholesalePrice', e.target.value)} className={fieldCls('halfWholesalePrice')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2">الكمية الحالية *</label>
              <input type="number" min="0" step="any" value={formData.currentStock} onChange={(e) => handleChange('currentStock', e.target.value)} className={fieldCls('currentStock')} />
              {fieldError('currentStock')}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">حد التنبيه *</label>
              <input type="number" min="0" step="any" value={formData.minReorderLevel} onChange={(e) => handleChange('minReorderLevel', e.target.value)} className={fieldCls('minReorderLevel')} />
              {fieldError('minReorderLevel')}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 rounded-lg" disabled={saving}>إلغاء</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-[#10B981] text-white font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {saving ? 'جارٍ الحفظ…' : product ? 'حفظ التعديلات' : 'إضافة المنتج'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
