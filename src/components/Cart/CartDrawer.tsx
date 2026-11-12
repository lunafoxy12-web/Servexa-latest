import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/currency';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  CreditCard,
  Wallet,
  ShieldCheck,
  Truck,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartTotal,
    currentUser,
    setIsAuthModalOpen,
    setAuthModalTab,
    refreshUser,
    triggerGlobalRefresh
  } = useAuth();

  const userCurrency = currentUser?.preferredCurrency || 'USD';

  // Checkout address state
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [street, setStreet] = useState(currentUser?.location?.address || '');
  const [city, setCity] = useState('San Francisco');
  const [stateProv, setStateProv] = useState('CA');
  const [zip, setZip] = useState('94105');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      if (!fullName) setFullName(currentUser.name || '');
      if (!phone && currentUser.phone) setPhone(currentUser.phone);
      if (!street && currentUser.location?.address) setStreet(currentUser.location.address);
    }
  }, [currentUser]);

  if (!isCartOpen) return null;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }

    if (cart.length === 0) return;

    if (!fullName.trim() || !phone.trim() || !street.trim() || !city.trim() || !stateProv.trim() || !zip.trim()) {
      setErrorMsg('Please complete all required delivery address fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

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
      const res = await fetch('/api/products/cart-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: currentUser.id,
          cartItems: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity
          })),
          deliveryAddress,
          paymentMethod
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrderSuccess(true);
        clearCart();
        await refreshUser();
        triggerGlobalRefresh();
      } else {
        setErrorMsg(data.error || 'Failed to complete order. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error processing checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg h-full bg-gradient-to-b from-[#edf2ff] via-[#f8fafc] to-[#e8edff] shadow-2xl border-l border-indigo-100/80 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white backdrop-blur-xs">
              <ShoppingBag className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Your Shopping Cart</h2>
              <p className="text-[11px] text-slate-300">
                {cart.length === 0 ? 'Empty Cart' : `${cart.length} unique supplies selected`}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsCartOpen(false);
              setIsCheckingOut(false);
              setOrderSuccess(false);
            }}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {orderSuccess ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Order Placed Successfully!</h3>
            <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
              Your supplies have been confirmed and queued for direct provider delivery. You can track progress in your profile orders tab.
            </p>
            <button
              type="button"
              onClick={() => {
                setOrderSuccess(false);
                setIsCheckingOut(false);
                setIsCartOpen(false);
              }}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        ) : cart.length === 0 ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Your cart is empty</h3>
            <p className="text-xs text-slate-500 max-w-xs">
              Explore authentic tools, equipment, and certified supplies direct from local service provider stores.
            </p>
            <button
              onClick={() => setIsCartOpen(false)}
              className="mt-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Browse Supplies
            </button>
          </div>
        ) : isCheckingOut ? (
          /* Checkout View */
          <form onSubmit={handleCheckoutSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← Back to Cart
                </button>
                <span className="text-xs font-bold text-slate-700">
                  Total: {formatPrice(cartTotal, userCurrency)}
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  Delivery Destination
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName || ''}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Receiver name"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={phone || ''}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={street || ''}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="123 Market St, Apt 4B"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={city || ''}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={stateProv || ''}
                      onChange={(e) => setStateProv(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">ZIP / Postal *</label>
                    <input
                      type="text"
                      required
                      value={zip || ''}
                      onChange={(e) => setZip(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Drop-off Instructions (Optional)</label>
                  <input
                    type="text"
                    value={instructions || ''}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Gate code, porch, or call upon arrival"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Select Payment Method
                </h4>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-200'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="text-xs leading-none">Credit Card</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Instant Stripe Escrow</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      paymentMethod === 'wallet'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-2 ring-emerald-200'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs leading-none">Servexa Wallet</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Balance: ${currentUser?.walletBalance?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-white border-t border-slate-200 shrink-0 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Order Subtotal:</span>
                <span className="font-extrabold text-slate-900 font-mono text-sm">
                  {formatPrice(cartTotal, userCurrency)}
                </span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {isSubmitting ? (
                  <span>Processing Payment...</span>
                ) : (
                  <>
                    <span>Confirm Order & Pay {formatPrice(cartTotal, userCurrency)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Cart Items List */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5 group hover:border-indigo-200 transition-all"
                >
                  <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                    <img
                      src={item.product.imageUrl || item.product.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200'}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{item.product.name}</h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {item.product.storeName || item.product.category}
                    </p>
                    <div className="text-xs font-extrabold text-indigo-700 font-mono mt-1">
                      {formatPrice(item.product.price, userCurrency)} each
                    </div>
                  </div>

                  {/* Quantity adjustment */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 rounded-lg hover:bg-white text-slate-600 transition-colors cursor-pointer"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold font-mono">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                      className="p-1 rounded-lg hover:bg-white text-slate-600 transition-colors cursor-pointer"
                      title="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Cart Summary & Checkout Button */}
            <div className="p-4 sm:p-5 bg-white border-t border-slate-200 shrink-0 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} items):</span>
                <span className="text-base font-extrabold text-slate-900 font-mono">
                  {formatPrice(cartTotal, userCurrency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Servexa Protected Escrow
                </span>
                <span>Direct Provider Delivery</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!currentUser) {
                    setAuthModalTab('login');
                    setIsAuthModalOpen(true);
                    return;
                  }
                  setIsCheckingOut(true);
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Proceed to Delivery & Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
