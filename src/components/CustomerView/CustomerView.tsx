import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ServiceCategory } from '../../types';
import {
  Search,
  Wrench,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { CategoryCards } from './CategoryCards';
import { ProductCategoryCards } from './ProductCategoryCards';
import { safeFetchJson } from '../../utils/safeFetch';

interface CustomerViewProps {
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  onOpenBookingModal: (provider: any, service: any) => void;
}

export const CustomerView: React.FC<CustomerViewProps> = () => {
  const {
    openSearchPage,
    openServiceCategoryPage,
    openProductCategoryPage,
    globalRefreshKey
  } = useAuth();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [homeCategoryTab, setHomeCategoryTab] = useState<'services' | 'products'>('services');
  const [loading, setLoading] = useState(true);

  // Fetch only categories for the home page
  useEffect(() => {
    setLoading(true);
    safeFetchJson<ServiceCategory[]>('/api/categories', undefined, [])
      .then((cats) => {
        if (Array.isArray(cats)) setCategories(cats);
      })
      .catch((err) => {
        console.warn('CustomerView categories fetch notice:', err?.message);
      })
      .finally(() => setLoading(false));
  }, [globalRefreshKey]);

  return (
    <div className="pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 space-y-4">
        {/* Small and Thin Search Bar */}
        <div className="w-full max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => openSearchPage(homeCategoryTab === 'services' ? 'services' : 'products')}
            className="w-full h-8 sm:h-9 px-3.5 bg-white hover:bg-slate-50/80 border border-slate-200/90 rounded-full shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 transition-colors" />
              <span className="text-xs text-slate-400 group-hover:text-slate-600 truncate font-normal">
                {homeCategoryTab === 'services'
                  ? 'Search trade services, repairs, electricians...'
                  : 'Search products, tools, parts, equipment...'}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-[10px] font-bold text-slate-600 transition-colors shrink-0">
              Search
            </span>
          </button>
        </div>

        {/* Category Switcher - Clean without background element */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 pt-0.5 pb-1">
          <button
            type="button"
            onClick={() => setHomeCategoryTab('services')}
            className={`group flex items-center gap-2 py-1 text-xs sm:text-sm font-light transition-all cursor-pointer relative ${
              homeCategoryTab === 'services'
                ? 'text-indigo-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wrench className={`w-4 h-4 transition-transform group-hover:scale-110 ${homeCategoryTab === 'services' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Categories of Service</span>
            {homeCategoryTab === 'services' && (
              <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setHomeCategoryTab('products')}
            className={`group flex items-center gap-2 py-1 text-xs sm:text-sm font-light transition-all cursor-pointer relative ${
              homeCategoryTab === 'products'
                ? 'text-emerald-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className={`w-4 h-4 transition-transform group-hover:scale-110 ${homeCategoryTab === 'products' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Products</span>
            {homeCategoryTab === 'products' && (
              <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Display Category Section: Service Categories or Product Categories */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            Loading categories...
          </div>
        ) : homeCategoryTab === 'services' ? (
          <CategoryCards
            categories={categories}
            onSelectCategory={(cat) => {
              openServiceCategoryPage(cat);
            }}
          />
        ) : (
          <ProductCategoryCards
            selectedCategoryId=""
            onSelectCategory={(cat) => {
              openProductCategoryPage(cat);
            }}
          />
        )}
      </div>
    </div>
  );
};
