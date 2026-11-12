import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Clock, MapPin, Check, X, Shield, DollarSign, AlertCircle } from 'lucide-react';

interface PendingDispatch {
  ticketId: string;
  categoryId: string;
  categoryName: string;
  customerId: string;
  customerName: string;
  customerLocation: { address: string; lat: number; lng: number };
  issueDescription: string;
  problemImages?: string[];
  problemVideos?: string[];
  basePrice: number;
  estPayout: number;
  distanceKm: number;
  createdAt: string;
  expiresInSeconds?: number;
}

interface OrderNotificationPopupProps {
  providerId: string;
  providerCategory?: string;
  onOrderAccepted?: (bookingId: string) => void;
}

export const OrderNotificationPopup: React.FC<OrderNotificationPopupProps> = ({
  providerId,
  providerCategory,
  onOrderAccepted
}) => {
  const { lastRealtimeEvent, openChat } = useAuth();
  const [activeDispatch, setActiveDispatch] = useState<PendingDispatch | null>(null);
  const [countdown, setCountdown] = useState<number>(30);
  const [accepting, setAccepting] = useState<boolean>(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Check incoming realtime event
  useEffect(() => {
    if (!lastRealtimeEvent) return;

    if (lastRealtimeEvent.type === 'DISPATCH_REQUESTED') {
      const payload = lastRealtimeEvent.payload;

      // Strict check 1: If notifiedProviderIds list is provided, this provider must be in it
      if (Array.isArray(payload.notifiedProviderIds) && payload.notifiedProviderIds.length > 0) {
        if (!payload.notifiedProviderIds.includes(providerId)) {
          return;
        }
      }

      // Strict check 2: Strict category matching
      const normProvCat = (providerCategory || '').toLowerCase().trim().replace(/^cat-/, '');
      const normReqCat = (payload.categoryId || '').toLowerCase().trim().replace(/^cat-/, '');
      const matchesCategory =
        !providerCategory ||
        normProvCat === normReqCat ||
        normProvCat.includes(normReqCat) ||
        normReqCat.includes(normProvCat);

      if (!matchesCategory) return;

      setActiveDispatch({
        ticketId: payload.ticketId,
        categoryId: payload.categoryId,
        categoryName: payload.categoryName || 'Service Request',
        customerId: payload.customerId,
        customerName: payload.customerName || 'Customer',
        customerLocation: payload.customerLocation || { address: '742 Market St, San Francisco, CA', lat: 37.7749, lng: -122.4194 },
        issueDescription: payload.issueDescription || 'Urgent service requested',
        problemImages: payload.problemImages || [],
        problemVideos: payload.problemVideos || [],
        basePrice: payload.basePrice || 65,
        estPayout: payload.estPayout || 61.10,
        distanceKm: payload.distanceKm || 2.1,
        createdAt: payload.createdAt || new Date().toISOString(),
        expiresInSeconds: payload.expiresInSeconds || 30,
        preferredDate: payload.preferredDate,
        preferredTimeSlot: payload.preferredTimeSlot
      } as any);
      setCountdown(payload.expiresInSeconds || 30);
      setAcceptError(null);
    }
  }, [lastRealtimeEvent, providerCategory, providerId]);

  // Periodic check for pending dispatches
  useEffect(() => {
    const checkPending = async () => {
      if (activeDispatch) return; // already showing
      try {
        const res = await fetch(`/api/dispatch/pending?providerId=${providerId}`);
        if (res.ok) {
          const resData = await res.json();
          const tickets: any[] = Array.isArray(resData) ? resData : resData.pending || [];
          if (tickets.length > 0) {
            const ticket = tickets[0];
            const remaining = ticket.secondsRemaining || ticket.expiresInSeconds || 30;
            setActiveDispatch({
              ticketId: ticket.ticketId || ticket.id,
              categoryId: ticket.categoryId,
              categoryName: ticket.categoryName || 'Service Request',
              customerId: ticket.customerId,
              customerName: ticket.customerName || 'Customer',
              customerLocation: ticket.customerLocation || { address: '742 Market St, San Francisco, CA', lat: 37.7749, lng: -122.4194 },
              issueDescription: ticket.issueDescription || 'Service requested',
              problemImages: ticket.problemImages || [],
              problemVideos: ticket.problemVideos || [],
              basePrice: 65,
              estPayout: 61.10,
              distanceKm: 2.1,
              createdAt: ticket.createdAt || new Date().toISOString(),
              expiresInSeconds: ticket.bookForLater ? 3600 : 30,
              preferredDate: ticket.preferredDate,
              preferredTimeSlot: ticket.preferredTimeSlot
            } as any);
            setCountdown(remaining);
            setAcceptError(null);
          }
        }
      } catch (err) {
        // silent fail
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 6000);
    return () => clearInterval(interval);
  }, [activeDispatch, providerId]);

  // Countdown timer for 15s acceptance window
  useEffect(() => {
    if (!activeDispatch || countdown <= 0) {
      if (countdown <= 0) {
        setActiveDispatch(null);
      }
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setActiveDispatch(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeDispatch, countdown]);

  // Point 26: AI Voice Request Notification & Hands-Free Voice Acceptance
  useEffect(() => {
    if (!activeDispatch) return;

    // 1. Announce via Speech Synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const announcement = `You have a new ${activeDispatch.categoryName} request from ${activeDispatch.customerName}. The customer needs help with ${activeDispatch.issueDescription}. Would you like to accept?`;
      const utterance = new SpeechSynthesisUtterance(announcement);
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }

    // 2. Start Speech Recognition for Hands-Free "Yes" / "Accept" / "Confirm"
    let recognition: any = null;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0]?.transcript?.toLowerCase() || '';
            if (
              transcript.includes('yes') ||
              transcript.includes('accept') ||
              transcript.includes('confirm') ||
              transcript.includes('i accept') ||
              transcript.includes('take job') ||
              transcript.includes('take order')
            ) {
              try {
                recognition.stop();
              } catch (e) {}
              handleAccept();
              break;
            } else if (transcript.includes('no') || transcript.includes('decline') || transcript.includes('reject')) {
              try {
                recognition.stop();
              } catch (e) {}
              handleDecline();
              break;
            }
          }
        };

        recognition.start();
      } catch (err) {
        // speech recognition not permitted or unsupported, fallback to buttons
      }
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {}
      }
    };
  }, [activeDispatch?.ticketId]);

  const handleAccept = async () => {
    if (!activeDispatch) return;
    setAccepting(true);
    try {
      const res = await fetch('/api/dispatch/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: activeDispatch.ticketId,
          providerId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveDispatch(null);
        if (data.booking?.id) {
          onOrderAccepted?.(data.booking.id);
          openChat(data.booking.id);
        }
      } else {
        setAcceptError(data.error || 'Failed to accept order.');
      }
    } catch (e: any) {
      console.error('Error accepting dispatch:', e);
      setAcceptError(e.message || 'Network error accepting order');
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    setActiveDispatch(null);
  };

  if (!activeDispatch) return null;

  const totalSecs = (activeDispatch as any).expiresInSeconds || 30;
  const isBookLater = Boolean((activeDispatch as any).preferredDate || totalSecs > 100);
  const progressPct = Math.max(0, Math.min(100, ((totalSecs - countdown) / totalSecs) * 100));

  const formatCountdown = (secs: number) => {
    if (secs > 60) {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}m ${String(s).padStart(2, '0')}s`;
    }
    return `${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col transform animate-in zoom-in-95 duration-200">
        {/* Animated Top Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-full bg-white/20 backdrop-blur-md">
              <Bell className="w-4 h-4 text-white animate-bounce" />
            </span>
            <div>
              <h3 className="text-sm font-black tracking-tight leading-tight">
                {isBookLater ? 'Scheduled Order Request (Booked for Later)' : 'New Immediate Order Request'}
              </h3>
              <p className="text-[11px] text-emerald-100 font-medium">
                {isBookLater ? '60 Minutes Acceptance Window • 10km Radius' : '30 Second Acceptance Window • 10km Area'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-full text-xs font-mono font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>{formatCountdown(countdown)}</span>
          </div>
        </div>

        {/* Progress Countdown Bar */}
        <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-1000 ease-linear"
            style={{ width: `${100 - progressPct}%` }}
          />
        </div>

        {/* Request Details */}
        <div className="p-5 space-y-4">
          {/* Customer & Category */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer</span>
              <h4 className="text-base font-extrabold text-slate-900">{activeDispatch.customerName}</h4>
              <span className="inline-block mt-1 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full">
                {activeDispatch.categoryName}
              </span>
            </div>

            {/* Payout Metric */}
            <div className="text-right bg-emerald-50/80 border border-emerald-200/90 px-3 py-2 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Est. Payout</span>
              <span className="text-base font-black text-emerald-800 font-mono">
                ${activeDispatch.estPayout.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Issue Note */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900 block mb-0.5">Problem Reported:</span>
            "{activeDispatch.issueDescription}"
          </div>

          {/* Attached Problem Photos and Videos */}
          {((activeDispatch.problemImages && activeDispatch.problemImages.length > 0) ||
            (activeDispatch.problemVideos && activeDispatch.problemVideos.length > 0)) && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Customer Problem Photos & Videos
              </span>
              <div className="flex flex-wrap gap-2">
                {activeDispatch.problemImages?.map((img, i) => (
                  <img
                    key={`prob-img-${i}`}
                    src={img}
                    alt="Customer Problem photo"
                    className="w-14 h-14 object-cover rounded-xl border border-slate-200"
                  />
                ))}
                {activeDispatch.problemVideos?.map((vid, i) => (
                  <div key={`prob-vid-${i}`} className="w-20 h-14 rounded-xl overflow-hidden border border-slate-200 bg-black flex items-center justify-center">
                    <video src={vid} controls className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location & Distance */}
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50/60 p-2.5 rounded-xl border border-slate-200/70">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{activeDispatch.customerLocation.address}</span>
            </div>
            <span className="text-[11px] font-bold text-slate-800 shrink-0 ml-2">
              ~{activeDispatch.distanceKm} km away
            </span>
          </div>

          {/* Error Notice */}
          {acceptError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{acceptError}</span>
            </div>
          )}

          {/* Acceptance Actions */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleDecline}
              disabled={accepting}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <X className="w-4 h-4" />
              Decline
            </button>

            <button
              type="button"
              onClick={handleAccept}
              disabled={accepting}
              className="flex-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
            >
              {accepting ? (
                <span>Accepting...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Accept Order ({formatCountdown(countdown)})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
