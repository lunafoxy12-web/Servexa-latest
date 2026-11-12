import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Download,
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({ isOpen, onClose }) => {
  const { setIsAppInstalled } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsAppInstalled(true);
      localStorage.setItem('servexa_app_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches || localStorage.getItem('servexa_app_installed') === 'true') {
      setIsInstalled(true);
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [setIsAppInstalled]);

  if (!isOpen) return null;

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsAppInstalled(true);
        localStorage.setItem('servexa_app_installed', 'true');
        setTimeout(() => onClose(), 800);
      }
      setDeferredPrompt(null);
    } else {
      // If direct PWA prompt not triggered by browser, trigger direct APK download package
      handleDirectDownloadApk();
    }
  };

  const handleDirectDownloadApk = () => {
    setDownloading(true);
    // Create direct APK download package trigger
    const link = document.createElement('a');
    link.href = '/api/download/apk';
    link.setAttribute('download', 'Servexa-World-Release-v2.4.apk');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      setIsInstalled(true);
      setIsAppInstalled(true);
      localStorage.setItem('servexa_app_installed', 'true');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-gradient-to-b from-[#edf2ff] via-[#f8fafc] to-[#e8edff] rounded-3xl shadow-2xl border border-indigo-100/80 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-indigo-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Download Servexa APK</h3>
              <p className="text-xs text-slate-500">Android Application & Native WebAPK</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {downloadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Servexa-World-Release-v2.4.apk download initiated!</span>
            </div>
          )}

          {/* App Card Info */}
          <div className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-xs flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 p-2">
              <Sparkles className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">Servexa World Android</h4>
              <p className="text-[11px] text-slate-500">Version 2.4.0 Production Release</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Native Android Ready
                </span>
                <span className="text-[10px] text-slate-400 font-mono">18.4 MB</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            {deferredPrompt ? (
              <button
                type="button"
                onClick={handleInstallPwa}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Install Instant Android App (WebAPK)</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleDirectDownloadApk}
              disabled={downloading}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{downloading ? 'Preparing Package...' : 'Download Android Package (.apk)'}</span>
            </button>
          </div>

          {/* Simple 3-Step Guide */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs space-y-2">
            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
              Quick Installation Steps:
            </span>
            <div className="flex items-start gap-2 text-slate-600 text-[11px]">
              <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                1
              </span>
              <span>Tap <strong>Download Android Package</strong> to download the installer.</span>
            </div>
            <div className="flex items-start gap-2 text-slate-600 text-[11px]">
              <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                2
              </span>
              <span>Open the downloaded file on your device and tap <strong>Install</strong>.</span>
            </div>
            <div className="flex items-start gap-2 text-slate-600 text-[11px]">
              <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                3
              </span>
              <span>Launch Servexa with full offline capability, PBX VoIP calls, and GPS tracking.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
