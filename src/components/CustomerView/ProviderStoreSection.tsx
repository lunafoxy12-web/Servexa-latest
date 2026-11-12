import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, ProductOrder } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../utils/currency';
import { PRODUCT_CATEGORIES, ProductCategoryConfig } from '../../data/productCategories';
import { COMPREHENSIVE_PRODUCTS } from '../../data/initialProducts';
import { ProductPreviewModal } from './ProductPreviewModal';
import { ProductCategoryCards } from './ProductCategoryCards';
import { ProductSubcategoriesPage } from './ProductSubcategoriesPage';
import {
  Store,
  ShoppingBag,
  Star,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Wallet,
  X,
  MapPin,
  Phone,
  User,
  Truck,
  FileText,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  Eye,
  Info,
  RotateCcw,
  Tag,
  ArrowUpDown,
  Armchair,
  Tv,
  Utensils,
  Droplet,
  Lightbulb,
  Cpu,
  Smartphone,
  Monitor,
  HardDrive,
  Speaker,
  Camera,
  Layers,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface ProviderStoreSectionProps {
  onOpenStorefront?: (subdomain: string) => void;
}

export const ProviderStoreSection: React.FC<ProviderStoreSectionProps> = ({ onOpenStorefront }) => {
  const productScrollRef = useRef<HTMLDivElement>(null);
  const {
    currentUser,
    globalRefreshKey,
    openStorefrontSubdomain,
    updateUserLocally,
    openOrdersTracking,
    setIsAuthModalOpen,
    setAuthModalTab,
    addToCart,
    setIsCartOpen,
    activeCurrency
  } = useAuth();
  const { theme } = useTheme();

  const [products, setProducts] = useState<Product[]>([]);
  const [cartToast, setCartToast] = useState<string | null>(null);

  // Search & Filter States
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'rating'>('popular');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // Modal States
  const [previewingProduct, setPreviewingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<ProductOrder | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');

  // Customer Delivery Info Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateProv, setStateProv] = useState('');
  const [zip, setZip] = useState('');
  const [instructions, setInstructions] = useState('');

  // Load products strictly from API (only genuine provider-uploaded products)
  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
      })
      .catch((err) => {
        console.warn('Store products notice:', err?.message);
        setProducts([]);
      });
  }, [globalRefreshKey]);

  // Pre-fill customer delivery data when logged in
  useEffect(() => {
    if (currentUser) {
      if (!fullName) setFullName(currentUser.name || '');
      if (!phone && currentUser.phone) setPhone(currentUser.phone);
      if (!street && currentUser.currentLocation?.address) {
        setStreet(currentUser.currentLocation.address);
      }
    }
  }, [currentUser, selectedProduct]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setSelectedCategoryId('all');
    setSelectedSubcategory('all');
    setSortBy('popular');
    setInStockOnly(false);
  };

  // Active Category Config
  const activeCategoryConfig = useMemo(() => {
    return PRODUCT_CATEGORIES.find(c => c.id === selectedCategoryId);
  }, [selectedCategoryId]);

  // Product Counts by Category
  const productCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const catId = p.category;
      counts[catId] = (counts[catId] || 0) + 1;
      // Also account for mapped categories
      if (catId === 'cat-electrician') {
        counts['prod-cat-lighting'] = (counts['prod-cat-lighting'] || 0) + 1;
        counts['prod-cat-electronics'] = (counts['prod-cat-electronics'] || 0) + 1;
      } else if (catId === 'cat-plumbing') {
        counts['prod-cat-bathroom'] = (counts['prod-cat-bathroom'] || 0) + 1;
      } else if (catId === 'cat-painters') {
        counts['prod-cat-home-living'] = (counts['prod-cat-home-living'] || 0) + 1;
      } else if (catId === 'cat-hvac') {
        counts['prod-cat-home-appliances'] = (counts['prod-cat-home-appliances'] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // 1. Category Filter
      if (selectedCategoryId !== 'all') {
        const matchesCategory =
          prod.category === selectedCategoryId ||
          (selectedCategoryId === 'prod-cat-lighting' && prod.category === 'cat-electrician') ||
          (selectedCategoryId === 'prod-cat-electronics' && prod.category === 'cat-electrician') ||
          (selectedCategoryId === 'prod-cat-bathroom' && prod.category === 'cat-plumbing') ||
          (selectedCategoryId === 'prod-cat-home-living' && prod.category === 'cat-painters') ||
          (selectedCategoryId === 'prod-cat-home-appliances' && prod.category === 'cat-hvac');

        if (!matchesCategory) return false;
      }

      // 2. Subcategory Filter
      if (selectedSubcategory !== 'all') {
        const sub = (prod.subcategory || '').toLowerCase();
        const target = selectedSubcategory.toLowerCase();
        if (!sub.includes(target) && !target.includes(sub)) {
          // Check description or name if subcategory not explicitly set
          const nameDesc = (prod.name + ' ' + prod.description).toLowerCase();
          if (!nameDesc.includes(target)) return false;
        }
      }

      // 3. In-Stock Filter
      if (inStockOnly && prod.inStock === false) {
        return false;
      }

      // 4. Search Query (Matches Category, Subcategory, or Direct Product)
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = prod.name.toLowerCase().includes(q);
        const matchesDesc = (prod.description || '').toLowerCase().includes(q);
        const matchesBrand = (prod.brand || '').toLowerCase().includes(q);
        const matchesSub = (prod.subcategory || '').toLowerCase().includes(q);
        const matchesStore = (prod.storeName || '').toLowerCase().includes(q);
        const matchesCategoryName = (prod.category || '').toLowerCase().includes(q);

        // Check if query matches any category name/tagline in PRODUCT_CATEGORIES
        const matchedCat = PRODUCT_CATEGORIES.some(cat =>
          (cat.name.toLowerCase().includes(q) || cat.subcategories.some(s => s.toLowerCase().includes(q))) &&
          (prod.category === cat.id)
        );

        if (!matchesName && !matchesDesc && !matchesBrand && !matchesSub && !matchesStore && !matchesCategoryName && !matchedCat) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'popular':
        default:
          return (b.salesCount || 0) - (a.salesCount || 0);
      }
    });
  }, [products, selectedCategoryId, selectedSubcategory, searchQuery, sortBy, inStockOnly]);

  const handleOpenBuyModal = (prod: Product, quantity = 1) => {
    if (!currentUser) {
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }
    // Close preview modal if open
    setPreviewingProduct(null);

    setSelectedProduct(prod);
    setBuyQuantity(quantity);
    setPurchaseSuccess(false);
    setConfirmedOrder(null);
    setPurchaseError(null);
    if (currentUser) {
      setFullName(currentUser.name || '');
      setPhone(currentUser.phone || '+1 (555) 234-8901');
      setStreet(currentUser.currentLocation?.address || '101 Market St, Suite 400');
      setCity('San Francisco');
      setStateProv('CA');
      setZip('94105');
      setInstructions('');
    }
  };

  const handleExecutePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !currentUser) {
      setPurchaseError('Please log in to purchase supplies');
      return;
    }

    if (!fullName.trim() || !phone.trim() || !street.trim() || !city.trim() || !stateProv.trim() || !zip.trim()) {
      setPurchaseError('Please fill out all required delivery fields (Name, Phone, Street, City, State, ZIP).');
      return;
    }

    setIsPurchasing(true);
    setPurchaseError(null);

    const deliveryAddress = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      state: stateProv.trim(),
      zip: zip.trim(),
      instructions: instructions.trim()
    };

    try {
      const res = await fetch(`/api/products/${selectedProduct.id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: currentUser.id,
          quantity: buyQuantity,
          paymentMethod,
          deliveryAddress,
          customerPhone: phone.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setPurchaseError(data.error || 'Failed to process purchase');
        setIsPurchasing(false);
        return;
      }

      setPurchaseSuccess(true);
      setConfirmedOrder(data.order || null);

      if (paymentMethod === 'wallet' && currentUser.walletBalance !== undefined) {
        const totalCost = selectedProduct.price * buyQuantity;
        updateUserLocally({ walletBalance: Math.max(0, currentUser.walletBalance - totalCost) });
      }

      // Update product inventory locally
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id
            ? { ...p, salesCount: (p.salesCount || 0) + buyQuantity }
            : p
        )
      );

      setIsPurchasing(false);
    } catch (err: any) {
      setPurchaseError(err.message || 'Network error processing purchase');
      setIsPurchasing(false);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Armchair':
        return <Armchair className="w-5 h-5 text-emerald-600" />;
      case 'Tv':
        return <Tv className="w-5 h-5 text-sky-600" />;
      case 'Utensils':
        return <Utensils className="w-5 h-5 text-orange-600" />;
      case 'Droplet':
        return <Droplet className="w-5 h-5 text-teal-600" />;
      case 'Lightbulb':
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-purple-600" />;
      case 'Smartphone':
        return <Smartphone className="w-5 h-5 text-indigo-600" />;
      case 'Monitor':
        return <Monitor className="w-5 h-5 text-slate-700" />;
      case 'HardDrive':
        return <HardDrive className="w-5 h-5 text-rose-600" />;
      case 'Speaker':
        return <Speaker className="w-5 h-5 text-violet-600" />;
      case 'Camera':
        return <Camera className="w-5 h-5 text-amber-600" />;
      default:
        return <Layers className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className="mb-14 space-y-8">
      {/* ------------------------------------------------------------------- */}
      {/* When a Product Category is selected, OPEN THE SUBCATEGORIES PAGE!  */}
      {/* ------------------------------------------------------------------- */}
      {selectedCategoryId !== 'all' && activeCategoryConfig ? (
        <ProductSubcategoriesPage
          category={activeCategoryConfig}
          products={products}
          onBack={() => {
            setSelectedCategoryId('all');
            setSelectedSubcategory('all');
          }}
          onPreviewProduct={(prod) => setPreviewingProduct(prod)}
          onBuyProduct={(prod, qty) => handleOpenBuyModal(prod, qty)}
          onOpenStorefront={onOpenStorefront}
        />
      ) : (
        <>
          {/* ------------------------------------------------------------------- */}
          {/* PART 1: HORIZONTAL PRODUCT CATEGORY CARDS (3 on mobile, swipe L-to-R) */}
          {/* ------------------------------------------------------------------- */}
          <ProductCategoryCards
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={(cat) => {
              setSelectedCategoryId(cat.id);
              setSelectedSubcategory('all');
            }}
            productCountByCategory={productCountByCategory}
          />

          {/* ------------------------------------------------------------------- */}
          {/* PART 2: CATEGORY FILTER & SORT CONTROLS                            */}
          {/* ------------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs space-y-2.5">
        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Category Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryId('all');
                setSelectedSubcategory('all');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer text-xs ${
                selectedCategoryId === 'all'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All Departments
            </button>

            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  setSelectedSubcategory('all');
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer text-xs flex items-center gap-1.5 ${
                  selectedCategoryId === cat.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{cat.name}</span>
                {productCountByCategory[cat.id] !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    selectedCategoryId === cat.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {productCountByCategory[cat.id]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sort & In-Stock Controls */}
          <div className="flex flex-wrap items-center gap-1.5 ml-auto">
            <label className="flex items-center gap-1 text-slate-600 cursor-pointer select-none text-[11px]">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-3 h-3 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="font-medium">In Stock</span>
            </label>

            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy || 'popular'}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort products by"
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="popular">Most Popular</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            {(selectedCategoryId !== 'all' || selectedSubcategory !== 'all' || searchQuery || inStockOnly) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Reset all filters"
                aria-label="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Subcategories Filter Chips (Shown when a category is selected) */}
        {activeCategoryConfig && activeCategoryConfig.subcategories.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-indigo-500" />
              <span>Subcategories:</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedSubcategory('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedSubcategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All {activeCategoryConfig.name}
            </button>

            {activeCategoryConfig.subcategories.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubcategory(selectedSubcategory === sub ? 'all' : sub)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedSubcategory === sub
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart Toast Notification */}
      {cartToast && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cartToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold cursor-pointer transition-all"
          >
            View Cart →
          </button>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-medium text-slate-900 tracking-tight">
              {activeCategoryConfig ? activeCategoryConfig.name : 'Provider Store Products'}
            </h3>
            <p className="text-[11px] text-slate-500 font-light">
              Supplies and equipment uploaded directly by verified specialists
            </p>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {filteredProducts.length} items
          </span>
        </div>

        <div className="flex items-center gap-2">
          {searchQuery && (
            <span className="text-[11px] text-slate-500 hidden sm:inline font-light">
              Matching: <strong className="text-slate-800 font-medium">"{searchQuery}"</strong>
            </span>
          )}

          {/* Horizontal Scroll Arrows matching CategoryCards */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (productScrollRef.current) {
                  productScrollRef.current.scrollBy({ left: -260, behavior: 'smooth' });
                }
              }}
              className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
              aria-label="Scroll products left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (productScrollRef.current) {
                  productScrollRef.current.scrollBy({ left: 260, behavior: 'smooth' });
                }
              }}
              className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
              aria-label="Scroll products right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 mx-auto flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-medium text-slate-900">
            {products.length === 0 ? 'No Provider Products Listed Yet' : 'No matching products found'}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-light">
            {products.length === 0
              ? 'Stores are currently awaiting new inventory uploads from verified specialists.'
              : 'Try adjusting your search terms or clearing department filters to see verified merchant equipment.'}
          </p>
          {products.length > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-all cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* PART 3: PRODUCTS CAROUSEL MATCHING CATEGORY CARDS STYLE & SIZE      */}
      {/* ------------------------------------------------------------------- */}
      {filteredProducts.length > 0 && (
        <div
          ref={productScrollRef}
          className="flex gap-2 sm:gap-3 overflow-x-auto pb-2.5 pt-0.5 px-0.5 -mx-0.5 snap-x snap-mandatory scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredProducts.map((prod) => {
            const imageSrc =
              prod.image ||
              prod.imageUrl ||
              'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80';

            return (
              <div
                key={prod.id}
                className="group relative flex flex-col bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all duration-200 overflow-hidden text-left snap-start shrink-0 w-[calc(32%-4px)] sm:w-40 md:w-44 justify-between transform hover:-translate-y-0.5"
              >
                <div>
                  {/* Visual Stage - Sized identically to CategoryCards */}
                  <div
                    onClick={() => setPreviewingProduct(prod)}
                    className="relative w-full h-16 sm:h-22 bg-slate-50/70 overflow-hidden flex items-center justify-center p-1 sm:p-1.5 cursor-pointer"
                  >
                    <img
                      src={imageSrc}
                      alt={prod.name}
                      className="max-h-12 sm:max-h-16 w-auto object-contain rounded drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />

                    {/* Star Rating Badge */}
                    <div className="absolute bottom-1 right-1.5 bg-slate-900/80 backdrop-blur-md px-1 py-0.2 rounded text-[9px] font-medium text-white flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      <span>{prod.rating || 4.9}</span>
                    </div>

                    {/* Quick Preview Badge */}
                    <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-2 py-0.5 rounded-md bg-white/95 text-indigo-600 text-[9px] font-medium shadow-xs flex items-center gap-0.5">
                        <Eye className="w-2.5 h-2.5" />
                        <span>Preview</span>
                      </span>
                    </div>
                  </div>

                  {/* Details - Compact styling */}
                  <div className="p-1.5 sm:p-2 bg-white">
                    <div className="flex items-center gap-1 text-[9px] text-indigo-600 font-normal mb-0.5 truncate">
                      <Store className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{prod.storeName || prod.providerName || 'Store'}</span>
                    </div>

                    <h3
                      onClick={() => setPreviewingProduct(prod)}
                      className="text-[11px] sm:text-xs font-semibold text-slate-800 leading-tight truncate group-hover:text-indigo-600 transition-colors cursor-pointer"
                      title={prod.name}
                    >
                      {prod.name}
                    </h3>

                    <p className="text-[9px] text-slate-400 font-light truncate mt-0.5">
                      {prod.description}
                    </p>
                  </div>
                </div>

                {/* Price & Action Buttons */}
                <div className="p-1.5 sm:p-2 pt-0">
                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                        {formatCurrency(prod.price, activeCurrency || 'USD')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Add to Cart */}
                      <button
                        type="button"
                        onClick={() => {
                          addToCart(prod, 1);
                          setCartToast(`Added "${prod.name}" to cart`);
                          setTimeout(() => setCartToast(null), 3000);
                        }}
                        className="p-1 sm:px-1.5 sm:py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 text-[10px] font-normal transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center gap-0.5"
                        title="Add to Shopping Cart"
                      >
                        <ShoppingBag className="w-3 h-3 text-indigo-600" />
                        <span className="hidden sm:inline">+Cart</span>
                      </button>

                      {/* Buy Now */}
                      <button
                        type="button"
                        onClick={() => handleOpenBuyModal(prod)}
                        className={`px-1.5 sm:px-2 py-0.5 rounded-md ${theme.btnPrimary} ${theme.btnPrimaryHover} text-white text-[10px] font-normal transition-all shadow-xs cursor-pointer active:scale-95`}
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* PART 4: PRODUCT PREVIEW & DETAILS MODAL (Check Details Before Order) */}
      {/* ------------------------------------------------------------------- */}
      {previewingProduct && (
        <ProductPreviewModal
          product={previewingProduct}
          onClose={() => setPreviewingProduct(null)}
          onBuyNow={(prod, qty) => handleOpenBuyModal(prod, qty)}
          onOpenStorefront={onOpenStorefront}
        />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* PART 5: CUSTOMER DELIVERY & INSTANT CHECKOUT MODAL */}
      {/* ------------------------------------------------------------------- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative my-8">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {purchaseSuccess ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Order Successfully Placed
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  Order #{confirmedOrder?.orderNumber || 'CONFIRMED'}
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                  Your order for <strong>{buyQuantity}x {selectedProduct.name}</strong> has been confirmed and routed to <strong>{selectedProduct.storeName || 'the Store Specialist'}</strong>.
                </p>

                <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Delivery To:</span>
                    <span className="font-semibold text-slate-900">{fullName}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Address:</span>
                    <span className="font-semibold text-slate-900 truncate max-w-[200px]">{street}, {city}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Contact Phone:</span>
                    <span className="font-semibold text-slate-900">{phone}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Total Paid:</span>
                    <span className="font-bold text-slate-900 font-mono">{formatCurrency(selectedProduct.price * buyQuantity, activeCurrency || 'USD')}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Payment Method:</span>
                    <span className="font-semibold text-slate-900 capitalize">{paymentMethod === 'wallet' ? 'Personal Wallet' : 'Direct Card'}</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null);
                      if (confirmedOrder) {
                        openOrdersTracking(confirmedOrder);
                      }
                    }}
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Track Order Progress</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="w-full py-2.5 rounded-2xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      Confirm Delivery & Checkout
                    </h3>
                    <p className="text-xs text-slate-500">
                      Instant courier dispatch direct to your location
                    </p>
                  </div>
                </div>

                {/* Product Summary Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 mb-4">
                  <img
                    src={selectedProduct.image || selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="w-14 h-14 object-contain rounded-xl bg-white p-1 border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                      {selectedProduct.storeName || 'Official Merchant Store'}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {selectedProduct.name}
                    </h4>
                    <div className="text-xs font-black text-slate-900 font-mono mt-0.5">
                      {formatCurrency(selectedProduct.price, activeCurrency || 'USD')} each
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setBuyQuantity(q => Math.max(1, q - 1))}
                      className="w-5 h-5 rounded-md hover:bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-slate-900 px-1 font-mono">{buyQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setBuyQuantity(q => q + 1)}
                      className="w-5 h-5 rounded-md hover:bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {purchaseError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {purchaseError}
                  </div>
                )}

                <form onSubmit={handleExecutePurchase} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Full Recipient Name *
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={fullName || ''}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Sarah Jenkins"
                          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Contact Phone *
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={phone || ''}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Street Address *
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={street || ''}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="101 Market Street, Suite 400"
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={city || ''}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="San Francisco"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">State/Prov *</label>
                      <input
                        type="text"
                        required
                        value={stateProv || ''}
                        onChange={(e) => setStateProv(e.target.value)}
                        placeholder="CA"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">ZIP / Postal *</label>
                      <input
                        type="text"
                        required
                        value={zip || ''}
                        onChange={(e) => setZip(e.target.value)}
                        placeholder="94105"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Delivery Gate / Courier Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={instructions || ''}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="Leave with front desk concierge or ring buzzer #4"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  {/* Payment Selection */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Select Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          paymentMethod === 'card'
                            ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 ring-2 ring-indigo-200'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        <span>Credit / Debit Card</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('wallet')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          paymentMethod === 'wallet'
                            ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 ring-2 ring-indigo-200'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Wallet className="w-4 h-4 text-emerald-600" />
                        <span className="truncate">
                          Wallet (${(currentUser?.walletBalance || 0).toFixed(2)})
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                    <div className="flex justify-between text-slate-500">
                      <span>Items Subtotal ({buyQuantity}x):</span>
                      <span className="font-mono text-slate-900">{formatCurrency(selectedProduct.price * buyQuantity, activeCurrency || 'USD')}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Local Express Dispatch:</span>
                      <span className="font-bold text-emerald-600">FREE Verified</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200 text-sm">
                      <span>Total Amount:</span>
                      <span className="font-mono text-indigo-600">{formatCurrency(selectedProduct.price * buyQuantity, activeCurrency || 'USD')}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className="w-1/3 py-2.5 rounded-2xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPurchasing}
                      className={`w-2/3 py-3 rounded-2xl ${theme.btnPrimary} ${theme.btnPrimaryHover} text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50`}
                    >
                      {isPurchasing ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Pay & Place Order</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
