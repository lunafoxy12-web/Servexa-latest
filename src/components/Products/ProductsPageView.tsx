import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ProductCategoryConfig, PRODUCT_CATEGORIES } from '../../data/productCategories';
import { COMPREHENSIVE_PRODUCTS } from '../../data/initialProducts';
import { Product } from '../../types';
import { ProductCategoryCards } from '../CustomerView/ProductCategoryCards';
import { ProductSubcategoriesPage } from '../CustomerView/ProductSubcategoriesPage';
import { ProductPreviewModal } from '../CustomerView/ProductPreviewModal';
import { formatCurrency } from '../../utils/currency';
import {
  ShoppingBag,
  Store,
  Star,
  Search,
  ArrowRight,
  Eye,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  Layers,
  Sparkles
} from 'lucide-react';

interface ProductsPageViewProps {
  onBackToHome?: () => void;
}

export const ProductsPageView: React.FC<ProductsPageViewProps> = () => {
  const {
    cartItemsCount,
    cartTotal,
    setIsCartOpen,
    addToCart,
    openStorefrontSubdomain,
    activeCurrency,
    openSearchPage,
    selectedProductCategory,
    setSelectedProductCategory,
    openProductCategoryPage
  } = useAuth();
  const { theme } = useTheme();

  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // If a category is selected, render the dedicated category page!
  if (selectedProductCategory) {
    return (
      <div className="pb-10">
        <ProductSubcategoriesPage
          category={selectedProductCategory}
          products={COMPREHENSIVE_PRODUCTS}
          onBack={() => setSelectedProductCategory(null)}
          onPreviewProduct={(prod) => setPreviewProduct(prod)}
          onBuyProduct={(prod, qty) => {
            addToCart(prod, qty);
            setIsCartOpen(true);
          }}
          onOpenStorefront={(subdomain) => openStorefrontSubdomain(subdomain)}
        />

        {previewProduct && (
          <ProductPreviewModal
            product={previewProduct}
            isOpen={Boolean(previewProduct)}
            onClose={() => setPreviewProduct(null)}
            onAddToCart={(prod, qty) => {
              addToCart(prod, qty);
              showToast(`Added ${prod.name} to cart`);
            }}
            onBuyNow={(prod, qty) => {
              addToCart(prod, qty);
              setIsCartOpen(true);
            }}
            onOpenStorefront={(subdomain) => openStorefrontSubdomain(subdomain)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 space-y-4">
        {/* Simple Search Button at Top */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => openSearchPage('products')}
            className="flex-1 max-w-md h-9 px-4 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-full shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
              <span className="text-xs text-slate-400 group-hover:text-slate-600 truncate font-light">
                Search products, tools, parts, equipment...
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-[10px] font-bold text-slate-600 transition-colors shrink-0">
              Search
            </span>
          </button>

          {/* Simple Cart Button */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-light transition-all cursor-pointer shadow-2xs"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Cart</span>
            {cartItemsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-mono">
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>

        {/* Structured Product Categories */}
        <div className="space-y-3">
          {/* Cards for each Product Category */}
          <ProductCategoryCards
            selectedCategoryId={selectedProductCategory?.id || ''}
            onSelectCategory={(cat) => openProductCategoryPage(cat)}
          />
        </div>
      </div>

      {previewProduct && (
        <ProductPreviewModal
          product={previewProduct}
          isOpen={Boolean(previewProduct)}
          onClose={() => setPreviewProduct(null)}
          onAddToCart={(prod, qty) => {
            addToCart(prod, qty);
            showToast(`Added ${prod.name} to cart`);
          }}
          onBuyNow={(prod, qty) => {
            addToCart(prod, qty);
            setIsCartOpen(true);
          }}
          onOpenStorefront={(subdomain) => openStorefrontSubdomain(subdomain)}
        />
      )}
    </div>
  );
};
