import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ServexaLogo } from './common/ServexaLogo';
import {
  Sparkles,
  PhoneCall,
  Bell,
  Wallet,
  Shield,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Car,
  CheckCircle2,
  X,
  Truck,
  ShoppingBag,
  Palette,
  Bot,
  Smartphone
} from 'lucide-react';

interface NavbarProps {
  onOpenWalletModal: () => void;
  onOpenSearch?: () => void;
  onOpenPresentation?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenWalletModal, onOpenSearch, onOpenPresentation }) => {
  const {
    currentUser,
    activeView,
    setActiveView,
    logout,
    notifications,
    unreadNotifsCount,
    markNotificationsAsRead,
    activeCall,
    setIsAuthModalOpen,
    setAuthModalTab,
    setIsAiModalOpen,
    setIsProfileModalOpen,
    setProfileActiveTab,
    openOrdersTracking,
    login,
    loginWithWallet,
    isAppInstalled,
    setIsApkModalOpen
  } = useAuth();

  const { theme, setIsThemeModalOpen } = useTheme();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadNotifsCount > 0) {
      markNotificationsAsRead();
    }
  };

  return (
    <header className={`sticky top-0 z-50 ${theme.navbarBg} border-b ${theme.navbarBorder} shadow-2xs backdrop-blur-md transition-all duration-300 w-full overflow-visible py-1 sm:py-1.5`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-7 w-full">
        <div className="flex items-center justify-between h-13 sm:h-15 md:h-16 gap-2 sm:gap-3 transition-all w-full min-w-0">
          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink min-w-0">
            <button
              onClick={() => setActiveView('customer')}
              className="flex items-center gap-1.5 text-left group cursor-pointer shrink min-w-0"
            >
              <ServexaLogo size={26} showText={true} />
            </button>

            {/* Account Role Badge & Console Link */}
            <div className="hidden lg:flex items-center gap-1.5 shrink-0">
              {currentUser?.role === 'provider' && activeView !== 'customer' ? (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200/80 rounded-lg text-emerald-800 text-[10px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Provider Console</span>
                  <span className="text-[8px] bg-white px-1 py-0.2 rounded border border-emerald-200 font-normal text-emerald-700">
                    Live
                  </span>
                </div>
              ) : currentUser?.role === 'admin' ? (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700 text-[10px] font-medium">
                  <Shield className="w-3 h-3" />
                  <span>Admin</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right Controls: Responsive Flexbox container forcing shrink and hiding non-essential elements on mobile */}
          <div className="flex items-center justify-end gap-1 sm:gap-1.5 flex-1 min-w-0">


            {/* Servexa AI Intelligent Voice Sound Button - ONLY FOR SERVICE PROVIDER */}
            {currentUser?.role === 'provider' && (
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="relative flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:via-teal-500 hover:to-indigo-500 text-white text-[9px] sm:text-xs font-medium shadow-2xs transition-all cursor-pointer active:scale-95 group border border-teal-400/30 overflow-hidden shrink min-w-0"
                title="Service Provider AI Assistant & Voice Dispatch"
              >
                {/* Sound Equalizer Waves */}
                <div className="flex items-end gap-0.5 h-2.5 w-2.5 shrink-0 py-0.5">
                  <span className="w-0.5 h-full bg-emerald-200 rounded-full animate-pulse" />
                  <span className="w-0.5 h-2 bg-white rounded-full animate-pulse delay-75" />
                  <span className="w-0.5 h-1.5 bg-teal-200 rounded-full animate-pulse delay-150" />
                </div>
                <span className="tracking-tight hidden sm:inline">Provider AI</span>
              </button>
            )}

            {/* Active PBX Call banner */}
            {activeCall && (
              <div className="hidden xs:flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 border border-emerald-300 rounded-full text-emerald-800 text-[9px] sm:text-xs font-medium animate-pulse shrink min-w-0 max-w-[100px]">
                <PhoneCall className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="hidden sm:inline truncate max-w-[70px]">{activeCall.calleeName}</span>
              </div>
            )}

            {/* Wallet Balance Component - Responsive Flexbox with shrink & non-essential element hiding */}
            {currentUser && (
              <button
                onClick={onOpenWalletModal}
                className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/90 hover:bg-white border border-slate-200/90 rounded-lg text-[9px] sm:text-xs font-medium text-slate-800 transition-colors shadow-2xs cursor-pointer flex-shrink min-w-0 max-w-[75px] xs:max-w-[95px] sm:max-w-none group"
                title="View Wallet & Transactions"
              >
                <Wallet className="w-3 h-3 shrink-0" style={{ color: theme.accentColor }} />
                <span className="hidden md:inline text-slate-400 text-[10px] font-normal">Bal:</span>
                <span className="truncate min-w-0 font-semibold tracking-tight">
                  <span className="hidden xs:inline">${(currentUser.walletBalance ?? 0).toFixed(2)}</span>
                  <span className="xs:hidden">${Math.round(currentUser.walletBalance ?? 0)}</span>
                </span>
              </button>
            )}

            {/* Notifications Dropdown - Positioned Aside with Responsive Flexbox */}
            {currentUser && (
              <div className="relative flex items-center shrink-0 min-w-0">
                <button
                  onClick={handleNotificationClick}
                  className="relative flex items-center justify-center p-1 sm:p-1.5 text-slate-700 hover:text-slate-900 hover:bg-white/60 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Notifications"
                  aria-label="View Notifications"
                >
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-white" />
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <div className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] max-w-xs sm:w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
                      {/* Downward indicator arrow */}
                      <div className="absolute -top-1.5 right-3 w-3 h-3 bg-white border-t border-l border-slate-200 rotate-45" />
                      <div className="relative z-10 flex items-center justify-between px-3 py-1 border-b border-slate-100">
                        <span className="text-[11px] font-semibold text-slate-800">Notifications</span>
                        <span className="text-[9px] text-slate-500">{notifications.length} alerts</span>
                      </div>
                      <div className="relative z-10 max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <p className="p-3 text-center text-[10px] text-slate-400 font-light">No new notifications</p>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-2 text-[10px] hover:bg-slate-50 transition-colors ${
                                !notif.read ? 'bg-indigo-50/40' : ''
                              }`}
                            >
                              <p className="font-semibold text-slate-900 text-[10.5px]">{notif.title}</p>
                              <p className="text-slate-600 text-[9.5px] leading-relaxed font-light">
                                {notif.message}
                              </p>
                              <span className="text-[8px] text-slate-400 mt-0.5 block font-light">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Unauthenticated: Customer Sign In / Wallet Login */}
            {!currentUser ? (
              <div className="flex items-center gap-1 shrink min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab('login');
                    setIsAuthModalOpen(true);
                  }}
                  className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 ${theme.btnPrimary} ${theme.btnPrimaryHover} rounded-lg text-[10px] sm:text-xs font-medium transition-all shadow-xs cursor-pointer active:scale-95 shrink min-w-0`}
                  title="Customer Sign In & Wallet Login"
                >
                  <Wallet className="w-3 h-3 opacity-90 shrink-0" />
                  <span className="truncate">Sign In</span>
                </button>
              </div>
            ) : (
              /* Signed-in user profile menu */
              <div className="relative flex items-center shrink-0">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-lg hover:bg-white/60 transition-colors cursor-pointer shrink-0"
                >
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <ChevronDown className="hidden xs:block w-3 h-3 text-slate-400 shrink-0" />
                </button>

                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] max-w-xs sm:w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
                      {/* Downward indicator arrow pointing up to avatar */}
                      <div className="absolute -top-1.5 right-3 w-3 h-3 bg-white border-t border-l border-slate-200 rotate-45" />

                      <div className="relative z-10 px-3 py-1.5 border-b border-slate-100">
                        <p className="text-[11px] font-bold text-slate-900 leading-tight">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            currentUser.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            Status: {currentUser.status}
                          </span>
                          {currentUser.verified && (
                            <span className="text-[9px] font-semibold text-indigo-600 flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Account Type Details */}
                      <div className="relative z-10 px-3 py-1.5 border-b border-slate-100 bg-slate-50/60">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500">Account Type</span>
                          <span className="font-bold text-slate-800 capitalize bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[9.5px]">
                            {currentUser.role === 'provider' ? 'Service Provider' : currentUser.role === 'admin' ? 'Super Admin' : 'Customer'}
                          </span>
                        </div>
                        {currentUser.role === 'customer' && (
                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              setAuthModalTab('register');
                              setIsAuthModalOpen(true);
                            }}
                            className="mt-1.5 w-full text-left px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <span>List as Service Provider</span>
                            <span className="text-[8px] font-bold bg-indigo-600 text-white px-1 py-0.2 rounded">Free</span>
                          </button>
                        )}
                      </div>

                      <div className="relative z-10 p-1 space-y-0.5">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            setProfileActiveTab('profile');
                            setIsProfileModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Edit Profile & Photo</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            setProfileActiveTab('theme');
                            setIsProfileModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Palette className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>Theme Appearance</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            openOrdersTracking();
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Product Orders & Tracking</span>
                        </button>

                        {!isAppInstalled && (
                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              setIsApkModalOpen(true);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Smartphone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>Download App (APK)</span>
                          </button>
                        )}

                        <button
                          onClick={() => { logout(); setShowProfileMenu(false); }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 shrink-0" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
