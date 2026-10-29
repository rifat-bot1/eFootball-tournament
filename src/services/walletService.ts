/**
 * =========================================================================
 * eFootball Tournament Arena - Wallet & Balance Service
 * =========================================================================
 * Handles deposits (bKash & Nagad), withdrawals, entry fee deductions,
 * prize rewards, admin manual balance adjustments, and real-time Firestore sync.
 */

import { WalletTransaction, UserProfile, PaymentMethod, Tournament } from '../types/tournament';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc 
} from 'firebase/firestore';
import { getUsers, saveUsers, getCurrentUser, setCurrentUser } from './tournamentService';
import { sendTelegramNotification } from './telegramService';

const STORAGE_TRANSACTIONS = 'efootball_wallet_transactions_v1';
const FIRESTORE_COLLECTION_TX = 'wallet_transactions';

export const OFFICIAL_PAYMENT_NUMBER = '01621833825';

export function getLocalTransactions(): WalletTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_TRANSACTIONS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse local transactions:', err);
  }
  return [];
}

export function saveLocalTransactions(txs: WalletTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_TRANSACTIONS, JSON.stringify(txs));
  } catch (err) {
    console.warn('Failed saving local transactions:', err);
  }
}

/**
 * Real-time subscription to all wallet transactions via Firestore
 */
export function subscribeToTransactions(callback: (transactions: WalletTransaction[]) => void): () => void {
  // 1. Immediately emit local cache
  const local = getLocalTransactions();
  callback(local);

  try {
    const colRef = collection(db, FIRESTORE_COLLECTION_TX);
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: WalletTransaction[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as WalletTransaction;
            if (data && data.id) {
              list.push(data);
            }
          });
          // Sort newest first
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          saveLocalTransactions(list);
          callback(list);
        } else {
          callback(getLocalTransactions());
        }
      },
      (error) => {
        console.warn('Transactions snapshot listener error:', error);
        callback(getLocalTransactions());
      }
    );
    return unsub;
  } catch (err) {
    console.warn('Failed subscribing to transactions:', err);
    return () => {};
  }
}

/**
 * Real-time subscription to a specific user's transactions
 */
export function subscribeToUserTransactions(
  userId: string, 
  callback: (transactions: WalletTransaction[]) => void
): () => void {
  return subscribeToTransactions((allTxs) => {
    const userTxs = allTxs.filter(tx => tx.userId === userId);
    callback(userTxs);
  });
}

/**
 * Helper to update a user's balance locally and in Firestore
 */
export async function updateUserBalanceInStorageAndDb(
  userId: string, 
  newBalance: number
): Promise<UserProfile> {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  const current = getCurrentUser();

  const safeBalance = Math.max(0, Math.round(newBalance));

  let updatedUser: UserProfile;
  if (idx >= 0) {
    users[idx] = { ...users[idx], balance: safeBalance };
    updatedUser = users[idx];
  } else {
    updatedUser = { ...current, id: userId, balance: safeBalance };
    users.push(updatedUser);
  }

  saveUsers(users);

  // If this user is currently active in session, update session
  if (current.id === userId) {
    setCurrentUser(updatedUser);
  }

  // Sync to Firestore
  try {
    await setDoc(doc(db, 'users', userId), { balance: safeBalance }, { merge: true });
  } catch (err) {
    console.warn('Failed to sync updated balance to Firestore:', err);
  }

  return updatedUser;
}

/**
 * User requests a deposit after sending money to 01621833825 via bKash/Nagad
 */
export async function requestDeposit(params: {
  userId: string;
  userName: string;
  userEmail: string;
  userEfootballId: string;
  amount: number;
  method: PaymentMethod;
  senderNumber: string;
  transactionId: string;
}): Promise<WalletTransaction> {
  if (!params.amount || params.amount <= 0) {
    throw new Error('Please enter a valid deposit amount (e.g. ৳50, ৳100).');
  }
  if (!params.senderNumber.trim()) {
    throw new Error('Please provide the mobile number from which money was sent.');
  }
  if (!params.transactionId.trim()) {
    throw new Error('Please provide the bKash/Nagad Transaction ID (TrxID).');
  }

  const txId = `tx_dep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newTx: WalletTransaction = {
    id: txId,
    userId: params.userId,
    userName: params.userName,
    userEmail: params.userEmail,
    userEfootballId: params.userEfootballId,
    type: 'deposit',
    amount: Number(params.amount),
    method: params.method,
    senderNumber: params.senderNumber.trim(),
    transactionId: params.transactionId.trim().toUpperCase(),
    status: 'pending',
    note: `Deposit via ${params.method.toUpperCase()} to ${OFFICIAL_PAYMENT_NUMBER}`,
    createdAt: new Date().toISOString()
  };

  // 1. Save locally
  const current = getLocalTransactions();
  const updated = [newTx, ...current];
  saveLocalTransactions(updated);

  // 2. Save to Firestore
  try {
    await setDoc(doc(db, FIRESTORE_COLLECTION_TX, txId), newTx);
  } catch (err) {
    console.warn('Failed saving deposit to Firestore:', err);
  }

  // 3. Telegram notification to tournament committee
  try {
    const methodEmoji = params.method === 'bkash' ? '🌸 bKash' : '🟠 Nagad';
    await sendTelegramNotification({
      event: 'test_ping',
      text: 
        `💰 <b>NEW DEPOSIT REQUEST PENDING</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 <b>Player:</b> ${params.userName} (ID: <code>${params.userEfootballId}</code>)\n` +
        `💵 <b>Amount:</b> ৳${params.amount} BDT\n` +
        `📱 <b>Method:</b> ${methodEmoji}\n` +
        `📞 <b>Sender Number:</b> <code>${params.senderNumber}</code>\n` +
        `🔖 <b>TrxID:</b> <code>${params.transactionId.toUpperCase()}</code>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `⚡ Please verify in Admin Panel & click Approve.`
    });
  } catch {}

  return newTx;
}

/**
 * User requests a withdrawal
 */
export async function requestWithdraw(params: {
  userId: string;
  userName: string;
  userEmail: string;
  userEfootballId: string;
  currentBalance: number;
  amount: number;
  method: PaymentMethod;
  receiverNumber: string;
}): Promise<WalletTransaction> {
  if (!params.amount || params.amount <= 0) {
    throw new Error('Please enter a valid withdrawal amount.');
  }
  if (params.amount > params.currentBalance) {
    throw new Error(`Insufficient balance! Your current balance is ৳${params.currentBalance}.`);
  }
  if (!params.receiverNumber.trim()) {
    throw new Error('Please provide the receiver mobile number.');
  }

  const txId = `tx_wd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  
  // Deduct balance immediately so user cannot double-spend while request is pending
  const newBalance = params.currentBalance - params.amount;
  await updateUserBalanceInStorageAndDb(params.userId, newBalance);

  const newTx: WalletTransaction = {
    id: txId,
    userId: params.userId,
    userName: params.userName,
    userEmail: params.userEmail,
    userEfootballId: params.userEfootballId,
    type: 'withdraw',
    amount: Number(params.amount),
    method: params.method,
    receiverNumber: params.receiverNumber.trim(),
    status: 'pending',
    note: `Withdrawal request via ${params.method.toUpperCase()} to ${params.receiverNumber}`,
    createdAt: new Date().toISOString()
  };

  const current = getLocalTransactions();
  const updated = [newTx, ...current];
  saveLocalTransactions(updated);

  try {
    await setDoc(doc(db, FIRESTORE_COLLECTION_TX, txId), newTx);
  } catch (err) {
    console.warn('Failed saving withdrawal to Firestore:', err);
  }

  // Telegram alert
  try {
    await sendTelegramNotification({
      event: 'test_ping',
      text: 
        `💸 <b>NEW WITHDRAWAL REQUEST PENDING</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 <b>Player:</b> ${params.userName} (ID: <code>${params.userEfootballId}</code>)\n` +
        `💵 <b>Amount:</b> ৳${params.amount} BDT\n` +
        `📱 <b>Method:</b> ${params.method.toUpperCase()}\n` +
        `📞 <b>Receiver Number:</b> <code>${params.receiverNumber}</code>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `⚡ Check Admin Desk to complete payout.`
    });
  } catch {}

  return newTx;
}

/**
 * Admin approves a deposit or withdrawal
 */
export async function approveTransaction(
  transactionId: string, 
  adminName: string
): Promise<WalletTransaction> {
  const txs = getLocalTransactions();
  const idx = txs.findIndex(t => t.id === transactionId);
  if (idx === -1) throw new Error('Transaction not found');

  const tx = txs[idx];
  if (tx.status === 'approved') return tx;

  // If approving a deposit, add the amount to user's balance!
  if (tx.type === 'deposit') {
    const users = getUsers();
    const user = users.find(u => u.id === tx.userId);
    const existingBalance = user?.balance || 0;
    const updatedBalance = existingBalance + tx.amount;
    await updateUserBalanceInStorageAndDb(tx.userId, updatedBalance);
  }

  const updatedTx: WalletTransaction = {
    ...tx,
    status: 'approved',
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminName
  };

  txs[idx] = updatedTx;
  saveLocalTransactions(txs);

  try {
    await setDoc(doc(db, FIRESTORE_COLLECTION_TX, transactionId), updatedTx, { merge: true });
  } catch (err) {
    console.warn('Failed updating transaction in Firestore:', err);
  }

  return updatedTx;
}

/**
 * Admin rejects a transaction
 */
export async function rejectTransaction(
  transactionId: string, 
  adminName: string, 
  reason?: string
): Promise<WalletTransaction> {
  const txs = getLocalTransactions();
  const idx = txs.findIndex(t => t.id === transactionId);
  if (idx === -1) throw new Error('Transaction not found');

  const tx = txs[idx];

  // If a withdrawal was rejected, refund the deducted amount back to user's balance!
  if (tx.type === 'withdraw' && tx.status === 'pending') {
    const users = getUsers();
    const user = users.find(u => u.id === tx.userId);
    const existingBalance = user?.balance || 0;
    const refundedBalance = existingBalance + tx.amount;
    await updateUserBalanceInStorageAndDb(tx.userId, refundedBalance);
  }

  const updatedTx: WalletTransaction = {
    ...tx,
    status: 'rejected',
    note: reason ? `${tx.note || ''} (Rejected: ${reason})` : `${tx.note || ''} (Rejected by Admin)`,
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminName
  };

  txs[idx] = updatedTx;
  saveLocalTransactions(txs);

  try {
    await setDoc(doc(db, FIRESTORE_COLLECTION_TX, transactionId), updatedTx, { merge: true });
  } catch (err) {
    console.warn('Failed updating transaction in Firestore:', err);
  }

  return updatedTx;
}

/**
 * Admin directly adjusts a user's balance to any custom amount
 */
export async function adminAdjustUserBalance(
  userId: string,
  newBalance: number,
  adminName: string,
  reason?: string
): Promise<UserProfile> {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  const oldBalance = user?.balance || 0;

  const updatedUser = await updateUserBalanceInStorageAndDb(userId, newBalance);

  // Log transaction
  const txId = `tx_adj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const adjustmentTx: WalletTransaction = {
    id: txId,
    userId: userId,
    userName: user?.name || 'Player',
    userEmail: user?.email || '',
    userEfootballId: user?.efootballId || '',
    type: 'admin_adjustment',
    amount: newBalance - oldBalance,
    status: 'approved',
    note: reason || `Admin balance set from ৳${oldBalance} to ৳${newBalance}`,
    createdAt: new Date().toISOString(),
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminName
  };

  const localTxs = getLocalTransactions();
  localTxs.unshift(adjustmentTx);
  saveLocalTransactions(localTxs);

  try {
    await setDoc(doc(db, FIRESTORE_COLLECTION_TX, txId), adjustmentTx);
  } catch {}

  return updatedUser;
}

/**
 * Deduct tournament entry fee directly from user balance
 */
export async function deductTournamentEntryFee(
  user: UserProfile, 
  tournament: Tournament
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const fee = tournament.entryFee || 0;
  if (fee <= 0) {
    return { success: true, newBalance: user.balance || 0 };
  }

  const currentBalance = user.balance || 0;
  if (currentBalance < fee) {
    return {
      success: false,
      newBalance: currentBalance,
      error: `Insufficient Balance! (পর্যাপ্ত ব্যালেন্স নেই) This tournament requires an entry fee of ৳${fee}, but your current wallet balance is ৳${currentBalance}. Please deposit money to continue.`
    };
  }

  const newBalance = currentBalance - fee;
  await updateUserBalanceInStorageAndDb(user.id, newBalance);

  // Record transaction
  const txId = `tx_fee_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const feeTx: WalletTransaction = {
    id: txId,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userEfootballId: user.efootballId,
    type: 'entry_fee',
    amount: fee,
    status: 'approved',
    tournamentId: tournament.id,
    tournamentTitle: tournament.title,
    note: `Entry fee for tournament: ${tournament.title}`,
    createdAt: new Date().toISOString()
  };

  const txs = getLocalTransactions();
  txs.unshift(feeTx);
  saveLocalTransactions(txs);

  try {
    await setDoc(doc(db, FIRESTORE_COLLECTION_TX, txId), feeTx);
  } catch {}

  return { success: true, newBalance };
}
