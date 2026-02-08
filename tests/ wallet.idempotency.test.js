const request = require('supertest');
const app = require('../src/app');
const supabase = require('../src/config/supabase');

test('same transactionId is processed only once', async () => {
    const payload = {
        userWalletId: process.env.TEST_USER_WALLET_ID,
        treasuryWalletId: process.env.TEST_TREASURY_WALLET_ID,
        amount: 10,
        transactionId: 'idem_test_tx_1'
    };

    await request(app).post('/wallet/topup').send(payload);
    await request(app).post('/wallet/topup').send(payload);
    await request(app).post('/wallet/topup').send(payload);

    const { data } = await supabase
        .from('ledger_entries')
        .select('*')
        .eq('transaction_id', 'idem_test_tx_1');

    expect(data.length).toBeLessThanOrEqual(2);

});
