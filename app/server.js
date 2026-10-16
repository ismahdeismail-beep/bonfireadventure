import http from 'node:http';
import { config } from './src/config.js';
import { handleRequest } from './src/handler.js';

const server = http.createServer(handleRequest);

server.listen(config.port, config.host, () => {
  console.log('Bonfire Adventures prototype');
  console.log(`  http://${config.host}:${config.port}`);
  console.log(`  store: local`);
});

server.on('error', (error) => {
  console.error('server error:', error);
  process.exit(1);
});