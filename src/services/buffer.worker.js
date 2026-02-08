const fs = require('fs');
const {
  readBufferedTransactions,
  removeBufferFile
} = require('./buffer.service');

const { topup, spend, bonus } = require('./wallet.service');

async function processBuffer() {
  const files = readBufferedTransactions();

  for (const file of files) {
    try {
      const payload = JSON.parse(fs.readFileSync(file, 'utf-8'));

      const { action } = payload;

      if (action === 'TOPUP') {
        await topup(payload);
      } else if (action === 'SPEND') {
        await spend(payload);
      } else if (action === 'BONUS') {
        await bonus(payload);
      }

      removeBufferFile(file);
      console.log(`✅ Buffered tx processed: ${payload.transactionId}`);
    } catch (err) {
      console.error(`⏳ Retry later: ${file}`, err.message);
    }
  }
}

/**
 * Poll every 5 seconds
 */
setInterval(processBuffer, 5000);
