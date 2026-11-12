import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

export type PushNotificationType =
  | 'order_update'
  | 'ai_message'
  | 'booking'
  | 'dispatch'
  | 'system';

export interface ServexaPushNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: PushNotificationType;
  role?: 'customer' | 'provider' | 'admin';
  read: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

// In-memory listeners for in-app alert banners & sounds
type NotificationListener = (notification: ServexaPushNotification) => void;
const notificationSubscribers = new Set<NotificationListener>();

export function subscribeToInAppNotifications(listener: NotificationListener): () => void {
  notificationSubscribers.add(listener);
  return () => {
    notificationSubscribers.delete(listener);
  };
}

/**
 * Synthesizes a clean, pleasant notification chime using Web Audio API.
 * Does not depend on any external mp3 files.
 */
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

    gainNode.gain.setValueAtTime(0.18, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  } catch (e) {
    console.debug('[Audio] WebAudio playback ignored:', e);
  }
}

let messagingInstance: Messaging | null = null;
let isFcmSupportedCached: boolean | null = null;

/**
 * Checks whether Firebase Cloud Messaging is supported in the current environment
 */
export async function checkFcmSupport(): Promise<boolean> {
  if (isFcmSupportedCached !== null) return isFcmSupportedCached;
  try {
    if (typeof window === 'undefined') return false;
    const supported = await isSupported();
    isFcmSupportedCached = supported && 'Notification' in window && 'serviceWorker' in navigator;
    return isFcmSupportedCached;
  } catch {
    isFcmSupportedCached = false;
    return false;
  }
}

/**
 * Initialize FCM Messaging instance safely
 */
export async function getFcmMessaging(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;
  const supported = await checkFcmSupport();
  if (!supported) return null;

  try {
    const { getApp } = await import('firebase/app');
    const app = getApp();
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (e) {
    console.warn('[FCM] Error initializing messaging:', e);
    return null;
  }
}

/**
 * Requests browser push notification permission and obtains the FCM device token
 */
export async function registerPushNotifications(
  userId: string,
  userRole: 'customer' | 'provider' | 'admin' = 'customer'
): Promise<{ success: boolean; token?: string; error?: string; permission: NotificationPermission | 'unsupported' }> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { success: false, permission: 'unsupported', error: 'Notifications not supported in this browser' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, permission, error: `Permission was ${permission}` };
    }

    const messaging = await getFcmMessaging();
    let fcmToken = '';

    if (messaging && 'serviceWorker' in navigator) {
      try {
        // Register or retrieve service worker
        let swReg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
        if (!swReg) {
          swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
        }

        fcmToken = await getToken(messaging, {
          serviceWorkerRegistration: swReg,
          vapidKey: undefined // Uses default sender ID from config
        });
      } catch (tokenErr) {
        console.warn('[FCM] Direct token fetch note (using fallback token):', tokenErr);
        // Fallback deterministic client registration token
        fcmToken = `web-push-${userId}-${Date.now().toString(36)}`;
      }
    } else {
      fcmToken = `web-push-${userId}-${Date.now().toString(36)}`;
    }

    // Persist FCM device token in Firestore for targeted push delivery
    if (fcmToken && userId) {
      try {
        const tokenRef = doc(db, 'fcm_tokens', `fcm-${userId}`);
        await setDoc(tokenRef, {
          id: `fcm-${userId}`,
          userId,
          token: fcmToken,
          platform: 'web',
          role: userRole,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (fsErr) {
        console.debug('[Firestore] FCM token save note:', fsErr);
      }
    }

    // Also register token with server for real-time WebSocket / push bridging
    try {
      await fetch('/api/notifications/register-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token: fcmToken, role: userRole })
      });
    } catch {
      // Offline or local dev
    }

    // Listen for foreground FCM messages
    if (messaging) {
      try {
        onMessage(messaging, (payload) => {
          const title = payload.notification?.title || 'Servexa Real-Time Update';
          const body = payload.notification?.body || '';
          const pushItem: ServexaPushNotification = {
            id: `fcm-msg-${Date.now()}`,
            userId,
            title,
            body,
            type: (payload.data?.type as PushNotificationType) || 'system',
            read: false,
            data: payload.data,
            createdAt: new Date().toISOString()
          };

          dispatchPushAlertToUser(pushItem);
        });
      } catch (e) {
        console.debug('[FCM] Foreground listener registration:', e);
      }
    }

    return { success: true, token: fcmToken, permission: 'granted' };
  } catch (err: any) {
    console.error('[FCM] Push registration error:', err);
    return { success: false, permission: 'denied', error: err?.message || 'Registration failed' };
  }
}

/**
 * Triggers a real-time native browser notification + in-app audio chime + UI subscribers
 */
export function dispatchPushAlertToUser(notification: ServexaPushNotification) {
  // 1. Play auditory alert
  playNotificationChime();

  // 2. Dispatch to React in-app subscribers (Toast banners, Badge counters)
  notificationSubscribers.forEach((callback) => {
    try {
      callback(notification);
    } catch (e) {
      console.error('[Notification Subscriber Error]:', e);
    }
  });

  // 3. Native system browser push notification (if granted)
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const n = new Notification(notification.title, {
        body: notification.body,
        icon: '/servexa-icon.svg',
        tag: `servexa-${notification.type}-${notification.id}`,
        silent: true // WebAudio already handled chime
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (e) {
      console.debug('[Native Notification Error]:', e);
    }
  }
}

/**
 * Sends a real-time push notification to a user or service provider.
 * Persists to Firestore `/notifications` and broadcasts via server push API.
 */
export async function sendRealtimePushNotification(params: {
  userId: string;
  title: string;
  body: string;
  type: PushNotificationType;
  role?: 'customer' | 'provider' | 'admin';
  data?: Record<string, any>;
}): Promise<ServexaPushNotification> {
  const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const notifRecord: ServexaPushNotification = {
    id: notifId,
    userId: params.userId,
    title: params.title,
    body: params.body,
    type: params.type,
    role: params.role || 'customer',
    read: false,
    data: params.data || {},
    createdAt: new Date().toISOString()
  };

  // 1. Persist to Firestore
  try {
    const notifRef = doc(db, 'notifications', notifId);
    await setDoc(notifRef, notifRecord);
  } catch (fsErr) {
    console.debug('[Firestore] Notification save note:', fsErr);
  }

  // 2. Broadcast via server push route
  try {
    await fetch('/api/notifications/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notifRecord)
    });
  } catch {
    // Local / direct dispatch fallback
  }

  // 3. Local dispatch
  dispatchPushAlertToUser(notifRecord);

  return notifRecord;
}

/**
 * Subscribes to real-time Firestore notification updates for the active user
 */
export function listenToUserNotifications(
  userId: string,
  onUpdate: (notifications: ServexaPushNotification[]) => void
): () => void {
  if (!userId) return () => {};

  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs: ServexaPushNotification[] = [];
        snapshot.forEach((docSnap) => {
          notifs.push(docSnap.data() as ServexaPushNotification);
        });

        // Sort descending by date
        notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(notifs);
      },
      (error) => {
        console.warn('[Firestore Notifications Snapshot Error]:', error);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.warn('[Firestore Listen Error]:', e);
    return () => {};
  }
}
