import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Home, Wallet, Package, User, ShoppingBag } from 'lucide-react';

interface BottomNavProps {
  onOpenWallet: () => void;
  onOpenOrders?: () => void;
  onOpenProfile?: () => void;
  onSelectServicesSection?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  onOpenWallet,
  onOpenOrders,
  onOpenProfile
}) => {
  const {
    activeView,
    setActiveView,
    currentUser,
    setIsAuthModalOpen,
    setAuthModalTab,
    setIsProfileModalOpen,
    setProfileActiveTab,
    openOrdersTracking,
    setIsAiModalOpen,
    unreadNotifsCount
  } = useAuth();

  const { theme } = useTheme();

  const handleHomeClick = () => {
    setActiveView('customer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrdersClick = () => {
    if (onOpenOrders) {
      onOpenOrders();
    } else {
      if (!currentUser) {
        setAuthModalTab('login');
        setIsAuthModalOpen(true);
        return;
      }
      openOrdersTracking();
      setIsProfileModalOpen(true);
    }
  };

  const handleProfileClick = () => {
    if (onOpenProfile) {
      onOpenProfile();
    } else {
      if (!currentUser) {
        setAuthModalTab('login');
        setIsAuthModalOpen(true);
        return;
      }
      setProfileActiveTab('profile');
      setIsProfileModalOpen(true);
    }
  };

  const isHomeActive = activeView === 'customer';
  const isProductsActive = activeView === 'products' || activeView === 'product-category';

  return (
    <nav
      aria-label="Bottom Navigation"
      className={`fixed bottom-0 left-0 right-0 z-50 ${theme.bottomNavBg} border-t ${theme.bottomNavBorder} shadow-[0_-4px_30px_rgba(0,0,0,0.12)] backdrop-blur-md px-3 sm:px-8 py-2 transition-all duration-300 pb-[max(0.6rem,env(safe-area-inset-bottom))]`}
    >
      <div className="max-w-md mx-auto flex items-center justify-around gap-2 w-full min-w-0">
        {/* 1. HOME BUTTON */}
        <button
          type="button"
          onClick={handleHomeClick}
          className="flex-1 py-1.5 flex items-center justify-center transition-all cursor-pointer group bg-transparent border-0 active:scale-90"
          title="Home"
          aria-label="Home"
        >
          <div className="relative p-1 transition-all shrink-0">
            <Home
              className={`w-6 h-6 sm:w-6.5 sm:h-6.5 shrink-0 transition-transform ${
                isHomeActive
                  ? 'stroke-[2.8] text-indigo-600 dark:text-indigo-400 scale-110'
                  : 'stroke-[1.5] text-slate-400 hover:text-slate-600 dark:text-slate-500 scale-100'
              }`}
            />
          </div>
        </button>

        {/* 2. PRODUCTS BUTTON */}
        <button
          type="button"
          onClick={() => {
            setActiveView('products');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex-1 py-1.5 flex items-center justify-center transition-all cursor-pointer group bg-transparent border-0 active:scale-90"
          title="Products"
          aria-label="Products"
        >
          <div className="relative p-1 transition-all shrink-0">
            <ShoppingBag
              className={`w-6 h-6 sm:w-6.5 sm:h-6.5 shrink-0 transition-transform ${
                isProductsActive
                  ? 'stroke-[2.8] text-indigo-600 dark:text-indigo-400 scale-110'
                  : 'stroke-[1.5] text-slate-400 hover:text-slate-600 dark:text-slate-500 scale-100'
              }`}
            />
          </div>
        </button>

        {/* 3. WALLET BUTTON */}
        <button
          type="button"
          onClick={onOpenWallet}
          className="flex-1 py-1.5 flex items-center justify-center transition-all cursor-pointer group bg-transparent border-0 active:scale-90"
          title="Wallet"
          aria-label="Wallet"
        >
          <div className="relative p-1 transition-all shrink-0">
            <Wallet className="w-6 h-6 sm:w-6.5 sm:h-6.5 text-slate-400 hover:text-emerald-600 dark:text-slate-500 stroke-[1.5] shrink-0 transition-colors" />
            {currentUser?.walletBalance !== undefined && currentUser.walletBalance > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[8px] font-bold bg-emerald-600 text-white shadow-xs max-w-[38px] truncate shrink-0">
                ${Math.round(currentUser.walletBalance)}
              </span>
            )}
          </div>
        </button>

        {/* 4. ORDERS BUTTON */}
        <button
          type="button"
          onClick={handleOrdersClick}
          className="flex-1 py-1.5 flex items-center justify-center transition-all cursor-pointer group bg-transparent border-0 active:scale-90"
          title="Orders"
          aria-label="Orders"
        >
          <div className="relative p-1 transition-all shrink-0">
            <Package className="w-6 h-6 sm:w-6.5 sm:h-6.5 text-slate-400 hover:text-amber-500 dark:text-slate-500 stroke-[1.5] shrink-0 transition-colors" />
          </div>
        </button>

        {/* 5. PROFILE BUTTON */}
        <button
          type="button"
          onClick={handleProfileClick}
          className="flex-1 py-1.5 flex items-center justify-center transition-all cursor-pointer group bg-transparent border-0 active:scale-90"
          title="Profile"
          aria-label="Profile"
        >
          <div className="relative p-1 transition-all shrink-0">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full object-cover border border-slate-300 shrink-0 shadow-2xs hover:scale-105 transition-transform"
              />
            ) : (
              <User className="w-6 h-6 sm:w-6.5 sm:h-6.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 stroke-[1.5] shrink-0 transition-colors" />
            )}
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-white" />
              </span>
            )}
          </div>
        </button>
      </div>
    </nav>
  );
};
