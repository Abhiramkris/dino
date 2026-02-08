const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../src/app');

process.env.ENABLE_BUFFER_MODE = 'true';

const BUFFER_DIR = path.resolve('src/buffer/pending');

test('writes to buffer when db fails', async () => {
  // simulate DB outage by sending bad wallet id
  const res = await request(app)
    .post('/wallet/spend')
    .send({
      userWalletId: 'bad-id',
      treasuryWalletId: 'bad-id',
      amount: 10
    });

  expect(res.status).toBe(202);

  const files = fs.readdirSync(BUFFER_DIR);
  expect(files.length).toBeGreaterThan(0);
});
