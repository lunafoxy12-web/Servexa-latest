import React, { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  User,
  Tag,
  Store,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  FileText,
  X,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Truck,
  MessageSquare,
  ShieldCheck,
  Zap,
  ShoppingBag
} from 'lucide-react';
import { SystemActivity, ActivityType } from '../../types';

export const ActivityTransactionLog: React.FC = () => {
  const [activities, setActivities] = useState<SystemActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest_amount'>('newest');

  // Detail Modal State
  const [selectedActivity, setSelectedActivity] = useState<SystemActivity | null>(null);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('query', searchQuery);
      if (activityTypeFilter !== 'all') params.set('activityType', activityTypeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter !== 'all') params.set('categoryId', categoryFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/admin/activities?${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setActivities(data);
      }
    } catch (err) {
      console.error('Failed to fetch activity logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [activityTypeFilter, statusFilter, categoryFilter, startDate, endDate]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActivities();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sorting
  const sortedActivities = [...activities].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    }
    if (sortBy === 'highest_amount') {
      return (b.amount || 0) - (a.amount || 0);
    }
    return 0;
  });

  // Export to CSV
  const handleExportCSV = () => {
    if (sortedActivities.length === 0) return;
    const headers = [
      'Activity ID',
      'Timestamp',
      'Activity Type',
      'Title',
      'Description',
      'Amount',
      'Currency',
      'Payment Method',
      'Status',
      'User Name',
      'Customer Name',
      'Provider Name',
      'Category',
      'Store',
      'Reference ID'
    ];

    const rows = sortedActivities.map(a => [
      a.id,
      a.timestamp,
      a.activityType,
      `"${(a.title || '').replace(/"/g, '""')}"`,
      `"${(a.description || '').replace(/"/g, '""')}"`,
      a.amount || 0,
      a.currency || 'USD',
      a.paymentMethod || '',
      a.status,
      `"${(a.userName || '').replace(/"/g, '""')}"`,
      `"${(a.customerName || '').replace(/"/g, '""')}"`,
      `"${(a.providerName || '').replace(/"/g, '""')}"`,
      `"${(a.categoryName || a.categoryId || '').replace(/"/g, '""')}"`,
      `"${(a.storeName || '').replace(/"/g, '""')}"`,
      a.referenceId || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `servexa_activity_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sortedActivities, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `servexa_activity_log_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'service_request':
        return <Clock className="w-3.5 h-3.5 text-blue-400" />;
      case 'service_purchase':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'product_purchase':
      case 'order_created':
        return <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />;
      case 'wallet_deposit':
        return <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />;
      case 'wallet_withdrawal':
      case 'provider_payout':
        return <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />;
      case 'invoice_payment':
        return <CreditCard className="w-3.5 h-3.5 text-cyan-400" />;
      case 'refund':
        return <ArrowDownLeft className="w-3.5 h-3.5 text-rose-400" />;
      case 'verification_request':
      case 'verification_approval':
        return <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />;
      case 'service_status_change':
      case 'tracking_update':
        return <Truck className="w-3.5 h-3.5 text-amber-400" />;
      case 'dispute':
      case 'dispute_resolution':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case 'review':
        return <MessageSquare className="w-3.5 h-3.5 text-yellow-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (['succeeded', 'completed', 'approved', 'active', 'confirmed', 'resolved'].includes(s)) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          {status}
        </span>
      );
    }
    if (['pending', 'in_progress', 'scheduled', 'under_review'].includes(s)) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {status}
        </span>
      );
    }
    if (['failed', 'cancelled', 'rejected', 'deleted', 'blocked'].includes(s)) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          {status}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-700 text-slate-300 border border-slate-600">
        {status}
      </span>
    );
  };

  // Quick summary statistics
  const totalVolume = activities.reduce((sum, a) => sum + (a.amount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">
              Real-Time Platform Activity & Transaction Ledger
            </h2>
            <p className="text-xs text-slate-400">
              Complete, live audit of customer service orders, wallet movements, invoices, payouts and status changes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchActivities}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh logs from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export filtered records to JSON"
          >
            <FileText className="w-3.5 h-3.5" />
            JSON
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-800/70 border border-slate-700 rounded-xl">
          <span className="text-[11px] text-slate-400 font-medium">Logged Activities</span>
          <div className="text-xl font-extrabold text-white mt-0.5 font-mono">{activities.length}</div>
        </div>
        <div className="p-4 bg-slate-800/70 border border-slate-700 rounded-xl">
          <span className="text-[11px] text-slate-400 font-medium">Cumulative Gross Volume</span>
          <div className="text-xl font-extrabold text-emerald-400 mt-0.5 font-mono">
            ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="p-4 bg-slate-800/70 border border-slate-700 rounded-xl">
          <span className="text-[11px] text-slate-400 font-medium">Service Requests & Orders</span>
          <div className="text-xl font-extrabold text-cyan-400 mt-0.5 font-mono">
            {activities.filter(a => a.activityType === 'service_request' || a.activityType === 'product_purchase' || a.activityType === 'order_created').length}
          </div>
        </div>
        <div className="p-4 bg-slate-800/70 border border-slate-700 rounded-xl">
          <span className="text-[11px] text-slate-400 font-medium">Disputes & Verifications</span>
          <div className="text-xl font-extrabold text-rose-400 mt-0.5 font-mono">
            {activities.filter(a => a.activityType.includes('dispute') || a.activityType.includes('verification')).length}
          </div>
        </div>
      </div>

      {/* Search & Comprehensive Filters Bar */}
      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Main Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by ID, customer name, provider, reference, order, or description..."
              value={searchQuery || ''}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Activity Type Filter */}
          <div className="w-full lg:w-48">
            <select
              value={activityTypeFilter || 'all'}
              onChange={e => setActivityTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-hidden"
            >
              <option value="all">All Activity Types</option>
              <option value="service_request">Customer Service Requests</option>
              <option value="service_purchase">Service Purchases / Completed</option>
              <option value="product_purchase">Product Purchases</option>
              <option value="wallet_deposit">Wallet Deposits</option>
              <option value="wallet_withdrawal">Wallet Withdrawals</option>
              <option value="invoice_payment">Invoice Payments</option>
              <option value="service_status_change">Status Changes</option>
              <option value="dispute">Disputes</option>
              <option value="review">Reviews</option>
              <option value="category_management">Category Management</option>
              <option value="category_request">Category Requests</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-36">
            <select
              value={statusFilter || 'all'}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="succeeded">Succeeded / Completed</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="failed">Failed / Cancelled</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="w-full lg:w-40">
            <select
              value={sortBy || 'newest'}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-hidden"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="highest_amount">Sort: Highest Amount</option>
            </select>
          </div>
        </div>

        {/* Second Filter Row: Date Range */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-700/60 text-xs text-slate-400">
          <span className="flex items-center gap-1 font-semibold text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            Date Range:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate || ''}
              onChange={e => setStartDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-hidden"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate || ''}
              onChange={e => setEndDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-hidden"
            />
            {(startDate || endDate || activityTypeFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setActivityTypeFilter('all');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setSearchQuery('');
                }}
                className="text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer ml-2"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-700 text-slate-400 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Title & Context</th>
                <th className="py-3 px-4">Customer / User</th>
                <th className="py-3 px-4">Service Provider</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {sortedActivities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No matching activity records found.
                  </td>
                </tr>
              ) : (
                sortedActivities.map(act => (
                  <tr key={act.id} className="hover:bg-slate-700/30 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono text-slate-200 text-[11px]">
                        {new Date(act.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>

                    {/* Activity Type Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {getActivityIcon(act.activityType)}
                        <span className="font-bold text-slate-300 text-[11px] capitalize">
                          {act.activityType.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>

                    {/* Title & Description */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-extrabold text-white line-clamp-1">{act.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{act.description}</div>
                      {(act.categoryName || act.storeName || act.referenceId) && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {act.categoryName && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 text-indigo-300 rounded-md font-medium">
                              {act.categoryName}
                            </span>
                          )}
                          {act.storeName && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 text-purple-300 rounded-md font-medium">
                              {act.storeName}
                            </span>
                          )}
                          {act.referenceId && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              Ref: {act.referenceId}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      {act.customerName || act.userName ? (
                        <div>
                          <div className="font-semibold text-slate-200">{act.customerName || act.userName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {act.customerId || act.userId || ''}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">—</span>
                      )}
                    </td>

                    {/* Provider */}
                    <td className="py-3 px-4">
                      {act.providerName ? (
                        <div>
                          <div className="font-semibold text-slate-200">{act.providerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{act.providerId || ''}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">—</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {act.amount !== undefined ? (
                        <div>
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            ${act.amount.toFixed(2)}
                          </span>
                          {act.paymentMethod && (
                            <div className="text-[10px] text-slate-400 uppercase font-medium">
                              {act.paymentMethod}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(act.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedActivity(act)}
                        className="p-1.5 bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="View Full Activity Audit"
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

      {/* DETAIL AUDIT MODAL */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
                  {getActivityIcon(selectedActivity.activityType)}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Audit Record: {selectedActivity.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ID: {selectedActivity.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Activity Type</span>
                  <span className="text-xs font-bold text-white capitalize">
                    {selectedActivity.activityType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                  <div className="mt-0.5">{getStatusBadge(selectedActivity.status)}</div>
                </div>
                <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Amount</span>
                  <span className="text-xs font-bold font-mono text-emerald-400">
                    {selectedActivity.amount !== undefined ? `$${selectedActivity.amount.toFixed(2)} ${selectedActivity.currency || 'USD'}` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/80 space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-slate-700/60 pb-2">
                  <span className="text-slate-400 font-medium">Description:</span>
                  <span className="text-slate-200 text-right font-medium max-w-sm">{selectedActivity.description}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700/60 pb-2">
                  <span className="text-slate-400 font-medium">Exact Timestamp:</span>
                  <span className="text-slate-200 font-mono">{new Date(selectedActivity.timestamp).toISOString()}</span>
                </div>
                {selectedActivity.customerId && (
                  <div className="flex justify-between border-b border-slate-700/60 pb-2">
                    <span className="text-slate-400 font-medium">Customer:</span>
                    <span className="text-slate-200">{selectedActivity.customerName} ({selectedActivity.customerId})</span>
                  </div>
                )}
                {selectedActivity.providerId && (
                  <div className="flex justify-between border-b border-slate-700/60 pb-2">
                    <span className="text-slate-400 font-medium">Provider:</span>
                    <span className="text-slate-200">{selectedActivity.providerName} ({selectedActivity.providerId})</span>
                  </div>
                )}
                {selectedActivity.categoryName && (
                  <div className="flex justify-between border-b border-slate-700/60 pb-2">
                    <span className="text-slate-400 font-medium">Category:</span>
                    <span className="text-indigo-400 font-semibold">{selectedActivity.categoryName} ({selectedActivity.categoryId})</span>
                  </div>
                )}
                {selectedActivity.storeName && (
                  <div className="flex justify-between border-b border-slate-700/60 pb-2">
                    <span className="text-slate-400 font-medium">Store:</span>
                    <span className="text-purple-400 font-semibold">{selectedActivity.storeName}</span>
                  </div>
                )}
                {selectedActivity.paymentMethod && (
                  <div className="flex justify-between border-b border-slate-700/60 pb-2">
                    <span className="text-slate-400 font-medium">Payment Method:</span>
                    <span className="text-slate-200 uppercase font-mono">{selectedActivity.paymentMethod}</span>
                  </div>
                )}
                {selectedActivity.referenceId && (
                  <div className="flex justify-between border-b border-slate-700/60 pb-2">
                    <span className="text-slate-400 font-medium">Reference / Order ID:</span>
                    <span className="text-amber-400 font-mono">{selectedActivity.referenceId}</span>
                  </div>
                )}
              </div>

              {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-300 block mb-1">Additional Metadata Payload:</span>
                  <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono overflow-x-auto">
                    {JSON.stringify(selectedActivity.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-800/80 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedActivity(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
