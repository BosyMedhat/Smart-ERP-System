// InventoryAuditModal.tsx
import { useState } from 'react';
import { X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  quantity: number;
  minQuantity: number;
  status: 'متاح' | 'ناقص' | 'منتهي الصلاحية';
}

interface InventoryAuditModalProps {
  onClose: () => void;
}

export function InventoryAuditModal({ onClose }: InventoryAuditModalProps) {
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'لابتوب HP', code: 'HP123', category: 'أجهزة', quantity: 5, minQuantity: 10, status: 'ناقص' },
    { id: '2', name: 'ماوس Logitech', code: 'LOG456', category: 'ملحقات', quantity: 20, minQuantity: 5, status: 'متاح' },
    { id: '3', name: 'شاشة Samsung', code: 'SAM789', category: 'أجهزة', quantity: 0, minQuantity: 5, status: 'ناقص' },
  ]);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    setProducts(products.map(p => p.id === id ? { ...p, quantity: newQuantity } : p));
  };

  const saveAudit = () => {
    console.log('تم حفظ الجرد النهائي:', products);
    onClose();
  };

  const getStatusBadge = (product: Product) => {
    if (product.quantity === 0) return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full animate-pulse">منتهي الصلاحية</span>;
    if (product.quantity < product.minQuantity) return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full animate-pulse">ناقص</span>;
    return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full animate-pulse">متاح</span>;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-[95%] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-3xl text-white">
          <h2 className="text-2xl font-bold">جرد المخازن</h2>
          <button onClick={onClose} className="hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Subtitle */}
        <div className="p-4 text-gray-600 border-b border-gray-200">قم بتحديث الكميات الفعلية لكل منتج</div>

        {/* Table */}
        <div className="overflow-x-auto flex-1 p-4">
          <table className="w-full table-auto border-collapse text-right">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="border-b p-3 text-sm font-semibold text-gray-600">الكود</th>
                <th className="border-b p-3 text-sm font-semibold text-gray-600">اسم المنتج</th>
                <th className="border-b p-3 text-sm font-semibold text-gray-600">الفئة</th>
                <th className="border-b p-3 text-sm font-semibold text-gray-600">الكمية الحالية</th>
                <th className="border-b p-3 text-sm font-semibold text-gray-600">الحد الأدنى</th>
                <th className="border-b p-3 text-sm font-semibold text-gray-600">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} className="hover:bg-blue-50 transition-all">
                  <td className="border-b p-3 text-sm font-medium">{product.code}</td>
                  <td className="border-b p-3 text-sm font-medium">{product.name}</td>
                  <td className="border-b p-3 text-sm font-medium">{product.category}</td>
                  <td className="border-b p-3 text-sm">
                    <input
                      type="number"
                      min={0}
                      value={product.quantity}
                      onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value))}
                      className="w-20 p-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </td>
                  <td className="border-b p-3 text-sm font-medium">{product.minQuantity}</td>
                  <td className="border-b p-3 text-sm">{getStatusBadge(product)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-4 p-6 border-t border-gray-200">
          <button onClick={onClose} className="px-6 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition font-semibold">إلغاء</button>
          <button onClick={saveAudit} className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold shadow-lg">حفظ الجرد</button>
        </div>
      </div>
    </div>
  );
}
