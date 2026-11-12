import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ProviderProfile, Review, ServiceItem } from '../types';
import { ReviewStar } from './common/ReviewStar';
import {
  X,
  Star,
  CheckCircle2,
  PhoneCall,
  MapPin,
  Clock,
  Briefcase,
  MessageSquare,
  Video,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface ProviderProfileModalProps {
  providerId: string | null;
  onClose: () => void;
  onBookService: (provider: ProviderProfile, service: ServiceItem) => void;
}

export const ProviderProfileModal: React.FC<ProviderProfileModalProps> = ({
  providerId,
  onClose,
  onBookService
}) => {
  const { initiateCall, openChat } = useAuth();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'services' | 'portfolio' | 'reviews'>('services');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!providerId) return;
    setLoading(true);

    fetch(`/api/providers/${providerId}`)
      .then((res) => res.json())
      .then((data) => {
        setProvider(data);
        if (data.reviews) setReviews(data.reviews);
      })
      .catch((err) => {
        console.warn('ProviderProfileModal fetch note:', err?.message || err);
      })
      .finally(() => setLoading(false));
  }, [providerId]);

  if (!providerId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-gradient-to-b from-[#edf2ff] via-[#f8fafc] to-[#e8edff] rounded-3xl shadow-2xl border border-indigo-100/80 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Cover Banner */}
        <div className="relative h-24 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-white/80 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verified Specialist Profile</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Details Bar */}
        <div className="px-6 pb-4 border-b border-indigo-100/80 relative bg-white/70 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-10 gap-3">
            <div className="flex items-end gap-3.5">
              <div className="relative">
                <div className="w-18 h-18 rounded-2xl ring-4 ring-white bg-slate-100 overflow-hidden shadow-md">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80"
                    alt={provider?.businessName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                {provider?.isVerified && (
                  <span className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 rounded-full text-white ring-2 ring-white shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                  {provider?.businessName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {provider?.rating}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-600 font-medium">
                    {provider?.completedJobs} jobs
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500">{provider?.reviewCount} reviews</span>
                </div>
              </div>
            </div>

            {/* Direct Calling & Chat buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  provider && initiateCall(provider.userId, provider.businessName, 'provider', undefined, 'video')
                }
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Direct Video Consultation"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Video</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  provider && initiateCall(provider.userId, provider.businessName, 'provider', undefined, 'audio')
                }
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Direct VoIP Audio Call"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Audio</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (provider) {
                    onClose();
                    openChat('preorder_' + (provider.id || provider.userId));
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Private Direct Chat"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
                <span>Chat</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {provider?.serviceArea || 'San Francisco Bay Area'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {provider?.workingHours || 'Mon-Sat 8am - 6pm'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-indigo-100 bg-white/50 px-6">
          <button
            onClick={() => setActiveTab('services')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'services'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Services Catalog ({provider?.services?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'portfolio'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Portfolio ({provider?.posts?.length || 0})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'services' && (
            <div className="space-y-3">
              {provider?.services && provider.services.length > 0 ? (
                provider.services.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-4 bg-white rounded-2xl border border-indigo-100/80 shadow-xs flex items-center justify-between gap-4 hover:border-indigo-300 transition-all"
                  >
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-900">{srv.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{srv.description}</p>
                      <span className="text-[10px] text-slate-400 mt-1 inline-block">
                        Approx. {srv.durationMinutes || 45} mins
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-slate-900 font-mono">
                        ${srv.price.toFixed(2)}
                        <span className="text-[10px] text-slate-400 font-normal">
                          {srv.priceType === 'hourly' ? '/hr' : srv.priceType === 'km' ? '/km' : ''}
                        </span>
                      </div>
                      <button
                        onClick={() => provider && onBookService(provider, srv)}
                        className="mt-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition-all cursor-pointer"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No custom services listed.</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-3">
              {reviews.length > 0 ? (
                reviews.map((rev) => (
                  <div key={rev.id} className="p-3.5 bg-white rounded-2xl border border-indigo-100/80 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900">{rev.customerName || 'Verified Customer'}</span>
                      <ReviewStar rating={rev.rating} size={13} />
                    </div>
                    <p className="text-xs text-slate-600">{rev.comment}</p>
                    <span className="text-[10px] text-slate-400 mt-1 inline-block">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No client reviews yet.</p>
              )}
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="grid grid-cols-2 gap-3">
              {provider?.posts && provider.posts.length > 0 ? (
                provider.posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-2xl overflow-hidden border border-indigo-100/80 shadow-xs">
                    <img
                      src={post.mediaUrl}
                      alt={post.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-slate-900 truncate">{post.title}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="col-span-2 text-xs text-slate-400 text-center py-6">No portfolio posts published.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
