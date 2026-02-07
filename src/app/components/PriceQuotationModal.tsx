import { useState } from 'react';
import { X, FileText, Plus, Trash2, Percent } from 'lucide-react';

interface Item {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface PriceQuotationModalProps {
  onClose: () => void;
}

export function PriceQuotationModal({ onClose }: PriceQuotationModalProps) {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: '', quantity: 1, price: 0 },
  ]);

  const [discount, setDiscount] = useState(0);

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now(), name: '', quantity: 1, price: 0 },
    ]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (
    id: number,
    field: keyof Item,
    value: string | number
  ) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? { ...item, [field]: field === 'name' ? value : Number(value) }
          : item
      )
    );
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const total = subtotal - discount;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <FileText className="text-white" />
            </div>
            <h2 className="text-2xl font-bold">عرض سعر جديد</h2>
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

          {/* Client Info */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="اسم العميل"
              className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
            />
            <input
              type="text"
              placeholder="رقم الموبايل (اختياري)"
              className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
            />
          </div>

          {/* Items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border"
              >
                <input
                  type="text"
                  placeholder="اسم الصنف"
                  value={item.name}
                  onChange={(e) =>
                    updateItem(item.id, 'name', e.target.value)
                  }
                  className="flex-1 px-3 py-2 border rounded-lg"
                />

                <input
                  type="number"
                  value={item.quantity}
                  min={1}
                  onChange={(e) =>
                    updateItem(item.id, 'quantity', e.target.value)
                  }
                  className="w-20 px-2 py-2 border rounded-lg text-center"
                />

                <input
                  type="number"
                  value={item.price}
                  min={0}
                  onChange={(e) =>
                    updateItem(item.id, 'price', e.target.value)
                  }
                  className="w-28 px-2 py-2 border rounded-lg text-center"
                />

                <div className="w-28 font-bold text-right">
                  {(item.quantity * item.price).toLocaleString()} ج.م
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center hover:bg-red-200"
                >
                  <Trash2 className="text-red-600" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Item */}
          <button
            onClick={addItem}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700"
          >
            <Plus />
            إضافة بند
          </button>

          {/* Summary */}
          <div className="bg-purple-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between font-bold">
              <span>الإجمالي</span>
              <span>{subtotal.toLocaleString()} ج.م</span>
            </div>

            <div className="flex items-center gap-2">
              <Percent size={18} />
              <input
                type="number"
                placeholder="خصم"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-32 px-2 py-1 border rounded-lg"
              />
            </div>

            <div className="flex justify-between text-xl font-bold text-purple-700">
              <span>الإجمالي النهائي</span>
              <span>{total.toLocaleString()} ج.م</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 py-3 rounded-xl font-bold"
          >
            إلغاء
          </button>

          <button className="flex-[2] bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700">
            حفظ عرض السعر
          </button>
        </div>
      </div>
    </div>
  );
}
