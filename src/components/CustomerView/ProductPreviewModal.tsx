import React, { useState } from 'react';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../utils/currency';
import {
  X,
  Star,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Store,
  ShoppingBag,
  CreditCard,
  Package,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

interface ProductPreviewModalProps {
  product: Product | null;
  onClose: () => void;
  onBuyNow: (product: Product, quantity: number) => void;
  onOpenStorefront?: (subdomain: string) => void;
}

export const ProductPreviewModal: React.FC<ProductPreviewModalProps> = ({
  product,
  onClose,
  onBuyNow,
  onOpenStorefront
}) => {
  const { addToCart, setIsCartOpen, activeCurrency, openStorefrontSubdomain } = useAuth();
  const { theme } = useTheme();
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!product) return null;

  const currentImage = selectedImage || product.image || product.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=700&auto=format&fit=crop&q=80';
  const allImages = [
    product.image || product.imageUrl,
    ...(product.additionalImages || [])
  ].filter(Boolean) as string[];

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setToastMessage(`Added ${quantity}x "${product.name}" to cart!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleBuy = () => {
    onBuyNow(product, quantity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 relative my-6 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          aria-label="Close Preview"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto pr-1 -mr-1 space-y-6">
          {/* Breadcrumb & Merchant Info */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-indigo-600 uppercase tracking-wider text-[11px]">
                {product.category?.replace('prod-cat-', '').replace(/-/g, ' ')}
              </span>
              {product.subcategory && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span className="font-medium text-slate-700">{product.subcategory}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                <Store className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-bold">{product.storeName || product.providerName || 'Specialist Merchant'}</span>
              </div>
              {product.subdomain && (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenStorefront) onOpenStorefront(product.subdomain!);
                    else openStorefrontSubdomain(product.subdomain!);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 text-xs hover:underline cursor-pointer"
                >
                  <span>Visit Store</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setIsCartOpen(true);
                }}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] cursor-pointer transition-all ml-2"
              >
                View Cart →
              </button>
            </div>
          )}

          {/* Product Hero Grid (Images on Left, Info on Right) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Image Gallery Stage (5 cols) */}
            <div className="md:col-span-5 space-y-3">
              <div className="relative w-full aspect-square bg-slate-50 rounded-2xl border border-slate-200/90 overflow-hidden flex items-center justify-center p-3 shadow-inner">
                <img
                  src={currentImage}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain rounded-xl drop-shadow-md transition-all duration-300 hover:scale-105"
                  referrerPolicy="no-referrer"
                />

                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-800 uppercase tracking-wider shadow-2xs flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>100% Genuine</span>
                </div>

                <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1 shadow-sm">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{product.rating || 4.9}</span>
                  <span className="text-slate-300 font-normal">({product.reviewCount || 128})</span>
                </div>
              </div>

              {/* Thumbnails row if multiple images exist */}
              {allImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-14 h-14 rounded-xl border-2 overflow-hidden shrink-0 bg-slate-50 p-1 cursor-pointer transition-all ${
                        currentImage === img ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Angle ${idx + 1}`}
                        className="w-full h-full object-contain rounded-md"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details & Actions (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              <div>
                {product.brand && (
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    {product.brand}
                  </span>
                )}
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug mt-0.5">
                  {product.name}
                </h2>
              </div>

              {/* Price & Stock Status */}
              <div className="flex items-baseline justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                    {formatCurrency(product.price, activeCurrency || 'USD')}
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    All applicable merchant taxes & service warranty included
                  </span>
                </div>

                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    product.inStock !== false ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {product.inStock !== false ? 'In Stock (Ready to Ship)' : 'Limited Stock'}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {product.shippingEta || 'Fast verified delivery'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Product Overview
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Features List */}
              {product.features && product.features.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Key Features & Advantages
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {product.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quantity Selector & Purchase Actions */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Select Quantity:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base flex items-center justify-center transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-bold text-sm text-slate-900 font-mono">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base flex items-center justify-center transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 py-1">
                  <span>Subtotal for {quantity} item{quantity > 1 ? 's' : ''}:</span>
                  <span className="font-bold text-slate-900 text-sm font-mono">
                    {formatCurrency(product.price * quantity, activeCurrency || 'USD')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-indigo-50 text-indigo-900 hover:text-indigo-700 border border-slate-200 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4 text-indigo-600" />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBuy}
                    className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Buy Now</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Specifications Section */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                <span>Technical Specifications & Materials</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">{key}:</span>
                    <span className="font-bold text-slate-900 text-right">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-5 h-5 text-indigo-600 mb-1" />
              <span className="font-bold text-slate-900">100% Genuine</span>
              <span className="text-[11px] text-slate-500">Verified official supply</span>
            </div>
            <div className="flex flex-col items-center border-y sm:border-y-0 sm:border-x border-indigo-100/80 py-2 sm:py-0">
              <Truck className="w-5 h-5 text-indigo-600 mb-1" />
              <span className="font-bold text-slate-900">Protected Dispatch</span>
              <span className="text-[11px] text-slate-500">Insured express courier</span>
            </div>
            <div className="flex flex-col items-center">
              <Package className="w-5 h-5 text-indigo-600 mb-1" />
              <span className="font-bold text-slate-900">30-Day Guarantee</span>
              <span className="text-[11px] text-slate-500">Free return replacement</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
