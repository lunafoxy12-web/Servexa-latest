import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Booking } from '../../types';
import { DualDeviceTrackingMap } from './DualDeviceTrackingMap';
import {
  X,
  MapPin,
  Navigation,
  Compass,
  PhoneCall,
  MessageSquare,
  AlertTriangle,
  Radio,
  Clock,
  ShieldCheck,
  Gauge,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  KeyRound,
  Car,
  Smartphone,
  Layers,
  ChevronRight
} from 'lucide-react';

export const LiveOrderTrackerModal: React.FC = () => {
  const {
    activeTrackingBookingId,
    openLiveTracking,
    closeLiveTracking,
    initiateCall,
    openChat,
    openFileComplaint,
    currentUser,
    triggerGlobalRefresh
  } = useAuth();

  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  // Live telemetry for both devices
  const [currentProviderCoords, setCurrentProviderCoords] = useState<{ lat: number; lng: number }>({
    lat: 37.7833,
    lng: -122.4167
  });
  const [currentCustomerCoords, setCurrentCustomerCoords] = useState<{ lat: number; lng: number }>({
    lat: 37.7749,
    lng: -122.4194
  });
  const [heading, setHeading] = useState(42);
  const [speedKmH, setSpeedKmH] = useState(38);
  const [etaMinutes, setEtaMinutes] = useState(6);
  const [distanceKm, setDistanceKm] = useState(1.8);
  const [isSimulatingTransit, setIsSimulatingTransit] = useState(true);
  const [isSharingDeviceGps, setIsSharingDeviceGps] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [isFullScreenMap, setIsFullScreenMap] = useState(false);

  // Close full screen on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreenMap) {
        setIsFullScreenMap(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreenMap]);

  // PIN Verification State (Deprecated: No PIN required)
  const [enteredPin, setEnteredPin] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [pinVerificationMsg, setPinVerificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingCarrier, setTrackingCarrier] = useState('Servexa Express');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusSuccessMsg, setStatusSuccessMsg] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);

  // 1. Fetch all bookings to support multi-order tracking - strictly scoped to user account
  const fetchAllBookings = useCallback(() => {
    fetch('/api/bookings')
      .then((res) => res.json())
      .then((bks: Booking[]) => {
        if (Array.isArray(bks)) {
          // STRICT SECURITY: Users can only see and track their own orders
          const userFiltered = bks.filter((b) => {
            if (currentUser?.role === 'admin') return true;
            if (currentUser?.role === 'provider') {
              return b.providerId === currentUser?.id;
            }
            return (
              b.customerId === currentUser?.id ||
              (currentUser?.email && b.customerEmail === currentUser?.email)
            );
          });

          setAllBookings(userFiltered);
          const found = userFiltered.find((b) => b.id === activeTrackingBookingId);
          if (found) {
            setCurrentBooking(found);
          } else {
            setCurrentBooking(null);
          }
        }
      })
      .catch((err) => {
        console.warn('LiveOrderTracker fetch bookings note:', err?.message || err);
      });
  }, [activeTrackingBookingId, currentUser?.id, currentUser?.email, currentUser?.role]);

  useEffect(() => {
    fetchAllBookings();
  }, [fetchAllBookings]);

  // 2. Fetch tracking telemetry for currently selected order
  useEffect(() => {
    if (!activeTrackingBookingId) return;

    setLoading(true);
    fetch(`/api/bookings/${activeTrackingBookingId}/tracking`)
      .then((res) => res.json())
      .then((data) => {
        if (data.providerLocation) {
          setCurrentProviderCoords({
            lat: Number(data.providerLocation.lat),
            lng: Number(data.providerLocation.lng)
          });
        }
        if (data.customerLocation) {
          setCurrentCustomerCoords({
            lat: Number(data.customerLocation.lat),
            lng: Number(data.customerLocation.lng)
          });
        }
        if (data.heading) setHeading(Number(data.heading));
        if (data.speedKmH) setSpeedKmH(Number(data.speedKmH));
      })
      .catch((err) => {
        console.warn('LiveOrderTracker fetch tracking note:', err?.message || err);
      })
      .finally(() => setLoading(false));

    // Periodic sync across multiple devices & providers
    const interval = setInterval(() => {
      fetch(`/api/bookings/${activeTrackingBookingId}/tracking`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status && currentBooking?.status !== data.status) {
            setCurrentBooking((prev) => (prev ? { ...prev, status: data.status, deliveryVerified: data.deliveryVerified } : null));
          }
        })
        .catch(() => {});
    }, 3500);

    return () => clearInterval(interval);
  }, [activeTrackingBookingId, currentBooking?.status]);

  // Calculate distance and ETA dynamically based on device coordinates
  useEffect(() => {
    const latDiff = (currentCustomerCoords.lat - currentProviderCoords.lat) * 111;
    const lngDiff = (currentCustomerCoords.lng - currentProviderCoords.lng) * 85;
    const dist = Math.max(0.05, Math.sqrt(latDiff * latDiff + lngDiff * lngDiff));
    setDistanceKm(parseFloat(dist.toFixed(2)));
    setEtaMinutes(Math.max(1, Math.round(dist * 3.2)));
  }, [currentCustomerCoords, currentProviderCoords]);

  // 3. Smooth Transit Simulation: advances specialist device towards customer destination
  useEffect(() => {
    if (!isSimulatingTransit || !activeTrackingBookingId) return;
    if (currentBooking?.status === 'completed' || currentBooking?.deliveryVerified) return;

    const interval = setInterval(() => {
      setCurrentProviderCoords((prev) => {
        const dLat = (currentCustomerCoords.lat - prev.lat) * 0.05;
        const dLng = (currentCustomerCoords.lng - prev.lng) * 0.05;

        // If very close, stop moving
        if (Math.abs(dLat) < 0.00005 && Math.abs(dLng) < 0.00005) {
          setSpeedKmH(0);
          return prev;
        }

        const nextLat = prev.lat + dLat;
        const nextLng = prev.lng + dLng;

        // Compute angle/heading towards customer
        const angleRad = Math.atan2(dLng, dLat);
        const deg = ((angleRad * 180) / Math.PI + 360) % 360;
        setHeading(Math.round(deg));
        setSpeedKmH(Math.round(32 + Math.sin(Date.now() / 1500) * 6));

        // Periodically sync live coordinates to backend
        fetch(`/api/bookings/${activeTrackingBookingId}/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'provider',
            lat: nextLat,
            lng: nextLng,
            speed: speedKmH,
            heading: Math.round(deg)
          })
        }).catch(() => {});

        return { lat: nextLat, lng: nextLng };
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [
    isSimulatingTransit,
    currentCustomerCoords,
    activeTrackingBookingId,
    speedKmH,
    currentBooking?.status,
    currentBooking?.deliveryVerified
  ]);

  // 4. Real Browser Device GPS Lock (navigator.geolocation)
  const handleToggleDeviceGps = () => {
    if (isSharingDeviceGps) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsSharingDeviceGps(false);
      setGpsStatusMessage('Device GPS broadcasting paused.');
      return;
    }

    if (!('geolocation' in navigator)) {
      setGpsStatusMessage('Geolocation not supported by device browser.');
      return;
    }

    setGpsStatusMessage('Acquiring high-precision device GPS lock...');
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, heading: dir } = pos.coords;
        setIsSharingDeviceGps(true);
        setGpsStatusMessage(
          `GPS Active: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(pos.coords.accuracy)}m)`
        );

        if (currentUser?.role === 'provider') {
          setCurrentProviderCoords({ lat: latitude, lng: longitude });
        } else {
          setCurrentCustomerCoords({ lat: latitude, lng: longitude });
        }

        if (activeTrackingBookingId) {
          fetch(`/api/bookings/${activeTrackingBookingId}/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: currentUser?.role || 'customer',
              lat: latitude,
              lng: longitude,
              speed: speed ? Math.round(speed * 3.6) : undefined,
              heading: dir || undefined
            })
          }).catch((err) => {
            console.warn('LiveOrderTracker location sync note:', err?.message || err);
          });
        }
      },
      (err) => {
        setGpsStatusMessage(`GPS: ${err.message}. Using high-precision network coordinates.`);
        setIsSharingDeviceGps(false);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    watchIdRef.current = id;
  };

  // Provider Status & Tracking Number Updater (No PIN required)
  const handleUpdateStatus = async (newStatus: string) => {
    if (!activeTrackingBookingId) return;
    setIsUpdatingStatus(true);
    setStatusSuccessMsg(null);
    try {
      // 1. Update booking status
      const res = await fetch(`/api/bookings/${activeTrackingBookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.booking) setCurrentBooking(data.booking);
      }

      // 2. Also update product order if active tracking ID is a product order
      await fetch(`/api/orders/${activeTrackingBookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          carrierOrCourier: trackingCarrier || 'Servexa Express',
          trackingNumber: trackingInput || undefined
        })
      });

      setStatusSuccessMsg(`Status updated to ${newStatus.toUpperCase()}!`);
      setTimeout(() => setStatusSuccessMsg(null), 3000);
      fetchAllBookings();
      triggerGlobalRefresh();
    } catch (err: any) {
      console.warn('Status update error:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const copyOrderId = () => {
    if (!activeTrackingBookingId) return;
    navigator.clipboard.writeText(activeTrackingBookingId);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2000);
  };

  if (!activeTrackingBookingId) return null;

  // Filter relevant active orders for multi-order switcher - strictly user-owned
  const relevantOrders = allBookings.filter((b) => {
    if (currentUser?.role === 'admin') return true;
    if (currentUser?.role === 'provider') {
      return b.providerId === currentUser?.id;
    }
    return b.customerId === currentUser?.id || (currentUser?.email && b.customerEmail === currentUser?.email);
  });

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'on_the_way':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-900 border border-emerald-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            On The Way
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-900 border border-blue-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            In Progress
          </span>
        );
      case 'arrived':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900 border border-amber-300">
            <CheckCircle2 className="w-3 h-3 text-amber-600" />
            Arrived on Site
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-900 border border-indigo-200">
            <CheckCircle2 className="w-3 h-3 text-indigo-600" />
            Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
            Pending
          </span>
        );
    }
  };

  const currentStatus = currentBooking?.status || 'on_the_way';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header: Order Number & Close */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-semibold tracking-tight font-mono text-white">
                  Order #{activeTrackingBookingId}
                </h2>
                <button
                  type="button"
                  onClick={copyOrderId}
                  className="text-slate-400 hover:text-white p-0.5 transition-colors cursor-pointer"
                  title="Copy Order ID"
                >
                  <Copy className="w-3 h-3" />
                </button>
                {copiedOrderId && (
                  <span className="text-[9px] text-emerald-400 font-medium">Copied!</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                {currentBooking?.serviceName || 'Service Dispatch'} • {currentBooking?.providerName || 'Specialist'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge(currentStatus)}
            <button
              type="button"
              onClick={closeLiveTracking}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
              title="Close Tracker"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Multi-Order Tabs Switcher (If multiple orders exist for this user) */}
        {relevantOrders.length > 1 && (
          <div className="px-4 py-1.5 bg-slate-950 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-400" />
              Your Orders ({relevantOrders.length}):
            </span>
            {relevantOrders.map((order) => {
              const isSelected = order.id === activeTrackingBookingId;
              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => openLiveTracking(order.id)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-medium shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>#{order.id}</span>
                  <span className="text-[8px] opacity-75 capitalize">({order.status.replace('_', ' ')})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Live Distance & ETA Metrics Ribbon - Compact & Clean */}
        <div className="grid grid-cols-3 gap-px bg-slate-200 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-center shrink-0">
          <div className="bg-white dark:bg-slate-900 p-2">
            <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] font-medium">
              <Clock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>Est. Arrival</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5">
              {etaMinutes} <span className="text-[10px] font-normal text-slate-500">mins</span>
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2">
            <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] font-medium">
              <Navigation className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Distance</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5">
              {distanceKm} <span className="text-[10px] font-normal text-slate-500">km</span>
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2">
            <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] font-medium">
              <Gauge className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>Speed</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5">
              {speedKmH} <span className="text-[10px] font-normal text-slate-500">km/h</span>
            </p>
          </div>
        </div>

        {/* Stable Glitch-Free Dual Device Map Canvas */}
        <div className="relative flex-1 min-h-[300px] bg-slate-950 overflow-hidden">
          <DualDeviceTrackingMap
            orderNumber={activeTrackingBookingId}
            providerCoords={currentProviderCoords}
            customerCoords={currentCustomerCoords}
            providerName={currentBooking?.providerName || 'Specialist'}
            customerName={currentBooking?.customerName || 'Customer'}
            serviceName={currentBooking?.serviceName || 'Service Dispatch'}
            speedKmH={speedKmH}
            heading={heading}
            status={currentStatus}
            customerAddress={currentBooking?.destinationLocation?.address || currentBooking?.pickupLocation?.address}
            className="w-full h-full min-h-[300px]"
            isFullScreen={false}
            onToggleFullScreen={() => setIsFullScreenMap(true)}
          />
        </div>

        {/* Full Screen Interactive Tracking Map Overlay */}
        {isFullScreenMap && (
          <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col w-screen h-screen animate-in fade-in zoom-in-95 duration-200">
            <DualDeviceTrackingMap
              orderNumber={activeTrackingBookingId}
              providerCoords={currentProviderCoords}
              customerCoords={currentCustomerCoords}
              providerName={currentBooking?.providerName || 'Specialist'}
              customerName={currentBooking?.customerName || 'Customer'}
              serviceName={currentBooking?.serviceName || 'Service Dispatch'}
              speedKmH={speedKmH}
              heading={heading}
              status={currentStatus}
              customerAddress={currentBooking?.destinationLocation?.address || currentBooking?.pickupLocation?.address}
              className="w-full h-full flex-1"
              isFullScreen={true}
              onToggleFullScreen={() => setIsFullScreenMap(false)}
              onGoBack={() => setIsFullScreenMap(false)}
            />
          </div>
        )}

        {/* Real-Time Status & Tracking Bar (No PIN Required) */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status:</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
              {currentStatus.replace(/_/g, ' ')}
            </span>
            {statusSuccessMsg && (
              <span className="text-[10px] font-bold text-emerald-600 animate-in fade-in">
                {statusSuccessMsg}
              </span>
            )}
          </div>

          {/* Provider Controls: Direct Status Updating & Track Number */}
          {currentUser?.role === 'provider' ? (
            <div className="flex flex-wrap items-center gap-1.5 ml-auto">
              {/* Quick Status Buttons */}
              {currentStatus !== 'on_the_way' && currentStatus !== 'completed' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('on_the_way')}
                  disabled={isUpdatingStatus}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                >
                  On The Way
                </button>
              )}

              {currentStatus !== 'arrived' && currentStatus !== 'completed' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('arrived')}
                  disabled={isUpdatingStatus}
                  className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                >
                  Arrived
                </button>
              )}

              {currentStatus !== 'completed' && currentStatus !== 'delivered' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('completed')}
                  disabled={isUpdatingStatus}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                >
                  Delivered / Done
                </button>
              )}

              {/* Tracking Number Input */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded-lg border border-slate-300 dark:border-slate-600">
                <input
                  type="text"
                  value={trackingInput || ''}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="Track # / Courier"
                  className="w-24 text-[10px] bg-transparent text-slate-800 dark:text-white focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(currentStatus)}
                  className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[9px] font-bold cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            /* Customer View: Live Status & Tracking Info */
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">
                Live GPS Active • No PIN required
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions: Provider Info & Action Buttons */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-semibold text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0">
              {currentBooking?.providerName?.charAt(0) || 'S'}
            </div>
            <div className="truncate">
              <h4 className="text-xs font-medium text-slate-900 dark:text-white truncate">
                {currentBooking?.providerName || 'Assigned Specialist'}
              </h4>
              <p className="text-[10px] text-slate-400 font-light">
                GPS Verified
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                closeLiveTracking();
                openFileComplaint(activeTrackingBookingId);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 hover:bg-rose-50 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Dispute</span>
            </button>

            <button
              type="button"
              onClick={() => {
                closeLiveTracking();
                openChat(activeTrackingBookingId);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentBooking) {
                  closeLiveTracking();
                  initiateCall(currentBooking.providerId, currentBooking.providerName, 'provider', currentBooking.id);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
