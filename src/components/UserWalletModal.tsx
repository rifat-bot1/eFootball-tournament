import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Copy, 
  Check, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Coins,
  Send,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Phone,
  Sparkles,
  Info
} from 'lucide-react';
import { UserProfile, WalletTransaction, PaymentMethod } from '../types/tournament';
import { 
  OFFICIAL_PAYMENT_NUMBER, 
  requestDeposit, 
  requestWithdraw, 
  subscribeToUserTransactions 
} from '../services/walletService';

interface UserWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  initialTab?: 'deposit' | 'withdraw' | 'history';
  onUserBalanceUpdated?: (newBalance: number) => void;
}

export const UserWalletModal: React.FC<UserWalletModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialTab = 'deposit',
  onUserBalanceUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>(initialTab);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  
  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState<string>('100');
  const [depositMethod, setDepositMethod] = useState<PaymentMethod>('bkash');
  const [senderNumber, setSenderNumber] = useState<string>('');
  const [trxId, setTrxId] = useState<string>('');
  
  // Withdraw Form State
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawMethod, setWithdrawMethod] = useState<PaymentMethod>('bkash');
  const [receiverNumber, setReceiverNumber] = useState<string>('');

  // UI States
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Subscribe to real-time user transactions
  useEffect(() => {
    if (isOpen && currentUser.id) {
      const unsub = subscribeToUserTransactions(currentUser.id, (txs) => {
        setTransactions(txs);
      });
      return () => unsub();
    }
  }, [isOpen, currentUser.id]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    setFeedback(null);
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const currentBalance = currentUser.balance || 0;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(OFFICIAL_PAYMENT_NUMBER);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const amountNum = Number(depositAmount);

    if (!amountNum || amountNum < 10) {
      setFeedback({ type: 'error', message: 'সর্বনিম্ন ডিপোজিট পরিমাণ ৳১০।' });
      return;
    }
    if (!senderNumber.trim() || senderNumber.trim().length < 11) {
      setFeedback({ type: 'error', message: 'অনুগ্রহ করে সঠিক সেন্ডার মোবাইল নম্বর দিন।' });
      return;
    }
    if (!trxId.trim() || trxId.trim().length < 4) {
      setFeedback({ type: 'error', message: 'অনুগ্রহ করে বিকাশ বা নগদের সঠিক ট্রানজেকশন আইডি (TrxID) দিন।' });
      return;
    }

    try {
      setIsSubmitting(true);
      await requestDeposit({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        userEfootballId: currentUser.efootballId,
        amount: amountNum,
        method: depositMethod,
        senderNumber: senderNumber.trim(),
        transactionId: trxId.trim().toUpperCase()
      });

      setFeedback({
        type: 'success',
        message: 'ডিপোজিট রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে! এডমিন ভেরিফাই করে অল্প সময়ের মধ্যে ব্যালেন্স যোগ করবেন।'
      });
      setSenderNumber('');
      setTrxId('');
      // Switch to history tab after 2.5s
      setTimeout(() => {
        setActiveTab('history');
      }, 2500);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'ডিপোজিট রিকোয়েস্ট পাঠাতে ব্যর্থ হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const amountNum = Number(withdrawAmount);

    if (!amountNum || amountNum < 20) {
      setFeedback({ type: 'error', message: 'সর্বনিম্ন উত্তোলন পরিমাণ ৳২০।' });
      return;
    }
    if (amountNum > currentBalance) {
      setFeedback({ type: 'error', message: `পর্যাপ্ত ব্যালেন্স নেই! আপনার বর্তমান ব্যালেন্স ৳${currentBalance}।` });
      return;
    }
    if (!receiverNumber.trim() || receiverNumber.trim().length < 11) {
      setFeedback({ type: 'error', message: 'অনুগ্রহ করে সঠিক রিসিভার মোবাইল নম্বর দিন।' });
      return;
    }

    try {
      setIsSubmitting(true);
      await requestWithdraw({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        userEfootballId: currentUser.efootballId,
        currentBalance,
        amount: amountNum,
        method: withdrawMethod,
        receiverNumber: receiverNumber.trim()
      });

      onUserBalanceUpdated?.(currentBalance - amountNum);

      setFeedback({
        type: 'success',
        message: 'উত্তোলন রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে! এডমিন যাচাই করে আপনার নাম্বারে টাকা পাঠিয়ে দেবেন।'
      });
      setWithdrawAmount('');
      setReceiverNumber('');
      setTimeout(() => {
        setActiveTab('history');
      }, 2500);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'উত্তোলন রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pt-[max(env(safe-area-inset-top,0px),36px)] pb-[max(env(safe-area-inset-bottom,0px),50px)] px-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0c121e] shadow-2xl text-slate-100 my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 via-[#101827] to-slate-900 p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-gradient-to-br from-[#00ff87] to-[#00e5ff] p-2 text-slate-950 font-black shadow-md shadow-[#00ff87]/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                My Wallet &amp; Balance (ব্যালেন্স ও ওয়ালেট)
              </h2>
              <p className="text-[11px] text-slate-400">
                {currentUser.name} • In-Game ID: <span className="font-mono text-[#00ff87]">{currentUser.efootballId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Card */}
        <div className="mx-4 mt-4 sm:mx-5 sm:mt-5 p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-950 to-[#07131f] border border-slate-700/80 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-28 h-28 rounded-full bg-[#00ff87]/10 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Available Wallet Balance (বর্তমান ব্যালেন্স)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  ৳{currentBalance}
                </span>
                <span className="text-xs font-bold text-[#00ff87] uppercase tracking-wider">
                  BDT
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setActiveTab('deposit');
                  setFeedback(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  activeTab === 'deposit'
                    ? 'bg-[#00ff87] text-slate-950 shadow-md shadow-[#00ff87]/30'
                    : 'bg-emerald-950/60 border border-emerald-500/40 text-[#00ff87] hover:bg-emerald-900/50'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Deposit (জমা)</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('withdraw');
                  setFeedback(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  activeTab === 'withdraw'
                    ? 'bg-[#00e5ff] text-slate-950 shadow-md shadow-[#00e5ff]/30'
                    : 'bg-sky-950/60 border border-sky-500/40 text-sky-400 hover:bg-sky-900/50'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Withdraw (উত্তোলন)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 px-4 sm:px-5 mt-3 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('deposit');
              setFeedback(null);
            }}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === 'deposit'
                ? 'border-[#00ff87] text-[#00ff87]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Deposit (টাকা জমা করুন)
          </button>
          <button
            onClick={() => {
              setActiveTab('withdraw');
              setFeedback(null);
            }}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === 'withdraw'
                ? 'border-[#00e5ff] text-[#00e5ff]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Withdraw (টাকা উত্তোলন)
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              setFeedback(null);
            }}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>History (লেনদেন হিস্ট্রি)</span>
            {transactions.length > 0 && (
              <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300">
                {transactions.length}
              </span>
            )}
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`mx-4 mt-3 sm:mx-5 p-3 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/60 border border-rose-500/50 text-rose-200'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#00ff87] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Tab 1: Deposit */}
        {activeTab === 'deposit' && (
          <form onSubmit={handleDepositSubmit} className="p-4 sm:p-5 space-y-4">
            {/* Payment Number Card */}
            <div className="rounded-xl bg-gradient-to-r from-pink-950/40 via-slate-900 to-amber-950/40 border border-slate-700 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Official bKash &amp; Nagad Send Money Number:</span>
                </span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-black text-[#00ff87] uppercase">
                  Personal
                </span>
              </div>

              <div className="flex items-center justify-between bg-black/60 p-2.5 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base sm:text-lg font-black text-amber-300 tracking-wider">
                    {OFFICIAL_PAYMENT_NUMBER}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    (bKash / Nagad)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-bold text-[#00ff87] transition active:scale-95"
                >
                  {copiedNumber ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedNumber ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                ১. আপনার bKash বা Nagad অ্যাপ ওপেন করে <strong>Send Money</strong> করুন ওপরের নাম্বারে।<br />
                ২. টাকা পাঠানো সম্পন্ন হলে নিচে টাকার পরিমাণ, মেথড, আপনার প্রেরক মোবাইল নম্বর ও TrxID লিখে সাবমিট করুন।
              </p>
            </div>

            {/* Select Method */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Payment Method (পেমেন্ট মাধ্যম)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDepositMethod('bkash')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    depositMethod === 'bkash'
                      ? 'border-[#e2136e] bg-[#e2136e]/20 text-pink-300 shadow-md shadow-[#e2136e]/20'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e2136e]" />
                  <span>bKash (বিকাশ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDepositMethod('nagad')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    depositMethod === 'nagad'
                      ? 'border-[#f7941d] bg-[#f7941d]/20 text-amber-300 shadow-md shadow-[#f7941d]/20'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f7941d]" />
                  <span>Nagad (নগদ)</span>
                </button>
              </div>
            </div>

            {/* Quick Amount Pills */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Deposit Amount (টাকার পরিমাণ)
              </label>
              <div className="flex items-center gap-2 mb-2">
                {['50', '100', '200', '500'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition ${
                      depositAmount === amt
                        ? 'bg-[#00ff87] text-slate-950 border-[#00ff87] shadow-sm'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    ৳{amt}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">৳</span>
                <input
                  type="number"
                  min="10"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Enter custom amount"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-8 pr-3 py-2 text-xs sm:text-sm font-bold text-white focus:border-[#00ff87] focus:outline-none"
                />
              </div>
            </div>

            {/* Sender Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Your Sender Mobile Number (যে নম্বর থেকে টাকা পাঠিয়েছেন) <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                required
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder="e.g. 017XXXXXXXX"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs sm:text-sm font-mono text-white focus:border-[#00ff87] focus:outline-none"
              />
            </div>

            {/* Transaction ID */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Transaction ID (TrxID) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                placeholder="e.g. BL928X4P99"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs sm:text-sm font-mono uppercase text-white focus:border-[#00ff87] focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                টাকা পাঠানোর পর বিকাশ বা নগদ মেসেজে আসা TrxID টি হুবহু এখানে দিন।
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 shadow-md shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Submitting...' : 'Submit Deposit Request (টাকা অ্যাড রিকোয়েস্ট)'}</span>
            </button>
          </form>
        )}

        {/* Tab 2: Withdraw */}
        {activeTab === 'withdraw' && (
          <form onSubmit={handleWithdrawSubmit} className="p-4 sm:p-5 space-y-4">
            <div className="rounded-xl bg-sky-950/30 border border-sky-500/40 p-3 text-xs text-sky-200">
              <p className="leading-relaxed">
                আপনার বর্তমান ওয়ালেট ব্যালেন্স থেকে বিকাশ অথবা নগদে ক্যাশআউট / উত্তোলন রিকোয়েস্ট পাঠান। এডমিন যাচাই করে আপনার একাউন্টে টাকা পাঠিয়ে দেবে।
              </p>
            </div>

            {/* Select Method */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Withdrawal Method (টাকা নেওয়ার মাধ্যম)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setWithdrawMethod('bkash')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    withdrawMethod === 'bkash'
                      ? 'border-[#e2136e] bg-[#e2136e]/20 text-pink-300 shadow-md shadow-[#e2136e]/20'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e2136e]" />
                  <span>bKash (বিকাশ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawMethod('nagad')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    withdrawMethod === 'nagad'
                      ? 'border-[#f7941d] bg-[#f7941d]/20 text-amber-300 shadow-md shadow-[#f7941d]/20'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f7941d]" />
                  <span>Nagad (নগদ)</span>
                </button>
              </div>
            </div>

            {/* Withdraw Amount */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Withdrawal Amount (উত্তোলনের পরিমাণ) <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  Available: ৳{currentBalance}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">৳</span>
                <input
                  type="number"
                  min="20"
                  max={currentBalance}
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-8 pr-3 py-2 text-xs sm:text-sm font-bold text-white focus:border-[#00e5ff] focus:outline-none"
                />
              </div>
            </div>

            {/* Receiver Mobile Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Your Receiver Mobile Number (যে নম্বরে টাকা নেবেন) <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                required
                value={receiverNumber}
                onChange={(e) => setReceiverNumber(e.target.value)}
                placeholder="e.g. 017XXXXXXXX"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs sm:text-sm font-mono text-white focus:border-[#00e5ff] focus:outline-none"
              />
            </div>

            {/* Submit Withdraw */}
            <button
              type="submit"
              disabled={isSubmitting || currentBalance < 20}
              className="w-full rounded-xl bg-gradient-to-r from-[#00e5ff] to-blue-500 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 shadow-md shadow-[#00e5ff]/20 hover:brightness-110 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUpRight className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Submitting...' : 'Request Withdrawal (টাকা উত্তোলন রিকোয়েস্ট)'}</span>
            </button>
          </form>
        )}

        {/* Tab 3: History */}
        {activeTab === 'history' && (
          <div className="p-4 sm:p-5 space-y-2.5 max-h-[50vh] overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="text-center py-10 text-slate-500 space-y-2">
                <Clock className="w-10 h-10 mx-auto opacity-40" />
                <p className="text-xs">কোনো লেনদেন রেকর্ড পাওয়া যায়নি।</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      tx.type === 'deposit'
                        ? 'bg-emerald-500/20 text-[#00ff87]'
                        : tx.type === 'withdraw'
                        ? 'bg-sky-500/20 text-sky-400'
                        : tx.type === 'entry_fee'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-purple-500/20 text-purple-300'
                    }`}>
                      {tx.type === 'deposit' && <ArrowDownLeft className="w-4 h-4" />}
                      {tx.type === 'withdraw' && <ArrowUpRight className="w-4 h-4" />}
                      {tx.type === 'entry_fee' && <Coins className="w-4 h-4" />}
                      {tx.type === 'admin_adjustment' && <Sparkles className="w-4 h-4" />}
                      {tx.type === 'prize_reward' && <Coins className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <strong className="text-white capitalize">
                          {tx.type === 'deposit' ? 'Deposit' : tx.type === 'withdraw' ? 'Withdraw' : tx.type === 'entry_fee' ? 'Entry Fee' : 'Wallet Update'}
                        </strong>
                        {tx.method && (
                          <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] font-bold uppercase text-slate-300">
                            {tx.method}
                          </span>
                        )}
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
                    <span className={`text-sm font-black block font-mono ${
                      tx.type === 'deposit' || tx.type === 'prize_reward' || (tx.type === 'admin_adjustment' && tx.amount >= 0)
                        ? 'text-[#00ff87]'
                        : 'text-rose-400'
                    }`}>
                      {tx.type === 'deposit' || tx.type === 'prize_reward' || (tx.type === 'admin_adjustment' && tx.amount >= 0) ? '+' : '-'}৳{Math.abs(tx.amount)}
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
    </div>
  );
};
