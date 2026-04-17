import { Search, Barcode, Mic } from 'lucide-react';
import { Product } from '../App';

interface ProductGridProps {
  products: Product[];
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  priceType: 'retail' | 'wholesale';
  onPriceTypeChange: (type: 'retail' | 'wholesale') => void;
}

export function ProductGrid({
  products,
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onAddToCart,
  priceType,
  onPriceTypeChange,
}: ProductGridProps) {
  return (
    <>
      {/* Search & Price Toggle */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-white rounded-xl p-4 shadow-sm">
          <div className="relative">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="ابحث عن منتج أو امسح الباركود..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pr-12 pl-24 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-2">
              <button className="text-gray-400 hover:text-[#3B82F6] transition-colors">
                <Barcode size={20} />
              </button>
              <button className="text-gray-400 hover:text-[#3B82F6] transition-colors">
                <Mic size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Price Type Toggle */}
        <div className="bg-white rounded-xl p-2 shadow-sm flex items-center gap-2 border border-blue-50">
          <button
            onClick={() => onPriceTypeChange('retail')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${
              priceType === 'retail' 
              ? 'bg-[#3B82F6] text-white shadow-lg' 
              : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            قطاعي
          </button>
          <button
            onClick={() => onPriceTypeChange('wholesale')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${
              priceType === 'wholesale' 
              ? 'bg-[#F26A21] text-white shadow-lg' 
              : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            جملة
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              selectedCategory === category
                ? 'bg-[#3B82F6] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Product Grid - شبكة عرض المنتجات */}
      <div className="flex-1 bg-white rounded-xl p-4 shadow-sm overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => {
            const isOutOfStock = product.current_stock <= 0; // التحقق من توفر الكمية
            
            return (
              <button
                key={product.id}
                onClick={() => onAddToCart(product)} // إضافة للسلة (الدالة في App.tsx ستمنع البيع إن نفد)
                disabled={isOutOfStock} // تعطيل الزر في حال نفاذ المخزون
                className={`bg-white border text-right rounded-2xl p-3 hover:shadow-xl hover:-translate-y-1 transition-all group relative border-gray-100 ${
                  isOutOfStock ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:border-[#3B82F6]'
                }`}
              >
                {/* شارة نفاذ الكمية - Out of Stock Badge */}
                {isOutOfStock && (
                  <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] px-2 py-1 rounded-lg font-bold shadow-sm">
                    نفد المخزون
                  </div>
                )}

                <div className="aspect-square mb-3 rounded-xl overflow-hidden bg-gray-50 border border-gray-50">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                
                <div className="text-sm font-bold text-gray-800 mb-1 truncate leading-tight">
                  {product.name}
                </div>
                <div className="text-[11px] text-gray-400 mb-2 font-medium">{product.category}</div>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="text-lg font-black text-[#3B82F6]">
                    {product.price.toFixed(0)} <span className="text-[10px]">ج.م</span>
                  </div>
                  <div className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                    isOutOfStock ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {isOutOfStock ? '0 قطع' : `${product.current_stock} قطعة`}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
