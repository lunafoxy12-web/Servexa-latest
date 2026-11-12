import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ChatMessage, Booking, ProviderProfile, Product, ChatInvoice } from '../../types';
import {
  X,
  Send,
  PhoneCall,
  Video,
  CheckCheck,
  Paperclip,
  Store,
  MapPin,
  FileText,
  CreditCard,
  Wallet,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShoppingBag,
  ArrowUpRight,
  Banknote,
  Navigation
} from 'lucide-react';

export const ChatDrawer: React.FC = () => {
  const {
    activeChatBookingId,
    closeChat,
    currentUser,
    initiateCall,
    globalRefreshKey,
    openProviderProfile,
    openLiveTracking
  } = useAuth();

  const { theme } = useTheme();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [inputText, setInputText] = useState('');

  // Attached media state (photo or video of the problem)
  const [attachedMedia, setAttachedMedia] = useState<{
    file?: File;
    dataUrl: string;
    type: 'image' | 'video';
    name: string;
  } | null>(null);

  // Store Drawer & Invoice in chat state
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<ChatInvoice[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState<ChatInvoice | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'credit' | 'cod'>('card');
  const [payingInvId, setPayingInvId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isPreorder = Boolean(activeChatBookingId?.startsWith('preorder_'));
  const preorderTargetId = isPreorder ? activeChatBookingId!.replace('preorder_', '') : null;

  // Load booking, provider, messages, and invoices
  useEffect(() => {
    if (!activeChatBookingId) return;

    if (isPreorder && preorderTargetId) {
      fetch(`/api/providers/${preorderTargetId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setProviderProfile(data);
          }
        })
        .catch(() => {});
    } else {
      fetch('/api/bookings')
        .then((res) => res.json())
        .then((bookings: Booking[]) => {
          const found = bookings.find((b) => b.id === activeChatBookingId);
          if (found) {
            setBooking(found);
            if (found.providerId) {
              fetch(`/api/providers/${found.providerId}`)
                .then((res) => res.json())
                .then((pData) => {
                  if (pData && !pData.error) {
                    setProviderProfile(pData);
                  }
                })
                .catch(() => {});
            }
          }
        })
        .catch(() => {});
    }

    // Fetch messages
    fetch(`/api/messages/${activeChatBookingId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(() => {});

    // Fetch invoices
    fetch(`/api/invoices?bookingId=${activeChatBookingId}`)
      .then((res) => res.json())
      .then((invs) => {
        if (Array.isArray(invs)) setInvoices(invs);
      })
      .catch(() => {});
  }, [activeChatBookingId, globalRefreshKey, isPreorder, preorderTargetId]);

  // Load products for this provider store catalog
  useEffect(() => {
    const provId = isPreorder ? preorderTargetId : booking?.providerId;
    if (provId) {
      fetch(`/api/products?providerId=${provId}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setStoreProducts(data);
        })
        .catch(() => {});
    }
  }, [isPreorder, preorderTargetId, booking]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, invoices]);

  if (!activeChatBookingId) return null;

  // Real data calculations
  const providerName = providerProfile?.businessName || booking?.providerName || 'Verified Specialist';
  const providerAvatar =
    (providerProfile as any)?.avatar ||
    (providerProfile as any)?.user?.avatar ||
    booking?.providerAvatar ||
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120';
  const providerRating = providerProfile?.rating ?? 4.92;
  const completedJobs = providerProfile?.completedJobs ?? 42;

  // Customer location and live distance computation
  const customerAddress = booking?.pickupLocation?.address || '742 Market St, San Francisco, CA';
  const custLat = booking?.pickupLocation?.lat || 37.7749;
  const custLng = booking?.pickupLocation?.lng || -122.4194;
  const provLat = providerProfile?.currentLocation?.lat || custLat + 0.014;
  const provLng = providerProfile?.currentLocation?.lng || custLng + 0.012;
  const distanceKm =
    Math.round(Math.sqrt(Math.pow(provLat - custLat, 2) + Math.pow(provLng - custLng, 2)) * 111 * 10) / 10 || 2.1;
  const etaMins = Math.max(5, Math.round(distanceKm * 3.5));

  // Format accept time
  const acceptTimeFormatted = booking?.acceptedAt
    ? new Date(booking.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '11:33 AM';

  // Handle Photo/Video selection
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedMedia({
        file,
        dataUrl: reader.result as string,
        type: isVideo ? 'video' : 'image',
        name: file.name
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Send message with optional photo/video attachment
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !attachedMedia) || !currentUser) return;

    const textToSend = inputText.trim();
    const mediaToSend = attachedMedia;

    setInputText('');
    setAttachedMedia(null);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: isPreorder ? undefined : booking?.id,
          conversationId: activeChatBookingId,
          senderId: currentUser.id,
          receiverId: isPreorder ? preorderTargetId : booking?.providerId,
          senderName: currentUser.name,
          text: textToSend || (mediaToSend ? `[Uploaded ${mediaToSend.type} of problem]` : ''),
          mediaType: mediaToSend ? mediaToSend.type : 'text',
          mediaUrl: mediaToSend ? mediaToSend.dataUrl : undefined,
          isEncrypted: true
        })
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Pay in-chat service invoice (Card, Wallet Credit, or COD)
  const handlePayInvoice = async (invoiceId: string, method: 'card' | 'credit' | 'cod') => {
    setPayingInvId(invoiceId);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: method })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'confirmed', paymentMethod: method } : inv))
        );
        if (booking && booking.id === activeChatBookingId) {
          setBooking((prev) => (prev ? { ...prev, paymentStatus: 'paid', paymentMethod: method } : null));
        }
        if (method === 'credit' && currentUser) {
          currentUser.walletBalance = Math.max(
            0,
            Math.round(((currentUser.walletBalance || 0) - (showPaymentModal?.totalAmount || 0)) * 100) / 100
          );
        }
        const methodTitle =
          method === 'card'
            ? 'Debit/Credit Card'
            : method === 'credit'
            ? 'Wallet Credit'
            : 'Cash on Delivery (COD)';
        setPaymentSuccess(`Payment option confirmed via ${methodTitle}!`);
        setTimeout(() => setShowPaymentModal(null), 1200);
      } else {
        setPaymentError(data.error || 'Payment processing failed. Please check funds.');
      }
    } catch (e: any) {
      setPaymentError(e.message || 'Payment processing failed.');
    } finally {
      setPayingInvId(null);
    }
  };

  // If order is still pending, the chat box displays an awaiting state
  const isPending = Boolean(booking && booking.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      {/* Slide-over Phone/Drawer Shell Matching Uploaded Screenshot */}
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-250 relative overflow-hidden font-normal text-slate-800">
        {/* Dark Top Navbar (Matching Screenshot Header #0e1726) */}
        <div className="bg-[#0e1726] text-white p-3 sm:px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div
            onClick={() => {
              const pId = isPreorder ? preorderTargetId : booking?.providerId;
              if (pId) openProviderProfile(pId);
            }}
            className="flex items-center gap-2.5 cursor-pointer group truncate"
            title="View Specialist Profile & Reviews"
          >
            {/* Provider Avatar with green online dot */}
            <div className="relative shrink-0">
              <img
                src={providerAvatar}
                alt={providerName}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-emerald-500/50"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0e1726]" />
            </div>

            {/* Provider Name + Verified Checkmark + Real Review / Job Data */}
            <div className="text-left truncate">
              <div className="flex items-center gap-1 truncate">
                <h3 className="text-xs sm:text-sm font-medium text-white truncate group-hover:text-sky-300 transition-colors">
                  {providerName}
                </h3>
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20 shrink-0" />
              </div>
              <p className="text-[10px] text-slate-300 flex items-center gap-1 font-light truncate">
                <span>Specialist</span>
                <span>·</span>
                <span className="text-amber-300 flex items-center gap-0.5 font-normal">
                  ★ {Number(providerRating).toFixed(2)}
                </span>
                <span className="text-slate-400 font-light">({completedJobs} jobs)</span>
              </p>
            </div>
          </div>

          {/* Action Icons: Call, Video, Storefront, Close */}
          <div className="flex items-center gap-1 text-slate-300 shrink-0">
            {/* Phone Call */}
            <button
              type="button"
              onClick={() => {
                const targetId = isPreorder ? preorderTargetId : booking?.providerId;
                if (targetId) initiateCall(targetId, providerName, 'provider', booking?.id, 'audio');
              }}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
              title="Voice Call Specialist"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Video Call */}
            <button
              type="button"
              onClick={() => {
                const targetId = isPreorder ? preorderTargetId : booking?.providerId;
                if (targetId) initiateCall(targetId, providerName, 'provider', booking?.id, 'video');
              }}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
              title="Encrypted Video Call"
            >
              <Video className="w-4 h-4 text-sky-400" />
            </button>

            {/* Storefront Catalog */}
            <button
              type="button"
              onClick={() => setIsStoreOpen(!isStoreOpen)}
              className={`p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer ${
                isStoreOpen ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/10 text-amber-400'
              }`}
              title="Specialist Storefront Catalog"
            >
              <Store className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={closeChat}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subheader: Customer Address & Live Ride Tracker Pill */}
        <div className="bg-[#0e1726]/95 text-slate-300 px-3.5 py-1.5 flex items-center justify-between border-b border-slate-800 text-[11px] shrink-0 font-light">
          <div className="flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-xs text-left">
            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
            <span className="truncate">
              <span className="text-white font-normal">You:</span> {customerAddress}
            </span>
          </div>

          {/* Clickable Real-Time Tracker Pill (Track each other like a ride) */}
          <button
            type="button"
            onClick={() => booking && openLiveTracking(booking.id)}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] font-medium transition-all cursor-pointer shrink-0"
            title="Click to track live location like a ride on Google Maps"
          >
            <Navigation className="w-2.5 h-2.5 text-indigo-300" />
            <span>{distanceKm} km away • ETA {etaMins}m</span>
          </button>
        </div>

        {/* Pending Screen Notice: If provider has not accepted yet */}
        {isPending ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-50">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 animate-pulse shadow-xs">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-xs">
              <h3 className="text-xs sm:text-sm font-medium text-slate-900">
                Awaiting Specialist Acceptance
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-light">
                The chat box will open automatically with full audio, video, and invoices once the specialist accepts.
              </p>
            </div>
            <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-[10px] text-amber-800 font-light">
              Nearby specialist has received your dispatch request.
            </div>
          </div>
        ) : (
          /* Accepted Chat State matching customer picture */
          <>
            {/* Scrollable Messages Area */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/70 relative">
              {/* Storefront Overlay */}
              {isStoreOpen && (
                <div className="absolute inset-0 bg-white z-20 flex flex-col animate-in slide-in-from-right duration-200 p-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-indigo-600" />
                      <h4 className="text-xs font-medium text-slate-900">Specialist Catalog & Store</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsStoreOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto py-2.5 space-y-2">
                    {storeProducts.length === 0 ? (
                      <div className="text-center py-10 text-[11px] text-slate-400 font-light">
                        No additional equipment cataloged for this provider.
                      </div>
                    ) : (
                      storeProducts.map((p) => (
                        <div
                          key={p.id}
                          className="p-2.5 rounded-2xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between gap-2.5 text-left"
                        >
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-medium text-slate-900 truncate">{p.name}</h5>
                            <span className="text-[11px] font-mono font-medium text-indigo-600">
                              ${p.price.toFixed(2)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              await fetch(`/api/products/${p.id}/purchase`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ customerId: currentUser?.id || 'cust-1', quantity: 1 })
                              });
                              setIsStoreOpen(false);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Buy</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Provider Acceptance Welcome Message (Matching Customer Picture) */}
              <div className="flex flex-col items-start text-left space-y-1">
                <div className="flex items-center gap-1.5 pl-1">
                  <span className="text-[10px] font-medium text-slate-600">
                    {providerName}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-light bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200">
                    Accepted at {acceptTimeFormatted}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 text-slate-700 p-3 rounded-2xl shadow-2xs text-xs leading-relaxed max-w-[92%] font-light">
                  <p>
                    Hello! I have accepted your request. I am nearby and ready to inspect and fix the issue. You can chat, place audio/video calls, or check my store catalog anytime!
                  </p>
                </div>
                <span className="text-[9px] text-slate-400 font-mono pl-1">
                  {acceptTimeFormatted}
                </span>
              </div>

              {/* In-Chat Service Invoice Card (Matching Customer Picture Exactly) */}
              {invoices.length > 0 &&
                invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="w-full bg-white border border-indigo-200 rounded-2xl p-3.5 shadow-2xs space-y-2.5 text-left animate-in zoom-in-95"
                  >
                    {/* Invoice Header */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs sm:text-sm font-medium text-slate-900 tracking-tight">
                          Service Invoice
                        </h4>
                      </div>
                      <span
                        className={`text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          inv.status === 'confirmed' || inv.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {inv.status === 'confirmed' || inv.status === 'paid' ? 'PAID' : 'AWAITING PAYMENT'}
                      </span>
                    </div>

                    {/* Breakdown rows */}
                    <div className="space-y-1 text-xs text-slate-600 font-light">
                      <div className="flex justify-between items-center">
                        <span>Labor Service:</span>
                        <span className="font-mono text-slate-800 font-normal">
                          ${inv.laborAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Materials & Hardware:</span>
                        <span className="font-mono text-slate-800 font-normal">
                          ${inv.materialsAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400 text-[11px]">
                        <span>Platform Consultation Fee:</span>
                        <span className="font-mono">${inv.consultationFee.toFixed(2)}</span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-100 flex justify-between items-center font-normal">
                        <span className="text-xs text-slate-900">Total Amount:</span>
                        <span className="text-sm text-indigo-600 font-mono font-medium">
                          ${inv.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Pay in Chat button (Customer can pay by card, wallet, or COD) */}
                    {inv.status === 'pending' ? (
                      currentUser?.role !== 'provider' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setShowPaymentModal(inv);
                            setPaymentError(null);
                            setPaymentSuccess(null);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay ${inv.totalAmount.toFixed(2)} in Chat</span>
                        </button>
                      ) : (
                        <div className="text-center py-1.5 text-[11px] font-normal text-amber-800 bg-amber-50 rounded-xl border border-amber-200">
                          Awaiting Customer Payment (${inv.totalAmount.toFixed(2)})
                        </div>
                      )
                    ) : (
                      <div className="text-center py-1.5 text-[11px] font-normal text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          Payment Completed ({inv.paymentMethod === 'credit' ? 'Wallet' : inv.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'})
                        </span>
                      </div>
                    )}
                  </div>
                ))}

              {/* Dynamic Conversation Messages */}
              {messages
                .filter((m) => !m.text.includes('accepted your request'))
                .map((msg) => {
                  const isMe = msg.senderId === currentUser?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} text-left`}
                    >
                      {!isMe && (
                        <span className="text-[9px] text-slate-400 font-normal mb-0.5 pl-1">
                          {msg.senderName || providerName}
                        </span>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl p-2.5 text-xs leading-relaxed shadow-2xs font-light ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                        }`}
                      >
                        {/* Attached video */}
                        {msg.mediaType === 'video' && msg.mediaUrl && (
                          <div className="mb-1.5 rounded-xl overflow-hidden bg-black">
                            <video
                              src={msg.mediaUrl}
                              controls
                              playsInline
                              className="w-full max-h-44 rounded-xl object-contain bg-black"
                            />
                          </div>
                        )}

                        {/* Attached photo */}
                        {msg.mediaType === 'image' && msg.mediaUrl && (
                          <div className="mb-1.5 rounded-xl overflow-hidden bg-slate-100">
                            <img
                              src={msg.mediaUrl}
                              alt="Problem attachment"
                              className="w-full max-h-48 rounded-xl object-cover"
                            />
                          </div>
                        )}

                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>

                      <div className="flex items-center gap-1 mt-0.5 text-[9px] text-slate-400">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {isMe && <CheckCheck className="w-3 h-3 text-indigo-500" />}
                      </div>
                    </div>
                  );
                })}

              <div ref={messagesEndRef} />
            </div>

            {/* Attached Photo / Video Preview Banner before sending */}
            {attachedMedia && (
              <div className="p-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2 text-left">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                    {attachedMedia.type === 'video' ? (
                      <video src={attachedMedia.dataUrl} className="w-full h-full object-cover" />
                    ) : (
                      <img src={attachedMedia.dataUrl} alt="Attached" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="truncate">
                    <p className="text-[11px] font-medium text-slate-900 truncate">{attachedMedia.name}</p>
                    <span className="text-[9px] text-slate-500 font-light">Attached for specialist</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedMedia(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Bottom Message Input Bar */}
            <div className="p-2.5 bg-white border-t border-slate-200 shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleMediaSelect}
                />

                {/* Upload Picture / Video Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center"
                  title="Upload picture or video of your problem"
                >
                  <Paperclip className="w-4 h-4 text-slate-600" />
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={inputText || ''}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message or details..."
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 min-h-[38px] font-light"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() && !attachedMedia}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-all cursor-pointer shadow-2xs shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center"
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </>
        )}

        {/* Modal: Pay in Chat (Card, Wallet, or Cash on Delivery COD) */}
        {showPaymentModal && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl p-4 max-w-xs w-full shadow-xl border border-slate-200 space-y-3 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-slate-900">Pay Service Invoice</h4>
                  <p className="text-[10px] text-slate-500 font-light">Invoice #{showPaymentModal.id.slice(-6)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between">
                <span className="text-xs font-normal text-indigo-900">Total Amount:</span>
                <span className="text-sm font-medium text-indigo-700 font-mono">
                  ${showPaymentModal.totalAmount.toFixed(2)}
                </span>
              </div>

              {paymentError && (
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-[10px] text-rose-700 font-light flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {paymentSuccess && (
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 font-light flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{paymentSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">
                  Payment Method:
                </p>

                {/* Option 1: Card */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    selectedPaymentMethod === 'card'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      selectedPaymentMethod === 'card' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-900 block">Credit / Debit Card</span>
                    <p className="text-[10px] text-slate-500 font-light">Pay instantly with payment card</p>
                  </div>
                </button>

                {/* Option 2: Wallet Balance */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('credit')}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    selectedPaymentMethod === 'credit'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      selectedPaymentMethod === 'credit' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-900">Wallet Balance</span>
                      <span className="text-xs font-mono font-medium text-slate-800">
                        ${(currentUser?.walletBalance || 0).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-light">Deduct from wallet balance</p>
                  </div>
                </button>

                {/* Option 3: Cash on Delivery (COD) */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('cod')}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    selectedPaymentMethod === 'cod'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      selectedPaymentMethod === 'cod' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-900 block">Cash on Delivery (COD)</span>
                    <p className="text-[10px] text-slate-500 font-light">Pay cash to specialist on site upon completion</p>
                  </div>
                </button>
              </div>

              <button
                type="button"
                disabled={Boolean(payingInvId)}
                onClick={() => handlePayInvoice(showPaymentModal.id, selectedPaymentMethod)}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Confirm Payment (${showPaymentModal.totalAmount.toFixed(2)})</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
