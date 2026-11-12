import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme, THEME_CONFIGS, ThemeId } from '../../context/ThemeContext';
import { uploadProfileImageToStorage } from '../../lib/firebase';
import { ProductOrder, Booking } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { 
  X, 
  Camera, 
  Upload, 
  MapPin, 
  Phone, 
  User as UserIcon, 
  Briefcase, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  FileCheck,
  Truck,
  Package,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  ShoppingBag,
  Navigation,
  MessageSquare,
  PhoneCall,
  Layers,
  Palette,
  Check,
  Bot,
  Radio,
  Mic,
  Volume2,
  Globe,
  Star,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Mail,
  LifeBuoy,
  Download,
  Smartphone,
  Wallet
} from 'lucide-react';
import { VOICE_PERSONAS } from '../../utils/audioEngine';
import { useLanguage } from '../../context/LanguageContext';
import { ChatHistoryModal } from '../Orders/ChatHistoryModal';

export const ProfileEditModal: React.FC = () => {
  const { 
    currentUser, 
    isProfileModalOpen, 
    setIsProfileModalOpen, 
    profileActiveTab,
    setProfileActiveTab,
    updateUserLocally, 
    refreshUser,
    triggerGlobalRefresh,
    globalRefreshKey,
    openLiveTracking,
    openChat,
    initiateCall,
    activeCurrency,
    openFeedbackModal,
    openFileComplaint,
    isAppInstalled,
    setIsApkModalOpen,
    sendEmailVerification
  } = useAuth();

  const { activeThemeId, theme, setTheme } = useTheme();
  const {
    language,
    setLanguage,
    currentLanguageInfo,
    availableLanguages,
    t,
    isRTL
  } = useLanguage();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedStorageUrl, setUploadedStorageUrl] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Orders & Tracking state (Both services and products)
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [serviceBookings, setServiceBookings] = useState<Booking[]>([]);
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'services' | 'products'>('all');
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<ProductOrder | null>(null);
  const [isChatHistoryModalOpen, setIsChatHistoryModalOpen] = useState(false);
  const [chatHistoryTargetOrder, setChatHistoryTargetOrder] = useState<any>(null);

  // Separated Wallet History State
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(currentUser?.walletBalance || 0);
  const [walletLoading, setWalletLoading] = useState(false);

  // Provider specific fields
  const [businessName, setBusinessName] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number | string>('');
  const [activeStatus, setActiveStatus] = useState<'online' | 'busy' | 'offline'>('online');

  // AI Assistant & Voice settings state managed directly from profile
  const [aiPersona, setAiPersona] = useState<string>(() => localStorage.getItem('servexa_ai_persona') || 'sophia');
  const [aiSpeed, setAiSpeed] = useState<number>(() => {
    const s = localStorage.getItem('servexa_ai_speed');
    return s ? parseFloat(s) : 1.0;
  });
  const [aiVoiceMode, setAiVoiceMode] = useState<'always_listening' | 'push_to_talk'>(() => {
    return (localStorage.getItem('servexa_ai_voice_mode') as any) || 'always_listening';
  });
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);

  const handleSaveAiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('servexa_ai_persona', aiPersona);
    localStorage.setItem('servexa_ai_speed', aiSpeed.toString());
    localStorage.setItem('servexa_ai_voice_mode', aiVoiceMode);
    setAiSuccessMsg('AI Assistant voice & concierge preferences saved!');
    setTimeout(() => setAiSuccessMsg(null), 3000);
  };

  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isProvider = currentUser?.role === 'provider';

  // Support & Help Content State
  const [supportContent, setSupportContent] = useState<any>(null);
  const [supportLoading, setSupportLoading] = useState(false);
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  useEffect(() => {
    if (profileActiveTab === 'support' || isProfileModalOpen) {
      setSupportLoading(true);
      fetch('/api/support/content')
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.error) setSupportContent(data);
        })
        .catch(() => {})
        .finally(() => setSupportLoading(false));
    }
  }, [profileActiveTab, isProfileModalOpen, globalRefreshKey]);

  // Fetch both product orders and service bookings when orders tab is viewed
  useEffect(() => {
    if (isProfileModalOpen && currentUser?.id) {
      setOrdersLoading(true);
      Promise.all([
        fetch(`/api/orders?customerId=${currentUser.id}`).then((r) => r.json()).catch(() => []),
        fetch('/api/bookings').then((r) => r.json()).catch(() => [])
      ])
        .then(([ordersData, bookingsData]) => {
          if (Array.isArray(ordersData)) {
            setOrders(ordersData);
            if (selectedTrackingOrder) {
              const updated = ordersData.find((o: ProductOrder) => o.id === selectedTrackingOrder.id);
              if (updated) setSelectedTrackingOrder(updated);
            }
          }
          if (Array.isArray(bookingsData)) {
            const myBookings = bookingsData.filter((b: Booking) => b.customerId === currentUser.id);
            setServiceBookings(myBookings);
          }
        })
        .catch((err) => console.warn('Note loading orders in profile:', err?.message || err))
        .finally(() => setOrdersLoading(false));

      // Fetch wallet balance and transaction ledger
      setWalletLoading(true);
      fetch(`/api/wallet/${currentUser.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && typeof data.balance === 'number') {
            setWalletBalance(data.balance);
            if (Array.isArray(data.transactions)) {
              setWalletTransactions(data.transactions);
            }
          }
        })
        .catch(() => {})
        .finally(() => setWalletLoading(false));
    }
  }, [isProfileModalOpen, currentUser?.id, globalRefreshKey]);

  // Initialize form state from currentUser
  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.name || '');
    setPhone(currentUser.phone || '');
    setAvatar(currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80');
    setBio(currentUser.bio || '');
    setAddress(currentUser.location?.address || 'San Francisco Bay Area, CA');
    if (currentUser.location?.lat && currentUser.location?.lng) {
      setCoords({ lat: currentUser.location.lat, lng: currentUser.location.lng });
    }

    if (isProvider) {
      setBusinessName(currentUser.businessName || currentUser.name || '');
      // Fetch provider specific details if available
      fetch(`/api/providers/${currentUser.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(prov => {
          if (prov) {
            if (prov.businessName) setBusinessName(prov.businessName);
            if (prov.bio) setBio(prov.bio);
            if (prov.serviceArea) setServiceArea(prov.serviceArea);
            if (prov.workingHours) setWorkingHours(prov.workingHours);
            if (prov.hourlyRate) setHourlyRate(prov.hourlyRate);
            if (prov.activeStatus) setActiveStatus(prov.activeStatus);
            if (prov.currentLocation?.address) setAddress(prov.currentLocation.address);
            if (prov.currentLocation?.lat) {
              setCoords({ lat: prov.currentLocation.lat, lng: prov.currentLocation.lng });
            }
          }
        })
        .catch(() => {});
    }
  }, [currentUser, isProfileModalOpen, isProvider]);

  if (!isProfileModalOpen || !currentUser) return null;

  // Handle direct file upload to Firebase Storage
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 10MB limit.');
      return;
    }

    setErrorMsg(null);
    setIsUploadingImage(true);

    try {
      // Instant client-side display preview
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);

      // Direct Firebase Storage upload utility
      const downloadUrl = await uploadProfileImageToStorage(currentUser.id, file);
      setAvatar(downloadUrl);
      setUploadedStorageUrl(downloadUrl);
      setSuccessMsg('Profile picture updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      // Keep client-side preview if storage had a network hiccup
      setSuccessMsg('Profile picture set locally.');
      setTimeout(() => setSuccessMsg(null), 2500);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Get exact current GPS coordinates
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setAddress(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setSuccessMsg('Exact GPS coordinates captured successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        // Fallback default coordinates
        setCoords({ lat: 37.7749, lng: -122.4194 });
        setAddress('San Francisco Financial District, CA');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Name cannot be empty.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const locationPayload = coords 
        ? { lat: coords.lat, lng: coords.lng, address: address.trim() || 'Verified Location' }
        : currentUser.location || { lat: 37.7749, lng: -122.4194, address: address.trim() || 'San Francisco, CA' };

      // 1. Update user profile
      const userRes = await fetch(`/api/users/${currentUser.id}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          avatar: avatar.trim(),
          bio: bio.trim(),
          businessName: isProvider ? (businessName.trim() || name.trim()) : undefined,
          location: locationPayload
        })
      });

      if (!userRes.ok) {
        const err = await userRes.json();
        throw new Error(err.error || 'Failed to update user profile');
      }

      const userData = await userRes.json();

      // 2. If provider, update provider profile
      if (isProvider) {
        await fetch(`/api/providers/${currentUser.id}/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: businessName.trim() || name.trim(),
            bio: bio.trim(),
            serviceArea: serviceArea.trim() || 'Greater Metropolitan Area',
            workingHours: workingHours.trim() || '8:00 AM - 8:00 PM',
            hourlyRate: hourlyRate ? Number(hourlyRate) : 65,
            activeStatus,
            currentLocation: locationPayload,
            avatar: avatar.trim(),
            name: name.trim(),
            phone: phone.trim()
          })
        });
      }

      // Update state locally in AuthContext
      updateUserLocally({
        name: name.trim(),
        phone: phone.trim(),
        avatar: avatar.trim(),
        bio: bio.trim(),
        businessName: isProvider ? (businessName.trim() || name.trim()) : undefined,
        location: locationPayload
      });

      await refreshUser();
      triggerGlobalRefresh();

      setSuccessMsg('Profile updated successfully! All changes are live.');
      setTimeout(() => {
        setSuccessMsg(null);
        setIsProfileModalOpen(false);
      }, 1200);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setErrorMsg(err.message || 'Error updating profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      id="profile-edit-modal-backdrop" 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsProfileModalOpen(false);
      }}
    >
      <div 
        id="profile-edit-modal-container"
        className="bg-gradient-to-b from-[#edf2ff] via-[#f8fafc] to-[#e8edff] w-full max-w-xl h-[88vh] max-h-[88vh] rounded-2xl shadow-2xl border border-indigo-100/80 overflow-y-auto my-2 flex flex-col transition-all"
      >
        {/* Header - Compact & Sticky */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-4 py-2.5 text-white flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-indigo-300" />
              <span>{isProvider ? 'Provider Profile & Settings' : 'My Account & Settings'}</span>
            </h3>
          </div>
          <button
            id="close-profile-modal-btn"
            onClick={() => setIsProfileModalOpen(false)}
            className="p-1 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs - Compact & Sticky */}
        <div className="flex border-b border-indigo-100 bg-white/95 backdrop-blur-xs px-3 sm:px-4 overflow-x-auto scrollbar-none shrink-0 sticky top-[41px] z-20 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              setProfileActiveTab('profile');
              setSelectedTrackingOrder(null);
            }}
            className={`py-1.5 px-2.5 text-[11px] font-medium border-b-2 flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
              profileActiveTab === 'profile'
                ? 'bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            style={{
              borderColor: profileActiveTab === 'profile' ? theme.accentColor : 'transparent',
              color: profileActiveTab === 'profile' ? theme.accentColor : undefined
            }}
          >
            <UserIcon className="w-3 h-3" />
            <span>Profile Details</span>
          </button>

          {/* 1. SEPARATED WALLET & WALLET BALANCE HISTORY */}
          <button
            type="button"
            onClick={() => {
              setProfileActiveTab('wallet_history');
              setSelectedTrackingOrder(null);
            }}
            className={`py-1.5 px-2.5 text-[11px] font-medium border-b-2 flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
              profileActiveTab === 'wallet_history'
                ? 'bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            style={{
              borderColor: profileActiveTab === 'wallet_history' ? theme.accentColor : 'transparent',
              color: profileActiveTab === 'wallet_history' ? theme.accentColor : undefined
            }}
          >
            <Wallet className="w-3 h-3" />
            <span>Wallet History</span>
            <span className="ml-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono">
              ${walletBalance.toFixed(0)}
            </span>
          </button>

          {/* 2. SEPARATED STORE PRODUCT ORDER HISTORY */}
          <button
            type="button"
            onClick={() => {
              setProfileActiveTab('orders');
              setSelectedTrackingOrder(null);
            }}
            className={`py-1.5 px-2.5 text-[11px] font-medium border-b-2 flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
              profileActiveTab === 'orders'
                ? 'bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            style={{
              borderColor: profileActiveTab === 'orders' ? theme.accentColor : 'transparent',
              color: profileActiveTab === 'orders' ? theme.accentColor : undefined
            }}
          >
            <Package className="w-3 h-3" />
            <span>Order History</span>
            {orders.length > 0 && (
              <span className="ml-0.5 text-[9px] font-normal px-1 py-0.2 rounded-full bg-slate-100 text-slate-700">
                {orders.length}
              </span>
            )}
          </button>

          {/* 3. SEPARATED PROBLEM DISCUSS & SERVICE TICKETS HISTORY */}
          <button
            type="button"
            onClick={() => {
              setProfileActiveTab('problem_history');
              setSelectedTrackingOrder(null);
            }}
            className={`py-1.5 px-2.5 text-[11px] font-medium border-b-2 flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
              profileActiveTab === 'problem_history'
                ? 'bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            style={{
              borderColor: profileActiveTab === 'problem_history' ? theme.accentColor : 'transparent',
              color: profileActiveTab === 'problem_history' ? theme.accentColor : undefined
            }}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Problem Discuss History</span>
            {serviceBookings.length > 0 && (
              <span className="ml-0.5 text-[9px] font-normal px-1 py-0.2 rounded-full bg-indigo-100 text-indigo-700">
                {serviceBookings.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setProfileActiveTab('theme');
              setSelectedTrackingOrder(null);
            }}
            className={`py-1.5 px-2.5 text-[11px] font-medium border-b-2 flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
              profileActiveTab === 'theme'
                ? 'bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            style={{
              borderColor: profileActiveTab === 'theme' ? theme.accentColor : 'transparent',
              color: profileActiveTab === 'theme' ? theme.accentColor : undefined
            }}
          >
            <Palette className="w-3 h-3" />
            <span>Theme</span>
          </button>

          {/* AI Tab ONLY FOR SERVICE PROVIDER! */}
          {currentUser?.role === 'provider' && (
            <button
              type="button"
              onClick={() => {
                setProfileActiveTab('ai');
                setSelectedTrackingOrder(null);
              }}
              className={`py-1.5 px-2.5 text-[11px] font-medium border-b-2 flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                profileActiveTab === 'ai'
                  ? 'bg-white font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
              style={{
                borderColor: profileActiveTab === 'ai' ? theme.accentColor : 'transparent',
                color: profileActiveTab === 'ai' ? theme.accentColor : undefined
              }}
            >
              <Bot className="w-3 h-3" />
              <span>Provider AI</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setProfileActiveTab('language');
              setSelectedTrackingOrder(null);
            }}
            className={`py-1.5 px-2.5 text-[11px] font-medium border-b-2 flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
              profileActiveTab === 'language'
                ? 'bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            style={{
              borderColor: profileActiveTab === 'language' ? theme.accentColor : 'transparent',
              color: profileActiveTab === 'language' ? theme.accentColor : undefined
            }}
          >
            <Globe className="w-3 h-3" />
            <span>Language</span>
            <span className="text-[10px]">{currentLanguageInfo.flag}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setProfileActiveTab('support');
              setSelectedTrackingOrder(null);
            }}
            className={`py-1.5 px-2.5 text-[11px] font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              profileActiveTab === 'support'
                ? 'bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            style={{
              borderColor: profileActiveTab === 'support' ? theme.accentColor : 'transparent',
              color: profileActiveTab === 'support' ? theme.accentColor : undefined
            }}
          >
            <HelpCircle className="w-3 h-3" />
            <span>Support & Help</span>
          </button>
        </div>

        {profileActiveTab === 'profile' ? (
          <form onSubmit={handleSave} className="p-3 sm:p-4 space-y-3 flex-1">
          {/* Notifications */}
          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-800">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Profile Picture */}
          <div className="bg-white p-3 rounded-2xl border border-indigo-100/80 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="relative group flex-shrink-0">
                <img
                  id="profile-picture-preview"
                  src={avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'}
                  alt="Profile Avatar"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500 shadow-xs bg-slate-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';
                  }}
                />
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <input
                  ref={fileInputRef}
                  id="profile-image-file-input"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="upload-profile-storage-btn"
                    disabled={isUploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Change Photo</span>
                      </>
                    )}
                  </button>

                  {uploadedStorageUrl && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Uploaded
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Basic User Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name || ''}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 text-slate-900 font-light"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={phone || ''}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 text-slate-900 font-light"
                />
              </div>
            </div>
          </div>

          {/* Location & GPS */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">
                {isProvider ? 'Service Headquarters' : 'Address'}
              </label>
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isLocating}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-normal flex items-center gap-1 cursor-pointer"
              >
                {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                {isLocating ? 'Detecting...' : 'Detect GPS'}
              </button>
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={address || ''}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter street address, city, or coordinates"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 text-slate-900 font-light"
              />
            </div>
          </div>

          {/* Marketplace Multi-Language Selection Dropdown */}
          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/70">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-800 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>Marketplace Language</span>
                <span className="text-[10px] font-normal text-indigo-700 bg-indigo-100/70 px-1.5 py-0.2 rounded-md">
                  Servexa World
                </span>
              </label>
              <button
                type="button"
                onClick={() => setProfileActiveTab('language')}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-normal hover:underline cursor-pointer"
              >
                All Languages →
              </button>
            </div>
            <div className="relative">
              <select
                value={language || 'en'}
                onChange={(e) => {
                  setLanguage(e.target.value as any);
                  const matched = availableLanguages.find((l) => l.code === e.target.value);
                  setSuccessMsg(`Marketplace language switched to ${matched?.name || e.target.value}!`);
                  setTimeout(() => setSuccessMsg(null), 3000);
                }}
                className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-900 font-normal cursor-pointer appearance-none shadow-2xs"
              >
                {availableLanguages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name} — {l.nativeName} {l.dir === 'rtl' ? '(RTL)' : ''}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-light mt-1">
              Supports real-time localization for catalog, orders, rides, chat, and invoices
            </p>
          </div>

          {/* Bio / About */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {isProvider ? 'Company Bio' : 'About Me'}
            </label>
            <textarea
              rows={2}
              value={bio || ''}
              onChange={(e) => setBio(e.target.value)}
              placeholder={isProvider ? 'Describe your expertise and qualifications...' : 'Add a brief note...'}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 text-slate-900 font-light"
            />
          </div>

          {/* Service Provider Specialized Fields */}
          {isProvider && (
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                Provider Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessName || ''}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Apex Plumbing"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Base Hourly Rate ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      min="1"
                      value={hourlyRate ?? ''}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="65"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Coverage Area
                  </label>
                  <input
                    type="text"
                    value={serviceArea || ''}
                    onChange={(e) => setServiceArea(e.target.value)}
                    placeholder="e.g. San Francisco Bay Area"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Operating Hours
                  </label>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={workingHours || ''}
                      onChange={(e) => setWorkingHours(e.target.value)}
                      placeholder="e.g. 8:00 AM - 8:00 PM"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Status Radio */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Availability Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['online', 'busy', 'offline'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setActiveStatus(status)}
                      className={`py-1.5 px-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        activeStatus === status
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-2 ring-indigo-200'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Theme Setting inside Profile */}
          <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white shadow-2xs text-teal-600">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800">System Theme & Color:</span>
                  <span className="text-xs font-semibold text-teal-700">{theme.name}</span>
                </div>
                <p className="text-[11px] text-slate-500">Applies across top bar, bottom bar, and buttons</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setProfileActiveTab('theme')}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              Customize Theme →
            </button>
          </div>

          {/* Download App in Profile: Removed after install */}
          {!isAppInstalled && (
            <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shadow-2xs">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">Servexa App:</span>
                    <span className="text-xs font-semibold text-indigo-700">Android APK & PWA</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Native push notifications, instant access & offline GPS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApkModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download App</span>
              </button>
            </div>
          )}

          {/* Email Verification Status */}
          {currentUser?.email && (
            <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl shadow-2xs ${currentUser.emailVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">Email Status:</span>
                    <span className={`text-xs font-semibold ${currentUser.emailVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {currentUser.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-xs">{currentUser.email}</p>
                </div>
              </div>
              {!currentUser.emailVerified && (
                <button
                  type="button"
                  onClick={() => sendEmailVerification(currentUser.email)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  Verify Email
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-5 py-2 text-xs font-bold text-white ${theme.btnPrimary} ${theme.btnPrimaryHover} rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
        ) : profileActiveTab === 'theme' ? (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    Theme & Color Appearance
                  </h4>
                  <p className="text-xs text-slate-500">
                    Select a theme to customize top header, bottom navigation bar, and button colors everywhere across Servexa.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                {theme.name}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(THEME_CONFIGS) as ThemeId[]).map((id) => {
                const config = THEME_CONFIGS[id];
                const isSelected = activeThemeId === id;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTheme(id)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'ring-2 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                    style={{
                      borderColor: isSelected ? config.accentColor : undefined,
                      boxShadow: isSelected ? `0 0 0 2px ${config.accentColor}30` : undefined
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {config.name}
                        </span>
                        {id === 'multi-shade' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-100 text-teal-800">
                            Multi-Shade
                          </span>
                        )}
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected ? 'text-white shadow-xs' : 'border border-slate-300 text-transparent'
                        }`}
                        style={{ backgroundColor: isSelected ? config.accentColor : undefined }}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {config.description}
                    </p>

                    {/* Visual Color Preview Bars (Top Navbar, Buttons, Bottom Navbar) */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Top & Bottom Bar:</span>
                        <div
                          className="w-24 h-4 rounded-md shadow-inner border border-slate-200"
                          style={{ background: config.previewGradient }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Buttons Color:</span>
                        <div
                          className="w-24 h-4 rounded-md shadow-xs flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ backgroundColor: config.accentColor }}
                        >
                          Button
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Theme changes save automatically across all views, top & bottom bars, and buttons.</span>
              </span>
              <button
                type="button"
                onClick={() => setProfileActiveTab('profile')}
                className={`px-4 py-2 rounded-xl ${theme.btnPrimary} ${theme.btnPrimaryHover} text-white font-bold text-xs transition-colors cursor-pointer`}
              >
                Back to Profile Details
              </button>
            </div>
          </div>
        ) : profileActiveTab === 'orders' ? (
          <div className="p-6 space-y-5">
            {/* Orders Tab Content */}
            {selectedTrackingOrder ? (
              /* Single Order Detailed Live Tracking View */
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Back button & Title */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedTrackingOrder(null)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    title="Back"
                  >
                    <ArrowLeft className="w-5 h-5 stroke-[1.8]" />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    Order #{selectedTrackingOrder.orderNumber}
                  </span>
                </div>

                {/* Status Hero Card */}
                <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                      <Truck className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Live Tracking & Dispatch
                      </span>
                      <h4 className="text-base font-black text-slate-900 dark:text-white capitalize">
                        {selectedTrackingOrder.orderStatus === 'confirmed' && 'Order Confirmed - Awaiting Dispatch'}
                        {selectedTrackingOrder.orderStatus === 'processing' && 'Preparing & Packaging In Store'}
                        {selectedTrackingOrder.orderStatus === 'dispatched' && 'Dispatched & On The Way!'}
                        {selectedTrackingOrder.orderStatus === 'delivered' && 'Package Successfully Delivered!'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Placed on {new Date(selectedTrackingOrder.createdAt).toLocaleDateString()} at{' '}
                        {new Date(selectedTrackingOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <span className={`self-start sm:self-center px-3 py-1 rounded-full text-xs font-bold capitalize border ${
                    selectedTrackingOrder.orderStatus === 'delivered'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : selectedTrackingOrder.orderStatus === 'dispatched'
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                      : selectedTrackingOrder.orderStatus === 'processing'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-blue-100 text-blue-800 border-blue-300'
                  }`}>
                    {selectedTrackingOrder.orderStatus}
                  </span>
                </div>

                {/* Progress Stepper */}
                <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-2xs">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Order Status
                  </h5>

                  <div className="space-y-3.5">
                    {/* Step 1: Confirmed */}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="w-0.5 h-8 bg-emerald-500 my-0.5" />
                      </div>
                      <div className="pt-0.5">
                        <div className="text-xs font-bold text-slate-900">Order Confirmed</div>
                        <p className="text-[11px] text-slate-500">
                          Paid via {selectedTrackingOrder.paymentMethod === 'wallet' ? 'Wallet' : 'Card'}
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Processing */}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-xs ${
                          ['processing', 'dispatched', 'delivered'].includes(selectedTrackingOrder.orderStatus)
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          <Package className="w-3.5 h-3.5" />
                        </div>
                        <div className={`w-0.5 h-8 my-0.5 ${
                          ['dispatched', 'delivered'].includes(selectedTrackingOrder.orderStatus)
                            ? 'bg-emerald-500'
                            : 'bg-slate-200'
                        }`} />
                      </div>
                      <div className="pt-0.5">
                        <div className="text-xs font-bold text-slate-900">Prepared in Store</div>
                        <p className="text-[11px] text-slate-500">
                          {['processing', 'dispatched', 'delivered'].includes(selectedTrackingOrder.orderStatus)
                            ? 'Packed from inventory'
                            : 'Awaiting packing'}
                        </p>
                      </div>
                    </div>

                    {/* Step 3: Dispatched */}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-xs ${
                          ['dispatched', 'delivered'].includes(selectedTrackingOrder.orderStatus)
                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-200'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                        <div className={`w-0.5 h-8 my-0.5 ${
                          selectedTrackingOrder.orderStatus === 'delivered'
                            ? 'bg-emerald-500'
                            : 'bg-slate-200'
                        }`} />
                      </div>
                      <div className="pt-0.5 flex-1">
                        <div className="text-xs font-bold text-slate-900">Dispatched & In Transit</div>
                        {selectedTrackingOrder.trackingInfo ? (
                          <div className="mt-1 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-0.5">
                            {selectedTrackingOrder.trackingInfo.carrierOrCourier && (
                              <div className="flex justify-between">
                                <span className="text-slate-500">Carrier:</span>
                                <span className="font-bold text-slate-900">{selectedTrackingOrder.trackingInfo.carrierOrCourier}</span>
                              </div>
                            )}
                            {selectedTrackingOrder.trackingInfo.trackingNumber && (
                              <div className="flex justify-between">
                                <span className="text-slate-500">Code:</span>
                                <span className="font-mono font-bold text-indigo-600">{selectedTrackingOrder.trackingInfo.trackingNumber}</span>
                              </div>
                            )}
                            {selectedTrackingOrder.trackingInfo.estimatedDelivery && (
                              <div className="flex justify-between">
                                <span className="text-slate-500">ETA:</span>
                                <span className="font-bold text-emerald-600">{selectedTrackingOrder.trackingInfo.estimatedDelivery}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500">
                            {selectedTrackingOrder.orderStatus === 'dispatched' ? 'Package is in transit' : 'Awaiting courier pickup'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Step 4: Delivered */}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-xs ${
                          selectedTrackingOrder.orderStatus === 'delivered'
                            ? 'bg-emerald-500 text-white ring-2 ring-emerald-200'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="pt-0.5">
                        <div className="text-xs font-bold text-slate-900">Delivered</div>
                        <p className="text-[11px] text-slate-500">
                          {selectedTrackingOrder.orderStatus === 'delivered' ? 'Completed & Handed over' : 'Pending final delivery'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Address & Customer Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Destination Address</span>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 font-semibold">
                      {selectedTrackingOrder.deliveryAddress?.fullName || selectedTrackingOrder.customerName}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      {selectedTrackingOrder.deliveryAddress?.street}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      {selectedTrackingOrder.deliveryAddress?.city}, {selectedTrackingOrder.deliveryAddress?.state} {selectedTrackingOrder.deliveryAddress?.zip}
                    </div>
                    {selectedTrackingOrder.deliveryAddress?.phone && (
                      <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-700">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{selectedTrackingOrder.deliveryAddress.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Item & Store Details</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedTrackingOrder.productImage && (
                        <img
                          src={selectedTrackingOrder.productImage}
                          alt={selectedTrackingOrder.productName}
                          className="w-10 h-10 object-contain rounded-lg bg-slate-50 dark:bg-slate-700 p-0.5 border border-slate-200 dark:border-slate-600 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {selectedTrackingOrder.productName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {selectedTrackingOrder.providerStoreName || selectedTrackingOrder.providerName || 'Specialist Store'}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-700 text-slate-500">
                      <span>Total Paid:</span>
                      <span className="font-bold font-mono text-slate-900 dark:text-white">
                        ${selectedTrackingOrder.totalAmount.toFixed(2)} ({selectedTrackingOrder.quantity}x)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Close/Back button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedTrackingOrder(null)}
                    className="py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    Back to All Orders
                  </button>
                </div>
              </div>
            ) : (
              /* All Orders List: Both Services and Products */
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-indigo-600" />
                      <span>Your Orders & Live Dispatches</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-light">
                      Track specialist service appointments, live GPS dispatch radar, and store deliveries
                    </p>
                  </div>

                  {/* Filter between All, Services, Products */}
                  <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl self-start sm:self-auto text-xs font-normal">
                    <button
                      type="button"
                      onClick={() => setOrderTypeFilter('all')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        orderTypeFilter === 'all'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-medium'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      All ({serviceBookings.length + orders.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderTypeFilter('services')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        orderTypeFilter === 'services'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-medium'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Services ({serviceBookings.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderTypeFilter('products')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        orderTypeFilter === 'products'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-medium'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Products ({orders.length})
                    </button>
                  </div>
                </div>

                {ordersLoading ? (
                  <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    <span>Loading your orders and services...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Empty State */}
                    {((orderTypeFilter === 'all' && serviceBookings.length === 0 && orders.length === 0) ||
                      (orderTypeFilter === 'services' && serviceBookings.length === 0) ||
                      (orderTypeFilter === 'products' && orders.length === 0)) && (
                      <div className="py-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-6">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-3">
                          <Package className="w-6 h-6" />
                        </div>
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white">No Orders Found</h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                          {orderTypeFilter === 'services'
                            ? "You haven't booked any service specialists yet."
                            : orderTypeFilter === 'products'
                            ? "You haven't ordered any products from specialist stores yet."
                            : "You don't have any booked services or store product orders yet."}
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsProfileModalOpen(false)}
                          className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                        >
                          Browse Services & Products
                        </button>
                      </div>
                    )}

                    {/* Service Bookings Items */}
                    {(orderTypeFilter === 'all' || orderTypeFilter === 'services') &&
                      serviceBookings.map((b) => (
                        <div
                          key={`service-${b.id}`}
                          className="p-3.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/70 shadow-2xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 font-light text-slate-800"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.2 rounded-full text-[9px] font-normal bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                Service Booking
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                #{b.id}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(b.createdAt).toLocaleDateString()} at{' '}
                                {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <h5 className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate">
                              {b.serviceName}
                            </h5>

                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-normal">
                              <span className="text-slate-800 dark:text-slate-200 font-medium">{b.providerName}</span>
                              <span>•</span>
                              <span className="font-mono">{formatCurrency(b.price, activeCurrency || 'USD')}</span>
                              <span>•</span>
                              <span className="capitalize">{b.status.replace(/_/g, ' ')}</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate">{b.pickupLocation.address}</span>
                            </div>

                            {b.deliveryPin && (
                              <div className="text-[10px] font-medium text-indigo-700 dark:text-indigo-300">
                                Handover PIN: {b.deliveryPin}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 self-start md:self-center shrink-0">
                            {['accepted', 'confirmed', 'on_the_way', 'arrived', 'in_progress'].includes(b.status) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsProfileModalOpen(false);
                                  openLiveTracking(b.id);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-normal transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                              >
                                <Navigation className="w-3 h-3 text-amber-300" />
                                <span>Track Live Radar</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setIsProfileModalOpen(false);
                                openChat(b.id);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-normal transition-all cursor-pointer flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3 text-indigo-600" />
                              <span>Chat</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setChatHistoryTargetOrder(b);
                                setIsChatHistoryModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-normal transition-all cursor-pointer flex items-center gap-1 border border-indigo-200"
                              title="View saved chat and invoice records"
                            >
                              <FileCheck className="w-3 h-3 text-indigo-600" />
                              <span>History</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                initiateCall(b.providerId, b.providerName, 'provider', b.id, 'audio');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-normal transition-all cursor-pointer flex items-center gap-1 border border-emerald-200"
                            >
                              <PhoneCall className="w-3 h-3 text-emerald-600" />
                              <span>Call</span>
                            </button>

                            {/* Feedback & Star Rating Review Button */}
                            <button
                              type="button"
                              onClick={() => {
                                openFeedbackModal(b);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-normal transition-all shadow-2xs cursor-pointer flex items-center gap-1 ${
                                b.status === 'completed'
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white font-medium'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                              }`}
                              title="Leave verified star rating and text review for specialist"
                            >
                              <Star className={`w-3 h-3 ${b.status === 'completed' ? 'text-white fill-white' : 'text-amber-500 fill-amber-500'}`} />
                              <span>{b.status === 'completed' ? 'Rate Service' : 'Feedback'}</span>
                            </button>
                          </div>
                        </div>
                      ))}

                    {/* Product Orders Items */}
                    {(orderTypeFilter === 'all' || orderTypeFilter === 'products') &&
                      orders.map((ord) => (
                        <div
                          key={`prod-${ord.id}`}
                          className="p-3.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/70 shadow-2xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-light text-slate-800"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-600 flex items-center justify-center p-1">
                              {ord.productImage ? (
                                <img
                                  src={ord.productImage}
                                  alt={ord.productName}
                                  className="max-h-full max-w-full object-contain"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.2 rounded-full text-[9px] font-normal bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                                  Product Delivery
                                </span>
                                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                                  #{ord.orderNumber}
                                </span>
                                <span className={`px-2 py-0.2 rounded-full text-[9px] font-normal capitalize border ${
                                  ord.orderStatus === 'delivered'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                                    : ord.orderStatus === 'dispatched'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800'
                                    : ord.orderStatus === 'processing'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                                }`}>
                                  {ord.orderStatus}
                                </span>
                              </div>

                              <h5 className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate mt-0.5">
                                {ord.productName}
                              </h5>

                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-light">
                                {ord.quantity}x • <span className="font-mono">{formatCurrency(ord.totalAmount, activeCurrency || 'USD')}</span> total • {new Date(ord.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => setSelectedTrackingOrder(ord)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-normal transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Track Shipment</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : profileActiveTab === 'wallet_history' ? (
          /* SEPARATED WALLET & WALLET BALANCE HISTORY */
          <div className="p-4 sm:p-6 space-y-5 bg-white text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Account Wallet & Balance History
                  </h3>
                  <p className="text-[11px] text-slate-500 font-light">
                    Every user account includes an integrated wallet. View balance, top-ups, and transaction receipts.
                  </p>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-mono self-start sm:self-auto">
                Status: {currentUser?.walletStatus === 'active' || currentUser?.identityVerified ? 'Active & Verified' : 'Standard Wallet'}
              </div>
            </div>

            {/* Wallet Balance Hero Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Available Wallet Balance
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-white/10">
                  {currentUser?.preferredCurrency || 'USD'}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                  ${walletBalance.toFixed(2)}
                </span>
                <span className="text-xs text-slate-400 font-medium">Credits</span>
              </div>

              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                <span className="font-mono text-[11px] truncate max-w-xs">
                  Wallet ID: {currentUser?.walletAddress || `0x71b${currentUser?.id || 'cust'}`}
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  ✓ Instant Chat Payments Enabled
                </span>
              </div>
            </div>

            {/* Separated Transaction History Ledger */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Separated Wallet Transactions Ledger
                </h4>
                <span className="text-[11px] font-mono text-slate-400">
                  {walletTransactions.length} records
                </span>
              </div>

              {walletLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Loading wallet history...
                </div>
              ) : walletTransactions.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <Wallet className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Transactions Yet</p>
                  <p className="text-[11px] text-slate-400">
                    Your wallet balance starts at $0.00. Deposits and service invoice payments will be recorded here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {walletTransactions.map((tx: any, idx: number) => {
                    const isCredit = tx.type === 'deposit' || tx.type === 'refund' || tx.type === 'credit';
                    return (
                      <div
                        key={tx.id || idx}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                isCredit
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {tx.type}
                            </span>
                            <span className="font-bold text-slate-900 truncate">
                              {tx.description || (isCredit ? 'Wallet Top-Up' : 'Service / Order Payment')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {new Date(tx.timestamp || tx.createdAt || Date.now()).toLocaleString()}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-sm font-black font-mono block ${
                              isCredit ? 'text-emerald-600' : 'text-slate-900'
                            }`}
                          >
                            {isCredit ? '+' : '-'}${Math.abs(tx.amount || 0).toFixed(2)}
                          </span>
                          {tx.balanceAfter !== undefined && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Bal: ${tx.balanceAfter.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : profileActiveTab === 'problem_history' ? (
          /* SEPARATED PROBLEM DISCUSS & SERVICE TICKETS HISTORY */
          <div className="p-4 sm:p-6 space-y-5 bg-white text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-xs">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Problem Discuss & Service Request History
                  </h3>
                  <p className="text-[11px] text-slate-500 font-light">
                    Separated log of all issues described, specialist diagnoses, chat sessions, and invoice history.
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold font-mono self-start sm:self-auto">
                {serviceBookings.length} Problem Discussions
              </span>
            </div>

            {serviceBookings.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-2">
                <MessageSquare className="w-8 h-8 text-indigo-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Problem Discussions Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When you select a service category and describe your issue on the map, your discussion history and attached media will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {serviceBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 sm:p-5 rounded-3xl border border-slate-200 bg-white hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                            {booking.serviceName || 'Service Request'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              booking.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : booking.status === 'accepted' || booking.status === 'in_progress'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {booking.status.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            #{booking.id}
                          </span>
                        </div>

                        <p className="text-xs text-slate-800 font-medium">
                          {booking.issueDescription || (booking as any).problemDescription || 'Urgent repair diagnostic'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black font-mono text-slate-900 block">
                          ${(booking.totalAmount || 85).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Specialist Profile Details (Seen in Problem History / Chatbox) */}
                    {booking.providerBusinessName && (
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={booking.providerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                            alt={booking.providerBusinessName}
                            className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-900 block truncate">
                              {booking.providerBusinessName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-light">
                              Assigned Service Specialist
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              initiateCall(booking.providerId, booking.providerBusinessName || 'Provider', 'provider', booking.id, 'audio');
                            }}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                            title="Call Provider"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileModalOpen(false);
                              openChat(booking.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Open Chat</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : profileActiveTab === 'ai' ? (
          /* AI Settings Panel: Manage AI voice, tempo, and mode from profile */
          <form onSubmit={handleSaveAiSettings} className="p-5 space-y-4 bg-white text-left font-light text-slate-800">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-slate-900">Servexa AI Voice & Assistant Settings</h4>
                  <p className="text-[11px] text-slate-500 font-light">Configure voice persona, playback speed, and activation mode</p>
                </div>
              </div>
            </div>

            {aiSuccessMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-normal text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{aiSuccessMsg}</span>
              </div>
            )}

            {/* Voice Persona Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-slate-600 block uppercase tracking-wider">
                Voice Persona
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {VOICE_PERSONAS.map((p) => {
                  const isSelected = aiPersona === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setAiPersona(p.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-0.5 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-2xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs text-slate-900">{p.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <span className="text-[10px] text-slate-500 font-light">{p.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversational Playback Speed */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">
                  Playback Speed
                </label>
                <span className="text-xs font-mono font-medium text-indigo-600">{aiSpeed}x tempo</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[0.75, 1.0, 1.25, 1.5, 1.75].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setAiSpeed(spd)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-normal transition-all cursor-pointer border ${
                      aiSpeed === spd
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Activation Mode */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-slate-600 uppercase tracking-wider block">
                Microphone Voice Activation Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAiVoiceMode('always_listening')}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-start gap-2 ${
                    aiVoiceMode === 'always_listening'
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-2xs'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="text-xs font-medium text-slate-900">Always-Listening Mode</h5>
                    <p className="text-[10px] text-slate-500 font-light">Auto-detects speech pauses and responds hands-free</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAiVoiceMode('push_to_talk')}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-start gap-2 ${
                    aiVoiceMode === 'push_to_talk'
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-2xs'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="text-xs font-medium text-slate-900">Push-to-Talk Mode</h5>
                    <p className="text-[10px] text-slate-500 font-light">Tap mic to speak and tap again to send</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-1.5">
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save AI Preferences</span>
              </button>
            </div>
          </form>
        ) : profileActiveTab === 'language' ? (
          /* Multi-Language Localization Panel */
          <div className="p-5 sm:p-6 space-y-5 bg-white text-left font-light text-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-slate-900">
                    {t('profile.languageTitle', 'Multi-Language Localization')}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-light">
                    {t('profile.languageSubtitle', 'Choose your preferred language for the Servexa World marketplace')}
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 font-mono text-slate-600">
                {currentLanguageInfo.flag} {currentLanguageInfo.code.toUpperCase()}
              </span>
            </div>

            {/* Language Selection Dropdown Component */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <label className="text-xs font-medium text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Language Selection Dropdown</span>
                </span>
                <span className="text-[10px] text-slate-500 font-light">
                  Active: {currentLanguageInfo.name} ({currentLanguageInfo.nativeName})
                </span>
              </label>

              <div className="relative">
                <select
                  value={language || 'en'}
                  onChange={(e) => {
                    const newCode = e.target.value as any;
                    setLanguage(newCode);
                    setSuccessMsg(t('profile.savedLanguage', 'Language preference saved!'));
                    setTimeout(() => setSuccessMsg(null), 3000);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-light appearance-none pr-9 shadow-2xs"
                >
                  {availableLanguages.map((item) => (
                    <option key={item.code} value={item.code} className="py-1">
                      {item.flag} {item.name} — {item.nativeName} {item.dir === 'rtl' ? '(Right-to-Left RTL)' : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-light pt-1">
                <span>Direction: <strong className="font-medium text-slate-700">{isRTL ? 'Right-to-Left (RTL)' : 'Left-to-Right (LTR)'}</strong></span>
                <span>Supported: <strong className="font-medium text-indigo-600">10 Global Languages</strong></span>
              </div>
            </div>

            {/* Grid of All Available Languages */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block">
                  Quick Select Marketplace Language
                </label>
                <span className="text-[10px] text-slate-400 font-light">Click card to switch instantly</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {availableLanguages.map((langItem) => {
                  const isSelected = language === langItem.code;
                  return (
                    <button
                      key={langItem.code}
                      type="button"
                      onClick={() => {
                        setLanguage(langItem.code);
                        setSuccessMsg(`Language switched to ${langItem.name}!`);
                        setTimeout(() => setSuccessMsg(null), 2500);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-2xs ring-1 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                      style={{
                        borderColor: isSelected ? theme.accentColor : undefined
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">{langItem.flag}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-900 truncate">{langItem.nativeName}</div>
                        <div className="text-[10px] text-slate-500 font-light truncate">{langItem.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Translation Preview Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Real-Time Marketplace Translation Preview</span>
                </span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md font-mono">
                  LIVE
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                  <div className="text-[9px] text-slate-400 font-light">Marketplace Tab</div>
                  <div className="text-xs font-normal text-slate-800 truncate">{t('nav.home', 'Marketplace')}</div>
                </div>

                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                  <div className="text-[9px] text-slate-400 font-light">Booking Action</div>
                  <div className="text-xs font-normal text-slate-800 truncate">{t('action.bookNow', 'Book Now')}</div>
                </div>

                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                  <div className="text-[9px] text-slate-400 font-light">Ride Tracking</div>
                  <div className="text-xs font-normal text-slate-800 truncate">{t('action.track', 'Track Live Ride')}</div>
                </div>

                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                  <div className="text-[9px] text-slate-400 font-light">Feedback Action</div>
                  <div className="text-xs font-normal text-slate-800 truncate">{t('action.leaveReview', 'Leave Feedback')}</div>
                </div>

                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                  <div className="text-[9px] text-slate-400 font-light">Orders Section</div>
                  <div className="text-xs font-normal text-slate-800 truncate">{t('nav.orders', 'Orders & Bookings')}</div>
                </div>

                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                  <div className="text-[9px] text-slate-400 font-light">Review Modal Title</div>
                  <div className="text-xs font-normal text-slate-800 truncate">{t('review.modalTitle', 'Service Feedback & Review')}</div>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setProfileActiveTab('profile')}
                className="text-xs text-slate-500 hover:text-slate-800 font-normal hover:underline cursor-pointer"
              >
                ← Back to Profile Details
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuccessMsg(t('profile.savedLanguage', 'Language preference saved!'));
                  setTimeout(() => setSuccessMsg(null), 2500);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                style={{
                  backgroundColor: theme.accentColor
                }}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Localization</span>
              </button>
            </div>
          </div>
        ) : (
          /* Support & Help Center: Content updated by Admin from Admin Panel */
          <div className="p-4 sm:p-6 space-y-5 bg-white text-left font-normal text-slate-800">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50 to-indigo-50 border border-teal-200/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Servexa Support & Help Center</h3>
                  <p className="text-[11px] text-slate-600 font-light">
                    {supportContent?.announcementText || '24/7 dedicated support & live dispatch arbitration.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Staff On Duty
                </span>
              </div>
            </div>

            {/* Quick Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Phone Hotline */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-teal-400 transition-colors shadow-2xs">
                <div className="flex items-center gap-2 text-teal-700 font-medium text-xs mb-1">
                  <PhoneCall className="w-4 h-4" />
                  <span>24/7 Phone Hotline</span>
                </div>
                <a
                  href={`tel:${supportContent?.supportPhone || '+18007378392'}`}
                  className="text-xs font-semibold text-slate-900 hover:text-teal-700 font-mono block mt-1"
                >
                  {supportContent?.supportPhone || '+1 (800) 737-8392'}
                </a>
                <span className="text-[10px] text-slate-400 font-light block mt-0.5">
                  Direct PBX voice queue
                </span>
              </div>

              {/* Email Support */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-teal-400 transition-colors shadow-2xs">
                <div className="flex items-center gap-2 text-indigo-700 font-medium text-xs mb-1">
                  <Mail className="w-4 h-4" />
                  <span>Email Assistance</span>
                </div>
                <a
                  href={`mailto:${supportContent?.supportEmail || 'support@servexaworld.com'}`}
                  className="text-xs font-semibold text-slate-900 hover:text-indigo-700 font-mono block mt-1 truncate"
                >
                  {supportContent?.supportEmail || 'support@servexaworld.com'}
                </a>
                <span className="text-[10px] text-slate-400 font-light block mt-0.5">
                  Avg response: {supportContent?.averageResponseTime || '< 2 mins'}
                </span>
              </div>

              {/* Live Support Ticket / Dispute */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 transition-colors shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 font-medium text-xs mb-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>Live Dispute Chat</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-light block">
                    Arbitrate active orders & escrow
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    openFileComplaint();
                  }}
                  className="mt-2 w-full py-1.5 px-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-medium transition-all text-center cursor-pointer shadow-2xs"
                >
                  Open Support Ticket →
                </button>
              </div>
            </div>

            {/* Safety & Protection Rules */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
              <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Servexa Verified Safety & Guarantee Standards</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                {(supportContent?.safetyGuides || [
                  { title: 'Identity Verified', desc: 'Government ID & trade license audited' },
                  { title: 'Encrypted PBX VoIP', desc: 'End-to-end voice and video channels' },
                  { title: 'Escrow Protection', desc: 'Funds released only on 4-digit PIN' }
                ]).map((g: any, i: number) => (
                  <div key={i} className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-800 block text-xs">{g.title}</span>
                    <span className="text-slate-500 font-light text-[10px]">{g.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Searchable FAQs */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
                    Frequently Asked Questions (Admin Verified)
                  </h4>
                  <p className="text-[10px] text-slate-400 font-light">
                    Direct guidance on orders, payments, calls, and cancellations
                  </p>
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={faqSearch || ''}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    placeholder="Search help topics..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* FAQs Accordion */}
              <div className="space-y-2">
                {((supportContent?.faqs || []).filter((f: any) =>
                  !faqSearch ||
                  f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
                  f.answer.toLowerCase().includes(faqSearch.toLowerCase()) ||
                  (f.category && f.category.toLowerCase().includes(faqSearch.toLowerCase()))
                )).map((faq: any, idx: number) => {
                  const isExpanded = expandedFaqId === (faq.id || String(idx));
                  return (
                    <div
                      key={faq.id || idx}
                      className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaqId(isExpanded ? null : (faq.id || String(idx)))}
                        className="w-full p-3 text-left flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="px-1.5 py-0.2 rounded bg-teal-50 text-teal-700 text-[9px] font-medium border border-teal-200 shrink-0">
                            {faq.category || 'General'}
                          </span>
                          <span className="text-xs font-medium text-slate-900 truncate">
                            {faq.question}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 text-xs text-slate-600 font-light leading-relaxed border-t border-slate-100 bg-slate-50/40">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {/* Chat History Records Modal */}
        <ChatHistoryModal
          isOpen={isChatHistoryModalOpen}
          onClose={() => setIsChatHistoryModalOpen(false)}
          selectedOrder={chatHistoryTargetOrder}
        />
      </div>
    </div>
  );
};
