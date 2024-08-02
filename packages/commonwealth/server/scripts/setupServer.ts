import { dispose, logger } from '@hicommonwealth/core';
import type { Express } from 'express';
import http from 'http';

const log = logger(import.meta);

const setupServer = (app: Express, port: number) => {
  app.set('port', port);
  const server = http.createServer(app);

  const onError = (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }
    switch (error.code) {
      case 'EACCES':
        log.error('Port requires elevated privileges');
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        dispose()('ERROR', true);
      // eslint-disable-next-line no-fallthrough
      case 'EADDRINUSE':
        log.error(`Port ${port} is already in use`);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        dispose()('ERROR', true);
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
      // @ts-expect-error StrictNullChecks
      log.info(`Listening on port ${addr.port}`);
    }
  };

  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListen);

  return server;
};

export default setupServer;
