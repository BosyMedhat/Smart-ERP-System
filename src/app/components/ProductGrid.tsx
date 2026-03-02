import { Search, Barcode, Mic } from 'lucide-react';
import { Product } from '../App';

interface ProductGridProps {
  products: Product[];
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({
  products,
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onAddToCart,
}: ProductGridProps) {
  return (
    <>
      {/* Search Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
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
      <div className="flex-1 bg-white rounded-xl p-4 shadow-sm overflow-y-auto">
        <div className="grid grid-cols-4 gap-4">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => onAddToCart(product)}
              className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-lg hover:border-[#3B82F6] transition-all group"
            >
              <div className="aspect-square mb-2 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              </div>
              <div className="text-sm font-semibold text-gray-800 mb-1 truncate">
                {product.name}
              </div>
              <div className="text-xs text-gray-500 mb-2">{product.category}</div>
              <div className="text-lg font-bold text-[#3B82F6]">
                {product.price.toFixed(2)} ج.م
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
