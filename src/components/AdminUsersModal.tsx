import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Search, 
  Wallet, 
  Edit3, 
  Check, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShieldCheck, 
  AlertCircle,
  Coins,
  Copy,
  Plus,
  Minus,
  Sparkles,
  Phone,
  Mail,
  Gamepad2,
  RefreshCw
} from 'lucide-react';
import { UserProfile, WalletTransaction } from '../types/tournament';
import { 
  subscribeToTransactions, 
  approveTransaction, 
  rejectTransaction, 
  adminAdjustUserBalance 
} from '../services/walletService';
import { handleAvatarError, DEFAULT_PLAYER_AVATAR, DEFAULT_ADMIN_AVATAR } from '../utils/imageUtils';
import { isUserAdmin } from '../services/mockData';

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onUpdateUser: (userId: string, updates: Partial<UserProfile>) => void;
}

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onUpdateUser
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'history'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  
  // Balance Editor Modal State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newBalanceInput, setNewBalanceInput] = useState<string>('');
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [isSavingBalance, setIsSavingBalance] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Subscribe to real-time transactions
  useEffect(() => {
    if (isOpen) {
      const unsub = subscribeToTransactions((txs) => {
        setTransactions(txs);
      });
      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const pendingRequests = transactions.filter(t => t.status === 'pending');
  const pendingDeposits = pendingRequests.filter(t => t.type === 'deposit');
  const pendingWithdraws = pendingRequests.filter(t => t.type === 'withdraw');

  // Filtered Users List
  const filteredUsers = allUsers.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.efootballId?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    );
  });

  const totalEcosystemBalance = allUsers.reduce((sum, u) => sum + (u.balance || 0), 0);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenBalanceEditor = (user: UserProfile) => {
    setEditingUser(user);
    setNewBalanceInput((user.balance || 0).toString());
    setAdjustmentReason('');
  };

  const handleSaveBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const parsedNum = Number(newBalanceInput);
    if (isNaN(parsedNum) || parsedNum < 0) {
      alert('অনুগ্রহ করে সঠিক ব্যালেন্স পরিমাণ দিন (০ বা তার বেশি)।');
      return;
    }

    try {
      setIsSavingBalance(true);
      const updatedUser = await adminAdjustUserBalance(
        editingUser.id,
        parsedNum,
        currentUser.name || 'Admin',
        adjustmentReason.trim() || undefined
      );

      onUpdateUser(editingUser.id, { balance: parsedNum });
      setEditingUser(null);
      setStatusMessage(`🎉 ${editingUser.name}-এর ব্যালেন্স সফলভাবে ৳${parsedNum} করা হয়েছে!`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      alert('Error updating balance: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSavingBalance(false);
    }
  };

  const handleApproveTx = async (txId: string) => {
    try {
      const approved = await approveTransaction(txId, currentUser.name || 'Admin');
      setStatusMessage(`✓ ট্রানজেকশন অনুমোদিত হয়েছে! খেলোয়াড়ের ব্যালেন্সে ৳${approved.amount} যোগ করা হয়েছে।`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      alert('Error approving transaction: ' + (err?.message || ''));
    }
  };

  const handleRejectTx = async (txId: string) => {
    const reason = prompt('বাতিল করার কারণ লিখুন (Optional):', 'পেমেন্ট ভেরিফাই হয়নি / ভুল ট্রানজেকশন আইডি');
    if (reason === null) return;

    try {
      await rejectTransaction(txId, currentUser.name || 'Admin', reason);
      setStatusMessage('✕ ট্রানজেকশন বাতিল করা হয়েছে।');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      alert('Error rejecting transaction: ' + (err?.message || ''));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pt-[max(env(safe-area-inset-top,0px),36px)] pb-[max(env(safe-area-inset-bottom,0px),50px)] px-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-700 bg-[#0a101d] shadow-2xl text-slate-100 my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 via-[#0e1626] to-slate-900 p-4 sm:p-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-amber-400 to-[#00ff87] p-2 text-slate-950 font-black shadow-md shadow-amber-400/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Users &amp; Balance Management (ইউজার ও ব্যালেন্স কন্ট্রোল)
                </h2>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300 border border-amber-500/30">
                  Admin Exclusive
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                সকল প্লেয়ারদের তথ্য, ওয়ালেট ব্যালেন্স এডিট এবং ডিপোজিট/উত্তোলন ট্রানজেকশন ভেরিফিকেশন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message Alert */}
        {statusMessage && (
          <div className="mx-4 mt-3 sm:mx-6 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2 shadow-md">
            <CheckCircle2 className="w-4 h-4 text-[#00ff87] shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 p-3 sm:p-4 mx-4 mt-3 sm:mx-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-center flex-shrink-0">
          <div>
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-bold block">
              Total Users (মোট ইউজার)
            </span>
            <span className="text-lg sm:text-2xl font-black text-white mt-0.5 block">
              {allUsers.length}
            </span>
          </div>
          <div className="border-l border-slate-800">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-bold block">
              Ecosystem Balance
            </span>
            <span className="text-lg sm:text-2xl font-black text-[#00ff87] mt-0.5 block font-mono">
              ৳{totalEcosystemBalance}
            </span>
          </div>
          <div className="border-l border-slate-800">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-bold block">
              Pending Requests
            </span>
            <span className={`text-lg sm:text-2xl font-black mt-0.5 block ${
              pendingRequests.length > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'
            }`}>
              {pendingRequests.length}
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-6 mt-3 flex-shrink-0 text-xs font-bold">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'users'
                  ? 'border-[#00ff87] text-[#00ff87]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Users ({allUsers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'requests'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Requests</span>
              {pendingRequests.length > 0 && (
                <span className="rounded-full bg-amber-500 text-slate-950 px-1.5 py-0.2 text-[10px] font-black">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'border-[#00e5ff] text-[#00e5ff]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>All Transactions</span>
            </button>
          </div>

          {activeTab === 'users' && (
            <div className="relative pb-2">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user..."
                className="rounded-lg bg-slate-900 border border-slate-700 pl-8 pr-2.5 py-1 text-xs text-white focus:border-[#00ff87] focus:outline-none w-36 sm:w-48"
              />
            </div>
          )}
        </div>

        {/* Tab 1: All Users List */}
        {activeTab === 'users' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-10 h-10 mx-auto opacity-40 mb-2" />
                <p className="text-xs">কোনো ইউজার খুঁজে পাওয়া যায়নি।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm group"
                  >
                    <div>
                      {/* User Top Row */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="h-10 w-10 rounded-xl object-cover border border-slate-700 group-hover:scale-105 transition-transform shrink-0"
                            onError={(e) => handleAvatarError(e, isUserAdmin(user) ? DEFAULT_ADMIN_AVATAR : DEFAULT_PLAYER_AVATAR)}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-white truncate max-w-[140px]">
                                {user.name}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                isUserAdmin(user)
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-[#00ff87]/20 text-[#00ff87]'
                              }`}>
                                {user.role}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mt-0.5">
                              <span className="text-[#00ff87] font-bold">ID: {user.efootballId}</span>
                              <button
                                onClick={() => handleCopy(user.efootballId)}
                                className="text-slate-500 hover:text-white"
                                title="Copy In-Game ID"
                              >
                                {copiedId === user.efootballId ? (
                                  <Check className="w-3 h-3 text-[#00ff87]" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Balance Badge */}
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Balance</span>
                          <span className="text-sm font-black text-[#00ff87] font-mono">
                            ৳{user.balance || 0}
                          </span>
                        </div>
                      </div>

                      {/* Info details */}
                      <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[10px] bg-black/40 p-2 rounded-xl border border-slate-800/80 text-slate-300">
                        <div className="truncate">
                          <span className="text-slate-500">Email:</span> {user.email || 'None'}
                        </div>
                        <div className="truncate">
                          <span className="text-slate-500">Phone:</span> {user.phone || 'N/A'}
                        </div>
                        <div className="truncate">
                          <span className="text-slate-500">Club:</span> {user.favoriteClub || 'eFootball FC'}
                        </div>
                        <div className="truncate">
                          <span className="text-slate-500">Tier:</span> {user.division || 'Div 3'} • {user.rating} pts
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action: Edit Balance */}
                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Joined: {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                      </span>

                      <button
                        onClick={() => handleOpenBalanceEditor(user)}
                        className="flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300 transition active:scale-95"
                        title="Edit player wallet balance"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Balance</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pending Deposit & Withdraw Requests */}
        {activeTab === 'requests' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-14 text-slate-500 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-[#00ff87] mx-auto opacity-70 mb-2" />
                <h3 className="text-sm font-bold text-white">No Pending Requests!</h3>
                <p className="text-xs">সব ডিপোজিট এবং উত্তোলন রিকোয়েস্ট ইতিমধ্যে যাচাই ও অনুমোদিত হয়েছে।</p>
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 p-4 space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-xl ${
                        req.type === 'deposit'
                          ? 'bg-emerald-500/20 text-[#00ff87] border border-emerald-500/40'
                          : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                      }`}>
                        {req.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            req.type === 'deposit' ? 'bg-emerald-500/20 text-[#00ff87]' : 'bg-sky-500/20 text-sky-400'
                          }`}>
                            {req.type === 'deposit' ? 'DEPOSIT REQUEST' : 'WITHDRAWAL REQUEST'}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {req.userName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            (ID: {req.userEfootballId})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {new Date(req.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black text-amber-300 font-mono">
                        ৳{req.amount}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        via {req.method?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Verification Info Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-black/60 p-3 rounded-xl border border-slate-800">
                    {req.type === 'deposit' && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Sender Number:</span>
                          <span className="font-mono font-bold text-white flex items-center gap-1">
                            {req.senderNumber}
                            <button onClick={() => handleCopy(req.senderNumber || '')} className="text-slate-400 hover:text-white">
                              <Copy className="w-3 h-3" />
                            </button>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Transaction ID (TrxID):</span>
                          <span className="font-mono font-black text-[#00ff87] flex items-center gap-1">
                            {req.transactionId}
                            <button onClick={() => handleCopy(req.transactionId || '')} className="text-slate-400 hover:text-white">
                              <Copy className="w-3 h-3" />
                            </button>
                          </span>
                        </div>
                      </>
                    )}

                    {req.type === 'withdraw' && (
                      <div className="col-span-2 flex items-center justify-between">
                        <span className="text-slate-400">Send money to Receiver Number:</span>
                        <span className="font-mono font-bold text-sky-400 text-sm flex items-center gap-1">
                          {req.receiverNumber} ({req.method?.toUpperCase()})
                          <button onClick={() => handleCopy(req.receiverNumber || '')} className="text-slate-400 hover:text-white">
                            <Copy className="w-3 h-3" />
                          </button>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: 1-Click Approve / Reject */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleRejectTx(req.id)}
                      className="px-3 py-1.5 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 text-xs font-bold transition flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject (বাতিল)</span>
                    </button>

                    <button
                      onClick={() => handleApproveTx(req.id)}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#00ff87] to-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider hover:brightness-110 transition shadow-md shadow-[#00ff87]/20 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Approve (অনুমোদন করুন)</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Completed History Logs */}
        {activeTab === 'history' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5 flex-1">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="text-xs">কোনো ট্রানজেকশন লগ নেই।</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      tx.type === 'deposit'
                        ? 'bg-emerald-500/20 text-[#00ff87]'
                        : tx.type === 'withdraw'
                        ? 'bg-sky-500/20 text-sky-400'
                        : 'bg-purple-500/20 text-purple-300'
                    }`}>
                      {tx.type === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <strong className="text-white">{tx.userName}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">({tx.userEfootballId})</span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] font-bold uppercase text-slate-300">
                          {tx.type} • {tx.method || 'wallet'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 space-x-1 font-mono truncate">
                        <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                        {tx.transactionId && <span>• TrxID: {tx.transactionId}</span>}
                        {tx.senderNumber && <span>• From: {tx.senderNumber}</span>}
                        {tx.receiverNumber && <span>• To: {tx.receiverNumber}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-sm font-black font-mono block ${
                      tx.type === 'deposit' ? 'text-[#00ff87]' : 'text-rose-400'
                    }`}>
                      {tx.type === 'deposit' ? '+' : '-'}৳{Math.abs(tx.amount)}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                      tx.status === 'approved'
                        ? 'bg-emerald-500/20 text-[#00ff87]'
                        : tx.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* Balance Edit Dialog */}
      {editingUser && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setEditingUser(null)}
        >
          <div 
            className="w-full max-w-sm rounded-2xl border border-slate-700 bg-[#0f172a] p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Edit Wallet Balance (ব্যালেন্স এডিট)
                </h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Player:</span>
                <strong className="text-white">{editingUser.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">eFootball ID:</span>
                <span className="font-mono text-[#00ff87]">{editingUser.efootballId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Balance:</span>
                <strong className="text-amber-300 font-mono">৳{editingUser.balance || 0}</strong>
              </div>
            </div>

            <form onSubmit={handleSaveBalance} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  New Balance (নতুন ব্যালেন্স পরিমাণ ৳)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newBalanceInput}
                  onChange={(e) => setNewBalanceInput(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-base font-black text-[#00ff87] font-mono focus:border-[#00ff87] focus:outline-none"
                />
              </div>

              {/* Quick Adjustment Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[50, 100, 200, 500].map((add) => (
                  <button
                    key={add}
                    type="button"
                    onClick={() => setNewBalanceInput((prev) => (Number(prev || 0) + add).toString())}
                    className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-[#00ff87] border border-slate-700 transition"
                  >
                    +{add}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setNewBalanceInput('0')}
                  className="py-1 px-2.5 rounded-lg bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900/50 text-xs font-bold text-rose-300 transition"
                >
                  Reset (0)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Reason / নোট (Optional)
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. Tournament 1st Prize Reward or Manual Deposit"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBalance}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-[#00ff87] text-slate-950 text-xs font-black uppercase tracking-wider hover:brightness-110 transition shadow-md flex items-center justify-center gap-1"
                >
                  {isSavingBalance ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Balance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
