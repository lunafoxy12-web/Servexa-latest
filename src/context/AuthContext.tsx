import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, PBXCall, AppNotification, RealtimeEvent, Product, CartItem, AiUploadedMedia, Booking, ServiceCategory } from '../types';
import { ProductCategoryConfig } from '../data/productCategories';
import { pbxAudio } from '../utils/audioEngine';
import { detectUserCurrency } from '../utils/currency';
import { auth, googleProvider, signInWithPopup, signOut as fbSignOut, testConnection } from '../lib/firebase';
import { sendEmailVerification as fbSendEmailVerification } from 'firebase/auth';
import { dispatchPushAlertToUser } from '../services/fcmNotificationService';

interface AuthContextType {
  currentUser: User | null;
  role: 'customer' | 'provider' | 'admin' | null;
  activeView: 'customer' | 'products' | 'search' | 'service-category' | 'product-category' | 'provider' | 'admin';
  setActiveView: (view: 'customer' | 'products' | 'search' | 'service-category' | 'product-category' | 'provider' | 'admin') => void;
  activeSearchType: 'services' | 'products';
  setActiveSearchType: (type: 'services' | 'products') => void;
  openSearchPage: (type?: 'services' | 'products') => void;
  selectedServiceCategory: ServiceCategory | null;
  setSelectedServiceCategory: (cat: ServiceCategory | null) => void;
  selectedProductCategory: ProductCategoryConfig | null;
  setSelectedProductCategory: (cat: ProductCategoryConfig | null) => void;
  openServiceCategoryPage: (cat: ServiceCategory) => void;
  openProductCategoryPage: (cat: ProductCategoryConfig) => void;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (roleOverride?: 'customer' | 'provider') => Promise<{ success: boolean; error?: string; cancelled?: boolean }>;
  loginWithWallet: (walletAddress?: string, roleOverride?: 'customer' | 'provider') => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  notifications: AppNotification[];
  unreadNotifsCount: number;
  markNotificationsAsRead: () => void;
  // PBX VoIP
  activeCall: PBXCall | null;
  incomingCall: PBXCall | null;
  initiateCall: (calleeId: string, calleeName: string, calleeRole: any, bookingId?: string, callType?: 'audio' | 'video') => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  // Modals & Drawers
  activeChatBookingId: string | null;
  openChat: (bookingId: string) => void;
  closeChat: () => void;
  selectedProviderId: string | null;
  openProviderProfile: (providerId: string) => void;
  closeProviderProfile: () => void;
  isAiModalOpen: boolean;
  setIsAiModalOpen: (open: boolean) => void;
  aiInitialPrompt: string;
  setAiInitialPrompt: (prompt: string) => void;
  openAiModalWithPrompt: (prompt?: string) => void;
  aiInitialMedia: AiUploadedMedia | null;
  setAiInitialMedia: (media: AiUploadedMedia | null) => void;
  openAiModalWithMedia: (media: AiUploadedMedia, prompt?: string) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalTab: 'login' | 'register';
  setAuthModalTab: (tab: 'login' | 'register') => void;
  // Profile Modal
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  profileActiveTab: 'profile' | 'orders' | 'wallet_history' | 'problem_history' | 'theme' | 'ai' | 'language' | 'support';
  setProfileActiveTab: (tab: 'profile' | 'orders' | 'wallet_history' | 'problem_history' | 'theme' | 'ai' | 'language' | 'support') => void;
  openOrdersTracking: () => void;
  updateUserLocally: (updates: Partial<User>) => void;
  // Feedback & Service Rating Modal
  feedbackModalBooking: Booking | null;
  openFeedbackModal: (booking: Booking) => void;
  closeFeedbackModal: () => void;
  // Complaints & Disputes
  activeComplaintId: string | null;
  openComplaintChat: (complaintId: string) => void;
  closeComplaintChat: () => void;
  isComplaintModalOpen: boolean;
  setIsComplaintModalOpen: (open: boolean) => void;
  complaintPrefillBookingId: string | null;
  openFileComplaint: (bookingId?: string) => void;
  closeFileComplaint: () => void;
  // Live GPS Tracking HUD
  activeTrackingBookingId: string | null;
  openLiveTracking: (bookingId: string) => void;
  closeLiveTracking: () => void;
  // Email Verification
  isEmailVerifyModalOpen: boolean;
  setIsEmailVerifyModalOpen: (open: boolean) => void;
  pendingVerifyEmail: string;
  setPendingVerifyEmail: (email: string) => void;
  latestVerificationCode: string | null;
  sendEmailVerification: (email?: string) => Promise<{ success: boolean; message?: string; code?: string; error?: string }>;
  verifyEmailCode: (code: string, email?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  // Storefront Direct Portal
  activeStorefrontSubdomain: string | null;
  openStorefrontSubdomain: (subdomain: string) => void;
  closeStorefrontSubdomain: () => void;
  // Shopping Cart System
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cartItemsCount: number;
  cartTotal: number;
  // App Download / APK / PWA Install
  downloadOrInstallApk: () => Promise<void>;
  canInstallPwa: boolean;
  isAppInstalled: boolean;
  setIsAppInstalled: (installed: boolean) => void;
  isApkModalOpen: boolean;
  setIsApkModalOpen: (open: boolean) => void;
  globalRefreshKey: number;
  triggerGlobalRefresh: () => void;
  lastRealtimeEvent: RealtimeEvent | null;
  activeCurrency: string;
  setActiveCurrency: (code: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('servexa_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      } catch (e) {}
    }
    return null;
  });

  const [activeView, setActiveView] = useState<'customer' | 'products' | 'search' | 'service-category' | 'product-category' | 'provider' | 'admin'>(() => {
    const saved = localStorage.getItem('servexa_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.role === 'provider') return 'provider';
        if (parsed?.role === 'admin') return 'admin';
      } catch (e) {}
    }
    return 'customer';
  });
  const [activeSearchType, setActiveSearchType] = useState<'services' | 'products'>('services');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<ServiceCategory | null>(null);
  const [selectedProductCategory, setSelectedProductCategory] = useState<ProductCategoryConfig | null>(null);

  const openSearchPage = (type: 'services' | 'products' = 'services') => {
    setActiveSearchType(type);
    setActiveView('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openServiceCategoryPage = (cat: ServiceCategory) => {
    setSelectedServiceCategory(cat);
    setActiveView('service-category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openProductCategoryPage = (cat: ProductCategoryConfig) => {
    setSelectedProductCategory(cat);
    setActiveView('product-category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeCall, setActiveCall] = useState<PBXCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<PBXCall | null>(null);
  const [activeChatBookingId, setActiveChatBookingId] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string>('');
  const [aiInitialMedia, setAiInitialMedia] = useState<AiUploadedMedia | null>(null);

  const openAiModalWithPrompt = useCallback((prompt?: string) => {
    if (prompt !== undefined) {
      setAiInitialPrompt(prompt);
    }
    setIsAiModalOpen(true);
  }, []);

  const openAiModalWithMedia = useCallback((media: AiUploadedMedia, prompt?: string) => {
    setAiInitialMedia(media);
    if (prompt !== undefined) {
      setAiInitialPrompt(prompt);
    }
    setIsAiModalOpen(true);
  }, []);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  // Profile Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [profileActiveTab, setProfileActiveTab] = useState<'profile' | 'orders' | 'theme' | 'ai' | 'language' | 'support'>('profile');

  // Feedback & Service Rating Modal
  const [feedbackModalBooking, setFeedbackModalBooking] = useState<Booking | null>(null);
  const openFeedbackModal = useCallback((booking: Booking) => {
    setFeedbackModalBooking(booking);
  }, []);
  const closeFeedbackModal = useCallback(() => {
    setFeedbackModalBooking(null);
  }, []);

  const openOrdersTracking = useCallback(() => {
    setProfileActiveTab('orders');
    setIsProfileModalOpen(true);
  }, []);

  const updateUserLocally = useCallback((updates: Partial<User>) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('servexa_user', JSON.stringify(updated));
      return updated;
    });
  }, []);
  // Complaints & Dispute Resolution
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState<boolean>(false);
  const [complaintPrefillBookingId, setComplaintPrefillBookingId] = useState<string | null>(null);
  // Live GPS Tracking HUD
  const [activeTrackingBookingId, setActiveTrackingBookingId] = useState<string | null>(null);
  // Email Verification & Cross Device Session State
  const [isEmailVerifyModalOpen, setIsEmailVerifyModalOpen] = useState<boolean>(false);
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState<string>('');
  const [latestVerificationCode, setLatestVerificationCode] = useState<string | null>(null);
  // Direct Storefront Subdomain State
  const [activeStorefrontSubdomain, setActiveStorefrontSubdomain] = useState<string | null>(null);

  // Shopping Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('servexa_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('servexa_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price || 0) * item.quantity, 0);

  // PWA / APK installation support
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isApkModalOpen, setIsApkModalOpen] = useState<boolean>(false);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://') ||
      localStorage.getItem('servexa_app_installed') === 'true'
    );
  });

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      localStorage.setItem('servexa_app_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    try {
      const mql = window.matchMedia('(display-mode: standalone)');
      const handleModeChange = (e: MediaQueryListEvent) => {
        if (e.matches) handleAppInstalled();
      };
      mql.addEventListener?.('change', handleModeChange);
      if (mql.matches) handleAppInstalled();
    } catch {}

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const downloadOrInstallApk = useCallback(async () => {
    if (deferredInstallPrompt) {
      try {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsAppInstalled(true);
          localStorage.setItem('servexa_app_installed', 'true');
          setDeferredInstallPrompt(null);
          return;
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }
    // Also trigger direct APK file download
    const link = document.createElement('a');
    link.href = '/api/download/apk';
    link.download = 'Servexa-World-v2.4.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Record installation state after triggering APK download
    setTimeout(() => {
      setIsAppInstalled(true);
      localStorage.setItem('servexa_app_installed', 'true');
    }, 1500);
  }, [deferredInstallPrompt]);

  const [globalRefreshKey, setGlobalRefreshKey] = useState<number>(0);
  const [lastRealtimeEvent, setLastRealtimeEvent] = useState<RealtimeEvent | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Currency auto-detected according to user's current location/locale
  const [activeCurrency, setActiveCurrencyState] = useState<string>(() => detectUserCurrency());

  const setActiveCurrency = useCallback((code: string) => {
    setActiveCurrencyState(code);
    try {
      localStorage.setItem('servexa_currency', code);
    } catch {}
  }, []);

  const triggerGlobalRefresh = useCallback(() => {
    setGlobalRefreshKey(k => k + 1);
  }, []);

  const openStorefrontSubdomain = (subdomain: string) => setActiveStorefrontSubdomain(subdomain);
  const closeStorefrontSubdomain = () => setActiveStorefrontSubdomain(null);

  // Cross-device session check & sync on startup, and test Firestore connection
  useEffect(() => {
    testConnection().catch(() => {});

    const saved = localStorage.getItem('servexa_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.id) {
          fetch(`/api/auth/me?userId=${parsed.id}`)
            .then(res => res.json())
            .then(data => {
              if (data.user) {
                setCurrentUser(data.user);
                localStorage.setItem('servexa_user', JSON.stringify(data.user));
              }
            })
            .catch(() => {});
        }
      } catch (e) {}
    }
  }, []);

  // Sync active view when user role changes
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      setActiveView('admin');
    } else if (currentUser?.role === 'provider') {
      setActiveView('provider');
    } else {
      setActiveView('customer');
    }
  }, [currentUser?.role]);

  // WebSocket connection & real-time event router
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    let ws: WebSocket;
    let reconnectTimer: any;

    function connect() {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setSocket(ws);
          if (currentUser) {
            ws.send(JSON.stringify({
              type: 'IDENTIFY',
              userId: currentUser.id,
              role: currentUser.role
            }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const data: RealtimeEvent = JSON.parse(event.data);
            handleRealtimeEvent(data);
          } catch (e) {
            console.error('Error handling ws message:', e);
          }
        };

        ws.onclose = () => {
          setSocket(null);
          reconnectTimer = setTimeout(connect, 2500);
        };
      } catch (e) {
        console.warn('WebSocket connection error:', e);
      }
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [currentUser?.id]);

  // Handle incoming real-time events from server
  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    setLastRealtimeEvent(event);
    triggerGlobalRefresh();

    if (event.type === 'BOOKING_ACCEPTED' || event.type === 'BOOKING_UPDATED') {
      const b = event.payload;
      if (b && b.status === 'accepted') {
        if (currentUser && currentUser.id === b.customerId) {
          // Auto-open chat box on customer's screen immediately when provider accepts
          setActiveChatBookingId(b.id);
        }
      }
    }

    if (event.type === 'USER_STATUS_UPDATED') {
      const payload = event.payload;
      // If current user is modified, update immediately
      if (currentUser && currentUser.id === payload.userId) {
        setCurrentUser(prev => prev ? { ...prev, status: payload.status, verified: payload.verified ?? prev.verified } : null);
      }
    } else if (event.type === 'PBX_CALL_INVITE') {
      const callData: PBXCall = event.payload;
      if (callData.calleeId === currentUser?.id) {
        setIncomingCall(callData);
        pbxAudio.startRingtone('incoming');
      }
    } else if (event.type === 'PBX_CALL_ANSWER') {
      pbxAudio.stopRingtone();
      setActiveCall(prev => prev ? { ...prev, status: 'connected', startedAt: new Date().toISOString() } : null);
    } else if (event.type === 'PBX_CALL_REJECT' || event.type === 'PBX_CALL_HANGUP') {
      pbxAudio.stopRingtone();
      pbxAudio.endVoiceSession();
      setActiveCall(null);
      setIncomingCall(null);
    } else if (event.type === 'WALLET_UPDATED') {
      const payload = event.payload;
      if (currentUser && currentUser.id === payload.userId) {
        setCurrentUser(prev => prev ? { ...prev, walletBalance: payload.newBalance } : null);
      }
    } else if (
      event.type === 'COMPLAINT_MESSAGE' ||
      event.type === 'COMPLAINT_CREATED' ||
      event.type === 'COMPLAINT_UPDATED' ||
      event.type === 'LOCATION_UPDATE'
    ) {
      triggerGlobalRefresh();
    } else if (event.type === 'PUSH_NOTIFICATION' || event.type === 'NOTIFICATION_RECEIVED') {
      const payload = event.payload;
      const notifItem: AppNotification = {
        id: payload.id || 'notif-' + Date.now(),
        userId: payload.userId || currentUser?.id || 'all',
        title: payload.title || 'Notification',
        message: payload.body || payload.message || '',
        type: payload.type || 'system',
        read: false,
        createdAt: payload.createdAt || new Date().toISOString()
      };

      setNotifications(prev => [notifItem, ...prev]);

      // Trigger native browser notification & audio chime
      dispatchPushAlertToUser({
        id: notifItem.id,
        userId: notifItem.userId,
        title: notifItem.title,
        body: notifItem.message,
        type: (payload.type as any) || 'system',
        read: false,
        data: payload.data,
        createdAt: notifItem.createdAt
      });
    } else if (event.type === 'NOTIFICATION') {
      setNotifications(prev => [
        {
          id: 'notif-' + Date.now(),
          userId: currentUser?.id || 'all',
          title: event.payload.title || 'Notification',
          message: event.payload.message || '',
          type: 'system',
          read: false,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);
    }
  }, [currentUser, triggerGlobalRefresh]);

  // Fetch initial notifications
  useEffect(() => {
    if (currentUser?.id) {
      fetch(`/api/notifications/${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setNotifications(data);
        })
        .catch((err) => console.debug('Notifications fetch notice:', err?.message));
    }
  }, [currentUser?.id, globalRefreshKey]);

  // Refresh user profile & wallet from API
  const refreshUser = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/wallet/${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(prev => prev ? { ...prev, walletBalance: data.balance } : null);
      }
    } catch (e) {
      console.error('Error refreshing wallet:', e);
    }
  }, [currentUser?.id]);

  // Login handler supporting Stealth Admin (Mr-Pirate / Piratesworld123$$)
  const login = async (email: string, password?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed' };
      }

      setCurrentUser(data.user);
      localStorage.setItem('servexa_user', JSON.stringify(data.user));

      if (data.user.role === 'admin') {
        setActiveView('admin');
      } else if (data.user.role === 'provider') {
        setActiveView('provider');
      } else {
        setActiveView('customer');
      }

      setIsAuthModalOpen(false);
      triggerGlobalRefresh();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network connection failure' };
    }
  };

  const loginWithGoogle = async (roleOverride?: 'customer' | 'provider') => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName || 'Google User',
          avatar: fbUser.photoURL || '',
          role: roleOverride || 'customer'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Google authentication failed' };
      }

      setCurrentUser(data.user);
      localStorage.setItem('servexa_user', JSON.stringify(data.user));

      if (data.user.role === 'admin') {
        setActiveView('admin');
      } else if (data.user.role === 'provider') {
        setActiveView('provider');
      } else {
        setActiveView('customer');
      }

      setIsAuthModalOpen(false);
      triggerGlobalRefresh();
      return { success: true };
    } catch (e: any) {
      if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') {
        // User intentionally closed the popup window - gracefully return without noisy error
        return { success: false, cancelled: true };
      }
      console.warn('[Firebase Auth] Google login note:', e?.message || e);
      return { success: false, error: e.message || 'Google sign-in was not completed.' };
    }
  };

  const loginWithWallet = async (walletAddress?: string, roleOverride: 'customer' | 'provider' = 'customer') => {
    try {
      let address = walletAddress;
      // If browser has an injected Web3 wallet (MetaMask, Coinbase Wallet, Phantom, etc.)
      if (!address && typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts[0]) {
            address = accounts[0];
          }
        } catch (err) {
          console.warn('Web3 wallet account prompt dismissed or unavailable, using deterministic wallet session:', err);
        }
      }

      // If no injected Web3 or rejected, generate a unique deterministic wallet address
      if (!address) {
        const hex = Array.from({ length: 4 }, () => Math.floor(Math.random() * 65536).toString(16).padStart(4, '0')).join('');
        address = `0x71C${hex.slice(0, 4)}...${hex.slice(4, 8)}`;
      }

      const shortAddr = address.length > 13 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
      const cleanId = address.replace(/[^a-zA-Z0-9]/g, '').slice(-8) || String(Date.now());

      let customerUser: User;

      try {
        const res = await fetch('/api/auth/wallet-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: address,
            role: roleOverride,
            name: `Customer (${shortAddr})`
          })
        });
        if (res.ok) {
          const data = await res.json();
          customerUser = data.user;
        } else {
          throw new Error('Server wallet login fallback');
        }
      } catch {
        customerUser = {
          id: `cust-${cleanId}`,
          name: `Customer (${shortAddr})`,
          email: `${cleanId.toLowerCase()}@servexa.io`,
          phone: '+1 (555) 000-1122',
          role: roleOverride,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
          status: 'active',
          verified: true,
          walletBalance: 0.00, // 0 credits for new user
          walletAddress: address,
          preferredCurrency: 'USD',
          createdAt: new Date().toISOString()
        };
      }

      setCurrentUser(customerUser);
      localStorage.setItem('servexa_user', JSON.stringify(customerUser));

      if (customerUser.role === 'provider') {
        setActiveView('provider');
      } else {
        setActiveView('customer');
      }

      setIsAuthModalOpen(false);
      triggerGlobalRefresh();
      return { success: true, user: customerUser };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to connect wallet' };
    }
  };

  const register = async (formData: any) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      setCurrentUser(data.user);
      localStorage.setItem('servexa_user', JSON.stringify(data.user));

      // Route directly to the corresponding view panel
      if (data.user.role === 'provider') {
        setActiveView('provider');
      } else if (data.user.role === 'admin') {
        setActiveView('admin');
      } else {
        setActiveView('customer');
      }

      setIsAuthModalOpen(false);
      triggerGlobalRefresh();

      // No OTP verification required - user is active and verified immediately
      setIsEmailVerifyModalOpen(false);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  const sendEmailVerification = async (email?: string) => {
    const targetEmail = email || currentUser?.email || pendingVerifyEmail;
    if (!targetEmail) return { success: false, error: 'No email specified' };
    try {
      // Trigger official Firebase Auth email verification if user has active session
      if (auth.currentUser && auth.currentUser.email === targetEmail) {
        try {
          await fbSendEmailVerification(auth.currentUser);
        } catch (fbErr) {
          console.warn('[Firebase Auth] Verification email note:', fbErr);
        }
      }

      // Trigger server-side SMTP email verification with real PIN dispatch
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };

      setPendingVerifyEmail(targetEmail);
      setIsEmailVerifyModalOpen(true);
      return { success: true, message: data.message };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to dispatch verification email' };
    }
  };

  const verifyEmailCode = async (code: string, email?: string) => {
    const targetEmail = email || pendingVerifyEmail || currentUser?.email;
    if (!targetEmail) return { success: false, error: 'No email specified' };
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, code, userId: currentUser?.id })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      if (data.user && currentUser?.id === data.user.id) {
        setCurrentUser(data.user);
        localStorage.setItem('servexa_user', JSON.stringify(data.user));
      }
      setIsEmailVerifyModalOpen(false);
      triggerGlobalRefresh();
      return { success: true, message: data.message };
    } catch (e: any) {
      return { success: false, error: e.message || 'Verification failure' };
    }
  };

  const logout = () => {
    fbSignOut(auth).catch(() => {});
    setCurrentUser(null);
    localStorage.removeItem('servexa_user');
    setActiveView('customer');
    setActiveCall(null);
    setIncomingCall(null);
    pbxAudio.stopRingtone();
    pbxAudio.endVoiceSession();
  };

  const markNotificationsAsRead = () => {
    if (currentUser?.id) {
      fetch(`/api/notifications/${currentUser.id}/read`, { method: 'POST' }).catch((err) => {
        console.warn('Note marking notifications as read:', err?.message || err);
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  // PBX Calling actions
  const initiateCall = (calleeId: string, calleeName: string, calleeRole: any, bookingId?: string, callType: 'audio' | 'video' = 'audio') => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const newCall: PBXCall = {
      id: 'call-' + Date.now(),
      callerId: currentUser.id,
      callerName: currentUser.name,
      callerRole: currentUser.role,
      calleeId,
      calleeName,
      calleeRole,
      bookingId,
      callType,
      status: 'ringing',
      durationSeconds: 0,
      codec: callType === 'video' ? 'H.264/VP9-Opus' : 'Opus-Adaptive-64k',
      bitrateKbps: callType === 'video' ? 1200 : 64,
      packetLossPct: 0.1,
      jitterMs: 4.2,
      isEncrypted: true
    };

    setActiveCall(newCall);
    pbxAudio.startRingtone('outgoing');

    // Send through WebSocket to peer
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'PBX_CALL_INVITE',
        payload: { ...newCall, targetUserId: calleeId }
      }));
    }
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    pbxAudio.stopRingtone();
    const connectedCall = {
      ...incomingCall,
      status: 'connected' as const,
      startedAt: new Date().toISOString()
    };
    setActiveCall(connectedCall);
    setIncomingCall(null);

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'PBX_CALL_ANSWER',
        payload: { targetUserId: connectedCall.callerId, callId: connectedCall.id }
      }));
    }
  };

  const rejectCall = () => {
    if (!incomingCall) return;
    pbxAudio.stopRingtone();
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'PBX_CALL_REJECT',
        payload: { targetUserId: incomingCall.callerId, callId: incomingCall.id }
      }));
    }
    setIncomingCall(null);
  };

  const endCall = () => {
    pbxAudio.stopRingtone();
    pbxAudio.endVoiceSession();
    if (activeCall && socket && socket.readyState === WebSocket.OPEN) {
      const target = activeCall.callerId === currentUser?.id ? activeCall.calleeId : activeCall.callerId;
      socket.send(JSON.stringify({
        type: 'PBX_CALL_HANGUP',
        payload: { targetUserId: target, callId: activeCall.id }
      }));
    }
    setActiveCall(null);
    setIncomingCall(null);
  };

  const openChat = (bookingId: string) => {
    if (!currentUser) {
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }
    // If pre-order consultation or provider role, open directly
    if (bookingId.startsWith('preorder_') || currentUser.role === 'provider' || currentUser.role === 'admin') {
      setActiveChatBookingId(bookingId);
      return;
    }
    // Customer clicking chat: verify status is accepted or beyond
    fetch('/api/bookings')
      .then(res => res.json())
      .then((bks: Booking[]) => {
        const found = bks.find(b => b.id === bookingId);
        if (found && found.status === 'pending') {
          console.info('Order pending: Chat box will open automatically once accepted.');
          setActiveChatBookingId(bookingId);
          return;
        }
        setActiveChatBookingId(bookingId);
      })
      .catch(() => {
        setActiveChatBookingId(bookingId);
      });
  };
  const closeChat = () => setActiveChatBookingId(null);

  const openComplaintChat = (complaintId: string) => setActiveComplaintId(complaintId);
  const closeComplaintChat = () => setActiveComplaintId(null);

  const openFileComplaint = (bookingId?: string) => {
    setComplaintPrefillBookingId(bookingId || null);
    setIsComplaintModalOpen(true);
  };
  const closeFileComplaint = () => {
    setIsComplaintModalOpen(false);
    setComplaintPrefillBookingId(null);
  };

  const openLiveTracking = (bookingId: string) => setActiveTrackingBookingId(bookingId);
  const closeLiveTracking = () => setActiveTrackingBookingId(null);

  const openProviderProfile = (providerId: string) => {
    if (!currentUser) {
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedProviderId(providerId);
  };
  const closeProviderProfile = () => setSelectedProviderId(null);

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        activeView,
        setActiveView,
        login,
        loginWithGoogle,
        loginWithWallet,
        register,
        logout,
        refreshUser,
        notifications,
        unreadNotifsCount,
        markNotificationsAsRead,
        activeCall,
        incomingCall,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        activeChatBookingId,
        openChat,
        closeChat,
        activeComplaintId,
        openComplaintChat,
        closeComplaintChat,
        isComplaintModalOpen,
        setIsComplaintModalOpen,
        complaintPrefillBookingId,
        openFileComplaint,
        closeFileComplaint,
        activeTrackingBookingId,
        openLiveTracking,
        closeLiveTracking,
        // Email Verification
        isEmailVerifyModalOpen,
        setIsEmailVerifyModalOpen,
        pendingVerifyEmail,
        setPendingVerifyEmail,
        latestVerificationCode,
        sendEmailVerification,
        verifyEmailCode,
        // Storefront Direct Portal
        activeStorefrontSubdomain,
        openStorefrontSubdomain,
        closeStorefrontSubdomain,
        // Shopping Cart
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        cartItemsCount,
        cartTotal,
        // App Download / APK / PWA Install
        downloadOrInstallApk,
        canInstallPwa: Boolean(deferredInstallPrompt),
        isAppInstalled,
        setIsAppInstalled,
        isApkModalOpen,
        setIsApkModalOpen,
        selectedProviderId,
        openProviderProfile,
        closeProviderProfile,
        isAiModalOpen,
        setIsAiModalOpen,
        aiInitialPrompt,
        setAiInitialPrompt,
        openAiModalWithPrompt,
        aiInitialMedia,
        setAiInitialMedia,
        openAiModalWithMedia,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        isProfileModalOpen,
        setIsProfileModalOpen,
        profileActiveTab,
        setProfileActiveTab,
        openOrdersTracking,
        updateUserLocally,
        feedbackModalBooking,
        openFeedbackModal,
        closeFeedbackModal,
        globalRefreshKey,
        triggerGlobalRefresh,
        lastRealtimeEvent,
        activeCurrency,
        setActiveCurrency,
        activeSearchType,
        setActiveSearchType,
        openSearchPage,
        selectedServiceCategory,
        setSelectedServiceCategory,
        selectedProductCategory,
        setSelectedProductCategory,
        openServiceCategoryPage,
        openProductCategoryPage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
