import http from 'node:http';
import { config } from './src/config.js';
import { handleRequest, ensureReady } from './src/handler.js';
import { describeStore } from './src/db.js';

const server = http.createServer(handleRequest);

server.listen(config.port, config.host, async () => {
  console.log('Bonfire Adventures prototype');
  console.log(`  http://${config.host}:${config.port}`);
  // Initialise the store before announcing it, so this line agrees with /healthz.
  try {
    await ensureReady();
    console.log(`  store: ${describeStore()}`);
  } catch (error) {
    console.error(`  store: unavailable (${error && error.message})`);
  }
});

server.on('error', (error) => {
  console.error('server error:', error);
  process.exit(1);
});
