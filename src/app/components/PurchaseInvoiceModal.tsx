import { useState } from 'react';
import { X, ShoppingBag, Plus, Trash2 } from 'lucide-react';

interface Item {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface PurchaseInvoiceModalProps {
  onClose: () => void;
}

export function PurchaseInvoiceModal({ onClose }: PurchaseInvoiceModalProps) {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: 'صنف 1', quantity: 1, price: 150 },
    { id: 2, name: 'صنف 2', quantity: 2, price: 300 },
  ]);

  const addItem = () => {
    const newId = Date.now();
    setItems([...items, { id: newId, name: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: number, field: keyof Item, value: string | number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: field === 'name' ? value : Number(value) } : item
      )
    );
  };

  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
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
        <div className="p-6 space-y-4">

          {/* Table Header */}
          <div className="grid grid-cols-5 gap-2 text-center font-bold text-gray-700 border-b-2 pb-2">
            <div>الصنف</div>
            <div>الكمية</div>
            <div>السعر</div>
            <div>الإجمالي</div>
            <div></div>
          </div>

          {/* Table Items */}
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-5 gap-2 items-center text-center bg-gray-50 p-2 rounded-lg">
              {/* اسم الصنف */}
              <div>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                  className="w-full text-center border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="اكتب اسم الصنف"
                />
              </div>

              {/* الكمية */}
              <div>
                <input
                  type="number"
                  value={item.quantity}
                  min={1}
                  onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value))}
                  className="w-16 text-center border rounded-md"
                />
              </div>

              {/* السعر */}
              <div>
                <input
                  type="number"
                  value={item.price}
                  min={0}
                  onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value))}
                  className="w-20 text-center border rounded-md"
                />
              </div>

              {/* الإجمالي */}
              <div>{(item.quantity * item.price).toLocaleString()} ج.م</div>

              {/* زر الحذف */}
              <div>
                <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700">
                  <Trash2 />
                </button>
              </div>
            </div>
          ))}

          {/* Add Item Button */}
          <button
            onClick={addItem}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600"
          >
            <Plus />
            إضافة صنف
          </button>

          {/* Total */}
          <div className="text-right text-xl font-bold text-gray-800 mt-4">
            الإجمالي: {total.toLocaleString()} ج.م
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
          >
            إلغاء
          </button>

          <button className="flex-[2] bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition">
            حفظ وطباعة الفاتورة
          </button>
        </div>

      </div>
    </div>
  );
}

