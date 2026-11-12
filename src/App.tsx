/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { CustomerView } from './components/CustomerView/CustomerView';
import { ProviderView } from './components/ProviderView/ProviderView';
import { AdminView } from './components/AdminView/AdminView';
import { ProductsPageView } from './components/Products/ProductsPageView';
import { SearchPageView } from './components/Search/SearchPageView';
import { ServiceCategoryPageView } from './components/CustomerView/ServiceCategoryPageView';
import { ProductSubcategoriesPage } from './components/CustomerView/ProductSubcategoriesPage';
import { COMPREHENSIVE_PRODUCTS } from './data/initialProducts';
import { AuthModal } from './components/AuthModal';
import { WalletModal } from './components/WalletModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { ProviderProfileModal } from './components/ProviderProfileModal';
import { BookingModal } from './components/BookingModal';
import { PBXCallModal } from './components/PBXVoIP/PBXCallModal';
import { ChatDrawer } from './components/Chat/ChatDrawer';
import { LiveOrderTrackerModal } from './components/Tracking/LiveOrderTrackerModal';
import { DisputeModal } from './components/Disputes/DisputeModal';
import { SupportChatDrawer } from './components/Disputes/SupportChatDrawer';
import { EmailVerificationModal } from './components/Auth/EmailVerificationModal';
import { StorefrontViewModal } from './components/Storefront/StorefrontViewModal';
import { ProfileEditModal } from './components/Profile/ProfileEditModal';
import { ServiceRatingModal } from './components/Reviews/ServiceRatingModal';
import { CartDrawer } from './components/Cart/CartDrawer';
import { ApkDownloadModal } from './components/ApkDownloadModal';
import { ThemeSelectorModal } from './components/Theme/ThemeSelectorModal';
import { PresentationModal } from './components/Presentation/PresentationModal';
import { BottomNav } from './components/Navigation/BottomNav';
import { PushNotificationToast } from './components/common/PushNotificationToast';
import { ProviderProfile, ServiceItem } from './types';
import { Sparkles, Phone, ShieldCheck, Heart, Smartphone, Download } from 'lucide-react';

function AppContent() {
  const {
    activeView,
    setActiveView,
    selectedProviderId,
    closeProviderProfile,
    openProviderProfile,
    setIsAiModalOpen,
    currentUser,
    initiateCall,
    openStorefrontSubdomain,
    openLiveTracking,
    feedbackModalBooking,
    closeFeedbackModal,
    isApkModalOpen,
    setIsApkModalOpen,
    isAppInstalled,
    selectedServiceCategory,
    selectedProductCategory,
    setSelectedProductCategory,
    addToCart,
    setIsCartOpen
  } = useAuth();

  const { theme } = useTheme();

  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [bookingProvider, setBookingProvider] = useState<ProviderProfile | null>(null);
  const [bookingService, setBookingService] = useState<ServiceItem | null>(null);

  // Check URL query parameters on load for direct store or tracking links
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storeParam = params.get('store');
    const trackParam = params.get('track');
    const presentationParam = params.get('presentation') || params.get('slides');
    if (storeParam) {
      openStorefrontSubdomain(storeParam);
    }
    if (trackParam) {
      openLiveTracking(trackParam);
    }
    if (presentationParam === 'true' || presentationParam === '1') {
      setIsPresentationOpen(true);
    }
  }, [openStorefrontSubdomain, openLiveTracking]);

  const handleOpenBookingModal = (provider: ProviderProfile, service: ServiceItem) => {
    setBookingProvider(provider);
    setBookingService(service);
  };

  const handleCloseBookingModal = () => {
    setBookingProvider(null);
    setBookingService(null);
  };

  return (
    <div className={`min-h-screen ${theme.pageBackground} text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-300 w-full overflow-x-clip min-w-0`}>
      {/* Top Universal Navbar - Sticky Header Always Visible */}
      <Navbar
        onOpenWalletModal={() => setIsWalletOpen(true)}
        onOpenSearch={() => setIsAiModalOpen(true)}
        onOpenPresentation={() => setIsPresentationOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full min-w-0 pb-16 sm:pb-20">
        {activeView === 'customer' && (
          <CustomerView
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            onOpenBookingModal={handleOpenBookingModal}
          />
        )}

        {(activeView === 'products' || activeView === 'product-category') && (
          <ProductsPageView
            onBackToHome={() => setActiveView('customer')}
          />
        )}

        {activeView === 'service-category' && (
          selectedServiceCategory ? (
            <ServiceCategoryPageView
              category={selectedServiceCategory}
              onBack={() => setActiveView('customer')}
              onOpenBookingModal={handleOpenBookingModal}
            />
          ) : (
            <CustomerView
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              onOpenBookingModal={handleOpenBookingModal}
            />
          )
        )}

        {activeView === 'search' && (
          <SearchPageView
            onOpenBookingModal={handleOpenBookingModal}
            onBackToHome={() => setActiveView('customer')}
          />
        )}

        {activeView === 'provider' && <ProviderView />}

        {activeView === 'admin' && currentUser?.role === 'admin' && <AdminView />}
      </main>

      {/* 5 Bottom Buttons: Home, Services, Wallet, Orders, Profile */}
      <BottomNav onOpenWallet={() => setIsWalletOpen(true)} />

      {/* Real-Time Push Notification Toast & Permission System */}
      <PushNotificationToast />

      {/* Modals and Overlays */}
      <AuthModal />
      <ThemeSelectorModal />
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
      <CartDrawer />
      <ApkDownloadModal isOpen={isApkModalOpen} onClose={() => setIsApkModalOpen(false)} />
      <AiAssistantModal onSelectCategory={setSelectedCategoryId} />
      <ProviderProfileModal
        providerId={selectedProviderId}
        onClose={closeProviderProfile}
        onBookService={handleOpenBookingModal}
      />
      <BookingModal
        provider={bookingProvider}
        service={bookingService}
        onClose={handleCloseBookingModal}
        onBookingSuccess={() => {
          // Trigger view update
        }}
      />
      <PBXCallModal />
      <ChatDrawer />
      <LiveOrderTrackerModal />
      <DisputeModal />
      <SupportChatDrawer />
      <EmailVerificationModal />
      <StorefrontViewModal />
      <ProfileEditModal />
      <PresentationModal isOpen={isPresentationOpen} onClose={() => setIsPresentationOpen(false)} />
      {feedbackModalBooking && (
        <ServiceRatingModal
          booking={feedbackModalBooking}
          isOpen={Boolean(feedbackModalBooking)}
          onClose={closeFeedbackModal}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
