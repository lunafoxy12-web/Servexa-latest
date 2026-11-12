import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Booking, Review } from '../../types';
import {
  Star,
  X,
  CheckCircle2,
  Send,
  Camera,
  Heart,
  DollarSign,
  ShieldCheck,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface ServiceRatingModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (review: Review) => void;
}

export const ServiceRatingModal: React.FC<ServiceRatingModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser, triggerGlobalRefresh } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([
    '⏱️ Punctual & On Time',
    '🛠️ Expert Craftsmanship'
  ]);

  // Micro-metrics (1-5)
  const [craftQuality, setCraftQuality] = useState<number>(5);
  const [punctuality, setPunctuality] = useState<number>(5);
  const [communication, setCommunication] = useState<number>(5);

  // Tip
  const [tipAmount, setTipAmount] = useState<number>(0);

  // Work verification photo
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickTagOptions = [
    { id: 'punctual', label: t('review.tagPunctual', '⏱️ Punctual & On Time') },
    { id: 'expert', label: t('review.tagExpert', '🛠️ Expert Craftsmanship') },
    { id: 'clean', label: t('review.tagClean', '🧹 Clean Work Area') },
    { id: 'fair', label: t('review.tagFair', '💵 Fair & Honest Pricing') },
    { id: 'polite', label: t('review.tagPolite', '🤝 Polite & Courteous') },
    { id: 'fast', label: t('review.tagFast', '⚡ Fast & Efficient') }
  ];

  const toggleTag = (label: string) => {
    setSelectedTags((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const getScoreDescription = (val: number) => {
    switch (val) {
      case 5:
        return t('review.score5', '5.0 - Outstanding ★★★★★');
      case 4:
        return t('review.score4', '4.0 - Great ★★★★☆');
      case 3:
        return t('review.score3', '3.0 - Good ★★★☆☆');
      case 2:
        return t('review.score2', '2.0 - Fair ★★☆☆☆');
      case 1:
      default:
        return t('review.score1', '1.0 - Poor ★☆☆☆☆');
    }
  };

  const currentDisplayRating = hoverRating !== null ? hoverRating : rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);
    setError(null);

    const fullCommentParts: string[] = [];
    if (comment.trim()) {
      fullCommentParts.push(comment.trim());
    } else {
      fullCommentParts.push(
        `High quality ${booking.serviceName} completed on time with professional standards.`
      );
    }

    if (selectedTags.length > 0) {
      fullCommentParts.push(`Key highlights: ${selectedTags.join(', ')}`);
    }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          providerId: booking.providerId,
          customerId: currentUser.id,
          customerName: currentUser.name || 'Verified Customer',
          customerAvatar: currentUser.avatar,
          rating,
          comment: fullCommentParts.join('\n\n'),
          photos: photoPreview ? [photoPreview] : []
        })
      });

      if (!res.ok) {
        throw new Error('Failed to post review. Please try again.');
      }

      const createdReview: Review = await res.json();

      // If tip was selected, deduct and credit
      if (tipAmount > 0) {
        try {
          await fetch(`/api/wallet/${currentUser.id}/tip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              providerId: booking.providerId,
              bookingId: booking.id,
              amount: tipAmount
            })
          });
        } catch {
          // Tip is optional bonus
        }
      }

      // Mark locally as reviewed
      booking.reviewed = true;
      booking.customerRating = rating;
      booking.reviewComment = fullCommentParts.join(' ');

      try {
        localStorage.setItem(`reviewed_booking_${booking.id}`, JSON.stringify({
          rating,
          comment: fullCommentParts.join(' '),
          reviewedAt: new Date().toISOString()
        }));
      } catch {
        // ignore
      }

      setSubmitted(true);
      triggerGlobalRefresh();

      setTimeout(() => {
        onSuccess?.(createdReview);
        onClose();
      }, 1600);
    } catch (err: any) {
      setError(err.message || 'Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Service Feedback & Rating"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 font-normal text-slate-800"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0 text-left">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-600 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            </div>
            <div className="truncate">
              <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                {t('review.verifiedJob', 'Verified Service Feedback')}
              </span>
              <h3 className="text-xs sm:text-sm font-medium text-slate-900 truncate">
                {t('review.rateSpecialist', 'Rate Service Provider')}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-left scrollbar-thin">
          {submitted ? (
            <div className="text-center py-8 space-y-3 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-medium text-slate-900">
                  {t('review.successTitle', 'Review Submitted Successfully!')}
                </h4>
                <p className="text-xs text-slate-500 font-light max-w-sm mx-auto leading-relaxed">
                  {t(
                    'review.successMessage',
                    'Thank you! Your feedback has been verified and added to the specialist profile.'
                  )}
                </p>
              </div>
              <div className="pt-2 flex justify-center">
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-medium flex items-center gap-1">
                  ★ {rating}.0 / 5.0 Rating Logged
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Specialist Info Card */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 truncate">
                  <img
                    src={
                      booking.providerAvatar ||
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'
                    }
                    alt={booking.providerName}
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <div className="truncate">
                    <h5 className="text-xs sm:text-sm font-medium text-slate-900 truncate">
                      {booking.providerName}
                    </h5>
                    <p className="text-[11px] text-slate-500 font-light truncate">
                      {booking.serviceName} • Order #{booking.id.slice(-6)}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                  Completed
                </span>
              </div>

              {/* Main Interactive 5-Star Rating Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-50/50 to-orange-50/30 border border-amber-200/80 text-center space-y-2">
                <p className="text-xs font-medium text-slate-700">
                  {t('review.overallExperience', 'How was your overall experience?')}
                </p>

                {/* Stars */}
                <div className="flex items-center justify-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = currentDisplayRating >= starVal;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setRating(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 transition-transform hover:scale-125 active:scale-95 cursor-pointer focus:outline-none"
                        title={`Rate ${starVal} Star${starVal > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                            isFilled
                              ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                              : 'text-slate-300 fill-slate-100'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Score text badge */}
                <p className="text-xs font-medium text-amber-700 font-mono tracking-tight">
                  {getScoreDescription(currentDisplayRating)}
                </p>
              </div>

              {/* Aspect Micro-Ratings */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                  Detailed Service Breakdown:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Craft Quality */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center space-y-1">
                    <span className="text-[10px] text-slate-600 block truncate font-medium">
                      {t('review.craftQuality', 'Craft Quality')}
                    </span>
                    <div className="flex justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setCraftQuality(s)}
                          className="cursor-pointer"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              craftQuality >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Punctuality */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center space-y-1">
                    <span className="text-[10px] text-slate-600 block truncate font-medium">
                      {t('review.punctuality', 'Punctuality')}
                    </span>
                    <div className="flex justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setPunctuality(s)}
                          className="cursor-pointer"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              punctuality >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Communication */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center space-y-1">
                    <span className="text-[10px] text-slate-600 block truncate font-medium">
                      {t('review.communication', 'Communication')}
                    </span>
                    <div className="flex justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setCommunication(s)}
                          className="cursor-pointer"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              communication >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Compliment Tags */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                  {t('review.quickTags', 'Quick Compliments:')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickTagOptions.map((tag) => {
                    const isSelected = selectedTags.includes(tag.label);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.label)}
                        className={`px-2.5 py-1 rounded-full text-xs font-light transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text Review Box */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700 block">
                  {t('review.commentLabel', 'Detailed Review & Comments')}
                </label>
                <textarea
                  value={comment || ''}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t(
                    'review.commentPlaceholder',
                    'Describe the craft quality, punctuality, and professionalism...'
                  )}
                  rows={3}
                  maxLength={600}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-light resize-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-light">
                  <span>Your feedback helps the community choose verified specialists</span>
                  <span>{comment.length}/600</span>
                </div>
              </div>

              {/* Photo Upload & Optional Tip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Photo upload */}
                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                    Job Photo (Optional):
                  </span>
                  <label className="p-2.5 rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Uploaded preview"
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <Camera className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-[11px] text-slate-600 font-light truncate">
                      {photoPreview ? 'Photo attached ✓' : 'Add completed work photo'}
                    </span>
                  </label>
                </div>

                {/* Optional Gratitude Tip */}
                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                    {t('review.tipSpecialist', 'Add Optional Tip:')}
                  </span>
                  <div className="flex items-center gap-1">
                    {[0, 5, 10, 15].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTipAmount(amt)}
                        className={`flex-1 py-2 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer border ${
                          tipAmount === amt
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {amt === 0 ? 'None' : `$${amt}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-light flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-normal transition-colors cursor-pointer"
                >
                  {t('action.cancel', 'Cancel')}
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {submitting
                      ? t('review.submitting', 'Publishing Review...')
                      : t('review.submit', 'Submit Verified Review')}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
