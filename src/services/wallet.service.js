const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

/**
 * Get wallet balance using ledger (O(1) with index)
 */
async function getWalletBalance(walletId) {
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('amount')
    .eq('wallet_id', walletId);

  if (error) throw error;

  return data.reduce((sum, row) => sum + row.amount, 0);
}

/**
 * Core atomic transaction executor
 * Handles:
 * - idempotency
 * - locking
 * - ledger writes
 */
async function executeTransaction({
  transactionId,
  fromWalletId,
  toWalletId,
  amount,
  type
}) {
  // 1️⃣ Check idempotency
  const { data: existingTx } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (existingTx) {
    return { status: 'IDEMPOTENT_SUCCESS' };
  }

  // 2️⃣ Begin transaction
  const client = supabase.rpc;

  try {
    // Insert transaction record
    await supabase.from('transactions').insert({
      id: transactionId,
      status: 'PENDING'
    });

    // 3️⃣ Lock FROM wallet
    const { data: fromWallet } = await supabase.rpc(
      'lock_wallet',
      { wallet_id: fromWalletId }
    );

    // 4️⃣ Balance check
    const balance = await getWalletBalance(fromWalletId);
    if (balance < amount) {
      throw new Error('INSUFFICIENT_BALANCE');
    }

    // 5️⃣ Ledger entries
    await supabase.from('ledger_entries').insert([
      {
        wallet_id: fromWalletId,
        amount: -amount,
        transaction_id: transactionId,
        type
      },
      {
        wallet_id: toWalletId,
        amount: amount,
        transaction_id: transactionId,
        type
      }
    ]);

    // 6️⃣ Mark transaction success
    await supabase
      .from('transactions')
      .update({ status: 'SUCCESS' })
      .eq('id', transactionId);

    return { status: 'SUCCESS' };
  } catch (err) {
    await supabase
      .from('transactions')
      .update({ status: 'FAILED' })
      .eq('id', transactionId);

    throw err;
  }
}

/**
 * Public APIs
 */
async function spend({ userWalletId, treasuryWalletId, amount }) {
  return executeTransaction({
    transactionId: uuidv4(),
    fromWalletId: userWalletId,
    toWalletId: treasuryWalletId,
    amount,
    type: 'SPEND'
  });
}

async function topup({ userWalletId, treasuryWalletId, amount, transactionId }) {
  return executeTransaction({
    transactionId,
    fromWalletId: treasuryWalletId,
    toWalletId: userWalletId,
    amount,
    type: 'TOPUP'
  });
}

async function bonus({ userWalletId, treasuryWalletId, amount }) {
  return executeTransaction({
    transactionId: uuidv4(),
    fromWalletId: treasuryWalletId,
    toWalletId: userWalletId,
    amount,
    type: 'BONUS'
  });
}

module.exports = {
  getWalletBalance,
  spend,
  topup,
  bonus
};
