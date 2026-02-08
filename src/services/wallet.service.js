const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

/**
 * Get wallet balance using ledger
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
 * - optional balance skipping (external mint)
 */
async function executeTransaction({
  transactionId,
  fromWalletId,
  toWalletId,
  amount,
  type,
  skipBalanceCheck = false
}) {
  // 1️⃣ Idempotency check
  const { data: existingTx } = await supabase
    .from('transactions')
    .select('id')
    .eq('id', transactionId)
    .single();

  if (existingTx) {
    return { status: 'IDEMPOTENT_SUCCESS' };
  }

  try {
    // 2️⃣ Create transaction record
    await supabase.from('transactions').insert({
      id: transactionId,
      status: 'PENDING'
    });

    // 3️⃣ Lock FROM wallet (row-level lock)
    await supabase.rpc('lock_wallet', {
      wallet_id: fromWalletId
    });

    // 4️⃣ Balance check (skip for external mint)
    if (!skipBalanceCheck) {
      const balance = await getWalletBalance(fromWalletId);
      if (balance < amount) {
        throw new Error('INSUFFICIENT_BALANCE');
      }
    }

    // 5️⃣ Ledger entries (atomic intent)
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

async function spend({ userWalletId, treasuryWalletId, amount }) {
  return executeTransaction({
    transactionId: uuidv4(),
    fromWalletId: userWalletId,
    toWalletId: treasuryWalletId,
    amount,
    type: 'SPEND',
    skipBalanceCheck: false
  });
}

async function topup({
  userWalletId,
  treasuryWalletId,
  amount,
  transactionId,
  isExternalMint = true
}) {
  return executeTransaction({
    transactionId,
    fromWalletId: treasuryWalletId,
    toWalletId: userWalletId,
    amount,
    type: 'TOPUP',
    skipBalanceCheck: isExternalMint
  });
}

async function bonus({ userWalletId, treasuryWalletId, amount }) {
  return executeTransaction({
    transactionId: uuidv4(),
    fromWalletId: treasuryWalletId,
    toWalletId: userWalletId,
    amount,
    type: 'BONUS',
    skipBalanceCheck: false
  });
}

module.exports = {
  getWalletBalance,
  spend,
  topup,
  bonus
};
