import { logger } from '@hicommonwealth/core';
import type { Express } from 'express-serve-static-core';
import http from 'http';
import { PORT } from '../config';

const log = logger().getLogger(__filename);

const setupServer = (app: Express) => {
  app.set('port', PORT);
  const server = http.createServer(app);

  const onError = (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }
    switch (error.code) {
      case 'EACCES':
        log.error('Port requires elevated privileges');
        process.exit(1);
      // eslint-disable-next-line no-fallthrough
      case 'EADDRINUSE':
        log.error(`Port ${PORT} is already in use`);
        process.exit(1);
      // eslint-disable-next-line no-fallthrough
      default:
        throw error;
    }
  };

  const onListen = () => {
    const addr = server.address();
    if (typeof addr === 'string') {
      log.info(`Listening on ${addr}`);
    } else {
      log.info(`Listening on port ${addr.port}`);
    }
  };

  server.listen(PORT);
  server.on('error', onError);
  server.on('listening', onListen);
};

export default setupServer;
