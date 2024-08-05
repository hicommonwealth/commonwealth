import { logger } from '@hicommonwealth/core';
import dgram from 'dgram';

const log = logger(import.meta);
const server = dgram.createSocket('udp4');

server.on('message', (msg, rinfo) => {
  log.info(
    `StatsD Metric Received: ${msg} from ${rinfo.address}:${rinfo.port}`,
  );
});

server.on('error', (err) => {
  log.error(`StatsD server error:\n${err.stack}`);
  server.close();
});

server.on('listening', () => {
  const address = server.address();
  log.info(`StatsD server listening ${address.address}:${address.port}`);
});

server.bind(8125);
