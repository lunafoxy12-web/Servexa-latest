import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Phone, Briefcase, ArrowRight, ShieldCheck, Wallet, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Category } from '../types';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, authModalTab, setAuthModalTab, login, loginWithGoogle, loginWithWallet, register, currentUser, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [businessName, setBusinessName] = useState('');
  const [categoryId, setCategoryId] = useState('cat-plumber');
  const [categories, setCategories] = useState<Category[]>([]);
  const [requestedCategoryName, setRequestedCategoryName] = useState('');
  const [requestedCategoryDesc, setRequestedCategoryDesc] = useState('');
  const [requestedCategoryPricing, setRequestedCategoryPricing] = useState('fixed');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [agreementData, setAgreementData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
          if (!categoryId || categoryId === 'cat-plumbing') {
            setCategoryId(data[0].id);
          }
        }
      })
      .catch(() => {});

    fetch('/api/agreement')
      .then(res => res.json())
      .then(data => {
        if (data && data.content) {
          setAgreementData(data);
        }
      })
      .catch(() => {});
  }, []);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (authModalTab === 'login') {
      setLoading(true);
      const result = await login(email, password);
      setLoading(false);
      if (!result.success) {
        setError(result.error || 'Login failed. Please check credentials.');
      }
    } else {
      if (!agreedToTerms) {
        setError('You must click the "Agree to Terms & Conditions" button to accept the agreement before creating your account.');
        return;
      }

      setLoading(true);
      if (role === 'provider' && categoryId === '__other_request__') {
        if (!requestedCategoryName.trim()) {
          setError('Please provide a name for your requested category.');
          setLoading(false);
          return;
        }
      }

      const assignedCatId = categoryId === '__other_request__' ? 'cat-pending-approval' : categoryId;
      const result = await register({
        name,
        email,
        phone,
        role,
        businessName: role === 'provider' ? businessName : undefined,
        categoryId: role === 'provider' ? assignedCatId : undefined,
        agreedToTerms: true,
        agreedAt: new Date().toISOString(),
        agreementVersion: agreementData?.version || 'v1.4.0'
      });

      if (!result.success) {
        setLoading(false);
        setError(result.error || 'Registration failed.');
        return;
      }

      // If requested a new category, submit to Admin Panel
      if (role === 'provider' && categoryId === '__other_request__') {
        try {
          await fetch('/api/category-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              providerId: result.user?.id || 'prov-new',
              providerName: name,
              providerEmail: email,
              categoryName: requestedCategoryName.trim(),
              description: requestedCategoryDesc.trim() || `Provider ${name} requested new category: ${requestedCategoryName}`,
              suggestedPricing: requestedCategoryPricing
            })
          });
        } catch (err) {
          console.error('Failed to submit category request', err);
        }
      }

      setLoading(false);
      setIsAuthModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              {authModalTab === 'login' ? 'Customer Sign In & Wallet' : 'Create Customer Account & Wallet'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {authModalTab === 'login'
                ? 'Your customer login is your wallet login. Access bookings, services & balance.'
                : 'Each customer account includes an integrated wallet (starts with 0 credits).'}
            </p>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 p-1">
          <button
            onClick={() => { setAuthModalTab('login'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              authModalTab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setAuthModalTab('register'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              authModalTab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          {/* Current session info if logged in */}
          {currentUser && (
            <div className="p-3 bg-indigo-50/60 border border-indigo-200/70 rounded-xl flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Current Session</p>
                <p className="text-xs font-bold text-slate-900">{currentUser.name} <span className="capitalize font-normal text-slate-500">({currentUser.role})</span></p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setError(null);
                }}
                className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}

          {authModalTab === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      role === 'customer'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('provider')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      role === 'provider'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Service Provider
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name || ''}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jordan Blake"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {role === 'provider' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name</label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={businessName || ''}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Bay Precision Plumbing"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Category</label>
                    <select
                      value={categoryId || 'cat-plumbing'}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      {categories.length > 0 ? (
                        categories.filter(c => c.enabled !== false).map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="cat-doctor">Doctors & Healthcare</option>
                          <option value="cat-food">Food & Restaurants</option>
                          <option value="cat-taxi">Taxi & Rides</option>
                          <option value="cat-courier">Courier & Delivery</option>
                          <option value="cat-plumber">Plumber & Piping</option>
                          <option value="cat-electrician">Electrician & Power</option>
                          <option value="cat-painter">Painter & Walls</option>
                          <option value="cat-cleaner">Cleaning & Maid</option>
                          <option value="cat-mechanic">Auto Mechanic</option>
                          <option value="cat-hvac">HVAC & Climate</option>
                        </>
                      )}
                      <option value="__other_request__" className="font-bold text-indigo-600">
                        ✨ Other / Request New Category...
                      </option>
                    </select>
                  </div>

                  {categoryId === '__other_request__' && (
                    <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5 animate-in fade-in">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Request a New Category for Admin Approval
                      </div>
                      <p className="text-[11px] text-indigo-700 leading-relaxed">
                        Cannot find your specialized trade? Propose it here. Our administrators will review and activate it for you.
                      </p>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Requested Category Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={requestedCategoryName || ''}
                          onChange={(e) => setRequestedCategoryName(e.target.value)}
                          placeholder="e.g. Locksmith & Safe Tech, Pet Grooming, Solar Repair"
                          className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Services Description & Details *
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={requestedCategoryDesc || ''}
                          onChange={(e) => setRequestedCategoryDesc(e.target.value)}
                          placeholder="Explain what specialist tasks this new category covers..."
                          className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Suggested Pricing Model
                        </label>
                        <select
                          value={requestedCategoryPricing || 'fixed'}
                          onChange={(e) => setRequestedCategoryPricing(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-slate-900 focus:outline-hidden"
                        >
                          <option value="fixed">Fixed Flat Rate ($)</option>
                          <option value="hourly">Hourly Rate ($/hr)</option>
                          <option value="quote">Custom Quote Upon Inspection</option>
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={phone || ''}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {authModalTab === 'login' ? 'Email or Username' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={email || ''}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={authModalTab === 'login' ? 'Enter email or username' : 'name@example.com'}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password || ''}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                defaultChecked={true}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Remember sign in on all devices</span>
            </label>
            {authModalTab === 'login' && (
              <span className="text-slate-400 text-[11px]">Encrypted session</span>
            )}
          </div>

          {/* Mandatory Agreement Section for Registration */}
          {authModalTab === 'register' && (
            <div className={`p-4 rounded-2xl border-2 transition-all ${
              agreedToTerms
                ? 'bg-emerald-50/80 border-emerald-400 shadow-xs'
                : 'bg-amber-50/60 border-amber-300'
            } space-y-3`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${agreedToTerms ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <span className="text-xs font-bold text-slate-900">
                    Terms & Conditions Agreement *
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAgreementModal(true)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 underline font-semibold cursor-pointer"
                >
                  Read Terms ({agreementData?.version || 'v1.4.0'})
                </button>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                By creating an account, you must agree to the platform community rules, customer protection escrow, and dispatch terms.
              </p>

              {/* Mandatory Clickable Agree Button */}
              <button
                type="button"
                onClick={() => {
                  setAgreedToTerms(!agreedToTerms);
                  if (error?.includes('Terms')) setError(null);
                }}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                  agreedToTerms
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300'
                    : 'bg-white hover:bg-amber-100/70 text-slate-900 border-2 border-amber-400 hover:border-amber-500'
                }`}
              >
                {agreedToTerms ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                    <span>I Agree to Terms & Conditions ✓</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <span>Click Here to Agree to Terms & Conditions *</span>
                  </>
                )}
              </button>

              {!agreedToTerms && (
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-700">
                  <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>Required: Click the button above to enable account creation.</span>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
              authModalTab === 'register' && !agreedToTerms
                ? 'bg-slate-400 text-white cursor-not-allowed hover:bg-slate-400'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {loading ? 'Verifying...' : authModalTab === 'login' ? 'Sign In to Account' : 'Create Account'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400">or continue with</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setError(null);
                setLoading(true);
                const res = await loginWithGoogle(authModalTab === 'register' ? role : undefined);
                setLoading(false);
                if (!res.success && !res.cancelled) {
                  setError(res.error || 'Google sign-in failed');
                }
              }}
              className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2">
              Each user receives an individual secure wallet upon login.
            </p>
          </div>
        </form>

        {/* Platform Agreement Viewer Modal */}
        {showAgreementModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {agreementData?.title || 'Servexa Platform User Agreement'}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-light">
                    Version {agreementData?.version || 'v1.4.0'} • Last updated by {agreementData?.updatedBy || 'Platform Admin'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAgreementModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-3 text-xs font-light text-slate-700 leading-relaxed whitespace-pre-line flex-1 bg-slate-50/40">
                {agreementData?.content || 'Loading agreement content...'}
              </div>

              <div className="p-3 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowAgreementModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-light text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAgreedToTerms(true);
                    setShowAgreementModal(false);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-light shadow-xs cursor-pointer"
                >
                  I Allow & Agree
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
