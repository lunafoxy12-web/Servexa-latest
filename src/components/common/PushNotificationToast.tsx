import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToInAppNotifications,
  ServexaPushNotification,
  registerPushNotifications
} from '../../services/fcmNotificationService';
import {
  Bell,
  Package,
  Sparkles,
  Truck,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldAlert,
  Volume2
} from 'lucide-react';

export const PushNotificationToast: React.FC = () => {
  const { openOrdersTracking, setIsAiModalOpen, currentUser } = useAuth();
  const [activeNotification, setActiveNotification] = useState<ServexaPushNotification | null>(null);
  const [permissionBannerVisible, setPermissionBannerVisible] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Subscribe to real-time push alerts from FCM & WebSockets
  useEffect(() => {
    const unsubscribe = subscribeToInAppNotifications((notif) => {
      setActiveNotification(notif);

      // Auto-hide after 7 seconds
      const timer = setTimeout(() => {
        setActiveNotification((curr) => (curr?.id === notif.id ? null : curr));
      }, 7000);

      return () => clearTimeout(timer);
    });

    return unsubscribe;
  }, []);

  // Check if browser push notifications need permission prompt
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default' && currentUser) {
        // Show gentle permission banner once logged in
        const timer = setTimeout(() => setPermissionBannerVisible(true), 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser]);

  const handleEnablePush = async () => {
    if (!currentUser) return;
    setIsRegistering(true);
    try {
      const res = await registerPushNotifications(currentUser.id, currentUser.role as any);
      if (res.success) {
        setPermissionBannerVisible(false);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_update':
        return <Package className="w-5 h-5 text-indigo-600" />;
      case 'ai_message':
        return <Sparkles className="w-5 h-5 text-teal-600" />;
      case 'booking':
      case 'dispatch':
        return <Truck className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <>
      {/* Real-time Push Notification Floating Toast */}
      {activeNotification && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed top-4 right-4 sm:top-5 sm:right-6 z-50 max-w-sm w-[calc(100%-2rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-3.5 animate-in slide-in-from-top-4 duration-300 pointer-events-auto"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 shrink-0 shadow-2xs border border-slate-100 dark:border-slate-700">
              {getIcon(activeNotification.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {activeNotification.type === 'order_update'
                    ? 'FCM Order Alert'
                    : activeNotification.type === 'ai_message'
                    ? 'Servexa AI Voice Update'
                    : 'Real-Time Dispatch'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveNotification(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  aria-label="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug truncate">
                {activeNotification.title}
              </h4>

              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed line-clamp-2">
                {activeNotification.body}
              </p>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[9px] text-slate-400">Just now</span>
                {activeNotification.type === 'order_update' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveNotification(null);
                      openOrdersTracking();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <span>Track Order</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ) : activeNotification.type === 'ai_message' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveNotification(null);
                      setIsAiModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    <span>Talk with AI</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gentle Push Notification Permission Request Banner */}
      {permissionBannerVisible && (
        <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-40 max-w-sm w-[calc(100%-2rem)] bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl shadow-2xl p-3.5 border border-indigo-500/30 animate-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/40 border border-indigo-400/30 text-indigo-300 shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className="text-xs font-bold text-white">Enable Real-Time Push Alerts</h4>
                <button
                  type="button"
                  onClick={() => setPermissionBannerVisible(false)}
                  className="text-white/60 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-indigo-200/80 mt-0.5 leading-relaxed">
                Receive instant Firebase Cloud Messaging alerts for order progress, AI voice actions, and dispatch tracking.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={isRegistering}
                  className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-900 text-[11px] font-bold rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isRegistering ? 'Enabling...' : 'Allow Push Alerts'}
                </button>
                <button
                  type="button"
                  onClick={() => setPermissionBannerVisible(false)}
                  className="text-[10px] text-indigo-300 hover:text-white font-medium"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
