require('dotenv').config();

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const {
  spend,
  topup
} = require('../src/services/wallet.service');

const { writeToBuffer } = require('../src/services/buffer.service');

const USER = process.env.TEST_USER_WALLET_ID;
const TREASURY = process.env.TEST_TREASURY_WALLET_ID;

if (!USER || !TREASURY) {
  throw new Error('Wallet IDs missing in .env');
}

const TOTAL_TX = 10000;
const CONCURRENCY = 100;
const FAILURE_RATE = 0.3; // 30% forced failures

function randomAmount() {
  return Math.floor(Math.random() * 5) + 1;
}

function randomAction() {
  return Math.random() > 0.5 ? 'SPEND' : 'TOPUP';
}

async function processOne() {
  const txId = uuidv4();
  const amount = randomAmount();
  const action = randomAction();

  const payload = {
    transactionId: txId,
    userWalletId: USER,
    treasuryWalletId: TREASURY,
    amount
  };

  try {
    // 🔥 simulate DB stress / outage
    if (Math.random() < FAILURE_RATE) {
      throw new Error('SIMULATED_DB_FAILURE');
    }

    if (action === 'SPEND') {
      await spend(payload);
    } else {
      await topup(payload);
    }

    return 'DB';
  } catch (err) {
    // degraded mode → buffer
    writeToBuffer({
      ...payload,
      action
    });

    return 'BUFFER';
  }
}

async function runBatch(size) {
  const tasks = Array.from({ length: size }).map(() => processOne());
  return Promise.all(tasks);
}

(async () => {
  console.time('SYSTEM_STRESS_TEST');

  let completed = 0;
  let dbCount = 0;
  let bufferCount = 0;

  while (completed < TOTAL_TX) {
    const batchSize = Math.min(CONCURRENCY, TOTAL_TX - completed);
    const results = await runBatch(batchSize);

    results.forEach(r => {
      if (r === 'DB') dbCount++;
      if (r === 'BUFFER') bufferCount++;
    });

    completed += batchSize;

    console.log(
      `Processed ${completed}/${TOTAL_TX} | DB=${dbCount} | BUFFER=${bufferCount}`
    );
  }

  console.timeEnd('SYSTEM_STRESS_TEST');

  console.log('✅ Stress test finished');
  console.log('👉 Start worker to drain buffer');

  process.exit(0);
})();
