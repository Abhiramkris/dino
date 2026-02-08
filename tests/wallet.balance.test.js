const request = require('supertest');
const app = require('../src/app');
const { getWalletBalance } = require('./test.utils');

const USER_WALLET_ID = process.env.TEST_USER_WALLET_ID;

test('wallet balance endpoint returns correct balance', async () => {
  const res = await request(app)
    .get(`/wallet/${USER_WALLET_ID}/balance`)
    .expect(200);

  const actualBalance = await getWalletBalance(USER_WALLET_ID);
  expect(res.body.balance).toBe(actualBalance);
});
