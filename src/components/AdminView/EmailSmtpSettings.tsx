import React, { useState, useEffect } from 'react';
import {
  Mail,
  Server,
  Lock,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  FileText,
  Clock,
  ChevronDown,
  Layers,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { SmtpSettings, EmailLog } from '../../types';

export const EmailSmtpSettings: React.FC = () => {
  const [settings, setSettings] = useState<SmtpSettings>({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    username: 'admin@servexa.world',
    password: '••••••••',
    hasPassword: true,
    senderName: 'Servexa World Dispatch & Verification',
    senderEmail: 'notifications@servexa.world',
    replyTo: 'support@servexa.world',
    enabled: true,
    notifyOnServiceRequest: true,
    notifyOnServiceDispatched: true,
    notifyOnHandoverPin: true,
    notifyOnWalletDeposit: true,
    notifyOnPayout: true,
    notifyOnDispute: true,
    verified: true
  });

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'test' | 'logs' | 'templates'>('config');
  const [showPassword, setShowPassword] = useState(false);
  const [customPassword, setCustomPassword] = useState('');
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connTestResult, setConnTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Test Email Modal / Form State
  const [testRecipient, setTestRecipient] = useState('');
  const [testTemplate, setTestTemplate] = useState('customer_service_requested');
  const [testCustomSubject, setTestCustomSubject] = useState('');
  const [testCustomMessage, setTestCustomMessage] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSendResult, setTestSendResult] = useState<any>(null);

  // Email Logs Filter
  const [logFilterStatus, setLogFilterStatus] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/email/smtp-settings');
      const data = await res.json();
      if (data && data.host) {
        setSettings({
          ...data,
          host: data.host || '',
          port: Number(data.port) || 587,
          username: data.username || '',
          senderName: data.senderName || '',
          senderEmail: data.senderEmail || '',
          replyTo: data.replyTo || data.replyToEmail || 'support@servexa.world',
          replyToEmail: data.replyToEmail || data.replyTo || 'support@servexa.world',
          password: data.password || '••••••••'
        });
      }
    } catch (err) {
      console.error('Failed to load SMTP settings', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/email/logs');
      const data = await res.json();
      if (Array.isArray(data)) {
        setEmailLogs(data);
      }
    } catch (err) {
      console.error('Failed to load email logs', err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: any = { ...settings };
      if (customPassword) {
        payload.password = customPassword;
      }

      const res = await fetch('/api/email/smtp-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('SMTP credentials and email notification rules saved successfully.');
        setCustomPassword('');
        await fetchSettings();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to save SMTP settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setConnTestResult(null);
    try {
      const payload: any = { ...settings };
      if (customPassword) {
        payload.password = customPassword;
      }

      const res = await fetch('/api/email/smtp/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setConnTestResult(data);
      if (data.success) {
        showToast('SMTP connection verified successfully!');
      } else {
        showToast(`SMTP Connection Failed: ${data.message}`);
      }
    } catch (err: any) {
      setConnTestResult({ success: false, message: err.message || 'Network error verifying SMTP host.' });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient || !testRecipient.includes('@')) {
      setTestSendResult({ success: false, message: 'Please enter a valid recipient email address.' });
      return;
    }

    setIsSendingTest(true);
    setTestSendResult(null);
    try {
      const res = await fetch('/api/email/smtp/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testRecipient.trim(),
          templateType: testTemplate,
          customSubject: testCustomSubject.trim() || undefined,
          customMessage: testCustomMessage.trim() || undefined
        })
      });

      const data = await res.json();
      setTestSendResult(data);
      if (data.success) {
        showToast(`Test email successfully dispatched to ${testRecipient}!`);
        await fetchLogs();
      } else {
        showToast(`Email delivery warning: ${data.error || 'Check SMTP configuration'}`);
      }
    } catch (err: any) {
      setTestSendResult({ success: false, error: err.message || 'Dispatch failed' });
    } finally {
      setIsSendingTest(false);
    }
  };

  const filteredLogs = emailLogs.filter(log => {
    if (logFilterStatus !== 'all' && log.deliveryStatus !== logFilterStatus) return false;
    if (logSearchQuery) {
      const q = logSearchQuery.toLowerCase();
      return (
        log.recipient.toLowerCase().includes(q) ||
        log.subject.toLowerCase().includes(q) ||
        (log.recipientName && log.recipientName.toLowerCase().includes(q)) ||
        log.emailType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {notification}
        </div>
      )}

      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">SMTP Email Gateway & Automated Notifications</h2>
            <p className="text-xs text-slate-400">
              Configure business domain SMTP, branded store email templates, test delivery and review dispatch logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveSubTab('config')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'config'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              SMTP Settings
            </button>
            <button
              onClick={() => setActiveSubTab('test')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'test'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Test Email
            </button>
            <button
              onClick={() => setActiveSubTab('templates')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'templates'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Templates
            </button>
            <button
              onClick={() => setActiveSubTab('logs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'logs'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Email Logs ({emailLogs.length})
            </button>
          </div>
        </div>
      </div>

      {/* SMTP CONFIGURATION SUBTAB */}
      {activeSubTab === 'config' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Master Notification Toggle Card */}
          <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${settings.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Master Email Notification System</h3>
                <p className="text-xs text-slate-400">
                  Enable or disable all transactional and operational email dispatches across the platform
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={e => setSettings({ ...settings, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Connection Test Result Box */}
          {connTestResult && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                connTestResult.success
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500 text-rose-200'
              }`}
            >
              {connTestResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold text-xs">
                  {connTestResult.success ? 'SMTP Connection Succeeded' : 'SMTP Connection Error'}
                </div>
                <div className="text-[11px] mt-0.5 opacity-90">{connTestResult.message}</div>
              </div>
            </div>
          )}

          {/* Server Credentials */}
          <div className="bg-slate-800/90 p-6 rounded-2xl border border-slate-700 space-y-5">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" />
              Business Domain SMTP Server Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  SMTP Host *
                </label>
                <input
                  type="text"
                  required
                  value={settings.host || ''}
                  onChange={e => setSettings({ ...settings, host: e.target.value })}
                  placeholder="e.g. smtp.gmail.com, mail.yourdomain.com, smtp.sendgrid.net"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  SMTP Port *
                </label>
                <input
                  type="number"
                  required
                  value={settings.port || 587}
                  onChange={e => setSettings({ ...settings, port: parseInt(e.target.value) || 587 })}
                  placeholder="587, 465, or 25"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  SMTP Username / Auth Email *
                </label>
                <input
                  type="text"
                  required
                  value={settings.username || ''}
                  onChange={e => setSettings({ ...settings, username: e.target.value })}
                  placeholder="e.g. admin@servexa.world, dispatch@yourbrand.com"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  SMTP Password / App Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={customPassword || settings.password || ''}
                    onChange={e => setCustomPassword(e.target.value)}
                    placeholder="Enter new password to change"
                    className="w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sender Name (Header)
                </label>
                <input
                  type="text"
                  value={settings.senderName || ''}
                  onChange={e => setSettings({ ...settings, senderName: e.target.value })}
                  placeholder="e.g. Servexa World Dispatch"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sender Email Address
                </label>
                <input
                  type="email"
                  value={settings.senderEmail || ''}
                  onChange={e => setSettings({ ...settings, senderEmail: e.target.value })}
                  placeholder="e.g. notifications@servexa.world"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reply-To Email
                </label>
                <input
                  type="email"
                  value={settings.replyTo || settings.replyToEmail || ''}
                  onChange={e => setSettings({ ...settings, replyTo: e.target.value, replyToEmail: e.target.value })}
                  placeholder="e.g. support@servexa.world"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.secure}
                  onChange={e => setSettings({ ...settings, secure: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700 focus:ring-purple-500"
                />
                Use SSL/TLS direct encryption (typically enabled for port 465; uncheck for STARTTLS on port 587)
              </label>
            </div>
          </div>

          {/* Granular Notification Rules */}
          <div className="bg-slate-800/90 p-6 rounded-2xl border border-slate-700 space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              Automated Notification Event Triggers
            </h3>
            <p className="text-xs text-slate-400">
              Control which system events trigger real-time SMTP emails to customers and service providers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-700/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifyOnServiceRequest}
                  onChange={e => setSettings({ ...settings, notifyOnServiceRequest: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-800 border-slate-700"
                />
                <div>
                  <div className="text-xs font-bold text-white">Customer Service Requests</div>
                  <div className="text-[11px] text-slate-400">Sent to provider when a new job is requested</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-700/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifyOnServiceDispatched}
                  onChange={e => setSettings({ ...settings, notifyOnServiceDispatched: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-800 border-slate-700"
                />
                <div>
                  <div className="text-xs font-bold text-white">Provider Dispatched / En Route</div>
                  <div className="text-[11px] text-slate-400">Sent to customer when specialist is travelling</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-700/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifyOnHandoverPin}
                  onChange={e => setSettings({ ...settings, notifyOnHandoverPin: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-800 border-slate-700"
                />
                <div>
                  <div className="text-xs font-bold text-white">Handover PIN & Delivery Notice</div>
                  <div className="text-[11px] text-slate-400">Sent to customer with 4-digit verified delivery code</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-700/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifyOnWalletDeposit}
                  onChange={e => setSettings({ ...settings, notifyOnWalletDeposit: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-800 border-slate-700"
                />
                <div>
                  <div className="text-xs font-bold text-white">Wallet Deposit Receipts</div>
                  <div className="text-[11px] text-slate-400">Credit confirmation (balance amount is hidden for privacy)</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-700/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifyOnPayout}
                  onChange={e => setSettings({ ...settings, notifyOnPayout: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-800 border-slate-700"
                />
                <div>
                  <div className="text-xs font-bold text-white">Provider Payout / Withdrawal Notices</div>
                  <div className="text-[11px] text-slate-400">Sent to service provider when bank transfer is scheduled</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-700/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifyOnDispute}
                  onChange={e => setSettings({ ...settings, notifyOnDispute: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-800 border-slate-700"
                />
                <div>
                  <div className="text-xs font-bold text-white">Arbitration Disputes & Reviews</div>
                  <div className="text-[11px] text-slate-400">Sent to both parties upon dispute filing or rating</div>
                </div>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTestingConn}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin' : ''}`} />
              {isTestingConn ? 'Verifying Host...' : 'Test SMTP Connection'}
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving Configurations...' : 'Save SMTP Settings'}
            </button>
          </div>
        </form>
      )}

      {/* TEST EMAIL SUBTAB */}
      {activeSubTab === 'test' && (
        <div className="bg-slate-800/90 p-6 rounded-2xl border border-slate-700 space-y-5">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-extrabold text-white">Send Real SMTP Test Email</h3>
          </div>
          <p className="text-xs text-slate-400">
            Dispatch a live test email through your configured SMTP server to verify deliverability, store branding,
            and template rendering.
          </p>

          <form onSubmit={handleSendTestEmail} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Recipient Email Address *
              </label>
              <input
                type="email"
                required
                value={testRecipient || ''}
                onChange={e => setTestRecipient(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Email Template To Preview & Test
              </label>
              <select
                value={testTemplate || 'customer_service_requested'}
                onChange={e => setTestTemplate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
              >
                <option value="customer_service_requested">Customer Service Request Confirmation</option>
                <option value="provider_dispatched">Specialist Dispatched & En Route</option>
                <option value="handover_pin">Handover PIN Verification Notice</option>
                <option value="wallet_deposit_receipt">Wallet Deposit Receipt (Balance Protected)</option>
                <option value="provider_payout">Provider Payout Disbursed</option>
                <option value="order_receipt">Store Product Order Receipt</option>
                <option value="dispute_filed">Arbitration Dispute Opened</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Custom Subject (optional override)
              </label>
              <input
                type="text"
                value={testCustomSubject || ''}
                onChange={e => setTestCustomSubject(e.target.value)}
                placeholder="Leave blank to use default template subject"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Custom Test Note (optional)
              </label>
              <textarea
                rows={2}
                value={testCustomMessage || ''}
                onChange={e => setTestCustomMessage(e.target.value)}
                placeholder="Custom test message injected into email body..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSendingTest}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isSendingTest ? 'animate-spin' : ''}`} />
              {isSendingTest ? 'Sending via SMTP...' : 'Dispatch Live Test Email'}
            </button>
          </form>

          {testSendResult && (
            <div
              className={`p-4 rounded-xl border mt-4 text-xs ${
                testSendResult.success
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500 text-rose-200'
              }`}
            >
              <div className="font-bold">
                {testSendResult.success ? 'Dispatch Success!' : 'Dispatch Failed'}
              </div>
              <div className="mt-1 font-mono text-[11px]">
                {testSendResult.messageId ? `Message ID: ${testSendResult.messageId}` : testSendResult.error}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TEMPLATES PREVIEW SUBTAB */}
      {activeSubTab === 'templates' && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-950/40 border border-purple-500/30 rounded-2xl">
            <h3 className="text-xs font-bold text-purple-200">Store-Specific HTML Email Templates</h3>
            <p className="text-[11px] text-purple-300/80 mt-0.5">
              All emails feature responsive styling, store-specific branding, and privacy enforcement (no private wallet balances exposed).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: 'customer_service_requested',
                title: 'Service Request Confirmation',
                subject: 'Service Request Confirmed: {{serviceName}}',
                preview: 'Hi {{customerName}}, your booking with {{providerName}} has been scheduled. Ref #{{bookingId}}.'
              },
              {
                id: 'provider_dispatched',
                title: 'Specialist Dispatched & En Route',
                subject: 'Specialist On Route: {{providerName}} is arriving soon',
                preview: 'Your service specialist {{providerName}} has departed for your location. Live GPS tracking is active.'
              },
              {
                id: 'handover_pin',
                title: 'Handover Delivery PIN',
                subject: 'Your Handover Delivery PIN: {{deliveryPin}}',
                preview: 'Share this secure 4-digit PIN with your provider only upon satisfactory completion of service.'
              },
              {
                id: 'wallet_deposit_receipt',
                title: 'Wallet Deposit Confirmation',
                subject: 'Deposit Succeeded: ${{amount}} Added to Wallet',
                preview: 'Your wallet has been credited ${{amount}}. For your privacy and security, full balance totals are never displayed in emails.'
              },
              {
                id: 'provider_payout',
                title: 'Provider Payout Notice',
                subject: 'Payout Scheduled: ${{amount}} to your bank account',
                preview: 'Your withdrawal of ${{amount}} is in transit to your registered Stripe/Connect account.'
              },
              {
                id: 'order_receipt',
                title: 'Store Product Order Receipt',
                subject: 'Order Receipt: {{productName}} from {{storeName}}',
                preview: 'Thank you for your purchase from {{storeName}}. Your receipt and delivery details are enclosed.'
              }
            ].map(tpl => (
              <div key={tpl.id} className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{tpl.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 text-purple-300 rounded-md">
                    {tpl.id}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Subject line:</span>
                  {tpl.subject}
                </div>
                <p className="text-[11px] text-slate-400">{tpl.preview}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EMAIL LOGS SUBTAB */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <input
              type="text"
              placeholder="Search logs by recipient, subject, or email type..."
              value={logSearchQuery || ''}
              onChange={e => setLogSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
            />
            <select
              value={logFilterStatus || 'all'}
              onChange={e => setLogFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-hidden"
            >
              <option value="all">All Delivery Statuses</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
            <button
              onClick={fetchLogs}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl cursor-pointer"
              title="Refresh logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-800/90 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-700 text-slate-400 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No email dispatch records found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{log.recipientName || log.recipient}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.recipient}</div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-bold text-slate-200 line-clamp-1">{log.subject}</div>
                          {log.storeName && (
                            <div className="text-[10px] text-purple-300 font-medium mt-0.5">
                              Store: {log.storeName}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700 text-slate-300">
                            {log.emailType.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              log.deliveryStatus === 'delivered'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : log.deliveryStatus === 'failed'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {log.deliveryStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 bg-slate-700 hover:bg-purple-600 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="View email dispatch details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL LOG DETAIL MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Email Dispatch Log</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Recipient:</span>
                <span className="text-white font-semibold">{selectedLog.recipient}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Subject:</span>
                <span className="text-white font-bold">{selectedLog.subject}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Delivery Status:</span>
                <span className="font-extrabold uppercase text-emerald-400">{selectedLog.deliveryStatus}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-300 font-mono">{selectedLog.timestamp}</span>
              </div>
              {selectedLog.messageId && (
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Message ID:</span>
                  <span className="text-purple-300 font-mono">{selectedLog.messageId}</span>
                </div>
              )}
              {selectedLog.error && (
                <div className="p-3 bg-rose-950/40 border border-rose-500 rounded-xl text-rose-200">
                  <span className="font-bold block">Delivery Error:</span>
                  {selectedLog.error}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-800/80 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
