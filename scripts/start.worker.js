require('dotenv').config();

console.log('🧵 Buffer worker starting...');

// Just importing starts the interval loop
require('../src/services/buffer.worker');

// Keep process alive
setInterval(() => { }, 1 << 30);
