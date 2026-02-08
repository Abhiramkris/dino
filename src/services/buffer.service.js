const fs = require('fs');
const path = require('path');

const BUFFER_DIR = path.resolve(process.env.BUFFER_PATH || 'src/buffer/pending');

if (!fs.existsSync(BUFFER_DIR)) {
    fs.mkdirSync(BUFFER_DIR, { recursive: true });
}

/**
 * Write transaction to disk (O(1))
 */
function writeToBuffer(payload) {
  const fileName = `tx_${payload.transactionId}.json`;
  const filePath = path.join(BUFFER_DIR, fileName);

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

// function writeToBuffer(payload) {
//     if (!payload.transactionId) {
//         throw new Error('transactionId required for buffer');
//     }

//     const fileName = `tx_${payload.transactionId}.json`;
//     const filePath = path.join(BUFFER_DIR, fileName);

//     // idempotent disk write
//     if (!fs.existsSync(filePath)) {
//         fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
//     }
// }


/**
 * Read all pending buffer files
 */
function readBufferedTransactions() {
    return fs
        .readdirSync(BUFFER_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => path.join(BUFFER_DIR, f));
}

/**
 * Remove buffer file after success
 */
function removeBufferFile(filePath) {
    fs.unlinkSync(filePath);
}

module.exports = {
    writeToBuffer,
    readBufferedTransactions,
    removeBufferFile
};
