import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  MessageSquare,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { ChatMessage, ChatInvoice } from '../../types';

interface SavedOrderHistoryItem {
  orderId: string;
  categoryName: string;
  categoryId: string;
  provider: {
    userId: string;
    businessName: string;
    avatar?: string;
    rating?: number;
  };
  messages: ChatMessage[];
  invoices?: ChatInvoice[];
  status: string;
  createdAt: string;
}

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrder?: any;
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  isOpen,
  onClose,
  selectedOrder
}) => {
  const { currentUser } = useAuth();
  const [historyOrders, setHistoryOrders] = useState<SavedOrderHistoryItem[]>([]);
  const [activeOrder, setActiveOrder] = useState<SavedOrderHistoryItem | null>(null);

  useEffect(() => {
    try {
      const userKey = currentUser?.id ? `servexa_orders_chat_history_${currentUser.id}` : 'servexa_orders_chat_history';
      const stored = localStorage.getItem(userKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistoryOrders(parsed);
        if (selectedOrder) {
          const match = parsed.find(
            (o: SavedOrderHistoryItem) =>
              o.orderId === selectedOrder.id || o.orderId === selectedOrder.orderId
          );
          if (match) {
            setActiveOrder(match);
          } else {
            setActiveOrder(parsed[0] || null);
          }
        } else if (parsed.length > 0) {
          setActiveOrder(parsed[0]);
        }
      } else {
        setHistoryOrders([]);
        setActiveOrder(null);
      }
    } catch (e) {
      console.warn('Failed to load chat history:', e);
    }
  }, [isOpen, selectedOrder, currentUser?.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[650px] max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Service Order Chat History
              </h3>
              <p className="text-[11px] text-slate-500">
                Permanent records of conversations, problem media, and invoices
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Left list of past orders + Right messages view */}
        <div className="flex-1 flex overflow-hidden">
          {/* Order Sessions List */}
          <div className="w-1/3 border-r border-slate-100 bg-slate-50/60 p-3 overflow-y-auto space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
              Order Sessions ({historyOrders.length})
            </span>

            {historyOrders.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No past order chat sessions saved yet.
              </div>
            ) : (
              historyOrders.map((ord) => {
                const isSelected = activeOrder?.orderId === ord.orderId;
                return (
                  <button
                    key={ord.orderId}
                    type="button"
                    onClick={() => setActiveOrder(ord)}
                    className={`w-full text-left p-2.5 rounded-2xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-white border-indigo-200 shadow-xs'
                        : 'border-transparent hover:bg-white/60 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {ord.categoryName}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-emerald-700 capitalize">
                        {ord.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 truncate">
                      {ord.provider?.businessName || 'Specialist'}
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(ord.createdAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Active Order Chat View */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {activeOrder ? (
              <>
                {/* Active Session Top Bar */}
                <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
                  <div className="flex items-center gap-2">
                    <img
                      src={activeOrder.provider?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {activeOrder.provider?.businessName}
                      </div>
                      <span className="text-[10px] text-slate-400">Order #{activeOrder.orderId}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Archived Session
                  </span>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
                  {activeOrder.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1 text-xs"
                    >
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>{msg.senderName}</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {msg.mediaType === 'image' && msg.mediaUrl && (
                        <div className="rounded-xl overflow-hidden max-w-xs mb-1">
                          <img src={msg.mediaUrl} alt="" className="w-full max-h-40 object-cover" />
                        </div>
                      )}

                      {msg.mediaType === 'video' && msg.mediaUrl && (
                        <div className="rounded-xl overflow-hidden max-w-xs mb-1 bg-black">
                          <video src={msg.mediaUrl} controls className="w-full max-h-40" />
                        </div>
                      )}

                      <p className="text-slate-800">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400 text-xs">
                <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                <span>Select an order from the left to inspect full chat history.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
