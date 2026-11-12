import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Transaction } from '../types';
import { DirectImageUpload } from './common/DirectImageUpload';
import { ALL_CURRENCIES, getCurrency, formatPrice } from '../utils/currency';
import {
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Globe,
  Clock,
  Send,
  Loader2
} from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, refreshUser, globalRefreshKey } = useAuth();
  const [balance, setBalance] = useState<number>(currentUser?.walletBalance || 0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(currentUser?.preferredCurrency || 'USD');
  const [depositAmount, setDepositAmount] = useState('50');
  const [depositCurrency, setDepositCurrency] = useState<string>(currentUser?.preferredCurrency || 'USD');
  const [currencySaving, setCurrencySaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('100');
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Identity Verification (KYC) State
  const [isIdentityVerified, setIsIdentityVerified] = useState<boolean>(!!currentUser?.identityVerified);
  const [walletStatus, setWalletStatus] = useState<string>(currentUser?.walletStatus || (currentUser?.identityVerified ? 'active' : 'unverified'));
  const [showKycForm, setShowKycForm] = useState<boolean>(!currentUser?.identityVerified && currentUser?.walletStatus !== 'pending_approval');
  const [kycFullName, setKycFullName] = useState<string>(currentUser?.name || '');
  const [kycDocumentType, setKycDocumentType] = useState<'passport' | 'drivers_license' | 'national_id'>('passport');
  const [kycDocumentNumber, setKycDocumentNumber] = useState<string>('P98241088');
  const [kycCountry, setKycCountry] = useState<string>('United States');
  const [kycDocumentImage, setKycDocumentImage] = useState<string>('');
  const [kycSubmitting, setKycSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentUser?.id) return;
    setLoading(true);

    fetch(`/api/wallet/${currentUser.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.balance === 'number') {
          setBalance(data.balance);
        } else if (currentUser?.walletBalance !== undefined) {
          setBalance(currentUser.walletBalance);
        }
        if (typeof data.identityVerified === 'boolean') {
          setIsIdentityVerified(data.identityVerified);
        }
        if (data.preferredCurrency || data.currency) {
          const userCurr = data.preferredCurrency || data.currency;
          setSelectedCurrency(userCurr);
          setDepositCurrency(userCurr);
        }
        if (data.idVerification?.status) {
          setWalletStatus(data.idVerification.status);
        } else if (currentUser?.walletStatus) {
          setWalletStatus(currentUser.walletStatus);
        }
        if (Array.isArray(data?.transactions)) {
          setTransactions(data.transactions);
        }
      })
      .finally(() => setLoading(false));
  }, [isOpen, currentUser?.id, currentUser?.identityVerified, currentUser?.walletStatus, globalRefreshKey]);

  if (!isOpen || !currentUser) return null;

  const activeCurrencyObj = getCurrency(selectedCurrency);
  const depositCurrencyObj = getCurrency(depositCurrency);
  const convertedUsdAmount = parseFloat(depositAmount || '0') / depositCurrencyObj.rate;
  const displayBalanceInSelectedCurrency = (balance ?? 0) * activeCurrencyObj.rate;

  const handleSelectCurrency = async (newCurrencyCode: string) => {
    if (!currentUser?.id || newCurrencyCode === selectedCurrency) return;
    setSelectedCurrency(newCurrencyCode);
    setDepositCurrency(newCurrencyCode);
    setCurrencySaving(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/wallet/${currentUser.id}/currency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: newCurrencyCode })
      });
      if (res.ok) {
        setNotification(`Currency switched to ${newCurrencyCode}`);
        await refreshUser();
      } else {
        const errData = await res.json();
        setErrorMessage(errData.error || 'Failed to save currency');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error updating currency');
    } finally {
      setCurrencySaving(false);
    }
  };

  const handleVerifyIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    if (!kycDocumentImage) {
      setErrorMessage('Please attach a photo of your government ID or passport.');
      return;
    }

    setKycSubmitting(true);
    setErrorMessage(null);
    setWalletStatus('pending_approval');
    setShowKycForm(false);
    setNotification('Document uploaded instantly! Queued for review.');

    try {
      const res = await fetch(`/api/wallet/${currentUser.id}/verify-identity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: kycFullName,
          documentType: kycDocumentType,
          documentNumber: kycDocumentNumber,
          country: kycCountry,
          address: currentUser.location?.address || 'Verified Address',
          documentImage: kycDocumentImage
        })
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error || 'Verification submission error');
      } else {
        await refreshUser();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error during verification');
    } finally {
      setKycSubmitting(false);
    }
  };

  const handleDeposit = async () => {
    if (!isIdentityVerified && walletStatus !== 'active') {
      setShowKycForm(true);
      setErrorMessage('Please complete identity document verification first.');
      return;
    }

    const rawAmt = parseFloat(depositAmount);
    if (!rawAmt || rawAmt <= 0) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/wallet/${currentUser.id}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: convertedUsdAmount,
          currency: depositCurrency,
          originalAmount: rawAmt,
          method: 'card'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance);
        if (data.transaction) {
          setTransactions((prev) => [data.transaction, ...prev]);
        }
        setIsDepositing(false);
        setNotification(`Added ${depositCurrency} ${rawAmt.toFixed(2)} to wallet.`);
        await refreshUser();
      } else {
        setErrorMessage(data.error || 'Deposit failed');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (currentUser.role === 'customer') {
      setErrorMessage('Cashout is reserved for service providers.');
      return;
    }

    if (!isIdentityVerified && walletStatus !== 'active') {
      setShowKycForm(true);
      setErrorMessage('Identity verification required before withdrawing earnings.');
      return;
    }

    const rawAmt = parseFloat(withdrawAmount);
    if (!rawAmt || rawAmt <= 0) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/wallet/${currentUser.id}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: rawAmt,
          method: 'bank_transfer'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance);
        if (data.transaction) {
          setTransactions((prev) => [data.transaction, ...prev]);
        }
        setIsWithdrawing(false);
        setNotification(`Payout request of $${rawAmt.toFixed(2)} dispatched.`);
        await refreshUser();
      } else {
        setErrorMessage(data.error || 'Withdrawal failed');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-[94vw] max-w-[370px] sm:max-w-md bg-gradient-to-b from-[#edf2ff] via-[#f8fafc] to-[#e8edff] rounded-2xl shadow-xl border border-indigo-100/80 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-3 sm:p-3.5 border-b border-indigo-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">Servexa Wallet</h2>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-slate-500 font-light">Multi-Currency</span>
                {isIdentityVerified ? (
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-medium text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-medium text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                    <Clock className="w-2.5 h-2.5" />
                    {walletStatus === 'pending_approval' ? 'Pending' : 'Action Required'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-3 sm:p-3.5 overflow-y-auto space-y-2.5">
          {notification && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] font-normal flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] font-normal flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Balance Display Card - Compact */}
          <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs flex items-center justify-between gap-2">
            <div>
              <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Available Balance</span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-0.5">
                {activeCurrencyObj.symbol}
                {displayBalanceInSelectedCurrency.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
              <p className="text-[9px] text-slate-400 font-mono">
                ≈ ${balance.toFixed(2)} USD standard reserve
              </p>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center gap-1 shrink-0">
              <div className="relative">
                <select
                  value={selectedCurrency || 'USD'}
                  onChange={(e) => handleSelectCurrency(e.target.value)}
                  disabled={currencySaving}
                  className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-800 text-[11px] font-medium py-1 pl-2 pr-6 rounded-md border border-slate-200 cursor-pointer shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {ALL_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
                <Globe className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Action Buttons: Add Funds / Withdraw - Compact */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                setIsDepositing(!isDepositing);
                setIsWithdrawing(false);
              }}
              className="py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Add Funds</span>
            </button>

            {currentUser.role === 'provider' ? (
              <button
                onClick={() => {
                  setIsWithdrawing(!isWithdrawing);
                  setIsDepositing(false);
                }}
                className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                <span>Withdraw Payout</span>
              </button>
            ) : (
              <button
                disabled
                className="py-2 px-3 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-light flex items-center justify-center gap-1 cursor-not-allowed"
                title="Customer balance is reserved for service dispatch"
              >
                <span>Instant Checkout</span>
              </button>
            )}
          </div>

          {/* Quick Deposit Form */}
          {isDepositing && (
            <div className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Add Funds</span>
                <span className="text-[11px] text-slate-500">Instant Stripe / Card Gateway</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">{depositCurrencyObj.symbol}</span>
                  <input
                    type="number"
                    min="1"
                    value={depositAmount || ''}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-slate-800"
                    placeholder="50"
                  />
                </div>
                <button
                  onClick={handleDeposit}
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Confirm</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Withdraw Form for Providers */}
          {isWithdrawing && currentUser.role === 'provider' && (
            <div className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Withdraw Earnings</span>
                <span className="text-[11px] text-slate-500">Direct ACH / Wire</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min="10"
                    max={balance}
                    value={withdrawAmount || ''}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-slate-800"
                    placeholder="100"
                  />
                </div>
                <button
                  onClick={handleWithdraw}
                  disabled={loading || balance <= 0}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Request</span>
                </button>
              </div>
            </div>
          )}

          {/* Identity Document Verification (Fast Instant Upload) */}
          {(!isIdentityVerified || showKycForm) && (
            <div className="p-4 bg-white rounded-3xl border border-indigo-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900">Document Verification</span>
                </div>
                {walletStatus === 'pending_approval' && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Under Review
                  </span>
                )}
              </div>

              {walletStatus === 'pending_approval' ? (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-[11px] font-medium leading-relaxed">
                    Your verification documents have been uploaded instantly and are queued for administrator approval.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleVerifyIdentity} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Legal Name</label>
                      <input
                        type="text"
                        required
                        value={kycFullName || ''}
                        onChange={(e) => setKycFullName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Document Type</label>
                      <select
                        value={kycDocumentType || 'passport'}
                        onChange={(e: any) => setKycDocumentType(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                      >
                        <option value="passport">Passport</option>
                        <option value="drivers_license">Driver's License</option>
                        <option value="national_id">National ID Card</option>
                      </select>
                    </div>
                  </div>

                  {/* Instant Document Upload */}
                  <DirectImageUpload
                    label="Document Photo"
                    helperText="Photo attaches instantly"
                    value={kycDocumentImage}
                    onChange={(val) => setKycDocumentImage(val)}
                  />

                  <button
                    type="submit"
                    disabled={kycSubmitting || !kycDocumentImage}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {kycSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Submit Document for Verification</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Recent Activity */}
          <div className="p-4 bg-white rounded-3xl border border-indigo-100 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 mb-2.5">Recent Transactions</h3>
            {transactions.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No recent wallet transactions.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {transactions.slice(0, 6).map((tx) => (
                  <div
                    key={tx.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800 capitalize">{tx.description || tx.type}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(tx.timestamp || tx.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`font-mono font-bold ${
                        tx.type === 'deposit' || tx.type === 'credit'
                          ? 'text-emerald-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {tx.type === 'deposit' || tx.type === 'credit' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
