const request = require('supertest');
const app = require('../src/app');
const { getWalletBalance } = require('./test.utils');

const USER = process.env.TEST_USER_WALLET_ID;
const TREASURY = process.env.TEST_TREASURY_WALLET_ID;

test('100 concurrent spends never go negative', async () => {
  const requests = [];

  for (let i = 0; i < 100; i++) {
    requests.push(
      request(app).post('/wallet/spend').send({
        userWalletId: USER,
        treasuryWalletId: TREASURY,
        amount: 1
      })
    );
  }

  await Promise.allSettled(requests);

  const balance = await getWalletBalance(USER);
  expect(balance).toBeGreaterThanOrEqual(0);
});
