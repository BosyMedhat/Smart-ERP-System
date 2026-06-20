import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Users, ScanLine, Package, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { notify } from '@/lib/notifications';
import { ConfirmDialog, useConfirm } from './ConfirmDialog';
import { ProductModal } from './ProductModal';
import { deleteProduct, getProducts } from '../../api/inventoryApi';
import apiClient from '../../api/axiosConfig';
import { formatCurrency } from '../utils/currency';

export function InventoryScreen() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedSupplier, setSelectedSupplier] = useState('الكل');
  const [selectedStatus, setSelectedStatus] = useState('الكل');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  
  // Barcode scanning state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedProduct, setScannedProduct] = useState<any | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockQuantity, setStockQuantity] = useState('');
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [scanError, setScanError] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const { confirm, ConfirmDialog: ConfirmDeleteDialog } = useConfirm();

  // دالة جلب البيانات لتحديث الجدول تلقائياً
  const fetchMyData = async () => {
    try {
      const data = await getProducts();
      setProducts(data || []);
    } catch (error) {
      console.error("خطأ في جلب البيانات:", error);
    }
  };

  // Barcode handling functions
  const handleBarcodeSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!barcodeInput.trim()) return;

    setScanError('');
    try {
      const response = await apiClient.get(`/products/barcode/${barcodeInput.trim()}/`);
      const product = response.data;
      
      setScannedProduct(product);
      setHighlightedProductId(String(product.id));
      setShowStockModal(true);
      setStockQuantity('');
      
      // Auto-clear highlight after 5 seconds
      setTimeout(() => setHighlightedProductId(null), 5000);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setScanError(`لا يوجد منتج بهذا الباركود: ${barcodeInput}`);
        setScannedProduct(null);
      } else {
        setScanError('حدث خطأ أثناء البحث');
      }
    }
  }, [barcodeInput]);

  const handleCreateNewProduct = () => {
    setEditingProduct({
      barcode: barcodeInput,
      sku: barcodeInput,
    });
    setIsModalOpen(true);
    setScanError('');
    setBarcodeInput('');
  };

  const handleUpdateStock = async () => {
    if (!scannedProduct || !stockQuantity) return;
    
    try {
      const newStock = parseFloat(scannedProduct.current_stock || 0) + parseFloat(stockQuantity);
      await apiClient.patch(`/products/${scannedProduct.id}/`, {
        current_stock: newStock
      });
      
      // Refresh data and close modal
      await fetchMyData();
      setShowStockModal(false);
      setBarcodeInput('');
      setStockQuantity('');
      setScannedProduct(null);
      notify.success(`تم تحديث المخزون: ${scannedProduct.name} - الكمية الجديدة: ${newStock}`);
    } catch (error) {
      notify.error('فشل تحديث المخزون');
    }
  };

  // Auto-focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

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
    const confirmed = await confirm({
      title: 'تأكيد الحذف',
      description: 'هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.',
      variant: 'destructive',
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
    });
    if (confirmed) {
      try {
        await deleteProduct(id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
        notify.success('تم الحذف بنجاح');
      } catch (error) {
        notify.error('حدث خطأ أثناء الحذف');
      }
    }
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-background" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-card-foreground">{t('inventory.title')}</h1>
        <button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="px-6 py-3 bg-[#3B82F6] text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all">
          <Plus size={20} /> {t('inventory.addProduct')}
        </button>
      </div>

      {/* Barcode Scanner Section */}
      <div data-demo-id="inventory-barcode-section" className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl p-4 shadow-sm border border-blue-200/50">
        <form onSubmit={handleBarcodeSubmit} className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex items-center gap-2 text-blue-600 font-semibold">
            <ScanLine size={20} />
            <span>مسح الباركود</span>
          </div>
          <div className="flex-1 relative">
            <input
              ref={barcodeInputRef}
              type="text"
              data-barcode-input="true"
              placeholder="امسح الباركود أو اكتبه يدوياً..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full pr-4 pl-10 py-2.5 border border-blue-300/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-background text-foreground"
            />
            <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
          </div>
          <button
            type="submit"
            disabled={!barcodeInput.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-muted disabled:cursor-not-allowed transition-colors font-medium"
          >
            {t('common.search')}
          </button>
        </form>
        
        {/* Error Message */}
        {scanError && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-200/50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle size={18} />
              <span>{scanError}</span>
            </div>
            <button
              onClick={handleCreateNewProduct}
              className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={14} className="inline ml-1" />
              إنشاء منتج جديد
            </button>
          </div>
        )}
      </div>

      <div data-demo-id="inventory-search" className="bg-card rounded-xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 border border-border">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input type="text" placeholder="بحث بالاسم أو الكود..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pr-10 pl-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-background text-foreground" />
        </div>
        
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="border border-input rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground">
          {categories.map(cat => <option key={cat} value={cat}>التصنيف: {cat}</option>)}
        </select>

        <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="border border-input rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground">
          {suppliers.map(sup => <option key={sup} value={sup}>المورد: {sup}</option>)}
        </select>

        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="border border-input rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground">
          <option value="الكل">الحالة: الكل</option>
          <option value="متوفر">متوفر</option>
          <option value="نفذت الكمية">نفذت الكمية</option>
        </select>
      </div>

      <div data-demo-id="inventory-table" className="flex-1 bg-card rounded-xl shadow-md overflow-hidden border border-border">
        <div className="overflow-y-auto h-[60vh]">
          <table className="w-full text-sm text-right">
            <thead className="bg-sidebar text-sidebar-foreground sticky top-0">
              <tr>
                <th className="px-4 py-4">الكود</th>
                <th className="px-4 py-4">{t('inventory.productName')}</th>
                <th className="px-4 py-4">المورد</th>
                <th className="px-4 py-4">الكمية</th>
                <th className="px-4 py-4">سعر التكلفة</th>
                <th className="px-4 py-4">سعر البيع</th>
                <th className="px-4 py-4">{t('common.status')}</th>
                <th className="px-4 py-4 text-center">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className={`transition-colors ${
                    highlightedProductId === String(product.id)
                      ? 'bg-green-500/10 border-2 border-green-500 animate-pulse'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-muted-foreground">{product.barcode || product.sku}</td>
                  <td className="px-4 py-3 font-bold text-card-foreground">{product.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users size={14} className="text-blue-400" />
                      {product.supplier_name || 'غير محدد'}
                    </div>
                  </td>
                  <td className={`px-4 py-3 font-bold ${Number(product.current_stock) <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {Number(product.current_stock).toFixed(0)} {product.unit}
                  </td>
                  {/* تصليح الحقول لتطابق الـ API واختفاء الـ NaN */}
                  <td className="px-4 py-3 text-muted-foreground">{formatCurrency(product.cost_price)}</td>
                  <td className="px-4 py-3 font-bold text-blue-600">{formatCurrency(product.retail_price)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${Number(product.current_stock) > 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                      {Number(product.current_stock) > 0 ? 'متوفر' : 'نفذت الكمية'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => handleEditProduct(product)} className="p-2 text-blue-600 hover:bg-blue-500/10 rounded-full"><Edit2 size={16}/></button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-red-600 hover:bg-red-500/10 rounded-full"><Trash2 size={16}/></button>
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

      {/* Stock Update Modal */}
      {showStockModal && scannedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowStockModal(false)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <Package className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-card-foreground">تحديث المخزون</h3>
                <p className="text-sm text-muted-foreground">{scannedProduct.name}</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">الكمية الحالية:</div>
              <div className="text-2xl font-bold text-blue-600">
                {Number(scannedProduct.current_stock || 0).toFixed(0)} {scannedProduct.unit}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-card-foreground mb-2">
                أضف كمية (يمكن أن تكون سالبة للخصم)
              </label>
              <input
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="مثال: 10 أو -5"
                className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg bg-background text-foreground"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowStockModal(false)}
                className="flex-1 px-4 py-3 border border-input text-card-foreground rounded-lg hover:bg-muted transition-colors font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleUpdateStock}
                disabled={!stockQuantity}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                تحديث المخزون
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}