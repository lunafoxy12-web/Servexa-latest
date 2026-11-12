import React, { useState, useMemo } from 'react';
import { ProductCategoryConfig, DetailedSubcategory } from '../../data/productCategories';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  ArrowLeft,
  Search,
  Sparkles,
  ShoppingBag,
  Star,
  CheckCircle2,
  Eye,
  Store,
  CreditCard,
  Layers,
  X,
  Plus,
  Minus
} from 'lucide-react';

interface ProductSubcategoriesPageProps {
  category: ProductCategoryConfig;
  products: Product[];
  onBack: () => void;
  onPreviewProduct: (product: Product) => void;
  onBuyProduct: (product: Product, quantity: number) => void;
  onOpenStorefront?: (subdomain: string) => void;
}

export const ProductSubcategoriesPage: React.FC<ProductSubcategoriesPageProps> = ({
  category,
  products,
  onBack,
  onPreviewProduct,
  onBuyProduct,
  onOpenStorefront
}) => {
  const { addToCart, activeCurrency, cartItemsCount, setIsCartOpen } = useAuth();
  const { theme } = useTheme();

  // Active subcategory: when set, renders dedicated NEW PAGE with all products of that subcategory
  const [activeSubcategory, setActiveSubcategory] = useState<DetailedSubcategory | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cartToast, setCartToast] = useState<string | null>(null);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  const getQty = (id: string) => itemQuantities[id] || 1;
  const updateQty = (id: string, delta: number) => {
    setItemQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, Math.min(99, (prev[id] || 1) + delta))
    }));
  };

  // Filtered subcategories for main subcategory catalog
  const visibleSubcategories = useMemo(() => {
    if (!category.detailedSubcategories) return [];
    if (!searchQuery.trim()) return category.detailedSubcategories;
    const q = searchQuery.toLowerCase().trim();
    return category.detailedSubcategories.filter(sub =>
      sub.name.toLowerCase().includes(q) ||
      (sub.groupName && sub.groupName.toLowerCase().includes(q))
    );
  }, [category, searchQuery]);

  // Group subcategories
  const groupedSubcategories = useMemo(() => {
    const map = new Map<string, DetailedSubcategory[]>();
    visibleSubcategories.forEach(sub => {
      const group = sub.groupName || 'Popular Departments';
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(sub);
    });
    return Array.from(map.entries());
  }, [visibleSubcategories]);

  // Filter products for the active subcategory
  const activeSubcategoryProducts = useMemo(() => {
    if (!activeSubcategory) return [];

    return products.filter(prod => {
      // 1. Must match this category
      const matchesCategory =
        prod.category === category.id ||
        (category.id === 'prod-cat-lighting' && prod.category === 'cat-electrician') ||
        (category.id === 'prod-cat-electronics' && prod.category === 'cat-electrician') ||
        (category.id === 'prod-cat-bathroom' && prod.category === 'cat-plumbing') ||
        (category.id === 'prod-cat-home-living' && prod.category === 'cat-painters') ||
        (category.id === 'prod-cat-home-appliances' && prod.category === 'cat-hvac');

      if (!matchesCategory) return false;

      // 2. Subcategory match
      const sub = (prod.subcategory || '').toLowerCase();
      const target = activeSubcategory.name.toLowerCase();
      const nameDesc = (prod.name + ' ' + prod.description).toLowerCase();

      return sub.includes(target) || target.includes(sub) || nameDesc.includes(target);
    });
  }, [products, category, activeSubcategory]);

  // -------------------------------------------------------------------------
  // VIEW 1: DEDICATED NEW PAGE FOR SELECTED SUBCATEGORY PRODUCTS
  // -------------------------------------------------------------------------
  if (activeSubcategory) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-16 space-y-5 animate-in fade-in duration-200">
        {/* Cart Toast Notification */}
        {cartToast && (
          <div className="fixed top-16 right-4 z-50 p-3 rounded-xl bg-slate-900 text-white border border-slate-700 text-xs font-light flex items-center gap-2 shadow-xl animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{cartToast}</span>
          </div>
        )}

        {/* Top Header: Just Arrow as Back Button & Thin Category / Subcategory Name in One Line */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setActiveSubcategory(null)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
              title="Back to subcategories"
            >
              <ArrowLeft className="w-5 h-5 stroke-[1.8]" />
            </button>
            <h1 className="text-base sm:text-lg font-light text-slate-800 tracking-tight truncate whitespace-nowrap">
              {category.name} <span className="text-slate-400 font-light">/</span> {activeSubcategory.name}
            </h1>
          </div>

          {/* Cart Button */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-light transition-all cursor-pointer shadow-2xs shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cart</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-normal">
              {cartItemsCount}
            </span>
          </button>
        </div>

        {/* Subcategory Banner Banner Card */}
        <div className={`p-4 sm:p-5 rounded-2xl ${category.bgTint} border border-slate-200/80 flex items-center justify-between gap-4`}>
          <div className="min-w-0">
            <span className="text-[11px] font-light text-indigo-700 uppercase tracking-wider block">
              Department Inventory
            </span>
            <h2 className="text-lg sm:text-xl font-light text-slate-900 truncate">
              {activeSubcategory.name}
            </h2>
            <p className="text-xs text-slate-500 font-light mt-0.5 max-w-xl truncate">
              {activeSubcategory.description || `Verified supplies and tools for ${activeSubcategory.name}.`}
            </p>
          </div>

          {activeSubcategory.image && (
            <img
              src={activeSubcategory.image}
              alt={activeSubcategory.name}
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-xl shrink-0 drop-shadow-xs"
              loading="lazy"
            />
          )}
        </div>

        {/* Products Grid for this Subcategory */}
        {activeSubcategoryProducts.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
            <p className="text-xs font-light">No specific products currently listed under {activeSubcategory.name}.</p>
            <button
              type="button"
              onClick={() => setActiveSubcategory(null)}
              className="text-xs font-light text-indigo-600 underline cursor-pointer"
            >
              Browse other subcategories
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {activeSubcategoryProducts.map((prod) => {
              const imageSrc =
                prod.image ||
                prod.imageUrl ||
                'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80';
              const qty = getQty(prod.id);

              return (
                <div
                  key={prod.id}
                  className="group bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Visual Stage with Click to Preview */}
                    <div
                      onClick={() => onPreviewProduct(prod)}
                      className="relative w-full h-28 sm:h-32 bg-slate-50 overflow-hidden flex items-center justify-center p-2.5 cursor-pointer"
                    >
                      <img
                        src={imageSrc}
                        alt={prod.name}
                        className="relative z-10 max-h-24 sm:max-h-28 w-auto object-contain rounded-lg transition-transform duration-300 group-hover:scale-105 drop-shadow-xs"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />

                      <div className="absolute top-2 left-2 z-20 bg-white/95 px-2 py-0.5 rounded-md border border-slate-200 text-[9px] font-light text-slate-700 uppercase tracking-wider">
                        {prod.subcategory || activeSubcategory.name}
                      </div>

                      <div className="absolute bottom-2 right-2 z-20 bg-slate-900/85 px-1.5 py-0.5 rounded-md text-[10px] font-light text-white flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        <span>{prod.rating || 4.9}</span>
                      </div>

                      <div className="absolute inset-0 z-30 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="px-2 py-0.5 rounded-lg bg-white/95 text-slate-800 text-[10px] font-light shadow-xs flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>Preview</span>
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-3">
                      <div className="flex items-center gap-1 text-[11px] font-light mb-0.5 text-indigo-600 truncate">
                        <Store className="w-3 h-3 shrink-0" />
                        <span className="truncate">{prod.storeName || prod.providerName || 'Store'}</span>
                      </div>

                      <h4
                        onClick={() => onPreviewProduct(prod)}
                        className="text-xs sm:text-sm font-light text-slate-900 leading-tight truncate hover:underline transition-colors cursor-pointer"
                      >
                        {prod.name}
                      </h4>

                      <p className="text-[11px] text-slate-500 font-light line-clamp-2 mt-1">
                        {prod.description}
                      </p>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="p-3 pt-0">
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-xs sm:text-sm font-light text-slate-900 font-mono">
                          {formatCurrency(prod.price, activeCurrency || 'USD')}
                        </span>
                        <span className="text-[9px] text-emerald-600 font-light block -mt-0.5">
                          {prod.inStock !== false ? '● In stock' : '○ On request'}
                        </span>
                      </div>

                      {/* Quantity stepper */}
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 px-1 py-0.5">
                        <button
                          type="button"
                          onClick={() => updateQty(prod.id, -1)}
                          className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-900 text-xs cursor-pointer"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-5 text-center text-xs font-light text-slate-800 font-mono">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(prod.id, 1)}
                          className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-900 text-xs cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons: Add to Cart and Buy Now */}
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          addToCart(prod, qty);
                          setCartToast(`Added ${qty} × "${prod.name}" to cart`);
                          setTimeout(() => setCartToast(null), 3000);
                        }}
                        className="w-full py-1.5 px-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-light transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <ShoppingBag className="w-3 h-3 text-indigo-600" />
                        <span>+ Cart</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onBuyProduct(prod, qty)}
                        className={`w-full py-1.5 px-1.5 rounded-lg ${theme.btnPrimary} ${theme.btnPrimaryHover} text-xs font-light transition-all cursor-pointer flex items-center justify-center gap-1`}
                      >
                        <span>Buy</span>
                        <CreditCard className="w-3 h-3 opacity-90" />
                      </button>
                    </div>

                    {prod.subdomain && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenStorefront) onOpenStorefront(prod.subdomain!);
                        }}
                        className="w-full text-center text-[10px] font-light text-slate-400 hover:underline transition-colors mt-1.5 flex items-center justify-center gap-1 cursor-pointer truncate"
                      >
                        <span>Visit Store</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // VIEW 2: ALL SUBCATEGORIES GALLERY (No products at the bottom)
  // -------------------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-16 space-y-5 animate-in fade-in duration-200">
      {/* Top Header: Just Arrow as Back Button & Thin Category Name in One Line */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            title="Back to product categories"
          >
            <ArrowLeft className="w-5 h-5 stroke-[1.8]" />
          </button>
          <h1 className="text-base sm:text-lg font-light text-slate-800 tracking-tight truncate whitespace-nowrap">
            {category.name}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-light transition-all cursor-pointer shadow-2xs"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cart</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-normal">
              {cartItemsCount}
            </span>
          </button>
        </div>
      </div>

      {/* Category Hero Banner with Thin Text */}
      <div className={`rounded-2xl ${category.bgTint} border border-slate-200/80 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="space-y-1 max-w-xl">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-light bg-white text-indigo-700 border border-indigo-100">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>{category.badgeText} Department</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-light text-slate-900 tracking-tight">
            {category.name} Subcategories
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 font-light leading-relaxed">
            {category.tagline}. Click any subcategory to view its full catalog of products.
          </p>
        </div>

        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/80 rounded-xl border border-white/80 flex items-center justify-center p-2 shrink-0">
          <img
            src={category.image}
            alt={category.name}
            className="max-h-20 sm:max-h-24 w-auto object-contain drop-shadow-xs"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Subcategories Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${category.name} subcategories...`}
            className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-light text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Subcategories Gallery Grid */}
      <div className="space-y-6">
        {groupedSubcategories.map(([groupName, subItems]) => (
          <div key={groupName} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-light text-slate-700 tracking-tight flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>{groupName}</span>
                <span className="text-[11px] text-slate-400">({subItems.length})</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {subItems.map((sub) => (
                <button
                  key={sub.name}
                  type="button"
                  onClick={() => setActiveSubcategory(sub)}
                  className="group relative flex flex-col bg-white rounded-xl border border-slate-200/90 hover:border-indigo-400 transition-all duration-200 overflow-hidden text-left cursor-pointer hover:shadow-xs focus:outline-hidden"
                >
                  {/* Visual Stage */}
                  <div className="relative w-full h-24 sm:h-28 bg-slate-50 overflow-hidden flex items-center justify-center p-2.5">
                    <img
                      src={sub.image}
                      alt={sub.name}
                      className="relative z-10 max-h-20 sm:max-h-22 w-auto object-contain rounded drop-shadow-xs transition-transform duration-200 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>

                  {/* Subcategory Label & Action */}
                  <div className="p-2.5 bg-white flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-light text-slate-900 leading-tight line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {sub.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-light line-clamp-1 mt-0.5">
                        {sub.description || `${category.name} Specialty`}
                      </p>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-indigo-600 font-light">
                      <span>View Products →</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
