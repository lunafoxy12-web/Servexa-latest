import React, { useState, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ServiceItem } from '../../types';
import { PRODUCT_CATEGORIES } from '../../data/productCategories';
import {
  X,
  Upload,
  Camera,
  DollarSign,
  Tag,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Layers
} from 'lucide-react';

interface AddProductServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (newService: ServiceItem) => void;
  providerId: string;
}

const SAMPLE_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80'
];

export const AddProductServiceModal: React.FC<AddProductServiceModalProps> = ({
  isOpen,
  onClose,
  onProductAdded,
  providerId
}) => {
  const { triggerGlobalRefresh, currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modalMode, setModalMode] = useState<'product' | 'order'>('product');
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [priceType, setPriceType] = useState<'fixed' | 'hourly' | 'km' | 'quote'>('fixed');
  const [categoryId, setCategoryId] = useState(PRODUCT_CATEGORIES[0]?.id || 'cat-home');
  const [subcategory, setSubcategory] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number | string>(60);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Order upload fields
  const [orderCustomerName, setOrderCustomerName] = useState('');
  const [orderCustomerPhone, setOrderCustomerPhone] = useState('');
  const [orderStreet, setOrderStreet] = useState('');
  const [orderCity, setOrderCity] = useState('');
  const [orderState, setOrderState] = useState('');
  const [orderZip, setOrderZip] = useState('');
  const [orderQuantity, setOrderQuantity] = useState<number | string>(1);
  const [orderTrackingNumber, setOrderTrackingNumber] = useState('');
  const [orderCourier, setOrderCourier] = useState('Servexa Courier');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Derive subcategories from selected category
  const availableSubcategories = useMemo(() => {
    const selected = PRODUCT_CATEGORIES.find((c) => c.id === categoryId);
    if (!selected) return [];
    return selected.subcategories || [];
  }, [categoryId]);

  if (!isOpen) return null;

  // Handle local image file upload from device
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMsg(null);

    Array.from(files).forEach((file: File) => {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Only image files (JPG, PNG, WebP) are allowed.');
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        setErrorMsg('File exceeds 8MB limit.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = () => {
    if (!customImageUrl.trim()) return;
    setImages((prev) => [...prev, customImageUrl.trim()]);
    setCustomImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg('Product or Service title is required.');
      return;
    }

    if (price === '' || isNaN(Number(price)) || Number(price) < 0) {
      setErrorMsg('Please specify a valid price.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const primaryImage = images[0] || SAMPLE_PRODUCT_IMAGES[0];

      const res = await fetch(`/api/providers/${providerId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          price: Number(price),
          priceType,
          categoryId,
          subcategory: subcategory || availableSubcategories[0] || '',
          durationMinutes: Number(durationMinutes) || 60,
          description: description.trim() || 'Professional high-quality service guaranteed.',
          imageUrl: primaryImage,
          images: images.length > 0 ? images : [primaryImage]
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to publish product');
      }

      const data = await res.json();

      // Also publish directly to products store
      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId,
            name: name.trim(),
            price: Number(price),
            description: description.trim() || 'Professional product/service.',
            category: categoryId,
            subcategory: subcategory || availableSubcategories[0] || '',
            image: primaryImage,
            imageUrl: primaryImage,
            inStock: true
          })
        });
      } catch (e) {
        // ignore secondary publish error
      }

      setSuccessMsg(`"${name}" has been published to your active catalog!`);
      triggerGlobalRefresh();

      if (data.service) {
        onProductAdded(data.service);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error adding product/service:', err);
      setErrorMsg(err.message || 'Error publishing product. Please check connection.');
      setIsSubmitting(false);
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }
    if (price === '' || isNaN(Number(price))) {
      setErrorMsg('Valid price is required.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          customerName: orderCustomerName.trim() || 'Direct Customer',
          customerPhone: orderCustomerPhone.trim() || '+1 (555) 0199',
          deliveryAddress: {
            fullName: orderCustomerName.trim() || 'Direct Customer',
            phone: orderCustomerPhone.trim() || '+1 (555) 0199',
            street: orderStreet.trim() || 'Customer Delivery Address',
            city: orderCity.trim() || 'San Francisco',
            state: orderState.trim() || 'CA',
            zip: orderZip.trim() || '94105'
          },
          productName: name.trim(),
          productPrice: Number(price),
          quantity: Number(orderQuantity) || 1,
          category: categoryId,
          subcategory: subcategory || availableSubcategories[0] || '',
          trackingNumber: orderTrackingNumber.trim() || undefined,
          carrierOrCourier: orderCourier.trim() || 'Servexa Courier',
          orderStatus: 'confirmed'
        })
      });
      if (!res.ok) throw new Error('Failed to upload product order');
      setSuccessMsg(`Product order uploaded successfully with tracking details!`);
      triggerGlobalRefresh();
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading product order');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="add-product-service-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="add-product-service-modal-container"
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 transition-all"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-200" />
              Upload Product & Set Price
            </h3>
            <p className="text-xs text-emerald-100 mt-1">
              Add new products or on-demand services to your provider showcase and marketplace
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs: Upload Product Catalog vs Upload Product Order */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-6 pt-2">
          <button
            type="button"
            onClick={() => { setModalMode('product'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              modalMode === 'product'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Upload Product (Catalog)
          </button>
          <button
            type="button"
            onClick={() => { setModalMode('order'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              modalMode === 'order'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Upload Product Order (Direct Dispatch)
          </button>
        </div>

        {modalMode === 'order' ? (
          /* FORM 2: UPLOAD PRODUCT ORDER */
          <form onSubmit={handleOrderSubmit} className="p-6 space-y-4">
            {/* Notifications */}
            {successMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-sm text-red-800 dark:text-red-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Product & Category Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Ordered *
                </label>
                <input
                  type="text"
                  required
                  value={name || ''}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Smart Wi-Fi Thermostat"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={categoryId || (PRODUCT_CATEGORIES[0]?.id ?? 'cat-home')}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    const selected = PRODUCT_CATEGORIES.find((c) => c.id === e.target.value);
                    setSubcategory(selected?.subcategories?.[0] || '');
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subcategory */}
            {availableSubcategories.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subcategory *
                </label>
                <select
                  value={subcategory || availableSubcategories[0]}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  {availableSubcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quantity & Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unit Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price ?? ''}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="45.00"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={orderQuantity ?? 1}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={orderCustomerName || ''}
                  onChange={(e) => setOrderCustomerName(e.target.value)}
                  placeholder="e.g. John Miller"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Phone *
                </label>
                <input
                  type="text"
                  required
                  value={orderCustomerPhone || ''}
                  onChange={(e) => setOrderCustomerPhone(e.target.value)}
                  placeholder="+1 (555) 019-2831"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Delivery Address */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Delivery Address
              </label>
              <input
                type="text"
                value={orderStreet || ''}
                onChange={(e) => setOrderStreet(e.target.value)}
                placeholder="Street Address (e.g. 742 Market St)"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={orderCity || ''}
                  onChange={(e) => setOrderCity(e.target.value)}
                  placeholder="City"
                  className="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={orderState || ''}
                  onChange={(e) => setOrderState(e.target.value)}
                  placeholder="State"
                  className="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={orderZip || ''}
                  onChange={(e) => setOrderZip(e.target.value)}
                  placeholder="ZIP"
                  className="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Tracking Number & Courier */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Courier / Carrier
                </label>
                <input
                  type="text"
                  value={orderCourier || ''}
                  onChange={(e) => setOrderCourier(e.target.value)}
                  placeholder="e.g. FedEx / Servexa Courier"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Track Number (Optional)
                </label>
                <input
                  type="text"
                  value={orderTrackingNumber || ''}
                  onChange={(e) => setOrderTrackingNumber(e.target.value)}
                  placeholder="e.g. TRK-892102"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Uploading Order...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Upload Product Order
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* FORM 1: UPLOAD PRODUCT TO CATALOG */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Notifications */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-sm text-red-800 dark:text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Product Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Product / Service Title *
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name || ''}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tankless Water Heater Installation"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={categoryId || (PRODUCT_CATEGORIES[0]?.id ?? 'cat-home')}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  const selected = PRODUCT_CATEGORIES.find((c) => c.id === e.target.value);
                  setSubcategory(selected?.subcategories?.[0] || '');
                }}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subcategory Selector */}
          {availableSubcategories.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Select Subcategory *</span>
              </label>
              <select
                value={subcategory || availableSubcategories[0]}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              >
                {availableSubcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Price & Pricing Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Set Price ($) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={price ?? ''}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="120.00"
                  className="w-full pl-9 pr-3 py-2 text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Billing Model
              </label>
              <select
                value={priceType || 'fixed'}
                onChange={(e) => setPriceType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              >
                <option value="fixed">Fixed Price (One-time)</option>
                <option value="hourly">Hourly Labor Rate ($/hr)</option>
                <option value="km">Per Kilometer ($/km)</option>
                <option value="quote">Estimate / Starting Quote</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Est. Duration (Minutes)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={durationMinutes ?? 60}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="60"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Upload Pictures Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Product & Service Pictures ({images.length})
              </label>
              <span className="text-[11px] text-slate-500">
                Upload from device or paste image URLs
              </span>
            </div>

            {/* Dropzone & Device Upload */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center hover:border-emerald-500 transition-colors bg-slate-50/50 dark:bg-slate-800/40">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 rounded-full text-emerald-600 dark:text-emerald-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Click to upload pictures from device
                  </button>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    Supports high-resolution PNG, JPG, WebP up to 8MB
                  </span>
                </div>
              </div>
            </div>

            {/* Quick URL Adder or Sample Photo Picker */}
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={customImageUrl || ''}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                placeholder="Or paste an image web link (https://...)"
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl"
              >
                Add Link
              </button>
              <button
                type="button"
                onClick={() => {
                  const random = SAMPLE_PRODUCT_IMAGES[Math.floor(Math.random() * SAMPLE_PRODUCT_IMAGES.length)];
                  setImages((prev) => [...prev, random]);
                }}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 text-xs font-semibold rounded-xl flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Sample Photo
              </button>
            </div>

            {/* Uploaded Thumbnails Preview */}
            {images.length > 0 && (
              <div className="flex items-center gap-3 overflow-x-auto py-2">
                {images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-emerald-500/80 flex-shrink-0 shadow-sm"
                  >
                    <img
                      src={imgUrl}
                      alt={`Product preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 right-1 bg-emerald-600 text-white text-[9px] font-bold text-center py-0.5 rounded">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description & Specifications
            </label>
            <textarea
              rows={3}
              value={description || ''}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail what is included, materials used, warranty, and handover conditions..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing Product...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Publish Product & Set Price
                </>
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
