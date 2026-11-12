import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  Tag,
  Clock,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  Layers,
  DollarSign,
  Search,
  RefreshCw
} from 'lucide-react';
import { Category, CategoryRequest } from '../../types';

interface CategoryManagementProps {
  onCategoryChange?: () => void;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({ onCategoryChange }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryRequests, setCategoryRequests] = useState<CategoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'requests'>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Edit / Add Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formIcon, setFormIcon] = useState('Sparkles');
  const [formDesc, setFormDesc] = useState('');
  const [formBasePrice, setFormBasePrice] = useState('65');
  const [formImage, setFormImage] = useState('');
  const [formPricingModels, setFormPricingModels] = useState<string[]>(['fixed', 'hourly']);
  const [formSubcategories, setFormSubcategories] = useState<string>('Standard Inspection, Express Repair');
  const [formEnabled, setFormEnabled] = useState(true);

  // Review Request Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CategoryRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewIcon, setReviewIcon] = useState('Sparkles');
  const [reviewBasePrice, setReviewBasePrice] = useState('75');
  const [reviewImage, setReviewImage] = useState('https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80');

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories?includeDisabled=true');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchCategoryRequests = async () => {
    try {
      const res = await fetch('/api/category-requests');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategoryRequests(data);
      }
    } catch (err) {
      console.error('Failed to load category requests', err);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchCategories(), fetchCategoryRequests()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormIcon('Sparkles');
    setFormDesc('');
    setFormBasePrice('65');
    setFormImage('https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80');
    setFormPricingModels(['fixed', 'hourly']);
    setFormSubcategories('Standard Service, Comprehensive Service');
    setFormEnabled(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug || cat.id.replace(/^cat-/, ''));
    setFormIcon(cat.icon || 'Sparkles');
    setFormDesc(cat.description || '');
    setFormBasePrice(cat.basePrice?.toString() || '65');
    setFormImage(cat.characterImage || '');
    setFormPricingModels(cat.pricingModels || ['fixed', 'hourly']);
    setFormSubcategories(
      cat.subcategories && cat.subcategories.length > 0
        ? cat.subcategories.map(s => s.name).join(', ')
        : 'Standard Service'
    );
    setFormEnabled(cat.enabled !== false);
    setModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const subcats = formSubcategories
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map((name, idx) => ({
        id: `sub-${Date.now()}-${idx}`,
        name
      }));

    const payload = {
      name: formName.trim(),
      slug: formSlug.trim() || formName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      icon: formIcon || 'Sparkles',
      description: formDesc.trim(),
      basePrice: parseFloat(formBasePrice) || 50,
      characterImage: formImage.trim() || undefined,
      pricingModels: formPricingModels,
      subcategories: subcats,
      enabled: formEnabled
    };

    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast(`Category "${formName}" updated successfully.`);
        }
      } else {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast(`New category "${formName}" created and active.`);
        }
      }

      setModalOpen(false);
      await fetchCategories();
      onCategoryChange?.();
    } catch (err) {
      console.error(err);
      showToast('Error saving category.');
    }
  };

  const handleToggleEnable = async (cat: Category) => {
    const newStatus = cat.enabled === false ? true : false;
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newStatus })
      });
      if (res.ok) {
        setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, enabled: newStatus } : c));
        showToast(`Category "${cat.name}" is now ${newStatus ? 'ENABLED' : 'DISABLED'}.`);
        onCategoryChange?.();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`Are you sure you want to permanently delete category "${cat.name}"? Existing bookings will be preserved.`)) return;

    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.id !== cat.id));
        showToast(`Category "${cat.name}" deleted.`);
        onCategoryChange?.();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;

    const newArr = [...categories];
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;

    setCategories(newArr);

    try {
      await fetch('/api/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: newArr.map(c => c.id) })
      });
      showToast('Marketplace category display order updated.');
      onCategoryChange?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenReview = (req: CategoryRequest) => {
    setSelectedRequest(req);
    setReviewAction('approve');
    setReviewNotes('');
    setReviewIcon('Sparkles');
    setReviewBasePrice(req.suggestedPricing === 'hourly' ? '85' : '75');
    setReviewImage('https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      const res = await fetch(`/api/category-requests/${selectedRequest.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewAction === 'approve' ? 'approved' : 'rejected',
          adminNotes: reviewNotes.trim() || undefined,
          icon: reviewIcon,
          basePrice: parseFloat(reviewBasePrice) || 75,
          characterImage: reviewImage
        })
      });

      if (res.ok) {
        showToast(
          reviewAction === 'approve'
            ? `Category "${selectedRequest.categoryName}" approved & added to live marketplace!`
            : `Category request "${selectedRequest.categoryName}" rejected.`
        );
        setReviewModalOpen(false);
        await refreshAll();
        onCategoryChange?.();
      }
    } catch (err) {
      console.error(err);
      showToast('Error reviewing category request.');
    }
  };

  const filteredCategories = categories.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q));
  });

  const pendingRequestsCount = categoryRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {notification}
        </div>
      )}

      {/* Top Header & Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Dynamic Service Category Management</h2>
              <p className="text-xs text-slate-400">
                Manage all marketplace categories, configure pricing models, and review provider category requests
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveSubTab('categories')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'categories'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              Active Categories ({categories.length})
            </button>
            <button
              onClick={() => setActiveSubTab('requests')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'requests'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Provider Requests
              {pendingRequestsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-extrabold rounded-full text-[10px]">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={refreshAll}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {activeSubTab === 'categories' && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          )}
        </div>
      </div>

      {/* ACTIVE CATEGORIES TAB */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search categories by name, slug or description..."
                value={searchQuery || ''}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Showing {filteredCategories.length} categories
            </div>
          </div>

          {/* Categories Table / Cards */}
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-700 text-slate-400 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Order</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Base Price</th>
                    <th className="py-3 px-4">Pricing Models</th>
                    <th className="py-3 px-4">Subcategories</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No service categories found. Click "Add Category" above to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat, idx) => (
                      <tr key={cat.id} className="hover:bg-slate-700/30 transition-colors">
                        {/* Order & Reordering buttons */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <button
                              onClick={() => handleMoveOrder(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <span className="text-[11px] font-mono text-slate-400">{cat.order || idx + 1}</span>
                            <button
                              onClick={() => handleMoveOrder(idx, 'down')}
                              disabled={idx === categories.length - 1}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Category Name & Avatar */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {cat.characterImage ? (
                              <img
                                src={cat.characterImage}
                                alt={cat.name}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-600 shadow-sm"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold">
                                {cat.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-extrabold text-white text-sm flex items-center gap-2">
                                {cat.name}
                                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-900 text-slate-400 rounded-md">
                                  {cat.id}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {cat.description || 'Specialist category'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Base Price */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            ${(cat.basePrice || 0).toFixed(2)}
                          </span>
                        </td>

                        {/* Pricing Models */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {(cat.pricingModels || ['fixed']).map(m => (
                              <span
                                key={m}
                                className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700/80 text-slate-300 border border-slate-600"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Subcategories */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="text-[11px] text-slate-300 line-clamp-2">
                            {cat.subcategories && cat.subcategories.length > 0
                              ? cat.subcategories.map(s => s.name).join(', ')
                              : 'Standard'}
                          </div>
                        </td>

                        {/* Enabled / Disabled Status */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleEnable(cat)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              cat.enabled !== false
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                            }`}
                          >
                            {cat.enabled !== false ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-rose-400" />
                                Disabled
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(cat)}
                              className="p-1.5 bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Edit Category Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1.5 bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* PROVIDER CATEGORY REQUESTS TAB */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-indigo-200">Provider New Category Requests</h4>
              <p className="text-[11px] text-indigo-300/80 leading-relaxed mt-0.5">
                When service providers register or update their services and select "Other / Request New Category",
                their request appears here. Approving a request immediately creates and enables the new category across
                the entire marketplace, allowing customers to book services in that domain right away.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/90 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-700 text-slate-400 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Requested Category</th>
                    <th className="py-3 px-4">Provider Details</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Pricing Model</th>
                    <th className="py-3 px-4">Date Submitted</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {categoryRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No provider category requests have been submitted yet.
                      </td>
                    </tr>
                  ) : (
                    categoryRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white text-sm flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-indigo-400" />
                            {req.categoryName}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{req.id}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{req.providerName}</div>
                          <div className="text-[11px] text-slate-400">{req.providerEmail}</div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="text-[11px] text-slate-300 leading-snug">{req.description}</div>
                          {req.adminNotes && (
                            <div className="text-[10px] text-amber-300 mt-1 font-mono">
                              Note: {req.adminNotes}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700 text-slate-200">
                            {req.suggestedPricing || 'fixed'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {new Date(req.createdAt).toLocaleDateString()} {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              req.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : req.status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {req.status === 'pending' ? (
                            <button
                              onClick={() => handleOpenReview(req)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs shadow-md transition-colors cursor-pointer"
                            >
                              Review & Action
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500">Resolved</span>
                          )}
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

      {/* CREATE / EDIT CATEGORY MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add New Marketplace Category'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName || ''}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Electrician, Roofer, Locksmith"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Slug / URL Identifier
                  </label>
                  <input
                    type="text"
                    value={formSlug || ''}
                    onChange={e => setFormSlug(e.target.value)}
                    placeholder="e.g. electrician-power"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Base Benchmark Price ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={formBasePrice || ''}
                      onChange={e => setFormBasePrice(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Lucide Icon Name
                  </label>
                  <input
                    type="text"
                    value={formIcon || ''}
                    onChange={e => setFormIcon(e.target.value)}
                    placeholder="e.g. Zap, Wrench, Shield, Truck, Stethoscope"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDesc || ''}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Describe the trade specialists and responsibilities covered under this category..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Character / Hero Image URL
                </label>
                <input
                  type="url"
                  value={formImage || ''}
                  onChange={e => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subcategories (comma separated)
                </label>
                <input
                  type="text"
                  value={formSubcategories || ''}
                  onChange={e => setFormSubcategories(e.target.value)}
                  placeholder="e.g. Diagnostic Inspection, Emergency Repair, Installation"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={formEnabled}
                    onChange={e => setFormEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                  />
                  Category is Active & Visible in Marketplace
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW PROVIDER CATEGORY REQUEST MODAL */}
      {reviewModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Review Requested Category: {selectedRequest.categoryName}
                </h3>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-800 rounded-xl border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Requesting Provider</span>
                  <span className="text-xs font-bold text-white">{selectedRequest.providerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Provider Email</span>
                  <span className="text-xs text-slate-300 font-mono">{selectedRequest.providerEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Suggested Model</span>
                  <span className="text-xs text-indigo-400 font-bold uppercase">{selectedRequest.suggestedPricing}</span>
                </div>
                <div className="pt-1 text-xs text-slate-300">
                  <span className="font-semibold text-slate-400 block mb-0.5">Description provided:</span>
                  <p className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-slate-200">
                    {selectedRequest.description}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewAction('approve')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                      reviewAction === 'approve'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Activate
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('reject')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                      reviewAction === 'reject'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Request
                  </button>
                </div>
              </div>

              {reviewAction === 'approve' && (
                <div className="space-y-3 p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl animate-in fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Base Price ($)
                      </label>
                      <input
                        type="number"
                        value={reviewBasePrice || ''}
                        onChange={e => setReviewBasePrice(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Icon Name
                      </label>
                      <input
                        type="text"
                        value={reviewIcon || ''}
                        onChange={e => setReviewIcon(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Notes / Reason {reviewAction === 'reject' ? '*' : '(optional)'}
                </label>
                <textarea
                  rows={2}
                  required={reviewAction === 'reject'}
                  value={reviewNotes || ''}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder={reviewAction === 'approve' ? 'Approved for global marketplace rollout...' : 'Reason for rejection...'}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer ${
                    reviewAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
