import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { COMPREHENSIVE_PRODUCTS } from '../../data/initialProducts';
import { Product, ProviderProfile, ServiceItem, ServiceCategory } from '../../types';
import { safeFetchJson } from '../../utils/safeFetch';
import { formatCurrency } from '../../utils/currency';
import { ProductPreviewModal } from '../CustomerView/ProductPreviewModal';
import {
  Search,
  Wrench,
  ShoppingBag,
  ArrowLeft,
  X,
  Star,
  Clock,
  ArrowRight,
  ShieldCheck,
  Store,
  CheckCircle2,
  Sparkles,
  PhoneCall,
  MessageSquare,
  Navigation,
  Radio,
  Volume2,
  VolumeX,
  Compass,
  Car,
  ChevronRight,
  MapPin,
  AlertTriangle
} from 'lucide-react';

interface SearchPageViewProps {
  onOpenBookingModal: (provider: ProviderProfile, service: ServiceItem) => void;
  onBackToHome: () => void;
}

export const SearchPageView: React.FC<SearchPageViewProps> = ({
  onOpenBookingModal,
  onBackToHome
}) => {
  const {
    activeSearchType,
    setActiveSearchType,
    addToCart,
    setIsCartOpen,
    cartItemsCount,
    activeCurrency,
    openStorefrontSubdomain,
    initiateCall,
    openChat,
    openServiceCategoryPage,
    currentUser,
    setIsAuthModalOpen
  } = useAuth();
  const { theme } = useTheme();

  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Drive Mode state for Service Provider
  const [isDriveModeOpen, setIsDriveModeOpen] = useState(false);
  const [driveSpeed, setDriveSpeed] = useState(44);
  const [voiceNavEnabled, setVoiceNavEnabled] = useState(true);
  const [dispatchesNearby, setDispatchesNearby] = useState([
    {
      id: 'disp-live-1',
      category: 'Plumbing',
      title: 'Emergency Pipe Leak & Water Shutoff',
      customerName: 'Sarah Connor',
      distanceKm: 1.8,
      address: '840 Post St, San Francisco',
      rate: '$95.00/hr',
      urgency: 'Emergency'
    },
    {
      id: 'disp-live-2',
      category: 'Electrician',
      title: 'Main Circuit Breaker Tripping Repeatedly',
      customerName: 'Alex Rivera',
      distanceKm: 3.2,
      address: '1220 Folsom St, San Francisco',
      rate: '$110.00/hr',
      urgency: 'High'
    }
  ]);
  const [acceptedDispatchId, setAcceptedDispatchId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Load service categories on mount
  useEffect(() => {
    if (!categoriesLoaded) {
      safeFetchJson<ServiceCategory[]>('/api/categories', undefined, [])
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data);
          } else {
            // High quality fallback categories
            setCategories([
              {
                id: 'cat-plumbing',
                name: 'Plumbing Services',
                slug: 'plumbing',
                icon: 'Wrench',
                description: 'Emergency pipe leaks, clogged drains, faucet installation, water heaters',
                pricingModels: ['hourly', 'fixed'],
                basePrice: 85,
                characterImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
                enabled: true,
                subcategories: [
                  { id: 'sub-1', name: 'Pipe Leak Repair' },
                  { id: 'sub-2', name: 'Drain Cleaning' },
                  { id: 'sub-3', name: 'Water Heater Fix' }
                ]
              },
              {
                id: 'cat-electrician',
                name: 'Electrical Services',
                slug: 'electrician',
                icon: 'Zap',
                description: 'Circuit breakers, outlet wiring, sparks, light fixtures, electrical panels',
                pricingModels: ['hourly', 'fixed'],
                basePrice: 95,
                characterImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
                enabled: true,
                subcategories: [
                  { id: 'sub-4', name: 'Breaker Tripping' },
                  { id: 'sub-5', name: 'Outlet & Switch' },
                  { id: 'sub-6', name: 'Full Rewiring' }
                ]
              },
              {
                id: 'cat-hvac',
                name: 'HVAC & Climate',
                slug: 'hvac',
                icon: 'Flame',
                description: 'Air conditioner cooling, heating repair, compressor, thermostats',
                pricingModels: ['hourly', 'fixed'],
                basePrice: 90,
                characterImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=80',
                enabled: true,
                subcategories: [
                  { id: 'sub-7', name: 'AC Not Cooling' },
                  { id: 'sub-8', name: 'Furnace Check' },
                  { id: 'sub-9', name: 'Thermostat Setup' }
                ]
              },
              {
                id: 'cat-mechanic',
                name: 'Auto Mechanic',
                slug: 'mechanic',
                icon: 'Car',
                description: 'Mobile engine diagnostic, battery jump, brake replacement, tire puncture',
                pricingModels: ['hourly', 'fixed'],
                basePrice: 80,
                characterImage: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80',
                enabled: true,
                subcategories: [
                  { id: 'sub-10', name: 'Battery Service' },
                  { id: 'sub-11', name: 'Brake Repair' },
                  { id: 'sub-12', name: 'Engine Diagnostic' }
                ]
              },
              {
                id: 'cat-painters',
                name: 'Painting & Drywall',
                slug: 'painting',
                icon: 'Brush',
                description: 'Drywall hole patching, interior wall painting, exterior coating',
                pricingModels: ['fixed'],
                basePrice: 70,
                characterImage: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
                enabled: true,
                subcategories: [
                  { id: 'sub-13', name: 'Hole & Patching' },
                  { id: 'sub-14', name: 'Room Painting' }
                ]
              },
              {
                id: 'cat-cleaners',
                name: 'Cleaning & Maid',
                slug: 'cleaning',
                icon: 'Sparkles',
                description: 'Deep home cleaning, move-out sanitization, carpet stain removal',
                pricingModels: ['fixed', 'hourly'],
                basePrice: 60,
                characterImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
                enabled: true,
                subcategories: [
                  { id: 'sub-15', name: 'Deep Cleaning' },
                  { id: 'sub-16', name: 'Carpet Wash' }
                ]
              }
            ]);
          }
          setCategoriesLoaded(true);
        })
        .catch(() => setCategoriesLoaded(true));
    }
  }, [categoriesLoaded]);

  // Filter ONLY service categories in service search (NO PROVIDER PROFILES ALLOWED IN SEARCH)
  const matchingCategories = useMemo(() => {
    if (!query.trim()) return categories;
    const q = query.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.subcategories && c.subcategories.some((s) => s.name.toLowerCase().includes(q)))
    );
  }, [categories, query]);

  // Filter products
  const matchingProducts = useMemo(() => {
    if (!query.trim()) return COMPREHENSIVE_PRODUCTS.slice(0, 20);
    const q = query.toLowerCase();
    return COMPREHENSIVE_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
        (p.storeName && p.storeName.toLowerCase().includes(q))
    );
  }, [query]);

  // Drive Mode simulated speed variations
  useEffect(() => {
    if (!isDriveModeOpen) return;
    const interval = setInterval(() => {
      setDriveSpeed((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        const newSpeed = prev + delta;
        return Math.max(32, Math.min(58, newSpeed));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isDriveModeOpen]);

  const handleSelectServiceCategory = (cat: ServiceCategory) => {
    openServiceCategoryPage(cat);
  };

  const handleAcceptDriveDispatch = (dispId: string) => {
    setAcceptedDispatchId(dispId);
    showToast('Dispatch accepted! GPS navigation route updated.');
    if (voiceNavEnabled && typeof window !== 'undefined' && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance('Dispatch accepted. Turn right in 200 meters towards post street.');
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="pb-10">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* FULLSCREEN DRIVE MODE HUD FOR SERVICE PROVIDER                     */}
      {/* ------------------------------------------------------------------ */}
      {isDriveModeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col animate-in fade-in duration-200 select-none">
          {/* Top Driving Bar */}
          <div className="p-4 bg-slate-900/90 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDriveModeOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition active:scale-95"
                title="Exit Drive Mode"
              >
                <ArrowLeft className="w-6 h-6 stroke-[2]" />
              </button>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1 font-bold">
                  <Navigation className="w-3.5 h-3.5 animate-pulse" />
                  <span>Provider Drive Mode Active</span>
                </span>
                <h2 className="text-base font-extrabold tracking-tight">
                  {acceptedDispatchId ? 'Navigating to Customer Location' : 'Live Patrol & Dispatch Radar'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVoiceNavEnabled((v) => !v)}
                className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                  voiceNavEnabled
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
                title="Toggle Voice Guidance"
              >
                {voiceNavEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden sm:inline">{voiceNavEnabled ? 'Voice On' : 'Voice Off'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDriveModeOpen(false)}
                className="px-3 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer transition"
              >
                Exit
              </button>
            </div>
          </div>

          {/* Turn-by-Turn Instruction Banner */}
          <div className="p-4 bg-indigo-950/80 border-b border-indigo-800/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl shadow-lg shrink-0">
                ↗
              </div>
              <div>
                <p className="text-lg font-extrabold">In 200m, Turn Right</p>
                <p className="text-xs text-indigo-200">onto Post St • Destination on Left in 1.4 km</p>
              </div>
            </div>

            {/* Live Speed Gauge */}
            <div className="text-right">
              <div className="text-3xl font-black font-mono text-emerald-400 leading-none">
                {driveSpeed}
              </div>
              <span className="text-[10px] font-mono uppercase text-slate-400">km/h</span>
            </div>
          </div>

          {/* Main Driving Body: Simulated GPS Map & Dispatch Radar */}
          <div className="flex-1 relative overflow-hidden flex flex-col justify-between p-4 sm:p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
            {/* Compass and Coordinates */}
            <div className="flex items-center justify-between">
              <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-mono flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
                <span>NW 315° • Market St & 4th</span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-mono flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Radar Active (10 km Radius)</span>
              </div>
            </div>

            {/* Central Animated Vehicle Marker */}
            <div className="my-auto mx-auto text-center space-y-3">
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border border-indigo-400/40 animate-pulse" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center shadow-2xl border-2 border-white">
                  <Car className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-extrabold tracking-tight">Vehicle GPS In Motion</p>
                <p className="text-xs text-slate-400">Broadcasting live coordinates to customer tracking map</p>
              </div>
            </div>

            {/* Nearby Dispatches Drawer inside Drive Mode */}
            <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl border border-white/10 p-4 space-y-3 max-w-2xl mx-auto w-full">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nearby Emergency Dispatches ({dispatchesNearby.length})</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Within 10 km</span>
              </div>

              <div className="space-y-2">
                {dispatchesNearby.map((disp) => {
                  const isAccepted = acceptedDispatchId === disp.id;
                  return (
                    <div
                      key={disp.id}
                      className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isAccepted
                          ? 'bg-emerald-950/60 border-emerald-500/50'
                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                            {disp.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                            {disp.urgency}
                          </span>
                          <span className="text-[11px] font-mono text-emerald-400 font-bold">
                            {disp.rate}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white">{disp.title}</h4>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>{disp.address} ({disp.distanceKm} km away)</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => initiateCall('cust-101', disp.customerName, 'customer')}
                          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition"
                          title="Call Customer"
                        >
                          <PhoneCall className="w-4 h-4 text-emerald-400" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAcceptDriveDispatch(disp.id)}
                          disabled={isAccepted}
                          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition shadow-xs ${
                            isAccepted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          }`}
                        >
                          {isAccepted ? 'Accepted & Route Ready' : 'Accept Dispatch'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* STANDARD SEARCH PAGE VIEW                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-5 space-y-6">
        {/* Top Header: Just Arrow Back Button & Drive Mode Button */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[1.8]" />
          </button>

          <div className="flex items-center gap-2">
            {/* Drive Button for Service Provider */}
            {currentUser?.role === 'provider' && (
              <button
                type="button"
                onClick={() => setIsDriveModeOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                title="Open Provider Drive Mode"
              >
                <Navigation className="w-4 h-4 text-emerald-200 animate-pulse" />
                <span>Drive Mode</span>
              </button>
            )}

            {activeSearchType === 'products' && (
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>Cart</span>
                {cartItemsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white text-emerald-800 text-[10px] font-black font-mono">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Search Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {activeSearchType === 'services' ? 'Find Service Categories' : 'Find Store Products'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {activeSearchType === 'services'
                ? 'Search categories of service. Select a category to describe your problem and request specialists.'
                : 'Search verified store products, parts, equipment, and tools.'}
            </p>
          </div>

          {/* Search Toggle Tabs */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveSearchType('services')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSearchType === 'services'
                  ? 'bg-white text-slate-900 shadow-md scale-102'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Categories of Service</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSearchType('products')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSearchType === 'products'
                  ? 'bg-white text-slate-900 shadow-md scale-102'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Find Products</span>
            </button>
          </div>

          {/* Search Input Field */}
          <div className="relative flex items-center bg-white rounded-2xl shadow-lg px-3.5 py-2.5">
            <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeSearchType === 'services'
                  ? 'Search by service category (e.g. Plumbing, Electrician, HVAC, AC, Mechanic, Painting)...'
                  : 'Search by product name, category, brand, or store item...'
              }
              className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* RESULTS SECTION: CATEGORIES ONLY (NO SERVICE PROVIDER PROFILES!)  */}
        {/* ------------------------------------------------------------------ */}
        {activeSearchType === 'services' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500">
                Found {matchingCategories.length} matching service categories
              </span>
            </div>

            {matchingCategories.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
                <Search className="w-8 h-8 text-indigo-400 mx-auto opacity-40" />
                <h3 className="text-sm font-bold text-slate-800">No Service Categories Found</h3>
                <p className="text-xs text-slate-500">
                  Try searching for "Plumbing", "Electrician", "HVAC", "Mechanic", "Cleaners", or "Painting".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchingCategories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => handleSelectServiceCategory(cat)}
                    className="group bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden hover:border-indigo-400 p-5 cursor-pointer relative"
                  >
                    <div className="space-y-3">
                      {/* Category Header with Image/Icon */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                          {cat.characterImage ? (
                            <img
                              src={cat.characterImage}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Wrench className="w-6 h-6 text-indigo-600" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {cat.name}
                          </h3>
                          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-500" />
                            <span>Rapid 10-15m Dispatch</span>
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {cat.description || 'Certified specialists available for emergency response and scheduled repairs.'}
                      </p>

                      {/* Subcategories tags */}
                      {cat.subcategories && cat.subcategories.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {cat.subcategories.slice(0, 3).map((sub) => (
                            <span
                              key={sub.id}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                            >
                              {sub.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer Rate and Select Action */}
                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Base Rate
                        </span>
                        <span className="text-sm font-black text-slate-900 font-mono">
                          ${cat.basePrice || 75}/hr
                        </span>
                      </div>

                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 group-hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs">
                        <span>Describe Issue</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Products Search Results */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500">
                Found {matchingProducts.length} matching store products
              </span>
            </div>

            {matchingProducts.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
                <Search className="w-8 h-8 text-indigo-400 mx-auto opacity-40" />
                <h3 className="text-sm font-bold text-slate-800">No Products Found</h3>
                <p className="text-xs text-slate-500">Try searching with a broader product keyword.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {matchingProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="group bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden p-4"
                  >
                    <div>
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-3">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {prod.storeName && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-[10px] font-bold text-slate-800 shadow-xs flex items-center gap-1">
                            <Store className="w-2.5 h-2.5 text-indigo-600" />
                            <span>{prod.storeName}</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                        {prod.description}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-base font-black text-slate-900 font-mono">
                          {formatCurrency(prod.price, activeCurrency)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewProduct(prod)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                          title="Quick View"
                        >
                          <Search className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!currentUser) {
                              setIsAuthModalOpen(true);
                              return;
                            }
                            addToCart(prod, 1);
                            showToast(`Added ${prod.name} to cart`);
                          }}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Preview Modal */}
      {previewProduct && (
        <ProductPreviewModal
          product={previewProduct}
          isOpen={Boolean(previewProduct)}
          onClose={() => setPreviewProduct(null)}
          onAddToCart={(prod, qty) => {
            if (!currentUser) {
              setIsAuthModalOpen(true);
              return;
            }
            addToCart(prod, qty);
            showToast(`Added ${prod.name} to cart`);
          }}
          onBuyNow={(prod, qty) => {
            if (!currentUser) {
              setIsAuthModalOpen(true);
              return;
            }
            addToCart(prod, qty);
            setIsCartOpen(true);
          }}
          onOpenStorefront={(subdomain) => openStorefrontSubdomain(subdomain)}
        />
      )}
    </div>
  );
};
