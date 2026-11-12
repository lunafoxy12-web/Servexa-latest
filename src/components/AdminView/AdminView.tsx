import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { approveVerificationInFirestore } from '../../lib/firebase';
import { safeFetchJson } from '../../utils/safeFetch';
import {
  User,
  ProviderProfile,
  PlatformSettings,
  AdminAuditLog,
  Complaint,
  MerchantSettings
} from '../../types';
import {
  Shield,
  Users,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Sliders,
  Radio,
  FileText,
  MapPin,
  Car,
  Lock,
  RefreshCw,
  CreditCard,
  MessageSquare,
  Send,
  HelpCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Key,
  Globe,
  ShieldCheck,
  Eye,
  Check,
  FileCheck,
  Layers,
  Mail,
  Tag,
  Sparkles
} from 'lucide-react';
import { CategoryManagement } from './CategoryManagement';
import { ActivityTransactionLog } from './ActivityTransactionLog';
import { EmailSmtpSettings } from './EmailSmtpSettings';

export const AdminView: React.FC = () => {
  const {
    currentUser,
    globalRefreshKey,
    triggerGlobalRefresh,
    openComplaintChat
  } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [verifications, setVerifications] = useState<User[]>([]);
  const [inspectingDocUser, setInspectingDocUser] = useState<User | null>(null);
  const [rejectModalUser, setRejectModalUser] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Document image blurry or unreadable. Please upload a clear photo.');
  const [settings, setSettings] = useState<PlatformSettings>({
    commissionRatePct: 5,
    autoApproveProviders: false,
    pbxCodec: 'Opus-Adaptive-64k',
    maxVoIPBitrateKbps: 64,
    emergencyDispatchEnabled: true
  });

  const [merchant, setMerchant] = useState<MerchantSettings>({
    activeGateway: 'stripe',
    environment: 'test',
    autoPayoutEnabled: true,
    payoutSchedule: 'daily',
    stripePublishableKey: 'pk_test_servexa_live_gateway_token_99',
    stripeSecretKey: 'sk_test_••••••••••••••••••••',
    stripeWebhookSecret: 'whsec_••••••••••••••••',
    paypalClientId: '',
    squareAppId: '',
    updatedAt: new Date().toISOString()
  });

  const [activeTab, setActiveTab] = useState<
    'users' | 'verifications' | 'disputes' | 'categories' | 'activity_log' | 'email_smtp' | 'merchant' | 'radar' | 'settings' | 'audit' | 'support_content' | 'agreements'
  >('users');

  // Platform Agreement State
  const [agreementState, setAgreementState] = useState<any>({
    title: 'Servexa Platform Agreement & Terms of Service',
    version: 'v1.4.0',
    content: '',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Admin'
  });
  const [agreementSaving, setAgreementSaving] = useState(false);
  const [agreementSavedNotice, setAgreementSavedNotice] = useState(false);

  // Support & Help Content Management State
  const [supportContent, setSupportContent] = useState<any>({
    supportPhone: '+1 (800) 737-8392',
    supportEmail: 'support@servexaworld.com',
    operatingHours: '24/7 Real-Time Customer & Specialist Assistance',
    averageResponseTime: '< 2 Minutes',
    liveChatAvailable: true,
    announcementText: 'Servexa SafeGuard: All dispatches are protected with escrow payments and 4-digit security PIN handover.',
    faqs: [],
    safetyGuides: []
  });
  const [supportSaving, setSupportSaving] = useState(false);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [newFaqCategory, setNewFaqCategory] = useState('General');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'provider'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked' | 'suspended'>('all');
  const [agreementFilter, setAgreementFilter] = useState<'all' | 'agreed' | 'pending'>('all');
  const [complaintFilter, setComplaintFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Wallet Adjustment Modal State
  const [walletModalUser, setWalletModalUser] = useState<User | null>(null);
  const [walletAmount, setWalletAmount] = useState<string>('25.00');
  const [walletType, setWalletType] = useState<'credit' | 'debit'>('credit');
  const [walletReason, setWalletReason] = useState<string>('Arbitration dispute resolution / compensation');
  const [walletSubmitting, setWalletSubmitting] = useState(false);

  // Merchant Testing State
  const [merchantTesting, setMerchantTesting] = useState(false);
  const [merchantTestResult, setMerchantTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [merchantSaving, setMerchantSaving] = useState(false);

  // Third-party automated verification state
  const [thirdPartySettings, setThirdPartySettings] = useState<{
    enabled: boolean;
    provider: string;
    apiKey: string;
    secretKey: string;
    webhookSecret: string;
    autoApprove: boolean;
  }>({
    enabled: false,
    provider: 'veriff',
    apiKey: '',
    secretKey: '',
    webhookSecret: '',
    autoApprove: false
  });
  const [showThirdPartyConfig, setShowThirdPartyConfig] = useState(false);
  const [thirdPartyTesting, setThirdPartyTesting] = useState(false);
  const [thirdPartyTestMsg, setThirdPartyTestMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [thirdPartySaving, setThirdPartySaving] = useState(false);

  // Fetch all admin data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, provsRes, auditRes, settingsRes, complaintsRes, merchantRes, verifRes, thirdPartyRes] =
        await Promise.all([
          safeFetchJson('/api/admin/stats', undefined, null),
          safeFetchJson('/api/admin/users', undefined, []),
          safeFetchJson('/api/providers', undefined, []),
          safeFetchJson('/api/admin/audit-logs', undefined, []),
          safeFetchJson('/api/admin/settings', undefined, null),
          safeFetchJson('/api/complaints', undefined, []),
          safeFetchJson('/api/admin/merchant', undefined, null),
          safeFetchJson('/api/admin/verifications', undefined, { verifications: [] }),
          safeFetchJson('/api/admin/settings/verification', undefined, null)
        ]);

      if (statsRes) setStats(statsRes);
      if (Array.isArray(usersRes)) setUsers(usersRes);
      if (Array.isArray(provsRes)) setProviders(provsRes);
      if (Array.isArray(auditRes)) setAuditLogs(auditRes);
      if (settingsRes && !settingsRes.error) setSettings(settingsRes);
      if (Array.isArray(complaintsRes)) setComplaints(complaintsRes);
      if (merchantRes && !merchantRes.error) setMerchant(merchantRes);
      if (verifRes?.verifications && Array.isArray(verifRes.verifications)) {
        setVerifications(verifRes.verifications);
      }
      if (thirdPartyRes && !thirdPartyRes.error) {
        setThirdPartySettings({
          enabled: thirdPartyRes.provider !== 'manual' && thirdPartyRes.enabled !== false,
          provider: thirdPartyRes.provider || 'veriff',
          apiKey: thirdPartyRes.apiKey || '',
          secretKey: thirdPartyRes.secretKey || '',
          webhookSecret: thirdPartyRes.webhookSecret || '',
          autoApprove: !!thirdPartyRes.autoApprove
        });
      }

      const content = await safeFetchJson('/api/support/content', undefined, null);
      if (content && !content.error) setSupportContent(content);
    } catch (e: any) {
      console.warn('AdminView fetchData notice:', e?.message || e);
    } finally {
      setLoading(false);
    }
  };

  // Load platform agreement on mount
  useEffect(() => {
    fetch('/api/agreement')
      .then(r => r.json())
      .then(data => {
        if (data && data.content) setAgreementState(data);
      })
      .catch(() => {});
  }, []);

  const handleSaveAgreement = async () => {
    setAgreementSaving(true);
    try {
      const res = await fetch('/api/admin/agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: agreementState.title,
          content: agreementState.content,
          version: agreementState.version,
          adminName: currentUser?.name || 'Administrator'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAgreementState(data);
        setAgreementSavedNotice(true);
        setTimeout(() => setAgreementSavedNotice(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAgreementSaving(false);
    }
  };

  const handleSaveSupportContent = async () => {
    setSupportSaving(true);
    try {
      const res = await fetch('/api/support/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supportContent)
      });
      if (res.ok) {
        setNotification('Support & Help content successfully updated for all users!');
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSupportSaving(false);
    }
  };

  const handleAddFaq = () => {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;
    const newItem = {
      id: `faq-${Date.now()}`,
      category: newFaqCategory || 'General',
      question: newFaqQuestion.trim(),
      answer: newFaqAnswer.trim()
    };
    setSupportContent((prev: any) => ({
      ...prev,
      faqs: [...(prev.faqs || []), newItem]
    }));
    setNewFaqQuestion('');
    setNewFaqAnswer('');
  };

  const handleDeleteFaq = (faqId: string) => {
    setSupportContent((prev: any) => ({
      ...prev,
      faqs: (prev.faqs || []).filter((f: any) => f.id !== faqId)
    }));
  };

  const handleApproveVerification = async (userId: string) => {
    try {
      // Sync approval directly in Firestore
      await approveVerificationInFirestore(
        userId,
        currentUser?.id || 'admin-1',
        currentUser?.name || 'Administrator'
      ).catch(err => console.warn('[Firestore] approveVerification warning:', err));

      const res = await fetch(`/api/admin/verifications/${userId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: currentUser?.id || 'admin-1',
          adminName: currentUser?.name || 'Administrator'
        })
      });
      if (res.ok) {
        setNotification('User identity verification approved in Firestore & wallet unlocked successfully!');
        fetchData();
        triggerGlobalRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectVerification = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/verifications/${userId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: currentUser?.id || 'admin-1',
          adminName: currentUser?.name || 'Administrator',
          reason: rejectionReason
        })
      });
      if (res.ok) {
        setNotification('Verification document rejected and user notified.');
        setRejectModalUser(null);
        fetchData();
        triggerGlobalRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveThirdParty = async (e: React.FormEvent) => {
    e.preventDefault();
    setThirdPartySaving(true);
    setThirdPartyTestMsg(null);
    try {
      const res = await fetch('/api/admin/settings/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: thirdPartySettings.enabled ? thirdPartySettings.provider : 'manual',
          apiKey: thirdPartySettings.apiKey,
          secretKey: thirdPartySettings.secretKey,
          webhookSecret: thirdPartySettings.webhookSecret,
          autoApprove: thirdPartySettings.autoApprove
        })
      });
      if (res.ok) {
        setNotification('Third-party verification settings updated successfully!');
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setThirdPartySaving(false);
    }
  };

  const handleTestThirdParty = async () => {
    setThirdPartyTesting(true);
    setThirdPartyTestMsg(null);
    try {
      const res = await fetch('/api/admin/settings/verification/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: thirdPartySettings.provider,
          apiKey: thirdPartySettings.apiKey,
          secretKey: thirdPartySettings.secretKey
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setThirdPartyTestMsg({ success: true, text: data.message || 'Connection verified successfully!' });
      } else {
        setThirdPartyTestMsg({ success: false, text: data.error || 'Connection failed' });
      }
    } catch (e: any) {
      setThirdPartyTestMsg({ success: false, text: e.message || 'Network error testing verification service' });
    } finally {
      setThirdPartyTesting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [globalRefreshKey]);

  // Status toggle handler
  const handleUserStatusChange = async (userId: string, status: 'active' | 'blocked' | 'suspended') => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          adminId: currentUser?.id || 'admin-pirate',
          adminName: currentUser?.name || 'Mr. Pirate'
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: updated.status } : u)));
        setNotification(`Real-time update broadcasted: User status changed to ${status.toUpperCase()}`);
        triggerGlobalRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Verification toggle
  const handleToggleVerification = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: currentUser?.id || 'admin-pirate',
          adminName: currentUser?.name || 'Mr. Pirate'
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, verified: updated.verified } : u)));
        setNotification(`Verification toggled: ${updated.verified}`);
        triggerGlobalRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Real-time Wallet Adjustment Submit
  const handleWalletAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletModalUser || !walletAmount) return;

    setWalletSubmitting(true);
    try {
      const res = await fetch('/api/admin/wallets/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: walletModalUser.id,
          amount: parseFloat(walletAmount),
          type: walletType,
          reason: walletReason,
          adminId: currentUser?.id || 'admin-pirate',
          adminName: currentUser?.name || 'Mr. Pirate'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to adjust balance');

      setUsers((prev) =>
        prev.map((u) => (u.id === walletModalUser.id ? { ...u, walletBalance: data.newBalance } : u))
      );
      setNotification(
        `Successfully ${walletType === 'credit' ? 'credited' : 'debited'} $${parseFloat(
          walletAmount
        ).toFixed(2)} to ${walletModalUser.name}. New balance: $${data.newBalance.toFixed(2)}`
      );
      setWalletModalUser(null);
      triggerGlobalRefresh();
    } catch (err: any) {
      setNotification(`Wallet adjustment note: ${err?.message || 'Transaction failed'}`);
    } finally {
      setWalletSubmitting(false);
    }
  };

  // Complaint resolution
  const handleComplaintResolution = async (
    complaintId: string,
    status: 'under_review' | 'resolved' | 'rejected',
    actionRefund = false,
    refundAmount?: number,
    targetUserId?: string
  ) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          resolutionNotes: actionRefund
            ? `Dispute arbitrated: Issued $${refundAmount?.toFixed(2)} refund directly to account.`
            : `Status updated to ${status} by administrator.`,
          adminId: currentUser?.id || 'admin-pirate',
          adminName: currentUser?.name || 'Mr. Pirate',
          actionRefund,
          refundAmount,
          targetUserId
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setComplaints((prev) => prev.map((c) => (c.id === complaintId ? updated : c)));
        setNotification(`Dispute ticket #${updated.ticketNumber} updated to ${status.toUpperCase()}`);
        triggerGlobalRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Test Merchant Gateway Connection
  const handleTestMerchantConnection = async () => {
    setMerchantTesting(true);
    setMerchantTestResult(null);
    try {
      const res = await fetch('/api/admin/merchant/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: merchant.activeGateway,
          environment: merchant.environment,
          publishableKey: merchant.stripePublishableKey,
          secretKey: merchant.stripeSecretKey,
          clientId: merchant.paypalClientId,
          appId: merchant.squareAppId
        })
      });

      const data = await res.json();
      setMerchantTestResult(data);
    } catch (e: any) {
      setMerchantTestResult({
        success: false,
        message: 'Could not connect to payment gateway: ' + e.message
      });
    } finally {
      setMerchantTesting(false);
    }
  };

  // Save Merchant Gateway
  const handleSaveMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    setMerchantSaving(true);
    try {
      const res = await fetch('/api/admin/merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...merchant,
          adminId: currentUser?.id || 'admin-pirate',
          adminName: currentUser?.name || 'Mr. Pirate'
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setMerchant(updated);
        setNotification('Payment Merchant settings updated and deployed live.');
        triggerGlobalRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMerchantSaving(false);
    }
  };

  // Save platform settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          adminId: currentUser?.id || 'admin-pirate',
          adminName: currentUser?.name || 'Mr. Pirate'
        })
      });

      if (res.ok) {
        setNotification('Platform economics & VoIP configurations saved.');
        triggerGlobalRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchesAgreement =
      agreementFilter === 'all' ||
      (agreementFilter === 'agreed' && u.agreedToTerms) ||
      (agreementFilter === 'pending' && !u.agreedToTerms);
    return matchesSearch && matchesRole && matchesStatus && matchesAgreement;
  });

  const filteredComplaints = complaints.filter((c) => {
    if (complaintFilter === 'all') return true;
    return c.status === complaintFilter;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20">
      {/* Top Banner with Platform Metrics */}
      <div className="bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-white">
                    Platform Management & Arbitration Console
                  </h1>
                  <p className="text-xs text-slate-400">
                    Real-time transaction settlement, live disputes, merchant gateways & user enforcement
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('agreements')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                  activeTab === 'agreements'
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                    : 'bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300'
                }`}
                title="Edit Platform Terms and Community Guidelines"
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Update Terms & Conditions</span>
              </button>
              <button
                onClick={fetchData}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh State
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
              <span className="text-[11px] text-slate-400 font-medium">Platform Net Revenue</span>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
                ${(stats?.platformRevenue ?? 742.5).toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                {settings.commissionRatePct}% platform cut
              </span>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
              <span className="text-[11px] text-slate-400 font-medium">Total System Accounts</span>
              <div className="text-2xl font-extrabold text-white mt-1 font-mono">{users.length}</div>
              <span className="text-[10px] text-slate-400 block mt-1">
                {users.filter((u) => u.status === 'active').length} active,{' '}
                {users.filter((u) => u.status === 'blocked').length} blocked
              </span>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
              <span className="text-[11px] text-slate-400 font-medium">Open Support Disputes</span>
              <div className="text-2xl font-extrabold text-rose-400 mt-1 font-mono">
                {complaints.filter((c) => c.status === 'open' || c.status === 'under_review').length}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                {complaints.length} total tickets registered
              </span>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
              <span className="text-[11px] text-slate-400 font-medium">Active Merchant Gateway</span>
              <div className="text-lg font-extrabold text-indigo-400 mt-1 uppercase font-mono flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                {merchant.activeGateway} ({merchant.environment})
              </div>
              <span className="text-[10px] text-emerald-400 block mt-1">
                ● Live Auto-Settlement
              </span>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
              <span className="text-[11px] text-slate-400 font-medium">PBX VoIP Core</span>
              <div className="text-xl font-extrabold text-emerald-400 mt-1 font-mono flex items-center gap-1.5">
                <Radio className="w-4 h-4 animate-pulse" />
                E2EE Active
              </div>
              <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                Opus Adaptive • 64k
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-slate-800 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'border-indigo-500 text-white bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Accounts & Wallets ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('verifications')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'verifications'
                ? 'border-indigo-500 text-white bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Verification & Document Approvals ({verifications.filter(v => v.walletStatus === 'pending_approval' || v.idVerification?.status === 'pending_approval').length})
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'disputes'
                ? 'border-indigo-500 text-white bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Disputes & Complaints ({complaints.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'categories'
                ? 'border-indigo-500 text-white bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            Categories & Approvals
          </button>
          <button
            onClick={() => setActiveTab('activity_log')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'activity_log'
                ? 'border-indigo-500 text-white bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            Live Activity & Ledger
          </button>
          <button
            onClick={() => setActiveTab('email_smtp')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'email_smtp'
                ? 'border-indigo-500 text-white bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4 text-purple-400" />
            Email & SMTP System
          </button>
          <button
            onClick={() => setActiveTab('merchant')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'merchant'
                ? 'border-indigo-500 text-white bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Payment Gateways & Real Merchant
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'radar'
                ? 'border-indigo-500 text-white bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4 text-indigo-400" />
            Global Live Radar
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-indigo-500 text-white bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4 text-slate-400" />
            Platform Fees
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-indigo-500 text-white bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-slate-400" />
            Audit Logs
          </button>
          <button
            onClick={() => setActiveTab('support_content')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'support_content'
                ? 'border-indigo-500 text-white bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-teal-400" />
            Support & Help Editor
          </button>
          <button
            onClick={() => setActiveTab('agreements')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'agreements'
                ? 'border-indigo-500 text-white bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            Platform Agreement & Terms
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notification Toast */}
        {notification && (
          <div className="mb-6 p-4 rounded-2xl bg-indigo-950 border border-indigo-500 text-indigo-200 text-xs font-bold flex items-center justify-between shadow-lg">
            <span>{notification}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-indigo-400 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Category Management Tab */}
        {activeTab === 'categories' && (
          <CategoryManagement onCategoryChange={triggerGlobalRefresh} />
        )}

        {/* Real-Time Activity & Transaction Ledger Tab */}
        {activeTab === 'activity_log' && (
          <ActivityTransactionLog />
        )}

        {/* Email & SMTP Settings Tab */}
        {activeTab === 'email_smtp' && (
          <EmailSmtpSettings />
        )}

        {/* TAB 1: Omni User & Wallet Management */}
        {activeTab === 'users' && (
          <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  User Accounts & Real-Time Wallet Adjustments
                </h2>
                <p className="text-xs text-slate-500">
                  Direct balance manipulation (add / remove funds in real time) and instant role status controls.
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery || ''}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, phone, email..."
                    className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={roleFilter || 'all'}
                  onChange={(e: any) => setRoleFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
                >
                  <option value="all">All Roles</option>
                  <option value="customer">Customers</option>
                  <option value="provider">Providers</option>
                </select>

                <select
                  value={statusFilter || 'all'}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                  <option value="suspended">Suspended</option>
                </select>

                <select
                  value={agreementFilter}
                  onChange={(e: any) => setAgreementFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
                >
                  <option value="all">All Agreements</option>
                  <option value="agreed">Agreement Allowed</option>
                  <option value="pending">Pending Agreement</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">User / Account</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Agreement</th>
                    <th className="p-3.5">Verified</th>
                    <th className="p-3.5">Wallet Balance</th>
                    <th className="p-3.5 text-right">Instant Authority Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              u.avatar ||
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                            }
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-[11px] text-slate-500">
                              {u.email} • {u.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'provider'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.status === 'blocked'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      <td className="p-3.5">
                        {u.agreedToTerms ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>Allowed ({u.agreementVersion || 'v1.4.0'})</span>
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {u.agreedAt ? new Date(u.agreedAt).toLocaleDateString() : 'Signed on Signup'}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-medium">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleVerification(u.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            u.verified
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {u.verified ? 'Verified' : 'Unverified'}
                        </button>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        ${(u.walletBalance ?? 0).toFixed(2)}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Add / Remove Money Button */}
                          <button
                            onClick={() => {
                              setWalletModalUser(u);
                              setWalletAmount('25.00');
                              setWalletType('credit');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            Adjust Funds
                          </button>

                          {u.role !== 'admin' && (
                            <>
                              {u.status === 'active' ? (
                                <>
                                  <button
                                    onClick={() => handleUserStatusChange(u.id, 'blocked')}
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                                  >
                                    Block
                                  </button>
                                  <button
                                    onClick={() => handleUserStatusChange(u.id, 'suspended')}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition-colors cursor-pointer"
                                  >
                                    Suspend
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleUserStatusChange(u.id, 'active')}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                                >
                                  Activate
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: Document Verifications & Wallet Approvals */}
        {activeTab === 'verifications' && (
          <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Official Document Verifications & Wallet Approvals
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {verifications.filter((v) => v.walletStatus === 'pending_approval' || v.idVerification?.status === 'pending_approval').length} Pending Action
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Inspect uploaded government IDs, passports, and licenses. Approving a document automatically unlocks the user's universal multi-currency wallet.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowThirdPartyConfig(!showThirdPartyConfig)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    showThirdPartyConfig
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 text-indigo-600" />
                  <span>3rd-Party Verification API</span>
                  {thirdPartySettings.enabled && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                  )}
                </button>

                <button
                  onClick={fetchData}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh Queue
                </button>
              </div>
            </div>

            {/* Third-Party Verification Integration Settings Card */}
            {showThirdPartyConfig && (
              <form onSubmit={handleSaveThirdParty} className="p-5 bg-gradient-to-b from-[#edf2ff] via-[#f8fafc] to-[#e8edff] rounded-2xl border border-indigo-200 shadow-sm space-y-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                        Third-Party Document Verification Gateway
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Attach third-party identity verification services (Persona, Veriff, Stripe Identity, Jumio, Onfido)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={thirdPartySettings.enabled}
                        onChange={(e) =>
                          setThirdPartySettings((prev) => ({ ...prev, enabled: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      <span className="ml-2 text-xs font-bold text-slate-800">
                        {thirdPartySettings.enabled ? 'Enabled' : 'Disabled (Manual)'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Verification Service Provider
                    </label>
                    <select
                      value={thirdPartySettings?.provider || 'veriff'}
                      onChange={(e) =>
                        setThirdPartySettings((prev) => ({ ...prev, provider: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="veriff">Veriff (Automated ID & Biometric)</option>
                      <option value="persona">Persona (Government ID & KYC)</option>
                      <option value="stripe_identity">Stripe Identity Verification</option>
                      <option value="jumio">Jumio KYC Platform</option>
                      <option value="onfido">Onfido Real Identity</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      API / Client Key
                    </label>
                    <input
                      type="text"
                      value={thirdPartySettings.apiKey || ''}
                      onChange={(e) =>
                        setThirdPartySettings((prev) => ({ ...prev, apiKey: e.target.value }))
                      }
                      placeholder="e.g. prf_live_api_key_8921..."
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Secret Key / Webhook Secret
                    </label>
                    <input
                      type="password"
                      value={thirdPartySettings.secretKey || ''}
                      onChange={(e) =>
                        setThirdPartySettings((prev) => ({ ...prev, secretKey: e.target.value }))
                      }
                      placeholder="••••••••••••••••••••"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Incoming Webhook Callback URL
                    </label>
                    <input
                      type="text"
                      value={thirdPartySettings.webhookSecret || 'https://servexa.world/api/webhooks/verification'}
                      onChange={(e) =>
                        setThirdPartySettings((prev) => ({ ...prev, webhookSecret: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="auto-approve-chk"
                      checked={thirdPartySettings.autoApprove}
                      onChange={(e) =>
                        setThirdPartySettings((prev) => ({ ...prev, autoApprove: e.target.checked }))
                      }
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="auto-approve-chk" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Auto-activate wallet upon 3rd-party PASS result
                    </label>
                  </div>
                </div>

                {thirdPartyTestMsg && (
                  <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    thirdPartyTestMsg.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {thirdPartyTestMsg.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{thirdPartyTestMsg.text}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-indigo-100">
                  <button
                    type="button"
                    onClick={handleTestThirdParty}
                    disabled={thirdPartyTesting}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {thirdPartyTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
                    <span>Test Integration</span>
                  </button>

                  <button
                    type="submit"
                    disabled={thirdPartySaving}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {thirdPartySaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Save 3rd-Party Settings</span>
                  </button>
                </div>
              </form>
            )}

            {/* Verifications List */}
            {verifications.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700">No Verifications in Queue</h3>
                <p className="text-xs text-slate-400 mt-1">
                  All user verification requests have been processed or none have been submitted yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="p-3.5">User & Account</th>
                      <th className="p-3.5">Document Details</th>
                      <th className="p-3.5">Document File</th>
                      <th className="p-3.5">Wallet Status</th>
                      <th className="p-3.5">Submitted</th>
                      <th className="p-3.5 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {verifications.map((u) => {
                      const v = u.idVerification;
                      const isPending = u.walletStatus === 'pending_approval' || v?.status === 'pending_approval';
                      const isApproved = u.walletStatus === 'active' || v?.status === 'verified';
                      const isRejected = v?.status === 'rejected';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 overflow-hidden border border-slate-200">
                                {u.avatar ? (
                                  <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                                ) : (
                                  u.name.charAt(0)
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">{u.name}</span>
                                <span className="text-[11px] text-slate-400 font-mono block">{u.email}</span>
                                <span className={`inline-block mt-0.5 px-2 py-0.2 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                  u.role === 'provider' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {u.role}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 font-bold text-slate-800 capitalize">
                                <FileCheck className="w-3.5 h-3.5 text-indigo-500" />
                                {v?.documentType ? v.documentType.replace('_', ' ') : 'Government ID'}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                No: <span className="font-semibold text-slate-700">{v?.documentNumber || 'N/A'}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Issued: {v?.issuingCountry || 'International'}
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            {v?.documentImage ? (
                              <div className="flex items-center gap-2">
                                <div
                                  onClick={() => setInspectingDocUser(u)}
                                  className="w-16 h-11 rounded-lg overflow-hidden border border-slate-200 cursor-pointer bg-slate-100 relative group shrink-0"
                                >
                                  <img
                                    src={v.documentImage}
                                    alt="Document"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Eye className="w-3.5 h-3.5" />
                                  </div>
                                </div>
                                <button
                                  onClick={() => setInspectingDocUser(u)}
                                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                >
                                  View Full File
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No file uploaded</span>
                            )}
                          </td>

                          <td className="p-3.5">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                                Awaiting Approval
                              </span>
                            ) : isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Wallet Active
                              </span>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                Unverified
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                            {v?.submittedAt ? new Date(v.submittedAt).toLocaleDateString() : 'N/A'}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleApproveVerification(u.id)}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Approve & Unlock Wallet
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRejectModalUser(u);
                                      setRejectionReason('Document image is blurry or expired. Please upload a clear valid copy.');
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    Reject
                                  </button>
                                </>
                              )}

                              {!isPending && isApproved && (
                                <button
                                  onClick={() => handleApproveVerification(u.id)}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                                  title="Re-confirm approval"
                                >
                                  Re-Confirm Active
                                </button>
                              )}

                              {!isPending && isRejected && (
                                <button
                                  onClick={() => handleApproveVerification(u.id)}
                                  className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  Override to Approved
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Disputes & Complaints Arbitration */}
        {activeTab === 'disputes' && (
          <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Support Disputes & Ticket Arbitration
                </h2>
                <p className="text-xs text-slate-500">
                  Inspect user complaints, chat directly with participants, and issue immediate wallet refunds.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Status:</span>
                <select
                  value={complaintFilter || 'all'}
                  onChange={(e) => setComplaintFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
                >
                  <option value="all">All Tickets</option>
                  <option value="open">Open</option>
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {filteredComplaints.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold">No complaints in this category</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredComplaints.map((c) => (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-mono font-bold">
                          #{c.ticketNumber}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : c.priority === 'high'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {c.priority} priority
                        </span>
                        <span className="text-xs font-semibold text-slate-600 capitalize">
                          {c.category.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {c.disputeAmount !== undefined && (
                          <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-mono font-bold text-xs">
                            Claimed: ${c.disputeAmount.toFixed(2)}
                          </div>
                        )}
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold capitalize ${
                            c.status === 'resolved'
                              ? 'bg-emerald-600 text-white'
                              : c.status === 'under_review'
                              ? 'bg-amber-500 text-white'
                              : c.status === 'rejected'
                              ? 'bg-slate-400 text-white'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {c.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{c.subject}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {c.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 text-xs">
                      <div className="text-slate-500">
                        Filed by <span className="font-bold text-slate-800">{c.userName}</span> (
                        {c.userRole})
                        {c.targetUserName && (
                          <span>
                            {' '}
                            against <span className="font-bold text-slate-800">{c.targetUserName}</span>
                          </span>
                        )}
                        {c.bookingId && (
                          <span className="ml-2 font-mono text-[11px] text-indigo-600">
                            Order #{c.bookingId}
                          </span>
                        )}
                      </div>

                      {/* Arbitration Actions */}
                      <div className="flex items-center gap-2">
                        {/* Direct Chat with User */}
                        <button
                          onClick={() => openComplaintChat(c.id)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Chat with Complainant ({c.messages?.length || 0})
                        </button>

                        {/* Issue Refund if claimed amount exists */}
                        {c.disputeAmount && c.status !== 'resolved' && (
                          <button
                            onClick={() =>
                              handleComplaintResolution(
                                c.id,
                                'resolved',
                                true,
                                c.disputeAmount,
                                c.userId
                              )
                            }
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            Issue Full Refund (${c.disputeAmount.toFixed(2)})
                          </button>
                        )}

                        {c.status !== 'resolved' && (
                          <button
                            onClick={() => handleComplaintResolution(c.id, 'resolved', false)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            Mark Resolved
                          </button>
                        )}

                        {c.status === 'open' && (
                          <button
                            onClick={() => handleComplaintResolution(c.id, 'under_review', false)}
                            className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Investigate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Real Merchant & Payment Gateway Integration */}
        {activeTab === 'merchant' && (
          <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 max-w-3xl">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Real Payment Merchant & Payout Settlement Gateway
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  PRODUCTION READY
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Attach real merchant credentials for Stripe, PayPal, Square, or Direct Merchant Settlement.
              </p>
            </div>

            <form onSubmit={handleSaveMerchant} className="space-y-6">
              {/* Select Gateway */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Primary Payment Processor
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'stripe', name: 'Stripe Elements', icon: '💳' },
                    { id: 'paypal', name: 'PayPal Commerce', icon: '🅿️' },
                    { id: 'square', name: 'Square Payments', icon: '⬛' },
                    { id: 'direct', name: 'Direct ACH/Wire', icon: '🏦' }
                  ].map((gw) => (
                    <button
                      key={gw.id}
                      type="button"
                      onClick={() => setMerchant({ ...merchant, activeGateway: gw.id as any })}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        merchant.activeGateway === gw.id
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xl mb-1">{gw.icon}</div>
                      <div className="text-xs font-bold text-slate-900">{gw.name}</div>
                      <div className="text-[10px] text-slate-400">Instant Checkout</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Environment Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Processing Environment</h4>
                  <p className="text-[11px] text-slate-500">
                    Switch between Live Production charges and Test Sandbox simulation
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-slate-200 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMerchant({ ...merchant, environment: 'test' })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      merchant.environment === 'test' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Test Sandbox
                  </button>
                  <button
                    type="button"
                    onClick={() => setMerchant({ ...merchant, environment: 'live' })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      merchant.environment === 'live'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Live Production
                  </button>
                </div>
              </div>

              {/* Dynamic Credential Fields based on Gateway */}
              {merchant.activeGateway === 'stripe' && (
                <div className="space-y-4 p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Key className="w-4 h-4 text-indigo-600" />
                    Stripe API Credentials
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Stripe Publishable Key
                    </label>
                    <input
                      type="text"
                      value={merchant.stripePublishableKey || ''}
                      onChange={(e) =>
                        setMerchant({ ...merchant, stripePublishableKey: e.target.value })
                      }
                      placeholder="pk_live_... or pk_test_..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Stripe Restricted / Secret Key
                    </label>
                    <input
                      type="password"
                      value={merchant.stripeSecretKey || ''}
                      onChange={(e) =>
                        setMerchant({ ...merchant, stripeSecretKey: e.target.value })
                      }
                      placeholder="sk_live_... or sk_test_..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Webhook Endpoint Signing Secret
                    </label>
                    <input
                      type="password"
                      value={merchant.stripeWebhookSecret || ''}
                      onChange={(e) =>
                        setMerchant({ ...merchant, stripeWebhookSecret: e.target.value })
                      }
                      placeholder="whsec_..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>
              )}

              {merchant.activeGateway === 'paypal' && (
                <div className="space-y-4 p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Globe className="w-4 h-4 text-blue-600" />
                    PayPal Commerce Platform Credentials
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PayPal Client ID
                    </label>
                    <input
                      type="text"
                      value={merchant.paypalClientId || ''}
                      onChange={(e) => setMerchant({ ...merchant, paypalClientId: e.target.value })}
                      placeholder="e.g. A21AAJ-f9w3o4u2..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>
              )}

              {merchant.activeGateway === 'square' && (
                <div className="space-y-4 p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <CreditCard className="w-4 h-4 text-slate-800" />
                    Square Application & Access Token
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Square Application ID
                    </label>
                    <input
                      type="text"
                      value={merchant.squareAppId || ''}
                      onChange={(e) => setMerchant({ ...merchant, squareAppId: e.target.value })}
                      placeholder="sq0idp-..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Automatic Payout Settlement Configuration */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Automatic Provider Payout Settlement
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Automatically transfer earnings to provider bank accounts minus commission
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={merchant.autoPayoutEnabled}
                    onChange={(e) =>
                      setMerchant({ ...merchant, autoPayoutEnabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 pt-2 border-t border-slate-200">
                  <span>Payout Cadence:</span>
                  {(['instant', 'daily', 'weekly'] as const).map((sched) => (
                    <label key={sched} className="flex items-center gap-1.5 cursor-pointer capitalize">
                      <input
                        type="radio"
                        name="schedule"
                        value={sched}
                        checked={merchant.payoutSchedule === sched}
                        onChange={() => setMerchant({ ...merchant, payoutSchedule: sched })}
                        className="accent-indigo-600"
                      />
                      {sched}
                    </label>
                  ))}
                </div>
              </div>

              {/* Test Result Message Banner */}
              {merchantTestResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-medium flex items-start gap-3 ${
                    merchantTestResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {merchantTestResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">
                      {merchantTestResult.success
                        ? 'Gateway Handshake Successful'
                        : 'Gateway Connection Failed'}
                    </p>
                    <p className="mt-0.5">{merchantTestResult.message}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleTestMerchantConnection}
                  disabled={merchantTesting}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${merchantTesting ? 'animate-spin' : ''}`} />
                  {merchantTesting ? 'Verifying Gateway...' : 'Test Connection'}
                </button>

                <button
                  type="submit"
                  disabled={merchantSaving}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {merchantSaving ? 'Deploying...' : 'Save & Attach Merchant Gateway'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: Radar */}
        {activeTab === 'radar' && (
          <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Global GPS Command Radar
              </h2>
              <p className="text-xs text-slate-500">
                Real-time active provider transponders and live customer dispatch coordinates.
              </p>
            </div>

            <div className="h-96 w-full rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden flex items-center justify-center">
              {/* Radar Grid Graphic */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'radial-gradient(#6366f1 1px, transparent 1px), radial-gradient(#6366f1 1px, #0f172a 1px)',
                  backgroundSize: '32px 32px'
                }}
              />

              {providers.map((p, idx) => (
                <div
                  key={p.userId}
                  className="absolute flex flex-col items-center"
                  style={{
                    top: `${30 + (idx * 20) % 55}%`,
                    left: `${25 + (idx * 30) % 65}%`
                  }}
                >
                  <div className="relative">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/30 animate-ping absolute inset-0" />
                    <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white relative z-10 shadow-md" />
                  </div>
                  <div className="mt-1 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono whitespace-nowrap shadow-lg">
                    {p.businessName} ({p.activeStatus})
                  </div>
                </div>
              ))}

              <div className="absolute bottom-4 left-4 bg-slate-900/90 text-white p-3 rounded-xl border border-slate-700 text-xs font-mono space-y-1">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>GPS Core Transceiver: ONLINE</span>
                </div>
                <div>Connected Transponders: {providers.length} Nodes</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Platform Economics */}
        {activeTab === 'settings' && (
          <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-sm p-6 max-w-2xl space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Platform Economics & Telephony Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Fine-tune marketplace fees, VoIP audio bitrate, and automatic approval thresholds.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900">
                    Platform Service Commission Rate
                  </label>
                  <span className="text-sm font-extrabold text-indigo-700 font-mono">
                    {settings.commissionRatePct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="0.5"
                  value={settings?.commissionRatePct ?? 10}
                  onChange={(e) =>
                    setSettings({ ...settings, commissionRatePct: parseFloat(e.target.value) })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">PBX VoIP Server Quality Engine</h4>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Primary Voice Codec</label>
                  <select
                    value={settings?.pbxCodec || 'Opus-Adaptive-64k'}
                    onChange={(e) => setSettings({ ...settings, pbxCodec: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                  >
                    <option value="Opus-Adaptive-64k">Opus Adaptive Bitrate (16k - 64k) [Recommended]</option>
                    <option value="G.711u">G.711 u-law (64kbps Standard Telephony)</option>
                    <option value="G.722-HD">G.722 Wideband HD Voice</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Save & Broadcast System Settings
              </button>
            </form>
          </div>
        )}

        {/* TAB 6: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Administrative Immutable Audit Trail</h2>
              <p className="text-xs text-slate-500">
                Cryptographically tracked record of all balance adjustments, status alterations, and merchant configs.
              </p>
            </div>

            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 font-mono text-xs flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                      LOG
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{log.action}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600 font-sans">{log.details}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Admin: {log.adminName} ({log.adminId})
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: Support & Help Center Content Manager */}
        {activeTab === 'support_content' && (
          <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-teal-600" />
                  <span>Support & Help Content Manager</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update customer support hotlines, operating hours, FAQs, and safety guides shown in the Profile Support page.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveSupportContent}
                disabled={supportSaving}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {supportSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Publish Updates To All Users</span>
              </button>
            </div>

            {/* General Contact & Hotline Settings */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Support Helpline & Channels
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Support Phone Hotline</label>
                  <input
                    type="text"
                    value={supportContent.supportPhone || ''}
                    onChange={(e) => setSupportContent({ ...supportContent, supportPhone: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                    placeholder="+1 (800) 737-8392"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Support Email Address</label>
                  <input
                    type="email"
                    value={supportContent.supportEmail || ''}
                    onChange={(e) => setSupportContent({ ...supportContent, supportEmail: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                    placeholder="support@servexaworld.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={supportContent.operatingHours || ''}
                    onChange={(e) => setSupportContent({ ...supportContent, operatingHours: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                    placeholder="24/7 Real-Time Customer & Specialist Assistance"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Average Response Time</label>
                  <input
                    type="text"
                    value={supportContent.averageResponseTime || ''}
                    onChange={(e) => setSupportContent({ ...supportContent, averageResponseTime: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                    placeholder="< 2 Minutes"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Announcement & Safety Notice</label>
                <textarea
                  rows={2}
                  value={supportContent.announcementText || ''}
                  onChange={(e) => setSupportContent({ ...supportContent, announcementText: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                  placeholder="Security banner text..."
                />
              </div>
            </div>

            {/* FAQs Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Manage Frequently Asked Questions (FAQs)</h3>
                  <p className="text-xs text-slate-500">Add or remove answers to common user queries</p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 rounded-full text-slate-700">
                  {(supportContent.faqs || []).length} Questions
                </span>
              </div>

              {/* Add New FAQ Form */}
              <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200/80 space-y-3">
                <h4 className="text-xs font-bold text-teal-900">Add New FAQ</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-teal-800 font-medium mb-1">Category</label>
                    <input
                      type="text"
                      value={newFaqCategory || ''}
                      onChange={(e) => setNewFaqCategory(e.target.value)}
                      className="w-full p-2 bg-white border border-teal-200 rounded-xl text-xs text-slate-900"
                      placeholder="e.g. Orders, Payments, PIN"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-teal-800 font-medium mb-1">Question</label>
                    <input
                      type="text"
                      value={newFaqQuestion || ''}
                      onChange={(e) => setNewFaqQuestion(e.target.value)}
                      className="w-full p-2 bg-white border border-teal-200 rounded-xl text-xs text-slate-900"
                      placeholder="e.g. How do I request an escrow refund?"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-teal-800 font-medium mb-1">Answer</label>
                  <textarea
                    rows={2}
                    value={newFaqAnswer || ''}
                    onChange={(e) => setNewFaqAnswer(e.target.value)}
                    className="w-full p-2 bg-white border border-teal-200 rounded-xl text-xs text-slate-900"
                    placeholder="Provide clear, concise instructions for the user..."
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddFaq}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    + Add Question
                  </button>
                </div>
              </div>

              {/* Existing FAQs List */}
              <div className="space-y-2.5">
                {(supportContent.faqs || []).map((faq: any, idx: number) => (
                  <div
                    key={faq.id || idx}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {faq.category || 'General'}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900">{faq.question}</h5>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-light pl-1">
                        {faq.answer}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Delete FAQ"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Platform User Agreement & Compliance Management */}
        {activeTab === 'agreements' && (
          <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>Platform User Agreement & Legal Terms Manager</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure agreement text shown to all users on signup. View real-time user acceptance records and legal audit trail.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {agreementSavedNotice && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Agreement Published Live!
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveAgreement}
                  disabled={agreementSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {agreementSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save & Publish Agreement</span>
                </button>
              </div>
            </div>

            {/* Compliance Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
                  Total Users
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {users.length}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Platform registered accounts</span>
              </div>

              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider block mb-1">
                  Agreed & Allowed
                </span>
                <span className="text-xl font-black text-emerald-700 font-mono">
                  {users.filter(u => u.agreedToTerms).length}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Verified accepted terms</span>
              </div>

              <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200">
                <span className="text-[11px] font-medium text-indigo-700 uppercase tracking-wider block mb-1">
                  Acceptance Rate
                </span>
                <span className="text-xl font-black text-indigo-700 font-mono">
                  {Math.round((users.filter(u => u.agreedToTerms).length / (users.length || 1)) * 100)}%
                </span>
                <span className="text-[10px] text-indigo-600 block mt-0.5">Mandatory signup consent</span>
              </div>

              <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200">
                <span className="text-[11px] font-medium text-purple-700 uppercase tracking-wider block mb-1">
                  Current Version
                </span>
                <span className="text-xl font-black text-purple-700 font-mono">
                  {agreementState?.version || 'v1.4.0'}
                </span>
                <span className="text-[10px] text-purple-600 block mt-0.5">Live on registration</span>
              </div>
            </div>

            {/* Agreement Content Editor Form */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Edit Platform Agreement Terms & Content
                </h3>
                <span className="text-[11px] text-slate-500 font-light">
                  Last updated by {agreementState?.updatedBy || 'Platform Admin'} on {agreementState?.updatedAt ? new Date(agreementState.updatedAt).toLocaleDateString() : 'Active'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Agreement Title
                  </label>
                  <input
                    type="text"
                    value={agreementState?.title || ''}
                    onChange={(e) => setAgreementState({ ...agreementState, title: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Servexa Platform User Agreement & Dispatch Terms"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Version Identifier
                  </label>
                  <input
                    type="text"
                    value={agreementState?.version || ''}
                    onChange={(e) => setAgreementState({ ...agreementState, version: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    placeholder="v1.4.0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agreement Content & Legal Clauses (Users review this during signup)
                </label>
                <textarea
                  rows={10}
                  value={agreementState?.content || ''}
                  onChange={(e) => setAgreementState({ ...agreementState, content: e.target.value })}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-light text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
                  placeholder="Enter the full terms of service, customer protection guidelines, provider responsibilities, and dispute resolution policies..."
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveAgreement}
                  disabled={agreementSaving}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {agreementSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save Changes & Broadcast To Signup</span>
                </button>
              </div>
            </div>

            {/* User Consent & Signed Agreements Audit Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Real-Time User Agreement Acceptance Records</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  Showing {users.length} registered accounts
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Agreement Status</th>
                      <th className="p-3">Version Allowed</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{u.name}</div>
                          <div className="text-[10px] text-slate-400">{u.email}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3">
                          {u.agreedToTerms ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>Agreed & Allowed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-medium">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending Agreement</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-600">
                          {u.agreedToTerms ? (u.agreementVersion || agreementState?.version || 'v1.4.0') : '—'}
                        </td>
                        <td className="p-3 text-[11px] text-slate-500 font-mono">
                          {u.agreedAt ? new Date(u.agreedAt).toLocaleString() : 'Signup Record'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Wallet Adjustment Modal */}
      {walletModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Real-time Account Wallet Adjustment</h3>
                  <p className="text-[11px] text-slate-400">
                    Add or remove funds with instant live WebSocket broadcast
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWalletModalUser(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWalletAdjustSubmit} className="p-6 space-y-4 text-slate-900 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[11px]">Target Account</span>
                  <p className="font-bold text-sm text-slate-900">{walletModalUser.name}</p>
                  <p className="text-slate-400 text-[10px]">{walletModalUser.email} ({walletModalUser.role})</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[11px]">Current Balance</span>
                  <p className="font-mono font-extrabold text-sm text-emerald-600">
                    ${(walletModalUser.walletBalance ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Action Type Toggle */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Action Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWalletType('credit')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      walletType === 'credit'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    Credit (Add Money)
                  </button>

                  <button
                    type="button"
                    onClick={() => setWalletType('debit')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      walletType === 'debit'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Debit (Remove Money)
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Amount ($ USD)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={walletAmount || ''}
                    onChange={(e) => setWalletAmount(e.target.value)}
                    placeholder="25.00"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Reason / Audit Note */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Audit & Notification Reason</label>
                <input
                  type="text"
                  required
                  value={walletReason || ''}
                  onChange={(e) => setWalletReason(e.target.value)}
                  placeholder="e.g. Dispute resolution credit or payment reconciliation"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={walletSubmitting}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {walletSubmitting
                  ? 'Transacting...'
                  : `Confirm & Broadcast ${walletType === 'credit' ? 'Credit' : 'Debit'}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Document Inspection Lightbox Modal */}
      {inspectingDocUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl border border-slate-700 max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Government Document Inspection: {inspectingDocUser.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {inspectingDocUser.idVerification?.documentType?.replace('_', ' ').toUpperCase()} • No: {inspectingDocUser.idVerification?.documentNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingDocUser(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-black/40 flex items-center justify-center min-h-[320px] max-h-[500px] overflow-auto">
              {inspectingDocUser.idVerification?.documentImage ? (
                <img
                  src={inspectingDocUser.idVerification.documentImage}
                  alt="Official User ID Document"
                  className="max-h-[460px] max-w-full object-contain rounded-xl border border-slate-700 shadow-lg"
                />
              ) : (
                <div className="text-slate-500 text-xs italic">No document image file available</div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="text-xs text-slate-400">
                Country: <span className="font-semibold text-white">{inspectingDocUser.idVerification?.issuingCountry}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const u = inspectingDocUser;
                    setInspectingDocUser(null);
                    setRejectModalUser(u);
                  }}
                  className="px-3.5 py-2 bg-rose-900/50 hover:bg-rose-900 text-rose-200 border border-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  Reject Document
                </button>
                <button
                  onClick={() => {
                    const id = inspectingDocUser.id;
                    setInspectingDocUser(null);
                    handleApproveVerification(id);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Approve & Activate Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Verification Modal */}
      {rejectModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <XCircle className="w-5 h-5" />
                <h3 className="text-sm font-bold text-slate-900">Reject Document Submission</h3>
              </div>
              <button
                onClick={() => setRejectModalUser(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Provide a clear reason for rejecting <span className="font-bold text-slate-900">{rejectModalUser.name}</span>'s document. The user will be invited to re-upload.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectionReason || ''}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setRejectModalUser(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectVerification(rejectModalUser.id)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
