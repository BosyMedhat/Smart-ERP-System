import { Search, Barcode, Mic, RefreshCw } from 'lucide-react';
import { Product } from '../App';
import { formatCurrency } from '../utils/currency';
import { notify } from '../../lib/notifications';

interface ProductGridProps {
  products: Product[];
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddToCart: (product: Product) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function ProductGrid({
  products,
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onAddToCart,
  onRefresh,
  isLoading,
}: ProductGridProps) {
  return (
    <>
      {/* Search Bar with Refresh Button */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex gap-3">
          <div className="relative flex-1">
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
          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
              title="تحديث قائمة المنتجات"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">تحديث</span>
            </button>
          )}
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

      {/* Product Grid */}
      <div className="flex-1 bg-white rounded-xl p-3 shadow-sm overflow-y-auto">
        <div className="grid grid-cols-3 gap-2">
          {products.map((product) => {
            const stock = Number(product.current_stock || 0);
            const minLevel = Number(product.min_stock_level || 5);
            const isOutOfStock = stock <= 0;
            const isLowStock = !isOutOfStock && stock <= minLevel;

            return (
              <button
                key={product.id}
                onClick={() => {
                  if (isOutOfStock) {
                    notify.error(`المنتج "${product.name}" غير متوفر في المخزون`);
                    return;
                  }
                  onAddToCart(product);
                }}
                disabled={isOutOfStock}
                className={`border-2 rounded-xl p-3 transition-all text-right ${
                  isOutOfStock
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200'
                    : 'bg-white border-gray-100 hover:border-[#3B82F6] hover:bg-blue-50 hover:shadow-md active:scale-95'
                }`}
              >
                <div className="font-bold text-gray-800 text-sm leading-tight mb-1 line-clamp-2">
                  {product.name}
                </div>
                <div className="text-xs text-gray-400 mb-2">{product.category}</div>
                <div className="text-base font-bold text-[#3B82F6]">
                  {formatCurrency(product.price)}
                </div>
                {isOutOfStock && (
                  <span className="inline-block text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full mt-1 font-medium">
                    نفدت الكمية
                  </span>
                )}
                {isLowStock && (
                  <span className="inline-block text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full mt-1 font-medium">
                    كمية منخفضة ({stock})
                  </span>
                )}
                {!isOutOfStock && !isLowStock && (
                  <div className="text-xs mt-1 text-green-600 font-medium">
                    مخزون: {stock}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
