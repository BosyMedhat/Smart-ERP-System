import { useState, useEffect } from 'react';
import { X, ShoppingBag, Plus, Trash2, Printer } from 'lucide-react';
import apiClient from '../../api/axiosConfig';
import { notify } from '@/lib/notifications';
import { formatCurrency } from '../utils/currency';

interface Product {
  id: number;
  name: string;
  cost_price: number;
}

interface Supplier {
  id: number;
  name: string;
}

interface LineItem {
  id: number;
  productId: number;
  quantity: number;
  cost_price: number;
}

interface PurchaseInvoiceModalProps {
  onClose: () => void;
}

export function PurchaseInvoiceModal({ onClose }: PurchaseInvoiceModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [supplierId, setSupplierId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supRes, prodRes] = await Promise.all([
          apiClient.get('/suppliers/'),
          apiClient.get('/products/'),
        ]);
        setSuppliers(Array.isArray(supRes.data) ? supRes.data : supRes.data.results ?? []);
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.results ?? []);
      } catch (e) {
        console.error(e);
        notify.error('فشل تحميل البيانات', { description: 'تأكد من تشغيل سيرفر Django على بورت 8000' });
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const addItem = () => {
    setItems([...items, { id: Date.now(), productId: 0, quantity: 1, cost_price: 0 }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: number, field: keyof LineItem, value: number) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'productId' && value > 0) {
          const prod = products.find((p) => p.id === value);
          if (prod) {
            updated.cost_price = prod.cost_price;
          }
        }
        return updated;
      })
    );
  };

  const lineTotal = (item: LineItem) => item.quantity * item.cost_price;
  const invoiceTotal = items.reduce((sum, item) => sum + lineTotal(item), 0);

  const selectedSupplierName = suppliers.find((s) => s.id === parseInt(supplierId))?.name ?? '';

  const handleSaveAndPrint = async () => {
    if (!supplierId) {
      notify.warning('برجاء اختيار المورد');
      return;
    }
    if (items.length === 0) {
      notify.warning('لا يوجد أصناف في الفاتورة');
      return;
    }
    for (const item of items) {
      if (!item.productId || item.productId <= 0) {
        notify.warning('برجاء اختيار المنتج لجميع الأصناف');
        return;
      }
      if (item.quantity <= 0) {
        notify.warning('الكمية يجب أن تكون أكبر من صفر');
        return;
      }
      if (item.cost_price < 0) {
        notify.warning('سعر التكلفة لا يمكن أن يكون سالباً');
        return;
      }
    }

    setSaving(true);
    try {
      const results = await Promise.allSettled(
        items.map((item) =>
          apiClient.post('/purchases/', {
            supplier: parseInt(supplierId),
            product: item.productId,
            quantity: item.quantity,
            cost_price: item.cost_price,
            invoice_number: invoiceNumber || null,
            notes: notes || null,
          })
        )
      );

      const failedCount = results.filter((r) => r.status === 'rejected').length;
      if (failedCount > 0) {
        notify.error(`فشل حفظ ${failedCount} من ${items.length} أصناف`, {
          description: 'بعض بنود الفاتورة لم تُحفظ. تحقق من السيرفر.',
        });
      } else {
        notify.success('تم حفظ فاتورة الشراء بنجاح!', {
          description: `إجمالي الفاتورة: ${formatCurrency(invoiceTotal)}`,
        });
        setTimeout(() => window.print(), 600);
      }
    } catch (error: any) {
      console.error(error);
      notify.error('حدث خطأ أثناء الحفظ', {
        description:
          error.response?.data && typeof error.response.data === 'object'
            ? JSON.stringify(error.response.data)
            : error.message || 'تأكد من تشغيل Django على بورت 8000',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-2xl p-10 text-center">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ShoppingBag className="text-white" />
          </div>
          <p className="text-gray-600 font-bold">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <ShoppingBag className="text-white" />
            </div>
            <h2 className="text-2xl font-bold">فاتورة شراء</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center"
          >
            <X />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 print:hidden">
          {/* Supplier & Meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">المورد *</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">-- اختر مورد --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">رقم الفاتورة</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="رقم الفاتورة (اختياري)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">ملاحظات</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none text-sm"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات على الفاتورة..."
            />
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 text-center font-bold text-gray-700 border-b-2 pb-2">
            <div className="col-span-4">المنتج</div>
            <div className="col-span-2">الكمية</div>
            <div className="col-span-2">سعر التكلفة</div>
            <div className="col-span-3">الإجمالي</div>
            <div className="col-span-1"></div>
          </div>

          {/* Table Items */}
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center text-center bg-gray-50 p-2 rounded-lg">
              {/* المنتج */}
              <div className="col-span-4">
                <select
                  className="w-full text-center border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                  value={item.productId || ''}
                  onChange={(e) => updateItem(item.id, 'productId', parseInt(e.target.value) || 0)}
                >
                  <option value="">-- اختر منتج --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* الكمية */}
              <div className="col-span-2">
                <input
                  type="number"
                  value={item.quantity}
                  min={1}
                  onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  className="w-full text-center border rounded-md px-2 py-1"
                />
              </div>

              {/* سعر التكلفة */}
              <div className="col-span-2">
                <input
                  type="number"
                  value={item.cost_price}
                  min={0}
                  step="0.01"
                  onChange={(e) => updateItem(item.id, 'cost_price', parseFloat(e.target.value) || 0)}
                  className="w-full text-center border rounded-md px-2 py-1"
                />
              </div>

              {/* الإجمالي */}
              <div className="col-span-3 font-bold text-green-700">
                {formatCurrency(lineTotal(item))}
              </div>

              {/* زر الحذف */}
              <div className="col-span-1">
                <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {/* Add Item Button */}
          <button
            onClick={addItem}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 transition"
          >
            <Plus size={18} />
            إضافة صنف
          </button>

          {/* Total */}
          <div className="text-right text-xl font-bold text-gray-800 mt-4 bg-green-50 rounded-xl p-4">
            <span className="text-gray-600">إجمالي الفاتورة: </span>
            <span className="text-green-700">{formatCurrency(invoiceTotal)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex gap-3 print:hidden">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 bg-gray-200 py-3 rounded-xl font-bold hover:bg-gray-300 transition disabled:opacity-50"
          >
            إلغاء
          </button>

          <button
            onClick={handleSaveAndPrint}
            disabled={saving}
            className="flex-[2] bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Printer size={18} />
            {saving ? 'جاري الحفظ...' : 'حفظ وطباعة الفاتورة'}
          </button>
        </div>

        {/* Print-only invoice summary */}
        <div className="hidden print:block p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">فاتورة شراء</h1>
            <p className="text-gray-600">{new Date().toLocaleDateString('ar-EG')}</p>
          </div>

          <div className="mb-4">
            <p className="font-bold">المورد: <span className="font-normal">{selectedSupplierName || '—'}</span></p>
            {invoiceNumber && <p className="font-bold">رقم الفاتورة: <span className="font-normal">{invoiceNumber}</span></p>}
            {notes && <p className="font-bold">ملاحظات: <span className="font-normal">{notes}</span></p>}
          </div>

          <table className="w-full border-collapse border border-gray-400 mb-6">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-400 px-4 py-2 text-right">المنتج</th>
                <th className="border border-gray-400 px-4 py-2 text-center">الكمية</th>
                <th className="border border-gray-400 px-4 py-2 text-center">سعر التكلفة</th>
                <th className="border border-gray-400 px-4 py-2 text-center">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="border border-gray-400 px-4 py-2 text-right">
                    {products.find((p) => p.id === item.productId)?.name || '—'}
                  </td>
                  <td className="border border-gray-400 px-4 py-2 text-center">{item.quantity}</td>
                  <td className="border border-gray-400 px-4 py-2 text-center">{formatCurrency(item.cost_price)}</td>
                  <td className="border border-gray-400 px-4 py-2 text-center">{formatCurrency(lineTotal(item))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-left">
            <p className="text-xl font-bold">
              الإجمالي الكلي: {formatCurrency(invoiceTotal)}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

