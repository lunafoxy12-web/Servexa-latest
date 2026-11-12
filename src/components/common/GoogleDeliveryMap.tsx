import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  MapCameraProps,
  MapCameraChangedEvent
} from '@vis.gl/react-google-maps';
import L from 'leaflet';
import { Navigation, Crosshair, Loader2, Layers, MapPin } from 'lucide-react';
import { useGoogleMapsStatus, GoogleMapsBillingAlert } from '../../hooks/useGoogleMapsStatus';

interface GoogleDeliveryMapProps {
  lat: number;
  lng: number;
  onLocationChange?: (lat: number, lng: number) => void;
  address?: string;
  accuracy?: string;
  statusText?: string;
  isLocating?: boolean;
  onLocateGps?: () => void;
  heightClass?: string;
}

/**
 * Fallback Leaflet map renderer used when no Google Maps API key is configured.
 */
const LeafletDeliveryMap: React.FC<GoogleDeliveryMapProps> = ({
  lat,
  lng,
  onLocationChange,
  address,
  heightClass = 'h-48'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    const customPinIcon = L.divIcon({
      className: 'delivery-custom-marker',
      html: `
        <div class="relative flex flex-col items-center select-none" style="transform: translate(-50%, -100%);">
          <div class="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold font-sans shadow-md border border-slate-700 whitespace-nowrap mb-1">
            ${address ? address.split(',')[0] : 'Delivery Pin'}
          </div>
          <div class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center text-white">
            <div class="w-2 h-2 rounded-full bg-white"></div>
          </div>
        </div>
      `,
      iconSize: [30, 42],
      iconAnchor: [15, 42]
    });

    const marker = L.marker([lat, lng], {
      icon: customPinIcon,
      draggable: !!onLocationChange
    }).addTo(map);

    if (onLocationChange) {
      marker.on('dragend', (e: any) => {
        const newLatLng = e.target.getLatLng();
        onLocationChange(newLatLng.lat, newLatLng.lng);
      });

      map.on('click', (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        onLocationChange(clickLat, clickLng);
      });
    }

    mapInstanceRef.current = map;
    markerInstanceRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !markerInstanceRef.current) return;
    markerInstanceRef.current.setLatLng([lat, lng]);
    mapInstanceRef.current.panTo([lat, lng], { animate: true });
  }, [lat, lng]);

  return <div ref={mapContainerRef} className={`w-full ${heightClass} z-0`} />;
};

/**
 * Modern Google Maps Platform renderer using @vis.gl/react-google-maps
 */
const GoogleMapsPlatformDeliveryView: React.FC<GoogleDeliveryMapProps & { apiKey: string }> = ({
  lat,
  lng,
  onLocationChange,
  address,
  heightClass = 'h-48'
}) => {
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');

  const handleMapClick = useCallback((ev: any) => {
    if (onLocationChange && ev.detail?.latLng) {
      onLocationChange(ev.detail.latLng.lat, ev.detail.latLng.lng);
    }
  }, [onLocationChange]);

  const handleMarkerDragEnd = useCallback((ev: any) => {
    if (onLocationChange && ev.latLng) {
      const newLat = typeof ev.latLng.lat === 'function' ? ev.latLng.lat() : ev.latLng.lat;
      const newLng = typeof ev.latLng.lng === 'function' ? ev.latLng.lng() : ev.latLng.lng;
      onLocationChange(newLat, newLng);
    }
  }, [onLocationChange]);

  return (
    <div className={`w-full ${heightClass} relative z-0`}>
      <Map
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        center={{ lat, lng }}
        zoom={15}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeId={mapTypeId}
        onClick={handleMapClick}
        style={{ width: '100%', height: '100%' }}
      >
        <AdvancedMarker
          position={{ lat, lng }}
          draggable={!!onLocationChange}
          onDragEnd={handleMarkerDragEnd}
        >
          <div className="relative flex flex-col items-center select-none cursor-pointer transform -translate-x-1/2 -translate-y-full hover:scale-110 transition-transform">
            <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 text-white text-[11px] font-bold shadow-xl border border-indigo-500/50 whitespace-nowrap mb-1 flex items-center gap-1.5 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{address ? address.split(',')[0] : 'Delivery Pin'}</span>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 animate-ping absolute" />
              <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-white shadow-2xl flex items-center justify-center text-white">
                <MapPin className="w-4 h-4 fill-white text-indigo-600" />
              </div>
            </div>
          </div>
        </AdvancedMarker>
      </Map>

      {/* Layer Toggle Button */}
      <button
        type="button"
        onClick={() => setMapTypeId(prev => prev === 'roadmap' ? 'hybrid' : 'roadmap')}
        className="absolute bottom-2.5 right-2.5 z-10 bg-slate-900/90 hover:bg-slate-800 text-white px-2.5 py-1 rounded-xl text-[10px] font-bold shadow-md border border-white/10 flex items-center gap-1 backdrop-blur-xs cursor-pointer transition-colors"
        title="Toggle Satellite / Roadmap View"
      >
        <Layers className="w-3 h-3 text-indigo-400" />
        <span>{mapTypeId === 'roadmap' ? 'Satellite' : 'Roadmap'}</span>
      </button>
    </div>
  );
};

export const GoogleDeliveryMap: React.FC<GoogleDeliveryMapProps> = (props) => {
  const {
    lat,
    lng,
    accuracy,
    statusText,
    isLocating,
    onLocateGps,
    heightClass = 'h-48'
  } = props;

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

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-900 shadow-xs relative">
      {/* Billing Alert if auth failure occurred */}
      {authFailed && !isDismissed && (
        <div className="p-2 z-20 relative">
          <GoogleMapsBillingAlert
            authFailed={authFailed}
            errorMessage={errorMessage}
            isDismissed={isDismissed}
            onDismiss={() => setIsDismissed(true)}
            onRetry={retryMaps}
          />
        </div>
      )}

      {canUseGoogleMaps ? (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} onError={handleMapError}>
          <GoogleMapsPlatformDeliveryView {...props} apiKey={GOOGLE_MAPS_API_KEY} />
        </APIProvider>
      ) : (
        <LeafletDeliveryMap {...props} />
      )}

      {/* Real-time GPS Coordinate & Telemetry Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none gap-2 z-10">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-xl text-white text-[11px] font-mono shadow-md border border-white/10 flex items-center gap-1.5 pointer-events-auto">
          <Navigation className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="font-bold">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
          {accuracy && <span className="text-slate-400 text-[10px]">({accuracy})</span>}
          {canUseGoogleMaps && (
            <span className="ml-1 text-[9px] font-sans font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Google Maps
            </span>
          )}
        </div>

        {onLocateGps && (
          <button
            type="button"
            onClick={onLocateGps}
            disabled={isLocating}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-3 py-1 rounded-xl text-[11px] font-bold shadow-md transition-all flex items-center gap-1.5 pointer-events-auto cursor-pointer"
            title="Recalculate Real-Time Device GPS"
          >
            {isLocating ? (
              <Loader2 className="w-3 h-3 animate-spin text-white" />
            ) : (
              <Crosshair className="w-3 h-3 text-amber-300" />
            )}
            <span>GPS Lock</span>
          </button>
        )}
      </div>

      {statusText && (
        <div className="absolute bottom-2.5 left-2.5 right-24 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-xl text-slate-200 text-[10px] font-mono shadow-xs border border-white/10 truncate z-10">
          {statusText}
        </div>
      )}
    </div>
  );
};
