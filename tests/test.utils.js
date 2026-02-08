const supabase = require('../src/config/supabase');

async function getWalletBalance(walletId) {
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('amount')
    .eq('wallet_id', walletId);

  if (error) throw error;
  return data.reduce((sum, r) => sum + r.amount, 0);
}

module.exports = {
  getWalletBalance
};
