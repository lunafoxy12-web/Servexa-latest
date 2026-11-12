import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProductOrder, Booking, ProductOrderStatus } from '../../types';
import { sendRealtimePushNotification } from '../../services/fcmNotificationService';
import {
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Phone,
  DollarSign,
  AlertCircle,
  Truck,
  ShieldCheck,
  Check,
  X,
  BellRing
} from 'lucide-react';

export const ProviderIncomingOrders: React.FC = () => {
  const { currentUser, globalRefreshKey, triggerGlobalRefresh, openLiveTracking } = useAuth();
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_transit' | 'delivered'>('all');
  const [editingTrackOrderId, setEditingTrackOrderId] = useState<string | null>(null);
  const [trackNumberInput, setTrackNumberInput] = useState('');
  const [carrierInput, setCarrierInput] = useState('Servexa Courier');

  // Fetch orders for this provider
  const loadIncomingOrders = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/orders?providerId=${currentUser.id}`);
      if (res.ok) {
        const data: ProductOrder[] = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.debug('Failed to fetch incoming orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncomingOrders();
  }, [currentUser?.id, globalRefreshKey]);

  // Handle Provider Updating Order Status & Tracking Number
  const handleUpdateOrderStatus = async (
    order: ProductOrder,
    status: ProductOrderStatus,
    trackingNumber?: string,
    carrierOrCourier?: string
  ) => {
    setProcessingId(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          carrierOrCourier: carrierOrCourier || order.trackingInfo?.carrierOrCourier || 'Servexa Courier',
          trackingNumber: trackingNumber || order.trackingInfo?.trackingNumber || undefined,
          dispatchNote: `Status updated to ${status.toUpperCase()} by provider.`
        })
      });

      if (res.ok) {
        setActionSuccessMessage(`Order #${order.orderNumber} updated to ${status.toUpperCase()}!`);
        setTimeout(() => setActionSuccessMessage(null), 3500);
        setEditingTrackOrderId(null);
        setTrackNumberInput('');
        triggerGlobalRefresh();
        loadIncomingOrders();
      }
    } catch (err) {
      console.warn('Status update error:', err);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Provider Accepting the Order
  const handleAcceptOrder = async (order: ProductOrder) => {
    setProcessingId(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'confirmed',
          carrierOrCourier: 'Servexa Rapid Dispatch',
          dispatchNote: `Accepted by ${currentUser?.name || 'Service Provider'}. Packing in progress.`
        })
      });

      if (res.ok) {
        // Send real-time FCM Push Notification to Customer
        await sendRealtimePushNotification({
          userId: order.customerId,
          title: 'Order Accepted by Specialist! 📦',
          body: `Good news! Your order #${order.orderNumber} for "${order.productName}" was accepted by ${currentUser?.name || 'specialist'}. Dispatch preparation has started.`,
          type: 'order_update',
          role: 'customer',
          data: { orderId: order.id, status: 'confirmed' }
        });

        setActionSuccessMessage(`Order #${order.orderNumber} Accepted successfully! Customer notified via FCM push.`);
        setTimeout(() => setActionSuccessMessage(null), 4500);
        triggerGlobalRefresh();
        loadIncomingOrders();
      }
    } catch (err) {
      console.warn('Accept order error:', err);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Provider Rejecting the Order
  const handleRejectOrder = async (order: ProductOrder) => {
    if (!window.confirm(`Are you sure you want to reject Order #${order.orderNumber}? The customer will be refunded automatically.`)) {
      return;
    }

    setProcessingId(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          dispatchNote: `Declined by provider due to current capacity. Full refund processed.`
        })
      });

      if (res.ok) {
        // Send real-time FCM Push Notification to Customer
        await sendRealtimePushNotification({
          userId: order.customerId,
          title: 'Order Update: Request Cancelled ⚠️',
          body: `Order #${order.orderNumber} could not be fulfilled by provider. $${order.totalAmount} has been refunded to your wallet.`,
          type: 'order_update',
          role: 'customer',
          data: { orderId: order.id, status: 'cancelled' }
        });

        setActionSuccessMessage(`Order #${order.orderNumber} was cancelled and customer refunded.`);
        setTimeout(() => setActionSuccessMessage(null), 4500);
        triggerGlobalRefresh();
        loadIncomingOrders();
      }
    } catch (err) {
      console.warn('Reject order error:', err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && orders.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Header with Live Status & Count Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700">
            <BellRing className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Live Incoming Orders & Dispatches
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-2xs">
                {orders.length} Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and immediately accept customer equipment purchases or dispatch requests
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>FCM Live Sync Active</span>
          </span>
        </div>
      </div>

      {/* Success alert notice */}
      {actionSuccessMessage && (
        <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No pending orders at the moment</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You're all caught up! New orders placed by customers or triggered via Servexa AI voice will appear here instantly with push notifications.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => {
            const isProcessing = processingId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Order Number, Tag, Amount */}
                  <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-700">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            order.orderStatus === 'pending'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>Placed recently</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-extrabold text-slate-900 block">
                        ${order.totalAmount?.toFixed(2) || '0.00'}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {order.paymentStatus === 'paid' ? 'Paid via Wallet/Card' : 'Pending Payment'}
                      </span>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="flex items-start gap-3 mb-3">
                    {order.productImage ? (
                      <img
                        src={order.productImage}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {order.productName}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Quantity: <strong className="text-slate-800">{order.quantity} unit(s)</strong> • Unit: ${order.productPrice?.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Customer Information & Address */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs text-slate-600 mb-4">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>Customer: {order.customerName}</span>
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:underline text-[11px]"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{order.customerPhone || 'Call'}</span>
                      </a>
                    </div>
                    {order.deliveryAddress && (
                      <div className="flex items-start gap-1.5 text-[11px] text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>
                          {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zip}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Actions & Status Controls */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {/* Tracking Number Display or Inline Editor */}
                  {order.trackingInfo?.trackingNumber ? (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs">
                      <div className="flex items-center gap-1.5 text-indigo-900">
                        <Truck className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="font-semibold">{order.trackingInfo.carrierOrCourier || 'Courier'}:</span>
                        <span className="font-mono font-bold">{order.trackingInfo.trackingNumber}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTrackOrderId(order.id);
                          setTrackNumberInput(order.trackingInfo?.trackingNumber || '');
                          setCarrierInput(order.trackingInfo?.carrierOrCourier || 'Servexa Courier');
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        Edit Track #
                      </button>
                    </div>
                  ) : editingTrackOrderId === order.id ? (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 animate-in fade-in">
                      <span className="text-[10px] font-bold text-slate-700 block">Add Tracking Details:</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={carrierInput || ''}
                          onChange={(e) => setCarrierInput(e.target.value)}
                          placeholder="Courier (e.g. FedEx)"
                          className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                        />
                        <input
                          type="text"
                          value={trackNumberInput || ''}
                          onChange={(e) => setTrackNumberInput(e.target.value)}
                          placeholder="Track Number #"
                          className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-mono"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingTrackOrderId(null)}
                          className="px-2 py-1 rounded text-[10px] text-slate-500 hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order, 'dispatched', trackNumberInput, carrierInput)}
                          className="px-2.5 py-1 rounded bg-indigo-600 text-white font-bold text-[10px] cursor-pointer"
                        >
                          Save & Dispatch
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Actions for Pending Orders */}
                  {order.orderStatus === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAcceptOrder(order)}
                        disabled={isProcessing}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isProcessing ? 'Updating...' : 'Accept Order'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectOrder(order)}
                        disabled={isProcessing}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}

                  {/* Actions for Confirmed / Processing / Dispatched Orders */}
                  {order.orderStatus !== 'pending' && (
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        {order.orderStatus !== 'dispatched' && order.orderStatus !== 'delivered' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!order.trackingInfo?.trackingNumber && editingTrackOrderId !== order.id) {
                                setEditingTrackOrderId(order.id);
                              } else {
                                handleUpdateOrderStatus(order, 'dispatched');
                              }
                            }}
                            disabled={isProcessing}
                            className="py-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Mark Dispatched</span>
                          </button>
                        )}

                        {order.orderStatus === 'dispatched' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order, 'delivered')}
                            disabled={isProcessing}
                            className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Delivered</span>
                          </button>
                        )}

                        {order.orderStatus === 'delivered' && (
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Completed & Delivered
                          </span>
                        )}
                      </div>

                      {/* Live Tracker Button (No PIN required) */}
                      <button
                        type="button"
                        onClick={() => openLiveTracking(order.id)}
                        className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                        title="Live GPS Tracking (No PIN required)"
                      >
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Track Map</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
