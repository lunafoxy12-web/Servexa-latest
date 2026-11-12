import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Polyline,
  useMap
} from '@vis.gl/react-google-maps';
import L from 'leaflet';
import { useGoogleMapsStatus, GoogleMapsBillingAlert } from '../../hooks/useGoogleMapsStatus';
import {
  Navigation,
  MapPin,
  Maximize2,
  Minimize2,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Car,
  ArrowLeft,
  Layers,
  Globe
} from 'lucide-react';

interface DualDeviceTrackingMapProps {
  orderNumber: string;
  providerCoords: { lat: number; lng: number };
  customerCoords: { lat: number; lng: number };
  providerName?: string;
  customerName?: string;
  serviceName?: string;
  speedKmH?: number;
  heading?: number;
  status?: string;
  customerAddress?: string;
  className?: string;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onGoBack?: () => void;
}

/**
 * Controller to fit bounds or pan Google Map when tracking live devices
 */
function GoogleMapTrackingController({
  providerCoords,
  customerCoords,
  userInteracted
}: {
  providerCoords: { lat: number; lng: number };
  customerCoords: { lat: number; lng: number };
  userInteracted: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || userInteracted) return;
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: providerCoords.lat, lng: providerCoords.lng });
    bounds.extend({ lat: customerCoords.lat, lng: customerCoords.lng });
    map.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
  }, [map, providerCoords, customerCoords, userInteracted]);

  return null;
}

/**
 * Modern Google Maps Platform tracking view component
 */
const GoogleMapsTrackingView: React.FC<{
  providerCoords: { lat: number; lng: number };
  customerCoords: { lat: number; lng: number };
  providerName: string;
  customerName: string;
  speedKmH: number;
  heading: number;
  orderNumber: string;
}> = ({
  providerCoords,
  customerCoords,
  providerName,
  customerName,
  speedKmH,
  heading
}) => {
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [userInteracted, setUserInteracted] = useState(false);

  const center = {
    lat: (providerCoords.lat + customerCoords.lat) / 2,
    lng: (providerCoords.lng + customerCoords.lng) / 2
  };

  const polylinePath = [
    { lat: providerCoords.lat, lng: providerCoords.lng },
    { lat: customerCoords.lat, lng: customerCoords.lng }
  ];

  return (
    <div className="w-full h-full relative z-0">
      <Map
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        center={center}
        zoom={14}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeId={mapType}
        onDragstart={() => setUserInteracted(true)}
        style={{ width: '100%', height: '100%' }}
      >
        <GoogleMapTrackingController
          providerCoords={providerCoords}
          customerCoords={customerCoords}
          userInteracted={userInteracted}
        />

        {/* Live Provider / Specialist Advanced Marker */}
        <AdvancedMarker position={providerCoords}>
          <div className="relative flex flex-col items-center select-none transform -translate-x-1/2 -translate-y-1/2">
            {/* Live Telemetry Pill */}
            <div className="mb-1 px-2.5 py-0.5 rounded-full bg-slate-950/95 text-white text-[10px] font-bold font-mono shadow-xl border border-emerald-500/50 whitespace-nowrap flex items-center gap-1.5 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{providerName.split(' ')[0]}</span>
              <span className="text-emerald-300 font-bold">{speedKmH}km/h</span>
            </div>

            {/* Directional Beacon */}
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
              <div
                className="w-9 h-9 rounded-2xl bg-emerald-600 text-white shadow-xl border-2 border-white flex items-center justify-center transform transition-transform duration-300"
                style={{ transform: `rotate(${heading}deg)` }}
              >
                <Car className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </AdvancedMarker>

        {/* Customer Destination Advanced Marker */}
        <AdvancedMarker position={customerCoords}>
          <div className="relative flex flex-col items-center select-none transform -translate-x-1/2 -translate-y-1/2">
            <div className="mb-1 px-2.5 py-0.5 rounded-full bg-slate-950/95 text-white text-[10px] font-bold font-mono shadow-xl border border-blue-500/50 whitespace-nowrap flex items-center gap-1.5 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Destination ({customerName.split(' ')[0]})</span>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white shadow-xl border-2 border-white flex items-center justify-center">
              <MapPin className="w-5 h-5 fill-white text-blue-600" />
            </div>
          </div>
        </AdvancedMarker>

        {/* Connecting Polyline Route */}
        <Polyline
          path={polylinePath}
          strokeColor="#4f46e5"
          strokeOpacity={0.9}
          strokeWeight={4}
        />
      </Map>

      {/* Layer Toggle Button */}
      <button
        type="button"
        onClick={() => setMapType(prev => prev === 'roadmap' ? 'hybrid' : 'roadmap')}
        className="absolute top-16 right-3 z-10 bg-slate-900/90 hover:bg-slate-800 text-white px-2.5 py-1.5 rounded-xl text-[11px] font-bold shadow-lg border border-slate-700/80 flex items-center gap-1.5 backdrop-blur-xs cursor-pointer transition-colors"
        title="Toggle Satellite / Roadmap View"
      >
        <Layers className="w-3.5 h-3.5 text-indigo-400" />
        <span className="capitalize">{mapType}</span>
      </button>
    </div>
  );
};

export const DualDeviceTrackingMap: React.FC<DualDeviceTrackingMapProps> = ({
  orderNumber,
  providerCoords,
  customerCoords,
  providerName = 'Specialist / Driver',
  customerName = 'Customer',
  serviceName = 'Active Dispatch',
  speedKmH = 0,
  heading = 45,
  status = 'on_the_way',
  customerAddress,
  className = 'h-[380px] w-full',
  isFullScreen = false,
  onToggleFullScreen,
  onGoBack
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const providerMarkerRef = useRef<L.Marker | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const [mapMode, setMapMode] = useState<'vector' | 'google'>('vector');

  const {
    apiKey: GOOGLE_MAPS_API_KEY,
    canUseGoogleMaps,
    authFailed,
    errorMessage,
    isDismissed,
    setIsDismissed,
    handleMapError,
    retryMaps,
  } = useGoogleMapsStatus();

  // Helper to construct custom HTML for Provider Marker (Device 1)
  const createProviderIconHtml = (deg: number, speed: number, name: string) => {
    return `
      <div class="relative flex flex-col items-center select-none" style="transform: translate(-50%, -50%);">
        <div class="mb-1 px-2 py-0.5 rounded-full bg-slate-900/95 text-white text-[10px] font-bold font-mono shadow-md border border-emerald-500/40 whitespace-nowrap flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>${name.split(' ')[0]}</span>
          <span class="text-emerald-300 font-bold">${speed}km/h</span>
        </div>
        <div class="relative w-10 h-10 flex items-center justify-center">
          <div class="absolute inset-0 rounded-full bg-emerald-500/25 animate-ping"></div>
          <div class="w-9 h-9 rounded-2xl bg-emerald-600 text-white shadow-lg border-2 border-white flex items-center justify-center transform transition-transform duration-300" style="transform: rotate(${deg}deg);">
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
            </svg>
          </div>
        </div>
      </div>
    `;
  };

  // Helper to construct custom HTML for Customer Marker (Device 2)
  const createCustomerIconHtml = (name: string) => {
    return `
      <div class="relative flex flex-col items-center select-none" style="transform: translate(-50%, -50%);">
        <div class="mb-1 px-2 py-0.5 rounded-full bg-slate-900/95 text-white text-[10px] font-bold font-mono shadow-md border border-blue-500/40 whitespace-nowrap flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          <span>Destination (${name.split(' ')[0]})</span>
        </div>
        <div class="relative w-9 h-9 flex items-center justify-center">
          <div class="w-9 h-9 rounded-2xl bg-blue-600 text-white shadow-lg border-2 border-white flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
      </div>
    `;
  };

  // 1. Initialize Leaflet Map ONCE on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [
        (providerCoords.lat + customerCoords.lat) / 2,
        (providerCoords.lng + customerCoords.lng) / 2
      ],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    const providerIcon = L.divIcon({
      className: 'provider-leaflet-pin',
      html: createProviderIconHtml(heading, speedKmH, providerName),
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const providerMarker = L.marker([providerCoords.lat, providerCoords.lng], {
      icon: providerIcon,
      zIndexOffset: 1000
    }).addTo(map);

    const customerIcon = L.divIcon({
      className: 'customer-leaflet-pin',
      html: createCustomerIconHtml(customerName),
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const customerMarker = L.marker([customerCoords.lat, customerCoords.lng], {
      icon: customerIcon,
      zIndexOffset: 900
    }).addTo(map);

    const polyline = L.polyline(
      [
        [providerCoords.lat, providerCoords.lng],
        [customerCoords.lat, customerCoords.lng]
      ],
      {
        color: '#4f46e5',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
        lineCap: 'round'
      }
    ).addTo(map);

    const bounds = L.latLngBounds([
      [providerCoords.lat, providerCoords.lng],
      [customerCoords.lat, customerCoords.lng]
    ]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });

    map.on('dragstart', () => setUserInteracted(true));

    mapRef.current = map;
    providerMarkerRef.current = providerMarker;
    customerMarkerRef.current = customerMarker;
    polylineRef.current = polyline;

    return () => {
      map.remove();
      mapRef.current = null;
      providerMarkerRef.current = null;
      customerMarkerRef.current = null;
      polylineRef.current = null;
    };
  }, []);

  // Update Leaflet markers & polyline on coordinate updates
  useEffect(() => {
    if (!mapRef.current || !providerMarkerRef.current || !customerMarkerRef.current || !polylineRef.current) {
      return;
    }

    providerMarkerRef.current.setLatLng([providerCoords.lat, providerCoords.lng]);
    const updatedProviderIcon = L.divIcon({
      className: 'provider-leaflet-pin',
      html: createProviderIconHtml(heading, speedKmH, providerName),
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    providerMarkerRef.current.setIcon(updatedProviderIcon);

    customerMarkerRef.current.setLatLng([customerCoords.lat, customerCoords.lng]);
    const updatedCustomerIcon = L.divIcon({
      className: 'customer-leaflet-pin',
      html: createCustomerIconHtml(customerName),
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    customerMarkerRef.current.setIcon(updatedCustomerIcon);

    polylineRef.current.setLatLngs([
      [providerCoords.lat, providerCoords.lng],
      [customerCoords.lat, customerCoords.lng]
    ]);

    if (!userInteracted && mapRef.current) {
      const bounds = L.latLngBounds([
        [providerCoords.lat, providerCoords.lng],
        [customerCoords.lat, customerCoords.lng]
      ]);
      mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
    }
  }, [
    providerCoords.lat,
    providerCoords.lng,
    customerCoords.lat,
    customerCoords.lng,
    heading,
    speedKmH,
    providerName,
    customerName,
    userInteracted
  ]);

  // Handle Resize & Fullscreen transitions
  useEffect(() => {
    if (!mapRef.current) return;
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullScreen, mapMode]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  const handleFitBounds = () => {
    if (!mapRef.current) return;
    setUserInteracted(false);
    const bounds = L.latLngBounds([
      [providerCoords.lat, providerCoords.lng],
      [customerCoords.lat, customerCoords.lng]
    ]);
    mapRef.current.fitBounds(bounds, { padding: [70, 70], maxZoom: 16, animate: true });
  };

  const handleCenterProvider = () => {
    if (!mapRef.current) return;
    mapRef.current.panTo([providerCoords.lat, providerCoords.lng], { animate: true });
  };

  const handleCenterCustomer = () => {
    if (!mapRef.current) return;
    mapRef.current.panTo([customerCoords.lat, customerCoords.lng], { animate: true });
  };

  const handleOpenGoogleDirections = () => {
    const origin = `${providerCoords.lat.toFixed(6)},${providerCoords.lng.toFixed(6)}`;
    const destination = `${customerCoords.lat.toFixed(6)},${customerCoords.lng.toFixed(6)}`;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving&utm_campaign=gmp_mcp_codeassist_v1_aistudio`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };


  return (
    <div className={`relative bg-slate-950 overflow-hidden select-none ${className}`}>
      {/* Billing Alert if auth failure occurred */}
      {authFailed && !isDismissed && (
        <div className="absolute top-14 left-3 right-3 z-30 pointer-events-auto">
          <GoogleMapsBillingAlert
            authFailed={authFailed}
            errorMessage={errorMessage}
            isDismissed={isDismissed}
            onDismiss={() => setIsDismissed(true)}
            onRetry={retryMaps}
          />
        </div>
      )}

      {/* Map Content View: Vector Radar or Google Maps */}
      <div className={`w-full h-full z-0 ${mapMode === 'vector' ? 'block' : 'hidden'}`}>
        <div ref={mapContainerRef} className="w-full h-full z-0" />
      </div>

      {mapMode === 'google' && (
        <div className="w-full h-full relative z-0 bg-slate-900">
          {canUseGoogleMaps ? (
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY} onError={handleMapError}>
              <GoogleMapsTrackingView
                providerCoords={providerCoords}
                customerCoords={customerCoords}
                providerName={providerName}
                customerName={customerName}
                speedKmH={speedKmH}
                heading={heading}
                orderNumber={orderNumber}
              />
            </APIProvider>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-white">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mb-3">
                <Navigation className="w-7 h-7 text-indigo-400" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Live Telemetry Tracking Active</h4>
              <p className="text-xs text-slate-300 max-w-md mb-4">
                Real-time GPS telemetry between {providerName} and {customerName} is streaming live on the high-definition Radar Map with zero watermarks.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMapMode('vector');
                    setTimeout(() => mapRef.current?.invalidateSize(), 50);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  View Radar Telemetry Map
                </button>
                <button
                  type="button"
                  onClick={handleOpenGoogleDirections}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Google Maps App</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Header Overlay: Order Number, Controls & Mode Toggle */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {(isFullScreen || onGoBack) && (
            <button
              type="button"
              onClick={onGoBack || onToggleFullScreen}
              className="px-3 py-1.5 rounded-2xl bg-slate-900/95 hover:bg-slate-800 text-white shadow-xl border border-slate-700/80 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
              title="Go Back / Exit Full Screen"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go Back</span>
            </button>
          )}

          <div className="bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-2xl text-white shadow-xl border border-slate-700/80 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono font-extrabold text-indigo-300">
              Order #{orderNumber}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-200">
              {serviceName}
            </span>
          </div>
        </div>

        {/* Map Control Buttons: Style Switcher & Full Screen */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <div className="flex items-center rounded-2xl p-0.5 bg-slate-900/95 border border-slate-700/80 shadow-lg text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setMapMode('vector')}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                mapMode === 'vector'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Live Telemetry Vector Radar Map"
            >
              <Layers className="w-3 h-3" />
              <span className="hidden sm:inline">Radar</span> Map
            </button>
            <button
              type="button"
              onClick={() => setMapMode('google')}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                mapMode === 'google'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Interactive Google Maps View"
            >
              <Globe className="w-3 h-3" />
              <span>Google Maps</span>
            </button>
          </div>

          {onToggleFullScreen && (
            <button
              type="button"
              onClick={onToggleFullScreen}
              className={`p-2 rounded-xl shadow-lg border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                isFullScreen
                  ? 'bg-indigo-600 text-white border-indigo-400'
                  : 'bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700'
              }`}
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Map'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden md:inline">{isFullScreen ? 'Exit Full Screen' : 'Full Screen'}</span>
            </button>
          )}

          {mapMode === 'vector' && (
            <>
              <button
                type="button"
                onClick={handleFitBounds}
                className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl shadow-lg border border-slate-700 transition-all cursor-pointer"
                title="Fit Both Devices in View"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <div className="flex flex-col rounded-xl overflow-hidden bg-slate-900/90 border border-slate-700 shadow-lg">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 text-slate-200 hover:text-white hover:bg-slate-800 border-t border-slate-700 transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Real-Time Live Devices Coordinates Bar (Bottom) */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={handleCenterProvider}
            className="px-3 py-1.5 rounded-xl bg-emerald-950/90 hover:bg-emerald-900/90 text-emerald-300 text-xs font-mono border border-emerald-600/80 shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            title="Click to Center on Specialist Device"
          >
            <Car className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold">Provider:</span>
            <span>{providerCoords.lat.toFixed(5)}, {providerCoords.lng.toFixed(5)}</span>
            <span className="text-[10px] font-bold text-emerald-400">({speedKmH} km/h)</span>
          </button>

          <button
            type="button"
            onClick={handleCenterCustomer}
            className="px-3 py-1.5 rounded-xl bg-blue-950/90 hover:bg-blue-900/90 text-blue-300 text-xs font-mono border border-blue-600/80 shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            title="Click to Center on Customer Destination Device"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-bold">Customer:</span>
            <span>{customerCoords.lat.toFixed(5)}, {customerCoords.lng.toFixed(5)}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleOpenGoogleDirections}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all pointer-events-auto cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open Google Maps App</span>
        </button>
      </div>
    </div>
  );
};
