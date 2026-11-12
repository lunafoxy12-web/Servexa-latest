import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, ExternalLink, X, RefreshCw } from 'lucide-react';

let globalAuthFailureDetected = false;
let globalErrorMessage = '';
const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

// Global interceptor for Google Maps authentication/billing failures
if (typeof window !== 'undefined') {
  const originalGmAuthFailure = (window as any).gm_authFailure;
  (window as any).gm_authFailure = function () {
    globalAuthFailureDetected = true;
    globalErrorMessage = 'Google Maps JavaScript API: BillingNotEnabledMapError. Billing must be enabled on your Google Cloud project to use live JavaScript Maps.';
    notifyListeners();
    if (typeof originalGmAuthFailure === 'function') {
      try {
        originalGmAuthFailure();
      } catch (e) {
        // ignore
      }
    }
  };

  // Also listen for unhandled error strings or window errors matching billing/auth failures
  window.addEventListener('error', (event) => {
    const msg = event?.message || '';
    if (
      msg.includes('BillingNotEnabledMapError') ||
      msg.includes('BillingNotEnabled') ||
      msg.includes('ApiNotActivatedMapError') ||
      msg.includes('InvalidKeyMapError')
    ) {
      globalAuthFailureDetected = true;
      globalErrorMessage = `Google Maps Error: ${msg}`;
      notifyListeners();
    }
  });
}

export function useGoogleMapsStatus() {
  const apiKey = ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  const [authFailed, setAuthFailed] = useState<boolean>(globalAuthFailureDetected);
  const [errorMessage, setErrorMessage] = useState<string>(globalErrorMessage);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    const handleUpdate = () => {
      setAuthFailed(globalAuthFailureDetected);
      setErrorMessage(globalErrorMessage);
    };

    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const handleMapError = useCallback((error: unknown) => {
    console.warn('[GoogleMaps] APIProvider error received:', error);
    globalAuthFailureDetected = true;
    globalErrorMessage = 'Google Maps JavaScript API error: BillingNotEnabledMapError. Please enable billing on your Google Cloud Console project.';
    setAuthFailed(true);
    setErrorMessage(globalErrorMessage);
    notifyListeners();
  }, []);

  const retryMaps = useCallback(() => {
    globalAuthFailureDetected = false;
    globalErrorMessage = '';
    setAuthFailed(false);
    setErrorMessage('');
    setIsDismissed(false);
    notifyListeners();
  }, []);

  const hasKey = Boolean(apiKey);
  const canUseGoogleMaps = hasKey && !authFailed;

  return {
    apiKey,
    hasKey,
    authFailed,
    errorMessage,
    isDismissed,
    setIsDismissed,
    canUseGoogleMaps,
    handleMapError,
    retryMaps,
  };
}

export function GoogleMapsBillingAlert({
  authFailed,
  errorMessage,
  isDismissed,
  onDismiss,
  onRetry,
}: {
  authFailed: boolean;
  errorMessage?: string;
  isDismissed: boolean;
  onDismiss: () => void;
  onRetry?: () => void;
}) {
  if (!authFailed || isDismissed) {
    return null;
  }

  return (
    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md backdrop-blur-sm z-30">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-300">
            Google Maps API: Billing Not Enabled
          </p>
          <p className="text-amber-200/80 text-[11px] mt-0.5">
            {errorMessage || 'Your Google Maps API key requires billing to be enabled in Google Cloud Console (BillingNotEnabledMapError). Switched to interactive fallback map.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <a
          href="https://console.cloud.google.com/billing"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[11px] font-semibold transition-colors"
        >
          <span>Enable Billing</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
            title="Retry Google Maps"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-300/80 hover:text-amber-200 transition-colors cursor-pointer"
          title="Dismiss notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
