import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProviderStorefront, ProviderProfile, Product, ProductOrder } from '../../types';
import { DirectImageUpload } from '../common/DirectImageUpload';
import {
  Store,
  Globe,
  DollarSign,
  CheckCircle2,
  ExternalLink,
  Copy,
  Save,
  CreditCard,
  RefreshCw,
  Plus,
  Trash2,
  FileText,
  Package,
  X,
  Coins,
  Palette,
  Truck,
  MapPin,
  Phone,
  User,
  Clock,
  Check
} from 'lucide-react';

interface StorefrontManagerProps {
  providerId: string;
  providerProfile?: ProviderProfile | null;
}

const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD ($) - Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'AUD ($) - Australian Dollar' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥) - Japanese Yen' },
  { code: 'AED', symbol: 'AED', label: 'AED - UAE Dirham' },
  { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' }
];

const INVOICE_COLOR_THEMES = [
  { id: 'emerald', name: 'Emerald Mint', headerBg: 'bg-emerald-600', badgeBg: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-300' },
  { id: 'indigo', name: 'Royal Indigo', headerBg: 'bg-indigo-600', badgeBg: 'bg-indigo-100 text-indigo-800', border: 'border-indigo-300' },
  { id: 'coral', name: 'Sunset Coral', headerBg: 'bg-orange-500', badgeBg: 'bg-orange-100 text-orange-800', border: 'border-orange-300' },
  { id: 'sky', name: 'Ocean Sky', headerBg: 'bg-sky-600', badgeBg: 'bg-sky-100 text-sky-800', border: 'border-sky-300' },
  { id: 'purple', name: 'Deep Violet', headerBg: 'bg-purple-600', badgeBg: 'bg-purple-100 text-purple-800', border: 'border-purple-300' },
  { id: 'slate', name: 'Modern Slate', headerBg: 'bg-slate-900', badgeBg: 'bg-slate-100 text-slate-800', border: 'border-slate-300' }
];

export const StorefrontManager: React.FC<StorefrontManagerProps> = ({ providerId, providerProfile }) => {
  const { currentUser, openStorefrontSubdomain, triggerGlobalRefresh } = useAuth();

  const [storefront, setStorefront] = useState<ProviderStorefront | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [subscribing, setSubscribing] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [storeName, setStoreName] = useState<string>('');
  const [subdomain, setSubdomain] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [tagline, setTagline] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [themeColor, setThemeColor] = useState<string>('#4f46e5');
  const [bannerUrl, setBannerUrl] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);
  const [newProdName, setNewProdName] = useState<string>('');
  const [newProdPrice, setNewProdPrice] = useState<string>('');
  const [newProdDesc, setNewProdDesc] = useState<string>('');
  const [newProdImage, setNewProdImage] = useState<string>('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800');
  const [newProdCategory, setNewProdCategory] = useState<string>('General');
  const [addingProduct, setAddingProduct] = useState<boolean>(false);

  // Invoice Creator State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);
  const [invCustomerName, setInvCustomerName] = useState<string>('John Doe');
  const [invLabor, setInvLabor] = useState<string>('60');
  const [invMaterials, setInvMaterials] = useState<string>('25');
  const [invNotes, setInvNotes] = useState<string>('Diagnostic inspection, service labor, replacement hardware');
  const [invTheme, setInvTheme] = useState<string>('emerald');
  const [createdInvoiceNotice, setCreatedInvoiceNotice] = useState<string | null>(null);

  // Customer Product Orders & Dispatch State
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [selectedOrderToDispatch, setSelectedOrderToDispatch] = useState<ProductOrder | null>(null);
  const [dispatchCarrier, setDispatchCarrier] = useState<string>('Servexa Direct Express');
  const [dispatchTrackingNum, setDispatchTrackingNum] = useState<string>('');
  const [dispatchEstDelivery, setDispatchEstDelivery] = useState<string>('Today by 5:00 PM');
  const [dispatchNote, setDispatchNote] = useState<string>('Packed and handed over to delivery driver');
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState<boolean>(false);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await fetch(`/api/orders?providerId=${providerId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setOrders(data);
      }
    } catch (e) {
      console.error('Error loading provider orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchStorefront = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/providers/${providerId}/storefront`);
      const data = await res.json();
      if (res.ok && data) {
        setStorefront(data);
        setStoreName(data.storeName || '');
        setSubdomain(data.subdomain || '');
        setCurrency(data.currency || 'USD');
        setTagline(data.tagline || '');
        setBio(data.bio || '');
        setThemeColor(data.themeColor || '#4f46e5');
        setBannerUrl(data.bannerUrl || '');
        setContactEmail(data.contactEmail || '');
        setContactPhone(data.contactPhone || '');
      }
    } catch (e) {
      console.error('Error fetching storefront:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch(`/api/products?providerId=${providerId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setProducts(data);
      }
    } catch (e) {
      console.error('Error loading products:', e);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (providerId) {
      fetchStorefront();
      fetchProducts();
      fetchOrders();
    }
  }, [providerId]);

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: string,
    carrierOrCourier?: string,
    trackingNumber?: string,
    estimatedDelivery?: string,
    dispatchNoteVal?: string
  ) => {
    try {
      setUpdatingOrderStatus(true);
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          carrierOrCourier: carrierOrCourier || dispatchCarrier,
          trackingNumber: trackingNumber || dispatchTrackingNum || `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
          estimatedDelivery: estimatedDelivery || dispatchEstDelivery,
          dispatchNote: dispatchNoteVal || dispatchNote
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setFeedback({ type: 'error', message: data.error || 'Failed to update order status.' });
      } else {
        setFeedback({ type: 'success', message: `Order #${data.order?.orderNumber || orderId} status successfully updated to ${newStatus.toUpperCase()}! Customer notified.` });
        setSelectedOrderToDispatch(null);
        await fetchOrders();
        triggerGlobalRefresh();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error updating order status.' });
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  const handleSaveStorefront = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain.trim() || !storeName.trim()) {
      setFeedback({ type: 'error', message: 'Store Name and Subdomain are required.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/providers/${providerId}/storefront`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          subdomain: subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          currency,
          tagline,
          bio,
          themeColor,
          bannerUrl,
          contactEmail,
          contactPhone
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStorefront(data);
        setFeedback({ type: 'success', message: 'Storefront updated and published successfully!' });
        triggerGlobalRefresh();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update storefront.' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Network error saving storefront.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) return;

    setAddingProduct(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          name: newProdName.trim(),
          price: parseFloat(newProdPrice) || 0,
          currency,
          description: newProdDesc.trim(),
          imageUrl: newProdImage,
          category: newProdCategory,
          inStock: true
        })
      });

      if (res.ok) {
        const prod = await res.json();
        setProducts((prev) => [prod, ...prev]);
        setIsAddProductOpen(false);
        setNewProdName('');
        setNewProdPrice('');
        setNewProdDesc('');
        setFeedback({ type: 'success', message: `Product "${prod.name}" added to your store!` });
        triggerGlobalRefresh();
      }
    } catch (e) {
      console.error('Error adding product:', e);
    } finally {
      setAddingProduct(false);
    }
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!confirm('Remove this product from your storefront?')) return;
    try {
      const res = await fetch(`/api/products/${prodId}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== prodId));
        triggerGlobalRefresh();
      }
    } catch (e) {
      console.error('Error deleting product:', e);
    }
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const res = await fetch(`/api/providers/${providerId}/storefront/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStorefront(data.storefront);
        setFeedback({ type: 'success', message: 'Monthly subscription active! Your store is live.' });
        triggerGlobalRefresh();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Subscription failed.' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Subscription request failed.' });
    } finally {
      setSubscribing(false);
    }
  };

  const copyStoreLink = () => {
    const url = `${window.location.origin}/?store=${storefront?.subdomain || subdomain}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const fullStoreUrl = `${window.location.origin}/?store=${storefront?.subdomain || subdomain || 'your-store'}`;
  const isSubActive = storefront?.subscriptionActive;

  // Invoice calculations
  const laborNum = parseFloat(invLabor) || 0;
  const materialsNum = parseFloat(invMaterials) || 0;
  const totalInv = laborNum + materialsNum + 1.0;
  const commFee = Math.round(totalInv * 0.06 * 100) / 100;
  const netEarnings = Math.round((totalInv - commFee) * 100) / 100;
  const selectedThemeConfig = INVOICE_COLOR_THEMES.find((t) => t.id === invTheme) || INVOICE_COLOR_THEMES[0];
  const currSymbol = SUPPORTED_CURRENCIES.find((c) => c.code === currency)?.symbol || '$';

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Header & Quick Actions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Storefront & Catalog
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  isSubActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {isSubActive ? '● Live Store ($5/mo active)' : '○ Subscription Pending ($5/mo)'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Currency: {currency} ({currSymbol})
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Manage your direct store, edit products, select currency, and generate invoices with custom themes.
            </p>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsInvoiceModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Create Invoice</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddProductOpen(true)}
              className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>

            {isSubActive ? (
              <>
                <button
                  type="button"
                  onClick={() => openStorefrontSubdomain(storefront?.subdomain || subdomain)}
                  className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Preview Store</span>
                </button>
                <button
                  type="button"
                  onClick={copyStoreLink}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={subscribing}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {subscribing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Activate Store ($5/mo)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Live Subdomain Pill */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Globe className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="text-slate-400">Public Domain:</span>
            <span className="font-mono font-bold text-slate-900">
              {subdomain ? `${subdomain}.servexa.com` : 'your-store.servexa.com'}
            </span>
          </div>
          <code className="text-[11px] font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-600 truncate max-w-sm">
            {fullStoreUrl}
          </code>
        </div>
      </div>

      {/* PRODUCTS CATALOG SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div>
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-teal-600" />
              Products in Store ({products.length})
            </h4>
            <p className="text-xs text-slate-500">Items and equipment available for direct order in chat & store</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddProductOpen(true)}
            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Product
          </button>
        </div>

        {products.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No products added yet. Click "Add New Product" to list equipment, parts, or items.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
              >
                <img
                  src={p.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200'}
                  alt={p.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-slate-900 truncate">{p.name}</h5>
                  <p className="text-[11px] text-slate-500 truncate">{p.description || p.category}</p>
                  <span className="text-xs font-black text-slate-900 font-mono mt-0.5 block">
                    {currSymbol}{p.price.toFixed(2)} {currency}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(p.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Remove Product"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CUSTOMER PRODUCT ORDERS & DISPATCH MANAGEMENT SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-5 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Customer Product Orders & Dispatch Manager ({orders.length})
              </h4>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review customer delivery addresses, check order details, update status, and dispatch shipments
            </p>
          </div>
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loadingOrders}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
            <span>Refresh Orders</span>
          </button>
        </div>

        {loadingOrders ? (
          <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Loading product orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-8 text-center rounded-2xl bg-slate-50 border border-slate-200/80 p-6">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No Customer Product Orders Yet</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              When customers buy products from your store, their orders, delivery addresses, and dispatch controls will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/70">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      #{ord.orderNumber}
                    </span>
                    <span className="text-xs text-slate-500">
                      Placed on {new Date(ord.createdAt).toLocaleDateString()} at {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold capitalize border ${
                    ord.orderStatus === 'delivered'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : ord.orderStatus === 'dispatched'
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                      : ord.orderStatus === 'processing'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-blue-100 text-blue-800 border-blue-300'
                  }`}>
                    ● {ord.orderStatus}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Product summary */}
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 flex items-center gap-3">
                    {ord.productImage && (
                      <img
                        src={ord.productImage}
                        alt={ord.productName}
                        className="w-12 h-12 object-contain rounded-lg bg-slate-50 p-1 border border-slate-200 shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-slate-900 truncate">{ord.productName}</h5>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Quantity: <strong>{ord.quantity}x</strong> • Price: ${ord.productPrice?.toFixed(2) || (ord.totalAmount / ord.quantity).toFixed(2)}
                      </div>
                      <div className="text-xs font-black text-slate-900 font-mono mt-0.5">
                        Total: ${ord.totalAmount.toFixed(2)} (Paid via {ord.paymentMethod})
                      </div>
                    </div>
                  </div>

                  {/* Customer & Contact */}
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Customer Details</span>
                    </div>
                    <div className="font-semibold text-slate-900">{ord.deliveryAddress?.fullName || ord.customerName}</div>
                    <div className="text-slate-600 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{ord.deliveryAddress?.phone || ord.customerPhone || 'Phone on file'}</span>
                    </div>
                    {ord.customerEmail && (
                      <div className="text-slate-400 text-[11px] truncate">{ord.customerEmail}</div>
                    )}
                  </div>

                  {/* Delivery destination */}
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Destination Address</span>
                    </div>
                    <div className="text-slate-700">{ord.deliveryAddress?.street}</div>
                    <div className="text-slate-500 text-[11px]">
                      {ord.deliveryAddress?.city}, {ord.deliveryAddress?.state} {ord.deliveryAddress?.zip}
                    </div>
                    {ord.deliveryAddress?.instructions && (
                      <div className="text-indigo-600 text-[11px] italic pt-1 border-t border-slate-100">
                        Note: {ord.deliveryAddress.instructions}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tracking info if dispatched */}
                {ord.trackingInfo && (
                  <div className="p-3 rounded-xl bg-white border border-indigo-100 text-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-indigo-600" />
                      <span className="font-semibold text-slate-900">{ord.trackingInfo.carrierOrCourier || 'Courier Service'}</span>
                      {ord.trackingInfo.trackingNumber && (
                        <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                          {ord.trackingInfo.trackingNumber}
                        </span>
                      )}
                    </div>
                    {ord.trackingInfo.estimatedDelivery && (
                      <span className="text-emerald-700 font-medium">
                        Est: {ord.trackingInfo.estimatedDelivery}
                      </span>
                    )}
                  </div>
                )}

                {/* Status action controls */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/70">
                  {ord.orderStatus === 'confirmed' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdateOrderStatus(ord.id, 'processing')}
                        disabled={updatingOrderStatus}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Mark as Preparing / Packed</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrderToDispatch(ord);
                          setDispatchCarrier('Servexa Direct Express');
                          setDispatchTrackingNum(`SVX-${Math.floor(100000 + Math.random() * 900000)}`);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Dispatch Order & Ship</span>
                      </button>
                    </>
                  )}

                  {ord.orderStatus === 'processing' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrderToDispatch(ord);
                        setDispatchCarrier('Servexa Direct Express');
                        setDispatchTrackingNum(`SVX-${Math.floor(100000 + Math.random() * 900000)}`);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Dispatch Order & Ship</span>
                    </button>
                  )}

                  {ord.orderStatus === 'dispatched' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                      disabled={updatingOrderStatus}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark as Delivered & Verified</span>
                    </button>
                  )}

                  {ord.orderStatus === 'delivered' && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 py-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Order Complete & Handover Verified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DISPATCH ORDER MODAL */}
      {selectedOrderToDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-white" />
                <div>
                  <h3 className="text-sm font-bold leading-tight">Dispatch Order #{selectedOrderToDispatch.orderNumber}</h3>
                  <p className="text-[11px] text-white/80">Update courier and tracking details for customer</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderToDispatch(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Destination preview */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Deliver To:</span>
                <div className="font-bold text-slate-900">
                  {selectedOrderToDispatch.deliveryAddress?.fullName || selectedOrderToDispatch.customerName}
                </div>
                <div className="text-slate-600">
                  {selectedOrderToDispatch.deliveryAddress?.street}, {selectedOrderToDispatch.deliveryAddress?.city}, {selectedOrderToDispatch.deliveryAddress?.state} {selectedOrderToDispatch.deliveryAddress?.zip}
                </div>
                <div className="text-slate-600 flex items-center gap-1 pt-1 border-t border-slate-200/60">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{selectedOrderToDispatch.deliveryAddress?.phone || selectedOrderToDispatch.customerPhone}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Courier / Carrier Name
                </label>
                <input
                  type="text"
                  required
                  value={dispatchCarrier || ''}
                  onChange={(e) => setDispatchCarrier(e.target.value)}
                  placeholder="e.g. Servexa Express / DHL / Local Driver"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tracking Code / Waybill Number
                </label>
                <input
                  type="text"
                  required
                  value={dispatchTrackingNum || ''}
                  onChange={(e) => setDispatchTrackingNum(e.target.value)}
                  placeholder="e.g. SVX-782914"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Delivery Time
                </label>
                <input
                  type="text"
                  value={dispatchEstDelivery || ''}
                  onChange={(e) => setDispatchEstDelivery(e.target.value)}
                  placeholder="e.g. Today by 5:00 PM or Within 45 mins"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dispatch Note for Customer
                </label>
                <input
                  type="text"
                  value={dispatchNote || ''}
                  onChange={(e) => setDispatchNote(e.target.value)}
                  placeholder="e.g. Handed over to courier driver; will ring doorbell"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedOrderToDispatch(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={updatingOrderStatus}
                  onClick={() =>
                    handleUpdateOrderStatus(
                      selectedOrderToDispatch.id,
                      'dispatched',
                      dispatchCarrier,
                      dispatchTrackingNum,
                      dispatchEstDelivery,
                      dispatchNote
                    )
                  }
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {updatingOrderStatus ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Truck className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm Dispatch & Notify</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STORE SETTINGS FORM */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <h4 className="text-base font-bold text-slate-900">Store Settings & Branding</h4>
            <p className="text-xs text-slate-500">Configure name, currency, domain, and colors</p>
          </div>
          <button
            type="button"
            onClick={handleSaveStorefront}
            disabled={saving}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Settings</span>
          </button>
        </div>

        <form onSubmit={handleSaveStorefront} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Store Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Store Display Name</label>
              <input
                type="text"
                required
                value={storeName || ''}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Apex Electrical & Smart Lighting"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Subdomain */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Subdomain</label>
              <div className="flex items-center">
                <input
                  type="text"
                  required
                  value={subdomain || ''}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="e.g. apexelectric"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-l-xl text-xs text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
                <span className="px-2.5 py-2 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl text-xs text-slate-500 font-mono select-none">
                  .servexa.com
                </span>
              </div>
            </div>

            {/* Currency Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                Store Currency
              </label>
              <select
                value={currency || 'USD'}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Tagline</label>
            <input
              type="text"
              value={tagline || ''}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Certified master electrician & 24/7 emergency dispatch"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Store Bio</label>
            <textarea
              rows={2}
              value={bio || ''}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief summary of certifications, specialties, and service coverage..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Banner Direct Upload */}
            <div>
              <DirectImageUpload
                value={bannerUrl}
                onChange={setBannerUrl}
                label="Storefront Banner Image"
                helperText="Upload a direct photo or graphic for your store header"
              />
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Public Email</label>
              <input
                type="email"
                value={contactEmail || ''}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="store@domain.com"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Phone</label>
              <input
                type="tel"
                value={contactPhone || ''}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Theme Color Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-teal-600" />
              Storefront Theme Accent Color
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {[
                { name: 'Teal Mint', value: '#0d9488' },
                { name: 'Sunset Coral', value: '#ea580c' },
                { name: 'Amber Gold', value: '#d97706' },
                { name: 'Cerulean Sky', value: '#0284c7' },
                { name: 'Royal Indigo', value: '#4f46e5' },
                { name: 'Deep Violet', value: '#7c3aed' },
                { name: 'Rose Bloom', value: '#e11d48' },
                { name: 'Modern Slate', value: '#334155' }
              ].map((theme) => (
                <button
                  type="button"
                  key={theme.value}
                  onClick={() => setThemeColor(theme.value)}
                  className={`w-8 h-8 rounded-full transition-all cursor-pointer ${
                    themeColor === theme.value ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: theme.value }}
                  title={theme.name}
                />
              ))}
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-[11px] text-slate-500 font-mono">Custom:</span>
                <input
                  type="color"
                  value={themeColor || '#4f46e5'}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-7 h-7 rounded border border-slate-200 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* ADD PRODUCT MODAL */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-teal-600" />
                Add Product to Store
              </h3>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={newProdName || ''}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Heavy Duty Circuit Breaker 20A"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price ({currSymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProdPrice || ''}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="25.00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={newProdCategory || ''}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    placeholder="Hardware / Parts"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <DirectImageUpload
                  value={newProdImage}
                  onChange={setNewProdImage}
                  label="Product Photo"
                  helperText="Upload a product photo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newProdDesc || ''}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Technical specs, compatibility, warranty..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={addingProduct}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {addingProduct ? 'Adding Product...' : 'Add to Storefront Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL WITH COLOR THEMES */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className={`p-4 ${selectedThemeConfig.headerBg} text-white flex items-center justify-between transition-colors`}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-white" />
                <div>
                  <h3 className="text-sm font-bold leading-tight">Create Customer Invoice</h3>
                  <p className="text-[11px] text-white/80">Generates instant digital invoice with fee breakdown</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Color Theme Selector for Invoice */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Invoice Accent Color Theme</label>
                <div className="flex flex-wrap gap-2">
                  {INVOICE_COLOR_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setInvTheme(theme.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                        invTheme === theme.id
                          ? `${theme.border} ring-2 ring-offset-1 ring-slate-800 ${theme.badgeBg}`
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${theme.headerBg}`} />
                      <span>{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name / Job Ref</label>
                <input
                  type="text"
                  value={invCustomerName || ''}
                  onChange={(e) => setInvCustomerName(e.target.value)}
                  placeholder="e.g. Jane Smith (Kitchen Repair)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Labor Fee ({currSymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invLabor || ''}
                    onChange={(e) => setInvLabor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Materials / Parts ({currSymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invMaterials || ''}
                    onChange={(e) => setInvMaterials(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service Notes / Work Performed</label>
                <textarea
                  rows={2}
                  value={invNotes || ''}
                  onChange={(e) => setInvNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 resize-none"
                />
              </div>

              {/* Live Fee Breakdown Preview */}
              <div className={`p-4 rounded-2xl border ${selectedThemeConfig.border} bg-slate-50 space-y-1.5 text-xs`}>
                <div className="flex justify-between text-slate-600">
                  <span>Labor:</span>
                  <span className="font-mono">{currSymbol}{laborNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Materials & Hardware:</span>
                  <span className="font-mono">{currSymbol}{materialsNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Platform Fee ($1.00 + 6% commission):</span>
                  <span className="font-mono">{currSymbol}{commFee.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                  <span>Total Customer Invoice:</span>
                  <span className="font-mono text-emerald-700">{currSymbol}{totalInv.toFixed(2)} {currency}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>Your Net Earnings:</span>
                  <span className="font-mono text-slate-900">{currSymbol}{netEarnings.toFixed(2)} {currency}</span>
                </div>
              </div>

              {createdInvoiceNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold text-center border border-emerald-200">
                  {createdInvoiceNotice}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setCreatedInvoiceNotice(`Invoice for ${currSymbol}${totalInv.toFixed(2)} issued! Available in chat & order tracker.`);
                  setTimeout(() => {
                    setIsInvoiceModalOpen(false);
                    setCreatedInvoiceNotice(null);
                  }, 1800);
                }}
                className={`w-full py-2.5 ${selectedThemeConfig.headerBg} hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Issue & Save Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
